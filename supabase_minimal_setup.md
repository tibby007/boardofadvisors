# Supabase Minimal Setup (≈30 min)

This guide gets **The Board Room** logging live fast—just the essentials:

---

## 1  ·  Create Project
1. Sign in → **New Project**  
2. Keep default **_public_** schema  
3. Copy **Project URL** & **Anon Key** (we’ll need them in Factory)

---

## 2  ·  Run Minimal SQL

Open **SQL Editor → New query** and run:

```sql
-- Enable UUIDs
create extension if not exists "uuid-ossp";

-- USERS (optional, if you’ll track auth)
create table if not exists users (
  id uuid primary key default uuid_generate_v4(),
  email text unique,
  name text,
  created_at timestamptz default now()
);

-- QUESTIONS
create table if not exists questions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete set null,
  question_text text not null,
  created_at timestamptz default now()
);

-- ADVISOR SELECTIONS
create table if not exists advisor_selections (
  id uuid primary key default uuid_generate_v4(),
  question_id uuid references questions(id) on delete cascade,
  advisor_name text not null,
  selected_at timestamptz default now()
);

-- ADVISOR RESPONSES
create table if not exists advisor_responses (
  id uuid primary key default uuid_generate_v4(),
  question_id uuid references questions(id) on delete cascade,
  advisor_name text not null,
  response_text text,
  generated_at timestamptz default now()
);

-- RECOMMENDATIONS (Chief of Staff)
create table if not exists recommendations (
  id uuid primary key default uuid_generate_v4(),
  question_id uuid references questions(id) on delete cascade unique,
  summary text,
  final_recommendation text,
  confidence_score int,
  created_at timestamptz default now()
);
```

⏱️ Run ‑ takes <15 s.

---

## 3  ·  Row Level Security (Optional for MVP)

```sql
alter table questions enable row level security;
alter table advisor_selections enable row level security;
alter table advisor_responses enable row level security;
alter table recommendations enable row level security;

-- Public “insert-only” policy for quick start
create policy anon_insert on questions
for insert with check (true);
-- Repeat for the other three tables if desired
```

You can tighten later.

---

## 4  ·  Factory → Supabase Inserts

Add workspace secrets:
```
SUPABASE_URL   = https://<project>.supabase.co
SUPABASE_KEY   = <anon key>
```

### Helper (JS code block)

```js
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

export async function logBoardRoom({ question, userId, selections, responses, synthesis }) {
  // 1. insert question
  const { data: q, error: qErr } = await supabase
    .from('questions')
    .insert({ user_id: userId, question_text: question })
    .select()
    .single();
  if (qErr) throw qErr;

  // 2. selections
  await supabase.from('advisor_selections').insert(
    selections.map(name => ({ question_id: q.id, advisor_name: name }))
  );

  // 3. responses
  await supabase.from('advisor_responses').insert(
    responses.map(r => ({
      question_id: q.id,
      advisor_name: r.name,
      response_text: r.response
    }))
  );

  // 4. chief-of-staff synthesis
  await supabase.from('recommendations').insert({
    question_id: q.id,
    summary: synthesis.summary,
    final_recommendation: synthesis.recommendation,
    confidence_score: synthesis.confidenceScore
  });
}
```

Call `logBoardRoom()` at the end of your Factory JS flow.

---

## 5  ·  cURL Test (optional)

```bash
curl -X POST \
  -H "apikey: $SUPABASE_KEY" \
  -H "Authorization: Bearer $SUPABASE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"question_text":"Pilot or full launch?"}' \
  $SUPABASE_URL/rest/v1/questions
```

Should return a JSON row.

---

## 6  ·  Done ✅

You now have:
- **4 tables** capturing the whole Board Room cycle  
- Simple insert helper to wire into Factory  
- RLS ready to harden later  

Total time ≈30 minutes—from zero to logging. Enjoy! 🚀
