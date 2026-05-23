export type SkillStatus = 'locked' | 'self-declared' | 'evidenced' | 'verified';
export type SkillCategory =
  | 'Universal'
  | 'Engineering and Tech'
  | 'Business and Finance'
  | 'Medicine and Health'
  | 'Creative and Design'
  | 'Sciences and Research'
  | 'Education and Social Sciences';
export interface Skill {
  id: string;
  name: string;
  category: SkillCategory;
  description: string;
  status: SkillStatus;
  level: number;
  skillLevel: 0 | 1 | 2 | 3;
  prerequisiteIds?: string[];
}

export interface Job {
  id: string;
  title: string;
  description: string;
  requiredSkillIds: string[];
}

export function arePrerequisitesMet(skill: Skill, allSkills: Skill[]): boolean {
  if (!skill.prerequisiteIds?.length) return true;
  return skill.prerequisiteIds.every(
    id => allSkills.find(s => s.id === id)?.status === 'verified',
  );
}

export function getUnmetPrerequisites(skill: Skill, allSkills: Skill[]): Skill[] {
  if (!skill.prerequisiteIds?.length) return [];
  return skill.prerequisiteIds
    .map(id => allSkills.find(s => s.id === id))
    .filter((s): s is Skill => !!s && s.status !== 'verified');
}

export const SKILLS: Skill[] = [
// ── Universal Foundation ─────────────────────────────────────────
{ id: 'u-business-comms', name: 'Business Communication', category: 'Universal', description: 'Write professional emails, reports, and documents clearly in English for workplace contexts', status: 'locked', level: 1, skillLevel: 0 },
{ id: 'u-digital-literacy', name: 'Digital Literacy', category: 'Universal', description: 'Navigate digital tools, platforms, and basic cybersecurity practices confidently', status: 'locked', level: 1, skillLevel: 0 },
{ id: 'u-data-interpretation', name: 'Data Interpretation', category: 'Universal', description: 'Read charts, tables, and basic statistics to support data-informed decisions', status: 'locked', level: 2, skillLevel: 0 },
{ id: 'u-project-basics', name: 'Project Basics', category: 'Universal', description: 'Understand timelines, deliverables, scope, and stakeholder roles in any project', status: 'locked', level: 2, skillLevel: 0 },
{ id: 'u-problem-solving', name: 'Problem Solving Frameworks', category: 'Universal', description: 'Apply structured approaches like root cause analysis, SWOT, and 5 Whys to workplace problems', status: 'locked', level: 2, skillLevel: 0 },
{ id: 'u-collaboration', name: 'Workplace Collaboration', category: 'Universal', description: 'Work effectively in teams, resolve conflict, and give and receive constructive feedback', status: 'locked', level: 2, skillLevel: 0 },
{ id: 'u-financial-awareness', name: 'Financial Awareness', category: 'Universal', description: 'Read a basic P&L, understand budgets, and apply personal and business finance fundamentals', status: 'locked', level: 3, skillLevel: 0 },
{ id: 'u-ethics', name: 'Ethics & Professional Conduct', category: 'Universal', description: 'Apply workplace ethics, data privacy principles, and professional standards in SEA contexts', status: 'locked', level: 3, skillLevel: 0 },

  // ── Engineering and Tech ──────────────────────────────────────────
  { id: 'et-programming', name: 'Programming Fundamentals', category: 'Engineering and Tech', description: 'Write clean, structured code in at least one language used across SEA product teams', status: 'verified', level: 1, skillLevel: 3 },
  { id: 'et-data-structures', name: 'Data Structures & Algorithms', category: 'Engineering and Tech', description: 'Design efficient solutions for real-world engineering problems at scale', status: 'evidenced', level: 1, skillLevel: 2 },
  { id: 'et-systems-design', name: 'Systems Design', category: 'Engineering and Tech', description: 'Architect scalable back-end systems for high-traffic regional platforms', status: 'self-declared', level: 2, skillLevel: 1, prerequisiteIds: ['et-programming', 'et-data-structures'] },
  { id: 'et-cloud', name: 'Cloud Infrastructure', category: 'Engineering and Tech', description: 'Deploy and manage workloads on AWS, GCP, or Azure across SEA regions', status: 'locked', level: 2, skillLevel: 0, prerequisiteIds: ['et-programming', 'et-data-structures'] },
  { id: 'et-devops', name: 'DevOps & CI/CD', category: 'Engineering and Tech', description: 'Build automated pipelines for fast, reliable software delivery', status: 'locked', level: 3, skillLevel: 0, prerequisiteIds: ['et-systems-design', 'et-cloud'] },
  { id: 'et-security', name: 'Cybersecurity Fundamentals', category: 'Engineering and Tech', description: 'Protect systems and data against threats common in SEA digital infrastructure', status: 'locked', level: 3, skillLevel: 0, prerequisiteIds: ['et-cloud', 'et-systems-design'] },

  // ── Business and Finance ─────────────────────────────────────────
  { id: 'bf-accounting', name: 'Accounting Principles', category: 'Business and Finance', description: 'Apply double-entry bookkeeping and financial reporting standards across ASEAN entities', status: 'verified', level: 1, skillLevel: 3 },
  { id: 'bf-business-comms', name: 'Business Communication', category: 'Business and Finance', description: 'Write and present clearly in English for regional stakeholders and clients', status: 'evidenced', level: 1, skillLevel: 2 },
  { id: 'bf-financial-analysis', name: 'Financial Analysis', category: 'Business and Finance', description: 'Interpret P&L, balance sheets, and cash flows for SEA business decisions', status: 'self-declared', level: 2, skillLevel: 1, prerequisiteIds: ['bf-accounting', 'bf-business-comms'] },
  { id: 'bf-corporate-law', name: 'Corporate Law Basics', category: 'Business and Finance', description: 'Navigate company registration, contracts, and compliance across ASEAN jurisdictions', status: 'locked', level: 2, skillLevel: 0, prerequisiteIds: ['bf-accounting', 'bf-business-comms'] },
  { id: 'bf-investment', name: 'Investment & Valuation', category: 'Business and Finance', description: 'Value companies and assets for M&A, fundraising, and capital markets in SEA', status: 'locked', level: 3, skillLevel: 0, prerequisiteIds: ['bf-financial-analysis', 'bf-corporate-law'] },
  { id: 'bf-strategy', name: 'Business Strategy', category: 'Business and Finance', description: 'Develop market entry and growth strategies for competitive ASEAN markets', status: 'locked', level: 3, skillLevel: 0, prerequisiteIds: ['bf-financial-analysis', 'bf-corporate-law'] },

  // ── Medicine and Health ──────────────────────────────────────────
  { id: 'mh-anatomy', name: 'Human Anatomy & Physiology', category: 'Medicine and Health', description: 'Understand body systems as the foundation for clinical and health-tech roles', status: 'verified', level: 1, skillLevel: 3 },
  { id: 'mh-clinical-skills', name: 'Clinical Assessment Skills', category: 'Medicine and Health', description: 'Conduct patient history taking and physical examinations in clinical settings', status: 'evidenced', level: 1, skillLevel: 2 },
  { id: 'mh-pharmacology', name: 'Pharmacology', category: 'Medicine and Health', description: 'Apply drug mechanisms and dosing safely within regional formularies', status: 'self-declared', level: 2, skillLevel: 1, prerequisiteIds: ['mh-anatomy', 'mh-clinical-skills'] },
  { id: 'mh-public-health', name: 'Public Health & Epidemiology', category: 'Medicine and Health', description: 'Analyse disease patterns and design interventions for SEA populations', status: 'locked', level: 2, skillLevel: 0, prerequisiteIds: ['mh-anatomy', 'mh-clinical-skills'] },
  { id: 'mh-health-informatics', name: 'Health Informatics', category: 'Medicine and Health', description: 'Manage clinical data systems and EMR platforms in digitising health systems', status: 'locked', level: 3, skillLevel: 0, prerequisiteIds: ['mh-pharmacology', 'mh-public-health'] },
  { id: 'mh-research', name: 'Clinical Research & Trials', category: 'Medicine and Health', description: 'Design and conduct studies under GCP standards for SEA health research bodies', status: 'locked', level: 3, skillLevel: 0, prerequisiteIds: ['mh-public-health', 'mh-pharmacology'] },

  // ── Creative and Design ──────────────────────────────────────────
  { id: 'cd-visual-design', name: 'Visual Design Principles', category: 'Creative and Design', description: 'Apply colour, typography, and layout for digital and print media across SEA markets', status: 'verified', level: 1, skillLevel: 3 },
  { id: 'cd-storytelling', name: 'Creative Storytelling', category: 'Creative and Design', description: 'Craft narratives that resonate with diverse ASEAN cultural audiences', status: 'evidenced', level: 1, skillLevel: 2 },
  { id: 'cd-ux', name: 'UX Research & Design', category: 'Creative and Design', description: 'Design user-centred products for mobile-first and multilingual SEA users', status: 'self-declared', level: 2, skillLevel: 1, prerequisiteIds: ['cd-visual-design', 'cd-storytelling'] },
  { id: 'cd-content', name: 'Content Strategy', category: 'Creative and Design', description: 'Plan and govern content across brand, product, and regional campaign touchpoints', status: 'locked', level: 2, skillLevel: 0, prerequisiteIds: ['cd-visual-design', 'cd-storytelling'] },
  { id: 'cd-brand', name: 'Brand Identity & Strategy', category: 'Creative and Design', description: 'Build consistent brand systems for companies expanding across ASEAN', status: 'locked', level: 3, skillLevel: 0, prerequisiteIds: ['cd-ux', 'cd-content'] },
  { id: 'cd-motion', name: 'Motion & Digital Media', category: 'Creative and Design', description: 'Produce video, animation, and interactive content for social and product surfaces', status: 'locked', level: 3, skillLevel: 0, prerequisiteIds: ['cd-content', 'cd-visual-design'] },

  // ── Sciences and Research ────────────────────────────────────────
  { id: 'sr-research-methods', name: 'Research Methodology', category: 'Sciences and Research', description: 'Design rigorous studies and experiments for academic and industry research', status: 'verified', level: 1, skillLevel: 3 },
  { id: 'sr-statistics', name: 'Statistics & Data Analysis', category: 'Sciences and Research', description: 'Apply statistical methods to extract insights from complex datasets', status: 'evidenced', level: 1, skillLevel: 2 },
  { id: 'sr-lab-skills', name: 'Laboratory Techniques', category: 'Sciences and Research', description: 'Conduct experiments safely and accurately in life science and chemistry labs', status: 'self-declared', level: 2, skillLevel: 1, prerequisiteIds: ['sr-research-methods', 'sr-statistics'] },
  { id: 'sr-data-science', name: 'Data Science & Modelling', category: 'Sciences and Research', description: 'Build predictive models for biotech, agri-tech, and environmental applications in SEA', status: 'locked', level: 2, skillLevel: 0, prerequisiteIds: ['sr-statistics', 'sr-research-methods'] },
  { id: 'sr-bioinformatics', name: 'Bioinformatics', category: 'Sciences and Research', description: 'Analyse genomic and biological data for health and agricultural research', status: 'locked', level: 3, skillLevel: 0, prerequisiteIds: ['sr-lab-skills', 'sr-data-science'] },
  { id: 'sr-environmental', name: 'Environmental Science & Policy', category: 'Sciences and Research', description: 'Assess environmental impact and advise on sustainability policy across ASEAN', status: 'locked', level: 3, skillLevel: 0, prerequisiteIds: ['sr-data-science', 'sr-lab-skills'] },

  // ── Education and Social Sciences ────────────────────────────────
  { id: 'es-communication', name: 'Interpersonal Communication', category: 'Education and Social Sciences', description: 'Build rapport and communicate effectively across diverse SEA communities', status: 'verified', level: 1, skillLevel: 3 },
  { id: 'es-psychology', name: 'Psychology & Human Behaviour', category: 'Education and Social Sciences', description: 'Apply behavioural principles to education, counselling, and social work', status: 'evidenced', level: 1, skillLevel: 2 },
  { id: 'es-curriculum', name: 'Curriculum & Instructional Design', category: 'Education and Social Sciences', description: 'Design learning programmes aligned with national frameworks and employer needs', status: 'self-declared', level: 2, skillLevel: 1, prerequisiteIds: ['es-communication', 'es-psychology'] },
  { id: 'es-community', name: 'Community Development', category: 'Education and Social Sciences', description: 'Plan and implement social programmes for underserved communities across SEA', status: 'locked', level: 2, skillLevel: 0, prerequisiteIds: ['es-communication', 'es-psychology'] },
  { id: 'es-policy', name: 'Social Policy & Research', category: 'Education and Social Sciences', description: 'Analyse and advise on public policy affecting education, welfare, and justice', status: 'locked', level: 3, skillLevel: 0, prerequisiteIds: ['es-curriculum', 'es-community'] },
  { id: 'es-leadership', name: 'Organisational Leadership', category: 'Education and Social Sciences', description: 'Lead teams and institutions through change in public and non-profit sectors', status: 'locked', level: 3, skillLevel: 0, prerequisiteIds: ['es-community', 'es-curriculum'] },
];

export const JOBS: Job[] = [

  // Engineering and Tech
  {
    id: 'job-software-engineer',
    title: 'Software Engineer',
    description: 'Build and maintain scalable software products for regional startups and enterprises',
    requiredSkillIds: ['et-programming', 'et-data-structures', 'et-systems-design', 'et-cloud'],
  },
  {
    id: 'job-devops-engineer',
    title: 'DevOps Engineer',
    description: 'Automate infrastructure and delivery pipelines for fast-moving product teams',
    requiredSkillIds: ['et-cloud', 'et-systems-design', 'et-devops', 'et-security'],
  },
  {
    id: 'job-cybersecurity-analyst',
    title: 'Cybersecurity Analyst',
    description: 'Protect digital assets and respond to threats across regional enterprise networks',
    requiredSkillIds: ['et-programming', 'et-cloud', 'et-security', 'et-systems-design'],
  },

  // Business and Finance
  {
    id: 'job-financial-analyst',
    title: 'Financial Analyst',
    description: 'Model financial performance and support investment decisions for regional entities',
    requiredSkillIds: ['bf-accounting', 'bf-financial-analysis', 'bf-investment', 'bf-business-comms'],
  },
  {
    id: 'job-corporate-lawyer',
    title: 'Corporate Lawyer',
    description: 'Advise on transactions, contracts, and regulatory matters across ASEAN jurisdictions',
    requiredSkillIds: ['bf-corporate-law', 'bf-business-comms', 'bf-strategy', 'bf-financial-analysis'],
  },
  {
    id: 'job-strategy-consultant',
    title: 'Strategy Consultant',
    description: 'Help regional businesses solve complex problems and capture growth opportunities',
    requiredSkillIds: ['bf-strategy', 'bf-financial-analysis', 'bf-business-comms', 'bf-investment'],
  },

  // Medicine and Health
  {
    id: 'job-clinical-officer',
    title: 'Clinical Officer',
    description: 'Deliver patient care and clinical services in hospitals and community health settings',
    requiredSkillIds: ['mh-anatomy', 'mh-clinical-skills', 'mh-pharmacology', 'mh-public-health'],
  },
  {
    id: 'job-health-informatics',
    title: 'Health Informatics Specialist',
    description: 'Implement and manage digital health systems for hospitals and MOH agencies',
    requiredSkillIds: ['mh-clinical-skills', 'mh-health-informatics', 'mh-public-health', 'mh-anatomy'],
  },
  {
    id: 'job-clinical-researcher',
    title: 'Clinical Research Associate',
    description: 'Support and monitor clinical trials for pharmaceutical and biotech firms in SEA',
    requiredSkillIds: ['mh-research', 'mh-pharmacology', 'mh-public-health', 'mh-clinical-skills'],
  },

  // Creative and Design
  {
    id: 'job-ux-designer',
    title: 'UX Designer',
    description: 'Design intuitive digital experiences for diverse users across ASEAN markets',
    requiredSkillIds: ['cd-visual-design', 'cd-ux', 'cd-storytelling', 'cd-content'],
  },
  {
    id: 'job-brand-strategist',
    title: 'Brand Strategist',
    description: 'Build and evolve brand identities for companies scaling across Southeast Asia',
    requiredSkillIds: ['cd-brand', 'cd-storytelling', 'cd-content', 'cd-visual-design'],
  },
  {
    id: 'job-content-producer',
    title: 'Content Producer',
    description: 'Create and distribute multimedia content across digital platforms in SEA',
    requiredSkillIds: ['cd-motion', 'cd-content', 'cd-storytelling', 'cd-visual-design'],
  },

  // Sciences and Research
  {
    id: 'job-data-scientist',
    title: 'Data Scientist',
    description: 'Build models and derive insights from complex datasets for regional product teams',
    requiredSkillIds: ['sr-statistics', 'sr-data-science', 'sr-research-methods', 'sr-bioinformatics'],
  },
  {
    id: 'job-research-scientist',
    title: 'Research Scientist',
    description: 'Conduct applied research in life sciences, agri-tech, or environmental sectors',
    requiredSkillIds: ['sr-lab-skills', 'sr-research-methods', 'sr-bioinformatics', 'sr-statistics'],
  },
  {
    id: 'job-environmental-consultant',
    title: 'Environmental Consultant',
    description: 'Advise on sustainability, EIA, and environmental compliance across ASEAN projects',
    requiredSkillIds: ['sr-environmental', 'sr-data-science', 'sr-research-methods', 'sr-statistics'],
  },

  // Education and Social Sciences
  {
    id: 'job-educator',
    title: 'Educator & Trainer',
    description: 'Design and deliver learning programmes for schools, corporates, and communities',
    requiredSkillIds: ['es-curriculum', 'es-communication', 'es-psychology', 'es-leadership'],
  },
  {
    id: 'job-social-worker',
    title: 'Social Worker',
    description: 'Support vulnerable individuals and families through casework and community programmes',
    requiredSkillIds: ['es-community', 'es-psychology', 'es-communication', 'es-policy'],
  },
  {
    id: 'job-policy-analyst',
    title: 'Policy Analyst',
    description: 'Research and advise on social, education, and public policy for government agencies',
    requiredSkillIds: ['es-policy', 'es-leadership', 'es-community', 'es-communication'],
  },
];