import { memo, useEffect, useState } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Lock, Star, Unlock } from 'lucide-react';
import type { Job, Skill } from '../data/mockData';

interface JobNodeData {
  job: Job;
  skills: Skill[];
  isActive?: boolean;
}

function JobNode({ data }: NodeProps) {
  const { job, skills, isActive = false } = data as unknown as JobNodeData;
  const requiredSkills = job.requiredSkillIds.map((id) => skills.find((skill) => skill.id === id));
  const optionalSkills = (job.optionalSkillIds ?? []).map((id) => skills.find((skill) => skill.id === id));
  const verifiedCount = requiredSkills.filter((skill) => skill && skill.status === 'verified').length;
  const total = job.requiredSkillIds.length;
  const isUnlocked = verifiedCount === total;
  const progress = total > 0 ? Math.round((verifiedCount / total) * 100) : 0;

  const [justUnlocked, setJustUnlocked] = useState(false);
  useEffect(() => {
    if (!isUnlocked) return undefined;
    setJustUnlocked(true);
    const timer = setTimeout(() => setJustUnlocked(false), 1200);
    return () => clearTimeout(timer);
  }, [isUnlocked]);

  return (
    <div className={`job-star group relative w-44 cursor-pointer select-none ${isActive ? 'job-star-active' : ''}`}>
      <Handle
        type="target"
        position={Position.Top}
        style={{ background: isUnlocked ? '#67e8f9' : '#64748b', border: 'none', height: 6, opacity: 0.35, width: 6 }}
      />

      <div className="relative flex flex-col items-center">
        <div
          className="relative flex h-16 w-16 items-center justify-center rounded-full job-core"
          style={{
            background: `conic-gradient(${isUnlocked ? '#22d3ee' : '#64748b'} ${progress * 3.6}deg, rgba(15,23,42,0.88) 0deg)`,
            boxShadow: isUnlocked
              ? '0 0 32px rgba(34,211,238,0.5), inset 0 0 18px rgba(255,255,255,0.1)'
              : '0 0 18px rgba(100,116,139,0.26), inset 0 0 18px rgba(255,255,255,0.05)',
          }}
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-950 text-cyan-200">
            <Star size={22} fill={isUnlocked ? '#67e8f9' : 'transparent'} />
          </div>
          <span className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full border border-slate-800 bg-slate-950 text-slate-400">
            {isUnlocked ? <Unlock size={12} className="text-cyan-300" /> : <Lock size={12} />}
          </span>
        </div>

        <div
          className={`mt-2 w-full rounded-xl border px-3 py-2 text-center backdrop-blur ${
            isUnlocked ? 'border-cyan-400/40 bg-cyan-500/10' : 'border-slate-700/80 bg-slate-950/70'
          }`}
        >
          <p className={`text-[9px] font-black uppercase tracking-[0.2em] ${isUnlocked ? 'text-cyan-300' : 'text-slate-500'}`}>
            {isUnlocked ? 'Destination Star' : 'Locked Star'}
          </p>
          <p className="mt-1 line-clamp-2 text-xs font-black leading-tight text-white">
            {job.title}
          </p>
          <p className="mt-1 text-[10px] font-mono text-slate-500">
            {verifiedCount}/{total} aligned
          </p>

          <div className="mt-3 text-left text-[10px] leading-snug text-slate-200 space-y-2">
            <div>
              <p className="text-[8px] font-semibold uppercase tracking-[0.18em] text-cyan-300">Needed Skills</p>
              <p className="mt-1 text-[10px] text-slate-300 line-clamp-2">
                {requiredSkills.filter(Boolean).map((skill) => skill?.name).join(', ') || 'None'}
              </p>
            </div>
            {optionalSkills.length > 0 && (
              <div>
                <p className="text-[8px] font-semibold uppercase tracking-[0.18em] text-amber-300">Nice to Have</p>
                <p className="mt-1 text-[10px] text-slate-300 line-clamp-2">
                  {optionalSkills.filter(Boolean).map((skill) => skill?.name).join(', ') || 'None'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default memo(JobNode);
