"use client";
import React, { useEffect, useMemo, useState } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import { useForm, SubmitHandler } from 'react-hook-form';
import { User, RegisterData } from '@/lib/api/auth';
import { ALL_PERMISSIONS, DEFAULT_ADMIN_PERMISSIONS, PERMISSION_PRESETS } from '@/permissions';
import { useAuth } from '@/contexts/AuthContext';

interface UserModalProps {
  show: boolean;
  onHide: () => void;
  onSubmit: (data: RegisterData) => Promise<void>;
  user?: User | null;
  isLoading?: boolean;
}

interface UserFormData {
  name: string;
  email: string;
  password?: string;
  role: 'superadmin' | 'admin';
  permissions: string[];
}

const UserModal: React.FC<UserModalProps> = ({
  show,
  onHide,
  onSubmit,
  user,
  isLoading = false,
}) => {
  const { user: currentUser } = useAuth();
  const isSuperAdmin = currentUser?.role === 'superadmin';

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<UserFormData>({
    defaultValues: {
      role: 'admin',
      permissions: DEFAULT_ADMIN_PERMISSIONS,
    },
  });

  const [permissionSearch, setPermissionSearch] = useState('');
  const [selectedPresetId, setSelectedPresetId] = useState<string>('default_admin');

  useEffect(() => {
    register('permissions');
  }, [register]);

  const selectedPermissions = watch('permissions') || [];
  const selectedRole = watch('role');

  const groupedPermissions = useMemo(() => {
    const q = permissionSearch.trim().toLowerCase();
    const entries = ALL_PERMISSIONS.map((value) => {
      const [resourceRaw, actionRaw] = value.split(':');
      const resource = (resourceRaw || '').toLowerCase();
      const action = (actionRaw || '').toLowerCase();
      const label = `${resourceRaw?.replace(/_/g, ' ') || ''}: ${actionRaw || ''}`;
      return {
        value,
        resource,
        resourceRaw: resourceRaw || 'other',
        action,
        actionRaw: actionRaw || '',
        label,
      };
    }).filter((p) => {
      if (!q) return true;
      return (
        p.value.toLowerCase().includes(q) ||
        p.resource.includes(q) ||
        p.action.includes(q) ||
        p.label.toLowerCase().includes(q)
      );
    });

    const map = new Map<string, typeof entries>();
    for (const item of entries) {
      const key = item.resourceRaw;
      const arr = map.get(key) || [];
      arr.push(item);
      map.set(key, arr);
    }

    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([group, items]) => ({
        group,
        title: group.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
        items: items.sort((x, y) => x.value.localeCompare(y.value)),
      }));
  }, [permissionSearch]);

  const togglePermission = (perm: string) => {
    const next = selectedPermissions.includes(perm)
      ? selectedPermissions.filter((p) => p !== perm)
      : [...selectedPermissions, perm];
    setValue('permissions', next, { shouldDirty: true });
  };

  const setPermissions = (perms: string[]) => {
    setValue('permissions', perms, { shouldDirty: true });
  };

  const filteredPermissionValues = useMemo(() => {
    return groupedPermissions.flatMap((g) => g.items.map((i) => i.value));
  }, [groupedPermissions]);

  useEffect(() => {
    if (user) {
      setValue('name', user.name);
      setValue('email', user.email);
      setValue('role', user.role || 'admin');
      setValue('permissions', user.permissions || DEFAULT_ADMIN_PERMISSIONS);
    } else {
      reset({ role: 'admin', permissions: DEFAULT_ADMIN_PERMISSIONS } as any);
    }
  }, [user, setValue, reset]);

  const onFormSubmit: SubmitHandler<UserFormData> = async (data) => {
    try {
      await onSubmit({
        name: data.name,
        email: data.email,
        password: data.password || 'defaultPassword123',
        role: data.role,
        permissions: data.permissions || [],
      });
      reset();
      onHide();
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  const handleClose = () => {
    reset();
    onHide();
  };

  return (
    <>
      <Modal 
        show={show} 
        onHide={handleClose} 
        centered
        size="lg"
        dialogClassName="user-modal-dialog"
        backdrop={true}
        keyboard={true}
      >
        <Modal.Header className="modern-modal-header">
          <Modal.Title className="modern-modal-title">
            <div className="modal-title-icon">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {user ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                )}
              </svg>
            </div>
            <div>
              <h4>{user ? 'Edit Administrator' : 'Add Administrator'}</h4>
              <p>{user ? 'Update administrator information' : 'Create a new administrator account'}</p>
            </div>
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit(onFormSubmit)}>
          <Modal.Body className="modern-modal-body">
            <div className="form-grid">
              {/* Name Field */}
              <div className="form-group-modern">
                <label className="form-label-modern">
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Full Name
                  <span className="required">*</span>
                </label>
                <Form.Control
                  type="text"
                  placeholder="Enter administrator's full name"
                  className="form-input-modern"
                  {...register('name', {
                    required: 'Name is required',
                    minLength: { value: 2, message: 'Name must be at least 2 characters' },
                  })}
                  isInvalid={!!errors.name}
                  disabled={isLoading}
                />
                {errors.name && (
                  <div className="error-message">
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {errors.name?.message}
                  </div>
                )}
              </div>

              {/* Email Field */}
              <div className="form-group-modern">
                <label className="form-label-modern">
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Email Address
                  <span className="required">*</span>
                </label>
                <Form.Control
                  type="email"
                  placeholder="admin@example.com"
                  className="form-input-modern"
                  {...register('email', {
                    required: 'Email is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Invalid email address',
                    },
                  })}
                  isInvalid={!!errors.email}
                  disabled={isLoading || !!user}
                />
                {errors.email && (
                  <div className="error-message">
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {errors.email?.message}
                  </div>
                )}
                {user && (
                  <div className="info-message">
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Email cannot be changed for existing users
                  </div>
                )}
              </div>

              {/* Password Field */}
              <div className="form-group-modern">
                <label className="form-label-modern">
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  {user ? 'New Password (Optional)' : 'Password'}
                  {!user && <span className="required">*</span>}
                </label>
                <Form.Control
                  type="password"
                  placeholder={user ? 'Leave blank to keep current password' : 'Minimum 6 characters'}
                  className="form-input-modern"
                  {...register('password', {
                    required: !user ? 'Password is required' : false,
                    minLength: { value: 6, message: 'Password must be at least 6 characters' },
                  })}
                  isInvalid={!!errors.password}
                  disabled={isLoading}
                />
                {errors.password && (
                  <div className="error-message">
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {errors.password?.message}
                  </div>
                )}
                {user && (
                  <div className="info-message">
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Only fill this if you want to change the password
                  </div>
                )}
              </div>

              {/* Role Field */}
              <div className="form-group-modern">
                <label className="form-label-modern">
                  Role
                  <span className="required">*</span>
                </label>
                <Form.Select
                  className="form-input-modern"
                  {...register('role', { required: 'Role is required' })}
                  disabled={isLoading || !isSuperAdmin}
                >
                  <option value="admin">Admin</option>
                  <option value="superadmin">Super Admin</option>
                </Form.Select>
              </div>

              {/* Permissions */}
              <div className="form-group-modern">
                <label className="form-label-modern">Permissions</label>
                <div className="permissions-panel">
                  <div className="permissions-toolbar">
                    <Form.Control
                      type="text"
                      value={permissionSearch}
                      placeholder="Search permissions (e.g. blog, booking:update)"
                      onChange={(e) => setPermissionSearch(e.target.value)}
                      className="form-input-modern"
                      disabled={isLoading || !isSuperAdmin}
                    />
                    <div className="permissions-actions">
                      <Form.Select
                        value={selectedPresetId}
                        onChange={(e) => setSelectedPresetId(e.target.value)}
                        className="form-input-modern"
                        style={{ minWidth: 220 }}
                        disabled={isLoading || !isSuperAdmin}
                      >
                        {PERMISSION_PRESETS.map((preset) => (
                          <option key={preset.id} value={preset.id}>
                            {preset.name}
                          </option>
                        ))}
                      </Form.Select>
                      <button
                        type="button"
                        className="btn-modal-submit"
                        onClick={() => {
                          const preset = PERMISSION_PRESETS.find((p) => p.id === selectedPresetId);
                          if (preset) {
                            setPermissions(preset.permissions);
                          }
                        }}
                        disabled={isLoading || !isSuperAdmin}
                        title="Apply preset"
                      >
                        Apply
                      </button>
                      <button
                        type="button"
                        className="btn-modal-cancel"
                        onClick={() => {
                          const merged = Array.from(new Set([...selectedPermissions, ...filteredPermissionValues]));
                          setPermissions(merged);
                        }}
                        disabled={isLoading || !isSuperAdmin}
                      >
                        Select All
                      </button>
                      <button
                        type="button"
                        className="btn-modal-cancel"
                        onClick={() => setPermissions([])}
                        disabled={isLoading || !isSuperAdmin}
                      >
                        Clear
                      </button>
                      <button
                        type="button"
                        className="btn-modal-submit"
                        onClick={() => setPermissions(DEFAULT_ADMIN_PERMISSIONS)}
                        disabled={isLoading || !isSuperAdmin}
                      >
                        Default
                      </button>
                    </div>
                  </div>

                  {selectedRole === 'superadmin' ? (
                    <div className="info-message">
                      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Super Admin has full access. Permissions selection is optional.
                    </div>
                  ) : null}

                  {selectedPermissions.length > 0 ? (
                    <div className="permissions-chips">
                      {selectedPermissions
                        .slice()
                        .sort((a, b) => a.localeCompare(b))
                        .map((p) => (
                          <button
                            key={p}
                            type="button"
                            className="permission-chip"
                            onClick={() => togglePermission(p)}
                            disabled={isLoading || !isSuperAdmin}
                            title="Click to remove"
                          >
                            {p}
                            <span className="chip-x">×</span>
                          </button>
                        ))}
                    </div>
                  ) : (
                    <div className="info-message">
                      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      No permissions selected yet.
                    </div>
                  )}

                  <div className="permissions-list" aria-disabled={isLoading || !isSuperAdmin}>
                    {groupedPermissions.length === 0 ? (
                      <div className="info-message">No permissions match your search.</div>
                    ) : (
                      groupedPermissions.map((group) => (
                        <div key={group.group} className="permissions-group">
                          <div className="permissions-group-title">{group.title}</div>
                          <div className="permissions-group-items">
                            {group.items.map((item) => {
                              const checked = selectedPermissions.includes(item.value);
                              return (
                                <button
                                  key={item.value}
                                  type="button"
                                  className={`permission-item ${checked ? 'is-checked' : ''}`}
                                  onClick={() => togglePermission(item.value)}
                                  disabled={isLoading || !isSuperAdmin}
                                >
                                  <span className={`permission-checkbox ${checked ? 'checked' : ''}`}>
                                    {checked ? '✓' : ''}
                                  </span>
                                  <span className="permission-item-text">{item.label}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
                {!isSuperAdmin ? (
                  <div className="info-message">
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Only Super Admin can change roles and permissions
                  </div>
                ) : (
                  <div className="info-message">
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Use search and quick actions to manage permissions fast
                  </div>
                )}
              </div>
            </div>
          </Modal.Body>
          <Modal.Footer className="modern-modal-footer">
            <button 
              type="button"
              onClick={onHide} 
              disabled={isLoading}
              className="btn-modal-cancel"
            >
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={isLoading}
              className="btn-modal-submit"
            >
              {isLoading ? (
                <>
                  <span className="spinner-sm" />
                  {user ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                <>
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    {user ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    )}
                  </svg>
                  {user ? 'Update Administrator' : 'Create Administrator'}
                </>
              )}
            </button>
          </Modal.Footer>
        </Form>
      </Modal>

      <style jsx global>{`
        /* Modal Backdrop - Blur Background */
        .modal-backdrop {
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          width: 100vw !important;
          height: 100vh !important;
          z-index: 10000 !important;
          background-color: rgba(0, 0, 0, 0.75) !important;
          backdrop-filter: blur(10px) !important;
          -webkit-backdrop-filter: blur(10px) !important;
        }

        .modal-backdrop.show {
          opacity: 1 !important;
        }

        /* Modal Dialog */
        .modal {
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          width: 100vw !important;
          height: 100vh !important;
          z-index: 10001 !important;
          padding: 0 !important;
          overflow-x: hidden !important;
          overflow-y: auto !important;
        }

        .modal.show {
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
        }

        .user-modal-dialog {
          max-width: 600px;
          width: 90%;
          margin: 1.75rem auto;
          position: relative;
          z-index: 10002;
        }

        .modal-content {
          border: none;
          border-radius: 16px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          overflow: hidden;
        }

        /* Modal Header */
        .modern-modal-header {
          background: linear-gradient(135deg, #d4af37 0%, #f4d03f 100%);
          border: none;
          padding: 24px 28px;
          position: relative;
        }

        .modern-modal-header .btn-close {
          position: absolute;
          right: 20px;
          top: 20px;
          width: 36px !important;
          height: 36px !important;
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.15) !important;
          background-image: none !important;
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2) !important;
          opacity: 1 !important;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0 !important;
          cursor: pointer !important;
          z-index: 10;
          box-shadow: none !important;
        }

        .modern-modal-header .btn-close:hover {
          background: rgba(255, 255, 255, 0.25) !important;
          background-image: none !important;
          border-color: rgba(255, 255, 255, 0.3) !important;
          transform: rotate(90deg);
          opacity: 1 !important;
        }

        .modern-modal-header .btn-close:active {
          transform: rotate(90deg) scale(0.95);
        }

        .modern-modal-header .btn-close::before,
        .modern-modal-header .btn-close::after {
          content: '';
          position: absolute;
          width: 16px;
          height: 2px;
          background: white;
          border-radius: 2px;
          pointer-events: none;
        }

        .modern-modal-header .btn-close::before {
          transform: rotate(45deg);
        }

        .modern-modal-header .btn-close::after {
          transform: rotate(-45deg);
        }

        .modern-modal-header .btn-close:focus {
          box-shadow: 0 0 0 4px rgba(255, 255, 255, 0.2);
          outline: none;
        }

        .modern-modal-title {
          display: flex;
          align-items: center;
          gap: 16px;
          width: 100%;
        }

        .modal-title-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .modal-title-icon svg {
          width: 24px;
          height: 24px;
          color: white;
        }

        .modern-modal-title h4 {
          font-size: 20px;
          font-weight: 700;
          color: white;
          margin: 0 0 4px 0;
        }

        .modern-modal-title p {
          font-size: 13px;
          color: rgba(255, 255, 255, 0.9);
          margin: 0;
        }

        /* Modal Body */
        .modern-modal-body {
          padding: 32px;
          background: #fafbfc;
        }

        .form-grid {
          display: grid;
          gap: 24px;
        }

        /* Modern Form Group */
        .form-group-modern {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .form-label-modern {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 600;
          color: #1f2937;
          font-size: 14px;
        }

        .form-label-modern svg {
          width: 18px;
          height: 18px;
          color: #6b7280;
        }

        .form-label-modern .required {
          color: #ef4444;
          margin-left: 2px;
        }

        .form-input-modern {
          border: 2px solid #e5e7eb !important;
          border-radius: 10px !important;
          padding: 12px 16px !important;
          font-size: 14px !important;
          transition: all 0.2s ease !important;
          background: white !important;
        }

        .form-input-modern:focus {
          outline: none !important;
          border-color: #d4af37 !important;
          box-shadow: 0 0 0 4px rgba(212, 175, 55, 0.1) !important;
          background: white !important;
        }

        .form-input-modern:disabled {
          background: #f3f4f6 !important;
          cursor: not-allowed !important;
          color: #9ca3af !important;
        }

        .form-input-modern::placeholder {
          color: #9ca3af;
        }

        /* Error Message */
        .error-message {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 12px;
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 8px;
          color: #991b1b;
          font-size: 13px;
          font-weight: 500;
        }

        .error-message svg {
          width: 16px;
          height: 16px;
          flex-shrink: 0;
        }

        /* Info Message */
        .info-message {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 12px;
          background: #eff6ff;
          border: 1px solid #bfdbfe;
          border-radius: 8px;
          color: #1e40af;
          font-size: 13px;
          font-weight: 500;
        }

        .info-message svg {
          width: 16px;
          height: 16px;
          flex-shrink: 0;
        }

        /* Modal Footer */
        .modern-modal-footer {
          padding: 20px 28px;
          background: white;
          border-top: 1px solid #e5e7eb;
          display: flex;
          gap: 12px;
          justify-content: flex-end;
        }

        .btn-modal-cancel,
        .btn-modal-submit {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 12px 24px;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          border: none;
        }

        .btn-modal-cancel svg,
        .btn-modal-submit svg {
          width: 18px;
          height: 18px;
        }

        .btn-modal-cancel {
          background: white;
          border: 2px solid #e5e7eb;
          color: #6b7280;
        }

        .btn-modal-cancel:hover:not(:disabled) {
          background: #f9fafb;
          border-color: #d1d5db;
          color: #374151;
        }

        .btn-modal-submit {
          background: linear-gradient(135deg, #d4af37 0%, #f4d03f 100%);
          color: white;
          box-shadow: 0 4px 12px rgba(212, 175, 55, 0.3);
        }

        .btn-modal-submit:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(212, 175, 55, 0.4);
        }

        .btn-modal-cancel:disabled,
        .btn-modal-submit:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .spinner-sm {
          width: 16px;
          height: 16px;
          border: 2px solid currentColor;
          border-top-color: transparent;
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* Responsive */
        @media (max-width: 768px) {
          .user-modal-dialog {
            max-width: calc(100% - 2rem);
            margin: 1rem;
          }

          .modern-modal-header {
            padding: 20px;
          }

          .modern-modal-title {
            gap: 12px;
          }

          .modal-title-icon {
            width: 40px;
            height: 40px;
          }

          .modal-title-icon svg {
            width: 20px;
            height: 20px;
          }

          .modern-modal-title h4 {
            font-size: 18px;
          }

          .modern-modal-title p {
            font-size: 12px;
          }

          .modern-modal-body {
            padding: 20px;
          }

          .modern-modal-footer {
            padding: 16px 20px;
            flex-direction: column;
          }

          .btn-modal-cancel,
          .btn-modal-submit {
            width: 100%;
            justify-content: center;
          }
        }

        .permissions-panel {
          border: 1px solid rgba(0, 0, 0, 0.08);
          border-radius: 12px;
          padding: 12px;
          background: rgba(255, 255, 255, 0.9);
        }

        .permissions-toolbar {
          display: grid;
          grid-template-columns: 1fr;
          gap: 10px;
          margin-bottom: 10px;
        }

        @media (min-width: 768px) {
          .permissions-toolbar {
            grid-template-columns: 1fr auto;
            align-items: center;
          }
        }

        .permissions-actions {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          justify-content: flex-end;
        }

        .permissions-list {
          margin-top: 10px;
          max-height: 240px;
          overflow: auto;
          border-top: 1px solid rgba(0, 0, 0, 0.06);
          padding-top: 10px;
        }

        .permissions-group {
          margin-bottom: 12px;
        }

        .permissions-group-title {
          font-weight: 700;
          font-size: 13px;
          color: rgba(0, 0, 0, 0.7);
          margin-bottom: 8px;
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }

        .permissions-group-items {
          display: grid;
          grid-template-columns: 1fr;
          gap: 8px;
        }

        @media (min-width: 768px) {
          .permissions-group-items {
            grid-template-columns: 1fr 1fr;
          }
        }

        .permission-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          border-radius: 10px;
          border: 1px solid rgba(0, 0, 0, 0.08);
          background: #fff;
          text-align: left;
          transition: background 0.15s ease, border-color 0.15s ease;
        }

        .permission-item:hover {
          background: rgba(212, 175, 55, 0.08);
          border-color: rgba(212, 175, 55, 0.35);
        }

        .permission-item.is-checked {
          background: rgba(212, 175, 55, 0.12);
          border-color: rgba(212, 175, 55, 0.55);
        }

        .permission-checkbox {
          width: 22px;
          height: 22px;
          border-radius: 6px;
          border: 1px solid rgba(0, 0, 0, 0.2);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          color: #fff;
          background: #fff;
          flex: 0 0 22px;
        }

        .permission-checkbox.checked {
          background: #d4af37;
          border-color: #d4af37;
        }

        .permission-item-text {
          font-size: 13px;
          color: rgba(0, 0, 0, 0.8);
          word-break: break-word;
        }

        .permissions-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin: 10px 0 0;
        }

        .permission-chip {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          border-radius: 999px;
          border: 1px solid rgba(0, 0, 0, 0.1);
          background: rgba(212, 175, 55, 0.12);
          color: rgba(0, 0, 0, 0.85);
          padding: 6px 10px;
          font-size: 12px;
          cursor: pointer;
        }

        .chip-x {
          font-size: 14px;
          line-height: 1;
          opacity: 0.8;
        }
      `}
</style>
    </>
  );
};

export default UserModal;
