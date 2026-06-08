'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type Project = {
  id: string
  title: string
  source_url: string
  status: 'queued' | 'processing' | 'completed' | 'failed'
  style: string
  created_at: string
  completed_at: string | null
  error_message: string | null
}

type Clip = {
  id: string
  clip_index: number
  title: string
  duration: number
  file_url: string | null
  thumbnail_url: string | null
  start_time: number
  end_time: number
}

const STEPS = [
  { key: 'queued',     label: 'Project dibuat',         icon: '📋' },
  { key: 'processing', label: 'Download & Transkripsi', icon: '🎙️' },
  { key: 'analyzing',  label: 'AI Analisis Konten',     icon: '🧠' },
  { key: 'editing',    label: 'Cutting & Editing',      icon: '✂️' },
  { key: 'rendering',  label: 'Render Final Clips',     icon: '🎬' },
  { key: 'completed',  label: 'Selesai!',               icon: '✅' },
]

function getStepIndex(status: string) {
  const map: Record<string, number> = {
    queued: 0, processing: 2, analyzing: 3, editing: 4, rendering: 5, completed: 6, failed: -1,
  }
  return map[status] ?? 1
}

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export default function ProjectPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [project, setProject] = useState<Project | null>(null)
  const [clips, setClips] = useState<Clip[]>([])
  const [loading, setLoading] = useState(true)

  const fetchProject = useCallback(async () => {
    const res = await fetch(`/api/projects/${id}`)
    if (!res.ok) { router.push('/dashboard'); return }
    const data = await res.json()
    setProject(data.project)
    setClips(data.clips || [])
    setLoading(false)
  }, [id, router])

  useEffect(() => {
    fetchProject()

    const channel = supabase
      .channel(`project-${id}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'projects',
        filter: `id=eq.${id}`,
      }, (payload) => {
        setProject(prev => prev ? { ...prev, ...payload.new } : null)
      })
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'clips',
        filter: `project_id=eq.${id}`,
      }, () => {
        fetchProject()
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [id, fetchProject])

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>Loading...</div>
    </div>
  )

  if (!project) return null

  const stepIndex = getStepIndex(project.status)
  const isFailed = project.status === 'failed'
  const isDone = project.status === 'completed'

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', color: '#fff', fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Syne:wght@700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
      `}</style>

      <div style={{ padding: '20px 32px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 16, background: 'rgba(10,10,10,0.9)', backdropFilter: 'blur(20px)', position: 'sticky', top: 0, zIndex: 40 }}>
        <button onClick={() => router.push('/dashboard')} style={{ background: 'rgba(255,255,255,0.06)', border: 'none', color: 'rgba(255,255,255,0.6)', padding: '7px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontFamily: 'DM Sans, sans-serif' }}>
          ← Dashboard
        </button>
        <span style={{ fontFamily: 'Syne, sans-serif', fontSize: 16, fontWeight: 800 }}>{project.title}</span>
        <StatusBadge status={project.status} />
      </div>

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 24px' }}>

        {!isDone && !isFailed && (
          <div style={{ background: '#151515', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20, padding: 28, marginBottom: 28 }}>
            <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 16, fontWeight: 800, marginBottom: 24 }}>Progress</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {STEPS.map((step, i) => {
                const done = i < stepIndex
                const active = i === stepIndex
                return (
                  <div key={step.key} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: done ? 'rgba(34,197,94,0.12)' : active ? 'rgba(255,200,50,0.12)' : 'rgba(255,255,255,0.04)',
                      border: `1.5px solid ${done ? 'rgba(34,197,94,0.3)' : active ? 'rgba(255,200,50,0.4)' : 'rgba(255,255,255,0.08)'}`,
                      fontSize: 16,
                      animation: active ? 'pulse 2s infinite' : 'none',
                    }}>
                      {done ? '✓' : step.icon}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 500, color: done ? 'rgba(255,255,255,0.7)' : active ? '#fff' : 'rgba(255,255,255,0.3)' }}>
                        {step.label}
                      </div>
                    </div>
                    {active && <div style={{ width: 16, height: 16, border: '2px solid rgba(255,200,50,0.3)', borderTop: '2px solid #FFC832', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />}
                    {done && <div style={{ fontSize: 13, color: 'rgba(34,197,94,0.8)', fontWeight: 500 }}>Done</div>}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {isFailed && (
          <div style={{ background: 'rgba(255,85,85,0.06)', border: '1px solid rgba(255,85,85,0.2)', borderRadius: 16, padding: 24, marginBottom: 28 }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#ff5555', marginBottom: 8 }}>❌ Processing Gagal</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 16 }}>{project.error_message || 'Terjadi kesalahan.'}</div>
            <button onClick={() => router.push('/dashboard')} style={{ background: '#FFC832', color: '#000', border: 'none', padding: '9px 20px', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
              Coba Lagi
            </button>
          </div>
        )}

        <div style={{ background: '#151515', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: 20, marginBottom: 28, display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 24 }}>🔗</div>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Source URL</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{project.source_url}</div>
          </div>
        </div>

        {clips.length > 0 && (
          <div>
            <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 16, fontWeight: 800, marginBottom: 16 }}>
              {clips.length} Clips Dihasilkan 🎉
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {clips.map((clip) => (
                <div key={clip.id} style={{ background: '#151515', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ width: 64, height: 96, borderRadius: 10, background: 'rgba(255,200,50,0.08)', border: '1px solid rgba(255,200,50,0.15)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                    ▶
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>{clip.title}</div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
                      Clip {clip.clip_index} · {formatDuration(clip.duration)} · {formatDuration(clip.start_time)} → {formatDuration(clip.end_time)}
                    </div>
                  </div>
                  {clip.file_url && (
                    <a href={clip.file_url} download style={{ background: '#FFC832', color: '#000', border: 'none', padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer', textDecoration: 'none' }}>
                      ↓ Download
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {clips.length === 0 && !isFailed && (
          <div style={{ background: '#151515', border: '1px dashed rgba(255,255,255,0.07)', borderRadius: 16, padding: 48, textAlign: 'center' }}>
            <div style={{ fontSize: 36, marginBottom: 12, opacity: 0.4 }}>🎬</div>
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.3)' }}>Clips akan muncul di sini setelah selesai</div>
          </div>
        )}

      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { color: string; bg: string; border: string; label: string }> = {
    queued:     { color: 'rgba(255,255,255,0.5)', bg: 'rgba(255,255,255,0.05)', border: 'rgba(255,255,255,0.1)', label: 'Antrian' },
    processing: { color: '#FFC832', bg: 'rgba(255,200,50,0.1)', border: 'rgba(255,200,50,0.25)', label: 'Memproses...' },
    completed:  { color: '#22c55e', bg: 'rgba(34,197,94,0.1)', border: 'rgba(34,197,94,0.25)', label: 'Selesai' },
    failed:     { color: '#ff5555', bg: 'rgba(255,85,85,0.1)', border: 'rgba(255,85,85,0.25)', label: 'Gagal' },
  }
  const s = map[status] || map.queued
  return (
    <div style={{ background: s.bg, border: `1px solid ${s.border}`, color: s.color, fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 100 }}>
      {s.label}
    </div>
  )
}
