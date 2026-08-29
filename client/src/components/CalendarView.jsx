import { useState, useEffect } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import axios from 'axios';
import { Plus, X, Trash2, Repeat } from 'lucide-react';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const localizer = momentLocalizer(moment);

export default function CalendarView() {
  const [events, setEvents] = useState([]);
  const [networks, setNetworks] = useState([]);
  const [showModal, setShowModal] = useState(false);
  
  const [newEvent, setNewEvent] = useState({
    title: 'Meeting Rotation',
    networkId: '',
    type: 'one-off',
    date: '',
    time: '12:00',
    recurringType: 'weekly',
    dayOfWeek: '1',
    dayOfMonth: '1',
    month: '0',
    clientEmails: ''
  });

  const API_BASE = import.meta.env.PROD ? '' : 'http://localhost:3050';

  const fetchSettings = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/settings`);
      setNetworks(res.data.networks || []);
      setEvents(res.data.events || []);
    } catch (err) {
      console.error('Failed to fetch events', err);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState('month');

  // Map our backend events to react-big-calendar events
  const allEvents = [];
  events.forEach(evt => {
    const network = networks.find(n => n.id === evt.networkId);
    const networkName = network ? network.name : 'Unknown Room';
    
    if (evt.type === 'one-off' && evt.date && evt.time) {
      const [year, month, day] = evt.date.split('-');
      const [hour, minute] = evt.time.split(':');
      const start = new Date(year, month - 1, day, hour, minute);
      const end = new Date(year, month - 1, day, hour, parseInt(minute) + 15);
      allEvents.push({
        id: evt.id,
        title: `${evt.title} (${networkName})`,
        start,
        end,
        isRecurring: false
      });
    } else if (evt.type === 'recurring') {
      // For recurring events, we'll plot them out for the current month just for display purposes
      // This is a naive visual implementation just so they show up on the calendar grid
      const [hour, minute] = (evt.time || '00:00').split(':');
      
      const startWindow = moment(currentDate).startOf('month').subtract(1, 'months');
      const endWindow = moment(currentDate).endOf('month').add(1, 'months'); 
      
      let current = startWindow.clone();
      while (current.isBefore(endWindow)) {
        let match = false;
        
        if (evt.recurringType === 'daily') {
          match = true;
        } else if (evt.recurringType === 'weekly' && current.day() === parseInt(evt.dayOfWeek)) {
          match = true;
        } else if (evt.recurringType === 'monthly' && current.date() === parseInt(evt.dayOfMonth)) {
          match = true;
        } else if (evt.recurringType === 'yearly' && current.month() === parseInt(evt.month) && current.date() === parseInt(evt.dayOfMonth)) {
          match = true;
        }
        
        if (match) {
          const start = current.clone().hour(hour).minute(minute).toDate();
          const end = current.clone().hour(hour).minute(parseInt(minute) + 15).toDate();
          if (start > new Date(2000, 1, 1)) { // sanity check
            allEvents.push({
              id: evt.id,
              title: `🔄 ${evt.title} (${networkName})`,
              start,
              end,
              isRecurring: true
            });
          }
        }
        current.add(1, 'days');
      }
    }
  });

  function groupEventsByDay(rawEvents) {
    const grouped = {};
    rawEvents.forEach(evt => {
      const dateKey = moment(evt.start).format('YYYY-MM-DD');
      if (!grouped[dateKey]) grouped[dateKey] = [];
      grouped[dateKey].push(evt);
    });

    const summaryEvents = [];
    Object.keys(grouped).forEach(dateKey => {
      const count = grouped[dateKey].length;
      summaryEvents.push({
        id: `summary_${dateKey}`,
        title: `${count} Schedule${count > 1 ? 's' : ''}`,
        start: moment(dateKey).startOf('day').toDate(),
        end: moment(dateKey).endOf('day').toDate(),
        isSummary: true,
        dateString: dateKey
      });
    });
    return summaryEvents;
  }

  const displayEvents = currentView === 'month' ? groupEventsByDay(allEvents) : allEvents;

  const handleSelectSlot = ({ start }) => {
    setNewEvent({
      ...newEvent,
      date: moment(start).format('YYYY-MM-DD'),
      time: moment(start).format('HH:mm'),
      type: 'one-off'
    });
    setShowModal(true);
  };

  const handleSelectEvent = (event) => {
    if (event.isSummary) {
      setCurrentDate(moment(event.dateString).toDate());
      setCurrentView('day');
      return;
    }
    if (window.confirm(`Delete rotation event: ${event.title}?`)) {
      handleDelete(event.id);
    }
  };

  const handleDelete = async (id) => {
    const updatedEvents = events.filter(e => e.id !== id);
    setEvents(updatedEvents);
    try {
      await axios.post(`${API_BASE}/api/events`, updatedEvents);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveEvent = async (e) => {
    e.preventDefault();
    if (!newEvent.networkId) {
      alert('Please select a Smart Network.');
      return;
    }
    
    const updatedEvents = [...events, newEvent];
    setEvents(updatedEvents);
    setShowModal(false);
    
    try {
      await axios.post(`${API_BASE}/api/events`, updatedEvents);
      fetchSettings();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ height: '700px', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.5rem' }}>Rotation Schedule</h2>
        <button className="btn btn-primary" onClick={() => setShowModal(true)} style={{ padding: '0.5rem 1rem' }}>
          <Plus size={18} /> New Rotation
        </button>
      </div>

      <div style={{ flex: 1, background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
        <Calendar
          localizer={localizer}
          events={displayEvents}
          startAccessor="start"
          endAccessor="end"
          selectable
          date={currentDate}
          onNavigate={(newDate) => setCurrentDate(newDate)}
          view={currentView}
          onView={(newView) => setCurrentView(newView)}
          onSelectSlot={handleSelectSlot}
          onSelectEvent={handleSelectEvent}
          views={['month', 'week', 'day', 'agenda']}
          popup
        />
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content" style={{ width: '500px', maxWidth: '90%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <h3>Add Rotation Event</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSaveEvent} className="settings-form">
              <div className="form-group full-width">
                <label>Event Title</label>
                <input 
                  type="text" 
                  value={newEvent.title} 
                  onChange={(e) => setNewEvent({...newEvent, title: e.target.value})} 
                  required 
                />
              </div>

              <div className="form-group full-width">
                <label>Target Smart Network</label>
                <select 
                  value={newEvent.networkId} 
                  onChange={(e) => setNewEvent({...newEvent, networkId: e.target.value})}
                  required
                >
                  <option value="" disabled>Select a room...</option>
                  {networks.map(n => (
                    <option key={n.id} value={n.id}>{n.name} ({n.ssidName})</option>
                  ))}
                </select>
              </div>

              <div className="form-group full-width">
                <label>Event Type</label>
                <select 
                  value={newEvent.type} 
                  onChange={(e) => setNewEvent({...newEvent, type: e.target.value})}
                >
                  <option value="one-off">One-off Meeting (Specific Date)</option>
                  <option value="recurring">Recurring Schedule</option>
                </select>
              </div>

              {newEvent.type === 'one-off' ? (
                <div className="form-group full-width" style={{ display: 'flex', gap: '1rem' }}>
                  <div style={{ flex: 1 }}>
                    <label>Date</label>
                    <input 
                      type="date" 
                      value={newEvent.date} 
                      onChange={(e) => setNewEvent({...newEvent, date: e.target.value})} 
                      required 
                      style={{ width: '100%' }}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label>Time</label>
                    <input 
                      type="time" 
                      value={newEvent.time} 
                      onChange={(e) => setNewEvent({...newEvent, time: e.target.value})} 
                      required 
                      style={{ width: '100%' }}
                    />
                  </div>
                </div>
              ) : (
                <>
                  <div className="form-group full-width">
                    <label>Repeat</label>
                    <select 
                      value={newEvent.recurringType} 
                      onChange={(e) => setNewEvent({...newEvent, recurringType: e.target.value})}
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                      <option value="yearly">Yearly</option>
                    </select>
                  </div>
                  
                  <div className="form-group full-width">
                    <label>Time of Day</label>
                    <input 
                      type="time" 
                      value={newEvent.time} 
                      onChange={(e) => setNewEvent({...newEvent, time: e.target.value})} 
                      required 
                    />
                  </div>

                  {newEvent.recurringType === 'weekly' && (
                    <div className="form-group full-width">
                      <label>Day of Week</label>
                      <select 
                        value={newEvent.dayOfWeek} 
                        onChange={(e) => setNewEvent({...newEvent, dayOfWeek: e.target.value})}
                      >
                        <option value="0">Sunday</option>
                        <option value="1">Monday</option>
                        <option value="2">Tuesday</option>
                        <option value="3">Wednesday</option>
                        <option value="4">Thursday</option>
                        <option value="5">Friday</option>
                        <option value="6">Saturday</option>
                      </select>
                    </div>
                  )}

                  {(newEvent.recurringType === 'monthly' || newEvent.recurringType === 'yearly') && (
                    <div className="form-group full-width">
                      <label>Day of Month (1-31)</label>
                      <input 
                        type="number" 
                        min="1" 
                        max="31"
                        value={newEvent.dayOfMonth} 
                        onChange={(e) => setNewEvent({...newEvent, dayOfMonth: e.target.value})} 
                        required 
                      />
                    </div>
                  )}

                  {newEvent.recurringType === 'yearly' && (
                    <div className="form-group full-width">
                      <label>Month</label>
                      <select 
                        value={newEvent.month} 
                        onChange={(e) => setNewEvent({...newEvent, month: e.target.value})}
                      >
                        <option value="0">January</option>
                        <option value="1">February</option>
                        <option value="2">March</option>
                        <option value="3">April</option>
                        <option value="4">May</option>
                        <option value="5">June</option>
                        <option value="6">July</option>
                        <option value="7">August</option>
                        <option value="8">September</option>
                        <option value="9">October</option>
                        <option value="10">November</option>
                        <option value="11">December</option>
                      </select>
                    </div>
                  )}
                </>
              )}

              <div className="form-group full-width" style={{ marginTop: '1rem' }}>
                <label>Client Emails (Optional)</label>
                <input 
                  type="text" 
                  value={newEvent.clientEmails} 
                  onChange={(e) => setNewEvent({...newEvent, clientEmails: e.target.value})} 
                  placeholder="client1@example.com, client2@example.com" 
                  style={{ width: '100%' }}
                />
                <span className="text-muted" style={{ fontSize: '0.85rem', marginTop: '0.25rem', display: 'block' }}>
                  These emails will receive the new Wi-Fi password when the event triggers.
                </span>
              </div>

              <div className="form-group full-width" style={{ marginTop: '1rem' }}>
                <button type="submit" className="btn btn-primary">Save Event to Calendar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
