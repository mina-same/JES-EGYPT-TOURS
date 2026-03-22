"use client";

import React from "react";
import { useTranslation } from "react-i18next";
import PageHeader from "@/components/sections/PageHeader/PageHeader";

interface LocalizedPageHeaderProps {
  namespace?: string;
  titleKey: string;
  subTitleKey: string;
}

export default function LocalizedPageHeader({
  namespace = "blogs",
  titleKey,
  subTitleKey,
}: LocalizedPageHeaderProps) {
  const { t } = useTranslation(namespace);
  
  return <PageHeader title={t(titleKey)} subTitle={t(subTitleKey)} />;
}
