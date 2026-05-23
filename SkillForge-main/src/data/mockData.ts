export type SkillStatus = 'locked' | 'self-declared' | 'evidenced' | 'verified';
export type SkillCategory = 'Tech' | 'Business' | 'Communication';

export interface Skill {
  id: string;
  name: string;
  category: SkillCategory;
  description: string;
  status: SkillStatus;
  level: number; // 1-3 for tree depth
}

export interface Job {
  id: string;
  title: string;
  description: string;
  requiredSkillIds: string[];
  isUnlocked?: boolean;
}

export const SKILLS: Skill[] = [
  // Tech skills
  { id: 'skill-react', name: 'React', category: 'Tech', description: 'Build dynamic UIs with React', status: 'verified', level: 1 },
  { id: 'skill-typescript', name: 'TypeScript', category: 'Tech', description: 'Type-safe JavaScript development', status: 'evidenced', level: 1 },
  { id: 'skill-nodejs', name: 'Node.js', category: 'Tech', description: 'Server-side JavaScript runtime', status: 'self-declared', level: 2 },
  { id: 'skill-sql', name: 'SQL', category: 'Tech', description: 'Query and manage relational databases', status: 'verified', level: 2 },
  { id: 'skill-docker', name: 'Docker', category: 'Tech', description: 'Containerise and deploy applications', status: 'locked', level: 3 },

  // Business skills
  { id: 'skill-pm', name: 'Project Mgmt', category: 'Business', description: 'Plan, execute and deliver projects on time', status: 'evidenced', level: 1 },
  { id: 'skill-agile', name: 'Agile / Scrum', category: 'Business', description: 'Iterative development and sprint planning', status: 'self-declared', level: 1 },
  { id: 'skill-analytics', name: 'Data Analytics', category: 'Business', description: 'Derive insights from data sets', status: 'verified', level: 2 },
  { id: 'skill-product', name: 'Product Thinking', category: 'Business', description: 'User-centric product design', status: 'locked', level: 2 },
  { id: 'skill-finance', name: 'Finance Basics', category: 'Business', description: 'Understand P&L, budgeting, and forecasting', status: 'locked', level: 3 },

  // Communication skills
  { id: 'skill-writing', name: 'Business Writing', category: 'Communication', description: 'Craft clear, professional documents', status: 'verified', level: 1 },
  { id: 'skill-presentation', name: 'Presentation', category: 'Communication', description: 'Deliver compelling presentations', status: 'evidenced', level: 1 },
  { id: 'skill-negotiation', name: 'Negotiation', category: 'Communication', description: 'Reach mutually beneficial agreements', status: 'self-declared', level: 2 },
  { id: 'skill-leadership', name: 'Leadership', category: 'Communication', description: 'Inspire and guide teams toward a vision', status: 'locked', level: 2 },
  { id: 'skill-stakeholder', name: 'Stakeholder Mgmt', category: 'Communication', description: 'Manage expectations across diverse groups', status: 'locked', level: 3 },
];

export const JOBS: Job[] = [
  {
    id: 'job-frontend',
    title: 'Frontend Developer',
    description: 'Build beautiful, performant web interfaces',
    requiredSkillIds: ['skill-react', 'skill-typescript', 'skill-sql'],
  },
  {
    id: 'job-product-manager',
    title: 'Product Manager',
    description: 'Lead product discovery and delivery',
    requiredSkillIds: ['skill-agile', 'skill-analytics', 'skill-product', 'skill-presentation'],
  },
  {
    id: 'job-tech-lead',
    title: 'Tech Lead',
    description: 'Drive technical direction and mentor engineers',
    requiredSkillIds: ['skill-react', 'skill-nodejs', 'skill-docker', 'skill-leadership', 'skill-stakeholder'],
  },
];
