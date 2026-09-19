-- Apply this same schema to EACH country's own Neon database.
-- Never put multiple countries into one production database when isolation is required.

create table if not exists cases (
  id uuid primary key default gen_random_uuid(),
  reference text unique not null,
  market char(2) not null,
  application_type text not null check (application_type in ('personal','company')),
  status text not null default 'received',
  stage text not null default 'intake',
  source text not null default 'capital-ready-web',
  raw_submission jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
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
  source_document_id uuid,
  confidence numeric check (confidence is null or (confidence >= 0 and confidence <= 1)),
  created_at timestamptz not null default now()
);

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
create index if not exists risks_case_id_idx on risks(case_id);
create index if not exists actions_case_id_idx on action_items(case_id);
