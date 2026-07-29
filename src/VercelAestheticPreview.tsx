import React, { useState, useMemo } from 'react';
import {
  Search,
  ArrowUpRight,
  ArrowUpDown,
} from 'lucide-react';
import { DOMAIN_DEFINITIONS, ALL_METRIC_DEFINITIONS } from './engine/scoringEngine';
import { DETAIL_ONLY_METRIC_DEFINITIONS } from './data/detailMetricDefinitions';
import { getCompactMetricName } from './data/compactMetricNames';
import publicLeaderboardSnapshot from './data/publicLeaderboardSnapshot.json';
import { DomainId } from './types/llm_pk';
import type {
  PublicLeaderboardScore,
  PublicLeaderboardSnapshot,
} from './types/publicLeaderboard';
import { RadarChart } from './components/RadarChart';
import {
  formatPracticalAdjustment,
  getPracticalAdjustment,
  practicalAdjustmentTextClass,
} from './utils/practicalAdjustment';

type SortKey = 'rawCapabilityScore' | 'practicalAdjustment' | DomainId;

const PUBLIC_SCORES = (
  publicLeaderboardSnapshot as unknown as PublicLeaderboardSnapshot
).scores;

const formatRawMetricValue = (val: number | null | undefined, unit?: string) => {
  if (val === null || val === undefined || isNaN(val)) return '--';
  if (unit === '%' || unit === 'pass@1') {
    const pct = val <= 1 && val > 0 ? val * 100 : val;
    return `${pct.toFixed(1)}%`;
  }
  if (unit === 'Score' || unit === 'Score Point' || unit === 'Elo') {
    return Math.round(val).toLocaleString();
  }
  if (Number.isInteger(val)) {
    return val.toString();
  }
  return val.toFixed(1);
};

const getScoreDepthStyle = (score: number | null | undefined) => {
  if (score === null || score === undefined || isNaN(score)) {
    return { opacity: 0.35, fontWeight: 500 };
  }
  const normalized = Math.max(0, Math.min(100, score));
  // 100 score -> 1.0 (darkest), 0 score -> 0.45 (softest readable floor)
  const opacity = 0.45 + (normalized / 100) * 0.55;
  const fontWeight = normalized >= 80 ? 900 : normalized >= 50 ? 800 : 700;
  return { opacity, fontWeight };
};

const getDomainDef = (dId: string) => {
  if (dId === 'reliability') {
    return {
      id: 'reliability' as DomainId,
      name: 'Reliability 可靠性与抗幻觉',
      nameEn: 'Reliability & Anti-Hallucination',
      weight: 1 / 6,
      color: '#EC4899',
      description: '衡量终端恢复、工具幻觉防护与回复稳定性。',
    };
  }
  return DOMAIN_DEFINITIONS[dId as DomainId] || DOMAIN_DEFINITIONS.chatting;
};

/**
 * 100% Authentic Artificial Analysis (artificialanalysis.ai) Replica Design System
 * - Heading Font: Instrument Serif (font-brand-serif)
 * - UI Font: Inter (font-sans)
 * - Metric Font: JetBrains Mono (font-brand-mono)
 * - Header Pill Navbar: bg-neutral-100 rounded-[1.5rem] with bg-black active pill
 */
export const VercelAestheticPreview: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'detail'>('leaderboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedConfigId, setSelectedConfigId] = useState<string>('');
  const [filterCategory, setFilterCategory] = useState<'all' | 'reasoning' | 'top'>('all');
  const [sortKey, setSortKey] = useState<SortKey>('rawCapabilityScore');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const scores: PublicLeaderboardScore[] = PUBLIC_SCORES;

  // Filtered scores
  const filteredScores = useMemo(() => {
    const scoreForSort = (score: number | null) =>
      score ?? Number.NEGATIVE_INFINITY;

    return scores
      .filter((s) => {
        const matchSearch =
          s.config.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.config.provider.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.config.execution.harness.toLowerCase().includes(searchTerm.toLowerCase());

        if (!matchSearch) return false;

        if (filterCategory === 'reasoning') {
          const lowerName = s.config.name.toLowerCase();
          return (
            lowerName.includes('reasoning') ||
            lowerName.includes('pro') ||
            lowerName.includes('max') ||
            lowerName.includes('o3') ||
            lowerName.includes('r1') ||
            lowerName.includes('high')
          );
        }

        if (filterCategory === 'top') {
          return (s.rawCapabilityScore || 0) >= 60;
        }

        return true;
      })
      .sort((a, b) => {
        let valueA: number;
        let valueB: number;

        if (sortKey === 'rawCapabilityScore') {
          // Sort by the original unadjusted capability score (Intelligence Index)
          valueA = scoreForSort(a.rawCapabilityScore);
          valueB = scoreForSort(b.rawCapabilityScore);
        } else if (sortKey === 'practicalAdjustment') {
          valueA = scoreForSort(getPracticalAdjustment(a.practicalBreakdown));
          valueB = scoreForSort(getPracticalAdjustment(b.practicalBreakdown));
        } else {
          valueA = scoreForSort(a.domainScores[sortKey].score);
          valueB = scoreForSort(b.domainScores[sortKey].score);
        }

        return sortOrder === 'desc' ? valueB - valueA : valueA - valueB;
      });
  }, [scores, searchTerm, filterCategory, sortKey, sortOrder]);

  const selectedScoreItem =
    scores.find((s) => s.config.id === selectedConfigId) || scores[0];

  const domainList: DomainId[] = [
    'chatting',
    'math_science',
    'coding',
    'engineering',
    'agentic_work',
    'search_knowledge',
  ];

  const formatScore = (s: number | null) => (s === null ? '--' : s.toFixed(1));
  const formatCostValue = (value: number) => value.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

  // Split 3-part configuration name
  const parseConfigName = (name: string) => {
    const parts = name.split(' | ');
    return {
      model: parts[0] || name,
      harness: parts[1] || 'Chat',
      provider: parts[2] || 'API',
    };
  };

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder((current) => current === 'desc' ? 'asc' : 'desc');
      return;
    }

    setSortKey(key);
    setSortOrder('desc');
  };

  const renderSortLabel = (label: string, key: SortKey) => (
    <button
      type="button"
      onClick={() => handleSort(key)}
      className={`inline-flex items-center justify-center gap-1.5 whitespace-nowrap transition-colors hover:text-black ${
        sortKey === key ? 'text-black' : ''
      }`}
      title={`按 ${label} ${sortKey === key && sortOrder === 'desc' ? '升序' : '降序'}排列`}
    >
      <span>{label}</span>
      <ArrowUpDown
        className={`h-3 w-3 ${
          sortKey === key ? 'text-black' : 'text-neutral-400'
        }`}
      />
      {sortKey === key && (
        <span className="text-[10px] font-black" aria-hidden="true">
          {sortOrder === 'desc' ? '↓' : '↑'}
        </span>
      )}
    </button>
  );

  return (
    <div className="min-h-screen bg-white text-neutral-900 font-brand-mono antialiased selection:bg-black selection:text-white">
      {/* 1. Header Navigation */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-neutral-200/80 shadow-2xs">
        <div className="max-w-[1500px] mx-auto px-4 h-16 flex items-center justify-between gap-4">
          {/* Clean Website Name Only */}
          <a href={import.meta.env.BASE_URL} className="font-brand-mono text-3xl font-black text-neutral-950 tracking-tight select-none hover:opacity-90 transition-opacity">
            LLMpk
          </a>

          <div className="flex items-center gap-3">
            {/* Navigation Pill Bar */}
            <nav className="bg-neutral-100/90 rounded-[1.5rem] p-1 flex items-center gap-0.5 border border-neutral-200/60 shadow-sm">
              <button
                onClick={() => setActiveTab('leaderboard')}
                className={`rounded-3xl px-4 py-2 text-xs transition-colors ${
                  activeTab === 'leaderboard'
                    ? 'bg-black text-white shadow-sm font-bold'
                    : 'text-neutral-700 hover:text-black hover:bg-neutral-200/60 font-semibold'
                }`}
              >
                全量榜单
              </button>

              <button
                onClick={() => setActiveTab('detail')}
                className={`rounded-3xl px-4 py-2 text-xs transition-colors ${
                  activeTab === 'detail'
                    ? 'bg-black text-white shadow-sm font-bold'
                    : 'text-neutral-700 hover:text-black hover:bg-neutral-200/60 font-semibold'
                }`}
              >
                配置分析
              </button>

            </nav>
          </div>
        </div>
      </header>

      {/* 2. Main Section */}
      <main className="max-w-[1500px] mx-auto px-4 py-6">
        {/* VIEW 1: MODELS LEADERBOARD */}
        {activeTab === 'leaderboard' && (
          <div className="space-y-6">
            {/* High-Density Authentic Table */}
            <div className="w-full overflow-x-auto rounded-xl border border-neutral-200 bg-white">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="text-neutral-600 font-brand-mono text-[11px] border-b border-neutral-200 bg-neutral-50/70 uppercase tracking-wider">
                    <th className="px-4 py-3.5 text-center w-12 font-bold">#</th>
                    <th className="px-5 py-3.5 font-bold">Model Configuration (Model | Harness | Provider)</th>
                    <th className="px-5 py-3.5 text-center font-bold text-black">
                      {renderSortLabel('Intelligence & Practical Score', 'rawCapabilityScore')}
                    </th>
                    <th className="px-3.5 py-3.5 text-center font-bold text-purple-900 border-l border-neutral-200">
                      {renderSortLabel('Chatting', 'chatting')}
                    </th>
                    <th className="px-3.5 py-3.5 text-center font-bold text-amber-900">
                      {renderSortLabel('Math & Sci', 'math_science')}
                    </th>
                    <th className="px-3.5 py-3.5 text-center font-bold text-emerald-900">
                      {renderSortLabel('Coding', 'coding')}
                    </th>
                    <th className="px-3.5 py-3.5 text-center font-bold text-amber-900">
                      {renderSortLabel('Engineering', 'engineering')}
                    </th>
                    <th className="px-3.5 py-3.5 text-center font-bold text-blue-900">
                      {renderSortLabel('Agentic', 'agentic_work')}
                    </th>
                    <th className="px-3.5 py-3.5 text-center font-bold text-cyan-900">
                      {renderSortLabel('Search', 'search_knowledge')}
                    </th>
                    <th className="px-4 py-3.5 text-right"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 font-sans text-neutral-900">
                  {filteredScores.map((item, index) => {
                    const rank = item.eligibleForGlobalLeaderboard
                      ? filteredScores
                          .slice(0, index + 1)
                          .filter((score) => score.eligibleForGlobalLeaderboard).length
                      : null;
                    const parsed = parseConfigName(item.config.name);
                    const capabilityScore = item.rawCapabilityScore;
                    const practicalAdjustment = getPracticalAdjustment(item.practicalBreakdown);

                    return (
                      <tr
                        key={item.config.id}
                        onClick={() => {
                          setSelectedConfigId(item.config.id);
                          setActiveTab('detail');
                        }}
                        className="hover:bg-neutral-50/90 transition-colors duration-100 cursor-pointer group"
                      >
                        {/* Rank Badge */}
                        <td className="px-4 py-4 text-center font-brand-mono font-bold text-neutral-500">
                          {rank === 1 ? (
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-purple-900 text-white text-xs font-black shadow-2xs">1</span>
                          ) : rank === 2 ? (
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-neutral-200 text-neutral-900 text-xs font-bold">2</span>
                          ) : rank === 3 ? (
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-neutral-100 text-neutral-800 border border-neutral-300 text-xs font-bold">3</span>
                          ) : rank !== null ? (
                            rank
                          ) : (
                            <span className="text-neutral-300" title="数据不足，暂不生成名次">—</span>
                          )}
                        </td>

                        {/* Model Configuration 3-Part Name - Slightly Enlarged */}
                        <td className="px-5 py-4 font-brand-mono">
                          <div className="space-y-1">
                            <div className="font-extrabold text-neutral-950 text-base group-hover:text-purple-900 transition-colors">
                              {parsed.model}
                            </div>
                            <div className="flex items-center gap-1.5 font-bold text-neutral-800 text-[15px]">
                              <span>{parsed.harness}</span>
                              <span className="text-neutral-300 font-normal">|</span>
                              <span>{parsed.provider}</span>
                            </div>
                          </div>
                        </td>

                        {/* Merged Intelligence & Practical Score Column: e.g. 92.0 (-8.8 -> 83.2) */}
                        <td className="px-5 py-4 text-center font-brand-mono whitespace-nowrap">
                          <span className="font-brand-mono text-base sm:text-lg text-neutral-950 font-bold">
                            <span className="font-black text-black text-lg sm:text-xl">{formatScore(capabilityScore)}</span>
                            <span className="text-neutral-500 font-medium ml-1.5 text-base sm:text-lg">
                              (
                              <span className={`font-bold ${practicalAdjustmentTextClass(practicalAdjustment)}`}>
                                {formatPracticalAdjustment(practicalAdjustment)}
                              </span>
                              {' -> '}
                              <span className="text-neutral-950 font-black">
                                {formatScore(item.practicalBreakdown.practicalScore)}
                              </span>
                              )
                            </span>
                          </span>
                        </td>

                        {/* 6 Domains Scores with Dynamic Score-Based Depth (100 is darkest, lower is lighter down to 0.45 floor) */}
                        {domainList.map((dId, dIdx) => {
                          const score = item.domainScores[dId].score;
                          const def = DOMAIN_DEFINITIONS[dId];
                          const { opacity, fontWeight } = getScoreDepthStyle(score);

                          return (
                            <td
                              key={dId}
                              className={`px-3.5 py-4 text-center font-brand-mono text-base ${dIdx === 0 ? 'border-l border-neutral-100' : ''}`}
                              style={{
                                color: def.color,
                                opacity,
                                fontWeight,
                              }}
                            >
                              {formatScore(score)}
                            </td>
                          );
                        })}

                        {/* Arrow Action */}
                        <td className="px-4 py-4 text-right">
                          <div className="w-7 h-7 rounded-full bg-neutral-100 group-hover:bg-black flex items-center justify-center transition-colors ml-auto">
                            <ArrowUpRight className="w-3.5 h-3.5 text-neutral-600 group-hover:text-white transition-colors" />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* VIEW 2: RADAR & CONFIGURATION DETAIL */}
        {activeTab === 'detail' && selectedScoreItem && (
          <div className="space-y-4">
            {/* Header Area directly on background WITHOUT grey bottom border */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-1 font-brand-mono">
              <div className="space-y-1">
                {/* Line 1: Model Name */}
                <h2 className="text-2xl sm:text-3xl font-bold text-neutral-950 tracking-tight">
                  {parseConfigName(selectedScoreItem.config.name).model}
                </h2>

                {/* Line 2: Harness | Provider */}
                <div className="flex items-center gap-1.5 font-bold text-neutral-950 text-2xl sm:text-3xl tracking-tight">
                  <span>{parseConfigName(selectedScoreItem.config.name).harness}</span>
                  <span className="text-neutral-300 font-normal">|</span>
                  <span>{parseConfigName(selectedScoreItem.config.name).provider}</span>
                </div>
              </div>

              {/* Scores directly on background - Enlarged Font Sizes */}
              <div className="flex items-center gap-8 font-brand-mono shrink-0">
                <div>
                  <div className="text-neutral-500 text-xs uppercase font-bold tracking-wider">Intelligence Index</div>
                  <div className="text-4xl sm:text-5xl font-black text-neutral-950 mt-0.5">
                    {formatScore(selectedScoreItem.rawCapabilityScore)}
                  </div>
                </div>
                <div className="h-10 w-px bg-neutral-200" />
                <div>
                  <div className="text-neutral-500 text-xs uppercase font-bold tracking-wider">Practical Delta</div>
                  <div className={`text-3xl sm:text-4xl font-black mt-0.5 ${
                    practicalAdjustmentTextClass(
                      getPracticalAdjustment(selectedScoreItem.practicalBreakdown)
                    )
                  }`}>
                    {formatPracticalAdjustment(
                      getPracticalAdjustment(selectedScoreItem.practicalBreakdown)
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Radar Display & Domain Progress Bars directly on background */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center pt-2">
              {/* Radar Chart comfortably centered */}
              <div className="lg:col-span-7 flex justify-center items-center -ml-4 py-0">
                <RadarChart
                  seriesList={[
                    {
                      id: selectedScoreItem.config.id,
                      name: selectedScoreItem.config.name,
                      color: '#6B21A8',
                      scores: {
                        chatting: selectedScoreItem.domainScores?.chatting?.score ?? null,
                        math_science: selectedScoreItem.domainScores?.math_science?.score ?? null,
                        coding: selectedScoreItem.domainScores?.coding?.score ?? null,
                        engineering: selectedScoreItem.domainScores?.engineering?.score ?? null,
                        agentic_work: selectedScoreItem.domainScores?.agentic_work?.score ?? null,
                        search_knowledge: selectedScoreItem.domainScores?.search_knowledge?.score ?? null,
                      },
                    },
                  ]}
                  size={680}
                  showLegend={false}
                />
              </div>

              {/* Atomic & Practical Metrics List - 2 Column Layout shifted upwards */}
              <div className="lg:col-span-5 pl-0 lg:pl-2 -mt-4 sm:-mt-6 lg:-mt-8">
                <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 font-brand-mono text-xs sm:text-sm">
                  {/* 1. Capability & Detail Metrics grouped strictly by Domain Order */}
                  {(['chatting', 'math_science', 'coding', 'engineering', 'agentic_work', 'search_knowledge'] as string[]).flatMap((dId: string) => {
                    const def = getDomainDef(dId);
                    const scored = ALL_METRIC_DEFINITIONS.filter((m) => m.domain === dId);
                    const detailOnly = DETAIL_ONLY_METRIC_DEFINITIONS.filter((m) => m.domain === dId);

                    return [...scored, ...detailOnly].map((m) => {
                      const obs = selectedScoreItem.config.observations[m.id];
                      const rawValue = obs?.rawValue;
                      const formattedRaw = formatRawMetricValue(rawValue, m.unit);
                      const compactName = getCompactMetricName(m.id, m.name);

                      return (
                        <div
                          key={m.id}
                          className="flex min-w-0 items-center justify-between gap-2 py-1 px-1.5 rounded hover:bg-neutral-50 transition-colors border-b border-neutral-100/60"
                          title={`${m.name} (${def.nameEn}) - Raw Value: ${formattedRaw}`}
                        >
                          <span
                            className="min-w-0 font-bold truncate text-xs sm:text-sm"
                            style={{ color: def.color }}
                          >
                            {compactName}
                          </span>
                          <span className="font-brand-mono font-black text-neutral-950 text-xs sm:text-sm shrink-0">
                            {formattedRaw}
                          </span>
                        </div>
                      );
                    });
                  })}

                  {/* 2. Speed Metrics (Vibrant Orange #F97316) */}
                  <div
                    key="speed_throughput"
                    className="flex items-center justify-between gap-2 py-1 px-1.5 rounded hover:bg-neutral-50 transition-colors border-b border-neutral-100/60"
                    title="Throughput Speed - Speed Metric (Raw Value)"
                  >
                    <span className="font-bold truncate text-xs sm:text-sm text-[#F97316]">
                      Throughput Speed
                    </span>
                    <span className="font-brand-mono font-black text-neutral-950 text-xs sm:text-sm shrink-0">
                      {selectedScoreItem.config.openRouterData?.throughputP50TokensPerSec
                        ? selectedScoreItem.config.openRouterData.throughputP50TokensPerSec.toFixed(1)
                        : '--'}
                    </span>
                  </div>

                  <div
                    key="speed_ttft"
                    className="flex items-center justify-between gap-2 py-1 px-1.5 rounded hover:bg-neutral-50 transition-colors border-b border-neutral-100/60"
                    title="TTFT Latency - Speed Metric (Raw Value)"
                  >
                    <span className="font-bold truncate text-xs sm:text-sm text-[#F97316]">
                      TTFT Latency
                    </span>
                    <span className="font-brand-mono font-black text-neutral-950 text-xs sm:text-sm shrink-0">
                      {selectedScoreItem.config.openRouterData?.ttftP50Seconds
                        ? (selectedScoreItem.config.openRouterData.ttftP50Seconds * 1000).toFixed(0)
                        : '--'}
                    </span>
                  </div>

                  {/* 3. Price/Cost Metrics (Vibrant Indigo #6366F1) */}
                  <div
                    key="cost_input"
                    className="flex items-center justify-between gap-2 py-1 px-1.5 rounded hover:bg-neutral-50 transition-colors border-b border-neutral-100/60"
                    title={selectedScoreItem.config.subscriptionData
                      ? 'Monthly subscription price'
                      : 'Input Price - Price Metric (Raw Value)'}
                  >
                    <span className="font-bold truncate text-xs sm:text-sm text-[#6366F1]">
                      {selectedScoreItem.config.subscriptionData
                        ? 'Monthly Price'
                        : 'Input Price'}
                    </span>
                    <span className="font-brand-mono font-black text-neutral-950 text-xs sm:text-sm shrink-0">
                      {selectedScoreItem.config.subscriptionData
                        ? selectedScoreItem.config.subscriptionData.monthlyPriceUSD.toFixed(0)
                        : selectedScoreItem.config.openRouterData?.inputPricePerMToken !== undefined &&
                      selectedScoreItem.config.openRouterData?.inputPricePerMToken !== null
                        ? selectedScoreItem.config.openRouterData.inputPricePerMToken.toFixed(2)
                        : '--'}
                    </span>
                  </div>

                  <div
                    key="cost_output"
                    className="flex items-center justify-between gap-2 py-1 px-1.5 rounded hover:bg-neutral-50 transition-colors border-b border-neutral-100/60"
                    title={selectedScoreItem.config.subscriptionData
                      ? 'API-equivalent monthly allowance and model-usable share'
                      : 'Output Price - Price Metric (Raw Value)'}
                  >
                    <span className="font-bold truncate text-xs sm:text-sm text-[#6366F1]">
                      {selectedScoreItem.config.subscriptionData
                        ? 'API Equivalent'
                        : 'Output Price'}
                    </span>
                    <span className="font-brand-mono font-black text-neutral-950 text-xs sm:text-sm shrink-0">
                      {selectedScoreItem.config.subscriptionData
                        ? `${formatCostValue(selectedScoreItem.config.subscriptionData.apiEquivalentCostUSD)}${
                          selectedScoreItem.config.subscriptionData.usableQuotaFraction < 1
                            ? ` × ${(selectedScoreItem.config.subscriptionData.usableQuotaFraction * 100).toFixed(0)}%`
                            : ''
                        }`
                        : selectedScoreItem.config.openRouterData?.outputPricePerMToken !== undefined &&
                      selectedScoreItem.config.openRouterData?.outputPricePerMToken !== null
                        ? selectedScoreItem.config.openRouterData.outputPricePerMToken.toFixed(2)
                        : '--'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
};
