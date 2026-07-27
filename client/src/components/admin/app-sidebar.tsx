"use client"

import * as React from "react"
import {
  LayoutDashboard,
  Users,
  FileText,
  Map,
  Mail,
  Folder,
  FolderOpen,
  Target,
  Scissors,
  Phone,
  Sparkles,
  ChevronRight,
  ChevronsUpDown,
  LogOut,
  Settings,
  User,
  Bell,
  HelpCircle,
  Calendar,
  Database,
  Layout,
  Menu as MenuIcon,
  Sun,
  Moon,
} from "lucide-react"
import { ThemeToggle } from "./ThemeToggle"

import { useAuth } from '@/contexts/AuthContext'
import { useTailorMade } from '@/contexts/TailorMadeContext'
import { useContactForm } from '@/contexts/ContactFormContext'
import { useBooking } from '@/contexts/BookingContext'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import Link from "next/link"
import { usePathname } from "next/navigation"

const menuItems = [
  {
    id: 'overview',
    title: 'Overview',
    icon: LayoutDashboard,
    url: '/admin',
  },
  {
    id: 'users',
    title: 'Users',
    icon: Users,
    url: '/admin/users',
  },
  {
    id: 'blogs',
    title: 'Blogs',
    icon: FileText,
    items: [
      {
        id: 'blog-category',
        title: 'Category',
        icon: Folder,
        url: '/admin/blogs/category',
      },
      {
        id: 'blog-subcategory',
        title: 'Sub Category',
        icon: FolderOpen,
        url: '/admin/blogs/subcategory',
      },
      {
        id: 'blog-destination',
        title: 'Destinations',
        icon: Map,
        url: '/admin/destinations',
      },
      {
        id: 'blog-blog',
        title: 'Articles',
        icon: Target,
        url: '/admin/blogs/articles',
      },
    ],
  },
  {
    id: 'tour',
    title: 'Tour',
    icon: Map,
    items: [
      {
        id: 'tour-category',
        title: 'Category',
        icon: Folder,
        url: '/admin/tour/category',
      },
      {
        id: 'tour-subcategory',
        title: 'Sub Category',
        icon: FolderOpen,
        url: '/admin/tour/subcategory',
      },
      {
        id: 'tour-tour',
        title: 'Tour',
        icon: Target,
        url: '/admin/tour/tour',
      },
      // NOTE: "Special Offers" removed — there is no /admin/special-offers
      // route (it is a visitor-only page driven by discounted tours), so the
      // link 404'd. Re-add here if a dedicated admin manager is ever built.
    ],
  },
  {
    id: 'contact-forms',
    title: 'Contact Forms',
    icon: Mail,
    items: [
      {
        id: 'tour-booking',
        title: 'Bookings',
        icon: Calendar,
        url: '/admin/tour/booking',
        badgeKey: 'booking',
      },
      {
        id: 'tailor-made',
        title: 'Tailor-Made',
        icon: Scissors,
        url: '/admin/contact-forms/tailor-made',
        badgeKey: 'tailorMade',
      },
      {
        id: 'contact-form',
        title: 'Contact Form',
        icon: Phone,
        url: '/admin/contact-forms/contact-form',
        badgeKey: 'contactForm',
      },
    ],
  },
  {
    id: 'content-management',
    title: 'Content Management',
    icon: Database,
    items: [
      {
        id: 'menus',
        title: 'Menus',
        icon: MenuIcon,
        url: '/admin/content-management/menus',
      },
      {
        id: 'slider-content',
        title: 'Slider Content',
        icon: FileText,
        url: '/admin/content-management/slider-content',
      },
      {
        id: 'general-content',
        title: 'General Content',
        icon: Layout,
        url: '/admin/content-management/general-content',
      },
      {
        id: 'video-management',
        title: 'Video Management',
        icon: Sparkles,
        url: '/admin/content-management/video-management',
      },
      {
        id: 'faq-management',
        title: 'FAQ Management',
        icon: HelpCircle,
        url: '/admin/content-management/faq',
      },
    ],
  },
]

import { useNotifications } from '@/contexts/NotificationContext'

export function AppSidebar() {
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const { unreadCount } = useTailorMade()
  const { newCount } = useContactForm()
  const { pendingCount } = useBooking()
  const { unreadCount: notificationCount } = useNotifications()

  const getBadgeCount = (item: any) => {
    if (item.badgeKey === 'tailorMade') {
      return unreadCount
    }
    if (item.badgeKey === 'contactForm') {
      return newCount
    }
    if (item.badgeKey === 'booking') {
      return pendingCount
    }
    if (item.badgeKey === 'notifications') {
      return notificationCount
    }
    return item.badge
  }

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/admin">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Sparkles className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">Admin Panel</span>
                  <span className="truncate text-xs">JES Egypt Tours</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const Icon = item.icon
                const hasChildren = item.items && item.items.length > 0

                if (hasChildren) {
                  return (
                    <Collapsible
                      key={item.id}
                      asChild
                      defaultOpen={
                        item.id === 'contact-forms' ||
                        item.items?.some((subItem) => pathname === subItem.url)
                      }
                      className="group/collapsible"
                    >
                      <SidebarMenuItem>
                        <CollapsibleTrigger asChild>
                          <SidebarMenuButton tooltip={item.title}>
                            <Icon />
                            <span>{item.title}</span>
                            <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                          </SidebarMenuButton>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <SidebarMenuSub>
                            {item.items?.map((subItem) => {
                              const SubIcon = subItem.icon
                              const badgeCount = getBadgeCount(subItem)
                              const isActive = pathname === subItem.url

                              return (
                                <SidebarMenuSubItem key={subItem.id}>
                                  <SidebarMenuSubButton asChild isActive={isActive}>
                                    <Link href={subItem.url}>
                                      <SubIcon />
                                      <span>{subItem.title}</span>
                                      {badgeCount && badgeCount > 0 && (
                                        <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-medium text-primary-foreground">
                                          {badgeCount}
                                        </span>
                                      )}
                                    </Link>
                                  </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                              )
                            })}
                          </SidebarMenuSub>
                        </CollapsibleContent>
                      </SidebarMenuItem>
                    </Collapsible>
                  )
                }

                const isActive = pathname === item.url

                return (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton asChild isActive={isActive} tooltip={item.title}>
                      <Link href={item.url!}>
                        <Icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                    <User className="size-4" />
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-semibold">{user?.name || 'Admin User'}</span>
                      {notificationCount > 0 && (
                        <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                          {notificationCount}
                        </span>
                      )}
                    </div>
                    <span className="truncate text-xs">{user?.email || 'admin@gotur.com'}</span>
                  </div>
                  <ChevronsUpDown className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                side="bottom"
                align="end"
                sideOffset={4}
              >
                <DropdownMenuLabel className="p-0 font-normal">
                  <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                    <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                      <User className="size-4" />
                    </div>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold">{user?.name || 'Admin User'}</span>
                      <span className="truncate text-xs">{user?.email || 'admin@gotur.com'}</span>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem asChild>
                    <Link href={`/admin/users/${user?.id}/edit`}>
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <ThemeToggle />
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/admin/notifications" className="flex items-center w-full">
                      <Bell className="mr-2 h-4 w-4" />
                      <span>Notifications</span>
                      {notificationCount > 0 && (
                        <span className="ml-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-medium text-white">
                          {notificationCount}
                        </span>
                      )}
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
