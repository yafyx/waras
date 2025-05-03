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
                  "You are a comprehensive query understanding assistant for psychology topics. Thoroughly analyze the user query and generate detailed similar questions to explore all aspects of their inquiry.",
                schema: z.object({
                  questions: z
                    .array(z.string())
                    .max(5) // Increased from 3 to 5 for more comprehensive search
                    .describe("similar questions to the user's query that cover different aspects of their question"),
                }),
                prompt: `Analyze this query about psychology: "${query}". Provide the following:
                        5 similar questions that could help comprehensively answer the user's query. Ensure the questions explore different aspects and angles of the topic to provide a thorough answer. Remember that we will display citations only at the end of the response, never in the main text.`,
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