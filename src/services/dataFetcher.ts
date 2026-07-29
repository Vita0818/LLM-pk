import { LLMConfiguration } from '../types/llm_pk';
import { isOagxmScopedModel } from '../data/oagxmScope';

export interface OpenRouterApiModel {
  id: string;
  name: string;
  created: number;
  description?: string;
  context_length: number;
  architecture?: {
    modality?: string;
    tokenizer?: string;
    instruct_type?: string;
  };
  pricing: {
    prompt: string;        // USD per token
    completion: string;    // USD per token
    request?: string;
    image?: string;
    web_search?: string;
    internal_reasoning?: string;
  };
  top_provider?: {
    latency?: number;
    throughput?: number;
  };
}

export interface LiveSyncResult {
  success: boolean;
  timestamp: string;
  totalModelsFetched: number;
  /** Explicit current-product scope count. Kept alongside the legacy field for callers. */
  scopedModelsCount: number;
  /** @deprecated Use scopedModelsCount; the current scope is not a rolling 90-day window. */
  recentModelsCount: number;
  updatedConfigs: LLMConfiguration[];
  logs: string[];
}

/**
 * Direct Live API Fetcher from OpenRouter (https://openrouter.ai/api/v1/models)
 */
export async function fetchOpenRouterModels(): Promise<OpenRouterApiModel[]> {
  const endpoints = [
    '/api/openrouter/models',
    'https://openrouter.ai/api/v1/models',
  ];

  for (const url of endpoints) {
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
      });
      if (response.ok) {
        const json = await response.json();
        if (json.data && Array.isArray(json.data) && json.data.length > 0) {
          return json.data;
        }
      }
    } catch (e: any) {
      console.warn(`Fetch ${url} failed:`, e.message);
    }
  }

  return [];
}

/**
 * Format Provider Name from Model ID
 */
function parseProvider(modelId: string, modelName: string): string {
  const parts = modelId.split('/');
  const lowerId = modelId.toLowerCase();
  const lowerName = modelName.toLowerCase();

  if (lowerId.includes('anthropic') || lowerName.includes('claude')) return 'Anthropic';
  if (lowerId.includes('openai') || lowerName.includes('gpt')) return 'OpenAI';
  if (lowerId.includes('google') || lowerName.includes('gemini')) return 'Google';
  if (lowerId.includes('deepseek')) return 'DeepSeek';
  if (lowerId.includes('moonshot') || lowerName.includes('kimi')) return 'Moonshot AI';
  if (lowerId.includes('qwen') || lowerId.includes('alibaba')) return 'Alibaba Cloud';
  if (lowerId.includes('meta') || lowerId.includes('llama')) return 'Meta AI';
  if (lowerId.includes('mistral')) return 'Mistral AI';
  if (lowerId.includes('x-ai') || lowerName.includes('grok')) return 'xAI';
  if (lowerId.includes('poolside')) return 'Poolside';
  if (lowerId.includes('meituan') || lowerName.includes('longcat')) return 'Meituan';
  if (lowerId.includes('kwaipilot') || lowerName.includes('kat-coder')) return 'Kwaipilot';
  if (lowerId.includes('inclusion')) return 'Inclusion AI';
  if (lowerId.includes('thinkingmachines')) return 'Thinking Machines';

  if (parts.length > 1) {
    return parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
  }
  return 'OpenRouter';
}

/**
 * Sync Latest Cohort Data:
 * Filters OpenRouter to the versioned OAGXM current-product scope. The scope
 * itself decides what is current, so a still-supported line is not dropped
 * merely because its initial release is older than 90 days. This live path never supplies
 * Artificial Analysis or Arena capability observations.
 * Transforms raw live JSON payload into structured LLMConfigurations.
 */
export async function syncLatestCohortData(
  _existingConfigs: LLMConfiguration[]
): Promise<LiveSyncResult> {
  const logs: string[] = [];
  logs.push(`[${new Date().toLocaleTimeString()}] 开始调用 OpenRouter 官方 API（范围限制：版本化 OAGXM 当前产品线）...`);

  const allModels = await fetchOpenRouterModels();

  if (allModels.length === 0) {
    logs.push(`[错误] 无法抓取到 OpenRouter 官方模型数据，请检查网络通道。`);
    return {
      success: false,
      timestamp: new Date().toLocaleTimeString(),
      totalModelsFetched: 0,
      scopedModelsCount: 0,
      recentModelsCount: 0,
      updatedConfigs: [],
      logs,
    };
  }

  // Filter to explicit current OAGXM product lines, excluding negative/auto
  // router pricing. The explicit scope helper is used
  // instead of inferring a manufacturer from an arbitrary model name.
  const scopedModels = allModels
    .filter((m) => {
      const promptVal = parseFloat(m.pricing.prompt);
      return !isNaN(promptVal)
        && promptVal >= 0
        && !m.id.includes('auto-beta')
        && !m.id.startsWith('~')
        && !m.id.includes(':free')
        && !/(?:^|[-/])latest$/i.test(m.id)
        && isOagxmScopedModel(m.id, m.name);
    })
    .sort((a, b) => (b.created || 0) - (a.created || 0));

  logs.push(`[成功] 连通 OpenRouter 全量 ${allModels.length} 款模型，筛选出 OAGXM 当前范围内 ${scopedModels.length} 款模型及真实 API 价格！`);

  // Transform scoped live OpenRouter models into LLMConfigurations.
  const liveConfigs: LLMConfiguration[] = scopedModels.map((m) => {
    const provider = parseProvider(m.id, m.name || '');
    const releaseDate = m.created ? new Date(m.created * 1000).toISOString().split('T')[0] : '未知';
    const contextK = (m.context_length / 1000).toFixed(0);

    const inputPricePerM = parseFloat(m.pricing.prompt) * 1e6;
    const outputPricePerM = parseFloat(m.pricing.completion) * 1e6;
    const latencySeconds = m.top_provider?.latency;
    const throughputTokensPerSecond = m.top_provider?.throughput;

    // OpenRouter's model catalog is not a benchmark source. Keep cost/speed
    // data only when every value is explicitly supplied by the API response;
    // never manufacture latency, throughput, uptime, or capability values.
    const openRouterData =
      Number.isFinite(inputPricePerM) &&
      Number.isFinite(outputPricePerM) &&
      typeof latencySeconds === 'number' &&
      Number.isFinite(latencySeconds) &&
      latencySeconds > 0 &&
      typeof throughputTokensPerSecond === 'number' &&
      Number.isFinite(throughputTokensPerSecond) &&
      throughputTokensPerSecond > 0
        ? {
            inputPricePerMToken: inputPricePerM,
            outputPricePerMToken: outputPricePerM,
            ttftP50Seconds: latencySeconds,
            throughputP50TokensPerSec: throughputTokensPerSecond,
          }
        : undefined;

    return {
      id: `live-${m.id.replace(/[^a-zA-Z0-9-]/g, '-')}`,
      name: m.name || m.id,
      provider,
      tags: ['OAGXM 当前产品线', `发布: ${releaseDate}`, `Context: ${contextK}K`],
      identity: {
        modelName: m.name || m.id,
        modelVersion: releaseDate,
        reasoningEffort: m.id.includes('thinking') || m.id.includes('opus') || m.id.includes('reason') ? 'High' : 'None',
        contextWindowTokens: m.context_length || 128000,
      },
      execution: {
        harness: `${provider} Native Harness`,
        toolPermissions: ['Web Search', 'Code Execution', 'API Integration'],
      },
      access: {
        entryPoint: 'OpenRouter API',
        routingPolicy: 'fixed',
        providerEndpoint: m.id,
      },
      ...(openRouterData ? { openRouterData } : {}),
      // Capability observations are populated only by verified Arena and
      // Artificial Analysis source cards through the mapping store.
      observations: {},
    };
  });

  return {
    success: true,
    timestamp: new Date().toLocaleTimeString(),
    totalModelsFetched: allModels.length,
    scopedModelsCount: scopedModels.length,
    recentModelsCount: scopedModels.length,
    updatedConfigs: liveConfigs,
    logs,
  };
}
