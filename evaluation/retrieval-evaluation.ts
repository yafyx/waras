import { findRelevantContent } from "@/lib/ai/embedding";
import "dotenv/config";
import fs from "fs";
import path from "path";

interface TestQuery {
    id: number;
    query: string;
    ground_truth_documents: string[];
    reference_answer: string;
}

interface RetrievalResult {
    name: string;
    similarity: number;
    metadata?: any; // Use any to match the actual return type from findRelevantContent
}

/**
 * Evaluates retrieval performance using Mean Reciprocal Rank (MRR)
 * MRR = (1/|Q|) * Σ(1/rank_i)
 * where rank_i is the rank of the first relevant document for query i
 */
export class RetrievalEvaluator {
    private testQueries: TestQuery[];

    constructor(testQueriesPath: string) {
        const data = fs.readFileSync(testQueriesPath, 'utf8');
        this.testQueries = JSON.parse(data);
    }

    /**
     * Check if a retrieved document matches any ground truth document
     * Uses flexible matching to handle variations in titles
     */
    private isRelevantDocument(retrievedDoc: RetrievalResult, groundTruthDocs: string[]): boolean {
        const docTitle = retrievedDoc.metadata?.title?.toLowerCase() || '';
        const docContent = retrievedDoc.name?.toLowerCase() || '';

        return groundTruthDocs.some(gtDoc => {
            const gtDocLower = gtDoc.toLowerCase();

            // Exact match on title
            if (docTitle.includes(gtDocLower) || gtDocLower.includes(docTitle)) {
                return true;
            }

            // Content-based matching - check if ground truth terms appear in content
            const gtTerms = gtDocLower.split(/\s+/);
            const contentWords = docContent.split(/\s+/);

            // If most ground truth terms appear in content, consider it relevant
            const matchingTerms = gtTerms.filter(term =>
                contentWords.some(word => word.includes(term) || term.includes(word))
            );

            return matchingTerms.length >= Math.ceil(gtTerms.length * 0.6); // 60% term overlap
        });
    }

    /**
     * Find the rank of the first relevant document in retrieval results
     * Returns 0 if no relevant document found
     */
    private findFirstRelevantRank(retrievalResults: RetrievalResult[], groundTruthDocs: string[]): number {
        for (let i = 0; i < retrievalResults.length; i++) {
            if (this.isRelevantDocument(retrievalResults[i], groundTruthDocs)) {
                return i + 1; // Rank is 1-indexed
            }
        }
        return 0; // No relevant document found
    }

    /**
     * Calculate MRR for all test queries
     */
    async calculateMRR(k: number = 10): Promise<{
        mrr: number;
        details: Array<{
            queryId: number;
            query: string;
            rank: number;
            reciprocalRank: number;
            retrievedDocs: Array<{
                title: string;
                similarity: number;
                isRelevant: boolean;
            }>;
        }>;
    }> {
        const results = [];
        let totalReciprocalRank = 0;

        console.log(`🔍 Starting MRR evaluation with k=${k}...`);
        console.log(`📊 Evaluating ${this.testQueries.length} test queries\n`);

        for (const testQuery of this.testQueries) {
            console.log(`Query ${testQuery.id}: "${testQuery.query}"`);

            try {
                // Get retrieval results from the system
                const retrievalResults = await findRelevantContent(testQuery.query);
                const topKResults = retrievalResults.slice(0, k);

                // Find rank of first relevant document
                const rank = this.findFirstRelevantRank(topKResults, testQuery.ground_truth_documents);
                const reciprocalRank = rank > 0 ? 1 / rank : 0;

                totalReciprocalRank += reciprocalRank;

                // Create detailed results
                const retrievedDocs = topKResults.map(doc => ({
                    title: (doc.metadata as any)?.title || 'Untitled',
                    similarity: doc.similarity,
                    isRelevant: this.isRelevantDocument(doc, testQuery.ground_truth_documents)
                }));

                results.push({
                    queryId: testQuery.id,
                    query: testQuery.query,
                    rank,
                    reciprocalRank,
                    retrievedDocs
                });

                console.log(`  ✓ Ground truth: [${testQuery.ground_truth_documents.join(', ')}]`);
                console.log(`  ✓ First relevant at rank: ${rank > 0 ? rank : 'Not found'}`);
                console.log(`  ✓ Reciprocal rank: ${reciprocalRank.toFixed(3)}`);
                console.log(`  ✓ Top results: ${retrievedDocs.slice(0, 3).map(d => d.title).join(', ')}\n`);

            } catch (error) {
                console.error(`  ❌ Error processing query ${testQuery.id}:`, error);
                results.push({
                    queryId: testQuery.id,
                    query: testQuery.query,
                    rank: 0,
                    reciprocalRank: 0,
                    retrievedDocs: []
                });
            }
        }

        const mrr = totalReciprocalRank / this.testQueries.length;

        console.log(`📈 MRR Evaluation Complete!`);
        console.log(`📊 Mean Reciprocal Rank: ${mrr.toFixed(3)}`);
        console.log(`📊 Queries with relevant docs found: ${results.filter(r => r.rank > 0).length}/${this.testQueries.length}`);

        return {
            mrr,
            details: results
        };
    }

    /**
     * Generate detailed MRR report
     */
    generateDetailedReport(results: { mrr: number; details: any[] }): string {
        const { mrr, details } = results;

        let report = `# Mean Reciprocal Rank (MRR) Evaluation Report\n\n`;
        report += `## Summary\n`;
        report += `- **MRR Score**: ${mrr.toFixed(3)}\n`;
        report += `- **Total Queries**: ${details.length}\n`;
        report += `- **Queries with Relevant Results**: ${details.filter(d => d.rank > 0).length}\n`;
        report += `- **Success Rate**: ${((details.filter(d => d.rank > 0).length / details.length) * 100).toFixed(1)}%\n\n`;

        // Performance breakdown
        const rankDistribution = details.reduce((acc, d) => {
            if (d.rank === 0) acc.notFound++;
            else if (d.rank === 1) acc.rank1++;
            else if (d.rank <= 3) acc.rank2to3++;
            else if (d.rank <= 5) acc.rank4to5++;
            else acc.rank6plus++;
            return acc;
        }, { notFound: 0, rank1: 0, rank2to3: 0, rank4to5: 0, rank6plus: 0 });

        report += `## Rank Distribution\n`;
        report += `- **Rank 1**: ${rankDistribution.rank1} queries (${(rankDistribution.rank1 / details.length * 100).toFixed(1)}%)\n`;
        report += `- **Rank 2-3**: ${rankDistribution.rank2to3} queries (${(rankDistribution.rank2to3 / details.length * 100).toFixed(1)}%)\n`;
        report += `- **Rank 4-5**: ${rankDistribution.rank4to5} queries (${(rankDistribution.rank4to5 / details.length * 100).toFixed(1)}%)\n`;
        report += `- **Rank 6+**: ${rankDistribution.rank6plus} queries (${(rankDistribution.rank6plus / details.length * 100).toFixed(1)}%)\n`;
        report += `- **Not Found**: ${rankDistribution.notFound} queries (${(rankDistribution.notFound / details.length * 100).toFixed(1)}%)\n\n`;

        // Detailed results
        report += `## Detailed Results\n\n`;
        details.forEach(detail => {
            report += `### Query ${detail.queryId}: "${detail.query}"\n`;
            report += `- **Rank of First Relevant**: ${detail.rank > 0 ? detail.rank : 'Not found'}\n`;
            report += `- **Reciprocal Rank**: ${detail.reciprocalRank.toFixed(3)}\n`;
            report += `- **Top Retrieved Documents**:\n`;
            detail.retrievedDocs.slice(0, 5).forEach((doc: any, idx: number) => {
                const relevantMark = doc.isRelevant ? '✓' : '✗';
                report += `  ${idx + 1}. ${relevantMark} ${doc.title} (similarity: ${doc.similarity.toFixed(3)})\n`;
            });
            report += `\n`;
        });

        return report;
    }

    /**
     * Save MRR results to file
     */
    async saveResults(results: any, outputPath: string): Promise<void> {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const fileName = `mrr-evaluation-${timestamp}.json`;
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
export async function runRetrievalEvaluation(): Promise<any> {
    try {
        const testQueriesPath = path.join(process.cwd(), 'evaluation', 'test-queries.json');
        const outputDir = path.join(process.cwd(), 'evaluation', 'results');

        const evaluator = new RetrievalEvaluator(testQueriesPath);
        const results = await evaluator.calculateMRR(10);

        // Save detailed results
        await evaluator.saveResults(results, outputDir);

        // Generate and save report
        const report = evaluator.generateDetailedReport(results);
        const reportPath = path.join(outputDir, `mrr-report-${new Date().toISOString().replace(/[:.]/g, '-')}.md`);
        fs.writeFileSync(reportPath, report);
        console.log(`📋 Report saved to: ${reportPath}`);

        return results;
    } catch (error) {
        console.error('❌ Error running retrieval evaluation:', error);
        throw error;
    }
}

// If running directly
if (require.main === module) {
    runRetrievalEvaluation().then(() => {
        console.log('✅ Retrieval evaluation completed!');
        process.exit(0);
    }).catch(error => {
        console.error('❌ Evaluation failed:', error);
        process.exit(1);
    });
} 