export interface SegmentOption {
  value: string;
  label: string;
  defaultOpening: string;
  defaultClosing: string;
  defaultTicket: number;
}

export interface SegmentCategory {
  category: string;
  icon: string;
  options: SegmentOption[];
}

export const SEGMENT_CATEGORIES: SegmentCategory[] = [
  {
    category: "Alimentação & Gastronomia",
    icon: "🍽️",
    options: [
      {
        value: "Padaria & Panificação",
        label: "Padaria & Panificação",
        defaultOpening: "06:00",
        defaultClosing: "20:00",
        defaultTicket: 18.5,
      },
      {
        value: "Confeitaria, Doceria & Cafeteria",
        label: "Confeitaria, Doceria & Cafeteria",
        defaultOpening: "08:00",
        defaultClosing: "19:00",
        defaultTicket: 26.0,
      },
      {
        value: "Restaurante (Almoço / Self-Service)",
        label: "Restaurante (Almoço / Self-Service)",
        defaultOpening: "11:00",
        defaultClosing: "15:30",
        defaultTicket: 28.0,
      },
      {
        value: "Hamburgueria, Lanchonete & Pastelaria",
        label: "Hamburgueria, Lanchonete & Pastelaria",
        defaultOpening: "16:00",
        defaultClosing: "23:30",
        defaultTicket: 42.0,
      },
      {
        value: "Pizzaria",
        label: "Pizzaria",
        defaultOpening: "17:30",
        defaultClosing: "23:59",
        defaultTicket: 65.0,
      },
      {
        value: "Bar, Boteco & Petiscaria",
        label: "Bar, Boteco & Petiscaria",
        defaultOpening: "17:00",
        defaultClosing: "01:00",
        defaultTicket: 55.0,
      },
    ],
  },
  {
    category: "Beleza & Bem-Estar",
    icon: "✂️",
    options: [
      {
        value: "Barbearia",
        label: "Barbearia",
        defaultOpening: "09:00",
        defaultClosing: "20:00",
        defaultTicket: 45.0,
      },
      {
        value: "Salão Feminino & Cabeleireiro",
        label: "Salão Feminino & Cabeleireiro",
        defaultOpening: "09:00",
        defaultClosing: "19:00",
        defaultTicket: 75.0,
      },
      {
        value: "Esmalteria & Manicure",
        label: "Esmalteria & Manicure",
        defaultOpening: "09:00",
        defaultClosing: "18:30",
        defaultTicket: 38.0,
      },
      {
        value: "Clínica de Estética & Sobrancelhas",
        label: "Clínica de Estética & Sobrancelhas",
        defaultOpening: "09:00",
        defaultClosing: "19:00",
        defaultTicket: 85.0,
      },
    ],
  },
  {
    category: "Varejo & Conveniência",
    icon: "🛒",
    options: [
      {
        value: "Mercadinho & Mercearia de Bairro",
        label: "Mercadinho & Mercearia de Bairro",
        defaultOpening: "07:00",
        defaultClosing: "21:00",
        defaultTicket: 35.0,
      },
      {
        value: "Hortifrúti & Frutaria",
        label: "Hortifrúti & Frutaria",
        defaultOpening: "06:30",
        defaultClosing: "19:30",
        defaultTicket: 24.0,
      },
      {
        value: "Açougue & Casa de Carnes",
        label: "Açougue & Casa de Carnes",
        defaultOpening: "07:00",
        defaultClosing: "19:00",
        defaultTicket: 52.0,
      },
      {
        value: "Loja de Roupas, Calçados & Moda",
        label: "Loja de Roupas, Calçados & Moda",
        defaultOpening: "09:00",
        defaultClosing: "18:30",
        defaultTicket: 88.0,
      },
    ],
  },
  {
    category: "Serviços Automotivos",
    icon: "🔧",
    options: [
      {
        value: "Oficina Mecânica & Auto Center",
        label: "Oficina Mecânica & Auto Center",
        defaultOpening: "08:00",
        defaultClosing: "18:00",
        defaultTicket: 220.0,
      },
      {
        value: "Autopeças & Motopeças",
        label: "Autopeças & Motopeças",
        defaultOpening: "08:00",
        defaultClosing: "18:00",
        defaultTicket: 95.0,
      },
      {
        value: "Lava-Jato & Estética Automotiva",
        label: "Lava-Jato & Estética Automotiva",
        defaultOpening: "08:00",
        defaultClosing: "17:30",
        defaultTicket: 50.0,
      },
    ],
  },
  {
    category: "Outro Segmento",
    icon: "🏷️",
    options: [
      {
        value: "Outro",
        label: "Outro (especificar segmento)",
        defaultOpening: "08:00",
        defaultClosing: "18:00",
        defaultTicket: 35.0,
      },
    ],
  },
];

export const ALL_SEGMENT_OPTIONS: SegmentOption[] = SEGMENT_CATEGORIES.flatMap(
  (c) => c.options,
);

export const ALL_SEGMENT_LABELS: string[] = ALL_SEGMENT_OPTIONS.map(
  (o) => o.value,
);
