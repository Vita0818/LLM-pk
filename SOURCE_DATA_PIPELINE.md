# Source data refresh pipeline

The source refresh is intentionally separate from configuration matching,
domain composition, weights, and scoring. It copies published records without
calculating substitute benchmark values.

## Full refresh

```bash
npm run refresh:source-snapshots
```

The command:

1. fetches Artificial Analysis model, professional-evaluation, and Coding
   Agent records;
2. fetches all nine Arena leaderboard pages and extracts 13 metric tables;
3. fetches the OpenRouter model catalog and every available Standard endpoint
   performance row, including endpoint input/output prices, time to first
   token, output speed, and request counts;
4. validates structure, provenance, target-model coverage, field types,
   row-count regressions, and cross-source freshness;
5. publishes the staged snapshots only if every check passes.

Failed runs remain under `.cache/oagxm-source-snapshots/<run-id>` for
inspection and do not replace the published files.

Snapshot refresh deliberately does not promote a model into the reader-facing
catalog. After reviewing the validation report, rebuild the source cards with:

```bash
npm run rebuild:source-catalog
```

The rebuild copies Artificial Analysis records, deduplicated Arena rows, and
OpenRouter catalog plus Standard-endpoint aggregates into `src/data/seedCards.ts`.
Missing upstream values remain missing. The configuration curation layer then
admits only profiles that meet its capability-domain and evidence rules; run
`npm test`, the audit commands, and `npm run build` before publishing.

For OpenRouter, the raw provider-endpoint rows are kept intact. A second
`modelAggregates` layer summarizes every model across all accepted Standard
endpoints. Each of input price, output price, time to first token, and output
speed includes the arithmetic mean used by the source-card builder plus the
request-weighted mean, median, p25, p75, minimum, maximum, endpoint count, and
request count for audit. The latency statistic is necessarily a summary of
provider endpoint p50 values because OpenRouter does not expose request-level
samples from which a true global p50 could be recomputed.

## Published snapshots

- `src/data/artificialAnalysisSourceSnapshot.json`
- `src/data/arenaRawExtraction.json`
- `src/data/openRouterCatalogSnapshot.json`
- `src/data/openRouterPerformanceSnapshot.json`
- `src/data/sourceSnapshotValidationReport.json`

The raw AA and Arena HTML captures, SHA-256 hashes, response metadata, and run
manifest are retained under the run directory recorded in
`.cache/oagxm-source-snapshots/latest.json`.

## Individual commands

```bash
npm run refresh:artificial-analysis
npm run refresh:arena
npm run refresh:openrouter-catalog
npm run refresh:openrouter-performance
npm run validate:source-snapshots
```

The full refresh is the production path because it stages and atomically
publishes all sources together. Individual commands are useful for diagnostics.

## Current validation sentinels

The validator explicitly checks that these previously missed records exist:

- Kimi K3 model atomics and Kimi Code CLI row;
- GPT-5.4 with Codex;
- Claude Sonnet 4.6 with Claude Code;
- Claude Opus 4.6 with Claude Code;
- Kimi K2.6 with Claude Code.

It also verifies that AA-Briefcase, AutomationBench-AA, Harvey LAB-AA, and
EnterpriseOps-Gym-AA are captured as independent source tables. These records
are not connected to scoring until the matching and metric-registry phase.
