"use client";
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import PageSkeleton from '@/components/admin/PageSkeleton';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !isLoading) {
      // Not authenticated - redirect to login
      if (!isAuthenticated) {
        router.push('/login');
        return;
      }
    }
  }, [mounted, isAuthenticated, isLoading, router]);

  // Determine skeleton variant based on pathname
  const getSkeletonVariant = (path: string): 'dashboard' | 'list' | 'form' | 'blog-edit' | 'blog-create' | 'tour-edit' | 'tour-create' | 'category-edit' | 'category-create' | 'subcategory-edit' | 'subcategory-create' | 'list' => {
    if (path === '/admin') return 'dashboard';
    
    // Blog pages
    if (path.includes('/admin/blogs/blog')) {
      if (path.includes('/new')) return 'blog-create';
      if (path.includes('/edit') || path.match(/\/admin\/blogs\/blog\/[^/]+$/)) return 'blog-edit';
      return 'list';
    }
    
    // Tour pages
    if (path.includes('/admin/tour/tour')) {
      if (path.includes('/new')) return 'tour-create';
      if (path.includes('/edit') || path.match(/\/admin\/tour\/tour\/[^/]+$/)) return 'tour-edit';
      return 'list';
    }
    
    // Category pages
    if (path.includes('/admin/tour/category')) {
      if (path.includes('/new') || path.includes('?id=')) return 'category-create';
      return 'list';
    }
    
    // Subcategory pages
    if (path.includes('/admin/tour/subcategory')) {
      if (path.includes('/new') || path.includes('?id=')) return 'subcategory-create';
      return 'list';
    }
    
    // Default to list for other pages
    return 'list';
  };

  // Show loading state with appropriate skeleton
  if (isLoading || !mounted) {
    return <PageSkeleton variant={getSkeletonVariant(pathname)} />;
  }

  // Not authenticated
  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
