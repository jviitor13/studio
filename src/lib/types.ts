import type { ChecklistTemplate, ChecklistItem } from "@/lib/checklist-templates-data";

export type CompletedChecklist = Omit<ChecklistTemplate, 'questions' | 'type'> & { 
    id: string; 
    createdAt: string; 
    vehicle: string; 
    driver: string; 
    responsibleName: string;
    mileage?: number;
    status: 'OK' | 'Pendente';
    type: "Manutenção" | "viagem" | "retorno";
    questions: (Omit<ChecklistItem, 'status'> & { status: 'OK' | 'Não OK' | 'N/A' })[];
    assinaturaResponsavel?: string;
    assinaturaMotorista?: string;
    vehicleImages?: string[];
    generalObservations?: string;
};
