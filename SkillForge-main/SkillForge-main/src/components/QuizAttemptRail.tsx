import { QUIZ_PASS_THRESHOLD } from '../constants/quiz';

export type AttemptState = 'correct' | 'incorrect' | null;

interface QuizAttemptRailProps {
  accent: string;
  attemptNumber: number;
  attempts: AttemptState[];
  currentIndex: number;
  isActive: boolean;
  score: number;
}

export default function QuizAttemptRail({
  accent,
  attemptNumber,
  attempts,
  currentIndex,
  isActive,
  score,
}: QuizAttemptRailProps) {
  return (
    <aside className="border-t border-amber-900/50 bg-black/20 px-5 py-5 lg:border-l lg:border-t-0">
      <div className="mb-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: accent }}>
          Attempt {attemptNumber}
        </p>
        <p className="mt-1 text-xs text-amber-700/80">
          {score}/{QUIZ_PASS_THRESHOLD} verification threshold
        </p>
      </div>

      <div className="grid grid-cols-5 gap-2 lg:grid-cols-4" aria-label="Question attempts">
        {attempts.map((state, index) => {
          const isCurrent = isActive && index === currentIndex;
          const stateClass =
            state === 'correct'
              ? 'border-green-400/80 bg-green-500/20 text-green-100 shadow-[0_0_14px_rgba(34,197,94,0.24)]'
              : state === 'incorrect'
                ? 'border-red-500/80 bg-red-500/20 text-red-100 shadow-[0_0_14px_rgba(239,68,68,0.2)]'
                : isCurrent
                  ? 'border-amber-400/90 bg-amber-500/20 text-amber-100 shadow-[0_0_18px_rgba(245,158,11,0.28)]'
                  : 'border-amber-900/60 bg-amber-950/20 text-amber-800/80';

          return (
            <div
              key={index}
              className={`flex aspect-square items-center justify-center rounded-full border text-[11px] font-bold tabular-nums transition-all ${stateClass}`}
              title={`Question ${index + 1}${state ? ` ${state}` : isCurrent ? ' current' : ' pending'}`}
              aria-current={isCurrent ? 'step' : undefined}
            >
              {index + 1}
            </div>
          );
        })}
      </div>
    </aside>
  );
}
