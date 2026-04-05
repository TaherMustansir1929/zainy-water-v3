import { createFileRoute, Link } from "@tanstack/react-router"
import { HugeiconsIcon } from "@hugeicons/react"
import { UserDollarIcon, UserLock01Icon } from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"

export const Route = createFileRoute("/")({ component: App })

function App() {
  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-center p-4">
      <div className="flex flex-col items-center justify-around gap-10 rounded-lg border border-border px-10 py-8">
        <div className="space-y-4 text-center">
          <h1 className="font-heading text-2xl font-bold md:text-4xl">
            Welcome to Zainy Water!
          </h1>
          <p className="text-sm text-muted-foreground">
            Which role would you like to take on?
          </p>
        </div>

        <div className="flex flex-col items-center justify-center gap-6 sm:flex-row">
          <Button className="min-w-30 bg-blue-500 text-lg text-white">
            <Link to={"/admin"} className="flex items-center gap-2">
              <HugeiconsIcon icon={UserLock01Icon} className="size-5 animate-pulse" />
              Admin
            </Link>
          </Button>
          <Button className="min-w-30 bg-green-500 text-lg text-white">
            <Link to={"/moderator"} className="flex items-center gap-2">
              <HugeiconsIcon icon={UserDollarIcon} className="size-5 animate-pulse" />
              Moderator
            </Link>
          </Button>
        </div>
      </div>
    </main>
  )
}
