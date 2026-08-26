"""
Pont Casper Bot <-> MetaTrader 5.
Tourne sur un PC/VPS Windows en continu. Ne s'authentifie PAS avec une "clé API" :
il interroge le dashboard (Vercel) pour récupérer les identifiants MT5 actuels
(modifiables depuis le dashboard), puis les utilise pour se connecter au terminal
MT5 installé localement et passer les ordres validés.

Installation (une fois) :
    pip install -r requirements.txt

Lancement :
    python bridge.py
Pour un fonctionnement permanent, utilise le Planificateur de tâches Windows
(déclencheur "au démarrage", action = ce script) ou NSSM pour l'installer comme
service Windows.
"""

import os
import sys
import time
import requests
import MetaTrader5 as mt5
from dotenv import load_dotenv

# Charge le .env qui se trouve DANS LE MÊME DOSSIER que ce script, peu importe
# depuis quel dossier tu lances "python bridge.py".
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
ENV_PATH = os.path.join(SCRIPT_DIR, ".env")
load_dotenv(ENV_PATH, encoding="utf-8-sig")

missing = [name for name in ("API_BASE_URL", "BRIDGE_SECRET") if not os.environ.get(name)]
if missing:
    print(f"[bridge] ERREUR : variable(s) manquante(s) dans {ENV_PATH} : {', '.join(missing)}")
    print(f"[bridge] Vérifie que le fichier existe exactement à ce chemin : {ENV_PATH}")
    if os.path.exists(ENV_PATH):
        print("[bridge] Le fichier existe. Contenu actuellement lu :")
        with open(ENV_PATH, "r", encoding="utf-8", errors="replace") as f:
            print(f.read())
    else:
        print(f"[bridge] Le fichier n'existe PAS à cet emplacement. Vérifie qu'il ne s'appelle pas '.env.txt' par erreur (dir dans cmd pour voir les vrais noms).")
    sys.exit(1)

API_BASE_URL = os.environ["API_BASE_URL"].rstrip("/")
BRIDGE_SECRET = os.environ["BRIDGE_SECRET"]
POLL_SECONDS = int(os.environ.get("POLL_SECONDS", "15"))

HEADERS = {"x-bridge-secret": BRIDGE_SECRET, "Content-Type": "application/json"}

# Mapping symboles internes -> symboles réels sur ton serveur Exness.
# IMPORTANT : les noms exacts varient selon le type de compte (souvent suffixés
# d'un "m", ex. XAUUSDm). Ouvre MT5 -> Market Watch -> "Afficher tout" pour
# vérifier les noms exacts sur Exness-MT5Trial9 et corrige ci-dessous si besoin.
SYMBOL_MAP = {
    "EURUSD": "EURUSDm",
    "USOIL": "USOILm",
    "XAUUSD": "XAUUSDm",
    "BTCUSD": "BTCUSDm",
}


def connect_mt5():
    resp = requests.get(f"{API_BASE_URL}/api/bridge/credentials", headers=HEADERS, timeout=15)
    if not resp.ok:
        try:
            detail = resp.json().get("error", resp.text)
        except Exception:
            detail = resp.text
        raise RuntimeError(f"Échec récupération des identifiants ({resp.status_code}) : {detail}")
    creds = resp.json()

    if not mt5.initialize():
        raise RuntimeError(f"Échec initialisation MT5 : {mt5.last_error()}")

    authorized = mt5.login(int(creds["login"]), password=creds["password"], server=creds["server"])
    if not authorized:
        raise RuntimeError(f"Échec de connexion MT5 (login {creds['login']}, serveur {creds['server']}) : {mt5.last_error()}")

    print(f"[bridge] Connecté au compte {creds['login']} sur {creds['server']}")


def fetch_jobs():
    resp = requests.get(f"{API_BASE_URL}/api/bridge/jobs", headers=HEADERS, timeout=15)
    resp.raise_for_status()
    return resp.json().get("jobs", [])


def report(job_id, status, ticket=None, mt5_symbol=None, error=None):
    requests.post(
        f"{API_BASE_URL}/api/bridge/jobs",
        headers=HEADERS,
        json={"id": job_id, "status": status, "ticket": ticket, "mt5Symbol": mt5_symbol, "error": error},
        timeout=15,
    )


def execute_job(job):
    internal_symbol = job["symbol"]
    mt5_symbol = SYMBOL_MAP.get(internal_symbol)

    if not mt5_symbol:
        report(job["id"], "failed", error=f"Aucun mapping MT5 pour {internal_symbol} — vérifie SYMBOL_MAP dans bridge.py.")
        return

    if not mt5.symbol_select(mt5_symbol, True):
        report(job["id"], "failed", error=f"Symbole {mt5_symbol} introuvable sur ce compte (vérifie le nom exact dans Market Watch).")
        return

    tick = mt5.symbol_info_tick(mt5_symbol)
    if tick is None:
        report(job["id"], "failed", error=f"Pas de cotation disponible pour {mt5_symbol}.")
        return

    order_type = mt5.ORDER_TYPE_BUY if job["direction"] == "bullish" else mt5.ORDER_TYPE_SELL
    price = tick.ask if job["direction"] == "bullish" else tick.bid

    # Taille de position minimale par défaut (0.01 lot) — à ajuster une fois la
    # gestion du risque branchée sur le solde réel du compte si tu veux du
    # sizing dynamique.
    request = {
        "action": mt5.TRADE_ACTION_DEAL,
        "symbol": mt5_symbol,
        "volume": 0.01,
        "type": order_type,
        "price": price,
        "sl": float(job["stop_loss"]),
        "tp": float(job["take_profit"]),
        "deviation": 20,
        "magic": 20260821,
        "comment": f"casper-bot {job.get('strategy_mode', '')}",
        "type_time": mt5.ORDER_TIME_GTC,
        "type_filling": mt5.ORDER_FILLING_IOC,
    }

    result = mt5.order_send(request)

    if result is None or result.retcode != mt5.TRADE_RETCODE_DONE:
        error_msg = f"retcode={getattr(result, 'retcode', 'N/A')} comment={getattr(result, 'comment', mt5.last_error())}"
        report(job["id"], "failed", error=error_msg)
        print(f"[bridge] Échec ordre {job['id']} : {error_msg}")
        return

    report(job["id"], "open", ticket=str(result.order), mt5_symbol=mt5_symbol)
    print(f"[bridge] Ordre placé : {mt5_symbol} {job['direction']} ticket #{result.order}")


def main():
    print("[bridge] Démarrage du pont Casper Bot <-> MT5")
    connect_mt5()

    while True:
        try:
            jobs = fetch_jobs()
            for job in jobs:
                execute_job(job)
        except Exception as exc:
            print(f"[bridge] Erreur de cycle : {exc}")
            # Tentative de reconnexion en cas de coupure de session MT5.
            try:
                connect_mt5()
            except Exception as reconnect_exc:
                print(f"[bridge] Reconnexion échouée : {reconnect_exc}")

        time.sleep(POLL_SECONDS)


if __name__ == "__main__":
    main()
