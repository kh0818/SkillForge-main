import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { CheckCircle, Link, BookOpen } from 'lucide-react';
import type { Skill } from '../data/mockData';

interface SkillNodeData {
  skill: Skill;
  isUnlocking?: boolean;
}

const categoryColors: Record<string, string> = {
  Tech: '#3b82f6',
  Business: '#f59e0b',
  Communication: '#10b981',
};

const statusConfig = {
  locked: {
    bg: 'bg-gray-800',
    border: 'border-gray-600',
    text: 'text-gray-400',
    glow: '',
    label: 'Locked',
  },
  'self-declared': {
    bg: 'bg-gray-900',
    border: 'border-green-600',
    text: 'text-green-300',
    glow: 'shadow-[0_0_12px_rgba(34,197,94,0.3)]',
    label: 'Self-declared',
  },
  evidenced: {
    bg: 'bg-gray-900',
    border: 'border-green-500',
    text: 'text-green-200',
    glow: 'shadow-[0_0_18px_rgba(34,197,94,0.45)]',
    label: 'Evidenced',
  },
  verified: {
    bg: 'bg-gray-900',
    border: 'border-yellow-400',
    text: 'text-green-100',
    glow: 'shadow-[0_0_22px_rgba(250,204,21,0.5)]',
    label: 'Verified',
  },
};

const StatusBadge = ({ status }: { status: Skill['status'] }) => {
  if (status === 'locked') return null;

  if (status === 'verified') {
    return (
      <span className="absolute -top-2 -right-2 flex items-center gap-0.5 bg-yellow-400 text-gray-900 text-[9px] font-bold px-1.5 py-0.5 rounded-full leading-none">
        <CheckCircle size={8} />
        VERIFIED
      </span>
    );
  }
  if (status === 'evidenced') {
    return (
      <span className="absolute -top-2 -right-2 flex items-center gap-0.5 bg-green-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full leading-none">
        <Link size={8} />
        EVIDENCED
      </span>
    );
  }
  return (
    <span className="absolute -top-2 -right-2 flex items-center gap-0.5 bg-gray-600 text-gray-200 text-[9px] font-bold px-1.5 py-0.5 rounded-full leading-none">
      <BookOpen size={8} />
      DECLARED
    </span>
  );
};

function SkillNode({ data }: NodeProps) {
  const { skill } = data as SkillNodeData;
  const cfg = statusConfig[skill.status];
  const accent = categoryColors[skill.category];

  return (
    <div className="relative group">
      <Handle
        type="target"
        position={Position.Top}
        style={{ background: accent, border: 'none', width: 8, height: 8 }}
      />

      <div
        className={`
          relative w-36 rounded-xl border-2 px-3 py-2.5 cursor-pointer
          transition-all duration-300 ease-out
          hover:scale-105 hover:brightness-125
          ${cfg.bg} ${cfg.border} ${cfg.glow}
        `}
        style={{
          boxShadow: skill.status !== 'locked'
            ? `0 0 0 1px ${accent}33, 0 4px 24px ${accent}22, ${cfg.glow}`
            : undefined,
        }}
      >
        <StatusBadge status={skill.status} />

        {/* Category accent bar */}
        <div
          className="absolute top-0 left-3 right-3 h-0.5 rounded-full opacity-80"
          style={{ background: accent }}
        />

        <p className="text-[10px] font-semibold mt-1 mb-0.5 opacity-60 tracking-widest uppercase" style={{ color: accent }}>
          {skill.category}
        </p>
        <p className={`text-sm font-bold leading-tight ${cfg.text}`}>
          {skill.name}
        </p>

        {skill.status === 'locked' && (
          <p className="text-[10px] text-gray-600 mt-1 leading-tight line-clamp-2">
            {skill.description}
          </p>
        )}
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        style={{ background: accent, border: 'none', width: 8, height: 8 }}
      />
    </div>
  );
}

export default memo(SkillNode);
