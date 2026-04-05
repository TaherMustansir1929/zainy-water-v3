import { Pool } from "@neondatabase/serverless"
import { drizzle } from "drizzle-orm/neon-serverless"

const db_url = process.env.NODE_ENV === "production" ? process.env.DATABASE_URL : process.env.DEV_DATABASE_URL
if (!db_url) {
  throw new Error("DATABASE_URL is not defined")
}

const pool = new Pool({ connectionString: db_url })
export const db = drizzle({ client: pool })
