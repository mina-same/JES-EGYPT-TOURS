"use client";
import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Activity,
  Calendar,
  ChevronRight,
  Mail,
  MessageSquare,
  Sparkles,
  Users,
} from "lucide-react";

import { getAdminSocket } from "@/lib/realtime/adminSocket";
import { API_ENDPOINTS } from "@/config/api";
import { getAllBookings, type IBooking } from "@/lib/api/booking";
import { tourAPI } from "@/lib/api/tour";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import DashboardKpiCard from "@/components/admin/DashboardKpiCard";
import MiniBarChart from "@/components/admin/MiniBarChart";

type AdminNotificationType = 'booking' | 'tailorMade' | 'contact';

interface AdminNotificationPayload {
  type: AdminNotificationType;
  title: string;
  entityId: string;
  createdAt: string;
}

interface AdminDashboardStats {
  usersTotal: number;
  toursTotal: number;
  toursActive: number;
  bookingsTotal: number;
  bookingsPending: number;
  contactNew: number;
  tailorMadePending: number;
  updatedAt: string;
}

interface ContactSubmission {
  _id: string;
  name: string;
  email: string;
  message: string;
  status: 'new' | 'replied' | 'archived';
  createdAt: string;
}

interface TailorMadeRequest {
  _id: string;
  fullName: string;
  email: string;
  status: 'pending' | 'contacted' | 'in-progress' | 'completed' | 'cancelled';
  createdAt: string;
}

interface TourLite {
  _id: string;
  heading?: any; // Can be string or localized object
  name?: string;
  viewCount?: number;
  isActive?: boolean;
}

const toISODateKey = (d: Date) => {
  // YYYY-MM-DD (local time)
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const buildLastNDays = (n: number) => {
  const days: Array<{ key: string; label: string; date: Date }> = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    days.push({
      key: toISODateKey(d),
      label: d.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      date: d,
    });
  }
  return days;
};

const formatWhen = (iso: string) => {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
};

const AdminDashboard: React.FC = () => {
  const [dashboardStats, setDashboardStats] = useState<AdminDashboardStats | null>(null);
  const [activityFeed, setActivityFeed] = useState<AdminNotificationPayload[]>([]);
  const [pendingBookings, setPendingBookings] = useState<IBooking[]>([]);
  const [newContacts, setNewContacts] = useState<ContactSubmission[]>([]);
  const [pendingTailorMade, setPendingTailorMade] = useState<TailorMadeRequest[]>([]);
  const [loadingQueues, setLoadingQueues] = useState(true);
  const [bookingsTrend, setBookingsTrend] = useState<number[]>([]);
  const [leadsTrend, setLeadsTrend] = useState<number[]>([]);
  const [trendLabels, setTrendLabels] = useState<string[]>([]);
  const [topTours, setTopTours] = useState<TourLite[]>([]);
  const [loadingAnalytics, setLoadingAnalytics] = useState(true);

  const router = useRouter();

  const fetchQueues = async () => {
    if (typeof window === "undefined") return;

    const token = window.localStorage.getItem("authToken");
    if (!token) return;

    setLoadingQueues(true);
    try {
      const [bookingsRes, contactsRes, tailorRes] = await Promise.all([
        getAllBookings({ status: "pending", page: 1, limit: 5 }),
        fetch(`${API_ENDPOINTS.CONTACT.BASE}?status=new&page=1&limit=5`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_ENDPOINTS.TAILOR_MADE.BASE}?status=pending&page=1&limit=5`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      setPendingBookings(Array.isArray(bookingsRes?.data) ? bookingsRes.data : []);

      if (contactsRes.ok) {
        const json = await contactsRes.json().catch(() => null);
        setNewContacts(Array.isArray(json?.data) ? json.data : []);
      } else {
        setNewContacts([]);
      }

      if (tailorRes.ok) {
        const json = await tailorRes.json().catch(() => null);
        setPendingTailorMade(Array.isArray(json?.data) ? json.data : []);
      } else {
        setPendingTailorMade([]);
      }
    } catch {
      setPendingBookings([]);
      setNewContacts([]);
      setPendingTailorMade([]);
    } finally {
      setLoadingQueues(false);
    }
  };

  const fetchAnalytics = async () => {
    if (typeof window === "undefined") return;
    const token = window.localStorage.getItem("authToken");
    if (!token) return;

    setLoadingAnalytics(true);
    try {
      const windowDays = buildLastNDays(14);
      setTrendLabels(windowDays.map((d) => d.label));

      // Fetch latest records; we then compute last-14-day buckets client-side.
      // (Avoids needing a backend aggregation endpoint.)
      const [bookingsRes, contactsRes, tailorRes, toursRes] = await Promise.all([
        getAllBookings({ page: 1, limit: 250 }),
        fetch(`${API_ENDPOINTS.CONTACT.BASE}?page=1&limit=250`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_ENDPOINTS.TAILOR_MADE.BASE}?page=1&limit=250`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        tourAPI.getAll({ page: 1, limit: 30, sort: "-viewCount", fields: "heading,name,viewCount,isActive" }),
      ]);

      // Bookings trend
      const bookingsByDay: Record<string, number> = Object.fromEntries(
        windowDays.map((d) => [d.key, 0])
      );
      (Array.isArray(bookingsRes?.data) ? bookingsRes.data : []).forEach((b) => {
        const raw = (b.createdAt as any) || (b.updatedAt as any);
        if (!raw) return;
        const dt = new Date(raw);
        dt.setHours(0, 0, 0, 0);
        const k = toISODateKey(dt);
        if (k in bookingsByDay) bookingsByDay[k] += 1;
      });
      setBookingsTrend(windowDays.map((d) => bookingsByDay[d.key] || 0));

      // Leads = contact submissions + tailor-made requests
      const leadsByDay: Record<string, number> = Object.fromEntries(
        windowDays.map((d) => [d.key, 0])
      );

      if (contactsRes.ok) {
        const json = await contactsRes.json().catch(() => null);
        (Array.isArray(json?.data) ? json.data : []).forEach((c: any) => {
          if (!c?.createdAt) return;
          const dt = new Date(c.createdAt);
          dt.setHours(0, 0, 0, 0);
          const k = toISODateKey(dt);
          if (k in leadsByDay) leadsByDay[k] += 1;
        });
      }

      if (tailorRes.ok) {
        const json = await tailorRes.json().catch(() => null);
        (Array.isArray(json?.data) ? json.data : []).forEach((t: any) => {
          if (!t?.createdAt) return;
          const dt = new Date(t.createdAt);
          dt.setHours(0, 0, 0, 0);
          const k = toISODateKey(dt);
          if (k in leadsByDay) leadsByDay[k] += 1;
        });
      }

      setLeadsTrend(windowDays.map((d) => leadsByDay[d.key] || 0));

      // Top tours
      const tours = (toursRes as any)?.data;
      setTopTours(Array.isArray(tours) ? (tours as TourLite[]).slice(0, 8) : []);
    } catch {
      setBookingsTrend([]);
      setLeadsTrend([]);
      setTrendLabels([]);
      setTopTours([]);
    } finally {
      setLoadingAnalytics(false);
    }
  };

  useEffect(() => {
    const socket = getAdminSocket();
    if (!socket) return;

    const onStats = (stats: AdminDashboardStats) => {
      setDashboardStats(stats);
    };

    const onSeed = (items: AdminNotificationPayload[]) => {
      setActivityFeed(Array.isArray(items) ? items : []);
    };

    const onActivityNew = (payload: AdminNotificationPayload) => {
      setActivityFeed((prev) => [payload, ...prev].slice(0, 30));
      void fetchQueues();
    };

    socket.on('dashboard:stats', onStats);
    socket.on('dashboard:activity:seed', onSeed);
    socket.on('dashboard:activity:new', onActivityNew);

    void fetchQueues();
    void fetchAnalytics();

    return () => {
      socket.off('dashboard:stats', onStats);
      socket.off('dashboard:activity:seed', onSeed);
      socket.off('dashboard:activity:new', onActivityNew);
    };
  }, []);

  const updatedAt = useMemo(() => {
    if (!dashboardStats?.updatedAt) return "—";
    try {
      return new Date(dashboardStats.updatedAt).toLocaleTimeString();
    } catch {
      return "—";
    }
  }, [dashboardStats?.updatedAt]);

  const bookingsTotal14 = useMemo(
    () => bookingsTrend.reduce((sum, v) => sum + v, 0),
    [bookingsTrend]
  );
  const leadsTotal14 = useMemo(
    () => leadsTrend.reduce((sum, v) => sum + v, 0),
    [leadsTrend]
  );
  const avgBookingsPerDay = useMemo(() => {
    if (!bookingsTrend.length) return 0;
    return Math.round((bookingsTotal14 / bookingsTrend.length) * 10) / 10;
  }, [bookingsTrend, bookingsTotal14]);
  const avgLeadsPerDay = useMemo(() => {
    if (!leadsTrend.length) return 0;
    return Math.round((leadsTotal14 / leadsTrend.length) * 10) / 10;
  }, [leadsTrend, leadsTotal14]);

  return (
    <div className="space-y-6" suppressHydrationWarning>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Sparkles size={16} />
            </div>
            <h2 className="truncate text-xl font-semibold">Overview</h2>
            <Badge variant="secondary" className="ml-1">
              Live
            </Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Monitor bookings and leads, and manage content in one place.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={() => void Promise.all([fetchQueues(), fetchAnalytics()])}>
            Refresh
          </Button>
          <Button asChild>
            <Link href="/admin/tour/tour/new">New Tour</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <DashboardKpiCard
          icon={Calendar}
          label="Pending bookings"
          value={dashboardStats?.bookingsPending ?? "—"}
          tone="emerald"
          onClick={() => router.push("/admin/tour/booking")}
        />
        <DashboardKpiCard
          icon={Mail}
          label="New contact forms"
          value={dashboardStats?.contactNew ?? "—"}
          tone="blue"
          onClick={() => router.push("/admin/contact-forms/contact-form")}
        />
        <DashboardKpiCard
          icon={MessageSquare}
          label="Pending tailor-made"
          value={dashboardStats?.tailorMadePending ?? "—"}
          tone="amber"
          onClick={() => router.push("/admin/contact-forms/tailor-made")}
        />
        <DashboardKpiCard
          icon={Users}
          label="Total users"
          value={dashboardStats?.usersTotal ?? "—"}
          tone="violet"
          onClick={() => router.push("/admin/users")}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Action required</CardTitle>
            <div className="text-xs text-muted-foreground">Last update: {updatedAt}</div>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">Bookings</div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2"
                  onClick={() => router.push("/admin/tour/booking")}
                >
                  View
                  <ChevronRight size={14} />
                </Button>
              </div>
              {loadingQueues ? (
                <div className="text-sm text-muted-foreground">Loading…</div>
              ) : pendingBookings.length === 0 ? (
                <div className="text-sm text-muted-foreground">No pending bookings.</div>
              ) : (
                <div className="space-y-2">
                  {pendingBookings.map((b, idx) => (
                    <div
                      key={(b._id || b.id || idx) as string}
                      className="rounded-md border bg-background p-3"
                    >
                      <div className="text-sm font-medium">{b.name}</div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {typeof b.tour === "object" ? (typeof b.tour.heading === 'object' ? b.tour.heading.en : b.tour.heading) : "Tour"}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">Contact forms</div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2"
                  onClick={() => router.push("/admin/contact-forms/contact-form")}
                >
                  View
                  <ChevronRight size={14} />
                </Button>
              </div>
              {loadingQueues ? (
                <div className="text-sm text-muted-foreground">Loading…</div>
              ) : newContacts.length === 0 ? (
                <div className="text-sm text-muted-foreground">No new messages.</div>
              ) : (
                <div className="space-y-2">
                  {newContacts.map((c) => (
                    <div key={c._id} className="rounded-md border bg-background p-3">
                      <div className="text-sm font-medium">{c.name}</div>
                      <div className="mt-1 text-xs text-muted-foreground truncate">
                        {c.email}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">Tailor-made</div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2"
                  onClick={() => router.push("/admin/contact-forms/tailor-made")}
                >
                  View
                  <ChevronRight size={14} />
                </Button>
              </div>
              {loadingQueues ? (
                <div className="text-sm text-muted-foreground">Loading…</div>
              ) : pendingTailorMade.length === 0 ? (
                <div className="text-sm text-muted-foreground">No pending requests.</div>
              ) : (
                <div className="space-y-2">
                  {pendingTailorMade.map((t) => (
                    <div key={t._id} className="rounded-md border bg-background p-3">
                      <div className="text-sm font-medium">{t.fullName}</div>
                      <div className="mt-1 text-xs text-muted-foreground truncate">
                        {t.email}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Live activity</CardTitle>
            <Activity className="text-muted-foreground" size={16} />
          </CardHeader>
          <CardContent>
            {activityFeed.length === 0 ? (
              <div className="text-sm text-muted-foreground">No recent activity.</div>
            ) : (
              <div className="space-y-3">
                {activityFeed.slice(0, 12).map((item, index) => (
                  <div
                    key={`${item.type}:${item.entityId}:${item.createdAt}:${index}`}
                    className="flex items-start gap-3"
                  >
                    <div className="mt-0.5 h-2 w-2 rounded-full bg-primary/70" />
                    <div className="min-w-0">
                      <div className="text-sm font-medium line-clamp-2">
                        {typeof item.title === 'object' ? (item.title as any).en : item.title}
                      </div>
                      <div className="mt-0.5 text-xs text-muted-foreground">
                        {formatWhen(item.createdAt)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Analytics (last 14 days)</CardTitle>
            <Badge variant="secondary">Trends</Badge>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium">Bookings</div>
                  <div className="text-xs text-muted-foreground">Total: {bookingsTotal14} • Avg/day: {avgBookingsPerDay}</div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2"
                  onClick={() => router.push("/admin/tour/booking")}
                >
                  Details
                  <ChevronRight size={14} />
                </Button>
              </div>

              {loadingAnalytics ? (
                <div className="text-sm text-muted-foreground">Loading…</div>
              ) : bookingsTrend.length === 0 ? (
                <div className="text-sm text-muted-foreground">Not enough data yet.</div>
              ) : (
                <MiniBarChart values={bookingsTrend} labels={trendLabels} barClassName="bg-emerald-500/70" />
              )}
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium">Leads</div>
                  <div className="text-xs text-muted-foreground">Contact + tailor-made • Total: {leadsTotal14} • Avg/day: {avgLeadsPerDay}</div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2"
                  onClick={() => router.push("/admin/contact-forms")}
                >
                  Details
                  <ChevronRight size={14} />
                </Button>
              </div>

              {loadingAnalytics ? (
                <div className="text-sm text-muted-foreground">Loading…</div>
              ) : leadsTrend.length === 0 ? (
                <div className="text-sm text-muted-foreground">Not enough data yet.</div>
              ) : (
                <MiniBarChart values={leadsTrend} labels={trendLabels} barClassName="bg-blue-500/70" />
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Top tours</CardTitle>
            <Badge variant="secondary">By views</Badge>
          </CardHeader>
          <CardContent>
            {loadingAnalytics ? (
              <div className="text-sm text-muted-foreground">Loading…</div>
            ) : topTours.length === 0 ? (
              <div className="text-sm text-muted-foreground">No tour analytics yet.</div>
            ) : (
              <div className="space-y-3">
                {topTours.map((t) => (
                  <div key={t._id} className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">
                        {(t.heading && typeof t.heading === 'object') ? (t.heading.en || t.heading.it || t.heading.de) : (t.heading || t.name || "Untitled")}
                      </div>
                      <div className="mt-0.5 text-xs text-muted-foreground">
                        {(t.isActive === false) ? "Inactive" : "Active"}
                      </div>
                    </div>
                    <div className="shrink-0 text-sm font-semibold">{t.viewCount ?? 0}</div>
                  </div>
                ))}
                <Button variant="outline" className="w-full" onClick={() => router.push("/admin/tour/tour")}
                >
                  Manage tours
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
