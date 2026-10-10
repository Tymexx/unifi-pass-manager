import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Code2, 
  Clock, 
  Calendar, 
  Mail, 
  CheckCircle, 
  XCircle, 
  Trash2, 
  Copy, 
  Check, 
  ExternalLink, 
  Building, 
  Layers, 
  RefreshCw,
  Bell,
  Save,
  CheckCircle2,
  X
} from 'lucide-react';

const API_BASE = import.meta.env.PROD ? '' : 'http://localhost:3050';

export default function EmbedManager() {
  const [activeTab, setActiveTab] = useState('queue'); // 'queue' | 'embed' | 'notifications'
  const [bookings, setBookings] = useState([]);
  const [networks, setNetworks] = useState([]);
  const [settings, setSettings] = useState({});
  const [filter, setFilter] = useState('all'); // 'all' | 'pending' | 'approved' | 'rejected'
  const [loading, setLoading] = useState(true);
  
  // Modal state for approving
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [assignedNetworkId, setAssignedNetworkId] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Embed copy feedback
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Alert email state
  const [alertEmail, setAlertEmail] = useState('');
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setLoading(true);
      const [bookingsRes, networksRes, settingsRes] = await Promise.all([
        axios.get(`${API_BASE}/api/bookings`),
        axios.get(`${API_BASE}/api/networks`),
        axios.get(`${API_BASE}/api/settings`)
      ]);
      setBookings(bookingsRes.data.bookings || []);
      setNetworks(networksRes.data || []);
      
      const s = settingsRes.data.settings || {};
      setSettings(s);
      setAlertEmail(s.bookingAlertEmail || s.globalAdminEmail || s.testEmailRecipient || s.smtpUser || '');
    } catch (err) {
      console.error('Failed to load embed manager data:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleOpenApproveModal = (booking) => {
    setSelectedBooking(booking);
    // Pre-select requested network if valid, else first available
    const requested = networks.find(n => n.id === booking.requestedNetworkId);
    if (requested) {
      setAssignedNetworkId(requested.id);
    } else if (networks.length > 0) {
      setAssignedNetworkId(networks[0].id);
    } else {
      setAssignedNetworkId('');
    }
  };

  const handleApprove = async () => {
    if (!selectedBooking) return;
    try {
      setActionLoading(true);
      await axios.post(`${API_BASE}/api/bookings/${selectedBooking.id}/approve`, {
        assignedNetworkId
      });
      setSelectedBooking(null);
      await fetchData();
    } catch (err) {
      alert('Failed to approve booking: ' + (err.response?.data?.error || err.message));
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (booking) => {
    const reason = prompt('Optional rejection reason (leave blank for none):');
    if (reason === null) return; // cancelled
    try {
      await axios.post(`${API_BASE}/api/bookings/${booking.id}/reject`, { reason });
      await fetchData();
    } catch (err) {
      alert('Failed to reject booking: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this booking record?')) return;
    try {
      await axios.delete(`${API_BASE}/api/bookings/${id}`);
      await fetchData();
    } catch (err) {
      alert('Failed to delete booking: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleSaveAlertEmail = async (e) => {
    e.preventDefault();
    try {
      setSavingSettings(true);
      const updatedSettings = {
        ...settings,
        bookingAlertEmail: alertEmail.trim()
      };
      await axios.post(`${API_BASE}/api/settings`, updatedSettings);
      setSettings(updatedSettings);
      setSettingsSaved(true);
      setTimeout(() => setSettingsSaved(false), 3000);
    } catch (err) {
      alert('Failed to save settings: ' + (err.response?.data?.error || err.message));
    } finally {
      setSavingSettings(false);
    }
  };

  const currentOrigin = window.location.origin;
  const embedUrl = `${currentOrigin}/book`;
  const embedCodeSnippet = `<iframe src="${embedUrl}" width="100%" height="700" frameborder="0" style="border: none; border-radius: 12px; max-width: 540px; display: block; margin: 0 auto;"></iframe>`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(embedCodeSnippet);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(embedUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const filteredBookings = bookings.filter(b => {
    if (filter === 'all') return true;
    return b.status === filter;
  });

  const pendingCount = bookings.filter(b => b.status === 'pending').length;
  const approvedCount = bookings.filter(b => b.status === 'approved').length;

  return (
    <div className="animate-in">
      <div className="page-header" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1>Embed Creator & Booking Requests</h1>
            <p>Review customer Wi-Fi requests and embed self-service booking forms on your website.</p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={fetchData} 
              disabled={loading}
              title="Refresh queue"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Tab Controls */}
        <div style={{ display: 'flex', gap: '8px', marginTop: '20px', borderBottom: '1px solid var(--card-border)', paddingBottom: '12px' }}>
          <button 
            type="button"
            className={`btn ${activeTab === 'queue' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
            onClick={() => setActiveTab('queue')}
          >
            <Layers size={15} />
            <span>Request Queue</span>
            {pendingCount > 0 && (
              <span style={{ 
                background: activeTab === 'queue' ? '#ffffff' : 'var(--warning)', 
                color: activeTab === 'queue' ? '#000' : '#000', 
                borderRadius: '10px', 
                padding: '1px 6px', 
                fontSize: '0.7rem', 
                fontWeight: 700 
              }}>
                {pendingCount}
              </span>
            )}
          </button>
          
          <button 
            type="button"
            className={`btn ${activeTab === 'embed' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
            onClick={() => setActiveTab('embed')}
          >
            <Code2 size={15} />
            <span>Embed Generator</span>
          </button>

          <button 
            type="button"
            className={`btn ${activeTab === 'notifications' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
            onClick={() => setActiveTab('notifications')}
          >
            <Bell size={15} />
            <span>Alert Settings</span>
          </button>
        </div>
      </div>

      {activeTab === 'queue' && (
        <>
          {/* Stats Row */}
          <div className="stats-row" style={{ marginBottom: '24px' }}>
            <div className="stat-card">
              <span className="stat-label">Total Submissions</span>
              <span className="stat-value">{bookings.length}</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Pending Review</span>
              <span className="stat-value" style={{ color: pendingCount > 0 ? 'var(--warning)' : 'var(--text-primary)' }}>
                {pendingCount}
              </span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Approved & Scheduled</span>
              <span className="stat-value" style={{ color: 'var(--success)' }}>
                {approvedCount}
              </span>
            </div>
          </div>

          {/* Filter Bar */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            <button 
              type="button" 
              className={`btn btn-sm ${filter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setFilter('all')}
            >
              All ({bookings.length})
            </button>
            <button 
              type="button" 
              className={`btn btn-sm ${filter === 'pending' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setFilter('pending')}
            >
              Pending ({pendingCount})
            </button>
            <button 
              type="button" 
              className={`btn btn-sm ${filter === 'approved' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setFilter('approved')}
            >
              Approved ({approvedCount})
            </button>
            <button 
              type="button" 
              className={`btn btn-sm ${filter === 'rejected' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setFilter('rejected')}
            >
              Rejected ({bookings.filter(b => b.status === 'rejected').length})
            </button>
          </div>

          {/* Bookings Table / Cards */}
          {filteredBookings.length === 0 ? (
            <div className="card" style={{ padding: '48px 24px', textAlign: 'center' }}>
              <Clock size={36} color="var(--text-secondary)" style={{ margin: '0 auto 12px auto' }} />
              <h3 style={{ margin: '0 0 6px 0', fontSize: '1.1rem' }}>No booking requests found</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>
                {filter === 'pending' 
                  ? 'All pending guest requests have been reviewed!' 
                  : 'New customer bookings submitted through your website embed will appear here.'}
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {filteredBookings.map(booking => {
                const durationText = `${booking.durationHours || 1}h ${booking.durationMinutes ? `${booking.durationMinutes}m` : '00m'}`;
                return (
                  <div key={booking.id} className="card" style={{ padding: '18px 20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                      <div style={{ flex: '1 1 300px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                          <span style={{ fontWeight: 600, fontSize: '1.05rem', color: 'var(--text-primary)' }}>
                            {booking.name}
                          </span>
                          {booking.status === 'pending' && <span className="badge badge-warning">Pending Review</span>}
                          {booking.status === 'approved' && <span className="badge badge-success">Approved</span>}
                          {booking.status === 'rejected' && <span className="badge badge-danger">Rejected</span>}
                        </div>

                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <Mail size={14} /> {booking.email}
                          </span>
                          {booking.company && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                              <Building size={14} /> {booking.company}
                            </span>
                          )}
                          <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <Calendar size={14} /> {booking.date} at {booking.time}
                          </span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <Clock size={14} /> Duration: {durationText}
                          </span>
                        </div>

                        <div style={{ marginTop: '10px', fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', flexWrap: 'wrap', gap: '14px' }}>
                          <span>
                            <strong>Preferred Network:</strong>{' '}
                            <span style={{ color: 'var(--text-primary)' }}>
                              {booking.requestedNetworkName || 'Any / Auto-Assign'}
                            </span>
                          </span>
                          {booking.assignedNetworkName && (
                            <span>
                              <strong>Assigned Network:</strong>{' '}
                              <span style={{ color: 'var(--primary)', fontWeight: 600 }}>
                                {booking.assignedNetworkName}
                              </span>
                            </span>
                          )}
                          <span>
                            <strong>Password Delivery:</strong>{' '}
                            <span style={{ color: 'var(--text-primary)' }}>
                              {booking.sendTiming === '24h' 
                                ? '24h before meeting' 
                                : booking.sendTiming === 'start' 
                                  ? 'At meeting start' 
                                  : '1h before meeting'}
                            </span>
                          </span>
                        </div>

                        {booking.rejectReason && (
                          <div style={{ marginTop: '8px', fontSize: '0.8rem', color: 'var(--danger)' }}>
                            <strong>Decline Reason:</strong> {booking.rejectReason}
                          </div>
                        )}
                      </div>

                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        {booking.status === 'pending' && (
                          <>
                            <button 
                              type="button" 
                              className="btn btn-primary btn-sm"
                              onClick={() => handleOpenApproveModal(booking)}
                            >
                              <CheckCircle size={15} />
                              <span>Review & Approve</span>
                            </button>
                            <button 
                              type="button" 
                              className="btn btn-danger btn-sm"
                              onClick={() => handleReject(booking)}
                            >
                              <XCircle size={15} />
                              <span>Decline</span>
                            </button>
                          </>
                        )}
                        <button 
                          type="button" 
                          className="btn btn-secondary btn-sm btn-icon"
                          onClick={() => handleDelete(booking.id)}
                          title="Delete Request"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {activeTab === 'embed' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Website Embed Snippet</h3>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '16px' }}>
              Paste this HTML snippet into any page on your website (e.g. your visitor portal, booking confirmation, or meeting room scheduler).
            </p>

            <div style={{ position: 'relative', background: '#090d16', padding: '14px 16px', borderRadius: '8px', border: '1px solid var(--card-border)', marginBottom: '16px' }}>
              <pre style={{ margin: 0, fontFamily: 'monospace', fontSize: '0.85rem', color: '#38bdf8', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                {embedCodeSnippet}
              </pre>
            </div>

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button type="button" className="btn btn-primary" onClick={handleCopyCode}>
                {copiedCode ? <Check size={16} /> : <Copy size={16} />}
                <span>{copiedCode ? 'Copied HTML Snippet!' : 'Copy Embed Code'}</span>
              </button>

              <button type="button" className="btn btn-secondary" onClick={handleCopyLink}>
                {copiedLink ? <Check size={16} /> : <Copy size={16} />}
                <span>{copiedLink ? 'Copied Direct URL!' : 'Copy Direct URL'}</span>
              </button>

              <a 
                href={embedUrl} 
                target="_blank" 
                rel="noreferrer" 
                className="btn btn-secondary"
              >
                <ExternalLink size={16} />
                <span>Open Form in New Tab</span>
              </a>
            </div>
          </div>

          {/* Live Preview Container */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Live Embed Preview</h3>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '16px' }}>
              This is how your customer will see and interact with the booking form on your embedded page:
            </p>
            <div style={{ 
              background: '#070a12', 
              padding: '24px', 
              borderRadius: '12px', 
              border: '1px dashed var(--card-border)',
              display: 'flex',
              justifyContent: 'center'
            }}>
              <iframe 
                src={embedUrl} 
                title="Public Booking Form Preview"
                width="100%" 
                height="680" 
                style={{ border: 'none', maxWidth: '540px', borderRadius: '12px' }}
              />
            </div>
          </div>
        </div>
      )}

      {activeTab === 'notifications' && (
        <div className="card" style={{ maxWidth: '640px' }}>
          <div className="card-header">
            <h3 className="card-title">Booking Alert Email Settings</h3>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '20px' }}>
            Whenever a customer submits a new booking request through your embed form, an instant alert email will be delivered to this address via your SMTP2GO setup.
          </p>

          <form onSubmit={handleSaveAlertEmail}>
            <div className="form-group full-width" style={{ marginBottom: '20px' }}>
              <label htmlFor="alertEmail">Alert Notification Recipient Email</label>
              <input 
                id="alertEmail"
                type="email" 
                value={alertEmail} 
                onChange={e => setAlertEmail(e.target.value)} 
                placeholder="e.g. Josh.Pomeroy@hotmail.co.uk"
                required 
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                Emails will be dispatched by Bastion@directconnect.global through SMTP2GO.
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button type="submit" className="btn btn-primary" disabled={savingSettings}>
                {savingSettings ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
                <span>{savingSettings ? 'Saving...' : 'Save Recipient Address'}</span>
              </button>

              {settingsSaved && (
                <span style={{ color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}>
                  <CheckCircle2 size={16} /> Saved successfully!
                </span>
              )}
            </div>
          </form>
        </div>
      )}

      {/* Review & Approve Modal */}
      {selectedBooking && (
        <div className="modal-overlay">
          <div className="modal-content animate-in" style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 600 }}>
                Approve Wi-Fi Request
              </h3>
              <button 
                type="button" 
                className="btn-icon btn-sm" 
                onClick={() => setSelectedBooking(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <div className="modal-body" style={{ padding: '20px 0' }}>
              <div style={{ background: '#0a0f1d', padding: '14px 16px', borderRadius: '8px', border: '1px solid var(--card-border)', marginBottom: '18px' }}>
                <div style={{ marginBottom: '6px' }}><strong>Guest:</strong> {selectedBooking.name} ({selectedBooking.email})</div>
                <div style={{ marginBottom: '6px' }}><strong>Organization:</strong> {selectedBooking.company || 'Not Specified'}</div>
                <div style={{ marginBottom: '6px' }}><strong>Visit Slot:</strong> {selectedBooking.date} at {selectedBooking.time}</div>
                <div><strong>Duration:</strong> {selectedBooking.durationHours || 1}h {selectedBooking.durationMinutes || 0}m</div>
              </div>

              <div className="form-group full-width">
                <label htmlFor="assignedNetworkSelect">Assign Wi-Fi Network</label>
                <select 
                  id="assignedNetworkSelect"
                  value={assignedNetworkId} 
                  onChange={e => setAssignedNetworkId(e.target.value)}
                >
                  {networks.map(n => (
                    <option key={n.id} value={n.id}>
                      {n.name} {n.ssidName ? `(SSID: ${n.ssidName})` : ''}
                    </option>
                  ))}
                </select>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  The guest requested: <strong>{selectedBooking.requestedNetworkName || 'Any / Auto-Assign'}</strong>.
                </span>
              </div>

              <div style={{ background: 'rgba(0, 134, 214, 0.08)', border: '1px solid rgba(0, 134, 214, 0.25)', borderRadius: '8px', padding: '12px 14px', marginTop: '16px' }}>
                <div style={{ fontSize: '0.8rem', color: '#93c5fd', lineHeight: 1.5 }}>
                  <strong>Automated Actions on Approval:</strong>
                  <ul style={{ margin: '4px 0 0 0', paddingLeft: '18px' }}>
                    <li>Confirmation email dispatched to guest confirming schedule & duration.</li>
                    <li>Calendar rotation event provisioned with automatic revocation after {selectedBooking.durationHours || 1}h {selectedBooking.durationMinutes || 0}m.</li>
                    <li>Secure passphrase & QR code dispatched prior to visit per delivery preference.</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '12px' }}>
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={() => setSelectedBooking(null)}
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="btn btn-primary" 
                onClick={handleApprove}
                disabled={actionLoading}
              >
                {actionLoading ? <RefreshCw size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                <span>{actionLoading ? 'Approving...' : 'Confirm & Approve'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
