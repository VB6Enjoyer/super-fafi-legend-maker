# Technical Specification: Text-Based Football Career Simulator Prototype (Super FAFI LegendMaker)

## 1. Executive Summary & Tech Stack
The goal of this project is to build a lightweight, performant, text-based football career simulation web application.
The core loop consists of creating a custom player, progressing year-by-year through career choices, simulating seasonal stats using Elo-weighted mathematical models, receiving realistic transfer offers, and viewing a final career summary.

### Stack
* **Frontend:** React 18+ with TypeScript, Vite, Tailwind CSS, Lucide React (Icons).
* **Backend & Storage:** Supabase (PostgreSQL) for storing pre-populated leagues and teams data.
* **State Management:** React Context / Zustand for handling active career runtime state locally (to ensure instant response times without network latency during season progression).

## 2. Database Schema (Supabase / PostgreSQL)
Create the following tables in Supabase. These tables serve as the static global reference data for clubs and leagues worldwide.

```sql
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
```

## 3. Mathematical & Simulation Engine

### 3.1 Initial Setup
* **Initial Player Rating:** When created, a player's initial `overallRating` is randomized. The max cap is 60, and the average is around 50 (e.g., normal distribution clamped to `[40, 60]`).

### 3.2 Player Progression & Regression Model
Player rating changes year-over-year based on age, form, and RNG:
* **Age 16–21 (Growth):** Rapid growth phase. Steady increases depending on form/playing time.
* **Age 22–28 (Volatile Phase):** Rating changes are highly volatile. Can see massive jumps or slight regressions depending on performance and RNG events.
* **Age 29–32 (Late Peak / Plateau Phase):** Ratings can plateau, or through RNG, experience unusual rating increases (representing late bloomers who peak past 28).
* **Age 33+ (Decline Phase):** Ratings begin to reduce. The degree of reduction is inversely proportional to the player's peak overall rating (e.g., a player peaking at 90 loses fewer rating points per year than a player peaking at 75), ensuring legends don't regress to amateur levels before retiring.

### 3.3 Player Valuation & Budget Gate
Market Value (V) is determined by player Rating (R) and Age (A):
`V = BaseValue(R) * AgeMultiplier(A)`

* **Base Value:**
  `BaseValue(R) = 10^((R - 40) / 15.5) * 100,000`
  *(This adjusted formula places an 80-rated player around €38M and a 90-rated player around €168M, preventing hyper-inflation.)*

* **Age Multiplier (A):**
  * Age 16–21: 1.3x - 1.5x (High potential premium)
  * Age 22–28: 1.0x (Prime)
  * Age 29–33: 0.6x - 0.3x (Depreciating)
  * Age 34+: 0.1x - 0.2x (Minimal transfer value)

* **Team Purchasing Power Gate (B_max):**
  A team with Elo rating `E_team` can spend a maximum of:
  `B_max = BaseValue(E_team + 5) * random(0.8, 1.2)`
  *(This ensures teams can afford players roughly around or slightly above their own level.)*

* **Transfer Floor Logic:**
  If `V > B_max`, the team cannot afford the player. Furthermore, a team will only offer a contract if the player's rating is sufficient: `R_player >= (E_team - 10)` or if the player is very young (under 21).

### 3.4 Seasonal Match & Stats Engine
Calculates expected stats based on player rating, team Elo (E_team), and average league Elo (E_league).
* **Performance Ratio (P):**
  `P = ((R_player * 0.7) + (E_team * 0.3)) / E_league`
  *(This factors in team strength, so playing for a better team boosts your output.)*

* **Expected Output:**
  `Expected Output = Math.max(0, Math.round(BasePosOutput * P^2 + RNGVariance(-3, +3)))`
  *(Bounds checking ensures no negative stats.)*

* **Base Positions Outputs:**
  * ST/CF: ~15 Goals / 4 Assists
  * Winger/CAM: ~9 Goals / 9 Assists
  * CM/CDM: ~3 Goals / 6 Assists
  * Defender (CB/LB/RB): ~1 Goal / 2 Assists
  * GK (Goalkeeper): ~15 Clean Sheets / ~35 Goals Conceded / ~100 Saves

* **Appearances & RNG:**
  The simulation does not assume 100% playtime. Appearances are randomized based on:
  * Player's Age (older players might need more rest).
  * Overall Rating (better players are undroppable).
  * Status (e.g., injuries or behavioral RNG events).
  * Stats so far in the season (form).

  Expected Output is then scaled down based on `(Appearances / Total Season Games)`.

### 3.5 Transfer Probability Matrix
When generating yearly transfer offers, evaluate candidate teams using this probability weight formula:
`Weight = W_Tier * W_Region * W_Nationality`

| Weight Factor | Condition | Multiplier |
| :--- | :--- | :--- |
| **W Tier** | `| Tier_League - Tier_Ideal | = 0` | 1.0 |
| | Step up (+1 Tier) or Step down (-1 Tier) | 0.35 |
| | Step down (-2+ Tiers) | 0.05 |
| **W Region** | Same Confederation | 1.0 |
| | Historical Cross-Region (e.g., CONMEBOL → UEFA) | 0.5 |
| | Unrelated Confederation | 0.05 |
| **W Nationality** | Team from Player's Home Nation | 3.0x |

## 4. Frontend Application Architecture & UI Specs

### 4.1 State Management (useCareerStore / Context)
```typescript
export interface PlayerState {
  name: string;
  nationality: string;
  position: 'ST' | 'LW' | 'RW' | 'CAM' | 'CM' | 'CDM' | 'CB' | 'LB' | 'RB' | 'GK';
  dominantFoot: 'Left' | 'Right';
  age: number;
  overallRating: number;
  peakRating: number;
  currentTeam: Team;
  statsHistory: SeasonStats[];
  trophies: string[];
  careerEarnings: number;
  weeklyWage: number;
  isRetired: boolean;
}

export interface SeasonStats {
  year: number;
  teamName: string;
  appearances: number;
  goals?: number;         // Outfield
  assists?: number;       // Outfield
  cleanSheets?: number;   // GK
  goalsConceded?: number; // GK
  saves?: number;         // GK
  averageRating: number;
  trophiesWon: string[];
  wageEarned: number;
}
```

### 4.2 Views & UI Layout Specification
```text
┌────────────────────────────────────────────────────────────────────────┐
│                        FOOTBALL SIMULATOR UI                           │
├────────────────────────────────────────────────────────────────────────┤
│ 1. SETUP CREATION VIEW:                                                │
│    Inputs: Name, Country, Position, Preferred Foot                     │
│    Initial Action: "Sign First Professional Contract"                  │
│                                                                        │
│ 2. MAIN CAREER DASHBOARD (Header: Age, OVR, Club, Value, Earnings)     │
│  ┌──────────────────────────────┬───────────────────────────────────┐  │
│  │ SEASON PROGRESSION           │ ANNUAL CHOICE SYSTEM              │  │
│  │ • Current Year Stats (G/A)   │ "A European scout is in town..."  │  │
│  │ • League Standings (Simple)  │ [Option A: Play Safe] (+1 Form)   │  │
│  │ • Recent Results Log         │ [Option B: Show off] (High Risk)  │  │
│  └──────────────────────────────┴───────────────────────────────────┘  │
│                                                                        │
│ 3. TRANSFER WINDOW MODAL (End of Season):                              │
│    List of generated offers with wages & squad status                  │
│    [Stay at Current Club] vs [Accept Offer from Team X]                │
│                                                                        │
│ 4. CAREER SUMMARY VIEW (Post-Retirement):                              │
│    Total Apps, Total Stats (G/A or CS/GC), Trophy Cabinet, Wealth      │
│    Career Rating Grade                                                 │
└────────────────────────────────────────────────────────────────────────┘
```

## 5. Prototype Implementation Plan for AI Agent
Instructions for the AI Coding Agent:

1. **Setup Supabase Schema:**
   * Generate migration files or script standard SQL to create leagues and teams tables.
   * Provide a seed script (`seed.json` / `seed.sql`) containing at least 20 sample teams spanning Tier 1 to Tier 4 leagues across UEFA, CONMEBOL, and AFC.
2. **Build Math Utility Functions (`/lib/engine.ts`):**
   * Implement `calculatePlayerValue(rating, age)`
   * Implement `calculateMaxBudget(elo)`
   * Implement `calculateYearlyProgression(age, currentRating, peakRating, form, rngEvents)`
   * Implement `calculateAppearances(age, overallRating, status, form)`
   * Implement `simulateSeasonStats(playerPosition, playerRating, teamElo, leagueElo, appearances, totalGames)`
   * Implement `generateTransferOffers(player, allTeams, allLeagues)`
3. **Build React Interfaces (`/components`):**
   * `PlayerCreation.tsx`
   * `CareerDashboard.tsx`
   * `ChoiceModal.tsx`
   * `TransferOffersModal.tsx`
   * `CareerSummary.tsx`
4. **Game Loop Workflow:**
   * User creates player (Initial Rating 40-60) → Given choices between 4 different teams. High probability teams shown are local tier 3/4 teams, small chance of getting a local tier 1/2 team (if available), very small chance of getting a tier 2+ foreign team.
   * "Simulate Season" triggers seasonal decision event → calculates appearances and stats → updates stats, trophies, and earnings.
   * Triggers Transfer Window if age < 38.
   * If age >= 34, prompt optional retirement, forcing retirement at age 40 (goalkeepers can play until 44).
