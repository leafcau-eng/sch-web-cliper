'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useRef } from 'react'

export default function LandingPage() {
  const router = useRouter()
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    const particles: { x: number; y: number; vx: number; vy: number; size: number; opacity: number }[] = []

    for (let i = 0; i < 80; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        size: Math.random() * 1.5 + 0.5,
        opacity: Math.random() * 0.5 + 0.1,
      })
    }

    let animId: number
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      particles.forEach((p) => {
        p.x += p.vx
        p.y += p.vy
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255, 200, 50, ${p.opacity})`
        ctx.fill()
      })
      animId = requestAnimationFrame(animate)
    }
    animate()

    const handleResize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    window.addEventListener('resize', handleResize)

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  return (
    <div style={{
      minHeight: '100vh',
      background: '#050505',
      color: '#fff',
      fontFamily: "'DM Sans', sans-serif",
      overflowX: 'hidden',
      position: 'relative',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Syne:wght@700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .nav { position: fixed; top: 0; left: 0; right: 0; z-index: 100; display: flex; justify-content: space-between; align-items: center; padding: 20px 48px; border-bottom: 1px solid rgba(255,255,255,0.05); background: rgba(5,5,5,0.8); backdrop-filter: blur(20px); }
        .logo { font-family: 'Syne', sans-serif; font-size: 20px; font-weight: 800; letter-spacing: -0.5px; color: #fff; }
        .logo span { color: #FFC832; }
        .nav-links { display: flex; gap: 32px; list-style: none; align-items: center; }
        .nav-links a { color: rgba(255,255,255,0.5); text-decoration: none; font-size: 14px; font-weight: 500; transition: color 0.2s; }
        .nav-links a:hover { color: #fff; }
        .btn-primary { background: #FFC832; color: #000; border: none; padding: 10px 24px; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.2s; font-family: 'DM Sans', sans-serif; }
        .btn-primary:hover { background: #FFD966; transform: translateY(-1px); }
        .hero { min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 120px 24px 80px; position: relative; z-index: 1; }
        .badge { display: inline-flex; align-items: center; gap: 8px; background: rgba(255,200,50,0.1); border: 1px solid rgba(255,200,50,0.2); color: #FFC832; padding: 6px 16px; border-radius: 100px; font-size: 13px; font-weight: 500; margin-bottom: 32px; animation: fadeUp 0.6s ease both; }
        .hero-title { font-family: 'Syne', sans-serif; font-size: clamp(48px, 8vw, 88px); font-weight: 800; line-height: 1.0; letter-spacing: -3px; margin-bottom: 24px; animation: fadeUp 0.6s ease 0.1s both; }
        .hero-title .accent { color: #FFC832; }
        .hero-sub { font-size: clamp(16px, 2.5vw, 20px); color: rgba(255,255,255,0.45); max-width: 520px; line-height: 1.6; margin-bottom: 48px; font-weight: 300; animation: fadeUp 0.6s ease 0.2s both; }
        .hero-actions { display: flex; gap: 16px; flex-wrap: wrap; justify-content: center; animation: fadeUp 0.6s ease 0.3s both; }
        .btn-big { background: #FFC832; color: #000; border: none; padding: 16px 36px; border-radius: 12px; font-size: 16px; font-weight: 600; cursor: pointer; transition: all 0.2s; font-family: 'DM Sans', sans-serif; display: flex; align-items: center; gap: 8px; }
        .btn-big:hover { background: #FFD966; transform: translateY(-2px); box-shadow: 0 20px 40px rgba(255,200,50,0.2); }
        .btn-ghost { background: transparent; color: rgba(255,255,255,0.6); border: 1px solid rgba(255,255,255,0.1); padding: 16px 36px; border-radius: 12px; font-size: 16px; font-weight: 500; cursor: pointer; transition: all 0.2s; font-family: 'DM Sans', sans-serif; }
        .btn-ghost:hover { border-color: rgba(255,255,255,0.3); color: #fff; }
        .hero-stats { display: flex; gap: 48px; margin-top: 64px; animation: fadeUp 0.6s ease 0.4s both; }
        .stat { text-align: center; }
        .stat-num { font-family: 'Syne', sans-serif; font-size: 32px; font-weight: 800; color: #FFC832; }
        .stat-label { font-size: 13px; color: rgba(255,255,255,0.4); margin-top: 4px; }
        .glow { position: absolute; width: 600px; height: 600px; border-radius: 50%; background: radial-gradient(circle, rgba(255,200,50,0.08) 0%, transparent 70%); top: 50%; left: 50%; transform: translate(-50%, -50%); pointer-events: none; }
        .features { padding: 120px 48px; max-width: 1200px; margin: 0 auto; }
        .section-label { font-size: 12px; font-weight: 600; letter-spacing: 3px; color: #FFC832; text-transform: uppercase; margin-bottom: 16px; }
        .section-title { font-family: 'Syne', sans-serif; font-size: clamp(32px, 5vw, 52px); font-weight: 800; letter-spacing: -2px; margin-bottom: 64px; max-width: 500px; line-height: 1.1; }
        .features-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 24px; }
        .feature-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 20px; padding: 32px; transition: all 0.3s; }
        .feature-card:hover { background: rgba(255,255,255,0.05); border-color: rgba(255,200,50,0.15); transform: translateY(-4px); }
        .feature-icon { width: 48px; height: 48px; background: rgba(255,200,50,0.1); border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 22px; margin-bottom: 20px; }
        .feature-title { font-family: 'Syne', sans-serif; font-size: 20px; font-weight: 700; margin-bottom: 12px; }
        .feature-desc { font-size: 14px; color: rgba(255,255,255,0.45); line-height: 1.7; }
        .how-it-works { padding: 120px 48px; background: rgba(255,255,255,0.02); border-top: 1px solid rgba(255,255,255,0.05); border-bottom: 1px solid rgba(255,255,255,0.05); }
        .hiw-inner { max-width: 1200px; margin: 0 auto; }
        .steps { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 32px; margin-top: 64px; }
        .step-num { font-family: 'Syne', sans-serif; font-size: 64px; font-weight: 800; color: rgba(255,200,50,0.08); line-height: 1; margin-bottom: 16px; }
        .step-title { font-family: 'Syne', sans-serif; font-size: 18px; font-weight: 700; margin-bottom: 8px; }
        .step-desc { font-size: 14px; color: rgba(255,255,255,0.4); line-height: 1.7; }
        .pricing { padding: 120px 48px; max-width: 1200px; margin: 0 auto; }
        .pricing-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 24px; margin-top: 64px; }
        .pricing-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 24px; padding: 40px 32px; transition: all 0.3s; }
        .pricing-card.popular { background: #FFC832; border-color: #FFC832; color: #000; }
        .pricing-card:not(.popular):hover { border-color: rgba(255,200,50,0.2); transform: translateY(-4px); }
        .plan-name { font-family: 'Syne', sans-serif; font-size: 14px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 16px; color: rgba(255,255,255,0.5); }
        .pricing-card.popular .plan-name { color: rgba(0,0,0,0.5); }
        .plan-price { font-family: 'Syne', sans-serif; font-size: 48px; font-weight: 800; letter-spacing: -2px; margin-bottom: 4px; }
        .plan-period { font-size: 13px; color: rgba(255,255,255,0.3); margin-bottom: 32px; }
        .pricing-card.popular .plan-period { color: rgba(0,0,0,0.4); }
        .plan-features { list-style: none; display: flex; flex-direction: column; gap: 12px; margin-bottom: 32px; }
        .plan-features li { font-size: 14px; color: rgba(255,255,255,0.6); display: flex; align-items: center; gap: 8px; }
        .pricing-card.popular .plan-features li { color: rgba(0,0,0,0.7); }
        .plan-features li::before { content: '✓'; color: #FFC832; font-weight: 700; }
        .pricing-card.popular .plan-features li::before { color: #000; }
        .btn-plan { width: 100%; padding: 14px; border-radius: 10px; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.2s; font-family: 'DM Sans', sans-serif; border: none; }
        .btn-plan-outline { background: transparent; color: rgba(255,255,255,0.7); border: 1px solid rgba(255,255,255,0.1); }
        .btn-plan-outline:hover { border-color: rgba(255,255,255,0.3); color: #fff; }
        .btn-plan-dark { background: #000; color: #fff; }
        .btn-plan-dark:hover { background: #111; }
        .cta-section { padding: 120px 48px; text-align: center; position: relative; overflow: hidden; }
        .cta-glow { position: absolute; width: 800px; height: 400px; background: radial-gradient(ellipse, rgba(255,200,50,0.06) 0%, transparent 70%); top: 50%; left: 50%; transform: translate(-50%, -50%); pointer-events: none; }
        .cta-title { font-family: 'Syne', sans-serif; font-size: clamp(36px, 6vw, 64px); font-weight: 800; letter-spacing: -2px; margin-bottom: 24px; position: relative; z-index: 1; }
        .cta-sub { font-size: 18px; color: rgba(255,255,255,0.4); margin-bottom: 48px; position: relative; z-index: 1; }
        footer { border-top: 1px solid rgba(255,255,255,0.05); padding: 40px 48px; display: flex; justify-content: space-between; align-items: center; color: rgba(255,255,255,0.3); font-size: 13px; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @media (max-width: 768px) { .nav { padding: 16px 24px; } .nav-links { display: none; } .features, .how-it-works .hiw-inner, .pricing, .cta-section { padding: 80px 24px; } .hero-stats { gap: 24px; } footer { flex-direction: column; gap: 16px; text-align: center; } }
      `}</style>

      <canvas ref={canvasRef} style={{ position: 'fixed', top: 0, left: 0, pointerEvents: 'none', zIndex: 0 }} />

      <nav className="nav">
        <div className="logo">AUTO<span>CLIP</span></div>
        <ul className="nav-links">
          <li><a href="#fitur">Fitur</a></li>
          <li><a href="#cara-kerja">Cara Kerja</a></li>
          <li><a href="#harga">Harga</a></li>
        </ul>
        <button className="btn-primary" onClick={() => router.push('/login')}>Mulai Gratis</button>
      </nav>

      <section className="hero">
        <div className="glow" />
        <div className="badge">✦ Didukung AI Terdepan</div>
        <h1 className="hero-title">
          Video Panjang<br />Jadi <span className="accent">Konten Viral</span><br />Otomatis
        </h1>
        <p className="hero-sub">Upload video atau paste link YouTube — AI kami akan memotong, mengedit, dan menghasilkan short clips siap posting dalam hitungan menit.</p>
        <div className="hero-actions">
          <button className="btn-big" onClick={() => router.push('/login')}>▶ Coba Sekarang — Gratis</button>
          <button className="btn-ghost" onClick={() => document.getElementById('cara-kerja')?.scrollIntoView({ behavior: 'smooth' })}>Lihat Cara Kerja</button>
        </div>
        <div className="hero-stats">
          <div className="stat"><div className="stat-num">10x</div><div className="stat-label">Lebih Cepat</div></div>
          <div className="stat"><div className="stat-num">AI</div><div className="stat-label">Multi-Provider</div></div>
          <div className="stat"><div className="stat-num">100%</div><div className="stat-label">Otomatis</div></div>
        </div>
      </section>

      <section className="features" id="fitur">
        <div className="section-label">Fitur Unggulan</div>
        <h2 className="section-title">Semua yang kamu butuhkan</h2>
        <div className="features-grid">
          {[
            { icon: '🎬', title: 'Auto Clip Detection', desc: 'AI menganalisis video dan menemukan momen paling menarik secara otomatis menggunakan Whisper & Gemini.' },
            { icon: '🎵', title: 'B-Roll Otomatis', desc: 'Cari dan insert footage B-roll dari Pexels & Pixabay sesuai konteks video kamu.' },
            { icon: '🔤', title: 'Subtitle Dinamis', desc: 'Generate subtitle yang sinkron dan highlight momen paling powerful dalam video.' },
            { icon: '⚡', title: 'Multi-AI Fallback', desc: 'Gemini → DeepSeek → Qwen → OpenRouter. Selalu ada backup agar proses tidak pernah gagal.' },
            { icon: '📱', title: 'Format Vertikal', desc: 'Output siap untuk TikTok, Instagram Reels, dan YouTube Shorts tanpa edit tambahan.' },
            { icon: '🔗', title: 'YouTube & Upload', desc: 'Paste link YouTube atau upload file video langsung. Support berbagai format video.' },
          ].map((f, i) => (
            <div key={i} className="feature-card">
              <div className="feature-icon">{f.icon}</div>
              <div className="feature-title">{f.title}</div>
              <div className="feature-desc">{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="how-it-works" id="cara-kerja">
        <div className="hiw-inner">
          <div className="section-label">Cara Kerja</div>
          <h2 className="section-title">3 langkah, selesai</h2>
          <div className="steps">
            {[
              { num: '01', title: 'Paste URL atau Upload', desc: 'Masukkan link YouTube atau upload file video kamu langsung ke dashboard.' },
              { num: '02', title: 'AI Bekerja', desc: 'Whisper transkripsi, AI analisa konten, lalu editor otomatis memotong dan mengedit.' },
              { num: '03', title: 'Download & Posting', desc: 'Short clips siap didownload dan langsung posting ke semua platform sosial media.' },
            ].map((s, i) => (
              <div key={i} className="step">
                <div className="step-num">{s.num}</div>
                <div className="step-title">{s.title}</div>
                <div className="step-desc">{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="pricing" id="harga">
        <div className="section-label">Harga</div>
        <h2 className="section-title">Mulai gratis, scale sesukamu</h2>
        <div className="pricing-grid">
          {[
            { name: 'Starter', price: 'Gratis', period: 'Selamanya', features: ['3 video/bulan', 'Output SD', 'Watermark AutoClip', 'Support komunitas'], popular: false },
            { name: 'Pro', price: 'Rp149K', period: '/bulan', features: ['50 video/bulan', 'Output HD', 'Tanpa watermark', 'Priority processing', 'Support prioritas'], popular: true },
            { name: 'Agency', price: 'Rp499K', period: '/bulan', features: ['Unlimited video', 'Output 4K', 'Custom branding', 'API access', 'Dedicated support'], popular: false },
          ].map((p, i) => (
            <div key={i} className={`pricing-card ${p.popular ? 'popular' : ''}`}>
              <div className="plan-name">{p.name}</div>
              <div className="plan-price">{p.price}</div>
              <div className="plan-period">{p.period}</div>
              <ul className="plan-features">{p.features.map((f, j) => <li key={j}>{f}</li>)}</ul>
              <button className={`btn-plan ${p.popular ? 'btn-plan-dark' : 'btn-plan-outline'}`} onClick={() => router.push('/login')}>
                {p.popular ? 'Mulai Sekarang' : 'Pilih Plan'}
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="cta-section">
        <div className="cta-glow" />
        <h2 className="cta-title">Siap buat konten<br /><span style={{ color: '#FFC832' }}>10x lebih cepat?</span></h2>
        <p className="cta-sub">Bergabung dengan kreator yang sudah menghemat ratusan jam editing.</p>
        <button className="btn-big" onClick={() => router.push('/login')} style={{ margin: '0 auto' }}>▶ Mulai Gratis Sekarang</button>
      </section>

      <footer>
        <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 18 }}>AUTO<span style={{ color: '#FFC832' }}>CLIP</span></div>
        <div>© 2026 AutoClip. All rights reserved.</div>
      </footer>
    </div>
  )
}

