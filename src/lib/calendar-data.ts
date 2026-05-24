export type Urgency = 'hoje' | 'urgente' | 'atencao' | 'planeje' | 'futuro' | 'passou'

export interface CommercialDate {
  id: string
  name: string
  emoji: string
  getDate: (year: number) => Date
  suggestedBaskets: string[]
  tip: string
  campaignIdea: string
}

// nth occurrence of a weekday in a month (weekday: 0=Sun … 6=Sat)
function nthWeekday(year: number, month: number, weekday: number, n: number): Date {
  const first = new Date(year, month, 1)
  const diff = (weekday - first.getDay() + 7) % 7
  return new Date(year, month, 1 + diff + (n - 1) * 7)
}

// Meeus/Jones/Butcher Easter algorithm
function getEaster(year: number): Date {
  const a = year % 19
  const b = Math.floor(year / 100)
  const c = year % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const month = Math.floor((h + l - 7 * m + 114) / 31) - 1
  const day = ((h + l - 7 * m + 114) % 31) + 1
  return new Date(year, month, day)
}

export const COMMERCIAL_DATES: CommercialDate[] = [
  {
    id: 'ano_novo',
    name: 'Ano Novo',
    emoji: '🎆',
    getDate: (y) => new Date(y, 0, 1),
    suggestedBaskets: ['premium', 'romantica'],
    tip: 'Cesta para celebrar a virada com quem se ama. Aposte em espumante e chocolates.',
    campaignIdea: 'Ofereça café da manhã especial para o primeiro dia do ano — "Comece 2026 com muito sabor!"',
  },
  {
    id: 'dia_mulher',
    name: 'Dia da Mulher',
    emoji: '💜',
    getDate: (y) => new Date(y, 2, 8),
    suggestedBaskets: ['romantica', 'premium', 'fitness'],
    tip: 'Uma das datas mais fortes para cestas. Invista em embalagem especial e flor na cesta.',
    campaignIdea: 'Parceria com floriculturas: cesta + buquê = presente completo. Divulgue 15 dias antes.',
  },
  {
    id: 'pascoa',
    name: 'Páscoa',
    emoji: '🐣',
    getDate: (y) => getEaster(y),
    suggestedBaskets: ['premium', 'romantica', 'economica'],
    tip: 'Inclua ovos de Páscoa artesanais e chocolates temáticos. Embalagem colorida faz diferença.',
    campaignIdea: '"Cesta de Páscoa" com ovos de chocolate, panetone de Páscoa e frutas. Peça antecipado!',
  },
  {
    id: 'dia_maes',
    name: 'Dia das Mães',
    emoji: '🌸',
    getDate: (y) => nthWeekday(y, 4, 0, 2), // 2nd Sunday of May
    suggestedBaskets: ['premium', 'romantica', 'fitness'],
    tip: 'A maior data do ano para cestas. Comece a divulgar 3 semanas antes e limite as vagas.',
    campaignIdea: '"Surpreenda sua mãe com café da manhã na cama" — entrega com horário marcado às 7h.',
  },
  {
    id: 'dia_namorados',
    name: 'Dia dos Namorados',
    emoji: '💕',
    getDate: (y) => new Date(y, 5, 12),
    suggestedBaskets: ['romantica', 'premium'],
    tip: 'Inclua cartão personalizado, rosas e champanhe. Entrega com horário certo é diferencial.',
    campaignIdea: '"Café da manhã surpresa para o(a) seu(sua) amor" — aceite pedidos até 3 dias antes.',
  },
  {
    id: 'dia_avos',
    name: 'Dia dos Avós',
    emoji: '👴🌺',
    getDate: (y) => new Date(y, 6, 26),
    suggestedBaskets: ['premium', 'economica'],
    tip: 'Data menos explorada = menos concorrência. Ótima oportunidade para se destacar.',
    campaignIdea: '"Mande um abraço gostoso para os seus avós" — cesta com itens clássicos e carta.',
  },
  {
    id: 'dia_pais',
    name: 'Dia dos Pais',
    emoji: '👨‍👧',
    getDate: (y) => nthWeekday(y, 7, 0, 2), // 2nd Sunday of August
    suggestedBaskets: ['premium', 'corporativa'],
    tip: 'Aposte em itens mais robustos: queijos, frios, café especial. Embalagem masculina.',
    campaignIdea: '"Ele merece um café da manhã especial" — cesta com cerveja artesanal ou whisky pequeno.',
  },
  {
    id: 'dia_secretaria',
    name: 'Dia da Secretária',
    emoji: '💼',
    getDate: (y) => new Date(y, 8, 30),
    suggestedBaskets: ['corporativa', 'premium'],
    tip: 'Foque em empresas. Ofereça pacotes com nota fiscal e entrega em escritório.',
    campaignIdea: 'Abordagem B2B: contate empresas locais oferecendo kits para homenagear equipes.',
  },
  {
    id: 'dia_criancas',
    name: 'Dia das Crianças',
    emoji: '🎈',
    getDate: (y) => new Date(y, 9, 12),
    suggestedBaskets: ['economica', 'romantica'],
    tip: 'Cestas temáticas com chocolates, biscoitos coloridos e brinquedinho pequeno.',
    campaignIdea: '"Café da manhã surpresa para os pequenos" — decoração colorida e personagem favorito.',
  },
  {
    id: 'professores',
    name: 'Dia dos Professores',
    emoji: '📚',
    getDate: (y) => new Date(y, 9, 15),
    suggestedBaskets: ['premium', 'economica'],
    tip: 'Pais compram para homenagear professores. Ofereça opção mais econômica para facilitar.',
    campaignIdea: '"Homenageie o professor que faz a diferença" — mini cesta com tag personalizada.',
  },
  {
    id: 'halloween',
    name: 'Halloween',
    emoji: '🎃',
    getDate: (y) => new Date(y, 9, 31),
    suggestedBaskets: ['romantica', 'economica'],
    tip: 'Crescendo no Brasil. Embalagem temática laranja/preta e doces especiais.',
    campaignIdea: '"Trick or Treat Basket" — cesta temática com chocolates e embalagem assustadora.',
  },
  {
    id: 'natal',
    name: 'Natal',
    emoji: '🎄',
    getDate: (y) => new Date(y, 11, 25),
    suggestedBaskets: ['premium', 'corporativa', 'romantica'],
    tip: 'Maior pico de vendas do ano. Abra encomendas em outubro e limite as vagas.',
    campaignIdea: 'Kits natalinos corporativos + cestas para clientes. Divulgue desde novembro.',
  },
  {
    id: 'reveillon',
    name: 'Réveillon',
    emoji: '🥂',
    getDate: (y) => new Date(y, 11, 31),
    suggestedBaskets: ['premium', 'romantica'],
    tip: 'Cesta para a virada: espumante, uvas, chocolates e desejo de feliz ano novo.',
    campaignIdea: '"Brinde ao novo ano com sabor" — cesta especial entregue na noite do dia 31.',
  },
]

export interface UpcomingDate {
  id: string
  name: string
  emoji: string
  date: Date
  daysUntil: number
  urgency: Urgency
  suggestedBaskets: string[]
  tip: string
  campaignIdea: string
}

export function getUpcomingDates(monthsAhead = 12): UpcomingDate[] {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const limit = new Date(today)
  limit.setMonth(limit.getMonth() + monthsAhead)

  const results: UpcomingDate[] = []

  for (const def of COMMERCIAL_DATES) {
    // Check current year and next year to cover the full window
    for (const year of [today.getFullYear(), today.getFullYear() + 1]) {
      const date = def.getDate(year)
      date.setHours(0, 0, 0, 0)
      if (date >= today && date <= limit) {
        const diffMs = date.getTime() - today.getTime()
        const daysUntil = Math.round(diffMs / (1000 * 60 * 60 * 24))
        let urgency: Urgency
        if (daysUntil === 0) urgency = 'hoje'
        else if (daysUntil <= 7) urgency = 'urgente'
        else if (daysUntil <= 15) urgency = 'atencao'
        else if (daysUntil <= 30) urgency = 'planeje'
        else urgency = 'futuro'

        results.push({ ...def, date, daysUntil, urgency })
        break // only the next occurrence
      }
    }
  }

  return results.sort((a, b) => a.date.getTime() - b.date.getTime())
}
