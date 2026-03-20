// ==================== SHARED LOCALIZATION INTERFACES ====================

export interface ILocalizedString {
  en: string;
  de?: string;
  it?: string;
  es?: string;
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
}
