import { GoogleGenAI } from '@google/genai';
import type { Skill } from '../data/mockData';

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

// --- Types for Quiz ---
export interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
}

// --- Types for Job Relevance ---
export interface BatchRelevanceResult {
  skillName: string;
  relevance: string;
}

// --- Existing Quiz Function ---
export async function generateSkillQuiz(skill: Skill): Promise<QuizQuestion[]> {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Generate a 5-question multiple choice quiz to test proficiency in the skill "${skill.name}". 
                 Description: ${typeof skill.description === 'string' ? skill.description : JSON.stringify(skill.description)}.
                 Each question must have exactly 4 options.`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'ARRAY',
          items: {
            type: 'OBJECT',
            properties: {
              question: { type: 'STRING' },
              options: {
                type: 'ARRAY',
                items: { type: 'STRING' }
              },
              correctIndex: { type: 'INTEGER' }
            },
            required: ['question', 'options', 'correctIndex']
          }
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error('Empty response from quiz engine');
    return JSON.parse(text) as QuizQuestion[];
  } catch (error) {
    console.error('Quiz generation failure:', error);
    throw error;
  }
}

// --- Batch Job Relevance Function ---
export async function generateBatchSkillRelevance(jobTitle: string, skillNames: string[]): Promise<BatchRelevanceResult[]> {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash', 
      contents: `Analyze the relevance of the following skills for the role "${jobTitle}": ${skillNames.join(', ')}. Provide a brief, single-paragraph explanation for each skill.`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'ARRAY',
          items: {
            type: 'OBJECT',
            properties: {
              skillName: { type: 'STRING' },
              relevance: { type: 'STRING' }
            },
            required: ['skillName', 'relevance']
          }
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error('Empty response from model mapping engine');
    return JSON.parse(text) as BatchRelevanceResult[];
  } catch (error) {
    console.error('Gemini API execution failure:', error);
    throw error; 
  }
}