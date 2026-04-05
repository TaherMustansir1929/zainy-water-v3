"use client";

import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { format } from "date-fns";
import { moderatorLogout } from "../login/-server/modMiddleware.function";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useConfirm } from "@/hooks/use-confirm";
import { useModeratorSession } from "@/hooks/use-moderator-session";


export const ModHeader = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const {
    hasHydrated,
    isAuthenticated,
    moderator,
    sessionToken,
    clearModeratorSession,
  } = useModeratorSession();

  const [LogoutConfirmDialog, logout_confirm] = useConfirm(
    "Are you sure you want to log out?",
    "You will be redirected to the login page."
  );

  const handleLogout = async () => {
    const ok = await logout_confirm();
    if (!ok) return;

    try {
      if (sessionToken) {
        await moderatorLogout({ data: { sessionToken } });
      }
    } finally {
      clearModeratorSession();
      await navigate({ to: "/moderator/login", replace: true });
    }
  };

  return (
    <header className="flex w-full items-center justify-between border-b border-gray-200 p-2">
      <LogoutConfirmDialog />
      <Link to="/moderator" className="text-lg font-semibold">
        <img src="/logo.jpg" alt="Zainy Water" width={120} height={120} />
      </Link>
      <h1 className="flex flex-col items-center justify-center capitalize">
        Welcome, {hasHydrated && isAuthenticated ? moderator?.name : "Guest"}{" "}
        <Badge variant={"outline"}>
          {format(new Date(), "do MMMM hh:mm:ss aaa")}
        </Badge>
      </h1>

      {isAuthenticated && pathname !== "/moderator/login" && (
        <Button variant="outline" size={"sm"} onClick={handleLogout} className="shadow-sm">
          Logout
        </Button>
      )}
    </header>
  );
};
