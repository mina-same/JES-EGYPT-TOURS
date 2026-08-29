/**
 * The company's phone number, in one place.
 *
 * It used to be typed out in nineteen spots across thirteen files, in two
 * formats that nothing kept in sync: `201007437271` for links and
 * `+20 100 743 7271` for display. Two of those files even declared their own
 * `WHATSAPP_NUMBER` constant with a comment listing the others.
 *
 * Two of the copies were the expensive kind to get wrong: the number inside the
 * organization's schema.org markup, which is what Google repeats in search
 * results, and four copies sitting in the translation files -- where a phone
 * number does not belong, since it reads the same in every language.
 *
 * Change the digits below and every link, label and schema entry follows.
 */

/** Digits only, international, no `+` -- the form `wa.me` expects. */
export const WHATSAPP_NUMBER = "201007437271";

/** E.164, for `tel:` links and schema.org. */
export const PHONE_E164 = `+${WHATSAPP_NUMBER}`;

/** `tel:` href, ready to use. */
export const TEL_HREF = `tel:${PHONE_E164}`;

const group = (digits: string, sizes: number[]): string => {
  let at = 0;
  return sizes
    .map((size) => digits.slice(at, (at += size)))
    .filter(Boolean)
    .join(" ");
};

/**
 * Grouped for reading: `+20 100 743 7271`.
 *
 * Derived from the digits rather than typed a second time, so the number a
 * visitor reads and the number the link dials cannot disagree -- which is the
 * failure this module exists to prevent.
 */
export const PHONE_DISPLAY = `+${group(WHATSAPP_NUMBER, [2, 3, 3, 4])}`;

/**
 * A `wa.me` link. Pass a message to pre-fill the visitor's composer; they still
 * see it and can edit it before sending.
 */
export const waHref = (message?: string): string =>
  `https://wa.me/${WHATSAPP_NUMBER}${
    message ? `?text=${encodeURIComponent(message)}` : ""
  }`;
/**
 * The company's social profiles, in one place.
 *
 * Same failure as the phone number above, one layer out. These URLs were typed
 * in three places — footerOneData.socials, an inline block in Drawer.tsx, and
 * a topbarOne.socialLinks array nothing ever rendered — plus a FOURTH,
 * different set inside the organization's schema.org `sameAs`. The rendered
 * ones all pointed at the platforms' own front pages ("https://facebook.com"),
 * while the schema claimed "https://facebook.com/jesegypttours". So the markup
 * asserted profiles the visible links contradicted.
 *
 * `href: null` means "we do not have this profile". Nothing renders for it and
 * nothing is claimed in `sameAs` — an unlinked icon is better than an icon
 * that sends a customer to Instagram's login wall.
 */
export interface SocialProfile {
  /** Stable id, also the accessible name. */
  label: string;
  /** Icon class — the theme's own font, or FontAwesome. */
  icon: string;
  /** The full profile URL, or null while the profile is unknown. */
  href: string | null;
}

export const SOCIAL_PROFILES: readonly SocialProfile[] = [
  { label: "Facebook", icon: "icon-facebook", href: null },
  { label: "Instagram", icon: "fab fa-instagram", href: "https://www.instagram.com/jesegypttours/" },
  { label: "YouTube", icon: "icon-youtube", href: null },
  { label: "Twitter", icon: "fab fa-twitter", href: null },
  {
    label: "Tripadvisor",
    icon: "fab fa-tripadvisor",
    href: "https://www.tripadvisor.com/Attraction_Review-g294201-d32893109-Reviews-Jes_Egypt_Tour-Cairo_Cairo_Governorate.html",
  },
];

/** A profile that is known to exist — `href` is guaranteed non-null. */
export type LinkedSocialProfile = SocialProfile & { href: string };

/** Only the profiles that actually exist — what the UI and `sameAs` render. */
export const getSocialProfiles = (): LinkedSocialProfile[] =>
  SOCIAL_PROFILES.filter(
    (profile): profile is LinkedSocialProfile => !!profile.href
  );
