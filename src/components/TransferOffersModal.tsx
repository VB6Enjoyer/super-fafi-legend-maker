import { useState, useEffect } from 'react';
import { useCareerStore } from '../store/careerStore';
import { generateTransferOffers, type TransferOffer, type TransferWindowResult } from '../lib/engine';
import { fetchTeams } from '../lib/supabase';
import { Euro, ArrowRight, RefreshCcw, AlertTriangle } from 'lucide-react';

interface Props {
  onComplete: () => void;
}

export const TransferOffersModal = ({ onComplete }: Props) => {
  const { player, updatePlayer } = useCareerStore();
  const [result, setResult] = useState<TransferWindowResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadOffers = async () => {
      if (!player) return;
      const allTeams = await fetchTeams();

      const lastSeason = player.statsHistory.length > 0
          ? player.statsHistory[player.statsHistory.length - 1]
          : null;

      const generated = generateTransferOffers(
        player.overallRating,
        player.age,
        player.currentTeam,
        allTeams,
        lastSeason?.averageRating || 6.5
      );
      setResult(generated);
      setLoading(false);
    };
    loadOffers();
  }, [player]);

  const handleAccept = (offer: TransferOffer) => {
    updatePlayer({
      currentTeam: offer.team,
      weeklyWage: offer.wageOffer
    });
    onComplete();
  };

  const handleFreeAgentContinue = () => {
      updatePlayer({
          currentTeam: {
              id: 'free-agent',
              name: 'Free Agent',
              elo_rating: 40
          },
          weeklyWage: 0
      });
      onComplete();
  }

  if (loading || !result) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg text-gray-900 dark:text-gray-100">Loading offers...</div>
      </div>
    );
  }

  const { externalOffers, renewalOffer, releaseReason } = result;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Summer Transfer Window</h2>
        <p className="text-gray-600 dark:text-gray-300 mb-6">Review your contract situation for the upcoming season.</p>

        {releaseReason && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/50 border border-red-200 dark:border-red-800 rounded-md flex gap-3">
                <AlertTriangle className="text-red-600 dark:text-red-400 shrink-0" />
                <div>
                    <h4 className="font-bold text-red-800 dark:text-red-200">Contract Not Renewed</h4>
                    <p className="text-sm text-red-700 dark:text-red-300 mt-1">{releaseReason}</p>
                </div>
            </div>
        )}

        <div className="space-y-6">
          {/* Renewal Section */}
          {renewalOffer && (
              <div className="space-y-2">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 border-b dark:border-gray-700 pb-2">Current Club</h3>
                  <div className="p-4 border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/30 rounded-lg flex items-center justify-between">
                    <div>
                        <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100 flex items-center gap-2">
                            {renewalOffer.team.name}
                        </h3>
                        <p className="text-green-600 dark:text-green-400 font-semibold mt-1 flex items-center">
                            <Euro size={14} className="mr-1"/> {renewalOffer.wageOffer.toLocaleString()}/wk
                        </p>
                    </div>
                    <button
                        onClick={() => handleAccept(renewalOffer)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
                    >
                        <RefreshCcw size={16} /> Renew
                    </button>
                  </div>
              </div>
          )}

          {/* External Offers Section */}
          <div className="space-y-2">
             <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 border-b dark:border-gray-700 pb-2">External Offers</h3>

             {externalOffers.length === 0 ? (
                 <p className="text-gray-500 dark:text-gray-400 italic p-4 text-center border border-dashed rounded-lg border-gray-300 dark:border-gray-600">
                     No external offers received this window.
                 </p>
             ) : (
                <div className="space-y-3">
                    {externalOffers.map((offer, idx) => (
                    <div
                        key={idx}
                        className="p-4 border border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-500 rounded-lg flex items-center justify-between transition-colors"
                    >
                        <div>
                        <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100">
                            {offer.team.name}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            {offer.team.league_name} • Tier {offer.team.league_tier} • Elo {offer.team.elo_rating}
                        </p>
                        <p className="text-green-600 dark:text-green-400 font-semibold mt-1 flex items-center">
                            <Euro size={14} className="mr-1"/> {offer.wageOffer.toLocaleString()}/wk
                        </p>
                        </div>

                        <button
                        onClick={() => handleAccept(offer)}
                        className="px-4 py-2 bg-gray-900 dark:bg-gray-700 text-white rounded-md hover:bg-gray-800 dark:hover:bg-gray-600 flex items-center gap-2"
                        >
                        Sign <ArrowRight size={16} />
                        </button>
                    </div>
                    ))}
                </div>
             )}
          </div>

          {/* Fallback for completely stranded players */}
          {!renewalOffer && externalOffers.length === 0 && (
              <button
                onClick={handleFreeAgentContinue}
                className="mt-4 w-full py-3 bg-red-600 text-white rounded-md hover:bg-red-700 font-bold"
              >
                Continue as Free Agent
              </button>
          )}

        </div>
      </div>
    </div>
  );
};
