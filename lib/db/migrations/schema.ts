import { pgTable, varchar, text, timestamp, index, foreignKey, vector, jsonb } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const resources = pgTable("resources", {
	id: varchar({ length: 191 }).primaryKey().notNull(),
	content: text().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
});

export const embeddings = pgTable("embeddings", {
	id: varchar({ length: 191 }).primaryKey().notNull(),
	resourceId: varchar("resource_id", { length: 191 }),
	content: text().notNull(),
	embedding: vector({ dimensions: 768 }).notNull(),
	metadata: jsonb(),
}, (table) => [
	index("embeddingIndex").using("hnsw", table.embedding.asc().nullsLast().op("vector_cosine_ops")),
	foreignKey({
			columns: [table.resourceId],
			foreignColumns: [resources.id],
			name: "embeddings_resource_id_fkey"
		}).onDelete("cascade"),
]);
