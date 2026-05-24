import { useCallback, useMemo, useRef, useState } from 'react';
import { Globe, Shield, Briefcase, Award, Users, User } from 'lucide-react';
import {
  ReactFlow,
  Background,
  Controls,
  type Node,
  type Edge,
  type Viewport,
  type ReactFlowInstance,
  BackgroundVariant,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
  SKILLS,
  JOBS,
  arePrerequisitesMet,
  getUnmetPrerequisites,
  type Job,
  type Skill,
  type SkillCategory,
} from '../data/mockData';
import SkillNode from '../components/SkillNode';
import JobNode from '../components/JobNode';
import FieldPlanetNode from '../components/FieldPlanetNode';
import GalaxyBackgroundNode from '../components/GalaxyBackgroundNode';
import SkillQuizModal from '../components/SkillQuizModal';
import JobRequirementsModal from '../components/JobRequirementsModal';
import ProfilePage from '../components/ProfilePage';
import {
  DEFAULT_FIELD_ZOOM,
  DEFAULT_GALAXY_ZOOM,
  FIELD_CATEGORIES,
  FIELD_THEMES,
  GALAXY_CENTER,
  getFieldPlanetPosition,
  getJobPosition,
  getScopeCenter,
  getSkillPosition,
  isJobInScope,
  type MapScope,
} from '../utils/galaxyLayout';

const nodeTypes = {
  skillNode: SkillNode,
  jobNode: JobNode,
  fieldPlanetNode: FieldPlanetNode,
  galaxyBackground: GalaxyBackgroundNode,
};

function createCenteredViewport(
  center = GALAXY_CENTER,
  zoom: number = DEFAULT_GALAXY_ZOOM,
): Viewport {
  const w = typeof window !== 'undefined' ? Math.max(960, window.innerWidth - 224) : 1440;
  const h = typeof window !== 'undefined' ? Math.max(620, window.innerHeight - 122) : 900;
  return {
    x: w / 2 - center.x * zoom,
    y: h / 2 - center.y * zoom,
    zoom,
  };
}

const DEFAULT_VIEWPORT = createCenteredViewport();

const DIM_OPACITY = 0.2;

const acquiredStatuses = new Set(['self-declared', 'evidenced', 'verified']);

function buildEdges(
  skills: Skill[],
  activeJobId: string | null,
  activeSkillId: string | null,
  scope: MapScope,
): Edge[] {
  const edges: Edge[] = [];
  const activeSkill = activeSkillId ? skills.find((skill) => skill.id === activeSkillId) : undefined;
  const activePrerequisiteIds = new Set(activeSkill?.prerequisiteIds ?? []);

  skills.forEach((target) => {
    if (scope !== 'Galaxy' && target.category !== scope) return;
    target.prerequisiteIds?.forEach((sourceId) => {
      const source = skills.find((skill) => skill.id === sourceId);
      if (!source) return;
      if (scope !== 'Galaxy' && source.category !== scope) return;
      const active = acquiredStatuses.has(source.status);
      const highlighted = activeSkillId === target.id || activePrerequisiteIds.has(source.id);
      edges.push({
        id: `e-${source.id}-${target.id}`,
        source: source.id,
        target: target.id,
        animated: active || highlighted,
        type: 'smoothstep',
        style: {
          stroke: highlighted ? '#facc15' : active ? '#22c55e' : '#334155',
          strokeWidth: highlighted ? 2.6 : active ? 1.8 : 1,
          opacity: highlighted ? 0.95 : active ? 0.55 : 0.24,
        },
      });
    });
  });

  if (activeJobId) {
    const job = JOBS.find(j => j.id === activeJobId);
    if (job) {
      job.requiredSkillIds.forEach(skillId => {
        const skill = skills.find(s => s.id === skillId);
        if (!skill) return;
        if (scope !== 'Galaxy' && skill.category !== scope) return;
        const active = acquiredStatuses.has(skill.status);
        edges.push({
          id: `e-${skillId}-${job.id}`,
          source: skillId,
          target: job.id,
          animated: active,
          type: 'smoothstep',
          style: {
            stroke: active ? '#22d3ee' : '#67e8f9',
            strokeWidth: active ? 2.3 : 1.4,
            strokeDasharray: active ? undefined : '4 4',
            opacity: active ? 0.9 : 0.65,
          },
        });
      });
    }
  }

  return edges;
}

export default function SkillTree() {
  const flowRef = useRef<ReactFlowInstance | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [skills, setSkills] = useState<Skill[]>(() => [...SKILLS]);
  const [quizSkill, setQuizSkill] = useState<Skill | null>(null);
  const [jobModal, setJobModal] = useState<Job | null>(null);
  const [hoveredSkillId, setHoveredSkillId] = useState<string | null>(null);
  const [hoveredJobId, setHoveredJobId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'map' | 'profile' | 'employer'>('map');
  const [activeField, setActiveField] = useState<MapScope>('Galaxy');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const activeJobId = jobModal?.id;

  const activeJob = useMemo(
    () => (activeJobId ? JOBS.find(j => j.id === activeJobId) : undefined),
    [activeJobId],
  );

  const requiredSkillIds = useMemo(
    () => (activeJob ? new Set(activeJob.requiredSkillIds) : null),
    [activeJob],
  );

  const relatedSkillIds = useMemo(() => {
    if (!hoveredSkillId) return null;
    const skill = skills.find((candidate) => candidate.id === hoveredSkillId);
    if (!skill) return null;
    return new Set([skill.id, ...(skill.prerequisiteIds ?? [])]);
  }, [hoveredSkillId, skills]);

  const matchingSuggestions = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase().trim();
    return skills.filter(skill => 
      skill.name.toLowerCase().includes(query)
    ).slice(0, 5);
  }, [searchQuery, skills]);

  const searchMatches = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const query = searchQuery.toLowerCase().trim();
    
    const matchedSkillIds = new Set(
      skills
        .filter(s => s.name.toLowerCase().includes(query) || (s.description && s.description.toLowerCase().includes(query)))
        .map(s => s.id)
    );
  
    const matchedJobIds = new Set(
      JOBS
        .filter(j => j.title.toLowerCase().includes(query))
        .map(j => j.id)
    );
  
    return { skillIds: matchedSkillIds, jobIds: matchedJobIds };
  }, [searchQuery, skills]);

  const nodes = useMemo<Node[]>(() => {
    const transition = {};

    const visibleSkills = skills.filter(s => 
      activeField === 'Galaxy' ? true : s.category === activeField
    );
    
    const visibleJobs = JOBS.filter((job) => isJobInScope(job, activeField, skills));

    const bgNode: Node = {
      id: 'galaxy-background',
      type: 'galaxyBackground',
      position: GALAXY_CENTER,
      data: {},
      draggable: false,
      selectable: false,
      deletable: false,
      zIndex: -1,
    };

    const fieldNodes: Node[] = FIELD_CATEGORIES.map((category) => {
      const theme = FIELD_THEMES[category];
      const categorySkills = skills.filter((skill) => skill.category === category);
      const verifiedCount = categorySkills.filter((skill) => skill.status === 'verified').length;
      const isFocused = activeField === category;
      return {
        id: `field-${category}`,
        type: 'fieldPlanetNode',
        position: getFieldPlanetPosition(category),
        data: {
          category,
          label: theme.label,
          color: theme.color,
          shadow: theme.shadow,
          skillCount: categorySkills.length,
          verifiedCount,
          isFocused,
          isDimmed: activeField !== 'Galaxy' && !isFocused,
        },
        draggable: false,
        selectable: false,
        zIndex: 0,
        style: { opacity: activeField === 'Galaxy' || isFocused ? 1 : 0.38, ...transition },
      };
    });

    const skillNodes: Node[] = visibleSkills.map(skill => {
      let opacity = 1;
      
      if (searchMatches) {
        opacity = searchMatches.skillIds.has(skill.id) ? 1 : 0.15;
      } else if (requiredSkillIds) {
        opacity = requiredSkillIds.has(skill.id) ? 1 : 0.35;
      } else if (relatedSkillIds) {
        opacity = relatedSkillIds.has(skill.id) ? 1 : 0.28;
      }
      
      const prerequisiteBlocked = !arePrerequisitesMet(skill, skills);
      const unmetPrerequisites = getUnmetPrerequisites(skill, skills).map(s => ({
        id: s.id,
        name: s.name,
      }));
      
      return {
        id: skill.id,
        type: 'skillNode',
        position: getSkillPosition(skill, skills),
        data: {
          skill,
          prerequisiteBlocked,
          unmetPrerequisites,
          isRequired: Boolean(requiredSkillIds?.has(skill.id) || relatedSkillIds?.has(skill.id)),
        },
        draggable: true,
        zIndex: requiredSkillIds?.has(skill.id) || relatedSkillIds?.has(skill.id) ? 4 : 2,
        style: { opacity, ...transition },
      };
    });

    const jobNodes: Node[] = visibleJobs.map((job) => {
      let opacity = 1;
      
      if (searchMatches) {
        opacity = searchMatches.jobIds.has(job.id) ? 1 : 0.15;
      } else if (activeJobId) {
        opacity = activeJobId === job.id ? 1 : 0.5;
      } else if (activeField !== 'Galaxy' && !isJobInScope(job, activeField, skills)) {
        opacity = DIM_OPACITY;
      }
      
      return {
        id: job.id,
        type: 'jobNode',
        position: getJobPosition(job, visibleJobs, skills),
        data: { job, skills, isActive: jobModal?.id === job.id },
        draggable: true,
        zIndex: jobModal?.id === job.id ? 5 : 1,
        style: { opacity, ...transition },
      };
    });

    return [bgNode, ...fieldNodes, ...skillNodes, ...jobNodes];
  }, [skills, activeField, searchMatches, requiredSkillIds, relatedSkillIds, jobModal]);

  const edges = useMemo(
    () => buildEdges(skills, jobModal?.id ?? hoveredJobId, hoveredSkillId, activeField),
    [skills, jobModal?.id, hoveredSkillId, hoveredJobId, activeField],
  );

  const focusScope = useCallback((scope: MapScope) => {
    setActiveField(scope);
    setJobModal(null);
    const zoom = scope === 'Galaxy' ? DEFAULT_GALAXY_ZOOM : DEFAULT_FIELD_ZOOM;
    void flowRef.current?.setViewport(createCenteredViewport(getScopeCenter(scope), zoom), { duration: 700 });
  }, []);

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    if (node.type === 'galaxyBackground') return;

    if (node.type === 'fieldPlanetNode') {
      const category = node.id.replace('field-', '') as SkillCategory;
      focusScope(category);
      return;
    }

    if (node.type === 'skillNode') {
      const skill = skills.find(s => s.id === node.id);
      if (skill && arePrerequisitesMet(skill, skills)) {
        setQuizSkill(skill);
      }
      return;
    }

    if (node.type === 'jobNode') {
      const job = JOBS.find(j => j.id === node.id);
      if (!job) return;
      const isLocked = !job.requiredSkillIds.every(id => {
        const s = skills.find(sk => sk.id === id);
        return s?.status === 'verified';
      });
      if (isLocked) {
        setJobModal(job);
      }
    }
  }, [focusScope, skills]);

  const onNodeMouseEnter = useCallback((_: React.MouseEvent, node: Node) => {
    if (node.type === 'skillNode') {
      setHoveredSkillId(node.id);
    } else if (node.type === 'jobNode') {
      setHoveredJobId(node.id);
    }
  }, []);

  const onNodeMouseLeave = useCallback((_: React.MouseEvent, node: Node) => {
    if (node.type === 'skillNode') {
      setHoveredSkillId(null);
    } else if (node.type === 'jobNode') {
      setHoveredJobId(null);
    }
  }, []);

  const onPaneClick = useCallback(() => {
    setJobModal(null);
  }, []);

  const handleVerified = useCallback((skillId: string) => {
    setSkills(prev =>
      prev.map(s => (s.id === skillId ? { ...s, status: 'verified' as const } : s)),
    );
  }, []);

  const navItems = useMemo(() => [
    { id: 'Galaxy' as const, label: 'Galaxy View', color: '#e0f2fe' },
    ...FIELD_CATEGORIES.map(field => ({ id: field, label: FIELD_THEMES[field].label, color: FIELD_THEMES[field].color }))
  ], []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const cleanValue = value.replace(/[^a-zA-Z\s]/g, '');
    setSearchQuery(cleanValue);
    setShowSuggestions(true);
  };

  return (
    <div className="w-full h-screen bg-[#030712] text-gray-100 flex flex-col overflow-hidden font-sans relative">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(17,24,39,0.4)_0%,rgba(3,7,18,1)_100%)] pointer-events-none z-0" />
      
      <header className="w-full px-8 py-4 bg-gray-950/40 backdrop-blur-xl border-b border-b-gray-900/60 flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 z-50 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center shadow-[0_0_15px_rgba(34,211,238,0.15)]">
            <Globe size={16} className="text-cyan-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-widest font-black text-cyan-400">SkillForge</span>
              <span className="text-[9px] bg-cyan-500/10 border border-cyan-500/20 px-1.5 py-0.5 rounded text-cyan-300 font-mono">v1.2.6</span>
            </div>
            {viewMode === 'map' && (
              <h1 className="text-xs font-bold text-gray-400 uppercase tracking-wider font-mono">
                Galaxy Atlas // <span className="text-white">{activeField === 'Galaxy' ? 'All Fields' : FIELD_THEMES[activeField].label}</span>
              </h1>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 self-start xl:self-auto overflow-visible">
          <div className="flex items-center gap-1 p-1 bg-gray-900/60 border border-gray-800/80 rounded-xl">
            <button
              type="button"
              onClick={() => setViewMode('map')}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all duration-300 flex items-center gap-1.5 ${viewMode === 'map' ? 'bg-cyan-500 text-gray-900 shadow-[0_0_12px_rgba(34,211,238,0.4)]' : 'text-gray-400 hover:text-white'}`}
            >
              <Globe size={11} /> Map
            </button>
            <button
              type="button"
              onClick={() => setViewMode('profile')}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all duration-300 flex items-center gap-1.5 ${viewMode === 'profile' ? 'bg-cyan-500 text-gray-900 shadow-[0_0_12px_rgba(34,211,238,0.4)]' : 'text-gray-400 hover:text-white'}`}
            >
              <User size={11} /> Profile
            </button>
            <button
              type="button"
              onClick={() => setViewMode('employer')}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all duration-300 flex items-center gap-1.5 ${viewMode === 'employer' ? 'bg-cyan-500 text-gray-900 shadow-[0_0_12px_rgba(34,211,238,0.4)]' : 'text-gray-400 hover:text-white'}`}
            >
              <Users size={11} /> Employer View
            </button>
          </div>

          {viewMode === 'map' && (
            <div className="relative w-64 overflow-visible">
              <input
                type="text"
                placeholder="SEARCH NODES OR ROLES..."
                value={searchQuery}
                onChange={handleSearchChange}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => {
                  setTimeout(() => setShowSuggestions(false), 200);
                }}
                className="w-full bg-gray-900/90 border border-gray-800 focus:border-cyan-500/80 text-xs font-mono font-bold tracking-wide rounded-xl px-4 py-2 text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-cyan-500/30 transition-all duration-300 relative z-50"
              />
              
              {showSuggestions && matchingSuggestions.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-2 bg-gray-950 border border-gray-800 rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.95)] z-[9999] max-h-60 overflow-y-auto divide-y divide-gray-900/60 backdrop-blur-md">
                  {matchingSuggestions.map((skill) => (
                    <button
                      key={skill.id}
                      type="button"
                      onMouseDown={() => {
                        setSearchQuery(skill.name);
                        setShowSuggestions(false);
                        focusScope(skill.category);
                      }}
                      className="w-full text-left px-4 py-2.5 text-[11px] font-mono font-bold text-gray-400 hover:bg-cyan-500/10 hover:text-cyan-400 transition-colors flex items-center justify-between"
                    >
                      <span className="truncate mr-2">{skill.name.toUpperCase()}</span>
                      <span 
                        className="text-[8px] px-2 py-0.5 rounded border tracking-tight shrink-0 font-sans" 
                        style={{ 
                          color: FIELD_THEMES[skill.category].color, 
                          borderColor: `${FIELD_THEMES[skill.category].color}44`,
                          background: `${FIELD_THEMES[skill.category].color}0d`
                        }}
                      >
                        {skill.category.split(' ')[0]}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {searchQuery && !showSuggestions && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-gray-500 hover:text-cyan-400 transition-colors z-50"
                >
                  CLEAR
                </button>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3 xl:justify-end">
          {[
            { label: 'Nodes Unlocked', icon: <Briefcase size={12} />, value: skills.filter(s => s.status !== 'locked').length, total: skills.length, color: 'text-emerald-400', border: 'border-emerald-500/20', bg: 'bg-emerald-500/5' },
            { label: 'Identity Verified', icon: <Shield size={12} />, value: skills.filter(s => s.status === 'verified').length, total: skills.length, color: 'text-amber-400', border: 'border-amber-500/20', bg: 'bg-amber-500/5' },
            { label: 'Roles Matrix', icon: <Award size={12} />, value: JOBS.filter(j => j.requiredSkillIds.every(id => skills.find(s => s.id === id)?.status === 'verified')).length, total: JOBS.length, color: 'text-cyan-400', border: 'border-cyan-500/20', bg: 'bg-cyan-500/5' },
          ].map(stat => (
            <div key={stat.label} className={`flex items-center gap-3 ${stat.bg} ${stat.border} border rounded-xl px-3 py-1.5 backdrop-blur-md`}>
              <div className={`p-1.5 rounded-lg bg-gray-950/80 border border-gray-800 ${stat.color}`}>
                {stat.icon}
              </div>
              <div>
                <p className="text-[9px] text-gray-500 uppercase tracking-widest font-mono leading-tight">{stat.label}</p>
                <p className="text-xs font-black font-mono text-white leading-none mt-0.5">
                  {stat.value}<span className="text-gray-600 text-[10px] font-normal">/{stat.total}</span>
                </p>
              </div>
            </div>
          ))}
        </div>
      </header>

      <div className="flex-1 flex relative overflow-hidden z-10">
        {viewMode === 'map' && (
          <nav className="w-56 bg-gray-950/40 backdrop-blur-md border-r border-gray-900/60 p-4 flex flex-col gap-1.5 z-30 shrink-0 select-none overflow-y-auto">
            <div className="text-[10px] font-mono font-bold tracking-wider text-gray-500 uppercase px-3 mb-2">
              Galaxy Navigation
            </div>
            {navItems.map((item) => {
              const isActive = activeField === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => focusScope(item.id as MapScope)}
                  className={`w-full text-left px-3 py-2 rounded-xl text-[11px] font-mono font-bold uppercase tracking-wide transition-all duration-200 border flex items-center gap-2.5 ${
                    isActive 
                      ? 'bg-gray-900 text-white border-gray-800' 
                      : 'text-gray-400 border-transparent hover:text-gray-200 hover:bg-gray-900/30'
                  }`}
                  style={{
                    borderColor: isActive ? `${item.color}44` : undefined,
                    boxShadow: isActive ? `0 0 12px ${item.color}08` : undefined
                  }}
                >
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </nav>
        )}

        <div className="flex-1 flex relative overflow-hidden h-full">
          {viewMode === 'map' && (
            <>
              <div className="absolute inset-0 pointer-events-none z-20 border border-gray-900/20 m-4 rounded-2xl overflow-hidden shadow-[inset_0_0_60px_rgba(0,0,0,0.85)]">
                <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-gray-800/60 rounded-tl" />
                <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-gray-800/60 rounded-tr" />
                <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-gray-800/60 rounded-bl" />
                <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-gray-800/60 rounded-br" />
              </div>

              <div className="flex-1 h-full relative z-10">
                <ReactFlow
                  nodes={nodes}
                  edges={edges}
                  nodeTypes={nodeTypes}
                  onNodeClick={onNodeClick}
                  onNodeMouseEnter={onNodeMouseEnter}
                  onNodeMouseLeave={onNodeMouseLeave}
                  onPaneClick={onPaneClick}
                  onInit={(instance) => {
                    flowRef.current = instance;
                  }}
                  defaultViewport={DEFAULT_VIEWPORT}
                  minZoom={0.1}
                  maxZoom={1.5}
                >
                  <Background variant={BackgroundVariant.Dots} gap={12} size={1} color="#374151" className="opacity-40" />
                  <Controls className="!bg-gray-950 !border-gray-800 !text-gray-400" />
                </ReactFlow>
              </div>
            </>
          )}

          {viewMode === 'profile' && (
            <div className="flex-1 h-full overflow-y-auto bg-gray-950 p-6">
              <ProfilePage skills={skills} jobs={JOBS} />
            </div>
          )}

          {viewMode === 'employer' && (
            <div className="flex-1 h-full overflow-y-auto bg-gray-950 p-8 flex flex-col gap-6">
              <div>
                <h2 className="text-xl font-black font-mono tracking-wide text-cyan-400 uppercase">Talent Pool / Verification Console</h2>
                <p className="text-xs text-gray-500 font-mono mt-1">Review verified asset records and credential proofs across ecosystem candidate models.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {JOBS.map(job => {
                  const matchCount = job.requiredSkillIds.filter(id => skills.find(s => s.id === id)?.status === 'verified').length;
                  const percent = Math.round((matchCount / job.requiredSkillIds.length) * 100);
                  return (
                    <div key={job.id} className="bg-gray-900/40 border border-gray-800/80 p-5 rounded-xl backdrop-blur-md flex flex-col justify-between gap-4">
                      <div>
                        <span className="text-[9px] font-mono font-bold text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded uppercase tracking-wider">{job.department || 'Ecosystem'}</span>
                        <h3 className="text-sm font-bold text-white mt-2 font-mono uppercase tracking-wide">{job.title}</h3>
                        <p className="text-xs text-gray-400 mt-1 line-clamp-2">{job.description}</p>
                      </div>
                      <div>
                        <div className="flex justify-between text-[10px] font-mono text-gray-400 mb-1.5">
                          <span>VERIFIED REQUIREMENT MATCH</span>
                          <span className="text-white font-bold">{matchCount}/{job.requiredSkillIds.length} ({percent}%)</span>
                        </div>
                        <div className="w-full bg-gray-950 h-1.5 rounded-full overflow-hidden border border-gray-800/40">
                          <div className="bg-cyan-500 h-full rounded-full transition-all duration-500" style={{ width: `${percent}%` }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {quizSkill && (
        <SkillQuizModal
          skill={quizSkill}
          onClose={() => setQuizSkill(null)}
          onVerified={handleVerified}
        />
      )}

      {jobModal && (
        <JobRequirementsModal
          job={jobModal}
          skills={skills}
          onClose={() => setJobModal(null)}
        />
      )}
    </div>
  );
}
