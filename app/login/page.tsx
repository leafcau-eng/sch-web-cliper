'use client'

import { supabase } from '@/lib/supabase'

export default function LoginPage() {
  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/dashboard`
      }
    })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="bg-zinc-900 p-8 rounded-2xl w-full max-w-md text-center">
        <h1 className="text-white text-3xl font-bold mb-2">Auto Clipper</h1>
        <p className="text-zinc-400 mb-8">Turn any video into viral clips</p>
        <button
          onClick={handleGoogleLogin}
          className="w-full bg-white text-black font-semibold py-3 px-6 rounded-xl hover:bg-zinc-200 transition"
        >
          Continue with Google
        </button>
      </div>
    </div>
  )
}
