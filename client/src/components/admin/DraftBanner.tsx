'use client';

import { motion } from 'framer-motion';
import { FileEdit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface DraftBannerProps {
  onDiscard: () => void;
  className?: string;
}

/**
 * Shown at the top of a form when a localStorage draft has been auto-restored.
 */
export default function DraftBanner({ onDiscard, className }: DraftBannerProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
      className={cn(
        'flex items-center justify-between gap-4 px-4 py-2.5 rounded-xl',
        'border border-amber-300 bg-amber-50 text-amber-900 shadow-sm',
        className
      )}
    >
      <div className="flex items-center gap-2.5">
        <div className="flex-shrink-0 w-7 h-7 rounded-full bg-amber-100 flex items-center justify-center">
          <FileEdit className="w-3.5 h-3.5 text-amber-700" />
        </div>
        <div>
          <p className="text-sm font-semibold text-amber-900">Unsaved draft restored</p>
          <p className="text-xs text-amber-700">Your work from your last session has been loaded automatically.</p>
        </div>
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onDiscard}
        className={cn(
          'flex-shrink-0 border-amber-400 text-amber-800 hover:bg-amber-100',
          'gap-1.5 text-xs'
        )}
      >
        <Trash2 className="w-3 h-3" />
        Discard Draft
      </Button>
    </motion.div>
  );
}
