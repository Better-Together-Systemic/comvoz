import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { supabase } from './supabase'

export function useAuth() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.push('/')
        return
      }
      setUser(session.user)
      fetchProfile(session.user.id)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!session) { router.push('/'); return }
        setUser(session.user)
        fetchProfile(session.user.id)
      }
    )
    return () => subscription.unsubscribe()
  }, [])

  async function fetchProfile(userId) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    setProfile(data)
    setLoading(false)
  }

  async function logout() {
    await supabase.auth.signOut()
    router.push('/')
  }

  return { user, profile, loading, logout }
}
