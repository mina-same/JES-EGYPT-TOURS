import { ILocalizedString } from "./tour";

export interface SliderButton {
  text: ILocalizedString;
  /** Per-language destination URL. Legacy documents may still hold a plain
   *  string (treated as the English link everywhere). */
  link: ILocalizedString | string;
  linkDirection: '_blank' | '_self';
}

export interface SliderImage {
  url: string;
  fileName: string;
  title?: ILocalizedString;
  alt?: ILocalizedString;
}

export interface SliderUnderPromo {
  text: ILocalizedString;
  linkText: ILocalizedString;
  /** Per-language destination URL. Legacy documents may still hold a plain
   *  string (treated as the English link everywhere). */
  link: ILocalizedString | string;
  linkDirection: '_blank' | '_self';
  /** false = disabled: kept in the admin, hidden from visitors. Absent
   *  (legacy) counts as active. */
  isActive?: boolean;
}

export type GlobalSliderPromo = SliderUnderPromo;

export interface SliderItem {
  _id: string;
  subtitle: ILocalizedString;
  title: ILocalizedString;
  titleSpan: ILocalizedString;
  titleEnd: ILocalizedString;
  image: SliderImage;
  lineShape?: SliderImage;
  /** Primary CTA — solid gold button (left). */
  button?: SliderButton;
  /** Secondary CTA — outline button (right); site default (Special Offers)
   *  is used when absent. */
  buttonSecondary?: SliderButton;
  underPromo?: SliderUnderPromo | null;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
