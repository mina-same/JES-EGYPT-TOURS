'use client';
import React, { useState, useEffect } from "react";
import { Col, Container, Row } from "react-bootstrap";
import Image from "next/image";
import Link from "next/link";
import { tourCategoryAPI, tourSubcategoryAPI } from "@/lib/api/tour";
import { Loader2, ChevronRight, MapPin } from "lucide-react";
import Layout from "@/components/layout/Layout/Layout";
import TopbarOne from "@/components/common/TopbarOne/TopbarOne";
import HeaderOne from "@/components/layout/HeaderOne/HeaderOne";
import HeaderOneCloned from "@/components/layout/HeaderOneCloned/HeaderOneCloned";
import PageHeader from "@/components/sections/PageHeader/PageHeader";
import FooterOne from "@/components/layout/FooterOne/FooterOne";

interface CategoryWithSubcategories {
  _id: string;
  name: string;
  slug: string;
  image?: { url: string; alt: string };
  description?: string;
  subcategories: any[];
}

export default function TourCategoriesPage() {
  const [categories, setCategories] = useState<CategoryWithSubcategories[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true);
        const catRes = await tourCategoryAPI.getAll({ isActive: true, limit: 100 });
        
        if (catRes.success && catRes.data) {
          const catsWithSubs = await Promise.all(
            catRes.data.map(async (cat: any) => {
              const subRes = await tourSubcategoryAPI.getByCategory(cat._id);
              return {
                ...cat,
                subcategories: subRes.success ? subRes.data : []
              };
            })
          );
          setCategories(catsWithSubs);
        }
      } catch (err) {
        console.error("Error fetching categories:", err);
        setError("Failed to load categories.");
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
        <PageHeader title="Tour Categories" subTitle="Explore" />
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
      <PageHeader title="Tour Categories" subTitle="Explore by Destinations" />
      
      <section className="category-directory section-space">
        <Container>
          <div className="section-title text-center mb-5">
            <span className="section-title__tagline">Browse Tours</span>
            <h2 className="section-title__title">Our Destinations & Categories</h2>
          </div>

          <Row className="gutter-y-40">
            {categories.map((category) => (
              <Col lg={4} md={6} key={category._id} className="wow fadeInUp" data-wow-delay="100ms">
                <div className="category-card-premium">
                  <div className="category-card-premium__image-wrapper">
                    <Image
                      src={category.image?.url || "/assets/images/resources/tour-1-1.jpg"}
                      alt={category.name}
                      fill
                      className="category-card-premium__image"
                    />
                    <div className="category-card-premium__overlay" />
                    <div className="category-card-premium__content">
                      <div className="category-card-premium__badge">
                        {category.subcategories.length} Sub-destinations
                      </div>
                      <h3 className="category-card-premium__title">
                        <Link href={`/tours/category/${category.slug}`}>{category.name}</Link>
                      </h3>
                      <Link href={`/tours/category/${category.slug}`} className="category-card-premium__link">
                        View All Tours <ChevronRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                  
                  <div className="category-card-premium__subcategories">
                    <h4 className="category-card-premium__sub-title">Popular in {category.name}</h4>
                    <ul className="category-card-premium__list">
                      {category.subcategories.slice(0, 5).map((sub) => (
                        <li key={sub._id}>
                          <Link href={`/tours/subcategory/${sub.slug}`} className="flex items-center gap-2">
                             <MapPin className="w-3 h-3 text-primary" />
                             {sub.name}
                          </Link>
                        </li>
                      ))}
                      {category.subcategories.length > 5 && (
                        <li className="more-link">
                           <Link href={`/tours/category/${category.slug}`}>+ {category.subcategories.length - 5} more</Link>
                        </li>
                      )}
                    </ul>
                  </div>
                </div>
              </Col>
            ))}
          </Row>

          <div className="text-center mt-5">
            <Link href="/tours/all" className="gotur-btn">
               View All Tours
               <span className="icon"><i className="icon-right"></i></span>
            </Link>
          </div>
        </Container>
      </section>

      <style jsx global>{`
        .category-card-premium {
          background: white;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 10px 30px rgba(0,0,0,0.05);
          transition: transform 0.3s ease, box-shadow 0.3s ease;
          height: 100%;
          display: flex;
          flex-direction: column;
        }

        .category-card-premium:hover {
          transform: translateY(-10px);
          box-shadow: 0 20px 40px rgba(0,0,0,0.1);
        }

        .category-card-premium__image-wrapper {
          position: relative;
          height: 240px;
          width: 100%;
        }

        .category-card-premium__image {
          object-cover: cover;
        }

        .category-card-premium__overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.2) 50%, transparent 100%);
        }

        .category-card-premium__content {
          position: absolute;
          bottom: 0;
          left: 0;
          padding: 20px;
          color: white;
          width: 100%;
        }

        .category-card-premium__badge {
          display: inline-block;
          background: var(--gotur-primary, #b79c5c);
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          margin-bottom: 10px;
        }

        .category-card-premium__title {
          font-size: 24px;
          margin-bottom: 8px;
          font-weight: 700;
        }

        .category-card-premium__title a {
          color: white;
          text-decoration: none;
        }

        .category-card-premium__link {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 13px;
          color: rgba(255,255,255,0.8);
          font-weight: 600;
          text-decoration: none;
          transition: color 0.2s;
        }

        .category-card-premium__link:hover {
          color: white;
        }

        .category-card-premium__subcategories {
          padding: 24px;
          background: white;
          flex-grow: 1;
        }

        .category-card-premium__sub-title {
          font-size: 14px;
          font-weight: 700;
          text-transform: uppercase;
          color: #888;
          letter-spacing: 0.05em;
          margin-bottom: 16px;
        }

        .category-card-premium__list {
          list-style: none;
          padding: 0;
          margin: 0;
          display: grid;
          grid-template-columns: 1fr;
          gap: 10px;
        }

        .category-card-premium__list li a {
          font-size: 15px;
          color: #444;
          text-decoration: none;
          transition: color 0.2s;
          font-weight: 500;
        }

        .category-card-premium__list li a:hover {
          color: var(--gotur-primary, #b79c5c);
        }

        .more-link a {
          font-size: 13px !important;
          color: #b79c5c !important;
          font-weight: 700 !important;
        }
      `}</style>

      <FooterOne />
    </Layout>
  );
}
