export const initialMaintenanceQuestions = [
    { id: "maint_q1", text: "Nível e condição do óleo do motor", type: "text" as const },
    { id: "maint_q2", text: "Nível do fluído de arrefecimento", type: "text" as const },
    { id: "maint_q3", text: "Condição e tensão das correias", type: "boolean" as const },
    { id: "maint_q4", text: "Verificação de vazamentos (óleo, água, combustível)", type: "boolean" as const },
    { id: "maint_q5", text: "Inspeção do sistema de freios (pastilhas, lonas, discos)", type: "text" as const },
    { id: "maint_q6", text: "Foto do estado das pastilhas de freio dianteiras", type: "photo" as const },
    { id: "maint_q7", text: "Pressão e condição geral dos pneus (incluindo estepe)", type: "text" as const },
    { id: "maint_q8", text: "Funcionamento do sistema elétrico (faróis, setas, lanternas)", type: "boolean" as const },
    { id: "maint_q9", text: "Leitura de códigos de falha da ECU (Scanner)", type: "text" as const },
    { id: "maint_q10", text: "Condição da suspensão (molas, amortecedores)", type: "boolean" as const },
    { id: "maint_q11", text: "Foto do terminal da bateria", type: "photo" as const },
    { id: "maint_q12", text: "Inspeção do sistema de escape (furos, corrosão)", type: "boolean" as const },
];

export type MaintenanceQuestion = typeof initialMaintenanceQuestions[0];
