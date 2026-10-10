import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { 
  Shield, 
  Clock, 
  Calendar, 
  Mail, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Wifi, 
  Send,
  Phone,
  ChevronUp,
  ChevronDown,
  Hash
} from 'lucide-react';

const API_BASE = import.meta.env.PROD ? '' : 'http://localhost:3050';

// Sleek iOS-style Drum / Wheel Picker for Numbers
function IosNumberWheel({ value, onChange, min = 1, max = 50, step = 1, label }) {
  const currentVal = parseInt(value, 10) || min;
  const numbers = [];
  for (let i = min; i <= max; i += step) {
    numbers.push(i);
  }

  const containerRef = useRef(null);

  const handleStep = (delta) => {
    const nextVal = Math.min(max, Math.max(min, currentVal + delta * step));
    onChange(nextVal);
  };

  return (
    <div className="ios-wheel-picker-wrapper">
      <div className="ios-wheel-picker">
        <button 
          type="button" 
          className="ios-wheel-btn" 
          onClick={() => handleStep(-1)}
          disabled={currentVal <= min}
          aria-label="Decrease"
        >
          <ChevronUp size={16} />
        </button>

        <div className="ios-wheel-display" ref={containerRef}>
          <span className="ios-wheel-prev" onClick={() => handleStep(-1)}>
            {currentVal > min ? currentVal - step : ''}
          </span>
          <span className="ios-wheel-current">
            {currentVal}
          </span>
          <span className="ios-wheel-next" onClick={() => handleStep(1)}>
            {currentVal < max ? currentVal + step : ''}
          </span>
        </div>

        <button 
          type="button" 
          className="ios-wheel-btn" 
          onClick={() => handleStep(1)}
          disabled={currentVal >= max}
          aria-label="Increase"
        >
          <ChevronDown size={16} />
        </button>
      </div>
      {label && <span className="ios-wheel-sublabel">{label}</span>}
    </div>
  );
}

export default function PublicBookingForm({ overrideConfig = null, isPreview = false }) {
  const [formConfig, setFormConfig] = useState(overrideConfig);
  const [loadingConfig, setLoadingConfig] = useState(!overrideConfig);
  const [networks, setNetworks] = useState([]);

  // Form values stored dynamically by field ID
  const [fieldValues, setFieldValues] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [submittedBooking, setSubmittedBooking] = useState(null);

  // Sync overrideConfig if prop changes (for live admin preview)
  useEffect(() => {
    if (overrideConfig) {
      setFormConfig(overrideConfig);
    }
  }, [overrideConfig]);

  useEffect(() => {
    if (!overrideConfig) {
      fetchFormConfig();
    }
    fetchNetworks();
  }, []);

  async function fetchFormConfig() {
    try {
      setLoadingConfig(true);
      const res = await axios.get(`${API_BASE}/api/public/form-config`);
      setFormConfig(res.data);
      initDefaults(res.data?.fields || []);
    } catch (err) {
      console.error('Failed to load public form config:', err);
    } finally {
      setLoadingConfig(false);
    }
  }

  async function fetchNetworks() {
    try {
      const res = await axios.get(`${API_BASE}/api/public/networks`);
      setNetworks(res.data || []);
    } catch (err) {
      console.error('Failed to load public networks:', err);
    }
  }

  const initDefaults = (fields) => {
    const defaults = {
      date: new Date().toISOString().split('T')[0],
      time: '09:00',
      durationHours: '2',
      durationMinutes: '0',
      network: 'any',
      sendTiming: '1h'
    };
    fields.forEach(f => {
      if (f.type === 'number') {
        defaults[f.id] = f.defaultValue !== undefined ? f.defaultValue : 1;
      } else if (f.type === 'checkbox') {
        defaults[f.id] = false;
      } else if (f.type === 'select' && f.options && f.options.length > 0) {
        defaults[f.id] = f.options[0];
      }
    });
    setFieldValues(prev => ({ ...defaults, ...prev }));
  };

  const handleInputChange = (fieldId, val) => {
    setFieldValues(prev => ({ ...prev, [fieldId]: val }));
    if (error) setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isPreview) {
      alert('Preview Mode: This is an interactive preview. Form submission is disabled in the preview tab.');
      return;
    }

    const fields = formConfig?.fields || [];

    // Validate required fields
    for (const f of fields) {
      if (f.required) {
        const val = fieldValues[f.id];
        if (f.type === 'checkbox') {
          if (!val) {
            setError(`Please agree to: "${f.label}"`);
            return;
          }
        } else if (val === undefined || val === null || String(val).trim() === '') {
          setError(`Please fill in required field: "${f.label}"`);
          return;
        }
      }
    }

    // Email validation
    const emailVal = fieldValues.email || '';
    if (!emailVal || !emailVal.includes('@')) {
      setError('Please provide a valid email address.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const selectedNet = networks.find(n => n.id === fieldValues.network);
      const requestedNetworkName = fieldValues.network === 'any' || !fieldValues.network
        ? 'Any / Auto-Assign'
        : (selectedNet ? `${selectedNet.name} (${selectedNet.ssidName})` : 'Specific Network');

      // Separate standard fields from custom dynamic fields
      const standardKeys = ['name', 'email', 'phone', 'company', 'date', 'time', 'durationHours', 'durationMinutes', 'network', 'sendTiming'];
      const customFields = {};

      fields.forEach(f => {
        if (!standardKeys.includes(f.id) && f.id !== 'duration') {
          customFields[f.label || f.id] = fieldValues[f.id];
        }
      });

      const payload = {
        name: fieldValues.name,
        email: fieldValues.email,
        phone: fieldValues.phone || '',
        company: fieldValues.company || '',
        date: fieldValues.date || new Date().toISOString().split('T')[0],
        time: fieldValues.time || '09:00',
        durationHours: parseInt(fieldValues.durationHours, 10) || 2,
        durationMinutes: parseInt(fieldValues.durationMinutes, 10) || 0,
        requestedNetworkId: fieldValues.network || 'any',
        requestedNetworkName,
        sendTiming: fieldValues.sendTiming || '1h',
        customFields
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
    initDefaults(formConfig?.fields || []);
  };

  if (loadingConfig) {
    return (
      <div className="public-booking-container">
        <div className="public-booking-card" style={{ textAlign: 'center', padding: '48px 24px' }}>
          <Loader2 size={32} className="animate-spin" color="var(--primary)" style={{ margin: '0 auto 12px auto' }} />
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>Loading booking form...</p>
        </div>
      </div>
    );
  }

  if (submittedBooking) {
    const durationText = `${submittedBooking.durationHours || 1}h ${submittedBooking.durationMinutes ? `${submittedBooking.durationMinutes}m` : ''}`.trim();
    return (
      <div className="public-booking-container">
        <div className="public-booking-card animate-in">
          <div className="public-booking-success-icon">
            <CheckCircle2 size={48} color="#22c55e" />
          </div>

          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, margin: '12px 0 6px 0', color: '#f1f5f9', textAlign: 'center' }}>
            {formConfig?.successTitle || 'Request Received'}
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
            {submittedBooking.phone && (
              <div className="summary-item">
                <span className="summary-label"><Phone size={14} /> Contact Phone</span>
                <span className="summary-value">{submittedBooking.phone}</span>
              </div>
            )}
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

            {/* Custom dynamic fields */}
            {submittedBooking.customFields && Object.entries(submittedBooking.customFields).map(([label, val]) => (
              <div key={label} className="summary-item">
                <span className="summary-label"><Hash size={14} /> {label}</span>
                <span className="summary-value">{typeof val === 'boolean' ? (val ? 'Yes' : 'No') : String(val)}</span>
              </div>
            ))}
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

  const fields = formConfig?.fields || [];

  return (
    <div className="public-booking-container">
      <div className="public-booking-card animate-in">
        <div className="public-booking-header">
          <div className="public-booking-brand">
            <img src="/bastion-logo-v2.svg" alt="Bastion" width={28} height={28} />
            <span style={{ fontWeight: 700, fontSize: '1.1rem', letterSpacing: '-0.02em', color: '#f1f5f9' }}>Bastion Access</span>
          </div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '8px 0 4px 0', color: '#f1f5f9' }}>
            {formConfig?.title || 'Guest Wi-Fi Booking'}
          </h1>
          {formConfig?.description && (
            <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>
              {formConfig.description}
            </p>
          )}
        </div>

        {error && (
          <div className="public-booking-error animate-in">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="public-booking-form">
          {fields.map((field) => {
            const { id, type, label, placeholder, required, options } = field;
            const value = fieldValues[id] ?? '';

            if (type === 'duration') {
              return (
                <div key={id} className="form-grid" style={{ marginBottom: 0 }}>
                  <div className="form-group">
                    <label htmlFor="durationHours">{label} (Hours)</label>
                    <select 
                      id="durationHours"
                      value={fieldValues.durationHours || '2'} 
                      onChange={e => handleInputChange('durationHours', e.target.value)}
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
                      value={fieldValues.durationMinutes || '0'} 
                      onChange={e => handleInputChange('durationMinutes', e.target.value)}
                    >
                      <option value="0">00 mins</option>
                      <option value="15">15 mins</option>
                      <option value="30">30 mins</option>
                      <option value="45">45 mins</option>
                    </select>
                  </div>
                </div>
              );
            }

            if (type === 'network_select') {
              return (
                <div key={id} className="form-group full-width">
                  <label htmlFor={id}>{label}{required ? ' *' : ''}</label>
                  <select 
                    id={id}
                    value={fieldValues.network || 'any'} 
                    onChange={e => handleInputChange('network', e.target.value)}
                  >
                    <option value="any">Any / Auto-Assign (Recommended)</option>
                    {networks.map(net => (
                      <option key={net.id} value={net.id}>
                        {net.name} {net.ssidName ? `(${net.ssidName})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              );
            }

            if (type === 'timing_select') {
              return (
                <div key={id} className="form-group full-width">
                  <label htmlFor={id}>{label}{required ? ' *' : ''}</label>
                  <select 
                    id={id}
                    value={fieldValues.sendTiming || '1h'} 
                    onChange={e => handleInputChange('sendTiming', e.target.value)}
                  >
                    <option value="1h">1 hour before visit (Recommended)</option>
                    <option value="24h">24 hours before visit</option>
                    <option value="start">At scheduled start time</option>
                  </select>
                </div>
              );
            }

            if (type === 'number') {
              return (
                <div key={id} className="form-group full-width">
                  <label>{label}{required ? ' *' : ''}</label>
                  <IosNumberWheel 
                    value={value || 1} 
                    onChange={v => handleInputChange(id, v)} 
                    min={field.min || 1} 
                    max={field.max || 50} 
                    step={field.step || 1} 
                    label={placeholder || ''}
                  />
                </div>
              );
            }

            if (type === 'select') {
              return (
                <div key={id} className="form-group full-width">
                  <label htmlFor={id}>{label}{required ? ' *' : ''}</label>
                  <select 
                    id={id}
                    value={value} 
                    onChange={e => handleInputChange(id, e.target.value)}
                    required={required}
                  >
                    {(options || []).map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
              );
            }

            if (type === 'checkbox') {
              return (
                <div key={id} className="form-group full-width" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input 
                    id={id}
                    type="checkbox" 
                    checked={Boolean(value)} 
                    onChange={e => handleInputChange(id, e.target.checked)}
                    required={required}
                    style={{ width: '18px', height: '18px', cursor: 'pointer', margin: 0 }}
                  />
                  <label htmlFor={id} style={{ margin: 0, cursor: 'pointer', fontSize: '0.875rem' }}>
                    {label}{required ? ' *' : ''}
                  </label>
                </div>
              );
            }

            if (type === 'textarea') {
              return (
                <div key={id} className="form-group full-width">
                  <label htmlFor={id}>{label}{required ? ' *' : ''}</label>
                  <textarea 
                    id={id}
                    placeholder={placeholder || ''} 
                    value={value} 
                    onChange={e => handleInputChange(id, e.target.value)}
                    required={required}
                  />
                </div>
              );
            }

            if (type === 'phone') {
              return (
                <div key={id} className="form-group full-width">
                  <label htmlFor={id}>{label}{required ? ' *' : ''}</label>
                  <div style={{ position: 'relative' }}>
                    <input 
                      id={id}
                      type="tel" 
                      placeholder={placeholder || 'e.g. +44 7700 900077'} 
                      value={value} 
                      onChange={e => handleInputChange(id, e.target.value)}
                      required={required}
                      style={{ paddingLeft: '38px' }}
                    />
                    <Phone size={16} color="var(--text-secondary)" style={{ position: 'absolute', left: '12px', top: '12px', pointerEvents: 'none' }} />
                  </div>
                </div>
              );
            }

            return (
              <div key={id} className="form-group full-width">
                <label htmlFor={id}>{label}{required ? ' *' : ''}</label>
                <input 
                  id={id}
                  type={type || 'text'} 
                  placeholder={placeholder || ''} 
                  value={value} 
                  onChange={e => handleInputChange(id, e.target.value)}
                  required={required}
                />
              </div>
            );
          })}

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
                <span>{formConfig?.submitButtonText || 'Request Wi-Fi Access'}</span>
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
