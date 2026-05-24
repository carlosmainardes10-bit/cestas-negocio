import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '1080px',
          height: '1080px',
          background: '#0a0a0a',
          display: 'flex',
          flexDirection: 'column',
          padding: '72px',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* Decorative faint "99" in background */}
        <div
          style={{
            position: 'absolute',
            right: '-40px',
            bottom: '60px',
            fontSize: '520px',
            fontWeight: 900,
            color: 'rgba(255,107,0,0.04)',
            display: 'flex',
            lineHeight: '1',
            letterSpacing: '-20px',
            fontFamily: 'sans-serif',
          }}
        >
          99
        </div>

        {/* Glow blob top-left */}
        <div
          style={{
            position: 'absolute',
            left: '-120px',
            top: '-120px',
            width: '480px',
            height: '480px',
            borderRadius: '50%',
            background: 'rgba(255,107,0,0.07)',
            display: 'flex',
          }}
        />

        {/* Logo */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span
            style={{
              color: '#FF6B00',
              fontSize: '14px',
              fontWeight: 700,
              letterSpacing: '4px',
              fontFamily: 'sans-serif',
            }}
          >
            EMPRESA DE
          </span>
          <span
            style={{
              color: '#ffffff',
              fontSize: '24px',
              fontWeight: 900,
              letterSpacing: '2px',
              fontFamily: 'sans-serif',
            }}
          >
            CESTAS
          </span>
        </div>

        {/* Center content */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          }}
        >
          {/* Label */}
          <span
            style={{
              color: '#FF6B00',
              fontSize: '18px',
              fontWeight: 700,
              letterSpacing: '5px',
              fontFamily: 'sans-serif',
              marginBottom: '8px',
            }}
          >
            COMECE POR APENAS
          </span>

          {/* Price */}
          <span
            style={{
              color: '#FF6B00',
              fontSize: '180px',
              fontWeight: 900,
              lineHeight: '0.9',
              letterSpacing: '-6px',
              fontFamily: 'sans-serif',
              marginBottom: '36px',
            }}
          >
            R$99
          </span>

          {/* Orange divider */}
          <div
            style={{
              width: '80px',
              height: '4px',
              background: '#FF6B00',
              borderRadius: '2px',
              display: 'flex',
              marginBottom: '36px',
            }}
          />

          {/* Headline line 1 */}
          <span
            style={{
              color: '#ffffff',
              fontSize: '50px',
              fontWeight: 700,
              lineHeight: '1.25',
              fontFamily: 'sans-serif',
            }}
          >
            Comece sua empresa com R$99
          </span>
          {/* Headline line 2 */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0px' }}>
            <span
              style={{
                color: '#ffffff',
                fontSize: '50px',
                fontWeight: 700,
                lineHeight: '1.25',
                fontFamily: 'sans-serif',
              }}
            >
              e tenha{' '}
            </span>
            <span
              style={{
                color: '#FF6B00',
                fontSize: '50px',
                fontWeight: 900,
                lineHeight: '1.25',
                fontFamily: 'sans-serif',
              }}
            >
              lucro no primeiro mês
            </span>
          </div>
        </div>

        {/* Bottom */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Tags */}
          <div style={{ display: 'flex', gap: '12px' }}>
            {['Sem loja', 'Sem estoque', 'Sem experiência'].map((tag) => (
              <div
                key={tag}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  background: '#161616',
                  border: '1.5px solid #2c2c2c',
                  borderRadius: '100px',
                  padding: '12px 24px',
                  fontFamily: 'sans-serif',
                }}
              >
                <span style={{ color: '#FF6B00', fontWeight: 900, fontSize: '18px' }}>✕</span>
                <span style={{ color: '#666666', fontSize: '24px' }}>{tag}</span>
              </div>
            ))}
          </div>

          {/* URL */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span
              style={{
                color: '#333333',
                fontSize: '22px',
                letterSpacing: '1px',
                fontFamily: 'sans-serif',
              }}
            >
              empresadecestas.com.br
            </span>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: '#FF6B00',
                borderRadius: '100px',
                padding: '10px 24px',
              }}
            >
              <span style={{ color: '#ffffff', fontSize: '20px', fontWeight: 700, fontFamily: 'sans-serif' }}>
                Acesse agora →
              </span>
            </div>
          </div>
        </div>
      </div>
    ),
    { width: 1080, height: 1080 }
  )
}
