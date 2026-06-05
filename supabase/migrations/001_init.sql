-- ============================================================
-- Budget App — Schéma SQL complet
-- À exécuter dans Supabase > SQL Editor
-- ============================================================

-- Extensions
create extension if not exists "uuid-ossp";

-- ============================================================
-- PROFILES (pro EURL / perso)
-- ============================================================
create table profiles (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid references auth.users(id) on delete cascade not null,
  type        text not null check (type in ('pro', 'perso')),
  name        text not null,
  created_at  timestamptz default now()
);

-- ============================================================
-- ACCOUNTS (comptes bancaires)
-- ============================================================
create table accounts (
  id          uuid primary key default uuid_generate_v4(),
  profile_id  uuid references profiles(id) on delete cascade not null,
  name        text not null,
  type        text not null check (type in ('checking', 'savings', 'professional')),
  balance     numeric(12,2) default 0,
  currency    text default 'EUR',
  created_at  timestamptz default now()
);

-- ============================================================
-- CATEGORIES (tags dépenses/revenus)
-- ============================================================
create table categories (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid references auth.users(id) on delete cascade not null,
  name        text not null,
  scope       text not null check (scope in ('pro', 'perso', 'both')),
  type        text not null check (type in ('income', 'expense')),
  color       text default '#6366f1',
  icon        text,
  created_at  timestamptz default now()
);

-- ============================================================
-- FISCAL_YEARS (exercices comptables EURL)
-- ============================================================
create table fiscal_years (
  id               uuid primary key default uuid_generate_v4(),
  user_id          uuid references auth.users(id) on delete cascade not null,
  year             int not null,
  start_date       date not null,
  end_date         date not null,
  revenue_target   numeric(12,2) default 0,   -- CA cible
  expense_budget   numeric(12,2) default 0,   -- Budget charges
  salary_budget    numeric(12,2) default 0,   -- Budget salaires bruts
  is_current       boolean default false,
  created_at       timestamptz default now(),
  unique(user_id, year)
);

-- ============================================================
-- SALARY_PAYMENTS (virements salaire EURL → perso)
-- ============================================================
create table salary_payments (
  id               uuid primary key default uuid_generate_v4(),
  fiscal_year_id   uuid references fiscal_years(id) on delete cascade not null,
  date             date not null,
  gross_amount     numeric(12,2) not null,     -- Brut
  net_amount       numeric(12,2) not null,     -- Net versé
  employer_charges numeric(12,2) default 0,   -- Charges patronales
  employee_charges numeric(12,2) default 0,   -- Charges salariales
  status           text default 'planned' check (status in ('planned', 'paid')),
  notes            text,
  created_at       timestamptz default now()
);

-- ============================================================
-- TRANSACTIONS (toutes les opérations)
-- ============================================================
create table transactions (
  id                uuid primary key default uuid_generate_v4(),
  profile_id        uuid references profiles(id) on delete cascade not null,
  account_id        uuid references accounts(id) on delete set null,
  category_id       uuid references categories(id) on delete set null,
  fiscal_year_id    uuid references fiscal_years(id) on delete set null,
  salary_payment_id uuid references salary_payments(id) on delete set null,
  amount            numeric(12,2) not null,
  direction         text not null check (direction in ('in', 'out')),
  date              date not null,
  label             text not null,
  type              text not null check (type in (
                      'invoice',      -- Facture client (pro)
                      'salary',       -- Versement salaire
                      'expense',      -- Dépense courante
                      'transfer',     -- Virement entre comptes
                      'tax',          -- Charges/impôts
                      'other'
                    )),
  is_recurring      boolean default false,
  recurrence        text check (recurrence in ('monthly', 'quarterly', 'yearly')),
  notes             text,
  created_at        timestamptz default now()
);

-- ============================================================
-- ASSETS (patrimoine)
-- ============================================================
create table assets (
  id               uuid primary key default uuid_generate_v4(),
  profile_id       uuid references profiles(id) on delete cascade not null,
  name             text not null,
  category         text not null check (category in (
                     'immo',         -- Immobilier
                     'stocks',       -- Actions/ETF
                     'savings',      -- Livrets
                     'crypto',       -- Crypto
                     'other'
                   )),
  value            numeric(14,2) not null,
  valuation_date   date not null default current_date,
  notes            text,
  created_at       timestamptz default now()
);

-- ============================================================
-- ROW LEVEL SECURITY (chaque user ne voit que ses données)
-- ============================================================
alter table profiles         enable row level security;
alter table accounts         enable row level security;
alter table categories       enable row level security;
alter table fiscal_years     enable row level security;
alter table salary_payments  enable row level security;
alter table transactions     enable row level security;
alter table assets           enable row level security;

-- Policies profiles
create policy "profiles: own data" on profiles
  for all using (auth.uid() = user_id);

-- Policies accounts (via profile)
create policy "accounts: own data" on accounts
  for all using (
    profile_id in (select id from profiles where user_id = auth.uid())
  );

-- Policies categories
create policy "categories: own data" on categories
  for all using (auth.uid() = user_id);

-- Policies fiscal_years
create policy "fiscal_years: own data" on fiscal_years
  for all using (auth.uid() = user_id);

-- Policies salary_payments (via fiscal_year)
create policy "salary_payments: own data" on salary_payments
  for all using (
    fiscal_year_id in (select id from fiscal_years where user_id = auth.uid())
  );

-- Policies transactions (via profile)
create policy "transactions: own data" on transactions
  for all using (
    profile_id in (select id from profiles where user_id = auth.uid())
  );

-- Policies assets (via profile)
create policy "assets: own data" on assets
  for all using (
    profile_id in (select id from profiles where user_id = auth.uid())
  );

-- ============================================================
-- DONNÉES PAR DÉFAUT — catégories standard
-- (décommenter et exécuter après avoir créé ton compte)
-- ============================================================

-- insert into categories (user_id, name, scope, type, color) values
--   (auth.uid(), 'Honoraires clients',   'pro',   'income',  '#10b981'),
--   (auth.uid(), 'Charges sociales',     'pro',   'expense', '#ef4444'),
--   (auth.uid(), 'Frais de matériel',    'pro',   'expense', '#f59e0b'),
--   (auth.uid(), 'Loyer bureau',         'pro',   'expense', '#8b5cf6'),
--   (auth.uid(), 'Abonnements SaaS',     'pro',   'expense', '#06b6d4'),
--   (auth.uid(), 'Salaire net reçu',     'perso', 'income',  '#10b981'),
--   (auth.uid(), 'Loyer',                'perso', 'expense', '#ef4444'),
--   (auth.uid(), 'Courses alimentaires', 'perso', 'expense', '#f59e0b'),
--   (auth.uid(), 'Transports',           'perso', 'expense', '#6366f1'),
--   (auth.uid(), 'Loisirs',              'perso', 'expense', '#ec4899'),
--   (auth.uid(), 'Épargne',              'perso', 'expense', '#14b8a6');
