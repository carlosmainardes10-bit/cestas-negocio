import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl
  const isAuthRoute = pathname.startsWith('/login') || pathname.startsWith('/signup')
  const isDashboardRoute = pathname.startsWith('/calculadora') ||
    pathname.startsWith('/cestas') ||
    pathname.startsWith('/catalogo') ||
    pathname.startsWith('/financeiro') ||
    pathname.startsWith('/clientes') ||
    pathname.startsWith('/indicadores') ||
    pathname.startsWith('/assinatura') ||
    pathname.startsWith('/vendas') ||
    pathname.startsWith('/produtos') ||
    pathname.startsWith('/scripts') ||
    pathname.startsWith('/calendario') ||
    pathname.startsWith('/treinamentos') ||
    pathname.startsWith('/negocio-legal') ||
    pathname.startsWith('/perfil')

  if (!user && (isDashboardRoute || pathname.startsWith('/onboarding'))) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (user && isAuthRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/calculadora'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)'],
}
