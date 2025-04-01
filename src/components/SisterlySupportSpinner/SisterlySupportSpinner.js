import React, { useState } from 'react';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { FaSpinner } from 'react-icons/fa';

const challenges = [
  {
    title: 'Marvelous Match-Up',
    rule: 'Team up with your sister to complete a chore together — extra points for cooperation and fun!',
    points: 10
  },
  {
    title: 'Kindness Kickoff',
    rule: 'Do one nice thing for your sister today (no telling — let her discover it!).',
    points: 5
  },
  {
    title: 'Buddy Breakfast',
    rule: 'Make or serve a small breakfast or snack for your sister — even a bowl of cereal counts.',
    points: 7
  },
  {
    title: 'Teamwork Tidy',
    rule: 'Pick a room or corner and clean it together — play music and make it fun!',
    points: 8
  },
  {
    title: 'Compliment Catch-Up',
    rule: 'Each give 3 sincere compliments to the other — they can be silly or sweet.',
    points: 6
  },
  {
    title: 'Swap & Shine',
    rule: 'Do one of your sister’s chores for her without complaining (and she does one of yours).',
    points: 9
  },
  {
    title: 'Creative Collab',
    rule: 'Make something together — a drawing, a dance, a LEGO tower, a mini skit, etc.',
    points: 10
  },
  {
    title: 'Silent Supporters',
    rule: 'Help each other through a challenge without speaking — a test of teamwork through gestures!',
    points: 4
  },
  {
    title: 'Game of Gratitude',
    rule: 'Say why you’re grateful for each other — then write it on a sticky note and post it somewhere visible.',
    points: 8
  },
  {
    title: 'Harmony Helpers',
    rule: 'Work together to help a grown-up (set the table, sweep, organize shoes, etc.) — earn bonus points for speed + smiles!',
    points: 7
  }
];

const SisterlySupportSpinner = () => {
  const [selectedChallenge, setSelectedChallenge] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [spinning, setSpinning] = useState(false);

  const spin = () => {
    setSpinning(true);
    // Simulate spinning delay (2 seconds)
    setTimeout(() => {
      const randomIndex = Math.floor(Math.random() * challenges.length);
      const challenge = challenges[randomIndex];
      setSelectedChallenge(challenge);
      setShowPopup(true);
      setSpinning(false);
    }, 2000);
  };

  const handleAcceptChallenge = async () => {
    if (!selectedChallenge) return;
    const sisters = ['Mira', 'Shea'];
    try {
      for (const sister of sisters) {
        await addDoc(collection(db, 'tasks'), {
          title: selectedChallenge.title,
          description: selectedChallenge.rule,
          pointValue: selectedChallenge.points,
          assignedTo: sister,
          dueDate: new Date(), // Helps TasksCard order/display it
          createdAt: serverTimestamp(),
          sisterlySupport: true
        });
      }
      setShowPopup(false);
      console.log('Challenge added to both tasks lists.');
    } catch (error) {
      console.error('Error adding sisterly support challenge:', error);
    }
  };

  return (
    <>
      {/* Inline style for spinner animation with Chromium-compatible prefixes */}
      <style>
        {`
          @-webkit-keyframes spin {
            from { -webkit-transform: rotate(0deg); }
            to { -webkit-transform: rotate(360deg); }
          }
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          .spinner {
            -webkit-animation: spin 1s linear infinite;
            animation: spin 1s linear infinite;
          }
        `}
      </style>
      <div style={{
        background: '#fff',
        padding: '20px',
        borderRadius: '8px',
        textAlign: 'center',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        maxWidth: '300px',
        margin: '20px auto'
      }}>
        <img
          src="/sisterlyIcon.png"
          alt="Sisterly Icon"
          style={{ width: '150px', marginBottom: '10px' }} // enlarged image
        />
        <h3>Sisterly Support Challenges</h3>
        <p>Spin the wheel to assign a sisterly challenge!</p>
        <button onClick={spin} disabled={spinning} style={{
          padding: '10px 20px',
          fontSize: '16px',
          cursor: spinning ? 'default' : 'pointer'
        }}>
          {spinning ? <FaSpinner className="spinner" size={24} /> : 'Spin'}
        </button>

        {showPopup && selectedChallenge && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            background: 'rgba(0,0,0,0.5)'
          }}>
            <div style={{
              background: '#fff',
              padding: '20px',
              borderRadius: '8px',
              textAlign: 'center',
              maxWidth: '400px'
            }}>
              <h3>{selectedChallenge.title}</h3>
              <p>{selectedChallenge.rule}</p>
              <p>Points: {selectedChallenge.points}</p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '10px' }}>
                <button onClick={handleAcceptChallenge} style={{
                  padding: '8px 16px',
                  cursor: 'pointer'
                }}>
                  Accept Challenge
                </button>
                <button onClick={() => setShowPopup(false)} style={{
                  padding: '8px 16px',
                  cursor: 'pointer'
                }}>
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default SisterlySupportSpinner;