// src/data/destinationFilterData.ts
import { StaticImageData } from 'next/image';
import image1 from "@/assets/images/destination/destination-1-1.jpg";
import image2 from "@/assets/images/destination/destination-1-2.jpg";
import image3 from "@/assets/images/destination/destination-1-3.jpg";
import image4 from "@/assets/images/destination/destination-1-4.jpg";
import plan from "@/assets/images/shapes/plan.png";
import monjil from "@/assets/images/shapes/monjil.png";

export interface DestinationItem {
    id: number;
    image: string | StaticImageData;  
    title: string;
    link: string;
  }
  
  export interface DestinationFilterData {
    subtitle: string;
    title: string;
    titleSpan: string;
    description: string;
    items: { [key: string]: DestinationItem[] };
    plan: string | StaticImageData;
    monjil: string | StaticImageData;
  }
  
  export const destinationFilterData: DestinationFilterData = {
    subtitle: "Popular Destinations",
    title: "Popular",
    titleSpan: "Destinations",
    description:
      "The island of Crete offers a rare mix of splendid beaches, amazing mountain landscapes, vibrant towns and cosy villages inhabited by warm-hearted locals.",
    items: {
      Europe: [
        { id: 1, image: image1,      title: "Bangkok",
            link: "destination-details", },
        { id: 2, image: image2, title: "Tokyo",
            link: "destination-details", },
        { id:3, image: image3,   title: "Kashmir",
            link: "destination-details", },
        { id: 4, image: image4, title: "Indonesia",
            link: "destination-details", },
       
      ],
      Asia: [
        { id: 1, image: image1,      title: "Bangkok",
            link: "destination-details", },
        { id: 2, image: image2, title: "Tokyo",
            link: "destination-details", },
        { id:3, image: image3,   title: "Kashmir",
            link: "destination-details", },
        { id: 4, image: image4, title: "Indonesia",
            link: "destination-details", },
      ],
      Africa: [
        { id: 1, image: image1,      title: "Bangkok",
            link: "destination-details", },
        { id: 2, image: image2, title: "Tokyo",
            link: "destination-details", },
        { id:3, image: image3,   title: "Kashmir",
            link: "destination-details", },
        { id: 4, image: image4, title: "Indonesia",
            link: "destination-details", },
      ],
      SouthAmerica: [
        { id: 1, image: image1,      title: "Bangkok",
            link: "destination-details", },
        { id: 2, image: image2, title: "Tokyo",
            link: "destination-details", },
        { id:3, image: image3,   title: "Kashmir",
            link: "destination-details", },
        { id: 4, image: image4, title: "Indonesia",
            link: "destination-details", },
      ],
      Australia: [
        { id: 1, image: image1,      title: "Bangkok",
            link: "destination-details", },
        { id: 2, image: image2, title: "Tokyo",
            link: "destination-details", },
        { id:3, image: image3,   title: "Kashmir",
            link: "destination-details", },
        { id: 4, image: image4, title: "Indonesia",
            link: "destination-details", },
      ],
    },
    plan: plan,
    monjil: monjil,
  };
//   export const destinationFilterData: DestinationFilterData = {
//     subtitle: "Popular Destinations", 
//     title: "Popular",
//     titleSpan : "Destinations",
//     description:
//       "The island of Crete offers a rare mix of splendid beaches, amazing mountain landscapes, vibrant towns, and cozy villages inhabited by warm-hearted locals.",
//     plan: plan,
//     monjil: monjil,
//       items: [
//       {
//         id: 1,
//         image: image1,
        
//         title: "Bangkok",
//         link: "destination-details",
//       },
//       {
//         id: 2,
//         image: image2,
        
//         title: "Tokyo",
//         link: "destination-details",
//       },
//       {
//         id: 3,
//         image: image3,
       
//         title: "Kashmir",
//         link: "destination-details",
//       },
//       {
//         id: 4,
//         image: image4,
        
//         title: "Indonesia",
//         link: "destination-details",
//       },
//     ],
//   };
  