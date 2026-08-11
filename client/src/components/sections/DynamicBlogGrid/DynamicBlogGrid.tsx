"use client";

import { BlogPost, PaginationData } from "@/lib/api/blog";
import { Col, Container, Row } from "react-bootstrap";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import BlogCard from "@/components/common/BlogCard/BlogCard";
import { buildBlogCardViewModels } from "@/lib/blog/cardViewModel";

interface DynamicBlogGridProps {
  blogs: BlogPost[];
  pagination?: PaginationData;
  basePath: string;
  variant?: 'standard' | 'featured';
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

const DynamicBlogGrid: React.FC<DynamicBlogGridProps> = ({ blogs, pagination, basePath, variant = 'standard' }) => {
  const router = useRouter();
  const { i18n } = useTranslation('blogs');
  const currentLocale = i18n.language || 'en';

  const cards = useMemo(
    () => buildBlogCardViewModels(blogs, currentLocale),
    [blogs, currentLocale]
  );

  const handlePageChange = (page: number) => {
    const separator = basePath.includes("?") ? "&" : "?";
    router.push(`${basePath}${separator}page=${page}`);
  };

  if (variant === 'featured') {
    return (
      <Row className='gutter-y-20'>
        {cards.map((post, index) => (
          <Col lg={3} md={6} key={post.id}>
            <BlogCard
              post={post}
              variant='minimal'
              index={index}
              animate={false}
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
              <BlogCard post={post} variant='classic' index={index} showExcerpt />
            </Col>
          ))}

          {/* Pagination */}
          {pagination && pagination.pages > 1 && (
            <Col lg={12}>
              <ul className='list-unstyled pagination justify-content-center'>
                {/* Previous Button */}
                <li className={pagination.page === 1 ? 'disabled' : ''}>
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className='page-link'
                  >
                    <i className='icon-arrow-left'></i>
                  </button>
                </li>

                {/* Page Numbers */}
                {buildPageList(pagination.page, pagination.pages).map((pageNum, index) =>
                  pageNum === 'gap' ? (
                    <li key={`gap-${index}`} className='disabled'>
                      <span className='page-link'>…</span>
                    </li>
                  ) : (
                    <li key={pageNum} className={pagination.page === pageNum ? 'active' : ''}>
                      <button
                        onClick={() => handlePageChange(pageNum)}
                        className='page-link'
                        aria-current={pagination.page === pageNum ? 'page' : undefined}
                      >
                        {pageNum}
                      </button>
                    </li>
                  )
                )}

                {/* Next Button */}
                <li className={pagination.page === pagination.pages ? 'disabled' : ''}>
                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === pagination.pages}
                    className='page-link'
                  >
                    <i className='icon-arrow-right'></i>
                  </button>
                </li>
              </ul>
            </Col>
          )}
        </Row>
      </Container>
    </section>
  );
};

export default DynamicBlogGrid;
