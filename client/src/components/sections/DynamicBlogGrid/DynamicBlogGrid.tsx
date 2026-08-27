"use client";

import { BlogPost, PaginationData } from "@/lib/api/blog";
import { Col, Container, Row } from "react-bootstrap";
import Link from "next/link";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import BlogCard from "@/components/common/BlogCard/BlogCard";
import { buildBlogCardViewModels } from "@/lib/blog/cardViewModel";

interface DynamicBlogGridProps {
  blogs: BlogPost[];
  pagination?: PaginationData;
  /**
   * Where the pager navigates. MUST carry the locale prefix — a locale-less
   * path sends the visitor through the middleware, which resolves the language
   * from the NEXT_LOCALE cookie rather than the page they are reading.
   *
   * Only the paged (`standard`) grid has a pager, so `variant="featured"`
   * callers omit it. It used to be required, which made every such caller
   * invent a path the component never navigated to — the author page passed
   * its own URL, which would have paged to nothing had the pager existed.
   */
  basePath?: string;
  variant?: 'standard' | 'featured';
  /**
   * Eager-loads the first row's images. Only for a grid that is the page's
   * main content and sits at the top of it — on a section further down, an
   * eager image competes with the real LCP element instead of being it.
   */
  prioritizeFirstRow?: boolean;
}

/**
 * How many numbered pages to show at once. Beyond this the list collapses to
 * first / … / a window around the current page / … / last, because rendering
 * every number turned a 40-page listing into a wall of buttons that wrapped
 * over several lines.
 */
const PAGE_WINDOW = 2;

/**
 * The page numbers to render: always the first and last, always the pages
 * either side of the current one, and an ellipsis wherever that skips a gap.
 */
function buildPageList(current: number, total: number): (number | 'gap')[] {
  const pages = new Set<number>([1, total]);
  for (let page = current - PAGE_WINDOW; page <= current + PAGE_WINDOW; page++) {
    if (page > 1 && page < total) pages.add(page);
  }

  const sorted = Array.from(pages).sort((a, b) => a - b);
  const withGaps: (number | 'gap')[] = [];
  sorted.forEach((page, index) => {
    if (index > 0 && page - (sorted[index - 1] as number) > 1) {
      withGaps.push('gap');
    }
    withGaps.push(page);
  });

  return withGaps;
}

/** Cards per row on desktop, for each skin — how many can be the LCP image. */
const FEATURED_ROW = 4;
const STANDARD_ROW = 3;

const DynamicBlogGrid: React.FC<DynamicBlogGridProps> = ({
  blogs,
  pagination,
  basePath,
  variant = 'standard',
  prioritizeFirstRow = false,
}) => {
  const { t, i18n } = useTranslation('blogs');
  const currentLocale = i18n.language || 'en';

  const cards = useMemo(
    () => buildBlogCardViewModels(blogs, currentLocale),
    [blogs, currentLocale]
  );

  /**
   * The URL of a page in this listing.
   *
   * The pager used to be <button onClick={router.push}>. That works for a
   * visitor with a mouse and for nobody else: a crawler following the listing
   * saw no route to page 2, so every article past the first page was reachable
   * only through a link somewhere else on the site, and the pages could not be
   * opened in a new tab or shared.
   */
  const pageHref = (page: number) => {
    if (!basePath) return "#";
    const separator = basePath.includes("?") ? "&" : "?";
    return `${basePath}${separator}page=${page}`;
  };

  if (variant === 'featured') {
    return (
      <Row className='gutter-y-20'>
        {cards.map((post, index) => (
          <Col lg={3} md={6} key={post.id}>
            <BlogCard
              post={post}
              variant='minimal'
              priority={prioritizeFirstRow && index < FEATURED_ROW}
              sizes='(max-width: 768px) 100vw, (max-width: 992px) 50vw, 25vw'
            />
          </Col>
        ))}
      </Row>
    );
  }

  return (
    <section className='blog-page'>
      <Container>
        <Row className='gutter-y-30'>
          {cards.map((post, index) => (
            <Col lg={4} md={6} key={post.id}>
              <BlogCard
                post={post}
                variant='classic'
                priority={prioritizeFirstRow && index < STANDARD_ROW}
              />
            </Col>
          ))}

          {/* Pagination — needs somewhere to page TO, so a listing that passed
              no basePath renders none rather than a row of dead links. */}
          {pagination && pagination.pages > 1 && basePath && (
            <Col lg={12}>
              {/* The landmark goes on a <nav>, not on the <ul>: role="navigation"
                  there would strip the list semantics its <li> children need. */}
              <nav aria-label={t('blogPagination', { defaultValue: 'Blog pagination' })}>
                <ul className='list-unstyled pagination justify-content-center'>
                  {/* Previous Button */}
                  <li className={pagination.page === 1 ? 'disabled' : ''}>
                    {pagination.page === 1 ? (
                      <span className='page-link' aria-hidden='true'>
                        <i className='icon-arrow-left'></i>
                      </span>
                    ) : (
                      <Link
                        href={pageHref(pagination.page - 1)}
                        prefetch={false}
                        rel='prev'
                        className='page-link'
                        aria-label={t('previousPage', { defaultValue: 'Previous page' })}
                      >
                        <i className='icon-arrow-left' aria-hidden='true'></i>
                      </Link>
                    )}
                  </li>

                  {/* Page Numbers */}
                  {buildPageList(pagination.page, pagination.pages).map((pageNum, index) =>
                    pageNum === 'gap' ? (
                      <li key={`gap-${index}`} className='disabled' aria-hidden='true'>
                        <span className='page-link'>…</span>
                      </li>
                    ) : (
                      <li key={pageNum} className={pagination.page === pageNum ? 'active' : ''}>
                        {pagination.page === pageNum ? (
                          // The page you are on is not a link to itself.
                          <span className='page-link' aria-current='page'>
                            {pageNum}
                          </span>
                        ) : (
                          <Link
                            href={pageHref(pageNum)}
                            prefetch={false}
                            className='page-link'
                            aria-label={t('goToPage', { page: pageNum, defaultValue: 'Page {{page}}' })}
                          >
                            {pageNum}
                          </Link>
                        )}
                      </li>
                    )
                  )}

                  {/* Next Button */}
                  <li className={pagination.page === pagination.pages ? 'disabled' : ''}>
                    {pagination.page === pagination.pages ? (
                      <span className='page-link' aria-hidden='true'>
                        <i className='icon-arrow-right'></i>
                      </span>
                    ) : (
                      <Link
                        href={pageHref(pagination.page + 1)}
                        prefetch={false}
                        rel='next'
                        className='page-link'
                        aria-label={t('nextPage', { defaultValue: 'Next page' })}
                      >
                        <i className='icon-arrow-right' aria-hidden='true'></i>
                      </Link>
                    )}
                  </li>
                </ul>
              </nav>
            </Col>
          )}
        </Row>
      </Container>
    </section>
  );
};

export default DynamicBlogGrid;
