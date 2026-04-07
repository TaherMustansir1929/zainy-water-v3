import { HeadContent, Scripts, createRootRoute } from "@tanstack/react-router"
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools"
import { TanStackDevtools } from "@tanstack/react-devtools"
import { ClerkProvider } from "@clerk/tanstack-react-start"
import { shadcn } from "@clerk/themes"

import appCss from "../styles.css?url"
import { Toaster } from "@/components/ui/sonner"

const SITE_NAME = `${process.env.NODE_ENV === "development" && "[DEV]"} Zainy Water v3`
const SITE_DESCRIPTION =
  "Bottle supply management system for Zainy Water, built with TanStack Start"
const SITE_URL = "https://zainy-water.vercel.app"
const OG_IMAGE_URL = "https://zainy-water.vercel.app/logo.jpg";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      {
        title: SITE_NAME,
      },
      {
        name: "description",
        content: SITE_DESCRIPTION,
      },
      {
        name: "robots",
        content: "index,follow",
      },
      {
        name: "theme-color",
        content: "#0095ff",
      },
      {
        name: "format-detection",
        content: "telephone=no",
      },
      {
        property: "og:type",
        content: "website",
      },
      {
        property: "og:site_name",
        content: SITE_NAME,
      },
      {
        property: "og:title",
        content: SITE_NAME,
      },
      {
        property: "og:description",
        content: SITE_DESCRIPTION,
      },
      {
        property: "og:url",
        content: SITE_URL,
      },
      {
        property: "og:image",
        content: OG_IMAGE_URL,
      },
      {
        name: "twitter:card",
        content: "summary_large_image",
      },
      {
        name: "twitter:title",
        content: SITE_NAME,
      },
      {
        name: "twitter:description",
        content: SITE_DESCRIPTION,
      },
      {
        name: "twitter:image",
        content: OG_IMAGE_URL,
      },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      {
        rel: "canonical",
        href: SITE_URL,
      },
      {
        rel: "manifest",
        href: "/manifest.json",
      },
    ],
  }),
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        <ClerkProvider
          appearance={{
            theme: shadcn,
            variables: {
              colorPrimary: "#0095ff",
            },
          }}
        >
          <Toaster position="top-center" closeButton />
          {children}
        </ClerkProvider>
        <TanStackDevtools
          config={{
            position: "bottom-right",
          }}
          plugins={[
            {
              name: "Tanstack Router",
              render: <TanStackRouterDevtoolsPanel />,
            },
          ]}
        />
        <Scripts />
      </body>
    </html>
  )
}
