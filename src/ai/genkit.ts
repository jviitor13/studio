import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

// Check if API key is available
const hasApiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

export const ai = genkit({
  plugins: hasApiKey ? [googleAI()] : [],
  model: hasApiKey ? 'googleai/gemini-2.0-flash' : undefined,
});
