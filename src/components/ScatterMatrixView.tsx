import React, { useState } from 'react';
import { ScatterChart, Zap, DollarSign, Sparkles } from 'lucide-react';
import { ProcessedConfigurationScore } from '../types/llm_pk';
import {
  formatPracticalAdjustment,
  getPracticalAdjustment,
  practicalAdjustmentTextClass,
} from '../utils/practicalAdjustment';

interface ScatterMatrixViewProps {
  scoreItems: ProcessedConfigurationScore[];
  onSelectConfig: (scoreItem: ProcessedConfigurationScore) => void;
}

export const ScatterMatrixView: React.FC<ScatterMatrixViewProps> = ({
  scoreItems,
  onSelectConfig,
}) => {
  const [metricMode, setMetricMode] = useState<'cost' | 'speed'>('cost');

  // A Pareto position requires a ranked capability score plus source-backed
  // practical, speed, and cost data.
  const validItems = scoreItems.filter((item) => (
    item.eligibleForGlobalLeaderboard
    && item.config.openRouterData
    && getPracticalAdjustment(item.practicalBreakdown) !== null
    && item.practicalBreakdown.effectiveScenarioCostUSD !== null
    && Number.isFinite(item.config.openRouterData.throughputP50TokensPerSec)
    && item.config.openRouterData.throughputP50TokensPerSec > 0
  ));

  // Bounds calculation
  const practicalAdjustments = validItems
    .map((item) => getPracticalAdjustment(item.practicalBreakdown))
    .filter((adjustment): adjustment is number => adjustment !== null);
  const maxAdjustment = practicalAdjustments.length > 0
    ? Math.max(...practicalAdjustments) + 1
    : 1;
  const minAdjustment = practicalAdjustments.length > 0
    ? Math.min(...practicalAdjustments) - 1
    : -1;

  const sourceBackedCosts = validItems
    .map((i) => i.practicalBreakdown.effectiveScenarioCostUSD)
    .filter((cost): cost is number => cost !== null);
  const maxCost = sourceBackedCosts.length > 0 ? Math.max(...sourceBackedCosts) + 1 : 1;
  const minCost = 0;

  const maxSpeed = validItems.length > 0
    ? Math.max(...validItems.map((i) => i.config.openRouterData!.throughputP50TokensPerSec)) + 10
    : 10;
  const minSpeed = 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900/80 p-6 rounded-2xl border border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1 text-xs font-semibold text-cyan-400">
            <ScatterChart className="w-4 h-4" /> Pareto Matrix
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            散点阵列
          </h1>
        </div>

        {/* Toggle Mode */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setMetricMode('cost')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              metricMode === 'cost'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            能力 vs 成本 ($)
          </button>
          <button
            onClick={() => setMetricMode('speed')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              metricMode === 'speed'
                ? 'bg-amber-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            能力 vs 吞吐 (t/s)
          </button>
        </div>
      </div>

      {/* Main Scatter Visualizer Box */}
      <div className="bg-slate-900/90 rounded-2xl p-6 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
          <span>纵轴 (Y): Practical &Delta; 实用调整</span>
          <span>
            {metricMode === 'cost' ? '横轴 (X): 场景有效成本 (USD/1.25M Tokens, 越左越便宜)' : '横轴 (X): 输出吞吐率 (Tokens/sec, 越右越快)'}
          </span>
        </div>

        {/* Canvas / SVG Scatter Box */}
        <div className="relative w-full h-[420px] bg-slate-950 rounded-xl border border-slate-800 p-8 overflow-hidden">
          {/* Axis Labels */}
          <div className="absolute top-3 left-4 text-xs font-bold text-cyan-400">
            更高实用加成 &uarr;
          </div>
          <div className="absolute bottom-3 right-4 text-xs font-bold text-cyan-400">
            {metricMode === 'cost' ? '&larr; 低成本 (更经济)' : '高吞吐 (更快) &rarr;'}
          </div>

          {/* Scatter Points */}
          <div className="relative w-full h-full">
            {validItems.map((item) => {
              const practicalAdjustment = getPracticalAdjustment(item.practicalBreakdown);
              const effectiveCost = item.practicalBreakdown.effectiveScenarioCostUSD;
              const openRouterData = item.config.openRouterData;
              if (practicalAdjustment === null || effectiveCost === null || !openRouterData) return null;

              const yPercent = 100 - (
                (practicalAdjustment - minAdjustment) / (maxAdjustment - minAdjustment)
              ) * 100;

              let xVal = 0;
              let xPercent = 0;

              if (metricMode === 'cost') {
                xVal = effectiveCost;
                xPercent = ((xVal - minCost) / (maxCost - minCost)) * 100;
              } else {
                xVal = openRouterData.throughputP50TokensPerSec;
                xPercent = ((xVal - minSpeed) / (maxSpeed - minSpeed)) * 100;
              }

              return (
                <div
                  key={item.config.id}
                  onClick={() => onSelectConfig(item)}
                  style={{
                    top: `${Math.max(5, Math.min(95, yPercent))}%`,
                    left: `${Math.max(5, Math.min(95, xPercent))}%`,
                  }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 group cursor-pointer"
                >
                  <div className="w-5 h-5 rounded-full bg-cyan-500/20 border-2 border-cyan-400 group-hover:scale-125 group-hover:bg-cyan-400 group-hover:shadow-lg group-hover:shadow-cyan-500/50 transition-all flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-cyan-300" />
                  </div>

                  {/* Tooltip Card on Hover */}
                  <div className="absolute left-1/2 bottom-full mb-2 -translate-x-1/2 hidden group-hover:flex flex-col bg-slate-900/95 border border-slate-700 p-2.5 rounded-lg shadow-2xl text-xs z-30 pointer-events-none whitespace-nowrap">
                    <span className="font-bold text-white">{item.config.name}</span>
                    <span className="text-[11px] text-slate-400">
                      Practical &Delta;:{' '}
                      <strong className={practicalAdjustmentTextClass(practicalAdjustment, true)}>
                        {formatPracticalAdjustment(practicalAdjustment)}
                      </strong>
                      {' '}| Cost: ${effectiveCost.toFixed(2)} | Speed: {openRouterData.throughputP50TokensPerSec} t/s
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
