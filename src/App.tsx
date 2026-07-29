import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Navbar, ViewPage } from './components/Navbar';
import { LeaderboardView } from './components/LeaderboardView';
import { ModelDetailView } from './components/ModelDetailView';
import { AdminMappingView } from './components/AdminMappingView';

import { adminMappingStore } from './store/adminMappingStore';
import { CURRENT_COHORT_SNAPSHOT } from './data/cohortMetadata';
import { ProcessedConfigurationScore, LLMConfiguration } from './types/llm_pk';
import { syncLatestCohortData } from './services/dataFetcher';
import { SCORING_CONFIG } from './engine/scoringConfig';
import type { BuiltInConfigurationPresetInstallReport } from './types/admin_mapping';
import { BUILT_IN_CONFIGURATION_PRESET_INVENTORY_VERSION } from './data/builtInConfigurationPresets';

export function App() {
  const [activePage, setActivePage] = useState<ViewPage>('leaderboard');
  const [selectedModelId, setSelectedModelId] = useState<string>('');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [presetInstallReport, setPresetInstallReport] = useState<BuiltInConfigurationPresetInstallReport | null>(null);
  const initialPresetInstallReport = useRef<BuiltInConfigurationPresetInstallReport | null>(null);

  // The bundled configuration inventory is installed enabled and visible by
  // default. This runs after persisted user boxes have been loaded, so the
  // store can preserve them and use each stable built-in preset ID for
  // idempotency.
  useEffect(() => {
    // A Fast Refresh can preserve the singleton store from an older bundled
    // source snapshot. Reconcile that catalog first, otherwise newly-added
    // source-backed configurations would resolve against stale cards.
    adminMappingStore.resetToLatestVerifiedCatalog();
    const report = adminMappingStore.synchronizeBuiltInConfigurationPresets();
    // React Strict Mode intentionally runs effects twice in development. Keep
    // the first report when it installed configurations, rather than replacing the
    // useful "added N" message with the idempotent second-pass zero.
    if (
      report.installedBoxCount > 0
      || report.removedBuiltInBoxCount > 0
      || report.removedRetiredLegacyBoxCount > 0
      || !initialPresetInstallReport.current
    ) {
      initialPresetInstallReport.current = report;
      setPresetInstallReport(report);
    }
    // resetToLatestVerifiedCatalog replaces the in-memory observations even
    // when no box/link changed. Always recompute so a page loaded from a
    // truncated legacy browser payload cannot keep its first stale score set.
    setRefreshTrigger((previous) => previous + 1);
  // Depend on the inventory revision so Fast Refresh reconciles newly bundled
  // configurations with the browser's persisted local store instead of
  // retaining the pre-update snapshot.
  }, [BUILT_IN_CONFIGURATION_PRESET_INVENTORY_VERSION]);

  // Compute leaderboard scores dynamically from Admin Mapping Store
  const processedScores = useMemo(() => {
    return adminMappingStore.computeLeaderboardScores();
  }, [refreshTrigger]);

  const handleSelectConfigForDetail = (item: ProcessedConfigurationScore) => {
    setSelectedModelId(item.config.id);
    setActivePage('model_summary');
  };

  const handleSyncLiveData = async () => {
    const existingConfigs: LLMConfiguration[] = adminMappingStore.boxes.map((b) =>
      adminMappingStore.buildLLMConfiguration(b)
    );
    const result = await syncLatestCohortData(existingConfigs);
    if (result.success) {
      setRefreshTrigger((prev) => prev + 1);
    }
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col font-sans antialiased">
      {/* Navigation */}
      <Navbar
        activePage={activePage}
        onSelectPage={setActivePage}
        cohort={CURRENT_COHORT_SNAPSHOT}
        onSyncLiveData={handleSyncLiveData}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto px-4 sm:px-8 lg:px-12 py-8">
        {activePage === 'leaderboard' && (
          <LeaderboardView
            scoreItems={processedScores}
            onSelectConfigForDetail={handleSelectConfigForDetail}
          />
        )}

        {activePage === 'model_summary' && (
          <ModelDetailView
            scoreItems={processedScores}
            selectedConfigId={selectedModelId}
          />
        )}

        {activePage === 'admin_mapping' && (
          <AdminMappingView
            onRefreshLeaderboard={() => setRefreshTrigger((prev) => prev + 1)}
            builtInPresetInstallReport={presetInstallReport}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-slate-50 py-5 text-xs text-slate-500">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-12 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            <span className="font-bold text-slate-800 text-sm tracking-tight">LLMpk Arena</span>
          </div>
          <div className="flex items-center gap-3 text-slate-400 font-mono">
            <span>Scoring v{SCORING_CONFIG.version}</span>
            <span>&bull;</span>
            <span>Weighting v2.1</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
