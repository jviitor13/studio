

import type { ChecklistTemplate, ChecklistItem } from "@/lib/checklist-templates-data";
import { Timestamp } from "firebase/firestore";

export type CompletedChecklist = Omit<ChecklistTemplate, 'questions' | 'type'> & { 
    id: string; 
    createdAt: Date | Timestamp | string | null; 
    vehicle: string; 
    driver: string; 
    responsibleName: string;
    mileage: number;
    status: 'OK' | 'Pendente' | 'Enviando';
    type: "Manutenção" | "viagem" | "retorno";
    questions: (Omit<ChecklistItem, 'status'> & { status: 'OK' | 'Não OK' | 'N/A' })[];
    signatures?: {
        assinaturaResponsavel?: string;
        assinaturaMotorista?: string;
        selfieResponsavel?: string;
        selfieMotorista?: string;
    },
    vehicleImages?: {
        cavaloFrontal: string;
        cavaloLateralDireita: string;
        cavaloLateralEsquerda: string;
        carretaFrontal: string;
        carretaLateralDireita: string;
        carretaLateralEsquerda: string;
    };
    generalObservations?: string;
    googleDriveStatus?: 'success' | 'error' | 'pending';
    firebaseStorageStatus?: 'success' | 'error' | 'pending';
};

export type Report = {
    id: string;
    title: string;
    category: string;
    date: string;
    period?: { from: Date; to: Date };
    data: any[];
    summary?: {
        totalCost: number;
    };
};
