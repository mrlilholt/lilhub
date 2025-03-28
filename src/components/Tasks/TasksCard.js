// src/components/Tasks/TasksCard.js

import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, addDoc, onSnapshot, query, orderBy, deleteDoc, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { FaTrashAlt, FaStar } from 'react-icons/fa'; // Import the trash and star icons from react-icons
import '../../styles/TasksCard.css';

const TasksCard = () => {
  // ...existing state declarations...
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [category, setCategory] = useState('');
  const [difficulty, setDifficulty] = useState(1);
  const [assignedTo, setAssignedTo] = useState('');
  const [repeatDaily, setRepeatDaily] = useState(false); // New state for repeat option
  const [tasks, setTasks] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [detailedModalOpen, setDetailedModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [completedTasks, setCompletedTasks] = useState({});
  const [points, setPoints] = useState({});
  const [repeatConfirmOpen, setRepeatConfirmOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);

  const familyMembers = ['Mira', 'Shea', 'Daddy', 'Mommy'];

  const memberIcons = {
    Mira: '/miraIcon.png',
    Shea: '/sheaIcon.png',
    Daddy: '/daddyIcon.png',
    Mommy: '/mommyIcon.png'
  };

  useEffect(() => {
    const loadPoints = async () => {
      try {
        const scoresRef = doc(db, 'points', 'scores');
        const scoresSnap = await getDoc(scoresRef);
        if (scoresSnap.exists()) {
          setPoints(scoresSnap.data());
        } else {
          const initialScores = { Mira: 0, Shea: 0, Daddy: 0, Mommy: 0 };
          await setDoc(scoresRef, initialScores);
          setPoints(initialScores);
        }
      } catch (error) {
        console.error('Error loading scores:', error);
      }
    };
    loadPoints();
  }, []);

  useEffect(() => {
    const pointsRef = doc(db, 'points', 'scores');
    const unsubscribe = onSnapshot(pointsRef, (docSnap) => {
      if (docSnap.exists()) {
        setPoints(docSnap.data());
      } else {
        setPoints({});
      }
    });
    return () => unsubscribe();
  }, []);

  const openModalFor = (member) => {
    setAssignedTo(member);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setTitle('');
    setDueDate('');
    setPriority('Medium');
    setCategory('');
    setDifficulty(1);
    setAssignedTo('');
    setRepeatDaily(false); // Reset repeat flag
  };

  const openDetailedModalFor = (member) => {
    setSelectedMember(member);
    setDetailedModalOpen(true);
  };

  const closeDetailedModal = () => {
    setDetailedModalOpen(false);
    setSelectedMember(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !assignedTo) return;

    try {
      await addDoc(collection(db, 'tasks'), {
        title,
        dueDate: dueDate ? new Date(dueDate) : null,
        priority: priority || null,
        category: category || null,
        difficulty: difficulty ? Number(difficulty) : null,
        assignedTo,
        repeatDaily, // Store the repeat flag
        createdAt: new Date()
      });
      closeModal();
    } catch (error) {
      console.error('Error adding task:', error);
    }
  };

  useEffect(() => {
    const tasksQuery = query(collection(db, 'tasks'), orderBy('dueDate', 'asc'));
    const unsubscribe = onSnapshot(tasksQuery, (snapshot) => {
      const tasksData = [];
      snapshot.forEach((docSnap) => {
        tasksData.push({ id: docSnap.id, ...docSnap.data() });
      });
      setTasks(tasksData);
    });
    return () => unsubscribe();
  }, []);

  const handleDelete = async (taskId) => {
    try {
      const taskDoc = tasks.find(t => t.id === taskId);
      if (taskDoc.repeatDaily) {
        // Instead of using window.confirm, open a custom confirm modal.
        setSelectedTask(taskDoc);
        setRepeatConfirmOpen(true);
      } else {
        await deleteDoc(doc(db, 'tasks', taskId));
      }
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  // Called when user clicks "Keep" (meaning: keep the repeat, delete current instance and schedule tomorrow)
  const handleConfirmKeep = async () => {
    try {
      // Delete the current instance.
      await deleteDoc(doc(db, 'tasks', selectedTask.id));
      // Calculate tomorrow's due date.
      let newDueDate;
      if (selectedTask.dueDate) {
        newDueDate = new Date(selectedTask.dueDate.seconds * 1000);
        newDueDate.setDate(newDueDate.getDate() + 1);
      } else {
        newDueDate = new Date();
        newDueDate.setDate(newDueDate.getDate() + 1);
      }
      // Add a new repeating task for tomorrow.
      await addDoc(collection(db, 'tasks'), {
        title: selectedTask.title,
        dueDate: newDueDate,
        priority: selectedTask.priority,
        category: selectedTask.category,
        difficulty: selectedTask.difficulty,
        assignedTo: selectedTask.assignedTo,
        repeatDaily: true,
        createdAt: new Date()
      });
    } catch (error) {
      console.error('Error keeping repeating task:', error);
    } finally {
      setRepeatConfirmOpen(false);
      setSelectedTask(null);
    }
  };

  // Called when user clicks "Delete" (permanently delete the task)
  const handleConfirmDelete = async () => {
    try {
      await deleteDoc(doc(db, 'tasks', selectedTask.id));
    } catch (error) {
      console.error('Error permanently deleting task:', error);
    } finally {
      setRepeatConfirmOpen(false);
      setSelectedTask(null);
    }
  };

  const handleTaskCheckbox = async (taskId, member) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    
    // Determine whether the task is currently marked as completed
    const isCompleted = completedTasks[taskId];
    // Toggle the completed state
    const newCompleted = !isCompleted;
    setCompletedTasks(prev => ({ ...prev, [taskId]: newCompleted }));
    
    // For daily challenge tasks, use the pointValue; for others, use the difficulty (or 0 if not set)
    const pointsToUpdate = task.dailyChallenge ? (task.pointValue || 0) : (task.difficulty || 0);
    
    // Update the score only when the task is checked off (or unchecked, subtracting points)
    let updatedScore = points[member] || 0;
    if (newCompleted) {
      updatedScore += pointsToUpdate;
    } else {
      updatedScore -= pointsToUpdate;
    }
    
    try {
      // Update Firestore with the new score.
      await updateDoc(doc(db, 'points', 'scores'), { [member]: updatedScore });
      // Update local state.
      setPoints(prev => ({ ...prev, [member]: updatedScore }));
    } catch (error) {
      console.error("Error updating score for", member, error);
    }
  };

  const resetPointsForMember = async (member) => {
    try {
      await updateDoc(doc(db, 'points', 'scores'), { [member]: 0 });
      setPoints(prevPoints => ({
        ...prevPoints,
        [member]: 0
      }));
    } catch (error) {
      console.error("Error resetting points for", member, error);
    }
  };

  const tasksByMember = {};
  familyMembers.forEach(member => {
    tasksByMember[member] = tasks.filter(task => task.assignedTo === member);
  });

  return (
    <div className="tasks-card">
      <img 
        src="/tasksLogo.png" 
        alt="Tasks Logo" 
        style={{ height: '60px', marginBottom: '20px' }} 
      />
      <div className="add-task-buttons" style={{ display: 'flex', justifyContent: 'space-around', marginBottom: '20px' }}>
        {familyMembers.map(member => (
          <div key={`container-${member}`} style={{ display: 'flex', alignItems: 'center' }}>
            <img 
              src={memberIcons[member]} 
              alt={`${member} Icon`} 
              style={{ height: '30px', marginRight: '5px' }} // icon height updated here
            />
            <button onClick={() => openModalFor(member)}>
              Add Task for {member}
            </button>
          </div>
        ))}
      </div>

      {/* Removed inline styles so that the CSS file can control layout */}
      <div className="tasks-grid">
        {familyMembers.map(member => (
          <div key={`grid-${member}`} className="member-tasks" style={{ border: '1px solid #ccc', padding: '10px', borderRadius: '8px' }}>
            <h4 style={{ textAlign: 'center', marginBottom: '10px' }}>
              {member} <FaStar style={{ color: 'gold' }} /> {points[member] || 0}
            </h4>
            <ul className="task-list" style={{ listStyle: 'none', padding: 0, width: '100%' }}>
              {tasksByMember[member].length > 0 ? (
                tasksByMember[member].map(task => (
                  <li key={task.id} className="task-item" style={{ display: 'flex', alignItems: 'center', marginBottom: '10px', padding: '5px', borderRadius: '4px', backgroundColor: '#f9f9f9', width: '100%' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flex: 1 }}>
                      <div style={{ flex: '0 0 auto' }}>
                        <input
                          type="checkbox"
                          checked={!!completedTasks[task.id]}
                          onChange={() => handleTaskCheckbox(task.id, member)}
                          style={{ marginRight: '10px' }}
                        />
                      </div>
                      <div style={{ flex: '1 1 auto', wordWrap: 'break-word' }}>
                        <span style={{ textDecoration: completedTasks[task.id] ? 'line-through' : 'none' }}>
                          <strong>{task.title}</strong>
                        </span>
                      </div>
                      <div style={{ flex: '0 0 auto' }}>
                        <button onClick={() => handleDelete(task.id)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                          <FaTrashAlt style={{ color: 'red' }} />
                        </button>
                      </div>
                    </div>
                  </li>
                ))
              ) : (
                <li style={{ textAlign: 'center', color: '#999' }}>No tasks assigned.</li>
              )}
            </ul>
            <button onClick={() => openDetailedModalFor(member)} style={{ marginTop: '10px', display: 'block', width: '100%' }}>
              Detailed List
            </button>
            {/* Reset Points button now at the bottom of each card */}
            <button onClick={() => resetPointsForMember(member)} style={{ marginTop: '10px', display: 'block', width: '100%' }}>
              Reset Points
            </button>
          </div>
        ))}
      </div>
      {/* Detailed List Modal */}
      {detailedModalOpen && selectedMember && (
        <div
          className="modal-overlay"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}
        >
          <div 
            className="modal-content" 
            style={{
              backgroundColor: 'white',
              padding: '20px',
              borderRadius: '4px',
              maxWidth: '600px',
              width: '100%'
            }}
          >
            <h3>{selectedMember}'s Detailed Task List</h3>
            <ul className="task-list" style={{ listStyle: 'none', padding: 0 }}>
              {tasksByMember[selectedMember].length > 0 ? (
                tasksByMember[selectedMember].map(task => (
                  <li key={task.id} className="task-item" style={{ marginBottom: '10px', padding: '10px', borderRadius: '4px', backgroundColor: '#f9f9f9' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <strong>{task.title}</strong>
                        <div className="task-attributes" style={{ fontSize: '0.8em', color: '#555' }}>
                          Due: {task.dueDate ? new Date(task.dueDate.seconds * 1000).toLocaleDateString() : 'N/A'}
                          <br />
                          Priority: {task.priority || 'N/A'} | Category: {task.category || 'N/A'} | Difficulty: {task.difficulty || 'N/A'}
                        </div>
                      </div>
                      <button 
                        onClick={() => handleDelete(task.id)} 
                        style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                      >
                        <FaTrashAlt style={{ color: 'red' }} />
                      </button>
                    </div>
                  </li>
                ))
              ) : (
                <li style={{ textAlign: 'center', color: '#999' }}>No tasks assigned.</li>
              )}
            </ul>
            <button onClick={closeDetailedModal} style={{ marginTop: '20px', width: '100%' }}>
              Close
            </button>
          </div>
        </div>
      )}

      {/* Modal for Adding Task (if needed) */}
      {modalOpen && (
        <div
          className="modal-overlay"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}
        >
          <div className="modal-content" style={{ backgroundColor: 'white', padding: '20px', borderRadius: '4px' }}>
            <h3>Add Task</h3>
            <form onSubmit={handleSubmit}>
              <div>
                <label>
                  Title:
                  <input type="text" value={title} onChange={e => setTitle(e.target.value)} required />
                </label>
              </div>
              <div>
                <label>
                  Due Date:
                  <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
                </label>
              </div>
              <div>
                <label>
                  Priority:
                  <select value={priority} onChange={e => setPriority(e.target.value)}>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </label>
              </div>
              <div>
                <label>
                  Category:
                  <input type="text" value={category} onChange={e => setCategory(e.target.value)} placeholder="Optional" />
                </label>
              </div>
              <div>
                <label>
                  Difficulty (1-5):
                  <input type="number" value={difficulty} min="1" max="5" onChange={e => setDifficulty(e.target.value)} />
                </label>
              </div>
              <div>
                <label>
                  Assigned To:
                  <select value={assignedTo} onChange={e => setAssignedTo(e.target.value)} required>
                    <option value="">Select a family member</option>
                    {familyMembers.map(member => (
                      <option key={member} value={member}>
                        {member}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div>
                <label>
                  <input 
                    type="checkbox" 
                    checked={repeatDaily} 
                    onChange={e => setRepeatDaily(e.target.checked)} 
                  />{' '}
                  Repeat Task Daily
                </label>
              </div>
              <button type="submit">Add Task</button>
              <button type="button" onClick={closeModal}>Cancel</button>
            </form>
          </div>
        </div>
      )}

      {/* Custom Confirmation Modal for repeating tasks */}
      {repeatConfirmOpen && selectedTask && (
        <div
          className="modal-overlay"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}
        >
          <div
            className="modal-content"
            style={{
              backgroundColor: 'white',
              padding: '20px',
              borderRadius: '4px',
              maxWidth: '400px',
              width: '100%'
            }}
          >
            <p>
              This is a repeating task. Would you like to <strong>Delete</strong> it permanently or <strong>Keep</strong> it (delete it for today and schedule it for tomorrow)?
            </p>
            <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: '20px' }}>
              <button onClick={handleConfirmDelete} style={{ padding: '10px 20px' }}>
                Delete
              </button>
              <button onClick={handleConfirmKeep} style={{ padding: '10px 20px' }}>
                Keep
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TasksCard;
