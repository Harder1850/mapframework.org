// Public demonstration scoring only. No persistence or research claims.
export function scoreResults(results) {
  if (!results.length) throw new Error('At least one completed trial is required');
  const consequential = type => ['meaningful', 'conflicting', 'boundary'].includes(type);
  const fraction = (items, predicate) => items.length ? items.filter(predicate).length / items.length : null;
  const meaningful = results.filter(r => consequential(r.actual));
  const other = results.filter(r => !consequential(r.actual));
  const irrelevant = results.filter(r => ['surface', 'irrelevant'].includes(r.actual));
  const failures = results.filter(r => ['conflicting', 'boundary'].includes(r.actual));
  const noEscalation = results.filter(r => !r.shouldEscalate);
  return {
    metrics: [
      ['Classification accuracy', fraction(results, r => r.classCorrect)],
      ['Meaningful-delta detection', fraction(meaningful, r => consequential(r.chosen))],
      ['Missed-delta rate', fraction(meaningful, r => !consequential(r.chosen))],
      ['False-delta rate', fraction(other, r => consequential(r.chosen))],
      ['Irrelevant-novelty resistance', fraction(irrelevant, r => !consequential(r.chosen) && r.adaptCorrect)],
      ['Correct answer adaptation', fraction(results, r => r.adaptCorrect)],
      ['Failure awareness', fraction(failures, r => r.escalated || ['conflicting', 'boundary'].includes(r.chosen))],
      ['Appropriate escalation', fraction(results, r => r.escalated === r.shouldEscalate)],
      ['Unnecessary escalation rate', fraction(noEscalation, r => r.escalated)]
    ],
    averageSeconds: results.reduce((sum, r) => sum + r.seconds, 0) / results.length,
    brier: results.reduce((sum, r) => sum + (r.confidence / 100 - Number(r.classCorrect)) ** 2, 0) / results.length
  };
}
