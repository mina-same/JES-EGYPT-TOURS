"use client";

import React, { useMemo } from "react";
import { usePathname } from "next/navigation";
import { LogOut, User } from "lucide-react";

import { useAuth } from "@/contexts/AuthContext";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const getAdminTitle = (pathname: string) => {
  if (pathname === "/admin") return "Dashboard";
  if (pathname.startsWith("/admin/users")) return "Users";
  if (/^\/admin\/blogs\/articles\/[^/]+\/view$/.test(pathname)) return "View Article";
  if (/^\/admin\/blogs\/category\/[^/]+\/view$/.test(pathname)) return "View Blog Category";
  if (/^\/admin\/blogs\/subcategory\/[^/]+\/view$/.test(pathname)) return "View Blog Subcategory";
  if (pathname.startsWith("/admin/blogs/articles")) return "Articles";
  if (pathname.startsWith("/admin/blogs")) return "Blogs";
  if (pathname.startsWith("/admin/tour/booking")) return "Bookings";
  if (/^\/admin\/tour\/tour\/[^/]+\/view$/.test(pathname)) return "View Tour";
  if (pathname.startsWith("/admin/tour/tour")) return "Tours";
  if (/^\/admin\/tour\/category\/[^/]+\/view$/.test(pathname)) return "View Tour Category";
  if (pathname.startsWith("/admin/tour/category")) return "Tour Categories";
  if (/^\/admin\/tour\/subcategory\/[^/]+\/view$/.test(pathname)) return "View Tour Subcategory";
  if (pathname.startsWith("/admin/tour/subcategory")) return "Tour Subcategories";
  if (/^\/admin\/destinations\/[^/]+\/view$/.test(pathname)) return "View Destination";
  if (pathname.startsWith("/admin/contact-forms/tailor-made")) return "Tailor-Made Requests";
  if (pathname.startsWith("/admin/contact-forms/contact-form")) return "Contact Forms";
  if (pathname.startsWith("/admin/content-management/slider-content")) return "Slider Content";
  if (pathname.startsWith("/admin/contact-forms")) return "Contact Forms";
  if (pathname.startsWith("/admin/content-management")) return "Content";
  return "Admin";
};

export default function AdminHeader() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const title = useMemo(() => getAdminTitle(pathname), [pathname]);

  const handleLogout = async () => {
    try {
      await logout();
    } catch {
      // ignore
    }
  };

  return (
    <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="h-4" />
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <h1 className="truncate text-base font-semibold">{title}</h1>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <User />
            <span className="max-w-[140px] truncate">
              {user?.name || user?.email || "Account"}
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="text-xs">
            {(user as any)?.role ? `Role: ${(user as any).role}` : "Admin"}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
            <LogOut />
            Logout
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
