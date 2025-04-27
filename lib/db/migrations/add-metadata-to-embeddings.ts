import { sql } from "drizzle-orm";

// Migration to add metadata column to embeddings table
export async function addMetadataToEmbeddings(db: any) {
    await db.execute(
        sql`ALTER TABLE embeddings ADD COLUMN IF NOT EXISTS metadata jsonb`
    );

    console.log("✅ Added metadata column to embeddings table");
}

// Function to run the migration
export async function runMigration(db: any) {
    console.log("Running migration: Add metadata to embeddings");
    await addMetadataToEmbeddings(db);
    console.log("Migration completed successfully!");
} 