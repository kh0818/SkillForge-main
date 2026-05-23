import { useCallback, useMemo, useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Panel,
  type Node,
  type Edge,
  type NodeProps,
  type Viewport,
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
import Legend from '../components/Legend';
import SkillQuizModal from '../components/SkillQuizModal';
import JobRequirementsModal from '../components/JobRequirementsModal';
import OnboardingModal from '../components/OnboardingModal';
import ProfilePage from '../components/ProfilePage';

function CategoryLabelNode({ data }: NodeProps) {
  const { label, color } = data as { label: string; color: string };
  return (
    <div
      className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border whitespace-nowrap"
      style={{
        color,
        borderColor: `${color}44`,
        background: `${color}11`,
        boxShadow: `0 0 12px ${color}22`,
      }}
    >
      {label}
    </div>
  );
}

const nodeTypes = {
  skillNode: SkillNode,
  jobNode: JobNode,
  categoryLabelNode: CategoryLabelNode,
};

// ──────────────────────────────────────────────
// Radial layout constants
// ──────────────────────────────────────────────
const LAYOUT_CENTER = { x: 1500, y: 1500 };

const CATEGORY_ORDER: SkillCategory[] = [
  'Engineering and Tech',
  'Business and Finance',
  'Medicine and Health',
  'Creative and Design',
  'Sciences and Research',
  'Education and Social Sciences',
];

const CATEGORY_COUNT = CATEGORY_ORDER.length;
const SECTOR_ARC = (2 * Math.PI) / CATEGORY_COUNT;

const SKILL_RADIUS_BY_LEVEL: Record<number, number> = {
  1: 550,
  2: 850,
  3: 1150,
};
const CATEGORY_LABEL_RADIUS = 320;
const JOB_RING_RADIUS = 1500;

/** Approximate rendered node size for overlap-safe arc spacing */
const SKILL_NODE_WIDTH = 148;
const JOB_NODE_WIDTH = 208;

const SKILL_NODE_OFFSET = { x: SKILL_NODE_WIDTH / 2, y: 55 };
const JOB_NODE_OFFSET = { x: JOB_NODE_WIDTH / 2, y: 70 };

const DEFAULT_ZOOM = 0.35;

function createCenteredViewport(
  center: { x: number; y: number } = LAYOUT_CENTER,
  zoom: number = DEFAULT_ZOOM,
): Viewport {
  const w = typeof window !== 'undefined' ? window.innerWidth : 1440;
  const h = typeof window !== 'undefined' ? window.innerHeight : 900;
  return {
    x: w / 2 - center.x * zoom,
    y: h / 2 - center.y * zoom,
    zoom,
  };
}

const DEFAULT_VIEWPORT = createCenteredViewport();

const FILTER_CATEGORIES: SkillCategory[] = CATEGORY_ORDER;

const CATEGORY_FILTER_COLORS: Record<SkillCategory, string> = {
  'Universal': '#22d3ee',
  'Engineering and Tech': '#3b82f6',
  'Business and Finance': '#f59e0b',
  'Medicine and Health': '#22c55e',
  'Creative and Design': '#a855f7',
  'Sciences and Research': '#06b6d4',
  'Education and Social Sciences': '#f97316',
};

const DIM_OPACITY = 0.2;
const CATEGORY_LABEL_OFFSET = { x: 52, y: 14 };

function polarToXY(cx: number, cy: number, radius: number, angleRad: number) {
  return {
    x: cx + radius * Math.cos(angleRad),
    y: cy + radius * Math.sin(angleRad),
  };
}

function nodePositionFromCenter(
  center: { x: number; y: number },
  offset: { x: number; y: number },
) {
  return { x: center.x - offset.x, y: center.y - offset.y };
}

function getCategoryIndex(category: SkillCategory): number {
  return CATEGORY_ORDER.indexOf(category);
}

function getSectorCenterAngle(categoryIndex: number): number {
  return categoryIndex * SECTOR_ARC - Math.PI / 2 + SECTOR_ARC / 2;
}

/** Minimum radians between peer nodes so bounding boxes do not overlap on a ring */
function minAngleStepForRadius(radius: number, nodeWidth: number): number {
  return (nodeWidth / radius) * 1.4;
}

/** Wider arc budget when a sector has more than two nodes on the same level */
function getIntraLevelAngleStep(count: number, radius: number): number {
  if (count <= 1) return 0;
  const minStep = minAngleStepForRadius(radius, SKILL_NODE_WIDTH);
  const sectorBudget = count > 2 ? SECTOR_ARC * 1.1 : SECTOR_ARC * 0.7;
  return Math.max(minStep, sectorBudget / (count - 1));
}

function getCategoryLabelPosition(categoryIndex: number): { x: number; y: number } {
  const angle = getSectorCenterAngle(categoryIndex);
  const center = polarToXY(LAYOUT_CENTER.x, LAYOUT_CENTER.y, CATEGORY_LABEL_RADIUS, angle);
  return nodePositionFromCenter(center, CATEGORY_LABEL_OFFSET);
}

function getSkillPosition(skill: Skill, allSkills: Skill[]): { x: number; y: number } {
  const categoryIndex = getCategoryIndex(skill.category);
  const peers = allSkills
    .filter(s => s.category === skill.category && s.level === skill.level)
    .sort((a, b) => a.id.localeCompare(b.id));
  const index = peers.findIndex(s => s.id === skill.id);
  const count = peers.length;
  const radius = SKILL_RADIUS_BY_LEVEL[skill.level] ?? SKILL_RADIUS_BY_LEVEL[2];
  const angleStep = getIntraLevelAngleStep(count, radius);
  const angleSpread = count <= 1 ? 0 : (index - (count - 1) / 2) * angleStep;
  const angle = getSectorCenterAngle(categoryIndex) + angleSpread;

  const center = polarToXY(LAYOUT_CENTER.x, LAYOUT_CENTER.y, radius, angle);
  return nodePositionFromCenter(center, SKILL_NODE_OFFSET);
}

function getJobPosition(index: number, total: number): { x: number; y: number } {
  const angle = (2 * Math.PI * (index + 0.5)) / total - Math.PI / 2;
  const center = polarToXY(LAYOUT_CENTER.x, LAYOUT_CENTER.y, JOB_RING_RADIUS, angle);
  return nodePositionFromCenter(center, JOB_NODE_OFFSET);
}

// ──────────────────────────────────────────────
// Edge styling helpers
// ──────────────────────────────────────────────
const acquiredStatuses = new Set(['self-declared', 'evidenced', 'verified']);

function buildEdges(
  skills: Skill[],
  activeJobId: string | null,
  categoryFilter: SkillCategory | null,
): Edge[] {
  const edges: Edge[] = [];
  const byCategory: Record<string, Skill[]> = {};
  for (const s of skills) {
    (byCategory[s.category] ??= []).push(s);
  }

  const categoriesToRender = categoryFilter
    ? [categoryFilter]
    : Object.keys(byCategory);

  for (const category of categoriesToRender) {
    const catSkills = byCategory[category];
    if (!catSkills) continue;
    const sorted = [...catSkills].sort((a, b) => a.level - b.level);
    for (let i = 0; i < sorted.length - 1; i++) {
      const src = sorted[i];
      const tgt = sorted[i + 1];
      const active = acquiredStatuses.has(src.status);
      edges.push({
        id: `e-${src.id}-${tgt.id}`,
        source: src.id,
        target: tgt.id,
        animated: active,
        style: {
          stroke: active ? '#22c55e' : '#374151',
          strokeWidth: active ? 2 : 1,
          opacity: active ? 0.8 : 0.4,
        },
      });
    }
  }

  if (activeJobId) {
    const job = JOBS.find(j => j.id === activeJobId);
    if (job) {
      job.requiredSkillIds.forEach(skillId => {
        const skill = skills.find(s => s.id === skillId);
        if (!skill) return;
        if (categoryFilter && skill.category !== categoryFilter) return;
        const active = acquiredStatuses.has(skill.status);
        edges.push({
          id: `e-${skillId}-${job.id}`,
          source: skillId,
          target: job.id,
          animated: active,
          style: {
            stroke: active ? '#22d3ee' : '#67e8f9',
            strokeWidth: active ? 2 : 1.5,
            strokeDasharray: active ? undefined : '4 4',
            opacity: active ? 0.9 : 0.65,
          },
        });
      });
    }
  }

  return edges;
}

function getCategoryFilterHighlight(
  category: SkillCategory,
  skills: Skill[],
): { skillIds: Set<string>; jobIds: Set<string> } {
  const skillIds = new Set(
    skills.filter(s => s.category === category).map(s => s.id),
  );
  const jobIds = new Set(
    JOBS.filter(job =>
      job.requiredSkillIds.some(id => {
        const skill = skills.find(s => s.id === id);
        return skill?.category === category;
      }),
    ).map(j => j.id),
  );
  return { skillIds, jobIds };
}

function EmployerView({ jobs, allSkills }: { jobs: Job[]; allSkills: Skill[] }) {
  const [selectedJob, setSelectedJob] = useState<Job | null>(jobs[0]);

  const getCandidateMatch = (candidate: { skills: { id: string }[] }, job: Job) => {
    const candidateSkillIds = new Set(candidate.skills.map((s: { id: string }) => s.id));
    const matched = job.requiredSkillIds.filter(id => candidateSkillIds.has(id));
    const missing = job.requiredSkillIds.filter(id => !candidateSkillIds.has(id));
    const percent = Math.round((matched.length / job.requiredSkillIds.length) * 100);
    return { matched, missing, percent };
  };

  const mockCandidates = [
    { id: 'c1', name: 'Aisha Rahman', role: 'Aspiring Data Analyst', skills: ['skill-sql', 'skill-analytics', 'skill-bi', 'skill-sql-query', 'skill-presentation', 'skill-writing'].map(id => ({ id })) },
    { id: 'c2', name: 'Marcus Tan', role: 'Junior Product Manager', skills: ['skill-agile', 'skill-product', 'skill-roadmap', 'skill-stakeholder', 'skill-presentation', 'skill-user-research'].map(id => ({ id })) },
    { id: 'c3', name: 'Priya Nair', role: 'UX Designer', skills: ['skill-figma', 'skill-ui-design', 'skill-user-research', 'skill-visual-story', 'skill-presentation'].map(id => ({ id })) },
    { id: 'c4', name: 'Kevin Lim', role: 'Full Stack Developer', skills: ['skill-react', 'skill-typescript', 'skill-nodejs', 'skill-sql', 'skill-api-design'].map(id => ({ id })) },
  ];

  const rankedCandidates = selectedJob
    ? [...mockCandidates].map(c => ({ ...c, match: getCandidateMatch(c, selectedJob) })).sort((a, b) => b.match.percent - a.match.percent)
    : [];

  const categoryColors: Record<string, string> = {
    Tech: '#3b82f6', Business: '#f59e0b', Communication: '#10b981', Creative: '#a855f7',
    Operations: '#f97316', 'Finance and Accounting': '#06b6d4', 'Product Management': '#ec4899',
    'Data and Analytics': '#8b5cf6', 'People and Culture': '#14b8a6', 'Legal and Compliance': '#f43f5e',
    'Healthcare and Life Sciences': '#22c55e', 'Education and Training': '#fb923c',
  };

  return (
    <div className="w-full h-screen bg-gray-950 overflow-y-auto pt-24">
      <div className="max-w-5xl mx-auto px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-white mb-1">Employer Dashboard</h2>
          <p className="text-gray-500 text-sm">Find verified candidates matched to your roles</p>
        </div>
        <div className="mb-8">
          <p className="text-xs text-gray-500 uppercase tracking-widest mb-3">Select a Role</p>
          <div className="flex flex-wrap gap-2">
            {jobs.slice(0, 8).map(job => (
              <button key={job.id} type="button" onClick={() => setSelectedJob(job)}
                className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${selectedJob?.id === job.id ? 'bg-cyan-400 text-gray-900 border-cyan-400' : 'bg-gray-900 text-gray-400 border-gray-700 hover:border-gray-500 hover:text-white'}`}>
                {job.title}
              </button>
            ))}
          </div>
        </div>
        {selectedJob && (
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-widest mb-3">Matched Candidates — {selectedJob.title}</p>
            <div className="flex flex-col gap-4">
              {rankedCandidates.map(({ id, name, role, match }) => (
                <div key={id} className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-cyan-400/20 border border-cyan-400/30 flex items-center justify-center text-cyan-400 font-bold text-sm">{name.charAt(0)}</div>
                      <div>
                        <p className="text-white font-bold text-sm">{name}</p>
                        <p className="text-gray-500 text-xs">{role}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-2xl font-bold ${match.percent >= 80 ? 'text-cyan-400' : match.percent >= 50 ? 'text-yellow-400' : 'text-gray-500'}`}>{match.percent}%</p>
                      <p className="text-[10px] text-gray-600 uppercase tracking-wider">match</p>
                    </div>
                  </div>
                  <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden mb-3">
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${match.percent}%`, background: match.percent >= 80 ? '#22d3ee' : match.percent >= 50 ? '#facc15' : '#374151' }} />
                  </div>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {match.matched.map(skillId => {
                      const skill = allSkills.find(s => s.id === skillId);
                      if (!skill) return null;
                      const color = categoryColors[skill.category] ?? '#6b7280';
                      return <span key={skillId} className="text-[10px] px-2 py-0.5 rounded-full font-medium border" style={{ color, borderColor: `${color}55`, background: `${color}15` }}>✓ {skill.name}</span>;
                    })}
                  </div>
                  {match.missing.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {match.missing.map(skillId => {
                        const skill = allSkills.find(s => s.id === skillId);
                        if (!skill) return null;
                        return <span key={skillId} className="text-[10px] px-2 py-0.5 rounded-full bg-gray-800 text-gray-600 border border-gray-700">✗ {skill.name}</span>;
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
export default function SkillTree() {
  const [skills, setSkills] = useState<Skill[]>(() => [...SKILLS]);
const [onboarding, setOnboarding] = useState(true);
  const [quizSkill, setQuizSkill] = useState<Skill | null>(null);
  const [jobModal, setJobModal] = useState<Job | null>(null);
  const [hoveredJobId, setHoveredJobId] = useState<string | null>(null);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<SkillCategory | null>(null);
  const [filterCollapsed, setFilterCollapsed] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showEmployer, setShowEmployer] = useState(false);
  const [activeField, setActiveField] = useState<SkillCategory | 'Universal'>('Universal');

  const activeJobId = selectedJobId ?? hoveredJobId;
  const universalVerifiedCount = skills.filter(
    s => s.category === 'Universal' && s.status === 'verified'
  ).length;
  
  const fieldUnlocked = true;

  const filterHighlight = useMemo(
    () =>
      categoryFilter ? getCategoryFilterHighlight(categoryFilter, skills) : null,
    [categoryFilter, skills],
  );

  const handleCategoryFilterClick = useCallback((category: SkillCategory | null) => {
    if (category === null) {
      setCategoryFilter(null);
      return;
    }
    setCategoryFilter(prev => (prev === category ? null : category));
  }, []);

  const activeJob = useMemo(
    () => (activeJobId ? JOBS.find(j => j.id === activeJobId) : undefined),
    [activeJobId],
  );

  const requiredSkillIds = useMemo(
    () => (activeJob ? new Set(activeJob.requiredSkillIds) : null),
    [activeJob],
  );

  const nodes = useMemo<Node[]>(() => {
    const transition = { transition: 'opacity 0.2s ease' };

    const visibleSkills = skills.filter(s => 
      activeField === 'Universal' 
        ? s.category === 'Universal'
        : s.category === activeField
    );
    
    const visibleJobs = activeField === 'Universal' 
      ? [] 
      : JOBS.filter(j => j.requiredSkillIds.some(id => {
          const skill = skills.find(s => s.id === id);
          return skill?.category === activeField;
        }));
        const skillNodes: Node[] = visibleSkills.map(skill => {
      let opacity = 1;

      if (filterHighlight) {
        opacity = filterHighlight.skillIds.has(skill.id) ? 1 : DIM_OPACITY;
      } else if (requiredSkillIds) {
        opacity = requiredSkillIds.has(skill.id) ? 1 : 0.35;
      }

      const prerequisiteBlocked = false;
      const unmetPrerequisites = getUnmetPrerequisites(skill, skills).map(s => ({
        id: s.id,
        name: s.name,
      }));

      return {
        id: skill.id,
        type: 'skillNode',
        position: getSkillPosition(skill, skills),
        data: { skill, prerequisiteBlocked, unmetPrerequisites },
        draggable: true,
        style: { opacity, ...transition },
      };
    });

    const jobNodes: Node[] = visibleJobs.map((job, i) => {
      let opacity = 1;

      if (filterHighlight) {
        opacity = filterHighlight.jobIds.has(job.id) ? 1 : DIM_OPACITY;
      } else if (activeJobId) {
        opacity = activeJobId === job.id ? 1 : 0.5;
      }

      return {
        id: job.id,
        type: 'jobNode',
        position: getJobPosition(i, JOBS.length),
        data: { job, skills },
        draggable: true,
        style: { opacity, ...transition },
      };
    });

    const categoryLabelNodes: Node[] = ([activeField] as SkillCategory[]).map((category, i) => {
      let opacity = 1;
      if (filterHighlight && categoryFilter !== category) {
        opacity = DIM_OPACITY;
      }

      return {
        id: `category-label-${category}`,
        type: 'categoryLabelNode',
        position: getCategoryLabelPosition(i),
        data: { label: category, color: CATEGORY_FILTER_COLORS[category] },
        draggable: false,
        selectable: false,
        connectable: false,
        focusable: false,
        zIndex: 0,
        style: { opacity, transition: 'opacity 0.2s ease' },
      };
    });

    return [...categoryLabelNodes, ...skillNodes, ...jobNodes];
  }, [skills, requiredSkillIds, activeJobId, filterHighlight, categoryFilter, activeField]);

  const edges = useMemo(
    () => buildEdges(skills, activeJobId, categoryFilter),
    [skills, activeJobId, categoryFilter],
  );

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    if (node.type === 'categoryLabelNode') return;

    if (node.type === 'skillNode') {
      const skill = skills.find(s => s.id === node.id);
      if (skill && arePrerequisitesMet(skill, skills)) {
        setQuizSkill(skill);
      }
      return;
    }

    if (node.type === 'jobNode') {
      setSelectedJobId(node.id);
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
  }, [skills]);

  const onNodeMouseEnter = useCallback((_: React.MouseEvent, node: Node) => {
    if (node.type === 'jobNode') {
      setHoveredJobId(node.id);
    }
  }, []);

  const onNodeMouseLeave = useCallback((_: React.MouseEvent, node: Node) => {
    if (node.type === 'jobNode') {
      setHoveredJobId(null);
    }
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedJobId(null);
  }, []);

  const handleVerified = useCallback((skillId: string) => {
    setSkills(prev =>
      prev.map(s => (s.id === skillId ? { ...s, status: 'verified' as const } : s)),
    );
  }, []);

  return (
    <div className="w-full h-screen bg-gray-950 relative overflow-hidden">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 px-8 pt-6 pb-4 bg-gradient-to-b from-gray-950 via-gray-950/90 to-transparent pointer-events-none">
        <div className="flex items-end justify-between">
          <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
              <div className="w-6 h-6 rounded-lg bg-cyan-400/20 border border-cyan-400/40 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_6px_rgba(34,211,238,0.8)]" />
              </div>
              <span className="text-cyan-400 font-bold text-lg tracking-tight">SkillForge</span>
              
<button
  type="button"
  onClick={() => { setShowProfile(p => !p); setShowEmployer(false); }}
  className="pointer-events-auto px-4 py-2 rounded-xl text-xs font-bold border border-gray-700 text-gray-300 hover:border-cyan-400 hover:text-cyan-400 transition-all"
>
  {showProfile ? 'Skill Tree' : 'My Profile'}
</button>
<button
  type="button"
  onClick={() => { setShowEmployer(e => !e); setShowProfile(false); }}
  className="pointer-events-auto px-4 py-2 rounded-xl text-xs font-bold border border-gray-700 text-gray-300 hover:border-cyan-400 hover:text-cyan-400 transition-all"
>
  {showEmployer ? 'Skill Tree' : 'Employer View'}
</button>
            </div>
            {!showProfile && (
  <>
    <h1 className="text-2xl font-bold text-white tracking-tight">Your Skill Tree</h1>
    <p className="text-sm text-gray-500 mt-0.5">Build skills. Unlock roles. Level up your career.</p>
  </>
)}

          </div>

          <div className="flex gap-4 pointer-events-auto">
            {[
              { label: 'Skills Acquired', value: skills.filter(s => s.status !== 'locked').length, total: skills.length, color: 'text-green-400' },
              { label: 'Verified', value: skills.filter(s => s.status === 'verified').length, total: skills.length, color: 'text-yellow-400' },
              { label: 'Jobs Unlocked', value: JOBS.filter(j => j.requiredSkillIds.every(id => skills.find(s => s.id === id)?.status === 'verified')).length, total: JOBS.length, color: 'text-cyan-400' },
            ].map(stat => (
              <div key={stat.label} className="bg-gray-900/80 border border-gray-700 rounded-xl px-4 py-2.5 backdrop-blur-sm text-center">
                <p className={`text-xl font-bold ${stat.color}`}>{stat.value}<span className="text-gray-600 text-sm">/{stat.total}</span></p>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      

      {showProfile ? (
  <ProfilePage skills={skills} jobs={JOBS} />
) : showEmployer ? (
  <EmployerView jobs={JOBS} allSkills={skills} />
) : (
<div className="absolute inset-0" style={{ zIndex: 1 }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodeClick={onNodeClick}
          onNodeMouseEnter={onNodeMouseEnter}
          onNodeMouseLeave={onNodeMouseLeave}
          onPaneClick={onPaneClick}
          minZoom={0.25}
          maxZoom={1.8}
          defaultViewport={DEFAULT_VIEWPORT}
          proOptions={{ hideAttribution: true }}
          style={{ background: 'transparent' }}
        >
        <Panel position="top-left" style={{ margin: '80px 0 0 0' }}>
  <div className="flex gap-2 flex-wrap">
    <button
      type="button"
      onClick={() => setActiveField('Universal')}
      className={`px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-all ${
        activeField === 'Universal'
          ? 'bg-cyan-400 text-gray-900 border-cyan-400'
          : 'bg-gray-900/80 text-cyan-400 border-cyan-400/50 hover:border-cyan-400'
      }`}
    >
      Foundation
    </button>
    {([
      'Engineering and Tech',
      'Business and Finance',
      'Medicine and Health',
      'Creative and Design',
      'Sciences and Research',
      'Education and Social Sciences',
    ] as SkillCategory[]).map(field => (
      <button
        key={field}
        type="button"
        onClick={() => fieldUnlocked ? setActiveField(field) : null}
        className={`px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-all ${
          activeField === field
            ? 'border-current opacity-100'
            : fieldUnlocked
              ? 'opacity-70 hover:opacity-100'
              : 'opacity-30 cursor-not-allowed'
        }`}
        style={{
          color: CATEGORY_FILTER_COLORS[field],
          borderColor: activeField === field ? CATEGORY_FILTER_COLORS[field] : `${CATEGORY_FILTER_COLORS[field]}55`,
          backgroundColor: activeField === field ? `${CATEGORY_FILTER_COLORS[field]}20` : 'transparent',
        }}
        title={!fieldUnlocked ? 'Verify 4 foundation skills to unlock field trees' : field}
      >
        {field.split(' ')[0]}
      </button>
    ))}
  </div>
</Panel>
        <Background
          variant={BackgroundVariant.Dots}
          gap={24}
          size={1}
          color="#1f2937"
        />
        <Controls
          style={{
            background: '#111827',
            border: '1px solid #374151',
            borderRadius: 12,
          }}
        />
        <MiniMap
          style={{
            background: '#0f172a',
            border: '1px solid #374151',
            borderRadius: 12,
          }}
          nodeColor={(node) => {
            if (node.type === 'jobNode') return '#22d3ee33';
            const skill = skills.find(s => s.id === node.id);
            if (!skill || skill.status === 'locked') return '#374151';
            if (skill.status === 'verified') return '#facc15';
            return '#22c55e';
          }}
          maskColor="rgba(0,0,0,0.6)"
        />
        </ReactFlow>
      </div>
)}

{false && (
  <div className="absolute left-6 top-36 z-10 pointer-events-auto">
        <Legend />
      </div>
)}
      {/* Category filter — bottom left, scrollable */}
      {false && (
        <div className="absolute left-6 bottom-6 z-10 pointer-events-auto w-44">
              <div className="bg-gray-900/90 border border-gray-700 rounded-xl backdrop-blur-sm overflow-hidden">
          <div className="flex items-center justify-between gap-1 px-2 py-1.5 border-b border-gray-700/80">
            <p className="text-[9px] text-gray-500 uppercase tracking-widest font-semibold">
              Filter
            </p>
            <button
              type="button"
              onClick={() => setFilterCollapsed(c => !c)}
              className="p-0.5 rounded text-gray-500 hover:text-gray-300 hover:bg-gray-800 transition-colors"
              aria-label={filterCollapsed ? 'Expand filter' : 'Collapse filter'}
            >
              {filterCollapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
            </button>
          </div>
          {!filterCollapsed && (
            <div className="max-h-[42vh] overflow-y-auto p-2 flex flex-col gap-1">
              <button
                type="button"
                onClick={() => handleCategoryFilterClick(null)}
                className={`
                  w-full px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border transition-all shrink-0
                  ${categoryFilter === null
                    ? 'bg-gray-100 text-gray-900 border-gray-200'
                    : 'bg-gray-900/80 text-gray-400 border-gray-700 hover:border-gray-500 hover:text-gray-200'}
                `}
              >
                All
              </button>
              {FILTER_CATEGORIES.map(category => {
                const color = CATEGORY_FILTER_COLORS[category];
                const isActive = categoryFilter === category;
                return (
                  <button
                    key={category}
                    type="button"
                    onClick={() => handleCategoryFilterClick(category)}
                    title={category}
                    className="w-full px-2 py-1 rounded-full text-[10px] font-bold border transition-all truncate shrink-0"
                    style={
                      isActive
                        ? {
                            color: '#0f172a',
                            backgroundColor: color,
                            borderColor: color,
                            boxShadow: `0 0 10px ${color}55`,
                          }
                        : {
                            color,
                            backgroundColor: `${color}14`,
                            borderColor: `${color}55`,
                          }
                    }
                  >
                    {category}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
)}
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

      {onboarding && (
        <OnboardingModal
          skills={skills}
          onComplete={(updatedSkills) => {
            setSkills(updatedSkills);
            setOnboarding(false);
          }}
        />
      )}
    </div>
  );
}
