/**
 * YouTube helpers for tour cards.
 *
 * The card's video button and the handler that opens the player have to agree
 * on one question — "does this tour have a playable video?" — and they were
 * answering it in different places. The button asked only whether a click
 * handler existed, so it appeared on every card; the handler then fetched the
 * tour and discovered there was nothing to play. Deriving both from the
 * helpers here is what keeps the button honest.
 *
 * The extractor also had four hand-copied duplicates across the listing views,
 * and one of them had already drifted: the special-offers copy recognised
 * neither /shorts/ links nor URLs with surrounding whitespace, so those tours
 * were silently treated as having no video.
 */

/** Accepts the youtu.be, watch?v=, /embed/ and /shorts/ URL shapes. Returns an
 *  empty string for anything it cannot read as a video id. */
export const getYouTubeVideoId = (url: string): string => {
  if (!url) return "";

  const trimmed = url.trim();
  const short = trimmed.match(/youtu\.be\/([a-zA-Z0-9_-]{6,})/);
  if (short?.[1]) return short[1];
  const watch = trimmed.match(/[?&]v=([a-zA-Z0-9_-]{6,})/);
  if (watch?.[1]) return watch[1];
  const embed = trimmed.match(/\/embed\/([a-zA-Z0-9_-]{6,})/);
  if (embed?.[1]) return embed[1];
  const shorts = trimmed.match(/\/shorts\/([a-zA-Z0-9_-]{6,})/);
  if (shorts?.[1]) return shorts[1];

  return "";
};

/** Every playable id in a tour's `reviews`, in order. */
export const getTourReviewVideoIds = (reviews: unknown): string[] => {
  if (!Array.isArray(reviews)) return [];

  return reviews
    .map((review) =>
      getYouTubeVideoId(
        typeof (review as { url?: unknown })?.url === "string"
          ? ((review as { url: string }).url)
          : ""
      )
    )
    .filter(Boolean);
};

/** Whether a card should offer the video button at all. A review row with a
 *  broken or non-YouTube URL does not count — the player could not open it. */
export const hasTourReviewVideos = (reviews: unknown): boolean =>
  getTourReviewVideoIds(reviews).length > 0;
