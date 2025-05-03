import { EmbeddingMetadata, findRelevantContent } from "@/lib/ai/embedding";
import { chat } from "@/lib/ai/prompts";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { convertToCoreMessages, generateObject, streamText, tool } from "ai";
import { z } from "zod";

export const maxDuration = 60;

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_API_KEY!,
});

// Error handler function
function errorHandler(error: unknown) {
  if (error == null) {
    return 'unknown error';
  }

  if (typeof error === 'string') {
    return error;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return JSON.stringify(error);
}

// Function to implement exponential backoff for retries
async function withRetry<T>(
  fn: () => T | Promise<T>,
  maxRetries = 5,
  initialDelay = 1000,
  factor = 2
): Promise<T> {
  let retries = 0;
  let delay = initialDelay;

  while (true) {
    try {
      return await Promise.resolve(fn());
    } catch (error: unknown) {
      retries++;

      // If we've exceeded max retries or it's not an overload error, rethrow
      if (retries >= maxRetries ||
        !(typeof error === 'object' && error !== null && 'toString' in error &&
          error.toString().toLowerCase().includes('overloaded'))) {
        throw error;
      }

      // Wait with exponential backoff
      console.log(`Model overloaded, retrying in ${delay}ms (attempt ${retries}/${maxRetries})`);
      await new Promise(resolve => setTimeout(resolve, delay));

      // Increase delay for next retry
      delay *= factor;
    }
  }
}

export async function POST(req: Request) {
  const { messages } = await req.json();

  // Wrap streamText in retry logic
  const streamTextWithRetry = () =>
    streamText({
      model: google("gemini-2.0-flash"),
      messages: convertToCoreMessages(messages),
      maxTokens: 4096,
      toolCallStreaming: true,
      system: chat,
      tools: {
        getInformation: tool({
          description: `get information from your knowledge base to answer questions.`,
          parameters: z.object({
            question: z.string().describe("the users question"),
            similarQuestions: z.array(z.string()).describe("keywords to search"),
          }),
          execute: async ({ similarQuestions }) => {
            // Increase number of results by expanding search
            const results = await Promise.all(
              similarQuestions.map(
                async (question) => await findRelevantContent(question),
              ),
            );
            // Flatten the array of arrays and remove duplicates based on 'name'
            const uniqueResults = Array.from(
              new Map(results.flat().map((item) => [item?.name, item])).values(),
            );

            // Format results to include metadata
            return uniqueResults.map(result => {
              // Safely cast metadata to EmbeddingMetadata type or empty object
              const metadata = (result.metadata as EmbeddingMetadata) || {};

              const formattedResult = {
                content: result.name,
                similarity: result.similarity,
                title: metadata.title || "Untitled Source",
                url: metadata.url || null,
                source: metadata.source || null
              };
              return formattedResult;
            });
          },
        }),
        understandQuery: tool({
          description: `understand the users query. use this tool on every prompt.`,
          parameters: z.object({
            query: z.string().describe("the users query"),
            toolsToCallInOrder: z
              .array(z.string())
              .describe(
                "these are the tools you need to call in the order necessary to respond to the users query",
              ),
          }),
          execute: async ({ query }) => {
            // Wrap this nested call in retry logic as well
            return await withRetry(async () => {
              const { object } = await generateObject({
                model: google("gemini-2.0-flash"),
                system:
                  "You are a highly specialized Query Expansion Assistant expert in the field of Psychology. Your ONLY function is to receive a user's query related to psychology and generate EXACTLY 5 distinct, related questions.\n\n**Your Goal:** To formulate questions that, when used as search terms, will retrieve comprehensive information covering various facets of the user's original topic from a knowledge base.\n\n**Instructions:**\n1. **Analyze the Input:** Deeply understand the core concepts, nuances, and potential implicit questions within the user's psychology-related query.\n2. **Generate 5 Diverse Questions:** Create five unique questions that explore the topic from multiple angles:\n    *   **Rephrasing/Synonyms:** Use different psychological terminology.\n    *   **Sub-topics:** Break down the main topic into smaller, related psychological concepts.\n    *   **Perspectives/Contexts:** Consider theoretical viewpoints (e.g., cognitive, behavioral, psychodynamic), developmental stages, cultural factors, or clinical vs. research contexts relevant to the query.\n    *   **Underlying Needs/Implications:** Explore potential practical applications, related conditions, therapeutic approaches, or ethical considerations if appropriate.\n    *   **Specificity/Generality:** Include both broader and more specific related questions.\n3. **Psychology Focus:** Ensure ALL generated questions remain strictly within the domain of psychology. Ignore any non-psychological aspects of the input query.\n4. **Format:** Output ONLY the list of 5 questions.\n5. **Constraints:**\n    *   Do NOT answer the original query.\n    *   Do NOT provide definitions or explanations.\n    *   Do NOT include any introductory or concluding remarks.\n    *   Generate full questions, not just keywords.",
                schema: z.object({
                  questions: z
                    .array(z.string())
                    .max(5)
                    .describe("5 diverse psychology-related questions derived from the user's query, suitable for knowledge base search."),
                }),
                prompt: `User Query (Psychology): "${query}"\n\nGenerate exactly 5 diverse, related questions suitable for searching a psychology knowledge base, covering different aspects and angles of the original topic as per instructions.`,
              });
              return object.questions;
            });
          },
        }),
      },
    });

  try {
    // Use retry logic for the main streamText call
    const result = await withRetry(streamTextWithRetry);

    // Return data stream response with error handling
    return result.toDataStreamResponse({
      getErrorMessage: errorHandler,
    });
  } catch (error) {
    console.error("Failed after all retries:", error);

    // Return a more user-friendly error
    return new Response(
      JSON.stringify({
        error: "The AI service is currently experiencing high traffic. Please try again in a few minutes."
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}