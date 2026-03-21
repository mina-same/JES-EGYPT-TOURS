import { useState, useEffect, useRef, useCallback } from 'react';

const DEBOUNCE_MS = 500;

interface UseFormDraftResult<T> {
  formData: T;
  setFormData: React.Dispatch<React.SetStateAction<T>>;
  clearDraft: () => void;
  hasDraft: boolean;
}

/**
 * A hook that persists form state to localStorage and restores it on mount.
 * @param key - Unique localStorage key for this form's draft (e.g. "draft_tour_cat_new")
 * @param initialValue - Default form state when no draft exists
 */
export function useFormDraft<T>(
  key: string,
  initialValue: T
): UseFormDraftResult<T> {
  const [hasDraft, setHasDraft] = useState(false);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstRender = useRef(true);

  // Initialize state: try to load from localStorage first
  const [formData, setFormData] = useState<T>(() => {
    if (typeof window === 'undefined') return initialValue;
    try {
      const stored = localStorage.getItem(key);
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed as T;
      }
    } catch (e) {
      // Ignore parse errors
    }
    return initialValue;
  });

  // After mount, check if a draft was loaded (so we can show the banner)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem(key);
      if (stored) {
        setHasDraft(true);
      }
    } catch (e) {
      // Ignore
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounced save to localStorage on every formData change
  useEffect(() => {
    // Skip the very first render (to avoid overwriting a restored draft with initialValue)
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      try {
        localStorage.setItem(key, JSON.stringify(formData));
      } catch (e) {
        // Quota exceeded or other error — fail silently
      }
    }, DEBOUNCE_MS);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [key, formData]);

  const clearDraft = useCallback(() => {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      // Ignore
    }
    setHasDraft(false);
  }, [key]);

  return { formData, setFormData, clearDraft, hasDraft };
}
