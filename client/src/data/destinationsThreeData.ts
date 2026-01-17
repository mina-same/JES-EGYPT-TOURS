import desti1 from "@/assets/images/gallery/desti-d-1.jpg";
import desti2 from "@/assets/images/gallery/desti-d-2.jpg";
import desti3 from "@/assets/images/gallery/desti-d-3.jpg";
import desti4 from "@/assets/images/gallery/desti-d-4.jpg";
import thumb1 from "@/assets/images/gallery/desti-s-1.jpg";
import thumb2 from "@/assets/images/gallery/desti-s-2.jpg";
import thumb3 from "@/assets/images/gallery/desti-s-3.jpg";
import thumb4 from "@/assets/images/gallery/desti-s-4.jpg";
import buttonBg from "@/assets/images/backgrounds/button-bg.png";
import element from "@/assets/images/shapes/element-1-1.png";
import shape from "@/assets/images/shapes/love.png";

export const destinationsThreeData = {
  tagline: "Perfect Destination",
  title: "Trending",
  titleSpan: "Destinations",
  buttonBg: buttonBg,
  shape: shape,
  element: element,
  destinations: [
    {
      id: "itemOne",
      name: "Matera, Italy",
      tours: 5,
      hotels: 1,
      images: [desti1, desti2, desti3, desti4],

      thumbnails: [thumb1, thumb2, thumb3, thumb4],
    },
    {
      id: "itemTwo",
      name: "Ronda, Spain",
      tours: 7,
      hotels: 2,
      images: [desti1, desti2, desti3, desti4],
      thumbnails: [thumb1, thumb2, thumb3, thumb4],
    },
    {
      id: "itemThree",
      name: "Sintra, Portugal",
      tours: 5,
      hotels: 1,
      images: [desti1, desti2, desti3, desti4],

      thumbnails: [thumb1, thumb2, thumb3, thumb4],
    },
    {
      id: "itemFour",
      name: "Cesky Krumlov",
      tours: 5,
      hotels: 1,
      images: [desti1, desti2, desti3, desti4],

      thumbnails: [thumb1, thumb2, thumb3, thumb4],
    },
  ],
};
