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
  button?: SliderButton;
  underPromo?: SliderUnderPromo | null;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
