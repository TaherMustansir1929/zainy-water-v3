import * as React from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowRight02Icon,
  Key01Icon,
  Loading03Icon,
} from "@hugeicons/core-free-icons";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  activateAdminWithDeveloperKey,
  getCallbackState,
} from "./-server/developer-key-auth.function";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const ADMIN_DEVELOPER_KEY_STORAGE = "zainy:admin:developer-key";

export const Route = createFileRoute("/_auth/callback")({
  loader: async () => await getCallbackState(),
  component: CallbackRouteComponent,
});

function CallbackRouteComponent() {
  const navigate = useNavigate();
  const [developerKey, setDeveloperKey] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    const storedDeveloperKey = window.localStorage.getItem(
      ADMIN_DEVELOPER_KEY_STORAGE,
    );

    if (storedDeveloperKey) {
      setDeveloperKey(storedDeveloperKey);
    }
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!developerKey.trim()) {
      toast.error("Please provide a developer key.");
      return;
    }

    setIsSubmitting(true);

    try {
      const activationPromise = activateAdminWithDeveloperKey({
        data: {
          developerKey,
        },
      });

      void toast.promise(activationPromise, {
        loading: "Validating developer key...",
        success: "Access granted. Redirecting to dashboard...",
        error: (error) =>
          error instanceof Error ? error.message : "Failed to activate admin access.",
      });

      await activationPromise;
      window.localStorage.setItem(ADMIN_DEVELOPER_KEY_STORAGE, developerKey.trim());
      await navigate({ to: "/admin/dashboard" });
    } catch {
      window.localStorage.removeItem(ADMIN_DEVELOPER_KEY_STORAGE);
      // Errors are surfaced by toast.promise.
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="w-full max-w-md p-4">
      <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold">Developer Approval Required</h1>
          <p className="text-sm text-muted-foreground">
            Enter a valid developer key to activate your admin
            access.
          </p>
        </div>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label htmlFor="developer-key" className="text-sm font-medium">
              Developer key
            </label>
            <div className="relative">
              <HugeiconsIcon
                icon={Key01Icon}
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                id="developer-key"
                value={developerKey}
                onChange={(event) => setDeveloperKey(event.target.value)}
                placeholder="Enter developer key"
                className="pl-9"
                autoComplete="off"
              />
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <HugeiconsIcon icon={Loading03Icon} className="size-4 animate-spin" />
            ) : (
              <HugeiconsIcon icon={ArrowRight02Icon} className="size-4" />
            )}
            {isSubmitting ? "Verifying..." : "Continue to dashboard"}
          </Button>
        </form>
      </section>
    </main>
  );
}
