import "dotenv/config";
import fs from "fs";
import path from "path";
import { runGenerationEvaluation } from "./generation-evaluation";
import { runRetrievalEvaluation } from "./retrieval-evaluation";

interface EvaluationResults {
    retrieval: {
        mrr: number;
        details: any[];
    };
    generation: {
        averageScores: {
            faithfulness: number;
            answerRelevancy: number;
            semanticSimilarity: number;
        };
        results: any[];
    };
    timestamp: string;
    summary: {
        totalQueries: number;
        retrievalSuccessRate: number;
        overallPerformance: string;
        overallScore: number;
    };
}

/**
 * Main evaluation runner that combines retrieval and generation evaluation
 */
export class RAGEvaluationRunner {
    private outputDir: string;

    constructor() {
        this.outputDir = path.join(process.cwd(), 'evaluation', 'results');
        this.ensureOutputDirectory();
    }

    private ensureOutputDirectory(): void {
        if (!fs.existsSync(this.outputDir)) {
            fs.mkdirSync(this.outputDir, { recursive: true });
        }
    }

    /**
     * Run complete RAG evaluation (both retrieval and generation)
     */
    async runCompleteEvaluation(): Promise<EvaluationResults> {
        console.log('🚀 Starting Complete RAG Evaluation...\n');

        const timestamp = new Date().toISOString();

        try {
            // Run retrieval evaluation
            console.log('📊 Phase 1: Retrieval Evaluation (MRR)\n');
            const retrievalResults = await runRetrievalEvaluation();

            console.log('\n' + '='.repeat(80) + '\n');

            // Run generation evaluation
            console.log('📊 Phase 2: Generation Evaluation (Faithfulness, Relevancy, Similarity)\n');
            const generationResults = await runGenerationEvaluation();

            // Combine results
            const results: EvaluationResults = {
                retrieval: retrievalResults,
                generation: generationResults,
                timestamp,
                summary: this.calculateSummary(retrievalResults, generationResults)
            };

            // Generate and save comprehensive report
            await this.generateComprehensiveReport(results);

            // Save combined results
            await this.saveCombinedResults(results);

            console.log('\n' + '='.repeat(80));
            console.log('🎉 Complete RAG Evaluation Finished!');
            console.log('='.repeat(80));
            this.printSummary(results);

            return results;

        } catch (error) {
            console.error('❌ Error during evaluation:', error);
            throw error;
        }
    }

    /**
     * Calculate summary statistics
     */
    private calculateSummary(retrievalResults: any, generationResults: any): any {
        const totalQueries = retrievalResults.details.length;
        const successfulRetrievals = retrievalResults.details.filter((d: any) => d.rank > 0).length;
        const retrievalSuccessRate = (successfulRetrievals / totalQueries) * 100;

        // Calculate overall performance based on all metrics
        const avgFaithfulness = generationResults.averageScores.faithfulness;
        const avgRelevancy = generationResults.averageScores.answerRelevancy;
        const avgSimilarity = generationResults.averageScores.semanticSimilarity;
        const avgMRR = retrievalResults.mrr;

        const overallScore = (avgMRR + avgFaithfulness + avgRelevancy + avgSimilarity) / 4;

        let overallPerformance: string;
        if (overallScore >= 0.9) overallPerformance = 'Excellent';
        else if (overallScore >= 0.8) overallPerformance = 'Very Good';
        else if (overallScore >= 0.7) overallPerformance = 'Good';
        else if (overallScore >= 0.6) overallPerformance = 'Fair';
        else overallPerformance = 'Needs Improvement';

        return {
            totalQueries,
            retrievalSuccessRate,
            overallPerformance,
            overallScore
        };
    }

    /**
     * Generate comprehensive evaluation report
     */
    private async generateComprehensiveReport(results: EvaluationResults): Promise<void> {
        const report = this.createComprehensiveReport(results);
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const reportPath = path.join(this.outputDir, `comprehensive-evaluation-report-${timestamp}.md`);

        fs.writeFileSync(reportPath, report);
        console.log(`📋 Comprehensive report saved to: ${reportPath}`);
    }

    /**
     * Create comprehensive report content
     */
    private createComprehensiveReport(results: EvaluationResults): string {
        const { retrieval, generation, summary } = results;

        let report = `# Comprehensive RAG System Evaluation Report\n\n`;

        // Executive Summary
        report += `## Executive Summary\n\n`;
        report += `**Evaluation Date:** ${new Date(results.timestamp).toLocaleString()}\n`;
        report += `**Total Test Queries:** ${summary.totalQueries}\n`;
        report += `**Overall Performance:** ${summary.overallPerformance} (${(summary.overallScore * 100).toFixed(1)}%)\n\n`;

        // Key Metrics Summary Table
        report += `## Key Metrics Summary\n\n`;
        report += `| Metric | Score | Interpretation |\n`;
        report += `|--------|-------|----------------|\n`;
        report += `| Mean Reciprocal Rank (MRR) | ${retrieval.mrr.toFixed(3)} | ${this.interpretMRR(retrieval.mrr)} |\n`;
        report += `| Faithfulness | ${generation.averageScores.faithfulness.toFixed(3)} | ${this.interpretScore(generation.averageScores.faithfulness)} |\n`;
        report += `| Answer Relevancy | ${generation.averageScores.answerRelevancy.toFixed(3)} | ${this.interpretScore(generation.averageScores.answerRelevancy)} |\n`;
        report += `| Semantic Similarity | ${generation.averageScores.semanticSimilarity.toFixed(3)} | ${this.interpretScore(generation.averageScores.semanticSimilarity)} |\n\n`;

        // Analysis and Insights
        report += `## Analysis and Insights\n\n`;

        report += `### Retrieval Performance\n`;
        report += `- **MRR Score:** ${retrieval.mrr.toFixed(3)} indicates that the system ${this.interpretMRR(retrieval.mrr).toLowerCase()}\n`;
        report += `- **Success Rate:** ${summary.retrievalSuccessRate.toFixed(1)}% of queries returned relevant documents\n`;

        // Rank distribution
        const rankDistribution = this.calculateRankDistribution(retrieval.details);
        report += `- **Rank Distribution:**\n`;
        report += `  - Rank 1: ${rankDistribution.rank1} queries (${(rankDistribution.rank1 / summary.totalQueries * 100).toFixed(1)}%)\n`;
        report += `  - Rank 2-3: ${rankDistribution.rank2to3} queries (${(rankDistribution.rank2to3 / summary.totalQueries * 100).toFixed(1)}%)\n`;
        report += `  - Not found: ${rankDistribution.notFound} queries (${(rankDistribution.notFound / summary.totalQueries * 100).toFixed(1)}%)\n\n`;

        report += `### Generation Quality\n`;
        report += `- **Faithfulness:** ${(generation.averageScores.faithfulness * 100).toFixed(1)}% of generated content is supported by retrieved context\n`;
        report += `- **Answer Relevancy:** ${(generation.averageScores.answerRelevancy * 100).toFixed(1)}% semantic relevance to user queries\n`;
        report += `- **Semantic Similarity:** ${(generation.averageScores.semanticSimilarity * 100).toFixed(1)}% similarity to reference answers\n\n`;

        // Performance categories
        const performanceDistribution = this.calculatePerformanceDistribution(generation.results);
        report += `### Performance Distribution\n`;
        report += `- **Excellent (≥90%):** ${performanceDistribution.excellent} queries\n`;
        report += `- **Good (70-89%):** ${performanceDistribution.good} queries\n`;
        report += `- **Fair (50-69%):** ${performanceDistribution.fair} queries\n`;
        report += `- **Poor (<50%):** ${performanceDistribution.poor} queries\n\n`;

        // Recommendations
        report += `## Recommendations\n\n`;
        report += this.generateRecommendations(results);

        // Detailed Methodology
        report += `## Methodology\n\n`;
        report += `### Retrieval Evaluation (MRR)\n`;
        report += `- **Mean Reciprocal Rank (MRR)**: Measures how quickly the system finds relevant documents\n`;
        report += `- **Formula**: MRR = (1/|Q|) × Σ(1/rank_i)\n`;
        report += `- **Range**: 0-1 (higher is better)\n`;
        report += `- **k**: Top 10 documents considered\n\n`;

        report += `### Generation Evaluation\n`;
        report += `- **Faithfulness**: Accuracy of generated answers to retrieved context (LLM-evaluated)\n`;
        report += `- **Answer Relevancy**: Cosine similarity between query and answer embeddings\n`;
        report += `- **Semantic Similarity**: Cosine similarity between generated and reference answers\n`;
        report += `- **Embedding Model**: Google text-embedding-004\n`;
        report += `- **LLM**: Gemini 2.0 Flash\n\n`;

        // Technical Details
        report += `## Technical Configuration\n\n`;
        report += `- **Vector Database**: PostgreSQL with pgvector extension\n`;
        report += `- **Embedding Dimensions**: 768\n`;
        report += `- **Similarity Threshold**: 0.3\n`;
        report += `- **Max Context Length**: 5 chunks per query\n`;
        report += `- **Evaluation Dataset**: ${summary.totalQueries} curated psychology queries\n\n`;

        report += `---\n\n`;
        report += `*Report generated on ${new Date().toLocaleString()}*\n`;

        return report;
    }

    /**
     * Interpret MRR scores
     */
    private interpretMRR(mrr: number): string {
        if (mrr >= 0.9) return 'Excellent retrieval performance';
        else if (mrr >= 0.8) return 'Very good retrieval performance';
        else if (mrr >= 0.7) return 'Good retrieval performance';
        else if (mrr >= 0.6) return 'Fair retrieval performance';
        else return 'Poor retrieval performance - needs improvement';
    }

    /**
     * Interpret general scores
     */
    private interpretScore(score: number): string {
        if (score >= 0.9) return 'Excellent';
        else if (score >= 0.8) return 'Very Good';
        else if (score >= 0.7) return 'Good';
        else if (score >= 0.6) return 'Fair';
        else return 'Poor';
    }

    /**
     * Calculate rank distribution
     */
    private calculateRankDistribution(details: any[]): any {
        return details.reduce((acc, d) => {
            if (d.rank === 0) acc.notFound++;
            else if (d.rank === 1) acc.rank1++;
            else if (d.rank <= 3) acc.rank2to3++;
            else if (d.rank <= 5) acc.rank4to5++;
            else acc.rank6plus++;
            return acc;
        }, { notFound: 0, rank1: 0, rank2to3: 0, rank4to5: 0, rank6plus: 0 });
    }

    /**
     * Calculate performance distribution
     */
    private calculatePerformanceDistribution(results: any[]): any {
        return results.reduce((acc, result) => {
            const avgScore = (result.faithfulness + result.answerRelevancy + result.semanticSimilarity) / 3;
            if (avgScore >= 0.9) acc.excellent++;
            else if (avgScore >= 0.7) acc.good++;
            else if (avgScore >= 0.5) acc.fair++;
            else acc.poor++;
            return acc;
        }, { excellent: 0, good: 0, fair: 0, poor: 0 });
    }

    /**
     * Generate recommendations based on results
     */
    private generateRecommendations(results: EvaluationResults): string {
        const { retrieval, generation, summary } = results;
        let recommendations = '';

        // Retrieval recommendations
        if (retrieval.mrr < 0.8) {
            recommendations += `### Retrieval Improvements\n`;
            recommendations += `- **Low MRR (${retrieval.mrr.toFixed(3)})**: Consider improving embedding quality or increasing chunk overlap\n`;
            recommendations += `- **Query Expansion**: Implement query expansion techniques for better recall\n`;
            recommendations += `- **Re-ranking**: Add a re-ranking step using cross-encoder models\n\n`;
        }

        // Generation recommendations
        if (generation.averageScores.faithfulness < 0.8) {
            recommendations += `### Faithfulness Improvements\n`;
            recommendations += `- **Low Faithfulness (${generation.averageScores.faithfulness.toFixed(3)})**: Improve prompt engineering to stay closer to context\n`;
            recommendations += `- **Context Quality**: Ensure retrieved chunks contain complete information\n`;
            recommendations += `- **Answer Verification**: Add post-generation verification steps\n\n`;
        }

        if (generation.averageScores.answerRelevancy < 0.8) {
            recommendations += `### Relevancy Improvements\n`;
            recommendations += `- **Low Answer Relevancy (${generation.averageScores.answerRelevancy.toFixed(3)})**: Improve query understanding and answer focusing\n`;
            recommendations += `- **Response Length**: Optimize answer length to maintain relevance\n`;
            recommendations += `- **Query Classification**: Add query intent classification\n\n`;
        }

        if (generation.averageScores.semanticSimilarity < 0.8) {
            recommendations += `### Semantic Similarity Improvements\n`;
            recommendations += `- **Low Semantic Similarity (${generation.averageScores.semanticSimilarity.toFixed(3)})**: Reference answers may need refinement\n`;
            recommendations += `- **Style Consistency**: Align generation style with reference answers\n`;
            recommendations += `- **Knowledge Gaps**: Address missing information in knowledge base\n\n`;
        }

        // Overall recommendations
        recommendations += `### General Recommendations\n`;
        recommendations += `- **Data Quality**: Regularly update and expand the Alodokter knowledge base\n`;
        recommendations += `- **Monitoring**: Implement continuous evaluation with user feedback\n`;
        recommendations += `- **A/B Testing**: Test different retrieval and generation parameters\n`;
        recommendations += `- **User Studies**: Conduct qualitative evaluation with psychology professionals\n\n`;

        return recommendations || `### Overall Performance\nThe system shows strong performance across all metrics. Consider:\n- Regular monitoring and evaluation\n- Expanding the knowledge base\n- Collecting user feedback for continuous improvement\n\n`;
    }

    /**
     * Save combined results
     */
    private async saveCombinedResults(results: EvaluationResults): Promise<void> {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const fileName = `combined-evaluation-${timestamp}.json`;
        const fullPath = path.join(this.outputDir, fileName);

        fs.writeFileSync(fullPath, JSON.stringify(results, null, 2));
        console.log(`💾 Combined results saved to: ${fullPath}`);
    }

    /**
     * Print summary to console
     */
    private printSummary(results: EvaluationResults): void {
        const { retrieval, generation, summary } = results;

        console.log('\n📊 EVALUATION SUMMARY');
        console.log('='.repeat(50));
        console.log(`Total Queries: ${summary.totalQueries}`);
        console.log(`Overall Performance: ${summary.overallPerformance} (${(summary.overallScore * 100).toFixed(1)}%)`);
        console.log('');
        console.log('📈 METRICS:');
        console.log(`  MRR (Retrieval):      ${retrieval.mrr.toFixed(3)} (${this.interpretMRR(retrieval.mrr)})`);
        console.log(`  Faithfulness:         ${generation.averageScores.faithfulness.toFixed(3)} (${this.interpretScore(generation.averageScores.faithfulness)})`);
        console.log(`  Answer Relevancy:     ${generation.averageScores.answerRelevancy.toFixed(3)} (${this.interpretScore(generation.averageScores.answerRelevancy)})`);
        console.log(`  Semantic Similarity:  ${generation.averageScores.semanticSimilarity.toFixed(3)} (${this.interpretScore(generation.averageScores.semanticSimilarity)})`);
        console.log('');
        console.log(`📁 Results saved in: ${this.outputDir}`);
    }
}

// Main execution function
export async function runCompleteRAGEvaluation(): Promise<EvaluationResults> {
    const runner = new RAGEvaluationRunner();
    return await runner.runCompleteEvaluation();
}

// If running directly
if (require.main === module) {
    runCompleteRAGEvaluation().then(() => {
        console.log('\n✅ Complete RAG evaluation finished successfully!');
        process.exit(0);
    }).catch(error => {
        console.error('\n❌ Evaluation failed:', error);
        process.exit(1);
    });
} 