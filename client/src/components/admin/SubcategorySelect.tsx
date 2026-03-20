'use client';

import React from 'react';
import Select, { components, StylesConfig, OptionProps, SingleValueProps } from 'react-select';
import { ITourSubcategory } from '@/types/tour';

interface SubcategoryOption {
  value: string;
  label: string;
  imageUrl?: string;
}

interface SubcategorySelectProps {
  subcategories: ITourSubcategory[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const CustomOption = (props: OptionProps<SubcategoryOption>) => {
  return (
    <components.Option {...props}>
      <div className="flex items-center gap-3">
        {props.data.imageUrl ? (
          <img 
            src={props.data.imageUrl} 
            alt={props.data.label} 
            className="w-10 h-10 rounded-md object-cover border border-gray-200" 
          />
        ) : (
          <div className="w-10 h-10 rounded-md bg-gray-100 flex items-center justify-center text-gray-400 text-xs border border-gray-200">
            No Img
          </div>
        )}
        <span className="font-medium">{props.data.label}</span>
      </div>
    </components.Option>
  );
};

const CustomSingleValue = (props: SingleValueProps<SubcategoryOption>) => {
  return (
    <components.SingleValue {...props}>
      <div className="flex items-center gap-2">
        {props.data.imageUrl && (
          <img 
            src={props.data.imageUrl} 
            alt={props.data.label} 
            className="w-6 h-6 rounded object-cover border border-gray-200" 
          />
        )}
        <span>{props.data.label}</span>
      </div>
    </components.SingleValue>
  );
};

const SubcategorySelect: React.FC<SubcategorySelectProps> = ({
  subcategories,
  value,
  onChange,
  placeholder = 'Select a subcategory',
}) => {
  const options: SubcategoryOption[] = subcategories.map((sub) => {
    // Handle localized name object or legacy string
    const label = typeof sub.name === 'object' 
      ? (sub.name.en || sub.name.de || sub.name.it || 'Unnamed Subcategory')
      : (sub.name || 'Unnamed Subcategory');
      
    return {
      value: sub._id,
      label: label,
      imageUrl: sub.image?.url,
    };
  });

  const selectedOption = options.find((opt) => opt.value === value) || null;

  const customStyles: StylesConfig<SubcategoryOption, false> = {
    control: (provided, state) => ({
      ...provided,
      minHeight: '44px', // Match standard input height
      backgroundColor: 'var(--background)',
      paddingLeft: '4px',
      paddingRight: '4px',
      fontSize: '14px',
      borderRadius: 'calc(var(--radius) - 2px)',
      borderColor: 'hsl(var(--input))',
      boxShadow: 'none',
      '&:hover': {
        borderColor: 'hsl(var(--input))',
      },
    }),
    menu: (provided) => ({
      ...provided,
      zIndex: 50,
      backgroundColor: 'hsl(var(--popover))',
      color: 'hsl(var(--popover-foreground))',
      border: '1px solid hsl(var(--border))',
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected 
        ? 'hsl(var(--primary))' 
        : state.isFocused 
          ? 'hsl(var(--accent))' 
          : 'transparent',
      color: state.isSelected 
        ? 'hsl(var(--primary-foreground))' 
        : state.isFocused 
          ? 'hsl(var(--accent-foreground))' 
          : 'inherit',
      cursor: 'pointer',
      padding: '8px 12px',
    }),
    singleValue: (provided) => ({
      ...provided,
      color: 'hsl(var(--foreground))',
    }),
    input: (provided) => ({
      ...provided,
      color: 'hsl(var(--foreground))',
    }),
  };

  return (
    <Select
      options={options}
      value={selectedOption}
      onChange={(opt) => onChange(opt?.value || '')}
      placeholder={placeholder}
      styles={customStyles}
      components={{
        Option: CustomOption,
        SingleValue: CustomSingleValue,
      }}
      isSearchable
      isClearable
      className="react-select-container"
      classNamePrefix="react-select"
    />
  );
};

export default SubcategorySelect;
