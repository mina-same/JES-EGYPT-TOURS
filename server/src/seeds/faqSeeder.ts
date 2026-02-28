import Faq, { IFaq } from '../models/Faq';
import connectDB from '../config/database';

const faqData: Partial<IFaq>[] = [
  // General FAQs - SEO Optimized
  {
    question: "What is JES Egypt Tours and why choose us for your Egypt travel adventure?",
    answer: "JES Egypt Tours is a premium travel agency specializing in authentic Egyptian experiences with over 15 years of excellence. We offer expertly guided tours, customized vacation packages, and unforgettable travel experiences throughout Egypt including Cairo, Luxor, Aswan, and Red Sea resorts. Our certified Egyptologist guides, flexible itineraries, and commitment to authentic cultural experiences make us the preferred choice for travelers seeking genuine Egypt adventures.",
    category: "General",
    isActive: true,
    displayOnHome: true,
    order: 1
  },
  {
    question: "How long has JES Egypt Tours been providing exceptional Egypt travel experiences?",
    answer: "JES Egypt Tours has been proudly serving travelers from around the world for over 15 years, establishing ourselves as Egypt's leading tour operator. Our extensive experience, deep local knowledge, and thousands of satisfied customers demonstrate our commitment to delivering exceptional Egypt travel experiences that combine comfort, authenticity, and adventure.",
    category: "General",
    isActive: true,
    displayOnHome: true,
    order: 2
  },
  {
    question: "What makes JES Egypt Tours different from other Egypt tour operators and travel agencies?",
    answer: "JES Egypt Tours stands out through our personalized service, expert Egyptologist guides, flexible itineraries, and transparent pricing. Unlike mass-market operators, we provide authentic cultural experiences, small group sizes, and customized attention to detail. Our deep knowledge of Egyptian history, culture, and hidden gems ensures you experience the real Egypt, not just tourist attractions.",
    category: "General",
    isActive: true,
    displayOnHome: false,
    order: 3
  },
  {
    question: "Are JES Egypt Tours licensed and insured for travel in Egypt?",
    answer: "Yes, JES Egypt Tours is fully licensed by the Egyptian Ministry of Tourism and carries comprehensive travel insurance. We are members of the Egyptian Travel Agents Association (ETAA) and maintain all required certifications for operating tours in Egypt. Your safety and security are our top priorities with fully insured vehicles, licensed guides, and 24/7 emergency support.",
    category: "General",
    isActive: true,
    displayOnHome: false,
    order: 4
  },

  // Booking FAQs - SEO Optimized
  {
    question: "How do I book my dream Egypt tour with JES Egypt Tours online?",
    answer: "Booking your Egypt tour is simple and secure: 1) Browse our tour packages or request a custom itinerary, 2) Select your preferred travel dates and group size, 3) Complete our secure online booking form with your details, 4) Pay the 30% deposit via credit card, PayPal, or bank transfer, 5) Receive instant confirmation and detailed travel preparation guide. Our customer service team is available 24/7 to assist with your booking.",
    category: "Booking",
    isActive: true,
    displayOnHome: true,
    order: 1
  },
  {
    question: "What payment methods and currencies does JES Egypt Tours accept for tour bookings?",
    answer: "JES Egypt Tours accepts all major credit cards (Visa, MasterCard, American Express), PayPal, wire transfers, and Western Union. We process payments in USD, EUR, GBP, and EGP. A 30% deposit secures your booking, with the remaining balance due 30 days before departure. All transactions are secured with SSL encryption and we offer flexible payment plans for tours over $2000.",
    category: "Booking",
    isActive: true,
    displayOnHome: true,
    order: 2
  },
  {
    question: "What is the cancellation policy for Egypt tours booked with JES Egypt Tours?",
    answer: "Our flexible cancellation policy allows free cancellation up to 30 days before departure for a full refund minus a $50 administrative fee. Cancellations 15-29 days before departure receive a 50% refund, while cancellations within 14 days are non-refundable. We highly recommend travel insurance to protect your investment. Custom cancellation terms may apply to peak season tours and group bookings.",
    category: "Booking",
    isActive: true,
    displayOnHome: false,
    order: 3
  },
  {
    question: "How far in advance should I book my Egypt tour to get the best prices and availability?",
    answer: "For optimal pricing and availability, we recommend booking your Egypt tour 3-6 months in advance, especially for peak season (October-April) and holiday periods. Early booking discounts of up to 10% are available for reservations made 6+ months ahead. Last-minute bookings (within 30 days) are possible but may have limited availability and higher prices.",
    category: "Booking",
    isActive: true,
    displayOnHome: false,
    order: 4
  },
  {
    question: "Do I need travel insurance for my Egypt tour with JES Egypt Tours?",
    answer: "While travel insurance is not mandatory, we strongly recommend comprehensive coverage for all Egypt tours. Your policy should include trip cancellation, medical emergencies, emergency evacuation, lost luggage, and travel delays. JES Egypt Tours can provide recommended insurance providers and ensures all tours include basic emergency assistance coverage.",
    category: "Booking",
    isActive: true,
    displayOnHome: false,
    order: 5
  },

  // Tour FAQs - SEO Optimized
  {
    question: "What types of Egypt tours and vacation packages does JES Egypt Tours offer?",
    answer: "JES Egypt Tours offers diverse Egypt travel experiences including classic Nile cruises, pyramid tours, desert safaris, Red Sea diving packages, cultural immersion tours, religious pilgrimages, and completely customized private tours. Our packages range from 3-day Cairo highlights to 21-day comprehensive Egypt adventures, all featuring expert guides, quality accommodations, and authentic experiences.",
    category: "Tours",
    isActive: true,
    displayOnHome: true,
    order: 1
  },
  {
    question: "Are JES Egypt Tours suitable for families with children and elderly travelers?",
    answer: "Absolutely! Many of our Egypt tours are family-friendly with special activities for children and comfortable pacing for elderly travelers. We offer family packages with interconnected rooms, kid-friendly guides, and educational activities. Our vehicles are wheelchair accessible, and we can customize itineraries to accommodate mobility needs and energy levels.",
    category: "Tours",
    isActive: true,
    displayOnHome: false,
    order: 2
  },
  {
    question: "What is included in JES Egypt Tours package prices and what additional costs should I expect?",
    answer: "Our tour prices typically include: quality accommodation, daily breakfast, transportation in modern A/C vehicles, expert Egyptologist guides, entrance fees to specified attractions, and bottled water. Exclusions usually are: international flights, visas, travel insurance, personal expenses, optional activities, and some meals. Detailed inclusions/exclusions are provided in each tour itinerary.",
    category: "Tours",
    isActive: true,
    displayOnHome: false,
    order: 3
  },
  {
    question: "Can JES Egypt Tours create completely customized itineraries for my Egypt travel preferences?",
    answer: "Yes! We specialize in creating personalized Egypt tours tailored to your interests, schedule, and budget. Whether you want to focus on archaeology, photography, adventure, religious sites, or relaxation, our expert team will design your perfect Egypt experience. Custom tours can include special access, unique accommodations, and exclusive experiences not available in standard packages.",
    category: "Tours",
    isActive: true,
    displayOnHome: false,
    order: 4
  },
  {
    question: "What is the best time of year to visit Egypt and travel with JES Egypt Tours?",
    answer: "The best time to visit Egypt is during the cooler months from October to April when temperatures are pleasant for sightseeing (20-30°C). Peak season is December-February with comfortable weather but higher prices and more crowds. May-September is hot but offers lower prices and fewer tourists. We offer year-round tours with adjusted schedules for summer months to ensure comfort.",
    category: "Tours",
    isActive: true,
    displayOnHome: false,
    order: 5
  },

  // Payment FAQs - SEO Optimized
  {
    question: "How secure are online payments when booking Egypt tours with JES Egypt Tours?",
    answer: "JES Egypt Tours uses industry-standard SSL encryption and secure payment gateways to protect your personal and financial information. We are PCI DSS compliant and never store credit card details on our servers. All transactions are processed through reputable payment providers with fraud protection and buyer security guarantees.",
    category: "Payment",
    isActive: true,
    displayOnHome: false,
    order: 1
  },
  {
    question: "Does JES Egypt Tours offer flexible payment plans or installment options for Egypt tours?",
    answer: "Yes, for tours over $2000, we offer flexible payment plans with 0% interest. Typical plans include: 50% deposit, 25% at 60 days, 25% at 30 days before departure. We can also customize payment schedules to match your budget. Contact our team to discuss payment plan options for your preferred Egypt tour.",
    category: "Payment",
    isActive: true,
    displayOnHome: false,
    order: 2
  },
  {
    question: "Are there any hidden fees or charges I should know about when booking with JES Egypt Tours?",
    answer: "No, JES Egypt Tours believes in complete transparency with no hidden fees. All costs are clearly outlined in your tour quotation and booking confirmation. Optional activities, personal expenses, and tips are clearly marked as such. We provide detailed cost breakdowns so you know exactly what's included in your Egypt tour price.",
    category: "Payment",
    isActive: true,
    displayOnHome: false,
    order: 3
  },

  // Safety FAQs - SEO Optimized
  {
    question: "Is it safe to travel to Egypt with JES Egypt Tours in 2024?",
    answer: "Yes, Egypt is generally very safe for tourists, especially when traveling with experienced operators like JES Egypt Tours. We prioritize your safety with: expert local guides, secure transportation, carefully selected accommodations, 24/7 emergency support, and comprehensive safety protocols. Popular tourist areas have enhanced security, and millions of tourists visit safely each year.",
    category: "Safety",
    isActive: true,
    displayOnHome: true,
    order: 1
  },
  {
    question: "What health precautions and vaccinations should I take before traveling to Egypt?",
    answer: "Consult your doctor 6-8 weeks before travel for personalized advice. Generally recommended: Hepatitis A & B, Typhoid, and routine vaccinations. Consider malaria medication for certain areas. Pack prescription medications, basic first aid, insect repellent, and stay hydrated. Our tours include access to quality medical facilities, and all guides are trained in emergency procedures.",
    category: "Safety",
    isActive: true,
    displayOnHome: false,
    order: 2
  },
  {
    question: "What should I pack for my Egypt tour with JES Egypt Tours?",
    answer: "Pack lightweight, modest clothing (shoulders and knees covered for religious sites), comfortable walking shoes, sun hat, sunscreen, sunglasses, insect repellent, and any personal medications. Bring layers for cool evenings, modest swimwear, and a small backpack for daily tours. Don't forget: camera, power bank, adapter (Type C/F), and cash for small purchases.",
    category: "Safety",
    isActive: true,
    displayOnHome: false,
    order: 3
  },
  {
    question: "Do I need a visa to visit Egypt, and can JES Egypt Tours help with the visa process?",
    answer: "Most nationalities require a visa to enter Egypt. Many tourists can obtain an e-visa online (https://visa2egypt.gov.eg) or visa on arrival at major airports for $25 USD. The process typically takes 5-10 minutes. JES Egypt Tours provides detailed visa instructions and can assist with required documentation. Check requirements for your specific nationality before booking.",
    category: "Safety",
    isActive: true,
    displayOnHome: false,
    order: 4
  },
  {
    question: "What cultural etiquette and customs should I be aware of when traveling in Egypt?",
    answer: "Egypt is conservative but very welcoming. Dress modestly, especially when visiting religious sites. Remove shoes before entering mosques. Ask permission before photographing people. Use right hand for eating and greeting. During Ramadan, avoid eating in public during daylight hours. Egyptians are hospitable - a smile and 'shukran' (thank you) go a long way!",
    category: "Safety",
    isActive: true,
    displayOnHome: false,
    order: 5
  },

  // Accommodation FAQs - SEO Optimized
  {
    question: "What types of accommodation does JES Egypt Tours provide during Egypt tours?",
    answer: "JES Egypt Tours offers a range of carefully selected accommodations from 5-star luxury hotels to authentic boutique properties and traditional Nile cruise ships. All accommodations meet international standards for safety, cleanliness, and comfort. We choose properties with excellent locations, local character, and outstanding service to enhance your Egypt experience.",
    category: "Accommodation",
    isActive: true,
    displayOnHome: false,
    order: 1
  },
  {
    question: "Can JES Egypt Tours accommodate special dietary requirements and room preferences?",
    answer: "Absolutely! We can accommodate vegetarian, vegan, halal, kosher, gluten-free, and other dietary restrictions with advance notice. Room preferences include king/queen beds, smoking/non-smoking, lower floors, and accessibility features. Please inform us of special requirements at booking so we can make appropriate arrangements with our hotel partners.",
    category: "Accommodation",
    isActive: true,
    displayOnHome: false,
    order: 2
  },
  {
    question: "What are Nile cruise ships like with JES Egypt Tours, and which cruise is best for me?",
    answer: "Our Nile cruise ships are floating hotels offering 3-5 star comfort with amenities like swimming pools, restaurants, bars, and sun decks. Cabins feature panoramic windows, en-suite bathrooms, and air conditioning. Choose 3-night cruises (Luxor to Aswan) or 4-night cruises (Aswan to Luxor) based on your schedule. We offer standard, deluxe, and luxury categories to match your budget and preferences.",
    category: "Accommodation",
    isActive: true,
    displayOnHome: false,
    order: 3
  }
];

const seedFAQs = async (): Promise<void> => {
  try {
    await connectDB();

    // Clear existing FAQs
    await Faq.deleteMany({});
    console.log('🗑️  Cleared existing FAQs');

    // Insert new FAQs
    const insertedFAQs = await Faq.insertMany(faqData);
    console.log(`✅ Successfully seeded ${insertedFAQs.length} FAQs`);

    // Display seeded categories
    const categories = [...new Set(faqData.map(faq => faq.category))];
    console.log(`📂 Categories seeded: ${categories.join(', ')}`);

    // Display home page FAQs count
    const homeFAQs = faqData.filter(faq => faq.displayOnHome).length;
    console.log(`🏠 Home page FAQs: ${homeFAQs}`);

  } catch (error) {
    console.error('❌ Error seeding FAQs:', error);
    throw error;
  }
};

// Run the seeder if this file is executed directly
if (require.main === module) {
  seedFAQs()
    .then(() => {
      console.log('🎉 FAQ seeding completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 FAQ seeding failed:', error);
      process.exit(1);
    });
}

export default seedFAQs;
