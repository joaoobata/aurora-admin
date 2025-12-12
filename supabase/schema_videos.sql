-- VIDEOS (Armazena os vídeos postados pelas contas)
create table videos (
  id uuid default uuid_generate_v4() primary key,
  account_id uuid references accounts(id) on delete cascade not null,
  external_id text, -- ID único na plataforma (ex: ID do vídeo no TikTok)
  url text,
  thumbnail_url text,
  description text,
  published_at timestamp with time zone, -- Data de postagem original
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- VIDEO METRICS (Histórico de performance de cada vídeo)
create table video_metrics (
  id uuid default uuid_generate_v4() primary key,
  video_id uuid references videos(id) on delete cascade not null,
  views int default 0,
  likes int default 0,
  comments int default 0,
  shares int default 0,
  recorded_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Index para buscar vídeos por conta rapidamente
create index idx_videos_account_id on videos(account_id);
-- Index para buscar histórico de métricas de um vídeo
create index idx_video_metrics_video_id on video_metrics(video_id);

-- RLS Policies para Videos e Video Metrics
alter table videos enable row level security;
alter table video_metrics enable row level security;

-- Policies para Videos (Admin vê tudo, Dono vê seus)
create policy "Users can view own videos OR admin view all" on videos for select using (
  exists ( select 1 from accounts where accounts.id = videos.account_id and accounts.user_id = auth.uid() )
  or public.is_admin()
);
create policy "Users can manage own videos OR admin manage all" on videos for all using (
  exists ( select 1 from accounts where accounts.id = videos.account_id and accounts.user_id = auth.uid() )
  or public.is_admin()
);

-- Policies para Video Metrics
create policy "Users can view own video metrics OR admin view all" on video_metrics for select using (
  exists ( 
    select 1 from videos 
    join accounts on accounts.id = videos.account_id 
    where videos.id = video_metrics.video_id and accounts.user_id = auth.uid() 
  )
  or public.is_admin()
);
create policy "Users can manage own video metrics OR admin manage all" on video_metrics for all using (
  exists ( 
    select 1 from videos 
    join accounts on accounts.id = videos.account_id 
    where videos.id = video_metrics.video_id and accounts.user_id = auth.uid() 
  )
  or public.is_admin()
);
