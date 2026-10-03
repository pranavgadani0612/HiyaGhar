import React, { useEffect, useState } from 'react';
import { DataTable, type ColumnDef } from '../../components/admin/DataTable';
import { AdminAuthService } from '../../services/adminAuthService';
import { usePermission } from '../../context/PermissionContext';
import { showConfirm, showToast } from '../../utils/alertService';
import './OrderManagementPage.css';

export interface CouponItem {
  id: number;
  code: string;
  description?: string;
  discountType: number; // 0: Percent, 1: Flat
  discountValue: number;
  maxDiscountAmount?: number | null;
  minOrderAmount: number;
  startDate: string;
  endDate: string;
  maxUsage?: number | null;
  perCustomerUsage?: number | null;
  isFirstOrderOnly: boolean;
  isActive: boolean;
}

interface CouponFormData {
  id?: number;
  code: string;
  description: string;
  discountType: number;
  discountValue: number;
  maxDiscountAmount: string;
  minOrderAmount: number;
  startDate: string;
  endDate: string;
  maxUsage: string;
  perCustomerUsage: string;
  isFirstOrderOnly: boolean;
  isActive: boolean;
}

export const CouponManagementPage: React.FC = () => {
  const [coupons, setCoupons] = useState<CouponItem[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'form'>('list');
  const [editingItem, setEditingItem] = useState<CouponItem | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { hasPermission } = usePermission();
  const canAdd = hasPermission('COUPON', 'canAdd');
  const canEdit = hasPermission('COUPON', 'canEdit');
  const canDelete = hasPermission('COUPON', 'canDelete');

  const todayStr = new Date().toISOString().split('T')[0];
  const nextMonthStr = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const [formData, setFormData] = useState<CouponFormData>({
    code: '',
    description: '',
    discountType: 0,
    discountValue: 10,
    maxDiscountAmount: '',
    minOrderAmount: 0,
    startDate: todayStr,
    endDate: nextMonthStr,
    maxUsage: '',
    perCustomerUsage: '',
    isFirstOrderOnly: false,
    isActive: true,
  });

  const loadCoupons = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/coupon', { headers: AdminAuthService.getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        setCoupons(Array.isArray(data) ? data : []);
      } else {
        setCoupons([]);
      }
    } catch (e) {
      console.warn('Error loading coupons:', e);
      setCoupons([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCoupons();
  }, []);

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({
      code: '',
      description: '',
      discountType: 0,
      discountValue: 10,
      maxDiscountAmount: '',
      minOrderAmount: 0,
      startDate: todayStr,
      endDate: nextMonthStr,
      maxUsage: '',
      perCustomerUsage: '',
      isFirstOrderOnly: false,
      isActive: true,
    });
    setErrors({});
    setViewMode('form');
  };

  const handleOpenEdit = (item: CouponItem) => {
    setEditingItem(item);
    setFormData({
      id: item.id,
      code: item.code,
      description: item.description || '',
      discountType: item.discountType ?? 0,
      discountValue: item.discountValue,
      maxDiscountAmount: item.maxDiscountAmount ? item.maxDiscountAmount.toString() : '',
      minOrderAmount: item.minOrderAmount || 0,
      startDate: item.startDate ? item.startDate.split('T')[0] : todayStr,
      endDate: item.endDate ? item.endDate.split('T')[0] : nextMonthStr,
      maxUsage: item.maxUsage ? item.maxUsage.toString() : '',
      perCustomerUsage: item.perCustomerUsage ? item.perCustomerUsage.toString() : '',
      isFirstOrderOnly: item.isFirstOrderOnly || false,
      isActive: item.isActive !== false,
    });
    setErrors({});
    setViewMode('form');
  };

  const handleDelete = async (item: CouponItem) => {
    const confirmed = await showConfirm(`Are you sure you want to delete coupon '${item.code}'?`, 'Delete Coupon');
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/coupon/${item.id}`, {
        method: 'DELETE',
        headers: AdminAuthService.getAuthHeaders(),
      });
      if (res.ok) {
        showToast(`Coupon '${item.code}' deleted successfully!`, 'success');
        await loadCoupons();
      } else {
        showToast('Failed to delete coupon.', 'error');
      }
    } catch {
      showToast('Could not delete coupon.', 'error');
    }
  };

  const handleFormChange = (field: keyof CouponFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const updated = { ...prev };
        delete updated[field];
        return updated;
      });
    }
  };

  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!formData.code.trim()) {
      newErrors.code = 'Please enter coupon code';
    } else if (formData.code.trim().length < 3 || formData.code.trim().length > 20) {
      newErrors.code = 'Coupon code must be between 3 and 20 characters';
    }

    if (formData.discountValue === undefined || formData.discountValue === null || Number(formData.discountValue) <= 0) {
      newErrors.discountValue = 'Please enter valid discount amount';
    } else if (Number(formData.discountType) === 0 && Number(formData.discountValue) > 100) {
      newErrors.discountValue = 'Percentage discount cannot exceed 100%';
    }

    if (Number(formData.minOrderAmount) < 0) {
      newErrors.minOrderAmount = 'Minimum order amount cannot be negative';
    }

    if (!formData.startDate) {
      newErrors.startDate = 'Please select start date';
    }
    if (!formData.endDate) {
      newErrors.endDate = 'Please select end date';
    } else if (formData.startDate && formData.endDate < formData.startDate) {
      newErrors.endDate = 'End date cannot be earlier than start date';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});

    const payload = {
      id: editingItem ? editingItem.id : 0,
      code: formData.code.trim().toUpperCase(),
      description: formData.description.trim() || null,
      discountType: Number(formData.discountType),
      discountValue: Number(formData.discountValue),
      maxDiscountAmount: formData.maxDiscountAmount ? Number(formData.maxDiscountAmount) : null,
      minOrderAmount: Number(formData.minOrderAmount) || 0,
      startDate: formData.startDate ? new Date(`${formData.startDate}T00:00:00`).toISOString() : new Date().toISOString(),
      endDate: formData.endDate ? new Date(`${formData.endDate}T23:59:59`).toISOString() : new Date().toISOString(),
      maxUsage: formData.maxUsage ? Number(formData.maxUsage) : null,
      perCustomerUsage: formData.perCustomerUsage ? Number(formData.perCustomerUsage) : null,
      isFirstOrderOnly: Boolean(formData.isFirstOrderOnly),
      isActive: Boolean(formData.isActive),
    };

    try {
      const url = editingItem ? `/api/coupon/${editingItem.id}` : '/api/coupon';
      const method = editingItem ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: {
          ...AdminAuthService.getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok && data.isSuccess !== false) {
        showToast(editingItem ? `Coupon '${payload.code}' updated successfully!` : `Coupon '${payload.code}' created successfully!`, 'success');
        await loadCoupons();
        setViewMode('list');
      } else {
        const msg = data.message || (data.errors ? Object.values(data.errors).flat().join(', ') : 'Failed to save coupon.');
        showToast(msg, 'error');
      }
    } catch {
      showToast('Error communicating with server.', 'error');
    }
  };

  const columns: ColumnDef<CouponItem>[] = [
    {
      key: 'code',
      label: 'Coupon Code & Details',
      render: (item) => (
        <div>
          <div style={{ fontWeight: 800, fontSize: '15px', color: 'var(--hiya-navy, #11223A)', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <i className="fa-solid fa-tag" style={{ color: '#E48B27', fontSize: '13px' }} />
            {item.code}
          </div>
          {item.description && (
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
              {item.description}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'discount',
      label: 'Discount Benefit',
      render: (item) => (
        <span style={{ fontWeight: 800, fontSize: '13.5px', color: '#047857', background: '#ECFDF5', padding: '4px 10px', borderRadius: '8px', border: '1px solid #A7F3D0' }}>
          {item.discountType === 0 ? `${item.discountValue}% OFF` : `₹${item.discountValue} FLAT OFF`}
          {item.maxDiscountAmount ? ` (Max ₹${item.maxDiscountAmount})` : ''}
        </span>
      ),
    },
    {
      key: 'minOrderAmount',
      label: 'Min Order',
      render: (item) => (
        <span style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>
          {item.minOrderAmount > 0 ? `₹${item.minOrderAmount}` : 'No Min Limit'}
        </span>
      ),
    },
    {
      key: 'validity',
      label: 'Validity Period',
      render: (item) => {
        const end = new Date(item.endDate);
        const isExpired = end < new Date();
        return (
          <div style={{ fontSize: '12.5px' }}>
            <div>{new Date(item.startDate).toLocaleDateString()} to {end.toLocaleDateString()}</div>
            {isExpired ? (
              <span style={{ color: '#dc2626', fontWeight: 700, fontSize: '11px' }}>⚠️ Expired</span>
            ) : (
              <span style={{ color: '#16a34a', fontWeight: 700, fontSize: '11px' }}>✓ Active Period</span>
            )}
          </div>
        );
      },
    },
    {
      key: 'isActive',
      label: 'Status',
      render: (item) => (
        <span
          style={{
            background: item.isActive ? '#E6F4EA' : '#FCE8E6',
            color: item.isActive ? '#137333' : '#C5221F',
            border: `1px solid ${item.isActive ? '#CEEAD6' : '#FAD2CF'}`,
            padding: '4px 12px',
            borderRadius: '12px',
            fontSize: '12px',
            fontWeight: 700,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: item.isActive ? '#137333' : '#C5221F' }}></span>
          {item.isActive ? 'Active' : 'Disabled'}
        </span>
      ),
    },
  ];

  return (
    <div className="hiyaghar-admin-page">
      {viewMode === 'list' ? (
        <DataTable<CouponItem>
          title="Promo Coupons & Vouchers"
          addButtonText="+ Add New Coupon"
          columns={columns}
          data={coupons}
          loading={loading}
          onAddClick={handleOpenAdd}
          onEditClick={handleOpenEdit}
          onDeleteClick={handleDelete}
          canAdd={canAdd}
          canEdit={canEdit}
          canDelete={canDelete}
          canExport={false}
        />
      ) : (
        <div className="hiyaghar-datatable-card">
          <div className="hiyaghar-datatable-top-header">
            <h2 className="hiyaghar-datatable-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <i className={`fa-solid ${editingItem ? 'fa-pen-to-square' : 'fa-ticket'}`} style={{ color: '#D19A27', fontSize: '1.2rem' }}></i>
              {editingItem ? `Edit Coupon: ${editingItem.code}` : 'Add New Promo Coupon'}
            </h2>
            <button
              type="button"
              className="hiyaghar-export-btn"
              onClick={() => setViewMode('list')}
            >
              ← Back to Coupons
            </button>
          </div>

          <form onSubmit={handleSaveForm} style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '10px' }} noValidate>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '18px' }}>
                <div className="hiyaghar-form-group">
                  <label style={{ fontWeight: 700, fontSize: '13.5px', display: 'block', marginBottom: '6px' }}>
                    Coupon Code <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <input
                    type="text"
                    maxLength={20}
                    value={formData.code}
                    onChange={(e) => handleFormChange('code', e.target.value.toUpperCase())}
                    placeholder="e.g. WELCOME10, FESTIVE20, HIYAFREESHIP"
                    className={`hiyaghar-search-input ${errors.code ? 'input-error' : ''}`}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', textTransform: 'uppercase', fontWeight: 800 }}
                  />
                  {errors.code && <span className="hiyaghar-field-error">{errors.code}</span>}
                </div>

                <div className="hiyaghar-form-group">
                  <label style={{ fontWeight: 700, fontSize: '13.5px', display: 'block', marginBottom: '6px' }}>
                    Discount Type <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <select
                    value={formData.discountType}
                    onChange={(e) => handleFormChange('discountType', Number(e.target.value))}
                    className="hiyaghar-search-input"
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                  >
                    <option value={0}>Percentage (% Discount)</option>
                    <option value={1}>Flat Amount (₹ Fixed Discount)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '18px' }}>
                <div className="hiyaghar-form-group">
                  <label style={{ fontWeight: 700, fontSize: '13.5px', display: 'block', marginBottom: '6px' }}>
                    Discount Value ({formData.discountType === 0 ? '%' : '₹'}) <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={formData.discountType === 0 ? 100 : 10000}
                    value={formData.discountValue}
                    onChange={(e) => handleFormChange('discountValue', Number(e.target.value))}
                    className={`hiyaghar-search-input ${errors.discountValue ? 'input-error' : ''}`}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                  />
                  {errors.discountValue && <span className="hiyaghar-field-error">{errors.discountValue}</span>}
                </div>

                <div className="hiyaghar-form-group">
                  <label style={{ fontWeight: 700, fontSize: '13.5px', display: 'block', marginBottom: '6px' }}>
                    Max Discount Limit (₹ Optional)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 500 (Max discount cap)"
                    value={formData.maxDiscountAmount}
                    onChange={(e) => handleFormChange('maxDiscountAmount', e.target.value)}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                  />
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', fontSize: '11px', color: '#475467', marginTop: '6px', background: '#F8FAFC', padding: '6px 10px', borderRadius: '6px', border: '1px solid #E2E8F0', lineHeight: 1.4 }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: '2px' }}>
                      <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
                    </svg>
                    <span>
                      <strong>Max Cap:</strong> For % coupons, customer will not get more discount than this (e.g. <strong>₹200 max</strong> even on a ₹5,000 order).
                    </span>
                  </div>
                </div>

                <div className="hiyaghar-form-group">
                  <label style={{ fontWeight: 700, fontSize: '13.5px', display: 'block', marginBottom: '6px' }}>
                    Minimum Order Amount (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.minOrderAmount}
                    onChange={(e) => handleFormChange('minOrderAmount', Number(e.target.value))}
                    className={`hiyaghar-search-input ${errors.minOrderAmount ? 'input-error' : ''}`}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                  />
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', fontSize: '11px', color: '#475467', marginTop: '6px', background: '#F8FAFC', padding: '6px 10px', borderRadius: '6px', border: '1px solid #E2E8F0', lineHeight: 1.4 }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#b45309" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: '2px' }}>
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                    <span>
                      <strong>Min Cart:</strong> Coupon applies only if cart subtotal is at least this amount (e.g. <strong>₹499+</strong>). Keep 0 for all orders.
                    </span>
                  </div>
                  {errors.minOrderAmount && <span className="hiyaghar-field-error">{errors.minOrderAmount}</span>}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '18px' }}>
                <div className="hiyaghar-form-group">
                  <label style={{ fontWeight: 700, fontSize: '13.5px', display: 'block', marginBottom: '6px' }}>
                    Start Date <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => handleFormChange('startDate', e.target.value)}
                    className={`hiyaghar-search-input ${errors.startDate ? 'input-error' : ''}`}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                  />
                  {errors.startDate && <span className="hiyaghar-field-error">{errors.startDate}</span>}
                </div>

                <div className="hiyaghar-form-group">
                  <label style={{ fontWeight: 700, fontSize: '13.5px', display: 'block', marginBottom: '6px' }}>
                    Expiry / End Date <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => handleFormChange('endDate', e.target.value)}
                    className={`hiyaghar-search-input ${errors.endDate ? 'input-error' : ''}`}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                  />
                  {errors.endDate && <span className="hiyaghar-field-error">{errors.endDate}</span>}
                </div>
              </div>

              <div className="hiyaghar-form-group">
                <label style={{ fontWeight: 700, fontSize: '13.5px', display: 'block', marginBottom: '6px' }}>
                  Description / Terms (Optional)
                </label>
                <input
                  type="text"
                  maxLength={150}
                  value={formData.description}
                  onChange={(e) => handleFormChange('description', e.target.value)}
                  placeholder="e.g. 10% discount on all orders above ₹499"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                />
              </div>

              <div style={{ padding: '16px 20px', background: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontWeight: 700, color: '#10243E' }}>
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => handleFormChange('isActive', e.target.checked)}
                    style={{ width: '18px', height: '18px', accentColor: '#D19A27' }}
                  />
                  <span>Active & Ready to Redeem by Customers</span>
                </label>

                <label style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontWeight: 600, color: '#475569' }}>
                  <input
                    type="checkbox"
                    checked={formData.isFirstOrderOnly}
                    onChange={(e) => handleFormChange('isFirstOrderOnly', e.target.checked)}
                    style={{ width: '18px', height: '18px', accentColor: '#D19A27' }}
                  />
                  <span>Restricted to First-Time Customers Only</span>
                </label>
              </div>
            </div>

            <div className="hiyaghar-modal-footer" style={{ marginTop: '10px', paddingTop: '16px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                type="button"
                className="hiyaghar-btn-cancel"
                onClick={() => setViewMode('list')}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="hiyaghar-btn-submit"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
              >
                <i className="fa-solid fa-floppy-disk"></i>
                {editingItem ? 'Update Coupon' : 'Save Coupon'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
