import { useState } from 'react';
import { useCareerStore, type SeasonStats } from '../store/careerStore';
import { calculateAppearances, simulateSeasonStats, calculateYearlyProgression, calculateLoveAndFame, generateTransferOffers, type TransferWindowResult } from '../lib/engine';
import { Trophy, Settings, Heart, Star } from 'lucide-react';
import { TransferOffersModal } from './TransferOffersModal';
import { COUNTRIES } from '../lib/countries';
import { fetchTeams } from '../lib/supabase';

export const CareerDashboard = () => {
  const { player, updatePlayer, addSeasonStats, retirePlayer, resetCareer } = useCareerStore();
  const [isSimulating, setIsSimulating] = useState(false);
  const [showTransfers, setShowTransfers] = useState(false);
  const [transferResult, setTransferResult] = useState<TransferWindowResult | null>(null);

  if (!player) return null;

  // Initialize Free Agent Transfer Window
  if (player.currentTeam?.name === 'Free Agent' && !showTransfers && player.age === 16 && player.statsHistory.length === 0) {
      setTimeout(async () => {
          const allTeams = await fetchTeams();
          const generated = generateTransferOffers(player.overallRating, player.age, player.currentTeam, allTeams, 6.5, 50);
          setTransferResult(generated);
          setShowTransfers(true);
      }, 100);
  }

  const handleSimulateSeason = async (riskChoice: 'safe' | 'risky') => {
    setIsSimulating(true);

    const formOffset = riskChoice === 'risky' ? (Math.random() > 0.5 ? 2 : -2) : 0;

    const apps = calculateAppearances(player.age, player.overallRating);
    const stats = simulateSeasonStats(player.position, player.overallRating, player.currentTeam?.elo_rating || 50, 70, apps);

    const trophies = [];
    if (player.currentTeam && player.currentTeam.elo_rating > 85 && Math.random() > 0.7) {
        trophies.push('League Title');
    }
    if (player.currentTeam && player.currentTeam.elo_rating > 90 && Math.random() > 0.8) {
        trophies.push('Continental Cup');
    }

    const isFreeAgent = player.currentTeam?.name === 'Free Agent';

    const actualApps = isFreeAgent ? 0 : apps;
    const actualWageEarned = isFreeAgent ? 0 : player.weeklyWage * 52;
    const actualStats = isFreeAgent ? {
        goals: 0,
        assists: 0,
        cleanSheets: 0,
        goalsConceded: 0,
        saves: 0
    } : stats;
    const actualTrophies = isFreeAgent ? [] : trophies;
    const avgRating = isFreeAgent ? 0 : (6.5 + (Math.random() * 2));

    // Calculate Love and Fame
    // Did they change clubs? (Compare current team with team from last season history)
    let changedClubs = false;
    if (player.statsHistory.length > 0) {
       changedClubs = player.statsHistory[player.statsHistory.length - 1].teamName !== player.currentTeam?.name;
    }

    const { love, fame, legacy } = calculateLoveAndFame(
       player.love,
       player.fame,
       player.legacy,
       player.age,
       player.overallRating,
       player.currentTeam?.elo_rating || 50,
       changedClubs,
       {
           apps: actualApps,
           goals: actualStats.goals || 0,
           assists: actualStats.assists || 0,
           cleanSheets: actualStats.cleanSheets || 0,
           saves: actualStats.saves || 0
       },
       actualTrophies.length
    );

    const seasonStats: SeasonStats = {
      year: 2024 + player.age - 16,
      teamName: player.currentTeam?.name || 'Free Agent',
      appearances: actualApps,
      ...actualStats,
      averageRating: avgRating,
      playerRating: player.overallRating,
      trophiesWon: actualTrophies,
      wageEarned: actualWageEarned,
      love,
      fame
    };

    addSeasonStats(seasonStats);

    const ratingChange = calculateYearlyProgression(player.age, player.overallRating, player.peakRating, formOffset);
    const newAge = player.age + 1;
    const newRating = player.overallRating + ratingChange;

    // Auto-save player state with new fame/love
    updatePlayer({
      age: newAge,
      overallRating: newRating,
      love,
      fame,
      legacy
    });

    await new Promise(r => setTimeout(r, 800));

    // Generate transfer offers synchronously here
    const allTeams = await fetchTeams();
    const offers = generateTransferOffers(newRating, newAge, player.currentTeam, allTeams, avgRating, love);

    setIsSimulating(false);

    // Auto-renew if no external offers
    if (offers.externalOffers.length === 0) {
        if (offers.renewalOffer) {
            // Auto renew
            updatePlayer({
               currentTeam: offers.renewalOffer.team,
               weeklyWage: offers.renewalOffer.wageOffer
            });
            // Check retirement after auto renew
            if (newAge >= 40 && player.position !== 'GK') {
                retirePlayer("Age Limit Reached");
            } else if (newAge >= 44 && player.position === 'GK') {
                retirePlayer("Age Limit Reached");
            }
            return;
        } else if (offers.releaseReason) {
            // Released and no external offers. Check if age > 33 to force retirement
            if (newAge > 33) {
                retirePlayer("Forced retirement: Unsigned and declining.");
                return;
            }
        }
    }

    // Still check hard cap limits if they do have offers
    if (newAge >= 40 && player.position !== 'GK') {
        retirePlayer("Age Limit Reached");
        return;
    }
    if (newAge >= 44 && player.position === 'GK') {
        retirePlayer("Age Limit Reached");
        return;
    }

    setTransferResult(offers);
    setShowTransfers(true);
  };

  const isGK = player.position === 'GK';

  const getOvrColorClass = (rating: number) => {
      if (rating < 60) return 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-gray-200 dark:border-gray-700';
      if (rating < 70) return 'bg-gradient-to-br from-amber-600 to-orange-800 text-white border-amber-900 shadow-[0_0_15px_rgba(217,119,6,0.5)]'; // Bronze
      if (rating < 80) return 'bg-gradient-to-br from-gray-300 to-gray-500 text-gray-900 border-gray-400 shadow-[0_0_15px_rgba(156,163,175,0.5)]'; // Silver
      if (rating < 90) return 'bg-gradient-to-br from-yellow-300 to-yellow-600 text-yellow-900 border-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.6)]'; // Gold
      if (rating < 95) return 'bg-gradient-to-br from-blue-100 to-indigo-200 text-indigo-900 border-indigo-300 shadow-[0_0_20px_rgba(199,210,254,0.8)]'; // Platinum
      return 'bg-gradient-to-br from-cyan-300 via-blue-400 to-purple-500 text-white border-cyan-400 shadow-[0_0_25px_rgba(6,182,212,0.8)]'; // Diamond
  };

  const getOvrBadgeClass = (rating: number) => {
      if (rating < 60) return 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200';
      if (rating < 70) return 'bg-amber-600 text-white';
      if (rating < 80) return 'bg-gray-400 text-white';
      if (rating < 90) return 'bg-yellow-500 text-white';
      if (rating < 95) return 'bg-blue-200 text-blue-900';
      return 'bg-cyan-400 text-white';
  }

  const flag = COUNTRIES.find(c => c.name === player.nationality)?.flag || '';

  // Calculate totals
  const totalApps = player.statsHistory.reduce((acc, curr) => acc + curr.appearances, 0);
  const totalGls = player.statsHistory.reduce((acc, curr) => acc + (curr.goals || 0), 0);
  const totalAst = player.statsHistory.reduce((acc, curr) => acc + (curr.assists || 0), 0);
  const totalCs = player.statsHistory.reduce((acc, curr) => acc + (curr.cleanSheets || 0), 0);
  const totalGc = player.statsHistory.reduce((acc, curr) => acc + (curr.goalsConceded || 0), 0);

  return (
    <div className="max-w-6xl mx-auto mt-4 p-4 lg:grid lg:grid-cols-12 gap-6 items-start">
      {showTransfers && transferResult && <TransferOffersModal result={transferResult} onComplete={() => setShowTransfers(false)} />}

      {/* Left Column - Profile & Actions */}
      <div className="lg:col-span-4 space-y-6">

        {/* Main Profile Card */}
        <div className="bg-gray-900 text-white rounded-xl overflow-hidden shadow-2xl relative border border-gray-800">
            {/* OVR Overlay */}
            <div className={`absolute top-0 left-0 w-24 h-24 rounded-br-[2rem] flex flex-col items-center justify-center ${getOvrColorClass(player.overallRating)} z-10 border-r border-b`}>
                <span className="text-xs font-bold opacity-80 uppercase tracking-widest">OVR</span>
                <span className="text-4xl font-black leading-none">{player.overallRating}</span>
            </div>

            <div className="p-6 pt-8 pl-28 relative">
                <div className="flex justify-between items-start mb-2">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-xl" title={player.nationality}>{flag}</span>
                            <span className="text-xs font-bold px-2 py-1 bg-gray-800 rounded text-gray-300 border border-gray-700">{player.position}</span>
                        </div>
                        <h2 className="text-2xl font-black tracking-tight">{player.name}</h2>
                        <h3 className="text-gray-400 font-semibold flex items-center gap-2 mt-1">
                            {player.currentTeam?.name}
                        </h3>
                        <div className="flex gap-4 mt-2">
                           <span className="text-xs font-bold flex items-center gap-1 text-pink-400"><Heart size={12} fill="currentColor"/> {player.love}% Love</span>
                           <span className="text-xs font-bold flex items-center gap-1 text-yellow-400"><Star size={12} fill="currentColor"/> {player.fame}% Fame</span>
                        </div>
                    </div>
                    <div className="text-right">
                        <span className="text-xs text-gray-500 font-bold block mb-1 uppercase tracking-widest">Age</span>
                        <span className="text-3xl font-black">{player.age}</span>
                    </div>
                </div>
            </div>

            <div className="bg-gray-800/50 p-4 border-t border-gray-800 grid grid-cols-3 divide-x divide-gray-700 text-center">
                <div>
                    <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider block mb-1">Apps</span>
                    <span className="font-bold">{totalApps}</span>
                </div>
                <div>
                    <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider block mb-1">{isGK ? 'Clean Sheets' : 'Goals'}</span>
                    <span className="font-bold">{isGK ? totalCs : totalGls}</span>
                </div>
                <div>
                    <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider block mb-1">{isGK ? 'Conceded' : 'Assists'}</span>
                    <span className="font-bold">{isGK ? totalGc : totalAst}</span>
                </div>
            </div>

            {player.trophies.length > 0 && (
                <div className="bg-gray-900 p-4 border-t border-gray-800">
                     <div className="flex items-center justify-center gap-2 flex-wrap">
                        {Array.from({ length: Math.min(6, player.trophies.length) }).map((_, i) => (
                           <Trophy key={i} size={24} className="text-yellow-500 drop-shadow-[0_0_8px_rgba(234,179,8,0.4)]" />
                        ))}
                        {player.trophies.length > 6 && <span className="text-xs text-gray-400 font-bold">+{player.trophies.length - 6}</span>}
                     </div>
                </div>
            )}
        </div>

        {/* Action Area */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">

             {player.isRetired ? (
                 <div className="text-center">
                     <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Legend Retired</h2>
                     <p className="text-gray-600 dark:text-gray-300 mb-6 text-sm">A spectacular career comes to an end.</p>

                     <button
                        onClick={() => resetCareer()}
                        className="w-full py-3 px-4 rounded-lg shadow-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none transition-colors"
                     >
                        Start New Career
                     </button>
                 </div>
             ) : (
                 <div>
                     <h3 className="text-sm font-bold mb-4 text-gray-400 uppercase tracking-wider flex items-center gap-2"><Settings size={16}/> Season Simulation</h3>
                     <div className="space-y-3">
                         <button
                            onClick={() => handleSimulateSeason('safe')}
                            disabled={isSimulating}
                            className="w-full py-3 px-4 border-2 border-indigo-600/20 text-indigo-700 dark:text-indigo-400 dark:border-indigo-500/30 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-lg shadow-sm font-bold hover:bg-indigo-50 dark:hover:bg-indigo-900/30 focus:outline-none disabled:opacity-50 transition-colors"
                         >
                            {isSimulating ? 'Simulating...' : 'Play it Safe'}
                         </button>
                         <button
                            onClick={() => handleSimulateSeason('risky')}
                            disabled={isSimulating}
                            className="w-full py-3 px-4 rounded-lg shadow-md font-bold text-white bg-indigo-600 hover:bg-indigo-500 focus:outline-none disabled:opacity-50 transition-all active:scale-95"
                         >
                            {isSimulating ? 'Simulating...' : 'Show Off (High Risk/Reward)'}
                         </button>

                         {player.age >= 30 && (
                             <button
                                onClick={() => retirePlayer()}
                                disabled={isSimulating}
                                className="w-full mt-4 py-2 px-4 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 rounded-lg text-sm font-bold hover:bg-red-50 dark:hover:bg-red-900/20 focus:outline-none disabled:opacity-50 transition-colors"
                             >
                                Retire Early
                             </button>
                         )}
                     </div>
                 </div>
             )}
        </div>
      </div>

      {/* Right Column - History Log */}
      <div className="lg:col-span-8 mt-6 lg:mt-0">
         <div className="bg-gray-900 rounded-xl shadow-2xl border border-gray-800 overflow-hidden">
            {/* Header row */}
            <div className="grid grid-cols-12 gap-2 p-3 text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-gray-800 bg-gray-900/50">
                <div className="col-span-1 text-center">Age</div>
                <div className="col-span-4 sm:col-span-3 pl-2">Club</div>
                <div className="col-span-1 text-center">OVR</div>
                <div className="col-span-1 text-center" title="Played Matches">Apps</div>
                <div className="col-span-1 text-center" title={isGK ? "Clean Sheets" : "Goals"}>{isGK ? 'CS' : 'GLS'}</div>
                <div className="col-span-1 text-center" title={isGK ? "Goals Conceded" : "Assists"}>{isGK ? 'GC' : 'AST'}</div>
                <div className="col-span-2 text-right pr-2">Love/Fame</div>
            </div>

            {/* Rows */}
            <div className="divide-y divide-gray-800 max-h-[650px] overflow-y-auto">
                {player.statsHistory.length === 0 ? (
                     <div className="p-8 text-center text-gray-500 italic">No professional appearances yet. Sign your first contract to begin.</div>
                ) : (
                    [...player.statsHistory].reverse().map((stat, idx) => {
                        const ageDuringSeason = 16 + player.statsHistory.length - 1 - idx;
                        return (
                            <div key={idx} className="grid grid-cols-12 gap-2 p-3 items-center hover:bg-gray-800/50 transition-colors text-sm text-gray-300">
                                <div className="col-span-1 text-center font-bold text-indigo-400">{ageDuringSeason}</div>
                                <div className="col-span-4 sm:col-span-3 pl-2 flex items-center gap-2 truncate">
                                    <span className="font-semibold text-gray-100 truncate">{stat.teamName}</span>
                                    {stat.trophiesWon.length > 0 && (
                                        <div className="flex shrink-0">
                                            {stat.trophiesWon.map((_, i) => <Trophy key={i} size={12} className="text-yellow-500 inline-block -ml-1 first:ml-0" />)}
                                        </div>
                                    )}
                                </div>
                                <div className="col-span-1 flex justify-center">
                                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${getOvrBadgeClass(stat.playerRating)}`}>{stat.playerRating}</span>
                                </div>
                                <div className="col-span-1 text-center font-mono">{stat.appearances}</div>
                                <div className="col-span-1 text-center font-mono text-gray-100">{isGK ? stat.cleanSheets : stat.goals}</div>
                                <div className="col-span-1 text-center font-mono text-gray-100">{isGK ? stat.goalsConceded : stat.assists}</div>
                                <div className="col-span-2 text-right pr-2 flex items-center justify-end gap-2 font-mono text-[10px] text-gray-400">
                                   <span className="text-pink-400/80"><Heart size={10} className="inline"/>{stat.love}</span>
                                   <span className="text-yellow-400/80"><Star size={10} className="inline"/>{stat.fame}</span>
                                </div>
                            </div>
                        )
                    })
                )}
            </div>
         </div>
      </div>

    </div>
  );
};
