'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { BasketIcon } from '@/components/Logo'
import {
  Calculator,
  ShoppingBasket,
  BookImage,
  DollarSign,
  Users,
  BarChart3,
  LogOut,
  Package,
  ShoppingCart,
  Crown,
  MessageSquareText,
  CalendarDays,
  GraduationCap,
  Scale,
  UserCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

const nav = [
  { href: '/calculadora', label: 'Calculadora', icon: Calculator },
  { href: '/produtos', label: 'Produtos', icon: Package },
  { href: '/cestas', label: 'Montador', icon: ShoppingBasket },
  { href: '/catalogo', label: 'Catálogo', icon: BookImage },
  { href: '/vendas', label: 'Vendas', icon: ShoppingCart },
  { href: '/financeiro', label: 'Financeiro', icon: DollarSign },
  { href: '/clientes', label: 'Clientes', icon: Users },
  { href: '/indicadores', label: 'Indicadores', icon: BarChart3 },
  { href: '/scripts', label: 'Scripts', icon: MessageSquareText },
  { href: '/calendario', label: 'Calendário', icon: CalendarDays },
  { href: '/treinamentos', label: 'Treinamentos', icon: GraduationCap },
  { href: '/negocio-legal', label: 'Negócio Legal', icon: Scale },
  { href: '/assinatura', label: 'Assinatura', icon: Crown },
  { href: '/perfil', label: 'Perfil', icon: UserCircle },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    toast.success('Até logo!')
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="w-56 bg-white border-r flex flex-col py-6 px-3 shrink-0">
      <div className="px-3 mb-8 flex items-center gap-2">
        <BasketIcon size={28} color="#92400e" />
        <div>
          <p className="text-xs font-bold text-amber-900 leading-none">EMPRESA DE</p>
          <p className="text-base font-black text-amber-900 leading-none tracking-tight">CESTAS</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1">
        {nav.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
              pathname === href
                ? 'bg-amber-50 text-amber-900'
                : 'text-muted-foreground hover:bg-gray-50 hover:text-foreground'
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        ))}
      </nav>

      <Button
        variant="ghost"
        size="sm"
        onClick={handleLogout}
        className="justify-start gap-3 text-muted-foreground hover:text-foreground"
      >
        <LogOut className="h-4 w-4" />
        Sair
      </Button>
    </aside>
  )
}
