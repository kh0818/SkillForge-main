import type { Job, Skill, SkillCategory } from '../data/mockData';

export type MapScope = 'Galaxy' | SkillCategory;

export interface Point {
  x: number;
  y: number;
}

export interface FieldTheme {
  label: string;
  color: string;
  shadow: string;
}

export const FIELD_CATEGORIES: SkillCategory[] = [
  'Universal',
  'Engineering and Tech',
  'Business and Finance',
  'Medicine and Health',
  'Creative and Design',
  'Sciences and Research',
  'Education and Social Sciences',
];

export const GALAXY_CENTER: Point = { x: 2500, y: 2050 };
export const DEFAULT_GALAXY_ZOOM = 0.18;
export const DEFAULT_FIELD_ZOOM = 0.34;

export const FIELD_THEMES: Record<SkillCategory, FieldTheme> = {
  Universal: { label: 'Universal Core', color: '#22d3ee', shadow: '#0891b2' },
  'Engineering and Tech': { label: 'Engineering / Tech', color: '#3b82f6', shadow: '#1d4ed8' },
  'Business and Finance': { label: 'Business / Finance', color: '#f59e0b', shadow: '#b45309' },
  'Medicine and Health': { label: 'Medicine / Health', color: '#22c55e', shadow: '#15803d' },
  'Creative and Design': { label: 'Creative / Design', color: '#a855f7', shadow: '#7e22ce' },
  'Sciences and Research': { label: 'Sciences / Research', color: '#06b6d4', shadow: '#0e7490' },
  'Education and Social Sciences': { label: 'Education / Social Sciences', color: '#f97316', shadow: '#c2410c' },
};

const FIELD_SYSTEM_CENTERS: Record<SkillCategory, Point> = {
  Universal: GALAXY_CENTER,
  'Engineering and Tech': { x: GALAXY_CENTER.x + 2360, y: GALAXY_CENTER.y - 260 },
  'Business and Finance': { x: GALAXY_CENTER.x + 2020, y: GALAXY_CENTER.y + 2480 },
  'Medicine and Health': { x: GALAXY_CENTER.x - 480, y: GALAXY_CENTER.y + 2760 },
  'Creative and Design': { x: GALAXY_CENTER.x - 2440, y: GALAXY_CENTER.y + 540 },
  'Sciences and Research': { x: GALAXY_CENTER.x - 1700, y: GALAXY_CENTER.y - 2420 },
  'Education and Social Sciences': { x: GALAXY_CENTER.x + 500, y: GALAXY_CENTER.y - 2600 },
};

const FIELD_ORBIT_RADII: Record<1 | 2 | 3, number> = {
  1: 200,
  2: 430,
  3: 640,
};

const JOB_ORBIT_DISTANCE_FACTOR = 2.3;

const JOB_ORBIT_RADII: Record<SkillCategory, number> = {
  Universal: FIELD_ORBIT_RADII[2] + (FIELD_ORBIT_RADII[3] - FIELD_ORBIT_RADII[2]) * JOB_ORBIT_DISTANCE_FACTOR,
  'Engineering and Tech': FIELD_ORBIT_RADII[2] + (FIELD_ORBIT_RADII[3] - FIELD_ORBIT_RADII[2]) * JOB_ORBIT_DISTANCE_FACTOR,
  'Business and Finance': FIELD_ORBIT_RADII[2] + (FIELD_ORBIT_RADII[3] - FIELD_ORBIT_RADII[2]) * JOB_ORBIT_DISTANCE_FACTOR,
  'Medicine and Health': FIELD_ORBIT_RADII[2] + (FIELD_ORBIT_RADII[3] - FIELD_ORBIT_RADII[2]) * JOB_ORBIT_DISTANCE_FACTOR,
  'Creative and Design': FIELD_ORBIT_RADII[2] + (FIELD_ORBIT_RADII[3] - FIELD_ORBIT_RADII[2]) * JOB_ORBIT_DISTANCE_FACTOR,
  'Sciences and Research': FIELD_ORBIT_RADII[2] + (FIELD_ORBIT_RADII[3] - FIELD_ORBIT_RADII[2]) * JOB_ORBIT_DISTANCE_FACTOR,
  'Education and Social Sciences': FIELD_ORBIT_RADII[2] + (FIELD_ORBIT_RADII[3] - FIELD_ORBIT_RADII[2]) * JOB_ORBIT_DISTANCE_FACTOR,
};

const SKILL_NODE_OFFSET: Point = { x: 72, y: 44 };
const JOB_NODE_OFFSET: Point = { x: 86, y: 68 };
const FIELD_NODE_OFFSET: Point = { x: 110, y: 110 };

export function polarToXY(center: Point, radius: number, angleRad: number): Point {
  return {
    x: center.x + radius * Math.cos(angleRad),
    y: center.y + radius * Math.sin(angleRad),
  };
}

export function nodePositionFromCenter(center: Point, offset: Point): Point {
  return { x: center.x - offset.x, y: center.y - offset.y };
}

export function getFieldSystemCenter(category: SkillCategory): Point {
  return FIELD_SYSTEM_CENTERS[category];
}

export function getFieldPlanetPosition(category: SkillCategory): Point {
  return nodePositionFromCenter(getFieldSystemCenter(category), FIELD_NODE_OFFSET);
}

export function getSkillOrbitRadius(level: Skill['level']): number {
  return FIELD_ORBIT_RADII[level];
}

export function getSkillPosition(skill: Skill, allSkills: Skill[]): Point {
  const center = getFieldSystemCenter(skill.category);
  const peers = allSkills
    .filter((candidate) => candidate.category === skill.category && candidate.level === skill.level)
    .sort((a, b) => a.id.localeCompare(b.id));
  const index = Math.max(0, peers.findIndex((candidate) => candidate.id === skill.id));
  const count = Math.max(1, peers.length);
  const radius = getSkillOrbitRadius(skill.level);
  const angularStep = (Math.PI * 2) / count;
  const levelOffset = skill.level === 1 ? -Math.PI / 2 : skill.level === 2 ? -Math.PI / 2 + angularStep / 2 : -Math.PI / 2 + angularStep / 3;
  const centerPoint = polarToXY(center, radius, levelOffset + index * angularStep);

  return nodePositionFromCenter(centerPoint, SKILL_NODE_OFFSET);
}

function getPrimaryJobCategory(job: Job, skills: Skill[]): SkillCategory {
  const counts = new Map<SkillCategory, number>();
  for (const skillId of job.requiredSkillIds) {
    const skill = skills.find((candidate) => candidate.id === skillId);
    if (!skill) continue;
    counts.set(skill.category, (counts.get(skill.category) ?? 0) + 1);
  }

  let primary: SkillCategory = 'Universal';
  let highest = -1;
  for (const category of FIELD_CATEGORIES) {
    const count = counts.get(category) ?? 0;
    if (count > highest) {
      primary = category;
      highest = count;
    }
  }
  return primary;
}

export function getJobPosition(job: Job, visibleJobs: Job[], skills: Skill[]): Point {
  const primaryCategory = getPrimaryJobCategory(job, skills);
  const categoryJobs = visibleJobs
    .filter((candidate) => getPrimaryJobCategory(candidate, skills) === primaryCategory)
    .sort((a, b) => a.id.localeCompare(b.id));

  const index = Math.max(0, categoryJobs.findIndex((candidate) => candidate.id === job.id));
  const count = Math.max(1, categoryJobs.length);
  const fieldCenter = getFieldSystemCenter(primaryCategory);
  const radius = JOB_ORBIT_RADII[primaryCategory];
  const angleStep = (Math.PI * 2) / count;
  const angle = -Math.PI / 2 + index * angleStep;
  const centerPoint = polarToXY(fieldCenter, radius, angle);

  return nodePositionFromCenter(centerPoint, JOB_NODE_OFFSET);
}

export function getScopeCenter(scope: MapScope): Point {
  return scope === 'Galaxy' ? GALAXY_CENTER : getFieldSystemCenter(scope);
}

export function isJobInScope(job: Job, scope: MapScope, skills: Skill[]): boolean {
  if (scope === 'Galaxy') return true;

  return job.requiredSkillIds.some((skillId) => {
    const skill = skills.find((candidate) => candidate.id === skillId);
    return skill?.category === scope;
  });
}
