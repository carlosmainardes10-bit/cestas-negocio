import {
  Info, TrendingUp, Tag, BarChart3, ListChecks,
  AlertTriangle, FileText, Calendar, UserCheck,
  Receipt, Palette, Globe, Scale,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function NegocioLegalPage() {
  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Scale className="h-6 w-6 text-amber-700" />
          Negócio Legal
        </h1>
        <p className="text-muted-foreground">Tudo que você precisa saber para vender com segurança</p>
      </div>

      {/* Disclaimer banner */}
      <div className="flex gap-3 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 mb-6">
        <Info className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
        <p className="text-sm text-blue-800">
          Este conteúdo é educativo e não substitui a orientação de um contador.
        </p>
      </div>

      <div className="space-y-4">

        {/* Bloco 1 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              Por que se formalizar?
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            <p className="text-muted-foreground">
              Vender cestas informalmente parece mais simples no começo, mas traz riscos e limita o crescimento. Com o MEI você:
            </p>
            <ul className="space-y-1.5 mt-2">
              {[
                'Emite nota fiscal — empresas e prefeituras exigem isso para fechar contrato',
                'Abre conta PJ e acessa maquininha com taxas menores',
                'Tem acesso a crédito e financiamento no nome do negócio',
                'Conta com proteção do INSS: auxílio-doença, licença-maternidade e aposentadoria',
                'Se protege juridicamente em caso de reclamações de clientes',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5 shrink-0">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Bloco 2 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Tag className="h-4 w-4 text-amber-600" />
              O CNAE certo para quem vende cestas
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-3">
            <p className="text-muted-foreground">
              O CNAE é o código que define o que você pode fazer como MEI. Para cestas, o correto é:
            </p>
            <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
              <p className="font-semibold text-amber-900">4729-6/99</p>
              <p className="text-amber-800 text-xs mt-0.5">
                Comércio varejista de produtos alimentícios em geral
                <br />
                <span className="text-muted-foreground">(cobre cestas de café da manhã, cestas de presente e similares)</span>
              </p>
            </div>
            <div className="flex gap-2 bg-orange-50 border border-orange-200 rounded-lg px-3 py-2.5">
              <AlertTriangle className="h-4 w-4 text-orange-600 shrink-0 mt-0.5" />
              <p className="text-orange-800 text-xs">
                Este CNAE cobre a <strong>comercialização</strong> das cestas. Se você também <strong>fabrica</strong> produtos dentro da cesta — bolos, salgados, doces artesanais — pode precisar de um segundo CNAE específico para produção de alimentos. Consulte um contador.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Bloco 3 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-blue-600" />
              Limites do MEI em 2026
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-3">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left font-medium px-3 py-2 rounded-tl-md">Limite</th>
                  <th className="text-left font-medium px-3 py-2 rounded-tr-md">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                <tr>
                  <td className="px-3 py-2 text-muted-foreground">Faturamento anual máximo</td>
                  <td className="px-3 py-2 font-medium">R$ 81.000</td>
                </tr>
                <tr>
                  <td className="px-3 py-2 text-muted-foreground">Média mensal de referência</td>
                  <td className="px-3 py-2 font-medium">R$ 6.750</td>
                </tr>
                <tr>
                  <td className="px-3 py-2 text-muted-foreground">Tolerância (até 20% acima)</td>
                  <td className="px-3 py-2 font-medium">R$ 97.200</td>
                </tr>
              </tbody>
            </table>
            <div>
              <p className="font-medium mb-1">O que acontece se ultrapassar?</p>
              <ul className="space-y-1 text-muted-foreground">
                <li>• <strong className="text-foreground">Até R$ 97.200 no ano:</strong> pode continuar como MEI até dezembro e migra para Microempresa em janeiro do ano seguinte</li>
                <li>• <strong className="text-foreground">Acima de R$ 97.200:</strong> precisa migrar imediatamente</li>
              </ul>
            </div>
            <Tip>Se estiver faturando consistentemente acima de R$ 5.000/mês, já vale conversar com um contador sobre o planejamento de crescimento.</Tip>
          </CardContent>
        </Card>

        {/* Bloco 4 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <ListChecks className="h-4 w-4 text-green-600" />
              Como abrir o MEI (passo a passo)
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <ol className="space-y-2">
              {[
                <>Acesse <ExternalLink href="https://www.gov.br/empresas-e-negocios/pt-br/empreendedor">gov.br/mei</ExternalLink> com sua conta Gov.br</>,
                <>Clique em "Formalize-se"</>,
                <>Informe seus dados pessoais e endereço</>,
                <>Escolha o CNAE <strong>4729-6/99</strong></>,
                <>Confirme e receba seu CNPJ na hora — <strong>é gratuito</strong></>,
              ].map((item, i) => (
                <li key={i} className="flex gap-3">
                  <span className="bg-amber-100 text-amber-800 font-bold rounded-full w-5 h-5 flex items-center justify-center text-xs shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <span className="text-muted-foreground">{item}</span>
                </li>
              ))}
            </ol>
            <p className="mt-3 text-muted-foreground">Pronto. Em menos de 10 minutos você tem um CNPJ ativo.</p>
          </CardContent>
        </Card>

        {/* Bloco 5 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              Erros comuns de quem começa
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <ul className="space-y-2">
              {[
                ['Misturar conta pessoal com conta do negócio', 'impossibilita saber se o negócio dá lucro de verdade'],
                ['Não emitir nota fiscal', 'perde clientes corporativos e fica irregular'],
                ['Não guardar reserva', 'recomendado separar pelo menos 10% do faturamento para impostos e imprevistos'],
                ['Não anotar as vendas', 'sem controle, é impossível saber se está dentro do limite do MEI'],
                ['CNAE errado', 'usar um código inadequado pode gerar problemas na fiscalização'],
              ].map(([title, detail]) => (
                <li key={title} className="flex items-start gap-2">
                  <span className="text-red-400 shrink-0 mt-0.5">✕</span>
                  <span>
                    <strong>{title}</strong>
                    <span className="text-muted-foreground"> — {detail}</span>
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Bloco 6 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4 text-purple-600" />
              Imposto de Renda: o que você precisa saber
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-4">
            <p className="text-muted-foreground">Ser MEI envolve duas declarações diferentes que muita gente confunde:</p>
            <div className="space-y-3">
              <div className="border rounded-lg p-3 space-y-1">
                <p className="font-semibold">DASN-SIMEI <span className="text-xs font-normal text-muted-foreground">(obrigatória para todos os MEIs)</span></p>
                <p className="text-muted-foreground text-xs">Informa o faturamento do seu CNPJ ao governo. Prazo: até <strong className="text-foreground">31 de maio</strong> de cada ano. Deve ser entregue mesmo que você não tenha faturado nada — quem perde o prazo paga multa mínima de R$ 50.</p>
              </div>
              <div className="border rounded-lg p-3 space-y-1">
                <p className="font-semibold">IRPF — Imposto de Renda Pessoa Física <span className="text-xs font-normal text-muted-foreground">(pode ou não ser obrigatório)</span></p>
                <p className="text-muted-foreground text-xs">O MEI só precisa declarar o IR como pessoa física se seus rendimentos tributáveis ultrapassarem aproximadamente R$ 33.888 no ano. O erro mais comum é confundir o faturamento do CNPJ com a renda tributável da pessoa física — são coisas diferentes.</p>
              </div>
            </div>
            <Tip>Anote todo mês quanto você retirou do negócio para uso pessoal (pró-labore). Esse valor é o que importa para o IR, não o total que entrou na conta.</Tip>
          </CardContent>
        </Card>

        {/* Bloco 7 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-4 w-4 text-blue-600" />
              Manter em dia: calendário do MEI
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-3">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left font-medium px-3 py-2">Obrigação</th>
                  <th className="text-left font-medium px-3 py-2">Prazo</th>
                  <th className="text-left font-medium px-3 py-2">Consequência</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                <tr>
                  <td className="px-3 py-2 font-medium">DAS mensal</td>
                  <td className="px-3 py-2 text-muted-foreground">Até dia 20 de cada mês</td>
                  <td className="px-3 py-2 text-muted-foreground">Juros + risco de perder benefícios do INSS</td>
                </tr>
                <tr>
                  <td className="px-3 py-2 font-medium">DASN-SIMEI anual</td>
                  <td className="px-3 py-2 text-muted-foreground">Até 31 de maio</td>
                  <td className="px-3 py-2 text-muted-foreground">Multa mínima de R$ 50</td>
                </tr>
                <tr>
                  <td className="px-3 py-2 font-medium">Relatório mensal de receitas</td>
                  <td className="px-3 py-2 text-muted-foreground">Até dia 20 do mês seguinte</td>
                  <td className="px-3 py-2 text-muted-foreground">Desorganização e risco na declaração</td>
                </tr>
              </tbody>
            </table>
            <div>
              <p className="font-medium mb-1">Separação de contas — fundamental</p>
              <p className="text-muted-foreground">
                Abra uma conta PJ (Nubank PJ, Inter PJ, Mercado Pago são gratuitas) e mantenha todo o dinheiro das cestas separado das finanças pessoais. Isso facilita o controle, a declaração e mostra claramente se o negócio está dando lucro.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Bloco 8 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-indigo-600" />
              Quando procurar um contador?
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            <p className="text-muted-foreground mb-1">Você não precisa de contador desde o início, mas existem momentos em que vale muito a pena:</p>
            <ul className="space-y-2">
              {[
                'Quando faturar acima de R$ 4.000/mês de forma consistente — sinal de crescimento que precisa de planejamento',
                'Se quiser emitir nota fiscal de produto e de serviço — pode precisar de CNAEs adicionais',
                'Se for contratar um funcionário — MEI pode ter 1 funcionário, mas há regras específicas na folha de pagamento',
                'Quando estiver próximo do limite de R$ 81.000/ano — a migração para ME precisa ser planejada com antecedência',
                'Se receber proposta de contrato com empresa grande — contratos PJ têm implicações fiscais importantes',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2 text-muted-foreground">
                  <span className="text-indigo-400 shrink-0">→</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <Tip>Um contador especializado em MEI custa entre R$ 80–150/mês e se paga facilmente evitando multas e erros na declaração.</Tip>
          </CardContent>
        </Card>

        {/* Bloco 9 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Receipt className="h-4 w-4 text-green-600" />
              Como emitir nota fiscal para empresa
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-4">
            <div className="space-y-2">
              <p className="font-medium">Nota de Serviço (NFS-e) — mais comum para cestas</p>
              <p className="text-muted-foreground">Cobre a montagem e entrega da cesta. É a mais simples de emitir e a que a maioria dos clientes empresariais aceita.</p>
              <ol className="space-y-1.5 mt-2">
                {[
                  <><ExternalLink href="https://www.nfse.gov.br">nfse.gov.br</ExternalLink> — faça login com o CNPJ do seu MEI</>,
                  <>Selecione <strong>"Nova Emissão" → "Emissão Simplificada"</strong></>,
                  <>Informe: CNPJ do cliente, descrição do serviço e valor total</>,
                  <>Emita e envie o PDF para o cliente</>,
                ].map((item, i) => (
                  <li key={i} className="flex gap-2 text-muted-foreground">
                    <span className="font-medium text-foreground w-4 shrink-0">{i + 1}.</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ol>
              <p className="text-xs text-muted-foreground">É gratuito, oficial e leva menos de 2 minutos depois que você aprende.</p>
            </div>
            <div className="border-t pt-3 space-y-1">
              <p className="font-medium">Nota de Produto (NF-e) — para venda de mercadorias</p>
              <p className="text-muted-foreground">Se o cliente exigir nota de produto, use o app <strong>Nota Fiscal Fácil (NFF)</strong> da SEFAZ, disponível gratuitamente para Android e iOS.</p>
            </div>
          </CardContent>
        </Card>

        {/* Bloco 10 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Palette className="h-4 w-4 text-pink-600" />
              Crie sua identidade visual gratuitamente
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-4">
            <div>
              <p className="font-medium mb-2">Nome da empresa</p>
              <ul className="space-y-1.5 text-muted-foreground">
                <li>• <strong className="text-foreground"><ExternalLink href="https://infinitepay.io/materiais/gerador-nome-empresa">InfinitePay</ExternalLink></strong> — em português, informa o ramo e o estilo e gera sugestões exclusivas</li>
                <li>• <strong className="text-foreground"><ExternalLink href="https://www.godaddy.com/pt-br/gerador-de-nomes">GoDaddy</ExternalLink></strong> — só sugere nomes com domínio disponível, útil para quem quer garantir o site junto</li>
              </ul>
              <div className="flex gap-2 bg-orange-50 border border-orange-200 rounded-lg px-3 py-2 mt-2">
                <AlertTriangle className="h-3.5 w-3.5 text-orange-600 shrink-0 mt-0.5" />
                <p className="text-orange-800 text-xs">Antes de se apaixonar por um nome, verifique se ele já não está registrado no <ExternalLink href="https://www.inpi.gov.br">INPI</ExternalLink> (inpi.gov.br).</p>
              </div>
            </div>
            <div className="border-t pt-3">
              <p className="font-medium mb-2">Logo</p>
              <ul className="space-y-1.5 text-muted-foreground">
                <li>• <strong className="text-foreground"><ExternalLink href="https://www.canva.com">Canva</ExternalLink></strong> — o mais popular no Brasil, editor de arrastar e soltar, centenas de templates para cestas e alimentação. Gratuito para uso básico.</li>
                <li>• <strong className="text-foreground"><ExternalLink href="https://www.adobe.com/br/express">Adobe Express</ExternalLink></strong> — gera logo com IA a partir de uma descrição em texto. Download gratuito em PNG com fundo transparente.</li>
              </ul>
              <Tip>Crie a logo no Canva e use o mesmo perfil para criar artes para o Instagram, cardápios e cartões de visita — tudo no mesmo lugar.</Tip>
            </div>
          </CardContent>
        </Card>

        {/* Bloco 11 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Globe className="h-4 w-4 text-cyan-600" />
              Crie seu site gratuitamente
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-3">
            <div className="space-y-3">
              <div>
                <p className="font-medium">Para quem está começando agora</p>
                <p className="text-muted-foreground mt-0.5"><strong className="text-foreground">Linktree ou Bio.site</strong> — não é um site completo, mas uma página única com todos os seus links (WhatsApp, Instagram, cardápio, etc.). Gratuito, pronto em 5 minutos.</p>
              </div>
              <div>
                <p className="font-medium">Para um site mais completo</p>
                <ul className="space-y-1 text-muted-foreground mt-0.5">
                  <li>• <strong className="text-foreground"><ExternalLink href="https://www.wix.com">Wix</ExternalLink></strong> — interface simples, visual profissional, funciona bem no celular. O plano gratuito já é suficiente para começar.</li>
                  <li>• <strong className="text-foreground"><ExternalLink href="https://www.canva.com/pt_br/criar/sites">Canva Sites</ExternalLink></strong> — quem já usa o Canva pode criar um site lá mesmo, com o mesmo visual.</li>
                </ul>
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg px-4 py-3 space-y-1">
              <p className="font-medium text-xs">Sequência recomendada</p>
              <ol className="space-y-1 text-xs text-muted-foreground">
                <li>1. <strong className="text-foreground">Comece com Linktree</strong> — presença online em minutos, zero conhecimento técnico</li>
                <li>2. <strong className="text-foreground">Quando crescer</strong> → Wix gratuito para um site mais completo</li>
                <li>3. <strong className="text-foreground">Quando quiser domínio próprio</strong> → plano pago do Wix a partir de R$ 15/mês</li>
              </ol>
            </div>
            <div className="flex gap-2 bg-orange-50 border border-orange-200 rounded-lg px-3 py-2">
              <AlertTriangle className="h-3.5 w-3.5 text-orange-600 shrink-0 mt-0.5" />
              <p className="text-orange-800 text-xs"><strong>Evite o Google Sites</strong> — é gratuito mas passa pouca credibilidade, o visual é muito básico e a URL é longa e feia.</p>
            </div>
          </CardContent>
        </Card>

        {/* Footer legal notice */}
        <div className="text-xs text-muted-foreground bg-gray-50 border rounded-lg px-4 py-3 leading-relaxed">
          As informações desta página têm caráter educativo e foram elaboradas com base na legislação vigente em 2026. Elas não substituem a orientação de um contador ou advogado. Consulte um profissional para situações específicas do seu negócio.
        </div>

      </div>
    </div>
  )
}

function Tip({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-2">
      <span className="text-amber-600 shrink-0 text-sm">💡</span>
      <p className="text-amber-800 text-xs">{children}</p>
    </div>
  )
}

function ExternalLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
      {children}
    </a>
  )
}
