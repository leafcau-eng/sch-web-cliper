import { createClient, createServiceClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { url } = body

    if (!url) {
      return NextResponse.json({ error: 'URL required' }, { status: 400 })
    }

    const serviceClient = createServiceClient()

    const { data: project, error: dbError } = await serviceClient
      .from('projects')
      .insert({
        user_id: user.id,
        title: `Project ${new Date().toLocaleDateString('id-ID')}`,
        source_url: url,
        status: 'queued',
        style: 'tiktok_viral',
        subtitle_style: 'hormozi',
        num_clips: 5,
      })
      .select()
      .single()

    if (dbError || !project) {
      console.error('DB error:', dbError)
      return NextResponse.json({ error: dbError?.message || 'Failed to create project' }, { status: 500 })
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
          inputs: {
            url,
            project_id: project.id,
            chat_id: user.id,
          },
        }),
      }
    )

    if (!ghRes.ok) {
      const ghErr = await ghRes.text()
      console.error('GitHub error:', ghErr)
      await serviceClient.from('projects').update({ status: 'failed' }).eq('id', project.id)
      return NextResponse.json({ error: 'Failed to trigger processing' }, { status: 500 })
    }

    await serviceClient.from('projects').update({ status: 'processing' }).eq('id', project.id)

    return NextResponse.json({ success: true, project_id: project.id })

  } catch (err: any) {
    console.error('Submit error:', err)
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 })
  }
}
