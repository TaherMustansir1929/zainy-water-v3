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
        "flex w-full max-w-7xl items-center justify-center p-8",
        className,
      )}
    >
      <div className="flex items-center gap-2 text-xl text-muted-foreground">
        <Spinner className="size-6" />
        {message}
      </div>
    </section>
  );
}
