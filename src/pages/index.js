import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useRouter } from 'next/router'

export default function Login() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const [modo, setModo] = useState('login') // 'login' | 'reset'
  const [resetMsg, setResetMsg] = useState('')

  async function handleLogin(e) {
    e.preventDefault()
    setLoading(true)
    setErro('')
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha })
    if (error) {
      setErro('E-mail ou senha incorretos.')
    } else {
      router.push('/app')
    }
    setLoading(false)
  }

  async function handleReset(e) {
    e.preventDefault()
    setLoading(true)
    setErro('')
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/nova-senha`,
    })
    if (error) setErro('Não foi possível enviar o e-mail.')
    else setResetMsg('E-mail enviado! Verifique sua caixa de entrada.')
    setLoading(false)
  }

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        {/* Logo */}
        <div style={styles.logoWrap}>
          <div style={styles.dots}>
            {['#F2A7C3','#FFD966','#5DCAA5','#C4B0F5','#90CBF9'].map((c,i)=>(
              <span key={i} style={{...styles.dot, background:c}} />
            ))}
          </div>
          <h1 style={styles.title}>Com Voz</h1>
          <p style={styles.subtitle}>Better Together</p>
          <p style={styles.tagline}>A fala organiza o pensamento.<br/>A escrita mantém a presença.</p>
        </div>

        {/* Card */}
        <div style={styles.card}>
          {modo === 'login' ? (
            <>
              <h2 style={styles.cardTitle}>Entrar</h2>
              <form onSubmit={handleLogin}>
                <div style={styles.field}>
                  <label style={styles.label}>E-mail</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    required
                    autoComplete="email"
                  />
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>Senha</label>
                  <input
                    type="password"
                    value={senha}
                    onChange={e => setSenha(e.target.value)}
                    placeholder="••••••••"
                    required
                    autoComplete="current-password"
                  />
                </div>
                {erro && <p style={styles.erro}>{erro}</p>}
                <button type="submit" style={styles.btnPrimary} disabled={loading}>
                  {loading ? 'Entrando...' : 'Entrar'}
                </button>
              </form>
              <button
                style={styles.btnLink}
                onClick={() => { setModo('reset'); setErro(''); }}
              >
                Esqueci minha senha
              </button>
            </>
          ) : (
            <>
              <h2 style={styles.cardTitle}>Recuperar senha</h2>
              {resetMsg ? (
                <p style={styles.sucesso}>{resetMsg}</p>
              ) : (
                <form onSubmit={handleReset}>
                  <div style={styles.field}>
                    <label style={styles.label}>E-mail cadastrado</label>
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="seu@email.com"
                      required
                    />
                  </div>
                  {erro && <p style={styles.erro}>{erro}</p>}
                  <button type="submit" style={styles.btnPrimary} disabled={loading}>
                    {loading ? 'Enviando...' : 'Enviar link de recuperação'}
                  </button>
                </form>
              )}
              <button
                style={styles.btnLink}
                onClick={() => { setModo('login'); setErro(''); setResetMsg(''); }}
              >
                ← Voltar para o login
              </button>
            </>
          )}
        </div>

        <p style={styles.footer}>Better Together Systemic © {new Date().getFullYear()}</p>
      </div>
    </div>
  )
}

const styles = {
  page: {
    minHeight: '100vh',
    background: '#0a0a0a',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '1.5rem',
  },
  container: {
    width: '100%',
    maxWidth: '420px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '1.5rem',
  },
  logoWrap: {
    textAlign: 'center',
  },
  dots: {
    display: 'flex',
    justifyContent: 'center',
    gap: '8px',
    marginBottom: '12px',
  },
  dot: {
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    display: 'inline-block',
  },
  title: {
    fontSize: '32px',
    fontWeight: '600',
    color: '#f0f0f0',
    letterSpacing: '-0.02em',
  },
  subtitle: {
    fontSize: '14px',
    color: '#F2A7C3',
    fontWeight: '500',
    marginTop: '2px',
  },
  tagline: {
    fontSize: '13px',
    color: '#666',
    marginTop: '8px',
    lineHeight: 1.6,
    fontStyle: 'italic',
  },
  card: {
    width: '100%',
    background: '#111111',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '20px',
    padding: '2rem',
  },
  cardTitle: {
    fontSize: '20px',
    fontWeight: '500',
    color: '#f0f0f0',
    marginBottom: '1.5rem',
  },
  field: {
    marginBottom: '1rem',
  },
  label: {
    display: 'block',
    fontSize: '14px',
    color: '#999',
    marginBottom: '6px',
  },
  erro: {
    fontSize: '14px',
    color: '#f87171',
    background: 'rgba(248,113,113,0.1)',
    border: '1px solid rgba(248,113,113,0.2)',
    borderRadius: '8px',
    padding: '8px 12px',
    marginBottom: '1rem',
  },
  sucesso: {
    fontSize: '14px',
    color: '#5DCAA5',
    background: 'rgba(93,202,165,0.1)',
    border: '1px solid rgba(93,202,165,0.2)',
    borderRadius: '8px',
    padding: '10px 14px',
    marginBottom: '1rem',
  },
  btnPrimary: {
    width: '100%',
    padding: '12px',
    fontSize: '16px',
    fontWeight: '500',
    background: '#F2A7C3',
    color: '#3d1a27',
    border: 'none',
    borderRadius: '12px',
    marginTop: '0.5rem',
    transition: 'opacity .15s',
  },
  btnLink: {
    width: '100%',
    marginTop: '1rem',
    padding: '8px',
    fontSize: '14px',
    color: '#999',
    background: 'none',
    border: 'none',
    textAlign: 'center',
    textDecoration: 'underline',
  },
  footer: {
    fontSize: '12px',
    color: '#444',
    textAlign: 'center',
  },
}
