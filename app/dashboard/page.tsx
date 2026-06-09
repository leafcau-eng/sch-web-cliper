'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function Dashboard() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('home')

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) router.push('/login')
      else setUser(data.user)
    })
  }, [])

  const handleSubmit = async () => {
    if (!url) return
    setLoading(true)
    const res = await fetch('/api/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    })
    const data = await res.json()
    setLoading(false)
    setUrl('')
    if (data.project_id) { router.push(`/project/${data.project_id}`) } else { alert(data.error || "Gagal memproses") }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (!user) return null

  const avatar = user.user_metadata?.avatar_url
  const name = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'
  const initials = name.charAt(0).toUpperCase()

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0a0a0a', color: '#fff', fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Syne:wght@700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; } 
        ::-webkit-scrollbar-track { background: #111; }
        ::-webkit-scrollbar-thumb { background: #333; border-radius: 4px; }

        .sidebar { width: 240px; min-height: 100vh; background: #111; border-right: 1px solid rgba(255,255,255,0.06); display: flex; flex-direction: column; padding: 20px 0; position: fixed; top: 0; left: 0; z-index: 50; transition: transform 0.3s; }
        .sidebar-logo { padding: 0 20px 24px; border-bottom: 1px solid rgba(255,255,255,0.06); margin-bottom: 16px; }
        .logo-text { font-family: 'Syne', sans-serif; font-size: 22px; font-weight: 800; letter-spacing: -1px; }
        .logo-text span { color: #FFC832; }
        .plan-badge { display: inline-block; background: rgba(255,200,50,0.1); color: #FFC832; border: 1px solid rgba(255,200,50,0.2); font-size: 10px; font-weight: 600; padding: 2px 8px; border-radius: 100px; margin-left: 8px; letter-spacing: 1px; text-transform: uppercase; }

        .user-section { padding: 0 12px 16px; border-bottom: 1px solid rgba(255,255,255,0.06); margin-bottom: 16px; }
        .user-card { display: flex; align-items: center; gap: 10px; padding: 10px; border-radius: 10px; cursor: pointer; transition: background 0.2s; }
        .user-card:hover { background: rgba(255,255,255,0.05); }
        .avatar { width: 36px; height: 36px; border-radius: 50%; background: #FFC832; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 14px; color: #000; overflow: hidden; flex-shrink: 0; }
        .avatar img { width: 100%; height: 100%; object-fit: cover; }
        .user-name { font-size: 13px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 130px; }
        .user-email { font-size: 11px; color: rgba(255,255,255,0.4); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 130px; }

        .nav-section-label { font-size: 10px; font-weight: 600; letter-spacing: 2px; color: rgba(255,255,255,0.3); text-transform: uppercase; padding: 0 20px; margin-bottom: 6px; }
        .nav-item { display: flex; align-items: center; gap: 10px; padding: 9px 20px; font-size: 13px; font-weight: 500; color: rgba(255,255,255,0.5); cursor: pointer; transition: all 0.2s; border-left: 2px solid transparent; }
        .nav-item:hover { color: #fff; background: rgba(255,255,255,0.04); }
        .nav-item.active { color: #FFC832; border-left-color: #FFC832; background: rgba(255,200,50,0.05); }
        .nav-item .icon { font-size: 16px; width: 20px; text-align: center; }
        .nav-badge { background: #FFC832; color: #000; font-size: 9px; font-weight: 700; padding: 2px 6px; border-radius: 100px; margin-left: auto; }
        .nav-badge-new { background: rgba(255,255,255,0.1); color: rgba(255,255,255,0.5); font-size: 9px; font-weight: 600; padding: 2px 6px; border-radius: 4px; margin-left: auto; letter-spacing: 0.5px; }

        .sidebar-bottom { margin-top: auto; padding: 16px 12px 0; border-top: 1px solid rgba(255,255,255,0.06); }
        .logout-btn { display: flex; align-items: center; gap: 10px; padding: 9px 8px; font-size: 13px; color: rgba(255,255,255,0.3); cursor: pointer; border-radius: 8px; transition: all 0.2s; width: 100%; background: none; border: none; font-family: 'DM Sans', sans-serif; }
        .logout-btn:hover { color: #ff5555; background: rgba(255,85,85,0.06); }

        .main { margin-left: 240px; flex: 1; min-height: 100vh; }
        .topbar { padding: 20px 32px; border-bottom: 1px solid rgba(255,255,255,0.05); display: flex; align-items: center; justify-content: space-between; background: rgba(10,10,10,0.8); backdrop-filter: blur(20px); position: sticky; top: 0; z-index: 40; }
        .topbar-title { font-family: 'Syne', sans-serif; font-size: 18px; font-weight: 800; }
        .credits-pill { display: flex; align-items: center; gap: 6px; background: rgba(255,200,50,0.08); border: 1px solid rgba(255,200,50,0.15); padding: 6px 14px; border-radius: 100px; font-size: 13px; color: #FFC832; font-weight: 500; }

        .content { padding: 32px; max-width: 900px; }

        .submit-card { background: #151515; border: 1px solid rgba(255,255,255,0.08); border-radius: 20px; padding: 32px; margin-bottom: 32px; }
        .submit-title { font-family: 'Syne', sans-serif; font-size: 22px; font-weight: 800; margin-bottom: 6px; }
        .submit-sub { font-size: 14px; color: rgba(255,255,255,0.4); margin-bottom: 24px; }

        .input-tabs { display: flex; gap: 8px; margin-bottom: 16px; }
        .input-tab { padding: 7px 16px; border-radius: 8px; font-size: 13px; font-weight: 500; cursor: pointer; transition: all 0.2s; background: transparent; border: 1px solid rgba(255,255,255,0.08); color: rgba(255,255,255,0.4); font-family: 'DM Sans', sans-serif; }
        .input-tab.active { background: rgba(255,200,50,0.1); border-color: rgba(255,200,50,0.3); color: #FFC832; }

        .url-input-wrap { position: relative; margin-bottom: 16px; }
        .url-input { width: 100%; background: #0a0a0a; border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 14px 16px 14px 44px; font-size: 15px; color: #fff; font-family: 'DM Sans', sans-serif; outline: none; transition: border-color 0.2s; }
        .url-input:focus { border-color: rgba(255,200,50,0.3); }
        .url-input::placeholder { color: rgba(255,255,255,0.2); }
        .url-icon { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); font-size: 18px; color: rgba(255,255,255,0.2); }

        .submit-btn { width: 100%; background: #FFC832; color: #000; border: none; padding: 15px; border-radius: 12px; font-size: 15px; font-weight: 700; cursor: pointer; transition: all 0.2s; font-family: 'DM Sans', sans-serif; display: flex; align-items: center; justify-content: center; gap: 8px; }
        .submit-btn:hover:not(:disabled) { background: #FFD966; transform: translateY(-1px); box-shadow: 0 12px 32px rgba(255,200,50,0.2); }
        .submit-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        .features-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 32px; }
        .feature-tile { background: #151515; border: 1px solid rgba(255,255,255,0.06); border-radius: 16px; padding: 20px; cursor: pointer; transition: all 0.2s; text-align: center; position: relative; overflow: hidden; }
        .feature-tile:hover { border-color: rgba(255,200,50,0.15); background: #1a1a1a; transform: translateY(-2px); }
        .feature-tile .tile-icon { font-size: 28px; margin-bottom: 10px; display: block; }
        .feature-tile .tile-name { font-size: 12px; font-weight: 600; color: rgba(255,255,255,0.7); }
        .feature-tile .tile-badge { position: absolute; top: 10px; right: 10px; background: #FFC832; color: #000; font-size: 8px; font-weight: 700; padding: 2px 6px; border-radius: 4px; letter-spacing: 0.5px; }

        .projects-section { }
        .section-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
        .section-title { font-family: 'Syne', sans-serif; font-size: 16px; font-weight: 800; }
        .empty-state { background: #151515; border: 1px dashed rgba(255,255,255,0.08); border-radius: 16px; padding: 48px; text-align: center; }
        .empty-icon { font-size: 40px; margin-bottom: 12px; opacity: 0.4; }
        .empty-title { font-size: 15px; font-weight: 600; color: rgba(255,255,255,0.4); margin-bottom: 6px; }
        .empty-sub { font-size: 13px; color: rgba(255,255,255,0.2); }

        .spinner { width: 18px; height: 18px; border: 2px solid rgba(0,0,0,0.2); border-top-color: #000; border-radius: 50%; animation: spin 0.6s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }

        @media (max-width: 768px) {
          .sidebar { transform: translateX(-100%); }
          .sidebar.open { transform: translateX(0); }
          .main { margin-left: 0; }
          .features-grid { grid-template-columns: repeat(2, 1fr); }
          .content { padding: 20px; }
          .topbar { padding: 16px 20px; }
        }
      `}</style>

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span className="logo-text">S<span>CH</span></span>
            <span className="plan-badge">Free</span>
          </div>
        </div>

        <div className="user-section">
          <div className="user-card">
            <div className="avatar">
              {avatar ? <img src={avatar} alt={name} /> : initials}
            </div>
            <div>
              <div className="user-name">{name}</div>
              <div className="user-email">{user.email}</div>
            </div>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          <div style={{ marginBottom: 20 }}>
            <div className="nav-section-label">Buat</div>
            {[
              { icon: '🏠', label: 'Home', key: 'home' },
              { icon: '✂️', label: 'Auto Clip', key: 'clip' },
              { icon: '📁', label: 'Asset Library', key: 'assets' },
            ].map(item => (
              <div
                key={item.key}
                className={`nav-item ${activeTab === item.key ? 'active' : ''}`}
                onClick={() => setActiveTab(item.key)}
              >
                <span className="icon">{item.icon}</span>
                {item.label}
              </div>
            ))}
          </div>

          <div style={{ marginBottom: 20 }}>
            <div className="nav-section-label">Kelola</div>
            {[
              { icon: '📊', label: 'Analytics', key: 'analytics', badge: 'New' },
              { icon: '📅', label: 'Calendar', key: 'calendar', badge: 'New' },
              { icon: '🔗', label: 'Social Accounts', key: 'social' },
            ].map(item => (
              <div
                key={item.key}
                className={`nav-item ${activeTab === item.key ? 'active' : ''}`}
                onClick={() => setActiveTab(item.key)}
              >
                <span className="icon">{item.icon}</span>
                {item.label}
                {item.badge && <span className="nav-badge-new">{item.badge}</span>}
              </div>
            ))}
          </div>

          <div>
            <div className="nav-section-label">Akun</div>
            {[
              { icon: '👑', label: 'Subscription', key: 'subscription' },
              { icon: '📖', label: 'Panduan', key: 'guide' },
              { icon: '❓', label: 'Bantuan', key: 'help' },
            ].map(item => (
              <div
                key={item.key}
                className={`nav-item ${activeTab === item.key ? 'active' : ''}`}
                onClick={() => setActiveTab(item.key)}
              >
                <span className="icon">{item.icon}</span>
                {item.label}
              </div>
            ))}
          </div>
        </div>

        <div className="sidebar-bottom">
          <button className="logout-btn" onClick={handleLogout}>
            <span>↩</span> Keluar
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="main">
        {/* Topbar */}
        <div className="topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              style={{ background: 'none', border: 'none', color: '#fff', fontSize: 20, cursor: 'pointer', display: 'none' }}
              className="menu-btn"
            >
              ☰
            </button>
            <span className="topbar-title">Dashboard</span>
          </div>
          <div className="credits-pill">
            ⚡ 3 kredit tersisa
          </div>
        </div>

        {/* Content */}
        <div className="content">

          {/* Upgrade banner */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(255,200,50,0.08) 0%, rgba(255,200,50,0.03) 100%)',
            border: '1px solid rgba(255,200,50,0.15)',
            borderRadius: 14,
            padding: '14px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 24,
          }}>
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>
              Kamu menggunakan <strong style={{ color: '#fff' }}>Free Plan</strong> — terbatas 3 video/bulan
            </span>
            <button style={{
              background: '#FFC832', color: '#000', border: 'none',
              padding: '7px 16px', borderRadius: 8, fontSize: 12,
              fontWeight: 700, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif'
            }}>
              Upgrade
            </button>
          </div>

          {/* Submit card */}
          <div className="submit-card">
            <div className="submit-title">Buat Clips Baru</div>
            <div className="submit-sub">Paste link YouTube atau upload video untuk mulai</div>

            <div className="input-tabs">
              <button className="input-tab active">🔗 YouTube URL</button>
              <button className="input-tab">⬆️ Upload</button>
              <button className="input-tab">🔺 Google Drive</button>
            </div>

            <div className="url-input-wrap">
              <span className="url-icon">🔗</span>
              <input
                className="url-input"
                type="text"
                placeholder="Paste link YouTube di sini..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              />
            </div>

            <button className="submit-btn" onClick={handleSubmit} disabled={loading || !url}>
              {loading ? (
                <><div className="spinner" /> Memproses...</>
              ) : (
                <>✨ Generate Clips Sekarang</>
              )}
            </button>
          </div>

          {/* Feature tiles */}
          <div className="features-grid">
            {[
              { icon: '✂️', name: 'Auto Clip', badge: null },
              { icon: '💬', name: 'AI Captions', badge: null },
              { icon: '🎬', name: 'Video Editor', badge: 'New' },
              { icon: '🎵', name: 'AI Sound Effect', badge: 'New' },
              { icon: '📱', name: 'AI Reframe', badge: null },
              { icon: '🎭', name: 'B-Roll AI', badge: null },
            ].map((f, i) => (
              <div key={i} className="feature-tile">
                {f.badge && <span className="tile-badge">{f.badge}</span>}
                <span className="tile-icon">{f.icon}</span>
                <div className="tile-name">{f.name}</div>
              </div>
            ))}
          </div>

          {/* Projects */}
          <div className="projects-section">
            <div className="section-header">
              <div className="section-title">Semua Proyek (0)</div>
            </div>
            <div className="empty-state">
              <div className="empty-icon">🎬</div>
              <div className="empty-title">Belum ada proyek</div>
              <div className="empty-sub">Submit video pertamamu di atas untuk mulai</div>
            </div>
          </div>

        </div>
      </main>
    </div>
  )
}

