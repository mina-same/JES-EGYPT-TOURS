'use client';

import { useState } from 'react';
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
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) {
    return null;
  }

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
          <p className="text-sm font-semibold text-amber-900">Your work was auto-saved</p>
          <p className="text-xs text-amber-700">
            We restored the latest draft saved on this device. You can keep editing normally. Do not discard it unless you are sure you want to remove these saved changes.
          </p>
        </div>
      </div>
      <div className="flex flex-shrink-0 items-center gap-2">
        <Button
          type="button"
          size="sm"
          onClick={() => setIsVisible(false)}
          className="text-xs"
        >
          Continue editing
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            onDiscard();
            setIsVisible(false);
          }}
          className={cn(
            'border-red-300 text-red-700 hover:bg-red-50',
            'gap-1.5 text-xs'
          )}
        >
          <Trash2 className="w-3 h-3" />
          Discard draft
        </Button>
      </div>
    </motion.div>
  );
}
