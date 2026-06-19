import React from "react";
import { Container } from "react-bootstrap";
import { Skeleton } from "@/components/ui/skeleton";

const TourListingDetailsOneSkeleton: React.FC = () => {
  return (
    <section className="tour-listing-details section-space">
      {/* Carousel skeleton */}
      <Skeleton className="w-100 rounded-0" style={{ height: "520px" }} />

      {/* Info bar skeleton */}
      <div style={{ background: "#f8f7f4", borderTop: "1px solid #e8e3d8", borderBottom: "1px solid #e8e3d8" }}>
        <Container fluid style={{ maxWidth: "1400px", padding: "0 20px" }}>
          <div className="d-flex align-items-center justify-content-between flex-wrap py-4" style={{ gap: "16px" }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="d-flex align-items-center" style={{ gap: "10px", minWidth: "120px" }}>
                <Skeleton className="rounded-circle flex-shrink-0" style={{ width: "40px", height: "40px" }} />
                <div>
                  <Skeleton className="mb-1" style={{ width: "60px", height: "12px" }} />
                  <Skeleton style={{ width: "90px", height: "16px" }} />
                </div>
              </div>
            ))}
          </div>
        </Container>
      </div>

      {/* Book with confidence skeleton */}
      <Container fluid style={{ maxWidth: "1400px", padding: "0 20px" }} className="info-area info-bg pb-3 py-4">
        <div className="row align-items-center">
          <div className="col-lg-4 mb-3 mb-lg-0">
            <Skeleton className="mb-2" style={{ width: "220px", height: "28px" }} />
            <Skeleton style={{ width: "280px", height: "16px" }} />
          </div>
          <div className="col-lg-8">
            <div className="d-flex justify-content-center align-items-center flex-wrap" style={{ gap: "20px" }}>
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="text-center" style={{ minWidth: "120px" }}>
                  <Skeleton className="rounded-circle mx-auto mb-2" style={{ width: "70px", height: "70px" }} />
                  <Skeleton className="mx-auto" style={{ width: "80px", height: "13px" }} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </Container>

      {/* Separator */}
      <div style={{ height: "1px", background: "linear-gradient(90deg, transparent, #e0e0e0, transparent)", margin: "40px 0" }} />

      <Container fluid style={{ maxWidth: "1400px", padding: "0 20px" }}>
        {/* Nav bar skeleton */}
        <div className="d-flex align-items-center" style={{ gap: "8px", borderBottom: "2px solid #f0f0f0", paddingBottom: "12px", marginBottom: "32px", overflowX: "auto" }}>
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="flex-shrink-0 rounded-pill" style={{ width: `${60 + (i % 3) * 20}px`, height: "32px" }} />
          ))}
        </div>

        {/* Main content row */}
        <div className="row gutter-y-30 tour-details-row">
          {/* Main col-lg-9 */}
          <div className="col-lg-9">
            <div className="tour-listing-details__content">

              {/* Description section */}
              <div className="mb-5">
                <div className="d-flex align-items-center gap-3 mb-4">
                  <div style={{ width: "5px", height: "32px", borderRadius: "4px", backgroundColor: "#e0d8c8" }} />
                  <Skeleton style={{ width: "280px", height: "28px" }} />
                </div>
                <Skeleton className="mb-2" style={{ width: "100%", height: "16px" }} />
                <Skeleton className="mb-2" style={{ width: "95%", height: "16px" }} />
                <Skeleton className="mb-2" style={{ width: "98%", height: "16px" }} />
                <Skeleton className="mb-2" style={{ width: "90%", height: "16px" }} />
                <Skeleton className="mb-2" style={{ width: "85%", height: "16px" }} />
                <Skeleton style={{ width: "70%", height: "16px" }} />

                {/* "What you will love" box */}
                <div className="mt-5 p-5 rounded-4" style={{ background: "rgba(183,156,92,0.06)", border: "1px solid rgba(183,156,92,0.15)" }}>
                  <Skeleton className="mb-3" style={{ width: "180px", height: "20px" }} />
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="mb-2" style={{ width: `${85 + (i % 3) * 5}%`, height: "15px" }} />
                  ))}
                </div>
              </div>

              {/* Highlights section */}
              <div className="mb-5">
                <div className="d-flex align-items-center gap-3 mb-4">
                  <div style={{ width: "5px", height: "32px", borderRadius: "4px", backgroundColor: "#e0d8c8" }} />
                  <Skeleton style={{ width: "160px", height: "28px" }} />
                </div>
                <div className="row">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="col-lg-4 col-md-6 mb-2">
                      <div className="d-flex align-items-center gap-2">
                        <Skeleton className="rounded-circle flex-shrink-0" style={{ width: "16px", height: "16px" }} />
                        <Skeleton style={{ width: "140px", height: "15px" }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tour plan section */}
              <div className="mb-5">
                <div className="d-flex align-items-center gap-3 mb-4">
                  <div style={{ width: "5px", height: "32px", borderRadius: "4px", backgroundColor: "#e0d8c8" }} />
                  <Skeleton style={{ width: "140px", height: "28px" }} />
                </div>
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="mb-3 p-4 rounded-3" style={{ border: "1px solid #f0ece3" }}>
                    <Skeleton className="mb-2" style={{ width: "200px", height: "20px" }} />
                    <Skeleton className="mb-1" style={{ width: "100%", height: "14px" }} />
                    <Skeleton style={{ width: "80%", height: "14px" }} />
                  </div>
                ))}
              </div>

              {/* Amenities section */}
              <div className="mb-5">
                <div className="d-flex align-items-center gap-3 mb-4">
                  <div style={{ width: "5px", height: "32px", borderRadius: "4px", backgroundColor: "#e0d8c8" }} />
                  <Skeleton style={{ width: "160px", height: "28px" }} />
                </div>
                <div className="row">
                  <div className="col-md-6">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="d-flex align-items-center gap-2 mb-2">
                        <Skeleton className="rounded-circle flex-shrink-0" style={{ width: "18px", height: "18px" }} />
                        <Skeleton style={{ width: "160px", height: "15px" }} />
                      </div>
                    ))}
                  </div>
                  <div className="col-md-6">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="d-flex align-items-center gap-2 mb-2">
                        <Skeleton className="rounded-circle flex-shrink-0" style={{ width: "18px", height: "18px" }} />
                        <Skeleton style={{ width: "130px", height: "15px" }} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Sidebar col-lg-3 */}
          <div className="col-lg-3">
            <div className="rounded-4 p-4" style={{ border: "1px solid #e8e3d8", background: "#fafaf8" }}>
              {/* Price */}
              <Skeleton className="mb-1" style={{ width: "80px", height: "14px" }} />
              <Skeleton className="mb-4" style={{ width: "140px", height: "36px" }} />

              {/* Date picker */}
              <Skeleton className="mb-1" style={{ width: "60px", height: "13px" }} />
              <Skeleton className="mb-3 rounded-2" style={{ width: "100%", height: "44px" }} />

              {/* Travelers */}
              <Skeleton className="mb-1" style={{ width: "70px", height: "13px" }} />
              <Skeleton className="mb-3 rounded-2" style={{ width: "100%", height: "44px" }} />

              {/* Pricing breakdown */}
              <div className="py-3 mb-3" style={{ borderTop: "1px solid #e8e3d8", borderBottom: "1px solid #e8e3d8" }}>
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="d-flex justify-content-between mb-2">
                    <Skeleton style={{ width: "80px", height: "14px" }} />
                    <Skeleton style={{ width: "60px", height: "14px" }} />
                  </div>
                ))}
              </div>

              {/* Total */}
              <div className="d-flex justify-content-between mb-4">
                <Skeleton style={{ width: "50px", height: "18px" }} />
                <Skeleton style={{ width: "80px", height: "18px" }} />
              </div>

              {/* CTA button */}
              <Skeleton className="rounded-2" style={{ width: "100%", height: "52px" }} />
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
};

export default TourListingDetailsOneSkeleton;
