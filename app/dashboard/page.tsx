'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

type Project = {
  id: string
  title: string
  source_url: string
  status: 'queued' | 'processing' | 'completed' | 'failed'
  created_at: string
  clips: { count: number }[]
}

export default function Dashboard() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [url, setUrl] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [projects, setProjects] = useState<Project[]>([])
  const [projectsLoading, setProjectsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('home')

  const fetchProjects = useCallback(async () => {
    const res = await fetch('/api/projects')
    if (res.ok) {
      const data = await res.json()
      setProjects(data.projects || [])
    }
    setProjectsLoading(false)
  }, [])

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) router.push('/login')
      else setUser(data.user)
    })
    fetchProjects()

    const channel = supabase
      .channel('dashboard-projects')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, () => {
        fetchProjects()
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [router, fetchProjects])

  const handleSubmit = async () => {
    if (!url.trim() && !file) return
    setLoading(true)
    try {
      let res
      if (file) {
        const formData = new FormData()
        formData.append('file', file)
        res = await fetch('/api/submit', {
          method: 'POST',
          body: formData,
        })
      } else {
        res = await fetch('/api/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: url.trim() }),
        })
      }
      const data = await res.json()
      if (data.project_id) {
        setUrl('')
        setFile(null)
        router.push(`/project/${data.project_id}`)
      } else {
        alert(data.error || 'Gagal memproses')
      }
    } catch {
      alert('Terjadi kesalahan')
    }
    setLoading(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (!user) return null

  const avatar = user.user_metadata?.avatar_url
  const name = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'
  const initials = name.charAt(0).toUpperCase()

  const stats = {
    total: projects.length,
    processing: projects.filter(p => p.status === 'processing' || p.status === 'queued').length,
    completed: projects.filter(p => p.status === 'completed').length,
    failed: projects.filter(p => p.status === 'failed').length,
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0a0a0a', color: '#fff', fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Syne:wght@700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: #333; border-radius: 4px; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        .sidebar { width: 240px; min-height: 100vh; background: #111; border-right: 1px solid rgba(255,255,255,0.06); display: flex; flex-direction: column; padding: 20px 0; position: fixed; top: 0; left: 0; z-index: 50; }
        .logo-text { font-family: 'Syne', sans-serif; font-size: 22px; font-weight: 800; color: #FFC832; }
        .plan-badge { display: inline-block; background: rgba(255,200,50,0.1); color: #FFC832; border: 1px solid rgba(255,200,50,0.2); font-size: 9px; font-weight: 700; padding: 2px 7px; border-radius: 100px; margin-left: 8px; }
        .nav-item { display: flex; align-items: center; gap: 10px; padding: 9px 20px; font-size: 13px; font-weight: 500; color: rgba(255,255,255,0.45); cursor: pointer; transition: all 0.2s; border-left: 2px solid transparent; }
        .nav-item:hover { color: #fff; background: rgba(255,255,255,0.03); }
        .nav-item.active { color: #FFC832; border-left-color: #FFC832; background: rgba(255,200,50,0.05); }
        .main { margin-left: 240px; flex: 1; }
        .topbar { padding: 18px 32px; border-bottom: 1px solid rgba(255,255,255,0.05); display: flex; align-items: center; justify-content: space-between; background: rgba(10,10,10,0.85); backdrop-filter: blur(20px); position: sticky; top: 0; z-index: 40; }
        .content { padding: 28px 32px; max-width: 900px; }
        .stat-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 12px; margin-bottom: 24px; }
        .stat-card { background: #151515; border: 1px solid rgba(255,255,255,0.07); border-radius: 14px; padding: 18px; }
        .stat-label { font-size: 11px; color: rgba(255,255,255,0.35); letter-spacing: 0.06em; text-transform: uppercase; margin-bottom: 6px; }
        .stat-num { font-family: 'Syne', sans-serif; font-size: 28px; font-weight: 800; }
        .submit-card { background: #151515; border: 1px solid rgba(255,255,255,0.07); border-radius: 18px; padding: 28px; margin-bottom: 24px; }
        .url-input { width: 100%; background: #0d0d0d; border: 1px solid rgba(255,255,255,0.08); border-radius: 11px; padding: 13px 14px; font-size: 14px; color: #fff; font-family: 'DM Sans', sans-serif; outline: none; margin-bottom: 12px; }
        .url-input:focus { border-color: rgba(255,200,50,0.3); }
        .url-input::placeholder { color: rgba(255,255,255,0.18); }
        .file-input-wrapper { width: 100%; background: #0d0d0d; border: 1px dashed rgba(255,255,255,0.12); border-radius: 11px; padding: 16px 14px; margin-bottom: 12px; cursor: pointer; transition: border-color 0.2s; text-align: center; }
        .file-input-wrapper:hover { border-color: rgba(255,200,50,0.3); }
        .submit-btn { width: 100%; background: #FFC832; color: #000; border: none; padding: 14px; border-radius: 11px; font-size: 14px; font-weight: 700; cursor: pointer; transition: all 0.2s; font-family: 'DM Sans', sans-serif; display: flex; align-items: center; justify-content: center; gap: 8px; }
        .submit-btn:hover:not(:disabled) { background: #FFD966; transform: translateY(-1px); }
        .submit-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .spinner { width: 16px; height: 16px; border: 2px solid rgba(0,0,0,0.2); border-top-color: #000; border-radius: 50%; animation: spin 0.6s linear infinite; }
        .project-row { background: #151515; border: 1px solid rgba(255,255,255,0.07); border-radius: 14px; padding: 16px 20px; display: flex; align-items: center; gap: 14px; cursor: pointer; transition: all 0.2s; margin-bottom: 10px; animation: fadeUp 0.4s ease both; }
        .project-row:hover { border-color: rgba(255,200,50,0.2); background: #1a1a1a; }
        .empty-state { background: #151515; border: 1px dashed rgba(255,255,255,0.07); border-radius: 16px; padding: 48px; text-align: center; }
        @media(max-width:768px) { .sidebar{display:none} .main{margin-left:0} .stat-grid{grid-template-columns:repeat(2,1fr)} .content{padding:18px} }
      `}</style>

      <aside className="sidebar">
        <div style={{ padding: '0 20px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span className="logo-text">SCH</span>
            <span className="plan-badge">Free</span>
          </div>
        </div>

        <div style={{ padding: '0 12px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 9 }}>
            <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#FFC832', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13, color: '#000', overflow: 'hidden', flexShrink: 0 }}>
              {avatar ? <img src={avatar} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initials}
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{name}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>{user.email}</div>
            </div>
          </div>
        </div>

        <div style={{ flex: 1 }}>
          {[
            { ic: '🏠', label: 'Dashboard', key: 'home' },
            { ic: '✂️', label: 'Auto Clip', key: 'clip' },
            { ic: '📁', label: 'Asset Library', key: 'assets' },
            { ic: '📊', label: 'Analytics', key: 'analytics' },
            { ic: '👑', label: 'Subscription', key: 'subscription' },
          ].map(item => (
            <div key={item.key} className={`nav-item ${activeTab === item.key ? 'active' : ''}`} onClick={() => setActiveTab(item.key)}>
              <span>{item.ic}</span>{item.label}
            </div>
          ))}
        </div>

        <div style={{ padding: '14px 12px 0', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <button onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 8px', fontSize: 13, color: 'rgba(255,255,255,0.3)', cursor: 'pointer', borderRadius: 8, transition: 'all 0.2s', width: '100%', background: 'none', border: 'none', fontFamily: 'DM Sans, sans-serif' }}>
            ↩ Keluar
          </button>
        </div>
      </aside>

      <main className="main">
        <div className="topbar">
          <span style={{ fontFamily: 'Syne, sans-serif', fontSize: 17, fontWeight: 800 }}>Dashboard</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,200,50,0.07)', border: '1px solid rgba(255,200,50,0.15)', padding: '6px 14px', borderRadius: 100, fontSize: 12, color: '#FFC832', fontWeight: 500 }}>
            ⚡ 3 kredit tersisa
          </div>
        </div>

        <div className="content">
          <div className="stat-grid">
            <div className="stat-card">
              <div className="stat-label">Total</div>
              <div className="stat-num" style={{ color: '#FFC832' }}>{stats.total}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Diproses</div>
              <div className="stat-num" style={{ color: '#FFC832' }}>{stats.processing}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Selesai</div>
              <div className="stat-num" style={{ color: '#22c55e' }}>{stats.completed}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Gagal</div>
              <div className="stat-num" style={{ color: '#ff5555' }}>{stats.failed}</div>
            </div>
          </div>

          <div className="submit-card">
            <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 20, fontWeight: 800, marginBottom: 5 }}>Buat Clips Baru ✨</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', marginBottom: 20 }}>Paste link YouTube / Google Drive atau upload video dari folder</div>

            <input
              className="url-input"
              type="text"
              placeholder="https://youtube.com/watch?v=... atau https://drive.google.com/..."
              value={url}
              onChange={(e) => { setUrl(e.target.value); setFile(null) }}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              disabled={!!file}
            />

            <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.2)', fontSize: 12, margin: '4px 0 12px' }}>— atau —</div>

            <label className="file-input-wrapper">
              <input
                type="file"
                accept="video/*"
                style={{ display: 'none' }}
                onChange={(e) => { setFile(e.target.files?.[0] || null); setUrl('') }}
              />
              {file ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <span style={{ fontSize: 18 }}>🎬</span>
                  <span style={{ fontSize: 13, color: '#FFC832', fontWeight: 600 }}>{file.name}</span>
                  <span
                    onClick={(e) => { e.preventDefault(); setFile(null) }}
                    style={{ fontSize: 11, color: 'rgba(255,85,85,0.8)', cursor: 'pointer', marginLeft: 4 }}
                  >✕ hapus</span>
                </div>
              ) : (
                <div>
                  <div style={{ fontSize: 22, marginBottom: 6 }}>📂</div>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>Klik untuk pilih video dari folder</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', marginTop: 4 }}>MP4, MOV, AVI, MKV didukung</div>
                </div>
              )}
            </label>

            <button className="submit-btn" onClick={handleSubmit} disabled={loading || (!url.trim() && !file)}>
              {loading ? <><div className="spinner" /> Memproses...</> : <>✨ Generate Clips Sekarang</>}
            </button>
          </div>

          <div>
            <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 15, fontWeight: 800, marginBottom: 14 }}>
              Semua Proyek ({projects.length})
            </div>

            {projectsLoading ? (
              <div style={{ textAlign: 'center', padding: 40, color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>Memuat...</div>
            ) : projects.length === 0 ? (
              <div className="empty-state">
                <div style={{ fontSize: 36, marginBottom: 10, opacity: 0.35 }}>🎬</div>
                <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.35)', fontWeight: 500, marginBottom: 5 }}>Belum ada proyek</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)' }}>Submit video pertamamu di atas</div>
              </div>
            ) : (
              projects.map((project) => (
                <div key={project.id} className="project-row" onClick={() => router.push(`/project/${project.id}`)}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(255,200,50,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>🎬</div>
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{project.title}</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{project.source_url}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>{project.clips?.[0]?.count || 0} clips</div>
                    <StatusBadge status={project.status} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { color: string; bg: string; border: string; label: string }> = {
    queued:     { color: 'rgba(255,255,255,0.4)', bg: 'rgba(255,255,255,0.05)', border: 'rgba(255,255,255,0.1)', label: 'Antrian' },
    processing: { color: '#FFC832', bg: 'rgba(255,200,50,0.1)', border: 'rgba(255,200,50,0.2)', label: 'Memproses' },
    completed:  { color: '#22c55e', bg: 'rgba(34,197,94,0.1)', border: 'rgba(34,197,94,0.2)', label: 'Selesai' },
    failed:     { color: '#ff5555', bg: 'rgba(255,85,85,0.1)', border: 'rgba(255,85,85,0.2)', label: 'Gagal' },
  }
  const s = map[status] || map.queued
  return (
    <div style={{ background: s.bg, border: `1px solid ${s.border}`, color: s.color, fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 100 }}>
      {s.label}
    </div>
  )
}
