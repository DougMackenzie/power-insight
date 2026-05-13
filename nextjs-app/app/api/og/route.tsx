import { ImageResponse } from 'next/og';
import type { NextRequest } from 'next/server';

export const runtime = 'edge';

const DEFAULT_TITLE = 'Power Insight';
const DEFAULT_SUBTITLE = 'Take charge of your energy future';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const title = (searchParams.get('title') || DEFAULT_TITLE).slice(0, 120);
    const subtitle = (searchParams.get('subtitle') || DEFAULT_SUBTITLE).slice(0, 200);

    return new ImageResponse(
        (
            <div
                style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                    color: 'white',
                    padding: '64px',
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                }}
            >
                {/* Top: brand mark */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <div
                        style={{
                            width: '64px',
                            height: '64px',
                            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                            borderRadius: '14px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '36px',
                            fontWeight: 700,
                            color: '#0f172a',
                        }}
                    >
                        ⚡
                    </div>
                    <div
                        style={{
                            fontSize: '32px',
                            fontWeight: 700,
                            letterSpacing: '-0.02em',
                            color: 'white',
                        }}
                    >
                        Power Insight
                    </div>
                </div>

                {/* Middle: title + subtitle */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div
                        style={{
                            fontSize: '64px',
                            fontWeight: 800,
                            lineHeight: 1.1,
                            letterSpacing: '-0.02em',
                            color: 'white',
                            maxWidth: '1000px',
                        }}
                    >
                        {title}
                    </div>
                    {subtitle && (
                        <div
                            style={{
                                fontSize: '28px',
                                fontWeight: 400,
                                lineHeight: 1.3,
                                color: '#cbd5e1',
                                maxWidth: '1000px',
                            }}
                        >
                            {subtitle}
                        </div>
                    )}
                </div>

                {/* Bottom: domain + accent */}
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        borderTop: '1px solid rgba(255,255,255,0.1)',
                        paddingTop: '20px',
                    }}
                >
                    <div style={{ fontSize: '20px', color: '#94a3b8' }}>power-insight.org</div>
                    <div
                        style={{
                            fontSize: '18px',
                            color: '#fbbf24',
                            fontWeight: 600,
                            letterSpacing: '0.04em',
                            textTransform: 'uppercase',
                        }}
                    >
                        Free • Open Source
                    </div>
                </div>
            </div>
        ),
        {
            width: 1200,
            height: 630,
        }
    );
}
