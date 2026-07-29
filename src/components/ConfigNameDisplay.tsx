import React from 'react';

interface ConfigNameDisplayProps {
  name: string;
  className?: string;
  darkBg?: boolean;
}

export const ConfigNameDisplay: React.FC<ConfigNameDisplayProps> = ({
  name,
  className = '',
  darkBg = false,
}) => {
  const parts = name.split(' | ');

  if (parts.length < 3) {
    return <span className={className}>{name}</span>;
  }

  const dividerClass = darkBg
    ? 'text-slate-600 mx-1.5 font-normal select-none'
    : 'text-slate-300 mx-1.5 font-normal select-none';

  const modelClass = darkBg ? 'font-bold text-white' : 'font-bold text-slate-900';
  const harnessClass = darkBg ? 'font-semibold text-slate-300' : 'font-semibold text-slate-700';
  const providerClass = darkBg ? 'font-medium text-slate-400' : 'font-medium text-slate-600';

  return (
    <span className={`inline-flex items-center flex-wrap ${className}`}>
      <span className={modelClass}>{parts[0]}</span>
      <span className={dividerClass}>|</span>
      <span className={harnessClass}>{parts[1]}</span>
      <span className={dividerClass}>|</span>
      <span className={providerClass}>{parts[2]}</span>
    </span>
  );
};
