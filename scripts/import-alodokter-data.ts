import { sql } from "drizzle-orm";
import { importAlodokterData } from "../lib/actions/resources";
import { db } from "../lib/db";

async function main() {
    try {
        console.log("Starting Alodokter data import process...");

        // Step 1: Ensure the metadata column exists
        console.log("Ensuring metadata column exists...");
        await db.execute(sql`
            ALTER TABLE IF EXISTS embeddings 
            ADD COLUMN IF NOT EXISTS metadata jsonb;
        `);
        console.log("✅ Metadata column check completed");

        // Step 2: Import data
        console.log("Importing Alodokter data...");
        const result = await importAlodokterData();
        console.log(result);

        console.log("Import process completed successfully!");
    } catch (error) {
        console.error("Error during import process:", error);
        process.exit(1);
    }

    process.exit(0);
}

main(); 