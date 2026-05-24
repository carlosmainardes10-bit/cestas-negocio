'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { getUpcomingDates, type Urgency } from '@/lib/calendar-data'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Bell, CalendarDays, MessageSquareText, ChevronDown, ChevronUp } from 'lucide-react'

const URGENCY_CONFIG: Record<Urgency, { label: string; color: string; border: string }> = {
  hoje:    { label: 'Hoje!',         color: 'bg-red-100 text-red-700',    border: 'border-l-red-500' },
  urgente: { label: 'Esta semana',   color: 'bg-red-50 text-red-600',     border: 'border-l-red-400' },
  atencao: { label: 'Em breve',      color: 'bg-orange-50 text-orange-600', border: 'border-l-orange-400' },
  planeje: { label: 'Planeje agora', color: 'bg-amber-50 text-amber-700', border: 'border-l-amber-400' },
  futuro:  { label: 'No horizonte',  color: 'bg-gray-50 text-gray-500',   border: 'border-l-gray-200' },
  passou:  { label: 'Passou',        color: 'bg-gray-50 text-gray-400',   border: 'border-l-gray-200' },
}

export default function CalendarioPage() {
  const dates = useMemo(() => getUpcomingDates(12), [])
  const [showAll, setShowAll] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)

  const urgent = dates.filter((d) => d.urgency === 'hoje' || d.urgency === 'urgente' || d.urgency === 'atencao')
  const visible = showAll ? dates : dates.slice(0, 6)

  function formatDate(date: Date) {
    return date.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })
  }

  function daysLabel(n: number) {
    if (n === 0) return 'hoje'
    if (n === 1) return 'amanhã'
    return `em ${n} dias`
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Calendário Comercial</h1>
        <p className="text-muted-foreground mt-1">Datas comemorativas com dicas de campanha para suas cestas.</p>
      </div>

      {/* Alert banner */}
      {urgent.length > 0 && (
        <div className="mb-6 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
          <Bell className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-red-800">
              {urgent.length === 1
                ? `${urgent[0].emoji} ${urgent[0].name} ${daysLabel(urgent[0].daysUntil)}!`
                : `${urgent.length} datas chegando nos próximos 15 dias:`}
            </p>
            {urgent.length > 1 && (
              <p className="text-sm text-red-700 mt-0.5">
                {urgent.map((d) => `${d.emoji} ${d.name} (${daysLabel(d.daysUntil)})`).join(' · ')}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Dates list */}
      <div className="space-y-3">
        {visible.map((d) => {
          const cfg = URGENCY_CONFIG[d.urgency]
          const isExpanded = expanded === d.id

          return (
            <Card
              key={d.id}
              className={`overflow-hidden border-l-4 ${cfg.border} transition-shadow hover:shadow-sm`}
            >
              <button
                className="w-full text-left p-4"
                onClick={() => setExpanded(isExpanded ? null : d.id)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl leading-none mt-0.5">{d.emoji}</span>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-gray-900">{d.name}</p>
                        <Badge className={`text-xs px-2 py-0 ${cfg.color} border-0`}>
                          {cfg.label}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5 capitalize">
                        {formatDate(d.date)}
                        {d.daysUntil > 0 && (
                          <span className="text-xs ml-2 text-gray-400">({daysLabel(d.daysUntil)})</span>
                        )}
                      </p>
                    </div>
                  </div>
                  {isExpanded
                    ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
                    : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
                  }
                </div>
              </button>

              {isExpanded && (
                <div className="px-4 pb-4 space-y-3 border-t pt-3">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                      Dica de cesta
                    </p>
                    <p className="text-sm text-gray-700">{d.tip}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                      Ideia de campanha
                    </p>
                    <p className="text-sm text-gray-700">{d.campaignIdea}</p>
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <p className="text-xs text-muted-foreground">Cestas sugeridas:</p>
                    {d.suggestedBaskets.map((b) => (
                      <Badge key={b} variant="secondary" className="text-xs capitalize">{b}</Badge>
                    ))}
                  </div>
                  <div className="flex gap-2 pt-1">
                    <Link href="/scripts">
                      <Button size="sm" variant="outline" className="gap-1.5 h-8 text-xs">
                        <MessageSquareText className="h-3.5 w-3.5" />
                        Ver scripts
                      </Button>
                    </Link>
                    <Link href="/cestas">
                      <Button size="sm" variant="outline" className="gap-1.5 h-8 text-xs">
                        <CalendarDays className="h-3.5 w-3.5" />
                        Montar cesta
                      </Button>
                    </Link>
                  </div>
                </div>
              )}
            </Card>
          )
        })}
      </div>

      {dates.length > 6 && (
        <Button
          variant="ghost"
          className="mt-4 w-full text-muted-foreground"
          onClick={() => setShowAll((v) => !v)}
        >
          {showAll ? 'Mostrar menos' : `Ver todas (${dates.length})`}
        </Button>
      )}
    </div>
  )
}
