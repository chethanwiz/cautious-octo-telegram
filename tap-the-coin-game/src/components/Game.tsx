import { useState, useEffect } from 'react';

const Game = () => {
  const [coinBalance, setCoinBalance] = useState(0);
  const [energy, setEnergy] = useState(3000);

  const handleCoinClick = () => {
    if (energy > 0) {
      setCoinBalance(coinBalance + 1);
      setEnergy(energy - 1);
    }
  };

  useEffect(() => {
    // Fetch initial data and set states
  }, []);

  return (
    <div className="game">
      <header className="flex justify-between p-4 bg-gray-800 text-white">
        <div>Coin Balance: {coinBalance}</div>
        <div>League: Wood League</div>
      </header>
      <main className="flex flex-col items-center mt-4">
        <div id="coin-container" className="mb-4">
          <div id="coin" onClick={handleCoinClick} className="w-32 h-32 bg-yellow-500 rounded-full flex items-center justify-center">
            Coin
          </div>
        </div>
        <div id="energy-bar-container" className="w-full bg-gray-300 rounded-full h-6 overflow-hidden mb-4">
          <div id="energy-bar" className="bg-green-500 h-full" style={{ width: `${(energy / 3000) * 100}%` }}></div>
        </div>
        <div className="options flex justify-between w-full px-4">
          <button className="bg-blue-500 text-white px-4 py-2">Tap</button>
          <button className="bg-blue-500 text-white px-4 py-2">Friends</button>
          <button className="bg-blue-500 text-white px-4 py-2">Reward</button>
          <button className="bg-blue-500 text-white px-4 py-2">Boost</button>
          <button className="bg-blue-500 text-white px-4 py-2">Leaderboard</button>
        </div>
      </main>
    </div>
  );
};

export default Game;
