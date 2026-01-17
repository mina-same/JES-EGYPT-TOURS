// Import images
import galleryImage1 from "@/assets/images/gallery/gallery-1-1.jpg";
import galleryImage2 from "@/assets/images/gallery/gallery-1-2.jpg";
import galleryImage3 from "@/assets/images/gallery/gallery-1-3.jpg";
import galleryImage4 from "@/assets/images/gallery/gallery-1-4.jpg";
import galleryImage5 from "@/assets/images/gallery/gallery-1-5.jpg";
import galleryImage6 from "@/assets/images/gallery/gallery-1-6.jpg";
import galleryImage7 from "@/assets/images/gallery/gallery-1-7.jpg";
import galleryImage8 from "@/assets/images/gallery/gallery-1-8.jpg";

export const filterCategories = [
  { name: "All", filter: "filter-item" },
  { name: "Room", filter: "room" },
  { name: "Restaurant", filter: "restaurant" },
  { name: "Hotel", filter: "hotel" },
];

export const galleryFilterData = [
  {
    id: 1,
    src: galleryImage1,
    filterCategory: ["restaurant"],
    col: 6,
    lg: 3,
    width: 370,
    height: 370,
  },
  {
    id: 2,
    src: galleryImage2,
    filterCategory: ["room"],
    col: 6,
    lg: 3,
    width: 370,
    height: 480,
  },
  {
    id: 3,
    src: galleryImage3,
    filterCategory: ["restaurant"],
    col: 6,
    lg: 3,
    width: 370,
    height: 370,
  },
  {
    id: 4,
    src: galleryImage4,
    filterCategory: ["room"],
    col: 6,
    lg: 3,
    width: 370,
    height: 239,
  },

  {
    id: 5,
    src: galleryImage6,
    filterCategory: ["hotel"],
    col: 6,
    lg: 3,
    width: 370,
    height: 239,
  },
  {
    id: 6,
    src: galleryImage5,
    filterCategory: ["restaurant"],
    col: 6,
    lg: 3,
    width: 370,
    height: 529,
  },
  {
    id: 7,
    src: galleryImage7,
    filterCategory: ["restaurant"],
    col: 6,
    lg: 3,
    width: 370,
    height: 370,
  },

  {
    id: 8,
    src: galleryImage8,
    filterCategory: ["room", "hotel"],
    col: 6,
    lg: 3,
    width: 370,
    height: 370,
  },
];
