"use client";

import useStore from "@/store/useStore";
import React, { useEffect, useState, FormEvent } from "react";
import { usePathname, useRouter } from "next/navigation";

const LOCALES = ["en", "de", "it", "es"];

const getLocaleFromPath = (pathname: string | null): string => {
  const seg = (pathname || "/").split("/")[1];
  return LOCALES.includes(seg) ? seg : "en";
};

const Search: React.FC = () => {
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const locale = getLocaleFromPath(pathname);
  const {
    changeSearchPopupStatus,
    changeMobileDrawerStatus,
    changeSideBarDrawerStatus,
    searchPopupStatus,
  } = useStore();
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSearch = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const raw = formData.get("search");
    const q = typeof raw === "string" ? raw.trim() : "";
    const url = q ? `/${locale}/search?q=${encodeURIComponent(q)}` : `/${locale}/search`;
    router.push(url);
    changeSearchPopupStatus();
  };

  if (!mounted) {
    return null;
  }

  return (
    <div className={`search-popup ${searchPopupStatus ? " active" : ""}`}>
      <div
        onClick={(e) => {
          e.preventDefault();
          changeSearchPopupStatus();
        }}
        className='search-popup__overlay search-toggler'
      ></div>

      <div className='search-popup__content'>
        <form onSubmit={handleSearch} className='search-popup__form' action='#'>
          <input
            type='text'
            id='search'
            name='search'
            placeholder='Search Here...'
          />
          <button
            type='submit'
            aria-label='search submit'
            className='gotur-btn'
          >
            <i className='icon-search'></i>

            <span></span>
          </button>
        </form>
      </div>
    </div>
  );
};

export default Search;
