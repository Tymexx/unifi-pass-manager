const fs = require('fs');
const path = './client/src/components/CalendarView.jsx';
let code = fs.readFileSync(path, 'utf8');

// Add isMobile state
code = code.replace(
  'const [newEvent, setNewEvent] = useState(initialEventState);',
  'const [newEvent, setNewEvent] = useState(initialEventState);\n  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);\n\n  useEffect(() => {\n    const handleResize = () => setIsMobile(window.innerWidth <= 768);\n    window.addEventListener("resize", handleResize);\n    return () => window.removeEventListener("resize", handleResize);\n  }, []);'
);

// Replace Calendar render
const calendarRender = `        <div className="calendar-scroll-container">
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
        </div>`;

const mobileRender = `        {isMobile ? (
          <MobileCalendar 
            events={allEvents} 
            onAddEvent={() => { setNewEvent(initialEventState); setShowModal(true); }} 
            onSelectEvent={handleSelectEvent}
          />
        ) : (
          <div className="calendar-scroll-container">
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
        )}`;

code = code.replace(calendarRender, mobileRender);
fs.writeFileSync(path, code);
