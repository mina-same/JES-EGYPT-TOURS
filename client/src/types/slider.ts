export interface SliderButton {
  text: string;
  link: string;
  linkDirection: '_blank' | '_self';
}

export interface SliderImage {
  url: string;
  fileName: string;
  title?: string;
  alt?: string;
}

export interface SliderUnderPromo {
  text: string;
  linkText: string;
  link: string;
  linkDirection: '_blank' | '_self';
}

export type GlobalSliderPromo = SliderUnderPromo;

export interface SliderItem {
  _id: string;
  subtitle: string;
  title: string;
  titleSpan: string;
  titleEnd: string;
  image: SliderImage;
  lineShape?: SliderImage;
  button?: SliderButton;
  underPromo?: SliderUnderPromo | null;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
