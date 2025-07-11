import type { ChecklistTemplate, ChecklistItem } from "@/lib/checklist-templates-data";

export type CompletedChecklist = Omit<ChecklistTemplate, 'questions'> & { 
    id: string; 
    date: string; 
    vehicle: string; 
    driver: string; 
    status: 'OK' | 'Pendente';
    questions: (ChecklistTemplate['questions'][0] & { status: 'OK' | 'Não OK' | 'N/A', observation?: string, photo?: string })[]
};