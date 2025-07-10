export const initialQuestions = [
    { id: "q1", text: "CNH está válida e comigo?", type: "boolean" as const },
    { id: "q2", text: "Estou com meu EPI completo?", type: "boolean" as const },
    { id: "q3", text: "Realizei o teste de atenção?", type: "boolean" as const },
    { id: "q4", text: "Celular carregado e com créditos?", type: "boolean" as const },
    { id: "q5", text: "Tacógrafo está funcionando corretamente?", type: "boolean" as const },
    { id: "q6", text: "Foto do pneu dianteiro esquerdo", type: "photo" as const },
    { id: "q7", text: "Foto do pneu dianteiro direito", type: "photo" as const },
    { id: "q8", text: "Anotar o nível do óleo", type: "text" as const },
];

export type Question = typeof initialQuestions[0];
