import React, { useState, useMemo } from 'react';
import { AdminAuthService } from '../../services/adminAuthService';
import { usePermission } from '../../context/PermissionContext';
import { MenuIcon, getMenuIconClass } from '../../utils/iconUtils';
import { showToast } from '../../utils/alertService';
import './AdminLayout.css';

interface AdminNavItem {
  key: string;
  name: string;
  hash: string;
  icon: string;
  displayOrder?: number;
}

const ROUTE_DICTIONARY: Record<string, string> = {
  DASHBOARD: '/admin/dashboard',
  USER: '/admin/users',
  ROLE: '/admin/roles',
  PRODUCT: '/admin/products',
  MENU: '/admin/menus',
  CUSTOMER: '/admin/customers',
  CATEGORY: '/admin/categories',
  ATTRIBUTE: '/admin/attributes',
  HOMEPAGECOMPONENT: '/admin/homepage-components',
  HOMEPAGE_COMPONENT: '/admin/homepage-components',
  GIFTHAMPER: '/admin/gift-hampers',
  ORDER: '/admin/orders',
  SHIPPING: '/admin/shipping',
  SHIPPING_SETTINGS: '/admin/shipping',
  COMBOPACK: '/admin/combo-packs',
  COMBO_PACK: '/admin/combo-packs',
  LOV: '/admin/lov',
  STOCK: '/admin/stock',
  STOCKSETTING: '/admin/stock-settings',
  REWARD: '/admin/reward-slabs',
  COUPON: '/admin/coupons',
  REVIEW: '/admin/reviews',
  TESTMENU: '/admin/test-menu',
  TEST_MENU: '/admin/test-menu',
};

interface AdminLayoutProps {
  currentHash: string;
  onNavigate: (hash: string) => void;
  onLogout: () => void;
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  currentHash,
  onNavigate,
  onLogout,
  children,
}) => {
  const user = AdminAuthService.getUser();
  const { permissions, hasPermission } = usePermission();
  const [collapsed, setCollapsed] = useState<boolean>(false);

  // Change Password Modal State
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState<boolean>(false);
  const [currentPassword, setCurrentPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showCurrentPass, setShowCurrentPass] = useState<boolean>(false);
  const [showNewPass, setShowNewPass] = useState<boolean>(false);
  const [showConfirmPass, setShowConfirmPass] = useState<boolean>(false);
  const [passwordLoading, setPasswordLoading] = useState<boolean>(false);
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});

  const handleOpenPasswordModal = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordErrors({});
    setIsPasswordModalOpen(true);
  };

  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    if (!currentPassword) {
      errors.currentPassword = 'Please enter current password';
    }
    if (!newPassword) {
      errors.newPassword = 'Please enter new password';
    } else if (newPassword.length < 8) {
      errors.newPassword = 'Please enter at least 8 characters';
    }
    if (!confirmPassword) {
      errors.confirmPassword = 'Please enter confirm password';
    } else if (newPassword !== confirmPassword) {
      errors.confirmPassword = 'Please enter matching confirm password';
    }

    if (Object.keys(errors).length > 0) {
      setPasswordErrors(errors);
      return;
    }
    setPasswordErrors({});

    setPasswordLoading(true);
    const res = await AdminAuthService.changePassword(currentPassword, newPassword);
    setPasswordLoading(false);

    if (res.success) {
      setIsPasswordModalOpen(false);
      showToast('Password changed successfully!', 'success');
    } else {
      setPasswordErrors({ form: res.message || 'Failed to change password' });
    }
  };

  const authorizedNavItems = useMemo(() => {
    const items: AdminNavItem[] = [
      { key: 'DASHBOARD', name: 'Dashboard', hash: '/admin/dashboard', icon: 'fa-solid fa-chart-line', displayOrder: 0 },
    ];

    const addedKeys = new Set<string>(['DASHBOARD']);

    Object.keys(permissions).forEach((rawKey) => {
      const key = rawKey.toUpperCase().replace(/\s+/g, '_');
      if (addedKeys.has(key)) return;

      const perm = permissions[rawKey];
      if (hasPermission(key, 'canView')) {
        addedKeys.add(key);

        const isShipping = key === 'SHIPPING' || key === 'SHIPPING_SETTINGS';
        const isLov = key === 'LOV' || key === 'LIST_OF_VALUES';
        const name = isShipping
          ? 'Store Settings'
          : isLov
          ? 'Dropdown & Status Master'
          : (perm.menuName || rawKey);
        const icon = isShipping
          ? 'fa-solid fa-sliders'
          : isLov
          ? 'fa-solid fa-list-check'
          : getMenuIconClass(perm.icon, key);
        const hash = ROUTE_DICTIONARY[key] || `/admin/${key.toLowerCase().replace(/_/g, '-')}`;
        const displayOrder = perm.displayOrder ?? 99;

        items.push({
          key,
          name,
          hash,
          icon,
          displayOrder,
        });
      }
    });

    const isSuperAdmin = user?.roles?.some((r) => r.roleCode === 'SUPER_ADMIN' || r.roleName === 'Super Admin') ?? false;
    
    // Always include core modules for Super Admin or when accessible
    if (isSuperAdmin || hasPermission('SHIPPING', 'canView')) {
      if (!addedKeys.has('SHIPPING')) {
        addedKeys.add('SHIPPING');
        items.push({
          key: 'SHIPPING',
          name: 'Store Settings',
          hash: '/admin/shipping',
          icon: 'fa-solid fa-sliders',
          displayOrder: 11,
        });
      }
    }

    if (isSuperAdmin || hasPermission('COMBOPACK', 'canView') || hasPermission('COMBO_PACK', 'canView')) {
      if (!addedKeys.has('COMBOPACK')) {
        addedKeys.add('COMBOPACK');
        items.push({
          key: 'COMBOPACK',
          name: 'Combo Packs',
          hash: '/admin/combo-packs',
          icon: 'fa-solid fa-boxes-packing',
          displayOrder: 12,
        });
      }
    }

    if (isSuperAdmin || hasPermission('COUPON', 'canView')) {
      if (!addedKeys.has('COUPON')) {
        addedKeys.add('COUPON');
        items.push({
          key: 'COUPON',
          name: 'Coupons & Vouchers',
          hash: '/admin/coupons',
          icon: 'fa-solid fa-ticket',
          displayOrder: 13,
        });
      }
    }

    if (isSuperAdmin && Object.keys(permissions).length <= 1) {
      const superDefaults: AdminNavItem[] = [
        { key: 'USER', name: 'User', hash: '/admin/users', icon: 'fa-solid fa-user', displayOrder: 1 },
        { key: 'ROLE', name: 'Role', hash: '/admin/roles', icon: 'fa-solid fa-user-shield', displayOrder: 2 },
        { key: 'PRODUCT', name: 'Product', hash: '/admin/products', icon: 'fa-solid fa-box', displayOrder: 3 },
        { key: 'MENU', name: 'Menu', hash: '/admin/menus', icon: 'fa-solid fa-bars', displayOrder: 4 },
        { key: 'CUSTOMER', name: 'Customer', hash: '/admin/customers', icon: 'fa-solid fa-users', displayOrder: 5 },
        { key: 'CATEGORY', name: 'Category', hash: '/admin/categories', icon: 'fa-solid fa-tags', displayOrder: 6 },
        { key: 'ATTRIBUTE', name: 'Attribute', hash: '/admin/attributes', icon: 'fa-solid fa-sliders', displayOrder: 7 },
        { key: 'HOMEPAGECOMPONENT', name: 'HomePageComponent', hash: '/admin/homepage-components', icon: 'fa-solid fa-puzzle-piece', displayOrder: 8 },
        { key: 'GIFTHAMPER', name: 'Gift Hampers', hash: '/admin/gift-hampers', icon: 'fa-solid fa-gift', displayOrder: 9 },
        { key: 'ORDER', name: 'Orders', hash: '/admin/orders', icon: 'fa-solid fa-box-open', displayOrder: 10 },
        { key: 'SHIPPING', name: 'Store Settings', hash: '/admin/shipping', icon: 'fa-solid fa-sliders', displayOrder: 11 },
        { key: 'COMBOPACK', name: 'Combo Packs', hash: '/admin/combo-packs', icon: 'fa-solid fa-boxes-packing', displayOrder: 12 },
        { key: 'COUPON', name: 'Coupons & Vouchers', hash: '/admin/coupons', icon: 'fa-solid fa-ticket', displayOrder: 13 },
        { key: 'LOV', name: 'Dropdown & Status Master', hash: '/admin/lov', icon: 'fa-solid fa-list-check', displayOrder: 14 },
      ];

      superDefaults.forEach((def) => {
        if (!addedKeys.has(def.key)) {
          addedKeys.add(def.key);
          items.push(def);
        }
      });
    }

    return items.sort((a, b) => (a.displayOrder ?? 99) - (b.displayOrder ?? 99));
  }, [permissions, hasPermission, user]);

  const cleanCurrentRoute = currentHash.replace(/^#\/?/, '/');

  return (
    <div className={`hiyaghar-admin-layout ${collapsed ? 'is-collapsed' : ''}`}>
      <header className="hiyaghar-admin-topbar">
        <div className="hiyaghar-topbar-left">
          <button
            type="button"
            className="hiyaghar-sidebar-toggle"
            onClick={() => setCollapsed(!collapsed)}
            title="Toggle Sidebar"
          >
            ☰
          </button>
          <div className="hiyaghar-topbar-brand" onClick={() => onNavigate('/admin/dashboard')}>
            <img src="/image/HIYA LOGO (1).png" alt="HIYA" className="hiyaghar-topbar-logo" />
            <span className="hiyaghar-topbar-title">HIYAGHAR <small>ADMIN</small></span>
          </div>
        </div>

        <div className="hiyaghar-topbar-right">
          <button
            type="button"
            className="hiyaghar-store-btn"
            onClick={() => onNavigate('/')}
            title="View Live Store"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            <span>View Storefront</span>
          </button>

          <div className="hiyaghar-user-badge">
            <div className="hiyaghar-user-avatar">
              {user?.firstName ? user.firstName[0].toUpperCase() : 'A'}
            </div>
            <div className="hiyaghar-user-details">
              <span className="hiyaghar-user-name">
                {user?.firstName ? `${user.firstName} ${user.lastName}` : 'Administrator'}
              </span>
              <span className="hiyaghar-user-role">
                {user?.roles && user.roles.length > 0 ? user.roles[0].roleName : 'Super Admin'}
              </span>
            </div>
          </div>

          <button
            type="button"
            className="hiyaghar-admin-password-btn"
            onClick={handleOpenPasswordModal}
            title="Change Password"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <span>Password</span>
          </button>

          <button
            type="button"
            className="hiyaghar-admin-logout-btn"
            onClick={onLogout}
            title="Sign Out"
          >
            <span>Logout</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </div>
      </header>

      <div className="hiyaghar-admin-body">
        <aside className="hiyaghar-admin-sidebar">
          <div className="hiyaghar-sidebar-section-title">MANAGEMENT MODULES</div>
          <nav className="hiyaghar-sidebar-nav">
            {authorizedNavItems.map((item) => {
              const isActive =
                cleanCurrentRoute.includes(item.hash) ||
                (item.hash === '/admin/dashboard' &&
                  (cleanCurrentRoute === '/admin' || cleanCurrentRoute === '/admin/dashboard'));
              return (
                <button
                  key={item.key}
                  type="button"
                  role="link"
                  className={`hiyaghar-nav-link ${isActive ? 'is-active' : ''}`}
                  onClick={() => onNavigate(item.hash)}
                >
                  <span className="hiyaghar-nav-icon">
                    <MenuIcon icon={item.icon} menuKey={item.key} />
                  </span>
                  <span className="hiyaghar-nav-text">{item.name}</span>
                </button>
              );
            })}
          </nav>

          <div className="hiyaghar-sidebar-footer">
            <p>© 2026 HIYAGHAR Security</p>
          </div>
        </aside>

        <main className="hiyaghar-admin-content">{children}</main>
      </div>

      {/* Change Password Modal */}
      {isPasswordModalOpen && (
        <div className="hiyaghar-modal-overlay" onClick={() => setIsPasswordModalOpen(false)}>
          <div className="hiyaghar-modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
            <div className="hiyaghar-modal-header">
              <h3 className="hiyaghar-modal-title">Change Password</h3>
              <button
                type="button"
                className="hiyaghar-modal-close"
                onClick={() => setIsPasswordModalOpen(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleChangePasswordSubmit} className="hiyaghar-modal-body" noValidate>
              {passwordErrors.form && (
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: '10px 14px', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '16px' }}>
                  {passwordErrors.form}
                </div>
              )}

              <div className="hiyaghar-form-group">
                <label>Current Password *</label>
                <div className="hiyaghar-password-wrapper">
                  <input
                    type={showCurrentPass ? 'text' : 'password'}
                    placeholder="Enter current password"
                    className={passwordErrors.currentPassword ? 'input-error' : ''}
                    value={currentPassword}
                    onChange={(e) => {
                      setCurrentPassword(e.target.value);
                      if (passwordErrors.currentPassword) setPasswordErrors((prev) => ({ ...prev, currentPassword: '' }));
                    }}
                  />
                  <button
                    type="button"
                    className="hiyaghar-password-toggle-btn"
                    onClick={() => setShowCurrentPass(!showCurrentPass)}
                    title={showCurrentPass ? 'Hide password' : 'Show password'}
                  >
                    {showCurrentPass ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    )}
                  </button>
                </div>
                {passwordErrors.currentPassword && <span className="hiyaghar-field-error">{passwordErrors.currentPassword}</span>}
              </div>

              <div className="hiyaghar-form-group">
                <label>New Password *</label>
                <div className="hiyaghar-password-wrapper">
                  <input
                    type={showNewPass ? 'text' : 'password'}
                    placeholder="At least 8 characters"
                    className={passwordErrors.newPassword ? 'input-error' : ''}
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      if (passwordErrors.newPassword) setPasswordErrors((prev) => ({ ...prev, newPassword: '' }));
                    }}
                  />
                  <button
                    type="button"
                    className="hiyaghar-password-toggle-btn"
                    onClick={() => setShowNewPass(!showNewPass)}
                    title={showNewPass ? 'Hide password' : 'Show password'}
                  >
                    {showNewPass ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    )}
                  </button>
                </div>
                {passwordErrors.newPassword && <span className="hiyaghar-field-error">{passwordErrors.newPassword}</span>}
              </div>

              <div className="hiyaghar-form-group">
                <label>Confirm New Password *</label>
                <div className="hiyaghar-password-wrapper">
                  <input
                    type={showConfirmPass ? 'text' : 'password'}
                    placeholder="Confirm new password"
                    className={passwordErrors.confirmPassword ? 'input-error' : ''}
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (passwordErrors.confirmPassword) setPasswordErrors((prev) => ({ ...prev, confirmPassword: '' }));
                    }}
                  />
                  <button
                    type="button"
                    className="hiyaghar-password-toggle-btn"
                    onClick={() => setShowConfirmPass(!showConfirmPass)}
                    title={showConfirmPass ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPass ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    )}
                  </button>
                </div>
                {passwordErrors.confirmPassword && <span className="hiyaghar-field-error">{passwordErrors.confirmPassword}</span>}
              </div>

              <div className="hiyaghar-modal-footer" style={{ marginTop: '20px' }}>
                <button
                  type="button"
                  className="hiyaghar-btn-cancel"
                  onClick={() => setIsPasswordModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="hiyaghar-btn-submit"
                  disabled={passwordLoading}
                >
                  {passwordLoading ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
