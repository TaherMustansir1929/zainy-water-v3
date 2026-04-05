import * as React from "react"

import {
  Dollar,
  Home01Icon as Home,
  InboxIcon as Inbox,
  PlusSignCircleIcon as PlusCircle,
  ShoppingCart01Icon as ShoppingCart,
  UserIcon as User,
} from "@hugeicons/core-free-icons"
import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"

const items = [
  {
    title: "Dashboard",
    url: "/admin/dashboard",
    icon: Home,
  },
  {
    title: "Bottle Inventory",
    url: "/admin/bottle-inventory",
    icon: Inbox,
  },
  {
    title: "Deliveries",
    url: "/admin/deliveries",
    icon: ShoppingCart,
  },
  {
    title: "Customers",
    url: "/admin/customers",
    icon: User,
  },
  {
    title: "Expenses",
    url: "/admin/expenses",
    icon: Dollar,
  },
  {
    title: "Moderators",
    url: "/admin/moderators",
    icon: PlusCircle,
  },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="border-b border-gray-200 p-2">
        <a href="/admin/dashboard" className="flex items-center justify-center rounded-xl p-1">
          <img src="/logo.jpg" alt="Zainy Water" width={150} height={150} className="h-autoobject-contain" />
        </a>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={items} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
