import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    // Read from the carbon-tracker.json in the project root
    const trackerPath = path.join(process.cwd(), '..', 'carbon-tracker.json');

    if (!fs.existsSync(trackerPath)) {
      return NextResponse.json({
        development: {
          totalTokens: 0,
          lastUpdated: null
        },
        carbonMetrics: {
          gCO2PerThousandTokens: 1.0,
          totalKgCO2: 0,
          hamburgerEquivalentKg: 3.5
        }
      });
    }

    const data = JSON.parse(fs.readFileSync(trackerPath, 'utf-8'));
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error reading carbon tracker:', error);
    return NextResponse.json(
      { error: 'Failed to read carbon tracker' },
      { status: 500 }
    );
  }
}
