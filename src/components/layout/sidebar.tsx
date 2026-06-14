'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
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
  ShieldCheck,
  Menu,
  X,
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

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [isAdmin, setIsAdmin] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.email === ADMIN_EMAIL) setIsAdmin(true)
    })
  }, [])

  // Close drawer on navigation
  useEffect(() => { setOpen(false) }, [pathname])

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    toast.success('Até logo!')
    router.push('/login')
    router.refresh()
  }

  const navLinks = (
    <>
      <nav className="flex-1 space-y-1 overflow-y-auto">
        {nav.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
              pathname === href
                ? 'bg-brand-rose-light/40 text-brand-rose-dark'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        ))}
        {isAdmin && (
          <Link
            href="/admin"
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
              pathname === '/admin'
                ? 'bg-brand-rose-light/40 text-brand-rose-dark'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            <ShieldCheck className="h-4 w-4" />
            Admin
          </Link>
        )}
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
    </>
  )

  return (
    <>
      {/* ── Mobile hamburger button ── */}
      <button
        className="md:hidden fixed top-3 left-3 z-50 bg-background border border-border rounded-lg p-2 shadow-sm"
        onClick={() => setOpen(true)}
        aria-label="Abrir menu"
      >
        <Menu className="h-5 w-5 text-foreground" />
      </button>

      {/* ── Mobile backdrop ── */}
      {open && (
        <div
          className="md:hidden fixed inset-0 bg-black/40 z-40"
          onClick={() => setOpen(false)}
        />
      )}

      {/* ── Sidebar panel ── */}
      <aside
        className={cn(
          'bg-sidebar border-r border-sidebar-border flex flex-col py-6 px-3 shrink-0 z-50 transition-transform duration-200',
          // Mobile: fixed overlay
          'fixed inset-y-0 left-0 w-64 md:relative md:w-56 md:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        )}
      >
        {/* Mobile close button */}
        <button
          className="md:hidden absolute top-3 right-3 p-1 text-muted-foreground hover:text-foreground"
          onClick={() => setOpen(false)}
          aria-label="Fechar menu"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="px-3 mb-8 flex items-center gap-2">
          <BasketIcon size={28} color="#C4748A" />
          <div>
            <p className="text-xs font-bold leading-none text-brand-gold">EMPRESA DE</p>
            <p className="text-base font-black leading-none tracking-tight text-brand-rose">CESTAS</p>
          </div>
        </div>

        {navLinks}
      </aside>
    </>
  )
}
