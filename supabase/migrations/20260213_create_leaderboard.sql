create table if not exists leaderboard (
  id bigint generated always as identity primary key,
  name text not null check (char_length(name) between 1 and 12),
  score int not null,
  max_combo int not null default 0,
  rank_title text not null,
  created_at timestamptz not null default now()
);

alter table leaderboard enable row level security;

create policy "Public read" on leaderboard for select using (true);
create policy "Public insert" on leaderboard for insert with check (true);

create index if not exists leaderboard_score_idx on leaderboard (score desc);
