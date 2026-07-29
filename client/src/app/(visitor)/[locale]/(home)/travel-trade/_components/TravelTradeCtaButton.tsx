"use client";

import { ArrowRight } from "lucide-react";
import {
  TRAVEL_TRADE_INQUIRY_ID,
  TRAVEL_TRADE_INTENT_EVENT,
  type TravelTradeIntent,
} from "./types";

interface TravelTradeCtaButtonProps {
  intent: TravelTradeIntent;
  label: string;
  className: string;
  showArrow?: boolean;
}

export default function TravelTradeCtaButton({
  intent,
  label,
  className,
  showArrow = true,
}: TravelTradeCtaButtonProps) {
  const handleClick = () => {
    window.dispatchEvent(
      new CustomEvent(TRAVEL_TRADE_INTENT_EVENT, {
        detail: { intent },
      })
    );

    document.getElementById(TRAVEL_TRADE_INQUIRY_ID)?.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
      block: "start",
    });
  };

  return (
    <button type="button" className={className} onClick={handleClick}>
      <span>{label}</span>
      {showArrow ? <ArrowRight size={18} aria-hidden="true" /> : null}
    </button>
  );
}
