import { Resend } from 'resend'

export const resend = new Resend(process.env.RESEND_API_KEY)

const FROM = process.env.RESEND_FROM_EMAIL ?? 'onboarding@resend.dev'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

function baseLayout(content: string) {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9f5f0;font-family:sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9f5f0;padding:32px 16px">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;max-width:600px;width:100%">
        <tr>
          <td style="background:#92400e;padding:24px 32px">
            <p style="margin:0;color:#ffffff;font-size:20px;font-weight:700">🧺 Cestas Negócio</p>
          </td>
        </tr>
        <tr><td style="padding:32px">${content}</td></tr>
        <tr>
          <td style="padding:16px 32px 24px;border-top:1px solid #f0ebe4">
            <p style="margin:0;color:#9ca3af;font-size:12px;text-align:center">
              Cestas Negócio · Você está recebendo este e-mail porque tem uma conta conosco.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

function ctaButton(href: string, label: string) {
  return `<a href="${href}" style="display:inline-block;background:#92400e;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:600;font-size:15px;margin:8px 0">${label}</a>`
}

export async function sendWelcomeEmail(to: string, name: string) {
  const html = baseLayout(`
    <h1 style="margin:0 0 8px;font-size:22px;color:#1f2937">Bem-vinda, ${name}! 🥰</h1>
    <p style="margin:0 0 20px;color:#6b7280;font-size:15px">Sua conta no Cestas Negócio está pronta.</p>

    <p style="margin:0 0 16px;color:#374151;font-size:15px;line-height:1.6">
      Você começa com <strong>7 dias de acesso Premium gratuito</strong> — sem precisar cadastrar cartão.
      Aproveite para explorar todas as ferramentas e ver como elas podem transformar o seu negócio.
    </p>

    <p style="margin:0 0 8px;color:#374151;font-size:14px;font-weight:600">O que você pode fazer agora:</p>
    <ul style="margin:0 0 24px;padding-left:20px;color:#374151;font-size:14px;line-height:2">
      <li>📊 <strong>Calculadora de lucro</strong> — descubra sua margem real</li>
      <li>🧺 <strong>Montador de cestas com IA</strong> — monte cestas em segundos</li>
      <li>🖼️ <strong>Catálogo digital</strong> — compartilhe por link no WhatsApp</li>
      <li>💰 <strong>Controle financeiro</strong> — veja seu lucro do mês</li>
      <li>💬 <strong>Scripts de venda</strong> — textos prontos para WhatsApp e Instagram</li>
    </ul>

    <p style="margin:0 0 24px;text-align:left">
      ${ctaButton(`${APP_URL}/calculadora`, 'Acessar minha conta →')}
    </p>

    <p style="margin:0;color:#9ca3af;font-size:13px;line-height:1.6">
      PS: Após os 7 dias, escolha o plano que faz mais sentido para o seu negócio — a partir de R$29/mês.
    </p>
  `)

  return resend.emails.send({
    from: FROM,
    to,
    subject: 'Bem-vinda ao Cestas Negócio! 🧺',
    html,
  })
}

export async function sendPaymentFailedEmail(to: string, name: string) {
  const html = baseLayout(`
    <h1 style="margin:0 0 8px;font-size:22px;color:#1f2937">Ops! Problema com seu pagamento 💳</h1>
    <p style="margin:0 0 20px;color:#6b7280;font-size:15px">Oi, ${name}. Não conseguimos processar o pagamento da sua assinatura.</p>

    <p style="margin:0 0 16px;color:#374151;font-size:15px;line-height:1.6">
      Isso pode acontecer por saldo insuficiente, cartão vencido ou limite excedido.
      <strong>Seu acesso continua ativo por enquanto</strong>, mas atualize seu método de pagamento
      o quanto antes para não perder o acesso.
    </p>

    <p style="margin:0 0 24px;text-align:left">
      ${ctaButton(`${APP_URL}/assinatura`, 'Atualizar pagamento →')}
    </p>

    <p style="margin:0;color:#9ca3af;font-size:13px;line-height:1.6">
      Se precisar de ajuda, responda este e-mail e a gente resolve juntos. 🤝
    </p>
  `)

  return resend.emails.send({
    from: FROM,
    to,
    subject: 'Tivemos um problema com seu pagamento — Cestas Negócio',
    html,
  })
}
