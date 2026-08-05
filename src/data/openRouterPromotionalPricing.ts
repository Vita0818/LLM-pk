/**
 * Source-backed OpenRouter promotional prices for selected GPT-5.6 routes.
 *
 * Keep the upstream list price and OpenRouter discount as separate parameters:
 * the effective API price is derived here, while subscription API-equivalent
 * value remains an independent plan parameter in builtInConfigurationPresets.
 */
export interface OpenRouterPromotionalPricing {
  productLineId: string;
  officialInputPricePerMToken: number;
  officialOutputPricePerMToken: number;
  openRouterDiscountMultiplier: number;
  effectiveInputPricePerMToken: number;
  effectiveOutputPricePerMToken: number;
  effectiveDate: string;
  officialSourceUrl: string;
  openRouterSourceUrl: string;
}

interface OpenRouterPromotionalPricingInput {
  productLineId: string;
  officialInputPricePerMToken: number;
  officialOutputPricePerMToken: number;
  openRouterDiscountMultiplier: number;
  effectiveDate: string;
  officialSourceUrl: string;
  openRouterSourceUrl: string;
}

function definePromotionalPricing(
  input: OpenRouterPromotionalPricingInput,
): OpenRouterPromotionalPricing {
  return {
    ...input,
    effectiveInputPricePerMToken:
      input.officialInputPricePerMToken * input.openRouterDiscountMultiplier,
    effectiveOutputPricePerMToken:
      input.officialOutputPricePerMToken * input.openRouterDiscountMultiplier,
  };
}

export const OPENROUTER_PROMOTIONAL_PRICING:
  readonly OpenRouterPromotionalPricing[] = [
  definePromotionalPricing({
    productLineId: 'gpt_56_terra',
    officialInputPricePerMToken: 2,
    officialOutputPricePerMToken: 12,
    openRouterDiscountMultiplier: 0.5,
    effectiveDate: '2026-07-31',
    officialSourceUrl:
      'https://developers.openai.com/api/docs/models/gpt-5.6-terra',
    openRouterSourceUrl:
      'https://openrouter.ai/openai/gpt-5.6-terra',
  }),
  definePromotionalPricing({
    productLineId: 'gpt_56_luna',
    officialInputPricePerMToken: 0.2,
    officialOutputPricePerMToken: 1.2,
    openRouterDiscountMultiplier: 0.5,
    effectiveDate: '2026-07-31',
    officialSourceUrl:
      'https://developers.openai.com/api/docs/models/gpt-5.6-luna',
    openRouterSourceUrl:
      'https://openrouter.ai/openai/gpt-5.6-luna',
  }),
];

const promotionalPricingByProductLine = new Map(
  OPENROUTER_PROMOTIONAL_PRICING.map((pricing) => [
    pricing.productLineId,
    pricing,
  ]),
);

export function getOpenRouterPromotionalPricing(
  productLineId: string,
): OpenRouterPromotionalPricing | undefined {
  return promotionalPricingByProductLine.get(productLineId);
}
