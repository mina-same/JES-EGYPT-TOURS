'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';

interface PaginationProps {
    currentPage?: number;
    totalPages?: number;
    onPageChange?: (page: number) => void;
    hrefForPage?: (page: number) => string;
}

const Pagination: React.FC<PaginationProps> = ({ 
    currentPage = 1, 
    totalPages = 1, 
    onPageChange = () => {},
    hrefForPage,
}) => {
    const { t } = useTranslation('common');
    // If totalPages is 1 or less (and not 0), we don't need to show pagination
    // But if it's exactly 1, we might want to hide it.
    if (totalPages <= 1) return null;

    const getPageNumbers = () => {
        const pages = [];
        const maxVisible = 5;
        
        if (totalPages <= maxVisible) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            let start = Math.max(1, currentPage - 2);
            const end = Math.min(totalPages, start + maxVisible - 1);
            
            if (end === totalPages) {
                start = Math.max(1, end - maxVisible + 1);
            }
            
            for (let i = start; i <= end; i++) pages.push(i);
        }
        return pages;
    };

    const control = (target: number, label: React.ReactNode, className: string, style: React.CSSProperties, current = false) => {
        const disabled = target < 1 || target > totalPages;
        const shared = {
            className,
            style: { ...style, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' } as React.CSSProperties,
            'aria-current': current ? 'page' as const : undefined,
        };
        if (hrefForPage && !disabled) {
            return <a href={hrefForPage(target)} aria-label={typeof label === 'number' ? t('pagination.page', { page: target }) : undefined} {...shared}>{label}</a>;
        }
        return <button type="button" onClick={() => !disabled && onPageChange(target)} disabled={disabled} aria-label={typeof label === 'number' ? t('pagination.page', { page: target }) : undefined} {...shared}>{label}</button>;
    };

    return (
        <ul className='post-pagination justify-content-center' aria-label={t('pagination.label')}>
            <li>
                {control(currentPage - 1, t('pagination.previous'), `previous ${currentPage === 1 ? 'disabled' : ''}`, {
                        border: '1px solid #eee', 
                        background: 'white',
                        padding: '8px 16px',
                        borderRadius: '4px',
                        marginRight: '8px',
                        cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                        opacity: currentPage === 1 ? 0.5 : 1
                    })}
            </li>
            
            {getPageNumbers().map(page => (
                <li key={page} className={currentPage === page ? 'active' : ''}>
                    {control(page, page, '', {
                            border: '1px solid #eee', 
                            background: currentPage === page ? 'var(--gotur-primary, #b79c5c)' : 'white',
                            color: currentPage === page ? 'white' : 'inherit',
                            width: '40px',
                            height: '40px',
                            borderRadius: '4px',
                            margin: '0 4px',
                            cursor: 'pointer',
                            fontWeight: currentPage === page ? 'bold' : 'normal'
                        }, currentPage === page)}
                </li>
            ))}

            <li>
                {control(currentPage + 1, t('pagination.next'), `next ${currentPage === totalPages ? 'disabled' : ''}`, {
                        border: '1px solid #eee', 
                        background: 'white',
                        padding: '8px 16px',
                        borderRadius: '4px',
                        marginLeft: '8px',
                        cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                        opacity: currentPage === totalPages ? 0.5 : 1
                    })}
            </li>
        </ul>
    );
};

export default Pagination;
