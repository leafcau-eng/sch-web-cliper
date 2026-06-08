import { createClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { url, style = 'tiktok_viral', subtitle_style = 'hormozi', num_clips = 5 } = body

    if (!url) {
      return NextResponse.json({ error: 'URL required' }, { status: 400 })
    }

    const { data: project, error: dbError } = await supabase
      .from('projects')
      .insert({
        user_id: user.id,
        title: `Project ${new Date().toLocaleDateString('id-ID')}`,
        source_url: url,
        status: 'queued',
        style,
        subtitle_style,
        num_clips,
      })
      .select()
      .single()

    if (dbError || !project) {
      return NextResponse.json({ error: 'Failed to create project' }, { status: 500 })
    }

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
          inputs: { url, project_id: project.id, chat_id: user.id },
        }),
      }
    )

    if (!ghRes.ok) {
      await supabase.from('projects').update({ status: 'failed' }).eq('id', project.id)
      return NextResponse.json({ error: 'Failed to trigger processing' }, { status: 500 })
    }

    await supabase.from('projects').update({ status: 'processing' }).eq('id', project.id)

    return NextResponse.json({ success: true, project_id: project.id })
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
