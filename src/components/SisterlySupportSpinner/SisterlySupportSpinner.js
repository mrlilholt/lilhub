import React, { useState } from 'react';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';

const colors = [
  "#FF5733", "#F39C12", "#F1C40F", "#2ECC71", "#3498DB",
  "#9B59B6", "#E74C3C", "#1ABC9C", "#E67E22", "#34495E"
];

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
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [selectedChallenge, setSelectedChallenge] = useState(null);
  const [showPopup, setShowPopup] = useState(false);

  const spinWheel = () => {
    if (spinning) return;
    setSpinning(true);
    // Choose a random segment from 0 to 9
    const segmentIndex = Math.floor(Math.random() * 10);
    // Each segment spans 36°; take the center of the segment: segmentIndex*36 + 18
    const targetAngle = segmentIndex * 36 + 18;
    // Add several full rotations (e.g., 5 full spins = 1800°) plus adjustment
    const extraRotations = 5 * 360;
    // Calculate current rotation mod 360
    const currentRemainder = rotation % 360;
    // Determine additional angle needed to land on target
    let delta = targetAngle - currentRemainder;
    if (delta < 0) delta += 360;
    const finalRotation = rotation + extraRotations + delta;
    setRotation(finalRotation);
  };

  // Called when CSS transition ends
  const onTransitionEnd = () => {
    // Determine segment index from final rotation
    const landingAngle = rotation % 360; // angle within [0,360)
    let segIndex = Math.floor(landingAngle / 36);
    // In our design, we assume segments are in order with challenges array
    setSelectedChallenge(challenges[segIndex]);
    setSpinning(false);
    setShowPopup(true);
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

  // Generate CSS conic gradient string for 10 segments using colors
  const gradientString = `conic-gradient(${colors.map((c, i) => {
    const startDeg = i * 36;
    const endDeg = (i + 1) * 36;
    return `${c} ${startDeg}deg ${endDeg}deg`;
  }).join(', ')})`;

  return (
    <>
      <style>
        {`
          .wheel {
            transition: transform 4s cubic-bezier(0.33, 1, 0.68, 1);
          }
        `}
      </style>
      <div style={{ textAlign: 'center', margin: '20px' }}>
        {/* Wrapper for the wheel with relative positioning */}
        <div style={{ position: 'relative', width: '300px', height: '300px', margin: '0 auto' }}>
          <div 
            className="wheel"
            onClick={spinWheel}
            onTransitionEnd={onTransitionEnd}
            style={{
              width: '300px',
              height: '300px',
              borderRadius: '50%',
              background: gradientString,
              transform: `rotate(${rotation}deg)`,
              cursor: spinning ? 'default' : 'pointer'
            }}
          />
          {/* Centered icon */}
          <img 
            src="/sisterlyIconUpdate.png" 
            alt="Sisterly Icon" 
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '160px'
            }}
          />
        </div>
        <p style={{ marginTop: '10px' }}>Click the wheel to spin!</p>
        <p>Accept the Sisterly Support Challenge if you want!</p>
      </div>

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
    </>
  );
};

export default SisterlySupportSpinner;