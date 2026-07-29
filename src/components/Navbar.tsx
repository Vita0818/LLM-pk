import React, { useState } from 'react';
import { Trophy, PieChart, Box, RefreshCw, CheckCircle2 } from 'lucide-react';
import { CohortSnapshot } from '../types/llm_pk';

export type ViewPage = 'leaderboard' | 'model_summary' | 'admin_mapping';

interface NavbarProps {
  activePage: ViewPage;
  onSelectPage: (page: ViewPage) => void;
  cohort: CohortSnapshot;
  onSyncLiveData?: () => Promise<void>;
}

export const Navbar: React.FC<NavbarProps> = ({
  activePage,
  onSelectPage,
  cohort,
  onSyncLiveData,
}) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncDone, setSyncDone] = useState(false);

  const handleSyncClick = async () => {
    if (!onSyncLiveData || isSyncing) return;
    setIsSyncing(true);
    setSyncDone(false);
    try {
      await onSyncLiveData();
      setSyncDone(true);
      setTimeout(() => setSyncDone(false), 3000);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white/85 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-12">
        <div className="flex items-center justify-between h-16 sm:h-18">
          {/* Logo */}
          <div 
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => onSelectPage('leaderboard')}
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-700 to-indigo-600 flex items-center justify-center text-white font-black text-base shadow-sm group-hover:scale-105 transition-all">
              PK
            </div>
            <div>
              <span className="text-xl font-extrabold text-slate-900 tracking-tight">LLMpk</span>
            </div>
          </div>

          {/* Right Action & Navigation Pages */}
          <div className="flex items-center gap-4">
            {onSyncLiveData && (
              <button
                onClick={handleSyncClick}
                disabled={isSyncing}
                className="hidden lg:flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200/80 border border-slate-200 transition-all"
              >
                {syncDone ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <RefreshCw className={`w-3.5 h-3.5 text-slate-600 ${isSyncing ? 'animate-spin' : ''}`} />
                )}
                <span>{isSyncing ? '同步中' : '同步'}</span>
              </button>
            )}

            <nav className="flex items-center gap-1 bg-slate-100/90 p-1 rounded-xl border border-slate-200/80">
              <button
                onClick={() => onSelectPage('leaderboard')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  activePage === 'leaderboard'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Trophy className="w-3.5 h-3.5" />
                <span>榜单</span>
              </button>

              <button
                onClick={() => onSelectPage('model_summary')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  activePage === 'model_summary'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <PieChart className="w-3.5 h-3.5" />
                <span>配置详情</span>
              </button>

              <button
                onClick={() => onSelectPage('admin_mapping')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  activePage === 'admin_mapping'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Box className="w-3.5 h-3.5" />
                <span>后台数据映射</span>
              </button>
            </nav>
          </div>
        </div>
      </div>
    </header>
  );
};
