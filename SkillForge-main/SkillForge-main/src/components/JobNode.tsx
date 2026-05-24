import { memo, useEffect, useState } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Lock, Unlock, Briefcase } from 'lucide-react';
import type { Job, Skill } from '../data/mockData';

interface JobNodeData {
  job: Job;
  skills: Skill[];
}

function JobNode({ data }: NodeProps) {
  const { job, skills } = data as unknown as JobNodeData;

  const requiredSkills = job.requiredSkillIds.map(
    id => skills.find(s => s.id === id)
  );
  const verifiedCount = requiredSkills.filter(
    s => s && s.status === 'verified',
  ).length;
  const total = job.requiredSkillIds.length;
  const isUnlocked = verifiedCount === total;
  const progress = total > 0 ? (verifiedCount / total) * 100 : 0;

  const [justUnlocked, setJustUnlocked] = useState(false);
  useEffect(() => {
    if (isUnlocked) {
      setJustUnlocked(true);
      const t = setTimeout(() => setJustUnlocked(false), 1200);
      return () => clearTimeout(t);
    }
  }, [isUnlocked]);

  return (
    <div className="relative group">
      <Handle
        type="target"
        position={Position.Top}
        style={{ background: '#94a3b8', border: 'none', width: 8, height: 8 }}
      />

      <div
        className={`
          relative w-52 rounded-2xl border-2 px-4 py-4 cursor-pointer
          transition-all duration-500 ease-out
          ${isUnlocked
            ? 'bg-gray-900 border-cyan-400 shadow-[0_0_32px_rgba(34,211,238,0.5)] hover:shadow-[0_0_48px_rgba(34,211,238,0.7)]'
            : 'bg-gray-900/60 border-gray-700 opacity-70'}
          ${justUnlocked ? 'scale-110' : 'scale-100'}
          hover:scale-105
        `}
      >
        {/* Unlock burst ring */}
        {justUnlocked && (
          <div className="absolute inset-0 rounded-2xl border-2 border-cyan-300 animate-ping opacity-75 pointer-events-none" />
        )}

        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div
            className={`
              w-9 h-9 rounded-xl flex items-center justify-center
              transition-all duration-500
              ${isUnlocked
                ? 'bg-cyan-400/20 text-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.4)]'
                : 'bg-gray-700 text-gray-500'}
            `}
          >
            <Briefcase size={18} />
          </div>

          <div
            className={`
              w-7 h-7 rounded-full flex items-center justify-center
              transition-all duration-500
              ${isUnlocked
                ? 'bg-cyan-400 text-gray-900 shadow-[0_0_10px_rgba(34,211,238,0.6)]'
                : 'bg-gray-700 text-gray-500'}
            `}
          >
            {isUnlocked
              ? <Unlock size={13} strokeWidth={2.5} />
              : <Lock size={13} strokeWidth={2.5} />
            }
          </div>
        </div>

        <p className={`text-xs font-semibold tracking-widest uppercase mb-1 ${isUnlocked ? 'text-cyan-400' : 'text-gray-600'}`}>
          {isUnlocked ? 'Unlocked Role' : 'Locked Role'}
        </p>
        <p className={`text-base font-bold leading-tight mb-1 ${isUnlocked ? 'text-white' : 'text-gray-400'}`}>
          {job.title}
        </p>
        <p className="text-[11px] text-gray-500 leading-snug mb-3">
          {job.description}
        </p>

        {/* Progress bar */}
        <div className="mb-2">
          <div className="flex justify-between items-center mb-1">
            <span className="text-[10px] text-gray-500 uppercase tracking-wider">Verified</span>
            <span className={`text-[10px] font-bold ${isUnlocked ? 'text-cyan-400' : 'text-gray-500'}`}>
              {verifiedCount}/{total}
            </span>
          </div>
          <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ease-out ${isUnlocked ? 'bg-cyan-400 shadow-[0_0_6px_rgba(34,211,238,0.8)]' : 'bg-gray-600'}`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Required skill chips */}
        <div className="flex flex-wrap gap-1">
          {requiredSkills.map((skill, i) => (
            <span
              key={i}
              className={`text-[9px] px-1.5 py-0.5 rounded-md font-medium transition-all duration-300 ${
                skill?.status === 'verified'
                  ? 'bg-yellow-900/50 text-yellow-300 border border-yellow-700'
                  : skill && skill.status !== 'locked'
                    ? 'bg-green-900/40 text-green-500 border border-green-800'
                    : 'bg-gray-800 text-gray-600 border border-gray-700'
              }`}
            >
              {skill?.name ?? 'Unknown'}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export default memo(JobNode);
