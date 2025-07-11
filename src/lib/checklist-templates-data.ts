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
  type: "manutencao" | "viagem" | "retorno";
  category: "cavalo_mecanico" | "carreta" | "caminhao_3_4" | "moto";
  questions: {
    id: string;
    text: string;
    photoRequirement: PhotoRequirement;
  }[];
}

export const defaultChecklistTemplates: ChecklistTemplate[] = [
  {
    id: "template-1",
    name: "Checklist Técnico Cavalo Mecânico",
    type: "manutencao",
    category: "cavalo_mecanico",
    questions: [
      { id: "docs-1", text: "CRLV", photoRequirement: "never" },
      { id: "docs-2", text: "ANTT", photoRequirement: "never" },
      { id: "ext-1", text: "Pintura e lataria (avarias)", photoRequirement: "if_not_ok" },
      { id: "ext-2", text: "Para-choques (dianteiro e traseiro)", photoRequirement: "if_not_ok" },
      { id: "ext-3", text: "Retrovisores (vidros e carcaças)", photoRequirement: "if_not_ok" },
      { id: "ext-4", text: "Limpadores e palhetas", photoRequirement: "if_not_ok" },
      { id: "ext-5", text: "Faróis, setas e lanternas", photoRequirement: "if_not_ok" },
      { id: "ext-6", text: "Pneus (calibragem e desgaste)", photoRequirement: "always" },
      { id: "ext-7", text: "Placas de identificação", photoRequirement: "always" },
      { id: "ext-8", text: "Carroceria (estado geral)", photoRequirement: "always" },
      { id: "ext-9", text: "Luz do painel (se acesa)", photoRequirement: "if_not_ok" },
      { id: "ext-10", text: "Vazamentos (motor, radiador, etc.)", photoRequirement: "always" },
      { id: "ext-11", text: "Odômetro (leitura do KM)", photoRequirement: "always" },
      { id: "equip-1", text: "Estepe", photoRequirement: "if_not_ok" },
      { id: "equip-2", text: "Macaco e chave de roda", photoRequirement: "if_not_ok" },
      { id: "equip-3", text: "Triângulo de sinalização", photoRequirement: "if_not_ok" },
      { id: "equip-4", text: "Extintor de incêndio (validade e carga)", photoRequirement: "always" },
      { id: "sec-1", text: "Freios (de serviço e estacionário)", photoRequirement: "if_not_ok" },
      { id: "cabin-5", text: "Limpeza e organização geral", photoRequirement: "if_not_ok" },
      { id: "sit-3", text: "Tacógrafo (disco e aferição)", photoRequirement: "always" },
    ],
  },
  {
    id: "template-2",
    name: "Checklist de Carreta Graneleira",
    type: "manutencao",
    category: "carreta",
    questions: [
        { id: "carreta-1", text: "Lona da cobertura", photoRequirement: "if_not_ok"},
        { id: "carreta-2", text: "Sistema de travas e fueiros", photoRequirement: "if_not_ok"},
        { id: "carreta-3", text: "Assoalho da carreta", photoRequirement: "always"},
        { id: "carreta-4", text: "Pneus da carreta", photoRequirement: "always"},
        { id: "carreta-5", text: "Sistema de iluminação", photoRequirement: "if_not_ok"},
    ]
  },
  {
    id: "template-3",
    name: "Vistoria de Entrega Caminhão 3/4",
    type: "viagem",
    category: "caminhao_3_4",
    questions: [
        { id: "entrega-1", text: "Documentação da carga", photoRequirement: "never"},
        { id: "entrega-2", text: "Amarração e segurança da carga", photoRequirement: "always"},
        { id: "entrega-3", text: "Verificação de rotas e destino", photoRequirement: "never"},
    ]
  }
];
