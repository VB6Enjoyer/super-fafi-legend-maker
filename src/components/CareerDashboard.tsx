import { useState } from 'react';
import { useCareerStore, type SeasonStats } from '../store/careerStore';
import { calculateAppearances, simulateSeasonStats, calculateYearlyProgression } from '../lib/engine';
import { Trophy, Euro, Calendar } from 'lucide-react';
import { TransferOffersModal } from './TransferOffersModal';

export const CareerDashboard = () => {
  const { player, updatePlayer, addSeasonStats, retirePlayer } = useCareerStore();
  const [isSimulating, setIsSimulating] = useState(false);
  const [showTransfers, setShowTransfers] = useState(false);

  if (!player) return null;

  // Show transfer window immediately if player is a Free Agent (e.g. just created)
  if (player.currentTeam?.name === 'Free Agent' && !showTransfers && player.age === 16 && player.statsHistory.length === 0) {
      setTimeout(() => setShowTransfers(true), 100);
  }

  const handleSimulateSeason = async (riskChoice: 'safe' | 'risky') => {
    setIsSimulating(true);

    // 1. Calculate stats based on choice
    const formOffset = riskChoice === 'risky' ? (Math.random() > 0.5 ? 2 : -2) : 0;

    const apps = calculateAppearances(player.age, player.overallRating);
    const stats = simulateSeasonStats(player.position, player.overallRating, player.currentTeam?.elo_rating || 50, 70, apps);

    const trophies = [];
    if (player.currentTeam && player.currentTeam.elo_rating > 85 && Math.random() > 0.7) {
        trophies.push('Domestic League Title');
    }

    const seasonStats: SeasonStats = {
      year: 2024 + player.age - 16,
      teamName: player.currentTeam?.name || 'Free Agent',
      appearances: apps,
      ...stats,
      averageRating: 6.5 + (Math.random() * 2),
      trophiesWon: trophies,
      wageEarned: player.weeklyWage * 52
    };

    addSeasonStats(seasonStats);

    // 2. Progression
    const ratingChange = calculateYearlyProgression(player.age, player.overallRating, player.peakRating, formOffset);

    await new Promise(r => setTimeout(r, 1000));

    updatePlayer({
      age: player.age + 1,
      overallRating: player.overallRating + ratingChange
    });

    setIsSimulating(false);

    // Forced retirement check
    if (player.age + 1 >= 40 && player.position !== 'GK') {
        retirePlayer();
        return;
    }
    if (player.age + 1 >= 44 && player.position === 'GK') {
        retirePlayer();
        return;
    }

    // Trigger Transfer Window at end of season (if not retiring)
    setShowTransfers(true);
  };

  const isGK = player.position === 'GK';

  return (
    <div className="max-w-4xl mx-auto mt-8 p-6 bg-gray-50 rounded-lg shadow-md">
      {showTransfers && <TransferOffersModal onComplete={() => setShowTransfers(false)} />}

      {/* Header Profile */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6 flex justify-between items-center">
        <div>
            <h1 className="text-3xl font-bold text-gray-900">{player.name}</h1>
            <p className="text-gray-500">{player.nationality} • {player.position} • {player.currentTeam?.name}</p>
        </div>
        <div className="flex gap-4 text-center">
            <div className="bg-indigo-50 p-3 rounded-lg min-w-[80px]">
                <div className="text-sm text-indigo-600 font-semibold">OVR</div>
                <div className="text-2xl font-bold text-indigo-900">{player.overallRating}</div>
            </div>
            <div className="bg-blue-50 p-3 rounded-lg min-w-[80px]">
                <div className="text-sm text-blue-600 font-semibold">AGE</div>
                <div className="text-2xl font-bold text-blue-900">{player.age}</div>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column - Stats & History */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Trophy size={20} className="text-yellow-500"/> Career Overview</h3>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <div className="text-sm text-gray-500">Career Earnings</div>
                        <div className="font-semibold flex items-center"><Euro size={14} className="mr-1"/>{player.careerEarnings.toLocaleString()}</div>
                    </div>
                    <div>
                        <div className="text-sm text-gray-500">Current Wage</div>
                        <div className="font-semibold flex items-center"><Euro size={14} className="mr-1"/>{player.weeklyWage.toLocaleString()}/wk</div>
                    </div>
                    <div>
                        <div className="text-sm text-gray-500">Trophies</div>
                        <div className="font-semibold">{player.trophies.length}</div>
                    </div>
                </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 max-h-[400px] overflow-y-auto">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Calendar size={20} className="text-blue-500"/> Season History</h3>
                {player.statsHistory.length === 0 ? (
                    <p className="text-gray-400 italic">No professional appearances yet.</p>
                ) : (
                    <div className="space-y-4">
                        {[...player.statsHistory].reverse().map((stat, idx) => (
                            <div key={idx} className="border-b pb-2 last:border-0">
                                <div className="flex justify-between text-sm font-semibold">
                                    <span>Age {16 + player.statsHistory.length - 1 - idx} • {stat.teamName}</span>
                                    <span>Apps: {stat.appearances}</span>
                                </div>
                                <div className="text-sm text-gray-600 mt-1">
                                    {isGK ? (
                                        <>CS: {stat.cleanSheets} | GC: {stat.goalsConceded} | SVS: {stat.saves}</>
                                    ) : (
                                        <>G: {stat.goals} | A: {stat.assists}</>
                                    )}
                                </div>
                                {stat.trophiesWon.length > 0 && (
                                    <div className="text-xs text-yellow-600 mt-1 flex items-center gap-1">
                                        <Trophy size={12}/> {stat.trophiesWon.join(', ')}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
          </div>

          {/* Right Column - Action Area */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
             <h3 className="text-lg font-bold mb-4 text-center">Season Progression</h3>

             {player.isRetired ? (
                 <div className="text-center p-6 bg-gray-100 rounded-lg">
                     <h2 className="text-2xl font-bold text-gray-800 mb-2">Happy Retirement!</h2>
                     <p className="text-gray-600">You hung up your boots at age {player.age}.</p>
                 </div>
             ) : (
                 <div className="space-y-4 mt-8">
                     <p className="text-sm text-gray-600 text-center mb-6">How do you want to approach this season?</p>
                     <button
                        onClick={() => handleSimulateSeason('safe')}
                        disabled={isSimulating}
                        className="w-full py-3 px-4 border border-blue-600 text-blue-600 rounded-md shadow-sm text-sm font-medium hover:bg-blue-50 focus:outline-none disabled:opacity-50"
                     >
                        {isSimulating ? 'Simulating...' : 'Play it Safe (Steady Growth)'}
                     </button>
                     <button
                        onClick={() => handleSimulateSeason('risky')}
                        disabled={isSimulating}
                        className="w-full py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none disabled:opacity-50"
                     >
                        {isSimulating ? 'Simulating...' : 'Show Off (High Risk/Reward)'}
                     </button>
                 </div>
             )}
          </div>
      </div>
    </div>
  );
};
