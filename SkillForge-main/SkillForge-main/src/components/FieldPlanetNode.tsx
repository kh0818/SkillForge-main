import { memo } from 'react';
import type { NodeProps } from '@xyflow/react';
import type { SkillCategory } from '../data/mockData';

interface FieldPlanetNodeData {
  category: SkillCategory;
  label: string;
  color: string;
  shadow: string;
  skillCount: number;
  verifiedCount: number;
  isFocused: boolean;
  isDimmed: boolean;
}

function FieldPlanetNode({ data }: NodeProps) {
  const {
    category,
    label,
    color,
    shadow,
    skillCount,
    verifiedCount,
    isFocused,
    isDimmed,
  } = data as unknown as FieldPlanetNodeData;
  const progress = skillCount > 0 ? Math.round((verifiedCount / skillCount) * 100) : 0;

  return (
    <div className={`field-planet-node group relative h-[220px] w-[220px] select-none ${isDimmed ? 'opacity-35' : 'opacity-100'}`}>
      <div
        className={`field-planet-atmosphere absolute inset-0 rounded-full border ${isFocused ? 'scale-110 opacity-100' : 'opacity-70'}`}
        style={{
          borderColor: `${color}66`,
          boxShadow: `0 0 44px ${color}33, inset 0 0 38px ${shadow}22`,
        }}
      />
      <div
        className="field-planet-scan absolute inset-5 rounded-full border opacity-0"
        style={{ borderColor: color }}
      />
      <div
        className="absolute inset-7 rounded-full border overflow-hidden"
        style={{
          borderColor: `${color}55`,
          background: `radial-gradient(circle at 34% 28%, rgba(255,255,255,0.28), ${color}88 0 20%, ${shadow} 48%, #050816 78%)`,
          boxShadow: `inset -24px -30px 52px rgba(0,0,0,0.48), inset 14px 16px 24px rgba(255,255,255,0.08), 0 0 38px ${color}28`,
        }}
      >
        <div className="absolute inset-0 bg-[linear-gradient(125deg,transparent_0%,rgba(255,255,255,0.12)_42%,transparent_44%)]" />
        <div className="absolute inset-0 opacity-30 mix-blend-screen" style={{ background: `repeating-linear-gradient(155deg, transparent 0 12px, ${color}22 13px 15px)` }} />
      </div>
      <div className="absolute inset-x-0 bottom-2 text-center">
        <p className="text-[10px] font-black uppercase tracking-[0.22em]" style={{ color }}>
          {category === 'Universal' ? 'Core Planet' : 'Field Planet'}
        </p>
        <p className="mt-1 text-sm font-black uppercase tracking-wide text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.18)]">
          {label}
        </p>
        <p className="mt-1 text-[10px] font-mono text-gray-500">
          {verifiedCount}/{skillCount} verified // {progress}%
        </p>
      </div>
    </div>
  );
}

export default memo(FieldPlanetNode);
