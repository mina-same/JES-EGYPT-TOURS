"use client";

import React, { useState, useEffect } from "react";
import Select from "react-select";
import './langusgeSelect.css'

const options = [
  { value: "English", label: "English" },
  { value: "Hindi", label: "Hindi" },
  { value: "Malayalam", label: "Malayalam" },
  { value: "Japanese", label: "Japanese" },
  { value: "Belarusian", label: "Belarusian" },
];

const LanguageSelector: React.FC = () => {
  const [mounted, setMounted] = useState(false);
  const [selectedOption, setSelectedOption] = useState(options[0]);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div style={{ width: '120px', height: '40px' }} />;
  }

  return (
    <div className="top-one__language-sort" suppressHydrationWarning>
      <Select
        classNamePrefix="custom-select"
        value={selectedOption}
        onChange={(option) => setSelectedOption(option!)}
        options={options}
        isSearchable={false}
        components={{
          IndicatorSeparator: () => null, // removes the separator
        }}
        
      />
    </div>
  );
};

export default LanguageSelector;
