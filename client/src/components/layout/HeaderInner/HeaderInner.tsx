"use client";
import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { navItems } from "@/data/navItems";
import main_logo from "@/assets/images/logo-dark.png";
import { usePathname } from "next/navigation";
import useStore from "@/store/useStore";
import MegaMenu from "@/components/common/MegaMenu/MegaMenu";
interface NavItem {
  id: number;
  title: string;
  link?: string;
  subMenu?: NavItem[];
}

const HeaderInner: React.FC = () => {
  const pathname = usePathname();
  const [isMegaMenu, setIsMegaMenu] = useState<boolean>(false);
  const { changeSearchPopupStatus, changeMobileDrawerTwoStatus } = useStore();
  const renderSubMenu = (subMenu: NavItem[]) => (
    <ul className=''>
      {subMenu.map((item: any, index: number) => (
        <li key={index} className={item.subMenu ? "dropdown" : ""}>
          <Link href={item.link}>{item.title}</Link>
          {item.subMenu && renderSubMenu(item.subMenu)}
        </li>
      ))}
    </ul>
  );
  const handelClick = () => {
    changeMobileDrawerTwoStatus();
  };

  return (
    <header className='main-header main-header--two sticky-header sticky-header--normal'>
      <div className='container-fluid'>
        <div className='main-header__inner'>
          <div className='main-header__logo logo-retina'>
            <Link href='/'>
              <Image
                src={main_logo}
                alt='gotur NextJs'
                width='80'
                height='25'
                style={{ height: 'auto' }}
              />
            </Link>
          </div>

          <nav className='main-header__nav main-menu'>
            <ul className='main-menu__list'>
              {/* Render Home menu with showcase */}
              <li
                className={`megamenu megamenu-clickable ${
                  pathname === "/" ? "current" : ""
                }`}
              >
                <Link
                  href='#'
                  onClick={(e) => {
                    e.preventDefault();
                    setIsMegaMenu(!isMegaMenu);
                  }}
                >
                  Demos
                </Link>
                <MegaMenu
                  setIsMegaMenu={setIsMegaMenu}
                  isMegamenu={isMegaMenu}
                />
              </li>

              {navItems.map((item: NavItem) => (
                <li
                  className={`${item.subMenu ? "dropdown" : ""} ${
                    item.link && pathname.includes(item.link) ? "current" : ""
                  }`}
                  key={item.id}
                >
                  <Link href={item.link || "#"}>{item.title}</Link>
                  {item.subMenu && renderSubMenu(item.subMenu)}
                </li>
              ))}
            </ul>
          </nav>
          <div className='main-header__right'>
            <div className='main-header__info'>
              <Link
                onClick={(e) => {
                  e.preventDefault();
                  changeSearchPopupStatus();
                }}
                href='#'
                className='search-toggler main-header__info__item'
              >
                <i
                  className='icon-search-interface-symbol'
                  aria-hidden='true'
                ></i>
                <span className='sr-only'>Search</span>
              </Link>
              <Link href='cart' className='main-header__info__item'>
                <i className='icon-shopping-carts' aria-hidden='true'></i>
                <span className='sr-only'>Cart</span>
              </Link>
            </div>

            <Link href='contact' className='gotur-btn main-header__btn'>
              Tailor-Made <i className='icon-paper-plane'></i>
            </Link>
            <div className='main-header__call'>
              <div className='main-header__call__icon'>
                <i className='icon-telephone'></i>
              </div>
              <div className='main-header__call__content'>
                <span className='main-header__call__subtitle'>Call Us Now</span>
                <Link href='tel:+201007437271'>+20 100 743 7271</Link>
              </div>
            </div>
            <div
              className='mobile-nav__btn mobile-nav__toggler'
              onClick={handelClick}
            >
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>

          {/*  
             <div className="main-header__btn-popup main-header__element__btn" onClick={changeSideBarDrawerStatus}>
               <i className="icon-menu-bar"></i>
             </div>
 
             <Link href="contact" className="gotur-btn main-header__btn">
               Tailor-Made <i className="icon-paper-plane"></i>
             </Link> */}
        </div>
      </div>
    </header>
  );
};

export default HeaderInner;
