# Arena data self-audit

- Audit status: **VALIDATED**
- Audit status validates provenance, score integrity, and Arena reconciliation; it is not by itself a claim that every upstream source was fetched live in this run.
- Audit time: 2026-08-06T05:50:59.113Z
- Raw extraction: `src/data/arenaRawExtraction.json` (arena-raw-extraction/v1)
- Catalog: `src/data/seedCards.ts`
- Scope: `oagxm-current-product-lines` (oagxm-current-product-lines/v4-muse-spark-1-2)
- Catalog refresh status: **MIXED_SNAPSHOT_REBUILD**
- Catalog freshness disclosure: The catalog mixes direct raw extraction with official-source and/or verified-catalog snapshots. This audit validates provenance and reconciliation, not a fully live three-source refresh.

## OAGXM current-product scope

- Scope provenance findings: 0
- Product lines with no source record in this snapshot: 2
- General source-catalog records outside this curated scope: 1336 cards / 7910 observations; card and observation scopes still reconcile exactly.
- All 49 configured product lines are formal text/agent models; no image/audio/safety-only line is admitted to this capability scope.

## Arena per-metric reconciliation

The `source*` columns retain complete public-leaderboard extraction facts. The unprefixed columns are the explicit OAGXM scope admitted to the database and are the values compared for validation.

| Metric | sourceExtractedRowCount | sourceDuplicateRowCount | sourceUniqueModelCount | extractedRowCount | duplicateRowCount | uniqueModelCount | databaseAvailableCount | Status |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| arena_text_instruction | 385 | 1 | 384 | 51 | 1 | 50 | 50 | VALID |
| arena_text_multiturn | 383 | 1 | 382 | 51 | 1 | 50 | 50 | VALID |
| arena_text_creative | 383 | 1 | 382 | 51 | 1 | 50 | 50 | VALID |
| arena_text_hard | 385 | 1 | 384 | 51 | 1 | 50 | 50 | VALID |
| arena_text_math | 371 | 1 | 370 | 49 | 1 | 48 | 48 | VALID |
| arena_text_coding | 380 | 1 | 379 | 51 | 1 | 50 | 50 | VALID |
| arena_code_webdev | 110 | 1 | 109 | 42 | 0 | 42 | 42 | VALID |
| arena_search | 32 | 0 | 32 | 8 | 0 | 8 | 8 | VALID |
| arena_agent_success | 45 | 0 | 45 | 35 | 0 | 35 | 35 | VALID |
| arena_agent_praise | 45 | 0 | 45 | 35 | 0 | 35 | 35 | VALID |
| arena_agent_steerability | 45 | 0 | 45 | 35 | 0 | 35 | 35 | VALID |
| arena_agent_bash_recovery | 45 | 0 | 45 | 35 | 0 | 35 | 35 | VALID |
| arena_agent_tool_hallucination | 45 | 0 | 45 | 35 | 0 | 35 | 35 | VALID |

Total effective Arena observations: 523; sum of 13 unique available counts: 523; conservation: PASS.

## Catalog provenance

- Cards: 1630 (AA 593, Arena 432, OpenRouter 605)
- Available observations: 10285 (AA 6428, Arena 2647, OpenRouter 1210)
- Provenance / source ownership findings: 0
- Unproven default 0 / 50 values: 0
- Full live three-source refresh: no
- Source input modes:
  - arena: official-arena-raw-extraction — 432 cards, 2647 available observations (direct_source_extraction)
  - artificial_analysis: official-aa-structured-snapshot — 593 cards, 6428 available observations (official_source_snapshot)
  - openrouter: official-openrouter-local-snapshot — 309 cards, 618 available observations (official_source_snapshot)
  - openrouter: provider-neutral arithmetic mean across every accepted OpenRouter Standard endpoint; raw rows, traffic-weighted mean, median, quartiles, and range retained in the verified snapshot — 296 cards, 592 available observations (official_source_snapshot)

## Integrity checks

- Local generated score code in production paths: none found
- Missing metric treated as 50: not found
- Radar missing domain rendered as 50: not found
- Array-position mismatch: not found

## Verdict

VALIDATED — every available catalog observation has verified source provenance; all 13 Arena metrics reconcile from raw source rows to the deduplicated database; no default 0/50, generated numeric data, or positional mismatch was found. Catalog refresh status remains **MIXED_SNAPSHOT_REBUILD**; consult the input-mode disclosure above before treating this as a fully live source refresh.

### Warnings

- oagxm: A configured scope product line had no record in any of the three sources for this snapshot.
- catalog: Catalog input freshness is not a fully live three-source refresh; see catalog input modes and disclosure.

