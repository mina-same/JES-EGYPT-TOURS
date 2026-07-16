'use client';

import React from 'react';
import Image, { StaticImageData } from 'next/image';
import { localizeInternalUrl } from '@/lib/url';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { Container } from 'react-bootstrap';
import {
  ArrowRight,
  Calendar,
  Compass,
  Headphones,
  MapPinned,
  Sparkles,
  Users,
} from 'lucide-react';

import defaultPromoImage from '@/assets/images/resources/tour-listing-details-1-1.jpg';
import destinationFallbackImage from '@/assets/images/resources/destinations-1-2.jpg';
import styles from './BannerCTA.module.css';

type BannerCTAVariant = 'destination' | 'blogCategory' | 'blogSubcategory' | 'blogArticle';
type ResolvedVariant = BannerCTAVariant | 'default';

interface BannerCTAProps {
  locale: string;
  variant?: BannerCTAVariant;
  contextName?: string;
  parentName?: string;
  articleCount?: number;
  imageUrl?: string;
  contained?: boolean;
}

type PromoImageSource = string | StaticImageData;

const categoryPromoImage = '/images/ctaimage1.png';
const subcategoryPromoImage = '/images/ctaimage2.png';
const blogArticlePromoImage = '/images/blog/pyramids-sunset.webp';

type FeatureItem = {
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
  title: string;
};

const cardClassMap: Record<ResolvedVariant, string> = {
  default: styles.defaultCard,
  destination: styles.destinationCard,
  blogCategory: styles.blogCategoryCard,
  blogSubcategory: styles.blogSubcategoryCard,
  blogArticle: styles.blogArticleCard,
};

const BannerCTA: React.FC<BannerCTAProps> = ({
  locale,
  variant,
  contextName,
  parentName,
  articleCount,
  imageUrl,
  contained = true,
}) => {
  const { t } = useTranslation('common');
  const resolvedVariant: ResolvedVariant = variant ?? 'default';

  const primaryHref = localizeInternalUrl('/tailor-made', locale);
  const secondaryHref = `/${locale}/tours`;

  const destinationContext = contextName || t('cta.defaults.destinationContext');
  const categoryContext = contextName || t('cta.defaults.categoryContext');
  const subcategoryContext = contextName || t('cta.defaults.subcategoryContext');
  const parentContext = parentName || t('cta.defaults.parentContext');
  const blogArticleBadgesRaw = t('cta.blogArticle.badges', { returnObjects: true });
  const blogArticleBadges = Array.isArray(blogArticleBadgesRaw) ? (blogArticleBadgesRaw as string[]) : [];

  const defaultFeatures: FeatureItem[] = [
    { icon: Users, title: t('cta.default.features.experts.title') },
    { icon: MapPinned, title: t('cta.default.features.itineraries.title') },
    { icon: Headphones, title: t('cta.default.features.support.title') },
  ];

  const destinationFeatures: FeatureItem[] = [
    { icon: Compass, title: t('cta.destination.features.routing.title') },
    { icon: Calendar, title: t('cta.destination.features.pacing.title') },
    { icon: Sparkles, title: t('cta.destination.features.finishing.title') },
  ];

  const renderActions = (buttonClass?: string) => (
    <div className={styles.actions}>
      <Link href={primaryHref} className={`${styles.primaryButton} ${buttonClass || ''}`.trim()}>
        <span>{t('cta.actions.primary')}</span>
        <ArrowRight size={18} strokeWidth={2.2} />
      </Link>
      <Link href={secondaryHref} className={styles.secondaryButton}>
        <span>{t('cta.actions.secondary')}</span>
        <Calendar size={18} strokeWidth={2.2} />
      </Link>
    </div>
  );

  const renderFeatureList = (items: FeatureItem[], tone: 'light' | 'dark' = 'dark') => (
    <div className={`${styles.featureList} ${tone === 'light' ? styles.featureListLight : ''}`.trim()}>
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <div key={item.title} className={styles.featurePill}>
            <span className={styles.featurePillIcon}>
              <Icon size={16} strokeWidth={2.2} />
            </span>
            <span>{item.title}</span>
          </div>
        );
      })}
    </div>
  );

  const renderTextBadges = (items: string[]) => (
    <div className={styles.featureList}>
      {items.map((item) => (
        <div key={item} className={`${styles.featurePill} ${styles.textOnlyPill}`.trim()}>
          <span>{item}</span>
        </div>
      ))}
    </div>
  );

  const renderPromoImage = (src: PromoImageSource, alt: string, badge?: string) => (
    <div className={styles.imagePanel}>
      <Image
        src={src}
        alt={alt}
        fill
        className={styles.image}
        sizes="(max-width: 991px) 100vw, 420px"
      />
      <div className={styles.imageOverlay} />
      {badge ? <span className={styles.imageBadge}>{badge}</span> : null}
    </div>
  );

  const renderBackgroundPromo = (
    src: PromoImageSource,
    alt: string,
    badge: string | undefined,
    content: React.ReactNode
  ) => (
    <div className={styles.promoBanner}>
      <Image
        src={src}
        alt={alt}
        fill
        className={styles.promoBannerImage}
        sizes="100vw"
      />
      <div className={styles.promoBannerOverlay} />
      <div className={styles.promoBannerContent}>
        {badge ? <span className={styles.promoBannerBadge}>{badge}</span> : null}
        {content}
      </div>
    </div>
  );

  const renderDefault = () => (
    <div className={styles.layout}>
      <div className={styles.content}>
        <span className={styles.eyebrow}>{t('cta.default.eyebrow')}</span>
        <h2 className={styles.title}>{t('cta.default.title')}</h2>
        <p className={styles.text}>{t('cta.default.text')}</p>
        {renderFeatureList(defaultFeatures)}
        {renderActions()}
      </div>

      <div className={styles.visual}>
        {renderPromoImage(defaultPromoImage, t('cta.default.title'), t('cta.default.eyebrow'))}
      </div>
    </div>
  );

  const renderDestination = () => (
    <div className={`${styles.layout} ${styles.layoutWide}`.trim()}>
      <div className={styles.content}>
        <span className={`${styles.eyebrow} ${styles.eyebrowLight}`}>{t('cta.destination.eyebrow')}</span>
        <h2 className={`${styles.title} ${styles.titleLight}`}>
          {t('cta.destination.title', { context: destinationContext })}
        </h2>
        <p className={`${styles.text} ${styles.textLight}`}>
          {t('cta.destination.text', { context: destinationContext })}
        </p>
        {renderFeatureList(destinationFeatures, 'light')}
        {renderActions(styles.destinationButton)}
      </div>

      <div className={styles.visual}>
        {renderPromoImage(
          imageUrl || destinationFallbackImage,
          destinationContext,
          t('cta.destination.media.badge')
        )}
        <div className={styles.inlineNote}>
          <p className={styles.inlineNoteText}>{t('cta.destination.media.text')}</p>
        </div>
      </div>
    </div>
  );

  const renderBlogCategory = () => (
    renderBackgroundPromo(
      categoryPromoImage,
      categoryContext,
      typeof articleCount === 'number' ? t('cta.labels.articleCount', { count: articleCount }) : t('cta.blogCategory.eyebrow'),
      <>
        <h2 className={`${styles.title} ${styles.titleOnImage}`}>
          {t('cta.blogCategory.title', { context: categoryContext })}
        </h2>
        <p className={`${styles.text} ${styles.textOnImage}`}>
          {t('cta.blogCategory.text', { context: categoryContext, count: articleCount ?? 0 })}
        </p>
        {renderActions(styles.categoryButton)}
      </>
    )
  );

  const renderBlogSubcategory = () => (
    renderBackgroundPromo(
      subcategoryPromoImage,
      subcategoryContext,
      t('cta.blogSubcategory.eyebrow'),
      <>
        <div className={styles.metaRow}>
          <span className={`${styles.metaPill} ${styles.metaPillOnImage}`}>{subcategoryContext}</span>
          {parentName ? <span className={`${styles.metaPill} ${styles.metaPillOnImage}`}>{parentContext}</span> : null}
          {typeof articleCount === 'number' ? (
            <span className={`${styles.metaPill} ${styles.metaPillOnImage}`}>{t('cta.labels.articleCount', { count: articleCount })}</span>
          ) : null}
        </div>
        <h2 className={`${styles.title} ${styles.titleOnImage}`}>
          {t('cta.blogSubcategory.title', { context: subcategoryContext })}
        </h2>
        <p className={`${styles.text} ${styles.textOnImage}`}>
          {t('cta.blogSubcategory.text', {
            context: subcategoryContext,
            parent: parentContext,
          })}
        </p>
        {renderActions(styles.subcategoryButton)}
      </>
    )
  );

  const renderBlogArticle = () => (
    <div className={styles.layout}>
      <div className={styles.content}>
        <span className={styles.eyebrow}>{t('cta.blogArticle.eyebrow')}</span>
        <p className={styles.title}>{t('cta.blogArticle.title')}</p>
        <p className={styles.text}>{t('cta.blogArticle.text')}</p>
        {renderTextBadges(blogArticleBadges)}
        <div className={styles.actions}>
          <Link href={primaryHref} className={styles.primaryButton}>
            <span>{t('cta.blogArticle.actions.primary')}</span>
          </Link>
          <Link href={secondaryHref} className={styles.secondaryButton}>
            <span>{t('cta.blogArticle.actions.secondary')}</span>
          </Link>
        </div>
      </div>

      <div className={styles.visual}>
        {renderPromoImage(
          blogArticlePromoImage,
          t('cta.blogArticle.title'),
          t('cta.blogArticle.media.badge')
        )}
      </div>
    </div>
  );

  const content = (
    <div className={`${styles.card} ${cardClassMap[resolvedVariant]}`}>
      {resolvedVariant === 'destination' && renderDestination()}
      {resolvedVariant === 'blogCategory' && renderBlogCategory()}
      {resolvedVariant === 'blogSubcategory' && renderBlogSubcategory()}
      {resolvedVariant === 'blogArticle' && renderBlogArticle()}
      {resolvedVariant === 'default' && renderDefault()}
    </div>
  );

  return (
    <section className={`banner-cta section-space-bottom pt-5 ${styles.section} ${resolvedVariant === 'blogArticle' ? styles.blogArticleSection : ''}`.trim()}>
      {contained ? <Container>{content}</Container> : content}
    </section>
  );
};

export default BannerCTA;
