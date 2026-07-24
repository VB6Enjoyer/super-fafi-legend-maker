import { useCareerStore } from './store/careerStore';
import { PlayerCreation } from './components/PlayerCreation';
import { CareerDashboard } from './components/CareerDashboard';

function App() {
  const player = useCareerStore(state => state.player);

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">
            Super FAFI <span className="text-indigo-600">LegendMaker</span>
          </h1>
          <p className="mt-2 text-lg text-gray-600">Text-Based Football Career Simulator</p>
        </div>

        {!player ? (
          <PlayerCreation />
        ) : (
          <CareerDashboard />
        )}
      </div>
    </div>
  );
}

export default App;
