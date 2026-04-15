# Com Voz — Better Together
**Deploy: Supabase + Vercel**

---

## PASSO 1 — Supabase

### 1.1 Criar projeto
1. Acesse https://supabase.com e crie uma conta
2. Clique em "New project"
3. Escolha um nome (ex: `comvoz`) e uma senha forte para o banco
4. Região: South America (São Paulo) — mais rápido para o Brasil

### 1.2 Rodar o schema
1. No painel do Supabase, vá em **SQL Editor**
2. Clique em "New query"
3. Cole todo o conteúdo do arquivo `sql/schema.sql`
4. Clique em **Run**

### 1.3 Pegar as chaves
1. Vá em **Settings → API**
2. Copie:
   - **Project URL** (ex: https://abcdef.supabase.co)
   - **anon public** key

### 1.4 Criar seu usuário admin
1. Vá em **Authentication → Users → Invite user**
2. Digite seu e-mail
3. Você receberá um e-mail — defina sua senha
4. Volte no **SQL Editor** e rode:
```sql
update profiles set role = 'admin' where email = 'seu@email.com';
```

### 1.5 Criar usuários para outras terapeutas
1. **Authentication → Users → Invite user**
2. Digite o e-mail da terapeuta
3. Ela receberá o convite por e-mail
4. O role padrão já é 'terapeuta' — não precisa alterar

---

## PASSO 2 — Código local

### 2.1 Instalar dependências
```bash
npm install
```

### 2.2 Configurar variáveis
```bash
cp .env.example .env.local
```
Edite o `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://SEU_PROJETO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_anon_key_aqui
```

### 2.3 Testar localmente
```bash
npm run dev
```
Abra http://localhost:3000

---

## PASSO 3 — Vercel

### 3.1 Subir para o GitHub
```bash
git init
git add .
git commit -m "Com Voz — initial deploy"
git remote add origin https://github.com/SEU_USUARIO/comvoz.git
git push -u origin main
```

### 3.2 Deploy na Vercel
1. Acesse https://vercel.com e faça login com GitHub
2. Clique em "New Project"
3. Selecione o repositório `comvoz`
4. Em **Environment Variables**, adicione:
   - `NEXT_PUBLIC_SUPABASE_URL` = sua URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = sua chave
5. Clique em **Deploy**

### 3.3 Domínio personalizado (opcional)
1. No painel da Vercel, vá em **Settings → Domains**
2. Adicione seu domínio (ex: comvoz.bettertogether.com.br)
3. Configure o DNS conforme instruído

---

## ESTRUTURA DO BANCO

```
profiles          → usuárias do sistema (terapeutas + admin)
pacientes         → pacientes de cada terapeuta
sessoes           → registros semanais de cada encontro
storage/fotos-sessoes → fotos das sessões
```

## REGRAS DE ACESSO (RLS)

| Quem       | Pacientes | Sessões     |
|------------|-----------|-------------|
| Admin      | Vê todas  | Vê todas    |
| Terapeuta  | Só as suas| Só as suas  |

---

## PROBLEMAS COMUNS

**"relation profiles does not exist"**
→ O schema SQL não foi executado. Rode novamente o sql/schema.sql.

**Foto não aparece**
→ Verifique se o bucket `fotos-sessoes` foi criado no Storage do Supabase.

**Usuário não consegue logar**
→ Verifique se o e-mail foi confirmado (Authentication → Users).

**Erro 403 ao salvar**
→ As políticas RLS podem não ter sido criadas. Rode o schema completo novamente.
