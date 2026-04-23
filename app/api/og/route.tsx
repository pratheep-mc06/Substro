import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const amount = searchParams.get('amount') || '0';
    const count = searchParams.get('count') || '0';

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#FFFFFF',
            fontFamily: 'sans-serif',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              position: 'absolute',
              top: '40px',
              left: '40px',
            }}
          >
            <div style={{ width: '24px', height: '24px', backgroundColor: '#4F46E5', borderRadius: '4px' }} />
            <span style={{ fontSize: '28px', fontWeight: 'bold', color: '#0A0A0A' }}>Substro</span>
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              padding: '0 80px',
            }}
          >
            <h1 style={{ fontSize: '64px', fontWeight: 'bold', color: '#0A0A0A', marginBottom: '20px', lineHeight: 1.1 }}>
              I found ${amount}/year in subscriptions I forgot about.
            </h1>
            <p style={{ fontSize: '24px', color: '#64748B' }}>
              Substro detected {count} recurring charges automatically. Analyze yours today.
            </p>
          </div>

          <div
            style={{
              position: 'absolute',
              bottom: '40px',
              right: '40px',
              fontSize: '20px',
              color: '#4F46E5',
              fontWeight: '600',
            }}
          >
            substro.app &rarr;
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (e: any) {
    console.log(`${e.message}`);
    return new Response(`Failed to generate the image`, {
      status: 500,
    });
  }
}
