import { type ExecutionInsight, type ExecutionRecord, type FeedbackCollector, type FeedbackRecord } from './types';

/**
 * Create a feedback collector for tracking AI workflow executions.
 * This data can be used to improve AI decision making over time.
 */
export function createFeedbackCollector(): FeedbackCollector {
  const executions: ExecutionRecord[] = [];
  const feedback: FeedbackRecord[] = [];

  /**
   * Record a step execution
   */
  const recordExecution = (record: Omit<ExecutionRecord, 'timestamp'>): void => {
    executions.push({
      ...record,
      timestamp: Date.now(),
    });
  };

  /**
   * Record user feedback
   */
  const recordFeedback = (fb: Omit<FeedbackRecord, 'timestamp'>): void => {
    feedback.push({
      ...fb,
      timestamp: Date.now(),
    });
  };

  /**
   * Get aggregated insights
   */
  const getInsights = (): ExecutionInsight[] => {
    const byKind = new Map<
      string,
      {
        executions: ExecutionRecord[];
        feedback: FeedbackRecord[];
      }
    >();

    // Group executions by step kind
    for (const exec of executions) {
      const existing = byKind.get(exec.stepKind) ?? { executions: [], feedback: [] };
      existing.executions.push(exec);
      byKind.set(exec.stepKind, existing);
    }

    // Group feedback by step kind
    for (const fb of feedback) {
      // Find the step kind from the most recent execution with that step id
      const recentExec = executions.filter((e) => e.stepId === fb.stepId).sort((a, b) => b.timestamp - a.timestamp)[0];

      if (recentExec) {
        const existing = byKind.get(recentExec.stepKind) ?? { executions: [], feedback: [] };
        existing.feedback.push(fb);
        byKind.set(recentExec.stepKind, existing);
      }
    }

    // Build insights
    const insights: ExecutionInsight[] = [];
    for (const [stepKind, data] of byKind) {
      const { executions: execs, feedback: fbs } = data;

      const successCount = execs.filter((e) => e.success).length;
      const totalDuration = execs.reduce((sum, e) => sum + e.durationMs, 0);

      // Count errors
      const errorCounts = new Map<string, number>();
      for (const exec of execs) {
        if (!exec.success && exec.output && typeof exec.output === 'string') {
          const count = errorCounts.get(exec.output) ?? 0;
          errorCounts.set(exec.output, count + 1);
        }
      }

      // Get common errors
      const commonErrors = Array.from(errorCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([error]) => error);

      // Count feedback
      const fbSummary = {
        positive: fbs.filter((f) => f.rating === 'positive').length,
        negative: fbs.filter((f) => f.rating === 'negative').length,
        neutral: fbs.filter((f) => f.rating === 'neutral').length,
      };

      insights.push({
        stepKind,
        totalExecutions: execs.length,
        successRate: execs.length > 0 ? successCount / execs.length : 0,
        averageDuration: execs.length > 0 ? totalDuration / execs.length : 0,
        commonErrors,
        feedbackSummary: fbSummary,
      });
    }

    return insights;
  };

  /**
   * Get raw execution history
   */
  const getExecutionHistory = (): ExecutionRecord[] => {
    return [...executions];
  };

  /**
   * Export data for AI analysis
   */
  const exportForAnalysis = (): string => {
    const insights = getInsights();

    const lines: string[] = [];
    lines.push('# Execution Analysis\n');

    for (const insight of insights) {
      lines.push(`## ${insight.stepKind}\n`);
      lines.push(`- Total Executions: ${insight.totalExecutions}`);
      lines.push(`- Success Rate: ${(insight.successRate * 100).toFixed(1)}%`);
      lines.push(`- Average Duration: ${insight.averageDuration.toFixed(0)}ms`);

      if (insight.commonErrors.length > 0) {
        lines.push(`- Common Errors: ${insight.commonErrors.join(', ')}`);
      }

      lines.push(
        `- Feedback: +${insight.feedbackSummary.positive} / -${insight.feedbackSummary.negative} / ~${insight.feedbackSummary.neutral}`,
      );
      lines.push('');
    }

    return lines.join('\n');
  };

  /**
   * Clear all records
   */
  const clear = (): void => {
    executions.length = 0;
    feedback.length = 0;
  };

  return {
    recordExecution,
    recordFeedback,
    getInsights,
    getExecutionHistory,
    exportForAnalysis,
    clear,
  };
}
