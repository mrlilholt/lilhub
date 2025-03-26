import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';

const familyMembers = [
  { name: 'Mira', icon: '/miraIcon.png' },
  { name: 'Shea', icon: '/sheaIcon.png' },
  { name: 'Daddy', icon: '/daddyIcon.png' },
  { name: 'Mommy', icon: '/mommyIcon.png' }
];

const TaskLeaderboard = () => {
  const [tasks, setTasks] = useState([]);
  const [points, setPoints] = useState({});

  // Listen for realtime updates from the tasks collection
  useEffect(() => {
    const q = query(collection(db, 'tasks'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const tasksData = [];
      querySnapshot.forEach((doc) => {
        tasksData.push({ id: doc.id, ...doc.data() });
      });
      setTasks(tasksData);
    });
    return () => unsubscribe();
  }, []);

  // Load points from Firestore
  useEffect(() => {
    const loadPoints = async () => {
      try {
        const scoresRef = doc(db, 'points', 'scores');
        const scoresSnap = await getDoc(scoresRef);
        if (scoresSnap.exists()) {
          setPoints(scoresSnap.data());
        }
      } catch (error) {
        console.error('Error loading scores:', error);
      }
    };
    loadPoints();
  }, []);

  const computeMetrics = (memberName) => {
    // Use points state to compute total stars for a member
    const totalStars = points[memberName] || 0;
    // Display stars as x:200 instead of 200 - x
    return { totalStars };
  };

  // Calculate total family stars by summing over each member's stars
  const totalFamilyStars = familyMembers.reduce((sum, member) => {
    return sum + (points[member.name] || 0);
  }, 0);
  // Compute progress percent for the family bar based on a goal of 200 stars
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
              {/* Progress Bar placed directly after stars display */}
              <div style={{ width: '200px', height: '20px', backgroundColor: '#eee', borderRadius: '10px', overflow: 'hidden', marginTop: '5px' }}>
                <div style={{ width: `${progressPercent}%`, height: '100%', backgroundColor: '#4caf50' }}></div>
              </div>
            </div>
          </div>
        );
      })}
      {/* Total Family Stars Bar */}
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