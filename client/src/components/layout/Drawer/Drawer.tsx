"use client";
import React, { useState } from "react";
import useStore from "@/store/useStore";
import Link from "next/link";
import Image, { StaticImageData } from "next/image";
import logo from "@/assets/images/logo-light.png";
import { demoPages } from "@/data/demoPages";
import { Col, Container, Row } from "react-bootstrap";
import { useHeaderMenu } from "@/hooks/useHeaderMenu";

interface SubMenu {
  id: number;
  title: string;
  link?: string;
  subMenu?: SubMenu[];
}

interface NavItem {
  id: number;
  title: string;
  link?: string;
  subMenu?: SubMenu[];
}

interface Page {
  image: StaticImageData;
  title: string;
  isNew?: boolean;
  multiPageLink?: string;
  onePageLink?: string;
  darkPageLink?: string;
  viewPageLink?: string;
}

const Drawer: React.FC = () => {
  const [isMegaMenu, setIsMegaMenu] = useState(false);
  const [isHomeDrop, setIsHomeDrop] = useState(false);
  const {
    mobileDrawerStatus,
    changeMobileDrawerStatus,
    setMobileDrawerStatus,
  } = useStore();
  const { menu } = useHeaderMenu('header-main');
  const [isItems, setIsItems] = useState<number | null>(null);
  const [isSubItems, setIsSubItems] = useState<number | null>(null);
  const [openNavItemId, setOpenNavItemId] = useState<number | null>(null);
  const [openSubItemId, setOpenSubItemId] = useState<number | null>(null);
  const toggleDropdown = (itemId: number) => {
    setIsItems((prevItem) => (prevItem === itemId ? null : itemId));
    setOpenNavItemId((prev) => (prev === itemId ? null : itemId));

    console.log(itemId);
  };

  const toggleSubItemDropdown = (subItemId: number) => {
    setIsSubItems((prevSubItem) =>
      prevSubItem === subItemId ? null : subItemId
    );
    setOpenSubItemId((prev) => (prev === subItemId ? null : subItemId));
  };

  const toggleMegaMenu = () => {
    setIsMegaMenu(!isMegaMenu);
  };
  const toggleHomeDrop = () => {
    setIsHomeDrop(!isMegaMenu);
  };

  return (
    <div
      className={`mobile-nav__wrapper ${mobileDrawerStatus ? "expanded" : ""}`}
    >
      <div
        className='mobile-nav__overlay'
        onClick={changeMobileDrawerStatus}
      ></div>
      <div
        className={`mobile-nav__content ${
          isMegaMenu ? "megamenu-popup-active" : ""
        }`}
      >
        <span className='mobile-nav__close' onClick={changeMobileDrawerStatus}>
          <i className='fa fa-times'></i>
        </span>

        <div className='logo-box'>
          <Link href='/' aria-label='logo image'>
            <Image src={logo} width={155} height={41} alt='logo' />
          </Link>
        </div>

        <div className='mobile-nav__container'>
          <ul className='main-menu__list'>
            <li className={`megamenu  ${isMegaMenu ? "current" : ""}`}>
              <Link
                href=''
                onClick={(e) => {
                  e.preventDefault();
                  toggleMegaMenu();
                }}
              >
                Home
                <button
                  onClick={toggleHomeDrop}
                  className={`${isHomeDrop ? "expanded" : ""}`}
                >
                  <i className='fa fa-angle-down'></i>
                </button>
              </Link>
              <ul className={`${isHomeDrop ? "open " : ""} close`}>
                <li>
                  <section className='home-showcase'>
                    <Container>
                      <div className='home-showcase__inner'>
                        <Row>
                          {demoPages.map((page: Page, index: number) => (
                            <Col lg={3} md={6} key={index}>
                              <div className='demo-one__card'>
                                <div className='demo-one__image'>
                                  <Image
                                    src={page.image}
                                    alt={`gotur image ${page.title}`}
                                  />
                                  <div className='demo-one__btns'>
                                    {page.multiPageLink && (
                                      <Link
                                        href={page.multiPageLink}
                                        className='gotur-btn demo-one__btn'
                                      >
                                        Multi Page
                                      </Link>
                                    )}
                                    {page.onePageLink && (
                                      <Link
                                        href={page.onePageLink}
                                        className='gotur-btn demo-one__btn'
                                      >
                                        One Page
                                      </Link>
                                    )}
                                  </div>
                                </div>
                                <div className='demo-one__content'>
                                  <h3 className='demo-one__title'></h3>
                                </div>
                              </div>
                            </Col>
                          ))}
                        </Row>
                      </div>
                    </Container>
                  </section>
                </li>
              </ul>
            </li>

            {(Array.isArray(menu?.items) ? (menu!.items as any[]) : []).map((item: any, idx: number) => (
              (() => {
                const children = item.children || item.subMenu;
                const hasChildren = Array.isArray(children) && children.length > 0;
                return (
              <li
                key={item._id || item.id || `${item.label || item.title}-${idx}`}
                className={`${hasChildren ? "dropdown" : ""} ${
                  isItems === idx ? "open" : ""
                }`}
              >
                <Link
                  href={item.url || item.link || "#"}
                  className={`${isItems === idx ? "expanded" : ""}`}
                >
                  {item.label || item.title}
                  {hasChildren && (
                    <button
                      onClick={() => toggleDropdown(idx)}
                      className={`${isItems === idx ? "expanded" : ""}`}
                    >
                      <i className='fa fa-angle-down'></i>
                    </button>
                  )}
                </Link>

                {hasChildren ? (
                  <ul
                    className={`close ${openNavItemId === idx ? "open" : ""}`}
                  >
                    {children.map((subMenu: any, sidx: number) => (
                    <li
                      key={subMenu._id || subMenu.id || `${subMenu.label || subMenu.title}-${sidx}`}
                      className={`${(subMenu.children || subMenu.subMenu) ? "dropdown" : ""} ${
                        isSubItems === sidx ? "open" : ""
                      }`}
                    >
                      <div className=' main-menu__list__wrapper'>
                        <Link
                          href={subMenu.url || subMenu.link || "#"}
                          className={`${isSubItems === sidx ? "expanded" : ""}`}
                        >
                          {subMenu.label || subMenu.title}{" "}
                        </Link>
                        {(subMenu.children || subMenu.subMenu) && (
                          <button
                            onClick={() => toggleSubItemDropdown(sidx)}
                            className={`${isSubItems === sidx ? "expanded" : ""}`}
                          >
                            <i className='fa fa-angle-down'></i>
                          </button>
                        )}
                      </div>

                      <ul
                        className={`close ${openSubItemId === sidx ? "open" : ""}`}
                      >
                        {(subMenu.children || subMenu.subMenu)?.map((subSubItem: any, ssidx: number) => (
                          <li key={subSubItem._id || subSubItem.id || `${subSubItem.label || subSubItem.title}-${ssidx}`}>
                            <Link href={subSubItem.url || subSubItem.link || "#"}>
                              {subSubItem.label || subSubItem.title}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </li>
                  ))}
                  </ul>
                ) : null}
              </li>
                );
              })()
            ))}
          </ul>
        </div>

        <ul className='mobile-nav__contact list-unstyled'>
          <li>
            <span className='mobile-nav__contact__icon'>
              <i className='fa fa-envelope'></i>
            </span>
            <Link href='mailto:needhelp@gotur.com'>needhelp@gotur.com</Link>
          </li>
          <li>
            <span className='mobile-nav__contact__icon'>
              <i className='fa fa-phone-alt'></i>
            </span>
            <Link href='tel:+9156980036420'>+91 5698 0036 420</Link>
          </li>
        </ul>

        <div className='mobile-nav__social'>
          <Link href='https://facebook.com'>
            {" "}
            <i className='icon-facebook' aria-hidden='true'></i>{" "}
            <span className='sr-only'>Facebook</span>
          </Link>
          <Link href='https://twitter.com'>
            {" "}
            <i className='icon-twitter' aria-hidden='true'></i>{" "}
            <span className='sr-only'>Twitter</span>
          </Link>
          <Link href='https://instagram.com'>
            {" "}
            <i className='icon-linkedin' aria-hidden='true'></i>{" "}
            <span className='sr-only'>Linked In</span>
          </Link>
          <Link href='https://youtube.com'>
            {" "}
            <i className='icon-youtube' aria-hidden='true'></i>{" "}
            <span className='sr-only'>Youtube</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Drawer;
