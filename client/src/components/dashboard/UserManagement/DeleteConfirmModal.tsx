"use client";
import React from 'react';
import { Modal, Button } from 'react-bootstrap';
import { User } from '@/lib/api/auth';

interface DeleteConfirmModalProps {
  show: boolean;
  user: User | null;
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting?: boolean;
}

const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  show,
  user,
  onConfirm,
  onCancel,
  isDeleting = false,
}) => {
  return (
    <Modal 
      show={show} 
      onHide={onCancel} 
      centered
      dialogClassName="delete-modal-dialog"
      backdrop={true}
      keyboard={true}
    >
      <Modal.Header className="modern-delete-header">
        <Modal.Title className="modern-delete-title">
          <div className="delete-icon-wrapper">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <h4>Confirm Deletion</h4>
            <p>This action cannot be undone</p>
          </div>
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="modern-delete-body">
        <p className="delete-message">
          Are you sure you want to delete this administrator account?
        </p>
        {user && (
          <div className="user-preview">
            <div className="user-preview-avatar">
              {user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
            </div>
            <div className="user-preview-info">
              <div className="user-preview-name">{user.name}</div>
              <div className="user-preview-email">{user.email}</div>
            </div>
          </div>
        )}
        <div className="warning-box">
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>This action cannot be undone. All data associated with this administrator will be permanently removed.</span>
        </div>
      </Modal.Body>
      <Modal.Footer className="modern-delete-footer">
        <button 
          onClick={onCancel}
          disabled={isDeleting}
          className="btn-delete-cancel"
        >
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          Cancel
        </button>
        <button 
          onClick={onConfirm}
          disabled={isDeleting}
          className="btn-delete-confirm"
        >
          {isDeleting ? (
            <>
              <span className="spinner-sm" />
              Deleting...
            </>
          ) : (
            <>
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete Administrator
            </>
          )}
        </button>
      </Modal.Footer>

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

        .delete-modal-dialog {
          max-width: 500px;
          width: 90%;
          margin: 1.75rem auto;
          position: relative;
          z-index: 10002;
        }

        .modal-content {
          border: none;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        }

        .modern-delete-header {
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          border: none;
          padding: 24px 28px;
          position: relative;
        }

        .modern-delete-header .btn-close {
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

        .modern-delete-header .btn-close:hover {
          background: rgba(255, 255, 255, 0.25) !important;
          background-image: none !important;
          border-color: rgba(255, 255, 255, 0.3) !important;
          transform: rotate(90deg);
          opacity: 1 !important;
        }

        .modern-delete-header .btn-close:active {
          transform: rotate(90deg) scale(0.95);
        }

        .modern-delete-header .btn-close::before,
        .modern-delete-header .btn-close::after {
          content: '';
          position: absolute;
          width: 16px;
          height: 2px;
          background: white;
          border-radius: 2px;
          pointer-events: none;
        }

        .modern-delete-header .btn-close::before {
          transform: rotate(45deg);
        }

        .modern-delete-header .btn-close::after {
          transform: rotate(-45deg);
        }

        .modern-delete-header .btn-close:focus {
          box-shadow: 0 0 0 4px rgba(255, 255, 255, 0.2);
          outline: none;
        }

        .modern-delete-title {
          display: flex;
          align-items: center;
          gap: 16px;
          width: 100%;
        }

        .delete-icon-wrapper {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .delete-icon-wrapper svg {
          width: 24px;
          height: 24px;
          color: white;
        }

        .modern-delete-title h4 {
          font-size: 20px;
          font-weight: 700;
          color: white;
          margin: 0 0 4px 0;
        }

        .modern-delete-title p {
          font-size: 13px;
          color: rgba(255, 255, 255, 0.9);
          margin: 0;
        }

        .modern-delete-body {
          padding: 28px;
          background: #f9fafb;
        }

        .delete-message {
          font-size: 15px;
          color: #374151;
          margin-bottom: 20px;
        }

        .user-preview {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 16px;
          background: white;
          border-radius: 10px;
          border: 1px solid #e5e7eb;
          margin-bottom: 20px;
        }

        .user-preview-avatar {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 16px;
          color: white;
          flex-shrink: 0;
        }

        .user-preview-info {
          flex: 1;
        }

        .user-preview-name {
          font-size: 15px;
          font-weight: 600;
          color: #111827;
          margin-bottom: 4px;
        }

        .user-preview-email {
          font-size: 13px;
          color: #6b7280;
        }

        .warning-box {
          display: flex;
          gap: 12px;
          padding: 14px 16px;
          background: #fef3c7;
          border: 1px solid #fde68a;
          border-radius: 10px;
        }

        .warning-box svg {
          width: 20px;
          height: 20px;
          color: #92400e;
          flex-shrink: 0;
          margin-top: 2px;
        }

        .warning-box span {
          font-size: 13px;
          color: #92400e;
          line-height: 1.5;
        }

        .modern-delete-footer {
          padding: 20px 28px;
          background: white;
          border-top: 1px solid #e5e7eb;
          display: flex;
          gap: 12px;
          justify-content: flex-end;
        }

        .btn-delete-cancel,
        .btn-delete-confirm {
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

        .btn-delete-cancel svg,
        .btn-delete-confirm svg {
          width: 18px;
          height: 18px;
        }

        .btn-delete-cancel {
          background: white;
          border: 2px solid #e5e7eb;
          color: #6b7280;
        }

        .btn-delete-cancel:hover:not(:disabled) {
          background: #f9fafb;
          border-color: #d1d5db;
          color: #374151;
        }

        .btn-delete-confirm {
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          color: white;
          box-shadow: 0 4px 12px rgba(239, 68, 68, 0.25);
        }

        .btn-delete-confirm:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(239, 68, 68, 0.35);
        }

        .btn-delete-cancel:disabled,
        .btn-delete-confirm:disabled {
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
          .delete-modal-dialog {
            max-width: calc(100% - 2rem);
            margin: 1rem;
          }

          .modern-delete-header {
            padding: 20px;
          }

          .modern-delete-title {
            gap: 12px;
          }

          .delete-icon-wrapper {
            width: 40px;
            height: 40px;
          }

          .delete-icon-wrapper svg {
            width: 20px;
            height: 20px;
          }

          .modern-delete-title h4 {
            font-size: 18px;
          }

          .modern-delete-title p {
            font-size: 12px;
          }

          .modern-delete-body {
            padding: 20px;
          }

          .modern-delete-footer {
            padding: 16px 20px;
            flex-direction: column-reverse;
          }

          .btn-delete-cancel,
          .btn-delete-confirm {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>
    </Modal>
  );
};

export default DeleteConfirmModal;
