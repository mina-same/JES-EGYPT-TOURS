import corkiImage from "@/assets/images/shapes/corki.png";
import listImage from "@/assets/images/shapes/list-4-1.png";
import itemImage1 from "@/assets/images/resources/item-1-1.jpg";
import itemImage2 from "@/assets/images/resources/item-1-2.jpg";
import itemImage3 from "@/assets/images/resources/item-1-3.jpg";
import itemImage4 from "@/assets/images/resources/item-1-4.jpg";
import itemImage5 from "@/assets/images/resources/item-1-5.jpg";
import itemImage6 from "@/assets/images/resources/item-1-6.jpg";

export const tourListingPageData = {
  sectionTitle: "New Listings in Our Tour",
  sectionTagline: "Popular Tours List",
  filterOptions: {
    locations: [
      "Locations",
      "Spain",
      "Canada",
      "Africa",
      "Europe",
      "Thailand",
      "Dubai",
      "Australia",
      "Switzerland",
    ],
    hotelTypes: [
      "Hotel Type",
      "Bedrooms 1",
      "Bedrooms 2",
      "Bedrooms 3",
      "Bedrooms 4",
      "Bedrooms 5",
    ],
    tourBudgets: [
      "Tour Budget",
      "$300",
      "$500",
      "$1000",
      "$1500",
      "$2000",
      "$3000",
    ],
    activities: ["Activates Type", "2", "3", "4", "6", "7", "9"],
    hotelTypes2: [
      "Hotel Type",
      "Bedrooms 1",
      "Bedrooms 2",
      "Bedrooms 3",
      "Bedrooms 4",
      "Bedrooms 5",
    ],
    reviews: ["Reviews", "Spain", "Canada"],
    prices: [
      "Filter Price",
      "$300",
      "$500",
      "$1000",
      "$1500",
      "$2000",
      "$3000",
    ],
  },
  tours: [
    {
      image: itemImage1,
      title: "All Inclusive Ultimate Circle Island Day with Lunch",
      location: "Europe",
      duration: "6 Days, 3 Night",
      price: "$59.00",
      discount: "-30% Off",
      videoId: "0MuL8fd3pb8",
    },
    {
      image: itemImage2,
      title: "All Inclusive Ultimate Circle Island Day with Lunch",
      location: "Europe",
      duration: "6 Days, 3 Night",
      price: "$39.00",
      discount: "-30% Off",
      videoId: "0MuL8fd3pb8",
      featured: true,
    },
    {
      image: itemImage3,
      title: "All Inclusive Ultimate Circle Island Day with Lunch",
      location: "Europe",
      duration: "6 Days, 3 Night",
      price: "$49.00",
      discount: "-30% Off",
      videoId: "0MuL8fd3pb8",
    },
    {
      image: itemImage4,
      title: "All Inclusive Ultimate Circle Island Day with Lunch",
      location: "Europe",
      duration: "6 Days, 3 Night",
      price: "$29.00",
      discount: "-30% Off",
      videoId: "0MuL8fd3pb8",
      featured: true,
    },
    {
      image: itemImage5,
      title: "All Inclusive Ultimate Circle Island Day with Lunch",
      location: "Europe",
      duration: "6 Days, 3 Night",
      price: "$69.00",
      videoId: "0MuL8fd3pb8",
      featured: true,
    },
    {
      image: itemImage6,
      title: "All Inclusive Ultimate Circle Island Day with Lunch",
      location: "Europe",
      duration: "6 Days, 3 Night",
      price: "$59.00",
      discount: "-30% Off",
      videoId: "0MuL8fd3pb8",
    },
  ],
  images: {
    corkiImage,
    listImage,
  },
};
