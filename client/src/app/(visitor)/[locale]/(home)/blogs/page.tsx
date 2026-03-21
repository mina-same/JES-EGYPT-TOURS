'use client';
import React, { useState, useEffect } from "react";
import { Col, Container, Row } from "react-bootstrap";
import Image from "next/image";
import Link from "next/link";
import { getCategories, getSubCategoriesByCategory } from "@/lib/api/blog";
import { Loader2, ChevronRight, Hash } from "lucide-react";
import { getLocalizedValue } from "@/lib/localize";
import { useTranslation } from "react-i18next";

import Layout from "@/components/layout/Layout/Layout";
import TopbarOne from "@/components/common/TopbarOne/TopbarOne";
import HeaderOne from "@/components/layout/HeaderOne/HeaderOne";
import HeaderOneCloned from "@/components/layout/HeaderOneCloned/HeaderOneCloned";
import PageHeader from "@/components/sections/PageHeader/PageHeader";
import FooterOne from "@/components/layout/FooterOne/FooterOne";

interface BlogCategoryWithSubs {
  _id: string;
  name: any;
  slug: any;
  image?: string;
  description?: any;
  subcategories: any[];
}

export default function BlogCategoriesPage() {
  const { i18n } = useTranslation();
  const currentLocale = i18n.language || 'en';
  const [categories, setCategories] = useState<BlogCategoryWithSubs[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);


  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true);
        const cats = await getCategories();
        
        if (cats && Array.isArray(cats)) {
          const catsWithSubs = await Promise.all(
            cats.map(async (cat: any) => {
              try {
                const subs = await getSubCategoriesByCategory(cat.slug);
                return {
                  ...cat,
                  subcategories: Array.isArray(subs) ? subs : []
                };
              } catch (e) {
                return { ...cat, subcategories: [] };
              }
            })
          );
          setCategories(catsWithSubs);
        }
      } catch (err) {
        console.error("Error fetching blog categories:", err);
        setError("Failed to load blog categories.");
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, []);

  if (loading) {
    return (
      <Layout>
        <TopbarOne />
        <HeaderOne linkTheme="light" />
        <HeaderOneCloned />
        <PageHeader title="Blog Categories" subTitle="Browse Articles" />
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
        </div>
        <FooterOne />
      </Layout>
    );
  }

  return (
    <Layout>
      <TopbarOne />
      <HeaderOne linkTheme="light" />
      <HeaderOneCloned />
      <PageHeader title="Blog Categories" subTitle="Explore our Stories" />
      
      <section className="blog-category-directory section-space">
        <Container>
          <div className="section-title text-center mb-5">
            <span className="section-title__tagline">Knowledge Base</span>
            <h2 className="section-title__title">Explore by Topics</h2>
          </div>

          <Row className="gutter-y-30">
            {categories.map((category) => (
              <Col lg={4} md={6} key={category._id}>
                <div className="blog-cat-card">
                  <div className="blog-cat-card__content">
                    <div className="blog-cat-card__header">
                       <h3 className="blog-cat-card__title">
                         <Link href={`/blogs/category/${getLocalizedValue(category.slug, currentLocale)}`}>{getLocalizedValue(category.name, currentLocale)}</Link>
                       </h3>

                       <span className="blog-cat-card__count">{category.subcategories.length} Topics</span>
                    </div>
                    
                    {category.description && (
                      <p className="blog-cat-card__text">
                        {getLocalizedValue(category.description, currentLocale).replace(/<[^>]*>/g, '').substring(0, 100)}...
                      </p>
                    )}


                    <div className="blog-cat-card__subs mt-4">
                      <ul className="blog-cat-card__list">
                        {category.subcategories.map((sub) => (
                          <li key={sub._id}>
                            <Link href={`/blogs/subcategory/${getLocalizedValue(sub.slug, currentLocale)}`} className="flex items-center gap-2">
                               <Hash className="w-3 h-3" />
                               {getLocalizedValue(sub.name, currentLocale)}

                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <Link href={`/blogs/category/${getLocalizedValue(category.slug, currentLocale)}`} className="blog-cat-card__btn mt-4">
                      Explore Articles <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </Col>
            ))}
          </Row>

          <div className="text-center mt-5">
            <Link href="/blogs/all" className="gotur-btn">
               View All News
               <span className="icon"><i className="icon-right"></i></span>
            </Link>
          </div>
        </Container>
      </section>

      <style jsx global>{`
        .blog-cat-card {
          background: #f8f6f2;
          padding: 40px;
          border-radius: 20px;
          height: 100%;
          border: 1px solid transparent;
          transition: all 0.3s ease;
        }

        .blog-cat-card:hover {
          background: white;
          border-color: #eee;
          box-shadow: 0 15px 35px rgba(0,0,0,0.06);
          transform: translateY(-5px);
        }

        .blog-cat-card__header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .blog-cat-card__title {
          font-size: 22px;
          font-weight: 700;
          margin: 0;
        }

        .blog-cat-card__title a {
          color: #1a1a1a;
          text-decoration: none;
        }

        .blog-cat-card__count {
          font-size: 12px;
          background: white;
          padding: 4px 12px;
          border-radius: 20px;
          font-weight: 700;
          color: #b79c5c;
        }

        .blog-cat-card__text {
          font-size: 15px;
          color: #666;
          line-height: 1.6;
          margin-bottom: 25px;
        }

        .blog-cat-card__list {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
        }

        .blog-cat-card__list li a {
          font-size: 13px;
          color: #444;
          background: rgba(0,0,0,0.03);
          padding: 6px 14px;
          border-radius: 8px;
          text-decoration: none;
          font-weight: 600;
          transition: all 0.2s;
        }

        .blog-cat-card__list li a:hover {
          background: #b79c5c;
          color: white;
        }

        .blog-cat-card__btn {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 700;
          font-size: 14px;
          color: #1a1a1a;
          text-decoration: none;
          border-bottom: 2px solid #b79c5c;
          padding-bottom: 4px;
          width: fit-content;
          transition: gap 0.3s;
        }

        .blog-cat-card__btn:hover {
          gap: 12px;
        }
      `}</style>

      <FooterOne />
    </Layout>
  );
}
