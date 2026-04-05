import { ClerkLoaded, ClerkLoading, SignIn } from '@clerk/tanstack-react-start';
import { HugeiconsIcon } from '@hugeicons/react';
import { createFileRoute } from '@tanstack/react-router'
import { Loading03Icon } from '@hugeicons/core-free-icons';

export const Route = createFileRoute('/_auth/sign-in/$')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <div>
      <ClerkLoading>
        <HugeiconsIcon icon={Loading03Icon} className='animate-spin' />
      </ClerkLoading>
      <ClerkLoaded>
        <SignIn forceRedirectUrl='/callback' fallbackRedirectUrl='/callback' />
      </ClerkLoaded>
    </div>
  );
}
