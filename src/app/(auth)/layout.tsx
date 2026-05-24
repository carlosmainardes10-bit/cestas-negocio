export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-50">
      <div className="w-full max-w-md px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-amber-900">🧺 Cestas Negócio</h1>
          <p className="text-amber-700 mt-1 text-sm">Transforme cestas em um negócio lucrativo</p>
        </div>
        {children}
      </div>
    </div>
  )
}
