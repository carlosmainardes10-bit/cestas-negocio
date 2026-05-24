import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import type { Product } from '@/types'

interface ItemPayload {
  name: string
  costPerUnit: number
  quantity: number
}

export async function POST(req: NextRequest) {
  try {
    const { category, customType, targetPrice, margin, instructions, currentItems, itemIndex } = await req.json()

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: products } = await supabase
      .from('products')
      .select('*')
      .order('category')
      .order('name')

    const targetCost = targetPrice * (1 - margin / 100)
    const itemToReplace: ItemPayload = currentItems[itemIndex]
    const itemCost = itemToReplace.costPerUnit * itemToReplace.quantity
    const otherCost = currentItems.reduce(
      (sum: number, item: ItemPayload, i: number) => i === itemIndex ? sum : sum + item.costPerUnit * item.quantity,
      0
    )
    const budgetForItem = targetCost - otherCost

    const catalogContext = products && products.length > 0
      ? `\nCATÁLOGO:\n${(products as Product[]).map(p => `ID:${p.id} | ${p.name} | R$${p.cost.toFixed(2)}/${p.unit}`).join('\n')}`
      : '\n(sem catálogo)'

    const otherNames = currentItems
      .filter((_: ItemPayload, i: number) => i !== itemIndex)
      .map((item: ItemPayload) => item.name)
      .join(', ')

    const typeDescription = customType || category
    const userMessage = `Substitua "${itemToReplace.name}" (R$${itemCost.toFixed(2)}) de uma cesta ${typeDescription}.
A cesta já tem: ${otherNames}
Orçamento para o substituto: R$${budgetForItem.toFixed(2)}
${catalogContext}

Sugira UM produto DIFERENTE de "${itemToReplace.name}" que se encaixe bem nessa cesta.${
  instructions ? `\nInstruções adicionais: ${instructions}` : ''
}`

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 256,
      system: `Especialista em cestas de café da manhã. Sugira um produto substituto.

Retorne APENAS JSON válido, sem markdown:
{"name":"...","costPerUnit":0.00,"unit":"un","quantity":1,"fromDb":false,"productId":null}

Regras:
- Produto do catálogo se adequado: fromDb=true, productId=ID exato
- Custo total (costPerUnit × quantity) próximo ao orçamento disponível
- Não repita itens já na cesta
- Nome em português brasileiro`,
      messages: [{ role: 'user', content: userMessage }],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('Resposta da IA sem JSON válido')
    const item = JSON.parse(jsonMatch[0])

    return NextResponse.json({ item })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('mudar-item error:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
