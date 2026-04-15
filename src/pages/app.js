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
  const [fotoFile, setFotoFile] = useState(null)
  const [fotoPreview, setFotoPreview] = useState(null)
  const [novaPacNome, setNovaPacNome] = useState('')
  const [novaPacMae, setNovaPacMae] = useState('')
  const [showNovaPac, setShowNovaPac] = useState(false)

  function getFormVazio() {
    return {
      paciente_id: '', data_sessao: new Date().toISOString().split('T')[0],
      semana: '', palavra_encontro: '',
      mae_antes: '', mae_depois: '', mae_avaliacao: '', mae_av_obs: '', mae_orientacao: '',
      humor_inicio: '', chegada: '', st_vinculo: 0,
      conv_checks: [], conversa: '',
      frase: '', com_func: [], ativ_checks: [],
      palavras_novas: '', expressao: '', corpo: '', material: '', obs_checks: [],
      st_envolvimento: 0,
      casa_anterior: '', casa_checks: [], casa_obs: '',
      humor_fim: '', oq_fez: '', validacao: '', resposta_rec: '', st_autoestima: 0,
      para_mae: '', para_mae_ativ: '',
      aprendeu: '', obs: '', prox: '', st_geral: 0,
      conf_hipoteses: '', conf_indicadores: '', conf_alertas: '', conf_encam: '',
    }
  }

  useEffect(() => {
    if (user) { fetchPacientes(); fetchSessoes() }
  }, [user])

  async function fetchPacientes() {
    const { data } = await supabase.from('pacientes').select('*').eq('ativo', true).order('nome')
    setPacientes(data || [])
  }

  async function fetchSessoes() {
    const { data } = await supabase
      .from('sessoes')
      .select('*, pacientes(nome)')
      .order('data_sessao', { ascending: false })
      .limit(100)
    setSessoes(data || [])
  }

  async function criarPaciente() {
    if (!novaPacNome.trim()) return
    const { data, error } = await supabase.from('pacientes').insert({
      terapeuta_id: user.id,
      nome: novaPacNome.trim(),
      nome_mae: novaPacMae.trim() || null,
    }).select().single()
    if (!error) {
      setPacientes(prev => [...prev, data].sort((a,b) => a.nome.localeCompare(b.nome)))
      setForm(f => ({ ...f, paciente_id: data.id }))
      setNovaPacNome(''); setNovaPacMae(''); setShowNovaPac(false)
    }
  }

  function handleFoto(e) {
    const file = e.target.files[0]
    if (!file) return
    setFotoFile(file)
    const reader = new FileReader()
    reader.onload = ev => setFotoPreview(ev.target.result)
    reader.readAsDataURL(file)
  }

  async function salvar() {
    if (!form.paciente_id || !form.data_sessao) {
      setMensagem('Selecione a paciente e a data.'); return
    }
    setSalvando(true)
    setMensagem('')
    try {
      const sessaoId = crypto.randomUUID()
      let fotoUrl = null
      if (fotoFile) {
        const ext = fotoFile.name.split('.').pop()
        const path = `${user.id}/${sessaoId}.${ext}`
        const { error: upErr } = await supabase.storage
          .from('fotos-sessoes').upload(path, fotoFile, { upsert: true })
        if (!upErr) {
          const { data: urlData } = supabase.storage
            .from('fotos-sessoes').getPublicUrl(path)
          fotoUrl = urlData.publicUrl
        }
      }
      const { error } = await supabase.from('sessoes').insert({
        id: sessaoId,
        terapeuta_id: user.id,
        ...form,
        foto_url: fotoUrl,
      })
      if (error) throw error
      setMensagem('Encontro salvo!')
      setForm(getFormVazio()); setFotoFile(null); setFotoPreview(null)
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
                  <select value={form.paciente_id} onChange={e => setForm(f=>({...f, paciente_id:e.target.value}))}>
                    <option value="">Selecione...</option>
                    {pacientes.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
                  </select>
                  <button style={s.btnMini} onClick={() => setShowNovaPac(v=>!v)}>
                    {showNovaPac ? '- Cancelar' : '+ Nova paciente'}
                  </button>
                  {showNovaPac && (
                    <div style={{ marginTop:8, display:'flex', flexDirection:'column', gap:6 }}>
                      <input placeholder="Nome da paciente" value={novaPacNome} onChange={e=>setNovaPacNome(e.target.value)} />
                      <input placeholder="Nome da mãe (opcional)" value={novaPacMae} onChange={e=>setNovaPacMae(e.target.value)} />
                      <button style={s.btnTeal} onClick={criarPaciente}>Criar e selecionar</button>
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
              <Lbl>Foto do encontro</Lbl>
              <div style={s.fotoArea} onClick={() => document.getElementById('foto-input').click()}>
                <input id="foto-input" type="file" accept="image/*" style={{display:'none'}} onChange={handleFoto} />
                {fotoPreview
                  ? <img src={fotoPreview} alt="foto" style={{ width:'100%', maxHeight:200, objectFit:'contain', borderRadius:10 }} />
                  : <p style={{ color:'#555', fontSize:15 }}>Toque para anexar a foto do dia</p>
                }
              </div>
              {fotoPreview && <button style={s.btnMini} onClick={()=>{setFotoFile(null);setFotoPreview(null)}}>Remover foto</button>}
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
                valor={form.humor_inicio} onChange={v=>setForm(f=>({...f,humor_inicio:v}))} />
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
                valor={form.humor_fim} onChange={v=>setForm(f=>({...f,humor_fim:v}))} />
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
              <button style={s.btnLimpar} onClick={()=>{setForm(getFormVazio());setFotoFile(null);setFotoPreview(null)}}>
                Limpar
              </button>
              {mensagem && <p style={{ width:'100%', fontSize:14, color: mensagem.startsWith('Erro') ? '#f87171' : '#5DCAA5' }}>{mensagem}</p>}
            </div>
          </div>
        )}

        {/* ══════ HISTÓRICO ══════ */}
        {aba === 'historico' && (
          <div>
            {sessoes.length === 0
              ? <div style={s.empty}>Nenhuma sessão registrada ainda.</div>
              : sessoes.map(sess => {
                  const sk = SK[sess.semana]
                  return (
                    <div key={sess.id} style={s.regItem}>
                      <div style={s.regTop}>
                        <span style={s.regNome}>{sess.pacientes?.nome || '—'}</span>
                        <span style={{ fontSize:13, color:'#666' }}>{fmtD(sess.data_sessao)}</span>
                      </div>
                      <div style={{ fontSize:13, color:'#666', marginTop:3 }}>{sk?.label || sess.semana || 'Sem semana'}{sess.st_geral ? ' · '+'★'.repeat(sess.st_geral) : ''}</div>
                      {sess.palavra_encontro && <div style={{ fontSize:16, fontWeight:500, color:'#F2A7C3', marginTop:4 }}>"{sess.palavra_encontro}"</div>}
                      {sess.frase && <div style={{ fontSize:13, color:'#666', fontStyle:'italic' }}>"{sess.frase}"</div>}
                    </div>
                  )
                })
            }
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
function HumorRow({ opcoes, valor, onChange }) {
  return (
    <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginTop:8 }}>
      {opcoes.map(o => (
        <button key={o} style={{ padding:'7px 13px', fontSize:15, border:`1.5px solid ${valor===o?'#F2A7C3':'rgba(255,255,255,0.1)'}`, borderRadius:20, background: valor===o?'rgba(242,167,195,0.15)':'transparent', color: valor===o?'#F2A7C3':'#888', cursor:'pointer' }}
          onClick={()=>onChange(valor===o?'':o)}>{o}</button>
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
}
