"use client";

import React from "react";
import SiteHeader from "@/components/layout/SiteHeader/SiteHeader";

/**
 * The sticky scroll-up copy of the header.
 *
 * See SiteHeader for why this variant is hidden from the accessibility tree
 * and skipped by the keyboard: it repeats, pixel for pixel, links the primary
 * header already exposes at the top of the document.
 */
const HeaderOneCloned: React.FC = () => <SiteHeader variant='sticky' />;

export default HeaderOneCloned;
