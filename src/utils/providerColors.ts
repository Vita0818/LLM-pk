export interface BrandTheme {
  color: string;     // 品牌线框与主特征色
  fillColor: string; // 雷达图中间六边形填充色
}

export const PROVIDER_BRAND_MAP: Record<string, BrandTheme> = {
  openai: { color: '#0F172A', fillColor: '#0F172A' },
  chatgpt: { color: '#0F172A', fillColor: '#0F172A' },
  anthropic: { color: '#D97757', fillColor: '#D97757' },
  claude: { color: '#D97757', fillColor: '#D97757' },
  google: { color: '#1A73E8', fillColor: '#7C3AED' },
  gemini: { color: '#1A73E8', fillColor: '#7C3AED' },
  deepseek: { color: '#4D6BFE', fillColor: '#4D6BFE' },
  alibaba: { color: '#615CED', fillColor: '#615CED' },
  qwen: { color: '#615CED', fillColor: '#615CED' },
  moonshot: { color: '#4F46E5', fillColor: '#4F46E5' },
  kimi: { color: '#4F46E5', fillColor: '#4F46E5' },
  zhipu: { color: '#3468FE', fillColor: '#3468FE' },
  'z.ai': { color: '#3468FE', fillColor: '#3468FE' },
  glm: { color: '#3468FE', fillColor: '#3468FE' },
  xai: { color: '#0F172A', fillColor: '#0F172A' },
  grok: { color: '#0F172A', fillColor: '#0F172A' },
  tencent: { color: '#0052D9', fillColor: '#0052D9' },
  hunyuan: { color: '#0052D9', fillColor: '#0052D9' },
  hy: { color: '#0052D9', fillColor: '#0052D9' },
  minimax: { color: '#FF4500', fillColor: '#FF4500' },
  stepfun: { color: '#2563EB', fillColor: '#2563EB' },
  step: { color: '#2563EB', fillColor: '#2563EB' },
  meituan: { color: '#F59E0B', fillColor: '#F59E0B' },
  longcat: { color: '#F59E0B', fillColor: '#F59E0B' },
  meta: { color: '#0467DF', fillColor: '#0467DF' },
  mistral: { color: '#FF7000', fillColor: '#FF7000' },
  nvidia: { color: '#76B900', fillColor: '#76B900' },
  nemotron: { color: '#76B900', fillColor: '#76B900' },
  cohere: { color: '#395B4C', fillColor: '#395B4C' },
  'thinking machines': { color: '#64748B', fillColor: '#64748B' },
  inkling: { color: '#64748B', fillColor: '#64748B' },
};

/**
 * 根据厂商或模型名称匹配品牌主题色（线框色 + 雷达图六边形填充色）
 */
export const getProviderBrandTheme = (providerOrName: string): BrandTheme => {
  if (!providerOrName) return { color: '#2563EB', fillColor: '#2563EB' };
  const lower = providerOrName.toLowerCase();

  for (const [key, theme] of Object.entries(PROVIDER_BRAND_MAP)) {
    if (lower.includes(key)) {
      return theme;
    }
  }

  return { color: '#2563EB', fillColor: '#2563EB' };
};
