"use client";
import React from 'react';
import NotFoundYet from '@/components/admin/NotFoundYet/NotFoundYet';

const ContactFormPage: React.FC = () => {
  return (
    <NotFoundYet 
      title="Contact Forms"
      description="Manage general contact form submissions. Respond to customer inquiries and feedback."
      icon="📞"
    />
  );
};

export default ContactFormPage;
