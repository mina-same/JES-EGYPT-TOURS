import heroImage1 from "@/assets/images/main-slider/hero-1-1-image.jpg";
import heroImage2 from "@/assets/images/main-slider/hero-1-2-image.jpg";
import heroImage3 from "@/assets/images/main-slider/hero-1-3-image.jpg";
import hoverImage1 from "@/assets/images/shapes/hero-1-1-hover.png";
import hoverImage2 from "@/assets/images/shapes/hero-shapr-1-2-2.png";
import hoverImage3 from "@/assets/images/shapes/hero-shapr-1-3.png";
import hoverImage4 from "@/assets/images/shapes/hero-shapr-1-2-1.png";
import hoverImage5 from "@/assets/images/shapes/hero-shapr-1-2-a.png";
import hoverImage6 from "@/assets/images/shapes/hero-1-2-hover.png";

export const mainSliderOneData = {
  title: "Next Step \n Destination",
    subtitle: "Discover Your",
  description:
    "Lorem ipsum dolor sit amet consectetur adipiscing elit. Mauris nullam the Lorem ipsum dolor sit amet consectetur adipiscing elit.",
  destinations: [
    { id: 1, image: heroImage1 },
    { id: 2, image: heroImage2 },
    { id: 3, image: heroImage3 },
    { id: 4, image: heroImage1 },
    { id: 5, image: heroImage2 },
    { id: 6, image: heroImage3 },
  ],
  hoverImage : hoverImage1,
  formFields: [
    {
      id: 1,
      name: "location",
      label: "Location",
      icon: "location",
      type: "select",
      options: [
        { id: 1, value: "select", label: "Australia" },
        { id: 2, value: "spain", label: "Spain" },
        { id: 3, value: "africa", label: "Africa" },
        { id: 4, value: "europe", label: "Europe" },
      ],
    },
    {
      id: 2,
      name: "type",
      label: "Activities Type",
      icon: "travle",
      type: "select",
      options: [
        { id: 1, value: "select", label: "Adventure" },
        { id: 2, value: "spanis", label: "Booking Type" },
        { id: 3, value: "africa", label: "Beach" },
        { id: 4, value: "europe", label: "Discovery" },
      ],
    },
    {
      id: 3,
      name: "date",
      label: "Activate Day",
      icon: "clock",
      type: "text",
      placeholder: "Feb 5 - 5",
    },
    {
      id: 4,
      name: "guests",
      label: "Traveler",
      icon: "group",
      type: "number",
      value: 2,
    },
  ],
  images: [{
    id: 1, class:"", image: hoverImage6
  },
  {
    id: 2, class:"-one", image: hoverImage2
  },
  {
    id: 3, class:"-two", image: hoverImage3
  },
  {
    id: 4, class:"-three", image: hoverImage4
  },
  // {
  //   id: 5, class:"-four", image: ""
  // },
  {
    id: 6, class:"-five", image: hoverImage5
  },
    
  ],
};
