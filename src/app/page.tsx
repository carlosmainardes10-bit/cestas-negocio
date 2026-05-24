import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  Check, ArrowRight, Star, Zap, Shield,
  Calculator, ShoppingBasket, ShoppingCart,
  MessageSquareText, TrendingUp, Users, ChevronRight,
} from 'lucide-react'
import { verifySession } from '@/lib/supabase/dal'
import { Logo } from '@/components/Logo'

export default async function LandingPage() {
  const user = await verifySession()
  if (user) redirect('/calculadora')

  return (
    <div className="min-h-screen bg-white text-[#111111]" style={{ fontFamily: 'var(--font-geist-sans)' }}>

      {/* ── Nav ─────────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Logo height={50} />
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">
              Entrar
            </Link>
            <Link
              href="/signup"
              className="bg-[#FF6B00] hover:bg-orange-600 text-white text-sm font-bold px-5 py-2.5 rounded-full transition-colors"
            >
              Começar grátis
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ────────────────────────────────────────────────────────────── */}
      <section className="bg-gradient-to-b from-orange-50 via-white to-white pt-16 pb-20 px-6 overflow-hidden">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">

            {/* Left: text */}
            <div>
              <div className="inline-flex items-center gap-2 bg-orange-100 text-[#FF6B00] text-xs font-bold px-4 py-2 rounded-full mb-6 uppercase tracking-wide">
                🧺 O sistema #1 para vendedoras de cestas
              </div>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-black tracking-tighter leading-[1.02] mb-6 text-[#111111]">
                Pare de improvisar.<br />
                <span className="text-[#FF6B00]">Venda mais</span><br />
                cestas.
              </h1>
              <p className="text-xl text-gray-500 font-medium mb-8 max-w-md leading-relaxed">
                Calculadora de lucro, montador com IA, controle de vendas e clientes — tudo por menos de <strong className="text-[#111111]">R$1 por dia</strong>.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 mb-8">
                <Link
                  href="/signup"
                  className="inline-flex items-center justify-center gap-2 bg-[#FF6B00] hover:bg-orange-600 text-white font-black text-lg px-8 py-4 rounded-2xl transition-colors shadow-[0_8px_30px_rgba(255,107,0,0.3)]"
                >
                  Começar grátis por 7 dias
                  <ArrowRight className="h-5 w-5" />
                </Link>
                <Link
                  href="#precos"
                  className="inline-flex items-center justify-center gap-2 border-2 border-gray-200 hover:border-gray-400 text-gray-700 font-bold text-lg px-8 py-4 rounded-2xl transition-colors"
                >
                  Ver planos
                </Link>
              </div>
              <div className="flex items-center gap-5 text-sm text-gray-500">
                <span className="flex items-center gap-1.5"><Check className="h-4 w-4 text-green-500" />7 dias grátis</span>
                <span className="flex items-center gap-1.5"><Check className="h-4 w-4 text-green-500" />Sem cartão</span>
                <span className="flex items-center gap-1.5"><Check className="h-4 w-4 text-green-500" />Cancele quando quiser</span>
              </div>
            </div>

            {/* Right: phone mockup */}
            <div className="flex justify-center lg:justify-end">
              <PhoneMockup />
            </div>

          </div>
        </div>
      </section>

      {/* ── Trust strip ─────────────────────────────────────────────────────── */}
      <section className="bg-[#F7F7F7] py-10 px-6 border-y border-gray-200">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { number: '500+', label: 'empreendedoras' },
              { number: 'R$1M+', label: 'em vendas gerenciadas' },
              { number: '4.9★', label: 'avaliação média' },
              { number: '7 dias', label: 'teste grátis' },
            ].map((s) => (
              <div key={s.label}>
                <p className="text-3xl font-black text-[#111111]">{s.number}</p>
                <p className="text-sm text-gray-500 font-medium mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Dor ─────────────────────────────────────────────────────────────── */}
      <section className="bg-[#111111] py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-white/10 text-white text-xs font-bold px-4 py-2 rounded-full mb-6 uppercase tracking-wide">
            😓 A dura realidade
          </div>
          <h2 className="text-4xl md:text-5xl font-black tracking-tighter text-white mb-4">
            Você ainda usa caderno ou planilha<br />para precificar suas cestas?
          </h2>
          <p className="text-gray-400 text-xl font-medium mb-12 max-w-2xl">
            A maioria das empreendedoras perde dinheiro todo mês sem perceber.
          </p>
          <div className="grid md:grid-cols-3 gap-5">
            {[
              {
                emoji: '📒',
                title: 'Anotações perdidas',
                text: 'Custo no caderno, preço na memória. Quando o mês fecha, o saldo nunca bate.',
              },
              {
                emoji: '🤷',
                title: 'Preço no chute',
                text: 'Sem calcular gás, embalagem, tempo e deslocamento, você cobra menos do que deveria.',
              },
              {
                emoji: '📱',
                title: 'Pedidos no WhatsApp',
                text: 'Entrega esquecida, cliente sem resposta, histórico espalhado. Caos total.',
              },
            ].map((item) => (
              <div key={item.title} className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-colors">
                <span className="text-4xl mb-4 block">{item.emoji}</span>
                <p className="font-black text-white text-lg mb-2">{item.title}</p>
                <p className="text-gray-400 text-sm leading-relaxed">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Solução ─────────────────────────────────────────────────────────── */}
      <section className="bg-white py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 bg-orange-100 text-[#FF6B00] text-xs font-bold px-4 py-2 rounded-full mb-5 uppercase tracking-wide">
              ✨ O que você vai ter
            </div>
            <h2 className="text-4xl md:text-5xl font-black tracking-tighter text-[#111111] mb-4">
              Tudo que seu negócio precisa,<br />em um só lugar
            </h2>
            <p className="text-gray-500 text-xl font-medium max-w-xl mx-auto">
              Ferramentas criadas especificamente para quem vende cestas.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            {[
              {
                icon: Calculator,
                emoji: '🧮',
                title: 'Calculadora de Lucro',
                desc: 'Informe os ingredientes e o sistema calcula automaticamente o custo real, a margem e o preço mínimo de venda. Nunca mais cobre menos do que deve.',
                color: '#22c55e',
                bg: '#f0fdf4',
              },
              {
                icon: ShoppingBasket,
                emoji: '🤖',
                title: 'Montador com IA',
                desc: 'Descreva a ocasião e a IA sugere os itens ideais para a cesta e o texto de apresentação pronto para WhatsApp ou Instagram.',
                color: '#8b5cf6',
                bg: '#faf5ff',
              },
              {
                icon: ShoppingCart,
                emoji: '📦',
                title: 'Controle de Vendas',
                desc: 'Cadastre pedidos, acompanhe entregas, vincule clientes e veja o histórico completo de cada venda em um painel limpo.',
                color: '#3b82f6',
                bg: '#eff6ff',
              },
              {
                icon: MessageSquareText,
                emoji: '💬',
                title: 'Scripts de Venda',
                desc: 'Textos prontos para WhatsApp e Instagram para cada ocasião — ou use a IA para criar mensagens personalizadas da sua cesta.',
                color: '#FF6B00',
                bg: '#fff7ed',
              },
            ].map(({ emoji, title, desc, color, bg }) => (
              <div
                key={title}
                className="border-2 border-gray-100 rounded-2xl p-7 shadow-[0_4px_24px_rgba(0,0,0,0.07)] hover:shadow-[0_8px_40px_rgba(0,0,0,0.12)] hover:-translate-y-0.5 transition-all"
              >
                <div className="flex items-start gap-4">
                  <div className="text-4xl shrink-0">{emoji}</div>
                  <div>
                    <h3 className="font-black text-[#111111] text-xl mb-2">{title}</h3>
                    <p className="text-gray-500 leading-relaxed">{desc}</p>
                    <div className="mt-4 flex items-center gap-1 font-bold text-sm" style={{ color }}>
                      Saiba mais <ChevronRight className="h-4 w-4" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Galeria de cestas ───────────────────────────────────────────────── */}
      <section className="bg-white py-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Cestas criadas por empreendedoras que usam o app</p>
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-2xl overflow-hidden aspect-[4/3] shadow-[0_8px_30px_rgba(0,0,0,0.12)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://fbovqqyzghzmpgkctpyb.supabase.co/storage/v1/object/public/training/Especial%20rosa.jpeg"
                alt="Cesta especial rosa"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="rounded-2xl overflow-hidden aspect-[4/3] shadow-[0_8px_30px_rgba(0,0,0,0.12)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://fbovqqyzghzmpgkctpyb.supabase.co/storage/v1/object/public/training/Especial%20vermelha.jpeg"
                alt="Cesta especial vermelha"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── Prova social ────────────────────────────────────────────────────── */}
      <section className="bg-[#F7F7F7] py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-yellow-100 text-yellow-700 text-xs font-bold px-4 py-2 rounded-full mb-5 uppercase tracking-wide">
              ⭐ Quem usa, aprova
            </div>
            <h2 className="text-4xl md:text-5xl font-black tracking-tighter text-[#111111]">
              Quem usa não volta<br />para a planilha
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {[
              {
                name: 'Ana Souza',
                city: 'São Paulo, SP',
                text: '"Antes ficava no chute nos preços. Agora sei exatamente quanto ganho em cada cesta. Em 2 meses aumentei meu lucro em 40%."',
              },
              {
                name: 'Fernanda Lima',
                city: 'Curitiba, PR',
                text: '"O montador com IA é incrível. Uma cliente pediu uma cesta fitness e em 30 segundos já tinha a sugestão completa com texto para o Instagram."',
              },
              {
                name: 'Juliana Costa',
                city: 'Belo Horizonte, MG',
                text: '"Antes perdia pedido, esquecia entrega. Agora tudo está no sistema e recebo alerta de clientes para reconquistar. Essencial."',
              },
            ].map((t) => (
              <div key={t.name} className="bg-white border-2 border-gray-100 rounded-2xl p-6 shadow-[0_4px_24px_rgba(0,0,0,0.06)]">
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-600 leading-relaxed mb-5 text-[15px]">{t.text}</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center font-black text-[#FF6B00]">
                    {t.name[0]}
                  </div>
                  <div>
                    <p className="font-black text-[#111111] text-sm">{t.name}</p>
                    <p className="text-gray-400 text-xs">{t.city}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Preços ──────────────────────────────────────────────────────────── */}
      <section id="precos" className="bg-white py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 text-xs font-bold px-4 py-2 rounded-full mb-5 uppercase tracking-wide">
              💸 Investimento
            </div>
            <h2 className="text-4xl md:text-5xl font-black tracking-tighter text-[#111111] mb-3">
              Planos simples, sem surpresa
            </h2>
            <p className="text-gray-500 text-xl font-medium">7 dias grátis em qualquer plano. Cancele quando quiser.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {/* Básico */}
            <div className="border-2 border-gray-200 rounded-3xl p-8 shadow-[0_4px_24px_rgba(0,0,0,0.07)]">
              <p className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-3">Básico</p>
              <div className="flex items-end gap-1 mb-1">
                <span className="text-5xl font-black text-[#111111]">R$29</span>
                <span className="text-gray-400 pb-2 font-medium">/mês</span>
              </div>
              <p className="text-sm text-gray-400 mb-7">menos de R$1 por dia</p>
              <ul className="space-y-3 mb-8">
                {[
                  'Calculadora de lucro completa',
                  'Montador de cestas',
                  'Catálogo digital',
                  'Controle financeiro',
                  'Painel de indicadores',
                  'Guia Negócio Legal (MEI)',
                ].map((f) => (
                  <li key={f} className="flex items-center gap-3 text-gray-600 font-medium">
                    <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center shrink-0">
                      <Check className="h-3 w-3 text-green-600" />
                    </div>
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/signup"
                className="block text-center border-2 border-[#111111] text-[#111111] hover:bg-[#111111] hover:text-white font-black py-4 rounded-2xl transition-colors text-lg"
              >
                Começar grátis
              </Link>
            </div>

            {/* Premium */}
            <div className="border-2 border-[#FF6B00] rounded-3xl p-8 shadow-[0_8px_40px_rgba(255,107,0,0.2)] relative">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#FF6B00] text-white text-xs font-black px-5 py-2 rounded-full uppercase tracking-wide">
                🔥 Mais popular
              </div>
              <p className="text-sm font-bold text-[#FF6B00] uppercase tracking-widest mb-3">Premium</p>
              <div className="flex items-end gap-1 mb-1">
                <span className="text-5xl font-black text-[#111111]">R$59</span>
                <span className="text-gray-400 pb-2 font-medium">/mês</span>
              </div>
              <p className="text-sm text-gray-400 mb-7">menos de R$2 por dia</p>
              <ul className="space-y-3 mb-8">
                {[
                  'Tudo do plano Básico',
                  'Montador de cestas com IA',
                  'Scripts de venda com IA',
                  'Calendário comercial',
                  'Gestão de clientes + alertas',
                  'Treinamentos exclusivos',
                ].map((f) => (
                  <li key={f} className="flex items-center gap-3 text-gray-700 font-medium">
                    <div className="w-5 h-5 bg-orange-100 rounded-full flex items-center justify-center shrink-0">
                      <Check className="h-3 w-3 text-[#FF6B00]" />
                    </div>
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/signup"
                className="block text-center bg-[#FF6B00] hover:bg-orange-600 text-white font-black py-4 rounded-2xl transition-colors text-lg shadow-[0_4px_20px_rgba(255,107,0,0.4)]"
              >
                Começar grátis
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ─────────────────────────────────────────────────────────────── */}
      <section className="bg-[#F7F7F7] py-20 px-6">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 text-xs font-bold px-4 py-2 rounded-full mb-5 uppercase tracking-wide">
              ❓ Dúvidas frequentes
            </div>
            <h2 className="text-4xl font-black tracking-tighter text-[#111111]">
              Perguntas frequentes
            </h2>
          </div>
          <div className="space-y-3">
            {[
              {
                q: 'Preciso ter CNPJ para usar?',
                a: 'Não. Qualquer pessoa pode usar, seja informal, MEI, ME ou qualquer outro tipo. O CNPJ só é necessário se você quiser emitir notas fiscais — isso fica por sua conta.',
              },
              {
                q: 'Como funciona o período grátis?',
                a: 'Você tem 7 dias de acesso completo sem precisar cadastrar cartão. Ao fim dos 7 dias, escolhe um plano para continuar. Se não assinar, sua conta fica inativa — seus dados ficam salvos por 30 dias.',
              },
              {
                q: 'Posso cancelar a qualquer momento?',
                a: 'Sim, sem burocracia. Cancele direto pelo app a qualquer momento. Você continua com acesso até o fim do período já pago.',
              },
              {
                q: 'A IA do montador realmente funciona?',
                a: 'Sim. Você descreve a ocasião e o público (ex: "cesta romântica para casal jovem, R$150") e a IA sugere os itens, quantidades e um texto de apresentação pronto para usar.',
              },
              {
                q: 'Meus dados ficam seguros?',
                a: 'Sim. Usamos infraestrutura enterprise (Supabase + Vercel) com criptografia em trânsito e em repouso. Seus dados não são compartilhados com ninguém.',
              },
            ].map(({ q, a }) => (
              <details key={q} className="bg-white border-2 border-gray-200 rounded-2xl group overflow-hidden">
                <summary className="flex items-center justify-between px-6 py-5 cursor-pointer font-black text-[#111111] select-none list-none hover:bg-gray-50 transition-colors">
                  {q}
                  <span className="text-2xl text-gray-400 leading-none group-open:rotate-45 transition-transform duration-200 shrink-0 ml-4">+</span>
                </summary>
                <div className="px-6 pb-5 text-gray-500 leading-relaxed border-t border-gray-100 pt-4">{a}</div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Final ───────────────────────────────────────────────────────── */}
      <section className="bg-[#111111] py-24 px-6 text-center">
        <div className="max-w-3xl mx-auto">
          <div className="text-5xl mb-6">🚀</div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tighter text-white mb-5">
            Sua concorrente já pode<br />estar usando.<br />
            <span className="text-[#FF6B00]">Comece hoje.</span>
          </h2>
          <p className="text-gray-400 text-xl font-medium mb-10">
            7 dias grátis. Sem cartão. Sem burocracia.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-3 bg-[#FF6B00] hover:bg-orange-600 text-white font-black text-xl px-10 py-5 rounded-2xl transition-colors shadow-[0_8px_40px_rgba(255,107,0,0.4)]"
          >
            <Zap className="h-6 w-6" />
            Criar minha conta grátis
            <ArrowRight className="h-6 w-6" />
          </Link>
          <p className="text-gray-600 text-sm mt-5">
            Acesso imediato · sem cartão necessário · cancele quando quiser
          </p>
          <div className="flex items-center justify-center gap-2 mt-8 text-gray-600 text-sm">
            <Shield className="h-4 w-4 text-green-500" />
            Dados criptografados e protegidos
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <footer className="bg-[#0a0a0a] text-gray-500 py-10 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <Logo height={44} className="brightness-0 invert mb-0.5" />
            <p className="text-xs">O sistema de gestão para empreendedoras de cestas.</p>
          </div>
          <div className="flex items-center gap-6 text-sm">
            <Link href="/login" className="hover:text-white transition-colors">Entrar</Link>
            <Link href="/signup" className="hover:text-white transition-colors">Criar conta</Link>
            <Link href="#precos" className="hover:text-white transition-colors">Planos</Link>
          </div>
          <p className="text-xs">© {new Date().getFullYear()} empresadecestas.com.br</p>
        </div>
      </footer>

    </div>
  )
}

function PhoneMockup() {
  return (
    <div className="relative">
      {/* Glow */}
      <div className="absolute inset-0 bg-[#FF6B00] opacity-20 blur-3xl rounded-full scale-75" />

      {/* Phone frame */}
      <div className="relative border-[6px] border-[#111111] rounded-[3rem] w-64 shadow-[0_30px_80px_rgba(0,0,0,0.35)] overflow-hidden bg-white">
        {/* Status bar */}
        <div className="bg-[#111111] px-5 pt-3 pb-2 flex justify-between items-center">
          <span className="text-white text-[10px] font-bold">9:41</span>
          <div className="w-14 h-3.5 bg-[#1a1a1a] rounded-full" />
          <div className="w-8 h-3 bg-white/20 rounded-sm" />
        </div>

        {/* Screen */}
        <div className="bg-gray-50 p-3 space-y-2.5" style={{ minHeight: 480 }}>
          {/* Header */}
          <div className="flex items-center justify-between py-1">
            <div>
              <p className="text-[9px] text-gray-400 font-medium">Olá, Ana 👋</p>
              <p className="text-xs font-black text-[#111111]">Seu negócio hoje</p>
            </div>
            <div className="w-7 h-7 bg-orange-100 rounded-full flex items-center justify-center">
              <span className="text-[10px] font-black text-[#FF6B00]">A</span>
            </div>
          </div>

          {/* KPI cards */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-green-500 rounded-xl p-2.5 text-white">
              <p className="text-[8px] opacity-80">Entradas</p>
              <p className="text-base font-black">R$4.200</p>
            </div>
            <div className="bg-[#FF6B00] rounded-xl p-2.5 text-white">
              <p className="text-[8px] opacity-80">Lucro</p>
              <p className="text-base font-black">R$2.850</p>
            </div>
          </div>

          {/* Orders list */}
          <div className="bg-white rounded-xl p-2.5 border border-gray-100">
            <p className="text-[9px] font-black text-gray-400 uppercase mb-2">Pedidos recentes</p>
            {[
              { name: 'Cesta Romântica', date: 'Amanhã', status: 'pendente' },
              { name: 'Cesta Premium', date: '28/mai', status: 'pendente' },
              { name: 'Cesta Fitness', date: '24/mai', status: 'entregue' },
            ].map((o) => (
              <div key={o.name} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                <div>
                  <p className="text-[9px] font-black text-[#111111]">{o.name}</p>
                  <p className="text-[8px] text-gray-400">{o.date}</p>
                </div>
                <span className={`text-[7px] font-bold px-1.5 py-0.5 rounded-full ${
                  o.status === 'entregue'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-orange-100 text-orange-700'
                }`}>
                  {o.status === 'entregue' ? '✓ Entregue' : '● Pendente'}
                </span>
              </div>
            ))}
          </div>

          {/* AI suggestion */}
          <div className="bg-purple-50 border border-purple-100 rounded-xl p-2.5">
            <p className="text-[8px] font-black text-purple-700 mb-1">🤖 Sugestão da IA</p>
            <p className="text-[8px] text-purple-600 leading-relaxed">Cesta Dia dos Namorados: morango, chocolate belga, espumante, roses...</p>
          </div>
        </div>

        {/* Home indicator */}
        <div className="bg-white pb-2 pt-1 flex justify-center">
          <div className="w-24 h-1 bg-gray-300 rounded-full" />
        </div>
      </div>
    </div>
  )
}
