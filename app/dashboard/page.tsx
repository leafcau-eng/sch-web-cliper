'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function Dashboard() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)

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
    alert(data.message)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold">Auto Clipper</h1>
          <button onClick={handleLogout} className="text-zinc-400 hover:text-white text-sm">
            Logout
          </button>
        </div>
        <div className="bg-zinc-900 rounded-2xl p-6">
          <h2 className="text-lg font-semibold mb-4">Submit Video</h2>
          <input
            type="text"
            placeholder="Paste YouTube URL..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="w-full bg-zinc-800 text-white px-4 py-3 rounded-xl mb-4 outline-none"
          />
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-white text-black font-semibold py-3 rounded-xl hover:bg-zinc-200 transition disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Generate Clips'}
          </button>
        </div>
      </div>
    </div>
  )
}
