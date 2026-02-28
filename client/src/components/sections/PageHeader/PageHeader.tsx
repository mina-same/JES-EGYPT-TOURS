import React from 'react';
import bg from '@/assets/images/backgrounds/page-header-bg-1-1.jpg'
import Link from 'next/link';

type BreadcrumbItem = {
  label: string;
  href?: string;
};
interface PageHeaderProps {
   title?: string;
   subTitle?: string;
   bgImage?: string;
   breadcrumbs?: BreadcrumbItem[];
    
  }
const PageHeader: React.FC<PageHeaderProps> = ({title, subTitle, bgImage, breadcrumbs}) => {
    const backgroundImage = bgImage || bg.src;
    
    return (
        <section className="page-header">
            <div className="page-header__bg" style={{backgroundImage: `url(${backgroundImage})`}}></div>
            <div className="container">
                <div className="page-header__content">
                    <h2 className="page-header__title bw-split-in-right">{title}</h2>
                    <ul className="gotur-breadcrumb list-unstyled">
                        <li><Link href="/">Home</Link></li>
                        {Array.isArray(breadcrumbs) && breadcrumbs.length > 0 ? (
                          breadcrumbs.map((item, idx) => (
                            <li key={`${item.label}-${idx}`}>
                              {item.href ? <Link href={item.href}>{item.label}</Link> : <span>{item.label}</span>}
                            </li>
                          ))
                        ) : (
                          <li><span>{subTitle}</span></li>
                        )}
                    </ul>
                </div>
            </div>
        </section>
    );
};

export default PageHeader;