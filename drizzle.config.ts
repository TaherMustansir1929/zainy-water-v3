import "dotenv/config"
import { defineConfig } from "drizzle-kit"

const db_url =
  process.env.NODE_ENV === "production"
    ? process.env.DATABASE_URL
    : process.env.DEV_DATABASE_URL
if (!db_url) {
  throw new Error("DATABASE_URL is not defined")
}

export default defineConfig({
  out: "./drizzle",
  schema: "./src/db/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: db_url,
  },
})
