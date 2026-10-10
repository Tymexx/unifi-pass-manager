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
  X,
  Plus,
  GripVertical,
  Lock,
  ArrowUp,
  ArrowDown,
  Eye,
  Sliders,
  RotateCcw,
  Phone,
  Hash,
  CheckSquare,
  List,
  Type,
  FileText
} from 'lucide-react';
import PublicBookingForm from './PublicBookingForm';

const API_BASE = import.meta.env.PROD ? '' : 'http://localhost:3050';

export default function EmbedManager() {
  const [activeTab, setActiveTab] = useState('queue'); // 'queue' | 'builder' | 'embed' | 'notifications'
  const [bookings, setBookings] = useState([]);
  const [networks, setNetworks] = useState([]);
  const [settings, setSettings] = useState({});
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  
  // Form Builder state
  const [formConfig, setFormConfig] = useState(null);
  const [savingForm, setSavingForm] = useState(false);
  const [formSaved, setFormSaved] = useState(false);
  const [showAddFieldModal, setShowAddFieldModal] = useState(false);
  const [previewTab, setPreviewTab] = useState(false); // toggle preview side-by-side or tab

  // Drag and Drop state
  const [dragIndex, setDragIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  // Approval Modal state
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
      const [bookingsRes, networksRes, settingsRes, formRes] = await Promise.all([
        axios.get(`${API_BASE}/api/bookings`),
        axios.get(`${API_BASE}/api/networks`),
        axios.get(`${API_BASE}/api/settings`),
        axios.get(`${API_BASE}/api/form-config`)
      ]);
      setBookings(bookingsRes.data.bookings || []);
      setNetworks(networksRes.data || []);
      
      const s = settingsRes.data.settings || {};
      setSettings(s);
      setAlertEmail(s.bookingAlertEmail || s.globalAdminEmail || s.testEmailRecipient || s.smtpUser || '');

      setFormConfig(formRes.data || null);
    } catch (err) {
      console.error('Failed to load embed manager data:', err);
    } finally {
      setLoading(false);
    }
  }

  // --- Form Builder Handlers ---
  const handleFieldChange = (index, updates) => {
    setFormConfig(prev => {
      const newFields = [...prev.fields];
      newFields[index] = { ...newFields[index], ...updates };
      return { ...prev, fields: newFields };
    });
  };

  const handleAddField = (type) => {
    const id = `custom_${type}_${Date.now()}`;
    let newField = {
      id,
      type,
      label: 'New Field',
      placeholder: '',
      required: false,
      isSystem: false,
      locked: false
    };

    if (type === 'text') {
      newField.label = 'Custom Text Field';
      newField.placeholder = 'e.g. Host Employee or Room';
    } else if (type === 'phone') {
      newField.label = 'Contact Phone';
      newField.placeholder = 'e.g. +44 7700 900077';
    } else if (type === 'number') {
      newField.label = 'Number of Guests / Devices';
      newField.min = 1;
      newField.max = 20;
      newField.step = 1;
      newField.placeholder = 'Scroll to select number';
    } else if (type === 'textarea') {
      newField.label = 'Special Notes / Requests';
      newField.placeholder = 'Any additional details for your visit...';
    } else if (type === 'select') {
      newField.label = 'Purpose of Visit';
      newField.options = ['Client Meeting', 'Contractor / Vendor', 'Interview', 'Event Attendee'];
    } else if (type === 'checkbox') {
      newField.label = 'I agree to the Guest Wi-Fi Acceptable Use Policy';
      newField.required = true;
    }

    setFormConfig(prev => ({
      ...prev,
      fields: [...prev.fields, newField]
    }));
    setShowAddFieldModal(false);
  };

  const handleDeleteField = (index) => {
    const field = formConfig.fields[index];
    if (field.locked) {
      alert('This core system field is required for booking processing and cannot be removed.');
      return;
    }
    if (!confirm(`Are you sure you want to remove the field "${field.label}"?`)) return;

    setFormConfig(prev => {
      const newFields = [...prev.fields];
      newFields.splice(index, 1);
      return { ...prev, fields: newFields };
    });
  };

  const handleMoveField = (fromIndex, toIndex) => {
    if (toIndex < 0 || toIndex >= formConfig.fields.length) return;
    setFormConfig(prev => {
      const newFields = [...prev.fields];
      const [moved] = newFields.splice(fromIndex, 1);
      newFields.splice(toIndex, 0, moved);
      return { ...prev, fields: newFields };
    });
  };

  // Drag and drop handlers
  const handleDragStart = (e, index) => {
    setDragIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDrop = (index) => {
    if (dragIndex !== null && dragIndex !== index) {
      handleMoveField(dragIndex, index);
    }
    setDragIndex(null);
    setDragOverIndex(null);
  };

  const handleSaveFormConfig = async () => {
    try {
      setSavingForm(true);
      const res = await axios.post(`${API_BASE}/api/form-config`, formConfig);
      setFormConfig(res.data.formConfig);
      setFormSaved(true);
      setTimeout(() => setFormSaved(false), 3000);
    } catch (err) {
      alert('Failed to save form layout: ' + (err.response?.data?.error || err.message));
    } finally {
      setSavingForm(false);
    }
  };

  const handleResetFormConfig = async () => {
    if (!confirm('Reset form fields and layout to the default configuration? Any custom fields will be removed.')) return;
    try {
      setSavingForm(true);
      const defaultFields = [
        { id: 'name', type: 'text', label: 'Your Name', placeholder: 'e.g. Sarah Jenkins', required: true, isSystem: true, locked: true },
        { id: 'email', type: 'email', label: 'Email Address', placeholder: 'Where to send access credentials', required: true, isSystem: true, locked: true },
        { id: 'phone', type: 'phone', label: 'Phone Number', placeholder: 'e.g. +44 7700 900077', required: false, isSystem: true, locked: false },
        { id: 'company', type: 'text', label: 'Company / Event', placeholder: 'e.g. Acme Studio / Client Presentation', required: false, isSystem: true, locked: false },
        { id: 'date', type: 'date', label: 'Visit Date', required: true, isSystem: true, locked: true },
        { id: 'time', type: 'time', label: 'Start Time', required: true, isSystem: true, locked: true },
        { id: 'duration', type: 'duration', label: 'Access Duration', required: true, isSystem: true, locked: true },
        { id: 'requireInternet', type: 'checkbox', label: 'Do you require internet access?', defaultValue: true, required: false, isSystem: true, locked: true },
        { id: 'network', type: 'network_select', label: 'Preferred Network', required: false, isSystem: true, locked: false, condition: { fieldId: 'requireInternet', showWhen: true } },
        { id: 'sendTiming', type: 'timing_select', label: 'When should your password be delivered?', required: true, isSystem: true, locked: false, condition: { fieldId: 'requireInternet', showWhen: true } }
      ];
      const resetConfig = {
        title: 'Guest Wi-Fi Booking',
        description: 'Schedule temporary, secure high-speed Wi-Fi access for your upcoming visit.',
        submitButtonText: 'Request Wi-Fi Access',
        fields: defaultFields
      };
      const res = await axios.post(`${API_BASE}/api/form-config`, resetConfig);
      setFormConfig(res.data.formConfig);
      setFormSaved(true);
      setTimeout(() => setFormSaved(false), 3000);
    } catch (err) {
      alert('Failed to reset form layout: ' + err.message);
    } finally {
      setSavingForm(false);
    }
  };

  // --- Queue Handlers ---
  const handleOpenApproveModal = (booking) => {
    setSelectedBooking(booking);
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
    if (reason === null) return;
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
            <h1>Embed Creator & Booking Manager</h1>
            <p>Customize embed form fields Google Forms-style and review guest access requests.</p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={fetchData} 
              disabled={loading}
              title="Refresh data"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Tab Controls */}
        <div style={{ display: 'flex', gap: '8px', marginTop: '20px', borderBottom: '1px solid var(--card-border)', paddingBottom: '12px', flexWrap: 'wrap' }}>
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
                color: '#000', 
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
            className={`btn ${activeTab === 'builder' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
            onClick={() => setActiveTab('builder')}
          >
            <Sliders size={15} />
            <span>Form Builder</span>
          </button>
          
          <button 
            type="button"
            className={`btn ${activeTab === 'embed' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
            onClick={() => setActiveTab('embed')}
          >
            <Code2 size={15} />
            <span>Embed Code</span>
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

      {/* TAB 1: REQUEST QUEUE */}
      {activeTab === 'queue' && (
        <>
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
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px', flexWrap: 'wrap' }}>
                          <span style={{ fontWeight: 600, fontSize: '1.05rem', color: 'var(--text-primary)' }}>
                            {booking.name}
                          </span>
                          {booking.status === 'pending' && <span className="badge badge-warning">Pending Review</span>}
                          {booking.status === 'approved' && <span className="badge badge-success">Approved</span>}
                          {booking.status === 'rejected' && <span className="badge badge-danger">Rejected</span>}
                          {booking.requireInternet === false && (
                            <span className="badge" style={{ background: 'rgba(148, 163, 184, 0.15)', color: '#cbd5e1', border: '1px solid rgba(148, 163, 184, 0.3)', display: 'inline-flex', alignItems: 'center', gap: '4px', textTransform: 'none' }}>
                              <Building size={12} /> Facility Visit (No Wi-Fi)
                            </span>
                          )}
                        </div>

                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <Mail size={14} /> {booking.email}
                          </span>
                          {booking.phone && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                              <Phone size={14} /> {booking.phone}
                            </span>
                          )}
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

                        {booking.requireInternet !== false ? (
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
                        ) : (
                          <div style={{ marginTop: '10px', fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', flexWrap: 'wrap', gap: '14px' }}>
                            <span>
                              <strong>Access Type:</strong>{' '}
                              <span style={{ color: '#94a3b8' }}>Facility Visit Only (No Wi-Fi credentials requested)</span>
                            </span>
                          </div>
                        )}

                        {/* Display custom field values submitted */}
                        {booking.customFields && Object.keys(booking.customFields).length > 0 && (
                          <div style={{ marginTop: '10px', padding: '8px 12px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '6px', border: '1px solid var(--card-border)', display: 'flex', flexWrap: 'wrap', gap: '12px', fontSize: '0.8rem' }}>
                            {Object.entries(booking.customFields).map(([label, val]) => (
                              <div key={label}>
                                <strong style={{ color: '#94a3b8' }}>{label}:</strong>{' '}
                                <span style={{ color: '#fff' }}>{typeof val === 'boolean' ? (val ? 'Yes' : 'No') : String(val)}</span>
                              </div>
                            ))}
                          </div>
                        )}

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

      {/* TAB 2: FORM BUILDER */}
      {activeTab === 'builder' && formConfig && (
        <div style={{ display: 'grid', gridTemplateColumns: previewTab ? '1fr 1fr' : '1fr', gap: '24px' }}>
          <div>
            {/* Top Toolbar */}
            <div className="card" style={{ marginBottom: '20px', padding: '16px 20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <button 
                    type="button" 
                    className="btn btn-primary btn-sm"
                    onClick={() => setShowAddFieldModal(true)}
                  >
                    <Plus size={16} />
                    <span>Add Form Field</span>
                  </button>

                  <button 
                    type="button" 
                    className="btn btn-secondary btn-sm"
                    onClick={() => setPreviewTab(!previewTab)}
                  >
                    <Eye size={15} />
                    <span>{previewTab ? 'Hide Live Preview' : 'Show Split Preview'}</span>
                  </button>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <button 
                    type="button" 
                    className="btn btn-secondary btn-sm"
                    onClick={handleResetFormConfig}
                    disabled={savingForm}
                    title="Reset to default fields"
                  >
                    <RotateCcw size={15} />
                    <span>Reset Defaults</span>
                  </button>

                  <button 
                    type="button" 
                    className="btn btn-primary btn-sm"
                    onClick={handleSaveFormConfig}
                    disabled={savingForm}
                  >
                    {savingForm ? <RefreshCw size={15} className="animate-spin" /> : <Save size={15} />}
                    <span>{savingForm ? 'Saving...' : 'Save Form Layout'}</span>
                  </button>

                  {formSaved && (
                    <span style={{ color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem' }}>
                      <CheckCircle2 size={15} /> Saved!
                    </span>
                  )}
                </div>
              </div>

              {/* Form Title & Subtitle Edit */}
              <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--card-border)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label htmlFor="formTitleInput">Form Header Title</label>
                  <input 
                    id="formTitleInput"
                    type="text" 
                    value={formConfig.title || ''} 
                    onChange={e => setFormConfig(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Guest Wi-Fi Booking"
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label htmlFor="formDescInput">Form Subtitle / Instructions</label>
                  <input 
                    id="formDescInput"
                    type="text" 
                    value={formConfig.description || ''} 
                    onChange={e => setFormConfig(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Brief description for visitors..."
                  />
                </div>
              </div>
            </div>

            {/* Field Cards (Drag & Drop Kanban-Style) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {formConfig.fields.map((field, index) => {
                const isDragging = dragIndex === index;
                const isDragOver = dragOverIndex === index;

                return (
                  <div 
                    key={field.id}
                    className={`card builder-field-card ${isDragging ? 'dragging' : ''} ${isDragOver ? 'drag-over' : ''} ${field.condition?.fieldId ? 'has-condition' : ''}`}
                    draggable
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDrop={() => handleDrop(index)}
                    onDragEnd={() => { setDragIndex(null); setDragOverIndex(null); }}
                    style={{ 
                      padding: '14px 18px',
                      borderLeft: field.condition?.fieldId ? '3px solid #38bdf8' : (field.locked ? '3px solid var(--primary)' : '3px solid var(--text-secondary)')
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                      {/* Left: Drag Handle & Field Type Badge */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div 
                          className="drag-handle" 
                          title="Click and drag to reorder field"
                          style={{ cursor: 'grab', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center' }}
                        >
                          <GripVertical size={18} />
                        </div>

                        <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>
                          {index + 1}. {field.label || 'Untitled Field'}
                        </span>

                        <span className="badge" style={{ fontSize: '0.7rem', padding: '2px 8px' }}>
                          {field.type === 'text' && 'Text'}
                          {field.type === 'email' && 'Email'}
                          {field.type === 'phone' && 'Phone'}
                          {field.type === 'number' && 'Number (iOS Wheel)'}
                          {field.type === 'textarea' && 'Paragraph'}
                          {field.type === 'select' && 'Dropdown'}
                          {field.type === 'checkbox' && 'Checkbox'}
                          {field.type === 'date' && 'Date'}
                          {field.type === 'time' && 'Time'}
                          {field.type === 'duration' && 'Duration'}
                          {field.type === 'network_select' && 'Network Picker'}
                          {field.type === 'timing_select' && 'Delivery Timing'}
                        </span>

                        {field.locked && (
                          <span className="badge badge-info" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.65rem' }}>
                            <Lock size={10} /> System Core
                          </span>
                        )}

                        {field.condition && field.condition.fieldId && (() => {
                          const triggerField = formConfig.fields.find(f => f.id === field.condition.fieldId);
                          const conditionDesc = typeof field.condition.showWhen === 'boolean'
                            ? (field.condition.showWhen ? 'Checked' : 'Unchecked')
                            : `"${field.condition.showWhen}"`;
                          return (
                            <span 
                              className="badge badge-info" 
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.68rem', background: 'rgba(56, 189, 248, 0.12)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.25)', textTransform: 'none' }}
                              title={`Visible only when ${triggerField?.label || field.condition.fieldId} is ${conditionDesc}`}
                            >
                              <Eye size={11} /> Only if "{triggerField?.label || field.condition.fieldId}" is {conditionDesc}
                            </span>
                          );
                        })()}
                      </div>

                      {/* Right: Reorder Up/Down & Delete */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <button 
                          type="button" 
                          className="btn btn-secondary btn-sm btn-icon"
                          onClick={() => handleMoveField(index, index - 1)}
                          disabled={index === 0}
                          title="Move up"
                        >
                          <ArrowUp size={14} />
                        </button>
                        <button 
                          type="button" 
                          className="btn btn-secondary btn-sm btn-icon"
                          onClick={() => handleMoveField(index, index + 1)}
                          disabled={index === formConfig.fields.length - 1}
                          title="Move down"
                        >
                          <ArrowDown size={14} />
                        </button>
                        
                        {!field.locked ? (
                          <button 
                            type="button" 
                            className="btn btn-danger btn-sm btn-icon"
                            onClick={() => handleDeleteField(index)}
                            title="Remove field"
                          >
                            <Trash2 size={14} />
                          </button>
                        ) : (
                          <div style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }} title="Core field cannot be deleted">
                            <Lock size={14} />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Field Properties Inputs */}
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 2fr auto', gap: '12px', alignItems: 'center' }}>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Field Label</label>
                        <input 
                          type="text" 
                          value={field.label} 
                          onChange={e => handleFieldChange(index, { label: e.target.value })}
                          placeholder="e.g. Visitor Name"
                        />
                      </div>

                      {field.type !== 'checkbox' && field.type !== 'date' && field.type !== 'time' && field.type !== 'duration' && field.type !== 'network_select' && field.type !== 'timing_select' ? (
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Placeholder</label>
                          <input 
                            type="text" 
                            value={field.placeholder || ''} 
                            onChange={e => handleFieldChange(index, { placeholder: e.target.value })}
                            placeholder="Input placeholder..."
                          />
                        </div>
                      ) : (
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          {field.type === 'duration' && 'Hours & minutes selector'}
                          {field.type === 'network_select' && 'Selects Wi-Fi network'}
                          {field.type === 'timing_select' && 'Selects password delivery timing'}
                          {field.type === 'date' && 'Calendar date picker'}
                          {field.type === 'time' && 'Time slot picker'}
                          {field.type === 'checkbox' && 'Single toggle / acceptance'}
                        </div>
                      )}

                      {/* Required Toggle */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '16px' }}>
                        <input 
                          type="checkbox"
                          id={`req_${field.id}`}
                          checked={Boolean(field.required)}
                          disabled={field.locked}
                          onChange={e => handleFieldChange(index, { required: e.target.checked })}
                          style={{ width: '16px', height: '16px', cursor: field.locked ? 'not-allowed' : 'pointer' }}
                        />
                        <label htmlFor={`req_${field.id}`} style={{ margin: 0, fontSize: '0.8rem', cursor: field.locked ? 'not-allowed' : 'pointer', color: field.locked ? 'var(--text-muted)' : 'var(--text-primary)' }}>
                          Required
                        </label>
                      </div>
                    </div>

                    {/* Extra options for Select */}
                    {field.type === 'select' && (
                      <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px dashed var(--card-border)' }}>
                        <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                          Dropdown Options (comma-separated):
                        </label>
                        <input 
                          type="text"
                          value={(field.options || []).join(', ')}
                          onChange={e => {
                            const opts = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                            handleFieldChange(index, { options: opts });
                          }}
                          placeholder="Option 1, Option 2, Option 3"
                        />
                      </div>
                    )}

                    {/* Extra options for Number (iOS Wheel) */}
                    {field.type === 'number' && (
                      <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px dashed var(--card-border)', display: 'flex', gap: '16px' }}>
                        <div style={{ flex: 1 }}>
                          <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Minimum Value</label>
                          <input 
                            type="number" 
                            value={field.min ?? 1} 
                            onChange={e => handleFieldChange(index, { min: parseInt(e.target.value, 10) || 1 })}
                          />
                        </div>
                        <div style={{ flex: 1 }}>
                          <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Maximum Value</label>
                          <input 
                            type="number" 
                            value={field.max ?? 20} 
                            onChange={e => handleFieldChange(index, { max: parseInt(e.target.value, 10) || 20 })}
                          />
                        </div>
                        <div style={{ flex: 1 }}>
                          <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Step Increment</label>
                          <input 
                            type="number" 
                            value={field.step ?? 1} 
                            onChange={e => handleFieldChange(index, { step: parseInt(e.target.value, 10) || 1 })}
                          />
                        </div>
                      </div>
                    )}

                    {/* Checkbox Default Value Setting */}
                    {field.type === 'checkbox' && (
                      <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px dashed var(--card-border)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input 
                          type="checkbox"
                          id={`def_${field.id}`}
                          checked={field.defaultValue !== undefined ? Boolean(field.defaultValue) : false}
                          onChange={e => handleFieldChange(index, { defaultValue: e.target.checked })}
                          style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                        />
                        <label htmlFor={`def_${field.id}`} style={{ margin: 0, fontSize: '0.8rem', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                          Checked by default when form loads
                        </label>
                      </div>
                    )}

                    {/* Conditional Visibility Rules Editor */}
                    <div className="conditional-rule-box" style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px dashed var(--card-border)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '6px' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <Eye size={12} color="var(--primary)" /> Conditional Visibility Rule
                        </span>
                        {field.condition && field.condition.fieldId && (
                          <button 
                            type="button" 
                            className="btn btn-secondary btn-sm"
                            style={{ height: '22px', padding: '0 8px', fontSize: '0.7rem' }}
                            onClick={() => handleFieldChange(index, { condition: null })}
                          >
                            Clear Rule (Always Show)
                          </button>
                        )}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Show this field:</span>
                        <select 
                          value={field.condition?.fieldId ? 'conditional' : 'always'}
                          onChange={(e) => {
                            if (e.target.value === 'always') {
                              handleFieldChange(index, { condition: null });
                            } else {
                              const candidate = formConfig.fields.find(f => f.id !== field.id && (f.id === 'requireInternet' || f.type === 'checkbox' || f.type === 'select')) || formConfig.fields.find(f => f.id !== field.id);
                              if (candidate) {
                                const defaultShowWhen = candidate.type === 'checkbox' ? true : (candidate.options?.[0] || 'true');
                                handleFieldChange(index, { 
                                  condition: { fieldId: candidate.id, showWhen: defaultShowWhen } 
                                });
                              }
                            }
                          }}
                          style={{ width: 'auto', minWidth: '130px', height: '32px', fontSize: '0.8rem' }}
                        >
                          <option value="always">Always Visible</option>
                          <option value="conditional">Only when condition is met...</option>
                        </select>

                        {field.condition?.fieldId && (
                          <>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>When</span>
                            <select 
                              value={field.condition.fieldId}
                              onChange={(e) => {
                                const targetField = formConfig.fields.find(f => f.id === e.target.value);
                                const defaultVal = targetField?.type === 'checkbox' ? true : (targetField?.options?.[0] || '');
                                handleFieldChange(index, { 
                                  condition: { fieldId: e.target.value, showWhen: defaultVal } 
                                });
                              }}
                              style={{ width: 'auto', minWidth: '160px', height: '32px', fontSize: '0.8rem' }}
                            >
                              {formConfig.fields.filter(f => f.id !== field.id).map(f => (
                                <option key={f.id} value={f.id}>
                                  {f.label || f.id} ({f.type})
                                </option>
                              ))}
                            </select>

                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>is</span>
                            {(() => {
                              const targetField = formConfig.fields.find(f => f.id === field.condition.fieldId);
                              if (targetField?.type === 'checkbox') {
                                return (
                                  <select 
                                    value={String(field.condition.showWhen)}
                                    onChange={(e) => handleFieldChange(index, { 
                                      condition: { ...field.condition, showWhen: e.target.value === 'true' } 
                                    })}
                                    style={{ width: 'auto', minWidth: '130px', height: '32px', fontSize: '0.8rem' }}
                                  >
                                    <option value="true">Checked (Yes)</option>
                                    <option value="false">Unchecked (No)</option>
                                  </select>
                                );
                              } else if (targetField?.type === 'select' && targetField.options?.length) {
                                return (
                                  <select 
                                    value={field.condition.showWhen}
                                    onChange={(e) => handleFieldChange(index, { 
                                      condition: { ...field.condition, showWhen: e.target.value } 
                                    })}
                                    style={{ width: 'auto', minWidth: '130px', height: '32px', fontSize: '0.8rem' }}
                                  >
                                    {targetField.options.map(opt => (
                                      <option key={opt} value={opt}>{opt}</option>
                                    ))}
                                  </select>
                                );
                              } else {
                                return (
                                  <input 
                                    type="text" 
                                    value={field.condition.showWhen ?? ''} 
                                    onChange={(e) => handleFieldChange(index, { 
                                      condition: { ...field.condition, showWhen: e.target.value } 
                                    })}
                                    placeholder="Value to match"
                                    style={{ width: '130px', height: '32px', fontSize: '0.8rem' }}
                                  />
                                );
                              }
                            })()}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Optional Split-Pane Live Preview */}
          {previewTab && (
            <div style={{ position: 'sticky', top: '20px', alignSelf: 'flex-start' }}>
              <div className="card" style={{ padding: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid var(--card-border)', paddingBottom: '10px' }}>
                  <span style={{ fontWeight: 600, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Eye size={16} color="var(--primary)" /> Real-Time Form Preview
                  </span>
                  <span className="badge badge-info" style={{ fontSize: '0.7rem' }}>Interactive Demo</span>
                </div>
                <div style={{ background: '#070a12', borderRadius: '10px', padding: '16px', maxHeight: '780px', overflowY: 'auto' }}>
                  <PublicBookingForm overrideConfig={formConfig} isPreview={true} />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: EMBED GENERATOR */}
      {activeTab === 'embed' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Website Embed Snippet</h3>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '16px' }}>
              Paste this HTML snippet into any page on your website (e.g. visitor portal, reception kiosk, or meeting room booking system).
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

          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Live Embed Preview</h3>
            </div>
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

      {/* TAB 4: ALERT SETTINGS */}
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

      {/* MODAL: ADD FIELD PICKER */}
      {showAddFieldModal && (
        <div className="modal-overlay">
          <div className="modal-content animate-in" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 600 }}>
                Add New Form Field
              </h3>
              <button 
                type="button" 
                className="btn-icon btn-sm" 
                onClick={() => setShowAddFieldModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <div className="modal-body" style={{ padding: '20px 0' }}>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '16px' }}>
                Select a field type to add to your booking form. You can reorder, rename, and customize it anytime.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  style={{ justifyContent: 'flex-start', height: 'auto', padding: '12px 14px' }}
                  onClick={() => handleAddField('text')}
                >
                  <Type size={18} color="var(--primary)" />
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>Short Text</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Host name, badge, room</div>
                  </div>
                </button>

                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  style={{ justifyContent: 'flex-start', height: 'auto', padding: '12px 14px' }}
                  onClick={() => handleAddField('phone')}
                >
                  <Phone size={18} color="#10b981" />
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>Phone Number</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>SMS / mobile contact</div>
                  </div>
                </button>

                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  style={{ justifyContent: 'flex-start', height: 'auto', padding: '12px 14px' }}
                  onClick={() => handleAddField('number')}
                >
                  <Hash size={18} color="#8b5cf6" />
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>iOS Wheel Number</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Drum scroll selector</div>
                  </div>
                </button>

                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  style={{ justifyContent: 'flex-start', height: 'auto', padding: '12px 14px' }}
                  onClick={() => handleAddField('select')}
                >
                  <List size={18} color="#f59e0b" />
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>Dropdown Select</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Pick from custom list</div>
                  </div>
                </button>

                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  style={{ justifyContent: 'flex-start', height: 'auto', padding: '12px 14px' }}
                  onClick={() => handleAddField('textarea')}
                >
                  <FileText size={18} color="#38bdf8" />
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>Paragraph / Notes</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Multi-line explanations</div>
                  </div>
                </button>

                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  style={{ justifyContent: 'flex-start', height: 'auto', padding: '12px 14px' }}
                  onClick={() => handleAddField('checkbox')}
                >
                  <CheckSquare size={18} color="#ec4899" />
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>Checkbox Agreement</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Terms & Wi-Fi policy</div>
                  </div>
                </button>
              </div>
            </div>

            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={() => setShowAddFieldModal(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: REVIEW & APPROVE */}
      {selectedBooking && (
        <div className="modal-overlay">
          <div className="modal-content animate-in" style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 600 }}>
                {selectedBooking.requireInternet === false ? 'Approve Facility Visit' : 'Approve Wi-Fi Request'}
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
                {selectedBooking.phone && (
                  <div style={{ marginBottom: '6px' }}><strong>Phone:</strong> {selectedBooking.phone}</div>
                )}
                <div style={{ marginBottom: '6px' }}><strong>Organization:</strong> {selectedBooking.company || 'Not Specified'}</div>
                <div style={{ marginBottom: '6px' }}><strong>Visit Slot:</strong> {selectedBooking.date} at {selectedBooking.time}</div>
                <div style={{ marginBottom: '6px' }}><strong>Duration:</strong> {selectedBooking.durationHours || 1}h {selectedBooking.durationMinutes || 0}m</div>
                <div>
                  <strong>Wi-Fi Access:</strong>{' '}
                  <span style={{ color: selectedBooking.requireInternet === false ? '#94a3b8' : 'var(--success)', fontWeight: 600 }}>
                    {selectedBooking.requireInternet === false ? 'Not Requested (Facility Visit Only)' : 'Requested'}
                  </span>
                </div>
                
                {selectedBooking.customFields && Object.keys(selectedBooking.customFields).length > 0 && (
                  <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px dashed var(--card-border)' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Custom Responses:</div>
                    {Object.entries(selectedBooking.customFields).map(([lbl, val]) => (
                      <div key={lbl} style={{ fontSize: '0.85rem' }}>
                        <strong>{lbl}:</strong> {typeof val === 'boolean' ? (val ? 'Yes' : 'No') : String(val)}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {selectedBooking.requireInternet !== false ? (
                <>
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
                </>
              ) : (
                <>
                  <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--card-border)', borderRadius: '8px', padding: '14px 16px', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f1f5f9', fontWeight: 600, fontSize: '0.9rem', marginBottom: '6px' }}>
                      <Building size={16} color="var(--primary)" /> Facility Visit Only (No Wi-Fi Requested)
                    </div>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8', lineHeight: 1.5 }}>
                      The guest is requesting facility access only. Approving will log their visit and send an email confirmation. <strong>No Wi-Fi credentials or calendar rotation jobs will be created.</strong>
                    </p>
                  </div>

                  <div style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: '8px', padding: '12px 14px', marginTop: '16px' }}>
                    <div style={{ fontSize: '0.8rem', color: '#a7f3d0', lineHeight: 1.5 }}>
                      <strong>Automated Actions on Approval:</strong>
                      <ul style={{ margin: '4px 0 0 0', paddingLeft: '18px' }}>
                        <li>Visit confirmation email dispatched to guest confirming schedule & duration.</li>
                        <li>Booking status marked as Approved in Bastion.</li>
                        <li>No Wi-Fi credentials generated or network access provisioned.</li>
                      </ul>
                    </div>
                  </div>
                </>
              )}
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
                <span>{actionLoading ? 'Approving...' : (selectedBooking.requireInternet === false ? 'Confirm & Approve Visit' : 'Confirm & Approve')}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
