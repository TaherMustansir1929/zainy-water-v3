import { ClerkLoaded, ClerkLoading, UserButton } from "@clerk/tanstack-react-start";
import { HugeiconsIcon } from "@hugeicons/react";
import { UserCircleIcon } from "@hugeicons/core-free-icons";
import { SidebarTrigger } from "@/components/ui/sidebar";

export function AdminHeader() {
  return (
    <header className="flex w-full items-center justify-between border-b border-gray-200 p-2">
      <SidebarTrigger />
      <h1 className="text-lg font-semibold">Admin Panel</h1>
      <ClerkLoading>
        <HugeiconsIcon icon={UserCircleIcon} />
      </ClerkLoading>
      <ClerkLoaded>
        <UserButton />
      </ClerkLoaded>
    </header>
  );
}
