'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type Project = {
  id: string
  title: string
  source_url: string
  status: 'queued' | 'processing' | 'completed' | 'failed'
  current_step: string
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

const PIPELINE = [
  {
    key: 'downloading',
    label: 'Download Video',
    icon: '📥',
    tool: 'yt-dlp / gdown',
    desc: 'Unduh video dari YouTube, Google Drive, atau file lokal',
    color: '#60a5fa',
  },
  {
    key: 'transcribing',
    label: 'Transkripsi',
    icon: '🎙️',
    tool: 'OpenAI Whisper',
    desc: 'Konversi audio ke teks dengan deteksi bahasa otomatis',
    color: '#a78bfa',
  },
  {
    key: 'analyzing',
    label: 'AI Analisis',
    icon: '🧠',
    tool: 'Gemini → Groq → Together → OpenRouter',
    desc: 'Deteksi momen viral & scoring segmen terbaik',
    color: '#FFC832',
  },
  {
    key: 'editing',
    label: 'Cutting & Edit',
    icon: '✂️',
    tool: 'MoviePy + FFmpeg',
    desc: 'Potong klip, tambah B-Roll, transitions & beat sync',
    color: '#f97316',
  },
  {
    key: 'rendering',
    label: 'Render & Subtitle',
    icon: '🎬',
    tool: 'FFmpeg + SubtitleAnimator',
    desc: 'Render final 9:16, burn animated subtitles',
    color: '#22c55e',
  },
]

const STEP_ORDER = ['queued', 'downloading', 'transcribing', 'analyzing', 'editing', 'rendering', 'completed']

function getStepIndex(current_step: string) {
  return STEP_ORDER.indexOf(current_step) ?? 0
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
  const [expandedNode, setExpandedNode] = useState<string | null>(null)

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
        event: 'UPDATE', schema: 'public', table: 'projects', filter: `id=eq.${id}`,
      }, (payload) => {
        setProject(prev => prev ? { ...prev, ...payload.new } : null)
      })
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'clips', filter: `project_id=eq.${id}`,
      }, () => { fetchProject() })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [id, fetchProject])

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>Loading...</div>
    </div>
  )

  if (!project) return null

  const currentStep = project.current_step || 'queued'
  const stepIndex = getStepIndex(currentStep)
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
        @keyframes flowLine { 0%{stroke-dashoffset:20} 100%{stroke-dashoffset:0} }
        @keyframes glow { 0%,100%{box-shadow:0 0 8px currentColor} 50%{box-shadow:0 0 20px currentColor} }
        .node-card { background:#151515; border-radius:16px; padding:18px; cursor:pointer; transition:all 0.25s; position:relative; overflow:hidden; }
        .node-card:hover { transform:translateY(-2px); }
        .node-card.active { animation: glow 2s infinite; }
        .connector-line { width:2px; height:28px; margin:0 auto; transition:background 0.5s; }
        .tool-badge { display:inline-block; padding:3px 10px; border-radius:100px; font-size:10px; font-weight:600; margin-top:8px; }
      `}</style>

      {/* Topbar */}
      <div style={{ padding: '20px 32px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 16, background: 'rgba(10,10,10,0.9)', backdropFilter: 'blur(20px)', position: 'sticky', top: 0, zIndex: 40 }}>
        <button onClick={() => router.push('/dashboard')} style={{ background: 'rgba(255,255,255,0.06)', border: 'none', color: 'rgba(255,255,255,0.6)', padding: '7px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontFamily: 'DM Sans, sans-serif' }}>
          ← Dashboard
        </button>
        <span style={{ fontFamily: 'Syne, sans-serif', fontSize: 16, fontWeight: 800 }}>{project.title}</span>
        <StatusBadge status={project.status} />
      </div>

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 24px' }}>

        {/* Error */}
        {isFailed && (
          <div style={{ background: 'rgba(255,85,85,0.06)', border: '1px solid rgba(255,85,85,0.2)', borderRadius: 16, padding: 24, marginBottom: 28 }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#ff5555', marginBottom: 8 }}>❌ Processing Gagal</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 16 }}>{project.error_message || 'Terjadi kesalahan.'}</div>
            <button onClick={() => router.push('/dashboard')} style={{ background: '#FFC832', color: '#000', border: 'none', padding: '9px 20px', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
              Coba Lagi
            </button>
          </div>
        )}

        {/* Pipeline Visualizer */}
        {!isDone && !isFailed && (
          <div style={{ marginBottom: 28 }}>
            <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 16, fontWeight: 800, marginBottom: 20 }}>
              Pipeline AI ⚡
            </div>

            {PIPELINE.map((node, i) => {
              const nodeStepIndex = i + 1
              const done = stepIndex > nodeStepIndex
              const active = stepIndex === nodeStepIndex
              const pending = stepIndex < nodeStepIndex
              const isExpanded = expandedNode === node.key

              const borderColor = done ? 'rgba(34,197,94,0.3)' : active ? node.color : 'rgba(255,255,255,0.07)'
              const bgColor = done ? 'rgba(34,197,94,0.05)' : active ? `${node.color}12` : '#151515'
              const lineColor = done ? '#22c55e' : active ? node.color : 'rgba(255,255,255,0.08)'

              return (
                <div key={node.key}>
                  <div
                    className={`node-card ${active ? 'active' : ''}`}
                    style={{
                      border: `1px solid ${borderColor}`,
                      background: bgColor,
                      color: active ? node.color : done ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.25)',
                    }}
                    onClick={() => setExpandedNode(isExpanded ? null : node.key)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      {/* Icon */}
                      <div style={{
                        width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: done ? 'rgba(34,197,94,0.12)' : active ? `${node.color}20` : 'rgba(255,255,255,0.04)',
                        border: `1.5px solid ${borderColor}`,
                        fontSize: 20,
                        animation: active ? 'pulse 2s infinite' : 'none',
                      }}>
                        {done ? '✓' : node.icon}
                      </div>

                      {/* Label */}
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: done ? '#fff' : active ? '#fff' : 'rgba(255,255,255,0.3)' }}>
                          {node.label}
                        </div>
                        <div className="tool-badge" style={{
                          background: done ? 'rgba(34,197,94,0.1)' : active ? `${node.color}15` : 'rgba(255,255,255,0.04)',
                          color: done ? '#22c55e' : active ? node.color : 'rgba(255,255,255,0.2)',
                          border: `1px solid ${done ? 'rgba(34,197,94,0.2)' : active ? `${node.color}30` : 'rgba(255,255,255,0.06)'}`,
                        }}>
                          {node.tool}
                        </div>
                      </div>

                      {/* Status indicator */}
                      <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                        {active && <div style={{ width: 16, height: 16, border: `2px solid ${node.color}40`, borderTop: `2px solid ${node.color}`, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />}
                        {done && <div style={{ fontSize: 12, color: '#22c55e', fontWeight: 600 }}>Done</div>}
                        {pending && <div style={{ fontSize: 18, color: 'rgba(255,255,255,0.1)' }}>○</div>}
                        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)', marginLeft: 4 }}>{isExpanded ? '▲' : '▼'}</div>
                      </div>
                    </div>

                    {/* Expanded detail */}
                    {isExpanded && (
                      <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${borderColor}`, animation: 'fadeUp 0.2s ease' }}>
                        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', lineHeight: 1.6 }}>
                          {node.desc}
                        </div>
                        {active && (
                          <div style={{ marginTop: 10, fontSize: 12, color: node.color, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div style={{ width: 6, height: 6, borderRadius: '50%', background: node.color, animation: 'pulse 1s infinite' }} />
                            Sedang berjalan...
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Connector line */}
                  {i < PIPELINE.length - 1 && (
                    <div className="connector-line" style={{ background: lineColor }} />
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Source URL */}
        <div style={{ background: '#151515', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: 20, marginBottom: 28, display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 24 }}>🔗</div>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Source URL</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{project.source_url}</div>
          </div>
        </div>

        {/* Clips */}
        {clips.length > 0 && (
          <div>
            <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 16, fontWeight: 800, marginBottom: 16 }}>
              {clips.length} Clips Dihasilkan 🎉
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {clips.map((clip) => (
                <div key={clip.id} style={{ background: '#151515', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: 20, display: 'flex', alignItems: 'center', gap: 16, animation: 'fadeUp 0.4s ease both' }}>
                  <div style={{ width: 64, height: 96, borderRadius: 10, background: 'rgba(255,200,50,0.08)', border: '1px solid rgba(255,200,50,0.15)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>▶</div>
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
