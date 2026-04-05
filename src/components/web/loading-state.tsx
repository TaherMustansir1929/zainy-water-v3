import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

type LoadingStateProps = {
  message?: string;
  className?: string;
};

export function LoadingState({
  message = "Loading...",
  className,
}: LoadingStateProps) {
  return (
    <section
      className={cn(
        "flex w-full max-w-7xl items-center justify-center rounded-2xl border bg-card p-8 shadow-[inset_0_1px_4px_rgba(0,0,0,0.12)]",
        className,
      )}
    >
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Spinner className="size-4" />
        {message}
      </div>
    </section>
  );
}
