"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Container, Row, Col } from "react-bootstrap";
import { Loader2 } from "lucide-react";

import { tourAPI } from "@/lib/api/tour";
import { getAllBlogs } from "@/lib/api/blog";
import Pagination from "@/components/common/Pagination/Pagination";
import DynamicBlogGrid from "@/components/sections/DynamicBlogGrid/DynamicBlogGrid";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

type SearchParamValue = string | string[] | undefined;

interface SearchResultsPageProps {
  initialSearchParams: Record<string, SearchParamValue>;
}

const toStr = (v: SearchParamValue): string | undefined => {
  if (typeof v === "string") return v;
  if (Array.isArray(v)) return v[0];
  return undefined;
};

const toNum = (v: SearchParamValue, fallback: number) => {
  const s = toStr(v);
  const n = s ? Number(s) : NaN;
  return Number.isFinite(n) && n > 0 ? n : fallback;
};

const buildQueryString = (params: Record<string, string | undefined>) => {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== "") sp.set(k, v);
  });
  const qs = sp.toString();
  return qs ? `?${qs}` : "";
};

const SearchResultsPage: React.FC<SearchResultsPageProps> = ({ initialSearchParams }) => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [tours, setTours] = useState<any[]>([]);
  const [toursLoading, setToursLoading] = useState(true);
  const [toursError, setToursError] = useState<string | null>(null);
  const [toursPage, setToursPage] = useState(1);
  const [toursTotalPages, setToursTotalPages] = useState(1);

  const [blogs, setBlogs] = useState<any[]>([]);
  const [blogsPagination, setBlogsPagination] = useState<any>({ page: 1, limit: 6, total: 0, pages: 1 });
  const [blogsLoading, setBlogsLoading] = useState(true);
  const [blogsError, setBlogsError] = useState<string | null>(null);

  const [filtersOpen, setFiltersOpen] = useState(false);

  const effectiveParams = useMemo(() => {
    // Prefer live URL params (client navigation) but fall back to initial for first render.
    const current = searchParams;
    if (!current) return initialSearchParams;

    const obj: Record<string, string> = {};
    current.forEach((value, key) => {
      obj[key] = value;
    });
    return obj;
  }, [searchParams, initialSearchParams]);

  const q = toStr((effectiveParams as any).q) || "";
  const page = toNum((effectiveParams as any).page, 1);
  const sort = toStr((effectiveParams as any).sort) || "-createdAt";
  const minPrice = toStr((effectiveParams as any).minPrice);
  const maxPrice = toStr((effectiveParams as any).maxPrice);
  const blogPage = toNum((effectiveParams as any).blogPage, 1);
  const blogSort = toStr((effectiveParams as any).blogSort) || "newest";

  const updateUrl = (patch: Record<string, string | undefined>) => {
    const current: Record<string, string | undefined> = {
      q: q || undefined,
      page: String(page),
      sort: sort || undefined,
      minPrice,
      maxPrice,
      blogPage: String(blogPage),
      blogSort,
    };

    const next: Record<string, string | undefined> = { ...current, ...patch };

    // Reset pages when query changes
    if (patch.q !== undefined || patch.sort !== undefined || patch.minPrice !== undefined || patch.maxPrice !== undefined) {
      next.page = "1";
    }
    if (patch.q !== undefined || patch.blogSort !== undefined) {
      next.blogPage = "1";
    }

    router.push(`/search${buildQueryString(next)}`);
  };

  useEffect(() => {
    setToursPage(page);
  }, [page]);

  useEffect(() => {
    const fetchTours = async () => {
      try {
        setToursLoading(true);
        setToursError(null);

        const res = await tourAPI.getAll({
          page,
          limit: 9,
          search: q || undefined,
          sort: sort || undefined,
          minPrice: minPrice ? Number(minPrice) : undefined,
          maxPrice: maxPrice ? Number(maxPrice) : undefined,
        });

        if (!res.success) {
          setToursError(res.error || "Failed to load tours");
          setTours([]);
          setToursTotalPages(1);
          return;
        }

        const mapped = (Array.isArray(res.data) ? res.data : []).map((tour: any) => {
          const galleryImages = [
            ...(tour.images || []).map((img: any) => img.url),
            ...(tour.gallery || []).map((img: any) => img.url),
          ].filter(Boolean);

          const uniqueImages = Array.from(new Set(galleryImages));

          return {
            id: tour._id,
            slug: tour.slug,
            image: uniqueImages[0] || "/assets/images/resources/tour-1-1.jpg",
            title: tour.heading || tour.name,
            link: `/tours/${tour.slug}`,
            price: tour.priceStartingFrom || 0,
            location: tour.tourLocation || "",
          };
        });

        setTours(mapped);
        setToursTotalPages(res.totalPages || 1);
      } catch (e) {
        console.error(e);
        setToursError("An error occurred while loading tours");
        setTours([]);
        setToursTotalPages(1);
      } finally {
        setToursLoading(false);
      }
    };

    void fetchTours();
  }, [q, page, sort, minPrice, maxPrice]);

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        setBlogsLoading(true);
        setBlogsError(null);

        const opts: any = { page: blogPage, limit: 6, search: q || undefined };
        if (blogSort === "popular") {
          opts.sort = 'popular';
        }

        const res = await getAllBlogs(opts);
        setBlogs(res.data);
        setBlogsPagination(res.pagination);
      } catch (e) {
        console.error(e);
        setBlogsError("Failed to load blogs");
        setBlogs([]);
        setBlogsPagination({ page: 1, limit: 6, total: 0, pages: 1 });
      } finally {
        setBlogsLoading(false);
      }
    };

    void fetchBlogs();
  }, [q, blogPage, blogSort]);

  const tourSortOptions: Array<{ label: string; value: string }> = [
    { label: "Newest", value: "-createdAt" },
    { label: "Most Viewed", value: "-viewCount" },
    { label: "Price: Low to High", value: "priceStartingFrom" },
    { label: "Price: High to Low", value: "-priceStartingFrom" },
  ];

  return (
    <section className="section-space">
      <Container>
        <Row className="mb-4">
          <Col lg={12}>
            <div className="d-flex flex-column flex-lg-row gap-3 align-items-lg-center justify-content-between">
              <div className="flex-grow-1">
                <div className="d-flex gap-2 align-items-center">
                  <input
                    className="form-control"
                    placeholder="Search tours and blogs..."
                    defaultValue={q}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        const value = (e.target as HTMLInputElement).value;
                        updateUrl({ q: value || undefined });
                      }
                    }}
                  />
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => {
                      setFiltersOpen((v) => !v);
                    }}
                  >
                    Filters
                  </button>
                </div>
                <div className="text-muted mt-2" style={{ fontSize: 13 }}>
                  {q ? (
                    <>Showing results for <strong>{q}</strong></>
                  ) : (
                    <>Showing all tours and blogs</>
                  )}
                </div>
              </div>

              <div className="d-flex gap-2 align-items-center">
                <select
                  className="form-select"
                  value={sort}
                  onChange={(e) => updateUrl({ sort: e.target.value })}
                  style={{ minWidth: 220 }}
                >
                  {tourSortOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </Col>
        </Row>

        {filtersOpen ? (
          <Row className="mb-4">
            <Col lg={12}>
              <div className="p-3 border rounded" style={{ background: "#fff" }}>
                <div className="d-flex flex-column flex-lg-row gap-3">
                  <div className="flex-grow-1">
                    <label className="form-label">Min price</label>
                    <input
                      type="number"
                      className="form-control"
                      defaultValue={minPrice || ""}
                      onBlur={(e) => updateUrl({ minPrice: e.target.value ? e.target.value : undefined })}
                    />
                  </div>
                  <div className="flex-grow-1">
                    <label className="form-label">Max price</label>
                    <input
                      type="number"
                      className="form-control"
                      defaultValue={maxPrice || ""}
                      onBlur={(e) => updateUrl({ maxPrice: e.target.value ? e.target.value : undefined })}
                    />
                  </div>
                  <div className="d-flex align-items-end gap-2">
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() => updateUrl({ minPrice: undefined, maxPrice: undefined })}
                    >
                      Reset
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setFiltersOpen(false)}
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </Col>
          </Row>
        ) : null}

        <Row className="mb-3">
          <Col lg={12}>
            <h2 style={{ fontSize: 24, marginBottom: 0 }}>Tours</h2>
          </Col>
        </Row>

        {toursLoading ? (
          <div className="d-flex align-items-center justify-content-center" style={{ minHeight: 240 }}>
            <Loader2 className="animate-spin" />
          </div>
        ) : toursError ? (
          <div className="text-danger" style={{ minHeight: 120 }}>
            {toursError}
          </div>
        ) : (
          <>
            <Row className="gutter-y-30">
              {tours.map((t) => (
                <Col lg={4} md={6} key={t.id}>
                  <div className="listing-card-four" style={{ height: "100%" }}>
                    <div className="listing-card-four__content" style={{ padding: 18 }}>
                      <h3 className="listing-card-four__title" style={{ fontSize: 18 }}>
                        <Link href={t.link}>{t.title}</Link>
                      </h3>
                      <div className="text-muted" style={{ fontSize: 13, marginTop: 6 }}>
                        {t.location}
                      </div>
                      <div style={{ marginTop: 10, fontWeight: 700 }}>${t.price}</div>
                      <div style={{ marginTop: 12 }}>
                        <Link href={t.link} className="gotur-btn">
                          View Tour
                        </Link>
                      </div>
                    </div>
                  </div>
                </Col>
              ))}
            </Row>

            <div className="mt-4">
              <Pagination
                currentPage={toursPage}
                totalPages={toursTotalPages}
                onPageChange={(p) => updateUrl({ page: String(p) })}
              />
            </div>
          </>
        )}

        <div className="mt-5" />

        <Row className="mb-3">
          <Col lg={12} className="d-flex flex-column flex-lg-row align-items-lg-center justify-content-between gap-2">
            <h2 style={{ fontSize: 24, marginBottom: 0 }}>Blogs</h2>
            <div className="d-flex gap-2 align-items-center">
              <span className="text-muted" style={{ fontSize: 13 }}>Sort:</span>
              <select
                className="form-select"
                value={blogSort}
                onChange={(e) => updateUrl({ blogSort: e.target.value })}
                style={{ minWidth: 200 }}
              >
                <option value="newest">Newest</option>
                <option value="popular">Popular</option>
              </select>
            </div>
          </Col>
        </Row>

        {blogsLoading ? (
          <div className="d-flex align-items-center justify-content-center" style={{ minHeight: 200 }}>
            <Loader2 className="animate-spin" />
          </div>
        ) : blogsError ? (
          <div className="text-danger" style={{ minHeight: 120 }}>
            {blogsError}
          </div>
        ) : (
          <>
            <DynamicBlogGrid
              blogs={blogs}
              pagination={{ ...blogsPagination, pages: 1 }}
              basePath={`/search${buildQueryString({
                q: q || undefined,
                page: String(page),
                sort,
                minPrice,
                maxPrice,
                blogSort,
              })}`}
            />
            <div className="mt-4">
              <Pagination
                currentPage={blogPage}
                totalPages={blogsPagination?.pages || 1}
                onPageChange={(p) => updateUrl({ blogPage: String(p) })}
              />
            </div>
          </>
        )}
      </Container>
    </section>
  );
};

export default SearchResultsPage;
