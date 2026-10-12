import { useEffect, useState } from 'react'
import {
  ArrowDown,
  ArrowRight,
  Bell,
  CalendarDays,
  CalendarCheck,
  Camera,
  Check,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  Copy,
  ExternalLink,
  Gift,
  Heart,
  House,
  Image,
  ListChecks,
  LockKeyhole,
  Link,
  MapPin,
  Menu,
  Monitor,
  MessageCircle,
  Paintbrush,
  Printer,
  QrCode,
  Search,
  Shield,
  Settings2,
  Sparkles,
  Smartphone,
  Tablet,
  Trash2,
  Users,
  UserRound,
  Wallet,
  X,
} from 'lucide-react'

const THEMES = [
  { id: 'garden', name: 'Jardim', note: 'Natural e acolhedor', colors: ['#405447', '#e4b98c', '#f4f0e8'] },
  { id: 'editorial', name: 'Editorial', note: 'Clássico e sofisticado', colors: ['#4e5b51', '#c98f78', '#f7f4ef'] },
  { id: 'minimal', name: 'Essencial', note: 'Leve e contemporâneo', colors: ['#586575', '#d7a7a0', '#f5f4f1'] },
  { id: 'floral', name: 'Floral', note: 'Romântico e delicado', colors: ['#765965', '#c88d9c', '#f8f3f3'] },
  { id: 'rustic', name: 'Rústico', note: 'Terroso e intimista', colors: ['#754f3e', '#bd8b56', '#f6f0e7'] },
  { id: 'beach', name: 'Praia', note: 'Claro e sereno', colors: ['#3d6970', '#c68e68', '#f4f7f4'] },
  { id: 'tropical', name: 'Tropical', note: 'Vivo e natural', colors: ['#637455', '#d38a68', '#f5f3e9'] },
  { id: 'night', name: 'Noturno', note: 'Profundo e elegante', colors: ['#38424c', '#d1a96a', '#f3f1ec'] },
]

const NAV_ITEMS = [
  { id: 'overview', label: 'Visão geral', icon: House },
  { id: 'site', label: 'Seu site', icon: Image },
  { id: 'guests', label: 'Convidados', icon: Users },
  { id: 'invites', label: 'Convites e acesso', icon: QrCode },
  { id: 'gifts', label: 'Lista de presentes', icon: Gift },
  { id: 'customize', label: 'Personalização', icon: Paintbrush },
  { id: 'game', label: 'Quiz dos noivos', icon: Sparkles },
]

const GUEST_ROWS = [
  { name: 'Ana Beatriz Costa', group: 'Família da noiva', status: 'Confirmado', people: '2 pessoas' },
  { name: 'Bruno e Camila Alves', group: 'Amigos', status: 'Confirmado', people: '2 pessoas' },
  { name: 'Carolina Mendes', group: 'Família do noivo', status: 'Aguardando', people: '1 pessoa' },
  { name: 'Daniel Ferreira', group: 'Trabalho', status: 'Aguardando', people: '1 pessoa' },
  { name: 'Eduarda e família', group: 'Família da noiva', status: 'Não poderá ir', people: '3 pessoas' },
]

const GIFT_ROWS = [
  { title: 'Jantar à luz de velas', amount: 'R$ 180', received: 'R$ 360', progress: 72 },
  { title: 'Passeio de barco', amount: 'R$ 250', received: 'R$ 500', progress: 50 },
  { title: 'Café da manhã na viagem', amount: 'R$ 90', received: 'R$ 270', progress: 90 },
]

function readCountdown() {
  const remaining = Math.max(0, new Date('2027-09-18T16:00:00-03:00').getTime() - Date.now())
  const totalSeconds = Math.floor(remaining / 1000)
  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  }
}

function App() {
  const [view, setView] = useState('guest')
  const [theme, setTheme] = useState('garden')
  const [adminPage, setAdminPage] = useState('overview')
  const [toast, setToast] = useState('')

  function notify(message) {
    setToast(message)
    window.setTimeout(() => setToast(''), 2400)
  }

  return (
    <main className={`app-shell theme-${theme}`}>
      <div className="prototype-bar">
        <div className="prototype-label"><span className="prototype-dot" /> ESTUDO VISUAL <span className="prototype-divider">/</span> Plataforma de casamento</div>
        <div className="prototype-switch" role="group" aria-label="Demonstrações do mockup">
          <button aria-pressed={view === 'guest'} className={view === 'guest' ? 'selected' : ''} onClick={() => setView('guest')}><Heart size={15} /> Site do casal</button>
          <button aria-pressed={view === 'dashboard'} className={view === 'dashboard' ? 'selected' : ''} onClick={() => setView('dashboard')}><Settings2 size={15} /> Painel dos noivos</button>
          <button aria-pressed={view === 'guest-portal'} className={view === 'guest-portal' ? 'selected' : ''} onClick={() => setView('guest-portal')}><UserRound size={15} /> Convidado</button>
          <button aria-pressed={view === 'godparent'} className={view === 'godparent' ? 'selected' : ''} onClick={() => setView('godparent')}><Heart size={15} /> Padrinhos</button>
          <button aria-pressed={view === 'event-staff'} className={view === 'event-staff' ? 'selected' : ''} onClick={() => setView('event-staff')}><ListChecks size={15} /> Equipe</button>
          <button aria-pressed={view === 'superadmin'} className={view === 'superadmin' ? 'selected' : ''} onClick={() => setView('superadmin')}><Shield size={15} /> Superadmin</button>
          <button aria-pressed={view === 'checkin'} className={view === 'checkin' ? 'selected' : ''} onClick={() => setView('checkin')}><QrCode size={15} /> Entrada</button>
        </div>
        <span className="prototype-badge">Demonstração</span>
      </div>

      {view === 'guest' && <GuestSite theme={theme} setTheme={setTheme} notify={notify} />}
      {view === 'dashboard' && <Dashboard theme={theme} setTheme={setTheme} page={adminPage} setPage={setAdminPage} notify={notify} />}
      {view === 'guest-portal' && <GuestPortal notify={notify} />}
      {view === 'godparent' && <GodparentPortal notify={notify} />}
      {view === 'event-staff' && <EventStaffPanel notify={notify} />}
      {view === 'superadmin' && <SuperAdminPanel notify={notify} />}
      {view === 'checkin' && <CheckIn notify={notify} />}
      {toast && <div className="toast" role="status"><Check size={16} /> {toast}</div>}
    </main>
  )
}

function ThemePicker({ theme, setTheme, compact = false }) {
  return (
    <div className={`theme-picker ${compact ? 'theme-picker-compact' : ''}`} aria-label="Escolha uma opção visual">
      {!compact && <div className="theme-picker-intro"><span className="eyebrow">OITO TEMAS DE PARTIDA</span><span className="theme-picker-caption">A estrutura é a mesma; cores, tipografia e detalhes mudam.</span></div>}
      <div className="theme-options">
        {THEMES.map((item, index) => (
          <button className={`theme-option ${theme === item.id ? 'active' : ''}`} key={item.id} onClick={() => setTheme(item.id)} aria-pressed={theme === item.id}>
            <span className="theme-swatches">{item.colors.map((color) => <i key={color} style={{ backgroundColor: color }} />)}</span>
            <span className="theme-option-copy"><strong>{item.name}</strong>{!compact && <small>{item.note}</small>}</span>
            {theme === item.id && <Check size={15} className="theme-option-check" />}
            {index === 0 && compact && <span className="theme-popular">Base</span>}
          </button>
        ))}
      </div>
    </div>
  )
}

function GuestSite({ theme, setTheme, notify }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [gift, setGift] = useState(null)
  const [rsvpDone, setRsvpDone] = useState(false)
  const [calendar, setCalendar] = useState('')
  const [guestName, setGuestName] = useState('')
  const [countdown, setCountdown] = useState(readCountdown)

  useEffect(() => {
    const timer = window.setInterval(() => setCountdown(readCountdown()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  function submitRsvp(event) {
    event.preventDefault()
    setRsvpDone(true)
    notify('Resposta de demonstração registrada nesta tela')
  }

  return (
    <div className="guest-page">
      <div className="demo-ribbon"><span>CONTEÚDO DEMONSTRATIVO</span><span>Casal, data e valores fictícios</span><button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>Topo <ArrowDown size={13} className="rotate-up" /></button></div>
      <header className="guest-nav">
        <a className="guest-brand" href="#inicio" aria-label="Elisa e Tomás, início"><span>e<span className="brand-amp">&</span>t</span><small>18 · 09 · 2027</small></a>
        <button className="mobile-menu-button" onClick={() => setMenuOpen(!menuOpen)} aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'}>{menuOpen ? <X /> : <Menu />}</button>
        <nav className={menuOpen ? 'nav-links open' : 'nav-links'}>
          <a href="#historia" onClick={() => setMenuOpen(false)}>Nossa história</a>
          <a href="#celebracao" onClick={() => setMenuOpen(false)}>A celebração</a>
          <a href="#presentes" onClick={() => setMenuOpen(false)}>Presentes</a>
          <a href="#presenca" onClick={() => setMenuOpen(false)}>Presença</a>
        </nav>
        <a className="nav-rsvp" href="#presenca">Confirmar presença <ArrowRight size={15} /></a>
      </header>

      <section className="guest-hero" id="inicio">
        <div className="hero-photo" />
        <div className="hero-shadow" />
        <div className="hero-content">
          <span className="hero-overline">COM ALEGRIA, CONVIDAMOS VOCÊ</span>
          <h1>Elisa <i>&</i><br />Tomás</h1>
          <div className="hero-rule"><span /> <Heart size={13} fill="currentColor" /> <span /></div>
          <p>Um dia para celebrar o amor<br className="desktop-only" /> e as pessoas que fazem parte dele.</p>
          <div className="hero-date"><CalendarDays size={17} /><span>18 de setembro de 2027</span><b>·</b><span>Paraty, RJ</span></div>
          <a className="hero-cta" href="#celebracao">Descubra os detalhes <ArrowDown size={15} /></a>
        </div>
        <div className="hero-side-note">UM CONVITE PARA CELEBRAR</div>
        <div className="hero-scroll"><span /> role para descobrir</div>
      </section>

      <section className="theme-showcase section-shell">
        <div className="theme-showcase-text"><span className="eyebrow">ESCOLHA DE ESTILO</span><h2>Oito jeitos de contar<br />a mesma história.</h2></div>
        <ThemePicker theme={theme} setTheme={setTheme} />
      </section>

      <section className="countdown-band">
        <div className="countdown-label"><span className="eyebrow">O GRANDE DIA CHEGA EM</span><span className="countdown-sentence">Estamos contando os dias.</span></div>
        <div className="countdown-items"><div><strong>{countdown.days}</strong><small>dias</small></div><span>:</span><div><strong>{String(countdown.hours).padStart(2, '0')}</strong><small>horas</small></div><span>:</span><div><strong>{String(countdown.minutes).padStart(2, '0')}</strong><small>minutos</small></div><span>:</span><div><strong>{String(countdown.seconds).padStart(2, '0')}</strong><small>segundos</small></div></div>
        <span className="countdown-flower">✳</span>
      </section>

      <section className="story-section section-shell" id="historia">
        <div className="story-image-wrap"><img src="/images/wedding-garden.png" alt="Casal demonstrativo caminhando em um jardim ao pôr do sol" /><div className="story-photo-label">UM DIA, UMA HISTÓRIA, DOIS CAMINHOS</div><div className="story-image-index">01 <span>/</span> 04</div></div>
        <div className="story-copy"><span className="eyebrow">NOSSA HISTÓRIA</span><h2>O acaso fez<br />a primeira parte.<br /><i>O resto, nós dois.</i></h2><p>Nos encontramos sem planejar, em uma tarde que parecia igual a tantas outras. Desde então, cada escolha ganhou um novo lugar para chamar de casa: ao lado um do outro.</p><p>Agora queremos celebrar essa história perto de quem também faz parte dela.</p><a className="text-link" href="#galeria">Um pouco mais sobre nós <ArrowRight size={15} /></a><span className="story-flower">✳</span></div>
      </section>

      <section className="celebration-section" id="celebracao">
        <div className="section-shell celebration-inner">
          <div className="section-heading centered-heading"><span className="eyebrow">UM DIA PARA GUARDAR</span><h2>A celebração</h2><p>Queremos viver cada momento com calma — e com vocês por perto.</p></div>
          <div className="event-cards">
            <article className="event-card"><div className="event-card-number">01</div><span className="event-icon"><Heart size={19} /></span><span className="eyebrow">CERIMÔNIA</span><h3>O sim</h3><p>Capela de Santa Rita<br />Largo de Santa Rita, Paraty</p><div className="event-meta"><CalendarDays size={15} /> 18 de setembro · 16h</div><a href="https://maps.google.com/?q=Capela+de+Santa+Rita+Paraty" target="_blank" rel="noreferrer">Ver no mapa <ExternalLink size={13} /></a></article>
            <article className="event-card event-card-highlight"><div className="event-card-number">02</div><span className="event-icon"><Sparkles size={19} /></span><span className="eyebrow">RECEPÇÃO</span><h3>Vamos celebrar</h3><p>Casa da Figueira<br />Estrada do Corisco, Paraty</p><div className="event-meta"><CalendarDays size={15} /> 18 de setembro · 18h30</div><a href="https://maps.google.com/?q=Paraty+RJ" target="_blank" rel="noreferrer">Ver no mapa <ExternalLink size={13} /></a></article>
          </div>
          <div className="event-note"><Sparkles size={15} /><span>Traje: passeio completo. Venha confortável para dançar com a gente.</span></div>
        </div>
      </section>

      <section className="schedule-section section-shell">
        <div className="schedule-intro"><span className="eyebrow">SEM PRESSA, COM MUITA ALEGRIA</span><h2>Um dia inteiro<br />para celebrar.</h2><p>Um pequeno roteiro para você aproveitar tudo com a gente.</p></div>
        <div className="schedule-list"><div className="schedule-item"><time>16:00</time><span className="schedule-marker"><Heart size={13} /></span><div><strong>Chegada à cerimônia</strong><small>Receba seu lugar e aproveite a vista.</small></div></div><div className="schedule-item"><time>16:30</time><span className="schedule-marker"><Heart size={13} /></span><div><strong>O nosso sim</strong><small>Capela de Santa Rita.</small></div></div><div className="schedule-item"><time>18:30</time><span className="schedule-marker"><Sparkles size={13} /></span><div><strong>Brinde e recepção</strong><small>Casa da Figueira, com jantar e música.</small></div></div><div className="schedule-item"><time>22:00</time><span className="schedule-marker"><span>✳</span></span><div><strong>Pista aberta</strong><small>O próximo passo é escolher a música.</small></div></div></div>
      </section>

      <section className="gallery-section" id="galeria">
        <div className="gallery-heading section-shell"><div><span className="eyebrow">PEDACINHOS DA NOSSA VIDA</span><h2>Entre um lugar<br />e outro.</h2></div><p>Os lugares, as viagens, os domingos sem pressa. Cada pedacinho levou a gente até aqui.</p></div>
        <div className="gallery-grid"><div className="gallery-main"><img src="/images/wedding-garden.png" alt="Jardim iluminado no fim da tarde" /><span>01 — A luz de fim de tarde</span></div><div className="gallery-small gallery-warm"><Camera size={25} /><span>02 — Dias de sol</span></div><div className="gallery-small gallery-green"><Heart size={24} /><span>03 — Sempre juntos</span></div></div>
      </section>

      <section className="gift-section section-shell" id="presentes">
        <div className="gift-heading"><span className="eyebrow">UM CARINHO EM FORMA DE PRESENTE</span><h2>O melhor presente<br />é ter você por perto.</h2><p>Se quiser nos presentear, preparamos algumas ideias para a nossa nova etapa. Escolha uma lembrança com o valor que fizer sentido para você.</p><button className="text-link" onClick={() => notify('No produto final, os noivos escolhem os meios de presente')}>Como funcionam os presentes <ArrowRight size={15} /></button></div>
        <div className="gift-grid">{[{ icon: '✳', title: 'Um jantar especial', desc: 'Um brinde na nossa viagem.', amount: 'R$ 90' }, { icon: '⌁', title: 'Uma aventura a dois', desc: 'Um passeio para guardar.', amount: 'R$ 180' }, { icon: '♡', title: 'Lua de mel', desc: 'Ajude a escrever esse capítulo.', amount: 'Valor livre' }].map((item) => <article className="gift-card" key={item.title}><span className="gift-art">{item.icon}</span><h3>{item.title}</h3><p>{item.desc}</p><div className="gift-card-bottom"><strong>{item.amount}</strong><button onClick={() => setGift(item)} aria-label={`Escolher ${item.title}`}><ArrowRight size={17} /></button></div></article>)}</div>
      </section>

      <section className="rsvp-section" id="presenca">
        <div className="rsvp-copy"><span className="eyebrow">ATÉ 20 DE AGOSTO</span><h2>Você vem<br />celebrar com a gente?</h2><p>Conta pra gente até 20 de agosto. Assim conseguimos preparar tudo com carinho.</p><div className="rsvp-note"><MessageCircle size={17} /><span>Seu convite pode incluir acompanhantes. Confira o link enviado pelos noivos.</span></div></div>
        <div className="rsvp-form-card">
          {rsvpDone ? <div className="rsvp-success"><span className="success-icon"><Check size={22} /></span><span className="eyebrow">RESPOSTA DE DEMONSTRAÇÃO</span><h3>Que alegria!</h3><p>{guestName || 'Sua resposta'} aparece confirmada nesta prévia.</p><button className="button-outline" onClick={() => setRsvpDone(false)}>Editar resposta</button></div> : <form onSubmit={submitRsvp}>
            <span className="form-kicker">CONFIRMAÇÃO DE PRESENÇA</span><label>Seu nome<input required value={guestName} onChange={(event) => setGuestName(event.target.value)} placeholder="Como está no convite" /></label><label>Você poderá ir?<select required defaultValue=""><option value="" disabled>Escolha uma opção</option><option>Sim, estarei lá!</option><option>Infelizmente não poderei</option></select><ChevronDown className="select-chevron" size={15} /></label><div className="form-two"><label>Acompanhantes<select defaultValue="0"><option value="0">Nenhum</option><option>1 acompanhante</option><option>2 acompanhantes</option></select></label><label>Restrição alimentar<input placeholder="Opcional" /></label></div><button className="button-primary" type="submit">Enviar resposta <ArrowRight size={16} /></button><small className="form-footnote">Prévia visual: a resposta não é enviada nem armazenada.</small>
          </form>}
        </div>
      </section>

      <section className="access-section section-shell">
        <div className="access-intro"><span className="eyebrow">UM CONVITE QUE CHEGA ATÉ VOCÊ</span><h2>Presente onde<br />a vida acontece.</h2><p>O convite final poderá ser aberto por link, QR code ou pelo endereço enviado pelos noivos. O domínio e os links ainda serão definidos.</p></div>
        <div className="access-options"><article><span className="access-icon"><Link size={19} /></span><strong>Link de acesso</strong><small>Um endereço individual para cada convite.</small><span className="access-status">Domínio a definir</span></article><article><span className="access-icon"><QrCode size={19} /></span><strong>QR code</strong><small>Pronto para compartilhar no convite digital.</small><span className="qr-placeholder"><i /><i /><i /><i /><i /><i /><i /><i /><i /></span><span className="access-status">Prévia ilustrativa</span></article></div>
      </section>

      <section className="calendar-section section-shell"><div><span className="eyebrow">PARA NÃO PERDER NENHUM MOMENTO</span><h2>Guarde essa data.</h2><p>Escolha seu calendário para adicionar o casamento.</p></div><div className="calendar-controls"><label className="sr-only" htmlFor="calendar-choice">Escolha seu calendário</label><select id="calendar-choice" value={calendar} onChange={(event) => setCalendar(event.target.value)}><option value="">Qual calendário você usa?</option><option value="Google Calendar">Google Calendar</option><option value="Outlook">Outlook</option><option value="Apple Calendar">Apple Calendar</option></select><button onClick={() => notify(calendar ? `Fluxo de ${calendar} demonstrativo` : 'Escolha um calendário primeiro')}>Adicionar data <CalendarDays size={15} /></button><small>Esta prévia não cria um evento de calendário.</small></div></section>

      <section className="wall-section"><div className="wall-mark">“</div><span className="eyebrow">UM MURAL DE CARINHO</span><h2>Deixe um recado<br />para os noivos.</h2><p>Mensagens de quem a gente ama tornam a lembrança ainda mais bonita.</p><button className="button-outline" onClick={() => notify('O mural é uma prévia visual')}>Escrever um recado <MessageCircle size={15} /></button><div className="wall-note">“Que a vida de vocês seja sempre cheia de encontros felizes.”<small>Mensagem de demonstração</small></div></section>

      <footer className="guest-footer"><div className="footer-monogram">e<span>&</span>t</div><p>Feito com carinho, para celebrar o amor.</p><a href="https://henriquesouzas.com" target="_blank" rel="noreferrer">henriquesouzas.com <ExternalLink size={12} /></a><span className="footer-demo">ESTUDO VISUAL · CONTEÚDO FICTÍCIO</span></footer>

      {gift && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setGift(null)}><div className="gift-modal" role="dialog" aria-modal="true" aria-labelledby="gift-modal-title"><button className="modal-close" onClick={() => setGift(null)} aria-label="Fechar"><X size={19} /></button><span className="modal-flower">{gift.icon}</span><span className="eyebrow">PRESENTE DE DEMONSTRAÇÃO</span><h3 id="gift-modal-title">{gift.title}</h3><p>Na versão final, os noivos escolhem quais formas de presente estarão disponíveis.</p><div className="payment-choice"><span><Wallet size={17} /> Pix via Stripe</span><span className="future-tag">A configurar</span></div><div className="payment-choice"><span><QrCode size={17} /> Pix direto aos noivos</span><span className="future-tag">A configurar</span></div><button className="button-primary" onClick={() => { setGift(null); notify('Pagamento não conectado neste mockup') }}>Continuar <ArrowRight size={16} /></button><small>Esta tela não inicia um pagamento.</small></div></div>}
    </div>
  )
}

function Dashboard({ theme, setTheme, page, setPage, notify }) {
  const [guestFilter, setGuestFilter] = useState('Todos')
  const [query, setQuery] = useState('')
  const [gameEnabled, setGameEnabled] = useState(false)
  const [enabledSections, setEnabledSections] = useState(['Nossa história', 'Eventos', 'Lista de presentes', 'Galeria de fotos', 'Mural de recados'])

  const pageTitle = NAV_ITEMS.find((item) => item.id === page)?.label || 'Visão geral'

  function toggleSection(name) {
    setEnabledSections((current) => current.includes(name) ? current.filter((item) => item !== name) : [...current, name])
  }

  return (
    <div className="dashboard-layout">
      <aside className="dashboard-sidebar">
        <div className="dash-brand"><span className="dash-monogram">e<span>&</span>t</span><div><strong>Elisa & Tomás</strong><small>Casal demonstrativo</small></div></div>
        <div className="sidebar-label">SEU CASAMENTO</div>
        <nav className="dashboard-nav">{NAV_ITEMS.map((item) => { const Icon = item.icon; return <button key={item.id} className={page === item.id ? 'active' : ''} onClick={() => setPage(item.id)}><Icon size={17} /><span>{item.label}</span>{item.id === 'game' && <span className="optional-mark">opcional</span>}</button> })}</nav>
        <div className="sidebar-bottom"><div className="help-card"><span><CircleHelp size={17} /></span><div><strong>Precisa de ajuda?</strong><small>Estamos por aqui.</small></div><ChevronRight size={15} /></div><button className="sidebar-profile" onClick={() => notify('Perfil de demonstração')}><span className="profile-avatar">ET</span><span><strong>Elisa e Tomás</strong><small>Conta de demonstração</small></span><ChevronDown size={15} /></button></div>
      </aside>

      <div className="dashboard-main">
        <header className="dashboard-topbar"><div className="dash-breadcrumb"><span>Meu espaço</span><ChevronRight size={14} /><strong>{pageTitle}</strong></div><div className="dash-top-actions"><span className="save-state"><span /> Prévia local</span><button className="icon-button" aria-label="Notificações" onClick={() => notify('Nenhuma notificação de demonstração')}><Bell size={18} /><i /></button><button className="preview-site-button" onClick={() => notify('A prévia pública está na aba Site do casal')}>Ver meu site <ExternalLink size={14} /></button></div></header>
        <div className="dashboard-content">
          <div className="dash-page-head"><div><span className="eyebrow">ÁREA DOS NOIVOS · DEMONSTRAÇÃO</span><h1>{page === 'overview' ? 'Um espaço para organizar tudo.' : pageTitle}</h1><p>{pageSubtitle(page)}</p></div><button className="more-button" onClick={() => notify('Ações de demonstração')}><span>•••</span></button></div>
          {page === 'overview' && <Overview setPage={setPage} notify={notify} />}
          {page === 'site' && <SiteSettings setPage={setPage} notify={notify} />}
          {page === 'guests' && <GuestManager guestFilter={guestFilter} setGuestFilter={setGuestFilter} query={query} setQuery={setQuery} notify={notify} />}
          {page === 'invites' && <InviteManager notify={notify} />}
          {page === 'gifts' && <GiftManager notify={notify} />}
          {page === 'customize' && <Customize theme={theme} setTheme={setTheme} enabledSections={enabledSections} toggleSection={toggleSection} notify={notify} />}
          {page === 'game' && <GameManager enabled={gameEnabled} setEnabled={setGameEnabled} notify={notify} />}
        </div>
      </div>
    </div>
  )
}

function pageSubtitle(page) {
  const subtitles = {
    overview: 'Acompanhe os preparativos e veja o que já está pronto.',
    site: 'As informações que seus convidados encontram no site.',
    guests: 'Convites, respostas e grupos reunidos em um só lugar.',
    invites: 'Compartilhe seu convite por link curto, endereço ou QR code.',
    gifts: 'Acompanhe ideias de presente, recebimentos e formas de pagamento.',
    customize: 'Escolha um tema e ajuste apenas o que faz sentido para vocês.',
    game: 'Uma brincadeira opcional para aproximar seus convidados.',
  }
  return subtitles[page]
}

function Overview({ setPage, notify }) {
  return <>
    <div className="welcome-card"><div className="welcome-copy"><span className="eyebrow">18 DE SETEMBRO DE 2027 · PARATY, RJ</span><h2>O próximo capítulo<br />começa a ganhar forma.</h2><p>Seu site está em uma prévia de demonstração, com exemplos de conteúdo.</p><div className="welcome-actions"><button className="button-primary" onClick={() => setPage('customize')}>Personalizar site <ArrowRight size={15} /></button><button className="welcome-link" onClick={() => setPage('invites')}>Ver convite <ExternalLink size={14} /></button></div></div><div className="welcome-art"><img src="/images/wedding-garden.png" alt="Imagem de capa de demonstração" /><span>e<span>&</span>t</span></div><div className="welcome-bottom"><span><span className="status-dot" /> SITE DE DEMONSTRAÇÃO</span><button onClick={() => notify('O domínio será definido pelo dono do projeto')}>Endereço a definir <ArrowRight size={14} /></button></div></div>
    <div className="stats-grid"><Stat icon={Users} label="Convidados" value="128" note="exemplos cadastrados" tint="sage" /><Stat icon={Check} label="Confirmações" value="86" note="respostas de demonstração" tint="sand" /><Stat icon={Gift} label="Presentes" value="R$ 1.130" note="valores ilustrativos" tint="rose" /></div>
    <div className="overview-grid"><section className="dash-card checklist-card"><div className="card-heading"><div><span className="eyebrow">PRÓXIMOS PASSOS</span><h3>Seu planejamento</h3></div><button className="round-arrow" onClick={() => notify('Lista de planejamento de demonstração')}><ArrowRight size={16} /></button></div><div className="progress-summary"><div><strong>3 de 6</strong><span>etapas iniciadas</span></div><div className="progress-track"><span style={{ width: '52%' }} /></div></div><div className="checklist-row done"><span className="check-circle"><Check size={13} /></span><span><strong>Definir data e local</strong><small>Informações de demonstração</small></span><ChevronRight size={15} /></div><div className="checklist-row done"><span className="check-circle"><Check size={13} /></span><span><strong>Montar a lista de convidados</strong><small>128 nomes de demonstração</small></span><ChevronRight size={15} /></div><div className="checklist-row"><span className="check-circle" /><span><strong>Escolher o visual do site</strong><small>Compare os oito temas</small></span><button onClick={() => setPage('customize')}>Escolher</button></div><div className="checklist-row"><span className="check-circle" /><span><strong>Enviar convites</strong><small>O domínio ainda será definido</small></span><button onClick={() => setPage('invites')}>Preparar</button></div><button className="all-checklist" onClick={() => notify('Lista demonstrativa')}>Ver planejamento completo <ArrowRight size={14} /></button></section>
      <section className="dash-card response-card"><div className="card-heading"><div><span className="eyebrow">CONVIDADOS</span><h3>Respostas recentes</h3></div><button className="text-arrow" onClick={() => setPage('guests')}>Ver todos <ArrowRight size={14} /></button></div><div className="response-visual"><div className="donut-chart"><div><strong>67%</strong><small>confirmados</small></div></div><div className="response-legend"><span><i className="legend-confirmed" /> Confirmaram <b>86</b></span><span><i className="legend-waiting" /> Aguardando <b>32</b></span><span><i className="legend-declined" /> Não poderão ir <b>10</b></span></div></div><div className="response-footer"><span>Dados ilustrativos para o mockup</span><button onClick={() => setPage('guests')}>Abrir lista <ArrowRight size={13} /></button></div></section></div>
  </>
}

function Stat({ icon: Icon, label, value, note, tint }) {
  return <article className="stat-card"><span className={`stat-icon ${tint}`}><Icon size={17} /></span><div><span className="stat-label">{label}</span><strong>{value}</strong><small>{note}</small></div><span className="stat-arrow"><ArrowRight size={14} /></span></article>
}

function SiteSettings({ setPage, notify }) {
  const sections = ['Nossa história', 'Cerimônia e recepção', 'Cronograma', 'Lista de presentes', 'Confirmação de presença', 'Galeria de fotos', 'Mural de recados', 'Hospedagem e dicas']
  return <div className="site-settings-grid"><section className="dash-card settings-card"><div className="card-heading"><div><span className="eyebrow">CONTEÚDO DO SITE</span><h3>Suas informações principais</h3></div><button className="text-arrow" onClick={() => notify('Campos editáveis serão definidos na implementação')}>Editar <ArrowRight size={14} /></button></div><div className="site-info-row"><span className="site-info-icon"><CalendarDays size={16} /></span><div><small>Data do casamento</small><strong>18 de setembro de 2027</strong></div><span className="info-status">Preenchido</span></div><div className="site-info-row"><span className="site-info-icon"><MapPin size={16} /></span><div><small>Local da celebração</small><strong>Paraty, Rio de Janeiro</strong></div><span className="info-status">Preenchido</span></div><div className="site-info-row"><span className="site-info-icon"><Heart size={16} /></span><div><small>História do casal</small><strong>Uma história de encontros</strong></div><span className="info-status">Prévia</span></div><div className="site-info-row"><span className="site-info-icon"><LanguagesIcon /></span><div><small>Idiomas</small><strong>Português · Inglês · Espanhol</strong></div><span className="info-status info-pending">A confirmar</span></div><button className="settings-full-button" onClick={() => notify('Edição de conteúdo não conectada neste mockup')}>Revisar conteúdo <ArrowRight size={14} /></button></section><section className="dash-card site-preview-card"><div className="card-heading"><div><span className="eyebrow">PRÉ-VISUALIZAÇÃO</span><h3>Como seus convidados veem</h3></div><button className="round-arrow" onClick={() => notify('Use a aba Site do casal para ver o mockup completo')}><ExternalLink size={15} /></button></div><div className="mini-site"><img src="/images/wedding-garden.png" alt="Capa do site de demonstração" /><div><span className="mini-script">Elisa & Tomás</span><span className="mini-date">18 · 09 · 2027</span></div></div><div className="preview-meta"><span><span className="status-dot" /> Conteúdo demonstrativo</span><button onClick={() => setPage('customize')}>Editar visual <Paintbrush size={14} /></button></div></section><section className="dash-card section-list-card"><div className="card-heading"><div><span className="eyebrow">SEÇÕES PUBLICADAS</span><h3>O que aparece no seu site</h3></div><button className="text-arrow" onClick={() => setPage('customize')}>Organizar <ArrowRight size={14} /></button></div><div className="section-chips">{sections.map((section, index) => <span key={section}><b>{String(index + 1).padStart(2, '0')}</b>{section}<Check size={14} /></span>)}</div></section></div>
}

function LanguagesIcon() {
  return <span className="language-symbol">文</span>
}

function GuestManager({ guestFilter, setGuestFilter, query, setQuery, notify }) {
  const filtered = GUEST_ROWS.filter((guest) => (guestFilter === 'Todos' || guest.status === guestFilter) && guest.name.toLowerCase().includes(query.toLowerCase()))
  return <div className="dash-card guests-card"><div className="guests-toolbar"><div className="guest-filters">{['Todos', 'Confirmado', 'Aguardando', 'Não poderá ir'].map((filter) => <button key={filter} className={guestFilter === filter ? 'active' : ''} onClick={() => setGuestFilter(filter)}>{filter}<span>{filter === 'Todos' ? '128' : filter === 'Confirmado' ? '86' : filter === 'Aguardando' ? '32' : '10'}</span></button>)}</div><div className="guest-actions"><label className="search-field"><Search size={15} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar convidado" /></label><button className="button-outline" onClick={() => notify('Importação CSV será implementada na fase do painel')}><span>Importar CSV</span></button><button className="button-primary" onClick={() => notify('Cadastro de demonstração')}>+ Adicionar</button></div></div><div className="guest-table-wrap"><table className="guest-table"><thead><tr><th>CONVIDADO</th><th>GRUPO</th><th>ACOMPANHANTES</th><th>RESPOSTA</th><th></th></tr></thead><tbody>{filtered.length ? filtered.map((guest, index) => <tr key={guest.name}><td><span className={`guest-avatar guest-avatar-${index % 4}`}>{guest.name.charAt(0)}</span><strong>{guest.name}</strong></td><td>{guest.group}</td><td>{guest.people}</td><td><span className={`status-pill ${guest.status === 'Confirmado' ? 'confirmed' : guest.status === 'Aguardando' ? 'waiting' : 'declined'}`}><i />{guest.status}</span></td><td><button className="row-more" onClick={() => notify(`Convidado demonstrativo: ${guest.name}`)}>•••</button></td></tr>) : <tr><td colSpan="5" className="empty-state">Nenhum nome encontrado nesta demonstração.</td></tr>}</tbody></table></div><div className="table-footer"><span>Mostrando {filtered.length} de 128 convidados demonstrativos</span><div><button disabled>Anterior</button><button className="page-number">1</button><button>2</button><button>3</button><button>Próxima <ArrowRight size={13} /></button></div></div><div className="privacy-note"><CircleHelp size={15} /> Informações de convidados ficam visíveis apenas aos noivos de cada casamento.</div></div>
}

function InviteManager({ notify }) {
  return <div className="invite-layout"><section className="dash-card invite-main-card"><div className="card-heading"><div><span className="eyebrow">COMPARTILHE COM CARINHO</span><h3>Seu convite, do seu jeito</h3></div><span className="invite-status"><span /> Prévia</span></div><p className="invite-explainer">Os três caminhos de acesso previstos para seus convidados. O endereço final depende do domínio da plataforma.</p><div className="invite-link-card"><span className="invite-icon"><Link size={18} /></span><div><small>LINK CURTO DO CASAMENTO</small><strong>link.a-definir/elisa-tomas</strong><span>Endereço ilustrativo · domínio a definir</span></div><button onClick={() => notify('Link ilustrativo copiado para a demonstração')}><Copy size={15} /> Copiar</button></div><div className="invite-link-card"><span className="invite-icon"><House size={18} /></span><div><small>SUBDOMÍNIO DOS NOIVOS</small><strong>elisa-tomas.dominio-a-definir</strong><span>O domínio base será escolhido antes da implementação.</span></div><button className="text-only-button" onClick={() => notify('Domínio pendente de definição')}>Configurar <ArrowRight size={14} /></button></div><div className="invite-link-card"><span className="invite-icon"><Users size={18} /></span><div><small>LINK INDIVIDUAL OU POR GRUPO</small><strong>Convite com acesso controlado</strong><span>Link assinado, com expiração configurável.</span></div><button className="text-only-button" onClick={() => notify('Links individuais previstos na fase inicial')}>Ver opções <ArrowRight size={14} /></button></div><div className="invite-note"><CircleHelp size={15} /> Os links aqui são exemplos visuais, não podem ser usados para acessar um convite real.</div></section><section className="dash-card qr-card"><div className="card-heading"><div><span className="eyebrow">PRONTO PARA IMPRIMIR</span><h3>QR code do convite</h3></div><QrCode size={19} className="qr-heading-icon" /></div><div className="large-qr-placeholder"><span className="qr-corner qr-corner-one" /><span className="qr-corner qr-corner-two" /><span className="qr-corner qr-corner-three" /><div className="qr-pattern">{Array.from({ length: 49 }, (_, index) => <i key={index} className={(index * 7 + index % 3) % 5 === 0 ? 'blank' : ''} />)}</div><span className="qr-center">e<span>&</span>t</span></div><p>Prévia ilustrativa<br />Link ainda não configurado</p><button className="button-outline" onClick={() => notify('O QR real será gerado no produto final')}>Baixar QR code <ArrowDown size={14} /></button></section></div>
}

function GiftManager({ notify }) {
  return <><div className="gift-summary-grid"><Stat icon={Gift} label="Presentes recebidos" value="R$ 1.130" note="valores fictícios" tint="rose" /><Stat icon={Wallet} label="Taxas acumuladas" value="R$ 0,00" note="regra não definida" tint="sand" /><Stat icon={Users} label="Agradecimentos" value="3" note="mensagens ilustrativas" tint="sage" /></div><div className="gift-admin-grid"><section className="dash-card admin-gift-list"><div className="card-heading"><div><span className="eyebrow">LISTA DE PRESENTES</span><h3>Ideias para presentear</h3></div><button className="button-primary" onClick={() => notify('Novo presente de demonstração')}>+ Novo presente</button></div><div className="gift-admin-rows">{GIFT_ROWS.map((gift) => <div className="gift-admin-row" key={gift.title}><span className="gift-row-icon"><Gift size={18} /></span><div className="gift-row-copy"><strong>{gift.title}</strong><small>Cota de {gift.amount} · valores de demonstração</small><div className="mini-progress"><i style={{ width: `${gift.progress}%` }} /></div></div><span className="gift-row-total">{gift.received}<small>recebido</small></span><button className="row-more" onClick={() => notify('Detalhes ilustrativos')}>•••</button></div>)}</div></section><section className="dash-card payment-method-card"><span className="eyebrow">FORMAS DE PRESENTE</span><h3>Escolha o que faz sentido.</h3><p>Os dois modos previstos aparecem juntos. Nenhum meio de pagamento está conectado nesta prévia.</p><div className="method-row"><span className="payment-method-icon"><Wallet size={17} /></span><div><strong>Pix via Stripe</strong><small>Connect · configurar conta da plataforma</small></div><span className="future-tag">Fase futura</span></div><div className="method-row"><span className="payment-method-icon pix">P</span><div><strong>Pix direto</strong><small>Chave dos noivos · confirmação manual</small></div><span className="future-tag">Fase futura</span></div><div className="fee-note"><CircleHelp size={14} /> A taxa por presente será configurável e transparente.</div><button className="button-outline full-width" onClick={() => notify('A configuração de pagamento virá na fase de presentes')}>Configurar meios de presente</button></section></div></>
}

function Customize({ theme, setTheme, enabledSections, toggleSection, notify }) {
  const sectionNames = ['Nossa história', 'Linha do tempo', 'Eventos', 'Cronograma', 'Dress code', 'Padrinhos e madrinhas', 'Lista de presentes', 'Confirmação de presença', 'Galeria de fotos', 'Mural de recados', 'Hospedagem e dicas', 'Perguntas frequentes', 'Playlist', 'Vídeo', 'Contato', 'Quiz dos noivos']
  const layouts = [{ id: 'full', label: 'Foto em tela cheia' }, { id: 'split', label: 'Foto ao lado' }, { id: 'arch', label: 'Moldura ou arco' }, { id: 'type', label: 'Só tipografia' }, { id: 'video', label: 'Vídeo curto' }, { id: 'collage', label: 'Colagem de fotos' }]
  const languages = ['pt-BR', 'en', 'es']
  const [device, setDevice] = useState('desktop')
  const [previewLanguage, setPreviewLanguage] = useState('pt-BR')
  const [coverLayout, setCoverLayout] = useState('full')
  const [paletteIndex, setPaletteIndex] = useState(0)
  const [animationPreset, setAnimationPreset] = useState('Elegante')
  const palette = THEMES.find((item) => item.id === theme)?.colors || THEMES[0].colors
  const languageCopy = {
    'pt-BR': { date: '18 · 09 · 2027', message: 'Com alegria, convidamos você.', button: 'Descobrir o convite' },
    en: { date: 'SEP 18 · 2027', message: 'With joy, we invite you.', button: 'Explore the invitation' },
    es: { date: '18 · SEP · 2027', message: 'Con alegría, te invitamos.', button: 'Descubre la invitación' },
  }[previewLanguage]
  const palettes = [
    [palette[0], palette[1], palette[2]],
    [palette[0], '#d2b994', '#fbf8f1'],
    [palette[0], '#bf8b67', '#f6ece2'],
    [palette[0], '#d08e91', '#f5ebec'],
    [palette[0], '#9d9c70', '#f1efe3'],
    [palette[0], '#d7b862', '#faf5dd'],
  ]
  const selectedPalette = palettes[paletteIndex]

  return <div className="customize-layout"><div className="customize-controls">
    <section className="dash-card customize-card"><div className="card-heading"><div><span className="eyebrow">1 · ESCOLHA UMA BASE</span><h3>Temas curados</h3></div><span className="step-counter">8 opções</span></div><p>Comece por uma direção visual. O conteúdo permanece ao trocar de tema.</p><ThemePicker theme={theme} setTheme={setTheme} compact /><div className="palette-picker"><div className="palette-heading"><strong>Paletas deste tema</strong><small>Combinações com contraste previsto</small></div><div className="palette-swatches">{palettes.map((colors, index) => <button className={paletteIndex === index ? 'active' : ''} key={index} onClick={() => setPaletteIndex(index)} aria-label={`Paleta ${index + 1}`}>{colors.map((color) => <i key={color} style={{ backgroundColor: color }} />)}</button>)}</div></div><label className="font-pair-label">Par de fontes<select defaultValue="Clássico editorial"><option>Clássico editorial</option><option>Romântico leve</option><option>Moderno sem serifa</option><option>Elegante de alto contraste</option><option>Contemporâneo humanista</option><option>Floral delicado</option><option>Minimalista geométrico</option><option>Rústico acolhedor</option></select></label></section>
    <section className="dash-card customize-card"><div className="card-heading"><div><span className="eyebrow">2 · PERSONALIZE A CAPA</span><h3>Escolha um dos seis layouts</h3></div><span className="step-counter">6 opções</span></div><div className="cover-layout-grid">{layouts.map((layout) => <button key={layout.id} className={coverLayout === layout.id ? 'active' : ''} onClick={() => setCoverLayout(layout.id)}><span className={`layout-thumb layout-thumb-${layout.id}`}><i /><b /><em /></span><small>{layout.label}</small></button>)}</div><div className="focal-note"><CircleHelp size={13} /> Ponto focal e recorte podem ser ajustados separadamente para celular e desktop.</div></section>
    <section className="dash-card customize-card"><div className="card-heading"><div><span className="eyebrow">3 · ORGANIZE O CONTEÚDO</span><h3>Biblioteca de seções</h3></div><span className="section-count">{enabledSections.length} ativas</span></div><p>Ative ou desligue blocos. Variações e ordem podem ser refinadas depois.</p><div className="toggle-list">{sectionNames.map((name, index) => <div className="toggle-row" key={name}><span className="drag-handle">⠿</span><span className="toggle-index">{String(index + 1).padStart(2, '0')}</span><span className="toggle-name">{name}{name === 'Quiz dos noivos' && <small>Opcional</small>}</span><button className={`toggle-switch ${enabledSections.includes(name) ? 'on' : ''}`} aria-label={`${enabledSections.includes(name) ? 'Desativar' : 'Ativar'} ${name}`} onClick={() => toggleSection(name)}><i /></button></div>)}</div><div className="section-limit-note">Até 6 blocos de conteúdo livre, além das seções prontas.</div></section>
    <section className="dash-card customize-card animation-card"><div className="card-heading"><div><span className="eyebrow">4 · MOVIMENTO</span><h3>Preset de animação</h3></div><Sparkles size={17} /></div><div className="segmented-control">{['Suave', 'Elegante', 'Festivo', 'Nenhum'].map((preset) => <button key={preset} className={animationPreset === preset ? 'selected' : ''} onClick={() => setAnimationPreset(preset)}>{preset}</button>)}</div><small>Respeita a preferência de movimento e economia de dados do dispositivo.</small></section><button className="button-primary save-customize" onClick={() => notify('Preferências demonstrativas selecionadas')}>Salvar rascunho <Check size={15} /></button>
  </div><div className="customize-preview" style={{ '--forest': selectedPalette[0], '--accent': selectedPalette[1], '--paper': selectedPalette[2] }}><div className="preview-sticky-label"><span><span className="status-dot" /> PRÉVIA AO VIVO</span><div className="preview-device-switch"><button className={device === 'desktop' ? 'active' : ''} aria-label="Prévia em desktop" onClick={() => setDevice('desktop')}><Monitor size={14} /></button><button className={device === 'tablet' ? 'active' : ''} aria-label="Prévia em tablet" onClick={() => setDevice('tablet')}><Tablet size={14} /></button><button className={device === 'mobile' ? 'active' : ''} aria-label="Prévia em celular" onClick={() => setDevice('mobile')}><Smartphone size={14} /></button></div><select aria-label="Idioma da prévia" value={previewLanguage} onChange={(event) => setPreviewLanguage(event.target.value)}>{languages.map((language) => <option key={language}>{language}</option>)}</select></div><div className={`browser-frame device-${device}`}><div className="browser-bar"><span /><span /><span /><div>elisa-tomas.dominio-a-definir</div><ExternalLink size={12} /></div><div className={`browser-content cover-${coverLayout}`}><img src="/images/wedding-garden.png" alt="Prévia do tema do convite" /><div className="browser-overlay" /><span className="browser-date">{languageCopy.date}</span><strong>Elisa <i>&</i><br />Tomás</strong><small>{languageCopy.message}</small><button onClick={() => notify('A prévia visual não abre um endereço publicado')}>{languageCopy.button} <ArrowRight size={13} /></button>{coverLayout === 'video' && <span className="video-preview-tag">Vídeo de capa · silencioso</span>}</div><div className="browser-below"><span>um dia para celebrar</span><i>♡</i><span>nossa história</span></div></div><div className="preview-quality"><div><Check size={14} /><span><strong>Contraste do tema</strong><small>Combinação dentro da paleta curada</small></span></div><div><Check size={14} /><span><strong>Layout responsivo</strong><small>Prévia em {device === 'mobile' ? 'celular' : device === 'tablet' ? 'tablet' : 'desktop'}</small></span></div><button onClick={() => notify('Verificador de publicação demonstrativo')}>Verificador antes de publicar <ArrowRight size={13} /></button></div><div className="preview-notice"><CircleHelp size={15} /> A prévia mostra opções viáveis. Conteúdo e publicação ainda não estão conectados.</div></div></div>
}

function GameManager({ enabled, setEnabled, notify }) {
  return <div className="game-layout"><section className="dash-card game-settings"><div className="card-heading"><div><span className="eyebrow">BRINCADEIRA OPCIONAL</span><h3>Quiz dos noivos</h3></div><span className={`game-state ${enabled ? 'enabled' : ''}`}>{enabled ? 'Ativo na prévia' : 'Desativado'}</span></div><p>Uma partida com cinco perguntas por dia, ranking entre convidados e uma nova chance amanhã. Só aparece no convite quando vocês ativarem.</p><div className="game-toggle-card"><span className="game-sparkle"><Sparkles size={21} /></span><span><strong>Mostrar o jogo no site</strong><small>{enabled ? 'O quiz aparece no convite demonstrativo.' : 'O menu do jogo fica oculto para os convidados.'}</small></span><button className={`toggle-switch ${enabled ? 'on' : ''}`} aria-label={enabled ? 'Desativar jogo' : 'Ativar jogo'} onClick={() => setEnabled(!enabled)}><i /></button></div><div className="game-details"><div><small>PARTIDAS</small><strong>5 perguntas por dia</strong></div><div><small>RANKING</small><strong>Semanal e geral</strong></div><div><small>PRIVACIDADE</small><strong>Apelido ou oculto</strong></div></div><button className="button-outline full-width" onClick={() => notify('Perguntas personalizadas serão configuradas na fase do jogo')}>Editar perguntas <ArrowRight size={14} /></button></section><section className="game-preview-card"><div className="quiz-top"><span className="quiz-mark"><Sparkles size={20} /></span><span className="quiz-day">QUIZ DO DIA · PRÉVIA</span><h3>Quem disse<br />“eu te amo” primeiro?</h3><p>Escolha uma resposta para ver como o jogo pode funcionar.</p></div><div className="quiz-options"><button onClick={() => notify('Resposta de demonstração selecionada')}>Elisa <span>A</span></button><button onClick={() => notify('Resposta de demonstração selecionada')}>Tomás <span>B</span></button></div><div className="quiz-footer"><span>01 / 05</span><span>Uma tentativa por dia</span></div></section></div>
}

function RoleFrame({ icon: Icon, eyebrow, title, description, children, className = '' }) {
  return <div className={`role-page ${className}`}><header className="role-header"><a className="role-brand" href="#inicio"><span>e<span>&</span>t</span><strong>Elisa & Tomás</strong></a><span className="role-preview"><i /> PRÉVIA INTERATIVA · DADOS FICTÍCIOS</span></header><main className="role-main"><div className="role-intro"><span className="role-icon"><Icon size={19} /></span><span className="eyebrow">{eyebrow}</span><h1>{title}</h1><p>{description}</p></div>{children}<div className="role-demo-note"><LockKeyhole size={15} /> Protótipo com dados locais. O controle de acesso real será validado no servidor antes de uso com dados de convidados.</div></main><footer className="role-footer"><span>e<span>&</span>t · celebração em 18.09.2027</span><a href="https://henriquesouzas.com" target="_blank" rel="noreferrer">henriquesouzas.com</a></footer></div>
}

function GuestPortal({ notify }) {
  const [rsvp, setRsvp] = useState('Confirmar presença')
  const [calendar, setCalendar] = useState('')
  return <RoleFrame icon={UserRound} eyebrow="ÁREA DO CONVIDADO" title="Seu convite, em um só lugar." description="Consulte os detalhes do evento, confirme sua presença e guarde o convite no celular.">
    <section className="role-card guest-pass-card"><div className="role-card-heading"><div><span className="eyebrow">CONVITE INDIVIDUAL</span><h2>Olá, Ana Beatriz</h2></div><span className="status-pill confirmed"><i /> Convite ativo</span></div><div className="guest-pass-details"><span><CalendarDays size={16} /> 18 de setembro de 2027 · 16h</span><span><MapPin size={16} /> Casa das Palmeiras · São Paulo, SP</span><span><Users size={16} /> Convite para 2 pessoas</span></div><div className="guest-pass-qr"><QrCode size={61} strokeWidth={1.1} /><span>Apresente este convite na entrada</span></div><div className="role-actions"><button className="button-primary" onClick={() => { setRsvp(rsvp === 'Confirmar presença' ? 'Presença confirmada' : 'Confirmar presença'); notify(rsvp === 'Confirmar presença' ? 'Presença confirmada nesta demonstração' : 'Confirmação alterada') }}>{rsvp} <Check size={15} /></button><label className="calendar-select">Adicionar à agenda<select value={calendar} onChange={(event) => { setCalendar(event.target.value); if (event.target.value) notify(`Prévia de integração com ${event.target.value}`) }}><option value="">Escolha seu calendário</option><option>Google Calendar</option><option>Outlook</option><option>Apple Calendar</option></select><ChevronDown size={14} /></label></div></section>
    <div className="role-grid two"><section className="role-card"><span className="eyebrow">SEU EVENTO</span><h2>Recepção e festa</h2><p>Após a cerimônia, vamos celebrar juntos até a noite.</p><a className="text-arrow" href="#local">Ver local e como chegar <ArrowRight size={14} /></a></section><section className="role-card"><span className="eyebrow">PRESENTES</span><h2>Um carinho para os noivos</h2><p>Acesse a lista de presentes e escolha como deseja participar.</p><button className="button-outline" onClick={() => notify('Lista de presentes demonstrativa')}>Ver lista <Gift size={15} /></button></section></div>
  </RoleFrame>
}

function GodparentPortal({ notify }) {
  const [tasks, setTasks] = usePersistentState('demo-godparent-tasks', [
    { id: 'look', title: 'Confirmar traje com os noivos', due: 'Até 1º de setembro', done: false },
    { id: 'ceremony', title: 'Chegar 45 minutos antes da cerimônia', due: '18 de setembro · 15h15', done: false },
    { id: 'speech', title: 'Combinar a surpresa com a cerimonialista', due: 'Até 12 de setembro', done: true },
  ])
  const toggleTask = (id) => { setTasks((current) => current.map((task) => task.id === id ? { ...task, done: !task.done } : task)); notify('Tarefa atualizada na demonstração') }
  return <RoleFrame icon={Heart} eyebrow="ESPAÇO DOS PADRINHOS" title="Sua participação faz parte da história." description="Aqui ficam os detalhes e combinados enviados pelos noivos para você.">
    <div className="role-grid two"><section className="role-card godparent-event"><span className="eyebrow">PRÓXIMO COMPROMISSO</span><h2>Ensaio da cerimônia</h2><div className="godparent-detail"><CalendarCheck size={16} /><span>17 de setembro · 17h30</span></div><div className="godparent-detail"><MapPin size={16} /><span>Capela das Palmeiras</span></div><button className="button-outline" onClick={() => notify('Orientação de rota demonstrativa')}>Como chegar <ArrowRight size={14} /></button></section><section className="role-card"><span className="eyebrow">ORIENTAÇÃO DOS NOIVOS</span><h2>Traje sugerido</h2><p>Traje social em tons de verde, areia ou terracota. Evite branco e estampas muito chamativas.</p><div className="dress-swatches"><i /><i /><i /><i /></div></section></div>
    <section className="role-card task-card"><div className="role-card-heading"><div><span className="eyebrow">SUA LISTA</span><h2>Combinados importantes</h2></div><span className="task-count">{tasks.filter((task) => task.done).length}/{tasks.length} concluídos</span></div><div className="task-list">{tasks.map((task) => <button className={`task-row ${task.done ? 'done' : ''}`} key={task.id} onClick={() => toggleTask(task.id)}><span className="task-check"><Check size={14} /></span><span><strong>{task.title}</strong><small>{task.due}</small></span><ChevronRight size={15} /></button>)}</div><p className="godparent-privacy"><LockKeyhole size={14} /> Área individual. A lista de convidados não fica disponível neste perfil.</p></section>
  </RoleFrame>
}

const STAFF_GUESTS = [
  { id: 'g1', name: 'Ana Beatriz Costa', group: 'Família da noiva', guests: 2, rsvp: 'Confirmado', dietary: 'Vegetariana' },
  { id: 'g2', name: 'Bruno e Camila Alves', group: 'Amigos', guests: 2, rsvp: 'Confirmado', dietary: 'Sem restrições' },
  { id: 'g3', name: 'Carolina Mendes', group: 'Família do noivo', guests: 1, rsvp: 'Confirmado', dietary: 'Sem glúten' },
  { id: 'g4', name: 'Daniel Ferreira', group: 'Trabalho', guests: 1, rsvp: 'Aguardando', dietary: 'Sem restrições' },
  { id: 'g5', name: 'Eduarda e família', group: 'Família da noiva', guests: 3, rsvp: 'Confirmado', dietary: '2 vegetarianos' },
]

function EventStaffPanel({ notify }) {
  const [checkins, setCheckins] = usePersistentState('demo-staff-checkins', [])
  const [walkIns, setWalkIns] = usePersistentState('demo-staff-walkins', [])
  const [query, setQuery] = useState('')
  const [walkInName, setWalkInName] = useState('')
  const [walkInParty, setWalkInParty] = useState('1')
  const [printMode, setPrintMode] = useState('')
  const visibleGuests = STAFF_GUESTS.filter((guest) => `${guest.name} ${guest.group}`.toLowerCase().includes(query.toLowerCase()))
  const peopleCount = STAFF_GUESTS.filter((guest) => guest.rsvp === 'Confirmado').reduce((total, guest) => total + guest.guests, 0) + walkIns.reduce((total, guest) => total + guest.party, 0)
  const printReport = (mode) => { setPrintMode(mode); window.setTimeout(() => { window.print(); setPrintMode('') }, 120) }
  const addWalkIn = (event) => { event.preventDefault(); const name = walkInName.trim(); const party = Number(walkInParty); if (!name || !Number.isInteger(party) || party < 1) return; setWalkIns((current) => [...current, { id: crypto.randomUUID(), name, party }]); setWalkInName(''); setWalkInParty('1'); notify('Entrada de última hora incluída no total do buffet') }
  return <RoleFrame icon={ListChecks} eyebrow="EQUIPE DO EVENTO" title="Lista do evento, com acesso controlado." description="Acesso de demonstração ao casamento Elisa & Tomás · Recepção. A equipe vê somente as informações necessárias para este evento." className={`staff-print-${printMode}`}>
    <div className="role-stat-grid"><div className="role-stat"><span>Confirmados neste evento</span><strong>{STAFF_GUESTS.filter((guest) => guest.rsvp === 'Confirmado').length}</strong></div><div className="role-stat"><span>Pessoas previstas no buffet</span><strong>{peopleCount}</strong></div><div className="role-stat"><span>Entradas registradas</span><strong>{checkins.length + walkIns.reduce((total, guest) => total + guest.party, 0)}</strong></div></div>
    <section className="role-card staff-list-card print-list"><div className="role-card-heading"><div><span className="eyebrow">18 SET 2027 · 16H</span><h2>Lista de entrada</h2></div><button className="button-outline print-button" onClick={() => printReport('list')}><Printer size={15} /> Exportar PDF</button></div><label className="search-field"><Search size={15} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar nome ou grupo" /></label><div className="staff-guest-list">{visibleGuests.map((guest) => <div className="staff-guest-row" key={guest.id}><div className="staff-guest-copy"><strong>{guest.name}</strong><small>{guest.group} · {guest.guests} {guest.guests === 1 ? 'pessoa' : 'pessoas'} · {guest.dietary}</small></div><button className={`checkin-toggle ${checkins.includes(guest.id) ? 'arrived' : ''}`} onClick={() => { setCheckins((current) => current.includes(guest.id) ? current.filter((id) => id !== guest.id) : [...current, guest.id]); notify('Entrada atualizada na demonstração') }}>{checkins.includes(guest.id) ? 'Entrada registrada' : 'Registrar entrada'}</button></div>)}</div>{walkIns.map((guest) => <div className="staff-guest-row walkin-entry" key={guest.id}><div className="staff-guest-copy"><strong>{guest.name} <span>Entrada manual</span></strong><small>Incluído agora · {guest.party} {guest.party === 1 ? 'pessoa' : 'pessoas'}</small></div><span className="status-pill confirmed"><i /> Buffet atualizado</span></div>)}</section>
    <section className="role-card walkin-staff-card"><div><span className="eyebrow">CHEGADA SEM QR CODE</span><h2>Adicionar convidado de última hora</h2><p>O total de pessoas é atualizado para o buffet.</p></div><form className="walkin-form staff-walkin-form" onSubmit={addWalkIn}><label>Nome<input value={walkInName} onChange={(event) => setWalkInName(event.target.value)} required placeholder="Nome completo" /></label><label>Pessoas<input type="number" min="1" max="20" value={walkInParty} onChange={(event) => setWalkInParty(event.target.value)} required /></label><button className="button-primary" type="submit">Adicionar <Check size={15} /></button></form><button className="button-outline print-button print-site-button" onClick={() => printReport('mockups')}><Printer size={15} /> Exportar mockups do site em PDF</button></section>
    <section className="print-mockups"><span className="eyebrow">ELISA & TOMÁS · ESTUDOS VISUAIS</span><h2>Opções de identidade para o site</h2><p>Pranchas de referência geradas a partir dos temas implementáveis no projeto.</p><div className="mockup-print-grid">{THEMES.map((theme) => <article key={theme.id} className={`mockup-print-card mockup-print-${theme.id}`}><span>e<span>&</span>t</span><h3>Elisa & Tomás</h3><p>18 de setembro de 2027</p><small>{theme.name} · {theme.note}</small><div>{theme.colors.map((color) => <i key={color} style={{ background: color }} />)}</div></article>)}</div></section>
  </RoleFrame>
}

const DEMO_WEDDINGS = [
  { id: 'w1', couple: 'Elisa & Tomás', slug: 'elisa-e-tomas', status: 'Ativo', guests: 128, updated: 'Hoje, 10:42' },
  { id: 'w2', couple: 'Marina & Rafael', slug: 'marina-e-rafael', status: 'Em configuração', guests: 0, updated: 'Ontem, 16:18' },
  { id: 'w3', couple: 'Lívia & Pedro', slug: 'livia-e-pedro', status: 'Suspenso', guests: 94, updated: '10 out, 12:05' },
]

const DEMO_ACCOUNTS = [
  { id: 'a1', name: 'Henrique Souza', email: 'henrique@exemplo.test', role: 'Superadmin', status: 'Ativa' },
  { id: 'a2', name: 'Elisa Martins', email: 'elisa@exemplo.test', role: 'Noivos · administradora', status: 'Ativa' },
  { id: 'a3', name: 'Tomás Almeida', email: 'tomas@exemplo.test', role: 'Noivos · administrador', status: 'Ativa' },
  { id: 'a4', name: 'Equipe do evento', email: 'equipe@exemplo.test', role: 'Equipe · recepção', status: 'Pendente' },
]

function SuperAdminPanel({ notify }) {
  const [weddings, setWeddings] = usePersistentState('demo-superadmin-weddings', DEMO_WEDDINGS)
  const [accounts, setAccounts] = usePersistentState('demo-superadmin-accounts', DEMO_ACCOUNTS)
  const [fees, setFees] = usePersistentState('demo-superadmin-fees', { enabled: false, rate: '0', min: '0', max: '0', paidBy: 'couple' })
  const [purgeTarget, setPurgeTarget] = useState('')
  const [purgePhrase, setPurgePhrase] = useState('')
  const [audit, setAudit] = usePersistentState('demo-superadmin-audit', [])
  const activeCount = weddings.filter((wedding) => wedding.status === 'Ativo').length
  const logAction = (action, couple) => setAudit((current) => [{ id: crypto.randomUUID(), action, couple, at: new Date().toLocaleString('pt-BR') }, ...current].slice(0, 8))
  const changeStatus = (wedding) => { const nextStatus = wedding.status === 'Ativo' ? 'Suspenso' : 'Ativo'; setWeddings((current) => current.map((item) => item.id === wedding.id ? { ...item, status: nextStatus } : item)); logAction(`Status alterado para ${nextStatus}`, wedding.couple); notify(`Casamento ${nextStatus.toLowerCase()} na demonstração`) }
  const changeAccountStatus = (account) => { const nextStatus = account.status === 'Ativa' ? 'Suspensa' : 'Ativa'; setAccounts((current) => current.map((item) => item.id === account.id ? { ...item, status: nextStatus } : item)); logAction(`Conta ${nextStatus.toLowerCase()}`, account.name); notify(`Conta ${nextStatus.toLowerCase()} na demonstração`) }
  const saveFees = (event) => { event.preventDefault(); setFees((current) => ({ ...current, savedAt: new Date().toISOString() })); notify(fees.enabled ? 'Política de taxas salva na demonstração' : 'Configuração sem taxas salva na demonstração') }
  const purgePersonalData = () => { const wedding = weddings.find((item) => item.id === purgeTarget); if (!wedding || purgePhrase !== 'ANONIMIZAR') return; setWeddings((current) => current.map((item) => item.id === wedding.id ? { ...item, guests: 0, status: 'Dados anonimizados' } : item)); logAction('Dados pessoais anonimizados; financeiro e auditoria preservados', wedding.couple); setPurgeTarget(''); setPurgePhrase(''); notify('Dados pessoais anonimizados; registros financeiros e de auditoria preservados') }
  return <RoleFrame icon={Shield} eyebrow="CONTROLE DA PLATAFORMA" title="Visão global, com trilha de auditoria." description="Administre casamentos, acessos e política de taxas. Toda ação real exigirá autenticação reforçada e registro no servidor.">
    <div className="role-stat-grid"><div className="role-stat"><span>Casamentos ativos</span><strong>{activeCount}</strong></div><div className="role-stat"><span>Contas cadastradas</span><strong>342</strong></div><div className="role-stat"><span>Política da plataforma</span><strong>{fees.enabled ? `${fees.rate}%` : 'Sem taxas'}</strong></div></div>
    <section className="role-card superadmin-card"><div className="role-card-heading"><div><span className="eyebrow">CONTAS E SITES</span><h2>Casamentos cadastrados</h2></div><button className="button-outline" onClick={() => notify('Relatório global demonstrativo')}><Printer size={15} /> Exportar visão geral</button></div><div className="superadmin-table-wrap"><table className="superadmin-table"><thead><tr><th>CASAL</th><th>SUBDOMÍNIO</th><th>CONVIDADOS</th><th>STATUS</th><th>AÇÕES</th></tr></thead><tbody>{weddings.map((wedding) => <tr key={wedding.id}><td><strong>{wedding.couple}</strong><small>Atualizado {wedding.updated}</small></td><td>{wedding.slug}</td><td>{wedding.guests}</td><td><span className={`admin-state ${wedding.status === 'Ativo' ? 'admin-state-active' : ''}`}>{wedding.status}</span></td><td><div className="admin-row-actions"><button onClick={() => changeStatus(wedding)}>{wedding.status === 'Ativo' ? 'Suspender' : 'Ativar'}</button><button onClick={() => setPurgeTarget(wedding.id)}><Trash2 size={14} /> Anonimizar dados</button></div></td></tr>)}</tbody></table></div>{purgeTarget && <div className="purge-confirm"><div><span className="eyebrow">CONFIRMAÇÃO DE DADOS</span><p>Dados pessoais dos convidados serão removidos. Financeiro e auditoria serão preservados.</p></div><label>Digite ANONIMIZAR<input value={purgePhrase} onChange={(event) => setPurgePhrase(event.target.value)} /></label><div className="admin-row-actions"><button onClick={() => { setPurgeTarget(''); setPurgePhrase('') }}>Cancelar</button><button disabled={purgePhrase !== 'ANONIMIZAR'} onClick={purgePersonalData}>Confirmar anonimização</button></div></div>}</section>
    <section className="role-card superadmin-card"><div className="role-card-heading"><div><span className="eyebrow">ACESSO À PLATAFORMA</span><h2>Contas cadastradas</h2></div><span className="task-count">{accounts.length} contas na demonstração</span></div><div className="superadmin-table-wrap"><table className="superadmin-table accounts-table"><thead><tr><th>NOME</th><th>E-MAIL</th><th>PERFIL</th><th>STATUS</th><th>AÇÃO</th></tr></thead><tbody>{accounts.map((account) => <tr key={account.id}><td><strong>{account.name}</strong></td><td>{account.email}</td><td>{account.role}</td><td><span className={`admin-state ${account.status === 'Ativa' ? 'admin-state-active' : ''}`}>{account.status}</span></td><td><button className="account-status-action" onClick={() => changeAccountStatus(account)}>{account.status === 'Ativa' ? 'Suspender' : 'Ativar'}</button></td></tr>)}</tbody></table></div></section>
    <section className="role-card fee-admin-card"><div className="role-card-heading"><div><span className="eyebrow">REGRAS COMERCIAIS</span><h2>Taxas por presente</h2></div><span className={`fee-switch-label ${fees.enabled ? 'fee-active' : ''}`}>{fees.enabled ? 'Taxa ativada' : 'Sem taxas'}</span></div><form className="fee-form" onSubmit={saveFees}><label className="fee-toggle"><input type="checkbox" checked={fees.enabled} onChange={(event) => setFees((current) => ({ ...current, enabled: event.target.checked }))} /><span>Ativar taxa para presentes</span></label><div className="fee-fields"><label>Percentual (%)<input type="number" min="0" max="100" step="0.1" value={fees.rate} onChange={(event) => setFees((current) => ({ ...current, rate: event.target.value }))} disabled={!fees.enabled} /></label><label>Mínimo (R$)<input type="number" min="0" step="0.01" value={fees.min} onChange={(event) => setFees((current) => ({ ...current, min: event.target.value }))} disabled={!fees.enabled} /></label><label>Máximo (R$)<input type="number" min="0" step="0.01" value={fees.max} onChange={(event) => setFees((current) => ({ ...current, max: event.target.value }))} disabled={!fees.enabled} /></label><label>Quem paga<select value={fees.paidBy} onChange={(event) => setFees((current) => ({ ...current, paidBy: event.target.value }))} disabled={!fees.enabled}><option value="couple">Noivos</option><option value="guest">Convidado</option></select></label></div><div className="fee-form-footer"><p>Alterações reais serão gravadas no D1 e aplicadas somente após confirmação e registro de auditoria.</p><button className="button-primary" type="submit">Salvar política <Check size={15} /></button></div></form></section>
    <section className="role-card audit-card"><div className="role-card-heading"><div><span className="eyebrow">SEGURANÇA</span><h2>Atividade administrativa</h2></div><span><LockKeyhole size={15} /> Registro imutável</span></div>{audit.length ? <div className="audit-list">{audit.map((item) => <div key={item.id}><span>{item.action}</span><strong>{item.couple}</strong><small>{item.at}</small></div>)}</div> : <p className="buffet-empty">As ações administrativas de demonstração aparecerão aqui.</p>}</section>
    <div className="admin-security-note"><Shield size={16} /><span>O painel real usará senha e TOTP. Remoção de dados exigirá nova autenticação, frase de confirmação e preservará ledger financeiro e auditoria.</span></div>
  </RoleFrame>
}

function usePersistentState(key, initialValue) {
  const [value, setValue] = useState(() => {
    try { const saved = localStorage.getItem(key); return saved ? JSON.parse(saved) : initialValue } catch { return initialValue }
  })
  useEffect(() => { try { localStorage.setItem(key, JSON.stringify(value)) } catch { return undefined } }, [key, value])
  return [value, setValue]
}

function CheckIn({ notify }) {
  const [checkedIn, setCheckedIn] = useState(false)
  const [walkIns, setWalkIns] = useState(() => {
    try { return JSON.parse(localStorage.getItem('wedding-walk-ins') || '[]') } catch { return [] }
  })
  const [name, setName] = useState('')
  const [partySize, setPartySize] = useState('1')
  const [dietary, setDietary] = useState('')

  useEffect(() => { localStorage.setItem('wedding-walk-ins', JSON.stringify(walkIns)) }, [walkIns])

  const addWalkIn = (event) => {
    event.preventDefault()
    const cleanName = name.trim()
    const count = Number(partySize)
    if (!cleanName || !Number.isInteger(count) || count < 1) return
    setWalkIns((current) => [{ id: crypto.randomUUID(), name: cleanName, partySize: count, dietary: dietary.trim(), createdAt: new Date().toISOString() }, ...current])
    setName('')
    setPartySize('1')
    setDietary('')
    notify('Entrada manual registrada e incluída na lista do buffet')
  }

  const exportBuffetList = () => {
    const rows = [['Nome do convidado', 'Pessoas', 'Restrição alimentar'], ...walkIns.map((guest) => [guest.name, guest.partySize, guest.dietary || 'Nenhuma informada'])]
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(';')).join('\n')
    const url = URL.createObjectURL(new Blob(['\ufeff', csv], { type: 'text/csv;charset=utf-8' }))
    const link = document.createElement('a')
    link.href = url
    link.download = 'lista-do-buffet.csv'
    link.click()
    URL.revokeObjectURL(url)
    notify('Lista do buffet exportada')
  }

  const buffetCount = walkIns.reduce((total, guest) => total + guest.partySize, 0)
  return <div className="checkin-page"><div className="checkin-top"><a href="#entrada" className="checkin-brand"><span>e<span>&</span>t</span><div><strong>Entrada do evento</strong><small>Elisa & Tomás · demonstração local</small></div></a><span className="checkin-demo-tag">PRÉVIA INTERATIVA</span></div><div className="checkin-content"><div className="checkin-heading"><span className="eyebrow">MODO EQUIPE</span><h1>Uma chegada<br />tranquila começa aqui.</h1><p>Registre a entrada pelo convite ou inclua alguém que chegou de última hora. As entradas manuais compõem a lista do buffet.</p></div><div className="scanner-card"><div className="scanner-topline"><span><i /> LEITOR DE CONVITES</span><span>18 SET 2027</span></div><div className="scanner-view"><div className="scanner-frame"><i /><i /><i /><i /><span className="scanner-line" /><QrCode size={48} strokeWidth={1} /></div><span className="scanner-caption">Leitor de QR ilustrativo nesta prévia</span></div><div className="scanner-bottom"><span><span className="connection-indicator" /> Dados de demonstração salvos neste dispositivo</span><span>1.248 convites preparados</span></div></div><div className={`checkin-result ${checkedIn ? 'checked-in' : ''}`}><span className="guest-avatar guest-avatar-1">A</span><div><span className="eyebrow">CONVIDADA DE EXEMPLO</span><strong>Ana Beatriz Costa</strong><small>Convite para 2 pessoas · Família da noiva</small></div><span className={`status-pill ${checkedIn ? 'confirmed' : 'waiting'}`}><i />{checkedIn ? 'Entrada registrada' : 'Ainda não entrou'}</span></div><button className="button-primary checkin-action" onClick={() => { setCheckedIn(!checkedIn); notify(checkedIn ? 'Entrada de demonstração desfeita' : 'Entrada de demonstração registrada') }}>{checkedIn ? 'Desfazer entrada de exemplo' : 'Registrar entrada de exemplo'} <Check size={16} /></button>
    <section className="walkin-card"><div className="walkin-heading"><div><span className="eyebrow">CONVIDADO DE ÚLTIMA HORA</span><h2>Adicionar entrada manual</h2></div><span className="walkin-count">{buffetCount} {buffetCount === 1 ? 'pessoa' : 'pessoas'} no buffet</span></div><form className="walkin-form" onSubmit={addWalkIn}><label>Nome do convidado<input value={name} onChange={(event) => setName(event.target.value)} placeholder="Ex.: Marina Oliveira" required /></label><label>Número de pessoas<input type="number" min="1" max="20" value={partySize} onChange={(event) => setPartySize(event.target.value)} required /></label><label className="walkin-dietary">Restrição alimentar ou observação<input value={dietary} onChange={(event) => setDietary(event.target.value)} placeholder="Opcional · ex.: vegetariano" /></label><button className="button-primary" type="submit">Registrar e incluir no buffet <Check size={15} /></button></form><div className="buffet-heading"><strong>Lista para o buffet</strong><button type="button" className="buffet-export" onClick={exportBuffetList} disabled={!walkIns.length}>Exportar CSV</button></div>{walkIns.length ? <div className="buffet-list">{walkIns.map((guest) => <div className="buffet-row" key={guest.id}><span className="guest-avatar">{guest.name.charAt(0).toUpperCase()}</span><div><strong>{guest.name}</strong><small>{guest.dietary || 'Sem observação alimentar'}</small></div><span>{guest.partySize} {guest.partySize === 1 ? 'pessoa' : 'pessoas'}</span></div>)}</div> : <p className="buffet-empty">As entradas manuais aparecerão aqui e serão somadas para o buffet.</p>}</section>
    <div className="checkin-footnote"><CircleHelp size={15} /> A câmera, os convites e a sincronização com o banco ainda não estão conectados; esta prévia salva entradas localmente neste navegador.</div></div><footer className="checkin-footer"><span>e<span>&</span>t · ferramenta de entrada</span><a href="https://henriquesouzas.com" target="_blank" rel="noreferrer">henriquesouzas.com</a></footer></div>
}
export default App

