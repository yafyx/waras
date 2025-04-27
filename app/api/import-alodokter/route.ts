import { importAlodokterData } from "@/lib/actions/resources";
import { db } from "@/lib/db";
import { runMigration } from "@/lib/db/migrations/add-metadata-to-embeddings";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        // First run the migration to add the metadata column
        await runMigration(db);

        // Then import the data
        const result = await importAlodokterData();

        return NextResponse.json({ success: true, message: result });
    } catch (error) {
        console.error("Error in import-alodokter API:", error);
        return NextResponse.json(
            { success: false, error: error instanceof Error ? error.message : "Unknown error" },
            { status: 500 }
        );
    }
} 