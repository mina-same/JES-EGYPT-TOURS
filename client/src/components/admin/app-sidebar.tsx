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
  Search,
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
} from "lucide-react"

import { useAuth } from '@/contexts/AuthContext'
import { useTailorMade } from '@/contexts/TailorMadeContext'
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
        id: 'blog-blog',
        title: 'Blogs',
        icon: Target,
        url: '/admin/blogs/blog',
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
      {
        id: 'tour-booking',
        title: 'Bookings',
        icon: Calendar,
        url: '/admin/tour/booking',
      },
    ],
  },
  {
    id: 'contact-forms',
    title: 'Contact Forms',
    icon: Mail,
    items: [
      {
        id: 'tailor-made',
        title: 'Tailor-Made',
        icon: Scissors,
        url: '/admin/contact-forms/tailor-made',
        badgeKey: 'tailorMade',
      },
      {
        id: 'search-form',
        title: 'Search Form',
        icon: Search,
        url: '/admin/contact-forms/search-form',
        badge: 8,
      },
      {
        id: 'contact-form',
        title: 'Contact Form',
        icon: Phone,
        url: '/admin/contact-forms/contact-form',
        badge: 5,
      },
    ],
  },
]

export function AppSidebar() {
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const { unreadCount } = useTailorMade()

  const getBadgeCount = (item: any) => {
    if (item.badgeKey === 'tailorMade') {
      return unreadCount
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
                      defaultOpen={item.items?.some((subItem) => pathname === subItem.url)}
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
                    <span className="truncate font-semibold">{user?.name || 'Admin User'}</span>
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
                  <DropdownMenuItem>
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Bell className="mr-2 h-4 w-4" />
                    <span>Notifications</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <HelpCircle className="mr-2 h-4 w-4" />
                    <span>Help & Support</span>
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
