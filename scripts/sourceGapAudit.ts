import { ALL_METRIC_DEFINITIONS } from '../src/engine/scoringEngine';
import {
  isHarnessOnlyCapabilityMetric,
  isPlainChatHarness,
} from '../src/data/executionMetricPolicy';

class MemoryStorage {
  private readonly values = new Map<string, string>();

  get length(): number {
    return this.values.size;
  }

  clear(): void {
    this.values.clear();
  }

  getItem(key: string): string | null {
    return this.values.get(String(key)) ?? null;
  }

  key(index: number): string | null {
    return [...this.values.keys()][index] ?? null;
  }

  removeItem(key: string): void {
    this.values.delete(String(key));
  }

  setItem(key: string, value: string): void {
    this.values.set(String(key), String(value));
  }
}

Object.defineProperty(globalThis, 'localStorage', {
  configurable: true,
  value: new MemoryStorage(),
});

const { AdminMappingStore } = await import('../src/store/adminMappingStore');
const { BUILT_IN_CONFIGURATION_PRESETS } = await import(
  '../src/data/builtInConfigurationPresets'
);

const store = new AdminMappingStore();
store.installBuiltInConfigurationPresets();

const presetsById = new Map(
  BUILT_IN_CONFIGURATION_PRESETS.map((preset) => [preset.id, preset]),
);
const observationsByCardId = store.observations.reduce<Map<string, typeof store.observations>>(
  (result, observation) => {
    const observations = result.get(observation.sourceModelCardId) || [];
    observations.push(observation);
    result.set(observation.sourceModelCardId, observations);
    return result;
  },
  new Map(),
);
const definitionsByDomain = ALL_METRIC_DEFINITIONS.reduce<
  Map<string, typeof ALL_METRIC_DEFINITIONS>
>((result, definition) => {
  const definitions = result.get(definition.domain) || [];
  definitions.push(definition);
  result.set(definition.domain, definitions);
  return result;
}, new Map());

const selectedConfigurations = store.computeLeaderboardScores().map((score) => {
  const box = store.boxes.find((candidate) => candidate.id === score.config.id);
  const preset = box?.builtInPresetId ? presetsById.get(box.builtInPresetId) : undefined;
  const presentMetricIds = new Set(Object.keys(score.config.observations));
  return {
    configuration: score.config.name,
    productLineId: preset?.productLineId,
    harness: preset?.identity.harness.name,
    availableDomainCount: score.availableDomainCount,
    cards: box
      ? store.getLinkedCardStack(box.id).map(({ link, card }) => ({
        cardId: card.id,
        provenance: link.provenance?.kind || 'exact',
      }))
      : [],
    domains: [...definitionsByDomain.entries()].map(([domainId, definitions]) => ({
      domainId,
      present: definitions
        .filter((definition) => presentMetricIds.has(definition.id))
        .map((definition) => definition.id),
      missing: definitions
        .filter((definition) => !presentMetricIds.has(definition.id))
        .map((definition) => definition.id),
    })),
  };
});

const targetProductLines = new Set([
  'qwen_37_max',
  'nemotron_3_ultra',
  'step_37_flash',
]);

const targetSourceCards = store.cards
  .filter((card) => targetProductLines.has(String(card.metadataJson?.scope?.productLineId)))
  .map((card) => ({
    cardId: card.id,
    source: card.source,
    exactSourceModelName: card.exactSourceModelName,
    productLineId: card.metadataJson?.scope?.productLineId,
    canonicalProfileKey: card.metadataJson?.scope?.canonicalProfileKey,
    releaseDate: card.metadataJson?.sourceIdentity?.releaseDate,
    sourceUrl: card.metadataJson?.sourceUrl,
    metricIds: (observationsByCardId.get(card.id) || [])
      .map((observation) => observation.metricId)
      .sort(),
    harnessOnlyMetricIds: (observationsByCardId.get(card.id) || [])
      .map((observation) => observation.metricId)
      .filter(isHarnessOnlyCapabilityMetric)
      .sort(),
  }))
  .sort((left, right) => (
    String(left.productLineId).localeCompare(String(right.productLineId), 'en-US')
    || left.cardId.localeCompare(right.cardId, 'en-US')
  ));

const arenaAgentSourceCards = store.cards
  .filter((card) => (
    card.source === 'arena'
    && (observationsByCardId.get(card.id) || []).some((observation) => (
      observation.metricId.startsWith('arena_agent_')
    ))
  ))
  .map((card) => ({
    cardId: card.id,
    exactSourceModelName: card.exactSourceModelName,
    productLineId: card.metadataJson?.scope?.productLineId,
    canonicalProfileKey: card.metadataJson?.scope?.canonicalProfileKey,
    sourceUrl: card.metadataJson?.sourceUrl,
    metricIds: (observationsByCardId.get(card.id) || [])
      .map((observation) => observation.metricId)
      .sort(),
  }))
  .sort((left, right) => left.cardId.localeCompare(right.cardId, 'en-US'));

const missingDomainModelPatterns = [
  /gpt[- .]?5[.-]?6[- .]?sol/iu,
  /gpt[- .]?5[.-]?6[- .]?terra/iu,
  /gpt[- .]?5[.-]?6[- .]?luna/iu,
  /claude[- .]?opus[- .]?5/iu,
  /claude[- .]?opus[- .]?4[.-]?6/iu,
  /claude[- .]?sonnet[- .]?4[.-]?6/iu,
  /claude[- .]?(?:4[.-]?5[- .]?)?haiku/iu,
  /gemini[- .]?3[.-]?5[- .]?flash[- .]?lite/iu,
  /gemini[- .]?3[.-]?6[- .]?flash/iu,
  /gpt[- .]?5[.-]?4/iu,
  /kimi[- .]?k?3/iu,
  /mistral[- .]?medium[- .]?3[.-]?5/iu,
  /qwen[- .]?3[.-]?7[- .]?max/iu,
  /step[- .]?3[.-]?7[- .]?flash/iu,
  /nemotron[- .]?3[- .]?ultra/iu,
  /muse[- .]?spark[- .]?1[.-]?1/iu,
] as const;

const globalMissingDomainCandidateCards = store.cards
  .filter((card) => missingDomainModelPatterns.some((pattern) => (
    pattern.test(card.exactSourceModelName)
  )))
  .map((card) => ({
    cardId: card.id,
    source: card.source,
    exactSourceModelName: card.exactSourceModelName,
    productLineId: card.metadataJson?.scope?.productLineId,
    canonicalProfileKey: card.metadataJson?.scope?.canonicalProfileKey,
    metricIds: (observationsByCardId.get(card.id) || [])
      .map((observation) => observation.metricId)
      .sort(),
  }))
  .sort((left, right) => left.cardId.localeCompare(right.cardId, 'en-US'));

console.log(JSON.stringify({
  globalMissingDomainCandidateCards,
  selectedChatConfigurations: selectedConfigurations.filter((configuration) => (
    isPlainChatHarness(configuration.harness)
  )),
  selectedHarnessConfigurations: selectedConfigurations.filter((configuration) => (
    !isPlainChatHarness(configuration.harness)
  )),
  arenaAgentSourceCards,
  targetSourceCards,
}, null, 2));
