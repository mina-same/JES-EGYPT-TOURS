"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

import { useAuth } from "@/contexts/AuthContext";
import { userAPI, User } from "@/lib/api/auth";
import {
  ALL_PERMISSIONS,
  DEFAULT_ADMIN_PERMISSIONS,
  PERMISSION_PRESETS,
} from "@/permissions";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Save, Loader2, User as UserIcon, Shield, Settings } from "lucide-react";


const PERMISSIONS_GLOBAL_STYLES = `
  .permissions-panel {
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    padding: 16px;
    background: #ffffff;
    transition: all 0.2s ease;
  }

  .dark .permissions-panel {
    border-color: #374151;
    background: #111827;
  }

  .permissions-toolbar {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-bottom: 20px;
  }

  @media (min-width: 1024px) {
    .permissions-toolbar {
      flex-direction: row;
    }
  }

  .permissions-actions {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  .permissions-list {
    margin-top: 20px;
    max-height: 400px;
    overflow-y: auto;
    border-top: 1px solid #f3f4f6;
    padding-top: 20px;
    padding-right: 8px;
  }

  .dark .permissions-list {
    border-top-color: #374151;
  }

  .permissions-list::-webkit-scrollbar {
    width: 6px;
  }

  .permissions-list::-webkit-scrollbar-track {
    background: transparent;
  }

  .permissions-list::-webkit-scrollbar-thumb {
    background: #e5e7eb;
    border-radius: 10px;
  }

  .dark .permissions-list::-webkit-scrollbar-thumb {
    background: #374151;
  }

  .permissions-group {
    margin-bottom: 24px;
  }

  .permissions-group-title {
    font-weight: 700;
    font-size: 12px;
    color: #6b7280;
    margin-bottom: 12px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .dark .permissions-group-title {
    color: #9ca3af;
  }

  .permissions-group-items {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 10px;
  }

  .permission-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px;
    border-radius: 10px;
    border: 1px solid #e5e7eb;
    background: #ffffff;
    text-align: left;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    cursor: pointer;
  }

  .dark .permission-item {
    border-color: #374151;
    background: #1f2937;
  }

  .permission-item:hover {
    border-color: #3b82f6;
    background: rgba(59, 130, 246, 0.02);
    transform: translateY(-1px);
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
  }

  .dark .permission-item:hover {
    background: rgba(59, 130, 246, 0.05);
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.2);
  }

  .permission-item.is-checked {
    background: rgba(59, 130, 246, 0.05);
    border-color: #3b82f6;
    box-shadow: 0 0 0 1px #3b82f6 inset;
  }

  .dark .permission-item.is-checked {
    background: rgba(59, 130, 246, 0.1);
  }

  .permission-checkbox {
    width: 20px;
    height: 20px;
    border-radius: 6px;
    border: 2px solid #d1d5db;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-weight: 800;
    color: #fff;
    background: #fff;
    flex: 0 0 20px;
    transition: all 0.2s ease;
    font-size: 12px;
  }

  .dark .permission-checkbox {
    border-color: #4b5563;
    background: #374151;
  }

  .permission-checkbox.checked {
    background: #3b82f6;
    border-color: #3b82f6;
    color: #ffffff;
  }

  .permission-item-text {
    font-size: 13px;
    font-weight: 500;
    color: #374151;
    word-break: break-all;
  }

  .dark .permission-item-text {
    color: #d1d5db;
  }

  .permission-item.is-checked .permission-item-text {
    color: #1d4ed8;
  }

  .dark .permission-item.is-checked .permission-item-text {
    color: #60a5fa;
  }

  .permissions-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 12px;
  }

  .permission-chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    border-radius: 8px;
    border: 1px solid #e5e7eb;
    background: #f9fafb;
    color: #4b5563;
    padding: 4px 10px;
    font-size: 11px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .dark .permission-chip {
    background: #1f2937;
    border-color: #374151;
    color: #9ca3af;
  }

  .permission-chip:hover {
    background: #fee2e2;
    border-color: #fecaca;
    color: #b91c1c;
  }

  .dark .permission-chip:hover {
    background: rgba(239, 68, 68, 0.2);
    border-color: rgba(239, 68, 68, 0.4);
    color: #f87171;
  }

  .chip-x {
    font-size: 14px;
    opacity: 0.6;
  }

  .info-message {
    padding: 12px 16px;
    border-radius: 10px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    color: #64748b;
    font-size: 13px;
    margin: 12px 0;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .dark .info-message {
    background: #1e293b;
    border-color: #334155;
    color: #94a3b8;
  }

  .btn-refresh {
    padding: 8px 16px;
    border-radius: 8px;
    border: 1px solid #e5e7eb;
    background: #ffffff;
    color: #374151;
    font-size: 13px;
    font-weight: 600;
    transition: all 0.2s ease;
  }

  .dark .btn-refresh {
    background: #1f2937;
    border-color: #374151;
    color: #d1d5db;
  }

  .btn-refresh:hover {
    background: #f9fafb;
    border-color: #d1d5db;
  }

  .dark .btn-refresh:hover {
    background: #374151;
    border-color: #4b5563;
  }
`;

type EditFormData = {
  name: string;
  email: string;
  role: "superadmin" | "admin";
  permissions: string[];
  isActive: boolean;
};

export default function EditAdministratorPage() {
  const routeParams = useParams();
  const userId = typeof routeParams?.id === "string" ? routeParams.id : Array.isArray(routeParams?.id) ? routeParams.id[0] : "";
  const router = useRouter();
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const isSuperAdmin = currentUser?.role === "superadmin";

  const [loading, setLoading] = useState(false);
  const [loadingUser, setLoadingUser] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"account" | "permissions" | "settings">("account");

  const [formData, setFormData] = useState<EditFormData>({
    name: "",
    email: "",
    role: "admin",
    permissions: DEFAULT_ADMIN_PERMISSIONS,
    isActive: true,
  });

  const [permissionSearch, setPermissionSearch] = useState("");
  const [selectedPresetId, setSelectedPresetId] = useState<string>("default_admin");

  const selectedPermissions = formData.permissions || [];

  const selectPermissions = (perms: string[]) => {
    const merged = Array.from(new Set([...selectedPermissions, ...perms]));
    setPermissions(merged);
  };

  const clearPermissions = (perms: string[]) => {
    setPermissions(selectedPermissions.filter((p) => !perms.includes(p)));
  };

  useEffect(() => {
    let mounted = true;

    const fetchUser = async () => {
      try {
        setLoadingUser(true);
        setError(null);

        if (!userId) {
          setError("Missing administrator id");
          return;
        }

        const res = await userAPI.getUser(userId);
        if (!mounted) return;

        if (!res.success || !res.data?.user) {
          setError(res.error || "Failed to fetch administrator");
          return;
        }

        const u: User = res.data.user as any;
        setFormData({
          name: u.name || "",
          email: u.email || "",
          role: (u.role as any) || "admin",
          permissions: Array.isArray(u.permissions) ? u.permissions : DEFAULT_ADMIN_PERMISSIONS,
          isActive: !!u.isActive,
        });
      } catch (err: any) {
        if (!mounted) return;
        setError(err?.response?.data?.error || err?.message || "Failed to fetch administrator");
      } finally {
        if (mounted) setLoadingUser(false);
      }
    };

    fetchUser();

    return () => {
      mounted = false;
    };
  }, [userId]);

  const handleChange = (field: keyof EditFormData, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const groupedPermissions = useMemo(() => {
    const q = permissionSearch.trim().toLowerCase();

    const entries = ALL_PERMISSIONS.map((value) => {
      const [resourceRaw, actionRaw] = value.split(":");
      const resource = (resourceRaw || "").toLowerCase();
      const action = (actionRaw || "").toLowerCase();
      const label = `${resourceRaw?.replace(/_/g, " ") || ""}: ${actionRaw || ""}`;

      return {
        value,
        resource,
        resourceRaw: resourceRaw || "other",
        action,
        label,
      };
    }).filter((p) => {
      if (!q) return true;
      return (
        p.value.toLowerCase().includes(q) ||
        p.resource.includes(q) ||
        p.action.includes(q) ||
        p.label.toLowerCase().includes(q)
      );
    });

    const map = new Map<string, typeof entries>();
    for (const item of entries) {
      const key = item.resourceRaw;
      const arr = map.get(key) || [];
      arr.push(item);
      map.set(key, arr);
    }

    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([group, items]) => ({
        group,
        title: group
          .replace(/_/g, " ")
          .replace(/\b\w/g, (c) => c.toUpperCase()),
        items: items.sort((x, y) => x.value.localeCompare(y.value)),
      }));
  }, [permissionSearch]);

  const filteredPermissionValues = useMemo(() => {
    return groupedPermissions.flatMap((g) => g.items.map((i) => i.value));
  }, [groupedPermissions]);

  const setPermissions = (perms: string[]) => {
    setFormData((prev) => ({
      ...prev,
      permissions: perms,
    }));
  };

  const togglePermission = (perm: string) => {
    const next = selectedPermissions.includes(perm)
      ? selectedPermissions.filter((p) => p !== perm)
      : [...selectedPermissions, perm];

    setPermissions(next);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError(null);

      if (!userId) {
        setError("Missing administrator id");
        return;
      }

      if (!isSuperAdmin) {
        setError("Only Super Admin can update administrators.");
        return;
      }

      if (!formData.name?.trim()) {
        setError("Name is required.");
        return;
      }

      const res = await userAPI.updateUser(userId, {
        name: formData.name,
        role: formData.role,
        permissions: formData.permissions,
        isActive: formData.isActive,
      });

      if (!res.success) {
        setError(res.error || "Failed to update administrator");
        return;
      }

      toast({
        title: "Administrator updated",
        description: `"${formData.name}" has been updated successfully.`,
      });

      router.push("/admin/users");
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || "Failed to update administrator");
    } finally {
      setLoading(false);
    }
  };

  const TABS = [
    { id: "account" as const, label: "Account", icon: UserIcon },
    { id: "permissions" as const, label: "Permissions", icon: Shield },
    { id: "settings" as const, label: "Settings", icon: Settings },
  ];

  if (loadingUser) {
    return (
      <div className="max-full space-y-6 pb-24 p-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 mr-2 animate-spin" />
          <span className="text-gray-500">Loading administrator...</span>
        </div>
        <style jsx global>{PERMISSIONS_GLOBAL_STYLES}</style>
      </div>
    );
  }

  return (
    <div className="admin-scope max-full space-y-6 pb-24 p-6">
      <style jsx global>{PERMISSIONS_GLOBAL_STYLES}</style>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="admin-page-title">Edit Administrator</h1>
            <p className="admin-page-subtitle">Update administrator details and permissions</p>
          </div>
        </div>
        <Link href="/admin/users">
          <Button variant="outline" type="button">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">{error}</div>
      )}

      <div className="flex overflow-x-auto gap-2 border-b">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-t-lg text-sm font-medium transition-colors whitespace-nowrap",
                isActive ? "bg-primary text-primary-foreground" : "hover:bg-muted text-muted-foreground"
              )}
              type="button"
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === "account" && (
              <div className="grid gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Account Details</CardTitle>
                    <CardDescription>Basic information for this administrator</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="name">Full Name *</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => handleChange("name", e.target.value)}
                          placeholder="Enter administrator's full name"
                          required
                          disabled={loading}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          disabled
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Role</Label>
                        <Select
                          value={formData.role}
                          onValueChange={(value) => handleChange("role", value as any)}
                          disabled={loading || !isSuperAdmin}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="superadmin">Super Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === "permissions" && (
              <div className="grid gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Permissions</CardTitle>
                    <CardDescription>Select what this administrator can access</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="permissions-panel">
                      <div className="permissions-toolbar">
                        <Input
                          value={permissionSearch}
                          placeholder="Search permissions (e.g. blog, booking:update)"
                          onChange={(e) => setPermissionSearch(e.target.value)}
                          disabled={loading || !isSuperAdmin}
                        />

                        <div className="permissions-actions">
                          <Select
                            value={selectedPresetId}
                            onValueChange={(v) => setSelectedPresetId(v)}
                            disabled={loading || !isSuperAdmin}
                          >
                            <SelectTrigger style={{ minWidth: 220 }}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {PERMISSION_PRESETS.map((preset) => (
                                <SelectItem key={preset.id} value={preset.id}>
                                  {preset.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          <button
                            type="button"
                            className="btn-add-user"
                            onClick={() => {
                              const preset = PERMISSION_PRESETS.find((p) => p.id === selectedPresetId);
                              if (preset) {
                                setPermissions(preset.permissions);
                              }
                            }}
                            disabled={loading || !isSuperAdmin}
                          >
                            Apply
                          </button>

                          <button
                            type="button"
                            className="btn-refresh"
                            onClick={() => {
                              selectPermissions(filteredPermissionValues);
                            }}
                            disabled={loading || !isSuperAdmin}
                          >
                            Select Filtered
                          </button>

                          <button
                            type="button"
                            className="btn-refresh"
                            onClick={() => setPermissions([])}
                            disabled={loading || !isSuperAdmin}
                          >
                            Clear
                          </button>

                          <button
                            type="button"
                            className="btn-refresh"
                            onClick={() => setPermissions(DEFAULT_ADMIN_PERMISSIONS)}
                            disabled={loading || !isSuperAdmin}
                          >
                            Default
                          </button>
                        </div>
                      </div>

                      {formData.role === "superadmin" ? (
                        <div className="info-message">
                          Super Admin has full access. Permissions selection is optional.
                        </div>
                      ) : null}

                      <div className="text-sm text-muted-foreground">
                        Selected: {selectedPermissions.length} / {ALL_PERMISSIONS.length}
                        {permissionSearch.trim()
                          ? ` (Filtered: ${filteredPermissionValues.length})`
                          : ""}
                      </div>

                      {(formData.permissions || []).length > 0 ? (
                        <div className="permissions-chips">
                          {(formData.permissions || [])
                            .slice()
                            .sort((a, b) => a.localeCompare(b))
                            .map((p) => (
                              <button
                                key={p}
                                type="button"
                                className="permission-chip"
                                onClick={() => togglePermission(p)}
                                disabled={loading || !isSuperAdmin}
                                title="Click to remove"
                              >
                                {p}
                                <span className="chip-x">×</span>
                              </button>
                            ))}
                        </div>
                      ) : (
                        <div className="info-message">No permissions selected yet.</div>
                      )}

                      <div className="permissions-list">
                        {groupedPermissions.length === 0 ? (
                          <div className="info-message">No permissions match your search.</div>
                        ) : (
                          groupedPermissions.map((group) => (
                            <div key={group.group} className="permissions-group">
                              <div className="permissions-group-title flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  <span>{group.title}</span>
                                  <span className="text-[11px] font-semibold text-muted-foreground">
                                    {
                                      group.items.filter((i) => selectedPermissions.includes(i.value)).length
                                    }
                                    /{group.items.length}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    className="px-2 py-1 text-xs rounded-md border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                                    onClick={() => selectPermissions(group.items.map((i) => i.value))}
                                    disabled={loading || !isSuperAdmin}
                                  >
                                    Select
                                  </button>
                                  <button
                                    type="button"
                                    className="px-2 py-1 text-xs rounded-md border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                                    onClick={() => clearPermissions(group.items.map((i) => i.value))}
                                    disabled={loading || !isSuperAdmin}
                                  >
                                    Clear
                                  </button>
                                </div>
                              </div>
                              <div className="permissions-group-items">
                                {group.items.map((item) => {
                                  const checked = (formData.permissions || []).includes(item.value);
                                  return (
                                    <button
                                      key={item.value}
                                      type="button"
                                      className={`permission-item ${checked ? "is-checked" : ""}`}
                                      onClick={() => togglePermission(item.value)}
                                      disabled={loading || !isSuperAdmin}
                                    >
                                      <span className={`permission-checkbox ${checked ? "checked" : ""}`}>
                                        {checked ? "✓" : ""}
                                      </span>
                                      <span className="permission-item-text">{item.label}</span>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {!isSuperAdmin ? (
                      <div className="info-message">Only Super Admin can change roles and permissions</div>
                    ) : (
                      <div className="info-message">Use search and presets to manage permissions fast</div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === "settings" && (
              <div className="grid gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Status</CardTitle>
                    <CardDescription>Enable or disable this administrator account</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between space-x-2 p-4 border rounded-lg">
                      <div className="space-y-0.5">
                        <Label className="text-base">Active</Label>
                        <p className="text-sm text-muted-foreground">
                          If disabled, this admin will not be able to log in.
                        </p>
                      </div>
                      <Switch
                        checked={formData.isActive}
                        onCheckedChange={(checked) => handleChange("isActive", checked)}
                        disabled={loading || !isSuperAdmin}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="flex justify-end gap-4 pt-6 border-t">
          <Link href="/admin/users">
            <Button type="button" variant="outline" disabled={loading}>
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={loading || !isSuperAdmin}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
