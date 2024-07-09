import React, { useState, useEffect } from 'react';

type RewardType = 'dailyChests' | 'questions' | 'youtubeVideos';
type RewardItem = { day?: number; reward?: number; question?: string; answer?: string; title?: string; url?: string };

const AdminPanel = () => {
  const [type, setType] = useState<RewardType>('dailyChests');
  const [rewards, setRewards] = useState<Record<RewardType, RewardItem[]>>({
    dailyChests: [],
    questions: [],
    youtubeVideos: [],
  });

  useEffect(() => {
    fetch('/admin/rewards')
      .then(response => response.json())
      .then(data => setRewards(data));
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    const rewardData = Object.fromEntries(formData.entries()) as RewardItem;

    fetch('/admin/rewards', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, item: rewardData })
    }).then(() => {
      form.reset();
      fetch('/admin/rewards')
        .then(response => response.json())
        .then(data => setRewards(data));
    });
  };

  const handleDelete = (type: RewardType, item: RewardItem) => {
    fetch('/admin/rewards/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, item })
    }).then(() => {
      fetch('/admin/rewards')
        .then(response => response.json())
        .then(data => setRewards(data));
    });
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl text-center mb-4">Admin Panel</h1>
      <form id="add-reward-form" onSubmit={handleSubmit}>
        <label htmlFor="type">Type:</label>
        <select id="type" name="type" onChange={(e) => setType(e.target.value as RewardType)} className="block mb-2">
          <option value="dailyChests">Daily Chest</option>
          <option value="questions">Question</option>
          <option value="youtubeVideos">YouTube Video</option>
        </select>
        {type === 'dailyChests' && (
          <div id="dailyChests-form">
            <label htmlFor="day">Day:</label>
            <input type="number" id="day" name="day" min="1" max="10" className="block mb-2" />
            <label htmlFor="reward">Reward:</label>
            <input type="number" id="reward" name="reward" className="block mb-2" />
          </div>
        )}
        {type === 'questions' && (
          <div id="questions-form">
            <label htmlFor="question">Question:</label>
            <input type="text" id="question" name="question" className="block mb-2" />
            <label htmlFor="answer">Answer:</label>
            <input type="text" id="answer" name="answer" className="block mb-2" />
          </div>
        )}
        {type === 'youtubeVideos' && (
          <div id="youtubeVideos-form">
            <label htmlFor="title">Title:</label>
            <input type="text" id="title" name="title" className="block mb-2" />
            <label htmlFor="url">URL:</label>
            <input type="url" id="url" name="url" className="block mb-2" />
            <label htmlFor="reward">Reward:</label>
            <input type="number" id="youtube-reward" name="youtube-reward" className="block mb-2" />
          </div>
        )}
        <button type="submit" className="bg-blue-500 text-white px-4 py-2">Add Reward</button>
      </form>

      <h2 className="text-xl mt-4">Existing Rewards</h2>
      <div id="rewards-container">
        {Object.keys(rewards).map(type => (
          <div key={type}>
            <h3 className="text-lg">{type}</h3>
            {rewards[type as RewardType].map((item, index) => (
              <div key={index} className="flex justify-between items-center p-2 border mb-2">
                <span>{JSON.stringify(item)}</span>
                <button onClick={() => handleDelete(type as RewardType, item)} className="bg-red-500 text-white px-2 py-1">Delete</button>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminPanel;
