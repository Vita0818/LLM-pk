import scopeJson from './oagxmScope.json';

export type OagxmScopeTier = 'official' | 'preview' | 'beta' | 'restricted' | 'historical';
export type OagxmRankingClass = 'formal_text_agent' | 'specialized_catalog_only';

export interface OagxmProductLine {
  id: string;
  name: string;
  tier: OagxmScopeTier;
  rankingClass: OagxmRankingClass;
  patterns: string[];
  /** Whether rows whose explicit source identity says "preview" are current for this line. */
  allowPreviewSourceRecords?: boolean;
}

export interface OagxmVendor {
  /** Stable source-identity namespace; not limited to the original five vendors. */
  id: string;
  name: string;
  officialModelsUrl: string;
  productLines: OagxmProductLine[];
}

export interface OagxmScopeDefinition {
  schemaVersion: string;
  scopeId: string;
  snapshotPolicy: string;
  benchmarkBoundary: string;
  vendors: OagxmVendor[];
}

/**
 * The curated OAGXM manifest remains the source of truth for Data.md model
 * families.  Source-published models outside that handwritten list use this
 * separate, versioned scope so they can be kept and audited rather than
 * silently discarded during source ingestion.
 */
export const SOURCE_CATALOG_SCOPE_ID = 'llmpk-source-catalog';
export const SOURCE_CATALOG_SCOPE_VERSION = 'v1';

export interface OagxmScopeMatch {
  scopeId: string;
  scopeVersion: string;
  vendorId: OagxmVendor['id'];
  vendorName: string;
  productLineId: string;
  productLineName: string;
  tier: OagxmScopeTier;
  rankingClass: OagxmRankingClass;
}

/**
 * The scope is intentionally an explicit, versioned whitelist of current
 * product lines. It is not a vendor-name heuristic and never merges real
 * serving profiles such as thinking, harness, fast, or pro. Arena Search and
 * Grounding suffixes are benchmark labels: ingestion assigns those
 * observations to the underlying model while preserving the exact source row.
 */
export const OAGXM_SCOPE = scopeJson as OagxmScopeDefinition;

function normalizeSourceIdentity(value: string): string {
  return value
    .normalize('NFKC')
    .trim()
    .replace(/\s+/g, ' ')
    .toLocaleLowerCase('en-US');
}

function matchesLine(identity: string, productLine: OagxmProductLine): boolean {
  if (productLine.allowPreviewSourceRecords === false && /\bpreview\b/iu.test(identity)) return false;
  return productLine.patterns.some((pattern) => new RegExp(pattern, 'iu').test(identity));
}

/**
 * Classify only an explicitly whitelisted source identity. Passing the source
 * model name plus its source record ID lets aliases be selected without using
 * a loose manufacturer-name match.
 */
export function classifyOagxmModel(...sourceIdentities: Array<string | null | undefined>): OagxmScopeMatch | null {
  const identity = sourceIdentities
    .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
    .map(normalizeSourceIdentity)
    .join('\n');

  if (!identity) return null;

  for (const vendor of OAGXM_SCOPE.vendors) {
    for (const productLine of vendor.productLines) {
      if (!matchesLine(identity, productLine)) continue;
      return {
        scopeId: OAGXM_SCOPE.scopeId,
        scopeVersion: OAGXM_SCOPE.schemaVersion,
        vendorId: vendor.id,
        vendorName: vendor.name,
        productLineId: productLine.id,
        productLineName: productLine.name,
        tier: productLine.tier,
        rankingClass: productLine.rankingClass,
      };
    }
  }

  return null;
}

export function isOagxmScopedModel(...sourceIdentities: Array<string | null | undefined>): boolean {
  return classifyOagxmModel(...sourceIdentities) !== null;
}
