import { EmbeddingMetadata, findRelevantContent } from "@/lib/ai/embedding";
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

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = streamText({
    model: google("gemini-2.0-flash"),
    messages: convertToCoreMessages(messages),
    maxTokens: 4096,
    system: `Anda adalah asisten psikologi yang sangat informatif dan membantu.
    Berikan jawaban yang komprehensif, detail, dan mendalam untuk setiap pertanyaan.
    Gunakan alat pada setiap permintaan untuk mendapatkan informasi yang relevan.
    Pastikan untuk mendapatkan informasi dari basis pengetahuan sebelum menjawab pertanyaan.
    Jika respons memerlukan beberapa alat, panggil satu alat setelah yang lain tanpa merespons pengguna.
    
    PENTING: HANYA jawab pertanyaan menggunakan informasi dari panggilan alat.
    Jika tidak ada informasi yang relevan ditemukan dalam panggilan alat, jawab, "Maaf, saya tidak tahu."
    
    Jawab pertanyaan menggunakan HANYA:
    1. Informasi dari panggilan alat
    
    Bahkan ketika memberikan jawaban yang komprehensif dan detail, SELALU pastikan jawaban tersebut berdasarkan informasi yang diperoleh dari panggilan alat.
    
    Buat jawaban Anda selalu bermanfaat dan informatif berdasarkan informasi dari alat. Jika topik membutuhkan penjelasan detail, berikan sebanyak mungkin informasi yang berguna dari hasil panggilan alat.
    
    Gunakan kemampuan Anda sebagai mesin penalaran HANYA untuk menyusun informasi dari panggilan alat menjadi jawaban yang koheren.
    Fokus pada memberikan saran dan informasi terkait psikologi yang relevan, akurat, bermanfaat, dan komprehensif HANYA berdasarkan hasil panggilan alat.
    
    ATURAN PENTING TENTANG SUMBER:
    1. JANGAN pernah menyebutkan sumber dalam badan utama respons.
    2. Berikan respons Anda terlebih dahulu secara lengkap tanpa menyebutkan sumber apapun.
    3. Setelah respons utama, tambahkan DUA baris kosong.
    4. Baru kemudian tambahkan bagian sumber dengan format berikut:
    
    Sumber:
    - [Judul1](URL1)
    - [Judul2](URL2)
    
    5. Jika sumber tidak memiliki URL, gunakan format: Judul1
    6. Jika tidak ada sumber yang digunakan dalam respons, JANGAN tambahkan bagian Sumber.`,
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
        },
      }),
    },
  });

  // Return data stream response with error handling
  return result.toDataStreamResponse({
    getErrorMessage: errorHandler,
  });
}
