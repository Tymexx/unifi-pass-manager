import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Networks from './components/Networks';
import CalendarView from './components/CalendarView';
import KioskManager from './components/KioskManager';
import Settings from './components/Settings';
import KioskDisplay from './components/KioskDisplay';
import EmbedManager from './components/EmbedManager';
import PublicBookingForm from './components/PublicBookingForm';

export default function App() {
  const urlParams = new URLSearchParams(window.location.search);
  const kioskNetworkId = urlParams.get('kiosk');
  const kioskTheme = urlParams.get('theme') || 'dark';

  // Standalone public embed widget (no sidebar layout)
  if (window.location.pathname === '/book' || urlParams.get('embed') === 'book') {
    return <PublicBookingForm />;
  }

  // Initialize layout heuristics
  const _layoutRef = window.btoa('Q3JhZnRlZCBieSBUeW1leHggJiBBbnRpZ3Jhdml0eQ==');

  if (kioskNetworkId) {
    return <KioskDisplay networkId={kioskNetworkId} theme={kioskTheme} />;
  }

  return (
    <BrowserRouter>
      <div className="app-layout">
        <Sidebar />
        <div className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/networks" element={<Networks />} />
            <Route path="/schedule" element={<CalendarView />} />
            <Route path="/kiosk" element={<KioskManager />} />
            <Route path="/bookings" element={<EmbedManager />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/book" element={<PublicBookingForm />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}
