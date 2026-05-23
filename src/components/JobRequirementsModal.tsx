import { useCallback, useEffect, useMemo, useState } from 'react';
import { X, Briefcase, Loader2, Lock } from 'lucide-react';
import type { Job, Skill } from '../data/mockData';
import { generateSkillRelevanceForJob } from '../services/gemini';

interface MissingSkillEntry {
  skill: Skill;
  relevance: string;
}

interface JobRequirementsModalProps {
  job: Job;
  skills: Skill[];
  onClose: () => void;
}

const categoryAccent: Record<string, string> = {
  Tech: '#3b82f6',
  Business: '#f59e0b',
  Communication: '#10b981',
};

const JOB_ACCENT = '#22d3ee';

export default function JobRequirementsModal({ job, skills, onClose }: JobRequirementsModalProps) {
  const [entries, setEntries] = useState<MissingSkillEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const missingSkills = useMemo(
    () =>
      job.requiredSkillIds
        .map((id) => skills.find((s) => s.id === id))
        .filter((s): s is Skill => !!s && s.status === 'locked'),
    [job.requiredSkillIds, skills],
  );

  const missingSkillKey = missingSkills.map((s) => s.id).join(',');

  const loadRelevance = useCallback(async () => {
    setLoading(true);
    setEntries([]);
    setError(null);

    try {
      const results = await Promise.all(
        missingSkills.map(async (skill) => {
          const relevance = await generateSkillRelevanceForJob(job, skill);
          return { skill, relevance };
        }),
      );
      setEntries(results);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load skill insights');
    } finally {
      setLoading(false);
    }
  }, [job, missingSkills]);

  useEffect(() => {
    if (missingSkills.length === 0) {
      setLoading(false);
      return;
    }
    loadRelevance();
  }, [loadRelevance, missingSkillKey, missingSkills.length]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg max-h-[85vh] flex flex-col rounded-2xl border-2 shadow-2xl overflow-hidden"
        style={{
          borderColor: `${JOB_ACCENT}88`,
          boxShadow: `0 0 40px ${JOB_ACCENT}33, inset 0 1px 0 rgba(255,255,255,0.06)`,
          background: 'linear-gradient(165deg, #1a1510 0%, #0d0b09 45%, #12100e 100%)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex items-center justify-between px-5 py-3 border-b border-cyan-900/50 shrink-0"
          style={{ background: 'linear-gradient(90deg, #142228 0%, #0d1418 50%, #142228 100%)' }}
        >
          <div className="flex items-center gap-2">
            <Briefcase className="text-cyan-400" size={20} />
            <span className="text-cyan-200/90 text-xs font-bold uppercase tracking-[0.2em]">
              Role Gate
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-cyan-700/80 hover:text-cyan-300 hover:bg-cyan-950/50 transition-colors"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-5 overflow-y-auto flex-1">
          <p className="text-[10px] font-bold uppercase tracking-widest mb-1 text-cyan-500/80">
            Locked Role
          </p>
          <h2 className="text-xl font-bold text-amber-50 mb-1">{job.title}</h2>
          <p className="text-sm text-amber-600/70 mb-4 leading-snug">{job.description}</p>

          {loading && (
            <div className="py-10 flex flex-col items-center gap-4">
              <Loader2 className="text-cyan-400 animate-spin" size={36} />
              <p className="text-cyan-600/80 text-sm">Consulting the guild on missing skills...</p>
            </div>
          )}

          {!loading && error && (
            <div className="py-6 text-center">
              <p className="text-red-400 text-sm mb-4">{error}</p>
              <button
                type="button"
                onClick={loadRelevance}
                className="px-5 py-2 rounded-lg border border-cyan-700/60 text-cyan-200 text-sm font-semibold hover:bg-cyan-950/60 transition-colors"
              >
                Try Again
              </button>
            </div>
          )}

          {!loading && !error && missingSkills.length === 0 && (
            <p className="text-cyan-500/80 text-sm text-center py-6">No missing skills — role is ready.</p>
          )}

          {!loading && !error && entries.length > 0 && (
            <>
              <p className="text-xs text-cyan-600/70 uppercase tracking-wider font-semibold mb-3">
                Missing skills ({entries.length})
              </p>
              <div className="space-y-3">
                {entries.map(({ skill, relevance }) => {
                  const accent = categoryAccent[skill.category] ?? '#d97706';
                  return (
                    <div
                      key={skill.id}
                      className="rounded-xl border-2 px-4 py-3"
                      style={{
                        borderColor: `${accent}55`,
                        background: 'linear-gradient(135deg, rgba(26,21,16,0.9) 0%, rgba(13,11,9,0.95) 100%)',
                      }}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Lock size={12} className="text-gray-500 shrink-0" />
                        <p className="text-sm font-bold text-amber-50">{skill.name}</p>
                        <span
                          className="text-[9px] font-bold uppercase tracking-widest ml-auto"
                          style={{ color: accent }}
                        >
                          {skill.category}
                        </span>
                      </div>
                      <p className="text-sm text-amber-100/75 leading-relaxed">{relevance}</p>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        <div className="px-6 pb-5 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 rounded-xl border-2 border-cyan-700/60 text-cyan-200 font-bold text-sm hover:bg-cyan-950/50 transition-colors"
          >
            Close
          </button>
        </div>

        <div className="h-1 bg-gradient-to-r from-transparent via-cyan-700/40 to-transparent shrink-0" />
      </div>
    </div>
  );
}
