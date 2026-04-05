import { ClerkLoaded, ClerkLoading, SignUp } from "@clerk/tanstack-react-start";
import { HugeiconsIcon } from "@hugeicons/react";
import { createFileRoute } from "@tanstack/react-router";
import { Loading03Icon } from "@hugeicons/core-free-icons";

export const Route = createFileRoute("/_auth/sign-up/$")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div>
      <ClerkLoading>
        <HugeiconsIcon icon={Loading03Icon} className="animate-spin" />
      </ClerkLoading>
      <ClerkLoaded>
        <SignUp forceRedirectUrl="/callback" fallbackRedirectUrl="/callback" />
      </ClerkLoaded>
    </div>
  );
}
