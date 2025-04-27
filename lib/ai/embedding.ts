import { google } from "@ai-sdk/google";
import { embed, embedMany } from "ai";
import { cosineDistance, desc, gt, sql } from "drizzle-orm";
import { db } from "../db";
import { embeddings } from "../db/schema/embeddings";

const embeddingModel = google.embedding("text-embedding-004");

// Improved chunking strategy for medical/psychological data
const generateChunks = (input: string, maxChunkSize = 512): string[] => {
  // If input is very short, return it as a single chunk
  if (input.length < maxChunkSize) {
    return [input.trim()];
  }

  // Split by clear section breaks like blank lines or list items first
  const sections = input
    .split(/\n\s*\n|\n\s*-\s+/)
    .filter(section => section.trim() !== "");

  const chunks: string[] = [];
  let currentChunk = "";

  for (const section of sections) {
    // If adding this section would exceed maxChunkSize, finish current chunk
    if (currentChunk.length + section.length > maxChunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      currentChunk = "";
    }

    // If a single section is longer than maxChunkSize, split it by sentences
    if (section.length > maxChunkSize) {
      const sentences = section
        .split(/\.(?:\s+|\n)/)
        .filter(sentence => sentence.trim() !== "")
        .map(sentence => sentence.trim() + ".");

      for (const sentence of sentences) {
        if (currentChunk.length + sentence.length > maxChunkSize && currentChunk.length > 0) {
          chunks.push(currentChunk.trim());
          currentChunk = "";
        }
        currentChunk += sentence + " ";
      }
    } else {
      // Otherwise add the section to current chunk
      currentChunk += section + " ";
    }
  }

  // Add the last chunk if there's anything left
  if (currentChunk.trim() !== "") {
    chunks.push(currentChunk.trim());
  }

  return chunks;
};

// Type for metadata
export type EmbeddingMetadata = {
  title?: string;
  url?: string;
  source?: string;
};

export const generateEmbeddings = async (
  value: string,
  metadata?: EmbeddingMetadata
): Promise<Array<{ embedding: number[]; content: string; metadata?: EmbeddingMetadata }>> => {
  const chunks = generateChunks(value);
  const { embeddings } = await embedMany({
    model: embeddingModel,
    values: chunks,
  });
  return embeddings.map((e, i) => ({
    content: chunks[i],
    embedding: e,
    metadata
  }));
};

export const generateEmbedding = async (value: string): Promise<number[]> => {
  const input = value.replaceAll("\n", " ");
  const { embedding } = await embed({
    model: embeddingModel,
    value: input,
  });
  return embedding;
};

export const findRelevantContent = async (userQuery: string) => {
  const userQueryEmbedded = await generateEmbedding(userQuery);
  const similarity = sql<number>`1 - (${cosineDistance(embeddings.embedding, userQueryEmbedded)})`;
  const similarGuides = await db
    .select({ name: embeddings.content, similarity, metadata: embeddings.metadata })
    .from(embeddings)
    .where(gt(similarity, 0.3))
    .orderBy((t) => desc(t.similarity))
    .limit(4);
  return similarGuides;
};
