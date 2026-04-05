import { createAvatar } from "@dicebear/core";
import { initials, identicon } from "@dicebear/collection";

import { cn } from "@/lib/utils";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface GeneratedAvatarProps {
  seed: string;
  variant?: "initials" | "identicon";
  className?: string;
}

export const GeneratedAvatar = ({
  seed,
  className,
  variant = "initials",
}: GeneratedAvatarProps) => {
  let avatar = createAvatar(initials, {
    seed,
    fontWeight: 500,
    fontSize: 42,
  });
  if (variant === "identicon") {
    avatar = createAvatar(identicon, {
      seed,
      randomizeIds: true,
    });
  }

  return (
    <Avatar className={cn(className)}>
      <AvatarImage src={avatar.toDataUri()} alt="Avatar" />
      <AvatarFallback>{seed.charAt(0).toUpperCase()}</AvatarFallback>
    </Avatar>
  );
};
