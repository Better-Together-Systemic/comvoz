-- ============================================================
-- COM VOZ — Better Together
-- Supabase Schema
-- Cole este SQL no Supabase SQL Editor e execute
-- ============================================================

-- 1. EXTENSÕES
create extension if not exists "uuid-ossp";

-- 2. TABELA DE PERFIS (vinculada ao auth.users do Supabase)
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  nome text not null,
  email text not null,
  role text not null default 'terapeuta' check (role in ('admin', 'terapeuta')),
  ativo boolean not null default true,
  created_at timestamptz not null default now()
);

-- 3. TABELA DE PACIENTES
create table public.pacientes (
  id uuid primary key default uuid_generate_v4(),
  terapeuta_id uuid references public.profiles(id) on delete cascade not null,
  nome text not null,
  nome_mae text,
  data_nascimento date,
  observacoes_gerais text,
  ativo boolean not null default true,
  created_at timestamptz not null default now()
);

-- 4. TABELA DE SESSÕES
create table public.sessoes (
  id uuid primary key default uuid_generate_v4(),
  terapeuta_id uuid references public.profiles(id) on delete cascade not null,
  paciente_id uuid references public.pacientes(id) on delete cascade not null,
  data_sessao date not null,
  semana text,                          -- S1..S12
  palavra_encontro text,

  -- Relato da mãe
  mae_antes text,
  mae_depois text,
  mae_avaliacao text,
  mae_av_obs text,
  mae_orientacao text,

  -- 1. Chegada
  humor_inicio text,
  chegada text,
  st_vinculo smallint default 0,

  -- 2. Conversa
  conv_checks jsonb default '[]',
  conversa text,

  -- 3. Atividade
  frase text,
  com_func jsonb default '[]',
  ativ_checks jsonb default '[]',
  palavras_novas text,
  expressao text,
  corpo text,
  material text,
  obs_checks jsonb default '[]',
  st_envolvimento smallint default 0,

  -- Casa
  casa_anterior text,
  casa_checks jsonb default '[]',
  casa_obs text,

  -- 4. Encerramento
  humor_fim text,
  oq_fez text,
  validacao text,
  resposta_rec text,
  st_autoestima smallint default 0,

  -- Para a mãe
  para_mae text,
  para_mae_ativ text,

  -- Reflexão
  aprendeu text,
  obs text,
  prox text,
  st_geral smallint default 0,

  -- Anotações clínicas (nunca vão para PDF)
  conf_hipoteses text,
  conf_indicadores text,
  conf_alertas text,
  conf_encam text,

  -- Foto (URL no Supabase Storage)
  foto_url text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 5. TRIGGER updated_at automático
create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger sessoes_updated_at
  before update on public.sessoes
  for each row execute function public.handle_updated_at();

-- 6. TRIGGER: criar perfil automaticamente ao criar usuário no Auth
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, nome, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nome', split_part(new.email, '@', 1)),
    new.email,
    coalesce(new.raw_user_meta_data->>'role', 'terapeuta')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 7. ROW LEVEL SECURITY (RLS)
alter table public.profiles enable row level security;
alter table public.pacientes enable row level security;
alter table public.sessoes enable row level security;

-- PROFILES: admin vê todos, terapeuta vê só o próprio
create policy "profiles_select" on public.profiles for select
  using (
    auth.uid() = id
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

create policy "profiles_update_own" on public.profiles for update
  using (auth.uid() = id);

-- PACIENTES: admin vê todos, terapeuta vê só os seus
create policy "pacientes_select" on public.pacientes for select
  using (
    terapeuta_id = auth.uid()
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

create policy "pacientes_insert" on public.pacientes for insert
  with check (terapeuta_id = auth.uid());

create policy "pacientes_update" on public.pacientes for update
  using (
    terapeuta_id = auth.uid()
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

create policy "pacientes_delete" on public.pacientes for delete
  using (
    terapeuta_id = auth.uid()
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- SESSÕES: admin vê todas, terapeuta vê só as suas
create policy "sessoes_select" on public.sessoes for select
  using (
    terapeuta_id = auth.uid()
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

create policy "sessoes_insert" on public.sessoes for insert
  with check (terapeuta_id = auth.uid());

create policy "sessoes_update" on public.sessoes for update
  using (
    terapeuta_id = auth.uid()
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

create policy "sessoes_delete" on public.sessoes for delete
  using (
    terapeuta_id = auth.uid()
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- 8. STORAGE: bucket para fotos das sessões
insert into storage.buckets (id, name, public)
values ('fotos-sessoes', 'fotos-sessoes', false)
on conflict do nothing;

create policy "fotos_upload" on storage.objects for insert
  with check (bucket_id = 'fotos-sessoes' and auth.role() = 'authenticated');

create policy "fotos_select" on storage.objects for select
  using (bucket_id = 'fotos-sessoes' and auth.role() = 'authenticated');

create policy "fotos_delete" on storage.objects for delete
  using (bucket_id = 'fotos-sessoes' and auth.uid()::text = (storage.foldername(name))[1]);

-- 9. VIEW ADMIN: sessões com nome da paciente e da terapeuta
create or replace view public.admin_sessoes as
  select
    s.*,
    pac.nome as paciente_nome,
    pac.nome_mae,
    prof.nome as terapeuta_nome,
    prof.email as terapeuta_email
  from public.sessoes s
  join public.pacientes pac on pac.id = s.paciente_id
  join public.profiles prof on prof.id = s.terapeuta_id;

-- ============================================================
-- PRONTO. Depois de rodar:
-- 1. Crie seu usuário admin pelo Supabase Auth > Users > Invite
-- 2. Atualize o role para 'admin' na tabela profiles:
--    update profiles set role = 'admin' where email = 'seu@email.com';
-- ============================================================
