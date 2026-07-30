import React, { useState } from 'react';
import { useCareerStore } from '../store/careerStore';
import type { Position } from '../lib/engine';
import { COUNTRIES } from '../lib/countries';
import { Search } from 'lucide-react';

export const PlayerCreation = () => {
  const [name, setName] = useState('');
  const [nationality, setNationality] = useState('England');
  const [position, setPosition] = useState<Position>('ST');
  const [dominantFoot, setDominantFoot] = useState<'Left' | 'Right'>('Right');
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const createPlayer = useCareerStore(state => state.createPlayer);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let u = 0, v = 0;
    while(u === 0) u = Math.random();
    while(v === 0) v = Math.random();
    let num = Math.sqrt( -2.0 * Math.log( u ) ) * Math.cos( 2.0 * Math.PI * v );
    num = num / 10.0 + 0.5;
    if (num > 1 || num < 0) num = 0.5;

    const initialRating = Math.max(40, Math.min(60, Math.round(num * 20 + 40)));

    createPlayer({
      name,
      nationality,
      position,
      dominantFoot,
      age: 16,
      overallRating: initialRating,
      currentTeam: {
          id: 'free-agent',
          name: 'Free Agent',
          elo_rating: 50
      }
    });
  };

  const positions: { id: Position; label: string; x: number; y: number }[] = [
    { id: 'CF', label: 'CF', x: 50, y: 15 },
    { id: 'ST', label: 'ST', x: 50, y: 25 },
    { id: 'LW', label: 'LW', x: 20, y: 20 },
    { id: 'RW', label: 'RW', x: 80, y: 20 },
    { id: 'AMF', label: 'AMF', x: 50, y: 35 },
    { id: 'LMF', label: 'LMF', x: 15, y: 50 },
    { id: 'CM', label: 'CM', x: 50, y: 50 },
    { id: 'RMF', label: 'RMF', x: 85, y: 50 },
    { id: 'DMF', label: 'DMF', x: 50, y: 65 },
    { id: 'LB', label: 'LB', x: 15, y: 75 },
    { id: 'RB', label: 'RB', x: 85, y: 75 },
    { id: 'CB', label: 'CB', x: 50, y: 80 },
    { id: 'GK', label: 'GK', x: 50, y: 92 },
  ];

  return (
    <div className="max-w-2xl mx-auto mt-10 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-xl">
      <h2 className="text-2xl font-bold mb-6 text-center text-gray-900 dark:text-white dark:text-white">Create Your Legend</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
                <div>
                <label htmlFor="name-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
                <input
                    type="text"
                    id="name-input"
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm p-2 border focus:ring-indigo-500 focus:border-indigo-500"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                />
                </div>

                <div className="relative">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nationality</label>

                <div
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm p-2 border cursor-pointer flex justify-between items-center"
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                >
                    <span>
                        {COUNTRIES.find(c => c.name === nationality)?.flag} {nationality}
                    </span>
                    <span className="text-gray-400">▼</span>
                </div>

                {isDropdownOpen && (
                    <div className="absolute z-50 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-hidden flex flex-col">
                        <div className="p-2 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2">
                            <Search size={16} className="text-gray-400" />
                            <input
                                type="text"
                                autoFocus
                                placeholder="Search country..."
                                className="w-full bg-transparent outline-none text-gray-900 dark:text-white"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                            />
                        </div>
                        <div className="overflow-y-auto">
                            {COUNTRIES.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.code.toLowerCase().includes(searchQuery.toLowerCase())).map(c => (
                                <div
                                    key={c.code}
                                    className="p-2 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 cursor-pointer text-gray-900 dark:text-white flex items-center gap-2"
                                    onClick={() => {
                                        setNationality(c.name);
                                        setIsDropdownOpen(false);
                                        setSearchQuery('');
                                    }}
                                >
                                    <span>{c.flag}</span>
                                    <span>{c.name} <span className="text-xs text-gray-400">({c.code})</span></span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                </div>

                <div>
                <label htmlFor="foot-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Dominant Foot</label>
                <select
                    id="foot-input"
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm p-2 border focus:ring-indigo-500 focus:border-indigo-500"
                    value={dominantFoot}
                    onChange={(e) => setDominantFoot(e.target.value as 'Left' | 'Right')}
                >
                    <option value="Right">Right</option>
                    <option value="Left">Left</option>
                </select>
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Position</label>
                <div className="relative w-full aspect-[2/3] bg-green-600 rounded-lg border-2 border-white/50 overflow-hidden shadow-inner">
                    {/* Pitch markings */}
                    <div className="absolute inset-0 border-4 border-white/30 m-4"></div>
                    <div className="absolute top-1/2 left-0 right-0 border-t-2 border-white/30"></div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 border-2 border-white/30 rounded-full"></div>

                    {/* Penalty areas */}
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 w-32 h-16 border-2 border-white/30 border-t-0"></div>
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-32 h-16 border-2 border-white/30 border-b-0"></div>

                    {/* Position buttons */}
                    {positions.map((pos) => (
                        <button
                            key={pos.id}
                            type="button"
                            onClick={() => setPosition(pos.id)}
                            className={`absolute -translate-x-1/2 -translate-y-1/2 w-9 h-9 rounded-full text-xs font-bold transition-all shadow-md ${
                                position === pos.id
                                ? 'bg-indigo-600 text-white border-2 border-white scale-110 z-10'
                                : 'bg-white/90 text-gray-900 dark:text-gray-900 hover:bg-white border border-gray-300'
                            }`}
                            style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                            title={pos.label}
                        >
                            {pos.label}
                        </button>
                    ))}
                </div>
            </div>
        </div>

        <button
          type="submit"
          className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
        >
          Sign First Professional Contract
        </button>
      </form>
    </div>
  );
};
