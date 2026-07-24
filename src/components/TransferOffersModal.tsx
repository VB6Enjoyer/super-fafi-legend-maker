import { useState, useEffect } from 'react';
import { useCareerStore } from '../store/careerStore';
import { generateTransferOffers, type TransferOffer } from '../lib/engine';
import { fetchTeams } from '../lib/supabase';
import { Euro, ArrowRight } from 'lucide-react';

interface Props {
  onComplete: () => void;
}

export const TransferOffersModal = ({ onComplete }: Props) => {
  const { player, updatePlayer } = useCareerStore();
  const [offers, setOffers] = useState<TransferOffer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadOffers = async () => {
      if (!player) return;
      const allTeams = await fetchTeams();
      const generated = generateTransferOffers(
        player.overallRating,
        player.age,
        player.currentTeam,
        allTeams
      );
      setOffers(generated);
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

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg">Loading offers...</div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <h2 className="text-2xl font-bold dark:text-white mb-2">Summer Transfer Window</h2>
        <p className="text-gray-600 dark:text-gray-300 mb-6">Review your contract offers for the upcoming season.</p>

        <div className="space-y-4">
          {offers.length === 0 ? (
            <div className="p-4 bg-red-50 dark:bg-red-900/50 text-red-800 dark:text-red-200 rounded-md">
              No teams are currently interested in signing you. You remain a Free Agent.
              <button
                onClick={onComplete}
                className="mt-4 w-full py-2 bg-red-600 text-white rounded-md"
              >
                Continue
              </button>
            </div>
          ) : (
            offers.map((offer, idx) => (
              <div
                key={idx}
                className={`p-4 border rounded-lg flex items-center justify-between transition-colors ${
                    offer.isCurrentTeam ? 'border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/30' : 'border-gray-200 dark:border-gray-700 hover:border-indigo-300'
                }`}
              >
                <div>
                  <h3 className="font-bold text-lg flex items-center gap-2">
                    {offer.team.name}
                    {offer.isCurrentTeam && <span className="text-xs bg-blue-200 text-blue-800 px-2 py-1 rounded-full">Current Club</span>}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {offer.team.league_name} • Tier {offer.team.league_tier} • Elo {offer.team.elo_rating}
                  </p>
                  <p className="text-green-700 font-semibold mt-1 flex items-center">
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
            ))
          )}
        </div>
      </div>
    </div>
  );
};
