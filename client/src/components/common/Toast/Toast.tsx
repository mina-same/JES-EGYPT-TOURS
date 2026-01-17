import React, { useEffect } from 'react';
import { CheckCircle, XCircle, X } from 'lucide-react';

export type ToastType = 'success' | 'error';

interface ToastProps {
  message: string;
  type: ToastType;
  onClose: () => void;
  duration?: number;
}

const Toast: React.FC<ToastProps> = ({ message, type, onClose, duration = 5000 }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <>
      <div className={`toast toast--${type}`}>
        <div className="toast__icon">
          {type === 'success' ? (
            <CheckCircle size={24} />
          ) : (
            <XCircle size={24} />
          )}
        </div>
        <div className="toast__content">
          <p className="toast__message">{message}</p>
        </div>
        <button className="toast__close" onClick={onClose} aria-label="Close notification">
          <X size={18} />
        </button>
      </div>

      <style jsx>{`
        .toast {
          position: fixed;
          top: 20px;
          right: 20px;
          min-width: 320px;
          max-width: 500px;
          padding: 16px 20px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
          display: flex;
          align-items: center;
          gap: 12px;
          z-index: 10000;
          animation: slideIn 0.3s ease-out;
        }

        @keyframes slideIn {
          from {
            transform: translateX(400px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        .toast--success {
          border-left: 4px solid #10b981;
        }

        .toast--error {
          border-left: 4px solid #ef4444;
        }

        .toast__icon {
          flex-shrink: 0;
        }

        .toast--success .toast__icon {
          color: #10b981;
        }

        .toast--error .toast__icon {
          color: #ef4444;
        }

        .toast__content {
          flex: 1;
        }

        .toast__message {
          margin: 0;
          font-size: 14px;
          line-height: 1.5;
          color: #1f2937;
          font-weight: 500;
        }

        .toast__close {
          flex-shrink: 0;
          background: none;
          border: none;
          padding: 4px;
          cursor: pointer;
          color: #6b7280;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 4px;
          transition: all 0.2s ease;
        }

        .toast__close:hover {
          background: #f3f4f6;
          color: #1f2937;
        }

        @media (max-width: 640px) {
          .toast {
            top: 10px;
            right: 10px;
            left: 10px;
            min-width: auto;
            max-width: none;
          }
        }
      `}</style>
    </>
  );
};

export default Toast;
