'use client';

import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X, ChevronRight } from 'lucide-react';
import type { FormErrorItem } from '@/lib/parseApiError';
import { cn } from '@/lib/utils';

interface FormErrorPanelProps {
  errors: FormErrorItem[];
  onDismiss?: () => void;
  className?: string;
}

const LANG_LABELS: Record<string, string> = {
  en: 'EN',
  de: 'DE',
  it: 'IT',
  es: 'ES',
};

const LANG_COLORS: Record<string, string> = {
  en: 'bg-blue-100 text-blue-700',
  de: 'bg-yellow-100 text-yellow-700',
  it: 'bg-green-100 text-green-700',
  es: 'bg-orange-100 text-orange-700',
};

export default function FormErrorPanel({ errors, onDismiss, className }: FormErrorPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to the panel when errors appear
  useEffect(() => {
    if (errors.length > 0 && panelRef.current) {
      panelRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [errors.length]);

  const scrollToField = (path?: string) => {
    if (!path) return;
    // Try to find the field by id or name
    const id = path.replace(/\./g, '-');
    const el =
      document.getElementById(id) ||
      document.querySelector(`[name="${id}"]`) ||
      document.querySelector(`[data-field="${path}"]`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      (el as HTMLElement).focus?.();
    }
  };

  if (errors.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        ref={panelRef}
        key="form-error-panel"
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -12 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className={cn(
          'relative border border-red-300 bg-red-50 rounded-xl p-4 shadow-sm',
          className
        )}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-red-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-red-800">
                {errors.length === 1
                  ? '1 issue needs your attention'
                  : `${errors.length} issues need your attention`}
              </p>
              <p className="text-xs text-red-600 mt-0.5">
                Please fix the following before saving.
              </p>
            </div>
          </div>
          {onDismiss && (
            <button
              type="button"
              onClick={onDismiss}
              className="text-red-400 hover:text-red-600 transition-colors flex-shrink-0"
              aria-label="Dismiss errors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Error list */}
        <ul className="space-y-1.5">
          {errors.map((err, i) => (
            <li key={i}>
              <button
                type="button"
                onClick={() => scrollToField(err.path)}
                className={cn(
                  'w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg text-sm',
                  'bg-white border border-red-200 hover:border-red-400 hover:bg-red-50',
                  'transition-all cursor-pointer group'
                )}
              >
                {/* Lang badge */}
                {err.lang && (
                  <span
                    className={cn(
                      'flex-shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded uppercase',
                      LANG_COLORS[err.lang] || 'bg-gray-100 text-gray-700'
                    )}
                  >
                    {LANG_LABELS[err.lang] || err.lang}
                  </span>
                )}

                {/* Field + message */}
                <span className="flex-1 min-w-0">
                  <span className="font-medium text-red-800">{err.field}</span>
                  {err.message && (
                    <span className="text-red-600 ml-1.5">— {err.message}</span>
                  )}
                </span>

                {/* Arrow hint for clickable errors */}
                {err.path && (
                  <ChevronRight className="w-3.5 h-3.5 text-red-400 flex-shrink-0 group-hover:translate-x-0.5 transition-transform" />
                )}
              </button>
            </li>
          ))}
        </ul>
      </motion.div>
    </AnimatePresence>
  );
}
