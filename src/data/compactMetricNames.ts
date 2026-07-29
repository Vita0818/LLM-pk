/**
 * Short labels used only in dense metric lists.
 *
 * Canonical metric names remain unchanged in the scoring definitions and are
 * still exposed by the row tooltip.
 */
const COMPACT_METRIC_NAMES: Readonly<Record<string, string>> = {
  aa_coding_agent_deepswe: 'DeepSWE',
  aa_coding_agent_swe_atlas_qna: 'SWE-Atlas Q&A',
  aa_coding_agent_terminalbench_v2: 'Terminal-Bench v2',
  arena_code_webdev: 'WebDev Overall',
  aa_coding_agent_index: 'Coding Agent Index',
  aa_omniscience_accuracy: 'Omniscience Accuracy',
  aa_omniscience_nonhallucination: 'Omniscience Non-Halluc.',
};

export function getCompactMetricName(metricId: string, canonicalName: string): string {
  return COMPACT_METRIC_NAMES[metricId] ?? canonicalName;
}
