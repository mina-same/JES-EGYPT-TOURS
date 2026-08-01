export const TRAVEL_TRADE_INQUIRY_ID = "travel-trade-inquiry";
export const TRAVEL_TRADE_SERVICES_ID = "travel-trade-services";
export const TRAVEL_TRADE_INTENT_EVENT = "travel-trade:set-intent";

export type TravelTradeIntent =
  | "b2b-rates"
  | "client-request"
  | "general-partnership";

export interface SelectOption {
  value: string;
  label: string;
}

export interface TravelTradeInquiryCopy {
  eyebrow: string;
  title: string;
  intro: string;
  sections: {
    contact: string;
    business: string;
    request: string;
  };
  fields: {
    inquiryType: string;
    fullName: string;
    businessEmail: string;
    phone: string;
    companyName: string;
    companyWebsite: string;
    country: string;
    businessType: string;
    primaryMarket: string;
    annualTravelers: string;
    travelDates: string;
    travelers: string;
    destinations: string;
    serviceLanguage: string;
    serviceLevel: string;
    message: string;
  };
  placeholders: Record<
    | "fullName"
    | "businessEmail"
    | "phone"
    | "companyName"
    | "companyWebsite"
    | "country"
    | "primaryMarket"
    | "travelDates"
    | "travelers"
    | "destinations"
    | "serviceLanguage"
    | "message",
    string
  >;
  options: {
    inquiryTypes: SelectOption[];
    businessTypes: SelectOption[];
    annualTravelers: SelectOption[];
    serviceLevels: SelectOption[];
  };
  consentPrefix: string;
  consentLink: string;
  consentSuffix: string;
  fileNote: string;
  submit: string;
  submitting: string;
  successTitle: string;
  successMessage: string;
  errorTitle: string;
  errorMessage: string;
  validation: {
    required: string;
    email: string;
    website: string;
    consent: string;
    nameLength: string;
    companyLength: string;
    messageLength: string;
    travelers: string;
  };
  alternative: {
    title: string;
    text: string;
    email: string;
    whatsapp: string;
    whatsappMessage: string;
  };
}

export interface TravelTradeFaqCopy {
  eyebrow: string;
  title: string;
  items: Array<{
    question: string;
    answer: string;
  }>;
}
