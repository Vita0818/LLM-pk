import { CohortSnapshot } from '../types/llm_pk';

/**
 * Describes the currently configured cohort only. Capability observations are
 * loaded exclusively from the verified source-card store.
 */
export const CURRENT_COHORT_SNAPSHOT: CohortSnapshot = {
  id: 'recent_3_months_2026',
  name: '近 3 个月新发布前沿模型快照 (2026-04-28 至 2026-07-28)',
  scoringVersion: 'Scoring v1.2 + Weighting v2.1',
  snapshotDate: '2026-07-28',
  totalConfigs: 37,
  description: '榜单仅使用已映射且可追溯至 Artificial Analysis、Arena 或 OpenRouter 的来源记录；覆盖状态单独披露。',
};
