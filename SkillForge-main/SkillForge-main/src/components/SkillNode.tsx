import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { BookOpen, CheckCircle, Link, Lock } from 'lucide-react';
import type { Skill } from '../data/mockData';
import { FIELD_THEMES } from '../utils/galaxyLayout';

interface SkillNodeData {
  skill: Skill;
  prerequisiteBlocked?: boolean;
  unmetPrerequisites?: { id: string; name: string }[];
  isRequired?: boolean;
}

const statusConfig = {
  locked: {
    label: 'Locked',
    border: '#475569',
    text: 'text-slate-400',
    fill: 'rgba(15, 23, 42, 0.88)',
  },
  'self-declared': {
    label: 'Declared',
    border: '#22c55e',
    text: 'text-emerald-200',
    fill: 'rgba(6, 78, 59, 0.5)',
  },
  evidenced: {
    label: 'Evidenced',
    border: '#10b981',
    text: 'text-emerald-100',
    fill: 'rgba(6, 95, 70, 0.62)',
  },
  verified: {
    label: 'Verified',
    border: '#facc15',
    text: 'text-yellow-100',
    fill: 'rgba(113, 63, 18, 0.64)',
  },
};

function StatusGlyph({ status, blocked }: { status: Skill['status']; blocked: boolean }) {
  if (blocked) return <Lock size={12} />;
  if (status === 'verified') return <CheckCircle size={12} />;
  if (status === 'evidenced') return <Link size={12} />;
  return <BookOpen size={12} />;
}

function SkillNode({ data }: NodeProps) {
  const { skill, prerequisiteBlocked = false, unmetPrerequisites = [], isRequired = false } = data as unknown as SkillNodeData;
  const displayLocked = skill.status === 'locked' || prerequisiteBlocked;
  const cfg = displayLocked ? statusConfig.locked : statusConfig[skill.status];
  const theme = FIELD_THEMES[skill.category];
  const accent = theme.color;
  const prereqHint =
    unmetPrerequisites.length === 1
      ? `Verify ${unmetPrerequisites[0].name} first`
      : `Verify ${unmetPrerequisites.map((prereq) => prereq.name).join(', ')} first`;

  return (
    <div
      className={`orbital-satellite group relative w-36 cursor-pointer select-none ${prerequisiteBlocked ? 'satellite-blocked' : ''}`}
      title={prerequisiteBlocked && unmetPrerequisites.length > 0 ? prereqHint : skill.description}
    >
      <Handle
        type="target"
        position={Position.Top}
        style={{ background: accent, border: 'none', height: 6, opacity: 0.3, width: 6 }}
      />

      <div
        className={`
          relative overflow-hidden rounded-full border px-3 py-2.5
          transition-all duration-300 ease-out
          group-hover:-translate-y-1 group-hover:scale-105
          ${cfg.text}
          ${isRequired ? 'satellite-required' : ''}
        `}
        style={{
          background: `radial-gradient(circle at 18% 16%, rgba(255,255,255,0.2), ${cfg.fill} 42%, rgba(2,6,23,0.92) 100%)`,
          borderColor: isRequired ? '#67e8f9' : cfg.border,
          boxShadow: displayLocked
            ? '0 0 0 1px rgba(71,85,105,0.18), 0 12px 30px rgba(0,0,0,0.28)'
            : `0 0 0 1px ${accent}33, 0 0 22px ${accent}22, inset 0 0 16px rgba(255,255,255,0.04)`,
        }}
      >
        <div
          className="absolute inset-x-3 top-0 h-px opacity-80"
          style={{ background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }}
        />
        <div className="flex items-center gap-2">
          <span
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border"
            style={{
              borderColor: `${accent}66`,
              background: `${accent}1a`,
              color: displayLocked ? '#94a3b8' : accent,
            }}
          >
            <StatusGlyph status={skill.status} blocked={displayLocked} />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-[10px] font-black uppercase tracking-[0.18em]" style={{ color: accent }}>
              Orbit {skill.level}
            </span>
            <span className="block truncate text-xs font-black leading-tight text-white">
              {skill.name}
            </span>
          </span>
        </div>

        <div className="mt-2 flex items-center justify-between gap-2">
          <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500">
            {cfg.label}
          </span>
          {skill.skillLevel > 0 && (
            <span className="rounded-full border border-white/10 bg-white/5 px-1.5 py-0.5 text-[9px] font-black text-slate-200">
              L{skill.skillLevel}
            </span>
          )}
        </div>
      </div>

      {prerequisiteBlocked && unmetPrerequisites.length > 0 && (
        <div className="pointer-events-none absolute left-1/2 top-full z-50 mt-2 w-48 -translate-x-1/2 rounded-lg border border-amber-500/30 bg-slate-950/95 px-3 py-2 text-[10px] font-semibold leading-snug text-amber-200 opacity-0 shadow-2xl backdrop-blur transition-opacity duration-200 group-hover:opacity-100">
          {prereqHint}
        </div>
      )}

      <Handle
        type="source"
        position={Position.Bottom}
        style={{ background: accent, border: 'none', height: 6, opacity: 0.3, width: 6 }}
      />
    </div>
  );
}

export default memo(SkillNode);
