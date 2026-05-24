import { useState } from 'react';
import { X, User, Rocket, Compass, CheckCircle2 } from 'lucide-react';
import type { Skill } from '../data/mockData';

interface OnboardingModalProps {
  skills: Skill[];
  onClose: () => void;
  onComplete: (selectedSkillIds: string[]) => void;
}

type Step = 'welcome' | 'profile' | 'interests' | 'complete';

export default function OnboardingModal({ skills = [], onClose, onComplete }: OnboardingModalProps) {
  const [step, setStep] = useState<Step>('welcome');
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  const safeSkills = Array.isArray(skills) ? skills : [];
  const categories = Array.from(new Set(safeSkills.map((s) => s?.category))).filter(Boolean);

  const handleCategoryToggle = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category],
    );
  };

  const mapAnswersToSkills = (): string[] => {
    if (safeSkills.length === 0) return [];
    
    const targetCategories = selectedCategories.length > 0 ? selectedCategories : categories;
    
    return safeSkills
      .filter((skill) => skill?.category && targetCategories.includes(skill.category))
      .map((skill) => skill.id);
  };

  const handleNext = () => {
    if (step === 'welcome') {
      setStep('profile');
    } else if (step === 'profile') {
      if (!name.trim()) return;
      setStep('interests');
    } else if (step === 'interests') {
      setStep('complete');
    } else if (step === 'complete') {
      const initialSkillIds = mapAnswersToSkills();
      onComplete(initialSkillIds);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg rounded-2xl border-2 shadow-2xl overflow-hidden flex flex-col"
        style={{
          borderColor: '#f59e0b88',
          boxShadow: '0 0 40px rgba(245, 158, 11, 0.2), inset 0 1px 0 rgba(255,255,255,0.06)',
          background: 'linear-gradient(165deg, #1a1510 0%, #0d0b09 45%, #12100e 100%)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex items-center justify-between px-5 py-3 border-b border-amber-900/50 shrink-0"
          style={{ background: 'linear-gradient(90deg, #2a1f14 0%, #1a1410 50%, #2a1f14 100%)' }}
        >
          <div className="flex items-center gap-2">
            <Rocket className="text-amber-500" size={20} />
            <span className="text-amber-200/90 text-xs font-bold uppercase tracking-[0.2em]">
              Character Creation
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-amber-700/80 hover:text-amber-400 hover:bg-amber-950/50 transition-colors"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <form 
  onSubmit={(e) => e.preventDefault()}
  className="px-6 py-6 overflow-y-auto flex-1 flex flex-col justify-between min-h-[320px]"
>
          {step === 'welcome' && (
            <div className="flex-1 flex flex-col items-center text-center justify-center py-4">
              <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mb-4">
                <Compass className="text-amber-400" size={32} />
              </div>
              <h2 className="text-2xl font-bold text-amber-50 mb-2">Welcome to SkillForge</h2>
              <p className="text-sm text-amber-200/70 max-w-sm leading-relaxed">
                Embark on a visual career journey. Establish your character baseline, clear skill dungeons, and qualify for high-tier guild roles.
              </p>
            </div>
          )}

          {step === 'profile' && (
            <div className="flex-1 flex flex-col justify-center">
              <h2 className="text-xl font-bold text-amber-50 mb-1">Identity Log</h2>
              <p className="text-xs text-amber-600/80 mb-5">Identify your operating coordinates.</p>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="characterName" className="block text-xs font-bold uppercase text-amber-500/80 tracking-wider mb-2">
                    Character Name *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-700/60" size={16} />
                    <input
                      type="text"
                      id="characterName"
                      name="characterName"
                      required
                      autoComplete="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter your name..."
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border-2 border-amber-900/40 bg-amber-950/20 text-amber-50 placeholder-amber-800/50 text-sm focus:outline-none focus:border-amber-600/60 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="targetRole" className="block text-xs font-bold uppercase text-amber-500/80 tracking-wider mb-2">
                    Target Role / Title
                  </label>
                  <input
                    type="text"
                    id="targetRole"
                    name="targetRole"
                    autoComplete="organization-title"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    placeholder="e.g. Frontend Dev, Product Manager..."
                    className="w-full px-4 py-2.5 rounded-xl border-2 border-amber-900/40 bg-amber-950/20 text-amber-50 placeholder-amber-800/50 text-sm focus:outline-none focus:border-amber-600/60 transition-colors"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 'interests' && (
            <div className="flex-1 flex flex-col justify-center">
              <h2 className="text-xl font-bold text-amber-50 mb-1">Select Specializations</h2>
              <p className="text-xs text-amber-600/80 mb-4">Choose trees to unlock initial skill node configurations.</p>
              
              <div className="grid grid-cols-2 gap-2.5 my-2">
                {categories.map((cat) => {
                  const active = selectedCategories.includes(cat);
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => handleCategoryToggle(cat)}
                      className={`px-4 py-3 rounded-xl border-2 text-sm font-semibold transition-all text-left flex items-center justify-between ${
                        active
                          ? 'border-amber-500 text-amber-200 bg-amber-950/40 shadow-[0_0_12px_rgba(245,158,11,0.15)]'
                          : 'border-amber-900/40 text-amber-700/80 bg-transparent hover:border-amber-800/60'
                      }`}
                    >
                      <span>{cat}</span>
                      {active && <CheckCircle2 size={14} className="text-amber-400 shrink-0 ml-2" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {step === 'complete' && (
            <div className="flex-1 flex flex-col items-center text-center justify-center py-4">
              <div className="w-14 h-14 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center mb-4">
                <CheckCircle2 className="text-green-400" size={28} />
              </div>
              <h2 className="text-xl font-bold text-amber-50 mb-1">Configuration Finalized</h2>
              <p className="text-sm text-amber-600/80 mb-2 font-medium">Welcome, {name || 'Operator'}</p>
              <p className="text-xs text-amber-200/60 max-w-xs leading-relaxed">
                Your primary tree setup is ready. Tap build to compile your nodes and generate the skill map vectors.
              </p>
            </div>
          )}

          <div className="mt-8 pt-4 border-t border-amber-950/40 flex items-center justify-between gap-4 shrink-0">
            <div className="flex gap-1.5">
              {(['welcome', 'profile', 'interests', 'complete'] as Step[]).map((s, idx) => (
                <div
                  key={s}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    step === s ? 'w-6 bg-amber-500' : 'w-2 bg-amber-950/80'
                  }`}
                  style={{
                    opacity: idx <= ['welcome', 'profile', 'interests', 'complete'].indexOf(step) ? 1 : 0.4
                  }}
                />
              ))}
            </div>

            <button
  type="button"
  onClick={handleNext}
  disabled={step === 'profile' && !name.trim()}
  className="px-6 py-2 rounded-xl bg-gradient-to-b from-amber-500 to-amber-700 text-neutral-950 font-bold text-sm shadow-md hover:brightness-110 disabled:opacity-40 disabled:pointer-events-none transition-all"
>
              {step === 'complete' ? 'Build my SkillTree' : 'Continue'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}