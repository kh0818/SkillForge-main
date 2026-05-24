import { useCallback, useEffect, useState, useRef } from 'react';
import { X, Swords, Trophy, Skull, Loader2 } from 'lucide-react';
import type { Skill } from '../data/mockData';
import { generateSkillQuiz, type QuizQuestion } from '../services/gemini';
import QuizAttemptRail, { type AttemptState } from './QuizAttemptRail';
import { QUIZ_PASS_THRESHOLD, QUIZ_QUESTION_COUNT } from '../constants/quiz';

type Phase = 'loading' | 'quiz' | 'victory' | 'fail';

interface SkillQuizModalProps {
  skill: Skill;
  onClose: () => void;
  onVerified: (skillId: string) => void;
}

const categoryAccent: Record<string, string> = {
  Tech: '#3b82f6',
  Business: '#f59e0b',
  Communication: '#10b981',
};

export default function SkillQuizModal({ skill, onClose, onVerified }: SkillQuizModalProps) {
  const [phase, setPhase] = useState<Phase>('loading');
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [attempts, setAttempts] = useState<AttemptState[]>(() => Array(QUIZ_QUESTION_COUNT).fill(null));
  const [attemptNumber, setAttemptNumber] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [loadKey, setLoadKey] = useState(0);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const accent = categoryAccent[skill.category] ?? '#d97706';

  const loadQuiz = useCallback(async (targetSkill: Skill) => {
    setPhase('loading');
    setQuestions([]);
    setCurrentIndex(0);
    setScore(0);
    setSelectedIndex(null);
    setAttempts(Array(QUIZ_QUESTION_COUNT).fill(null));
    setError(null);

    try {
      const quiz = await generateSkillQuiz(targetSkill);
      setQuestions(quiz);
      setPhase('quiz');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load quiz');
    }
  }, []);

  useEffect(() => {
    loadQuiz(skill);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [skill, loadKey, loadQuiz]);

  const handleAnswer = (optionIndex: number) => {
    if (selectedIndex !== null || phase !== 'quiz') return;

    const q = questions[currentIndex];
    const correct = optionIndex === q.correctIndex;
    setSelectedIndex(optionIndex);
    const newScore = correct ? score + 1 : score;
    setScore(newScore);
    setAttempts((current) =>
      current.map((state, index) => (index === currentIndex ? (correct ? 'correct' : 'incorrect') : state)),
    );

    const isLast = currentIndex === QUIZ_QUESTION_COUNT - 1;

    timerRef.current = setTimeout(() => {
      if (isLast) {
        if (newScore >= QUIZ_PASS_THRESHOLD) {
          setPhase('victory');
          onVerified(skill.id);
        } else {
          setPhase('fail');
        }
      } else {
        setCurrentIndex((i) => i + 1);
        setSelectedIndex(null);
      }
    }, 650);
  };

  const handleRetry = () => {
    setAttemptNumber((attempt) => attempt + 1);
    setLoadKey((k) => k + 1);
  };

  const currentQuestion = questions[currentIndex];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl rounded-2xl border-2 shadow-2xl overflow-hidden"
        style={{
          borderColor: `${accent}88`,
          boxShadow: `0 0 40px ${accent}33, inset 0 1px 0 rgba(255,255,255,0.06)`,
          background: 'linear-gradient(165deg, #1a1510 0%, #0d0b09 45%, #12100e 100%)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex items-center justify-between px-5 py-3 border-b border-amber-900/50"
          style={{ background: 'linear-gradient(90deg, #2a1f14 0%, #1a1410 50%, #2a1f14 100%)' }}
        >
          <div className="flex items-center gap-2">
            <Swords className="text-amber-500" size={20} />
            <span className="text-amber-200/90 text-xs font-bold uppercase tracking-[0.2em]">
              Skill Dungeon
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

        <div className="grid lg:grid-cols-[minmax(0,1fr)_12rem]">
          <div className="px-6 py-5">
          <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: accent }}>
            {skill.category}
          </p>
          <h2 className="text-xl font-bold text-amber-50 mb-1">{skill.name}</h2>
          <p className="text-sm text-amber-600/70 mb-4 leading-snug">
            {typeof skill.description === 'string' ? skill.description : JSON.stringify(skill.description)}
          </p>

          {phase === 'loading' && (
            <div className="py-12 flex flex-col items-center gap-4">
              {error ? (
                <>
                  <p className="text-red-400 text-sm text-center">{error}</p>
                  <button
                    type="button"
                    onClick={handleRetry}
                    className="px-5 py-2 rounded-lg border border-amber-700/60 text-amber-200 text-sm font-semibold hover:bg-amber-950/60 transition-colors"
                  >
                    Try Again
                  </button>
                </>
              ) : (
                <>
                  <Loader2 className="text-amber-500 animate-spin" size={36} />
                  <p className="text-amber-600/80 text-sm">Summoning trial questions...</p>
                </>
              )}
            </div>
          )}

          {phase === 'quiz' && currentQuestion && (
            <>
              <div className="flex items-center justify-between mb-4">
                <span className="text-amber-500/90 text-sm font-semibold">
                  Question {currentIndex + 1} of {QUIZ_QUESTION_COUNT}
                </span>
                <span className="text-xs text-amber-800 font-medium tabular-nums">
                  Score: {score}/{QUIZ_PASS_THRESHOLD} to pass
                </span>
              </div>

              <div className="h-1.5 rounded-full bg-amber-950 mb-5 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${((currentIndex + 1) / QUIZ_QUESTION_COUNT) * 100}%`,
                    background: `linear-gradient(90deg, ${accent}, #d97706)`,
                  }}
                />
              </div>

              <p className="text-base font-medium text-amber-50/95 mb-5 leading-relaxed">
                {currentQuestion.question}
              </p>

              <div className="grid gap-2.5">
                {currentQuestion.options.map((opt: string, i: number) => {
                  let btnClass =
                    'w-full text-left px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all duration-200 ';
                  if (selectedIndex === null) {
                    btnClass +=
                      'border-amber-900/60 text-amber-100/90 bg-amber-950/30 hover:border-amber-600/70 hover:bg-amber-900/40 hover:text-amber-50';
                  } else if (i === currentQuestion.correctIndex) {
                    btnClass += 'border-green-500/80 text-green-100 bg-green-950/50';
                  } else if (i === selectedIndex) {
                    btnClass += 'border-red-600/70 text-red-200 bg-red-950/40';
                  } else {
                    btnClass += 'border-amber-950/50 text-amber-800/60 bg-transparent opacity-50';
                  }

                  return (
                    <button
                      key={i}
                      type="button"
                      disabled={selectedIndex !== null}
                      onClick={() => handleAnswer(i)}
                      className={btnClass}
                    >
                      <span className="text-amber-600/70 mr-2 font-bold">
                        {String.fromCharCode(65 + i)}.
                      </span>
                      {opt}
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {phase === 'victory' && (
            <div className="py-8 flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-yellow-500/20 border-2 border-yellow-400 flex items-center justify-center mb-4 shadow-[0_0_24px_rgba(250,204,21,0.4)]">
                <Trophy className="text-yellow-400" size={32} />
              </div>
              <h3 className="text-2xl font-bold text-yellow-300 mb-2">Victory!</h3>
              <p className="text-amber-600/80 text-sm mb-1">
                You scored {score}/{QUIZ_QUESTION_COUNT}
              </p>
              <p className="text-green-400/90 text-sm font-semibold mb-6">
                {skill.name} is now VERIFIED
              </p>
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-b from-yellow-500 to-amber-700 text-gray-900 font-bold text-sm shadow-lg hover:brightness-110 transition-all"
              >
                Return to Skill Tree
              </button>
            </div>
          )}

          {phase === 'fail' && (
            <div className="py-8 flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-red-950/50 border-2 border-red-800 flex items-center justify-center mb-4">
                <Skull className="text-red-500/80" size={32} />
              </div>
              <h3 className="text-xl font-bold text-red-400/90 mb-2">Defeated</h3>
              <p className="text-amber-700/80 text-sm mb-6">
                You scored {score}/{QUIZ_QUESTION_COUNT}. Need {QUIZ_PASS_THRESHOLD}/{QUIZ_QUESTION_COUNT} to pass.
              </p>
              <button
                type="button"
                onClick={handleRetry}
                className="px-6 py-2.5 rounded-xl border-2 border-amber-600 text-amber-200 font-bold text-sm hover:bg-amber-950/60 transition-colors"
              >
                Retry Dungeon
              </button>
            </div>
          )}
          </div>

          <QuizAttemptRail
            accent={accent}
            attemptNumber={attemptNumber}
            attempts={attempts}
            currentIndex={currentIndex}
            isActive={phase === 'quiz'}
            score={score}
          />
        </div>

        <div className="h-1 bg-gradient-to-r from-transparent via-amber-700/40 to-transparent" />
      </div>
    </div>
  );
}
