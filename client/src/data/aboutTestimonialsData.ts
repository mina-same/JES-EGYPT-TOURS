import testiImage1 from "@/assets/images/resources/testi-1-1.png";
import aboutAuthorImage from "@/assets/images/resources/about-author-1-1.jpg";
import shapeImage1 from "@/assets/images/shapes/testi-1-3.png";
import shapeImage2 from "@/assets/images/resources/testi-1-2.png";

import brand1 from "@/assets/images/brand/brand-1-1.png";
import brandHover1 from "@/assets/images/brand/brand-hover-1-1.png";



export const aboutTestimonialsData= {
    sectionTitle: "Latest Client Feedback",
    sectionTagline: "testimonial",
    testiThumb: testiImage1,
    testimonials: [
        {
            image: aboutAuthorImage,
            text: "Sed ante elit, fringilla vitae laoreet sit amet, tempus et libero. Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
            authorName: "Ronald Richards",
            position: "Co, Founder"
        },
        {
            image: aboutAuthorImage,
            text: "Sed ante elit, fringilla vitae laoreet sit amet, tempus et libero. Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
            authorName: "Ronald Richards",
            position: "Co, Founder"
        },
        {
            image: aboutAuthorImage,
            text: "Sed ante elit, fringilla vitae laoreet sit amet, tempus et libero. Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
            authorName: "Ronald Richards",
            position: "Co, Founder"
        }
    ],
    shapeImages: [shapeImage1, shapeImage2],
    brands: [
        { image: brand1, hoverImage: brandHover1 },
        { image: brand1, hoverImage: brandHover1 },
        { image: brand1, hoverImage: brandHover1 },
        { image: brand1, hoverImage: brandHover1 },
        { image: brand1, hoverImage: brandHover1 },
        { image: brand1, hoverImage: brandHover1 }
    ]
};
