'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, FileEdit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type DraftStatus = 'safe' | 'stale-no-version' | 'stale-version-mismatch';

interface DraftBannerProps {
  draftStatus?: DraftStatus;
  /** For safe drafts: discard the draft and restore server data. */
  onDiscard?: () => void;
  /** For stale drafts: dismiss the warning banner. */
  onDismiss?: () => void;
  className?: string;
}

export default function DraftBanner({ draftStatus = 'safe', onDiscard, onDismiss, className }: DraftBannerProps) {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  const isStale = draftStatus === 'stale-no-version' || draftStatus === 'stale-version-mismatch';

  const handleDismiss = () => {
    onDismiss?.();
    setIsVisible(false);
  };

  const handleDiscard = () => {
    onDiscard?.();
    setIsVisible(false);
  };

  if (isStale) {
    const title =
      draftStatus === 'stale-no-version'
        ? 'Draft predates version protection — saving blocked'
        : 'Stale draft detected — saving blocked';

    const message =
      draftStatus === 'stale-no-version'
        ? 'This local draft was created before version protection was active. It may be older than the current article. To protect newer content, saving is blocked. Copy anything important from the editor below, then click "Discard draft & load latest" to continue.'
        : 'This local draft is older than the current article. Saving it could overwrite newer content, so saving is blocked. Copy anything important from the editor below, then click "Discard draft & load latest" to continue.';

    return (
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.2 }}
        className={cn(
          'flex items-start justify-between gap-4 px-4 py-3 rounded-xl',
          'border border-red-300 bg-red-50 text-red-900 shadow-sm',
          className
        )}
      >
        <div className="flex items-start gap-2.5">
          <div className="flex-shrink-0 w-7 h-7 rounded-full bg-red-100 flex items-center justify-center mt-0.5">
            <AlertTriangle className="w-3.5 h-3.5 text-red-700" />
          </div>
          <div>
            <p className="text-sm font-semibold text-red-900">{title}</p>
            <p className="text-xs text-red-700 mt-0.5 max-w-2xl">{message}</p>
          </div>
        </div>
        <Button
          type="button"
          variant="destructive"
          size="sm"
          onClick={handleDiscard}
          className="flex-shrink-0 gap-1.5 text-xs whitespace-nowrap"
        >
          <Trash2 className="w-3 h-3" />
          Discard draft &amp; load latest
        </Button>
      </motion.div>
    );
  }

  // Safe draft (version matches server)
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
            A local draft matching the current server version has been restored. You can continue editing safely.
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
          onClick={handleDiscard}
          className={cn('border-red-300 text-red-700 hover:bg-red-50 gap-1.5 text-xs')}
        >
          <Trash2 className="w-3 h-3" />
          Discard draft
        </Button>
      </div>
    </motion.div>
  );
}
