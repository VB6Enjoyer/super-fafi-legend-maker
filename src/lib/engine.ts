// Math & Simulation Engine

export type Position = 'ST' | 'LW' | 'RW' | 'CAM' | 'CM' | 'CDM' | 'CB' | 'LB' | 'RB' | 'GK';

// 1. Valuation Formula
export function calculatePlayerValue(rating: number, age: number): number {
  const baseValue = Math.pow(10, (rating - 40) / 15.5) * 100000;

  let ageMultiplier = 1.0;
  if (age >= 16 && age <= 21) ageMultiplier = 1.3 + Math.random() * 0.2; // 1.3 - 1.5
  else if (age >= 22 && age <= 28) ageMultiplier = 1.0;
  else if (age >= 29 && age <= 33) ageMultiplier = 0.6 - ((age - 29) * 0.075); // scales down to ~0.3
  else if (age >= 34) ageMultiplier = 0.2 - ((age - 34) * 0.02); // scales down to ~0.1

  return Math.round(baseValue * ageMultiplier);
}

// 2. Budget Formula
export function calculateMaxBudget(elo: number): number {
  const baseBudget = Math.pow(10, ((elo + 5) - 40) / 15.5) * 100000;
  const variance = 0.8 + Math.random() * 0.4; // 0.8 - 1.2
  return Math.round(baseBudget * variance);
}

// 3. Progression Formula
export function calculateYearlyProgression(
  age: number,
  currentRating: number,
  peakRating: number,
  formOffset: number = 0 // -1 for bad form, 0 normal, +1 good form
): number {
  let change = 0;
  const rand = Math.random();

  if (age <= 21) {
    // Growth
    change = Math.floor(Math.random() * 4) + 2; // +2 to +5
    if (formOffset > 0) change += 1;
    if (formOffset < 0) change -= 1;
  } else if (age >= 22 && age <= 28) {
    // Volatile
    const isVolatileJump = rand > 0.8;
    if (isVolatileJump) {
      change = Math.floor(Math.random() * 4) + 1; // +1 to +4
    } else {
      change = Math.floor(Math.random() * 3) - 1; // -1 to +1
    }
    change += formOffset;
  } else if (age >= 29 && age <= 32) {
    // Plateau or late bloomer
    const isLateBloomer = rand > 0.9;
    if (isLateBloomer) {
      change = Math.floor(Math.random() * 3) + 1; // +1 to +3
    } else {
      change = Math.floor(Math.random() * 2) - 1; // -1 to +0 (plateau or slight drop)
    }
    if (formOffset < 0) change -= 1;
  } else {
    // Decline based on peak
    const peakFactor = Math.max(0, (99 - peakRating) / 40); // 99 peak = 0 factor (slowest decline). 59 peak = 1 factor (faster decline)
    const baseDrop = Math.floor(Math.random() * 3) + 1; // 1 to 3
    change = -(baseDrop + Math.floor(peakFactor * 2));
  }

  // Cap ratings between 1 and 99
  const newRating = Math.max(1, Math.min(99, currentRating + change));
  return newRating - currentRating; // return the diff
}

// 4. Appearances
export function calculateAppearances(
  age: number,
  overallRating: number,
  totalGames: number = 38
): number {
  let basePlayChance = 0.9;

  // Older players play slightly less
  if (age > 32) basePlayChance -= (age - 32) * 0.05;

  // Lower rated players might get benched
  if (overallRating < 70) basePlayChance -= 0.2;
  if (overallRating < 60) basePlayChance -= 0.4;

  // Injury RNG
  const isInjured = Math.random() > 0.85; // 15% chance of major injury time
  if (isInjured) {
    basePlayChance -= (Math.random() * 0.4 + 0.1); // Lose 10-50% of season
  }

  basePlayChance = Math.max(0, Math.min(1, basePlayChance));
  return Math.round(totalGames * basePlayChance);
}

// 5. Seasonal Stats
interface ExpectedOutput {
  goals?: number;
  assists?: number;
  cleanSheets?: number;
  goalsConceded?: number;
  saves?: number;
}

export function simulateSeasonStats(
  position: Position,
  playerRating: number,
  teamElo: number,
  leagueElo: number,
  appearances: number,
  totalGames: number = 38
): ExpectedOutput {
  const P = ((playerRating * 0.7) + (teamElo * 0.3)) / leagueElo;
  const pSquared = Math.pow(P, 2);
  const appearanceRatio = appearances / totalGames;

  const getStat = (base: number) => {
    const variance = (Math.random() * 6) - 3; // -3 to +3
    const raw = (base * pSquared) + variance;
    return Math.max(0, Math.round(raw * appearanceRatio));
  };

  if (position === 'GK') {
    // GK specific stats
    return {
      cleanSheets: getStat(15),
      goalsConceded: Math.max(0, Math.round((35 / P) * appearanceRatio + ((Math.random() * 10) - 5))), // Inverse relation to P
      saves: getStat(100)
    };
  } else if (position === 'ST' || position === 'LW' || position === 'RW') {
     const isWinger = position === 'LW' || position === 'RW';
     return {
        goals: getStat(isWinger ? 9 : 15),
        assists: getStat(isWinger ? 9 : 4)
     }
  } else if (position === 'CAM' || position === 'CM' || position === 'CDM') {
     const isAttacking = position === 'CAM';
     return {
        goals: getStat(isAttacking ? 9 : 3),
        assists: getStat(isAttacking ? 9 : 6)
     }
  } else {
    // Defenders
    return {
      goals: getStat(1),
      assists: getStat(2)
    };
  }
}

import type { Team } from '../store/careerStore';

export interface TransferOffer {
    team: Team;
    wageOffer: number;
    isCurrentTeam?: boolean;
}

export function generateTransferOffers(
    playerRating: number,
    playerAge: number,
    currentTeam: Team | null,
    allTeams: Team[]
): TransferOffer[] {
    const playerValue = calculatePlayerValue(playerRating, playerAge);
    const eligibleTeams = allTeams.filter(team => {
        // Exclude current team from general pool, we will add it separately
        if (currentTeam && team.id === currentTeam.id) return false;

        // 1. Budget check
        const maxBudget = calculateMaxBudget(team.elo_rating);
        if (playerValue > maxBudget) return false;

        // 2. Rating floor check (unless young)
        if (playerAge > 21 && playerRating < team.elo_rating - 10) return false;

        return true;
    });

    // Determine weight for eligible teams
    const weightedTeams = eligibleTeams.map(team => {
        let weight = 1.0;

        // Tier logic
        if (currentTeam && currentTeam.league_tier && team.league_tier) {
            const diff = Math.abs(currentTeam.league_tier - team.league_tier);
            if (diff === 0) weight *= 1.0;
            else if (diff === 1) weight *= 0.35;
            else weight *= 0.05;
        }

        return { team, weight };
    });

    // Pick top 3-4 random offers based on weights (simplified for prototype)
    const sorted = weightedTeams.sort(() => Math.random() - 0.5); // Random shuffle
    const selected = sorted.slice(0, 3).map(w => w.team);

    const offers: TransferOffer[] = selected.map(team => {
        // Wage is loosely based on team elo and player rating
        const baseWage = 1000 + (team.elo_rating * 100) + (playerRating * 200);
        return {
            team,
            wageOffer: Math.round(baseWage * (0.8 + Math.random() * 0.4))
        };
    });

    // Always offer renewal if not completely terrible
    if (currentTeam && playerRating >= currentTeam.elo_rating - 15) {
        offers.unshift({
            team: currentTeam,
            wageOffer: Math.round(1000 + (currentTeam.elo_rating * 100) + (playerRating * 210)),
            isCurrentTeam: true
        });
    }

    return offers.sort((a, b) => b.wageOffer - a.wageOffer);
}
