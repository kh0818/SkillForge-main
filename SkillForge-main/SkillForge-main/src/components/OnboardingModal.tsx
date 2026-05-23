import { useState } from 'react';
import type { Skill, SkillStatus } from '../data/mockData';

interface OnboardingModalProps {
  onComplete: (updatedSkills: Skill[]) => void;
  skills: Skill[];
}

const QUESTIONS = [
  {
    id: 'education',
    question: 'What is your current education level?',
    options: ['Diploma', "Bachelor's Degree", "Master's or above", 'Other'],
  },
  {
    id: 'field',
    question: 'Which field are you most interested in?',
    options: [
      'Tech', 'Business', 'Creative', 'Operations',
      'Finance and Accounting', 'Data and Analytics',
      'People and Culture', 'Legal and Compliance',
      'Healthcare and Life Sciences', 'Education and Training', 'Other',
    ],
  },
  {
    id: 'tools',
    question: 'What tools or software do you already use?',
    options: [
      'Microsoft Office (Word, Excel, PowerPoint)',
      'Design tools (Figma, Canva, Adobe)',
      'Coding (Python, JavaScript, SQL)',
      'Data tools (Tableau, Power BI, Excel)',
      'Project management (Jira, Trello, Asana)',
      'Other',
    ],
    multi: true,
  },
  {
    id: 'goal',
    question: 'What is your career goal?',
    options: [
      'Get my first job',
      'Switch to a new field',
      'Get promoted in my current role',
      'Start my own business',
      'Other',
    ],
  },
];

function mapAnswersToSkills(
  answers: Record<string, string | string[]>,
  skills: Skill[],
): Skill[] {
  const toSelfDeclare = new Set<string>();

  const field = answers.field as string;
  const tools = answers.tools as string[];
  const education = answers.education as string;

  // Map field interest to skills in that category
  skills.filter(s => s.category === field).forEach(s => {
    if (s.level === 1) toSelfDeclare.add(s.id);
  });

  // Map tools to specific skills
  if (tools?.includes('Microsoft Office (Word, Excel, PowerPoint)')) {
    toSelfDeclare.add('skill-writing');
    toSelfDeclare.add('skill-presentation');
    toSelfDeclare.add('skill-business-case');
  }
  if (tools?.includes('Design tools (Figma, Canva, Adobe)')) {
    toSelfDeclare.add('skill-figma');
    toSelfDeclare.add('skill-ui-design');
    toSelfDeclare.add('skill-visual-story');
  }
  if (tools?.includes('Coding (Python, JavaScript, SQL)')) {
    toSelfDeclare.add('skill-react');
    toSelfDeclare.add('skill-python');
    toSelfDeclare.add('skill-sql');
    toSelfDeclare.add('skill-sql-query');
  }
  if (tools?.includes('Data tools (Tableau, Power BI, Excel)')) {
    toSelfDeclare.add('skill-bi');
    toSelfDeclare.add('skill-analytics');
    toSelfDeclare.add('skill-data-viz');
  }
  if (tools?.includes('Project management (Jira, Trello, Asana)')) {
    toSelfDeclare.add('skill-agile');
    toSelfDeclare.add('skill-plm');
    toSelfDeclare.add('skill-process');
  }

  // Education level boosts
  if (education === "Master's or above") {
    skills.filter(s => s.level === 1).forEach(s => toSelfDeclare.add(s.id));
  } else if (education === "Bachelor's Degree") {
    skills.filter(s => s.level === 1 && s.category === field).forEach(s => toSelfDeclare.add(s.id));
  }

  return skills.map(s => {
    if (toSelfDeclare.has(s.id) && s.status === 'locked') {
      return { ...s, status: 'self-declared' as SkillStatus, skillLevel: 1 };
    }
    return s;
  });
}

export default function OnboardingModal({ onComplete, skills }: OnboardingModalProps) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [otherValues, setOtherValues] = useState<Record<string, string>>({});

  const question = QUESTIONS[step];
  const isMulti = question.multi === true;
  const currentAnswer = answers[question.id];

  function handleSelect(option: string) {
    if (isMulti) {
      const current = (currentAnswer as string[]) ?? [];
      const updated = current.includes(option)
        ? current.filter(o => o !== option)
        : [...current, option];
      setAnswers(prev => ({ ...prev, [question.id]: updated }));
    } else {
      setAnswers(prev => ({ ...prev, [question.id]: option }));
    }
  }

  function isSelected(option: string) {
    if (isMulti) return ((currentAnswer as string[]) ?? []).includes(option);
    return currentAnswer === option;
  }

  function handleNext() {
    if (step < QUESTIONS.length - 1) {
      setStep(s => s + 1);
    } else {
      const updatedSkills = mapAnswersToSkills(answers, skills);
      onComplete(updatedSkills);
    }
  }

  const canProceed = isMulti
    ? ((currentAnswer as string[]) ?? []).length > 0
    : !!currentAnswer;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/95 backdrop-blur-sm">
      <div className="w-full max-w-lg mx-4 bg-gray-900 border border-gray-700 rounded-2xl p-8 shadow-2xl">
        {/* Header */}
        <div className="flex items-center gap-2 mb-6">
          <div className="w-5 h-5 rounded-md bg-cyan-400/20 border border-cyan-400/40 flex items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
          </div>
          <span className="text-cyan-400 font-bold text-sm tracking-tight">SkillForge</span>
        </div>

        {/* Progress bar */}
        <div className="flex gap-1.5 mb-6">
          {QUESTIONS.map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                i <= step ? 'bg-cyan-400' : 'bg-gray-700'
              }`}
            />
          ))}
        </div>

        <p className="text-[11px] text-gray-500 uppercase tracking-widest mb-2">
          Question {step + 1} of {QUESTIONS.length}
        </p>
        <h2 className="text-xl font-bold text-white mb-6">{question.question}</h2>

        {/* Options */}
        <div className="flex flex-col gap-2 mb-8 max-h-64 overflow-y-auto pr-1">
          {question.options.map(option => (
            <div key={option}>
              <button
                type="button"
                onClick={() => handleSelect(option)}
                className={`w-full text-left px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                  isSelected(option)
                    ? 'bg-cyan-400/10 border-cyan-400 text-cyan-300'
                    : 'bg-gray-800 border-gray-700 text-gray-300 hover:border-gray-500 hover:text-white'
                }`}
              >
                {option}
              </button>
              {option === 'Other' && isSelected('Other') && (
                <input
                  type="text"
                  placeholder="Type your answer..."
                  value={otherValues[question.id] ?? ''}
                  onChange={e => {
                    const val = e.target.value.replace(/[^a-zA-Z\s]/g, '');
                    setOtherValues(prev => ({ ...prev, [question.id]: val }));
                  }}
                  className="mt-2 w-full px-4 py-2.5 rounded-xl bg-gray-800 border border-cyan-400/50 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-cyan-400"
                />
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => step > 0 && setStep(s => s - 1)}
            className={`text-sm font-medium transition-colors ${
              step > 0 ? 'text-gray-400 hover:text-white' : 'text-gray-700 cursor-default'
            }`}
          >
            Back
          </button>
          <button
            type="button"
            onClick={handleNext}
            disabled={!canProceed}
            className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
              canProceed
                ? 'bg-cyan-400 text-gray-900 hover:bg-cyan-300'
                : 'bg-gray-700 text-gray-500 cursor-not-allowed'
            }`}
          >
            {step < QUESTIONS.length - 1 ? 'Next' : 'Build My Skill Tree'}
          </button>
        </div>
      </div>
    </div>
  );
}