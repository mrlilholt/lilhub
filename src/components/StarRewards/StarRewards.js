import React, { useState } from 'react';
import { FaTrashAlt } from 'react-icons/fa';
import '../../styles/TasksCard.css'; // or your appropriate CSS file

const StarRewards = () => {
  const [rewards, setRewards] = useState([
    { stars: 10, reward: "Extra candy for dessert" },
    { stars: 20, reward: "One extra hour of screen time" },
    { stars: 30, reward: "Choose the dinner menu" },
    { stars: 50, reward: "Pick the family movie night" },
  ]);

  const [showForm, setShowForm] = useState(false);
  const [newStars, setNewStars] = useState('');
  const [newReward, setNewReward] = useState('');

  const handleAddReward = (e) => {
    e.preventDefault();
    if (newStars && newReward) {
      setRewards([...rewards, { stars: parseInt(newStars), reward: newReward }]);
      setNewStars('');
      setNewReward('');
      setShowForm(false);
    }
  };

  const handleDeleteReward = (index) => {
    setRewards(rewards.filter((_, i) => i !== index));
  };

  return (
    <div className="card" style={{ marginTop: '20px' }}>
      <img 
        src="/starRewardsLogo.png" 
        alt="Star Rewards" 
        style={{ height: '60px', marginBottom: '20px' }} 
      />
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {rewards.map((tier, index) => (
          <li key={index} style={{ marginBottom: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>
              <strong>{tier.stars} stars:</strong> {tier.reward}
            </span>
            <button onClick={() => handleDeleteReward(index)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
              <FaTrashAlt style={{ color: 'red' }} />
            </button>
          </li>
        ))}
      </ul>
      {!showForm && (
        <button onClick={() => setShowForm(true)} style={{ padding: '10px 20px', cursor: 'pointer' }}>
          Add Reward
        </button>
      )}
      {showForm && (
        <form onSubmit={handleAddReward} style={{ marginTop: '15px' }}>
          <div style={{ marginBottom: '10px' }}>
            <label>
              Star Threshold:
              <input 
                type="number" 
                value={newStars} 
                onChange={(e) => setNewStars(e.target.value)} 
                style={{ marginLeft: '10px' }} 
                required 
              />
            </label>
          </div>
          <div style={{ marginBottom: '10px' }}>
            <label>
              Reward:
              <input 
                type="text" 
                value={newReward} 
                onChange={(e) => setNewReward(e.target.value)} 
                style={{ marginLeft: '10px' }} 
                required 
              />
            </label>
          </div>
          <div>
            <button type="submit" style={{ padding: '8px 16px', cursor: 'pointer', marginRight: '10px' }}>
              Save Reward
            </button>
            <button 
              type="button" 
              onClick={() => { setShowForm(false); setNewStars(''); setNewReward(''); }} 
              style={{ padding: '8px 16px', cursor: 'pointer' }}
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default StarRewards;