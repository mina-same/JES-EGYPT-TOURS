"use client";

import { useRef, useState } from "react";

import Image, { StaticImageData } from "next/image";
import TextAnimation from "@/components/common/AnimatedText/TextAnimation";
import { featurePackageData } from "@/data/featureTwoData";
import VideoModal from "@/components/common/VideoModal/VideoModal";
import {
  TinySliderWrapper as TinySlider,
  type TinySliderHandle,
} from "@/components/common/TinySliderWrapper";
import TourCard from "@/components/common/TourCard/TourCard";
import { useWishlist } from "@/contexts/WishlistContext";

interface FeaturePackageItem {
  id: number | string;
  image: StaticImageData | string;
  images?: string[];
  title: string;
  link: string;
  price: string | number;
  videoId: string;
  /** Every review video on the tour. The button opens all of them, the same
   *  as the cards on the listing pages do. */
  videoIds?: string[];
  discount: string;
  /** Short summary shown under the title (HTML is stripped by the card). */
  description?: string;
  meta: Metadata[];
}

/* The card markup, gallery lightbox and pricing row now live in TourCard so a
   design change applies to every tour card on the site at once. */
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
  rewind?: boolean;
  title?: string;
  titleSpan?: string;
  subtitle?: string;
  showShape?: boolean;
}
const FeatureTwo: React.FC<FeatureTwoProps> = ({
  extraClass,
  id,
  homeThree,
  tours,
  itemsPerRow = 4,
  rewind = false,
  title,
  titleSpan,
  subtitle,
  showShape = true,
}) => {
  const [isOpen, setOpen] = useState(false);
  const [videoIds, setVideoIds] = useState<string[]>([]);
  const sliderRef = useRef<TinySliderHandle>(null);
  // Without these the card's heart renders but does nothing, and never fills
  // in for tours that are already saved.
  const { toggleWishlist, isInWishlist } = useWishlist();

  // Use custom tours if provided, otherwise use default data
  const displayData = tours ? { items: tours } : featurePackageData;

  // Use custom title data if provided
  const displayTitle = title || (homeThree ? featurePackageData.title2 : featurePackageData.title);
  // An explicitly empty span lets callers use an already-complete localized
  // title (for example "Related Tours") without appending the default span.
  const displayTitleSpan = titleSpan ?? (homeThree ? featurePackageData.titleSpan2 : featurePackageData.titleSpan);
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
                  <p className='sec-title__tagline bw-split-in-right'>
                    <TextAnimation
                      text={displaySubtitle}
                      animationType='right'
                      semantic
                    />
                  </p>
                  <h2 className='sec-title__title bw-split-in-left'>
                    <TextAnimation
                      text={displayTitle}
                      animationType='left'
                      semantic
                    />
                    {displayTitleSpan && (
                      <>
                        {" "}
                        <span>
                          <TextAnimation
                            text={displayTitleSpan}
                            animationType='left'
                            semantic
                          />
                        </span>
                      </>
                    )}
                  </h2>
                </div>
              </div>
              <div className='col-lg-4'>
                <div className='feature-package__bottom__nav owl-nav'>
                  <button
                    type="button"
                    className='owl-prev'
                    aria-label='carousel previous'
                    onClick={() => sliderRef.current?.slider?.goTo("prev")}
                  >
                    <span className='icon-arrow-left'></span>
                  </button>
                  <button
                    type="button"
                    className='owl-next'
                    aria-label='carousel next'
                    onClick={() => sliderRef.current?.slider?.goTo("next")}
                  >
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
                <TinySlider
                  ref={sliderRef}
                  settings={{
                    items: 1,
                    gutter: 30,
                    // `rewind` wraps back to the start at the end WITHOUT
                    // cloning slides (tiny-slider's `loop` clones, which shows
                    // a duplicate card when there are few tours). loop must be
                    // false for rewind to take effect.
                    loop: false,
                    rewind: rewind,
                    speed: 700,
                    nav: false,
                    controls: false,
                    mouseDrag: true,
                    responsive: getResponsiveSettings(),
                  }}
                  rebuildKey={displayData.items
                    .map((item) => `${item.id}:${item.title}:${item.link}:${item.price}`)
                    .join("|")}
                >
                  {displayData.items.map((item: FeaturePackageItem) => (
                    <TourCard
                      key={item.id}
                      item={{
                        ...item,
                        id: String(item.id),
                        price:
                          typeof item.price === "string"
                            ? parseFloat(item.price)
                            : item.price,
                      }}
                      imageHeight={220}
                      imageZoom
                      linkMeta={false}
                      toggleWishlist={toggleWishlist}
                      isInWishlist={isInWishlist}
                      // Per item: the button only appears when a video exists,
                      // and it opens ALL of the tour's review videos — the
                      // same set the listing pages open, so the control does
                      // not mean two different things on two pages.
                      onPlayVideo={
                        item.videoId
                          ? () => {
                              setVideoIds(
                                item.videoIds?.length ? item.videoIds : [item.videoId]
                              );
                              setOpen(true);
                            }
                          : undefined
                      }
                    />
                  ))}
                </TinySlider>
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
      <VideoModal isOpen={isOpen && videoIds.length > 0} setOpen={setOpen} ids={videoIds} />
    </>
  );
};

export default FeatureTwo;
