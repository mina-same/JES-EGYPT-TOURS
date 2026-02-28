"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";

import { faqService, type FAQCreateRequest } from "@/services/faqService";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

const AdminFAQCreate: React.FC = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<FAQCreateRequest>({
    question: "",
    answer: "",
    category: "General",
    isActive: true,
    displayOnHome: false,
  });

  const handleChange = (
    field: keyof FAQCreateRequest,
    value: string | boolean
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.question.trim() || !formData.answer.trim()) {
      toast.error("Question and answer are required");
      return;
    }

    try {
      setLoading(true);
      const response = await faqService.createFaq(formData);

      if (response.success) {
        toast.success("FAQ created successfully");
        router.push("/admin/content-management/faq");
      }
    } catch (error) {
      console.error("Error creating FAQ:", error);
      toast.error("Failed to create FAQ");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div>
          <h2 className="text-2xl font-semibold">Create New FAQ</h2>
          <p className="text-muted-foreground">Add a new frequently asked question</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>FAQ Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="question">Question *</Label>
                <Input
                  id="question"
                  value={formData.question}
                  onChange={(e) => handleChange("question", e.target.value)}
                  placeholder="Enter the frequently asked question"
                  maxLength={500}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  {formData.question.length}/500 characters
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) => handleChange("category", e.target.value)}
                  placeholder="e.g., General, Booking, Tours"
                  maxLength={50}
                />
                <p className="text-xs text-muted-foreground">
                  {formData.category?.length || 0}/50 characters
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="answer">Answer *</Label>
              <Textarea
                id="answer"
                value={formData.answer}
                onChange={(e) => handleChange("answer", e.target.value)}
                placeholder="Provide a detailed answer to the question"
                rows={6}
                maxLength={5000}
                required
              />
              <p className="text-xs text-muted-foreground">
                {formData.answer.length}/5000 characters
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex items-center justify-between space-y-0 py-2">
                <div className="space-y-0.5">
                  <Label htmlFor="isActive">Active</Label>
                  <p className="text-xs text-muted-foreground">
                    Whether this FAQ should be visible on the website
                  </p>
                </div>
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => handleChange("isActive", checked)}
                />
              </div>

              <div className="flex items-center justify-between space-y-0 py-2">
                <div className="space-y-0.5">
                  <Label htmlFor="displayOnHome">Display on Home</Label>
                  <p className="text-xs text-muted-foreground">
                    Show this FAQ on the home page
                  </p>
                </div>
                <Switch
                  id="displayOnHome"
                  checked={formData.displayOnHome}
                  onCheckedChange={(checked) => handleChange("displayOnHome", checked)}
                />
              </div>
            </div>

            <div className="flex items-center gap-4 pt-4">
              <Button type="submit" disabled={loading}>
                <Save className="mr-2 h-4 w-4" />
                {loading ? "Creating..." : "Create FAQ"}
              </Button>
              <Button
                type="button"
                variant="outline"
                asChild
              >
                <Link href="/admin/content-management/faq">Cancel</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminFAQCreate;
