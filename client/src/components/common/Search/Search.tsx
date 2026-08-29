"use client";

import useStore from "@/store/useStore";
import React, { useEffect, useState, FormEvent } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getLocaleFromPath } from "@/lib/url";
import { useTranslation } from "react-i18next";

const Search: React.FC = () => {
  const { t } = useTranslation("common");
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const locale = getLocaleFromPath(pathname);
  const {
    changeSearchPopupStatus,
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
            type='search'
            id='search'
            name='search'
            aria-label={t("search.submit")}
            placeholder={t("search.placeholder")}
          />
          <button
            type='submit'
            aria-label={t("search.submit")}
            className='gotur-btn'
          >
            <i className='icon-search' aria-hidden='true'></i>

            <span></span>
          </button>
        </form>
      </div>
    </div>
  );
};

export default Search;
