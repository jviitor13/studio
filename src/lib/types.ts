import type { ChecklistTemplate, ChecklistItem } from "@/lib/checklist-templates-data";

export type CompletedChecklist = Omit<ChecklistTemplate, 'questions'> & { 
    id: string; 
    createdAt: string; // Changed from 'date' to 'createdAt' and type to string for serializability
    vehicle: string; 
    driver: string; 
    responsibleName?: string;
    status: 'OK' | 'Pendente';
    questions: (ChecklistTemplate['questions'][0] & { status: 'OK' | 'Não OK' | 'N/A', observation?: string, photo?: string })[];
    assinaturaResponsavel?: string;
    assinaturaMotorista?: string;
};
