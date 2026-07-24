import React, { useState } from 'react';
import { useCareerStore } from '../store/careerStore';
import type { Position } from '../lib/engine';

const POSITIONS: Position[] = ['ST', 'LW', 'RW', 'CAM', 'CM', 'CDM', 'CB', 'LB', 'RB', 'GK'];

export const PlayerCreation = () => {
  const [name, setName] = useState('');
  const [nationality, setNationality] = useState('England');
  const [position, setPosition] = useState<Position>('ST');
  const [dominantFoot, setDominantFoot] = useState<'Left' | 'Right'>('Right');

  const createPlayer = useCareerStore(state => state.createPlayer);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Generate initial rating between 40-60, avg 50
    // Box-Muller transform for normal distribution
    let u = 0, v = 0;
    while(u === 0) u = Math.random();
    while(v === 0) v = Math.random();
    let num = Math.sqrt( -2.0 * Math.log( u ) ) * Math.cos( 2.0 * Math.PI * v );
    num = num / 10.0 + 0.5; // Translate to 0 -> 1
    if (num > 1 || num < 0) num = 0.5; // resample between 0 and 1 if out of bounds

    const initialRating = Math.max(40, Math.min(60, Math.round(num * 20 + 40)));

    createPlayer({
      name,
      nationality,
      position,
      dominantFoot,
      age: 16,
      overallRating: initialRating,
      currentTeam: {
          id: 'test-uuid',
          name: 'Free Agent',
          elo_rating: 50
      }
    });
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-xl">
      <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Create Your Legend</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name-input" className="block text-sm font-medium text-gray-700">Name</label>
          <input
            type="text"
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
            id="name-input" value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div>
          <label htmlFor="nat-input" className="block text-sm font-medium text-gray-700">Nationality</label>
          <input
            type="text"
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
            id="nat-input" value={nationality}
            onChange={(e) => setNationality(e.target.value)}
          />
        </div>

        <div>
          <label htmlFor="pos-input" className="block text-sm font-medium text-gray-700">Position</label>
          <select
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
            id="pos-input" value={position}
            onChange={(e) => setPosition(e.target.value as Position)}
          >
            {POSITIONS.map(pos => (
              <option key={pos} value={pos}>{pos}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="foot-input" className="block text-sm font-medium text-gray-700">Dominant Foot</label>
          <select
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
            id="foot-input" value={dominantFoot}
            onChange={(e) => setDominantFoot(e.target.value as 'Left' | 'Right')}
          >
            <option value="Right">Right</option>
            <option value="Left">Left</option>
          </select>
        </div>

        <button
          type="submit"
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Sign First Professional Contract
        </button>
      </form>
    </div>
  );
};
