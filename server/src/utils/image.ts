import { ILocalizedString } from '../models/shared/LocalizedSchema';

const DEFAULT_IMAGE_FILE_NAME = 'image';

const hasLocalizedValue = (value: any): boolean => {
  if (!value || typeof value !== 'object') return false;
  return ['en', 'de', 'it', 'es'].some((lang) => {
    const localized = value[lang];
    return typeof localized === 'string' ? localized.trim() !== '' : !!localized;
  });
};

const getFileNameFromUrl = (url: string): string => {
  const cleanUrl = url.split('?')[0];
  return cleanUrl.split('/').filter(Boolean).pop() || DEFAULT_IMAGE_FILE_NAME;
};

export const normalizeImageValue = (
  image: any,
  fallbackTitle?: ILocalizedString
): any | undefined => {
  if (!image) return undefined;

  if (typeof image === 'string') {
    const normalized: any = {
      url: image,
      fileName: getFileNameFromUrl(image),
    };

    if (fallbackTitle) {
      normalized.title = fallbackTitle;
      normalized.alt = fallbackTitle;
    }

    return normalized;
  }

  if (typeof image !== 'object' || !image.url) return undefined;

  const normalized: any = {
    ...image,
    fileName: image.fileName || getFileNameFromUrl(image.url),
  };

  if (fallbackTitle && !hasLocalizedValue(normalized.title)) {
    normalized.title = fallbackTitle;
  }

  if (fallbackTitle && !hasLocalizedValue(normalized.alt)) {
    normalized.alt = fallbackTitle;
  }

  return normalized;
};

export const normalizeDocumentImage = <T extends Record<string, any>>(
  document: T,
  fallbackTitle?: ILocalizedString
): T => {
  if (!document) return document;

  return {
    ...document,
    image: normalizeImageValue(document.image, fallbackTitle),
  };
};
