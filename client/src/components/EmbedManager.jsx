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
  FileText,
  Palette,
  ChevronDown,
  ChevronUp,
  GitBranch,
  Asterisk
} from 'lucide-react';
import PublicBookingForm from './PublicBookingForm';

const API_BASE = import.meta.env.PROD ? '' : 'http://localhost:3050';

const THEME_PRESETS = [
  {
    name: 'Bastion Dark',
    id: 'bastion_dark',
    theme: {
      cardBg: '#111726',
      cardBorder: '#222834',
      textColor: '#f1f5f9',
      secondaryTextColor: '#94a3b8',
      inputBg: '#0a0f1d',
      inputBorder: '#222834',
      inputTextColor: '#f1f5f9',
      primaryColor: '#0086d6',
      buttonTextColor: '#ffffff',
      borderRadius: '16px'
    }
  },
  {
    name: 'Clean Light',
    id: 'clean_light',
    theme: {
      cardBg: '#ffffff',
      cardBorder: '#e2e8f0',
      textColor: '#0f172a',
      secondaryTextColor: '#64748b',
      inputBg: '#f8fafc',
      inputBorder: '#cbd5e1',
      inputTextColor: '#0f172a',
      primaryColor: '#2563eb',
      buttonTextColor: '#ffffff',
      borderRadius: '12px'
    }
  },
  {
    name: 'Midnight Slate',
    id: 'midnight_slate',
    theme: {
      cardBg: '#0f172a',
      cardBorder: '#334155',
      textColor: '#f8fafc',
      secondaryTextColor: '#94a3b8',
      inputBg: '#1e293b',
      inputBorder: '#334155',
      inputTextColor: '#f8fafc',
      primaryColor: '#38bdf8',
      buttonTextColor: '#0f172a',
      borderRadius: '16px'
    }
  },
  {
    name: 'Emerald Corporate',
    id: 'emerald',
    theme: {
      cardBg: '#064e3b',
      cardBorder: '#065f46',
      textColor: '#ecfdf5',
      secondaryTextColor: '#a7f3d0',
      inputBg: '#022c22',
      inputBorder: '#047857',
      inputTextColor: '#ecfdf5',
      primaryColor: '#10b981',
      buttonTextColor: '#ffffff',
      borderRadius: '12px'
    }
  },
  {
    name: 'Warm Cream',
    id: 'warm_cream',
    theme: {
      cardBg: '#fefae0',
      cardBorder: '#dda15e',
      textColor: '#283618',
      secondaryTextColor: '#606c38',
      inputBg: '#ffffff',
      inputBorder: '#dda15e',
      inputTextColor: '#283618',
      primaryColor: '#bc6c25',
      buttonTextColor: '#ffffff',
      borderRadius: '14px'
    }
  },
  {
    name: 'Pure Onyx',
    id: 'pure_onyx',
    theme: {
      cardBg: '#000000',
      cardBorder: '#27272a',
      textColor: '#ffffff',
      secondaryTextColor: '#a1a1aa',
      inputBg: '#18181b',
      inputBorder: '#3f3f46',
      inputTextColor: '#ffffff',
      primaryColor: '#ffffff',
      buttonTextColor: '#000000',
      borderRadius: '8px'
    }
  }
];

export default function EmbedManager() {
  const [activeTab, setActiveTab] = useState('queue'); // 'queue' | 'builder' | 'embed' | 'notifications'
  const [bookings, setBookings] = useState([]);
  const [networks, setNetworks] = useState([]);
  const [settings, setSettings] = useState({});
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  
  // Refresh indicator & cache buster
  const [refreshing, setRefreshing] = useState(false);
  const [refreshedToast, setRefreshedToast] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Form Builder state
  const [formConfig, setFormConfig] = useState(null);
  const [savingForm, setSavingForm] = useState(false);
  const [formSaved, setFormSaved] = useState(false);
  const [showAddFieldModal, setShowAddFieldModal] = useState(false);
  const [previewTab, setPreviewTab] = useState(true); // toggle preview side-by-side or tab
  const [expandedFieldIds, setExpandedFieldIds] = useState([]);

  // Theme Customizer Modal state
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [savingTheme, setSavingTheme] = useState(false);
  const [themeSaved, setThemeSaved] = useState(false);
  const [tempTheme, setTempTheme] = useState(null);

  // Drag and Drop state
  const [dragIndex, setDragIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  // Approval Modal state
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [assignedNetworkId, setAssignedNetworkId] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [approvalAvailability, setApprovalAvailability] = useState([]);
  const [checkingApprovalAvail, setCheckingApprovalAvail] = useState(false);

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
      setRefreshing(true);
      const cacheBust = Date.now();
      const [bookingsRes, networksRes, settingsRes, formRes] = await Promise.all([
        axios.get(`${API_BASE}/api/bookings?_t=${cacheBust}`),
        axios.get(`${API_BASE}/api/networks?_t=${cacheBust}`),
        axios.get(`${API_BASE}/api/settings?_t=${cacheBust}`),
        axios.get(`${API_BASE}/api/form-config?_t=${cacheBust}`),
        new Promise(resolve => setTimeout(resolve, 500))
      ]);
      setBookings(bookingsRes.data.bookings || []);
      setNetworks(networksRes.data || []);
      
      const s = settingsRes.data.settings || {};
      setSettings(s);
      setAlertEmail(s.bookingAlertEmail || s.globalAdminEmail || s.testEmailRecipient || s.smtpUser || '');

      setFormConfig(formRes.data || null);
      setRefreshKey(k => k + 1);
      setRefreshedToast(true);
      setTimeout(() => setRefreshedToast(false), 2200);
    } catch (err) {
      console.error('Failed to load embed manager data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
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
    setExpandedFieldIds(prev => [...prev, id]);
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

  const getFieldTypeLabel = (type) => {
    switch (type) {
      case 'text': return 'Text';
      case 'email': return 'Email';
      case 'phone': return 'Phone';
      case 'number': return 'Number';
      case 'textarea': return 'Paragraph';
      case 'select': return 'Dropdown';
      case 'checkbox': return 'Checkbox';
      case 'date': return 'Date';
      case 'time': return 'Time';
      case 'duration': return 'Duration';
      case 'network_select': return 'Network';
      case 'timing_select': return 'Timing';
      default: return type;
    }
  };

  const toggleFieldExpand = (id) => {
    setExpandedFieldIds(prev => 
      prev.includes(id) ? prev.filter(fId => fId !== id) : [...prev, id]
    );
  };

  const expandAllFields = () => {
    if (formConfig?.fields) {
      setExpandedFieldIds(formConfig.fields.map(f => f.id));
    }
  };

  const collapseAllFields = () => {
    setExpandedFieldIds([]);
  };

  // --- Theme Customizer Handlers ---
  const handleOpenThemeModal = () => {
    const defaultTheme = {
      cardBg: '#111726',
      cardBorder: '#222834',
      textColor: '#f1f5f9',
      secondaryTextColor: '#94a3b8',
      inputBg: '#0a0f1d',
      inputBorder: '#222834',
      inputTextColor: '#f1f5f9',
      primaryColor: '#0086d6',
      buttonTextColor: '#ffffff',
      borderRadius: '16px'
    };
    setTempTheme(formConfig?.theme ? { ...defaultTheme, ...formConfig.theme } : defaultTheme);
    setShowThemeModal(true);
  };

  const handleApplyPreset = (presetTheme) => {
    setTempTheme(prev => ({ ...prev, ...presetTheme }));
  };

  const handleSaveTheme = async () => {
    try {
      setSavingTheme(true);
      const updatedConfig = { ...formConfig, theme: tempTheme };
      const res = await axios.post(`${API_BASE}/api/form-config`, updatedConfig);
      setFormConfig(res.data.formConfig);
      setThemeSaved(true);
      setRefreshKey(k => k + 1);
      setTimeout(() => {
        setThemeSaved(false);
        setShowThemeModal(false);
      }, 1000);
    } catch (err) {
      alert('Failed to save theme: ' + (err.response?.data?.error || err.message));
    } finally {
      setSavingTheme(false);
    }
  };

  const handleResetThemeDefaults = () => {
    const defaultTheme = {
      cardBg: '#111726',
      cardBorder: '#222834',
      textColor: '#f1f5f9',
      secondaryTextColor: '#94a3b8',
      inputBg: '#0a0f1d',
      inputBorder: '#222834',
      inputTextColor: '#f1f5f9',
      primaryColor: '#0086d6',
      buttonTextColor: '#ffffff',
      borderRadius: '16px'
    };
    setTempTheme(defaultTheme);
  };

  // --- Queue Handlers ---
  const handleOpenApproveModal = async (booking) => {
    setSelectedBooking(booking);
    setCheckingApprovalAvail(true);
    let availList = [];
    try {
      const res = await axios.get(`${API_BASE}/api/public/networks/availability`, {
        params: {
          date: booking.date,
          time: booking.time,
          durationHours: booking.durationHours || 1,
          durationMinutes: booking.durationMinutes || 0,
          excludeBookingId: booking.id
        }
      });
      availList = res.data || [];
      setApprovalAvailability(availList);
    } catch (err) {
      console.error('Failed to fetch approval availability', err);
    } finally {
      setCheckingApprovalAvail(false);
    }

    const requested = networks.find(n => n.id === booking.requestedNetworkId);
    const requestedAvail = availList.find(n => n.id === booking.requestedNetworkId);

    // If requested network is available, select it; otherwise select first free network
    if (requested && (!requestedAvail || requestedAvail.available)) {
      setAssignedNetworkId(requested.id);
    } else {
      const firstFree = availList.find(n => n.available);
      if (firstFree) {
        setAssignedNetworkId(firstFree.id);
      } else if (requested) {
        setAssignedNetworkId(requested.id);
      } else if (networks.length > 0) {
        setAssignedNetworkId(networks[0].id);
      } else {
        setAssignedNetworkId('');
      }
    }
  };

  const handleApprove = async (force = false) => {
    if (!selectedBooking) return;
    try {
      setActionLoading(true);
      await axios.post(`${API_BASE}/api/bookings/${selectedBooking.id}/approve`, {
        assignedNetworkId,
        force
      });
      setSelectedBooking(null);
      await fetchData();
    } catch (err) {
      const data = err.response?.data;
      if (data && data.conflict) {
        if (confirm(`Scheduling Conflict Warning:\n\n${data.error}\n\nDo you want to override and approve this booking anyway?`)) {
          return handleApprove(true);
        }
      } else {
        alert('Failed to approve booking: ' + (data?.error || err.message));
      }
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
    <div className="animate-in embed-manager-page">
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
              disabled={refreshing || loading}
              title="Refresh data from server"
              style={{ minWidth: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
            >
              {refreshedToast ? (
                <>
                  <Check size={16} color="var(--success)" />
                  <span style={{ color: 'var(--success)', fontWeight: 600 }}>Refreshed!</span>
                </>
              ) : (
                <>
                  <RefreshCw size={16} className={refreshing || loading ? 'animate-spin' : ''} />
                  <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
                </>
              )}
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
        <div className="builder-split-grid" style={{ display: 'grid', gridTemplateColumns: previewTab ? 'minmax(0, 1fr) minmax(480px, 540px)' : '1fr', gap: '24px', alignItems: 'start' }}>
          <div>
            {/* Top Toolbar */}
            <div className="card" style={{ marginBottom: '20px', padding: '16px 20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
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
                    onClick={handleOpenThemeModal}
                    title="Customize form theme, colors, and styling"
                  >
                    <Palette size={15} color="var(--primary)" />
                    <span>Customize Theme</span>
                  </button>

                  <button 
                    type="button" 
                    className="btn btn-secondary btn-sm"
                    onClick={() => {
                      if (expandedFieldIds.length === (formConfig?.fields?.length || 0)) {
                        collapseAllFields();
                      } else {
                        expandAllFields();
                      }
                    }}
                    title={expandedFieldIds.length === (formConfig?.fields?.length || 0) ? 'Collapse all field cards' : 'Expand all field cards'}
                  >
                    {expandedFieldIds.length === (formConfig?.fields?.length || 0) ? (
                      <>
                        <ChevronUp size={15} />
                        <span>Collapse All</span>
                      </>
                    ) : (
                      <>
                        <ChevronDown size={15} />
                        <span>Expand All</span>
                      </>
                    )}
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {formConfig.fields.map((field, index) => {
                const isDragging = dragIndex === index;
                const isDragOver = dragOverIndex === index;
                const isExpanded = expandedFieldIds.includes(field.id);
                const hasCondition = Boolean(field.condition && field.condition.fieldId);
                const triggerField = hasCondition ? formConfig.fields.find(f => f.id === field.condition.fieldId) : null;
                const conditionDesc = hasCondition 
                  ? (typeof field.condition.showWhen === 'boolean' 
                      ? (field.condition.showWhen ? 'Checked' : 'Unchecked') 
                      : `"${field.condition.showWhen}"`)
                  : '';

                return (
                  <div 
                    key={field.id}
                    className={`builder-field-card ${isDragging ? 'dragging' : ''} ${isDragOver ? 'drag-over' : ''} ${hasCondition ? 'has-condition' : ''}`}
                    draggable
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDrop={() => handleDrop(index)}
                    onDragEnd={() => { setDragIndex(null); setDragOverIndex(null); }}
                    style={{ 
                      borderLeft: hasCondition ? '3px solid #38bdf8' : (field.locked ? '3px solid var(--primary)' : '3px solid rgba(255, 255, 255, 0.15)')
                    }}
                  >
                    {/* Compact Scannable Header Row */}
                    <div 
                      className="builder-card-header"
                      onClick={() => toggleFieldExpand(field.id)}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
                        <div 
                          className="drag-handle" 
                          title="Click and drag to reorder"
                          onClick={(e) => e.stopPropagation()}
                          style={{ cursor: 'grab', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', flexShrink: 0 }}
                        >
                          <GripVertical size={18} />
                        </div>

                        <span style={{ fontWeight: 600, fontSize: '0.92rem', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flexShrink: 1 }}>
                          {index + 1}. {field.label || 'Untitled Field'}
                        </span>

                        <span 
                          className="badge" 
                          title={`Field Type: ${field.type}`}
                          style={{ fontSize: '0.68rem', padding: '2px 7px', textTransform: 'none', flexShrink: 0, background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-secondary)', cursor: 'default' }}
                        >
                          {getFieldTypeLabel(field.type)}
                        </span>

                        {field.required && (
                          <span 
                            title="Required Field (Visitor must fill this out to submit the form)"
                            style={{ 
                              width: '20px', 
                              height: '20px', 
                              borderRadius: '50%', 
                              background: 'rgba(239, 68, 68, 0.15)', 
                              color: '#f87171', 
                              border: '1px solid rgba(239, 68, 68, 0.35)', 
                              display: 'inline-flex', 
                              alignItems: 'center', 
                              justifyContent: 'center', 
                              flexShrink: 0,
                              cursor: 'default'
                            }}
                          >
                            <Asterisk size={13} strokeWidth={2.5} />
                          </span>
                        )}

                        {field.locked && (
                          <span 
                            title="Core System Field (Protected: required for booking workflow and cannot be removed)"
                            style={{ 
                              width: '20px', 
                              height: '20px', 
                              borderRadius: '50%', 
                              background: 'rgba(0, 134, 214, 0.15)', 
                              color: '#38bdf8', 
                              border: '1px solid rgba(0, 134, 214, 0.3)', 
                              display: 'inline-flex', 
                              alignItems: 'center', 
                              justifyContent: 'center', 
                              flexShrink: 0,
                              cursor: 'default'
                            }}
                          >
                            <Lock size={11} />
                          </span>
                        )}

                        {hasCondition && (
                          <span 
                            title={`Conditional Logic: Shown only when "${triggerField?.label || field.condition.fieldId}" is ${conditionDesc}`}
                            style={{ 
                              width: '20px', 
                              height: '20px', 
                              borderRadius: '50%', 
                              background: 'rgba(56, 189, 248, 0.15)', 
                              color: '#38bdf8', 
                              border: '1px solid rgba(56, 189, 248, 0.35)', 
                              display: 'inline-flex', 
                              alignItems: 'center', 
                              justifyContent: 'center', 
                              flexShrink: 0,
                              cursor: 'default'
                            }}
                          >
                            <GitBranch size={11} />
                          </span>
                        )}
                      </div>

                      {/* Header Actions */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
                        <button 
                          type="button" 
                          className="btn btn-secondary btn-sm btn-icon"
                          onClick={() => handleMoveField(index, index - 1)}
                          disabled={index === 0}
                          title="Move up"
                          style={{ width: '28px', height: '28px', padding: 0 }}
                        >
                          <ArrowUp size={13} />
                        </button>
                        <button 
                          type="button" 
                          className="btn btn-secondary btn-sm btn-icon"
                          onClick={() => handleMoveField(index, index + 1)}
                          disabled={index === formConfig.fields.length - 1}
                          title="Move down"
                          style={{ width: '28px', height: '28px', padding: 0 }}
                        >
                          <ArrowDown size={13} />
                        </button>
                        
                        {!field.locked ? (
                          <button 
                            type="button" 
                            className="btn btn-danger btn-sm btn-icon"
                            onClick={() => handleDeleteField(index)}
                            title="Remove field"
                            style={{ width: '28px', height: '28px', padding: 0 }}
                          >
                            <Trash2 size={13} />
                          </button>
                        ) : (
                          <div style={{ width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }} title="Core field cannot be deleted">
                            <Lock size={13} />
                          </div>
                        )}

                        <button 
                          type="button" 
                          className="btn btn-secondary btn-sm"
                          onClick={() => toggleFieldExpand(field.id)}
                          style={{ height: '28px', padding: '0 8px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                        >
                          <span>{isExpanded ? 'Done' : 'Edit'}</span>
                          {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                        </button>
                      </div>
                    </div>

                    {/* Expandable Properties Drawer */}
                    {isExpanded && (
                      <div className="builder-card-body animate-in">
                        {/* Primary Label, Placeholder & Required */}
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

                        {/* Streamlined Conditional Visibility Section */}
                        {!hasCondition ? (
                          <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px dashed var(--card-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                              Visibility: <strong style={{ color: 'var(--text-secondary)' }}>Always visible</strong>
                            </span>
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm"
                              style={{ fontSize: '0.75rem', height: '28px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                              onClick={() => {
                                const candidate = formConfig.fields.find(f => f.id !== field.id && (f.id === 'requireInternet' || f.type === 'checkbox' || f.type === 'select')) || formConfig.fields.find(f => f.id !== field.id);
                                if (candidate) {
                                  const defaultShowWhen = candidate.type === 'checkbox' ? true : (candidate.options?.[0] || 'true');
                                  handleFieldChange(index, { 
                                    condition: { fieldId: candidate.id, showWhen: defaultShowWhen } 
                                  });
                                }
                              }}
                            >
                              <Plus size={13} />
                              <span>Add Visibility Condition</span>
                            </button>
                          </div>
                        ) : (
                          <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px dashed var(--card-border)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                              <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                <Eye size={13} /> Visibility Condition Active
                              </span>
                              <button 
                                type="button" 
                                className="btn btn-secondary btn-sm"
                                style={{ height: '24px', padding: '0 8px', fontSize: '0.7rem' }}
                                onClick={() => handleFieldChange(index, { condition: null })}
                              >
                                Remove Condition (Always Show)
                              </button>
                            </div>

                            <div style={{ background: 'rgba(56, 189, 248, 0.08)', border: '1px solid rgba(56, 189, 248, 0.25)', borderRadius: '8px', padding: '10px 12px', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Show this field only when</span>
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

                              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>is</span>
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
                            </div>
                          </div>
                        )}
                      </div>
                    )}
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
                  <span className="badge badge-info" style={{ fontSize: '0.7rem' }}>Interactive Demo (1:1 Live Scale)</span>
                </div>
                <div style={{ background: '#070a12', borderRadius: '10px', padding: '16px', maxHeight: 'calc(100vh - 120px)', overflowY: 'auto', display: 'flex', justifyContent: 'center' }}>
                  <div style={{ width: '100%', maxWidth: '480px' }}>
                    <PublicBookingForm overrideConfig={formConfig} isPreview={true} />
                  </div>
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
                key={refreshKey}
                src={`${embedUrl}?_rk=${refreshKey}`} 
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
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <label htmlFor="assignedNetworkSelect" style={{ margin: 0 }}>Assign Wi-Fi Network</label>
                      {checkingApprovalAvail && (
                        <span style={{ fontSize: '0.72rem', color: 'var(--primary)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <RefreshCw size={12} className="animate-spin" /> Checking slot availability...
                        </span>
                      )}
                    </div>
                    <select 
                      id="assignedNetworkSelect"
                      value={assignedNetworkId} 
                      onChange={e => setAssignedNetworkId(e.target.value)}
                    >
                      {networks.map(n => {
                        const avail = approvalAvailability.find(a => a.id === n.id);
                        const isAvail = avail ? avail.available : true;
                        return (
                          <option key={n.id} value={n.id}>
                            {n.name} {n.ssidName ? `(SSID: ${n.ssidName})` : ''} {!isAvail ? `— ⚠️ Overlap: ${avail?.conflictReason || 'Busy'}` : '— ✓ Available'}
                          </option>
                        );
                      })}
                    </select>

                    {(() => {
                      const avail = approvalAvailability.find(a => a.id === assignedNetworkId);
                      if (avail && !avail.available) {
                        return (
                          <div style={{ marginTop: '8px', padding: '8px 12px', background: 'rgba(245, 158, 11, 0.12)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: '8px', color: '#fcd34d', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <AlertCircle size={15} style={{ flexShrink: 0 }} />
                            <span><strong>Scheduling Conflict:</strong> {avail.conflictReason}. Double booking is disabled for this network.</span>
                          </div>
                        );
                      }
                      return null;
                    })()}

                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '6px', display: 'block' }}>
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

      {/* MODAL: THEME CUSTOMIZER */}
      {showThemeModal && tempTheme && (
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
          <div className="modal-content animate-in" style={{ maxWidth: '920px', width: '95%', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Palette size={20} color="var(--primary)" />
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 600 }}>
                  Embed Theme & Color Customizer
                </h3>
              </div>
              <button 
                type="button" 
                className="btn-icon btn-sm" 
                onClick={() => setShowThemeModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <div className="modal-body" style={{ overflowY: 'auto', padding: '16px 4px' }}>
              <div className="theme-modal-layout">
                {/* Left Column: Preset Selector and Color Controls */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {/* Presets */}
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>
                      Preset Themes
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px' }}>
                      {THEME_PRESETS.map(preset => (
                        <button
                          key={preset.id}
                          type="button"
                          className="theme-palette-btn"
                          onClick={() => handleApplyPreset(preset.theme)}
                        >
                          <span style={{ 
                            width: '14px', 
                            height: '14px', 
                            borderRadius: '50%', 
                            background: preset.theme.primaryColor,
                            border: `2px solid ${preset.theme.cardBg}`,
                            display: 'inline-block',
                            flexShrink: 0
                          }} />
                          <span style={{ fontSize: '0.78rem' }}>{preset.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Color Tokens List */}
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>
                      Color Scheme & Tokens
                    </label>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {[
                        { key: 'cardBg', label: 'Card Background' },
                        { key: 'cardBorder', label: 'Card Border' },
                        { key: 'textColor', label: 'Primary Heading & Text' },
                        { key: 'secondaryTextColor', label: 'Subtitle & Helper Text' },
                        { key: 'inputBg', label: 'Input Field Background' },
                        { key: 'inputBorder', label: 'Input Field Border' },
                        { key: 'inputTextColor', label: 'Input Text Color' },
                        { key: 'primaryColor', label: 'Button & Accent Color' },
                        { key: 'buttonTextColor', label: 'Button Text Color' }
                      ].map(token => {
                        const val = tempTheme[token.key] || '#ffffff';
                        return (
                          <div key={token.key} className="theme-color-row">
                            <span style={{ fontSize: '0.82rem', color: 'var(--text-primary)' }}>
                              {token.label}
                            </span>
                            <div className="theme-color-input-wrapper">
                              <input 
                                type="color" 
                                className="theme-native-color"
                                value={val.startsWith('#') && val.length === 7 ? val : '#000000'}
                                onChange={e => setTempTheme(prev => ({ ...prev, [token.key]: e.target.value }))}
                                title={`Pick color for ${token.label}`}
                              />
                              <input 
                                type="text"
                                className="theme-hex-code-input"
                                value={val}
                                onChange={e => setTempTheme(prev => ({ ...prev, [token.key]: e.target.value }))}
                                placeholder="#000000"
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Corner Radius */}
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>
                      Card Corner Radius
                    </label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {['4px', '8px', '12px', '16px', '24px'].map(r => (
                        <button
                          key={r}
                          type="button"
                          className={`btn btn-sm ${tempTheme.borderRadius === r ? 'btn-primary' : 'btn-secondary'}`}
                          onClick={() => setTempTheme(prev => ({ ...prev, borderRadius: r }))}
                          style={{ flex: 1, padding: '4px 8px', fontSize: '0.75rem' }}
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right Column: Real-Time Live Preview */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-secondary)', margin: 0 }}>
                      Live Appearance Preview
                    </label>
                    <span className="badge badge-info" style={{ fontSize: '0.7rem' }}>Matches External Site</span>
                  </div>

                  <div style={{
                    backgroundColor: tempTheme.cardBg || '#111726',
                    borderColor: tempTheme.cardBorder || '#222834',
                    borderWidth: '1px',
                    borderStyle: 'solid',
                    borderRadius: tempTheme.borderRadius || '16px',
                    padding: '24px',
                    color: tempTheme.textColor || '#f1f5f9',
                    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.45)',
                    transition: 'all 0.2s ease',
                    boxSizing: 'border-box'
                  }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(255, 255, 255, 0.05)', padding: '5px 12px', borderRadius: '999px', marginBottom: '12px', border: `1px solid ${tempTheme.cardBorder || 'rgba(255, 255, 255, 0.1)'}` }}>
                      <img src="/bastion-logo-v2.svg" alt="Bastion" width={20} height={20} />
                      <span style={{ fontWeight: 700, fontSize: '0.9rem', color: tempTheme.textColor || '#f1f5f9' }}>Bastion Access</span>
                    </div>

                    <h3 style={{ margin: '0 0 4px 0', fontSize: '1.2rem', fontWeight: 700, color: tempTheme.textColor || '#f1f5f9' }}>
                      {formConfig?.title || 'Guest Wi-Fi Booking'}
                    </h3>
                    <p style={{ margin: '0 0 16px 0', fontSize: '0.82rem', color: tempTheme.secondaryTextColor || '#94a3b8' }}>
                      {formConfig?.description || 'Schedule temporary, secure high-speed Wi-Fi access.'}
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div>
                        <label style={{ fontSize: '0.8rem', fontWeight: 500, color: tempTheme.textColor || '#f1f5f9', display: 'block', marginBottom: '4px' }}>
                          Your Name *
                        </label>
                        <input 
                          type="text" 
                          readOnly 
                          value="Sarah Jenkins"
                          style={{
                            width: '100%',
                            boxSizing: 'border-box',
                            backgroundColor: tempTheme.inputBg || '#0a0f1d',
                            borderColor: tempTheme.inputBorder || '#222834',
                            borderWidth: '1px',
                            borderStyle: 'solid',
                            color: tempTheme.inputTextColor || '#f1f5f9',
                            borderRadius: '8px',
                            padding: '8px 12px',
                            fontSize: '0.85rem'
                          }}
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: '0.8rem', fontWeight: 500, color: tempTheme.textColor || '#f1f5f9', display: 'block', marginBottom: '4px' }}>
                          Email Address *
                        </label>
                        <input 
                          type="text" 
                          readOnly 
                          value="sarah.jenkins@company.com"
                          style={{
                            width: '100%',
                            boxSizing: 'border-box',
                            backgroundColor: tempTheme.inputBg || '#0a0f1d',
                            borderColor: tempTheme.inputBorder || '#222834',
                            borderWidth: '1px',
                            borderStyle: 'solid',
                            color: tempTheme.inputTextColor || '#f1f5f9',
                            borderRadius: '8px',
                            padding: '8px 12px',
                            fontSize: '0.85rem'
                          }}
                        />
                      </div>

                      {/* Checkbox with label left, box on far right */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 14px',
                        backgroundColor: tempTheme.inputBg || '#0a0f1d',
                        border: `1px solid ${tempTheme.inputBorder || '#222834'}`,
                        borderRadius: '8px',
                        boxSizing: 'border-box'
                      }}>
                        <span style={{ fontSize: '0.85rem', color: tempTheme.textColor || '#f1f5f9', fontWeight: 500 }}>
                          Do you require internet access?
                        </span>
                        <input 
                          type="checkbox" 
                          readOnly 
                          checked={true}
                          style={{
                            width: '18px',
                            height: '18px',
                            accentColor: tempTheme.primaryColor || '#0086d6',
                            margin: 0,
                            cursor: 'default',
                            flexShrink: 0
                          }}
                        />
                      </div>

                      <button
                        type="button"
                        style={{
                          backgroundColor: tempTheme.primaryColor || '#0086d6',
                          color: tempTheme.buttonTextColor || '#ffffff',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '10px 16px',
                          fontWeight: 600,
                          fontSize: '0.9rem',
                          marginTop: '4px',
                          cursor: 'default',
                          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)'
                        }}
                      >
                        {formConfig?.submitButtonText || 'Request Wi-Fi Access'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '16px' }}>
              <button 
                type="button" 
                className="btn btn-secondary btn-sm"
                onClick={handleResetThemeDefaults}
              >
                <RotateCcw size={14} />
                <span>Reset to Bastion Default</span>
              </button>

              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setShowThemeModal(false)}
                  disabled={savingTheme}
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  className="btn btn-primary" 
                  onClick={handleSaveTheme}
                  disabled={savingTheme}
                >
                  {savingTheme ? <RefreshCw size={16} className="animate-spin" /> : (themeSaved ? <CheckCircle2 size={16} /> : <Save size={16} />)}
                  <span>{savingTheme ? 'Saving Theme...' : (themeSaved ? 'Saved!' : 'Apply & Save Theme')}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
