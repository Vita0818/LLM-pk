import React, { useEffect, useRef, useState } from 'react';
import { Plus, Box, Download, Upload, RefreshCw } from 'lucide-react';
import { adminMappingStore } from '../store/adminMappingStore';
import { ConfigurationBoxCard } from './ConfigurationBoxCard';
import { SourceModelCardPool } from './SourceModelCardPool';
import { NewBoxModal } from './NewBoxModal';
import {
  BuiltInConfigurationPresetInstallReport,
  ConfigurationBox,
  ConfigurationIdentity,
} from '../types/admin_mapping';

interface AdminMappingViewProps {
  onRefreshLeaderboard?: () => void;
  /** The one-time result of adding any missing bundled visible configurations. */
  builtInPresetInstallReport?: BuiltInConfigurationPresetInstallReport | null;
}

export const AdminMappingView: React.FC<AdminMappingViewProps> = ({
  onRefreshLeaderboard,
  builtInPresetInstallReport,
}) => {
  const [boxes, setBoxes] = useState<ConfigurationBox[]>([...adminMappingStore.boxes]);
  const [cards, setCards] = useState([...adminMappingStore.cards]);
  const [editingBox, setEditingBox] = useState<ConfigurationBox | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [transferMessage, setTransferMessage] = useState('');
  const importInputRef = useRef<HTMLInputElement>(null);

  // The App installs missing visible configurations immediately after mount. If this view was
  // already open during that effect (for example after a hot reload), refresh
  // its local snapshot so the newly-added boxes appear without navigation.
  useEffect(() => {
    if (!builtInPresetInstallReport || builtInPresetInstallReport.installedBoxCount === 0) return;
    setBoxes([...adminMappingStore.boxes]);
    setCards([...adminMappingStore.cards]);
  }, [builtInPresetInstallReport]);

  const refreshState = () => {
    setBoxes([...adminMappingStore.boxes]);
    setCards([...adminMappingStore.cards]);
    if (onRefreshLeaderboard) onRefreshLeaderboard();
  };

  const handleCreateSave = (
    internalName: string,
    displayName: string,
    note?: string,
    enabled?: boolean,
    identity?: ConfigurationIdentity,
  ) => {
    if (editingBox) {
      adminMappingStore.updateBox(editingBox.id, {
        internalName,
        displayName,
        note,
        enabled,
        identity,
      });
    } else {
      adminMappingStore.createBox(internalName, displayName, note, enabled, identity);
    }
    refreshState();
  };

  const handleDeleteBox = (id: string) => {
    if (window.confirm('确定删除该 Configuration 盒子？')) {
      adminMappingStore.deleteBox(id);
      refreshState();
    }
  };

  const handleRecalculate = (box: ConfigurationBox) => {
    adminMappingStore.updateBox(box.id, { lastCalculatedAt: new Date().toLocaleTimeString() });
    refreshState();
  };

  const handleDuplicateBox = (box: ConfigurationBox) => {
    const duplicate = adminMappingStore.duplicateBox(box.id);
    if (!duplicate) {
      window.alert('复制失败：未找到要复制的 Configuration。');
      return;
    }
    refreshState();
  };

  const handleExportConfigurations = () => {
    const backup = adminMappingStore.exportConfigurationBackup();
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json;charset=utf-8' });
    const downloadUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

    link.href = downloadUrl;
    link.download = `llmpk-configurations-${timestamp}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 0);
    setTransferMessage('配置备份已导出。');
  };

  const handleSyncBuiltInInventory = () => {
    // This is intentionally safe to repeat: the installer uses stable preset
    // IDs, adds only missing boxes/cards, and preserves any manual edits.
    // Rebuild the verified source catalog first so a hot-updated bundle does
    // not attempt to install new mappings against a stale browser snapshot.
    adminMappingStore.resetToLatestVerifiedCatalog();
    const report = adminMappingStore.synchronizeBuiltInConfigurationPresets(true);
    refreshState();

    const details = [
      report.removedBuiltInBoxCount > 0 ? `移除 ${report.removedBuiltInBoxCount} 个旧内置配置` : '',
      report.removedRetiredLegacyBoxCount > 0
        ? `清理 ${report.removedRetiredLegacyBoxCount} 个零能力数据旧配置`
        : '',
      report.installedBoxCount > 0 ? `新增 ${report.installedBoxCount} 个配置` : '内置目录已经是最新版本',
      report.linkedCardCount > 0 ? `补充 ${report.linkedCardCount} 张来源卡映射` : '',
      report.unresolvedSourceCardCount > 0 ? `${report.unresolvedSourceCardCount} 张来源卡待补` : '',
    ].filter(Boolean).join('；');
    const message = `${details}。`;
    setTransferMessage(message);
    window.alert(message);
  };

  const handleImportConfigurations = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    // Reset the input immediately so the same backup can be selected again.
    event.target.value = '';
    if (!file) return;

    try {
      const payload: unknown = JSON.parse(await file.text());
      const result = adminMappingStore.importConfigurationBackup(payload);
      if (!result.accepted) {
        const message = '导入失败：这不是有效的 LLMpk 配置备份文件，现有配置未被修改。';
        setTransferMessage(message);
        window.alert(message);
        return;
      }

      refreshState();

      const details = [
        `已导入 ${result.importedBoxCount} 个配置（${result.importedLinkCount} 张来源卡）`,
        result.unresolvedLinkCount > 0 ? `${result.unresolvedLinkCount} 张来源卡未匹配` : '',
        result.rejectedBoxCount > 0 ? `${result.rejectedBoxCount} 个配置未接受` : '',
        result.rejectedLinkCount > 0 ? `${result.rejectedLinkCount} 条卡片映射未接受` : '',
      ].filter(Boolean).join('；');
      const message = `${details}。现有配置未被覆盖。`;
      setTransferMessage(message);
      window.alert(message);
    } catch (error) {
      const message = error instanceof Error
        ? `导入失败：${error.message}`
        : '导入失败：请选择有效的 LLMpk 配置备份 JSON 文件。';
      setTransferMessage(message);
      window.alert(message);
    }
  };

  return (
    <div className="space-y-4 py-2">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200">
        <h1 className="text-lg font-bold text-slate-900">
          数据映射后台
        </h1>

        <div className="flex flex-wrap items-center justify-end gap-2">
          <button
            type="button"
            onClick={handleSyncBuiltInInventory}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-all"
            title="将最新内置 API 配置及来源卡映射补入当前本地目录；不会覆盖手工编辑"
          >
            <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" /> 同步内置目录
          </button>
          <button
            type="button"
            onClick={handleExportConfigurations}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-all"
            title="导出全部 Configuration 及其卡片映射"
          >
            <Download className="w-3.5 h-3.5" aria-hidden="true" /> 导出配置
          </button>
          <button
            type="button"
            onClick={() => importInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-all"
            title="从备份 JSON 追加导入 Configuration；不会覆盖现有配置"
          >
            <Upload className="w-3.5 h-3.5" aria-hidden="true" /> 导入配置
          </button>
          <input
            ref={importInputRef}
            type="file"
            accept="application/json,.json"
            className="sr-only"
            aria-label="选择要导入的 Configuration 备份 JSON 文件"
            onChange={handleImportConfigurations}
          />
          <button
            type="button"
            onClick={() => {
              setEditingBox(null);
              setShowNewModal(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 transition-all shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" aria-hidden="true" /> 新建配置
          </button>
        </div>
      </div>

      <p className="sr-only" role="status" aria-live="polite">
        {transferMessage}
      </p>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Configuration Boxes */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Box className="w-4 h-4 text-slate-700" /> 配置盒子 ({boxes.length})
            </h2>
          </div>

          <div className="space-y-4">
            {boxes.map((box) => (
              <ConfigurationBoxCard
                key={box.id}
                box={box}
                onEdit={(b) => {
                  setEditingBox(b);
                  setShowNewModal(true);
                }}
                onDelete={handleDeleteBox}
                onDuplicate={handleDuplicateBox}
                onRecalculate={handleRecalculate}
              />
            ))}
          </div>
        </div>

        {/* Right Column: Platform Card Pool */}
        <div className="lg:col-span-5 sticky top-24">
          <SourceModelCardPool cards={cards} />
        </div>
      </div>

      {/* Modal */}
      {showNewModal && (
        <NewBoxModal
          initialBox={editingBox}
          onClose={() => setShowNewModal(false)}
          onSave={handleCreateSave}
        />
      )}
    </div>
  );
};
