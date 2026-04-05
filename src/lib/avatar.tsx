import { identicon, initials } from "@dicebear/collection";
import { createAvatar } from "@dicebear/core";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

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
