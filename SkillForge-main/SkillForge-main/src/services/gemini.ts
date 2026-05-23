import type { Job, Skill } from '../data/mockData';

export interface QuizQuestion {
  question: string;
  options: [string, string, string, string];
  correctIndex: number;
}

interface GeminiGenerateResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
  error?: { message?: string };
}

const GEMINI_MODEL = 'gemini-3.5-flash';

function getApiKey(): string {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Missing VITE_GEMINI_API_KEY in .env');
  }
  return apiKey;
}

async function callGemini(
  prompt: string,
  options?: { temperature?: number; responseMimeType?: string },
): Promise<string> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(getApiKey())}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: options?.temperature ?? 0.8,
          ...(options?.responseMimeType
            ? { responseMimeType: options.responseMimeType }
            : {}),
        },
      }),
    },
  );

  const data = (await res.json()) as GeminiGenerateResponse;

  if (!res.ok) {
    throw new Error(data.error?.message ?? `Gemini API error (${res.status})`);
  }

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error('No response text from Gemini');
  }

  return text;
}

function parseGeminiText(text: string): unknown {
  const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  return JSON.parse(cleaned);
}

function normalizeQuestions(raw: unknown): QuizQuestion[] {
  if (!raw || typeof raw !== 'object' || !('questions' in raw)) {
    throw new Error('Invalid quiz format from API');
  }
  const questions = (raw as { questions: unknown }).questions;
  if (!Array.isArray(questions) || questions.length !== 5) {
    throw new Error('Expected exactly 5 questions');
  }

  return questions.map((q, i) => {
    if (!q || typeof q !== 'object') throw new Error(`Invalid question at index ${i}`);
    const item = q as Record<string, unknown>;
    const question = item.question;
    const options = item.options;
    const correctIndex = item.correctIndex;

    if (typeof question !== 'string' || !question.trim()) {
      throw new Error(`Invalid question text at index ${i}`);
    }
    if (!Array.isArray(options) || options.length !== 4) {
      throw new Error(`Question ${i + 1} must have exactly 4 options`);
    }
    if (!options.every((o) => typeof o === 'string')) {
      throw new Error(`Invalid options at index ${i}`);
    }
    if (typeof correctIndex !== 'number' || correctIndex < 0 || correctIndex > 3) {
      throw new Error(`Invalid correctIndex at index ${i}`);
    }

    return {
      question,
      options: options as [string, string, string, string],
      correctIndex,
    };
  });
}

export async function generateSkillRelevanceForJob(job: Job, skill: Skill): Promise<string> {
  const prompt = `You are a career coach. Write exactly one concise sentence (max 25 words) explaining why the skill "${skill.name}" (${skill.category}) matters for the job role "${job.title}".
Job description: ${job.description}
Skill description: ${skill.description}

Return only the sentence, no quotes, no bullet points, no preamble.`;

  const text = await callGemini(prompt, { temperature: 0.7 });
  return text.trim().replace(/^["']|["']$/g, '');
}

export async function generateSkillQuiz(skill: Skill): Promise<QuizQuestion[]> {
  const prompt = `You are a career skills assessor. Generate exactly 5 multiple-choice quiz questions to test practical knowledge of the skill "${skill.name}" (${skill.category}).
Skill description: ${skill.description}

Return ONLY valid JSON with this exact shape, no markdown:
{
  "questions": [
    {
      "question": "string",
      "options": ["option A", "option B", "option C", "option D"],
      "correctIndex": 0
    }
  ]
}

Rules:
- Exactly 5 questions in the array
- Each question has exactly 4 options
- correctIndex is 0-3 (index of the correct option)
- Questions should be practical and role-relevant, not trivia`;

  const text = await callGemini(prompt, {
    temperature: 0.8,
    responseMimeType: 'application/json',
  });

  return normalizeQuestions(parseGeminiText(text));
}
