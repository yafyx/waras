"use server";

import {
  NewResourceParams,
  insertResourceSchema,
  resources,
} from "@/lib/db/schema/resources";
import fs from "fs";
import path from "path";
import { generateEmbeddings } from "../ai/embedding";
import { db } from "../db";
import { embeddings as embeddingsTable } from "../db/schema/embeddings";

export const createResource = async (input: NewResourceParams) => {
  try {
    const { content } = insertResourceSchema.parse(input);

    const [resource] = await db
      .insert(resources)
      .values({ content })
      .returning();

    const embeddings = await generateEmbeddings(content);
    await db.insert(embeddingsTable).values(
      embeddings.map((embedding) => ({
        resourceId: resource.id,
        ...embedding,
      })),
    );
    return "Resource successfully created and embedded.";
  } catch (error) {
    return error instanceof Error && error.message.length > 0
      ? error.message
      : "Error, please try again.";
  }
};

type AlodokterEntry = {
  title: string;
  content: string;
  url: string;
};

export const importAlodokterData = async () => {
  try {
    // Get the absolute path to the data file
    const dataPath = path.join(process.cwd(), "data", "alodokter_psikologi_data.json");

    // Read and parse the JSON file
    const data = JSON.parse(fs.readFileSync(dataPath, "utf8")) as AlodokterEntry[];

    const results = [];

    for (const entry of data) {
      // Create resource record
      const [resource] = await db
        .insert(resources)
        .values({ content: entry.content })
        .returning();

      // Generate embeddings with metadata
      const embeddings = await generateEmbeddings(entry.content, {
        title: entry.title,
        url: entry.url,
        source: "Alodokter"
      });

      // Store embeddings
      await db.insert(embeddingsTable).values(
        embeddings.map((embedding) => ({
          resourceId: resource.id,
          ...embedding,
        })),
      );

      results.push(`Processed entry: ${entry.title}`);
    }

    return `Successfully imported ${results.length} entries from Alodokter data.`;
  } catch (error) {
    console.error("Error importing Alodokter data:", error);
    return error instanceof Error && error.message.length > 0
      ? error.message
      : "Error importing Alodokter data. Please try again.";
  }
};
