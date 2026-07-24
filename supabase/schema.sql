-- 1. LEAGUES TABLE
CREATE TABLE leagues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR NOT NULL,
  country VARCHAR NOT NULL,
  confederation VARCHAR NOT NULL, -- 'UEFA', 'CONMEBOL', 'CONCACAF', 'AFC', 'CAF', 'OFC'
  tier INT NOT NULL CHECK (tier BETWEEN 1 AND 5),
  logo_url TEXT
);

-- 2. TEAMS TABLE
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  league_id UUID REFERENCES leagues(id) ON DELETE CASCADE,
  name VARCHAR NOT NULL,
  elo_rating INT NOT NULL CHECK (elo_rating BETWEEN 30 AND 99),
  reputation INT NOT NULL CHECK (reputation BETWEEN 1 AND 100),
  logo_url TEXT
);

-- INDEXES FOR FAST QUERYING
CREATE INDEX idx_teams_league ON teams(league_id);
CREATE INDEX idx_teams_elo ON teams(elo_rating);
CREATE INDEX idx_leagues_tier_confed ON leagues(tier, confederation);
