import sliderImage1 from "@/assets/images/backgrounds/destination-slider-1-1.jpg";
import sliderImage2 from "@/assets/images/backgrounds/destination-slider-1-2.jpg";
import sliderImage3 from "@/assets/images/backgrounds/destination-slider-1-3.jpg";
import sliderImage4 from "@/assets/images/backgrounds/destination-slider-1-4.jpg";
import slider2Image1 from "@/assets/images/gallery/listing-list-g-1-1.jpg";
import slider2Image2 from "@/assets/images/gallery/listing-list-g-1-2.jpg";
import slider2Image3 from "@/assets/images/gallery/listing-list-g-1-3.jpg";
import slider2Image4 from "@/assets/images/gallery/listing-list-g-1-4.jpg";
import slider2Image5 from "@/assets/images/gallery/listing-list-g-1-5.jpg";
import img1 from "@/assets/images/resources/tour-listing-details-1-1.jpg";
import img2 from "@/assets/images/resources/tour-listing-details-1-2.jpg";
import tour1 from "@/assets/images/blog/listing-list-4-1.jpg";
import tour2 from "@/assets/images/blog/listing-list-4-2.jpg";
import commentImg1 from "@/assets/images/blog/blog-comment-1-1.png";

const tourDetailsOneData = {
  title: "The Montcalm At Brewery Japan City",
  reviews: 17,
  location: "Japan",
  activitiesType: "Adventure",
  traveler: 1,
  activateDay: "Feb 5 - 5",
  price: 150,
  overviewTitle: "Overview",
  titleTwo: "Highlight List",
  overview:
    "Consectetur adipisicing elit sed do eiusmod tempor is incididunt ut labore et dolore of magna aliqua. ut enim ad minim veniam made of owl the quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea dolor commodo consequat duis aute irure and dolor in reprehenderit.Nullam semper quam mauris nec mollis felis aliquam eu ut non gravida mi phasellus.",
  topDestinations:
    "Nullam semper quam mauris, nec mollis felis aliquam eu. Ut non gravida mi. Phasellus sagittis mauris sit amet augue imperdiet pretium. Ut neque ex, hendrerit nec faucibus a, convallis a ipsum. Vestibulum nunc erat, venenatis et arcu eget, placerat imperdiet mauris.",
  sliderImages: [sliderImage1, sliderImage2, sliderImage3, sliderImage4],
  slider2Images: [
    slider2Image1,
    slider2Image2,
    slider2Image3,
    slider2Image4,
    slider2Image5,
  ],
  images: [img1, img2],
  highlightList: [
    "Duis ultricies sapien a volutpat varius.",
    "Duis ultricies sapien a volutpat varius.",
    "Nunc in quam in quam placerat rhoncus quis",
    "Laoreet sagittis posuere, dolor nibh imperdiet",
    "Condimentum lacinia nisl vitae vehicula.",
    "Duis ultricies sapien a volutpat varius.",
    "Nunc in quam in quam placerat rhoncus quis",
    "Condimentum lacinia nisl vitae vehicula.",
  ],
  amenities: [
    "Cruise Dinner & Music Event",
    "Pick and Drop Services",
    "Additional Services",
    "Specialized bilingual guide",
    "Food and Drinks",
  ],
  amenitiesTwo: [
    "Cruise Dinner & Music Event",
    "Pick and Drop Services",
    "Additional Services",
    "Specialized bilingual guide",
    "Food and Drinks",
  ],
  comments: [
    {
      name: "Leslie Alexander",
      date: "February 10, 2024 at 2:37 pm",
      text: "Neque porro est qui dolorem ipsum quia quaed inventor veritatis et quasi architecto var sed efficitur turpis gilla sed sit amet finibus eros. Lorem Ipsum is simply dummy",
      avatar: commentImg1,
      rating: 4,
    },
  ],
  relatedTours: [
    {
      id: 1,
      image: tour1,
      title: "All Inclusive Ultimate Circle Island Day with Lunch",
      link: "tour-listing-details-2",
      price: "$59.00",
      rating: 5,
      reviews: 10,
      videoId: "0MuL8fd3pb8",
      discount: "",
      meta: [
        {
          id: 1,
          icon: "icon-pin1",
          title: "Slingerland",
        },
        {
          id: 2,
          icon: "icon-calendar",
          title: "6 Days, 3 Night",
        },
      ],
    },
    {
      id: 2,
      image: tour2,
      title: "Molokini and Turtle Town Snorkeling Adventure Aboard",
      link: "tour-listing-details-2",
      price: "$69.00",
      rating: 4,
      reviews: 8,
      videoId: "GTn2EKD-cfg",
      discount: "40",
      meta: [
        {
          id: 1,
          icon: "icon-pin1",
          title: "Slingerland",
        },
        {
          id: 2,
          icon: "icon-calendar",
          title: "6 Days, 3 Night",
        },
      ],
    },
  ],
  faqs: [
    {
      question: "How long should a business plan be?",
      answer:
        "Nulla facilisi. Vestibulum tristique sem in eros eleifend imperdiet. Donec quis convallis neque. In id lacus pulvinar lacus, eget vulputate lectus. Ut viverra bibendum lorem, at tempus nibh mattis in. Sed a massa eget lacus consequat auctor.",
    },
    {
      question: "What is included in your services?",
      answer:
        "Nulla facilisi. Vestibulum tristique sem in eros eleifend imperdiet. Donec quis convallis neque. In id lacus pulvinar lacus, eget vulputate lectus. Ut viverra bibendum lorem, at tempus nibh mattis in. Sed a massa eget lacus consequat auctor.",
    },
    {
      question: "What type of company is measured?",
      answer:
        "Nulla facilisi. Vestibulum tristique sem in eros eleifend imperdiet. Donec quis convallis neque. In id lacus pulvinar lacus, eget vulputate lectus. Ut viverra bibendum lorem, at tempus nibh mattis in. Sed a massa eget lacus consequat auctor.",
    },
    {
      question: "What type of company is measured?",
      answer:
        "Nulla facilisi. Vestibulum tristique sem in eros eleifend imperdiet. Donec quis convallis neque. In id lacus pulvinar lacus, eget vulputate lectus. Ut viverra bibendum lorem, at tempus nibh mattis in. Sed a massa eget lacus consequat auctor.",
    },
  ],
};

export const mapEmbedUrl =
  "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d4562.753041141002!2d-118.80123790098536!3d34.152323469614075!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x80e82469c2162619%3A0xba03efb7998eef6d!2sCostco+Wholesale!5e0!3m2!1sbn!2sbd!4v1562518641290!5m2!1sbn!2sbd";

export default tourDetailsOneData;
