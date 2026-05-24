import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Check, Zap, Calculator, ShoppingBasket, MessageSquareText, ShoppingCart, Star, ArrowRight, Shield } from 'lucide-react'
import { verifySession } from '@/lib/supabase/dal'

export default async function LandingPage() {
  const user = await verifySession()
  if (user) redirect('/calculadora')

  return (
    <div className="min-h-screen bg-white font-[var(--font-geist-sans)]">

      {/* ── Nav ─────────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-amber-100">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <span className="font-bold text-amber-900 text-lg">🧺 Empresa de Cestas</span>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Entrar
            </Link>
            <Link
              href="/signup"
              className="bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium px-4 py-1.5 rounded-lg transition-colors"
            >
              Começar grátis
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ────────────────────────────────────────────────────────────── */}
      <section className="bg-gradient-to-b from-amber-50 to-white pt-20 pb-24 px-6 text-center">
        <div className="max-w-3xl mx-auto">
          <span className="inline-block bg-amber-100 text-amber-800 text-xs font-semibold px-3 py-1 rounded-full mb-6">
            7 dias grátis · sem cartão
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 leading-tight mb-5">
            Pare de improvisar.<br />
            <span className="text-amber-600">Comece a vender mais cestas</span><br />
            com quem cuida do seu negócio.
          </h1>
          <p className="text-lg text-gray-500 max-w-xl mx-auto mb-8">
            Calculadora de lucro, montador com IA, controle de vendas e muito mais —
            tudo em um só lugar, por menos de <strong className="text-gray-700">R$1 por dia</strong>.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/signup"
              className="bg-amber-600 hover:bg-amber-700 text-white font-semibold px-8 py-3.5 rounded-xl text-base transition-colors flex items-center justify-center gap-2"
            >
              Começar grátis por 7 dias
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="#precos"
              className="border border-gray-200 hover:border-amber-300 text-gray-700 font-medium px-8 py-3.5 rounded-xl text-base transition-colors"
            >
              Ver planos
            </Link>
          </div>
          <p className="text-xs text-gray-400 mt-4">Sem cartão de crédito. Cancele quando quiser.</p>

          {/* App mockup */}
          <div className="mt-14 max-w-2xl mx-auto rounded-2xl border border-gray-200 shadow-2xl shadow-amber-100 overflow-hidden bg-white">
            <div className="bg-amber-50 border-b border-amber-100 px-4 py-2.5 flex items-center gap-2">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-300" />
                <div className="w-3 h-3 rounded-full bg-yellow-300" />
                <div className="w-3 h-3 rounded-full bg-green-300" />
              </div>
              <span className="text-xs text-amber-700 font-medium ml-2">empresadecestas.com.br/calculadora</span>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-2 gap-3 mb-4">
                {[
                  { label: 'Entradas este mês', value: 'R$ 4.200', color: 'text-green-600', bg: 'bg-green-50' },
                  { label: 'Lucro líquido', value: 'R$ 2.850', color: 'text-amber-600', bg: 'bg-amber-50' },
                  { label: 'Pedidos pendentes', value: '7', color: 'text-blue-600', bg: 'bg-blue-50' },
                  { label: 'Clientes cadastrados', value: '43', color: 'text-purple-600', bg: 'bg-purple-50' },
                ].map((card) => (
                  <div key={card.label} className={`${card.bg} rounded-lg p-3`}>
                    <p className="text-xs text-gray-500 mb-1">{card.label}</p>
                    <p className={`text-xl font-bold ${card.color}`}>{card.value}</p>
                  </div>
                ))}
              </div>
              <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                {['Cesta Romântica — Entrega amanhã', 'Cesta Premium — Entrega 28/mai', 'Cesta Fitness — Entregue ✓'].map((item, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <span className="text-gray-600">{item}</span>
                    <span className={`px-2 py-0.5 rounded-full ${i === 2 ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                      {i === 2 ? 'Entregue' : 'Pendente'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Dor ─────────────────────────────────────────────────────────────── */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Você ainda usa caderno, planilha<br />ou <span className="text-red-500">chute</span> para precificar suas cestas?
          </h2>
          <p className="text-gray-500 text-lg mb-10">
            A maioria das empreendedoras perde dinheiro todo mês sem perceber —<br className="hidden md:block" />
            vendendo barato demais ou esquecendo custos escondidos.
          </p>
          <div className="grid md:grid-cols-3 gap-4 text-left">
            {[
              {
                emoji: '📒',
                title: 'Anotações perdidas',
                text: 'Custo dos produtos no caderno, preço de venda na memória. Quando o mês fecha, o saldo não bate.',
              },
              {
                emoji: '🤷',
                title: 'Preço no chute',
                text: 'Sem calcular gás, embalagem, deslocamento e tempo, você cobra menos do que deveria e não sabe.',
              },
              {
                emoji: '😰',
                title: 'Sem controle',
                text: 'Pedidos em diferentes lugares, clientes esquecidos, data de entrega anotada no WhatsApp. Caos.',
              },
            ].map((item) => (
              <div key={item.title} className="border border-red-100 bg-red-50/50 rounded-xl p-4">
                <span className="text-2xl mb-3 block">{item.emoji}</span>
                <p className="font-semibold text-gray-800 mb-1">{item.title}</p>
                <p className="text-sm text-gray-500">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Solução ─────────────────────────────────────────────────────────── */}
      <section className="py-20 px-6 bg-amber-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              Tudo que o seu negócio precisa, em um só lugar
            </h2>
            <p className="text-gray-500 text-lg">Ferramentas criadas especificamente para quem vende cestas.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                icon: Calculator,
                title: 'Calculadora de Lucro',
                desc: 'Informe os ingredientes e o sistema calcula automaticamente o custo real, a margem e o preço mínimo de venda. Nunca mais cobre menos do que deve.',
                color: 'text-green-600',
                bg: 'bg-green-50',
              },
              {
                icon: ShoppingBasket,
                title: 'Montador com IA',
                desc: 'Descreva a ocasião — aniversário, dia dos namorados, corporativo — e a inteligência artificial sugere os itens ideais para a cesta e o texto de apresentação.',
                color: 'text-purple-600',
                bg: 'bg-purple-50',
              },
              {
                icon: ShoppingCart,
                title: 'Controle de Vendas',
                desc: 'Cadastre pedidos, acompanhe entregas, vincule clientes e veja o histórico completo de cada venda. Nunca mais esqueça uma entrega.',
                color: 'text-blue-600',
                bg: 'bg-blue-50',
              },
              {
                icon: MessageSquareText,
                title: 'Scripts de Venda',
                desc: 'Textos prontos para WhatsApp e Instagram para cada ocasião. Ou use a IA para criar mensagens personalizadas com base na sua cesta específica.',
                color: 'text-amber-600',
                bg: 'bg-amber-50',
              },
            ].map(({ icon: Icon, title, desc, color, bg }) => (
              <div key={title} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex gap-4">
                <div className={`${bg} rounded-xl p-3 h-fit`}>
                  <Icon className={`h-5 w-5 ${color}`} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-1.5">{title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Prova social ────────────────────────────────────────────────────── */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              Quem usa, não volta para a planilha
            </h2>
            <p className="text-gray-500">Depoimentos de empreendedoras reais.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {[
              {
                name: 'Ana Souza',
                city: 'São Paulo, SP',
                text: '"Antes eu ficava no chute nos preços. Agora eu sei exatamente quanto ganho em cada cesta. Em 2 meses aumentei meu lucro em 40%."',
                stars: 5,
              },
              {
                name: 'Fernanda Lima',
                city: 'Curitiba, PR',
                text: '"O montador com IA é incrível. Uma cliente pediu uma cesta fitness e em 30 segundos já tinha a sugestão completa com texto para mandar no Instagram."',
                stars: 5,
              },
              {
                name: 'Juliana Costa',
                city: 'Belo Horizonte, MG',
                text: '"Organização total. Antes perdia pedido, esquecia entrega. Agora tudo está no sistema e recebo alerta de clientes para reconquistar."',
                stars: 5,
              },
            ].map((t) => (
              <div key={t.name} className="border border-gray-100 rounded-2xl p-5 shadow-sm">
                <div className="flex gap-0.5 mb-3">
                  {Array.from({ length: t.stars }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-sm text-gray-600 leading-relaxed mb-4 italic">{t.text}</p>
                <div>
                  <p className="font-semibold text-gray-800 text-sm">{t.name}</p>
                  <p className="text-xs text-gray-400">{t.city}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Preços ──────────────────────────────────────────────────────────── */}
      <section id="precos" className="py-20 px-6 bg-amber-50">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Planos simples, sem surpresa</h2>
            <p className="text-gray-500">7 dias grátis em qualquer plano. Cancele quando quiser.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Básico */}
            <div className="bg-white border border-gray-200 rounded-2xl p-7 shadow-sm">
              <p className="text-sm font-semibold text-gray-500 mb-1">Básico</p>
              <div className="flex items-end gap-1 mb-1">
                <span className="text-4xl font-extrabold text-gray-900">R$29</span>
                <span className="text-gray-400 pb-1">/mês</span>
              </div>
              <p className="text-xs text-gray-400 mb-6">menos de R$1 por dia</p>
              <ul className="space-y-2.5 mb-7">
                {[
                  'Calculadora de lucro completa',
                  'Montador de cestas',
                  'Catálogo digital',
                  'Controle financeiro',
                  'Painel de indicadores',
                  'Negócio Legal (guia MEI)',
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-sm text-gray-600">
                    <Check className="h-4 w-4 text-green-500 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/signup"
                className="block text-center border-2 border-amber-600 text-amber-700 hover:bg-amber-50 font-semibold py-3 rounded-xl transition-colors"
              >
                Começar grátis
              </Link>
            </div>

            {/* Premium */}
            <div className="bg-amber-600 border border-amber-600 rounded-2xl p-7 shadow-lg shadow-amber-200 relative">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-900 text-white text-xs font-bold px-3 py-1 rounded-full">
                MAIS POPULAR
              </span>
              <p className="text-sm font-semibold text-amber-100 mb-1">Premium</p>
              <div className="flex items-end gap-1 mb-1">
                <span className="text-4xl font-extrabold text-white">R$59</span>
                <span className="text-amber-200 pb-1">/mês</span>
              </div>
              <p className="text-xs text-amber-200 mb-6">menos de R$2 por dia</p>
              <ul className="space-y-2.5 mb-7">
                {[
                  'Tudo do plano Básico',
                  'Montador com IA',
                  'Scripts de venda com IA',
                  'Calendário comercial',
                  'Gestão de clientes + alertas',
                  'Treinamentos exclusivos',
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-sm text-white">
                    <Check className="h-4 w-4 text-amber-200 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/signup"
                className="block text-center bg-white text-amber-700 hover:bg-amber-50 font-bold py-3 rounded-xl transition-colors"
              >
                Começar grátis
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ─────────────────────────────────────────────────────────────── */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-10">Perguntas frequentes</h2>
          <div className="space-y-3">
            {[
              {
                q: 'Preciso ter CNPJ para usar?',
                a: 'Não. Qualquer pessoa pode usar o sistema, seja informal, MEI, ME ou qualquer outro tipo. O CNPJ só é necessário se você quiser emitir notas fiscais — isso fica por conta de você.',
              },
              {
                q: 'Como funciona o período grátis?',
                a: 'Você tem 7 dias de acesso completo sem precisar cadastrar cartão. Ao fim dos 7 dias, escolhe um plano para continuar. Se não assinar, sua conta fica inativa — seus dados ficam salvos por 30 dias.',
              },
              {
                q: 'Posso cancelar a qualquer momento?',
                a: 'Sim, sem burocracia. Cancele direto pelo próprio app a qualquer momento. Você continua com acesso até o fim do período já pago.',
              },
              {
                q: 'A IA do montador de cestas realmente funciona?',
                a: 'Sim. Você descreve a ocasião e o público (ex: "cesta romântica para casal jovem, orçamento R$150") e a IA sugere os itens, quantidades e um texto de apresentação pronto para usar.',
              },
              {
                q: 'Meus dados ficam seguros?',
                a: 'Sim. Usamos infraestrutura de nível enterprise (Supabase + Vercel), com criptografia em trânsito e em repouso. Seus dados não são compartilhados com terceiros.',
              },
            ].map(({ q, a }) => (
              <details key={q} className="border border-gray-100 rounded-xl group">
                <summary className="flex items-center justify-between px-5 py-4 cursor-pointer font-medium text-gray-800 select-none list-none hover:bg-gray-50 rounded-xl transition-colors">
                  {q}
                  <span className="text-gray-400 text-lg group-open:rotate-45 transition-transform duration-200">+</span>
                </summary>
                <div className="px-5 pb-4 text-sm text-gray-500 leading-relaxed">{a}</div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Final ───────────────────────────────────────────────────────── */}
      <section className="py-20 px-6 bg-gradient-to-br from-amber-600 to-amber-700 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4">
            Sua concorrente já pode estar usando.<br />Comece hoje.
          </h2>
          <p className="text-amber-100 text-lg mb-8">
            7 dias grátis. Sem cartão. Sem burocracia.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 bg-white text-amber-700 hover:bg-amber-50 font-bold px-10 py-4 rounded-xl text-lg transition-colors shadow-lg"
          >
            <Zap className="h-5 w-5" />
            Criar minha conta grátis
          </Link>
          <p className="text-amber-200 text-sm mt-4">Acesso imediato · sem cartão necessário</p>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <footer className="bg-gray-900 text-gray-400 py-10 px-6">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <p className="text-white font-bold mb-1">🧺 Empresa de Cestas</p>
            <p className="text-xs">O sistema de gestão para empreendedoras de cestas.</p>
          </div>
          <div className="flex items-center gap-6 text-sm">
            <Link href="/login" className="hover:text-white transition-colors">Entrar</Link>
            <Link href="/signup" className="hover:text-white transition-colors">Criar conta</Link>
            <Link href="#precos" className="hover:text-white transition-colors">Planos</Link>
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            <Shield className="h-3.5 w-3.5 text-green-400" />
            <span>Dados seguros · Cancele quando quiser</span>
          </div>
        </div>
        <div className="max-w-5xl mx-auto mt-6 pt-6 border-t border-gray-800 text-center text-xs">
          © {new Date().getFullYear()} Empresa de Cestas · empresadecestas.com.br
        </div>
      </footer>

    </div>
  )
}
