import { cn } from "@/lib/utils";

type Props = {
  className?: string;
};

export const MainFooter = ({ className }: Props) => {
  return (
    <footer className={cn("", className)}>
      All Rights Reserved &copy; 2026. Developed by <a href="https://github.com/TaherMustansir1929" target="_blank" rel="noopener noreferrer" className="underline">
        @zeoxd
      </a>
    </footer>
  );
};
