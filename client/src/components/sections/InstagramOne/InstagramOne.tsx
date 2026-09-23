"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";

import { instagramOneData, type InstagramOneData } from "@/data/instagramOne";
import { Container } from "react-bootstrap";
import {
  TinySliderWrapper as TinySlider,
  type TinySliderHandle,
} from "@/components/common/TinySliderWrapper";
import { useTranslation } from "react-i18next";

interface InstragramOneProps {
  extraClass?: string;
}

/**
 * How wide one tile actually renders, so the browser stops choosing a resource
 * sized for the viewport instead of for the tile.
 *
 * The strip sits in a `Container fluid` (no max-width, 30px of padding), and
 * tiny-slider gives each slide `calc(100% / items)` of a track widened by a
 * -30px margin, then eats the gutter with `padding-right: 30px` — so a tile is
 * `viewport / items - 30`, with `items` coming from the `responsive` map below:
 *
 *   <=499px   1 tile    100vw    - 30px
 *   <=767px   2 tiles    50vw    - 30px
 *   <=1079px  3 tiles    33.34vw - 30px
 *   <=1199px  4 tiles    25vw    - 30px
 *   <=1399px  5 tiles    20vw    - 30px
 *   above     6 tiles    16.67vw - 30px
 *
 * Checked against the rendered layout at ten viewport widths.
 */
const TILE_SIZES =
  "(max-width: 499px) calc(100vw - 30px), (max-width: 767px) calc(50vw - 30px), (max-width: 1079px) calc(33.34vw - 30px), (max-width: 1199px) calc(25vw - 30px), (max-width: 1399px) calc(20vw - 30px), calc(16.67vw - 30px)";

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

const InstagramOne: React.FC<InstragramOneProps> = ({ extraClass = "" }) => {
  // `extraClass` had no default, so the rendered class list literally read
  // "instagram-one section-space undefined".
  const { t } = useTranslation("common");
  const { items }: InstagramOneData = instagramOneData;
  const sliderRef = useRef<TinySliderHandle>(null);

  // Always `true` on the first render, never read from matchMedia. The
  // homepage loads this through LazyInstagramSection (`ssr: false`), but the
  // About page imports it directly, so it IS server-rendered there — and the
  // server has no window. Deriving the initial value from the preference made
  // a reduced-motion visitor's first client render say "Play" over server
  // HTML that said "Pause": a hydration mismatch. The effect below applies
  // the real preference once mounted, well inside the 2.5s autoplayTimeout.
  const [playing, setPlaying] = useState(true);
  const [sliderReady, setSliderReady] = useState(false);

  // Match the visitor's system preference after mount, and follow it if it
  // changes while the page is open. No "did the user override this?"
  // bookkeeping: a fresh system-level accessibility choice simply wins over
  // an earlier click on the button.
  useEffect(() => {
    const query = window.matchMedia(REDUCED_MOTION_QUERY);
    const syncWithPreference = () => setPlaying(!query.matches);

    syncWithPreference();
    query.addEventListener("change", syncWithPreference);
    return () => query.removeEventListener("change", syncWithPreference);
  }, []);

  // tiny-slider's `play()` is `if (autoplay && !animating)`, where `autoplay`
  // is the option value captured at init — so initialising with
  // `autoplay: false` would make play() a permanent no-op and the button could
  // never start the strip. It is always built with autoplay on and paused
  // here instead.
  useEffect(() => {
    const slider = sliderRef.current?.slider;
    if (!slider) return;

    if (playing) {
      slider.play();
    } else {
      slider.pause();
    }
  }, [playing, sliderReady]);

  return (
    <div className={`instagram-one section-space ${extraClass}`.trim()}>
      <div className='instagram-one__top'>
        {/* h2, not h5: every other section on the page is h2, so this
            skipped two heading levels in the document outline. */}
        <Container className='instagram-one__heading'>
          <h2 className='instagram-one__title'>{t("instagram.title")}</h2>
          {/* WCAG 2.2.2: the strip moves on its own for longer than five
              seconds, so it needs a control that is not hover-only. The label
              names the next action, which is why there is no aria-pressed. */}
          <button
            type='button'
            className='instagram-one__autoplay-toggle'
            onClick={() => setPlaying((wasPlaying) => !wasPlaying)}
          >
            <i
              className={playing ? "fas fa-pause" : "fas fa-play"}
              aria-hidden='true'
            />
            {t(playing ? "instagram.pause" : "instagram.play")}
          </button>
        </Container>
      </div>

      <Container fluid>
        <div className='instagram-one__carousel'>
          {/* tiny-slider, not Swiper: this and the blog carousel were the only
              two things pulling a second carousel engine into the homepage
              bundle alongside the five sections already on tiny-slider. */}
          <TinySlider
            ref={sliderRef}
            onInit={() => setSliderReady(true)}
            placeholderClassName='instagram-one__carousel tns-placeholder-single'
            settings={{
              items: 1,
              gutter: 30,
              loop: true,
              speed: 700,
              autoplay: true,
              autoplayTimeout: 2500,
              autoplayButtonOutput: false,
              // Stop the band cycling while the visitor is looking at it.
              autoplayHoverPause: true,
              nav: false,
              controls: false,
              mouseDrag: true,
              responsive: {
                0: { items: 1 },
                500: { items: 2 },
                768: { items: 3 },
                992: { items: 3 },
                1080: { items: 4 },
                1200: { items: 5 },
                1400: { items: 6 },
              },
            }}
          >
            {items.map((item) => (
              <div key={item.id}>
                {/* Not a link, and nothing that suggests one: the tiles used to
                    reveal a round Instagram button on hover — with its own
                    hover colour — while no anchor existed anywhere in the
                    section. */}
                <div className='instagram-one__item'>
                  <Image
                    src={item.image}
                    alt={item.alt}
                    // The file's real pixels, and they differ per image. No
                    // object-fit: a global `img { height: auto }` leaves every
                    // tile at its own natural ratio, so `cover` never had a
                    // taller or shorter box to crop into.
                    width={item.width}
                    height={item.height}
                    sizes={TILE_SIZES}
                  />
                </div>
              </div>
            ))}
          </TinySlider>
        </div>
      </Container>
    </div>
  );
};

export default InstagramOne;
