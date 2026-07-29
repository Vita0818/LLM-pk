/**
 * Fetch OpenRouter's public, model-page performance rows.
 *
 * The general `/api/v1/models` catalog publishes model identity and list
 * prices. The model page separately calls `/api/frontend/v1/stats/endpoint`
 * for provider-endpoint p50 latency/throughput and endpoint prices. This
 * script preserves every accepted raw row, then also publishes provider-
 * neutral per-model summaries (arithmetic mean, request-weighted mean,
 * median, quartiles, and range). Flex/Priority service tiers are never mixed
 * into the ordinary Standard route.
 *
 * Usage:
 *   OPENROUTER_MODELS_SNAPSHOT_PATH=/path/to/models.json \
 *     node scripts/fetchOpenRouterPerformanceSnapshot.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const OUTPUT_PATH = path.resolve(
  process.env.OPENROUTER_PERFORMANCE_OUTPUT
    ?? path.join(ROOT, 'src', 'data', 'openRouterPerformanceSnapshot.json'),
);
const MODEL_CATALOG_URL = 'https://openrouter.ai/api/v1/models';
const STATS_ENDPOINT_URL = 'https://openrouter.ai/api/frontend/v1/stats/endpoint';
const CONCURRENCY = Math.max(1, Math.min(12, Number(process.env.OPENROUTER_FETCH_CONCURRENCY) || 4));
const MAX_ATTEMPTS = 5;

function asFiniteNumber(value) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function isCanonicalModelRecordId(value) {
  const id = String(value || '').trim().toLocaleLowerCase('en-US');
  return id.length > 0
    && !id.startsWith('~')
    && !/(?:^|[-/])latest$/u.test(id);
}

function isGeneralTextModel(model) {
  const inputModalities = model?.architecture?.input_modalities;
  const outputModalities = model?.architecture?.output_modalities;
  const identity = `${model?.id || ''}\n${model?.name || ''}`.toLocaleLowerCase('en-US');
  if (/\b(?:image|video|speech|audio|tts|transcri(?:be|ption)|embedding|moderation|safeguard|guard|music|lyria|router)\b/iu.test(identity)) {
    return false;
  }
  if (!Array.isArray(inputModalities) || !Array.isArray(outputModalities)) return true;
  return inputModalities.includes('text')
    && outputModalities.length > 0
    && outputModalities.every((modality) => modality === 'text');
}

async function fetchJson(url) {
  let lastError;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 45_000);
    try {
      const response = await fetch(url, {
        headers: {
          Accept: 'application/json',
          'User-Agent': 'LLMpk verified-source-rebuild/1.0',
        },
        signal: controller.signal,
      });
      if (!response.ok) {
        const requestError = new Error(`HTTP ${response.status}`);
        requestError.status = response.status;
        throw requestError;
      }
      return await response.json();
    } catch (error) {
      lastError = error;
      if (error && typeof error === 'object' && error.status === 404) throw error;
      if (attempt < MAX_ATTEMPTS) {
        await new Promise((resolve) => setTimeout(resolve, 500 * attempt));
      }
    } finally {
      clearTimeout(timeout);
    }
  }
  throw lastError;
}

async function loadModelCatalog() {
  const snapshotPath = process.env.OPENROUTER_MODELS_SNAPSHOT_PATH;
  if (snapshotPath) {
    if (!fs.existsSync(snapshotPath)) {
      throw new Error(`OPENROUTER_MODELS_SNAPSHOT_PATH does not exist: ${snapshotPath}`);
    }
    return {
      payload: JSON.parse(fs.readFileSync(snapshotPath, 'utf8')),
      inputMode: 'official-openrouter-local-snapshot',
      inputPath: snapshotPath,
    };
  }
  return {
    payload: await fetchJson(MODEL_CATALOG_URL),
    inputMode: 'official-openrouter-live',
    inputPath: null,
  };
}

function compactStatsRow(model, endpoint, sourceUrl, sourceOrder) {
  const stats = endpoint?.stats;
  const p50LatencyMilliseconds = asFiniteNumber(stats?.p50_latency);
  const p50ThroughputTokensPerSecond = asFiniteNumber(stats?.p50_throughput);
  const requestCount = asFiniteNumber(stats?.request_count);
  const windowMinutes = asFiniteNumber(stats?.window_minutes);
  if (
    p50LatencyMilliseconds === null
    || p50ThroughputTokensPerSecond === null
    || requestCount === null
    || requestCount <= 0
  ) {
    return null;
  }

  return {
    modelId: model.id,
    canonicalSlug: model.canonical_slug,
    exactModelName: model.name || model.id,
    variant: endpoint.variant || 'standard',
    sourceOrder,
    endpointId: endpoint.id,
    endpointName: endpoint.name || null,
    providerName: endpoint.provider_name || null,
    providerDisplayName: endpoint.provider_display_name || endpoint.provider_name || null,
    providerSlug: endpoint.provider_slug || endpoint.provider_info?.slug || null,
    providerRegion: endpoint.provider_region || null,
    stats: {
      p50LatencyMilliseconds,
      p50ThroughputTokensPerSecond,
      requestCount,
      windowMinutes,
      p75LatencyMilliseconds: asFiniteNumber(stats?.p75_latency),
      p90LatencyMilliseconds: asFiniteNumber(stats?.p90_latency),
      p95LatencyMilliseconds: asFiniteNumber(stats?.p95_latency),
      p99LatencyMilliseconds: asFiniteNumber(stats?.p99_latency),
      p75ThroughputTokensPerSecond: asFiniteNumber(stats?.p75_throughput),
      p90ThroughputTokensPerSecond: asFiniteNumber(stats?.p90_throughput),
      p95ThroughputTokensPerSecond: asFiniteNumber(stats?.p95_throughput),
      p99ThroughputTokensPerSecond: asFiniteNumber(stats?.p99_throughput),
    },
    pricing: {
      inputPricePerToken: asFiniteNumber(endpoint.pricing?.prompt),
      outputPricePerToken: asFiniteNumber(endpoint.pricing?.completion),
      cacheReadPricePerToken: asFiniteNumber(endpoint.pricing?.input_cache_read),
      cacheWritePricePerToken: asFiniteNumber(endpoint.pricing?.input_cache_write),
      cacheWriteOneHourPricePerToken: asFiniteNumber(endpoint.pricing?.input_cache_write_1h),
      reasoningPricePerToken: asFiniteNumber(endpoint.pricing?.internal_reasoning),
      requestPrice: asFiniteNumber(endpoint.pricing?.request),
      webSearchPrice: asFiniteNumber(endpoint.pricing?.web_search),
      imagePrice: asFiniteNumber(endpoint.pricing?.image),
      audioPrice: asFiniteNumber(endpoint.pricing?.audio),
      rawPublishedPricing: endpoint.pricing && typeof endpoint.pricing === 'object'
        ? endpoint.pricing
        : null,
    },
    sourceUrl,
    sourcePageUrl: `https://openrouter.ai/${model.id}`,
    sourceFields: {
      p50LatencyMilliseconds: 'data[].stats.p50_latency',
      p50ThroughputTokensPerSecond: 'data[].stats.p50_throughput',
      requestCount: 'data[].stats.request_count',
      windowMinutes: 'data[].stats.window_minutes',
      inputPricePerToken: 'data[].pricing.prompt',
      outputPricePerToken: 'data[].pricing.completion',
      cacheReadPricePerToken: 'data[].pricing.input_cache_read',
      cacheWritePricePerToken: 'data[].pricing.input_cache_write',
      cacheWriteOneHourPricePerToken: 'data[].pricing.input_cache_write_1h',
      reasoningPricePerToken: 'data[].pricing.internal_reasoning',
      requestPrice: 'data[].pricing.request',
      webSearchPrice: 'data[].pricing.web_search',
      imagePrice: 'data[].pricing.image',
      audioPrice: 'data[].pricing.audio',
    },
  };
}

function quantile(sortedValues, probability) {
  if (sortedValues.length === 0) return null;
  if (sortedValues.length === 1) return sortedValues[0];
  const index = (sortedValues.length - 1) * probability;
  const lowerIndex = Math.floor(index);
  const upperIndex = Math.ceil(index);
  if (lowerIndex === upperIndex) return sortedValues[lowerIndex];
  const fraction = index - lowerIndex;
  return sortedValues[lowerIndex]
    + (sortedValues[upperIndex] - sortedValues[lowerIndex]) * fraction;
}

function summarizeEndpointMeasure(records, selector) {
  const contributions = records
    .map((record) => ({
      value: asFiniteNumber(selector(record)),
      requestCount: asFiniteNumber(record.stats?.requestCount),
    }))
    .filter(({ value }) => value !== null);
  if (contributions.length === 0) return null;

  const sortedValues = contributions
    .map(({ value }) => value)
    .sort((left, right) => left - right);
  const requestWeightedContributions = contributions
    .filter(({ requestCount }) => requestCount !== null && requestCount > 0);
  const totalRequestCount = requestWeightedContributions
    .reduce((sum, { requestCount }) => sum + requestCount, 0);
  const requestWeightedMean = totalRequestCount > 0
    ? requestWeightedContributions.reduce(
      (sum, { value, requestCount }) => sum + value * requestCount,
      0,
    ) / totalRequestCount
    : null;

  return {
    contributingEndpointCount: contributions.length,
    arithmeticMean: sortedValues.reduce((sum, value) => sum + value, 0)
      / sortedValues.length,
    requestWeightedMean,
    median: quantile(sortedValues, 0.5),
    percentile25: quantile(sortedValues, 0.25),
    percentile75: quantile(sortedValues, 0.75),
    minimum: sortedValues[0],
    maximum: sortedValues[sortedValues.length - 1],
    totalRequestCount,
  };
}

function buildModelAggregates(records) {
  const recordsByModelId = new Map();
  for (const record of records) {
    const modelRecords = recordsByModelId.get(record.modelId) || [];
    modelRecords.push(record);
    recordsByModelId.set(record.modelId, modelRecords);
  }

  return [...recordsByModelId.entries()].map(([modelId, modelRecords]) => {
    const first = modelRecords[0];
    const providers = new Set(modelRecords.map((record) => (
      record.providerSlug
      || record.providerName
      || record.providerDisplayName
      || `endpoint:${record.endpointId}`
    )));
    return {
      modelId,
      canonicalSlug: first.canonicalSlug,
      exactModelName: first.exactModelName,
      variant: 'standard',
      endpointCount: modelRecords.length,
      providerCount: providers.size,
      totalRequestCount: modelRecords.reduce(
        (sum, record) => sum + (asFiniteNumber(record.stats?.requestCount) || 0),
        0,
      ),
      measures: {
        inputPricePerToken: summarizeEndpointMeasure(
          modelRecords,
          (record) => record.pricing?.inputPricePerToken,
        ),
        outputPricePerToken: summarizeEndpointMeasure(
          modelRecords,
          (record) => record.pricing?.outputPricePerToken,
        ),
        timeToFirstTokenMilliseconds: summarizeEndpointMeasure(
          modelRecords,
          (record) => record.stats?.p50LatencyMilliseconds,
        ),
        outputSpeedTokensPerSecond: summarizeEndpointMeasure(
          modelRecords,
          (record) => record.stats?.p50ThroughputTokensPerSecond,
        ),
      },
      endpointIds: modelRecords.map((record) => record.endpointId).sort(),
      providerSlugs: [...providers].sort(),
      sourcePageUrl: first.sourcePageUrl,
      sourceUrls: [...new Set(modelRecords.map((record) => record.sourceUrl))].sort(),
    };
  }).sort((left, right) => left.modelId.localeCompare(right.modelId, 'en-US'));
}

async function main() {
  const { payload, inputMode, inputPath } = await loadModelCatalog();
  const models = (Array.isArray(payload?.data) ? payload.data : [])
    .filter((model) => (
      typeof model?.id === 'string'
      && typeof model?.canonical_slug === 'string'
      && isCanonicalModelRecordId(model.id)
      && isGeneralTextModel(model)
    ))
    .sort((left, right) => left.id.localeCompare(right.id, 'en-US'));
  if (models.length === 0) {
    throw new Error('OpenRouter model catalog contained no eligible text-model records.');
  }

  const records = [];
  const failures = [];
  const unavailableModels = [];
  const noStatisticsModels = [];
  const endpointDiagnostics = {
    returnedEndpointRows: 0,
    acceptedEndpointRows: 0,
    rejectedEndpointRows: 0,
    rejectedMissingLatency: 0,
    rejectedMissingThroughput: 0,
    rejectedMissingOrZeroRequestCount: 0,
  };
  let cursor = 0;

  async function worker() {
    while (cursor < models.length) {
      const model = models[cursor];
      cursor += 1;
      const searchParams = new URLSearchParams({
        permaslug: model.canonical_slug,
        variant: 'standard',
      });
      const sourceUrl = `${STATS_ENDPOINT_URL}?${searchParams.toString()}`;
      try {
        const response = await fetchJson(sourceUrl);
        let acceptedEndpointCount = 0;
        const endpoints = Array.isArray(response?.data) ? response.data : [];
        endpointDiagnostics.returnedEndpointRows += endpoints.length;
        for (const [sourceOrder, endpoint] of endpoints.entries()) {
          const compact = compactStatsRow(model, endpoint, sourceUrl, sourceOrder);
          if (compact) {
            records.push(compact);
            acceptedEndpointCount += 1;
            endpointDiagnostics.acceptedEndpointRows += 1;
          } else {
            endpointDiagnostics.rejectedEndpointRows += 1;
            if (asFiniteNumber(endpoint?.stats?.p50_latency) === null) {
              endpointDiagnostics.rejectedMissingLatency += 1;
            }
            if (asFiniteNumber(endpoint?.stats?.p50_throughput) === null) {
              endpointDiagnostics.rejectedMissingThroughput += 1;
            }
            const requestCount = asFiniteNumber(endpoint?.stats?.request_count);
            if (requestCount === null || requestCount <= 0) {
              endpointDiagnostics.rejectedMissingOrZeroRequestCount += 1;
            }
          }
        }
        if (acceptedEndpointCount === 0) {
          noStatisticsModels.push({
            modelId: model.id,
            canonicalSlug: model.canonical_slug,
            sourceUrl,
            reason: 'official stats response had no endpoint with both p50 metrics and request_count > 0',
          });
        }
      } catch (error) {
        const unavailable = error && typeof error === 'object' && error.status === 404;
        const target = unavailable ? unavailableModels : failures;
        target.push({
          modelId: model.id,
          canonicalSlug: model.canonical_slug,
          sourceUrl,
          ...(unavailable
            ? { reason: 'official stats endpoint returned HTTP 404' }
            : { error: error instanceof Error ? error.message : String(error) }),
        });
      }
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));
  records.sort((left, right) => (
    left.modelId.localeCompare(right.modelId, 'en-US')
    || String(left.providerSlug || '').localeCompare(String(right.providerSlug || ''), 'en-US')
    || left.endpointId.localeCompare(right.endpointId, 'en-US')
  ));
  failures.sort((left, right) => left.modelId.localeCompare(right.modelId, 'en-US'));
  unavailableModels.sort((left, right) => left.modelId.localeCompare(right.modelId, 'en-US'));
  noStatisticsModels.sort((left, right) => left.modelId.localeCompare(right.modelId, 'en-US'));

  const successfulModelIds = new Set(records.map((record) => record.modelId));
  const queriedModelIds = new Set(models.map((model) => model.id));
  if (failures.length > 0) {
    throw new Error(`OpenRouter performance refresh failed for ${failures.length}/${models.length} models; refusing to replace the verified snapshot.`);
  }

  const modelAggregates = buildModelAggregates(records);
  const snapshot = {
    schemaVersion: 'openrouter-performance-snapshot/v1',
    fetchedAt: new Date().toISOString(),
    source: {
      modelCatalogUrl: MODEL_CATALOG_URL,
      statsEndpointUrl: STATS_ENDPOINT_URL,
      statsVariant: 'standard',
      metricWindow: 'endpoint response stats.window_minutes (normally 30 minutes)',
      inputMode,
      ...(inputPath ? { inputPath } : {}),
    },
    selectionPolicy: {
      modelRecords: 'canonical general text-output records from /api/v1/models',
      endpointRecords: 'every Standard-variant provider endpoint with finite p50 latency, finite p50 throughput, and request_count > 0',
      aggregation: {
        rawRecords: 'Every accepted endpoint remains a separate exact provider-route record.',
        modelLevel: 'For each model, preserve arithmetic mean, request-count-weighted mean, median, p25, p75, minimum, and maximum across accepted Standard endpoints.',
        primaryMeanDefinition: 'Arithmetic mean gives every published Standard endpoint equal weight; requestWeightedMean is retained separately for traffic-weighted analysis.',
        latencyCaveat: 'timeToFirstTokenMilliseconds summarizes provider endpoint p50_latency values; it is a mean/median of endpoint p50s, not a recomputed global request-level p50.',
      },
      excludedServiceTiers: ['flex', 'priority'],
    },
    counts: {
      queriedModels: queriedModelIds.size,
      modelsWithPerformance: successfulModelIds.size,
      endpointRecords: records.length,
      modelAggregates: modelAggregates.length,
      modelsWithSingleEndpoint: modelAggregates.filter((record) => record.endpointCount === 1).length,
      modelsWithMultipleEndpoints: modelAggregates.filter((record) => record.endpointCount > 1).length,
      unavailableModels: unavailableModels.length,
      noStatisticsModels: noStatisticsModels.length,
      failedModels: failures.length,
      ...endpointDiagnostics,
    },
    records,
    modelAggregates,
    unavailableModels,
    noStatisticsModels,
    failures,
  };
  fs.writeFileSync(OUTPUT_PATH, `${JSON.stringify(snapshot, null, 2)}\n`, 'utf8');
  console.log(JSON.stringify({
    status: 'VALIDATED_OPENROUTER_PERFORMANCE_SNAPSHOT',
    output: path.relative(ROOT, OUTPUT_PATH),
    ...snapshot.counts,
  }, null, 2));
}

await main();
