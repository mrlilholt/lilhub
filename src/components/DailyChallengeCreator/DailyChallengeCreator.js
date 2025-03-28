import React, { useState, useEffect } from 'react';
import { doc, collection, getDoc, getDocs, setDoc, addDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';

// Define your family members and their icons
const familyMembers = ['Mira', 'Shea', 'Daddy', 'Mommy'];
const memberIcons = {
  Mira: '/miraIcon.png',
  Shea: '/sheaIcon.png',
  Daddy: '/daddyIcon.png',
  Mommy: '/mommyIcon.png'
};

// Helper function to format time to am/pm
const formatTime = (timeStr) => {
  const [hour, minute] = timeStr.split(':');
  let h = parseInt(hour, 10);
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${minute} ${ampm}`;
};

// Helper function to check if the challenge has expired
const isChallengeExpired = (challenge) => {
  if (!challenge || !challenge.date || !challenge.endTime) return false;
  const challengeEnd = new Date(challenge.date + 'T' + challenge.endTime + ':00');
  return new Date() > challengeEnd;
};

const DailyChallengeCreator = () => {
  // Form state for new challenge
  const [formState, setFormState] = useState({
    title: '',
    description: '',
    pointValue: '',
    startTime: '',
    endTime: ''
  });
  const [date, setDate] = useState('');
  const [challenge, setChallenge] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [showAllChallenges, setShowAllChallenges] = useState(false);
  const [allChallenges, setAllChallenges] = useState([]);
  // New edit modal state and form state for editing current challenge
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editFormState, setEditFormState] = useState({
    title: '',
    description: '',
    pointValue: '',
    startTime: '',
    endTime: ''
  });

  useEffect(() => {
    if (!date) return;
    const challengeRef = doc(db, 'dailyChallenges', date);
    getDoc(challengeRef)
      .then((docSnap) => {
        if (docSnap.exists()) {
          setChallenge(docSnap.data());
        } else {
          setChallenge(null);
        }
      })
      .catch((err) => console.error('Error fetching daily challenge:', err));
  }, [date]);

  const fetchAllChallenges = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'dailyChallenges'));
      const challengesArray = [];
      querySnapshot.forEach((doc) => {
        challengesArray.push({ id: doc.id, ...doc.data() });
      });
      setAllChallenges(challengesArray);
      setShowAllChallenges(true);
    } catch (error) {
      console.error('Error fetching all challenges:', error);
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (e) => {
    setDate(e.target.value);
  };

  const handleCreateChallenge = async (e) => {
    e.preventDefault();
    if (!date) return alert('Please select a date for the challenge.');
    try {
      const challengeRef = doc(db, 'dailyChallenges', date);
      await setDoc(challengeRef, {
        title: formState.title,
        description: formState.description,
        pointValue: parseInt(formState.pointValue, 10),
        startTime: formState.startTime,
        endTime: formState.endTime,
        date,
        createdAt: serverTimestamp()
      });
      setChallenge({
        title: formState.title,
        description: formState.description,
        pointValue: parseInt(formState.pointValue, 10),
        startTime: formState.startTime,
        endTime: formState.endTime,
        date
      });
      setFormState({ title: '', description: '', pointValue: '', startTime: '', endTime: '' });
      alert('Daily challenge created for ' + date);
      setModalOpen(false);
    } catch (error) {
      console.error('Error creating daily challenge:', error);
      alert('Failed to create challenge.');
    }
  };

  // Accept challenge function remains unchanged:
  const handleAcceptChallenge = async (member) => {
    if (!challenge) return;
    try {
      await addDoc(collection(db, 'tasks'), {
        title: challenge.title,
        description: challenge.description,
        dueDate: challenge.date ? new Date(challenge.date) : null,
        pointValue: challenge.pointValue,
        dailyChallenge: true,
        assignedTo: member,
        completed: false,
        createdAt: serverTimestamp()
      });
      alert(`${member} accepted the challenge!`);
    } catch (err) {
      console.error('Error accepting daily challenge:', err);
      alert('Error accepting challenge.');
    }
  };

  // Functions for editing the current challenge
  const openEditModal = () => {
    setEditFormState({
      title: challenge.title,
      description: challenge.description,
      pointValue: challenge.pointValue.toString(),
      startTime: challenge.startTime,
      endTime: challenge.endTime
    });
    setEditModalOpen(true);
  };

  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    setEditFormState((prev) => ({ ...prev, [name]: value }));
  };

  const handleUpdateChallenge = async (e) => {
    e.preventDefault();
    if (!date) return alert('No challenge date');
    try {
      const challengeRef = doc(db, 'dailyChallenges', date);
      await setDoc(challengeRef, {
        title: editFormState.title,
        description: editFormState.description,
        pointValue: parseInt(editFormState.pointValue, 10),
        startTime: editFormState.startTime,
        endTime: editFormState.endTime,
        date,
        createdAt: serverTimestamp()
      });
      setChallenge({
        title: editFormState.title,
        description: editFormState.description,
        pointValue: parseInt(editFormState.pointValue, 10),
        startTime: editFormState.startTime,
        endTime: editFormState.endTime,
        date
      });
      alert("Challenge updated");
      setEditModalOpen(false);
    } catch (err) {
      console.error('Error updating challenge:', err);
      alert("Error updating challenge");
    }
  };

  const handleDeleteChallenge = async () => {
    if (!date) return;
    try {
      await deleteDoc(doc(db, 'dailyChallenges', date));
      setChallenge(null);
      alert("Challenge deleted");
    } catch (err) {
      console.error('Error deleting challenge:', err);
      alert("Error deleting challenge");
    }
  };

  return (
    <div style={{ marginTop: '40px', borderTop: '2px solid #ccc', paddingTop: '20px' }}>
      {/* Buttons for creating and viewing all challenges */}
      <button onClick={() => setModalOpen(true)}>Create Daily Challenge</button>
      <button onClick={fetchAllChallenges} style={{ marginLeft: '10px' }}>Show All Daily Challenges</button>

      {/* Modal for creating a new challenge */}
      {modalOpen && (
        <div className="modal-overlay" 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000
          }}
        >
          <div className="modal-content" 
            style={{
              backgroundColor: '#fff',
              padding: '20px',
              borderRadius: '4px',
              maxWidth: '400px',
              width: '90%'
            }}
          >
            <button onClick={() => setModalOpen(false)} style={{ float: 'right' }}>X</button>
            <h3>Create Daily Challenge</h3>
            <form onSubmit={handleCreateChallenge}>
              {/* Form inputs ... */}
              <div style={{ marginBottom: '10px' }}>
                <label>
                  Date (YYYY-MM-DD):
                  <input type="date" value={date} onChange={handleDateChange} required style={{ marginLeft: '10px' }}/>
                </label>
              </div>
              <div style={{ marginBottom: '10px' }}>
                <label>
                  Title:
                  <input type="text" name="title" value={formState.title} onChange={handleFormChange} required style={{ marginLeft: '10px' }}/>
                </label>
              </div>
              <div style={{ marginBottom: '10px' }}>
                <label>
                  Description:
                  <textarea name="description" value={formState.description} onChange={handleFormChange} required style={{ marginLeft: '10px', verticalAlign: 'top' }}/>
                </label>
              </div>
              <div style={{ marginBottom: '10px' }}>
                <label>
                  Point Value:
                  <input type="number" name="pointValue" value={formState.pointValue} onChange={handleFormChange} required style={{ marginLeft: '10px' }}/>
                </label>
              </div>
              <div style={{ marginBottom: '10px' }}>
                <label>
                  Start Time:
                  <input type="time" name="startTime" value={formState.startTime} onChange={handleFormChange} required style={{ marginLeft: '10px' }}/>
                </label>
              </div>
              <div style={{ marginBottom: '10px' }}>
                <label>
                  End Time:
                  <input type="time" name="endTime" value={formState.endTime} onChange={handleFormChange} required style={{ marginLeft: '10px' }}/>
                </label>
              </div>
              <button type="submit">Create Challenge</button>
            </form>
          </div>
        </div>
      )}

      {/* Modal for editing the current challenge */}
      {editModalOpen && (
        <div className="modal-overlay" 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1100
          }}
        >
          <div className="modal-content" 
            style={{
              backgroundColor: '#fff',
              padding: '20px',
              borderRadius: '4px',
              maxWidth: '400px',
              width: '90%'
            }}
          >
            <button onClick={() => setEditModalOpen(false)} style={{ float: 'right' }}>X</button>
            <h3>Edit Daily Challenge</h3>
            <form onSubmit={handleUpdateChallenge}>
              <div style={{ marginBottom: '10px' }}>
                <label>
                  Title:
                  <input type="text" name="title" value={editFormState.title} onChange={handleEditFormChange} required style={{ marginLeft: '10px' }}/>
                </label>
              </div>
              <div style={{ marginBottom: '10px' }}>
                <label>
                  Description:
                  <textarea name="description" value={editFormState.description} onChange={handleEditFormChange} required style={{ marginLeft: '10px', verticalAlign: 'top' }}/>
                </label>
              </div>
              <div style={{ marginBottom: '10px' }}>
                <label>
                  Point Value:
                  <input type="number" name="pointValue" value={editFormState.pointValue} onChange={handleEditFormChange} required style={{ marginLeft: '10px' }}/>
                </label>
              </div>
              <div style={{ marginBottom: '10px' }}>
                <label>
                  Start Time:
                  <input type="time" name="startTime" value={editFormState.startTime} onChange={handleEditFormChange} required style={{ marginLeft: '10px' }}/>
                </label>
              </div>
              <div style={{ marginBottom: '10px' }}>
                <label>
                  End Time:
                  <input type="time" name="endTime" value={editFormState.endTime} onChange={handleEditFormChange} required style={{ marginLeft: '10px' }}/>
                </label>
              </div>
              <button type="submit">Update Challenge</button>
              <button type="button" onClick={handleDeleteChallenge} style={{ marginLeft: '10px' }}>
                Delete Challenge
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal to display all challenges */}
      {showAllChallenges && (
        <div className="modal-overlay" 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1100
          }}
        >
          <div className="modal-content" 
            style={{
              backgroundColor: '#fff',
              padding: '20px',
              borderRadius: '4px',
              maxWidth: '600px',
              width: '90%',
              maxHeight: '80vh',
              overflowY: 'auto'
            }}
          >
            <button onClick={() => setShowAllChallenges(false)} style={{ float: 'right' }}>X</button>
            <h3>All Daily Challenges</h3>
            {allChallenges.length > 0 ? (
              allChallenges.map(chal => (
                <div key={chal.id} style={{ borderBottom: '1px solid #ccc', padding: '10px 0' }}>
                  <h4>{chal.title} - {chal.date}</h4>
                  <p>{chal.description}</p>
                  <p>Points: {chal.pointValue}</p>
                  <p>Time Frame: {chal.startTime} - {chal.endTime}</p>
                </div>
              ))
            ) : (
              <p>No daily challenges found.</p>
            )}
          </div>
        </div>
      )}

      {/* Display the current challenge if exists and is not expired */}
      {challenge && !isChallengeExpired(challenge) && (
        <div
          style={{
            background: '#f8f8f8',
            padding: '15px',
            borderRadius: '4px',
            marginTop: '20px',
            textAlign: 'center'
          }}
        >
          <div style={{ overflow: 'hidden', whiteSpace: 'nowrap', boxSizing: 'border-box', marginBottom: '10px' }}>
            <div
              style={{
                display: 'inline-block',
                paddingLeft: '100%',
                animation: 'scroll-text 20s linear infinite',
                fontSize: '20px',
                fontWeight: 'bold'
              }}
            >
              {new Date(challenge.date + 'T12:00:00').toLocaleDateString(undefined, { weekday: 'long' })}'s Daily Challenge
            </div>
          </div>
          <h1 style={{ margin: '10px 0' }}>{challenge.title}</h1>
          <p style={{ fontSize: '16px' }}>{challenge.description}</p>
          <p style={{ fontSize: '16px', fontWeight: 'bold' }}>Points: {challenge.pointValue}</p>
          <p style={{ fontSize: '16px' }}>
            Time Frame: {formatTime(challenge.startTime)} - {formatTime(challenge.endTime)}
          </p>
          <p style={{ marginTop: '20px', fontWeight: 'bold' }}>
            Select a family member by clicking their icon to accept this challenge:
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '20px' }}>
            {familyMembers.map((member) => (
              <div key={member} style={{ textAlign: 'center' }}>
                <div style={{ marginBottom: '5px', fontWeight: 'bold' }}>{member}</div>
                <button onClick={() => handleAcceptChallenge(member)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                  <img
                    src={memberIcons[member]}
                    alt={`${member} Icon`}
                    style={{ height: '60px', width: '60px' }}
                  />
                </button>
              </div>
            ))}
          </div>
          {/* Edit button */}
          <button onClick={openEditModal} style={{ marginTop: '20px' }}>
            Edit Challenge
          </button>
        </div>
      )}
    </div>
  );
};

export default DailyChallengeCreator;