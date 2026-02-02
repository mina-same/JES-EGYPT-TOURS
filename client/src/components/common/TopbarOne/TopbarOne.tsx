"use client";

import React, { useEffect, useState } from "react";
import { Container } from "react-bootstrap";
import { topbarOne } from "@/data/topbarOne";

import Link from "next/link";
import LanguageSelector from "../LanguageSelector/LanguageSelector";

interface ContactInfoItem {
  type: string;
  iconClass: string;
  label: string;
  href: string;
}
interface ContactInfoItemTwo {
  type: string;
  iconClass: string;
  label: string;
  href: string;
}

interface AddressInfo {
  iconClass: string;
  label: string;
  href: string;
}

interface TopbarOneData {
  contactInfo: ContactInfoItem[];
  contactInfoTwo: ContactInfoItemTwo[];
  address: AddressInfo;
}
interface TopbarOneProps {
  extraClass?: string;
}

const TopbarOne: React.FC<TopbarOneProps> = ({ extraClass }) => {
  const { contactInfo, contactInfoTwo, address }: TopbarOneData =
    topbarOne;

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className={`top-one ${extraClass || ""}`} suppressHydrationWarning>
      <Container fluid>
        <div className='top-one__inner' suppressHydrationWarning>
          {/* Contact Info */}
          <ul className='list-unstyled top-one__info'>
            {extraClass === "top-one--two"
              ? contactInfo.map((item: ContactInfoItem, index) => (
                  <li className='top-one__info__item special' key={index}>
                    <i className={item.iconClass}></i>
                    <Link href={item.href}>{item.label}</Link>
                  </li>
                ))
              : contactInfoTwo.map((item: ContactInfoItemTwo, index) => (
                  <li className='top-one__info__item' key={index}>
                    <i className={item.iconClass}></i>
                    <Link href={item.href}>{item.label}</Link>
                  </li>
                ))}
          </ul>

          <div className='top-one__right' suppressHydrationWarning>
            {/* Address Section */}
            {extraClass === "top-one--two" ? (
              <div className='top-one__info__item'>
                <i className={address.iconClass}></i>
                <Link href={address.href}>{address.label}</Link>
              </div>
            ) : (
              mounted ? <LanguageSelector /> : <div style={{ width: '120px', height: '40px' }} />
            )}

            {/* Links Section */}
            <div className='top-one__social' suppressHydrationWarning>
              <Link href='/faq'>FAQ</Link>
              <Link href='/about'>About</Link>
              <Link href='/contact'>Contact</Link>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
};

export default TopbarOne;
