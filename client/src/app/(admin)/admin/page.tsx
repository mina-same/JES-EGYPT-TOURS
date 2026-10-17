"use client";
import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Calendar, Mail, MessageSquare, Tag, Users } from 'lucide-react';
import { API_ENDPOINTS } from '@/config/api';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { adminFetch } from '@/lib/adminNotifications';
import { useAdminRequestListRefresh } from '@/hooks/useAdminRequestListRefresh';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import DashboardKpiCard from '@/components/admin/DashboardKpiCard';
import MiniBarChart from '@/components/admin/MiniBarChart';
interface Overview {
  counts: { bookingsPending: number; contactNew: number; tailorMadePending: number; usersTotal?: number; specialOffers?: number; updatedAt: string };
  queues: { bookings: Array<{ _id: string; name: string; tourSnapshot?: { heading?: string | { en?: string } }; tour?: { heading?: string | { en?: string } } | null }>; contacts: Array<{ _id: string; name: string; email: string }>; tailorMade: Array<{ _id: string; fullName: string; email: string }> };
  analytics: { dates: string[]; bookings: number[]; leads: number[] };
}
export default function AdminDashboard() {
  const { user } = useAuth(), { connected } = useNotifications();
  const [data, setData] = useState<Overview | null>(null), [error, setError] = useState<string | null>(null);
  const sequence = useRef(0);
  const allowed = (permission: string) => user?.role === 'superadmin' || user?.permissions?.includes(permission);
  const refresh = useCallback(async () => {
    const current = ++sequence.current;
    try {
      const body = await adminFetch(`${API_ENDPOINTS.NOTIFICATIONS.BASE}/overview`);
      if (current === sequence.current) { setData(body); setError(null); }
    } catch (error) { if (current === sequence.current) setError(error instanceof Error ? error.message : 'Unable to load dashboard'); }
  }, []);
  useEffect(() => { void refresh(); }, [refresh, user?.id]);
  useAdminRequestListRefresh(refresh);
  const cards = [
    { permission: 'booking:read', label: 'Pending bookings', value: data?.counts.bookingsPending, icon: Calendar, href: '/admin/tour/booking' },
    { permission: 'contact:read', label: 'New contact forms', value: data?.counts.contactNew, icon: Mail, href: '/admin/contact-forms/contact-form' },
    { permission: 'tailor_made:read', label: 'Pending tailor-made', value: data?.counts.tailorMadePending, icon: MessageSquare, href: '/admin/contact-forms/tailor-made' },
    { permission: 'tour:read', label: 'Special offers', value: data?.counts.specialOffers, icon: Tag, href: '/admin/special-offers' },
    { permission: 'user:read', label: 'Total users', value: data?.counts.usersTotal, icon: Users, href: '/admin/users' },
  ];
  const queues = [
    { permission: 'booking:read', title: 'Bookings', href: '/admin/tour/booking', rows: (data?.queues.bookings || []).map(row => { const heading = row.tour?.heading || row.tourSnapshot?.heading; return { id: row._id, name: row.name, detail: typeof heading === 'object' ? heading.en || 'Tour' : heading || 'Tour' }; }) },
    { permission: 'contact:read', title: 'Contact forms', href: '/admin/contact-forms/contact-form', rows: (data?.queues.contacts || []).map(row => ({ id: row._id, name: row.name, detail: row.email })) },
    { permission: 'tailor_made:read', title: 'Tailor-made', href: '/admin/contact-forms/tailor-made', rows: (data?.queues.tailorMade || []).map(row => ({ id: row._id, name: row.fullName, detail: row.email })) },
  ];
  const labels = data?.analytics.dates.map(date => new Date(date + 'T12:00:00Z').toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'Africa/Cairo' })) || [];
  return <div className="space-y-6">
    <div className="flex items-center justify-between"><div><h2 className="text-xl font-semibold">Overview</h2><p className="text-sm text-muted-foreground">{connected ? 'Live updates' : 'Automatic refresh'} ? {data ? `Updated ${new Date(data.counts.updatedAt).toLocaleTimeString()}` : 'Loading...'}</p></div><Button variant="outline" onClick={() => void refresh()}>Refresh</Button></div>
    {error && <p role="alert" className="text-red-600">{error}</p>}
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">{cards.filter(card => allowed(card.permission)).map(card => <Link key={card.label} href={card.href}><DashboardKpiCard label={card.label} value={card.value ?? '?'} icon={card.icon} /></Link>)}</div>
    <Card><CardHeader><CardTitle>Action required</CardTitle></CardHeader><CardContent className="grid gap-4 md:grid-cols-3">{queues.filter(queue => allowed(queue.permission)).map(queue => <div key={queue.title} className="space-y-2"><div className="flex items-center justify-between"><h3 className="font-medium">{queue.title}</h3><Link href={queue.href}>View all</Link></div>{queue.rows.length ? queue.rows.map(row => <Link className="block rounded-md border p-3 hover:bg-muted" key={row.id} href={`${queue.href}?id=${encodeURIComponent(row.id)}`}><div className="text-sm font-medium">{row.name}</div><div className="truncate text-xs text-muted-foreground">{row.detail}</div></Link>) : <p className="text-sm text-muted-foreground">{data ? 'No pending requests.' : 'Loading...'}</p>}</div>)}</CardContent></Card>
    {data && <Card><CardHeader><CardTitle>Analytics ? last 14 days (Egypt time)</CardTitle></CardHeader><CardContent className="grid gap-6 md:grid-cols-2">
      {allowed('booking:read') && <div><h3>Bookings ? Total: {data.analytics.bookings.reduce((a, b) => a + b, 0)}</h3><MiniBarChart values={data.analytics.bookings} labels={labels} barClassName="bg-emerald-500/70" /></div>}
      {(allowed('contact:read') || allowed('tailor_made:read')) && <div><h3>Contact + tailor-made ? Total: {data.analytics.leads.reduce((a, b) => a + b, 0)}</h3><MiniBarChart values={data.analytics.leads} labels={labels} barClassName="bg-blue-500/70" /></div>}
    </CardContent></Card>}
  </div>;
}
