// ==================== SHARED LOCALIZATION INTERFACES ====================

export interface ILocalizedString {
  en: string;
  de?: string;
  it?: string;
  es?: string;
  [key: string]: string | undefined;
}

export interface ILocalizedMixed {
  en: any;
  de?: any;
  it?: any;
  es?: any;
}

export interface IImage {
  url: string;
  fileName: string;
  title?: ILocalizedString;
  alt?: ILocalizedString;
  /** Locales this image renders for; absent/empty = all languages. */
  languages?: ('en' | 'de' | 'it' | 'es')[];
}
