import { EmbeddingMetadata, findRelevantContent } from "@/lib/ai/embedding";
import { systemPrompts } from "@/lib/ai/prompts";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { convertToCoreMessages, generateObject, smoothStream, streamText, tool } from "ai";
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

function isValidUrl(urlString: string | null | undefined): boolean {
  if (!urlString) return false;

  try {
    const url = new URL(urlString);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
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

  const streamTextWithRetry = () =>
    streamText({
      model: google("gemini-2.0-flash"),
      messages: convertToCoreMessages(messages),
      maxTokens: 4096,
      toolCallStreaming: true,
      system: systemPrompts,
      experimental_transform: smoothStream({
        chunking: /[\u4E00-\u9FFF]|\S+\s+/,
      }),
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

              // Validate URL to prevent hallucinations
              const url = isValidUrl(metadata.url) ? metadata.url : null;

              const formattedResult = {
                content: result.name,
                similarity: result.similarity,
                title: metadata.title || "Untitled Source",
                url,
                source: metadata.source || null,
                hasValidSource: Boolean(metadata.title && (url || metadata.source))
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
            return await withRetry(async () => {
              const { object } = await generateObject({
                model: google("gemini-2.0-flash"),
                system:
                  "Anda adalah Asisten Perluasan Kueri yang sangat terspesialisasi dan ahli di bidang Psikologi. Fungsi SATU-SATUNYA Anda adalah menerima kueri pengguna terkait psikologi dan menghasilkan TEPAT 5 pertanyaan berbeda yang saling terkait.\n\n**Tujuan Anda:** Merumuskan pertanyaan yang, ketika digunakan sebagai istilah pencarian, akan mengambil informasi komprehensif yang mencakup berbagai aspek topik asli pengguna dari basis pengetahuan.\n\n**Instruksi:**\n1. **Analisis Input:** Pahami secara mendalam konsep inti, nuansa, dan potensi pertanyaan implisit dalam kueri pengguna yang terkait dengan psikologi.\n2. **Hasilkan 5 Pertanyaan Beragam:** Buat lima pertanyaan unik yang mengeksplorasi topik dari berbagai sudut:\n    *   **Parafrasa/Sinonim:** Gunakan terminologi psikologis yang berbeda.\n    *   **Sub-topik:** Pecah topik utama menjadi konsep psikologis terkait yang lebih kecil.\n    *   **Perspektif/Konteks:** Pertimbangkan sudut pandang teoretis (mis., kognitif, perilaku, psikodinamik), tahap perkembangan, faktor budaya, atau konteks klinis vs. penelitian yang relevan dengan kueri.\n    *   **Kebutuhan/Implikasi Mendasar:** Jelajahi potensi aplikasi praktis, kondisi terkait, pendekatan terapeutik, atau pertimbangan etis jika sesuai.\n    *   **Spesifisitas/Generalitas:** Sertakan pertanyaan terkait yang lebih luas dan lebih spesifik.\n3. **Fokus Psikologi:** Pastikan SEMUA pertanyaan yang dihasilkan tetap berada dalam domain psikologi secara ketat. Abaikan aspek non-psikologis dari kueri input.\n4. **Format:** Keluarkan HANYA daftar 5 pertanyaan.\n5. **Batasan:**\n    *   JANGAN menjawab kueri asli.\n    *   JANGAN memberikan definisi atau penjelasan.\n    *   JANGAN menyertakan komentar pembuka atau penutup.\n    *   Hasilkan pertanyaan lengkap, bukan hanya kata kunci.",
                schema: z.object({
                  questions: z
                    .array(z.string())
                    .max(5)
                    .describe("5 pertanyaan beragam terkait psikologi yang berasal dari kueri pengguna, cocok untuk pencarian basis pengetahuan."),
                }),
                prompt: `Kueri Pengguna (Psikologi): "${query}"\n\nHasilkan tepat 5 pertanyaan beragam yang saling terkait dan cocok untuk mencari basis pengetahuan psikologi, mencakup berbagai aspek dan sudut pandang topik asli sesuai instruksi.`,
              });
              return object.questions;
            });
          },
        }),
      }
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