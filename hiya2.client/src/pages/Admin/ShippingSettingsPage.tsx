import React, { useEffect, useState } from 'react';
import { ShippingService, type ShippingSettings, DEFAULT_SHIPPING_SETTINGS } from '../../services/shippingService';
import { AnnouncementService, type AnnouncementItem } from '../../services/announcementService';
import { AdminAuthService } from '../../services/adminAuthService';
import { showToast } from '../../utils/alertService';
import './OrderManagementPage.css';
import './StoreSettings.css';

export const ShippingSettingsPage: React.FC = () => {
  const [form, setForm] = useState<ShippingSettings>(DEFAULT_SHIPPING_SETTINGS);
  const [savedForm, setSavedForm] = useState<ShippingSettings>(DEFAULT_SHIPPING_SETTINGS);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Individual Section Edit States
  const [editingSection, setEditingSection] = useState<'none' | 'deliveryCharges' | 'deliveryTimeline' | 'gst' | 'zones'>('none');

  // Announcements State
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [newAnnouncementText, setNewAnnouncementText] = useState<string>('');

  useEffect(() => {
    // Load from DB API first (so all admins see same data)
    ShippingService.loadSettingsFromApi().then((settings) => {
      setForm(settings);
      setSavedForm(settings);
    });
    setAnnouncements(AnnouncementService.getAnnouncements());
  }, []);

  const handleChange = (field: keyof ShippingSettings, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const handleCancelSection = () => {
    setForm(savedForm);
    setFormErrors({});
    setEditingSection('none');
  };

  const handleSaveSection = async (sectionName: string) => {
    const errors: Record<string, string> = {};

    if (form.standardShippingPrice < 0) {
      errors.standardShippingPrice = 'Standard shipping charge cannot be negative.';
    }
    if (form.expressShippingPrice < 0) {
      errors.expressShippingPrice = 'Express shipping charge cannot be negative.';
    }
    if (form.freeShippingThreshold < 0) {
      errors.freeShippingThreshold = 'Free shipping threshold cannot be negative.';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    // Save to DB (authoritative source) + localStorage (local cache)
    const token = AdminAuthService.getToken();
    const authHeaders: HeadersInit = token
      ? { 'Authorization': `Bearer ${token}` }
      : {};
    const ok = await ShippingService.saveSettingsToApi(form, authHeaders);
    if (!ok) {
      // Fallback: save to localStorage only
      ShippingService.saveSettings(form);
      showToast(`${sectionName} saved locally (DB unavailable).`, 'info');
    } else {
      showToast(`${sectionName} saved to database!`, 'success');
    }

    setSavedForm(form);
    // Notify same-tab listeners
    window.dispatchEvent(new StorageEvent('storage', { key: 'hiyaghar_shipping_settings' }));
    setEditingSection('none');
  };

  // Announcements Handlers
  const handleToggleAnnouncement = (id: string) => {
    const updated = announcements.map((item) =>
      item.id === id ? { ...item, isActive: !item.isActive } : item
    );
    setAnnouncements(updated);
    AnnouncementService.saveAnnouncements(updated);
    showToast('Announcement status updated!', 'success');
  };

  const handleUpdateAnnouncementText = (id: string, newText: string) => {
    const updated = announcements.map((item) =>
      item.id === id ? { ...item, text: newText } : item
    );
    setAnnouncements(updated);
    AnnouncementService.saveAnnouncements(updated);
  };

  const handleDeleteAnnouncement = (id: string) => {
    if (announcements.length <= 1) {
      showToast('You must keep at least 1 announcement line.', 'info');
      return;
    }
    const updated = announcements.filter((item) => item.id !== id);
    setAnnouncements(updated);
    AnnouncementService.saveAnnouncements(updated);
    showToast('Announcement removed!', 'info');
  };

  const handleAddAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newAnnouncementText.trim();
    if (!trimmed) {
      showToast('Please enter announcement text.', 'info');
      return;
    }
    const newItem: AnnouncementItem = {
      id: 'ann_' + Date.now(),
      text: trimmed,
      isActive: true,
      displayOrder: announcements.length + 1,
    };
    const updated = [...announcements, newItem];
    setAnnouncements(updated);
    AnnouncementService.saveAnnouncements(updated);
    setNewAnnouncementText('');
    showToast('New announcement line added!', 'success');
  };

  const handleResetAnnouncements = () => {
    const defaults = AnnouncementService.resetToDefault();
    setAnnouncements(defaults);
    showToast('Reset to default announcements!', 'info');
  };

  return (
    <div className="hiyaghar-admin-page">
      <div className="hiyaghar-datatable-card" style={{ maxWidth: '980px', margin: '0 auto' }}>
        
        {/* TOP HEADER */}
        <div className="hiyaghar-datatable-top-header" style={{ marginBottom: '20px' }}>
          <div>
            <h2 className="hiyaghar-datatable-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <i className="fa-solid fa-sliders" style={{ color: '#D19A27', fontSize: '1.25rem' }}></i>
              Store, Header & Delivery Settings
            </h2>
            <p className="hiyaghar-datatable-subtitle" style={{ margin: '4px 0 0', color: '#64748b', fontSize: '13.5px' }}>
              Manage header ticker announcement lines, delivery charges, free shipping threshold, and tax invoices.
            </p>
          </div>
        </div>

        <div className="hiyaghar-store-settings-wrap">
          
          {/* SECTION 1: HEADER ANNOUNCEMENT TICKER MARQUEE */}
          <div className="hiyaghar-setting-card" style={{ background: '#FFFDF7', borderColor: '#F3E4BA' }}>
            <div className="hiyaghar-setting-card-header" style={{ borderColor: '#EFE2B9' }}>
              <div>
                <h3 className="hiyaghar-setting-card-title">
                  <i className="fa-solid fa-bullhorn"></i>
                  1. Top Header Announcement Ticker (Marquee Lines)
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748b' }}>
                  Manage promotional messages and coupon codes shown at the very top of your store.
                </p>
              </div>
              <button
                type="button"
                onClick={handleResetAnnouncements}
                style={{
                  background: 'transparent',
                  border: '1px solid #D19A27',
                  color: '#D19A27',
                  borderRadius: '6px',
                  padding: '6px 14px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Reset Defaults
              </button>
            </div>

            {/* List of active announcement lines */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {announcements.map((item, idx) => (
                <div
                  key={item.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    background: item.isActive ? '#FFFFFF' : '#F1F5F9',
                    border: item.isActive ? '1px solid #E2E8F0' : '1px dashed #CBD5E1',
                    borderRadius: '8px',
                    padding: '10px 14px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                  }}
                >
                  <span style={{ fontSize: '12px', fontWeight: 800, color: '#94A3B8', minWidth: '22px' }}>
                    #{idx + 1}
                  </span>

                  <input
                    type="text"
                    value={item.text}
                    onChange={(e) => handleUpdateAnnouncementText(item.id, e.target.value)}
                    className="hiyaghar-input-control"
                    style={{ height: '38px', fontSize: '13.5px' }}
                  />

                  {/* Active Toggle Switch */}
                  <button
                    type="button"
                    onClick={() => handleToggleAnnouncement(item.id)}
                    style={{
                      background: item.isActive ? '#E8F5E9' : '#F1F5F9',
                      border: item.isActive ? '1px solid #2D6A4F' : '1px solid #CBD5E1',
                      color: item.isActive ? '#2D6A4F' : '#64748B',
                      borderRadius: '20px',
                      padding: '6px 14px',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      minWidth: '85px',
                    }}
                  >
                    {item.isActive ? '✓ Active' : 'Hidden'}
                  </button>

                  {/* Delete Button */}
                  <button
                    type="button"
                    onClick={() => handleDeleteAnnouncement(item.id)}
                    title="Remove line"
                    style={{
                      background: '#FEE2E2',
                      border: '1px solid #EF4444',
                      color: '#B91C1C',
                      borderRadius: '6px',
                      width: '34px',
                      height: '34px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                    }}
                  >
                    <i className="fa-solid fa-trash-can" style={{ fontSize: '13px' }}></i>
                  </button>
                </div>
              ))}
            </div>

            {/* Add New Line Form */}
            <form onSubmit={handleAddAnnouncement} style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
              <input
                type="text"
                placeholder="e.g. SPECIAL FESTIVE SALE: 15% OFF WITH CODE: FESTIVE15"
                value={newAnnouncementText}
                onChange={(e) => setNewAnnouncementText(e.target.value)}
                className="hiyaghar-input-control"
                style={{ borderStyle: 'dashed', borderColor: '#D19A27', height: '42px' }}
              />
              <button
                type="submit"
                className="hiyaghar-section-btn-edit"
                style={{ padding: '0 20px', height: '42px', whiteSpace: 'nowrap' }}
              >
                + Add Line
              </button>
            </form>
          </div>

          {/* SECTION 2: DELIVERY CHARGES & THRESHOLDS */}
          <div className={`hiyaghar-setting-card ${editingSection === 'deliveryCharges' ? 'is-active-edit' : ''}`}>
            <div className="hiyaghar-setting-card-header">
              <h3 className="hiyaghar-setting-card-title">
                <i className="fa-solid fa-truck-fast"></i>
                2. Delivery Charges & Thresholds
              </h3>
              <div>
                {editingSection !== 'deliveryCharges' ? (
                  <button
                    type="button"
                    className="hiyaghar-section-btn-edit"
                    onClick={() => setEditingSection('deliveryCharges')}
                  >
                    <i className="fa-solid fa-pen-to-square"></i>
                    Edit Delivery Charges
                  </button>
                ) : (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      className="hiyaghar-section-btn-cancel"
                      onClick={handleCancelSection}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="hiyaghar-section-btn-save"
                      onClick={() => handleSaveSection('Delivery Charges')}
                    >
                      <i className="fa-solid fa-floppy-disk"></i>
                      Save
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '18px' }}>
              <div className="hiyaghar-form-group">
                <label className="hiyaghar-form-label">
                  Free Shipping Minimum Cart Order (₹)
                </label>
                <div className="hiyaghar-input-prefix-box">
                  <span className="hiyaghar-input-prefix">₹</span>
                  <input
                    type="number"
                    min="0"
                    disabled={editingSection !== 'deliveryCharges'}
                    value={form.freeShippingThreshold}
                    onChange={(e) => handleChange('freeShippingThreshold', Number(e.target.value))}
                    className={`hiyaghar-input-control has-prefix ${formErrors.freeShippingThreshold ? 'input-error' : ''}`}
                  />
                </div>
                <p className="hiyaghar-form-help">
                  Orders at or above this cart value receive free standard shipping automatically.
                </p>
              </div>

              <div className="hiyaghar-form-group">
                <label className="hiyaghar-form-label">
                  Standard Shipping Fee (₹)
                </label>
                <div className="hiyaghar-input-prefix-box">
                  <span className="hiyaghar-input-prefix">₹</span>
                  <input
                    type="number"
                    min="0"
                    disabled={editingSection !== 'deliveryCharges'}
                    value={form.standardShippingPrice}
                    onChange={(e) => handleChange('standardShippingPrice', Number(e.target.value))}
                    className={`hiyaghar-input-control has-prefix ${formErrors.standardShippingPrice ? 'input-error' : ''}`}
                  />
                </div>
                <p className="hiyaghar-form-help">
                  Standard delivery charge applied when order is below threshold.
                </p>
              </div>

              <div className="hiyaghar-form-group">
                <label className="hiyaghar-form-label">
                  Express Shipping Fee (₹)
                </label>
                <div className="hiyaghar-input-prefix-box">
                  <span className="hiyaghar-input-prefix">₹</span>
                  <input
                    type="number"
                    min="0"
                    disabled={editingSection !== 'deliveryCharges'}
                    value={form.expressShippingPrice}
                    onChange={(e) => handleChange('expressShippingPrice', Number(e.target.value))}
                    className={`hiyaghar-input-control has-prefix ${formErrors.expressShippingPrice ? 'input-error' : ''}`}
                  />
                </div>
                <p className="hiyaghar-form-help">
                  Fast-track priority shipping charge.
                </p>
              </div>
            </div>


            <div style={{ marginTop: '18px', display: 'flex', flexWrap: 'wrap', gap: '24px', paddingTop: '14px', borderTop: '1px dashed #e2e8f0' }}>
              <label className={`hiyaghar-toggle-label ${editingSection !== 'deliveryCharges' ? 'is-disabled' : ''}`}>
                <input
                  type="checkbox"
                  disabled={editingSection !== 'deliveryCharges'}
                  checked={form.enableFreeShipping}
                  onChange={(e) => handleChange('enableFreeShipping', e.target.checked)}
                  className="hiyaghar-toggle-checkbox"
                />
                <span>Enable Free Shipping Eligibility</span>
              </label>

              <label className={`hiyaghar-toggle-label ${editingSection !== 'deliveryCharges' ? 'is-disabled' : ''}`}>
                <input
                  type="checkbox"
                  disabled={editingSection !== 'deliveryCharges'}
                  checked={form.enableExpressDelivery}
                  onChange={(e) => handleChange('enableExpressDelivery', e.target.checked)}
                  className="hiyaghar-toggle-checkbox"
                />
                <span>Offer Express Delivery Option</span>
              </label>
            </div>
          </div>

          {/* SECTION 3: ESTIMATED DELIVERY TIMELINES */}
          <div className={`hiyaghar-setting-card ${editingSection === 'deliveryTimeline' ? 'is-active-edit' : ''}`}>
            <div className="hiyaghar-setting-card-header">
              <h3 className="hiyaghar-setting-card-title">
                <i className="fa-solid fa-clock"></i>
                3. Delivery Duration Labels
              </h3>
              <div>
                {editingSection !== 'deliveryTimeline' ? (
                  <button
                    type="button"
                    className="hiyaghar-section-btn-edit"
                    onClick={() => setEditingSection('deliveryTimeline')}
                  >
                    <i className="fa-solid fa-pen-to-square"></i>
                    Edit Timelines
                  </button>
                ) : (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      className="hiyaghar-section-btn-cancel"
                      onClick={handleCancelSection}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="hiyaghar-section-btn-save"
                      onClick={() => handleSaveSection('Delivery Duration Labels')}
                    >
                      <i className="fa-solid fa-floppy-disk"></i>
                      Save
                    </button>
                  </div>
                )}
              </div>
            </div>


            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '18px' }}>
              <div className="hiyaghar-form-group">
                <label className="hiyaghar-form-label">
                  Standard Delivery Timeline Text
                </label>
                <input
                  type="text"
                  disabled={editingSection !== 'deliveryTimeline'}
                  value={form.standardDeliveryDays}
                  onChange={(e) => handleChange('standardDeliveryDays', e.target.value)}
                  className="hiyaghar-input-control"
                />
              </div>

              <div className="hiyaghar-form-group">
                <label className="hiyaghar-form-label">
                  Express Delivery Timeline Text
                </label>
                <input
                  type="text"
                  disabled={editingSection !== 'deliveryTimeline'}
                  value={form.expressDeliveryDays}
                  onChange={(e) => handleChange('expressDeliveryDays', e.target.value)}
                  className="hiyaghar-input-control"
                />
              </div>
            </div>
          </div>

          {/* SECTION 4: GST & TAX SETTINGS */}
          <div className={`hiyaghar-setting-card ${editingSection === 'gst' ? 'is-active-edit' : ''}`}>
            <div className="hiyaghar-setting-card-header">
              <h3 className="hiyaghar-setting-card-title">
                <i className="fa-solid fa-receipt"></i>
                4. GST & Tax Calculation Breakdown
              </h3>
              <div>
                {editingSection !== 'gst' ? (
                  <button
                    type="button"
                    className="hiyaghar-section-btn-edit"
                    onClick={() => setEditingSection('gst')}
                  >
                    <i className="fa-solid fa-pen-to-square"></i>
                    Edit Tax Settings
                  </button>
                ) : (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      className="hiyaghar-section-btn-cancel"
                      onClick={handleCancelSection}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="hiyaghar-section-btn-save"
                      onClick={() => handleSaveSection('GST Tax Settings')}
                    >
                      <i className="fa-solid fa-floppy-disk"></i>
                      Save
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '18px' }}>
              <div className="hiyaghar-form-group">
                <label className="hiyaghar-form-label">
                  GST Percentage (%)
                </label>
                <div className="hiyaghar-input-prefix-box">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    disabled={editingSection !== 'gst'}
                    value={form.gstPercent ?? 5}
                    onChange={(e) => handleChange('gstPercent', Number(e.target.value))}
                    className="hiyaghar-input-control has-suffix"
                  />
                  <span className="hiyaghar-input-suffix">%</span>
                </div>
              </div>

              <div className="hiyaghar-form-group">
                <label className="hiyaghar-form-label">
                  Invoice Tax Label
                </label>
                <input
                  type="text"
                  disabled={editingSection !== 'gst'}
                  value={form.gstLabel || 'Estimated GST (5% Included)'}
                  onChange={(e) => handleChange('gstLabel', e.target.value)}
                  className="hiyaghar-input-control"
                />
              </div>
            </div>

            <div style={{ marginTop: '18px', paddingTop: '14px', borderTop: '1px dashed #e2e8f0' }}>
              <label className={`hiyaghar-toggle-label ${editingSection !== 'gst' ? 'is-disabled' : ''}`}>
                <input
                  type="checkbox"
                  disabled={editingSection !== 'gst'}
                  checked={form.enableGstDisplay ?? true}
                  onChange={(e) => handleChange('enableGstDisplay', e.target.checked)}
                  className="hiyaghar-toggle-checkbox"
                />
                <span>Display GST Breakdown Row on Cart & Checkout pages</span>
              </label>
            </div>
          </div>

          {/* SECTION 5: DELIVERY ZONE RESTRICTION */}
          <div className={`hiyaghar-setting-card ${editingSection === 'zones' ? 'is-active-edit' : ''}`}>
            <div className="hiyaghar-setting-card-header">
              <h3 className="hiyaghar-setting-card-title">
                <i className="fa-solid fa-map-location-dot"></i>
                5. Serviceable Delivery Zone Restriction
              </h3>
              <div>
                {editingSection !== 'zones' ? (
                  <button
                    type="button"
                    className="hiyaghar-section-btn-edit"
                    onClick={() => setEditingSection('zones')}
                  >
                    <i className="fa-solid fa-pen-to-square"></i>
                    Edit Zone Restriction
                  </button>
                ) : (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      className="hiyaghar-section-btn-cancel"
                      onClick={handleCancelSection}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="hiyaghar-section-btn-save"
                      onClick={() => handleSaveSection('Delivery Zone Restriction')}
                    >
                      <i className="fa-solid fa-floppy-disk"></i>
                      Save
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div style={{ background: '#f8fafc', border: '1px solid #E2E8F0', padding: '16px 20px', borderRadius: '10px' }}>
              <label className={`hiyaghar-toggle-label ${editingSection !== 'zones' ? 'is-disabled' : ''}`}>
                <input
                  type="checkbox"
                  disabled={editingSection !== 'zones'}
                  checked={form.onlyAhmedabadDelivery}
                  onChange={(e) => handleChange('onlyAhmedabadDelivery', e.target.checked)}
                  className="hiyaghar-toggle-checkbox"
                  style={{ width: '20px', height: '20px' }}
                />
                <span style={{ fontWeight: 700, fontSize: '14px' }}>
                  Restrict orders & delivery strictly to Ahmedabad / Gandhinagar pincodes (380xxx, 382xxx)
                </span>
              </label>
              <p style={{ margin: '8px 0 0 30px', fontSize: '13px', color: '#64748b' }}>
                When checked, any customer trying to enter a pincode outside Ahmedabad will be blocked from ordering with the message: <em>"Order place only in Ahmedabad."</em>
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
