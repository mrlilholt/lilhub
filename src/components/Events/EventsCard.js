import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, addDoc, onSnapshot, query, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { FaTrashAlt } from 'react-icons/fa'; // Import trashcan icon

const EventsCard = () => {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState(''); // optional time state
  const [description, setDescription] = useState('');
  const [events, setEvents] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);

  const openModal = () => {
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setTitle('');
    setDate('');
    setTime('');
    setDescription('');
  };

  // Helper function to convert "HH:mm" to AM/PM format
  const formatTime = (timeStr) => {
    if(!timeStr) return '';
    const [hour, minute] = timeStr.split(':');
    let hrs = parseInt(hour, 10);
    const ampm = hrs >= 12 ? 'PM' : 'AM';
    hrs = hrs % 12 || 12;
    return `${hrs}:${minute} ${ampm}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !date) return;
    try {
      // Parse the date as local time
      const [year, month, day] = date.split('-');
      const localDate = new Date(year, month - 1, day);
      await addDoc(collection(db, 'events'), {
        title,
        date: localDate, // use localDate instead of new Date(date)
        time: time || null,
        description,
        createdAt: new Date()
      });
      closeModal();
    } catch (error) {
      console.error('Error adding event:', error);
    }
  };

  const handleDeleteEvent = async (eventId) => {
    try {
      await deleteDoc(doc(db, 'events', eventId));
    } catch (error) {
      console.error('Error deleting event:', error);
    }
  };

  useEffect(() => {
    const eventsQuery = query(collection(db, 'events'), orderBy('date', 'asc'));
    const unsubscribe = onSnapshot(eventsQuery, (snapshot) => {
      const eventsData = [];
      snapshot.forEach((doc) => {
        eventsData.push({ id: doc.id, ...doc.data() });
      });
      setEvents(eventsData);
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="events-card">
      {/* Center the logo at the top */}
      <div style={{ textAlign: 'center' }}>
        <img 
          src="/eventsLogo.png" 
          alt="Events Logo" 
          style={{ height: '60px', marginBottom: '10px' }} 
        />
      </div>
      <ul className="event-list">
        {events.map((event) => {
          // Convert Firestore timestamp (if using seconds) to Date:
          const eventDate = event.date.seconds ? new Date(event.date.seconds * 1000) : new Date(event.date);
          const isPast = new Date() > eventDate;
          return (
            <li key={event.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <strong>{event.title}</strong> - {eventDate.toLocaleDateString()}
                {event.time && <span> at {formatTime(event.time)}</span>}
                {event.description && <p>{event.description}</p>}
              </div>
              {isPast && (
                <button onClick={() => handleDeleteEvent(event.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'red' }}>
                  <FaTrashAlt />
                </button>
              )}
            </li>
          );
        })}
      </ul>
      {/* Place the Add Event button below the events list */}
      <div style={{ textAlign: 'center', marginTop: '10px' }}>
        <button onClick={openModal}>Add Event</button>
      </div>

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
          <div
            className="modal-content"
            style={{ backgroundColor: 'white', padding: '20px', borderRadius: '4px' }}
          >
            <h3>Add Event</h3>
            <form onSubmit={handleSubmit}>
              <div>
                <label>
                  Title:
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </label>
              </div>
              <div>
                <label>
                  Date:
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                  />
                </label>
              </div>
              <div>
                <label>
                  Time (optional):
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                  />
                </label>
              </div>
              <div>
                <label>
                  Description:
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Optional"
                  />
                </label>
              </div>
              <button type="submit">Add Event</button>
              <button type="button" onClick={closeModal}>Cancel</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventsCard;
