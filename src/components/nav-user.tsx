"use client"

import * as React from "react"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { HugeiconsIcon } from "@hugeicons/react"
import { UserIcon } from "@hugeicons/core-free-icons"
import { UserButton, useUser } from "@clerk/tanstack-react-start"

export function NavUser() {
  const { user } = useUser()
  const userButtonContainerRef = React.useRef<HTMLDivElement>(null)

  const fullName = [user?.firstName?.trim(), user?.lastName?.trim()]
    .filter(Boolean)
    .join(" ")
  const displayName = fullName || user?.username || "Account"
  const email = user?.primaryEmailAddress?.emailAddress || "No email available"
  const initials = displayName
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

  const handleOpenUserMenu = () => {
    const userButton = userButtonContainerRef.current?.querySelector("button")
    userButton?.click()
  }

  return (
    <>
      <div ref={userButtonContainerRef} className="sr-only">
        <UserButton />
      </div>

      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton
            size="lg"
            onClick={handleOpenUserMenu}
            tooltip="Account"
            className="shadow-sm"
          >
            <Avatar>
              <AvatarImage src={user?.imageUrl} alt={displayName} />
              <AvatarFallback>{initials || "A"}</AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">{displayName}</span>
              <span className="truncate text-xs text-muted-foreground">{email}</span>
            </div>
            <HugeiconsIcon icon={UserIcon} strokeWidth={2} />
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </>
  )
}
