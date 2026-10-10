import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Shield, Clock, Calendar, Mail, Building, CheckCircle2, AlertCircle, Loader2, Wifi, Send } from 'lucide-react';

const API_BASE = import.meta.env.PROD ? '' : 'http://localhost:3050';

export default function PublicBookingForm() {
  const [networks, setNetworks] = useState([]);
  const [loadingNetworks, setLoadingNetworks] = useState(true);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    date: new Date().toISOString().split('T')[0],
    time: '09:00',
    durationHours: '2',
    durationMinutes: '0',
    requestedNetworkId: 'any',
    sendTiming: '1h'
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [submittedBooking, setSubmittedBooking] = useState(null);

  useEffect(() => {
    async function fetchNetworks() {
      try {
        const res = await axios.get(`${API_BASE}/api/public/networks`);
        setNetworks(res.data || []);
      } catch (err) {
        console.error('Failed to load public networks list:', err);
      } finally {
        setLoadingNetworks(false);
      }
    }
    fetchNetworks();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Please provide your name.');
      return;
    }
    if (!formData.email.trim() || !formData.email.includes('@')) {
      setError('Please provide a valid email address.');
      return;
    }
    if (!formData.date || !formData.time) {
      setError('Please select a date and time.');
      return;
    }

    const selectedNet = networks.find(n => n.id === formData.requestedNetworkId);
    const requestedNetworkName = formData.requestedNetworkId === 'any' 
      ? 'Any / Auto-Assign' 
      : (selectedNet ? `${selectedNet.name} (${selectedNet.ssidName})` : 'Specific Network');

    setSubmitting(true);
    setError(null);

    try {
      const payload = {
        ...formData,
        requestedNetworkName,
        durationHours: parseInt(formData.durationHours, 10),
        durationMinutes: parseInt(formData.durationMinutes, 10)
      };
      const res = await axios.post(`${API_BASE}/api/bookings`, payload);
      if (res.data && res.data.success) {
        setSubmittedBooking(res.data.booking);
      } else {
        setError(res.data?.error || 'Failed to submit booking request.');
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Error submitting booking.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setSubmittedBooking(null);
    setFormData({
      name: '',
      email: '',
      company: '',
      date: new Date().toISOString().split('T')[0],
      time: '09:00',
      durationHours: '2',
      durationMinutes: '0',
      requestedNetworkId: 'any',
      sendTiming: '1h'
    });
  };

  if (submittedBooking) {
    const durationText = `${submittedBooking.durationHours || 1}h ${submittedBooking.durationMinutes ? `${submittedBooking.durationMinutes}m` : ''}`.trim();
    return (
      <div className="public-booking-container">
        <div className="public-booking-card animate-in">
          <div className="public-booking-success-icon">
            <CheckCircle2 size={48} color="#22c55e" />
          </div>

          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, margin: '12px 0 6px 0', color: '#f1f5f9', textAlign: 'center' }}>
            Request Received
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', textAlign: 'center', margin: '0 0 24px 0', lineHeight: 1.5 }}>
            Thank you, <strong>{submittedBooking.name}</strong>. Your Wi-Fi booking has been sent for administrative review. A confirmation receipt was dispatched to <strong>{submittedBooking.email}</strong>.
          </p>

          <div className="public-booking-summary">
            <div className="summary-item">
              <span className="summary-label"><Calendar size={14} /> Scheduled Slot</span>
              <span className="summary-value">{submittedBooking.date} at {submittedBooking.time}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label"><Clock size={14} /> Duration</span>
              <span className="summary-value">{durationText}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label"><Wifi size={14} /> Target Network</span>
              <span className="summary-value">{submittedBooking.requestedNetworkName || 'Auto-Assign'}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label"><Mail size={14} /> Passphrase Delivery</span>
              <span className="summary-value">
                {submittedBooking.sendTiming === '24h' 
                  ? '24 hours before meeting' 
                  : submittedBooking.sendTiming === 'start' 
                    ? 'At meeting start' 
                    : '1 hour before meeting'}
              </span>
            </div>
          </div>

          <div className="public-booking-notice">
            <Shield size={16} color="#0086d6" style={{ flexShrink: 0, marginTop: 2 }} />
            <div style={{ fontSize: '0.8rem', color: '#94a3b8', lineHeight: 1.4 }}>
              Once your request is approved by the admin, your dedicated Wi-Fi access passphrase and instant connect QR code will arrive directly in your inbox.
            </div>
          </div>

          <button 
            type="button" 
            className="btn btn-secondary" 
            onClick={handleReset}
            style={{ width: '100%', marginTop: '16px' }}
          >
            Submit Another Request
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="public-booking-container">
      <div className="public-booking-card animate-in">
        <div className="public-booking-header">
          <div className="public-booking-brand">
            <img src="/bastion-logo-v2.svg" alt="Bastion" width={28} height={28} />
            <span style={{ fontWeight: 700, fontSize: '1.1rem', letterSpacing: '-0.02em', color: '#f1f5f9' }}>Bastion Access</span>
          </div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '8px 0 4px 0', color: '#f1f5f9' }}>
            Guest Wi-Fi Booking
          </h1>
          <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>
            Schedule temporary, secure high-speed Wi-Fi access for your upcoming visit.
          </p>
        </div>

        {error && (
          <div className="public-booking-error animate-in">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="public-booking-form">
          <div className="form-group full-width">
            <label htmlFor="name">Your Name *</label>
            <input 
              id="name"
              name="name" 
              type="text" 
              placeholder="e.g. Sarah Jenkins" 
              value={formData.name} 
              onChange={handleChange}
              required 
            />
          </div>

          <div className="form-group full-width">
            <label htmlFor="email">Email Address *</label>
            <input 
              id="email"
              name="email" 
              type="email" 
              placeholder="Where to send access credentials" 
              value={formData.email} 
              onChange={handleChange}
              required 
            />
          </div>

          <div className="form-group full-width">
            <label htmlFor="company">Company / Event (Optional)</label>
            <div style={{ position: 'relative' }}>
              <input 
                id="company"
                name="company" 
                type="text" 
                placeholder="e.g. Acme Studio / Client Presentation" 
                value={formData.company} 
                onChange={handleChange} 
              />
            </div>
          </div>

          <div className="form-grid" style={{ marginBottom: 0 }}>
            <div className="form-group">
              <label htmlFor="date">Visit Date *</label>
              <input 
                id="date"
                name="date" 
                type="date" 
                value={formData.date} 
                onChange={handleChange}
                required 
              />
            </div>

            <div className="form-group">
              <label htmlFor="time">Start Time *</label>
              <input 
                id="time"
                name="time" 
                type="time" 
                value={formData.time} 
                onChange={handleChange}
                required 
              />
            </div>
          </div>

          <div className="form-grid" style={{ marginBottom: 0 }}>
            <div className="form-group">
              <label htmlFor="durationHours">Duration (Hours)</label>
              <select 
                id="durationHours"
                name="durationHours" 
                value={formData.durationHours} 
                onChange={handleChange}
              >
                {[1, 2, 3, 4, 5, 6, 8, 10, 12, 24].map(h => (
                  <option key={h} value={h}>{h} {h === 1 ? 'Hour' : 'Hours'}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="durationMinutes">Minutes</label>
              <select 
                id="durationMinutes"
                name="durationMinutes" 
                value={formData.durationMinutes} 
                onChange={handleChange}
              >
                <option value="0">00 mins</option>
                <option value="15">15 mins</option>
                <option value="30">30 mins</option>
                <option value="45">45 mins</option>
              </select>
            </div>
          </div>

          <div className="form-group full-width">
            <label htmlFor="requestedNetworkId">Preferred Network</label>
            <select 
              id="requestedNetworkId"
              name="requestedNetworkId" 
              value={formData.requestedNetworkId} 
              onChange={handleChange}
            >
              <option value="any">Any / Auto-Assign (Recommended)</option>
              {networks.map(net => (
                <option key={net.id} value={net.id}>
                  {net.name} {net.ssidName ? `(${net.ssidName})` : ''}
                </option>
              ))}
            </select>
            <span style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>
              If unsure, select Auto-Assign and our team will allocate the best network for your device.
            </span>
          </div>

          <div className="form-group full-width">
            <label htmlFor="sendTiming">When should your password be delivered?</label>
            <select 
              id="sendTiming"
              name="sendTiming" 
              value={formData.sendTiming} 
              onChange={handleChange}
            >
              <option value="1h">1 hour before visit (Recommended)</option>
              <option value="24h">24 hours before visit</option>
              <option value="start">At scheduled start time</option>
            </select>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            disabled={submitting}
            style={{ width: '100%', height: '44px', marginTop: '8px' }}
          >
            {submitting ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>Submitting Request...</span>
              </>
            ) : (
              <>
                <Send size={16} />
                <span>Request Wi-Fi Access</span>
              </>
            )}
          </button>
        </form>

        <div className="public-booking-footer">
          <Shield size={12} style={{ opacity: 0.7 }} />
          <span>Secured by Bastion Access Control</span>
        </div>
      </div>
    </div>
  );
}
