import { neon } from "@neondatabase/serverless"
import { drizzle } from "drizzle-orm/neon-http"

const db_url = process.env.NODE_ENV === "production" ? process.env.DATABASE_URL : process.env.DEV_DATABASE_URL
if (!db_url) {
  throw new Error("DATABASE_URL is not defined")
}

const sql = neon(db_url)
export const db = drizzle({ client: sql })
