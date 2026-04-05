"use client"

import { useLocation } from "@tanstack/react-router"
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"
import { HugeiconsIcon } from "@hugeicons/react"

export function NavMain({
  items,
}: {
  items: {
    title: string
    url: string
    icon: React.ComponentProps<typeof HugeiconsIcon>["icon"]
  }[]
}) {
  const { pathname } = useLocation()

  const normalizePath = (value: string) => {
    const normalized = value.replace(/\/+$/, "")
    return normalized === "" ? "/" : normalized
  }

  const isItemActive = (itemUrl: string) => {
    const currentPath = normalizePath(pathname)
    const itemPath = normalizePath(itemUrl)

    if (itemPath === "/admin/dashboard") {
      return (
        currentPath === "/admin" ||
        currentPath === "/admin/dashboard" ||
        currentPath.startsWith("/admin/dashboard/")
      )
    }

    return currentPath === itemPath || currentPath.startsWith(`${itemPath}/`)
  }

  return (
    <SidebarGroup>
      <SidebarMenu>
        {items.map((item) => {
          const active = isItemActive(item.url)

          return (
          <SidebarMenuItem key={item.title}>
            <SidebarMenuButton
              render={<a href={item.url} />}
              tooltip={item.title}
              isActive={active}
              className={cn(
                active && "bg-primary/10 text-primary shadow-sm hover:bg-primary/10 hover:text-primary"
              )}
            >
              <HugeiconsIcon icon={item.icon} strokeWidth={2} className="-ms-0.5 me-1.5 opacity-60" />
              <span>{item.title}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}
