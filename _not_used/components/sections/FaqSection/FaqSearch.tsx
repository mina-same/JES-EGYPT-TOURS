"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { Search, X } from 'lucide-react';
import { FAQ } from '@/services/faqService';

// Custom debounce implementation
function useDebounce<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  
  const debouncedCallback = useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => callback(...args), delay);
    },
    [callback, delay]
  ) as T;
  
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);
  
  return debouncedCallback;
}

interface FaqSearchProps {
  faqs: FAQ[];
  onFilteredFaqs: (faqs: FAQ[]) => void;
  onSearchTerm: (term: string) => void;
}

const FaqSearch: React.FC<FaqSearchProps> = ({ faqs, onFilteredFaqs, onSearchTerm }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // Debounced search function
  const debouncedSearch = useDebounce((term: string) => {
    if (!term.trim()) {
      onFilteredFaqs(faqs);
      return;
    }

    setIsSearching(true);
    const lowerTerm = term.toLowerCase();
    
    // Filter FAQs based on search term
    const filtered = faqs.filter(faq => {
      return (
        faq.question.toLowerCase().includes(lowerTerm) ||
        faq.answer.toLowerCase().includes(lowerTerm) ||
        (faq.category?.toLowerCase().includes(lowerTerm))
      );
    });
    
    onFilteredFaqs(filtered);
    onSearchTerm(term);
    setIsSearching(false);
  }, 300);

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    debouncedSearch(value);
  };

  // Clear search
  const clearSearch = () => {
    setSearchTerm('');
    onFilteredFaqs(faqs);
    onSearchTerm('');
  };

  return (
    <div className="faq-search mb-4">
      <div className="position-relative">
        <span className="position-absolute top-50 translate-middle-y" style={{ left: 16 }}>
          <Search className="h-4 w-4 text-muted" />
        </span>
        <input
          type="text"
          className="form-control"
          style={{ paddingLeft: 42, paddingRight: 42, height: 52 }}
          placeholder="Search FAQs..."
          value={searchTerm}
          onChange={handleSearchChange}
        />
        {searchTerm && (
          <button
            type="button"
            className="btn btn-link position-absolute top-50 translate-middle-y p-0"
            style={{ right: 16 }}
            onClick={clearSearch}
            aria-label="Clear search"
          >
            <X className="h-4 w-4 text-muted" />
          </button>
        )}
        {isSearching && (
          <span className="position-absolute top-50 translate-middle-y" style={{ right: 44 }}>
            <span className="spinner-border spinner-border-sm text-muted" role="status" />
          </span>
        )}
      </div>
    </div>
  );
};

export default FaqSearch;
