-- Schéma Casper Bot — à exécuter dans l'éditeur SQL Supabase.

create table if not exists settings (
  id text primary key default 'default',
  risk jsonb not null default '{
    "riskPerTradePct": 1,
    "dailyLossLimitPct": 3,
    "maxConcurrentPositions": 2,
    "minStars": 4,
    "newsBufferMinutes": 5,
    "mode": "manual"
  }'::jsonb,
  mt5_login text,
  mt5_password text,
  mt5_server text,
  updated_at timestamptz default now()
);

create table if not exists positions (
  id uuid primary key default gen_random_uuid(),
  symbol text not null,
  direction text not null check (direction in ('bullish', 'bearish')),
  entry numeric not null,
  stop_loss numeric not null,
  take_profit numeric not null,
  stars int not null,
  mode text not null check (mode in ('manual', 'auto')),
  status text not null default 'pending_approval'
    check (status in ('pending_approval', 'approved', 'dispatched', 'open', 'rejected', 'closed', 'failed')),
  strategy_mode text,
  narrative text,
  is_simulation boolean not null default false,
  result_pct numeric,
  mt5_ticket text,
  mt5_symbol text,
  error_message text,
  created_at timestamptz default now(),
  closed_at timestamptz
);

create index if not exists idx_positions_status on positions(status);
create index if not exists idx_positions_created on positions(created_at desc);

alter table settings enable row level security;
alter table positions enable row level security;
-- Aucune policy pour "anon" -> accès refusé depuis le navigateur par défaut.
-- Seule la clé service_role (utilisée dans app/api/* et par le pont MT5) a accès.

insert into settings (id) values ('default')
on conflict (id) do nothing;
