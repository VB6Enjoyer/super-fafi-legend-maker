import { useEffect, useState } from 'react';
import { useCareerStore } from './store/careerStore';
import { PlayerCreation } from './components/PlayerCreation';
import { CareerDashboard } from './components/CareerDashboard';
import { Moon, Sun } from 'lucide-react';

function App() {
  const player = useCareerStore(state => state.player);

  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark' ||
        (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 py-8 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-end mb-4">
          <button
            onClick={() => setIsDark(!isDark)}
            className="p-2 rounded-full bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 shadow-sm border border-gray-200 dark:border-gray-700"
          >
            {isDark ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            Super FAFI <span className="text-indigo-600 dark:text-indigo-400">LegendMaker</span>
          </h1>
          <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">Text-Based Football Career Simulator</p>
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
