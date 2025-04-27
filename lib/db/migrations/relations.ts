import { relations } from "drizzle-orm/relations";
import { resources, embeddings } from "./schema";

export const embeddingsRelations = relations(embeddings, ({one}) => ({
	resource: one(resources, {
		fields: [embeddings.resourceId],
		references: [resources.id]
	}),
}));

export const resourcesRelations = relations(resources, ({many}) => ({
	embeddings: many(embeddings),
}));