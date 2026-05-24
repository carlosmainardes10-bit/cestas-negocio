export type ScriptPlatform = 'whatsapp' | 'instagram'
export type ScriptOccasion =
  | 'geral'
  | 'dia_maes'
  | 'dia_namorados'
  | 'natal'
  | 'pascoa'
  | 'aniversario'
  | 'dia_pais'
export type ScriptCategory =
  | 'geral'
  | 'romantica'
  | 'premium'
  | 'fitness'
  | 'corporativa'
  | 'economica'

export interface SalesScript {
  id: string
  title: string
  category: ScriptCategory
  occasion: ScriptOccasion
  platform: ScriptPlatform
  text: string
}

export const OCCASION_LABELS: Record<ScriptOccasion, string> = {
  geral: 'Geral',
  dia_maes: 'Dia das Mães',
  dia_namorados: 'Dia dos Namorados',
  natal: 'Natal',
  pascoa: 'Páscoa',
  aniversario: 'Aniversário',
  dia_pais: 'Dia dos Pais',
}

export const CATEGORY_LABELS: Record<ScriptCategory, string> = {
  geral: 'Geral',
  romantica: 'Romântica',
  premium: 'Premium',
  fitness: 'Fitness',
  corporativa: 'Corporativa',
  economica: 'Econômica',
}

export const SCRIPTS: SalesScript[] = [
  // ── WhatsApp ──────────────────────────────────────────────────────────────
  {
    id: 'wa-romantica-geral',
    title: 'Cesta Romântica — apresentação',
    category: 'romantica',
    occasion: 'geral',
    platform: 'whatsapp',
    text: `Oi! 🥰 Tudo bem?

Vim te mostrar a nossa *Cesta Romântica*, perfeita para surpreender quem você ama no café da manhã!

🍓 Frutas frescas selecionadas
🥐 Croissant artesanal
🍫 Chocolate especial
🌹 Decoração personalizada com cartão

Tudo embalado com muito carinho, pronto para entrega no horário que você precisar! 🎀

Quer saber o valor e a disponibilidade? É só responder aqui! 😊`,
  },
  {
    id: 'wa-romantica-namorados',
    title: 'Cesta Romântica — Dia dos Namorados',
    category: 'romantica',
    occasion: 'dia_namorados',
    platform: 'whatsapp',
    text: `Oi! 💕 O Dia dos Namorados tá chegando e ainda dá tempo de surpreender!

Nossa *Cesta Romântica Especial* foi pensada para deixar esse dia inesquecível:

🌹 Rosas frescas
🍫 Chocolates finos
🥂 Espumante ou suco premium
🍓 Frutas e morangos
💌 Cartão personalizado escrito por você

Entregamos em domicílio com horário marcado, pra chegar na hora certa! 🎀

As vagas são *limitadas* — me chama aqui para garantir a sua! 🥰`,
  },
  {
    id: 'wa-maes-geral',
    title: 'Cesta especial — Dia das Mães',
    category: 'premium',
    occasion: 'dia_maes',
    platform: 'whatsapp',
    text: `Oi! 🌸 Dia das Mães é dia 11 de maio — e ela merece começar o dia sendo homenageada!

Nossa *Cesta do Dia das Mães* traz tudo o que ela ama:

☕ Café especial
🥐 Pão de mel e croissant
🍓 Frutas frescas
🌷 Arranjo floral
💝 Cartão escrito com a sua mensagem

Entrego no endereço dela, com cesta toda montada e embalada pra foto! 📸

*Encomendas até [data].* Me chama agora e garante! 🥰`,
  },
  {
    id: 'wa-premium-geral',
    title: 'Cesta Premium — apresentação',
    category: 'premium',
    occasion: 'geral',
    platform: 'whatsapp',
    text: `Oi! ✨ Deixa eu te apresentar nossa *Cesta Premium*!

Para quem quer presentear com sofisticação e sabor:

🥐 Croissant artesanal
🧀 Queijos finos e frios importados
🫐 Mix de frutas gourmet
🍫 Chocolates belgas
🍵 Chá especial ou café gourmet
🎁 Embalagem premium com laço e tag personalizada

Ideal para datas especiais, corporativo, ou simplesmente para mimar alguém muito especial. 💛

Manda mensagem para ver fotos e valores! 😊`,
  },
  {
    id: 'wa-fitness-geral',
    title: 'Cesta Fitness — apresentação',
    category: 'fitness',
    occasion: 'geral',
    platform: 'whatsapp',
    text: `Oi! 💪 Conhece nossa *Cesta Fitness*?

Para quem cuida da saúde sem abrir mão do prazer:

🫐 Mix de frutas frescas
🥜 Castanhas e oleaginosas
🍫 Chocolate 70% cacau
🥣 Granola artesanal
🍯 Mel puro
🥛 Iogurte natural

Tudo leve, saudável e muito gostoso! Perfeito para presentear quem tem uma vida ativa. 🌿

Quer saber mais? Me chama! 😊`,
  },
  {
    id: 'wa-corporativa-geral',
    title: 'Cesta Corporativa — empresas',
    category: 'corporativa',
    occasion: 'geral',
    platform: 'whatsapp',
    text: `Olá! 👋

Você está buscando uma forma especial de presentear colaboradores, clientes ou parceiros?

Trabalho com *Cestas Corporativas de Café da Manhã*, ideais para:

🏢 Datas comemorativas da empresa
🎉 Aniversários de funcionários
🤝 Agradecimento a clientes
📦 Kits de boas-vindas

✅ Personalização com logo da empresa
✅ Entrega em múltiplos endereços
✅ Nota fiscal disponível
✅ Desconto para pedidos em quantidade

Posso enviar uma proposta com valores? Qual seria a quantidade aproximada? 😊`,
  },
  {
    id: 'wa-economica-geral',
    title: 'Cesta Econômica — acessível',
    category: 'economica',
    occasion: 'geral',
    platform: 'whatsapp',
    text: `Oi! 🥰 Sabia que dá pra presentear com muito carinho sem gastar muito?

Nossa *Cesta Café da Manhã* tem tudo o que é essencial, montada com capricho:

☕ Café
🍞 Pão e manteiga
🧀 Queijo e presunto
🍫 Chocolate
🍓 Fruta da estação
🎀 Embalada com todo amor!

Um presentão que cabe no bolso e faz a pessoa se sentir especial. 💛

Me chama para ver valores e disponibilidade! 😊`,
  },
  {
    id: 'wa-natal-geral',
    title: 'Cesta Natalina — divulgação',
    category: 'geral',
    occasion: 'natal',
    platform: 'whatsapp',
    text: `🎄 O Natal tá chegando e as encomendas estão esgotando rápido!

Garanta já a sua *Cesta Natalina* e faça alguém acordar com um sorriso no rosto nesse dia tão especial:

🎅 Panetone artesanal
🍫 Chocolates e confeitos natalinos
🥂 Espumante ou suco especial
🧀 Queijos e frios selecionados
🎁 Embalagem temática natalina

Entregas com hora marcada, chegando novinha na sua casa! 🎀

*As vagas são limitadas.* Não deixa pra última hora — me chama agora! 🎄`,
  },
  {
    id: 'wa-aniversario-geral',
    title: 'Cesta de Aniversário',
    category: 'geral',
    occasion: 'aniversario',
    platform: 'whatsapp',
    text: `🎂 Aniversário chegando? Que tal surpreender com um café da manhã na cama?

Nossa *Cesta de Aniversário* é a surpresa perfeita para começar o dia com muito amor:

🎂 Mini bolo ou cupcakes personalizados
🥐 Pães e croissants frescos
🍓 Frutas e morangos
🍫 Chocolates
🎈 Balões e decoração
💌 Cartão personalizado

Entrego no horário que você escolher, pra pegar o aniversariante de surpresa! 🥳

Me chama aqui para encomendar! 🎁`,
  },
  {
    id: 'wa-followup-geral',
    title: 'Follow-up — cliente antigo',
    category: 'geral',
    occasion: 'geral',
    platform: 'whatsapp',
    text: `Oi, [nome]! Tudo bem? 🥰

Faz um tempinho que a gente não se fala e vim dar um oi!

Tem datas especiais chegando aí? Ou talvez alguém que você queira surpreender?

Estou com novidades nas cestas e adoraria montar algo especial pra você! 🎀

Me conta o que tá precisando 😊`,
  },

  // ── Instagram ─────────────────────────────────────────────────────────────
  {
    id: 'ig-romantica-geral',
    title: 'Cesta Romântica — feed',
    category: 'romantica',
    occasion: 'geral',
    platform: 'instagram',
    text: `Amor que alimenta 🌹☕

Imagine acordar com essa surpresa na sua porta — uma cesta cheia de carinho, preparada com atenção a cada detalhe, do laço à última fruta.

Nossa Cesta Romântica foi feita pra tornar especial qualquer dia comum. Porque às vezes o amor se mostra exatamente assim: num croissant fresquinho, num chocolate especial, e numa mensagem escrita do seu jeito. 💌

Aceita encomendas com entrega no horário que você precisar. ✨
Chama no direct ou no link da bio!

#cestaromântica #cafédaromã #surpresaromântica #cestadefrutasepresentes #presentedeamor #caféespecial #entregaemdomicílio #surpresanacama #presentecriativo`,
  },
  {
    id: 'ig-premium-geral',
    title: 'Cesta Premium — feed',
    category: 'premium',
    occasion: 'geral',
    platform: 'instagram',
    text: `Quando o detalhe faz toda a diferença ✨🧀

Queijo fino, chocolate belga, frutas selecionadas e aquele cafezinho especial — tudo isso reunido numa cesta montada com amor e muito capricho.

Nossa Cesta Premium é pra quem quer presentear com sofisticação. Pra quem merece o melhor. E todo mundo merece, né? 💛

📦 Entregamos embalada e pronta pra foto.
💌 Cartão personalizado com a sua mensagem.
🎀 Laço e tag inclusos.

Chama no direct e conta sua ideia!

#cestapremium #cafégourmet #presentegourmet #cestas #presentespecial #cafécomqueijo #entregaemdomicílio #cestadecafédamanhã`,
  },
  {
    id: 'ig-maes-geral',
    title: 'Dia das Mães — feed',
    category: 'geral',
    occasion: 'dia_maes',
    platform: 'instagram',
    text: `Ela te deu tanto — devolve pra ela um cafezinho com amor 🌸☕

O Dia das Mães tá chegando e nada melhor do que surpreendê-la com um café da manhã especial, levado até a porta da casa dela — ou na cama mesmo, do jeitinho que ela merece.

🌷 Flores
☕ Café especial
🥐 Pães artesanais
🍓 Frutas frescas
💝 Cartão com a sua mensagem

*Vagas limitadas — encomendas abertas até [data].*

Chama no direct ou clica no link da bio! 🥰

#diadasmães #presentediaddasmães #cestas #caféespecial #presentepramãe #presentecriativo #surpresapramãe #cafénamanhã`,
  },
  {
    id: 'ig-namorados-geral',
    title: 'Dia dos Namorados — feed',
    category: 'romantica',
    occasion: 'dia_namorados',
    platform: 'instagram',
    text: `Porque o amor merece começar bem 💕☕

No Dia dos Namorados, a surpresa mais gostosa é um café da manhã cheio de carinho esperando na porta. Do jeito que você pensou, com os sabores que ele ou ela ama.

🍓 Morangos frescos
🍫 Chocolates especiais
🥂 Espumante gelado
🌹 Flores
💌 Cartão personalizado

Entrego com hora marcada, pra chegar na hora certa. 🎀

*Poucas vagas disponíveis!*
Chama no direct e garante a sua 💕

#diadosnamorados #cestas #presentedosnamorados #surpresaromântica #cafédaromã #presentecriativos #amor`,
  },
  {
    id: 'ig-fitness-geral',
    title: 'Cesta Fitness — feed',
    category: 'fitness',
    occasion: 'geral',
    platform: 'instagram',
    text: `Saúde e sabor no mesmo pacote 💪🫐

Pra quem cuida do corpo e não abre mão do prazer, nossa Cesta Fitness é a surpresa perfeita:

🥜 Castanhas e oleaginosas
🫐 Frutas frescas e secas
🍫 Chocolate 70% cacau
🥣 Granola artesanal
🍯 Mel puro

Tudo natural, leve e montado com muito carinho. Um presente que cuida de dentro pra fora. 🌿

Chama no direct pra encomendar!

#cestafitness #presentesaudável #caféfitness #cestadecafé #vidasaudável #presentecriativo #natureba #presentefit`,
  },
  {
    id: 'ig-natal-geral',
    title: 'Cesta Natalina — feed',
    category: 'geral',
    occasion: 'natal',
    platform: 'instagram',
    text: `Natal é tempo de cuidar de quem você ama 🎄✨

E não tem jeito melhor de mostrar carinho do que com uma cesta natalina cheia de sabores especiais, embalada como um presente de verdade.

🎅 Panetone artesanal
🍫 Chocolates e confeitos
🥂 Espumante especial
🧀 Queijos e frios selecionados
🎁 Embalagem temática

*As encomendas fecham no dia [data] — garanta a sua!*

Chama no direct ou link da bio 🎀

#cestanatalina #natal #presentes #natalcriativo #cesta #cafédenatal #presentedenatal #cestadefrutas #natal2025`,
  },
]
