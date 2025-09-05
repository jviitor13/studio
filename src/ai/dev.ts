import { config } from 'dotenv';
config();

import '@/ai/flows/assess-vehicle-damage.ts';
import '@/lib/checklist-upload-flow.ts';
import '@/ai/flows/assistant-flow.ts';
