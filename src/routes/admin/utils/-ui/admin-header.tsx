import { ClerkLoaded, ClerkLoading, SignOutButton } from "@clerk/tanstack-react-start";
import { HugeiconsIcon } from "@hugeicons/react";
import { UserCircleIcon } from "@hugeicons/core-free-icons";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

export function AdminHeader() {
  return (
    <header className="flex w-full items-center justify-between border-b border-gray-200 p-2">
      <SidebarTrigger className={'cursor-pointer'}/>
      <h1 className="text-lg font-semibold">Admin Panel</h1>
      <ClerkLoading>
        <HugeiconsIcon icon={UserCircleIcon} />
      </ClerkLoading>
      <ClerkLoaded>
        <Button className={"shadow-sm"} variant="outline">
        <SignOutButton children="Log out"/>
        </Button>
      </ClerkLoaded>
    </header>
  );
}
