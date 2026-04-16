import { useEffect, useState } from 'react'
import { useAuth } from '../lib/useAuth'
import { supabase, uploadFoto } from '../lib/supabase'

const SK = {
  S1:{label:'Semana 1 — Eu chego',mes:1,tema:'Acolhimento e organização',frase:'EU ESTOU AQUI',guia:'Mostre escrito: EU ESTOU AQUI. Você lê → ela repete → ela copia.',casa:'Dia 1: mãe pergunta "Você está aqui comigo?" | Dia 2: apontar objetos | Dia 3: só leitura.'},
  S2:{label:'Semana 2 — Meu dia começa',mes:1,tema:'Acolhimento e organização',frase:'EU ACORDO / EU COMO',guia:'Apresente as duas frases. Ela escolhe uma.',casa:'Dia 1: escreve "Eu acordo." | Dia 2: escreve "Eu como."'},
  S3:{label:'Semana 3 — Eu faço',mes:1,tema:'Acolhimento e organização',frase:'EU FAÇO ______.',guia:'Pergunte o que ela fez. Ofereça opções: comida, banho, dormir.',casa:'Mãe pergunta: "O que você fez?"'},
  S4:{label:'Semana 4 — Eu sinto',mes:1,tema:'Acolhimento e organização',frase:'EU ESTOU ______. (feliz / cansada / triste)',guia:'Apresente emoções. Sem infantilizar.',casa:'Mãe pergunta à noite: "Como você está?"'},
  S5:{label:'Semana 5 — Eu escolho',mes:2,tema:'Autonomia',frase:'EU ESCOLHO ______.',guia:'Apresente 2 opções reais.',casa:'Mãe oferece escolhas reais durante o dia.'},
  S6:{label:'Semana 6 — Eu faço sozinha',mes:2,tema:'Autonomia',frase:'EU FIZ ______.',guia:'Pergunte: "Você fez algo sozinha?"',casa:'Pequena tarefa: guardar algo, ajudar na casa.'},
  S7:{label:'Semana 7 — Minha mãe',mes:2,tema:'Autonomia',frase:'MINHA MÃE É ______.',guia:'Pergunte: "Como é sua mãe?"',casa:'Interação afetiva entre elas.'},
  S8:{label:'Semana 8 — Eu ajudo',mes:2,tema:'Autonomia',frase:'EU AJUDO EM ______.',guia:'Pergunte: "Você ajuda em casa?"',casa:'Identificar uma forma de ajuda em casa.'},
  S9:{label:'Semana 9 — Eu gosto',mes:3,tema:'Identidade',frase:'EU GOSTO DE ______.',guia:'Deixe ela escolher livremente.',casa:'Escreve no caderno: "Eu gosto de ______."'},
  S10:{label:'Semana 10 — Eu penso',mes:3,tema:'Identidade',frase:'EU ACHO ______.',guia:'Ela tem uma opinião. Valorize.',casa:'Pratica com a mãe.'},
  S11:{label:'Semana 11 — Meu dia',mes:3,tema:'Identidade',frase:'HOJE EU ______.',guia:'Ela narra o próprio dia.',casa:'Escreve no caderno da vida dela.'},
  S12:{label:'Semana 12 — Integração',mes:3,tema:'Identidade',frase:'EU SOU ______. EU GOSTO DE ______. EU FAÇO ______.',guia:'Integração de tudo. Celebre.',casa:'Lê o caderno inteiro com a mãe.'}
}

const CORES = { 1: '#F2A7C3', 2: '#5DCAA5', 3: '#C4B0F5' }
const TEMAS = { 1: 'Acolhimento e organização', 2: 'Autonomia', 3: 'Identidade' }

export default function AppPage() {
  const { user, profile, loading, logout } = useAuth()
  const [aba, setAba] = useState('novo')
  const [pacientes, setPacientes] = useState([])
  const [sessoes, setSessoes] = useState([])
  const [salvando, setSalvando] = useState(false)
  const [mensagem, setMensagem] = useState('')

  // Formulário
  const [form, setForm] = useState(getFormVazio())
  const [fotos, setFotos] = useState([])       // [{file, preview, uploading}]
  const [dragOver, setDragOver] = useState(false)
  const [novaPacNome, setNovaPacNome] = useState('')
  const [novaPacMae, setNovaPacMae] = useState('')
  const [showNovaPac, setShowNovaPac] = useState(false)
  const [criandoPac, setCriandoPac] = useState(false)
  const [erroPac, setErroPac] = useState('')
  const [loadingPac, setLoadingPac] = useState(false)
  const [sessaoAtiva, setSessaoAtiva] = useState(null)
  const [modoEdicao, setModoEdicao] = useState(false)
  const [formEdicao, setFormEdicao] = useState(null)
  const [salvandoEdicao, setSalvandoEdicao] = useState(false)
  const [erroEdicao, setErroEdicao] = useState('')
  const [busca, setBusca] = useState('')

  function getFormVazio() {
    return {
      paciente_id: '', data_sessao: new Date().toISOString().split('T')[0],
      semana: '', palavra_encontro: '',
      mae_antes: '', mae_depois: '', mae_avaliacao: '', mae_av_obs: '', mae_orientacao: '',
      humor_inicio: [], chegada: '', st_vinculo: 0,
      conv_checks: [], conversa: '',
      frase: '', com_func: [], ativ_checks: [],
      palavras_novas: '', expressao: '', corpo: '', material: '', obs_checks: [],
      st_envolvimento: 0,
      casa_anterior: '', casa_checks: [], casa_obs: '',
      humor_fim: [], oq_fez: '', validacao: '', resposta_rec: '', st_autoestima: 0,
      para_mae: '', para_mae_ativ: '',
      aprendeu: '', obs: '', prox: '', st_geral: 0,
      conf_hipoteses: '', conf_indicadores: '', conf_alertas: '', conf_encam: '',
    }
  }

  useEffect(() => {
    if (user && profile) {
      fetchPacientes()
      fetchSessoes()
    }
  }, [user, profile])

  async function fetchPacientes() {
    setLoadingPac(true)
    const { data, error } = await supabase
      .from('pacientes')
      .select('*')
      .eq('ativo', true)
      .order('nome')
    if (error) {
      console.error('Erro ao buscar pacientes:', error)
      setErroPac('Erro ao carregar pacientes: ' + error.message)
    } else {
      setPacientes(data || [])
    }
    setLoadingPac(false)
  }

  async function fetchSessoes() {
    const { data } = await supabase
      .from('sessoes')
      .select('*, pacientes(nome)')
      .order('data_sessao', { ascending: false })
      .limit(100)
    setSessoes(data || [])
  }

  async function excluirSessao(id) {
    if (!confirm('Excluir este registro permanentemente?')) return
    const { error } = await supabase.from('sessoes').delete().eq('id', id)
    if (!error) {
      setSessoes(prev => prev.filter(s => s.id !== id))
      setSessaoAtiva(null)
      setModoEdicao(false)
    }
  }

  function podeEditar(sess) {
    if (!profile) return false
    if (profile.role === 'admin') return true
    return sess.terapeuta_id === user.id
  }

  function iniciarEdicao(sess) {
    setFormEdicao({
      semana: sess.semana || '',
      palavra_encontro: sess.palavra_encontro || '',
      data_sessao: sess.data_sessao || '',
      mae_antes: sess.mae_antes || '',
      mae_depois: sess.mae_depois || '',
      mae_avaliacao: sess.mae_avaliacao || '',
      mae_av_obs: sess.mae_av_obs || '',
      mae_orientacao: sess.mae_orientacao || '',
      humor_inicio: Array.isArray(sess.humor_inicio) ? sess.humor_inicio : (sess.humor_inicio ? [sess.humor_inicio] : []),
      chegada: sess.chegada || '',
      st_vinculo: sess.st_vinculo || 0,
      conv_checks: sess.conv_checks || [],
      conversa: sess.conversa || '',
      frase: sess.frase || '',
      com_func: sess.com_func || [],
      ativ_checks: sess.ativ_checks || [],
      palavras_novas: sess.palavras_novas || '',
      expressao: sess.expressao || '',
      corpo: sess.corpo || '',
      material: sess.material || '',
      obs_checks: sess.obs_checks || [],
      st_envolvimento: sess.st_envolvimento || 0,
      casa_anterior: sess.casa_anterior || '',
      casa_checks: sess.casa_checks || [],
      casa_obs: sess.casa_obs || '',
      humor_fim: Array.isArray(sess.humor_fim) ? sess.humor_fim : (sess.humor_fim ? [sess.humor_fim] : []),
      oq_fez: sess.oq_fez || '',
      validacao: sess.validacao || '',
      resposta_rec: sess.resposta_rec || '',
      st_autoestima: sess.st_autoestima || 0,
      para_mae: sess.para_mae || '',
      para_mae_ativ: sess.para_mae_ativ || '',
      aprendeu: sess.aprendeu || '',
      obs: sess.obs || '',
      prox: sess.prox || '',
      st_geral: sess.st_geral || 0,
      conf_hipoteses: sess.conf_hipoteses || '',
      conf_indicadores: sess.conf_indicadores || '',
      conf_alertas: sess.conf_alertas || '',
      conf_encam: sess.conf_encam || '',
    })
    setModoEdicao(true)
    setErroEdicao('')
  }

  async function salvarEdicao() {
    setSalvandoEdicao(true)
    setErroEdicao('')
    const { error } = await supabase
      .from('sessoes')
      .update(formEdicao)
      .eq('id', sessaoAtiva.id)
    if (error) {
      setErroEdicao('Erro ao salvar: ' + error.message)
    } else {
      const atualizado = { ...sessaoAtiva, ...formEdicao }
      setSessaoAtiva(atualizado)
      setSessoes(prev => prev.map(s => s.id === sessaoAtiva.id ? { ...s, ...formEdicao } : s))
      setModoEdicao(false)
    }
    setSalvandoEdicao(false)
  }

  async function criarPaciente() {
    if (!novaPacNome.trim()) {
      setErroPac('Digite o nome da paciente.')
      return
    }
    setCriandoPac(true)
    setErroPac('')
    const { data, error } = await supabase
      .from('pacientes')
      .insert({
        terapeuta_id: user.id,
        nome: novaPacNome.trim(),
        nome_mae: novaPacMae.trim() || null,
      })
      .select()
      .single()

    if (error) {
      console.error('Erro ao criar paciente:', error)
      setErroPac('Erro ao criar: ' + error.message)
    } else {
      setPacientes(prev => [...prev, data].sort((a, b) => a.nome.localeCompare(b.nome)))
      setForm(f => ({ ...f, paciente_id: data.id }))
      setNovaPacNome('')
      setNovaPacMae('')
      setShowNovaPac(false)
      setErroPac('')
    }
    setCriandoPac(false)
  }

  function adicionarFotos(files) {
    const novas = Array.from(files).map(file => ({
      file,
      preview: URL.createObjectURL(file),
      id: Math.random().toString(36).slice(2),
    }))
    setFotos(prev => [...prev, ...novas])
  }

  function removerFoto(id) {
    setFotos(prev => prev.filter(f => f.id !== id))
  }

  function onDrop(e) {
    e.preventDefault()
    setDragOver(false)
    const files = e.dataTransfer?.files
    if (files?.length) adicionarFotos(files)
  }

  async function salvar() {
    if (!form.paciente_id || !form.data_sessao) {
      setMensagem('Selecione a paciente e a data.'); return
    }
    setSalvando(true)
    setMensagem('')
    try {
      const sessaoId = crypto.randomUUID()

      // Upload de múltiplas fotos
      const fotoUrls = []
      for (const foto of fotos) {
        const ext = foto.file.name.split('.').pop()
        const path = `${user.id}/${sessaoId}/${foto.id}.${ext}`
        const { error: upErr } = await supabase.storage
          .from('fotos-sessoes')
          .upload(path, foto.file, { upsert: true })
        if (!upErr) {
          // URL assinada com validade de 10 anos
          const { data: signed } = await supabase.storage
            .from('fotos-sessoes')
            .createSignedUrl(path, 60 * 60 * 24 * 365 * 10)
          if (signed?.signedUrl) fotoUrls.push(signed.signedUrl)
        }
      }

      const { error } = await supabase.from('sessoes').insert({
        id: sessaoId,
        terapeuta_id: user.id,
        ...form,
        foto_url: fotoUrls.length > 0 ? JSON.stringify(fotoUrls) : null,
      })
      if (error) throw error
      setMensagem('Encontro salvo!')
      setForm(getFormVazio())
      setFotos([])
      fetchSessoes()
    } catch (e) {
      setMensagem('Erro ao salvar: ' + e.message)
    }
    setSalvando(false)
  }

  if (loading) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#0a0a0a' }}>
      <p style={{ color:'#666' }}>Carregando...</p>
    </div>
  )

  return (
    <div style={s.page}>
      {/* TOPO */}
      <header style={s.header}>
        <div style={s.headerLeft}>
          <div style={s.dots}>
            {['#F2A7C3','#FFD966','#5DCAA5','#C4B0F5','#90CBF9'].map((c,i)=>(
              <span key={i} style={{...s.dot, background:c}} />
            ))}
          </div>
          <span style={s.headerTitle}>Com Voz</span>
        </div>
        <div style={s.headerRight}>
          {profile && (
            <span style={s.headerUser}>
              {profile.nome}
              {profile.role === 'admin' && <span style={s.adminBadge}>admin</span>}
            </span>
          )}
          <button style={s.btnLogout} onClick={logout}>Sair</button>
        </div>
      </header>

      {/* NAV */}
      <nav style={s.nav}>
        {[
          { id:'novo', label:'Novo encontro' },
          { id:'historico', label:'Histórico' },
          { id:'painel', label:'Painel' },
        ].map(n => (
          <button key={n.id} style={{...s.navBtn, ...(aba===n.id?s.navBtnOn:{})}}
            onClick={() => setAba(n.id)}>
            {n.label}
          </button>
        ))}
      </nav>

      <main style={s.main}>

        {/* ══════ NOVO ENCONTRO ══════ */}
        {aba === 'novo' && (
          <div>
            {/* Identificação */}
            <Card cor="#F2A7C3" titulo="Identificação" pill="Encontro">
              <div style={s.g2}>
                <div>
                  <Lbl>Paciente</Lbl>
                  {loadingPac
                    ? <p style={{ color:'#666', fontSize:14, padding:'8px 0' }}>Carregando pacientes...</p>
                    : (
                      <select
                        value={form.paciente_id}
                        onChange={e => setForm(f => ({ ...f, paciente_id: e.target.value }))}
                      >
                        <option value="">
                          {pacientes.length === 0 ? 'Nenhuma paciente ainda — crie abaixo' : 'Selecione a paciente...'}
                        </option>
                        {pacientes.map(p => (
                          <option key={p.id} value={p.id}>{p.nome}</option>
                        ))}
                      </select>
                    )
                  }
                  <button
                    style={s.btnMini}
                    onClick={() => { setShowNovaPac(!showNovaPac); setErroPac('') }}
                  >
                    {showNovaPac ? '✕ Cancelar' : '+ Nova paciente'}
                  </button>
                  {showNovaPac && (
                    <div style={{ marginTop:10, display:'flex', flexDirection:'column', gap:8, padding:'12px', background:'rgba(255,255,255,0.03)', borderRadius:12, border:'1px solid rgba(255,255,255,0.08)' }}>
                      <input
                        placeholder="Nome completo da paciente *"
                        value={novaPacNome}
                        onChange={e => { setNovaPacNome(e.target.value); setErroPac('') }}
                        onKeyDown={e => e.key === 'Enter' && criarPaciente()}
                        autoFocus
                      />
                      <input
                        placeholder="Nome da mãe (opcional)"
                        value={novaPacMae}
                        onChange={e => setNovaPacMae(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && criarPaciente()}
                      />
                      {erroPac && (
                        <p style={{ fontSize:13, color:'#f87171', background:'rgba(248,113,113,0.1)', borderRadius:8, padding:'6px 10px' }}>
                          {erroPac}
                        </p>
                      )}
                      <button
                        style={{ ...s.btnTeal, opacity: criandoPac ? 0.6 : 1 }}
                        onClick={criarPaciente}
                        disabled={criandoPac}
                      >
                        {criandoPac ? 'Criando...' : 'Criar e selecionar'}
                      </button>
                    </div>
                  )}
                </div>
                <div>
                  <Lbl>Data do encontro</Lbl>
                  <input type="date" value={form.data_sessao} onChange={e=>setForm(f=>({...f, data_sessao:e.target.value}))} />
                </div>
              </div>
              <div style={s.g2}>
                <div>
                  <Lbl>Semana do programa</Lbl>
                  <select value={form.semana} onChange={e => {
                    const sk = SK[e.target.value]
                    setForm(f=>({...f, semana:e.target.value, frase: sk?.frase||f.frase}))
                  }}>
                    <option value="">Selecione...</option>
                    <optgroup label="Mês 1 — Acolhimento e organização">
                      {['S1','S2','S3','S4'].map(k=><option key={k} value={k}>{SK[k].label}</option>)}
                    </optgroup>
                    <optgroup label="Mês 2 — Autonomia">
                      {['S5','S6','S7','S8'].map(k=><option key={k} value={k}>{SK[k].label}</option>)}
                    </optgroup>
                    <optgroup label="Mês 3 — Identidade">
                      {['S9','S10','S11','S12'].map(k=><option key={k} value={k}>{SK[k].label}</option>)}
                    </optgroup>
                  </select>
                  {form.semana && SK[form.semana] && (
                    <div style={s.guiaBox}>{SK[form.semana].guia}</div>
                  )}
                </div>
                <div>
                  <Lbl>Palavra do encontro</Lbl>
                  <input
                    style={{ fontSize:22, fontWeight:500, textAlign:'center', background:'rgba(242,167,195,0.1)', borderColor:'#F2A7C3', color:'#F2A7C3' }}
                    placeholder="a palavra que ficou..."
                    value={form.palavra_encontro}
                    onChange={e=>setForm(f=>({...f, palavra_encontro:e.target.value}))}
                  />
                </div>
              </div>
              <Lbl>Fotos do encontro</Lbl>
              {/* Grade de fotos já adicionadas */}
              {fotos.length > 0 && (
                <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8, marginBottom:10 }}>
                  {fotos.map(f => (
                    <div key={f.id} style={{ position:'relative', borderRadius:10, overflow:'hidden', aspectRatio:'1' }}>
                      <img src={f.preview} alt="foto" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                      <button
                        onClick={() => removerFoto(f.id)}
                        style={{ position:'absolute', top:5, right:5, width:24, height:24, borderRadius:'50%', background:'rgba(0,0,0,0.7)', border:'none', color:'#fff', fontSize:14, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}
                      >✕</button>
                    </div>
                  ))}
                </div>
              )}
              {/* Área de drop */}
              <div
                style={{ ...s.fotoArea, borderColor: dragOver ? '#F2A7C3' : 'rgba(255,255,255,0.1)', background: dragOver ? 'rgba(242,167,195,0.06)' : 'transparent', transition:'all .15s' }}
                onClick={() => document.getElementById('foto-input').click()}
                onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={onDrop}
              >
                <input
                  id="foto-input"
                  type="file"
                  accept="image/*"
                  multiple
                  style={{ display:'none' }}
                  onChange={e => adicionarFotos(e.target.files)}
                />
                <div style={{ fontSize:28, marginBottom:6 }}>📷</div>
                <p style={{ color:'#666', fontSize:14 }}>
                  {fotos.length > 0 ? 'Adicionar mais fotos' : 'Arraste fotos aqui ou clique para selecionar'}
                </p>
                <p style={{ color:'#444', fontSize:12, marginTop:3 }}>Pode selecionar várias de uma vez</p>
              </div>
            </Card>

            {/* Relato da mãe */}
            <Card cor="#A8E6CF" titulo="Relato da mãe" pill="Contexto">
              <Lbl>Antes do encontro</Lbl>
              <textarea placeholder="Como ela chegou de casa? A mãe observou algo?" value={form.mae_antes} onChange={e=>setForm(f=>({...f,mae_antes:e.target.value}))} />
              <Lbl>Depois do encontro</Lbl>
              <textarea placeholder="Repercussão em casa..." value={form.mae_depois} onChange={e=>setForm(f=>({...f,mae_depois:e.target.value}))} />
            </Card>

            {/* Chegada */}
            <Card cor="#F2A7C3" titulo="1. Chegada — rapport" pill="5 min">
              <InfoBox>"Olá, que bom te ver. <strong>Eu vejo você.</strong>" — tom calmo, sorriso leve, sem pressa.</InfoBox>
              <Lbl>Humor e energia no início</Lbl>
              <HumorRow opcoes={['Muito animada','Tranquila','Quieta / fechada','Agitada','Resistente','Sonolenta']}
                valores={form.humor_inicio} onChange={v=>setForm(f=>({...f,humor_inicio:v}))} />
              <Lbl>Como ela chegou?</Lbl>
              <textarea placeholder="O que você percebeu?" value={form.chegada} onChange={e=>setForm(f=>({...f,chegada:e.target.value}))} />
              <Lbl>Vínculo percebido</Lbl>
              <Estrelas valor={form.st_vinculo} onChange={v=>setForm(f=>({...f,st_vinculo:v}))} />
            </Card>

            {/* Conversa */}
            <Card cor="#FFD966" titulo="2. Conversa simples" pill="5 a 10 min">
              <InfoBox>Ajuda o cérebro a <strong>organizar respostas</strong>.</InfoBox>
              <Lbl>Perguntas usadas</Lbl>
              <CheckGroup
                opcoes={['"Você está bem?"','"O que você fez hoje?"','"Você comeu?"','"Você dormiu?"','"O que você fez de manhã?"']}
                valores={form.conv_checks}
                onChange={v=>setForm(f=>({...f,conv_checks:v}))}
              />
              <Lbl>Como ela respondeu?</Lbl>
              <textarea placeholder="Ela respondeu espontaneamente?" value={form.conversa} onChange={e=>setForm(f=>({...f,conversa:e.target.value}))} />
            </Card>

            {/* Atividade */}
            <Card cor="#5DCAA5" titulo="3. Apresentação e escrita" pill="20 min">
              {form.semana && <div style={s.fraseDest}>{SK[form.semana]?.frase || form.frase}</div>}
              <Lbl>Frase trabalhada hoje</Lbl>
              <input placeholder='EU ESTOU AQUI' value={form.frase} onChange={e=>setForm(f=>({...f,frase:e.target.value}))} />
              <Lbl>Comunicação funcional</Lbl>
              <div style={s.cfGrid}>
                {[
                  {val:'iniciou_fala', label:'Iniciou fala espontânea'},
                  {val:'respondeu_perguntada', label:'Respondeu quando perguntada'},
                  {val:'usou_frase_trabalhada', label:'Usou a frase trabalhada'},
                ].map(cf=>(
                  <div key={cf.val}
                    style={{...s.cfItem, ...(form.com_func.includes(cf.val)?s.cfItemOn:{})}}
                    onClick={()=>setForm(f=>({...f,com_func:f.com_func.includes(cf.val)?f.com_func.filter(x=>x!==cf.val):[...f.com_func,cf.val]}))}>
                    <div style={s.cfLabel}>{cf.label}</div>
                  </div>
                ))}
              </div>
              <Lbl>Atividades realizadas</Lbl>
              <CheckGroup
                opcoes={['Você leu a frase em voz alta','Ela repetiu depois de você','Ela copiou a frase completa','Ela copiou só parte','Você apontou palavra por palavra','Ofereceu palavras prontas','Só leitura (sem escrita)','Ela desenhou junto']}
                valores={form.ativ_checks} onChange={v=>setForm(f=>({...f,ativ_checks:v}))}
              />
              <Lbl>Palavras novas espontâneas</Lbl>
              <input placeholder='"saudade", "bonito"...' value={form.palavras_novas} onChange={e=>setForm(f=>({...f,palavras_novas:e.target.value}))} />
              <Lbl>O que ela expressou</Lbl>
              <textarea placeholder="Com as palavras dela..." value={form.expressao} onChange={e=>setForm(f=>({...f,expressao:e.target.value}))} />
              <Lbl>Corpo e emoção</Lbl>
              <textarea placeholder="Postura, respiração..." value={form.corpo} onChange={e=>setForm(f=>({...f,corpo:e.target.value}))} />
              <Lbl>Material usado</Lbl>
              <input placeholder="Cartão, folha com linha grossa..." value={form.material} onChange={e=>setForm(f=>({...f,material:e.target.value}))} />
              <Lbl>O que observar</Lbl>
              <CheckGroup
                opcoes={['Ela olhou para você','Ela respondeu (do jeito que conseguiu)','Ela participou / estava presente','Ela sorriu','Ela se esforçou']}
                valores={form.obs_checks} onChange={v=>setForm(f=>({...f,obs_checks:v}))}
              />
              <Lbl>Qualidade do envolvimento</Lbl>
              <Estrelas valor={form.st_envolvimento} onChange={v=>setForm(f=>({...f,st_envolvimento:v}))} />
            </Card>

            {/* Casa */}
            <Card cor="#90CBF9" titulo="Prática em casa" pill="2 a 3 dias">
              {form.semana && <InfoBox>{SK[form.semana]?.casa}</InfoBox>}
              <Lbl>O que ela trouxe da semana anterior</Lbl>
              <textarea placeholder="Ela praticou? A mãe apoiou?" value={form.casa_anterior} onChange={e=>setForm(f=>({...f,casa_anterior:e.target.value}))} />
              <Lbl>Combinação para esta semana</Lbl>
              <CheckGroup
                opcoes={['Mãe pergunta e ela responde','Escreve a frase do dia','Aponta objetos da casa','Pratica na rotina diária','Só vínculo (sem forçar)','Só leitura','Tarefa de autonomia','Interação afetiva']}
                valores={form.casa_checks} onChange={v=>setForm(f=>({...f,casa_checks:v}))}
              />
              <Lbl>Observações</Lbl>
              <textarea placeholder="Como a mãe está participando?" value={form.casa_obs} onChange={e=>setForm(f=>({...f,casa_obs:e.target.value}))} />
            </Card>

            {/* Encerramento */}
            <Card cor="#C4B0F5" titulo="4. Encerramento" pill="5 min">
              <InfoBox><strong>Validação = construção interna.</strong> "Você foi muito bem. Eu gostei de estar com você."</InfoBox>
              <Lbl>Humor e energia ao final</Lbl>
              <HumorRow opcoes={['Muito animada','Tranquila','Satisfeita','Cansada','Emotiva','Dispersa']}
                valores={form.humor_fim} onChange={v=>setForm(f=>({...f,humor_fim:v}))} />
              <Lbl>"O que você fez aqui comigo hoje?"</Lbl>
              <textarea placeholder='"Você escreveu." "Você estava aqui."' value={form.oq_fez} onChange={e=>setForm(f=>({...f,oq_fez:e.target.value}))} />
              <Lbl>Validação que você ofereceu</Lbl>
              <textarea value={form.validacao} onChange={e=>setForm(f=>({...f,validacao:e.target.value}))} />
              <Lbl>Resposta dela ao reconhecimento</Lbl>
              <textarea value={form.resposta_rec} onChange={e=>setForm(f=>({...f,resposta_rec:e.target.value}))} />
              <Lbl>Autoestima percebida</Lbl>
              <Estrelas valor={form.st_autoestima} onChange={v=>setForm(f=>({...f,st_autoestima:v}))} />
            </Card>

            {/* Para a mãe */}
            <Card cor="#FFB347" titulo="Para a mãe" pill="Imprimível">
              <Lbl>Mensagem desta semana</Lbl>
              <textarea style={{ minHeight:90 }} placeholder="Esta semana priorize o vínculo..." value={form.para_mae} onChange={e=>setForm(f=>({...f,para_mae:e.target.value}))} />
              <Lbl>Atividade para fazer juntas</Lbl>
              <textarea value={form.para_mae_ativ} onChange={e=>setForm(f=>({...f,para_mae_ativ:e.target.value}))} />
            </Card>

            {/* Reflexão */}
            <Card cor="#90CBF9" titulo="Reflexão final" pill="Sua voz">
              <InfoBox>"O que você aprendeu com ela hoje?" — <strong>presença é mais importante que desempenho.</strong></InfoBox>
              <Lbl>"O que você aprendeu com ela hoje?"</Lbl>
              <textarea value={form.aprendeu} onChange={e=>setForm(f=>({...f,aprendeu:e.target.value}))} />
              <Lbl>Observações livres</Lbl>
              <textarea value={form.obs} onChange={e=>setForm(f=>({...f,obs:e.target.value}))} />
              <Lbl>Foco para o próximo encontro</Lbl>
              <textarea value={form.prox} onChange={e=>setForm(f=>({...f,prox:e.target.value}))} />
              <Lbl>Evolução geral percebida hoje</Lbl>
              <Estrelas valor={form.st_geral} onChange={v=>setForm(f=>({...f,st_geral:v}))} />
            </Card>

            {/* Anotações clínicas */}
            <Card cor="#9B59B6" titulo="Anotações clínicas" pill="Confidencial — não entra no PDF">
              <Lbl>Hipóteses clínicas / observações técnicas</Lbl>
              <textarea placeholder="Observações clínicas, hipóteses..." value={form.conf_hipoteses} onChange={e=>setForm(f=>({...f,conf_hipoteses:e.target.value}))} />
              <Lbl>Indicadores de desenvolvimento</Lbl>
              <textarea placeholder="O que está emergindo?" value={form.conf_indicadores} onChange={e=>setForm(f=>({...f,conf_indicadores:e.target.value}))} />
              <Lbl>Pontos de atenção / alertas</Lbl>
              <textarea placeholder="Algo que precisa de acompanhamento?" value={form.conf_alertas} onChange={e=>setForm(f=>({...f,conf_alertas:e.target.value}))} />
              <Lbl>Encaminhamentos</Lbl>
              <textarea value={form.conf_encam} onChange={e=>setForm(f=>({...f,conf_encam:e.target.value}))} />
            </Card>

            {/* Barra de ações */}
            <div style={s.acoesBar}>
              <p style={{ color:'#999', fontSize:14, width:'100%' }}>O que você quer fazer?</p>
              <button style={s.btnSalvar} onClick={salvar} disabled={salvando}>
                {salvando ? 'Salvando...' : 'Salvar encontro'}
              </button>
              <button style={s.btnLimpar} onClick={()=>{setForm(getFormVazio());setFotos([])}}>
                Limpar
              </button>
              {mensagem && <p style={{ width:'100%', fontSize:14, color: mensagem.startsWith('Erro') ? '#f87171' : '#5DCAA5' }}>{mensagem}</p>}
            </div>
          </div>
        )}

        {/* ══════ HISTÓRICO ══════ */}
        {aba === 'historico' && (
          <div>
            {/* Busca */}
            <div style={{ marginBottom:'1rem' }}>
              <input
                placeholder="Buscar por nome da paciente..."
                value={busca}
                onChange={e => setBusca(e.target.value)}
                style={{ background:'#111', borderColor:'rgba(255,255,255,0.1)' }}
              />
            </div>

            {/* Lista */}
            {sessoes.filter(s =>
              !busca || s.pacientes?.nome?.toLowerCase().includes(busca.toLowerCase())
            ).length === 0
              ? <div style={s.empty}>Nenhuma sessão encontrada.</div>
              : sessoes
                  .filter(s => !busca || s.pacientes?.nome?.toLowerCase().includes(busca.toLowerCase()))
                  .map(sess => {
                    const sk = SK[sess.semana]
                    return (
                      <div
                        key={sess.id}
                        style={{ ...s.regItem, cursor:'pointer' }}
                        onClick={() => setSessaoAtiva(sess)}
                      >
                        <div style={s.regTop}>
                          <span style={s.regNome}>{sess.pacientes?.nome || '—'}</span>
                          <span style={{ fontSize:13, color:'#666' }}>{fmtD(sess.data_sessao)}</span>
                        </div>
                        <div style={{ fontSize:13, color:'#666', marginTop:3 }}>
                          {sk?.label || sess.semana || 'Sem semana'}
                          {sess.st_geral ? ' · ' + '★'.repeat(sess.st_geral) + '☆'.repeat(5 - sess.st_geral) : ''}
                        </div>
                        {sess.palavra_encontro && (
                          <div style={{ fontSize:16, fontWeight:500, color:'#F2A7C3', marginTop:4 }}>
                            "{sess.palavra_encontro}"
                          </div>
                        )}
                        {sess.frase && (
                          <div style={{ fontSize:13, color:'#666', fontStyle:'italic' }}>"{sess.frase}"</div>
                        )}
                        <div style={{ fontSize:12, color:'#444', marginTop:6 }}>Toque para ver o registro completo →</div>
                      </div>
                    )
                  })
            }

            {/* MODAL */}
            {sessaoAtiva && (
              <div
                style={s.modalBg}
                onClick={e => { if (e.target === e.currentTarget) { setSessaoAtiva(null); setModoEdicao(false) } }}
              >
                <div style={s.modalBox}>

                  {/* Cabeçalho */}
                  <div style={s.modalHeader}>
                    <div>
                      <div style={{ fontSize:19, fontWeight:500, color:'#f0f0f0' }}>
                        {sessaoAtiva.pacientes?.nome || '—'}
                      </div>
                      <div style={{ fontSize:13, color:'#888', marginTop:2 }}>
                        {SK[sessaoAtiva.semana]?.label || sessaoAtiva.semana || '—'} · {fmtD(sessaoAtiva.data_sessao)}
                        {sessaoAtiva.terapeuta_id !== user?.id && profile?.role === 'admin' && (
                          <span style={{ marginLeft:8, fontSize:11, color:'#9B59B6', background:'rgba(155,89,182,0.12)', padding:'2px 8px', borderRadius:10 }}>
                            registro de outra terapeuta
                          </span>
                        )}
                      </div>
                    </div>
                    <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                      {podeEditar(sessaoAtiva) && !modoEdicao && (
                        <button
                          style={{ padding:'6px 14px', fontSize:13, fontWeight:500, background:'rgba(93,202,165,0.12)', color:'#5DCAA5', border:'1px solid rgba(93,202,165,0.3)', borderRadius:20, cursor:'pointer' }}
                          onClick={() => iniciarEdicao(sessaoAtiva)}
                        >
                          Editar
                        </button>
                      )}
                      {modoEdicao && (
                        <button
                          style={{ padding:'6px 14px', fontSize:13, color:'#888', background:'transparent', border:'1px solid rgba(255,255,255,0.1)', borderRadius:20, cursor:'pointer' }}
                          onClick={() => setModoEdicao(false)}
                        >
                          Cancelar
                        </button>
                      )}
                      <button style={s.modalClose} onClick={() => { setSessaoAtiva(null); setModoEdicao(false) }}>✕</button>
                    </div>
                  </div>

                  {/* ── MODO VISUALIZAÇÃO ── */}
                  {!modoEdicao && (
                    <>
                      {sessaoAtiva.palavra_encontro && (
                        <div style={{ background:'rgba(242,167,195,0.1)', border:'1px solid rgba(242,167,195,0.25)', borderRadius:12, padding:'10px 16px', marginBottom:16, fontSize:20, fontWeight:500, color:'#F2A7C3', textAlign:'center' }}>
                          "{sessaoAtiva.palavra_encontro}"
                        </div>
                      )}

                      {/* Fotos */}
                      {sessaoAtiva.foto_url && (() => {
                        let urls = []
                        try { urls = JSON.parse(sessaoAtiva.foto_url) } catch { urls = [sessaoAtiva.foto_url] }
                        if (!Array.isArray(urls)) urls = [urls]
                        return urls.length > 0 ? (
                          <div style={{ display:'grid', gridTemplateColumns: urls.length > 1 ? '1fr 1fr' : '1fr', gap:8, marginBottom:16 }}>
                            {urls.map((url, i) => (
                              <img key={i} src={url} alt={`foto ${i+1}`}
                                style={{ width:'100%', maxHeight:220, objectFit:'cover', borderRadius:12 }}
                                onError={e => { e.target.style.display='none' }}
                              />
                            ))}
                          </div>
                        ) : null
                      })()}

                      {/* Estrelas */}
                      <div style={{ display:'flex', gap:16, flexWrap:'wrap', marginBottom:16, padding:'10px 14px', background:'rgba(255,255,255,0.03)', borderRadius:10 }}>
                        {[
                          { label:'Vínculo', val: sessaoAtiva.st_vinculo },
                          { label:'Envolvimento', val: sessaoAtiva.st_envolvimento },
                          { label:'Autoestima', val: sessaoAtiva.st_autoestima },
                          { label:'Evolução geral', val: sessaoAtiva.st_geral },
                        ].map(item => (
                          <div key={item.label}>
                            <div style={{ fontSize:11, color:'#666', marginBottom:2 }}>{item.label}</div>
                            <div style={{ fontSize:15, color:'#FFD966' }}>
                              {'★'.repeat(item.val || 0)}
                              <span style={{ color:'#333' }}>{'★'.repeat(5 - (item.val || 0))}</span>
                            </div>
                          </div>
                        ))}
                      </div>

                      {((sessaoAtiva.humor_inicio?.length) || (sessaoAtiva.humor_fim?.length)) && (
                        <DetalheSecao titulo="Humor">
                          <DetalheItem label="Início" val={Array.isArray(sessaoAtiva.humor_inicio) ? sessaoAtiva.humor_inicio.join(', ') : sessaoAtiva.humor_inicio} />
                          <DetalheItem label="Final" val={Array.isArray(sessaoAtiva.humor_fim) ? sessaoAtiva.humor_fim.join(', ') : sessaoAtiva.humor_fim} />
                        </DetalheSecao>
                      )}
                      <DetalheSecao titulo="Relato da mãe" cor="#A8E6CF">
                        <DetalheItem label="Antes do encontro" val={sessaoAtiva.mae_antes} />
                        <DetalheItem label="Depois do encontro" val={sessaoAtiva.mae_depois} />
                        <DetalheItem label="Avaliação" val={sessaoAtiva.mae_avaliacao} />
                        <DetalheItem label="Observações sobre a mãe" val={sessaoAtiva.mae_av_obs} />
                        <DetalheItem label="Orientação dada" val={sessaoAtiva.mae_orientacao} />
                      </DetalheSecao>
                      <DetalheSecao titulo="1. Chegada — rapport" cor="#F2A7C3">
                        <DetalheItem label="Como ela chegou" val={sessaoAtiva.chegada} />
                        {sessaoAtiva.conv_checks?.length > 0 && <DetalheItem label="Perguntas usadas" val={sessaoAtiva.conv_checks.join(' · ')} />}
                        <DetalheItem label="Como ela respondeu" val={sessaoAtiva.conversa} />
                      </DetalheSecao>
                      <DetalheSecao titulo="3. Atividade central" cor="#5DCAA5">
                        <DetalheItem label="Frase trabalhada" val={sessaoAtiva.frase} destaque />
                        {sessaoAtiva.com_func?.length > 0 && <DetalheItem label="Comunicação funcional" val={sessaoAtiva.com_func.map(c=>({iniciou_fala:'Iniciou fala espontânea',respondeu_perguntada:'Respondeu quando perguntada',usou_frase_trabalhada:'Usou a frase trabalhada'}[c]||c)).join(' · ')} />}
                        {sessaoAtiva.ativ_checks?.length > 0 && <DetalheItem label="Atividades realizadas" val={sessaoAtiva.ativ_checks.join(' · ')} />}
                        <DetalheItem label="Palavras novas" val={sessaoAtiva.palavras_novas} />
                        <DetalheItem label="O que ela expressou" val={sessaoAtiva.expressao} />
                        <DetalheItem label="Corpo e emoção" val={sessaoAtiva.corpo} />
                        <DetalheItem label="Material usado" val={sessaoAtiva.material} />
                        {sessaoAtiva.obs_checks?.length > 0 && <DetalheItem label="O que foi observado" val={sessaoAtiva.obs_checks.join(' · ')} />}
                      </DetalheSecao>
                      <DetalheSecao titulo="Prática em casa" cor="#90CBF9">
                        <DetalheItem label="Semana anterior" val={sessaoAtiva.casa_anterior} />
                        {sessaoAtiva.casa_checks?.length > 0 && <DetalheItem label="Combinações" val={sessaoAtiva.casa_checks.join(' · ')} />}
                        <DetalheItem label="Observações" val={sessaoAtiva.casa_obs} />
                      </DetalheSecao>
                      <DetalheSecao titulo="4. Encerramento" cor="#C4B0F5">
                        <DetalheItem label='"O que você fez aqui comigo hoje?"' val={sessaoAtiva.oq_fez} />
                        <DetalheItem label="Validação oferecida" val={sessaoAtiva.validacao} />
                        <DetalheItem label="Resposta ao reconhecimento" val={sessaoAtiva.resposta_rec} />
                      </DetalheSecao>
                      {(sessaoAtiva.para_mae || sessaoAtiva.para_mae_ativ) && (
                        <DetalheSecao titulo="Para a mãe" cor="#FFB347">
                          <DetalheItem label="Mensagem" val={sessaoAtiva.para_mae} />
                          <DetalheItem label="Atividade juntas" val={sessaoAtiva.para_mae_ativ} />
                        </DetalheSecao>
                      )}
                      <DetalheSecao titulo="Reflexão final" cor="#90CBF9">
                        <DetalheItem label="O que você aprendeu com ela hoje" val={sessaoAtiva.aprendeu} />
                        <DetalheItem label="Observações livres" val={sessaoAtiva.obs} />
                        <DetalheItem label="Foco do próximo encontro" val={sessaoAtiva.prox} />
                      </DetalheSecao>
                      {(sessaoAtiva.conf_hipoteses || sessaoAtiva.conf_indicadores || sessaoAtiva.conf_alertas || sessaoAtiva.conf_encam) && (
                        <DetalheSecao titulo="Anotações clínicas" cor="#9B59B6">
                          <DetalheItem label="Hipóteses clínicas" val={sessaoAtiva.conf_hipoteses} />
                          <DetalheItem label="Indicadores" val={sessaoAtiva.conf_indicadores} />
                          <DetalheItem label="Alertas" val={sessaoAtiva.conf_alertas} />
                          <DetalheItem label="Encaminhamentos" val={sessaoAtiva.conf_encam} />
                        </DetalheSecao>
                      )}

                      {/* Ações visualização */}
                      <div style={{ display:'flex', gap:10, marginTop:20, flexWrap:'wrap' }}>
                        <button style={{ ...s.btnLimpar, flex:1 }} onClick={() => setSessaoAtiva(null)}>Fechar</button>
                        {podeEditar(sessaoAtiva) && (
                          <button style={{ padding:'10px 20px', fontSize:15, fontWeight:500, background:'rgba(248,113,113,0.1)', color:'#f87171', border:'1px solid rgba(248,113,113,0.25)', borderRadius:24, cursor:'pointer' }}
                            onClick={() => excluirSessao(sessaoAtiva.id)}>
                            Excluir registro
                          </button>
                        )}
                      </div>
                    </>
                  )}

                  {/* ── MODO EDIÇÃO ── */}
                  {modoEdicao && formEdicao && (
                    <div>
                      <div style={{ fontSize:13, color:'#5DCAA5', background:'rgba(93,202,165,0.08)', border:'1px solid rgba(93,202,165,0.2)', borderRadius:10, padding:'8px 14px', marginBottom:16 }}>
                        Modo edição — altere os campos e salve ao finalizar.
                      </div>

                      <SecaoEdit titulo="Identificação" cor="#F2A7C3">
                        <Lbl>Data do encontro</Lbl>
                        <input type="date" value={formEdicao.data_sessao} onChange={e=>setFormEdicao(f=>({...f,data_sessao:e.target.value}))} />
                        <Lbl>Semana do programa</Lbl>
                        <select value={formEdicao.semana} onChange={e=>setFormEdicao(f=>({...f,semana:e.target.value}))}>
                          <option value="">Selecione...</option>
                          {Object.entries(SK).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
                        </select>
                        <Lbl>Palavra do encontro</Lbl>
                        <input style={{ fontSize:20, fontWeight:500, textAlign:'center', background:'rgba(242,167,195,0.08)', borderColor:'#F2A7C3', color:'#F2A7C3' }} value={formEdicao.palavra_encontro} onChange={e=>setFormEdicao(f=>({...f,palavra_encontro:e.target.value}))} />
                      </SecaoEdit>

                      <SecaoEdit titulo="Relato da mãe" cor="#A8E6CF">
                        <Lbl>Antes do encontro</Lbl>
                        <textarea value={formEdicao.mae_antes} onChange={e=>setFormEdicao(f=>({...f,mae_antes:e.target.value}))} />
                        <Lbl>Depois do encontro</Lbl>
                        <textarea value={formEdicao.mae_depois} onChange={e=>setFormEdicao(f=>({...f,mae_depois:e.target.value}))} />
                        <Lbl>Observações sobre a mãe</Lbl>
                        <textarea value={formEdicao.mae_av_obs} onChange={e=>setFormEdicao(f=>({...f,mae_av_obs:e.target.value}))} />
                        <Lbl>Orientação dada</Lbl>
                        <textarea value={formEdicao.mae_orientacao} onChange={e=>setFormEdicao(f=>({...f,mae_orientacao:e.target.value}))} />
                      </SecaoEdit>

                      <SecaoEdit titulo="1. Chegada — rapport" cor="#F2A7C3">
                        <Lbl>Humor no início</Lbl>
                        <HumorRow opcoes={['Muito animada','Tranquila','Quieta / fechada','Agitada','Resistente','Sonolenta']} valores={formEdicao.humor_inicio} onChange={v=>setFormEdicao(f=>({...f,humor_inicio:v}))} />
                        <Lbl>Como ela chegou</Lbl>
                        <textarea value={formEdicao.chegada} onChange={e=>setFormEdicao(f=>({...f,chegada:e.target.value}))} />
                        <Lbl>Como ela respondeu à conversa</Lbl>
                        <textarea value={formEdicao.conversa} onChange={e=>setFormEdicao(f=>({...f,conversa:e.target.value}))} />
                        <Lbl>Vínculo percebido</Lbl>
                        <Estrelas valor={formEdicao.st_vinculo} onChange={v=>setFormEdicao(f=>({...f,st_vinculo:v}))} />
                      </SecaoEdit>

                      <SecaoEdit titulo="3. Atividade central" cor="#5DCAA5">
                        <Lbl>Frase trabalhada</Lbl>
                        <input value={formEdicao.frase} onChange={e=>setFormEdicao(f=>({...f,frase:e.target.value}))} />
                        <Lbl>Comunicação funcional</Lbl>
                        <div style={s.cfGrid}>
                          {[{val:'iniciou_fala',label:'Iniciou fala espontânea'},{val:'respondeu_perguntada',label:'Respondeu quando perguntada'},{val:'usou_frase_trabalhada',label:'Usou a frase trabalhada'}].map(cf=>(
                            <div key={cf.val} style={{...s.cfItem,...(formEdicao.com_func.includes(cf.val)?s.cfItemOn:{})}}
                              onClick={()=>setFormEdicao(f=>({...f,com_func:f.com_func.includes(cf.val)?f.com_func.filter(x=>x!==cf.val):[...f.com_func,cf.val]}))}>
                              <div style={s.cfLabel}>{cf.label}</div>
                            </div>
                          ))}
                        </div>
                        <Lbl>Palavras novas espontâneas</Lbl>
                        <input value={formEdicao.palavras_novas} onChange={e=>setFormEdicao(f=>({...f,palavras_novas:e.target.value}))} />
                        <Lbl>O que ela expressou</Lbl>
                        <textarea value={formEdicao.expressao} onChange={e=>setFormEdicao(f=>({...f,expressao:e.target.value}))} />
                        <Lbl>Corpo e emoção</Lbl>
                        <textarea value={formEdicao.corpo} onChange={e=>setFormEdicao(f=>({...f,corpo:e.target.value}))} />
                        <Lbl>Material usado</Lbl>
                        <input value={formEdicao.material} onChange={e=>setFormEdicao(f=>({...f,material:e.target.value}))} />
                        <Lbl>Qualidade do envolvimento</Lbl>
                        <Estrelas valor={formEdicao.st_envolvimento} onChange={v=>setFormEdicao(f=>({...f,st_envolvimento:v}))} />
                      </SecaoEdit>

                      <SecaoEdit titulo="Prática em casa" cor="#90CBF9">
                        <Lbl>O que ela trouxe da semana anterior</Lbl>
                        <textarea value={formEdicao.casa_anterior} onChange={e=>setFormEdicao(f=>({...f,casa_anterior:e.target.value}))} />
                        <Lbl>Observações</Lbl>
                        <textarea value={formEdicao.casa_obs} onChange={e=>setFormEdicao(f=>({...f,casa_obs:e.target.value}))} />
                      </SecaoEdit>

                      <SecaoEdit titulo="4. Encerramento" cor="#C4B0F5">
                        <Lbl>Humor ao final</Lbl>
                        <HumorRow opcoes={['Muito animada','Tranquila','Satisfeita','Cansada','Emotiva','Dispersa']} valores={formEdicao.humor_fim} onChange={v=>setFormEdicao(f=>({...f,humor_fim:v}))} />
                        <Lbl>"O que você fez aqui comigo hoje?"</Lbl>
                        <textarea value={formEdicao.oq_fez} onChange={e=>setFormEdicao(f=>({...f,oq_fez:e.target.value}))} />
                        <Lbl>Validação que você ofereceu</Lbl>
                        <textarea value={formEdicao.validacao} onChange={e=>setFormEdicao(f=>({...f,validacao:e.target.value}))} />
                        <Lbl>Resposta dela ao reconhecimento</Lbl>
                        <textarea value={formEdicao.resposta_rec} onChange={e=>setFormEdicao(f=>({...f,resposta_rec:e.target.value}))} />
                        <Lbl>Autoestima percebida</Lbl>
                        <Estrelas valor={formEdicao.st_autoestima} onChange={v=>setFormEdicao(f=>({...f,st_autoestima:v}))} />
                      </SecaoEdit>

                      <SecaoEdit titulo="Para a mãe" cor="#FFB347">
                        <Lbl>Mensagem desta semana</Lbl>
                        <textarea value={formEdicao.para_mae} onChange={e=>setFormEdicao(f=>({...f,para_mae:e.target.value}))} />
                        <Lbl>Atividade para fazer juntas</Lbl>
                        <textarea value={formEdicao.para_mae_ativ} onChange={e=>setFormEdicao(f=>({...f,para_mae_ativ:e.target.value}))} />
                      </SecaoEdit>

                      <SecaoEdit titulo="Reflexão final" cor="#90CBF9">
                        <Lbl>O que você aprendeu com ela hoje</Lbl>
                        <textarea value={formEdicao.aprendeu} onChange={e=>setFormEdicao(f=>({...f,aprendeu:e.target.value}))} />
                        <Lbl>Observações livres</Lbl>
                        <textarea value={formEdicao.obs} onChange={e=>setFormEdicao(f=>({...f,obs:e.target.value}))} />
                        <Lbl>Foco para o próximo encontro</Lbl>
                        <textarea value={formEdicao.prox} onChange={e=>setFormEdicao(f=>({...f,prox:e.target.value}))} />
                        <Lbl>Evolução geral</Lbl>
                        <Estrelas valor={formEdicao.st_geral} onChange={v=>setFormEdicao(f=>({...f,st_geral:v}))} />
                      </SecaoEdit>

                      <SecaoEdit titulo="Anotações clínicas" cor="#9B59B6">
                        <Lbl>Hipóteses clínicas</Lbl>
                        <textarea value={formEdicao.conf_hipoteses} onChange={e=>setFormEdicao(f=>({...f,conf_hipoteses:e.target.value}))} />
                        <Lbl>Indicadores de desenvolvimento</Lbl>
                        <textarea value={formEdicao.conf_indicadores} onChange={e=>setFormEdicao(f=>({...f,conf_indicadores:e.target.value}))} />
                        <Lbl>Alertas</Lbl>
                        <textarea value={formEdicao.conf_alertas} onChange={e=>setFormEdicao(f=>({...f,conf_alertas:e.target.value}))} />
                        <Lbl>Encaminhamentos</Lbl>
                        <textarea value={formEdicao.conf_encam} onChange={e=>setFormEdicao(f=>({...f,conf_encam:e.target.value}))} />
                      </SecaoEdit>

                      {erroEdicao && (
                        <p style={{ fontSize:14, color:'#f87171', background:'rgba(248,113,113,0.1)', borderRadius:10, padding:'8px 14px', marginBottom:12 }}>
                          {erroEdicao}
                        </p>
                      )}

                      {/* Ações edição */}
                      <div style={{ display:'flex', gap:10, marginTop:20, flexWrap:'wrap' }}>
                        <button
                          style={{ ...s.btnSalvar, flex:1, opacity: salvandoEdicao ? 0.7 : 1 }}
                          onClick={salvarEdicao}
                          disabled={salvandoEdicao}
                        >
                          {salvandoEdicao ? 'Salvando...' : 'Salvar alterações'}
                        </button>
                        <button style={s.btnLimpar} onClick={() => setModoEdicao(false)}>
                          Cancelar
                        </button>
                      </div>
                    </div>
                  )}

                </div>
              </div>
            )}
          </div>
        )}

        {/* ══════ PAINEL ══════ */}
        {aba === 'painel' && (
          <div>
            <div style={s.statRow}>
              <Stat n={sessoes.length} label="encontros" cor="#F2A7C3" />
              <Stat n={pacientes.length} label="pacientes" cor="#5DCAA5" />
              <Stat n={sessoes.length ? (sessoes.reduce((a,r)=>a+(r.st_geral||0),0)/sessoes.length).toFixed(1) : '—'} label="média geral" cor="#C4B0F5" />
            </div>
            {pacientes.map(pac => {
              const ss = sessoes.filter(s => s.paciente_id === pac.id)
              if (!ss.length) return null
              const med = (ss.reduce((a,s)=>a+(s.st_geral||0),0)/ss.length).toFixed(1)
              const prog = Math.round((parseFloat(med)/5)*100)
              const feitas = [...new Set(ss.map(s=>s.semana).filter(Boolean))]
              return (
                <div key={pac.id} style={s.pacCard}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:8 }}>
                    <span style={{ fontSize:18, fontWeight:500, color:'#f0f0f0' }}>{pac.nome}</span>
                    <span style={s.pill}>{ss.length} encontro{ss.length>1?'s':''}</span>
                  </div>
                  <div style={{ fontSize:13, color:'#666', marginTop:6 }}>Evolução média: {med}/5</div>
                  <div style={s.progBg}><div style={{...s.progBar, width:prog+'%'}} /></div>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(6,1fr)', gap:5, marginTop:12 }}>
                    {Object.keys(SK).map(k => (
                      <div key={k} style={{ padding:'5px 3px', fontSize:12, textAlign:'center', borderRadius:8, background: feitas.includes(k)?'rgba(93,202,165,0.2)':'rgba(255,255,255,0.04)', color: feitas.includes(k)?'#5DCAA5':'#555', border: feitas.includes(k)?'1px solid rgba(93,202,165,0.3)':'1px solid rgba(255,255,255,0.06)' }}>{k}</div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}

      </main>
    </div>
  )
}

// ─── COMPONENTES INTERNOS ───
function SecaoEdit({ titulo, cor = '#F2A7C3', children }) {
  return (
    <div style={{ marginBottom:20 }}>
      <div style={{ fontSize:11, fontWeight:500, color: cor, letterSpacing:'0.07em', textTransform:'uppercase', marginBottom:10, paddingBottom:4, borderBottom:`1px solid ${cor}30` }}>
        {titulo}
      </div>
      {children}
    </div>
  )
}

function DetalheSecao({ titulo, cor = '#F2A7C3', children }) {
  const hasContent = Array.isArray(children)
    ? children.some(c => c && c.props?.val)
    : children?.props?.val
  if (!hasContent) return null
  return (
    <div style={{ marginBottom:16 }}>
      <div style={{ fontSize:11, fontWeight:500, color: cor, letterSpacing:'0.07em', textTransform:'uppercase', marginBottom:8, paddingBottom:4, borderBottom:`1px solid ${cor}30` }}>
        {titulo}
      </div>
      {children}
    </div>
  )
}

function DetalheItem({ label, val, destaque }) {
  if (!val || (Array.isArray(val) && !val.length)) return null
  return (
    <div style={{ marginBottom:10 }}>
      <div style={{ fontSize:12, color:'#555', marginBottom:3 }}>{label}</div>
      <div style={{
        fontSize: destaque ? 16 : 15,
        color: destaque ? '#FFD966' : '#ccc',
        fontStyle: destaque ? 'italic' : 'normal',
        fontWeight: destaque ? 500 : 400,
        lineHeight: 1.5,
        background: destaque ? 'rgba(255,217,102,0.08)' : 'transparent',
        borderRadius: destaque ? 8 : 0,
        padding: destaque ? '6px 10px' : 0,
      }}>
        {val}
      </div>
    </div>
  )
}

function Card({ cor, titulo, pill, children }) {
  return (
    <div style={{ background:'#111', border:'1px solid rgba(255,255,255,0.07)', borderRadius:16, padding:'1.2rem', marginBottom:'1rem', borderLeft:`4px solid ${cor}`, borderTopLeftRadius:0, borderBottomLeftRadius:0 }}>
      <div style={{ fontSize:18, fontWeight:500, color:'#f0f0f0', marginBottom:'0.8rem', display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
        {titulo}
        <span style={{ fontSize:12, fontWeight:500, padding:'3px 10px', borderRadius:20, background:`${cor}22`, color:cor }}>{pill}</span>
      </div>
      {children}
    </div>
  )
}
function Lbl({ children }) {
  return <label style={{ display:'block', fontSize:15, color:'#888', marginTop:12, marginBottom:5 }}>{children}</label>
}
function InfoBox({ children }) {
  return <div style={{ background:'rgba(255,255,255,0.04)', borderRadius:10, padding:'0.7rem 0.9rem', fontSize:14, color:'#888', lineHeight:1.7, borderLeft:'3px solid #F2A7C3', marginTop:8 }}>{children}</div>
}
function Estrelas({ valor, onChange }) {
  return (
    <div style={{ display:'flex', gap:6, marginTop:8 }}>
      {[1,2,3,4,5].map(i => (
        <span key={i} style={{ fontSize:26, cursor:'pointer', color: i<=valor ? '#FFD966':'#333', lineHeight:1 }} onClick={()=>onChange(i)}>★</span>
      ))}
    </div>
  )
}
function HumorRow({ opcoes, valores = [], onChange }) {
  function toggle(o) {
    const atual = Array.isArray(valores) ? valores : (valores ? [valores] : [])
    onChange(atual.includes(o) ? atual.filter(v => v !== o) : [...atual, o])
  }
  const atual = Array.isArray(valores) ? valores : (valores ? [valores] : [])
  return (
    <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginTop:8 }}>
      {opcoes.map(o => (
        <button key={o} style={{
          padding:'7px 13px', fontSize:15,
          border:`1.5px solid ${atual.includes(o) ? '#F2A7C3' : 'rgba(255,255,255,0.1)'}`,
          borderRadius:20,
          background: atual.includes(o) ? 'rgba(242,167,195,0.15)' : 'transparent',
          color: atual.includes(o) ? '#F2A7C3' : '#888',
          cursor:'pointer'
        }} onClick={() => toggle(o)}>{o}</button>
      ))}
    </div>
  )
}
function CheckGroup({ opcoes, valores, onChange }) {
  function toggle(o) {
    onChange(valores.includes(o) ? valores.filter(v=>v!==o) : [...valores, o])
  }
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:7, marginTop:8 }}>
      {opcoes.map(o => (
        <label key={o} style={{ display:'flex', alignItems:'flex-start', gap:10, fontSize:15, color:'#ccc', cursor:'pointer', padding:'8px 12px', border:'1px solid rgba(255,255,255,0.07)', borderRadius:10, background: valores.includes(o)?'rgba(242,167,195,0.07)':'transparent' }}>
          <input type="checkbox" checked={valores.includes(o)} onChange={()=>toggle(o)} style={{ width:17, height:17, marginTop:2, accentColor:'#F2A7C3', flexShrink:0 }} />
          <span>{o}</span>
        </label>
      ))}
    </div>
  )
}
function Stat({ n, label, cor }) {
  return (
    <div style={{ background:`${cor}12`, border:`1px solid ${cor}30`, borderRadius:14, padding:'14px', textAlign:'center' }}>
      <div style={{ fontSize:28, fontWeight:500, color:'#f0f0f0' }}>{n}</div>
      <div style={{ fontSize:13, color:'#666', marginTop:3 }}>{label}</div>
    </div>
  )
}
function fmtD(d) {
  if (!d) return ''
  const [y,m,day] = d.split('-')
  return `${day}/${m}/${y}`
}

// ─── ESTILOS ───
const s = {
  page: { minHeight:'100vh', background:'#0a0a0a' },
  header: { display:'flex', justifyContent:'space-between', alignItems:'center', padding:'0.9rem 1.5rem', borderBottom:'1px solid rgba(255,255,255,0.06)', position:'sticky', top:0, background:'rgba(10,10,10,0.95)', backdropFilter:'blur(10px)', zIndex:100 },
  headerLeft: { display:'flex', alignItems:'center', gap:10 },
  dots: { display:'flex', gap:5 },
  dot: { width:10, height:10, borderRadius:'50%', display:'inline-block' },
  headerTitle: { fontSize:17, fontWeight:600, color:'#f0f0f0' },
  headerRight: { display:'flex', alignItems:'center', gap:12 },
  headerUser: { fontSize:13, color:'#888', display:'flex', alignItems:'center', gap:6 },
  adminBadge: { fontSize:11, background:'rgba(196,176,245,0.15)', color:'#C4B0F5', border:'1px solid rgba(196,176,245,0.3)', borderRadius:20, padding:'1px 8px' },
  btnLogout: { padding:'6px 14px', fontSize:13, background:'transparent', border:'1px solid rgba(255,255,255,0.1)', borderRadius:20, color:'#888' },
  nav: { display:'flex', gap:8, padding:'1rem 1.5rem 0', flexWrap:'wrap' },
  navBtn: { padding:'8px 16px', fontSize:16, fontWeight:500, border:'1.5px solid rgba(255,255,255,0.1)', borderRadius:24, background:'transparent', color:'#888' },
  navBtnOn: { background:'#F2A7C3', color:'#3d1a27', borderColor:'#F2A7C3' },
  main: { maxWidth:860, margin:'0 auto', padding:'1rem 1rem 4rem' },
  g2: { display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 },
  guiaBox: { marginTop:8, padding:'8px 12px', background:'rgba(255,255,255,0.04)', borderRadius:10, fontSize:13, color:'#888', borderLeft:'3px solid #F2A7C3', lineHeight:1.6 },
  fotoArea: { border:'2px dashed rgba(255,255,255,0.1)', borderRadius:14, padding:'1.2rem', textAlign:'center', cursor:'pointer', marginTop:8 },
  fraseDest: { background:'rgba(255,217,102,0.1)', border:'1px solid rgba(255,217,102,0.3)', borderRadius:12, padding:'0.8rem 1rem', fontSize:17, fontWeight:500, color:'#FFD966', fontStyle:'italic', marginBottom:10 },
  cfGrid: { display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10, marginTop:10 },
  cfItem: { border:'1.5px solid rgba(255,255,255,0.08)', borderRadius:14, padding:'12px 10px', textAlign:'center', cursor:'pointer', transition:'all .15s' },
  cfItemOn: { borderColor:'#5DCAA5', background:'rgba(93,202,165,0.12)' },
  cfLabel: { fontSize:14, color:'#888', lineHeight:1.3 },
  acoesBar: { background:'#111', border:'1px solid rgba(242,167,195,0.2)', borderRadius:16, padding:'1.2rem', marginBottom:'1rem', display:'flex', gap:10, flexWrap:'wrap', alignItems:'center' },
  btnSalvar: { padding:'10px 22px', fontSize:16, fontWeight:500, background:'#5DCAA5', color:'#0a2a1e', border:'none', borderRadius:24 },
  btnLimpar: { padding:'10px 22px', fontSize:16, fontWeight:500, background:'rgba(255,255,255,0.06)', color:'#888', border:'1px solid rgba(255,255,255,0.1)', borderRadius:24 },
  btnMini: { marginTop:6, padding:'5px 12px', fontSize:13, background:'transparent', border:'1px solid rgba(255,255,255,0.1)', borderRadius:20, color:'#888' },
  btnTeal: { padding:'8px 14px', fontSize:14, background:'rgba(93,202,165,0.15)', color:'#5DCAA5', border:'1px solid rgba(93,202,165,0.3)', borderRadius:10 },
  regItem: { background:'#111', border:'1px solid rgba(255,255,255,0.07)', borderRadius:16, padding:'1rem 1.25rem', marginBottom:10, borderLeft:'4px solid #F2A7C3', borderTopLeftRadius:0, borderBottomLeftRadius:0 },
  regTop: { display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:6 },
  regNome: { fontSize:17, fontWeight:500, color:'#f0f0f0' },
  empty: { textAlign:'center', padding:'3rem 1rem', fontSize:16, color:'#555' },
  statRow: { display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginBottom:'1.2rem' },
  pacCard: { background:'#111', border:'1px solid rgba(255,255,255,0.07)', borderRadius:16, padding:'1.2rem', marginBottom:'1rem', borderLeft:'4px solid #F2A7C3', borderTopLeftRadius:0, borderBottomLeftRadius:0 },
  pill: { fontSize:12, fontWeight:500, padding:'3px 10px', borderRadius:20, background:'rgba(242,167,195,0.12)', color:'#F2A7C3' },
  progBg: { background:'rgba(255,255,255,0.06)', borderRadius:8, height:8, overflow:'hidden', marginTop:6 },
  progBar: { height:8, borderRadius:8, background:'#5DCAA5' },
  modalBg: {
    position:'fixed', inset:0, background:'rgba(0,0,0,0.75)',
    display:'flex', alignItems:'flex-start', justifyContent:'center',
    zIndex:200, padding:'1rem', overflowY:'auto',
  },
  modalBox: {
    background:'#111', border:'1px solid rgba(255,255,255,0.1)',
    borderRadius:20, padding:'1.5rem', width:'100%', maxWidth:660,
    marginTop:'2rem', marginBottom:'2rem',
  },
  modalHeader: {
    display:'flex', justifyContent:'space-between', alignItems:'flex-start',
    gap:12, marginBottom:20, paddingBottom:16,
    borderBottom:'1px solid rgba(255,255,255,0.07)',
  },
  modalClose: {
    background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)',
    borderRadius:'50%', width:32, height:32, fontSize:16, color:'#888',
    display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
  },
}
