/**
 * Focus after a language switch made from the keyboard.
 *
 * Switching language navigates to the same page in another language, and the
 * whole visitor shell is rebuilt for the new locale: the button the visitor
 * was on no longer exists, so focus fell to <body> and the next Tab started
 * from the top of the page. For a switch made with a mouse or a finger that
 * is as it should be. For one made from the keyboard (or by a screen reader's
 * activation, which arrives the same way) the selector of the new page takes
 * the focus back: the visitor is where they were, and reads the control in
 * the language they chose.
 *
 * The request crosses the navigation as one sessionStorage entry holding the
 * destination path. It is honoured once, only on that path and only for a few
 * seconds, so a navigation that was abandoned, or went somewhere else, cannot
 * move focus on a later page. Nothing goes into the URL.
 */
const STORAGE_KEY = "jes:language-focus";

/** Longer than a slow navigation; short enough to die with an abandoned one. */
const MAX_AGE_MS = 15000;

const normalizePath = (path: string) => path.split(/[?#]/)[0].replace(/\/+$/, "") || "/";

/** A click made without a pointer: Enter on the link, `click()`, assistive technology. */
export function isKeyboardClick(event: { detail: number }): boolean {
  return event.detail === 0;
}

/** Called as a keyboard-made switch starts navigating to `targetPath`. */
export function markLanguageFocus(targetPath: string): void {
  try {
    window.sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ path: normalizePath(targetPath), at: Date.now() })
    );
  } catch {
    // No storage: focus is simply not brought back.
  }
}

export function clearLanguageFocus(): void {
  try {
    window.sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // Nothing to clear.
  }
}

/**
 * True on the page such a switch was heading for, while the request is fresh.
 * A request for another page, or an old one, is dropped here. It does not
 * consume a valid one: whoever moves the focus calls clearLanguageFocus().
 */
export function hasPendingLanguageFocus(): boolean {
  let raw: string | null = null;
  try {
    raw = window.sessionStorage.getItem(STORAGE_KEY);
  } catch {
    return false;
  }
  if (!raw) return false;

  let request: { path?: unknown; at?: unknown } = {};
  try {
    request = JSON.parse(raw);
  } catch {
    request = {};
  }
  const fresh = typeof request.at === "number" && Date.now() - request.at <= MAX_AGE_MS && Date.now() >= request.at;
  if (fresh && request.path === normalizePath(window.location.pathname)) return true;

  clearLanguageFocus();
  return false;
}

/** Can this control take focus where the visitor will see it: displayed, visible, not inert? */
export function canTakeFocus(element: HTMLElement | null): element is HTMLElement {
  if (!element || element.getClientRects().length === 0) return false;
  if (element.closest("[inert]")) return false;
  return window.getComputedStyle(element).visibility !== "hidden";
}
