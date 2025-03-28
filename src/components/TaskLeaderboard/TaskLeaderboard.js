import React, { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';

const familyMembers = [
  { name: 'Mira', icon: '/miraIcon.png' },
  { name: 'Shea', icon: '/sheaIcon.png' },
  { name: 'Daddy', icon: '/daddyIcon.png' },
  { name: 'Mommy', icon: '/mommyIcon.png' }
];

const TaskLeaderboard = () => {
  const [points, setPoints] = useState({});

  // Real-time listener for points
  useEffect(() => {
    const scoresRef = doc(db, 'points', 'scores');
    const unsubscribe = onSnapshot(scoresRef, (docSnap) => {
      if (docSnap.exists()) {
        setPoints(docSnap.data());
      } else {
        setPoints({});
      }
    });
    return () => unsubscribe();
  }, []);

  const computeMetrics = (memberName) => {
    const totalStars = points[memberName] || 0;
    return { totalStars };
  };

  const totalFamilyStars = familyMembers.reduce((sum, member) => {
    return sum + (points[member.name] || 0);
  }, 0);
  const familyProgressPercent = Math.min((totalFamilyStars / 200) * 100, 100);

  return (
    <div className="card" style={{ marginTop: '20px' }}>
      <h3>Task Completion!</h3>
      {familyMembers.map(member => {
        const { totalStars } = computeMetrics(member.name);
        const progressPercent = Math.min((totalStars / 200) * 100, 100);
        
        return (
          <div key={member.name} style={{ display: 'flex', alignItems: 'center', marginBottom: '15px', borderBottom: '1px solid #ccc', paddingBottom: '10px' }}>
            <img src={member.icon} alt={`${member.name} Icon`} style={{ height: '60px', marginRight: '10px' }} />
            <div>
              <strong>{member.name}</strong>
              <div>Total Stars: {totalStars} : 200</div>
              <div style={{ width: '200px', height: '20px', backgroundColor: '#eee', borderRadius: '10px', overflow: 'hidden', marginTop: '5px' }}>
                <div style={{ width: `${progressPercent}%`, height: '100%', backgroundColor: '#4caf50' }}></div>
              </div>
            </div>
          </div>
        );
      })}
      <div style={{ marginTop: '20px', paddingTop: '10px', borderTop: '2px solid #ccc' }}>
        <strong>Total Family Stars</strong>
        <div>Total: {totalFamilyStars} : 200</div>
        <div style={{ width: '200px', height: '20px', backgroundColor: '#eee', borderRadius: '10px', overflow: 'hidden', marginTop: '5px' }}>
          <div style={{ width: `${familyProgressPercent}%`, height: '100%', backgroundColor: '#2196F3' }}></div>
        </div>
      </div>
    </div>
  );
};

export default TaskLeaderboard;