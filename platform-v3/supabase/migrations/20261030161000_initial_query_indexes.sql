create index if not exists turns_episode_id_idx on public.turns(episode_id);
create index if not exists turns_resident_id_idx on public.turns(resident_id);
create index if not exists resident_memories_resident_id_idx on public.resident_memories(resident_id);
create index if not exists resident_memories_source_turn_id_idx on public.resident_memories(source_turn_id);
create index if not exists votes_resident_id_idx on public.votes(resident_id);
create index if not exists votes_election_id_idx on public.votes(election_id);
create index if not exists episodes_started_at_idx on public.episodes(started_at desc);
create index if not exists turns_created_at_idx on public.turns(created_at desc);