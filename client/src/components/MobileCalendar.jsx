import React, { useState } from 'react';
import moment from 'moment';
import { ChevronLeft, ChevronRight, Plus, Clock } from 'lucide-react';

export default function MobileCalendar({ events, onAddEvent, onSelectEvent }) {
  const [currentMonth, setCurrentMonth] = useState(moment());
  const [selectedDate, setSelectedDate] = useState(moment().startOf('day'));

  const nextMonth = () => setCurrentMonth(currentMonth.clone().add(1, 'month'));
  const prevMonth = () => setCurrentMonth(currentMonth.clone().subtract(1, 'month'));

  // Generate calendar grid
  const startDay = currentMonth.clone().startOf('month').startOf('week');
  const endDay = currentMonth.clone().endOf('month').endOf('week');
  const day = startDay.clone().subtract(1, 'day');
  const calendar = [];

  while (day.isBefore(endDay, 'day')) {
    calendar.push(
      Array(7)
        .fill(0)
        .map(() => day.add(1, 'day').clone())
    );
  }

  // Find events for a specific day
  const getEventsForDay = (date) => {
    return events.filter(e => {
      if (e.isSummary) return false;
      const eventStart = moment(e.start).startOf('day');
      return eventStart.isSame(date, 'day');
    });
  };

  const selectedDayEvents = getEventsForDay(selectedDate);

  return (
    <div className="mobile-calendar-container">
      <div className="mobile-calendar-header">
        <button onClick={prevMonth} className="btn-icon"><ChevronLeft /></button>
        <h2 style={{ fontSize: '1.2rem', margin: 0, fontWeight: 600 }}>{currentMonth.format('MMMM YYYY')}</h2>
        <button onClick={nextMonth} className="btn-icon"><ChevronRight /></button>
      </div>

      <div className="mobile-calendar-grid">
        <div className="weekdays">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
            <div key={i} className="weekday">{d}</div>
          ))}
        </div>
        
        {calendar.map((week, i) => (
          <div key={i} className="week">
            {week.map((date, j) => {
              const isSelected = date.isSame(selectedDate, 'day');
              const isCurrentMonth = date.isSame(currentMonth, 'month');
              const isToday = date.isSame(moment(), 'day');
              const dayEvents = getEventsForDay(date);
              const hasEvents = dayEvents.length > 0;

              return (
                <div 
                  key={j} 
                  className={`day-cell ${!isCurrentMonth ? 'outside-month' : ''}`}
                  onClick={() => setSelectedDate(date)}
                >
                  <div className={`day-number ${isSelected ? 'selected' : ''} ${isToday && !isSelected ? 'today' : ''}`}>
                    {date.format('D')}
                  </div>
                  <div className="day-dots">
                    {hasEvents && <div className={`dot ${isSelected ? 'dot-selected' : ''}`}></div>}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <div className="mobile-events-list">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '1.1rem', margin: 0 }}>{selectedDate.format('dddd, MMMM Do')}</h3>
        </div>
        
        {selectedDayEvents.length === 0 ? (
          <div className="empty-events">No rotations scheduled</div>
        ) : (
          <div className="events-column">
            {selectedDayEvents.map(evt => (
              <div key={evt.id} className="mobile-event-card" onClick={() => onSelectEvent(evt)}>
                <div className="event-time">
                  <Clock size={14} />
                  {moment(evt.start).format('h:mm A')}
                </div>
                <div className="event-title">{evt.title}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
