

export type ChecklistStatus = "OK" | "Não OK" | "N/A";

export interface ChecklistItem {
  id: string;
  text: string;
  status: ChecklistStatus;
  photo?: string;
}

export interface ChecklistSection {
  id: string;
  title: string;
  items: ChecklistItem[];
  observations: string;
}

export const initialMaintenanceChecklist: ChecklistSection[] = [
  {
    id: "docs",
    title: "Documentos do Veículo",
    items: [
      { id: "docs-1", text: "CRLV", status: "N/A" },
      { id: "docs-2", text: "ANTT", status: "N/A" },
      { id: "docs-3", text: "Manual do veículo", status: "N/A" },
    ],
    observations: "",
  },
  {
    id: "external",
    title: "Estrutura Externa",
    items: [
      { id: "ext-1", text: "Pintura e lataria (avarias)", status: "N/A" },
      { id: "ext-2", text: "Para-choques (dianteiro e traseiro)", status: "N/A" },
      { id: "ext-3", text: "Retrovisores (vidros e carcaças)", status: "N/A" },
      { id: "ext-4", text: "Limpadores e palhetas", status: "N/A" },
      { id: "ext-5", text: "Faróis, setas e lanternas (lentes e funcionamento)", status: "N/A" },
      { id: "ext-6", text: "Pneus (calibragem e desgaste)", status: "N/A" },
    ],
    observations: "",
  },
  {
    id: "equipment",
    title: "Equipamentos Obrigatórios",
    items: [
      { id: "equip-1", text: "Estepe", status: "N/A" },
      { id: "equip-2", text: "Macaco e chave de roda", status: "N/A" },
      { id: "equip-3", text: "Triângulo de sinalização", status: "N/A" },
      { id: "equip-4", text: "Extintor de incêndio (validade e carga)", status: "N/A" },
    ],
    observations: "",
  },
  {
    id: "security",
    title: "Itens de Segurança",
    items: [
      { id: "sec-1", text: "Freios (de serviço e estacionário)", status: "N/A" },
      { id: "sec-2", text: "Nível de fluído de freio", status: "N/A" },
      { id: "sec-3", text: "Direção (folgas e ruídos)", status: "N/A" },
      { id: "sec-4", text: "Suspensão (molas e amortecedores)", status: "N/A" },
      { id: "sec-5", text: "Cintos de segurança", status: "N/A" },
    ],
    observations: "",
  },
  {
    id: "cabin",
    title: "Interior da Cabine",
    items: [
      { id: "cabin-1", text: "Bancos e estofados (estado de conservação)", status: "N/A" },
      { id: "cabin-2", text: "Painel de instrumentos (luzes de alerta)", status: "N/A" },
      { id: "cabin-3", text: "Ar condicionado e ventilação", status: "N/A" },
      { id: "cabin-4", text: "Buzina", status: "N/A" },
      { id: "cabin-5", text: "Limpeza e organização geral", status: "N/A" },
    ],
    observations: "",
  },
  {
    id: "epi",
    title: "EPIs do Motorista",
    items: [
      { id: "epi-1", text: "Capacete de segurança", status: "N/A" },
      { id: "epi-2", text: "Luvas de proteção", status: "N/A" },
      { id: "epi-3", text: "Óculos de segurança", status: "N/A" },
      { id: "epi-4", text: "Botas de segurança", status: "N/A" },
    ],
    observations: "",
  },
  {
    id: "situational",
    title: "Itens Situacionais",
    items: [
      { id: "sit-1", text: "Quinta roda (limpeza e lubrificação)", status: "N/A" },
      { id: "sit-2", text: "Sistema de rastreamento (funcionamento)", status: "N/A" },
      { id: "sit-3", text: "Tacógrafo (disco e aferição)", status: "N/A" },
    ],
    observations: "",
  },
];


// List of item IDs where a photo is mandatory if status is "Não OK"
export const mandatoryPhotoItems: string[] = [
    // Estrutura Externa
    'ext-1', // Pintura e lataria
    'ext-2', // Para-choques
    'ext-3', // Retrovisores
    'ext-5', // Faróis, setas e lanternas
    'ext-6', // Pneus
    // Equipamentos Obrigatórios
    'equip-4', // Extintor
    // Itens de Segurança
    'sec-1', // Freios
    'sec-2', // Nível de fluído de freio
    'sec-3', // Direção
    'sec-4', // Suspensão
    'sec-5', // Cintos de segurança
    // Itens Situacionais
    'sit-1', // Quinta roda
    'sit-3', // Tacógrafo
];
