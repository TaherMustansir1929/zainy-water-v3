import { createServerFn } from "@tanstack/react-start";

export type ModeratorWorkspaceData = {
  loadedAt: number;
};

export const getModeratorWorkspaceData = createServerFn({ method: "GET" })
  .handler(() => {
    return {
      loadedAt: Date.now(),
    } satisfies ModeratorWorkspaceData;
  });
