-- 1. Insert Leagues
INSERT INTO leagues (id, name, country, confederation, tier) VALUES
('11111111-1111-1111-1111-111111111111', 'Premier League', 'England', 'UEFA', 1),
('22222222-2222-2222-2222-222222222222', 'La Liga', 'Spain', 'UEFA', 1),
('33333333-3333-3333-3333-333333333333', 'Serie A', 'Italy', 'UEFA', 1),
('44444444-4444-4444-4444-444444444444', 'Championship', 'England', 'UEFA', 2),
('55555555-5555-5555-5555-555555555555', 'League One', 'England', 'UEFA', 3),
('66666666-6666-6666-6666-666666666666', 'League Two', 'England', 'UEFA', 4),
('77777777-7777-7777-7777-777777777777', 'Brasileirão Série A', 'Brazil', 'CONMEBOL', 2),
('88888888-8888-8888-8888-888888888888', 'J1 League', 'Japan', 'AFC', 3);

-- 2. Insert Teams
INSERT INTO teams (id, league_id, name, elo_rating, reputation) VALUES
-- Premier League (Tier 1)
(gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'Manchester City', 96, 95),
(gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'Arsenal', 92, 90),
(gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'Liverpool', 93, 92),
(gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'Aston Villa', 85, 80),

-- La Liga (Tier 1)
(gen_random_uuid(), '22222222-2222-2222-2222-222222222222', 'Real Madrid', 97, 99),
(gen_random_uuid(), '22222222-2222-2222-2222-222222222222', 'Barcelona', 94, 96),
(gen_random_uuid(), '22222222-2222-2222-2222-222222222222', 'Atletico Madrid', 89, 88),

-- Serie A (Tier 1)
(gen_random_uuid(), '33333333-3333-3333-3333-333333333333', 'Inter Milan', 91, 90),
(gen_random_uuid(), '33333333-3333-3333-3333-333333333333', 'AC Milan', 88, 92),
(gen_random_uuid(), '33333333-3333-3333-3333-333333333333', 'Juventus', 87, 93),

-- Championship (Tier 2)
(gen_random_uuid(), '44444444-4444-4444-4444-444444444444', 'Leicester City', 78, 75),
(gen_random_uuid(), '44444444-4444-4444-4444-444444444444', 'Leeds United', 77, 76),
(gen_random_uuid(), '44444444-4444-4444-4444-444444444444', 'Southampton', 76, 72),

-- League One (Tier 3)
(gen_random_uuid(), '55555555-5555-5555-5555-555555555555', 'Portsmouth', 68, 65),
(gen_random_uuid(), '55555555-5555-5555-5555-555555555555', 'Derby County', 67, 70),

-- League Two (Tier 4)
(gen_random_uuid(), '66666666-6666-6666-6666-666666666666', 'Stockport County', 60, 55),
(gen_random_uuid(), '66666666-6666-6666-6666-666666666666', 'Wrexham', 61, 75),
(gen_random_uuid(), '66666666-6666-6666-6666-666666666666', 'Mansfield Town', 58, 50),

-- Brasileirão (Tier 2/CONMEBOL)
(gen_random_uuid(), '77777777-7777-7777-7777-777777777777', 'Palmeiras', 82, 85),
(gen_random_uuid(), '77777777-7777-7777-7777-777777777777', 'Flamengo', 81, 88),

-- J1 League (Tier 3/AFC)
(gen_random_uuid(), '88888888-8888-8888-8888-888888888888', 'Vissel Kobe', 72, 70),
(gen_random_uuid(), '88888888-8888-8888-8888-888888888888', 'Yokohama F. Marinos', 70, 68);
