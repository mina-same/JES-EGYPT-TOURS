"use client";

import React, { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";

import { faqService, type FAQ, type FAQUpdateRequest } from "@/services/faqService";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import AdminLanguageTabs, { type AdminLanguage } from "@/components/admin/AdminLanguageTabs";
import LocalizedField from "@/components/admin/LocalizedField";
import RichTextEditor from "@/components/ui/RichTextEditor";

interface AdminFAQEditPageProps {
  params: Promise<{
    id: string;
  }>;
}

const AdminFAQEdit: React.FC<AdminFAQEditPageProps> = ({ params }) => {
  const router = useRouter();
  const { id } = use(params);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [faq, setFaq] = useState<FAQ | null>(null);
  const [activeLanguage, setActiveLanguage] = useState<AdminLanguage>("en");
  const [formData, setFormData] = useState<FAQUpdateRequest>({
    question: { en: "", de: "", it: "", es: "" },
    answer: { en: "", de: "", it: "", es: "" },
    category: "General",
    isActive: true,
    displayOnHome: false,
    order: 0,
  });

  useEffect(() => {
    fetchFAQ();
  }, [id]);

  const fetchFAQ = async () => {
    try {
      setLoading(true);
      const response = await faqService.getFaqById(id);

      if (response.success) {
        const faqData = response.data;
        setFaq(faqData);
        setFormData({
          question: typeof faqData.question === 'string' 
            ? { en: faqData.question as string, de: "", it: "", es: "" } 
            : faqData.question || { en: "", de: "", it: "", es: "" },
          answer: typeof faqData.answer === 'string' 
            ? { en: faqData.answer as string, de: "", it: "", es: "" } 
            : faqData.answer || { en: "", de: "", it: "", es: "" },
          category: faqData.category || "General",
          isActive: faqData.isActive,
          displayOnHome: faqData.displayOnHome,
          order: faqData.order,
        });
      } else {
        toast.error("FAQ not found");
        router.push("/admin/content-management/faq");
      }
    } catch (error) {
      console.error("Error fetching FAQ:", error);
      toast.error("Failed to load FAQ");
      router.push("/admin/content-management/faq");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    field: keyof FAQUpdateRequest,
    value: any
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleLocalizedChange = (field: "question" | "answer", value: string, lang: AdminLanguage) => {
    setFormData((prev) => ({
      ...prev,
      [field]: {
        ...(prev[field] as any),
        [lang]: value,
      },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.question?.en?.trim() || !formData.answer?.en?.trim()) {
      toast.error("English question and answer are required");
      return;
    }

    try {
      setSaving(true);
      const response = await faqService.updateFaq(id, formData);

      if (response.success) {
        toast.success("FAQ updated successfully");
        router.push("/admin/content-management/faq");
      }
    } catch (error) {
      console.error("Error updating FAQ:", error);
      toast.error("Failed to update FAQ");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div>
            <h2 className="text-2xl font-semibold">Edit FAQ</h2>
            <p className="text-muted-foreground">Update frequently asked question</p>
          </div>
        </div>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading FAQ...</p>
        </div>
      </div>
    );
  }

  if (!faq) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <p className="text-muted-foreground">FAQ not found</p>
          <Button asChild className="mt-4">
            <Link href="/admin/content-management/faq">Back to FAQs</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div>
          <h2 className="text-2xl font-semibold">Edit FAQ</h2>
          <p className="text-muted-foreground">Update frequently asked question</p>
        </div>
      </div>

      <AdminLanguageTabs activeLanguage={activeLanguage} onLanguageChange={setActiveLanguage} />

      <Card>
        <CardHeader>
          <CardTitle>FAQ Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-4">
                <LocalizedField
                  label="Question *"
                  value={formData.question as any}
                  globalLanguage={activeLanguage}
                  onChange={(lang, val) => handleLocalizedChange("question", val, lang)}
                >
                  {(lang, currentValue, handleLang) => (
                    <Input
                      id={`question-${lang}`}
                      value={currentValue || ""}
                      onChange={(e) => handleLang(e.target.value)}
                      placeholder={`Enter the frequently asked question in ${lang}`}
                      required={lang === "en"}
                    />
                  )}
                </LocalizedField>
                <p className="text-xs text-muted-foreground">
                  {(formData.question as any)?.[activeLanguage]?.length || 0}/500 characters
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

            <div className="space-y-4">
              <LocalizedField
                label="Answer *"
                value={formData.answer as any}
                globalLanguage={activeLanguage}
                onChange={(lang, val) => handleLocalizedChange("answer", val, lang)}
              >
                {(lang, currentValue, handleLang) => (
                  <Textarea
                    id={`answer-${lang}`}
                    value={currentValue || ""}
                    onChange={(e) => handleLang(e.target.value)}
                    placeholder={`Provide a detailed answer to the question in ${lang}`}
                    rows={6}
                    required={lang === "en"}
                  />
                )}
              </LocalizedField>
              <p className="text-xs text-muted-foreground">
                {(formData.answer as any)?.[activeLanguage]?.length || 0}/5000 characters
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
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

              <div className="space-y-2">
                <Label htmlFor="order">Display Order</Label>
                <Input
                  id="order"
                  type="number"
                  min="0"
                  value={formData.order}
                  onChange={(e) => handleChange("order", parseInt(e.target.value) || 0)}
                  placeholder="0"
                />
                <p className="text-xs text-muted-foreground">
                  Lower numbers appear first
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 pt-4">
              <Button type="submit" disabled={saving}>
                <Save className="mr-2 h-4 w-4" />
                {saving ? "Saving..." : "Save Changes"}
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

      {/* FAQ Info */}
      <Card>
        <CardHeader>
          <CardTitle>Additional Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Created:</span>
            <span>{new Date(faq.createdAt).toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Last Updated:</span>
            <span>{new Date(faq.updatedAt).toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">FAQ ID:</span>
            <span className="font-mono">{faq._id}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminFAQEdit;
