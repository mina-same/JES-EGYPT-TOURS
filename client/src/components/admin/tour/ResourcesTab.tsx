import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import RichTextEditor from '@/components/ui/RichTextEditor';
import { Plus, X, Search, Loader2 } from 'lucide-react';

interface ResourcesTabProps {
  formData: any;
  handleChange: (field: string, value: any) => void;
  // Search props
  tourSearchQuery: string;
  setTourSearchQuery: (query: string) => void;
  tourSearchResults: any[];
  isSearchingTours?: boolean;
  blogSearchQuery: string;
  setBlogSearchQuery: (query: string) => void;
  blogSearchResults: any[];
  isSearchingBlogs?: boolean;
}

export default function ResourcesTab({
  formData,
  handleChange,
  tourSearchQuery,
  setTourSearchQuery,
  tourSearchResults,
  isSearchingTours = false,
  blogSearchQuery,
  setBlogSearchQuery,
  blogSearchResults,
  isSearchingBlogs = false,
}: ResourcesTabProps) {
  
  // FAQ Handlers
  const addFaq = () => {
    const newFaqs = [...(formData.faqs || []), { question: '', answer: '' }];
    handleChange('faqs', newFaqs);
  };

  const removeFaq = (index: number) => {
    const newFaqs = formData.faqs.filter((_: any, i: number) => i !== index);
    handleChange('faqs', newFaqs);
  };

  const updateFaq = (index: number, field: string, value: any) => {
    const newFaqs = [...formData.faqs];
    newFaqs[index] = { ...newFaqs[index], [field]: value };
    handleChange('faqs', newFaqs);
  };

  // Related Tour Handlers
  const addRelatedTour = (tour: any) => {
    if (!formData.relatedTours?.some((t: any) => t.id === tour._id)) {
      const newRelated = [
        ...(formData.relatedTours || []),
        { id: tour._id, title: tour.heading || tour.name }
      ];
      handleChange('relatedTours', newRelated);
      setTourSearchQuery(''); // Clear search
    }
  };

  const removeRelatedTour = (index: number) => {
    const newRelated = formData.relatedTours.filter((_: any, i: number) => i !== index);
    handleChange('relatedTours', newRelated);
  };

  // Blog Reference Handlers
  const addBlogReference = (blog: any) => {
    if (!formData.blogReferences?.some((b: any) => b.id === blog._id)) {
      const newRefs = [
        ...(formData.blogReferences || []),
        { id: blog._id, title: blog.title }
      ];
      handleChange('blogReferences', newRefs);
      setBlogSearchQuery(''); // Clear search
    }
  };

  const removeBlogReference = (index: number) => {
    const newRefs = formData.blogReferences.filter((_: any, i: number) => i !== index);
    handleChange('blogReferences', newRefs);
  };

  return (
    <div className="space-y-6">
      {/* FAQs */}
      <Card>
        <CardHeader>
          <CardTitle>Frequently Asked Questions</CardTitle>
          <CardDescription>Common questions and answers for this tour</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {formData.faqs?.map((faq: any, index: number) => (
            <div key={index} className="p-4 border rounded-lg space-y-3">
              <div className="flex justify-between items-center">
                <h4 className="font-medium">Question {index + 1}</h4>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFaq(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-2">
                <Label>Question</Label>
                <Input
                  value={faq.question}
                  onChange={(e) => updateFaq(index, 'question', e.target.value)}
                  placeholder="e.g., What should I wear?"
                />
              </div>
              <div className="space-y-2">
                <Label>Answer</Label>
                <RichTextEditor
                  value={faq.answer}
                  onChange={(value) => updateFaq(index, 'answer', value)}
                  placeholder="Answer..."
                />
              </div>
            </div>
          ))}
          <Button type="button" onClick={addFaq} variant="outline" className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Add FAQ
          </Button>
        </CardContent>
      </Card>

      {/* Related Tours */}
      <Card>
        <CardHeader>
          <CardTitle>Related Tours</CardTitle>
          <CardDescription>Link other tours that might interest travelers</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Selected Tours List */}
          <div className="space-y-2">
            {formData.relatedTours?.map((tour: any, index: number) => (
              <div key={index} className="flex items-center justify-between p-2 bg-secondary/20 rounded-md border">
                <span className="text-sm font-medium truncate">{tour.title}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeRelatedTour(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
            {(!formData.relatedTours || formData.relatedTours.length === 0) && (
              <p className="text-sm text-muted-foreground italic">No related tours selected.</p>
            )}
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tours to add..."
              value={tourSearchQuery}
              onChange={(e) => setTourSearchQuery(e.target.value)}
              className="pl-8"
            />
            {isSearchingTours && (
              <div className="absolute right-2 top-2.5">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            )}
          </div>

          {/* Search Results */}
          {tourSearchQuery && (
            <div className="border rounded-md max-h-48 overflow-y-auto bg-background shadow-sm">
              {tourSearchResults.length > 0 ? (
                tourSearchResults.map((tour) => (
                  <button
                    key={tour._id}
                    type="button"
                    className="w-full text-left px-3 py-2 hover:bg-accent text-sm flex items-center gap-2"
                    onClick={() => addRelatedTour(tour)}
                  >
                    <Plus className="h-3 w-3" />
                    <span className="truncate">{tour.heading || tour.name}</span>
                  </button>
                ))
              ) : (
                <div className="p-3 text-sm text-muted-foreground text-center">
                  {isSearchingTours ? 'Searching...' : 'No tours found'}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Related Blogs */}
      <Card>
        <CardHeader>
          <CardTitle>Related Blogs</CardTitle>
          <CardDescription>Link relevant blog posts</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Selected Blogs List */}
          <div className="space-y-2">
            {formData.blogReferences?.map((blog: any, index: number) => (
              <div key={index} className="flex items-center justify-between p-2 bg-secondary/20 rounded-md border">
                <span className="text-sm font-medium truncate">{blog.title}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeBlogReference(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
            {(!formData.blogReferences || formData.blogReferences.length === 0) && (
              <p className="text-sm text-muted-foreground italic">No related blogs selected.</p>
            )}
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search blogs to add..."
              value={blogSearchQuery}
              onChange={(e) => setBlogSearchQuery(e.target.value)}
              className="pl-8"
            />
            {isSearchingBlogs && (
              <div className="absolute right-2 top-2.5">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            )}
          </div>

          {/* Search Results */}
          {blogSearchQuery && (
            <div className="border rounded-md max-h-48 overflow-y-auto bg-background shadow-sm">
              {blogSearchResults.length > 0 ? (
                blogSearchResults.map((blog) => (
                  <button
                    key={blog._id}
                    type="button"
                    className="w-full text-left px-3 py-2 hover:bg-accent text-sm flex items-center gap-2"
                    onClick={() => addBlogReference(blog)}
                  >
                    <Plus className="h-3 w-3" />
                    <span className="truncate">{blog.title}</span>
                  </button>
                ))
              ) : (
                <div className="p-3 text-sm text-muted-foreground text-center">
                  {isSearchingBlogs ? 'Searching...' : 'No blogs found'}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
