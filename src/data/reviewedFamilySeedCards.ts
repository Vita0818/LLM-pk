import type { SourceModelCard, SourceObservation } from '../types/admin_mapping';
import {
  VERIFIED_SOURCE_MODEL_CARDS,
  VERIFIED_SOURCE_OBSERVATIONS,
} from './seedCards';

/**
 * A small number of source-catalog records predate the current OAGXM family
 * manifest and were ingested with one product-line ID per published profile.
 * These reviewed projections preserve every upstream record and value while
 * assigning the profiles to one auditable same-model family. They are never
 * used for fuzzy matching or cross-model borrowing.
 */
interface ReviewedFamilyCardSpec {
  key: string;
  baseCardId: string;
  scopeTemplateCardId?: string;
  productLineId: string;
  productLineName: string;
}

const REVIEWED_FAMILY_CARD_SPECS: readonly ReviewedFamilyCardSpec[] = [
  {
    key: 'gpt54-arena-high',
    baseCardId: 'card-arena-gpt-5-4-high',
    productLineId: 'source-profile-gpt-5-4',
    productLineName: 'GPT-5.4',
  },
  {
    key: 'gpt54-aa-low',
    baseCardId: 'card-aa-gpt-5-4-low',
    productLineId: 'source-profile-gpt-5-4',
    productLineName: 'GPT-5.4',
  },
  {
    key: 'gpt54-aa-xhigh',
    baseCardId: 'card-aa-gpt-5-4',
    productLineId: 'source-profile-gpt-5-4',
    productLineName: 'GPT-5.4',
  },
  {
    key: 'sonnet46-aa-high',
    baseCardId: 'card-aa-claude-sonnet-4-6',
    productLineId: 'source-profile-claude-sonnet-4-6',
    productLineName: 'Claude Sonnet 4.6',
  },
  {
    key: 'sonnet46-aa-max',
    baseCardId: 'card-aa-claude-sonnet-4-6-adaptive',
    productLineId: 'source-profile-claude-sonnet-4-6',
    productLineName: 'Claude Sonnet 4.6',
  },
  {
    key: 'qwen37max-arena-preview',
    baseCardId: 'card-arena-qwen3-7-max-preview',
    scopeTemplateCardId: 'card-aa-qwen3-7-max',
    productLineId: 'qwen_37_max',
    productLineName: 'Qwen3.7-Max',
  },
  {
    key: 'grok43-arena-default',
    baseCardId: 'card-arena-grok-4-3',
    productLineId: 'source-profile-grok-4-3-high',
    productLineName: 'Grok 4.3',
  },
  {
    key: 'inkling-arena-default',
    baseCardId: 'card-arena-inkling',
    productLineId: 'source-profile-inkling-xhigh',
    productLineName: 'Inkling',
  },
  {
    key: 'grokbuild01-arena',
    baseCardId: 'card-arena-grok-build-0-1',
    productLineId: 'source-profile-grok-build-0-1-0616',
    productLineName: 'Grok Build 0.1',
  },
] as const;

const ARENA_AGENT_METRIC_IDS = new Set([
  'arena_agent_success',
  'arena_agent_steerability',
  'arena_agent_praise',
  'arena_agent_bash_recovery',
  'arena_agent_tool_hallucination',
]);

const BASE_CARDS = JSON.parse(VERIFIED_SOURCE_MODEL_CARDS) as SourceModelCard[];
const BASE_OBSERVATIONS = JSON.parse(VERIFIED_SOURCE_OBSERVATIONS) as SourceObservation[];
const BASE_CARDS_BY_ID = new Map(BASE_CARDS.map((card) => [card.id, card]));

export function reviewedFamilyCardId(key: string): string {
  return `card-reviewed-family-${key}`;
}

export function reviewedFamilyAgentModeCardId(key: string): string {
  return `card-reviewed-family-agent-mode-${key}`;
}

const projectedCards: SourceModelCard[] = [];
const projectedObservations: SourceObservation[] = [];
const projectedCardsByKey = new Map<string, SourceModelCard>();

for (const spec of REVIEWED_FAMILY_CARD_SPECS) {
  const baseCard = BASE_CARDS_BY_ID.get(spec.baseCardId);
  if (!baseCard) continue;

  const cardId = reviewedFamilyCardId(spec.key);
  const baseScope = baseCard.metadataJson?.scope || {};
  const scopeTemplate = spec.scopeTemplateCardId
    ? BASE_CARDS_BY_ID.get(spec.scopeTemplateCardId)?.metadataJson?.scope
    : undefined;
  const projectedScope = {
    ...baseScope,
    ...(scopeTemplate || {}),
    productLineId: spec.productLineId,
    productLineName: spec.productLineName,
    canonicalProfileKey: baseScope.canonicalProfileKey,
  };
  const baseSourceIdentity = baseCard.metadataJson?.sourceIdentity || {};
  const sourceRecordId = String(baseSourceIdentity.sourceRecordId || spec.baseCardId);
  const card: SourceModelCard = {
    ...baseCard,
    id: cardId,
    metadataJson: {
      ...baseCard.metadataJson,
      scope: projectedScope,
      sourceIdentity: {
        ...baseSourceIdentity,
        sourceRecordId: `${sourceRecordId}::reviewed-family:${spec.productLineId}`,
        selectionMethod: 'reviewed-same-model-family-projection',
        baseSourceCardId: spec.baseCardId,
      },
    },
  };
  projectedCards.push(card);
  projectedCardsByKey.set(spec.key, card);

  BASE_OBSERVATIONS
    .filter((observation) => observation.sourceModelCardId === spec.baseCardId)
    .forEach((observation) => {
      projectedObservations.push({
        ...observation,
        id: `obs-${cardId}-${observation.metricId}`,
        sourceModelCardId: cardId,
        metadataJson: {
          ...observation.metadataJson,
          baseSourceObservationId: observation.id,
          baseSourceModelCardId: spec.baseCardId,
          scope: {
            ...projectedScope,
            canonicalProfileKey: (
              observation.metadataJson?.scope?.canonicalProfileKey
              || projectedScope.canonicalProfileKey
            ),
          },
        },
      });
    });
}

for (const key of ['gpt54-arena-high', 'grokbuild01-arena'] as const) {
  const baseCard = projectedCardsByKey.get(key);
  if (!baseCard) continue;
  const observations = projectedObservations.filter((observation) => (
    observation.sourceModelCardId === baseCard.id
    && ARENA_AGENT_METRIC_IDS.has(observation.metricId)
  ));
  if (observations.length === 0) continue;

  const cardId = reviewedFamilyAgentModeCardId(key);
  const baseScope = baseCard.metadataJson?.scope || {};
  const baseSourceIdentity = baseCard.metadataJson?.sourceIdentity || {};
  const canonicalProfileKey = String(
    baseScope.canonicalProfileKey
    || baseSourceIdentity.canonicalProfileKey
    || key,
  );
  projectedCards.push({
    ...baseCard,
    id: cardId,
    exactSourceModelName: `${baseCard.exactSourceModelName} · Arena Agent Mode`,
    metadataJson: {
      ...baseCard.metadataJson,
      sourceLeaderboard: 'Arena Agent Mode',
      sourceRecordIds: observations.map((observation) => (
        String(observation.metadataJson?.sourceRecordId || observation.id)
      )),
      scope: {
        ...baseScope,
        canonicalProfileKey: `${canonicalProfileKey}::arena-agent-mode`,
      },
      sourceIdentity: {
        ...baseSourceIdentity,
        sourceRecordId: `${String(
          baseSourceIdentity.sourceRecordId || baseCard.id
        )}::arena-agent-mode`,
        selectionMethod: 'reviewed-production-agent-mode-projection',
        canonicalProfileKey: `${canonicalProfileKey}::arena-agent-mode`,
        baseSourceCardId: baseCard.id,
        executionHarness: 'Arena Agent Mode',
        executionEnvironment: 'Arena Agent Mode',
      },
    },
  });

  observations.forEach((observation) => {
    projectedObservations.push({
      ...observation,
      id: `obs-${cardId}-${observation.metricId}`,
      sourceModelCardId: cardId,
      metadataJson: {
        ...observation.metadataJson,
        baseSourceObservationId: observation.id,
        baseSourceModelCardId: baseCard.id,
        executionHarness: 'Arena Agent Mode',
        executionEnvironment: 'Arena Agent Mode',
      },
    });
  });
}

export const VERIFIED_REVIEWED_FAMILY_SOURCE_MODEL_CARDS:
readonly SourceModelCard[] = projectedCards;

export const VERIFIED_REVIEWED_FAMILY_SOURCE_OBSERVATIONS:
readonly SourceObservation[] = projectedObservations;
