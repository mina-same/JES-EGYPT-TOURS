"use client";
import React from 'react';
import NotFoundYet from '@/components/admin/NotFoundYet/NotFoundYet';

const SearchFormPage: React.FC = () => {
  return (
    <NotFoundYet 
      title="Search Forms"
      description="View and analyze search form submissions. Monitor what customers are looking for."
      icon="🔍"
    />
  );
};

export default SearchFormPage;
