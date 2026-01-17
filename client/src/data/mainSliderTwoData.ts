
import buttonBg from '@/assets/images/backgrounds/button-bg.png';
import element1 from '@/assets/images/shapes/hero-1-4.png';
import element2 from '@/assets/images/shapes/hero-shapr-1-2.png';
import element3 from '@/assets/images/shapes/hero-1-2.png';
import element4 from '@/assets/images/shapes/hero-shapr-1-2-a.png';
import element5 from '@/assets/images/shapes/hero-1-1.png';
import mainSliderBg1 from '@/assets/images/backgrounds/main-slider-bg-1-1.jpg';
import mainSliderBg2 from '@/assets/images/backgrounds/main-slider-bg-1-2.jpg';
import mainSliderBg3 from '@/assets/images/backgrounds/main-slider-bg-1-3.jpg';

export const sliderTowData = {
  tagline: "Explore Worlds",
  title: "Exploring Beautiful",
  titleSpan: "Destinations",
  buttonBg: buttonBg,
  sliderItems: [
    {
     id:1,
      backgroundImage: mainSliderBg1,
      title: "Exploring Beautiful Destinations",
      subtitle: "Discover amazing places",
      text: "pretium posuere. Nam eget est felis. Donec luctus lobortis nisl rutrum gravida. Pellentesque varius posuere magna sed sodales. Phasellus",
      imageElements: [element1, element2, element3, element4, element5],
    },
    {
     id:2,
      backgroundImage: mainSliderBg2,
      title: "Beautiful Adventures Await",
      subtitle: "Find your next adventure",
      text: "pretium posuere. Nam eget est felis. Donec luctus lobortis nisl rutrum gravida. Pellentesque varius posuere magna sed sodales. Phasellus",
      imageElements: [element1, element2, element3, element4, element5],
    },
    {
     id:3,
      backgroundImage: mainSliderBg3,
      title: "Breathtaking Views",
      subtitle: "Experience the best views of the world",
      text: "pretium posuere. Nam eget est felis. Donec luctus lobortis nisl rutrum gravida. Pellentesque varius posuere magna sed sodales. Phasellus",
      imageElements: [element1, element2, element3, element4, element5],
    },
  ],
};
