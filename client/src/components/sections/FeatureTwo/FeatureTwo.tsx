"use client";

import { useState } from "react";

import Image, { StaticImageData } from "next/image";
import TextAnimation from "@/components/common/AnimatedText/TextAnimation";
import { featurePackageData } from "@/data/featureTwoData";
import VideoModal from "@/components/common/VideoModal/VideoModal";
import { Gallery as PhotoSwipeGallery, Item } from "react-photoswipe-gallery";
import Link from "next/link";
import { TinySliderWrapper as TinySlider } from "@/components/common/TinySliderWrapper";
import { useCurrency } from "@/contexts/CurrencyContext";

interface FeaturePackageItem {
  id: number | string;
  image: StaticImageData | string;
  title: string;
  link: string;
  price: string | number;
  rating: number;
  reviews: number;
  videoId: string;
  discount: string;
  meta: Metadata[];
}
interface Metadata {
  id: number;
  title: string;
  icon: string;
}
interface FeatureTwoProps {
  extraClass?: string;
  id?: string;
  homeThree?: boolean;
  tours?: FeaturePackageItem[];
  itemsPerRow?: number;
  title?: string;
  titleSpan?: string;
  subtitle?: string;
  uniqueId?: string;
  headerStyle?: string;
  showPartners?: boolean;
  partners?: Array<{
    id: number;
    name: string;
    logo: string;
    link: string;
  }>;
  partnersTitle?: string;
  partnersSubtitle?: string;
  showShape?: boolean;
}
const FeatureTwo: React.FC<FeatureTwoProps> = ({
  extraClass,
  id,
  homeThree,
  tours,
  itemsPerRow = 4,
  title,
  titleSpan,
  subtitle,
  showShape = true,
}) => {
  const { formatPrice } = useCurrency();
  const [isOpen, setOpen] = useState(false);
  const [videoId, setVideoId] = useState("");

  // Use custom tours if provided, otherwise use default data
  if (tours) console.log("DEBUG [FeatureTwo]: Received tours count:", tours.length);
  const displayData = tours ? { items: tours } : featurePackageData;

  // Use custom title data if provided
  const displayTitle = title || (homeThree ? featurePackageData.title2 : featurePackageData.title);
  const displayTitleSpan = titleSpan || (homeThree ? featurePackageData.titleSpan2 : featurePackageData.titleSpan);
  const displaySubtitle = subtitle || featurePackageData.subtitle;

  // Create responsive breakpoints based on itemsPerRow
  const getResponsiveSettings = () => {
    const baseSettings: Record<string, { items: number }> = {
      0: { items: 1 },
      576: { items: 2 },
      768: { items: 2 },
      992: { items: 3 },
    };

    // Add larger breakpoints based on itemsPerRow
    if (itemsPerRow >= 3) {
      baseSettings['1199'] = { items: Math.min(3, itemsPerRow) };
    }
    if (itemsPerRow >= 4) {
      baseSettings['1500'] = { items: Math.min(4, itemsPerRow) };
    }

    return baseSettings;
  };

  return (
    <>
      <section
        className={`feature-package feature-package--two ${extraClass ? extraClass : ""
          }`}
        id={id}
      >
        <div className='container'>
          <div className='feature-package__top'>
            <div className='row align-items-end'>
              <div className='col-lg-8'>
                <div className='sec-title'>
                  <h6 className='sec-title__tagline bw-split-in-right'>
                    <TextAnimation
                      text={displaySubtitle}
                      animationType='right'
                    />
                  </h6>
                  <h3 className='sec-title__title bw-split-in-left d-flex gap-2'>
                    <TextAnimation
                      text={displayTitle}
                      animationType='left'
                    />
                    <span>
                      <TextAnimation
                        text={displayTitleSpan}
                        animationType='left'
                      />
                    </span>
                  </h3>
                </div>
              </div>
              <div className='col-lg-4'>
                <div className='feature-package__bottom__nav owl-nav'>
                  <button type="button" role="presentation" className='owl-prev' aria-label='carousel previous'>
                    <span className='icon-arrow-left'></span>
                  </button>
                  <button type="button" role="presentation" className='owl-next' aria-label='carousel next'>
                    <span className='icon-arrow-right'></span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className='container-fluid'>
          <div className='feature-package__inner'>
            <div className='feature-package__carousel gotur-owl__carousel gotur-owl__carousel--custom-nav gotur-owl__carousel--with-shadow owl-carousel owl-theme owl-loaded owl-drag'>
              <PhotoSwipeGallery>
                <TinySlider
                  settings={{
                    items: 1,
                    gutter: 30,
                    loop: false,
                    smartSpeed: 700,
                    nav: false,
                    dots: true,
                    controls: true,
                    mouseDrag: true,
                    controlsContainer: ".owl-nav",
                    responsive: getResponsiveSettings(),
                  }}
                >
                  {displayData.items.map((item: FeaturePackageItem) => (
                    <div className='item' key={item.id}>
                      <div
                        className='listing-card-four wow fadeInUp'
                        data-wow-duration='1500ms'
                      >
                        <div className='listing-card-four__image'>
                          <div className="relative w-full overflow-hidden rounded-3" style={{ height: '220px' }}>
                            {typeof item.image === 'string' ? (
                              <Image
                                src={item.image}
                                alt={item.title}
                                title={item.title}
                                fill
                                className="object-cover transition-transform duration-500 hover:scale-110"
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                              />
                            ) : (
                              <Image 
                                src={item.image} 
                                alt={item.title}
                                title={item.title}
                                fill
                                className="object-cover transition-transform duration-500 hover:scale-110"
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                              />
                            )}
                          </div>
                          <div className='listing-card-four__btn-group'>
                            {item.discount && (
                              <div className='listing-card-four__discount'>
                                -{item.discount}% off
                              </div>
                            )}
                            <div className='listing-card-four__featured'>
                              Featured
                            </div>
                          </div>
                          <div className='listing-card-four__btns'>
                            <Link href='#'>
                              <i className='far fa-heart'></i>
                            </Link>
                            <div className='listing-card-four__btns__hover'>
                              <Item
                                original={typeof item.image === 'string' ? item.image : item.image.src}
                                thumbnail={typeof item.image === 'string' ? item.image : item.image.src}
                                width='370'
                                height='220'
                              >
                                {({ ref, open }) => (
                                  <Link
                                    className='listing-card-four__popup card__popup'
                                    ref={ref}
                                    onClick={(e) => {
                                      e.preventDefault();
                                      open(e);
                                    }}
                                    href='#'
                                  >
                                    <span className='icon-image'></span>
                                  </Link>
                                )}
                              </Item>

                              <Link
                                className='video-popup'
                                href={`https://www.youtube.com/watch?v=${item.videoId}`}
                                onClick={(e) => {
                                  e.preventDefault();
                                  setOpen(true);
                                  setVideoId(item.videoId);
                                }}
                              >
                                <span className='icon-video'></span>
                              </Link>
                            </div>
                          </div>
                          <ul className='listing-card-four__meta list-unstyled'>
                            {item.meta.map((meta: Metadata) => (
                              <li key={meta.id}>
                                <Link href='tour-listing-details-2'>
                                  {" "}
                                  <span className='listing-card-four__meta__icon'>
                                    {" "}
                                    <i className={meta.icon}></i>{" "}
                                  </span>
                                  {meta.title}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className='listing-card-four__content'>
                          <div className='listing-card-four__rating'>
                            <span>({item.reviews} Review)</span>
                            {[...Array(item.rating)].map((_, i) => (
                              <i key={i} className='icon-star'></i>
                            ))}
                          </div>
                          <h3 className='listing-card-four__title'>
                            <Link href={item.link}>{item.title}</Link>
                          </h3>

                          <div className='listing-card-four__content__btn'>
                            <div className='listing-card-four__price'>
                              <span className='listing-card-four__price__sub'>
                                Start from
                              </span>
                              <span className='listing-card-four__price__number'>
                                {formatPrice(typeof item.price === 'string' ? parseFloat(item.price) : item.price)}
                              </span>
                            </div>
                            <Link
                              href={item.link}
                              className='listing-card-four__btn gotur-btn'
                            >
                              Book Now{" "}
                              <span className='icon'>
                                <i className='icon-right'></i>{" "}
                              </span>
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </TinySlider>
              </PhotoSwipeGallery>
            </div>
          </div>
        </div>

        {/* Element Shapes */}
        {showShape && !homeThree && (
          <div className='feature-package__element'>
            <Image src={featurePackageData.shape} alt='Element Shape' />
          </div>
        )}
      </section>
      <VideoModal isOpen={isOpen} setOpen={setOpen} id={videoId} />
    </>
  );
};

export default FeatureTwo;
