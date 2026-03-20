'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { videoReviewService, VideoReviewItem } from '@/services/videoReviewService';
import VideoReviewForm from '@/components/admin/VideoReviewForm';
import { useToast } from '@/hooks/use-toast';

export default function EditVideoReviewPage() {
  const { id } = useParams();
  const { toast } = useToast();
  const [item, setItem] = useState<VideoReviewItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchItem = async () => {
      try {
        setLoading(true);
        const data = await videoReviewService.getById(id as string);
        if (data) {
          setItem(data);
        } else {
          toast({
            title: 'Error',
            description: 'Video review not found',
            variant: 'destructive',
          });
        }
      } catch (err: any) {
        toast({
          title: 'Error',
          description: err.message || 'Failed to fetch video review',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchItem();
  }, [id, toast]);

  if (loading) {
    return (
      <div className='flex items-center justify-center min-h-[400px]'>
        <Loader2 className='animate-spin text-[#b79c5c]' size={48} />
      </div>
    );
  }

  if (!item) return null;

  return <VideoReviewForm initialData={item} isEdit />;
}
