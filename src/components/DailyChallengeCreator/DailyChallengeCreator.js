import React, { useState, useEffect } from 'react';
import { doc, collection, getDoc, setDoc, addDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';

// Define your family members and their icons
const familyMembers = ['Mira', 'Shea', 'Daddy', 'Mommy'];
const memberIcons = {
  Mira: '/miraIcon.png',
  Shea: '/sheaIcon.png',
  Daddy: '/daddyIcon.png',
  Mommy: '/mommyIcon.png'
};

// Prefill challenge options by day
const prefillChallengeOptions = {
  Monday: {
    title: "Motivation Monday",
    options: [
      "Morning Mantra – Everyone says or writes a positive phrase to start the day.",
      "Marvelous Message – Write/draw a kind note for someone in the family.",
      "Mini Mission – Choose one thing to help someone else today without being asked.",
      "Mindful Minute – Sit quietly and breathe together for 1 minute.",
      "Motivator Moment – Cheer someone on during their task or challenge."
    ]
  },
  Tuesday: {
    title: "Tidy-Up Tuesday",
    options: [
      "Ten-Minute Tidy – Clean up any space together for 10 minutes (music helps!).",
      "Toy/Treasure Tidy – Pick 3 toys or items to organize or donate.",
      "Tabletop Task – Wipe down a table or surface as a team.",
      "Tiny Trash Trot – Find and throw away or recycle 5 pieces of trash around the house.",
      "Teamroom Transformation – Pick one room to all clean or reset together."
    ]
  },
  Wednesday: {
    title: "Wisdom Wednesday",
    options: [
      "Wonder Word – Learn and share a new word with the family.",
      "What-If Question – Ask a fun “What if…” question and take turns answering.",
      "Wise Walk – Go on a short walk and each point out something new.",
      "Wacky Fact – Share a silly or surprising fact you learned.",
      "World Explorer – Pick a place on the map/globe and learn one thing about it."
    ]
  },
  Thursday: {
    title: "Thoughtful Thursday",
    options: [
      "Thank-You Thursday – Make or say a thank-you to someone in or outside the house.",
      "Thoughtful Art – Create a drawing or craft for a family member.",
      "Three Cheers – Celebrate someone’s accomplishment big or small.",
      "Tiny Treat Task – Help prepare or serve a snack or treat for someone else.",
      "Together Time Token – Offer someone a “together time” card (play, read, help, etc.)."
    ]
  },
  Friday: {
    title: "Fitness Friday",
    options: [
      "Family Freeze Dance – Put on music and dance until it stops!",
      "Fitness Find – Pick a room and invent an exercise using something in it.",
      "Follow-the-Leader Fun – Take turns leading short silly movement routines.",
      "Five-Minute Move – Everyone moves non-stop for 5 minutes (run, jump, crawl!).",
      "Fitness Fort – Build a fort and do stretches or exercises inside."
    ]
  },
  Saturday: {
    title: "Strategy Saturday",
    options: [
      "Story Switcheroo – One person starts a story, others take turns adding to it.",
      "Sort & Stack – Pick a bin or drawer and sort/organize it together.",
      "Silly Scavenger – Create or follow a mini scavenger hunt indoors.",
      "Smart Snack Plan – As a team, plan and prep one healthy snack.",
      "Solve-It Saturday – Do a puzzle, game, or brainteaser together."
    ]
  },
  Sunday: {
    title: "Soulful Sunday",
    options: [
      "Sweet Memory Share – Each person shares a happy memory from the week.",
      "Snuggle & Story – Read or make up a story together.",
      "Soulful Stroll – Go on a mindful walk or explore outside quietly.",
      "Silent Snuggle Space – Create a cozy spot and relax together (books, music, etc.).",
      "Sunshine Shout-Out – Give someone a compliment or shout-out for being awesome."
    ]
  }
};

// Helper function to get day name from a date string (YYYY-MM-DD)
const getDayName = (dateStr) => {
  // Append T00:00:00 to force local midnight interpretation
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString('en-US', { weekday: 'long' });
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
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editFormState, setEditFormState] = useState({
    title: '',
    description: '',
    pointValue: '',
    startTime: '',
    endTime: ''
  });
  // New state for prefill selection
  const [selectedPrefillOption, setSelectedPrefillOption] = useState('');

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

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (e) => {
    setDate(e.target.value);
    // When date changes, auto-set the prefill option to the first option for that day, if available.
    const dayName = getDayName(e.target.value);
    if (prefillChallengeOptions[dayName]) {
      setSelectedPrefillOption(prefillChallengeOptions[dayName].options[0]);
    } else {
      setSelectedPrefillOption('');
    }
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

  // Function to prefill the form based on the selected date's day-of-week options
  const prefillForm = () => {
    const dayName = getDayName(date);
    if (prefillChallengeOptions[dayName]) {
      setFormState((prev) => ({
        ...prev,
        title: prefillChallengeOptions[dayName].title,
        description: selectedPrefillOption
      }));
    }
  };

  return (
    <div style={{ marginTop: '40px', borderTop: '2px solid #ccc', paddingTop: '20px' }}>
      <button onClick={() => setModalOpen(true)}>Create Daily Challenge</button>
      
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
            <div style={{ marginBottom: '10px' }}>
              <label>
                Date (YYYY-MM-DD):
                <input type="date" value={date} onChange={handleDateChange} required style={{ marginLeft: '10px' }}/>
              </label>
            </div>
            {/* Prefill Section: Shown if a date is selected and there is a matching day */}
            {date && prefillChallengeOptions[getDayName(date)] && (
              <div style={{ marginBottom: '10px' }}>
                <h4>{prefillChallengeOptions[getDayName(date)].title} Prefill Options</h4>
                <select 
                  value={selectedPrefillOption} 
                  onChange={e => setSelectedPrefillOption(e.target.value)} 
                  style={{ marginLeft: '10px', width: '100%' }}
                >
                  {prefillChallengeOptions[getDayName(date)].options.map((option, idx) => (
                    <option key={idx} value={option}>{option.split(' – ')[0]}</option>
                  ))}
                </select>
                <button type="button" onClick={prefillForm} style={{ marginTop: '5px' }}>Prefill Challenge</button>
              </div>
            )}
            <form onSubmit={handleCreateChallenge}>
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
          <button onClick={openEditModal} style={{ marginTop: '20px' }}>
            Edit Challenge
          </button>
        </div>
      )}
    </div>
  );
};

export default DailyChallengeCreator;