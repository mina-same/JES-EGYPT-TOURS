import React from 'react';

interface PaginationProps {
    currentPage?: number;
    totalPages?: number;
    onPageChange?: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({ 
    currentPage = 1, 
    totalPages = 1, 
    onPageChange = () => {} 
}) => {
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

    return (
        <ul className='post-pagination justify-content-center'>
            <li>
                <button 
                    type="button"
                    className={`previous ${currentPage === 1 ? 'disabled' : ''}`}
                    onClick={() => currentPage > 1 && onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    style={{ 
                        border: '1px solid #eee', 
                        background: 'white',
                        padding: '8px 16px',
                        borderRadius: '4px',
                        marginRight: '8px',
                        cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                        opacity: currentPage === 1 ? 0.5 : 1
                    }}
                >
                    Previous
                </button>
            </li>
            
            {getPageNumbers().map(page => (
                <li key={page} className={currentPage === page ? 'active' : ''}>
                    <button 
                        type="button"
                        onClick={() => onPageChange(page)}
                        style={{ 
                            border: '1px solid #eee', 
                            background: currentPage === page ? 'var(--gotur-primary, #b79c5c)' : 'white',
                            color: currentPage === page ? 'white' : 'inherit',
                            width: '40px',
                            height: '40px',
                            borderRadius: '4px',
                            margin: '0 4px',
                            cursor: 'pointer',
                            fontWeight: currentPage === page ? 'bold' : 'normal'
                        }}
                    >
                        {page}
                    </button>
                </li>
            ))}

            <li>
                <button 
                    type="button"
                    className={`next ${currentPage === totalPages ? 'disabled' : ''}`}
                    onClick={() => currentPage < totalPages && onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    style={{ 
                        border: '1px solid #eee', 
                        background: 'white',
                        padding: '8px 16px',
                        borderRadius: '4px',
                        marginLeft: '8px',
                        cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                        opacity: currentPage === totalPages ? 0.5 : 1
                    }}
                >
                    Next
                </button>
            </li>
        </ul>
    );
};

export default Pagination;