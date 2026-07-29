# Arena data self-audit

- Audit status: **VALIDATED**
- Audit status validates provenance, score integrity, and Arena reconciliation; it is not by itself a claim that every upstream source was fetched live in this run.
- Audit time: 2026-07-27T13:24:08.132Z
- Raw extraction: `src/data/arenaRawExtraction.json` (arena-raw-extraction/v1)
- Catalog: `src/data/seedCards.ts`
- Scope: `oagxm-current-product-lines` (oagxm-current-product-lines/v3-data-md)
- Catalog refresh status: **DIRECT_SOURCE_EXTRACTION**
- Catalog freshness disclosure: All catalog cards record direct source extraction input modes.

## OAGXM current-product scope

- Scope provenance findings: 0
- Product lines with no source record in this snapshot: 2
- All 47 configured product lines are formal text/agent models; no image/audio/safety-only line is admitted to this capability scope.

## Arena per-metric reconciliation

The `source*` columns retain complete public-leaderboard extraction facts. The unprefixed columns are the explicit OAGXM scope admitted to the database and are the values compared for validation.

| Metric | sourceExtractedRowCount | sourceDuplicateRowCount | sourceUniqueModelCount | extractedRowCount | duplicateRowCount | uniqueModelCount | databaseAvailableCount | Status |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| arena_text_instruction | 380 | 0 | 380 | 47 | 0 | 47 | 47 | VALID |
| arena_text_multiturn | 378 | 0 | 378 | 47 | 0 | 47 | 47 | VALID |
| arena_text_creative | 378 | 0 | 378 | 47 | 0 | 47 | 47 | VALID |
| arena_text_hard | 380 | 0 | 380 | 47 | 0 | 47 | 47 | VALID |
| arena_text_math | 367 | 0 | 367 | 45 | 0 | 45 | 45 | VALID |
| arena_text_coding | 375 | 0 | 375 | 47 | 0 | 47 | 47 | VALID |
| arena_code_webdev | 103 | 1 | 102 | 36 | 0 | 36 | 36 | VALID |
| arena_search | 32 | 0 | 32 | 8 | 0 | 8 | 8 | VALID |
| arena_agent_success | 38 | 0 | 38 | 28 | 0 | 28 | 28 | VALID |
| arena_agent_praise | 38 | 0 | 38 | 28 | 0 | 28 | 28 | VALID |
| arena_agent_steerability | 38 | 0 | 38 | 28 | 0 | 28 | 28 | VALID |
| arena_agent_bash_recovery | 38 | 0 | 38 | 28 | 0 | 28 | 28 | VALID |
| arena_agent_tool_hallucination | 38 | 0 | 38 | 28 | 0 | 28 | 28 | VALID |

Total effective Arena observations: 464; sum of 13 unique available counts: 464; conservation: PASS.

## Catalog provenance

- Cards: 212 (AA 97, Arena 62, OpenRouter 53)
- Available observations: 1432 (AA 862, Arena 464, OpenRouter 106)
- Provenance / source ownership findings: 0
- Unproven default 0 / 50 values: 0
- Full live three-source refresh: yes
- Source input modes:
  - arena: official-arena-raw-extraction — 62 cards, 464 available observations (direct_source_extraction)
  - artificial_analysis: official-aa-live — 97 cards, 862 available observations (direct_source_extraction)
  - openrouter: official-openrouter-live — 53 cards, 106 available observations (direct_source_extraction)

## Integrity checks

- Local generated score code in production paths: none found
- Missing metric treated as 50: not found
- Radar missing domain rendered as 50: not found
- Array-position mismatch: not found

## Verdict

VALIDATED — every available catalog observation has verified source provenance; all 13 Arena metrics reconcile from raw source rows to the deduplicated database; no default 0/50, generated numeric data, or positional mismatch was found. Catalog refresh status remains **DIRECT_SOURCE_EXTRACTION**; consult the input-mode disclosure above before treating this as a fully live source refresh.

### Warnings

- oagxm: A configured scope product line had no record in any of the three sources for this snapshot.

