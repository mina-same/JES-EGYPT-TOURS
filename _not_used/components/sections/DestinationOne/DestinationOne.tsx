"use client";

import Image from "next/image";

import { Container, Row, Col } from "react-bootstrap";
import React from "react";

import destinationOneData from "@/data/destinationOneData";
import Link from "next/link";
import Pagination from "@/components/common/Pagination/Pagination";

const DestinationOne = () => {
  interface DestinationItem {
    name: string;
    image: any; // You can refine to StaticImageData if needed
    link: string;
  }

  return (
    <section className='destination-one section-space'>
      <Container>
        <Row className='gutter-y-20 gutter-x-20'>
          {destinationOneData.map(
            (destination: DestinationItem, index: number) => (
              <Col
                xl={3}
                lg={4}
                md={4}
                sm={6}
                key={index}
                className='wow fadeInUp'
                data-wow-duration='1500ms'
                data-wow-delay={`${100 + (index % 4) * 200}ms`}
              >
                <div className='destination-card-one'>
                  <div className='destination-card-one__thumb'>
                    <Image
                      src={destination.image}
                      alt={destination.name}
                      className='img-fluid'
                    />
                    <Link
                      href={destination.link}
                      className='destination-card-one__overly'
                    />
                  </div>
                  <div className='destination-card-one__content'>
                    <h3 className='destination-card-one__title'>
                      <Link href={destination.link}>{destination.name}</Link>
                    </h3>
                  </div>
                </div>
              </Col>
            )
          )}
          <Col xs={12}>
            <Pagination />
          </Col>
        </Row>
      </Container>
    </section>
  );
};

export default DestinationOne;
