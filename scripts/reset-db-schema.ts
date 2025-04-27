import "dotenv/config";
import { sql } from "drizzle-orm";
import { db } from "../lib/db";

// Import our schema

async function main() {
    try {
        console.log("Starting database schema reset...");

        // Check if tables exist
        console.log("Checking existing tables...");
        const resourcesResult = await db.execute(sql`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public'
                AND table_name = 'resources'
            );
        `);
        const embeddingsResult = await db.execute(sql`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public'
                AND table_name = 'embeddings'
            );
        `);

        console.log(`Resources table exists: ${resourcesResult[0]?.exists}`);
        console.log(`Embeddings table exists: ${embeddingsResult[0]?.exists}`);

        // Create vector extension
        console.log("Creating vector extension if it doesn't exist...");
        await db.execute(sql`CREATE EXTENSION IF NOT EXISTS vector;`);

        // Drop tables if they exist (order matters for foreign keys)
        console.log("Dropping existing tables if they exist...");
        await db.execute(sql`DROP TABLE IF EXISTS embeddings;`);
        await db.execute(sql`DROP TABLE IF EXISTS resources;`);

        // Create resources table
        console.log("Creating resources table...");
        await db.execute(sql`
            CREATE TABLE IF NOT EXISTS "resources" (
                "id" varchar(191) PRIMARY KEY NOT NULL,
                "content" text NOT NULL,
                "created_at" timestamp DEFAULT now() NOT NULL,
                "updated_at" timestamp DEFAULT now() NOT NULL
            );
        `);

        // Create embeddings table with metadata
        console.log("Creating embeddings table with metadata column...");
        await db.execute(sql`
            CREATE TABLE IF NOT EXISTS "embeddings" (
                "id" varchar(191) PRIMARY KEY NOT NULL,
                "resource_id" varchar(191) REFERENCES "resources"("id") ON DELETE CASCADE,
                "content" text NOT NULL,
                "embedding" vector(768) NOT NULL,
                "metadata" jsonb
            );
        `);

        // Create index
        console.log("Creating vector search index...");
        await db.execute(sql`
            CREATE INDEX IF NOT EXISTS "embeddingIndex" 
            ON "embeddings" USING hnsw ("embedding" vector_cosine_ops);
        `);

        console.log("✅ Schema reset completed successfully");
    } catch (error) {
        console.error("Error during schema reset:", error);
        process.exit(1);
    }

    process.exit(0);
}

main(); 