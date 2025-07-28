export type ChecklistStatus = "OK" | "Não OK" | "N/A";
export type PhotoRequirement = "always" | "if_not_ok" | "never";

export interface ChecklistItem {
  id: string;
  text: string;
  photoRequirement: PhotoRequirement;
  status: ChecklistStatus;
  photo?: string;
  observation?: string;
}

export interface ChecklistTemplate {
  id: string;
  name: string;
  type: "Manutenção" | "viagem" | "retorno";
  category: "cavalo_mecanico" | "carreta" | "caminhao_3_4" | "moto";
  questions: {
    id: string;
    text: string;
    photoRequirement: PhotoRequirement;
  }[];
}
