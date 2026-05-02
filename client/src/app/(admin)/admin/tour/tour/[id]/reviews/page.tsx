'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { reviewsAPI, Comment } from '@/lib/api/reviews';
import { tourAPI } from '@/lib/api/tour';
import { uploadAPI } from '@/lib/api/upload';
import { Loader2, ArrowLeft, Check, X, Trash2, Star, User, Plus, Upload } from 'lucide-react';
import Image from 'next/image';
import ConfirmDeleteModal from '@/components/admin/ConfirmDeleteModal';
import { useToast } from '@/hooks/use-toast';
import ReviewAvatar from '@/components/common/ReviewAvatar';

export default function TourReviewsPage() {
  const params = useParams();
  // Helper for initials
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const router = useRouter();
  const { toast } = useToast();
  const id = params.id as string;

  const [reviews, setReviews] = useState<Comment[]>([]);
  // ... (keeping state definitions if I am not replacing them, but I need to be careful about matching)
  // Actually, I can just replace the top part of the function body.

  const [loading, setLoading] = useState(true);
  const [tourName, setTourName] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Add Review Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [newReview, setNewReview] = useState({
    name: '',
    email: '',
    rating: 5,
    comment: '',
    status: 'approved' as 'approved' | 'pending' | 'rejected',
    avatar: ''
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [tourRes, reviewsRes] = await Promise.all([
        tourAPI.getById(id),
        reviewsAPI.getAdminReviews({ tourId: id })
      ]);

      if (tourRes.success && tourRes.data) {
        const heading = tourRes.data.heading;
        setTourName((typeof heading === 'object' ? heading.en : heading) || tourRes.data.name || '');
      }

      if (reviewsRes.success) {
        setReviews(reviewsRes.data);
      }
    } catch (error) {
       console.error("Error fetching data", error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (reviewId: string, status: 'approved' | 'rejected') => {
    try {
        await reviewsAPI.updateStatus(reviewId, status);
        fetchData(); // Refresh
    } catch (error) {
        alert("Failed to update status");
    }
  };

  const deleteReivew = async (reviewId: string) => {
    setDeleteId(reviewId);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    setDeleteBusy(true);
    try {
      await reviewsAPI.deleteReview(deleteId);
      toast({
        title: 'Deleted',
        description: 'Review deleted successfully.',
        variant: 'success',
      });
      setDeleteModalOpen(false);
      setDeleteId(null);
      fetchData();
    } catch (error: any) {
      toast({
        title: 'Delete failed',
        description: error?.message || 'Failed to delete review',
        variant: 'destructive',
      });
    } finally {
      setDeleteBusy(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const res = await uploadAPI.uploadFile(file);
      if (res.success && res.data.url) {
        setNewReview(prev => ({ ...prev, avatar: res.data.url }));
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      alert("Failed to upload avatar");
    } finally {
      setIsUploading(false);
    }
  };

  const handleAddReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // 1. Create the review (defaults to pending)
      const res = await reviewsAPI.submitReview({
        tourId: id,
        name: newReview.name,
        email: newReview.email,
        rating: newReview.rating,
        comment: newReview.comment,
        avatar: newReview.avatar
      });

      // 2. If status is NOT pending (e.g. Approved), update it immediately
      if (res.success && res.data && newReview.status !== 'pending') {
         await reviewsAPI.updateStatus(res.data._id, newReview.status);
      }

      setIsAddModalOpen(false);
      setNewReview({
        name: '',
        email: '',
        rating: 5,
        comment: '',
        status: 'approved',
        avatar: ''
      });
      fetchData(); // Refresh list
    } catch (error) {
      console.error("Error adding review:", error);
      alert("Failed to add review. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (id) fetchData();
  }, [id]);

  const filteredReviews = statusFilter === 'all' 
    ? reviews 
    : reviews.filter(r => r.status === statusFilter);

  // Group by status for counts
  const counts = {
      all: reviews.length,
      pending: reviews.filter(r => r.status === 'pending').length,
      approved: reviews.filter(r => r.status === 'approved').length,
      rejected: reviews.filter(r => r.status === 'rejected').length
  };

  if (loading) return <div className="flex justify-center items-center h-screen"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
            <h1 className="text-2xl font-bold">Reviews for {tourName}</h1>
            <p className="text-gray-500 text-sm">Manage customer feedback</p>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={18} />
          Add Review
        </button>
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {['all', 'pending', 'approved', 'rejected'].map(status => (
            <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-2 rounded-full text-sm font-medium capitalize transition-colors
                    ${statusFilter === status 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                    }`}
            >
                {status} <span className={`ml-2 px-2 py-0.5 rounded-full text-xs text-white ${statusFilter === status ? 'bg-black bg-opacity-20' : 'bg-gray-600'}`}>{counts[status as keyof typeof counts]}</span>
            </button>
        ))}
      </div>

      <div className="grid gap-4">
        {filteredReviews.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
                <p className="text-gray-500">No reviews found with this status.</p>
            </div>
        ) : (
            filteredReviews.map(review => (
                <div key={review._id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 bg-gray-200 rounded-full flex-shrink-0 flex items-center justify-center overflow-hidden">
                                <ReviewAvatar 
                                  src={review.avatar} 
                                  name={review.name} 
                                  width={40} 
                                  height={40} 
                                />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900">{review.name}</h3>
                                <p className="text-sm text-gray-500">{review.email} • {new Date(review.createdAt).toLocaleDateString()}</p>
                                <div className="flex items-center mt-1 mb-2">
                                    {[...Array(5)].map((_, i) => (
                                        <Star 
                                            key={i} 
                                            size={14} 
                                            className={i < review.rating ? "text-yellow-400 fill-current" : "text-gray-300"} 
                                        />
                                    ))}
                                </div>
                                <p className="text-gray-700 mt-2">{review.comment}</p>
                            </div>
                        </div>
                        <div className="flex flex-col gap-2 items-end">
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold uppercase
                                ${review.status === 'approved' ? 'bg-green-100 text-green-800' : 
                                  review.status === 'rejected' ? 'bg-red-100 text-red-800' : 
                                  'bg-yellow-100 text-yellow-800'}`}>
                                {review.status}
                            </span>
                            <div className="flex gap-2 mt-2">
                                {review.status !== 'approved' && (
                                    <button 
                                        onClick={() => updateStatus(review._id, 'approved')}
                                        className="p-1.5 bg-green-50 text-green-600 rounded hover:bg-green-100 transition-colors"
                                        title="Approve"
                                    >
                                        <Check size={16} />
                                    </button>
                                )}
                                {review.status !== 'rejected' && (
                                    <button 
                                        onClick={() => updateStatus(review._id, 'rejected')}
                                        className="p-1.5 bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors"
                                        title="Reject"
                                    >
                                        <X size={16} />
                                    </button>
                                )}
                                <button 
                                    onClick={() => deleteReivew(review._id)}
                                    className="p-1.5 bg-gray-50 text-gray-600 rounded hover:bg-gray-100 transition-colors"
                                    title="Delete"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            ))
        )}
      </div>

      <ConfirmDeleteModal
        open={deleteModalOpen}
        onOpenChange={(open) => {
          if (deleteBusy) return;
          setDeleteModalOpen(open);
          if (!open) setDeleteId(null);
        }}
        count={deleteId ? 1 : 0}
        onConfirm={confirmDelete}
        confirmDisabled={deleteBusy}
      />

      {/* Add Review Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="text-lg font-bold">Add New Review</h2>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 hover:bg-gray-100 rounded-full"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAddReview} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input 
                  type="text" 
                  required
                  value={newReview.name}
                  onChange={(e) => setNewReview({...newReview, name: e.target.value})}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Reviewer Name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input 
                  type="email" 
                  required
                  value={newReview.email}
                  onChange={(e) => setNewReview({...newReview, email: e.target.value})}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="reviewer@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Avatar (Optional)</label>
                <div className="flex items-center gap-3">
                  {newReview.avatar && (
                    <div className="relative w-12 h-12 rounded-full overflow-hidden border border-gray-200">
                      <Image 
                        src={newReview.avatar} 
                        alt="Avatar Preview" 
                        fill 
                        className="object-cover" 
                      />
                    </div>
                  )}
                  <div className="flex-1">
                    <label className={`flex items-center justify-center gap-2 w-full px-3 py-2 border border-dashed rounded-md cursor-pointer transition-colors
                      ${isUploading ? 'bg-gray-50 border-gray-300' : 'hover:bg-gray-50 border-gray-300 hover:border-blue-400'}`}>
                      {isUploading ? (
                        <Loader2 className="animate-spin text-gray-400" size={18} />
                      ) : (
                        <Upload className="text-gray-400" size={18} />
                      )}
                      <span className="text-sm text-gray-500">
                        {isUploading ? 'Uploading...' : newReview.avatar ? 'Change Avatar' : 'Upload Avatar'}
                      </span>
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                        disabled={isUploading}
                      />
                    </label>
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rating</label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setNewReview({...newReview, rating: star})}
                      className="focus:outline-none"
                    >
                      <Star 
                        size={24} 
                        className={star <= newReview.rating ? "text-yellow-400 fill-current" : "text-gray-300"} 
                      />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Comment</label>
                <textarea 
                  required
                  rows={4}
                  value={newReview.comment}
                  onChange={(e) => setNewReview({...newReview, comment: e.target.value})}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Write the review content here..."
                ></textarea>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select 
                  value={newReview.status}
                  onChange={(e) => setNewReview({...newReview, status: e.target.value as any})}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
              <div className="flex justify-end pt-2">
                <button 
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="mr-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {isSubmitting ? 'Adding...' : 'Add Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
