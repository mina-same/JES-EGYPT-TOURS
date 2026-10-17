"use client";

import React from "react";

/** `react-phone-number-input` intentionally maps a lone `+` to `undefined`
 * because it is not an E.164 number yet. Keep that safe model value while
 * rendering the international prefix in the real input so visitors can type
 * their digits directly after it. Shared by the tour booking form and the
 * tailor-made form. */
const InternationalPhoneTextInput = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ value, ...props }, ref) => (
  <input
    {...props}
    ref={ref}
    value={value === undefined || value === null || value === "" ? "+" : value}
  />
));
InternationalPhoneTextInput.displayName = "InternationalPhoneTextInput";

export default InternationalPhoneTextInput;
