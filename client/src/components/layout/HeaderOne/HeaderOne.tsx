"use client";

import React from "react";
import SiteHeader from "@/components/layout/SiteHeader/SiteHeader";

/**
 * The header in the document flow — the page's banner landmark.
 *
 * The markup moved to SiteHeader, which HeaderOneCloned renders too. This file
 * and HeaderOneCloned used to hold two near-identical copies of the whole
 * navigation; they are kept as named entry points only so the 24 pages that
 * import them do not have to change.
 */
const HeaderOne: React.FC<{ linkTheme?: "dark" | "light" }> = ({
  linkTheme = "light",
}) => <SiteHeader variant='primary' linkTheme={linkTheme} />;

export default HeaderOne;
