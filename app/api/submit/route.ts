import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const { url } = await req.json()

  if (!url) {
    return NextResponse.json({ message: 'URL required' }, { status: 400 })
  }

  // Trigger GitHub Actions
  const ghRes = await fetch(
    `https://api.github.com/repos/${process.env.GITHUB_OWNER}/${process.env.GITHUB_REPO}/actions/workflows/run-clipper.yml/dispatches`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GITHUB_PAT}`,
        'Accept': 'application/vnd.github+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ref: 'main',
        inputs: { url }
      })
    }
  )

  if (!ghRes.ok) {
    return NextResponse.json({ message: 'Failed to trigger pipeline' }, { status: 500 })
  }

  return NextResponse.json({ message: 'Job submitted! Processing...' })
}
