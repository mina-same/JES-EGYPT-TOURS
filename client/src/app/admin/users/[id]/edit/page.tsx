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
    border: 1px solid rgba(0, 0, 0, 0.08);
    border-radius: 12px;
    padding: 12px;
    background: rgba(255, 255, 255, 0.9);
  }

  .info-message {
    padding: 10px 12px;
    border-radius: 10px;
    border: 1px dashed rgba(0, 0, 0, 0.18);
    background: rgba(0, 0, 0, 0.03);
    color: rgba(0, 0, 0, 0.72);
    font-size: 13px;
    line-height: 1.4;
  }

  .permissions-toolbar {
    display: grid;
    grid-template-columns: 1fr;
    gap: 10px;
    margin-bottom: 10px;
  }

  @media (min-width: 768px) {
    .permissions-toolbar {
      grid-template-columns: 1fr auto;
      align-items: center;
    }
  }

  .permissions-actions {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    justify-content: flex-end;
  }

  .permissions-list {
    margin-top: 10px;
    max-height: 320px;
    overflow: auto;
    border-top: 1px solid rgba(0, 0, 0, 0.06);
    padding-top: 10px;
  }

  .permissions-group {
    margin-bottom: 12px;
  }

  .permissions-group-title {
    font-weight: 700;
    font-size: 13px;
    color: rgba(0, 0, 0, 0.7);
    margin-bottom: 8px;
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  .permissions-group-items {
    display: grid;
    grid-template-columns: 1fr;
    gap: 8px;
  }

  @media (min-width: 768px) {
    .permissions-group-items {
      grid-template-columns: 1fr 1fr;
    }
  }

  .permission-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 12px;
    border-radius: 10px;
    border: 1px solid rgba(0, 0, 0, 0.08);
    background: #fff;
    text-align: left;
    transition: background 0.15s ease, border-color 0.15s ease;
  }

  .permission-item:hover {
    background: rgba(212, 175, 55, 0.08);
    border-color: rgba(212, 175, 55, 0.35);
  }

  .permission-item.is-checked {
    background: rgba(212, 175, 55, 0.12);
    border-color: rgba(212, 175, 55, 0.55);
  }

  .permission-checkbox {
    width: 22px;
    height: 22px;
    border-radius: 6px;
    border: 1px solid rgba(0, 0, 0, 0.2);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-weight: 800;
    color: #fff;
    background: #fff;
    flex: 0 0 22px;
  }

  .permission-checkbox.checked {
    background: #d4af37;
    border-color: #d4af37;
  }

  .permission-item-text {
    font-size: 13px;
    color: rgba(0, 0, 0, 0.8);
    word-break: break-word;
  }

  .permissions-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin: 10px 0 0;
  }

  .permission-chip {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    border-radius: 999px;
    border: 1px solid rgba(0, 0, 0, 0.1);
    background: rgba(212, 175, 55, 0.12);
    color: rgba(0, 0, 0, 0.85);
    padding: 6px 10px;
    font-size: 12px;
    cursor: pointer;
  }

  .chip-x {
    font-size: 14px;
    line-height: 1;
    opacity: 0.8;
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
    <div className="max-full space-y-6 pb-24 p-6">
      <style jsx global>{PERMISSIONS_GLOBAL_STYLES}</style>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Edit Administrator</h1>
            <p className="text-gray-500 mt-1">Update administrator details and permissions</p>
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
                                    className="px-2 py-1 text-xs rounded-md border bg-white hover:bg-muted"
                                    onClick={() => selectPermissions(group.items.map((i) => i.value))}
                                    disabled={loading || !isSuperAdmin}
                                  >
                                    Select
                                  </button>
                                  <button
                                    type="button"
                                    className="px-2 py-1 text-xs rounded-md border bg-white hover:bg-muted"
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
