import React, { useState } from 'react';
import { X, Box } from 'lucide-react';
import { ConfigurationBox, ConfigurationIdentity } from '../types/admin_mapping';

interface NewBoxModalProps {
  initialBox?: ConfigurationBox | null;
  onClose: () => void;
  onSave: (
    internalName: string,
    displayName: string,
    note?: string,
    enabled?: boolean,
    identity?: ConfigurationIdentity,
  ) => void;
}

export const NewBoxModal: React.FC<NewBoxModalProps> = ({
  initialBox,
  onClose,
  onSave,
}) => {
  const [displayName, setDisplayName] = useState(initialBox?.displayName || '');
  const [internalName, setInternalName] = useState(initialBox?.internalName || '');
  const [note, setNote] = useState(initialBox?.note || '');
  const [enabled, setEnabled] = useState(initialBox ? initialBox.enabled : true);
  const [modelName, setModelName] = useState(initialBox?.identity?.model?.name || '');
  const [modelProfile, setModelProfile] = useState(initialBox?.identity?.model?.profile || '');
  const [modelPreset, setModelPreset] = useState(initialBox?.identity?.model?.preset || '');
  // The user-facing default is deliberately explicit: an omitted specialised
  // harness means ordinary chat, never an inferred IDE or benchmark harness.
  const [harnessName, setHarnessName] = useState(initialBox?.identity?.harness?.name || '正常对话');
  const [harnessEnvironment, setHarnessEnvironment] = useState(initialBox?.identity?.harness?.environment || '');
  const [providerName, setProviderName] = useState(initialBox?.identity?.provider?.name || '');
  const [providerUpstream, setProviderUpstream] = useState(initialBox?.identity?.provider?.upstream || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const modelSeg = [modelName.trim(), modelProfile.trim(), modelPreset.trim()].filter(Boolean).join(' ');
    const harnessSeg = harnessName.trim() || '正常对话';
    const providerSeg = providerName.trim() || 'Direct API';
    const autoFormattedDisplay = modelSeg ? `${modelSeg} | ${harnessSeg} | ${providerSeg}` : displayName.trim();
    const finalDisplay = autoFormattedDisplay || displayName.trim();
    if (!finalDisplay) {
      alert('请输入 Configuration 名称');
      return;
    }
    const finalInternal = internalName.trim() || finalDisplay.toLowerCase().replace(/[^a-z0-9]+/g, '_');
    const model = {
      ...(modelName.trim() ? { name: modelName.trim() } : {}),
      ...(modelProfile.trim() ? { profile: modelProfile.trim() } : {}),
      ...(modelPreset.trim() ? { preset: modelPreset.trim() } : {}),
    };
    const harness = {
      ...(harnessName.trim() ? { name: harnessName.trim() } : {}),
      ...(harnessEnvironment.trim() ? { environment: harnessEnvironment.trim() } : {}),
    };
    const provider = {
      ...(providerName.trim() ? { name: providerName.trim() } : {}),
      ...(providerUpstream.trim() ? { upstream: providerUpstream.trim() } : {}),
    };
    const identity: ConfigurationIdentity = {
      ...(Object.keys(model).length > 0 ? { model } : {}),
      ...(Object.keys(harness).length > 0 ? { harness } : {}),
      ...(Object.keys(provider).length > 0 ? { provider } : {}),
    };
    onSave(finalInternal, finalDisplay, note, enabled, Object.keys(identity).length > 0 ? identity : undefined);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-xs">
      <div className="relative w-full max-w-xl max-h-[calc(100vh-2rem)] overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-xl p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
          <div className="flex items-center gap-2">
            <Box className="w-4 h-4 text-slate-800" />
            <h3 className="text-sm font-bold text-slate-900">
              {initialBox ? '编辑配置' : '新建配置'}
            </h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-md text-slate-400 hover:text-slate-700">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              配置名称
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => {
                setDisplayName(e.target.value);
                if (!initialBox && !internalName) {
                  setInternalName(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '_'));
                }
              }}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:bg-white"
            />
          </div>

          <div>
            <label className="block font-medium text-slate-500 mb-1">
              内部标识
            </label>
            <input
              type="text"
              value={internalName}
              onChange={(e) => setInternalName(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-mono text-[11px] focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-medium text-slate-500 mb-1">
              备注
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none"
            />
          </div>

          <fieldset className="rounded-lg border border-slate-200 bg-slate-50/70 p-3 space-y-2.5">
            <legend className="px-1 text-[11px] font-semibold text-slate-700">
              配置身份
            </legend>

            <div className="grid grid-cols-1 overflow-hidden rounded-lg border border-slate-200 bg-white sm:grid-cols-3">
              <section className="min-w-0 space-y-1.5 p-3" aria-labelledby="configuration-model-heading">
                <h4 id="configuration-model-heading" className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-blue-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-500" aria-hidden="true" />
                  模型身份
                </h4>
                <input
                  type="text"
                  value={modelName}
                  onChange={(e) => setModelName(e.target.value)}
                  placeholder="模型名称"
                  aria-label="模型名称"
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-md text-slate-700 focus:outline-none focus:border-blue-400"
                />
                <input
                  type="text"
                  value={modelProfile}
                  onChange={(e) => setModelProfile(e.target.value)}
                  placeholder="档位"
                  aria-label="模型档位"
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-md text-slate-700 focus:outline-none focus:border-blue-400"
                />
                <input
                  type="text"
                  value={modelPreset}
                  onChange={(e) => setModelPreset(e.target.value)}
                  placeholder="预设"
                  aria-label="模型预设"
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-md text-slate-700 focus:outline-none focus:border-blue-400"
                />
              </section>

              <section className="min-w-0 space-y-1.5 border-t border-slate-200 p-3 sm:border-t-0 sm:border-l-2 sm:border-slate-300" aria-labelledby="configuration-harness-heading">
                <h4 id="configuration-harness-heading" className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-violet-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-violet-500" aria-hidden="true" />
                  Harness / 环境
                </h4>
                <input
                  type="text"
                  value={harnessName}
                  onChange={(e) => setHarnessName(e.target.value)}
                  placeholder="Harness 名称"
                  aria-label="Harness 或环境名称"
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-md text-slate-700 focus:outline-none focus:border-violet-400"
                />
                <input
                  type="text"
                  value={harnessEnvironment}
                  onChange={(e) => setHarnessEnvironment(e.target.value)}
                  placeholder="运行环境"
                  aria-label="Harness 运行环境"
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-md text-slate-700 focus:outline-none focus:border-violet-400"
                />
              </section>

              <section className="min-w-0 space-y-1.5 border-t border-slate-200 p-3 sm:border-t-0 sm:border-l-2 sm:border-slate-300" aria-labelledby="configuration-provider-heading">
                <h4 id="configuration-provider-heading" className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
                  来源 / API
                </h4>
                <input
                  type="text"
                  value={providerName}
                  onChange={(e) => setProviderName(e.target.value)}
                  placeholder="提供方"
                  aria-label="服务提供方"
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-md text-slate-700 focus:outline-none focus:border-emerald-400"
                />
                <input
                  type="text"
                  value={providerUpstream}
                  onChange={(e) => setProviderUpstream(e.target.value)}
                  placeholder="上游 API"
                  aria-label="上游 API 或路由"
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-md text-slate-700 focus:outline-none focus:border-emerald-400"
                />
              </section>
            </div>
          </fieldset>



          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg text-slate-600 bg-slate-100 hover:bg-slate-200"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg text-white bg-slate-900 hover:bg-slate-800 font-semibold shadow-xs"
            >
              保存
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
