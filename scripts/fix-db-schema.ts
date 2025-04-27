import "dotenv/config";
import { sql } from "drizzle-orm";
import { db } from "../lib/db";

async function main() {
    try {
        console.log("Starting database schema fix...");

        // Step 1: Check if table exists
        console.log("Checking if embeddings table exists...");
        const result = await db.execute(sql`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public'
                AND table_name = 'embeddings'
            );
        `);

        const tableExists = result[0]?.exists;
        console.log(`Embeddings table exists: ${tableExists}`);

        // Step 2: Add metadata column if table exists
        if (tableExists) {
            console.log("Adding metadata column if it doesn't exist...");
            await db.execute(sql`
                ALTER TABLE embeddings 
                ADD COLUMN IF NOT EXISTS metadata jsonb;
            `);
            console.log("✅ Schema updated successfully");
        } else {
            console.error("❌ The embeddings table doesn't exist! Please run full migrations.");
            console.log("Run: npm run db:migrate");
            process.exit(1);
        }

        console.log("Schema fix completed successfully!");
    } catch (error) {
        console.error("Error during schema fix:", error);
        process.exit(1);
    }

    process.exit(0);
}

main(); 