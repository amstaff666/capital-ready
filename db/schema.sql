-- Apply this same schema independently to EACH country's own Neon database.
-- Country isolation is deployment-level: EE/FI/PL/... do not share a production DB.

create table if not exists cases (
  id uuid primary key default gen_random_uuid(),
  reference text unique not null,
  market char(2) not null,
  application_type text not null check (application_type in ('personal','company')),
  status text not null default 'received',
  stage text not null default 'intake',
  source text not null default 'capital-ready-web',
  rules_version text,
  raw_submission jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table cases add column if not exists rules_version text;

create table if not exists documents (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references cases(id) on delete cascade,
  document_type text not null,
  original_filename text not null,
  mime_type text,
  size_bytes bigint,
  sha256 text,
  storage_provider text,
  storage_key text,
  upload_status text not null default 'awaiting_upload',
  extraction_status text not null default 'queued',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists facts (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references cases(id) on delete cascade,
  scope text not null,
  field_key text not null,
  period text,
  value_number numeric,
  value_text text,
  unit text,
  fact_status char(1) not null check (fact_status in ('F','A','E')),
  source_document_id uuid references documents(id) on delete set null,
  confidence numeric check (confidence is null or (confidence >= 0 and confidence <= 1)),
  created_at timestamptz not null default now()
);

create table if not exists document_extractions (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references cases(id) on delete cascade,
  document_id uuid not null references documents(id) on delete cascade,
  extractor text not null,
  status text not null default 'queued',
  extracted_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists bank_accounts (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references cases(id) on delete cascade,
  bank_name text,
  iban_masked text,
  currency text,
  source_document_id uuid references documents(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists bank_transactions (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references cases(id) on delete cascade,
  bank_account_id uuid references bank_accounts(id) on delete cascade,
  booking_date date,
  amount numeric not null,
  currency text,
  counterparty text,
  description text,
  category text,
  risk_flags jsonb not null default '[]'::jsonb,
  source_document_id uuid references documents(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists risks (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references cases(id) on delete cascade,
  code text not null,
  severity text not null,
  status text not null default 'open',
  evidence jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists action_items (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references cases(id) on delete cascade,
  code text not null,
  title text not null,
  priority text not null default 'P2',
  status text not null default 'open',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists facts_case_id_idx on facts(case_id);
create index if not exists documents_case_id_idx on documents(case_id);
create index if not exists extraction_case_id_idx on document_extractions(case_id);
create index if not exists bank_accounts_case_id_idx on bank_accounts(case_id);
create index if not exists bank_transactions_case_id_idx on bank_transactions(case_id);
create index if not exists risks_case_id_idx on risks(case_id);
create index if not exists actions_case_id_idx on action_items(case_id);
