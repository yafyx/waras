import { findRelevantContent } from "@/lib/ai/embedding";
import { systemPrompts } from "@/lib/ai/prompts";
import { google } from "@ai-sdk/google";
import { embed, generateText } from "ai";
import "dotenv/config";
import fs from "fs";
import path from "path";

interface TestQuery {
    id: number;
    query: string;
    ground_truth_documents: string[];
    reference_answer: string;
}

interface GenerationResult {
    queryId: number;
    query: string;
    generatedAnswer: string;
    referenceAnswer: string;
    retrievedContext: string[];
    faithfulness: number;
    answerRelevancy: number;
    semanticSimilarity: number;
}

/**
 * Evaluates generation quality using multiple metrics:
 * - Faithfulness: How accurate the answer is to the retrieved context
 * - Answer Relevancy: How relevant the answer is to the query
 * - Semantic Similarity: How similar the answer is to reference answer
 */
export class GenerationEvaluator {
    private testQueries: TestQuery[];
    private embeddingModel;
    private llmModel;

    constructor(testQueriesPath: string) {
        const data = fs.readFileSync(testQueriesPath, 'utf8');
        this.testQueries = JSON.parse(data);
        this.embeddingModel = google.embedding("text-embedding-004");
        this.llmModel = google("gemini-2.0-flash");
    }

    /**
     * Generate answer using the RAG system
     */
    private async generateAnswer(query: string): Promise<{ answer: string; context: string[] }> {
        try {
            // Get relevant context
            const retrievalResults = await findRelevantContent(query);
            const context = retrievalResults.slice(0, 5).map(doc => doc.name);

            // Generate answer using the same system prompts as the real application
            const { text } = await generateText({
                model: this.llmModel,
                system: systemPrompts,
                prompt: `
Pertanyaan pengguna: "${query}"

Konteks yang ditemukan:
${context.map((ctx, idx) => `${idx + 1}. ${ctx}`).join('\n')}

Berikan jawaban yang komprehensif berdasarkan konteks di atas.
        `,
                maxTokens: 1000,
            });

            return {
                answer: text,
                context
            };
        } catch (error) {
            console.error('Error generating answer:', error);
            return {
                answer: "Error generating answer",
                context: []
            };
        }
    }

    /**
     * Calculate Faithfulness metric
     * Measures how accurate the generated answer is to the retrieved context
     */
    private async calculateFaithfulness(answer: string, context: string[]): Promise<number> {
        if (context.length === 0) return 0;

        try {
            const contextText = context.join('\n\n');

            // Use LLM to evaluate faithfulness
            const { text } = await generateText({
                model: this.llmModel,
                prompt: `
Anda adalah evaluator yang bertugas menilai kepatuhan (faithfulness) jawaban terhadap konteks yang diberikan.

KONTEKS:
${contextText}

JAWABAN YANG DIEVALUASI:
${answer}

Tugas: Periksa setiap klaim atau pernyataan dalam jawaban. Berikan nilai 1 jika klaim didukung oleh konteks, dan 0 jika tidak didukung.

Format output: Berikan skor faithfulness sebagai angka desimal antara 0 dan 1 (misalnya: 0.85), diikuti penjelasan singkat.

Contoh format:
0.85
Penjelasan: 85% klaim dalam jawaban didukung oleh konteks yang diberikan.

Skor faithfulness:
        `,
                maxTokens: 200,
            });

            // Extract score from response
            const scoreMatch = text.match(/^([0-1](?:\.\d+)?)/);
            return scoreMatch ? parseFloat(scoreMatch[1]) : 0;
        } catch (error) {
            console.error('Error calculating faithfulness:', error);
            return 0;
        }
    }

    /**
     * Calculate Answer Relevancy metric
     * Measures how relevant the answer is to the original query
     */
    private async calculateAnswerRelevancy(query: string, answer: string): Promise<number> {
        try {
            // Get embeddings for query and answer
            const { embedding: queryEmbedding } = await embed({
                model: this.embeddingModel,
                value: query,
            });

            const { embedding: answerEmbedding } = await embed({
                model: this.embeddingModel,
                value: answer,
            });

            // Calculate cosine similarity
            const similarity = this.cosineSimilarity(queryEmbedding, answerEmbedding);
            return Math.max(0, Math.min(1, similarity)); // Clamp between 0 and 1
        } catch (error) {
            console.error('Error calculating answer relevancy:', error);
            return 0;
        }
    }

    /**
     * Calculate Semantic Similarity metric
     * Measures how similar the generated answer is to the reference answer
     */
    private async calculateSemanticSimilarity(generatedAnswer: string, referenceAnswer: string): Promise<number> {
        try {
            // Get embeddings for both answers
            const { embedding: generatedEmbedding } = await embed({
                model: this.embeddingModel,
                value: generatedAnswer,
            });

            const { embedding: referenceEmbedding } = await embed({
                model: this.embeddingModel,
                value: referenceAnswer,
            });

            // Calculate cosine similarity
            const similarity = this.cosineSimilarity(generatedEmbedding, referenceEmbedding);
            return Math.max(0, Math.min(1, similarity)); // Clamp between 0 and 1
        } catch (error) {
            console.error('Error calculating semantic similarity:', error);
            return 0;
        }
    }

    /**
     * Calculate cosine similarity between two vectors
     */
    private cosineSimilarity(vecA: number[], vecB: number[]): number {
        if (vecA.length !== vecB.length) {
            throw new Error('Vectors must have the same length');
        }

        let dotProduct = 0;
        let normA = 0;
        let normB = 0;

        for (let i = 0; i < vecA.length; i++) {
            dotProduct += vecA[i] * vecB[i];
            normA += vecA[i] * vecA[i];
            normB += vecB[i] * vecB[i];
        }

        normA = Math.sqrt(normA);
        normB = Math.sqrt(normB);

        if (normA === 0 || normB === 0) {
            return 0;
        }

        return dotProduct / (normA * normB);
    }

    /**
     * Evaluate all generation metrics for all test queries
     */
    async evaluateGeneration(): Promise<{
        averageScores: {
            faithfulness: number;
            answerRelevancy: number;
            semanticSimilarity: number;
        };
        results: GenerationResult[];
    }> {
        const results: GenerationResult[] = [];
        let totalFaithfulness = 0;
        let totalRelevancy = 0;
        let totalSimilarity = 0;

        console.log(`🤖 Starting Generation evaluation...`);
        console.log(`📊 Evaluating ${this.testQueries.length} test queries\n`);

        for (const testQuery of this.testQueries) {
            console.log(`Query ${testQuery.id}: "${testQuery.query}"`);

            try {
                // Generate answer using RAG system
                const { answer, context } = await this.generateAnswer(testQuery.query);

                // Calculate all metrics
                console.log(`  🔍 Calculating faithfulness...`);
                const faithfulness = await this.calculateFaithfulness(answer, context);

                console.log(`  🎯 Calculating answer relevancy...`);
                const answerRelevancy = await this.calculateAnswerRelevancy(testQuery.query, answer);

                console.log(`  📊 Calculating semantic similarity...`);
                const semanticSimilarity = await this.calculateSemanticSimilarity(answer, testQuery.reference_answer);

                const result: GenerationResult = {
                    queryId: testQuery.id,
                    query: testQuery.query,
                    generatedAnswer: answer,
                    referenceAnswer: testQuery.reference_answer,
                    retrievedContext: context,
                    faithfulness,
                    answerRelevancy,
                    semanticSimilarity
                };

                results.push(result);
                totalFaithfulness += faithfulness;
                totalRelevancy += answerRelevancy;
                totalSimilarity += semanticSimilarity;

                console.log(`  ✅ Faithfulness: ${faithfulness.toFixed(3)}`);
                console.log(`  ✅ Answer Relevancy: ${answerRelevancy.toFixed(3)}`);
                console.log(`  ✅ Semantic Similarity: ${semanticSimilarity.toFixed(3)}\n`);

            } catch (error) {
                console.error(`  ❌ Error processing query ${testQuery.id}:`, error);
                results.push({
                    queryId: testQuery.id,
                    query: testQuery.query,
                    generatedAnswer: "Error",
                    referenceAnswer: testQuery.reference_answer,
                    retrievedContext: [],
                    faithfulness: 0,
                    answerRelevancy: 0,
                    semanticSimilarity: 0
                });
            }

            // Add delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        const averageScores = {
            faithfulness: totalFaithfulness / this.testQueries.length,
            answerRelevancy: totalRelevancy / this.testQueries.length,
            semanticSimilarity: totalSimilarity / this.testQueries.length
        };

        console.log(`📈 Generation Evaluation Complete!`);
        console.log(`📊 Average Faithfulness: ${averageScores.faithfulness.toFixed(3)}`);
        console.log(`📊 Average Answer Relevancy: ${averageScores.answerRelevancy.toFixed(3)}`);
        console.log(`📊 Average Semantic Similarity: ${averageScores.semanticSimilarity.toFixed(3)}`);

        return {
            averageScores,
            results
        };
    }

    /**
     * Generate detailed generation evaluation report
     */
    generateDetailedReport(evaluation: { averageScores: any; results: GenerationResult[] }): string {
        const { averageScores, results } = evaluation;

        let report = `# Generation Quality Evaluation Report\n\n`;

        // Summary
        report += `## Summary\n`;
        report += `- **Faithfulness**: ${averageScores.faithfulness.toFixed(3)} (${(averageScores.faithfulness * 100).toFixed(1)}%)\n`;
        report += `- **Answer Relevancy**: ${averageScores.answerRelevancy.toFixed(3)} (${(averageScores.answerRelevancy * 100).toFixed(1)}%)\n`;
        report += `- **Semantic Similarity**: ${averageScores.semanticSimilarity.toFixed(3)} (${(averageScores.semanticSimilarity * 100).toFixed(1)}%)\n`;
        report += `- **Total Queries**: ${results.length}\n\n`;

        // Score distribution
        const scoreRanges = {
            excellent: { min: 0.9, count: 0 },
            good: { min: 0.7, count: 0 },
            fair: { min: 0.5, count: 0 },
            poor: { min: 0, count: 0 }
        };

        results.forEach(result => {
            const avgScore = (result.faithfulness + result.answerRelevancy + result.semanticSimilarity) / 3;
            if (avgScore >= 0.9) scoreRanges.excellent.count++;
            else if (avgScore >= 0.7) scoreRanges.good.count++;
            else if (avgScore >= 0.5) scoreRanges.fair.count++;
            else scoreRanges.poor.count++;
        });

        report += `## Performance Distribution\n`;
        report += `- **Excellent (≥0.9)**: ${scoreRanges.excellent.count} queries (${(scoreRanges.excellent.count / results.length * 100).toFixed(1)}%)\n`;
        report += `- **Good (0.7-0.89)**: ${scoreRanges.good.count} queries (${(scoreRanges.good.count / results.length * 100).toFixed(1)}%)\n`;
        report += `- **Fair (0.5-0.69)**: ${scoreRanges.fair.count} queries (${(scoreRanges.fair.count / results.length * 100).toFixed(1)}%)\n`;
        report += `- **Poor (<0.5)**: ${scoreRanges.poor.count} queries (${(scoreRanges.poor.count / results.length * 100).toFixed(1)}%)\n\n`;

        // Detailed results
        report += `## Detailed Results\n\n`;
        results.forEach(result => {
            report += `### Query ${result.queryId}: "${result.query}"\n\n`;
            report += `**Metrics:**\n`;
            report += `- Faithfulness: ${result.faithfulness.toFixed(3)}\n`;
            report += `- Answer Relevancy: ${result.answerRelevancy.toFixed(3)}\n`;
            report += `- Semantic Similarity: ${result.semanticSimilarity.toFixed(3)}\n\n`;
            report += `**Generated Answer:**\n`;
            report += `${result.generatedAnswer.substring(0, 300)}${result.generatedAnswer.length > 300 ? '...' : ''}\n\n`;
            report += `**Reference Answer:**\n`;
            report += `${result.referenceAnswer}\n\n`;
            report += `**Retrieved Context:** ${result.retrievedContext.length} chunks\n\n`;
            report += `---\n\n`;
        });

        return report;
    }

    /**
     * Save generation results to file
     */
    async saveResults(results: any, outputPath: string): Promise<void> {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const fileName = `generation-evaluation-${timestamp}.json`;
        const fullPath = path.join(outputPath, fileName);

        // Ensure directory exists
        if (!fs.existsSync(outputPath)) {
            fs.mkdirSync(outputPath, { recursive: true });
        }

        fs.writeFileSync(fullPath, JSON.stringify(results, null, 2));
        console.log(`💾 Results saved to: ${fullPath}`);
    }
}

// Main execution function
export async function runGenerationEvaluation(): Promise<any> {
    try {
        const testQueriesPath = path.join(process.cwd(), 'evaluation', 'test-queries.json');
        const outputDir = path.join(process.cwd(), 'evaluation', 'results');

        const evaluator = new GenerationEvaluator(testQueriesPath);
        const results = await evaluator.evaluateGeneration();

        // Save detailed results
        await evaluator.saveResults(results, outputDir);

        // Generate and save report
        const report = evaluator.generateDetailedReport(results);
        const reportPath = path.join(outputDir, `generation-report-${new Date().toISOString().replace(/[:.]/g, '-')}.md`);
        fs.writeFileSync(reportPath, report);
        console.log(`📋 Report saved to: ${reportPath}`);

        return results;
    } catch (error) {
        console.error('❌ Error running generation evaluation:', error);
        throw error;
    }
}

// If running directly
if (require.main === module) {
    runGenerationEvaluation().then(() => {
        console.log('✅ Generation evaluation completed!');
        process.exit(0);
    }).catch(error => {
        console.error('❌ Evaluation failed:', error);
        process.exit(1);
    });
} 