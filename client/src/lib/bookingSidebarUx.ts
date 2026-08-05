interface BookingSidebarLayoutInput {
  rowTop: number;
  rowBottom: number;
  cardHeight: number;
  viewportHeight: number;
  gap?: number;
}

export interface BookingSidebarLayout {
  top: number;
  availableHeight: number;
  visibleHeight: number;
  canFix: boolean;
  reachedEnd: boolean;
}

/** Geometry for a desktop booking card constrained to the visible viewport.
 * The full content height is retained separately from the visible panel height
 * so a tall form can scroll internally without being parked too early. */
export const calculateBookingSidebarLayout = ({
  rowTop,
  rowBottom,
  cardHeight,
  viewportHeight,
  gap = 20,
}: BookingSidebarLayoutInput): BookingSidebarLayout => {
  // The tour tabs are confined to the content column, so they never overlap
  // the booking column. Adding their height here created an empty strip above
  // the card as soon as the tabs became fixed.
  const top = gap;
  const availableHeight = Math.max(1, viewportHeight - top - gap);
  const visibleHeight = Math.min(cardHeight, availableHeight);
  const canFix = rowTop <= top;
  const reachedEnd = rowBottom <= top + visibleHeight;

  return { top, availableHeight, visibleHeight, canFix, reachedEnd };
};
