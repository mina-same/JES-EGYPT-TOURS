import { ILocalizedString } from "./tour";

export interface SliderButton {
  text: ILocalizedString;
  link: string;
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
  link: string;
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
