import './styles.css'
import { useEffect, useRef, useState } from 'react'
import QRCode from 'qrcode'
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Bell,
  CalendarDays,
  Camera,
  Check,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  Copy,
  Download,
  Eye,
  EyeOff,
  ExternalLink,
  Gift,
  GripVertical,
  Heart,
  House,
  Image,
  ListChecks,
  LockKeyhole,
  Link,
  Mail,
  MapPin,
  Menu,
  Monitor,
  MessageCircle,
  Paintbrush,
  Pencil,
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
  { id: 'tropical', name: 'Festa no jardim', note: 'Cor, música e movimento', colors: ['#637455', '#d38a68', '#f5f3e9'] },
  { id: 'night', name: 'Rock & romance', note: 'Vinho, carvão e cobre', colors: ['#302b31', '#b84b55', '#f1e9e5'] },
]
const THEME_PRESETS = {
  garden: { fontPair: 'Floral delicado', coverLayout: 'arch' },
  editorial: { fontPair: 'Clássico editorial', coverLayout: 'split' },
  minimal: { fontPair: 'Contemporâneo humanista', coverLayout: 'type' },
  floral: { fontPair: 'Floral delicado', coverLayout: 'collage' },
  rustic: { fontPair: 'Rústico acolhedor', coverLayout: 'full' },
  beach: { fontPair: 'Romântico leve', coverLayout: 'split' },
  tropical: { fontPair: 'Contemporâneo humanista', coverLayout: 'collage' },
  night: { fontPair: 'Elegante de alto contraste', coverLayout: 'full' },
}
const PALETTE_NAMES = ['Original', 'Areia', 'Terracota', 'Rosé', 'Oliva', 'Dourado']
const SITE_COVER_PHOTOS = [{ id: 'wedding-pexels', name: 'Jardim ao entardecer', src: '/images/wedding-pexels.webp', credit: 'Kanishka M Gunathunga · Pexels' }, { id: 'wedding-moments', name: 'Caminhada entre árvores', src: '/images/wedding-moments.webp', credit: 'Jonathan Borba · Pexels' }]
function getThemePalettes(theme) {
  return [theme.colors, [theme.colors[0], '#d2b994', '#fbf8f1'], [theme.colors[0], '#bf8b67', '#f6ece2'], [theme.colors[0], '#d08e91', '#f5ebec'], [theme.colors[0], '#9d9c70', '#f1efe3'], [theme.colors[0], '#d7b862', '#faf5dd']]
}
const SITE_SECTIONS = ['Nossa história', 'Linha do tempo', 'Eventos', 'Cronograma', 'Dress code', 'Padrinhos e madrinhas', 'Lista de presentes', 'Confirmação de presença', 'Galeria de fotos', 'Mural de recados', 'Hospedagem e dicas', 'Perguntas frequentes', 'Playlist', 'Vídeo', 'Contato', 'Quiz dos noivos']
const SITE_FONT_PAIRS = {
  'Clássico editorial': ['Georgia, "Times New Roman", serif', 'Arial, sans-serif'],
  'Romântico leve': ['"Palatino Linotype", "Book Antiqua", Palatino, serif', '"Trebuchet MS", Arial, sans-serif'],
  'Moderno sem serifa': ['Arial, "Helvetica Neue", sans-serif', 'Arial, "Helvetica Neue", sans-serif'],
  'Elegante de alto contraste': ['"Bodoni MT", Didot, Georgia, serif', '"Helvetica Neue", Arial, sans-serif'],
  'Contemporâneo humanista': ['"Gill Sans", "Trebuchet MS", sans-serif', '"Gill Sans", "Trebuchet MS", sans-serif'],
  'Floral delicado': ['"Palatino Linotype", Palatino, serif', '"Trebuchet MS", Arial, sans-serif'],
  'Minimalista geométrico': ['"Century Gothic", Futura, Arial, sans-serif', '"Century Gothic", Futura, Arial, sans-serif'],
  'Rústico acolhedor': ['Georgia, "Times New Roman", serif', 'Verdana, Arial, sans-serif'],
}
const DEFAULT_SITE_CONFIG = { theme: 'garden', paletteIndex: 0, coverLayout: 'full', coverImage: 'wedding-pexels', fontScale: 'medium', enabledSections: ['Nossa história', 'Eventos', 'Confirmação de presença'], animationPreset: 'Elegante', fontPair: 'Clássico editorial', language: 'pt-BR', coverMessages: { 'pt-BR': 'Com alegria, convidamos você.', en: 'With joy, we invite you.', es: 'Con alegría, te invitamos.' }, storyMessages: { 'pt-BR': '', en: '', es: '' }, sectionContent: {}, weddingDetails: { schedule: '', menu: '', dressCode: '' }, guestCamera: { enabled: false, photoLimit: 5 } }

const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY || '0x4AAAAAAFZgkIUFzXNjKhsH'
let turnstileScriptPromise

function loadTurnstileScript() {
  if (window.turnstile) return Promise.resolve()
  if (turnstileScriptPromise) return turnstileScriptPromise
  turnstileScriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
    script.async = true
    script.defer = true
    script.onload = resolve
    script.onerror = () => {
      turnstileScriptPromise = null
      reject(new Error('turnstile_script_unavailable'))
    }
    document.head.append(script)
  })
  return turnstileScriptPromise
}

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

function parseGuestCsv(source) {
  const text = source.replace(/^\uFEFF/, '')
  const firstLine = text.split(/\r?\n/, 1)[0] || ''
  let commaCount = 0
  let semicolonCount = 0
  let quoted = false
  for (let index = 0; index < firstLine.length; index += 1) {
    if (firstLine[index] === '"' && firstLine[index + 1] === '"' && quoted) index += 1
    else if (firstLine[index] === '"') quoted = !quoted
    else if (!quoted && firstLine[index] === ',') commaCount += 1
    else if (!quoted && firstLine[index] === ';') semicolonCount += 1
  }
  const delimiter = semicolonCount > commaCount ? ';' : ','
  const records = []
  let row = []
  let field = ''
  quoted = false
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index]
    if (character === '"' && quoted && text[index + 1] === '"') {
      field += '"'
      index += 1
    } else if (character === '"') {
      quoted = !quoted
    } else if (!quoted && character === delimiter) {
      row.push(field)
      field = ''
    } else if (!quoted && (character === '\n' || character === '\r')) {
      if (character === '\r' && text[index + 1] === '\n') index += 1
      row.push(field)
      if (row.some((value) => value.trim())) records.push(row)
      row = []
      field = ''
    } else {
      field += character
    }
  }
  if (quoted) throw new Error('O CSV contém aspas sem fechamento.')
  row.push(field)
  if (row.some((value) => value.trim())) records.push(row)
  if (records.length < 2) throw new Error('O CSV precisa ter um cabeçalho e ao menos um convidado.')
  const normalizeHeader = (value) => value.trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')
  const headers = records[0].map(normalizeHeader)
  const columns = {
    name: ['nome', 'name'],
    email: ['email', 'e_mail'],
    phone: ['telefone', 'phone', 'celular'],
    groupName: ['grupo', 'group', 'group_name'],
    partySize: ['pessoas', 'party_size', 'acompanhantes'],
    guestType: ['perfil', 'tipo', 'guest_type'],
    dietaryNotes: ['restricao_alimentar', 'restricoes_alimentares', 'dietary_notes'],
  }
  const indexes = Object.fromEntries(Object.entries(columns).map(([key, aliases]) => [key, headers.findIndex((header) => aliases.includes(header))]))
  if (indexes.name < 0) throw new Error('Inclua uma coluna nome ou name no cabeçalho.')
  return records.slice(1).map((record) => {
    const read = (key) => indexes[key] < 0 ? '' : record[indexes[key]]?.trim() || ''
    const profile = read('guestType').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    const count = read('partySize')
    return {
      name: read('name'),
      email: read('email'),
      phone: read('phone'),
      groupName: read('groupName'),
      partySize: count ? Number(count) : 1,
      guestType: profile.includes('padr') || profile === 'godparent' ? 'godparent' : profile && !['convidado', 'guest'].includes(profile) ? profile : 'guest',
      dietaryNotes: read('dietaryNotes'),
    }
  })
}

function csvCell(value) {
  const source = String(value ?? '')
  const text = /^(?:\s|\uFEFF)*[=+\-@]/.test(source) || /^[\t\r\n]/.test(source) ? `'${source}` : source
  return `"${text.replace(/"/g, '""')}"`
}

async function requestWithRecentMfa(request, path, options) {
  try {
    return await request(path, options)
  } catch (cause) {
    if (cause.message !== 'recent_mfa_required') throw cause
    const code = window.prompt('Confirme a opera\u00e7\u00e3o com o c\u00f3digo de seis d\u00edgitos do autenticador.')
    if (!code) throw new Error('mfa_reauthentication_cancelled')
    await request('/api/auth/mfa/reauth', { method: 'POST', body: JSON.stringify({ code }) })
    return request(path, options)
  }
}

function parseBrlCents(value) {
  const source = String(value ?? '').trim()
  const normalized = source.includes(',') ? source.replace(/\./g, '').replace(',', '.') : source
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return null
  const [reais, cents = ''] = normalized.split('.')
  const total = Number(reais) * 100 + Number(cents.padEnd(2, '0'))
  return Number.isSafeInteger(total) ? total : null
}

function formatBrlCents(value) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value / 100)
}

function openCheckinStore() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('wedding-checkin', 2)
    request.onupgradeneeded = () => {
      const database = request.result
      if (!database.objectStoreNames.contains('rosters')) database.createObjectStore('rosters', { keyPath: 'eventId' })
      if (!database.objectStoreNames.contains('entries')) {
        const entries = database.createObjectStore('entries', { keyPath: 'id' })
        entries.createIndex('eventId', 'eventId')
      }
      if (!database.objectStoreNames.contains('staff')) database.createObjectStore('staff', { keyPath: 'id' })
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

async function deleteOfflineRecord(storeName, id) {
  const database = await openCheckinStore()
  await new Promise((resolve, reject) => {
    const transaction = database.transaction(storeName, 'readwrite')
    transaction.objectStore(storeName).delete(id)
    transaction.oncomplete = resolve
    transaction.onerror = () => reject(transaction.error)
  })
  database.close()
}

async function storeOfflineRoster(eventId, guests, walkIns) {
  const database = await openCheckinStore()
  await new Promise((resolve, reject) => {
    const transaction = database.transaction('rosters', 'readwrite')
    transaction.objectStore('rosters').put({ eventId, guests, walkIns, savedAt: Date.now() })
    transaction.oncomplete = resolve
    transaction.onerror = () => reject(transaction.error)
  })
  database.close()
}

async function readOfflineRoster(eventId) {
  const database = await openCheckinStore()
  const result = await new Promise((resolve, reject) => {
    const request = database.transaction('rosters').objectStore('rosters').get(eventId)
    request.onsuccess = () => resolve(request.result || null)
    request.onerror = () => reject(request.error)
  })
  database.close()
  if (!result) return null
  if (Date.now() - result.savedAt > 7 * 24 * 60 * 60 * 1000) {
    await deleteOfflineRecord('rosters', eventId)
    return null
  }
  return result
}

async function storeOfflineEvents(events) {
  const database = await openCheckinStore()
  await new Promise((resolve, reject) => {
    const transaction = database.transaction('staff', 'readwrite')
    transaction.objectStore('staff').put({ id: 'event-list', events, savedAt: Date.now() })
    transaction.oncomplete = resolve
    transaction.onerror = () => reject(transaction.error)
  })
  database.close()
}

async function readOfflineEvents() {
  const database = await openCheckinStore()
  const result = await new Promise((resolve, reject) => {
    const request = database.transaction('staff').objectStore('staff').get('event-list')
    request.onsuccess = () => resolve(request.result || null)
    request.onerror = () => reject(request.error)
  })
  database.close()
  if (!result) return null
  if (Date.now() - result.savedAt > 7 * 24 * 60 * 60 * 1000) {
    await deleteOfflineRecord('staff', 'event-list')
    return null
  }
  return result
}

async function storeOfflineCheckin(entry) {
  const database = await openCheckinStore()
  await new Promise((resolve, reject) => {
    const transaction = database.transaction('entries', 'readwrite')
    transaction.objectStore('entries').put(entry)
    transaction.oncomplete = resolve
    transaction.onerror = () => reject(transaction.error)
  })
  database.close()
}

async function readOfflineCheckins(eventId) {
  const database = await openCheckinStore()
  const result = await new Promise((resolve, reject) => {
    const request = database.transaction('entries').objectStore('entries').index('eventId').getAll(eventId)
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
  database.close()
  return result
}

async function readAllOfflineCheckins() {
  const database = await openCheckinStore()
  const result = await new Promise((resolve, reject) => {
    const request = database.transaction('entries').objectStore('entries').getAll()
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
  database.close()
  return result
}

function clearOfflineCheckinData() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.deleteDatabase('wedding-checkin')
    request.onsuccess = resolve
    request.onerror = () => reject(request.error)
    request.onblocked = () => reject(new Error('offline_data_in_use'))
  })
}

async function removeOfflineCheckins(ids) {
  if (!ids.length) return
  const database = await openCheckinStore()
  await new Promise((resolve, reject) => {
    const transaction = database.transaction('entries', 'readwrite')
    ids.forEach((id) => transaction.objectStore('entries').delete(id))
    transaction.oncomplete = resolve
    transaction.onerror = () => reject(transaction.error)
  })
  database.close()
}

async function hashInvitationToken(token) {
  const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token)))
  let binary = ''
  digest.forEach((byte) => { binary += String.fromCharCode(byte) })
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

function App() {
  const [view, setView] = useState(resolveCurrentView)
  const [theme, setTheme] = useState('garden')
  const [adminPage, setAdminPage] = useState('overview')
  const [toast, setToast] = useState('')

  function notify(message) {
    setToast(message)
    window.setTimeout(() => setToast(''), 2400)
  }

  function navigateView(nextView) {
    const paths = { guest: '/', dashboard: '/painel', 'guest-portal': '/convidado', godparent: '/padrinhos', 'event-staff': '/equipe', superadmin: '/superadmin', checkin: '/pre-entrada' }
    const path = paths[nextView]
    const keepInvitation = ['guest-portal', 'godparent'].includes(nextView) && window.location.hash.startsWith('#convite/')
    if (path) window.history.pushState({}, '', `${path}${keepInvitation ? window.location.hash : ''}`)
    setView(nextView)
  }

  useEffect(() => {
    const syncView = () => setView(resolveCurrentView())
    window.addEventListener('popstate', syncView)
    return () => window.removeEventListener('popstate', syncView)
  }, [])

  return (
    <main className={`app-shell theme-${theme}`}>
      {import.meta.env.DEV && <div className="prototype-bar">
        <div className="prototype-label"><span className="prototype-dot" /> ESTUDO VISUAL <span className="prototype-divider">/</span> Plataforma de casamento</div>
        <div className="prototype-switch" role="group" aria-label="Demonstrações do mockup">
          <button aria-pressed={view === 'guest'} className={view === 'guest' ? 'selected' : ''} onClick={() => navigateView('guest')}><Heart size={15} /> Site do casal</button>
          <button aria-pressed={view === 'dashboard'} className={view === 'dashboard' ? 'selected' : ''} onClick={() => window.location.assign('/painel')}><Settings2 size={15} /> Painel dos noivos</button>
          <button aria-pressed={view === 'guest-portal'} className={view === 'guest-portal' ? 'selected' : ''} onClick={() => navigateView('guest-portal')}><UserRound size={15} /> Convidado</button>
          <button aria-pressed={view === 'godparent'} className={view === 'godparent' ? 'selected' : ''} onClick={() => navigateView('godparent')}><Heart size={15} /> Padrinhos</button>
          <button aria-pressed={view === 'event-staff'} className={view === 'event-staff' ? 'selected' : ''} onClick={() => navigateView('event-staff')}><ListChecks size={15} /> Equipe de entrada</button>
          <button aria-pressed={view === 'superadmin'} className={view === 'superadmin' ? 'selected' : ''} onClick={() => window.location.assign('/superadmin')}><Shield size={15} /> Superadmin</button>
          <button aria-pressed={view === 'checkin'} className={view === 'checkin' ? 'selected' : ''} onClick={() => navigateView('checkin')}><QrCode size={15} /> Prévia da entrada</button>
        </div>
        <span className="prototype-badge">Demonstração</span>
      </div>}

      {view === 'guest' && import.meta.env.DEV && <GuestSite theme={theme} setTheme={setTheme} notify={notify} />}
      {view === 'dashboard' && <CouplePanel notify={notify} />}
      {view === 'public-customizer' && <PublicSiteCustomizer />}
      {view === 'help-center' && <HelpCenter />}
      {view === 'couple-signup' && <CoupleSignup />}
      {view === 'email-confirmation' && <CoupleEmailConfirmation />}
      {view === 'password-reset-request' && <PasswordResetRequest />}
      {view === 'password-reset' && <PasswordReset />}
      {view === 'team-invitation' && <TeamInvitationAcceptance />}
      {view === 'dashboard-preview' && <Dashboard theme={theme} setTheme={setTheme} page={adminPage} setPage={setAdminPage} notify={notify} demo />}
      {view === 'guest-portal' && <GuestPortal notify={notify} setView={navigateView} />}
      {view === 'godparent' && <GodparentPortal notify={notify} />}
      {view === 'event-staff' && <EventStaffPanel notify={notify} />}
      {view === 'superadmin' && <SuperAdminPanel notify={notify} />}
      {view === 'checkin' && <CheckIn notify={notify} />}
      {toast && <div className="toast" role="status"><Check size={16} /> {toast}</div>}
    </main>
  )
}

function resolveCurrentView() {
  const path = window.location.pathname
  if (path === '/superadmin' || path.startsWith('/superadmin/')) return 'superadmin'
  if (path === '/cadastro') return 'couple-signup'
  if (path === '/criar-site') return 'public-customizer'
  if (path === '/ajuda') return 'help-center'
  if (path === '/painel/demo') return 'dashboard-preview'
  if (path === '/confirmar-email' || window.location.hash.startsWith('#confirmar-email/')) return 'email-confirmation'
  if (path === '/recuperar-senha') return 'password-reset-request'
  if (path === '/redefinir-senha' || window.location.hash.startsWith('#redefinir-senha/')) return 'password-reset'
  if (path === '/painel') return 'dashboard'
  if (path === '/equipe' || path === '/entrada') return 'event-staff'
  if (path === '/convidado' || path === '/convidados') return 'guest-portal'
  if (path === '/padrinho' || path === '/padrinhos') return 'godparent'
  if (path === '/pre-entrada') return import.meta.env.DEV ? 'checkin' : 'event-staff'
  if (window.location.hash.startsWith('#aceitar-equipe/')) return 'team-invitation'
  if (window.location.hash.startsWith('#convite/')) return 'guest-portal'
  return 'guest'
}

function HelpCenter() {
  return <RoleFrame icon={CircleHelp} eyebrow="AJUDA PARA ORGANIZAR COM CALMA" title="Um passo de cada vez." description="Encontre o próximo passo do convite e saiba quem pode ajudar. As respostas são curtas; os detalhes ficam onde você precisa deles." className="help-center-page" publicPage secureName="Central de ajuda" secureFooter="Ajuda da plataforma" headerAction={<a className="button-outline" href="/">Voltar ao início</a>}>
    <section className="role-card help-center-start"><span className="eyebrow">POR ONDE COMEÇAR</span><h2>Montem primeiro o convite.</h2><p>Escolham um tema, coloquem os nomes e a data. Depois, acrescentem endereço, horário e traje. A prévia acompanha cada mudança.</p><div className="help-center-actions"><a className="button-primary" href="/criar-site">Abrir o personalizador <ArrowRight size={15} /></a><a className="button-outline" href="/painel">Entrar no painel</a></div></section>
    <section className="help-center-topics" aria-label="Ajuda por assunto">
      <details className="role-card"><summary>Como escolher e ajustar um tema</summary><p>O tema define as cores de fundo, os detalhes, os títulos e a composição inicial da capa. Escolham uma opção pela prévia; depois, se quiserem, ajustem a paleta, a fonte e o formato da foto.</p></details>
      <details className="role-card"><summary>O que informar aos convidados</summary><p>Comecem pelo essencial: data, local, horário e confirmação de presença. Traje, paleta, programação, cardápio e dicas para quem vem de longe podem ser adicionados em “Detalhes”.</p></details>
      <details className="role-card"><summary>Como pedir ajuda ao cerimonialista</summary><p>No painel, abram “Equipe e acessos”, informem o e-mail do cerimonialista e escolham “Editor do site e eventos”. Copiem o convite gerado e enviem diretamente. Esse perfil pode editar o site e os eventos; não recebe a lista de convidados nem as áreas financeiras.</p><a className="text-arrow" href="/painel#equipe">Ver equipe e acessos <ArrowRight size={14} /></a></details>
      <details className="role-card"><summary>Como compartilhar o convite</summary><p>Na área de convidados, criem os convites individuais e compartilhem o link ou o QR code correspondente. Cada pessoa acessa apenas os eventos liberados para o seu convite.</p></details>
      <details className="role-card"><summary>Precisa falar com a equipe?</summary><p>Escreva por e-mail ou WhatsApp. Conte em qual etapa está e, se puder, inclua uma captura de tela.</p><div className="help-center-actions"><a className="button-outline" href="mailto:henriquesouza1832001@gmail.com"><Mail size={15} /> Enviar e-mail</a><a className="button-outline" href="https://wa.me/5531988924409" target="_blank" rel="noreferrer"><MessageCircle size={15} /> Abrir WhatsApp</a></div></details>
    </section>
  </RoleFrame>
}

function ThemePicker({ theme, setTheme, compact = false }) {
  return (
    <div className={`theme-picker ${compact ? 'theme-picker-compact' : ''}`} aria-label="Escolha uma opção visual">
      {!compact && <div className="theme-picker-intro"><span className="eyebrow">OITO TEMAS DE PARTIDA</span><span className="theme-picker-caption">A estrutura é a mesma; cores, tipografia e detalhes mudam.</span></div>}
      <div className="theme-options">
        {THEMES.map((item, index) => (
          <button className={`theme-option ${theme === item.id ? 'active' : ''}`} key={item.id} onClick={() => setTheme(item.id)} aria-pressed={theme === item.id}>
            <span className={`theme-option-preview preview-${item.id}`} style={{ '--theme-ink': item.colors[0], '--theme-accent': item.colors[1], '--theme-paper': item.colors[2] }}><img src={SITE_COVER_PHOTOS[index % SITE_COVER_PHOTOS.length].src} alt="" loading="lazy" /><b>Ana <i>&amp;</i> Rafa</b><em /></span>
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
        <button className="mobile-menu-button" onClick={() => setMenuOpen(!menuOpen)} aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'} aria-expanded={menuOpen} aria-controls="guest-navigation">{menuOpen ? <X /> : <Menu />}</button>
        <nav id="guest-navigation" className={menuOpen ? 'nav-links open' : 'nav-links'}>
          <a href="#historia" onClick={() => setMenuOpen(false)}>Nossa história</a>
          <a href="#celebracao" onClick={() => setMenuOpen(false)}>A celebração</a>
          <a href="#presentes" onClick={() => setMenuOpen(false)}>Presentes</a>
          <a href="#presenca" onClick={() => setMenuOpen(false)}>Presença</a>
        </nav>
        <a className="nav-rsvp nav-signup" href="/criar-site">Criar meu site <ArrowRight size={15} /></a>
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
        <div className="story-image-wrap"><img src="/images/wedding-pexels.webp" alt="Casal demonstrativo caminha de mãos dadas por um jardim no dia do casamento" /><div className="story-photo-label">UM DIA, UMA HISTÓRIA, DOIS CAMINHOS</div><div className="story-image-index">01 <span>/</span> 04</div></div>
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
        <div className="gallery-grid"><div className="gallery-main"><img src="/images/wedding-pexels.webp" alt="Noivos sorrindo enquanto caminham por um jardim" /><span>01 — Um dia para lembrar</span></div><div className="gallery-small gallery-warm"><Camera size={25} /><span>02 — Dias de sol</span></div><div className="gallery-small gallery-green"><Heart size={24} /><span>03 — Sempre juntos</span></div></div>
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

function TotpSetupQr({ enrollment }) {
  const [qrCode, setQrCode] = useState('')

  useEffect(() => {
    let active = true
    setQrCode('')
    QRCode.toDataURL(enrollment.uri, { width: 224, margin: 2, errorCorrectionLevel: 'M' }).then((value) => {
      if (active) setQrCode(value)
    }).catch(() => {
      if (active) setQrCode('')
    })
    return () => { active = false }
  }, [enrollment.uri])

  return <div className="totp-setup-qr">
    <p className="admin-mfa-instructions">Escaneie este QR code com Google Authenticator, Microsoft Authenticator ou outro aplicativo compatível.</p>
    {qrCode ? <img src={qrCode} alt="QR code para configurar o autenticador" width="224" height="224" /> : <p className="admin-mfa-instructions">Preparando o QR code…</p>}
    <details><summary>Precisa configurar manualmente?</summary><div><p className="admin-mfa-instructions">Digite esta chave no aplicativo autenticador.</p><code>{enrollment.secret}</code></div></details>
  </div>
}

function AccountMfaSetup({ onComplete }) {
  const [enrollment, setEnrollment] = useState(null)
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    fetch('/api/auth/mfa/enroll', { method: 'POST' }).then(async (response) => {
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'mfa_setup_unavailable')
      setEnrollment(result)
    }).catch(() => setError('Não foi possível iniciar o cadastro do autenticador. Entre novamente e tente outra vez.'))
  }, [])

  async function confirm(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      const response = await fetch('/api/auth/mfa/confirm', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code }) })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'invalid_mfa_code')
      await onComplete()
    } catch (cause) {
      setError(cause.message === 'too_many_attempts' ? 'Muitas tentativas. Aguarde antes de tentar novamente.' : 'Código inválido ou cadastro indisponível. Confira o autenticador e tente novamente.')
    } finally {
      setBusy(false)
    }
  }

  return <form className="role-card admin-login-form" onSubmit={confirm}>{enrollment ? <><TotpSetupQr enrollment={enrollment} /><label>Código de seis dígitos<input inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength="6" value={code} onChange={(event) => setCode(event.target.value)} required /></label></> : <p className="admin-mfa-instructions">Preparando o cadastro do segundo fator…</p>}{error && <p className="admin-form-error" role="alert">{error}</p>}<button className="button-primary" type="submit" disabled={busy || !enrollment}>Ativar segundo fator <Shield size={15} /></button></form>
}

const PUBLIC_SITE_DRAFT_KEY = 'wedding-site-customizer-draft'

function readPublicSiteDraft() {
  try {
    const draft = JSON.parse(window.localStorage.getItem(PUBLIC_SITE_DRAFT_KEY) || '{}')
    return draft && typeof draft === 'object' && !Array.isArray(draft) ? draft : {}
  } catch {
    return {}
  }
}

function GuestCameraSettings({ settings = DEFAULT_SITE_CONFIG.guestCamera, onChange, id }) {
  const camera = { ...DEFAULT_SITE_CONFIG.guestCamera, ...settings }
  return <section className="guest-camera-settings" id={id}><div><span className="eyebrow">LEMBRANÇAS DOS CONVIDADOS</span><h3>Uma câmera para cada pessoa</h3><p>O convidado tira uma foto, confere a prévia e decide se quer guardar ou tentar outra vez. As fotos ficam privadas para o casal; cada convidado só vê a contagem que ainda pode enviar.</p></div><label className="guest-camera-toggle"><input type="checkbox" checked={camera.enabled} onChange={(event) => onChange({ ...camera, enabled: event.target.checked })} /><span>Ativar a câmera do casamento</span></label>{camera.enabled && <label className="font-pair-label">Fotos por convidado<select value={camera.photoLimit} onChange={(event) => onChange({ ...camera, photoLimit: Number(event.target.value) })}><option value="3">Até três fotos</option><option value="5">Até cinco fotos</option><option value="10">Até dez fotos</option><option value="20">Até vinte fotos</option><option value="50">Até cinquenta fotos</option></select></label>}<small>Depois da celebração, o casal pode rever as fotos com o nome de quem registrou cada momento.</small></section>
}

function createCoupleSlug(firstName, secondName) {
  return `${firstName}-${secondName}`.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 30).replace(/-$/g, '')
}

function PublicSiteCustomizer() {
  const savedDraft = readPublicSiteDraft()
  const [draft, setDraft] = useState(() => ({
    partnerOneName: '',
    partnerTwoName: '',
    eventDate: '',
    ...savedDraft,
    siteConfig: { ...DEFAULT_SITE_CONFIG, ...savedDraft.siteConfig, coverMessages: { ...DEFAULT_SITE_CONFIG.coverMessages, ...savedDraft.siteConfig?.coverMessages }, storyMessages: { ...DEFAULT_SITE_CONFIG.storyMessages, ...savedDraft.siteConfig?.storyMessages }, weddingDetails: { schedule: savedDraft.siteConfig?.weddingDetails?.schedule || '', menu: savedDraft.siteConfig?.weddingDetails?.menu || '', dressCode: savedDraft.siteConfig?.weddingDetails?.dressCode || '' } },
  }))
  const [saved, setSaved] = useState(true)
  const [device, setDevice] = useState('desktop')
  const [previewLanguage, setPreviewLanguage] = useState('pt-BR')
  const [mobilePanel, setMobilePanel] = useState('edit')
  const [wizardStep, setWizardStep] = useState(0)
  const [showAllThemes, setShowAllThemes] = useState(false)
  const theme = THEMES.find((item) => item.id === draft.siteConfig.theme) || THEMES[0]
  const palettes = getThemePalettes(theme)
  const selectedPalette = palettes[draft.siteConfig.paletteIndex] || palettes[0]
  const coverPhoto = SITE_COVER_PHOTOS.find((item) => item.id === draft.siteConfig.coverImage) || SITE_COVER_PHOTOS[0]
  const fontPair = SITE_FONT_PAIRS[draft.siteConfig.fontPair] || SITE_FONT_PAIRS['Clássico editorial']
  const coverMessage = draft.siteConfig.coverMessages?.[previewLanguage] || draft.siteConfig.coverMessages?.['pt-BR'] || ''
  const storyMessage = draft.siteConfig.storyMessages?.[previewLanguage] || draft.siteConfig.storyMessages?.['pt-BR'] || ''
  const travelDetails = draft.siteConfig.sectionContent?.['Hospedagem e dicas']?.['pt-BR']?.body || ''
  const dateLabel = draft.eventDate ? new Date(`${draft.eventDate}T12:00:00`).toLocaleDateString(previewLanguage, { day: 'numeric', month: 'long', year: 'numeric' }) : ({ 'pt-BR': 'A data de vocês', en: 'Your date', es: 'La fecha de ustedes' })[previewLanguage]
  const layoutOptions = [{ id: 'full', label: 'Foto em destaque' }, { id: 'split', label: 'Foto ao lado' }, { id: 'arch', label: 'Moldura em arco' }, { id: 'type', label: 'Só tipografia' }, { id: 'video', label: 'Movimento suave' }, { id: 'collage', label: 'Duas fotos' }]
  const fontScales = [{ id: 'small', label: 'Compacto' }, { id: 'medium', label: 'Padrão' }, { id: 'large', label: 'Ampliado' }]
  const animationPresets = ['Suave', 'Elegante', 'Festivo', 'Nenhum']
  const wizardStages = ['Convite', 'Detalhes', 'Revisão']
  const initialThemes = THEMES.filter((item) => ['garden', 'editorial', 'minimal', 'night'].includes(item.id) || item.id === theme.id)
  const visibleThemes = showAllThemes ? THEMES : initialThemes

  useEffect(() => {
    setSaved(false)
    const timeout = window.setTimeout(() => {
      window.localStorage.setItem(PUBLIC_SITE_DRAFT_KEY, JSON.stringify(draft))
      setSaved(true)
    }, 300)
    return () => window.clearTimeout(timeout)
  }, [draft])

  function updateDraft(key, value) {
    setDraft((current) => ({ ...current, [key]: value }))
  }

  function updateConfig(key, value) {
    setDraft((current) => ({ ...current, siteConfig: { ...current.siteConfig, [key]: value } }))
  }

  function selectTheme(themeId) {
    const preset = THEME_PRESETS[themeId] || THEME_PRESETS.garden
    setDraft((current) => ({ ...current, siteConfig: { ...current.siteConfig, theme: themeId, paletteIndex: 0, fontPair: preset.fontPair, coverLayout: preset.coverLayout } }))
  }

  function addStoryPrompt(starter) {
    const currentText = draft.siteConfig.storyMessages?.['pt-BR'] || ''
    updateConfig('storyMessages', { ...DEFAULT_SITE_CONFIG.storyMessages, ...draft.siteConfig.storyMessages, 'pt-BR': currentText + (currentText.trim() ? '\n\n' : '') + starter })
  }

  function goToWizardStep(step) {
    setWizardStep(step)
    setMobilePanel('edit')
  }

  function updateTravelDetails(value) {
    const section = 'Hospedagem e dicas'
    setDraft((current) => {
      const enabledSections = value.trim() && !current.siteConfig.enabledSections.includes(section) ? [...current.siteConfig.enabledSections, section] : current.siteConfig.enabledSections
      const translations = current.siteConfig.sectionContent?.[section] || {}
      return { ...current, siteConfig: { ...current.siteConfig, enabledSections, sectionContent: { ...current.siteConfig.sectionContent, [section]: { ...translations, 'pt-BR': { ...translations['pt-BR'], title: 'Para quem vem de longe', body: value } } } } }
    })
  }

  function sectionContent(section) {
    const translations = draft.siteConfig.sectionContent?.[section] || {}
    const translated = translations[previewLanguage] || {}
    const fallback = translations['pt-BR'] || {}
    return { title: translated.title || fallback.title || section, body: translated.body || fallback.body || '' }
  }

  const previewStyle = {
    '--customizer-ink': selectedPalette[0],
    '--customizer-accent': selectedPalette[1],
    '--customizer-paper': selectedPalette[2],
    '--customizer-font-heading': fontPair[0],
    '--customizer-font-body': fontPair[1],
    '--customizer-text-scale': draft.siteConfig.fontScale === 'small' ? '.92' : draft.siteConfig.fontScale === 'large' ? '1.1' : '1',
  }

  function renderPreviewSection(section, index) {
    const titleStyle = index % 2 ? 'soft' : 'plain'
    const content = sectionContent(section)
    if (content.body || content.title !== section) return <section className={`customizer-preview-section customizer-preview-custom ${titleStyle}`} key={section}><span className="customizer-preview-kicker">{section}</span><h3>{content.title}</h3>{content.body && <p>{content.body}</p>}</section>
    if (section === 'Nossa história') return storyMessage.trim() ? <section className={`customizer-preview-section customizer-preview-story ${titleStyle}`} key={section}><span className="customizer-preview-kicker">UM POUCO SOBRE VOCÊS</span><h3>{section}</h3><p>{storyMessage}</p><div className="customizer-preview-monogram">{(draft.partnerOneName?.[0] || 'A').toUpperCase()} <i>&amp;</i> {(draft.partnerTwoName?.[0] || 'B').toUpperCase()}</div></section> : null
    if (section === 'Linha do tempo') return <section className={`customizer-preview-section customizer-preview-timeline ${titleStyle}`} key={section}><span className="customizer-preview-kicker">NO TEMPO DE VOCÊS</span><h3>Uma história em momentos</h3><div><i /><p><strong>Onde tudo começou</strong><span>Uma lembrança que vale guardar.</span></p></div><div><i /><p><strong>O pedido</strong><span>O começo de um novo capítulo.</span></p></div><div><i /><p><strong>O grande dia</strong><span>{dateLabel}</span></p></div></section>
    if (section === 'Eventos' || section === 'Cronograma') return <section className="customizer-preview-section customizer-preview-event plain" key={section}><span className="customizer-preview-kicker">{section === 'Eventos' ? 'VAMOS CELEBRAR' : 'PROGRAMAÇÃO'}</span><h3>{section === 'Eventos' ? 'Um dia para guardar' : 'No ritmo da celebração'}</h3>{draft.siteConfig.weddingDetails.schedule && <p className="customizer-preview-event-extra"><strong>Programação</strong>{draft.siteConfig.weddingDetails.schedule}</p>}{draft.siteConfig.weddingDetails.menu && <p className="customizer-preview-event-extra"><strong>Cardápio</strong>{draft.siteConfig.weddingDetails.menu}</p>}</section>
    if (section === 'Dress code') return <section className="customizer-preview-section customizer-preview-dress plain" key={section}><span className="customizer-preview-kicker">COM QUE ROUPA EU VOU?</span><h3>{draft.siteConfig.weddingDetails.dressCode || 'Orientações de traje'}</h3><p>Uma sugestão de traje e as cores do casamento.</p><div className="customizer-preview-swatches">{selectedPalette.map((color) => <i key={color} style={{ backgroundColor: color }} />)}</div></section>
    if (section === 'Padrinhos e madrinhas') return <section className={`customizer-preview-section customizer-preview-people ${titleStyle}`} key={section}><span className="customizer-preview-kicker">AO NOSSO LADO</span><h3>Gente querida por perto</h3><div className="customizer-preview-person"><span>♡</span><p>Uma mensagem carinhosa para quem acompanha vocês de perto.</p></div></section>
    if (section === 'Lista de presentes') return <section className={`customizer-preview-section customizer-preview-gifts ${titleStyle}`} key={section}><span className="customizer-preview-kicker">UM CARINHO PARA ESTA NOVA ETAPA</span><h3>Presentes escolhidos com afeto</h3><p>Uma contribuição para um plano do casal ou um presente simbólico para a vida a dois.</p><div className="customizer-preview-gift-card"><Gift size={19} /><div><strong>Um jantar a dois</strong><span>Presente ilustrativo</span></div><strong>R$ 120</strong></div><small>Exemplo visual. As opções e os valores serão definidos pelo casal.</small></section>
    if (section === 'Confirmação de presença') return <section className={`customizer-preview-section customizer-preview-rsvp ${titleStyle}`} key={section}><Heart size={21} /><span className="customizer-preview-kicker">QUEREMOS CELEBRAR COM VOCÊ</span><h3>Você vem?</h3><p>Confirmar presença leva só um instante.</p><button type="button">Confirmar presença <ArrowRight size={15} /></button></section>
    if (section === 'Galeria de fotos') return <section className={`customizer-preview-section customizer-preview-gallery ${titleStyle}`} key={section}><span className="customizer-preview-kicker">PEDAÇOS DA NOSSA HISTÓRIA</span><h3>Alguns momentos</h3><div>{SITE_COVER_PHOTOS.map((item) => <img key={item.id} src={item.src} alt={`Foto pública de referência: ${item.name}`} loading="lazy" />)}</div><small>Fotos públicas de referência</small></section>
    if (section === 'Mural de recados') return <section className={`customizer-preview-section customizer-preview-note ${titleStyle}`} key={section}><MessageCircle size={20} /><h3>Deixem um recado</h3><p>Uma mensagem para o casal pode virar uma lembrança bonita deste dia.</p></section>
    if (section === 'Hospedagem e dicas') return <section className={`customizer-preview-section customizer-preview-info ${titleStyle}`} key={section}><span className="customizer-preview-kicker">PARA CHEGAR COM CALMA</span><h3>Dicas para quem vem de longe</h3><p>Informações sobre hospedagem, transporte e lugares próximos podem ficar reunidas aqui.</p></section>
    if (section === 'Perguntas frequentes') return <section className={`customizer-preview-section customizer-preview-faq ${titleStyle}`} key={section}><span className="customizer-preview-kicker">TALVEZ VOCÊ QUEIRA SABER</span><h3>Perguntas frequentes</h3><details><summary>Posso levar acompanhante?</summary><p>A confirmação vai mostrar as opções do convite.</p></details><details><summary>Como chegar ao local?</summary><p>O endereço e o mapa aparecem nesta seção.</p></details></section>
    if (section === 'Playlist') return <section className={`customizer-preview-section customizer-preview-playlist ${titleStyle}`} key={section}><span className="customizer-preview-kicker">A TRILHA SONORA DE VOCÊS</span><h3>Uma música para dançar juntos</h3><p>Convidem as pessoas a sugerir músicas para a festa.</p><button type="button">Sugerir uma música <ArrowRight size={15} /></button></section>
    if (section === 'Vídeo') return <section className={`customizer-preview-section customizer-preview-video ${titleStyle}`} key={section}><Camera size={22} /><span className="customizer-preview-kicker">UM RECADO EM VÍDEO</span><h3>Assistam quando quiserem</h3><p>Um espaço para um vídeo curto do casal.</p></section>
    if (section === 'Contato') return <section className={`customizer-preview-section customizer-preview-contact ${titleStyle}`} key={section}><span className="customizer-preview-kicker">PRECISA DE AJUDA?</span><h3>Falemos por aqui</h3><p>Escolham um contato para dúvidas sobre o convite.</p><button type="button"><Mail size={15} /> Falar com o casal</button></section>
    return <section className={`customizer-preview-section customizer-preview-generic ${titleStyle}`} key={section}><span className="customizer-preview-kicker">{section === 'Quiz dos noivos' ? 'UMA BRINCADEIRA DO CASAL' : 'PARTE DA HISTÓRIA DE VOCÊS'}</span><h3>{section}</h3><p>{section === 'Quiz dos noivos' ? 'Um jogo leve para os convidados que quiserem participar.' : 'Um espaço para compartilhar este detalhe com os convidados.'}</p></section>
  }

  return <div className={`public-customizer customizer-theme-${theme.id} customizer-animation-${draft.siteConfig.animationPreset}`} style={previewStyle}>
    <header className="customizer-header"><a className="customizer-brand" href="/" aria-label="e&t sites de casamento">e<span>&amp;</span>t <small>sites de casamento</small></a><div><a href="/ajuda">Central de ajuda</a><span role="status">{saved ? 'Rascunho salvo neste aparelho' : 'Salvando…'}</span><a href="/painel">Entrar</a></div></header>
    <main className="customizer-main">
      <section className="customizer-intro"><span className="marketing-kicker">Um convite de cada vez</span><h1>Façam do convite um pedaço da história de vocês.</h1><p>Escolham o essencial, contem um pouco sobre o dia e vejam o resultado. Os outros detalhes ficam para depois, no painel do casal.</p></section>
      <nav className="customizer-stage-nav" aria-label="Etapas da criação do convite">{wizardStages.map((stage, index) => <button className={wizardStep === index ? 'active' : wizardStep > index ? 'complete' : ''} type="button" key={stage} aria-current={wizardStep === index ? 'step' : undefined} onClick={() => goToWizardStep(index)}>{stage}{wizardStep > index && <Check size={15} aria-label="Concluído" />}</button>)}</nav>
      <nav className="customizer-mobile-switch" aria-label="Alternar entre edição e prévia"><button type="button" className={mobilePanel === 'edit' ? 'active' : ''} aria-pressed={mobilePanel === 'edit'} onClick={() => setMobilePanel('edit')}>Editar o convite</button><button type="button" className={mobilePanel === 'preview' ? 'active' : ''} aria-pressed={mobilePanel === 'preview'} onClick={() => setMobilePanel('preview')}>Ver como fica</button></nav>
      <div className={`customizer-workspace mobile-panel-${mobilePanel}`}>
        <section className="customizer-controls" aria-label="Personalização do convite">
          {wizardStep === 0 && <div className="customizer-wizard-panel" aria-labelledby="customizer-wizard-title"><h2 className="customizer-wizard-title" id="customizer-wizard-title">Montem o convite</h2>
            <div className="customizer-step" id="customizer-couple"><span>Comecem por vocês</span><div className="customizer-name-fields"><label>Primeiro nome<input autoComplete="given-name" maxLength="100" value={draft.partnerOneName} onChange={(event) => updateDraft('partnerOneName', event.target.value)} placeholder="Como devemos chamar vocês?" /></label><label>Segundo nome<input autoComplete="additional-name" maxLength="100" value={draft.partnerTwoName} onChange={(event) => updateDraft('partnerTwoName', event.target.value)} placeholder="E a outra pessoa?" /></label></div><label>Data do casamento<input type="date" value={draft.eventDate} onChange={(event) => updateDraft('eventDate', event.target.value)} /></label></div>
            <div className="customizer-step" id="customizer-style"><span>Escolham o estilo do convite</span><p className="customizer-control-help">Cada tema muda a capa, as cores das páginas e a tipografia. A prévia mostra o resultado.</p><div className="customizer-theme-grid" role="group" aria-label="Temas do convite">{visibleThemes.map((item) => <button type="button" className={'customizer-theme-option' + (theme.id === item.id ? ' active' : '')} key={item.id} onClick={() => selectTheme(item.id)} aria-pressed={theme.id === item.id}><span className={`customizer-theme-mini mini-${item.id}`} style={{ '--theme-ink': item.colors[0], '--theme-accent': item.colors[1], '--theme-paper': item.colors[2] }}><img src={SITE_COVER_PHOTOS[item.id === 'floral' || item.id === 'tropical' ? 1 : 0].src} alt="" loading="lazy" /><b>{draft.partnerOneName || 'Ana'} <i>&amp;</i> {draft.partnerTwoName || 'Rafa'}</b><em /></span><strong>{item.name}</strong><small>{item.note}</small></button>)}</div>{!showAllThemes && <button className="customizer-more-themes" type="button" onClick={() => setShowAllThemes(true)}>Ver outros estilos</button>}</div>
            <div className="customizer-step" id="customizer-cover"><span>Deem forma à capa</span><div className="customizer-layout-options" role="group" aria-label="Formato da capa">{layoutOptions.map((layout) => <button type="button" className={draft.siteConfig.coverLayout === layout.id ? 'active' : ''} key={layout.id} onClick={() => updateConfig('coverLayout', layout.id)} aria-pressed={draft.siteConfig.coverLayout === layout.id}><span className={'customizer-layout-thumb customizer-layout-' + layout.id} aria-hidden="true"><i /><b /><em /></span><span>{layout.label}</span></button>)}</div><label>Foto de capa<select value={draft.siteConfig.coverImage} onChange={(event) => updateConfig('coverImage', event.target.value)}>{SITE_COVER_PHOTOS.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><label>Uma frase para receber os convidados<textarea maxLength="240" rows="2" value={draft.siteConfig.coverMessages?.['pt-BR'] || ''} onChange={(event) => updateConfig('coverMessages', { ...DEFAULT_SITE_CONFIG.coverMessages, ...draft.siteConfig.coverMessages, 'pt-BR': event.target.value })} placeholder="Escrevam uma mensagem com o jeito de vocês" /></label><details className="customizer-advanced-options"><summary>Ajustar cores, fontes e movimento</summary><div className="customizer-advanced-content"><div className="customizer-choice-group"><span>Paleta de cores</span><div className="customizer-palette-options">{palettes.map((colors, index) => <button type="button" className={draft.siteConfig.paletteIndex === index ? 'active' : ''} key={PALETTE_NAMES[index]} onClick={() => updateConfig('paletteIndex', index)} aria-label={'Paleta ' + PALETTE_NAMES[index]} aria-pressed={draft.siteConfig.paletteIndex === index}><span>{colors.map((color) => <i key={color} style={{ backgroundColor: color }} />)}</span><small>{PALETTE_NAMES[index]}</small></button>)}</div></div><label>Par de fontes<select value={draft.siteConfig.fontPair} onChange={(event) => updateConfig('fontPair', event.target.value)}>{Object.keys(SITE_FONT_PAIRS).map((name) => <option key={name}>{name}</option>)}</select></label><div className="customizer-choice-group"><span>Tamanho do texto</span><div className="customizer-scale-options" role="group" aria-label="Tamanho do texto">{fontScales.map((scale) => <button type="button" className={draft.siteConfig.fontScale === scale.id ? 'active' : ''} key={scale.id} onClick={() => updateConfig('fontScale', scale.id)} aria-pressed={draft.siteConfig.fontScale === scale.id}>{scale.label}</button>)}</div></div><div className="customizer-choice-group"><span>Movimento da capa</span><div className="customizer-animation-options" role="group" aria-label="Movimento da capa">{animationPresets.map((preset) => <button type="button" className={draft.siteConfig.animationPreset === preset ? 'active' : ''} key={preset} onClick={() => updateConfig('animationPreset', preset)} aria-pressed={draft.siteConfig.animationPreset === preset}>{preset}</button>)}</div></div></div></details></div>
          </div>}
          {wizardStep === 1 && <div className="customizer-wizard-panel" aria-labelledby="customizer-wizard-title"><h2 className="customizer-wizard-title" id="customizer-wizard-title">Contem o que importa</h2>
            <div className="customizer-step" id="customizer-details"><span>Detalhes da celebração</span><p className="customizer-control-help">Acrescentem só o que já souberem. Vocês podem voltar depois.</p><label>Programação do dia<textarea maxLength="1200" rows="3" value={draft.siteConfig.weddingDetails.schedule} onChange={(event) => updateConfig('weddingDetails', { ...draft.siteConfig.weddingDetails, schedule: event.target.value })} placeholder="Por exemplo: cerimônia, jantar e pista de dança" /></label><label>Cardápio<textarea maxLength="1200" rows="3" value={draft.siteConfig.weddingDetails.menu} onChange={(event) => updateConfig('weddingDetails', { ...draft.siteConfig.weddingDetails, menu: event.target.value })} placeholder="Pratos, bebidas ou opções especiais" /></label><label>Traje sugerido<input maxLength="120" value={draft.siteConfig.weddingDetails.dressCode} onChange={(event) => updateConfig('weddingDetails', { ...draft.siteConfig.weddingDetails, dressCode: event.target.value })} placeholder="Por exemplo: passeio ou esporte fino" /></label></div>
            <details className="customizer-step customizer-advanced-options"><summary>Para quem vem de longe</summary><div className="customizer-advanced-content"><p className="customizer-control-help">Se houver convidados viajando, deixem reunidas dicas de hospedagem e transporte.</p><label>Dicas para a viagem<textarea maxLength="3000" rows="4" value={travelDetails} onChange={(event) => updateTravelDetails(event.target.value)} placeholder="Regiões para se hospedar, transporte ou lugares próximos" /></label></div></details>
            <div className="customizer-step customizer-story-prompts"><span>Uma lembrança de vocês</span><p className="customizer-control-help">Opcional. Toquem numa pergunta para começar uma frase; depois escrevam do jeito de vocês.</p><div className="customizer-prompt-list"><button type="button" onClick={() => addStoryPrompt('Nos conhecemos...')} disabled={draft.siteConfig.storyMessages?.['pt-BR']?.includes('Nos conhecemos...')}>Como vocês se conheceram?</button><button type="button" onClick={() => addStoryPrompt('Nosso primeiro beijo foi...')} disabled={draft.siteConfig.storyMessages?.['pt-BR']?.includes('Nosso primeiro beijo foi...')}>Como foi o primeiro beijo?</button><button type="button" onClick={() => addStoryPrompt('Quem disse que eu te amo primeiro foi...')} disabled={draft.siteConfig.storyMessages?.['pt-BR']?.includes('Quem disse que eu te amo primeiro foi...')}>Quem disse que eu te amo primeiro?</button></div><label>Contem essa história, se quiserem<textarea maxLength="3000" rows="5" value={draft.siteConfig.storyMessages?.['pt-BR'] || ''} onChange={(event) => updateConfig('storyMessages', { ...DEFAULT_SITE_CONFIG.storyMessages, ...draft.siteConfig.storyMessages, 'pt-BR': event.target.value })} placeholder="Uma lembrança curta já basta. Também podem deixar em branco." /></label></div>
          </div>}
          {wizardStep === 2 && <div className="customizer-wizard-panel customizer-review-panel" aria-labelledby="customizer-wizard-title"><span className="customizer-review-kicker">O convite de vocês</span><h2 id="customizer-wizard-title">Já tem um começo bonito.</h2><p>Confiram a prévia em diferentes telas. O rascunho continua salvo neste aparelho enquanto vocês avançam.</p><button className="customizer-preview-open" type="button" onClick={() => setMobilePanel('preview')}>Ver a prévia do convite <Eye size={16} /></button><div className="customizer-review-note"><Sparkles size={19} /><p>Depois de criar o acesso, vocês continuam pelo painel, por partes: informações dos convidados, mural e outros detalhes da celebração.</p></div><a className="customizer-continue" href="/cadastro" onClick={() => window.localStorage.setItem(PUBLIC_SITE_DRAFT_KEY, JSON.stringify(draft))}>Criar acesso para continuar <ArrowRight size={17} /></a><p className="customizer-note">O convite pode ser ajustado antes de publicar. As fotos da prévia são imagens públicas de referência.</p></div>}
          {wizardStep < 2 && <div className="customizer-wizard-actions">{wizardStep > 0 && <button type="button" className="customizer-back" onClick={() => goToWizardStep(wizardStep - 1)}><ArrowLeft size={16} /> Voltar</button>}<button type="button" className="customizer-next" onClick={() => goToWizardStep(wizardStep + 1)}>{wizardStep === 0 ? 'Continuar para os detalhes' : 'Revisar meu convite'} <ArrowRight size={16} /></button></div>}
        </section>
        <section className="customizer-preview" aria-label="Prévia do site dos noivos">
          <div className="customizer-preview-heading"><span>Prévia do convite</span><div role="group" aria-label="Tamanho da prévia">{[['desktop', Monitor, 'Computador'], ['tablet', Tablet, 'Tablet'], ['mobile', Smartphone, 'Celular']].map(([size, Icon, label]) => <button key={size} className={device === size ? 'selected' : ''} type="button" aria-label={label} aria-pressed={device === size} onClick={() => setDevice(size)}><Icon size={17} /></button>)}</div><label className="customizer-preview-language">Idioma<select aria-label="Idioma da prévia" value={previewLanguage} onChange={(event) => setPreviewLanguage(event.target.value)}><option value="pt-BR">PT</option><option value="en">EN</option><option value="es">ES</option></select></label></div>
          <div className={`customizer-browser customizer-${device} customizer-cover-${draft.siteConfig.coverLayout}`}>
            <div className="customizer-browser-bar"><i /><i /><i /><span>o convite de vocês</span></div>
            <div className="customizer-live-cover"><img src={coverPhoto.src} alt={coverPhoto.name} /><div>{draft.eventDate && <span>{dateLabel}</span>}<h2>{draft.partnerOneName || 'Nome'} <i>&amp;</i><br />{draft.partnerTwoName || 'Nome'}</h2><p>{coverMessage || 'Uma frase de vocês para quem vai celebrar junto.'}</p><button type="button">Ver o convite <ArrowDown size={14} /></button></div>{draft.siteConfig.coverLayout === 'collage' && <div className="customizer-collage-pair">{SITE_COVER_PHOTOS.map((item) => <img key={item.id} src={item.src} alt="" loading="lazy" />)}</div>}{draft.siteConfig.coverLayout === 'video' && <span className="customizer-motion-mark">Movimento suave</span>}</div>
            <nav className="customizer-live-sections" aria-label="Seções do convite">{draft.siteConfig.enabledSections.filter((section) => ['Nossa história', 'Eventos', 'Confirmação de presença'].includes(section)).map((section) => <a key={section} href={`#customizer-preview-${SITE_SECTIONS.indexOf(section)}`}>{section}</a>)}</nav>
            {draft.siteConfig.enabledSections.filter((section) => ['Nossa história', 'Eventos', 'Confirmação de presença'].includes(section)).map((section, index) => <div id={`customizer-preview-${SITE_SECTIONS.indexOf(section)}`} key={section}>{renderPreviewSection(section, index)}</div>)}
            {draft.siteConfig.enabledSections.some((section) => !['Nossa história', 'Eventos', 'Confirmação de presença'].includes(section)) && <details className="customizer-preview-more"><summary>Outras partes do convite</summary>{draft.siteConfig.enabledSections.filter((section) => !['Nossa história', 'Eventos', 'Confirmação de presença'].includes(section)).map((section, index) => <div id={`customizer-preview-${SITE_SECTIONS.indexOf(section)}`} key={section}>{renderPreviewSection(section, index)}</div>)}</details>}
            <div className="customizer-live-footer"><span>{draft.partnerOneName || 'Nome'} &amp; {draft.partnerTwoName || 'Nome'}</span><span>henriquesouzas.com</span></div>
          </div>
          <p className="customizer-preview-caption">A prévia muda com as escolhas. Alterne entre computador, tablet e celular para conferir o convite.</p><p className="customizer-photo-credit">Fotos de referência: {SITE_COVER_PHOTOS.map((item) => item.credit).join(' · ')}.</p>
        </section>
      </div>
    </main>
    <footer className="customizer-footer"><a href="https://henriquesouzas.com" target="_blank" rel="noreferrer">henriquesouzas.com</a></footer>
  </div>
}
function PasswordInput(props) {
  const [visible, setVisible] = useState(false)
  const [focused, setFocused] = useState(false)
  const [capsLockOn, setCapsLockOn] = useState(false)

  function updateCapsLock(event) {
    setCapsLockOn(Boolean(event.getModifierState?.('CapsLock')))
  }

  return <span className={`password-input-wrap${focused ? ' is-focused' : ''}`} onFocusCapture={() => setFocused(true)} onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) { setFocused(false); setCapsLockOn(false) } }}>
    <input {...props} type={visible ? 'text' : 'password'} onKeyDown={(event) => { updateCapsLock(event); props.onKeyDown?.(event) }} onKeyUp={(event) => { updateCapsLock(event); props.onKeyUp?.(event) }} onBlur={(event) => props.onBlur?.(event)} />
    <button className="password-visibility-toggle" type="button" onClick={() => setVisible((current) => !current)} aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'} aria-pressed={visible}><span className="sr-only">{visible ? 'Ocultar senha' : 'Mostrar senha'}</span>{visible ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}</button>
    {capsLockOn && <small className="password-capslock" role="status" aria-live="polite">Caps Lock ativado. As letras serão digitadas em maiúsculo.</small>}
  </span>
}

function CoupleSignup() {
  const publicDraft = readPublicSiteDraft()
  const selectedDraftTheme = THEMES.find((item) => item.id === publicDraft.siteConfig?.theme) || THEMES[0]
  const draftPalettes = getThemePalettes(selectedDraftTheme)
  const selectedDraftPalette = draftPalettes[publicDraft.siteConfig?.paletteIndex] || draftPalettes[0]
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [partnerOneName, setPartnerOneName] = useState(publicDraft.partnerOneName || '')
  const [partnerTwoName, setPartnerTwoName] = useState(publicDraft.partnerTwoName || '')
  const [coupleType, setCoupleType] = useState('bride-groom')
  const [turnstileToken, setTurnstileToken] = useState('')
  const [turnstileReset, setTurnstileReset] = useState(0)
  const [slug, setSlug] = useState(createCoupleSlug(publicDraft.partnerOneName || '', publicDraft.partnerTwoName || ''))
  const [eventDate, setEventDate] = useState(publicDraft.eventDate || '')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  function createSlug(firstName, secondName) {
    return `${firstName}-${secondName}`.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 30).replace(/-$/g, '')
  }

  async function signup(event) {
    event.preventDefault()
    if (password !== confirmation) {
      setError('As senhas não coincidem.')
      return
    }
    setBusy(true)
    setError('')
    try {
      const response = await fetch('/api/auth/couple-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, partnerOneName, partnerTwoName, slug, eventDate: eventDate || null, siteConfig: publicDraft.siteConfig, turnstileToken }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'signup_failed')
      window.localStorage.removeItem(PUBLIC_SITE_DRAFT_KEY)
      setSubmitted(true)
      setPassword('')
      setConfirmation('')
    } catch (cause) {
      setError(cause.message === 'email_service_unconfigured' ? 'O envio de e-mails ainda está sendo configurado. Tente novamente em breve.'
        : cause.message === 'turnstile_unavailable' ? 'A verificação de segurança ainda não foi configurada neste site.'
          : cause.message === 'turnstile_verification_failed' ? 'Conclua novamente a verificação de segurança.'
        : cause.message === 'email_or_slug_unavailable' ? 'Este e-mail ou endereço já está cadastrado. Confira os dados e tente entrar.'
          : cause.message === 'too_many_attempts' ? 'Muitas tentativas neste aparelho. Aguarde e tente novamente.'
            : cause.message === 'verification_email_failed' ? 'Não foi possível enviar o e-mail de confirmação. Confira os dados e tente novamente.'
              : 'Não foi possível criar o cadastro. Confira os campos e tente novamente.')
    } finally {
      setTurnstileToken('')
      setTurnstileReset((current) => current + 1)
      setBusy(false)
    }
  }

  return <RoleFrame icon={Heart} eyebrow="ESPAÇO DOS NOIVOS" title={submitted ? 'Confira seu e-mail.' : 'Comecem a planejar juntos.'} description={submitted ? `Enviamos um link de confirmação para ${email}. Ele vale por 24 horas.` : 'Crie o acesso do casal e reserve o endereço curto do site de vocês.'} secure secureName="Cadastro dos noivos" secureFooter="Acesso individual" className="signup-page">
    {submitted ? <section className="role-card admin-login-form"><p>Depois de confirmar o endereço, vocês poderão abrir o painel e configurar um autenticador no primeiro acesso.</p><a className="button-primary signup-submit" href="/painel">Ir para o painel <ArrowRight size={15} /></a><p><a href="/criar-site">Usar outro e-mail</a></p></section> : <form className="role-card admin-login-form signup-form" onSubmit={signup}>
      <div className="signup-customization-summary"><strong>O convite que vocês começaram</strong><p>{publicDraft.partnerOneName || 'Nomes'} &amp; {publicDraft.partnerTwoName || 'nomes'} · {selectedDraftTheme.name}{publicDraft.eventDate ? ` · ${new Date(`${publicDraft.eventDate}T12:00:00`).toLocaleDateString('pt-BR')}` : ''}</p><span className="signup-customization-colors" aria-label="Cores escolhidas">{selectedDraftPalette.map((color) => <i key={color} style={{ backgroundColor: color }} />)}</span><a href="/criar-site">Voltar e ajustar o convite</a></div>
      <label>E-mail do casal<input type="email" autoComplete="email" maxLength="254" value={email} onChange={(event) => setEmail(event.target.value)} required /></label>
      <fieldset className="couple-type-field"><legend>Como vocês preferem identificar o casal?</legend><div className="couple-type-options">{[['bride-groom', 'Noiva e noivo'], ['two-brides', 'Duas noivas'], ['two-grooms', 'Dois noivos'], ['neutral', 'Nomes neutros']].map(([value, label]) => <label className={coupleType === value ? 'selected' : ''} key={value}><input type="radio" name="couple-type" value={value} checked={coupleType === value} onChange={() => setCoupleType(value)} /><span>{label}</span></label>)}</div></fieldset>
      <div className="signup-name-grid"><label>{({ 'bride-groom': 'Nome da noiva', 'two-brides': 'Nome da primeira noiva', 'two-grooms': 'Nome do primeiro noivo', neutral: 'Nome da pessoa 1' })[coupleType]}<input autoComplete="given-name" maxLength="100" value={partnerOneName} onChange={(event) => { setPartnerOneName(event.target.value); setSlug(createSlug(event.target.value, partnerTwoName)) }} required /></label><label>{({ 'bride-groom': 'Nome do noivo', 'two-brides': 'Nome da segunda noiva', 'two-grooms': 'Nome do segundo noivo', neutral: 'Nome da pessoa 2' })[coupleType]}<input autoComplete="given-name" maxLength="100" value={partnerTwoName} onChange={(event) => { setPartnerTwoName(event.target.value); setSlug(createSlug(partnerOneName, event.target.value)) }} required /></label></div>
      <label>Endereço curto do site<input autoComplete="url" minLength="3" maxLength="30" pattern="[a-z0-9][a-z0-9-]{1,28}[a-z0-9]" value={slug} onChange={(event) => setSlug(event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 30))} required /><small className="signup-hint">Um endereço simples para compartilhar o convite depois.</small></label>
      <label>Data do casamento<input type="date" value={eventDate} onChange={(event) => setEventDate(event.target.value)} /></label>
      <label>Crie uma senha<PasswordInput autoComplete="new-password" minLength="12" maxLength="1024" value={password} onChange={(event) => setPassword(event.target.value)} required /></label>
      <label>Confirme a senha<PasswordInput autoComplete="new-password" minLength="12" maxLength="1024" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} required /></label>
      <TurnstileChallenge onToken={setTurnstileToken} resetKey={turnstileReset} />
      {!TURNSTILE_SITE_KEY && <p className="admin-form-error signup-security-unavailable" role="status">O cadastro está temporariamente indisponível porque a verificação de segurança ainda não foi configurada.</p>}
      {error && <p className="admin-form-error" role="alert">{error}</p>}
      <button className="button-primary signup-submit" type="submit" disabled={busy || !TURNSTILE_SITE_KEY || !turnstileToken}>{busy ? 'Criando cadastro…' : 'Criar meu espaço'} <ArrowRight size={15} /></button>
      <p className="signup-login-link">Já têm uma conta? <a href="/painel">Entrar no painel</a></p>
    </form>}
  </RoleFrame>
}

function CoupleEmailConfirmation() {
  const [status, setStatus] = useState('confirming')
  const token = window.location.hash.match(/^#confirmar-email\/([A-Za-z0-9_-]{40,60})$/)?.[1] || ''

  useEffect(() => {
    if (!token) {
      setStatus('invalid')
      return
    }
    fetch('/api/auth/verify-couple-email', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token }) }).then(async (response) => {
      const result = await response.json()
      if (!response.ok || !result.mfaSetupRequired) throw new Error('invalid')
      setStatus('verified')
    }).catch(() => setStatus('invalid'))
  }, [token])

  const verified = status === 'verified'
  return <RoleFrame icon={verified ? Check : Shield} eyebrow="CONFIRMAÇÃO DE E-MAIL" title={status === 'confirming' ? 'Validando seu cadastro.' : verified ? 'Cadastro confirmado.' : 'Este link não está mais válido.'} description={status === 'confirming' ? 'Só um instante enquanto ativamos o acesso do casal.' : verified ? 'Seu espaço está pronto. No primeiro acesso, configure o autenticador para proteger a conta.' : 'O link pode ter expirado ou já ter sido utilizado. Volte ao cadastro para começar novamente.'} secure secureName="Cadastro dos noivos" secureFooter="Acesso individual">
    <section className="role-card admin-login-form">{status === 'confirming' && <p>Confirmando endereço de e-mail…</p>}{verified && <a className="button-primary signup-submit" href="/painel">Abrir painel dos noivos <ArrowRight size={15} /></a>}{status === 'invalid' && <a className="button-primary signup-submit" href="/criar-site">Voltar ao cadastro <ArrowRight size={15} /></a>}</section>
  </RoleFrame>
}

function PasswordResetRequest() {
  const [email, setEmail] = useState('')
  const [turnstileToken, setTurnstileToken] = useState('')
  const [turnstileReset, setTurnstileReset] = useState(0)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  async function requestReset(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      const response = await fetch('/api/auth/password-reset/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, turnstileToken }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'request_failed')
      setSubmitted(true)
    } catch (cause) {
      setError(cause.message === 'email_service_unconfigured'
        ? 'O envio de e-mails está sendo configurado. Tente novamente em breve.'
        : cause.message === 'turnstile_unavailable'
          ? 'A verificação de segurança ainda não foi configurada neste site.'
          : cause.message === 'turnstile_verification_failed'
            ? 'Conclua novamente a verificação de segurança.'
        : cause.message === 'too_many_attempts'
          ? 'Muitas solicitações neste aparelho. Aguarde e tente novamente.'
          : 'Não foi possível solicitar a recuperação agora. Tente novamente mais tarde.')
    } finally {
      setTurnstileToken('')
      setTurnstileReset((current) => current + 1)
      setBusy(false)
    }
  }

  return <RoleFrame icon={LockKeyhole} eyebrow="SEGURANÇA DA CONTA" title={submitted ? 'Confira sua caixa de entrada.' : 'Recupere seu acesso.'} description={submitted ? 'Se houver uma conta ativa com esse endereço, enviaremos um link válido por 30 minutos.' : 'Informe o e-mail da conta para receber um link de redefinição de senha.'} secure secureName="Recuperação de conta" secureFooter="Acesso individual">
    <form className="role-card admin-login-form" onSubmit={requestReset}><label>E-mail da conta<input type="email" autoComplete="email" maxLength="254" value={email} onChange={(event) => setEmail(event.target.value)} required disabled={submitted} /></label>{!submitted && <TurnstileChallenge onToken={setTurnstileToken} resetKey={turnstileReset} />}{error && <p className="admin-form-error" role="alert">{error}</p>}{submitted ? <a className="button-primary signup-submit" href="/painel">Voltar para entrar <ArrowRight size={15} /></a> : <button className="button-primary signup-submit" type="submit" disabled={busy || !TURNSTILE_SITE_KEY || !turnstileToken}>{busy ? 'Solicitando…' : 'Enviar link de recuperação'} <ArrowRight size={15} /></button>}</form>
  </RoleFrame>
}

function PasswordReset() {
  const token = window.location.hash.match(/^#redefinir-senha\/([A-Za-z0-9_-]{40,60})$/)?.[1] || ''
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [complete, setComplete] = useState(false)
  const [invalid, setInvalid] = useState(!token)

  async function resetPassword(event) {
    event.preventDefault()
    if (password !== confirmation) {
      setError('As senhas não coincidem.')
      return
    }
    setBusy(true)
    setError('')
    try {
      const response = await fetch('/api/auth/password-reset/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'reset_failed')
      setComplete(true)
      setPassword('')
      setConfirmation('')
    } catch (cause) {
      setInvalid(cause.message === 'password_reset_expired_or_used')
      setError(cause.message === 'password_reset_expired_or_used' ? 'Este link expirou ou já foi usado. Solicite outro link.' : 'Não foi possível redefinir a senha. Confira os campos e tente novamente.')
    } finally {
      setBusy(false)
    }
  }

  return <RoleFrame icon={LockKeyhole} eyebrow="SEGURANÇA DA CONTA" title={complete ? 'Senha atualizada.' : invalid ? 'Solicite um novo link.' : 'Escolha uma nova senha.'} description={complete ? 'As sessões anteriores foram encerradas. Entre novamente e use seu autenticador, quando estiver configurado.' : invalid ? 'O link informado expirou, já foi utilizado ou está incompleto.' : 'O link é de uso único e válido por 30 minutos.'} secure secureName="Recuperação de conta" secureFooter="Acesso individual">
    {complete ? <section className="role-card admin-login-form"><a className="button-primary signup-submit" href="/painel">Entrar no painel dos noivos <ArrowRight size={15} /></a></section> : invalid ? <section className="role-card admin-login-form"><a className="button-primary signup-submit" href="/recuperar-senha">Solicitar outro link <ArrowRight size={15} /></a></section> : <form className="role-card admin-login-form" onSubmit={resetPassword}><label>Nova senha<PasswordInput autoComplete="new-password" minLength="12" maxLength="1024" value={password} onChange={(event) => setPassword(event.target.value)} required /></label><label>Confirme a senha<PasswordInput autoComplete="new-password" minLength="12" maxLength="1024" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} required /></label>{error && <p className="admin-form-error" role="alert">{error}</p>}<button className="button-primary signup-submit" type="submit" disabled={busy}>{busy ? 'Atualizando…' : 'Redefinir senha'} <Shield size={15} /></button></form>}
  </RoleFrame>
}

function CouplePanel({ notify }) {
  const [stage, setStage] = useState('checking')
  const [account, setAccount] = useState(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [turnstileToken, setTurnstileToken] = useState('')
  const [turnstileReset, setTurnstileReset] = useState(0)
  const [weddings, setWeddings] = useState([])
  const [weddingId, setWeddingId] = useState('')
  const [guests, setGuests] = useState([])
  const [guestImportResults, setGuestImportResults] = useState([])
  const [guestImportErrors, setGuestImportErrors] = useState([])
  const [groups, setGroups] = useState([])
  const [events, setEvents] = useState([])
  const [rsvps, setRsvps] = useState([])
  const [gifts, setGifts] = useState([])
  const [contributions, setContributions] = useState([])
  const [contributionSummary, setContributionSummary] = useState({ received_cents: 0, fee_due_cents: 0, total_count: 0 })
  const [editingGift, setEditingGift] = useState(null)
  const [giftType, setGiftType] = useState('fixed')
  const [giftTitle, setGiftTitle] = useState('')
  const [giftDescription, setGiftDescription] = useState('')
  const [giftAmount, setGiftAmount] = useState('')
  const [giftGoal, setGiftGoal] = useState('')
  const [manualEventId, setManualEventId] = useState('')
  const [manualGuestId, setManualGuestId] = useState('')
  const [manualRsvpStatus, setManualRsvpStatus] = useState('confirmed')
  const [manualRsvpPartySize, setManualRsvpPartySize] = useState('1')
  const [manualRsvpDietaryNotes, setManualRsvpDietaryNotes] = useState('')
  const [editingRsvp, setEditingRsvp] = useState(null)
  const [rsvpExportEventId, setRsvpExportEventId] = useState('')
  const [rsvpPrintActive, setRsvpPrintActive] = useState(false)
  const [members, setMembers] = useState([])
  const [assignments, setAssignments] = useState([])
  const [godparentTasks, setGodparentTasks] = useState([])
  const [siteConfig, setSiteConfig] = useState(DEFAULT_SITE_CONFIG)
  const [savedSiteConfig, setSavedSiteConfig] = useState(DEFAULT_SITE_CONFIG)
  const [publishedSiteConfig, setPublishedSiteConfig] = useState(null)
  const [sitePublishedAt, setSitePublishedAt] = useState(null)
  const [siteConfigLoading, setSiteConfigLoading] = useState(false)
  const [tab, setTab] = useState(() => window.location.hash === '#equipe' ? 'team' : 'site')
  const [guestName, setGuestName] = useState('')
  const [guestEmail, setGuestEmail] = useState('')
  const [guestPhone, setGuestPhone] = useState('')
  const [guestGroup, setGuestGroup] = useState('')
  const [guestPartySize, setGuestPartySize] = useState('1')
  const [guestType, setGuestType] = useState('guest')
  const [guestDietaryNotes, setGuestDietaryNotes] = useState('')
  const [groupName, setGroupName] = useState('')
  const [groupType, setGroupType] = useState('family')
  const [taskGuestId, setTaskGuestId] = useState('')
  const [taskTitle, setTaskTitle] = useState('')
  const [taskDetails, setTaskDetails] = useState('')
  const [taskDueAt, setTaskDueAt] = useState('')
  const [eventName, setEventName] = useState('')
  const [eventType, setEventType] = useState('ceremony')
  const [eventStartsAt, setEventStartsAt] = useState('')
  const [eventVenue, setEventVenue] = useState('')
  const [eventAddress, setEventAddress] = useState('')
  const [eventGroupIds, setEventGroupIds] = useState([])
  const [editingEventId, setEditingEventId] = useState('')
  const [teamEmail, setTeamEmail] = useState('')
  const [teamRole, setTeamRole] = useState('checkin_staff')
  const [teamInvitation, setTeamInvitation] = useState(null)
  const [share, setShare] = useState(null)
  const [editingGuest, setEditingGuest] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const wedding = weddings.find((item) => item.id === weddingId)
  const isReader = wedding?.role === 'reader'
  const isEditor = wedding?.role === 'editor'
  const selectedManualEvent = events.find((item) => item.id === manualEventId)
  const availableManualGuests = guests.filter((guest) => {
    const allowedGroups = selectedManualEvent?.group_ids || []
    const eventAllowsGuest = !allowedGroups.length || allowedGroups.includes(guest.group_id)
    const hasResponse = rsvps.some((item) => item.event_id === manualEventId && item.guest_id === guest.id)
    return manualEventId && eventAllowsGuest && !hasResponse
  })
  const rsvpExportRows = rsvps.filter((item) => !rsvpExportEventId || item.event_id === rsvpExportEventId)

  function exportRsvpPdf() {
    setRsvpPrintActive(true)
    window.setTimeout(() => {
      window.print()
      setRsvpPrintActive(false)
    }, 120)
  }

  async function request(path, options = {}) {
    const response = await fetch(path, { ...options, headers: { ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...options.headers } })
    const result = await response.json()
    if (!response.ok) throw new Error(result.error || 'request_failed')
    return result
  }

  async function loadWeddings() {
    const result = await request('/api/couple/weddings')
    const accessible = result.weddings
    if (!accessible.length) throw new Error('Esta conta não possui acesso a um casamento.')
    setWeddings(accessible)
    if (!weddingId || !accessible.some((item) => item.id === weddingId)) {
      setWeddingId(accessible[0].id)
      setTab('site')
    }
    setStage('ready')
  }

  async function loadWeddingData(id) {
    if (!id) return
    const base = `/api/couple/weddings/${id}`
    const selectedWedding = weddings.find((item) => item.id === id)
    if (selectedWedding?.role === 'reader') {
      const result = await request(`${base}/published`)
      const config = result.siteConfig || DEFAULT_SITE_CONFIG
      setGuests([])
      setGroups([])
      setEvents(result.events)
      setRsvps([])
      setGifts([])
      setContributions([])
      setContributionSummary({ received_cents: 0, fee_due_cents: 0, total_count: 0 })
      setMembers([])
      setAssignments([])
      setGodparentTasks([])
      setSiteConfig(config)
      setSavedSiteConfig(config)
      setPublishedSiteConfig(config)
      setSitePublishedAt(result.publishedAt)
      setSiteConfigLoading(false)
      return
    }
    if (selectedWedding?.role === 'editor') {
      const [groupResult, eventResult, siteConfigResult] = await Promise.all([
        request(`${base}/groups`),
        request(`${base}/events`),
        request(`${base}/site-config`),
      ])
      setGuests([])
      setGroups(groupResult.groups)
      setEvents(eventResult.events)
      setRsvps([])
      setGifts([])
      setContributions([])
      setContributionSummary({ received_cents: 0, fee_due_cents: 0, total_count: 0 })
      setMembers([])
      setAssignments([])
      setGodparentTasks([])
      setSiteConfig(siteConfigResult.draft)
      setSavedSiteConfig(siteConfigResult.draft)
      setPublishedSiteConfig(siteConfigResult.published)
      setSitePublishedAt(siteConfigResult.publishedAt)
      setSiteConfigLoading(false)
      return
    }
    const [guestResult, groupResult, eventResult, rsvpResult, giftResult, contributionResult, memberResult, assignmentResult, taskResult, siteConfigResult] = await Promise.all([
      request(`${base}/guests`),
      request(`${base}/groups`),
      request(`${base}/events`),
      request(`${base}/rsvps`),
      request(`${base}/gifts`),
      request(`${base}/contributions`),
      request(`${base}/members`),
      request(`${base}/event-assignments`),
      request(`${base}/godparent-tasks`),
      request(`${base}/site-config`),
    ])
    setGuests(guestResult.guests)
    setGroups(groupResult.groups)
    setEvents(eventResult.events)
    setRsvps(rsvpResult.rsvps)
    setGifts(giftResult.gifts)
    setContributions(contributionResult.contributions)
    setContributionSummary(contributionResult.summary)
    setMembers(memberResult.members)
    setAssignments(assignmentResult.assignments)
    setGodparentTasks(taskResult.tasks)
    setSiteConfig(siteConfigResult.draft)
    setSavedSiteConfig(siteConfigResult.draft)
    setPublishedSiteConfig(siteConfigResult.published)
    setSitePublishedAt(siteConfigResult.publishedAt)
    setSiteConfigLoading(false)
  }

  async function saveSiteDraft() {
    setSiteConfigLoading(true)
    setError('')
    try {
      const result = await request(`/api/couple/weddings/${weddingId}/site-config`, { method: 'PUT', body: JSON.stringify(siteConfig) })
      setSiteConfig(result.draft)
      setSavedSiteConfig(result.draft)
      notify('Rascunho do site salvo no D1')
    } catch {
      setError('Não foi possível salvar o rascunho do site.')
    } finally {
      setSiteConfigLoading(false)
    }
  }

  async function publishSite() {
    if (!window.confirm('Publicar este rascunho e ativar o acesso dos convidados pelos links individuais?')) return
    setSiteConfigLoading(true)
    setError('')
    try {
      let draft = siteConfig
      if (JSON.stringify(siteConfig) !== JSON.stringify(savedSiteConfig)) {
        const saved = await request(`/api/couple/weddings/${weddingId}/site-config`, { method: 'PUT', body: JSON.stringify(siteConfig) })
        draft = saved.draft
        setSiteConfig(draft)
        setSavedSiteConfig(draft)
      }
      const result = await request(`/api/couple/weddings/${weddingId}/site-config/publish`, { method: 'POST' })
      setPublishedSiteConfig(result.published)
      setSitePublishedAt(result.publishedAt)
      setWeddings((current) => current.map((item) => item.id === weddingId ? { ...item, status: result.status } : item))
      notify('Site publicado para os convites individuais')
    } catch {
      setError('Não foi possível publicar o site. Confira o estado do casamento e tente novamente.')
    } finally {
      setSiteConfigLoading(false)
    }
  }

  useEffect(() => {
    fetch('/api/auth/session').then(async (response) => {
      if (!response.ok) throw new Error('authentication_required')
      const session = await response.json()
      setAccount(session.account)
      if (session.mfaSetupRequired) {
        setStage('mfa-setup')
        return
      }
      if (!session.mfaVerified) {
        setError('Sua sessão precisa ser renovada com o código do autenticador.')
        setStage('login')
        return
      }
      await loadWeddings()
    }).catch((cause) => { setError(cause.message === 'authentication_required' ? '' : cause.message); setStage('login') })
  }, [])

  useEffect(() => {
    if (stage === 'ready' && weddingId) loadWeddingData(weddingId).catch(() => setError('Não foi possível carregar os dados deste casamento.'))
  }, [stage, weddingId])

  async function login(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      const response = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password, code, turnstileToken }) })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'invalid_credentials')
      setAccount(result.account)
      if (result.mfaSetupRequired) {
        setStage('mfa-setup')
        return
      }
      await loadWeddings()
    } catch (cause) {
      setError(cause.message === 'invalid_credentials' ? 'E-mail, senha ou código inválido.' : cause.message === 'turnstile_verification_failed' ? 'Conclua novamente a verificação de segurança.' : cause.message === 'turnstile_unavailable' ? 'A verificação de segurança ainda não foi configurada neste site.' : cause.message)
      setStage('login')
    } finally {
      setTurnstileToken('')
      setTurnstileReset((current) => current + 1)
      setBusy(false)
    }
  }

  async function createGuest(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      const result = await request(`/api/couple/weddings/${weddingId}/guests`, {
        method: 'POST',
        body: JSON.stringify({ name: guestName, email: guestEmail, phone: guestPhone, groupId: guestGroup || null, partySize: Number(guestPartySize), guestType, dietaryNotes: guestDietaryNotes }),
      })
      setShare({ name: result.guest.name, url: result.accessUrl })
      setGuestName('')
      setGuestEmail('')
      setGuestPhone('')
      setGuestPartySize('1')
      setGuestDietaryNotes('')
      await loadWeddingData(weddingId)
      notify('Convidado salvo no D1. O link individual foi gerado.')
    } catch {
      setError('Não foi possível salvar o convidado. Confira os campos e tente novamente.')
    } finally {
      setBusy(false)
    }
  }

  async function importGuestCsv(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setError('')
    setGuestImportErrors([])
    setGuestImportResults([])
    if (file.size > 1024 * 1024) {
      setError('O arquivo CSV deve ter no máximo 1 MB.')
      return
    }
    setBusy(true)
    try {
      const importedGuests = parseGuestCsv(await file.text())
      if (!importedGuests.length || importedGuests.length > 100) throw new Error('Importe de 1 a 100 convidados por arquivo.')
      const response = await fetch(`/api/couple/weddings/${weddingId}/guests/import`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ guests: importedGuests }) })
      const result = await response.json()
      if (!response.ok) {
        if (Array.isArray(result.rows)) setGuestImportErrors(result.rows)
        throw new Error(result.error === 'guest_import_validation_failed' ? 'Revise as linhas indicadas. Nenhum convidado foi importado.' : 'Não foi possível importar o arquivo CSV.')
      }
      setGuestImportResults(result.guests)
      await loadWeddingData(weddingId)
      notify(`${result.guests.length} convidados importados. Baixe os links para compartilhar os convites.`)
    } catch (cause) {
      setError(cause.message || 'Não foi possível ler o arquivo CSV.')
    } finally {
      setBusy(false)
    }
  }

  function downloadGuestCsvTemplate() {
    const blob = new Blob(['\uFEFFnome;email;telefone;grupo;pessoas;perfil;restricao_alimentar\r\n'], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'modelo-convidados.csv'
    anchor.click()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  function downloadImportedGuestLinks() {
    const rows = [['nome', 'email', 'grupo', 'link_individual'], ...guestImportResults.map((guest) => [guest.name, guest.email || '', guest.groupName || '', guest.accessUrl])]
    const content = `\uFEFF${rows.map((row) => row.map(csvCell).join(';')).join('\r\n')}`
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'links-dos-convidados.csv'
    anchor.click()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  async function saveGuest(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      await request(`/api/couple/weddings/${weddingId}/guests/${editingGuest.id}`, { method: 'PATCH', body: JSON.stringify({
        name: editingGuest.name,
        email: editingGuest.email,
        phone: editingGuest.phone,
        groupId: editingGuest.group_id || null,
        partySize: Number(editingGuest.party_size),
        guestType: editingGuest.guest_type,
        dietaryNotes: editingGuest.dietary_notes,
      }) })
      setEditingGuest(null)
      await loadWeddingData(weddingId)
      notify('Dados do convidado atualizados')
    } catch {
      setError('Não foi possível atualizar este convidado. Confira os campos e tente novamente.')
    } finally {
      setBusy(false)
    }
  }

  async function rotateGuestLink(guest) {
    setBusy(true)
    setError('')
    try {
      const result = await request(`/api/couple/weddings/${weddingId}/guests/${guest.id}/invitation-token`, { method: 'POST' })
      setShare({ name: guest.name, url: result.accessUrl })
      notify('Novo link individual gerado. O anterior foi invalidado.')
    } catch {
      setError('Não foi possível gerar um novo link para este convite.')
    } finally {
      setBusy(false)
    }
  }

  async function removeGuest(guest) {
    if (!window.confirm(`Remover ${guest.name}? Os dados pessoais e o link serão apagados; RSVP e check-in serão preservados sem identificação.`)) return
    setBusy(true)
    setError('')
    try {
      await requestWithRecentMfa(request, `/api/couple/weddings/${weddingId}/guests/${guest.id}`, { method: 'DELETE' })
      setEditingGuest(null)
      setShare(null)
      await loadWeddingData(weddingId)
      notify('Dados pessoais removidos; histórico de RSVP e entrada preservado')
    } catch (cause) {
      setError(cause.message === 'invalid_mfa_code' ? 'O c\u00f3digo do autenticador n\u00e3o foi aceito.' : cause.message === 'mfa_reauthentication_cancelled' ? 'A confirma\u00e7\u00e3o do autenticador foi cancelada.' : cause.message === 'recent_mfa_required' ? 'Confirme novamente o segundo fator antes de remover os dados.' : 'N\u00e3o foi poss\u00edvel remover este convidado.')
    } finally {
      setBusy(false)
    }
  }

  async function createGroup(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      await request(`/api/couple/weddings/${weddingId}/groups`, { method: 'POST', body: JSON.stringify({ name: groupName, groupType }) })
      setGroupName('')
      await loadWeddingData(weddingId)
      notify('Grupo salvo no D1')
    } catch {
      setError('Não foi possível criar o grupo. Ele pode já existir neste casamento.')
    } finally {
      setBusy(false)
    }
  }

  function resetGiftForm() {
    setEditingGift(null)
    setGiftType('fixed')
    setGiftTitle('')
    setGiftDescription('')
    setGiftAmount('')
    setGiftGoal('')
  }

  function startGiftEdit(gift) {
    setEditingGift(gift)
    setGiftType(gift.gift_type)
    setGiftTitle(gift.title)
    setGiftDescription(gift.description || '')
    setGiftAmount(gift.amount_cents === null ? '' : (gift.amount_cents / 100).toFixed(2))
    setGiftGoal(gift.goal_cents === null ? '' : (gift.goal_cents / 100).toFixed(2))
  }

  async function saveGift(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      const body = {
        giftType,
        title: giftTitle,
        description: giftDescription,
        amountCents: giftType === 'fixed' ? parseBrlCents(giftAmount) : null,
        goalCents: giftGoal.trim() ? parseBrlCents(giftGoal) : null,
        status: editingGift?.status || 'active',
      }
      await request(`/api/couple/weddings/${weddingId}/gifts${editingGift ? `/${editingGift.id}` : ''}`, {
        method: editingGift ? 'PATCH' : 'POST',
        body: JSON.stringify(body),
      })
      resetGiftForm()
      await loadWeddingData(weddingId)
      notify(editingGift ? 'Presente atualizado.' : 'Presente adicionado à lista.')
    } catch (cause) {
      setError(cause.message === 'gift_limit_reached' ? 'O limite atual é de 60 presentes ativos por casamento.' : 'Não foi possível salvar o presente. Confira o título e os valores em reais.')
    } finally {
      setBusy(false)
    }
  }

  async function archiveGift(gift) {
    if (!window.confirm(`Arquivar “${gift.title}”? O presente deixa de ficar ativo na lista.`)) return
    setBusy(true)
    setError('')
    try {
      await request(`/api/couple/weddings/${weddingId}/gifts/${gift.id}`, { method: 'DELETE' })
      await loadWeddingData(weddingId)
      notify('Presente arquivado; o registro foi preservado.')
    } catch {
      setError('Não foi possível arquivar este presente.')
    } finally {
      setBusy(false)
    }
  }

  async function exportContributionCsv() {
    setBusy(true)
    setError('')
    try {
      const rows = []
      let page = 1
      let hasMore = true
      while (hasMore) {
        if (page > 10000) throw new Error('export_page_limit')
        const result = await request(`/api/couple/weddings/${weddingId}/contributions?page=${page}`)
        rows.push(...result.contributions)
        hasMore = result.hasMore
        page += 1
      }
      const statusLabels = { reported: 'Informado', pending: 'Pendente', confirmed: 'Confirmado', paid: 'Pago', failed: 'Falhou', refunded: 'Estornado', rejected: 'Recusado' }
      const table = [
        ['Data', 'Presente', 'Modo', 'Status', 'Pagador', 'Mensagem', 'Valor em centavos', 'Valor em reais', 'Taxa em centavos', 'Taxa em reais', 'Quem paga a taxa', 'Status da taxa'],
        ...rows.map((item) => [
          item.created_at,
          item.gift_title || 'Presente sem item vinculado',
          item.payment_mode === 'pix_direct' ? 'Pix direto' : 'Stripe',
          statusLabels[item.status] || item.status,
          item.payer_name || '',
          item.message || '',
          item.amount_cents,
          formatBrlCents(item.amount_cents),
          item.fee_amount_cents,
          formatBrlCents(item.fee_amount_cents),
          item.fee_paid_by === 'guest' ? 'Convidado' : 'Noivos',
          item.fee_status,
        ]),
      ]
      const blob = new Blob([`\uFEFF${table.map((row) => row.map(csvCell).join(';')).join('\r\n')}`], { type: 'text/csv;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = `casamento-${wedding?.slug || weddingId}-extrato-de-presentes.csv`
      anchor.click()
      window.setTimeout(() => URL.revokeObjectURL(url), 1000)
      notify(`Extrato exportado com ${rows.length} lançamentos`)
    } catch {
      setError('Não foi possível exportar o extrato completo de presentes.')
    } finally {
      setBusy(false)
    }
  }

  async function decideContribution(contribution, status) {
    const verb = status === 'confirmed' ? 'confirmar o recebimento' : 'recusar este registro'
    if (!window.confirm(`Deseja ${verb} de ${formatBrlCents(contribution.amount_cents)}?`)) return
    setBusy(true)
    setError('')
    try {
      await requestWithRecentMfa(request, `/api/couple/weddings/${weddingId}/contributions/${contribution.id}/decision`, {
        method: 'POST',
        body: JSON.stringify({ status }),
      })
      await loadWeddingData(weddingId)
      notify(status === 'confirmed' ? 'Recebimento confirmado' : 'Registro recusado')
    } catch (cause) {
      setError(cause.message === 'mfa_reauthentication_cancelled' ? 'A confirmação do autenticador foi cancelada.' : 'Não foi possível atualizar este recebimento.')
    } finally {
      setBusy(false)
    }
  }

  async function saveManualRsvp(event) {
    event.preventDefault()
    const isEditing = Boolean(editingRsvp)
    const targetEventId = isEditing ? editingRsvp.event_id : manualEventId
    const targetGuestId = isEditing ? editingRsvp.guest_id : manualGuestId
    setBusy(true)
    setError('')
    try {
      await request(`/api/couple/weddings/${weddingId}/rsvps${isEditing ? `/${editingRsvp.id}` : ''}`, {
        method: isEditing ? 'PUT' : 'POST',
        body: JSON.stringify({
          eventId: targetEventId,
          guestId: targetGuestId,
          status: isEditing ? editingRsvp.status : manualRsvpStatus,
          partySize: Number(isEditing ? editingRsvp.party_size : manualRsvpPartySize),
          dietaryNotes: isEditing ? editingRsvp.dietary_notes : manualRsvpDietaryNotes,
        }),
      })
      setEditingRsvp(null)
      setManualGuestId('')
      setManualRsvpStatus('confirmed')
      setManualRsvpPartySize('1')
      setManualRsvpDietaryNotes('')
      await loadWeddingData(weddingId)
      notify(isEditing ? 'Confirmação atualizada manualmente.' : 'Confirmação registrada manualmente.')
    } catch (cause) {
      setError(cause.message === 'party_size_exceeds_invitation' ? 'O número de pessoas excede o limite deste convite.' : 'Não foi possível salvar a confirmação para este convidado e evento.')
    } finally {
      setBusy(false)
    }
  }

  function editRsvp(item) {
    setEditingRsvp({ ...item, party_size: String(item.party_size), dietary_notes: item.dietary_notes || '' })
  }

  function resetWeddingEventForm() {
    setEditingEventId('')
    setEventName('')
    setEventType('ceremony')
    setEventStartsAt('')
    setEventVenue('')
    setEventAddress('')
    setEventGroupIds([])
  }

  function editWeddingEvent(item) {
    setEditingEventId(item.id)
    setEventName(item.name)
    setEventType(item.event_type)
    setEventStartsAt(item.starts_at ? new Date(new Date(item.starts_at).getTime() - new Date(item.starts_at).getTimezoneOffset() * 60000).toISOString().slice(0, 16) : '')
    setEventVenue(item.venue_name || '')
    setEventAddress(item.address || '')
    setEventGroupIds(item.group_ids || [])
  }

  async function saveWeddingEvent(event) {
    event.preventDefault()
    const wasEditing = Boolean(editingEventId)
    setBusy(true)
    setError('')
    try {
      const eventData = {
        name: eventName,
        eventType,
        startsAt: eventStartsAt ? new Date(eventStartsAt).toISOString() : null,
        venueName: eventVenue,
        address: eventAddress,
        groupIds: eventGroupIds,
      }
      await request(`/api/couple/weddings/${weddingId}/events${editingEventId ? `/${editingEventId}` : ''}`, { method: editingEventId ? 'PATCH' : 'POST', body: JSON.stringify(eventData) })
      resetWeddingEventForm()
      await loadWeddingData(weddingId)
      notify(wasEditing ? 'Evento atualizado.' : 'Evento criado. Agora você pode atribuir pessoas da equipe a ele.')
    } catch (cause) {
      setError(cause.message === 'event_limit_reached' ? 'Cada casamento pode ter até seis eventos.' : 'Não foi possível criar o evento. Confira os campos e tente novamente.')
    } finally {
      setBusy(false)
    }
  }

  async function updateMember(membership, changes) {
    setBusy(true)
    setError('')
    try {
      await request(`/api/couple/weddings/${weddingId}/members/${membership.id}`, { method: 'PATCH', body: JSON.stringify(changes) })
      await loadWeddingData(weddingId)
      notify('Permissão da equipe atualizada')
    } catch (cause) {
      setError(cause.message === 'cannot_remove_last_couple_admin' ? 'Não é possível remover o último administrador deste casamento.' : 'Não foi possível alterar este acesso.')
    } finally {
      setBusy(false)
    }
  }

  async function inviteTeamMember(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    setTeamInvitation(null)
    try {
      const result = await request(`/api/couple/weddings/${weddingId}/members/invitations`, { method: 'POST', body: JSON.stringify({ email: teamEmail, role: teamRole }) })
      setTeamEmail('')
      setTeamInvitation(result)
      await loadWeddingData(weddingId)
      notify('Convite criado. Copie o link e envie à pessoa convidada.')
    } catch (cause) {
      setError(cause.message === 'account_not_ready' ? 'Este e-mail pertence a uma conta ainda não ativada. Aguarde a ativação do convite anterior.' : cause.message === 'account_already_member' ? 'Esta conta já está vinculada a este casamento. Ajuste o perfil na lista de permissões.' : 'Não foi possível criar o convite. Confira o e-mail e tente novamente.')
    } finally {
      setBusy(false)
    }
  }

  async function assignMember(eventId, membership, assigned) {
    setBusy(true)
    setError('')
    try {
      await request(`/api/couple/weddings/${weddingId}/events/${eventId}/members/${membership.id}`, { method: 'PUT', body: JSON.stringify({ assigned }) })
      await loadWeddingData(weddingId)
      notify(assigned ? 'Membro atribuído ao evento' : 'Acesso ao evento removido')
    } catch {
      setError('Não foi possível atualizar a atribuição deste evento.')
    } finally {
      setBusy(false)
    }
  }

  async function createGodparentTask(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      await request(`/api/couple/weddings/${weddingId}/godparent-tasks`, {
        method: 'POST',
        body: JSON.stringify({ guestId: taskGuestId, title: taskTitle, details: taskDetails, dueAt: taskDueAt || null }),
      })
      setTaskTitle('')
      setTaskDetails('')
      setTaskDueAt('')
      await loadWeddingData(weddingId)
      notify('Tarefa individual atribuída ao padrinho')
    } catch {
      setError('Não foi possível salvar a tarefa para este padrinho.')
    } finally {
      setBusy(false)
    }
  }

  if (stage === 'mfa-setup') return <SuperAdminAccessFrame title="Proteja sua conta." description="Configure um autenticador para continuar ao painel dos noivos." eyebrow="SEGUNDO FATOR" brand="Painel dos noivos"><AccountMfaSetup onComplete={loadWeddings} /></SuperAdminAccessFrame>
  if (stage !== 'ready') return <SuperAdminAccessFrame title="Painel dos noivos." description="Entre com a conta vinculada ao seu casamento. O primeiro acesso exige cadastrar um autenticador; nos próximos, use o código de seis dígitos." eyebrow="ÁREA DOS NOIVOS" brand="Painel dos noivos">
    <form className="role-card admin-login-form" onSubmit={login}><label>E-mail<input type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} required /></label><label>Senha<PasswordInput autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required /></label><label>Código do autenticador, se já cadastrado<input inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength="6" value={code} onChange={(event) => setCode(event.target.value)} /></label><TurnstileChallenge onToken={setTurnstileToken} resetKey={turnstileReset} />{error && <p className="admin-form-error" role="alert">{error}</p>}<button className="button-primary" type="submit" disabled={busy || stage === 'checking' || !TURNSTILE_SITE_KEY || !turnstileToken}>Entrar <LockKeyhole size={15} /></button><a className="text-link reset-admin-link" href="/recuperar-senha">Esqueci minha senha</a><p className="signup-login-link">Ainda não têm uma conta? <a href="/criar-site">Cadastrem o casamento</a></p><p className="signup-login-link">Querem conhecer o painel? <a href="/painel/demo">Abrir demonstração sem cadastro</a></p></form>
  </SuperAdminAccessFrame>

  if (isReader) return <PublishedOnlyDashboard account={account} wedding={wedding} config={siteConfig} events={events} publishedAt={sitePublishedAt} onLogout={async () => { await fetch('/api/auth/logout', { method: 'POST' }); window.location.assign('/') }} />

  return <div className={`role-page couple-role-page${rsvpPrintActive ? ' couple-print-rsvps' : ''}`}><header className="role-header"><a className="role-brand" href="/"><span>e<span>&</span>t</span><strong>Painel dos noivos</strong></a><span className="role-preview">Acesso: {account?.email}</span><a className="button-outline" href="/ajuda">Ajuda</a><button className="button-outline" onClick={() => setTab('site')}>{isEditor ? 'Editar site' : 'Editar meu site'}</button><button className="button-outline" onClick={async () => { await fetch('/api/auth/logout', { method: 'POST' }); window.location.assign('/') }}>Sair</button></header><main className="role-main"><div className="role-intro"><span className="role-icon"><Settings2 size={19} /></span><span className="eyebrow">{isEditor ? 'EDITOR DO CASAMENTO' : 'ÁREA DOS NOIVOS'}</span><h1>{wedding ? `${wedding.partner_one_name} & ${wedding.partner_two_name}` : 'Seu casamento'}</h1><p>{isEditor ? 'Você pode alterar o site e os eventos deste casamento.' : 'Convidados, grupos e respostas ficam limitados ao casamento autorizado nesta sessão.'}</p></div>
    {weddings.length > 1 && <label className="staff-event-select">Casamento<select value={weddingId} onChange={(event) => { setWeddingId(event.target.value); setTab('site') }}>{weddings.map((item) => <option key={item.id} value={item.id}>{item.partner_one_name} & {item.partner_two_name}</option>)}</select></label>}
    {error && <p className="admin-form-error" role="alert">{error}</p>}
    {!isEditor && <div className="role-stat-grid"><div className="role-stat"><span>Convidados ativos</span><strong>{guests.length}</strong></div><div className="role-stat"><span>Grupos</span><strong>{groups.length}</strong></div><div className="role-stat"><span>Eventos</span><strong>{events.length}</strong></div><div className="role-stat"><span>Confirmações</span><strong>{rsvps.filter((item) => item.status === 'confirmed').length}</strong></div></div>}
    <div className="couple-panel-tabs">
      <button className={tab === 'site' ? 'selected' : ''} onClick={() => setTab('site')}>Personalizar site</button>
      {(isEditor || !isReader) && <button className={tab === 'events' ? 'selected' : ''} onClick={() => setTab('events')}>Eventos</button>}
      {!isEditor && <>
        <button className={tab === 'guests' ? 'selected' : ''} onClick={() => setTab('guests')}>Convidados e convites</button>
        <button className={tab === 'rsvps' ? 'selected' : ''} onClick={() => setTab('rsvps')}>Confirmações</button>
        <button className={tab === 'groups' ? 'selected' : ''} onClick={() => setTab('groups')}>Grupos</button>
        <button className={tab === 'team' ? 'selected' : ''} onClick={() => setTab('team')}>Equipe e acessos</button>
        <button className={tab === 'godparents' ? 'selected' : ''} onClick={() => setTab('godparents')}>Padrinhos</button>
        <button className={tab === 'memories' ? 'selected' : ''} onClick={() => setTab('memories')}>Fotos dos convidados</button>
        <button className={tab === 'gifts' ? 'selected' : ''} onClick={() => setTab('gifts')}>Presentes</button>
      </>}
    </div>
    {tab === 'guests' && <>
      <section className="role-card"><div className="role-card-heading"><div><span className="eyebrow">NOVO CONVITE</span><h2>Adicionar convidado</h2></div></div><form className="couple-guest-form" onSubmit={createGuest}><label>Nome<input value={guestName} onChange={(event) => setGuestName(event.target.value)} maxLength="160" required /></label><label>E-mail<input type="email" value={guestEmail} onChange={(event) => setGuestEmail(event.target.value)} /></label><label>Telefone<input type="tel" value={guestPhone} onChange={(event) => setGuestPhone(event.target.value)} /></label><label>Grupo<select value={guestGroup} onChange={(event) => setGuestGroup(event.target.value)}><option value="">Sem grupo</option>{groups.map((group) => <option value={group.id} key={group.id}>{group.name}</option>)}</select></label><label>Pessoas<input type="number" min="1" max="20" value={guestPartySize} onChange={(event) => setGuestPartySize(event.target.value)} required /></label><label>Perfil<select value={guestType} onChange={(event) => setGuestType(event.target.value)}><option value="guest">Convidado</option><option value="godparent">Padrinho ou madrinha</option></select></label><label className="couple-guest-wide">Restrição alimentar<input value={guestDietaryNotes} maxLength="1000" onChange={(event) => setGuestDietaryNotes(event.target.value)} /></label><button type="submit" className="button-primary" disabled={busy}>Salvar e gerar link individual <QrCode size={15} /></button></form></section>
      <section className="role-card guest-import-card"><div className="role-card-heading"><div><span className="eyebrow">IMPORTAÇÃO EM LOTE</span><h2>Adicionar convidados por CSV</h2></div><Users size={18} /></div><p className="team-access-note">Use o modelo com cabeçalho em português ou inglês. Os grupos precisam existir neste casamento. Até 100 convidados por arquivo; nenhuma linha é salva se houver erro.</p><div className="guest-import-actions"><button type="button" className="button-outline" onClick={downloadGuestCsvTemplate}>Baixar modelo CSV</button><label className="button-primary guest-import-file">{busy ? 'Importando…' : 'Selecionar arquivo CSV'}<input type="file" accept=".csv,text/csv" onChange={importGuestCsv} disabled={busy} /></label></div>{guestImportErrors.length > 0 && <div className="guest-import-errors" role="alert"><strong>Revise o arquivo</strong>{guestImportErrors.map((item) => <span key={item.row}>Linha {item.row}: {item.fields.join(', ')}</span>)}</div>}{guestImportResults.length > 0 && <div className="guest-import-success"><span>{guestImportResults.length} convidados importados. Os links individuais foram criados.</span><button type="button" className="button-outline" onClick={downloadImportedGuestLinks}>Baixar links dos convites <QrCode size={14} /></button></div>}</section>      {editingGuest && <section className="role-card"><div className="role-card-heading"><div><span className="eyebrow">EDITAR CONVITE</span><h2>{editingGuest.name}</h2></div></div><form className="couple-guest-form" onSubmit={saveGuest}><label>Nome<input value={editingGuest.name} onChange={(event) => setEditingGuest({ ...editingGuest, name: event.target.value })} maxLength="160" required /></label><label>E-mail<input type="email" value={editingGuest.email || ''} onChange={(event) => setEditingGuest({ ...editingGuest, email: event.target.value })} /></label><label>Telefone<input type="tel" value={editingGuest.phone || ''} onChange={(event) => setEditingGuest({ ...editingGuest, phone: event.target.value })} /></label><label>Grupo<select value={editingGuest.group_id || ''} onChange={(event) => setEditingGuest({ ...editingGuest, group_id: event.target.value })}><option value="">Sem grupo</option>{groups.map((group) => <option value={group.id} key={group.id}>{group.name}</option>)}</select></label><label>Pessoas<input type="number" min="1" max="20" value={editingGuest.party_size} onChange={(event) => setEditingGuest({ ...editingGuest, party_size: event.target.value })} required /></label><label>Perfil<select value={editingGuest.guest_type} onChange={(event) => setEditingGuest({ ...editingGuest, guest_type: event.target.value })}><option value="guest">Convidado</option><option value="godparent">Padrinho ou madrinha</option></select></label><label className="couple-guest-wide">Restrição alimentar<input value={editingGuest.dietary_notes || ''} maxLength="1000" onChange={(event) => setEditingGuest({ ...editingGuest, dietary_notes: event.target.value })} /></label><button type="submit" className="button-primary" disabled={busy}>Salvar alterações <Check size={15} /></button><button type="button" className="button-outline" disabled={busy} onClick={() => setEditingGuest(null)}>Cancelar</button></form></section>}
      {share && <InvitationShare share={share} onClose={() => setShare(null)} notify={notify} />}
      <section className="role-card superadmin-card"><div className="role-card-heading"><div><span className="eyebrow">LISTA PRIVADA</span><h2>Convidados</h2></div><span className="task-count">{guests.length} registros</span></div><div className="superadmin-table-wrap"><table className="superadmin-table"><thead><tr><th>NOME</th><th>GRUPO</th><th>PESSOAS</th><th>RESPOSTA</th><th>PERFIL</th><th>AÇÕES</th></tr></thead><tbody>{guests.map((guest) => <tr key={guest.id}><td><strong>{guest.name}</strong><small>{guest.email || guest.phone || 'Sem contato cadastrado'}</small></td><td>{guest.group_name || '—'}</td><td>{guest.party_size}</td><td>{guest.rsvp_status}</td><td>{guest.guest_type === 'godparent' ? 'Padrinho' : 'Convidado'}</td><td><div className="guest-admin-actions"><button className="button-outline" disabled={busy} onClick={() => setEditingGuest({ ...guest })} aria-label={`Editar ${guest.name}`}><Pencil size={14} /></button><button className="button-outline" disabled={busy} onClick={() => rotateGuestLink(guest)} aria-label={`Gerar novo link para ${guest.name}`}><QrCode size={14} /></button><button className="button-outline guest-remove-button" disabled={busy} onClick={() => removeGuest(guest)} aria-label={`Remover ${guest.name}`}><Trash2 size={14} /></button></div></td></tr>)}</tbody></table></div></section>
    </>}
    {tab === 'rsvps' && <>
      <section className="role-card"><div className="role-card-heading"><div><span className="eyebrow">REGISTRO MANUAL</span><h2>{editingRsvp ? 'Corrigir confirmação' : 'Registrar resposta recebida'}</h2></div><ListChecks size={18} /></div><p className="team-access-note">Use quando o convidado responder por telefone ou mensagem. A alteração fica registrada na auditoria do casamento.</p><form className="couple-guest-form" onSubmit={saveManualRsvp}>
        {!editingRsvp && <><label>Evento<select value={manualEventId} onChange={(event) => { setManualEventId(event.target.value); setManualGuestId('') }} required><option value="">Selecione um evento</option>{events.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><label className="couple-guest-wide">Convidado sem resposta neste evento<select value={manualGuestId} onChange={(event) => { const guest = guests.find((item) => item.id === event.target.value); setManualGuestId(event.target.value); setManualRsvpPartySize(String(guest?.party_size || 1)) }} required disabled={!manualEventId}><option value="">Selecione um convidado</option>{availableManualGuests.map((guest) => <option key={guest.id} value={guest.id}>{guest.name} · até {guest.party_size} pessoa(s)</option>)}</select></label></>}
        {editingRsvp && <><label>Convidado<input value={editingRsvp.guest_name} readOnly /></label><label>Evento<input value={editingRsvp.event_name} readOnly /></label></>}
        <label>Resposta<select value={editingRsvp ? editingRsvp.status : manualRsvpStatus} onChange={(event) => editingRsvp ? setEditingRsvp({ ...editingRsvp, status: event.target.value }) : setManualRsvpStatus(event.target.value)}><option value="confirmed">Confirmou presença</option><option value="declined">Não poderá comparecer</option></select></label>
        <label>Pessoas<input type="number" min="1" max={editingRsvp?.invited_party_size || guests.find((item) => item.id === manualGuestId)?.party_size || 20} value={editingRsvp ? editingRsvp.party_size : manualRsvpPartySize} onChange={(event) => editingRsvp ? setEditingRsvp({ ...editingRsvp, party_size: event.target.value }) : setManualRsvpPartySize(event.target.value)} required /></label>
        <label className="couple-guest-wide">Restrições alimentares<textarea rows="2" maxLength="1000" value={editingRsvp ? editingRsvp.dietary_notes : manualRsvpDietaryNotes} onChange={(event) => editingRsvp ? setEditingRsvp({ ...editingRsvp, dietary_notes: event.target.value }) : setManualRsvpDietaryNotes(event.target.value)} /></label>
        <button type="submit" className="button-primary" disabled={busy || (!editingRsvp && (!manualGuestId || !events.length))}>{editingRsvp ? 'Salvar correção' : 'Registrar confirmação'} <Check size={15} /></button>{editingRsvp && <button type="button" className="button-outline" disabled={busy} onClick={() => setEditingRsvp(null)}>Cancelar</button>}
      </form>{manualEventId && !availableManualGuests.length && !editingRsvp && <p className="buffet-empty">Todos os convidados elegíveis já têm resposta para este evento.</p>}</section>
      <section className="role-card superadmin-card couple-rsvp-print"><div className="role-card-heading"><div><span className="eyebrow">RESPOSTAS POR EVENTO</span><h2>Lista de presenças</h2></div><span className="task-count">{rsvpExportRows.length} respostas</span></div><div className="couple-rsvp-toolbar"><label>Filtrar relatório<select value={rsvpExportEventId} onChange={(event) => setRsvpExportEventId(event.target.value)}><option value="">Todos os eventos</option>{events.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><button className="button-outline print-button" disabled={!rsvpExportRows.length} onClick={exportRsvpPdf}><Printer size={15} /> Exportar relatório em PDF</button></div><div className="superadmin-table-wrap"><table className="superadmin-table"><thead><tr><th>CONVIDADO</th><th>EVENTO</th><th>RESPOSTA</th><th>PESSOAS</th><th>RESTRIÇÕES</th><th>AÇÃO</th></tr></thead><tbody>{rsvpExportRows.map((item) => <tr key={item.id}><td><strong>{item.guest_name}</strong></td><td>{item.event_name}</td><td>{item.status === 'confirmed' ? 'Confirmou' : 'Não poderá comparecer'}</td><td>{item.party_size}</td><td>{item.dietary_notes || '—'}</td><td><button className="button-outline print-button" disabled={busy} onClick={() => editRsvp(item)} aria-label={`Corrigir resposta de ${item.guest_name} para ${item.event_name}`}><Pencil size={14} /> Corrigir</button></td></tr>)}</tbody></table></div>{!rsvpExportRows.length && <p className="buffet-empty">As respostas dos convidados aparecerão aqui.</p>}</section>
    </>}    {tab === 'groups' && <><section className="role-card"><div className="role-card-heading"><div><span className="eyebrow">ORGANIZAÇÃO</span><h2>Criar grupo</h2></div></div><form className="couple-group-form" onSubmit={createGroup}><label>Nome do grupo<input value={groupName} onChange={(event) => setGroupName(event.target.value)} maxLength="100" required /></label><label>Categoria<select value={groupType} onChange={(event) => setGroupType(event.target.value)}><option value="family">Família</option><option value="friends">Amigos</option><option value="godparent">Padrinhos</option><option value="other">Outro</option></select></label><button type="submit" className="button-primary" disabled={busy}>Criar grupo <Users size={15} /></button></form></section><section className="role-card"><span className="eyebrow">GRUPOS DO CASAMENTO</span><div className="group-chip-list">{groups.map((group) => <span className="group-chip" key={group.id}>{group.name} · {group.group_type}</span>)}{!groups.length && <p className="buffet-empty">Nenhum grupo cadastrado.</p>}</div></section></>}
    {tab === 'events' && <>
      <section className="role-card"><div className="role-card-heading"><div><span className="eyebrow">PROGRAMAÇÃO DO CASAMENTO</span><h2>{editingEventId ? 'Editar evento' : 'Criar evento'}</h2></div><span className="task-count">{events.length}/6 eventos</span></div><p className="team-access-note">Cada evento pode ter uma lista de grupos autorizados. Se nenhum grupo for escolhido, o evento fica disponível a todos os convidados.</p><form className="wedding-event-form" onSubmit={saveWeddingEvent}><label>Nome<input value={eventName} onChange={(event) => setEventName(event.target.value)} maxLength="120" required placeholder="Cerimônia, recepção, brunch…" /></label><label>Tipo<select value={eventType} onChange={(event) => setEventType(event.target.value)}><option value="ceremony">Cerimônia</option><option value="reception">Recepção</option><option value="rehearsal">Ensaio</option><option value="brunch">Brunch</option><option value="other">Outro</option></select></label><label>Data e hora<input type="datetime-local" value={eventStartsAt} onChange={(event) => setEventStartsAt(event.target.value)} /></label><label>Local<input value={eventVenue} onChange={(event) => setEventVenue(event.target.value)} maxLength="160" /></label><label className="event-form-wide">Endereço<input value={eventAddress} onChange={(event) => setEventAddress(event.target.value)} maxLength="500" /></label>{groups.length > 0 && <fieldset className="event-group-access"><legend>Quem pode acessar este evento?</legend><div>{groups.map((group) => <label key={group.id}><input type="checkbox" checked={eventGroupIds.includes(group.id)} onChange={(change) => setEventGroupIds((current) => change.target.checked ? [...current, group.id] : current.filter((id) => id !== group.id))} />{group.name}</label>)}</div></fieldset>}<div className="event-form-actions"><button className="button-primary" type="submit" disabled={busy || (!editingEventId && events.length >= 6)}>{editingEventId ? 'Salvar alterações' : 'Criar evento'} <CalendarDays size={15} /></button>{editingEventId && <button className="button-outline" type="button" disabled={busy} onClick={resetWeddingEventForm}>Cancelar</button>}</div></form></section>
      <section className="role-card"><div className="role-card-heading"><div><span className="eyebrow">SEUS EVENTOS</span><h2>Programação e acesso</h2></div></div><div className="wedding-event-list">{events.map((item) => <article key={item.id}><div><strong>{item.name}</strong><small>{item.starts_at ? new Date(item.starts_at).toLocaleString('pt-BR') : 'Data a definir'} · {item.venue_name || 'Local a definir'}</small><small>{item.group_ids?.length ? `Acesso: ${groups.filter((group) => item.group_ids.includes(group.id)).map((group) => group.name).join(', ')}` : 'Acesso: todos os convidados'}</small></div><div className="wedding-event-actions"><span className="admin-state admin-state-active">{item.event_type}</span><button className="button-outline" onClick={() => editWeddingEvent(item)}>Editar</button></div></article>)}</div>{!events.length && <p className="buffet-empty">Cadastre cerimônia, recepção ou outros eventos para organizar as confirmações e liberar acessos para a equipe.</p>}</section>
    </>}
    {tab === 'team' && <>
    <section className="role-card"><div className="role-card-heading"><div><span className="eyebrow">NOVO ACESSO</span><h2>Convidar pessoa para o casamento</h2></div><Users size={19} /></div><p className="team-access-note">Editor altera o site e os eventos; leitor consulta somente o conteúdo publicado. A equipe do evento e a equipe de entrada acessam apenas os eventos atribuídos. O envio será manual: copie o link e envie à pessoa.</p><form className="team-invite-form" onSubmit={inviteTeamMember}><label>E-mail<input type="email" value={teamEmail} onChange={(event) => setTeamEmail(event.target.value)} required maxLength="254" /></label><label>Acesso<select value={teamRole} onChange={(event) => setTeamRole(event.target.value)}><option value="couple_admin">Administrador do casal</option><option value="editor">Editor do site e eventos</option><option value="reader">Leitor do conteúdo publicado</option><option value="checkin_staff">Equipe de entrada</option><option value="event_staff">Equipe do evento</option></select></label><button type="submit" className="button-primary" disabled={busy}>Gerar convite <ArrowRight size={15} /></button></form>{teamInvitation && <div className="team-invitation-result"><strong>Convite para {teamInvitation.email}</strong><span>Expira em {new Date(teamInvitation.expiresAt).toLocaleString('pt-BR')}</span><div><input readOnly value={teamInvitation.invitationUrl} aria-label="Link de convite da equipe" /><button className="button-outline" onClick={() => navigator.clipboard.writeText(teamInvitation.invitationUrl).then(() => notify('Link copiado'))}><Copy size={14} /> Copiar</button></div></div>}</section>
      <section className="role-card"><div className="role-card-heading"><div><span className="eyebrow">MEMBROS DO CASAMENTO</span><h2>Permissões da equipe</h2></div><span className="task-count">{members.length} membros</span></div><p className="team-access-note">Cada pessoa mantém acesso apenas aos eventos atribuídos. Contas já vinculadas ao casamento aparecem nesta lista.</p><div className="team-member-list">{members.map((member) => <article className="team-member-row" key={member.id}><div><strong>{member.email}</strong><small>{member.account_id === account?.id ? 'Sua conta' : member.account_id}</small></div><label>Perfil<select value={member.role} disabled={busy} onChange={(event) => updateMember(member, { role: event.target.value })}><option value="couple_admin">Administrador do casal</option><option value="editor">Editor</option><option value="reader">Leitor</option><option value="event_staff">Equipe do evento</option><option value="checkin_staff">Equipe de entrada</option></select></label><label>Status<select value={member.status} disabled={busy} onChange={(event) => updateMember(member, { status: event.target.value })}><option value="active">Ativo</option><option value="revoked">Revogado</option><option value="pending" disabled>Pendente</option></select></label></article>)}{!members.length && <p className="buffet-empty">Nenhum membro adicional está vinculado a este casamento.</p>}</div></section>
      {events.length > 0 && members.some((member) => ['event_staff', 'checkin_staff'].includes(member.role)) && <section className="role-card"><span className="eyebrow">ACESSO POR EVENTO</span><h2>Atribuir eventos</h2><div className="team-assignment-list">{members.filter((member) => ['event_staff', 'checkin_staff'].includes(member.role)).map((member) => <article key={member.id}><strong>{member.email}<small>{member.role === 'checkin_staff' ? 'Equipe de entrada' : 'Equipe do evento'}</small></strong><div>{events.map((event) => { const assigned = assignments.some((item) => item.membership_id === member.id && item.event_id === event.id); return <label key={event.id}><input type="checkbox" checked={assigned} disabled={busy || member.status !== 'active'} onChange={(input) => assignMember(event.id, member, input.target.checked)} />{event.name}</label> })}</div></article>)}</div></section>}
    </>}
    {tab === 'gifts' && <>
      <section className="role-card"><div className="role-card-heading"><div><span className="eyebrow">CATÁLOGO DO CASAMENTO</span><h2>{editingGift ? 'Editar presente' : 'Adicionar presente'}</h2></div><Gift size={18} /></div><p className="team-access-note">Crie cotas com valor definido ou presentes de valor livre. A lista fica vinculada somente a este casamento. Recebimentos e pagamentos ainda não estão conectados.</p><form className="gift-management-form" onSubmit={saveGift}><label>Nome do presente<input value={giftTitle} onChange={(event) => setGiftTitle(event.target.value)} maxLength="120" required /></label><label>Tipo<select value={giftType} onChange={(event) => setGiftType(event.target.value)}><option value="fixed">Cota com valor definido</option><option value="custom">Valor livre</option></select></label>{giftType === 'fixed' && <label>Valor da cota (R$)<input inputMode="decimal" value={giftAmount} onChange={(event) => setGiftAmount(event.target.value)} placeholder="150,00" required /></label>}<label>Meta opcional (R$)<input inputMode="decimal" value={giftGoal} onChange={(event) => setGiftGoal(event.target.value)} placeholder="Sem meta" /></label><label className="gift-form-wide">Descrição<textarea rows="3" maxLength="500" value={giftDescription} onChange={(event) => setGiftDescription(event.target.value)} /></label>{editingGift && <label>Status<select value={editingGift.status} onChange={(event) => setEditingGift({ ...editingGift, status: event.target.value })}><option value="active">Ativo</option><option value="archived">Arquivado</option></select></label>}<div className="gift-form-actions"><button type="submit" className="button-primary" disabled={busy || (!editingGift && gifts.filter((item) => item.status === 'active').length >= 60)}>{editingGift ? 'Salvar presente' : 'Adicionar à lista'} <Check size={15} /></button>{editingGift && <button type="button" className="button-outline" disabled={busy} onClick={resetGiftForm}>Cancelar</button>}</div></form></section>
      <section className="role-card"><div className="role-card-heading"><div><span className="eyebrow">LISTA DE PRESENTES</span><h2>Itens cadastrados</h2></div><span className="task-count">{gifts.filter((item) => item.status === 'active').length}/60 ativos</span></div><div className="couple-gift-list">{gifts.map((gift) => <article key={gift.id}><div><strong>{gift.title}</strong><small>{gift.gift_type === 'custom' ? 'Valor livre' : formatBrlCents(gift.amount_cents)}{gift.goal_cents ? ` · meta ${formatBrlCents(gift.goal_cents)}` : ''}</small>{gift.description && <p>{gift.description}</p>}</div><span className={`admin-state ${gift.status === 'active' ? 'admin-state-active' : ''}`}>{gift.status === 'active' ? 'Ativo' : 'Arquivado'}</span><div className="guest-admin-actions"><button className="button-outline" disabled={busy} onClick={() => startGiftEdit(gift)} aria-label={`Editar ${gift.title}`}><Pencil size={14} /></button>{gift.status === 'active' && <button className="button-outline guest-remove-button" disabled={busy} onClick={() => archiveGift(gift)} aria-label={`Arquivar ${gift.title}`}><Trash2 size={14} /></button>}</div></article>)}{!gifts.length && <p className="buffet-empty">Adicione os primeiros presentes para este casamento.</p>}</div></section>
    </>}
    {tab === 'gifts' && <>
      <section className="role-card"><div className="role-card-heading"><div><span className="eyebrow">REGISTRO FINANCEIRO</span><h2>Recebimentos e taxas</h2></div><button className="button-outline" onClick={exportContributionCsv} disabled={busy || !contributionSummary.total_count}><Download size={15} /> Exportar CSV</button></div><div className="gift-ledger-summary"><div><span>Presentes confirmados</span><strong>{formatBrlCents(contributionSummary.received_cents)}</strong></div><div><span>Taxas pendentes</span><strong>{formatBrlCents(contributionSummary.fee_due_cents)}</strong></div><div><span>Registros financeiros</span><strong>{contributionSummary.total_count}</strong></div></div><div className="couple-gift-list">{contributions.map((item) => <article key={item.id}><div><strong>{item.gift_title || 'Presente sem item vinculado'} · {formatBrlCents(item.amount_cents)}</strong><small>{item.payer_name || 'Convidado'} · {item.payment_mode === 'pix_direct' ? 'Pix direto' : 'Stripe'} · {new Date(item.created_at).toLocaleDateString('pt-BR')}</small>{item.message && <p>{item.message}</p>}</div><span className={`admin-state ${['confirmed', 'paid'].includes(item.status) ? 'admin-state-active' : ''}`}>{({ reported: 'Informado', pending: 'Pendente', confirmed: 'Confirmado', paid: 'Pago', failed: 'Falhou', refunded: 'Estornado', rejected: 'Recusado' })[item.status] || item.status}</span><small className="gift-fee-state">Taxa {formatBrlCents(item.fee_amount_cents)} · {item.fee_status === 'due' ? 'pendente' : item.fee_status === 'paid' ? 'paga' : 'não cobrada'}</small>{item.status === 'reported' && item.payment_mode === 'pix_direct' && <div className="guest-admin-actions"><button className="button-outline" disabled={busy} onClick={() => decideContribution(item, 'confirmed')}>Confirmar</button><button className="button-outline guest-remove-button" disabled={busy} onClick={() => decideContribution(item, 'rejected')}>Recusar</button></div>}</article>)}{!contributions.length && <p className="buffet-empty">Os recebimentos aparecerão aqui quando os modos de pagamento forem ativados.</p>}</div><p className="team-access-note">A confirmação financeira vem do webhook do provedor ou dos noivos no Pix direto. O retorno do navegador não confirma pagamento.</p></section>
    </>}
    {tab === 'godparents' && <>
      <section className="role-card"><div className="role-card-heading"><div><span className="eyebrow">ORIENTAÇÕES INDIVIDUAIS</span><h2>Atribuir tarefa a um padrinho</h2></div></div><form className="godparent-task-form" onSubmit={createGodparentTask}><label>Padrinho ou madrinha<select value={taskGuestId} onChange={(event) => setTaskGuestId(event.target.value)} required><option value="">Selecione um convite</option>{guests.filter((guest) => guest.guest_type === 'godparent').map((guest) => <option value={guest.id} key={guest.id}>{guest.name}</option>)}</select></label><label>Tarefa<input value={taskTitle} onChange={(event) => setTaskTitle(event.target.value)} maxLength="160" required /></label><label>Prazo<input type="datetime-local" value={taskDueAt} onChange={(event) => setTaskDueAt(event.target.value)} /></label><label className="godparent-task-wide">Detalhes<textarea value={taskDetails} onChange={(event) => setTaskDetails(event.target.value)} maxLength="2000" rows="3" /></label><button className="button-primary" disabled={busy || !guests.some((guest) => guest.guest_type === 'godparent')} type="submit">Enviar orientação <Heart size={15} /></button></form>{!guests.some((guest) => guest.guest_type === 'godparent') && <p className="buffet-empty">Cadastre um convidado com perfil de padrinho para atribuir tarefas.</p>}</section>
      <section className="role-card"><div className="role-card-heading"><div><span className="eyebrow">TAREFAS ENVIADAS</span><h2>Orientações por convite</h2></div><span className="task-count">{godparentTasks.length} tarefas</span></div><div className="godparent-admin-task-list">{godparentTasks.map((task) => <article key={task.id}><div><strong>{task.title}</strong><small>{task.guest_name} · {task.due_at ? new Date(task.due_at).toLocaleString('pt-BR') : 'Sem prazo'}</small>{task.details && <p>{task.details}</p>}</div><span className={`admin-state ${task.status === 'done' ? 'admin-state-active' : ''}`}>{task.status === 'done' ? 'Concluída' : 'Pendente'}</span></article>)}{!godparentTasks.length && <p className="buffet-empty">As tarefas atribuídas aparecerão aqui.</p>}</div></section>
    </>}
    {tab === 'memories' && <GuestPhotoAlbum weddingId={weddingId} notify={notify} />}
    {tab === 'site' && <CoupleSiteEditor wedding={wedding} config={siteConfig} savedConfig={savedSiteConfig} publishedConfig={publishedSiteConfig} publishedAt={sitePublishedAt} setConfig={setSiteConfig} onSave={saveSiteDraft} onPublish={publishSite} saving={siteConfigLoading} />}
  </main><footer className="role-footer"><span>Área dos noivos</span><a href="https://henriquesouzas.com" target="_blank" rel="noreferrer">henriquesouzas.com</a></footer></div>
}

function GuestPhotoAlbum({ weddingId, notify }) {
  const [photos, setPhotos] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [busyPhoto, setBusyPhoto] = useState('')

  useEffect(() => {
    let active = true
    async function loadAlbum() {
      try {
        const response = await fetch(`/api/couple/weddings/${weddingId}/photos`)
        const result = await response.json()
        if (!response.ok) throw new Error('Não foi possível carregar as fotos.')
        if (!active) return
        setPhotos(result.photos)
        setError('')
      } catch (cause) {
        if (active) setError(cause.message)
      } finally {
        if (active) setLoading(false)
      }
    }
    loadAlbum()
    return () => {
      active = false
    }
  }, [weddingId])

  async function removePhoto(photo) {
    if (!window.confirm(`Remover a foto enviada por ${photo.guest_name}?`)) return
    setBusyPhoto(photo.id)
    try {
      let response = await fetch(`/api/couple/weddings/${weddingId}/photos/${photo.id}`, { method: 'DELETE' })
      let result = await response.json().catch(() => ({}))
      if (response.status === 403 && result.error === 'recent_mfa_required') {
        const code = window.prompt('Confirme a remoção com o código de seis dígitos do autenticador.')
        if (!code) throw new Error('A confirmação do autenticador foi cancelada.')
        const verification = await fetch('/api/auth/mfa/reauth', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code }) })
        if (!verification.ok) throw new Error('O código do autenticador não foi aceito.')
        response = await fetch(`/api/couple/weddings/${weddingId}/photos/${photo.id}`, { method: 'DELETE' })
        result = await response.json().catch(() => ({}))
      }
      if (!response.ok) throw new Error('Não foi possível remover esta foto.')
      setPhotos((current) => current.filter((item) => item.id !== photo.id))
      notify('Foto removida do álbum')
    } catch (cause) {
      setError(cause.message)
    } finally {
      setBusyPhoto('')
    }
  }

  return <section className="role-card guest-photo-album"><div className="role-card-heading"><div><span className="eyebrow">LEMBRANÇAS DA CELEBRAÇÃO</span><h2>Fotos pelos olhos dos convidados</h2></div><button className="button-outline photo-album-print-button" onClick={() => window.print()} disabled={!photos.length}><Printer size={15} /> Salvar álbum em PDF</button></div><p>As fotos aparecem aqui com o nome de quem registrou o momento. Na impressão do navegador, escolha “Salvar como PDF” para guardar um álbum que se adapta à tela e ao papel.</p>{error && <p className="admin-form-error" role="alert">{error}</p>}{loading ? <p>Carregando as lembranças…</p> : photos.length ? <div className="guest-photo-grid">{photos.map((photo) => <figure key={photo.id}><img src={`/api/couple/weddings/${weddingId}/photos/${photo.id}/image`} alt={`Foto enviada por ${photo.guest_name} no evento ${photo.event_name}`} loading="lazy" /><figcaption><span><strong>{photo.guest_name}</strong><small>{photo.event_name} · {new Date(photo.created_at).toLocaleDateString('pt-BR')}</small></span><button className="button-outline guest-remove-button photo-remove-button" onClick={() => removePhoto(photo)} disabled={busyPhoto === photo.id} aria-label={`Remover foto enviada por ${photo.guest_name}`}><Trash2 size={14} /></button></figcaption></figure>)}</div> : <div className="guest-photo-empty"><Camera size={23} /><strong>O álbum começa com uma foto espontânea.</strong><span>Ativem a câmera dos convidados na personalização do convite. Vocês escolhem quantas fotos cada pessoa pode guardar.</span></div>}</section>
}

function PublishedOnlyDashboard({ account, wedding, config, events, publishedAt, onLogout }) {
  const published = publishedAt ? new Date(publishedAt).toLocaleString('pt-BR') : 'Ainda não publicado'
  return <div className="role-page couple-role-page"><header className="role-header"><a className="role-brand" href="/"><span>e<span>&</span>t</span><strong>Conteúdo publicado</strong></a><span className="role-preview">Acesso: {account?.email}</span><button className="button-outline" onClick={onLogout}>Sair</button></header><main className="role-main"><div className="role-intro"><span className="role-icon"><Eye size={19} /></span><span className="eyebrow">ACESSO DE LEITURA</span><h1>{wedding.partner_one_name} & {wedding.partner_two_name}</h1><p>Esta área mostra apenas a última versão publicada do site e dos eventos.</p></div><section className="role-card published-reader-card"><div className="role-card-heading"><div><span className="eyebrow">SITE DOS NOIVOS</span><h2>{config?.coverMessages?.['pt-BR'] || 'Convite do casamento'}</h2></div><span className="admin-state admin-state-active">Publicado</span></div><p>Endereço curto: {wedding.slug}</p><p>Estilo: {config?.theme || 'garden'} · Capa: {config?.coverLayout || 'full'} · Idioma: {config?.language || 'pt-BR'}</p><div className="browser-below published-reader-sections">{(config?.enabledSections || []).map((section) => <span key={section}>{section}</span>)}</div><small>Última publicação: {published}</small></section><section className="role-card"><div className="role-card-heading"><div><span className="eyebrow">PROGRAMAÇÃO PUBLICADA</span><h2>Eventos</h2></div><span className="task-count">{events.length} eventos</span></div>{events.length ? <div className="wedding-event-list">{events.map((event) => <article key={event.id}><div><strong>{event.name}</strong><small>{event.starts_at ? new Date(event.starts_at).toLocaleString('pt-BR') : 'Data a definir'} · {event.venue_name || 'Local a definir'}</small>{event.address && <small>{event.address}</small>}</div><span className="admin-state admin-state-active">{event.event_type}</span></article>)}</div> : <p className="buffet-empty">Nenhum evento está publicado.</p>}</section></main><footer className="role-footer"><span>Leitura do site publicado</span><a href="https://henriquesouzas.com" target="_blank" rel="noreferrer">henriquesouzas.com</a></footer></div>
}

function CoupleSiteEditor({ wedding, config, savedConfig, publishedConfig, publishedAt, setConfig, onSave, onPublish, saving }) {
  const [device, setDevice] = useState('desktop')
  const [previewLanguage, setPreviewLanguage] = useState(config.language)
  const [draggedSection, setDraggedSection] = useState('')
  const pointerDragSection = useRef('')
  const pointerDropSection = useRef('')
  const theme = THEMES.find((item) => item.id === config.theme) || THEMES[0]
  const palettes = getThemePalettes(theme)
  const selectedPalette = palettes[config.paletteIndex] || palettes[0]
  const layoutNames = [{ id: 'full', label: 'Foto em tela cheia' }, { id: 'split', label: 'Foto ao lado' }, { id: 'arch', label: 'Moldura ou arco' }, { id: 'type', label: 'Só tipografia' }, { id: 'video', label: 'Vídeo curto' }, { id: 'collage', label: 'Colagem de fotos' }]
  const languageCopy = {
    'pt-BR': { date: wedding?.event_date ? new Date(`${wedding.event_date}T12:00:00`).toLocaleDateString('pt-BR') : 'Data a definir', message: 'Com alegria, convidamos você.', button: 'Descobrir o convite' },
    en: { date: wedding?.event_date ? new Date(`${wedding.event_date}T12:00:00`).toLocaleDateString('en-US') : 'Date to be announced', message: 'With joy, we invite you.', button: 'Explore the invitation' },
    es: { date: wedding?.event_date ? new Date(`${wedding.event_date}T12:00:00`).toLocaleDateString('es') : 'Fecha por definir', message: 'Con alegría, te invitamos.', button: 'Descubre la invitación' },
  }[previewLanguage]
  const coverMessage = config.coverMessages?.[previewLanguage] || languageCopy.message
  const storyMessage = config.storyMessages?.[previewLanguage] || config.storyMessages?.['pt-BR'] || ''
  const draftChanged = JSON.stringify(config) !== JSON.stringify(savedConfig)
  const published = publishedAt ? new Date(publishedAt).toLocaleString('pt-BR') : ''
  const update = (values) => setConfig((current) => ({ ...current, ...values }))
  const selectTheme = (themeId) => update({ theme: themeId, paletteIndex: 0, ...(THEME_PRESETS[themeId] || THEME_PRESETS.garden) })
  const customizableSections = config.enabledSections.filter((section) => !['Nossa história', 'Eventos', 'Lista de presentes', 'Confirmação de presença'].includes(section))
  const updateSectionContent = (section, language, field, value) => update({ sectionContent: { ...config.sectionContent, [section]: { ...config.sectionContent?.[section], [language]: { ...config.sectionContent?.[section]?.[language], [field]: value } } } })
  const getSectionContent = (section) => {
    const sectionData = config.sectionContent?.[section] || {}
    const translated = sectionData[previewLanguage] || {}
    const fallback = sectionData['pt-BR'] || {}
    return { title: translated.title || fallback.title || section, body: translated.body || fallback.body || '' }
  }
  const toggleSection = (section) => update({ enabledSections: config.enabledSections.includes(section) ? config.enabledSections.filter((item) => item !== section) : [...config.enabledSections, section] })
  const orderedSections = [...SITE_SECTIONS].sort((first, second) => {
    const firstPosition = config.enabledSections.indexOf(first)
    const secondPosition = config.enabledSections.indexOf(second)
    if (firstPosition < 0 && secondPosition < 0) return SITE_SECTIONS.indexOf(first) - SITE_SECTIONS.indexOf(second)
    if (firstPosition < 0) return 1
    if (secondPosition < 0) return -1
    return firstPosition - secondPosition
  })
  const reorderSection = (section, targetSection) => {
    const nextSections = [...config.enabledSections]
    const position = nextSections.indexOf(section)
    const target = nextSections.indexOf(targetSection)
    if (position < 0 || target < 0 || target === position) return
    nextSections.splice(position, 1)
    nextSections.splice(target, 0, section)
    update({ enabledSections: nextSections })
  }
  const moveSection = (section, direction) => {
    const position = config.enabledSections.indexOf(section)
    const target = position + direction
    if (position < 0 || target < 0 || target >= config.enabledSections.length) return
    reorderSection(section, config.enabledSections[target])
  }
  const startPointerDrag = (event, section) => {
    if (event.pointerType === 'mouse') return
    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    pointerDragSection.current = section
    pointerDropSection.current = section
    setDraggedSection(section)
  }
  const updatePointerDrag = (event) => {
    if (!pointerDragSection.current) return
    const targetRow = document.elementFromPoint(event.clientX, event.clientY)?.closest('[data-section-id]')
    if (targetRow) pointerDropSection.current = targetRow.dataset.sectionId
  }
  const finishPointerDrag = () => {
    if (pointerDragSection.current && pointerDropSection.current) reorderSection(pointerDragSection.current, pointerDropSection.current)
    pointerDragSection.current = ''
    pointerDropSection.current = ''
    setDraggedSection('')
  }

  return <div className="customize-layout"><div className="customize-controls">
    <section className="dash-card customize-card"><div className="card-heading"><div><span className="eyebrow">RASCUNHO DO CASAMENTO</span><h3>Temas curados</h3></div><span className="step-counter">Temas para escolher</span></div><p>Escolha uma base visual segura. As alterações ficam privadas até publicar.</p><p className="theme-impact-note">A prévia ao lado mostra a paleta, a capa e as fontes escolhidas.</p><ThemePicker theme={config.theme} setTheme={selectTheme} compact /><div className="palette-picker"><div className="palette-heading"><strong>Paletas deste tema</strong><small>Combinações curadas</small></div><div className="palette-swatches">{palettes.map((colors, index) => <button type="button" className={config.paletteIndex === index ? 'active' : ''} key={index} onClick={() => update({ paletteIndex: index })} aria-label={`Paleta ${PALETTE_NAMES[index]}`} aria-pressed={config.paletteIndex === index}>{colors.map((color) => <i key={color} style={{ backgroundColor: color }} />)}</button>)}</div></div><label className="font-pair-label">Par de fontes<select value={config.fontPair} onChange={(event) => update({ fontPair: event.target.value })}><option>Clássico editorial</option><option>Romântico leve</option><option>Moderno sem serifa</option><option>Elegante de alto contraste</option><option>Contemporâneo humanista</option><option>Floral delicado</option><option>Minimalista geométrico</option><option>Rústico acolhedor</option></select></label><label className="font-pair-label">Tamanho do texto<select value={config.fontScale || 'medium'} onChange={(event) => update({ fontScale: event.target.value })}><option value="small">Compacto</option><option value="medium">Padrão</option><option value="large">Ampliado</option></select></label></section>
    <section className="dash-card customize-card"><div className="card-heading"><div><span className="eyebrow">CAPA DO CONVITE</span><h3>Escolha um layout</h3></div><span className="step-counter">Modelos de capa</span></div><div className="cover-layout-grid">{layoutNames.map((layout) => <button type="button" key={layout.id} className={config.coverLayout === layout.id ? 'active' : ''} onClick={() => update({ coverLayout: layout.id })} aria-pressed={config.coverLayout === layout.id}><span className={`layout-thumb layout-thumb-${layout.id}`}><i /><b /><em /></span><small>{layout.label}</small></button>)}</div><label className="font-pair-label">Foto da capa<select value={config.coverImage || 'wedding-pexels'} onChange={(event) => update({ coverImage: event.target.value })}>{SITE_COVER_PHOTOS.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select></label></section>
    <section className="dash-card customize-card"><div className="card-heading"><div><span className="eyebrow">SE&#231;&#213;ES DO CONVITE</span><h3>Mostrem o que importa</h3></div><span className="step-counter">{config.enabledSections.length} ativas</span></div><p>Ativem, desativem e organizem as partes do convite. Arrastem uma se&#231;&#227;o ou usem as setas.</p><div className="customizer-section-list">{orderedSections.map((section) => { const active = config.enabledSections.includes(section); const position = config.enabledSections.indexOf(section); return <div className={'customizer-section-row' + (active ? ' active' : '') + (draggedSection === section ? ' dragging' : '')} data-section-id={section} key={section} draggable={active} onDragStart={(event) => { setDraggedSection(section); event.dataTransfer.setData('text/plain', section) }} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); const source = event.dataTransfer.getData('text/plain'); if (source) reorderSection(source, section); setDraggedSection('') }} onDragEnd={() => setDraggedSection('')} onPointerDown={(event) => startPointerDrag(event, section)} onPointerMove={updatePointerDrag} onPointerUp={finishPointerDrag}><button type="button" className="customizer-section-drag" aria-label={'Mover ' + section} disabled={!active}><GripVertical size={16} /></button><label><input type="checkbox" checked={active} onChange={() => toggleSection(section)} /><span>{section}{section === 'Quiz dos noivos' ? '\u00b7 opcional' : ''}</span></label>{active && <div className="customizer-section-actions"><button type="button" aria-label={'Mover ' + section + ' para cima'} disabled={position === 0} onClick={() => moveSection(section, -1)}><ArrowUp size={15} /></button><button type="button" aria-label={'Mover ' + section + ' para baixo'} disabled={position === config.enabledSections.length - 1} onClick={() => moveSection(section, 1)}><ArrowDown size={15} /></button></div>}</div>})}</div></section>
    <section className="dash-card customize-card"><div className="card-heading"><div><span className="eyebrow">DETALHES DA FESTA</span><h3>Programação, cardápio e traje</h3></div></div><p>Os eventos, locais e horários são definidos em Eventos e respeitam o acesso de cada grupo.</p><label className="font-pair-label">Programação<textarea rows="3" maxLength="1200" value={config.weddingDetails?.schedule || ""} onChange={(event) => update({ weddingDetails: { ...config.weddingDetails, schedule: event.target.value } })} /></label><label className="font-pair-label">Cardápio<textarea rows="3" maxLength="1200" value={config.weddingDetails?.menu || ""} onChange={(event) => update({ weddingDetails: { ...config.weddingDetails, menu: event.target.value } })} /></label><label className="font-pair-label">Traje sugerido<input maxLength="120" value={config.weddingDetails?.dressCode || ""} onChange={(event) => update({ weddingDetails: { ...config.weddingDetails, dressCode: event.target.value } })} /></label></section>
    <GuestCameraSettings settings={config.guestCamera} onChange={(guestCamera) => update({ guestCamera })} />
    <section className="dash-card customize-card animation-card"><div className="card-heading"><div><span className="eyebrow">MOVIMENTO E IDIOMA</span><h3>Preferências do convite</h3></div><Sparkles size={17} /></div><div className="segmented-control">{['Suave', 'Elegante', 'Festivo', 'Nenhum'].map((preset) => <button type="button" key={preset} className={config.animationPreset === preset ? 'selected' : ''} onClick={() => update({ animationPreset: preset })}>{preset}</button>)}</div><label className="font-pair-label">Idioma principal<select value={config.language} onChange={(event) => update({ language: event.target.value })}><option value="pt-BR">Português</option><option value="en">English</option><option value="es">Español</option></select></label></section>
    <section className="dash-card customize-card"><div className="card-heading"><div><span className="eyebrow">TEXTO DA CAPA</span><h3>Mensagem do convite</h3></div></div><p>Escreva uma mensagem por idioma. Ela aparece na prévia e no convite publicado.</p>{[['pt-BR', 'Português'], ['en', 'English'], ['es', 'Español']].map(([language, label]) => <label className="font-pair-label" key={language}>{label}<textarea rows="2" maxLength="240" value={config.coverMessages?.[language] || ''} onChange={(event) => update({ coverMessages: { ...DEFAULT_SITE_CONFIG.coverMessages, ...config.coverMessages, [language]: event.target.value } })} /></label>)}</section>
    {config.enabledSections.includes('Nossa história') && <section className="dash-card customize-card couple-story-editor"><div className="card-heading"><div><span className="eyebrow">HISTÓRIA DO CASAL</span><h3>Contem como tudo começou</h3></div></div><p>Este texto aparece na prévia e no convite publicado. Se um idioma ficar vazio, o site usa a versão em português.</p>{[['pt-BR', 'Português'], ['en', 'English'], ['es', 'Español']].map(([language, label]) => <label className="font-pair-label" key={language}>{label}<textarea rows="4" maxLength="3000" value={config.storyMessages?.[language] || ''} onChange={(event) => update({ storyMessages: { ...DEFAULT_SITE_CONFIG.storyMessages, ...config.storyMessages, [language]: event.target.value } })} /></label>)}</section>}
    {customizableSections.length > 0 && <section className="dash-card customize-card section-content-card"><div className="card-heading"><div><span className="eyebrow">CONTEÚDO DO CONVITE</span><h3>Personalizem as seções</h3></div></div><p>Adicionem títulos e textos em cada idioma. Se uma tradução estiver vazia, o convite usa o português.</p>{customizableSections.map((section) => <details className="section-content-editor" key={section}><summary>{section}</summary>{[['pt-BR', 'Português'], ['en', 'English'], ['es', 'Español']].map(([language, label]) => <fieldset key={language}><legend>{label}</legend><label className="font-pair-label">Título<input maxLength="120" value={config.sectionContent?.[section]?.[language]?.title || ''} onChange={(event) => updateSectionContent(section, language, 'title', event.target.value)} /></label><label className="font-pair-label">Texto<textarea rows="3" maxLength="4000" value={config.sectionContent?.[section]?.[language]?.body || ''} onChange={(event) => updateSectionContent(section, language, 'body', event.target.value)} /></label></fieldset>)}</details>)}</section>}
    <div className="site-editor-actions"><button className="button-primary save-customize" onClick={onSave} disabled={saving || !draftChanged}>{saving ? 'Salvando…' : 'Salvar rascunho'} <Check size={15} /></button><button className="button-outline" onClick={onPublish} disabled={saving}>{saving ? 'Publicando…' : publishedAt ? 'Publicar alterações' : 'Publicar site'}</button></div>
  </div><div className={`customize-preview theme-${config.theme || 'garden'}`} style={{ '--forest': selectedPalette[0], '--accent': selectedPalette[1], '--paper': selectedPalette[2], '--font-heading': SITE_FONT_PAIRS[config.fontPair]?.[0] || SITE_FONT_PAIRS['Clássico editorial'][0], '--font-body': SITE_FONT_PAIRS[config.fontPair]?.[1] || SITE_FONT_PAIRS['Clássico editorial'][1], '--site-text-scale': config.fontScale === 'small' ? '.92' : config.fontScale === 'large' ? '1.1' : '1' }}><div className="preview-sticky-label"><span><span className="status-dot" /> {publishedAt && !draftChanged && JSON.stringify(config) === JSON.stringify(publishedConfig) ? 'PUBLICADO' : 'RASCUNHO PRIVADO'}</span><div className="preview-device-switch"><button type="button" className={device === 'desktop' ? 'active' : ''} aria-label="Prévia em desktop" onClick={() => setDevice('desktop')}><Monitor size={14} /></button><button type="button" className={device === 'tablet' ? 'active' : ''} aria-label="Prévia em tablet" onClick={() => setDevice('tablet')}><Tablet size={14} /></button><button type="button" className={device === 'mobile' ? 'active' : ''} aria-label="Prévia em celular" onClick={() => setDevice('mobile')}><Smartphone size={14} /></button></div><select aria-label="Idioma da prévia" value={previewLanguage} onChange={(event) => setPreviewLanguage(event.target.value)}><option value="pt-BR">PT</option><option value="en">EN</option><option value="es">ES</option></select></div><div className={`browser-frame device-${device}`}><div className="browser-bar"><span /><span /><span /><div>{wedding?.slug || 'seu-casamento'}.dominio-a-definir</div><ExternalLink size={12} /></div><div className={`browser-content cover-${config.coverLayout}`}><img src={SITE_COVER_PHOTOS.find((item) => item.id === config.coverImage)?.src || SITE_COVER_PHOTOS[0].src} alt="Prévia do tema do convite" /><div className="browser-overlay" /><span className="browser-date">{languageCopy.date}</span><strong>{wedding?.partner_one_name || 'Nome'} <i>&</i><br />{wedding?.partner_two_name || 'Nome'}</strong><small>{coverMessage}</small><button type="button">{languageCopy.button} <ArrowRight size={13} /></button>{config.coverLayout === 'video' && <span className="video-preview-tag">Vídeo de capa · silencioso</span>}{config.coverLayout === 'collage' && <div className="browser-collage-pair">{SITE_COVER_PHOTOS.map((item) => <img key={item.id} src={item.src} alt="" />)}</div>}</div>{config.enabledSections.includes('Nossa história') && storyMessage && <div className="browser-story-preview"><span>NOSSA HISTÓRIA</span><p>{storyMessage}</p></div>}{customizableSections.map((section) => { const content = getSectionContent(section); return content.body && <section className="browser-story-preview" key={section}><span>{content.title}</span><p>{content.body}</p></section> })}<div className="browser-below">{config.enabledSections.slice(0, 3).map((section) => <span key={section}>{section}</span>)}</div></div>{config.enabledSections.includes("Eventos") && [config.weddingDetails?.schedule, config.weddingDetails?.menu].some(Boolean) && <section className="browser-story-preview"><span>DETALHES DA FESTA</span><p>{[config.weddingDetails.schedule, config.weddingDetails.menu].filter(Boolean).join(" ? ")}</p></section>}{config.enabledSections.includes("Dress code") && config.weddingDetails?.dressCode && <section className="browser-story-preview"><span>TRAJE</span><p>{config.weddingDetails.dressCode}</p></section>}<div className="preview-notice"><CircleHelp size={15} /> {publishedAt ? `Última publicação: ${published}. Novas alterações só aparecem após publicar novamente.` : 'Rascunho privado no D1. A publicação ativa os convites individuais.'}</div></div></div>
}

function InvitationShare({ share, onClose, notify }) {
  const [qr, setQr] = useState('')
  useEffect(() => { QRCode.toDataURL(share.url, { width: 220, margin: 1, errorCorrectionLevel: 'M' }).then(setQr).catch(() => setQr('')) }, [share.url])
  async function copyLink() {
    try {
      await navigator.clipboard.writeText(share.url)
      notify('Link individual copiado')
    } catch {
      notify('Selecione e copie o link exibido')
    }
  }
  return <section className="role-card invitation-share-card"><div><span className="eyebrow">LINK INDIVIDUAL GERADO</span><h2>{share.name}</h2><p>Este link dá acesso somente ao convite desta pessoa. Guarde-o para compartilhar; ele não volta a ser exibido depois que você fechar esta janela.</p><input aria-label="Link individual" readOnly value={share.url} onFocus={(event) => event.target.select()} /><div className="role-actions"><button className="button-primary" onClick={copyLink}>Copiar link <Copy size={15} /></button><button className="button-outline" onClick={onClose}>Fechar</button></div></div>{qr && <img src={qr} alt={`QR code do convite individual de ${share.name}`} />}</section>
}

function Dashboard({ theme, setTheme, page, setPage, notify, demo = false }) {
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
        <div className="sidebar-bottom"><a className="help-card" href="/ajuda"><span><CircleHelp size={17} /></span><div><strong>Precisa de ajuda?</strong><small>Estamos por aqui.</small></div><ChevronRight size={15} /></a><button className="sidebar-profile" onClick={() => notify('Perfil de demonstração')}><span className="profile-avatar">ET</span><span><strong>Elisa e Tomás</strong><small>Conta de demonstração</small></span><ChevronDown size={15} /></button></div>
      </aside>

      <div className="dashboard-main">
        <header className="dashboard-topbar"><div className="dash-breadcrumb"><span>Meu espaço</span><ChevronRight size={14} /><strong>{pageTitle}</strong></div><div className="dash-top-actions"><span className="save-state"><span /> Prévia local</span><button className="icon-button" aria-label="Notificações" onClick={() => notify('Nenhuma notificação de demonstração')}><Bell size={18} /><i /></button><button className="preview-site-button" onClick={() => demo ? window.location.assign('/criar-site') : notify('A prévia pública está na aba Site do casal')}>{demo ? 'Personalizar convite' : 'Ver meu site'} <ExternalLink size={14} /></button></div></header>
        <div className="dashboard-content">
          {demo && <aside className="dashboard-demo-notice"><span><Eye size={17} /> Demonstração do painel</span><p>Explore os menus e teste os controles com dados fictícios. Para personalizar o convite com um rascunho salvo neste aparelho, use o personalizador completo; a conta será necessária apenas para guardar online e publicar.</p><a href="/criar-site">Abrir o personalizador completo <ArrowRight size={14} /></a></aside>}
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
    <div className="welcome-card"><div className="welcome-copy"><span className="eyebrow">18 DE SETEMBRO DE 2027 · PARATY, RJ</span><h2>O próximo capítulo<br />começa a ganhar forma.</h2><p>Seu site está em uma prévia de demonstração, com exemplos de conteúdo.</p><div className="welcome-actions"><button className="button-primary" onClick={() => setPage('customize')}>Personalizar site <ArrowRight size={15} /></button><button className="welcome-link" onClick={() => setPage('invites')}>Ver convite <ExternalLink size={14} /></button></div></div><div className="welcome-art"><img src="/images/wedding-pexels.webp" alt="Imagem de capa de demonstração" /><span>e<span>&</span>t</span></div><div className="welcome-bottom"><span><span className="status-dot" /> SITE DE DEMONSTRAÇÃO</span><button onClick={() => notify('O domínio será definido pelo dono do projeto')}>Endereço a definir <ArrowRight size={14} /></button></div></div>
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
  return <div className="site-settings-grid"><section className="dash-card settings-card"><div className="card-heading"><div><span className="eyebrow">CONTEÚDO DO SITE</span><h3>Suas informações principais</h3></div><button className="text-arrow" onClick={() => notify('Campos editáveis serão definidos na implementação')}>Editar <ArrowRight size={14} /></button></div><div className="site-info-row"><span className="site-info-icon"><CalendarDays size={16} /></span><div><small>Data do casamento</small><strong>18 de setembro de 2027</strong></div><span className="info-status">Preenchido</span></div><div className="site-info-row"><span className="site-info-icon"><MapPin size={16} /></span><div><small>Local da celebração</small><strong>Paraty, Rio de Janeiro</strong></div><span className="info-status">Preenchido</span></div><div className="site-info-row"><span className="site-info-icon"><Heart size={16} /></span><div><small>História do casal</small><strong>Uma história de encontros</strong></div><span className="info-status">Prévia</span></div><div className="site-info-row"><span className="site-info-icon"><LanguagesIcon /></span><div><small>Idiomas</small><strong>Português · Inglês · Espanhol</strong></div><span className="info-status info-pending">A confirmar</span></div><button className="settings-full-button" onClick={() => notify('Edição de conteúdo não conectada neste mockup')}>Revisar conteúdo <ArrowRight size={14} /></button></section><section className="dash-card site-preview-card"><div className="card-heading"><div><span className="eyebrow">PRÉ-VISUALIZAÇÃO</span><h3>Como seus convidados veem</h3></div><button className="round-arrow" onClick={() => notify('Use a aba Site do casal para ver o mockup completo')}><ExternalLink size={15} /></button></div><div className="mini-site"><img src="/images/wedding-pexels.webp" alt="Capa do site de demonstração" /><div><span className="mini-script">Elisa & Tomás</span><span className="mini-date">18 · 09 · 2027</span></div></div><div className="preview-meta"><span><span className="status-dot" /> Conteúdo demonstrativo</span><button onClick={() => setPage('customize')}>Editar visual <Paintbrush size={14} /></button></div></section><section className="dash-card section-list-card"><div className="card-heading"><div><span className="eyebrow">SEÇÕES PUBLICADAS</span><h3>O que aparece no seu site</h3></div><button className="text-arrow" onClick={() => setPage('customize')}>Organizar <ArrowRight size={14} /></button></div><div className="section-chips">{sections.map((section, index) => <span key={section}><b>{String(index + 1).padStart(2, '0')}</b>{section}<Check size={14} /></span>)}</div></section></div>
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
  const selectTheme = (themeId) => { setTheme(themeId); setPaletteIndex(0); setCoverLayout(THEME_PRESETS[themeId]?.coverLayout || 'full') }
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
    <section className="dash-card customize-card"><div className="card-heading"><div><span className="eyebrow">1 · ESCOLHA UMA BASE</span><h3>Temas curados</h3></div><span className="step-counter">8 opções</span></div><p>Comece por uma direção visual. O conteúdo permanece ao trocar de tema.</p><ThemePicker theme={theme} setTheme={selectTheme} compact /><div className="palette-picker"><div className="palette-heading"><strong>Paletas deste tema</strong><small>Combinações com contraste previsto</small></div><div className="palette-swatches">{palettes.map((colors, index) => <button className={paletteIndex === index ? 'active' : ''} key={index} onClick={() => setPaletteIndex(index)} aria-label={`Paleta ${PALETTE_NAMES[index]}`}>{colors.map((color) => <i key={color} style={{ backgroundColor: color }} />)}</button>)}</div></div><label className="font-pair-label">Par de fontes<select defaultValue="Clássico editorial"><option>Clássico editorial</option><option>Romântico leve</option><option>Moderno sem serifa</option><option>Elegante de alto contraste</option><option>Contemporâneo humanista</option><option>Floral delicado</option><option>Minimalista geométrico</option><option>Rústico acolhedor</option></select></label></section>
    <section className="dash-card customize-card"><div className="card-heading"><div><span className="eyebrow">2 · PERSONALIZE A CAPA</span><h3>Escolha um dos seis layouts</h3></div><span className="step-counter">6 opções</span></div><div className="cover-layout-grid">{layouts.map((layout) => <button key={layout.id} className={coverLayout === layout.id ? 'active' : ''} onClick={() => setCoverLayout(layout.id)}><span className={`layout-thumb layout-thumb-${layout.id}`}><i /><b /><em /></span><small>{layout.label}</small></button>)}</div><div className="focal-note"><CircleHelp size={13} /> Ponto focal e recorte podem ser ajustados separadamente para celular e desktop.</div></section>
    <section className="dash-card customize-card"><div className="card-heading"><div><span className="eyebrow">3 · ORGANIZE O CONTEÚDO</span><h3>Biblioteca de seções</h3></div><span className="section-count">{enabledSections.length} ativas</span></div><p>Ative ou desligue blocos. Variações e ordem podem ser refinadas depois.</p><div className="toggle-list">{sectionNames.map((name, index) => <div className="toggle-row" key={name}><span className="drag-handle">⠿</span><span className="toggle-index">{String(index + 1).padStart(2, '0')}</span><span className="toggle-name">{name}{name === 'Quiz dos noivos' && <small>Opcional</small>}</span><button className={`toggle-switch ${enabledSections.includes(name) ? 'on' : ''}`} aria-label={`${enabledSections.includes(name) ? 'Desativar' : 'Ativar'} ${name}`} onClick={() => toggleSection(name)}><i /></button></div>)}</div><div className="section-limit-note">Até 6 blocos de conteúdo livre, além das seções prontas.</div></section>
    <section className="dash-card customize-card animation-card"><div className="card-heading"><div><span className="eyebrow">4 · MOVIMENTO</span><h3>Preset de animação</h3></div><Sparkles size={17} /></div><div className="segmented-control">{['Suave', 'Elegante', 'Festivo', 'Nenhum'].map((preset) => <button key={preset} className={animationPreset === preset ? 'selected' : ''} onClick={() => setAnimationPreset(preset)}>{preset}</button>)}</div><small>Respeita a preferência de movimento e economia de dados do dispositivo.</small></section><button className="button-primary save-customize" onClick={() => notify('Preferências demonstrativas selecionadas')}>Salvar rascunho <Check size={15} /></button>
  </div><div className="customize-preview" style={{ '--forest': selectedPalette[0], '--accent': selectedPalette[1], '--paper': selectedPalette[2], '--font-heading': SITE_FONT_PAIRS[THEME_PRESETS[theme]?.fontPair]?.[0] || SITE_FONT_PAIRS['Clássico editorial'][0], '--font-body': SITE_FONT_PAIRS[THEME_PRESETS[theme]?.fontPair]?.[1] || SITE_FONT_PAIRS['Clássico editorial'][1] }}><div className="preview-sticky-label"><span><span className="status-dot" /> PRÉVIA AO VIVO</span><div className="preview-device-switch"><button className={device === 'desktop' ? 'active' : ''} aria-label="Prévia em desktop" onClick={() => setDevice('desktop')}><Monitor size={14} /></button><button className={device === 'tablet' ? 'active' : ''} aria-label="Prévia em tablet" onClick={() => setDevice('tablet')}><Tablet size={14} /></button><button className={device === 'mobile' ? 'active' : ''} aria-label="Prévia em celular" onClick={() => setDevice('mobile')}><Smartphone size={14} /></button></div><select aria-label="Idioma da prévia" value={previewLanguage} onChange={(event) => setPreviewLanguage(event.target.value)}>{languages.map((language) => <option key={language}>{language}</option>)}</select></div><div className={`browser-frame device-${device}`}><div className="browser-bar"><span /><span /><span /><div>elisa-tomas.dominio-a-definir</div><ExternalLink size={12} /></div><div className={`browser-content cover-${coverLayout}`}><img src="/images/wedding-pexels.webp" alt="Prévia do tema do convite" /><div className="browser-overlay" /><span className="browser-date">{languageCopy.date}</span><strong>Elisa <i>&</i><br />Tomás</strong><small>{languageCopy.message}</small><button onClick={() => notify('A prévia visual não abre um endereço publicado')}>{languageCopy.button} <ArrowRight size={13} /></button>{coverLayout === 'video' && <span className="video-preview-tag">Vídeo de capa · silencioso</span>}</div><div className="browser-below"><span>um dia para celebrar</span><i>♡</i><span>nossa história</span></div></div><div className="preview-quality"><div><Check size={14} /><span><strong>Contraste do tema</strong><small>Combinação dentro da paleta curada</small></span></div><div><Check size={14} /><span><strong>Layout responsivo</strong><small>Prévia em {device === 'mobile' ? 'celular' : device === 'tablet' ? 'tablet' : 'desktop'}</small></span></div><button onClick={() => notify('Verificador de publicação demonstrativo')}>Verificador antes de publicar <ArrowRight size={13} /></button></div><div className="preview-notice"><CircleHelp size={15} /> A prévia mostra opções viáveis. Conteúdo e publicação ainda não estão conectados.</div></div></div>
}

function GameManager({ enabled, setEnabled, notify }) {
  return <div className="game-layout"><section className="dash-card game-settings"><div className="card-heading"><div><span className="eyebrow">BRINCADEIRA OPCIONAL</span><h3>Quiz dos noivos</h3></div><span className={`game-state ${enabled ? 'enabled' : ''}`}>{enabled ? 'Ativo na prévia' : 'Desativado'}</span></div><p>Uma partida com cinco perguntas por dia, ranking entre convidados e uma nova chance amanhã. Só aparece no convite quando vocês ativarem.</p><div className="game-toggle-card"><span className="game-sparkle"><Sparkles size={21} /></span><span><strong>Mostrar o jogo no site</strong><small>{enabled ? 'O quiz aparece no convite demonstrativo.' : 'O menu do jogo fica oculto para os convidados.'}</small></span><button className={`toggle-switch ${enabled ? 'on' : ''}`} aria-label={enabled ? 'Desativar jogo' : 'Ativar jogo'} onClick={() => setEnabled(!enabled)}><i /></button></div><div className="game-details"><div><small>PARTIDAS</small><strong>5 perguntas por dia</strong></div><div><small>RANKING</small><strong>Semanal e geral</strong></div><div><small>PRIVACIDADE</small><strong>Apelido ou oculto</strong></div></div><button className="button-outline full-width" onClick={() => notify('Perguntas personalizadas serão configuradas na fase do jogo')}>Editar perguntas <ArrowRight size={14} /></button></section><section className="game-preview-card"><div className="quiz-top"><span className="quiz-mark"><Sparkles size={20} /></span><span className="quiz-day">QUIZ DO DIA · PRÉVIA</span><h3>Quem disse<br />“eu te amo” primeiro?</h3><p>Escolha uma resposta para ver como o jogo pode funcionar.</p></div><div className="quiz-options"><button onClick={() => notify('Resposta de demonstração selecionada')}>Elisa <span>A</span></button><button onClick={() => notify('Resposta de demonstração selecionada')}>Tomás <span>B</span></button></div><div className="quiz-footer"><span>01 / 05</span><span>Uma tentativa por dia</span></div></section></div>
}

function RoleFrame({ icon: Icon, eyebrow, title, description, children, className = '', secure = false, publicPage = false, secureName = 'Área do evento', secureFooter = 'Equipe do evento', headerAction = null, compactIntro = false, style }) {
  return <div className={`role-page ${className}`} style={style}><header className="role-header"><a className="role-brand" href="#inicio"><span>e<span>&</span>t</span><strong>{secure || publicPage ? secureName : 'Elisa & Tomás'}</strong></a><span className="role-preview"><i /> {secure ? 'ACESSO CONTROLADO' : publicPage ? 'AJUDA DA PLATAFORMA' : 'PRÉVIA INTERATIVA · DADOS FICTÍCIOS'}</span>{headerAction}</header><main className="role-main">{!compactIntro && <div className="role-intro"><span className="role-icon"><Icon size={19} /></span><span className="eyebrow">{eyebrow}</span><h1>{title}</h1><p>{description}</p></div>}{children}{!secure && !publicPage && <div className="role-demo-note"><LockKeyhole size={15} /> Protótipo com dados locais. O controle de acesso real será validado no servidor antes de uso com dados de convidados.</div>}</main><footer className="role-footer"><span>{secure || publicPage ? secureFooter : 'e&t · celebração em 18.09.2027'}</span><a href="https://henriquesouzas.com" target="_blank" rel="noreferrer">henriquesouzas.com</a></footer></div>
}

function TeamInvitationAcceptance() {
  const [invitation, setInvitation] = useState(null)
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [code, setCode] = useState('')
  const [turnstileToken, setTurnstileToken] = useState('')
  const [turnstileReset, setTurnstileReset] = useState(0)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(true)
  const [mfaSetup, setMfaSetup] = useState(false)
  const [pendingMfaAcceptance, setPendingMfaAcceptance] = useState(false)
  const [acceptedRole, setAcceptedRole] = useState('')
  const token = window.location.hash.match(/^#aceitar-equipe\/([A-Za-z0-9_-]{40,60})$/)?.[1] || ''

  useEffect(() => {
    if (!token) {
      setError('Abra o link completo enviado pelos noivos para ativar seu acesso.')
      setLoading(false)
      return
    }
    fetch('/api/auth/team-invitation-preview', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token }) }).then(async (response) => {
      const result = await response.json()
      if (!response.ok) throw new Error('Este convite expirou ou já foi utilizado. Peça um novo link aos noivos.')
      setInvitation(result)
    }).catch((cause) => setError(cause.message)).finally(() => setLoading(false))
  }, [token])

  async function finishInvitationAcceptance() {
    const response = await fetch('/api/auth/accept-team-invitation', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token, password: invitation?.requiresLogin ? undefined : password }) })
    const result = await response.json()
    if (!response.ok) throw new Error(result.error === 'invitation_expired_or_used' ? 'Este convite expirou ou já foi utilizado. Peça um novo link aos noivos.' : 'Não foi possível ativar o acesso. Entre em contato com os noivos.')
    if (result.mfaSetupRequired) {
      setAcceptedRole(result.role)
      setPendingMfaAcceptance(false)
      setMfaSetup(true)
      return
    }
    window.location.assign(['couple_admin', 'editor', 'reader'].includes(result.role) ? '/painel' : '/equipe')
  }

  async function acceptInvitation(event) {
    event.preventDefault()
    if (!invitation?.requiresLogin && password !== confirmation) {
      setError('As senhas não coincidem.')
      return
    }
    setBusy(true)
    setError('')
    try {
      if (invitation?.requiresLogin) {
        const loginResponse = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: invitation.email, password: loginPassword, code, turnstileToken }) })
        const loginResult = await loginResponse.json()
        if (!loginResponse.ok) throw new Error('Confira o e-mail, a senha e o código do autenticador da sua conta.')
        if (loginResult.mfaSetupRequired) {
          setPendingMfaAcceptance(true)
          setMfaSetup(true)
          return
        }
      }
      await finishInvitationAcceptance()
    } catch (cause) {
      setError(cause.message)
    } finally {
      setTurnstileToken('')
      setTurnstileReset((current) => current + 1)
      setBusy(false)
    }
  }

  if (mfaSetup) return <RoleFrame icon={Shield} eyebrow="SEGUNDO FATOR" title="Proteja sua conta." description="Configure um autenticador antes de usar o acesso compartilhado pelos noivos." secure><AccountMfaSetup onComplete={async () => {
    if (pendingMfaAcceptance) await finishInvitationAcceptance()
    else window.location.assign(['couple_admin', 'editor', 'reader'].includes(acceptedRole) ? '/painel' : '/equipe')
  }} /></RoleFrame>

  const isCoupleInvitation = ['couple_admin', 'editor', 'reader'].includes(invitation?.role)
  const invitationRoleName = ({ couple_admin: 'administrador do casamento', editor: 'editor do site e eventos', reader: 'leitor do conteúdo publicado', event_staff: 'equipe do evento', checkin_staff: 'equipe de entrada' })[invitation?.role] || 'equipe do evento'
  const invitationDescription = invitation?.role === 'editor' ? 'Edite o site e os eventos deste casamento. O acesso exige autenticador.' : invitation?.role === 'reader' ? 'Consulte somente o conteúdo publicado. O acesso exige autenticador.' : invitation?.role === 'couple_admin' ? 'Acesse o painel completo deste casamento. O acesso exige autenticador.' : 'A permissão é limitada aos eventos escolhidos pelos noivos e exige autenticador.'
  return <RoleFrame icon={LockKeyhole} eyebrow={isCoupleInvitation ? "ACESSO DO CASAMENTO" : "ACESSO DA EQUIPE"} title={isCoupleInvitation ? "Ative seu acesso ao casamento." : "Ative seu acesso ao evento."} description={invitationDescription} secure secureName="Convite do casamento" secureFooter="Acesso individual">
    <form className="role-card admin-login-form" onSubmit={acceptInvitation}>{loading && <p>Validando o convite…</p>}{invitation?.requiresLogin ? <><p>Este convite foi enviado para <strong>{invitation.email}</strong>. Entre com sua conta para aceitar o acesso de {invitationRoleName}.</p><label>Senha da conta<PasswordInput autoComplete="current-password" value={loginPassword} onChange={(event) => setLoginPassword(event.target.value)} required /></label><label>Código do autenticador, se já cadastrado<input inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength="6" value={code} onChange={(event) => setCode(event.target.value)} /></label><TurnstileChallenge onToken={setTurnstileToken} resetKey={turnstileReset} /></> : invitation && <><p>Convite para <strong>{invitation.email}</strong>. Crie uma senha com pelo menos 12 caracteres. No primeiro acesso, cadastre também um autenticador.</p><label>Nova senha<PasswordInput autoComplete="new-password" minLength="12" maxLength="1024" value={password} onChange={(event) => setPassword(event.target.value)} required /></label><label>Confirme a senha<PasswordInput autoComplete="new-password" minLength="12" maxLength="1024" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} required /></label></>}{error && <p className="admin-form-error" role="alert">{error}</p>}<button className="button-primary" disabled={busy || loading || !invitation || (invitation.requiresLogin && (!TURNSTILE_SITE_KEY || !turnstileToken))} type="submit">{busy ? 'Ativando…' : isCoupleInvitation ? 'Aceitar convite e abrir painel' : 'Aceitar convite e entrar'} <ArrowRight size={15} /></button></form>
  </RoleFrame>
}

function GuestPortal({ notify, setView }) {
  const [invitation, setInvitation] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const token = window.location.hash.startsWith('#convite/') ? window.location.hash.slice(9) : ''
  const siteTheme = THEMES.find((item) => item.id === invitation?.siteConfig?.theme)
  const sitePalettes = siteTheme ? getThemePalettes(siteTheme) : []
  const activePalette = sitePalettes[invitation?.siteConfig?.paletteIndex] || sitePalettes[0]
  const siteFonts = SITE_FONT_PAIRS[invitation?.siteConfig?.fontPair] || SITE_FONT_PAIRS['Clássico editorial'];
  const siteStyle = activePalette ? { '--forest': activePalette[0], '--ink': activePalette[0], '--accent': activePalette[1], '--paper': activePalette[2], '--font-heading': siteFonts[0], '--font-body': siteFonts[1], '--site-text-scale': invitation?.siteConfig?.fontScale === 'small' ? '.92' : invitation?.siteConfig?.fontScale === 'large' ? '1.1' : '1' } : undefined
  const coverPhoto = SITE_COVER_PHOTOS.find((photo) => photo.id === invitation?.siteConfig?.coverImage) || SITE_COVER_PHOTOS[0]
  const moreSections = invitation?.siteConfig?.enabledSections?.filter((section) => !['Nossa história', 'Eventos', 'Lista de presentes', 'Confirmação de presença'].includes(section)) || []
  const moreSectionHasContent = moreSections.some((section) => {
    const translated = invitation.siteConfig.sectionContent?.[section]?.[invitation.siteConfig.language] || {}
    const fallback = invitation.siteConfig.sectionContent?.[section]?.['pt-BR'] || {}
    return Boolean(translated.body || fallback.body)
  })
  const hasMoreInvitationContent = Boolean(
    (invitation?.siteConfig?.enabledSections?.includes('Eventos') && (invitation.siteConfig.weddingDetails?.schedule || invitation.siteConfig.weddingDetails?.menu))
    || (invitation?.siteConfig?.enabledSections?.includes('Dress code') && invitation.siteConfig.weddingDetails?.dressCode)
    || (invitation?.siteConfig?.enabledSections?.includes('Nossa história') && (invitation.siteConfig.storyMessages?.[invitation.siteConfig.language] || invitation.siteConfig.storyMessages?.['pt-BR']))
    || moreSectionHasContent
  )

  async function loadInvitation() {
    if (!token) {
      setError('Abra o link individual enviado pelos noivos para consultar este convite.')
      setLoading(false)
      return
    }
    try {
      const response = await fetch('/api/invitation', { headers: { Authorization: `Bearer ${token}` } })
      const result = await response.json()
      if (!response.ok) throw new Error('Este link de convite expirou ou não é válido.')
      setInvitation(result)
      setError('')
    } catch (cause) {
      setError(cause.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadInvitation() }, [token])

  async function saveRsvp(values) {
    const response = await fetch('/api/invitation/rsvp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(values),
    })
    if (!response.ok) {
      const result = await response.json().catch(() => ({}))
      if (result.error === 'too_many_requests') {
        const minutes = Math.max(1, Math.ceil(Number(response.headers.get('Retry-After') || 60) / 60))
        throw new Error(`Muitas tentativas de resposta. Aguarde ${minutes} minuto(s) e tente novamente.`)
      }
      if (result.error === 'turnstile_unavailable') throw new Error('A validação antirobô ainda não foi configurada.')
      if (result.error === 'invitation_invalid') throw new Error('Este link de convite expirou ou não é válido.')
      throw new Error('A validação expirou ou falhou. Complete-a novamente e tente enviar.')
    }
    await loadInvitation()
    notify('Resposta registrada para este evento')
  }

  return <RoleFrame icon={UserRound} eyebrow="CONVITE INDIVIDUAL" title={invitation ? `Olá, ${invitation.guest.name}.` : 'Seu convite individual.'} description={invitation ? `Você está convidado para celebrar com ${invitation.wedding.partnerOneName} e ${invitation.wedding.partnerTwoName}.` : 'Os detalhes são exibidos somente pelo link individual enviado pelos noivos.'} secure secureName="Seu convite" secureFooter="Convite individual" compactIntro={Boolean(invitation)} className="guest-invitation-page" style={siteStyle}>
    {loading && <section className="role-card"><p>Carregando os detalhes do seu convite…</p></section>}
    {error && !loading && <section className="role-card"><p>{error}</p></section>}
    {invitation && <>
      <section className="role-card guest-pass-card"><div className="guest-invitation-cover"><img src={coverPhoto.src} alt={`Foto pública de referência: ${coverPhoto.name}`} /><div><span>CONVITE</span><h2>{invitation.wedding.partnerOneName} <i>&amp;</i> {invitation.wedding.partnerTwoName}</h2><p>{invitation.wedding.eventDate ? new Date(`${invitation.wedding.eventDate}T12:00:00`).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Data a confirmar'}</p><small>Foto pública de referência</small></div></div><div className="role-card-heading"><span className="eyebrow">Este convite é para {invitation.guest.name}</span><span className="status-pill confirmed"><i /> Individual</span></div><div className="guest-pass-details"><span><Users size={16} /> Até {invitation.guest.partySize} {invitation.guest.partySize === 1 ? 'pessoa' : 'pessoas'}</span></div>{invitation.siteConfig && <p className="guest-cover-message">{invitation.siteConfig.coverMessages?.[invitation.siteConfig.language] || invitation.siteConfig.coverMessages?.['pt-BR']}</p>}{invitation.siteConfig?.guestCamera?.enabled && <a className="guest-camera-invite-link" href="#guest-camera"><Camera size={17} /> Registrar um momento da celebração</a>}</section>
      {hasMoreInvitationContent && <details className="guest-extra-details"><summary>História e outros detalhes</summary>
      {invitation.siteConfig?.enabledSections?.includes("Eventos") && (invitation.siteConfig.weddingDetails?.schedule || invitation.siteConfig.weddingDetails?.menu) && <section className="role-card guest-story-section"><span className="eyebrow">DETALHES DA FESTA</span>{invitation.siteConfig.weddingDetails.schedule && <p><strong>Programação</strong><br />{invitation.siteConfig.weddingDetails.schedule}</p>}{invitation.siteConfig.weddingDetails.menu && <p><strong>Cardápio</strong><br />{invitation.siteConfig.weddingDetails.menu}</p>}</section>}
      {invitation.siteConfig?.enabledSections?.includes("Dress code") && invitation.siteConfig.weddingDetails?.dressCode && <section className="role-card guest-story-section"><span className="eyebrow">TRAJE</span><h2>{invitation.siteConfig.weddingDetails.dressCode}</h2><p>Paleta sugerida pelo casal</p><div className="customizer-preview-swatches">{activePalette?.map((color) => <i key={color} style={{ backgroundColor: color }} />)}</div></section>}
      {invitation.siteConfig?.enabledSections?.includes('Nossa história') && (invitation.siteConfig.storyMessages?.[invitation.siteConfig.language] || invitation.siteConfig.storyMessages?.['pt-BR']) && <section className="role-card guest-story-section"><span className="eyebrow">NOSSA HISTÓRIA</span><p>{invitation.siteConfig.storyMessages?.[invitation.siteConfig.language] || invitation.siteConfig.storyMessages?.['pt-BR']}</p></section>}
      {invitation.siteConfig?.enabledSections?.filter((section) => !['Nossa história', 'Eventos', 'Lista de presentes', 'Confirmação de presença'].includes(section)).map((section) => { const translated = invitation.siteConfig.sectionContent?.[section]?.[invitation.siteConfig.language] || {}; const fallback = invitation.siteConfig.sectionContent?.[section]?.['pt-BR'] || {}; const title = translated.title || fallback.title || section; const body = translated.body || fallback.body || ''; return body && <section className="role-card guest-story-section" key={section}><span className="eyebrow">{title}</span><p>{body}</p></section> })}
      </details>}
      {invitation.guest.guestType === 'godparent' && <section className="role-card"><span className="eyebrow">ESPAÇO DOS PADRINHOS</span><h2>Orientações individuais</h2><p>Consulte as tarefas e os combinados enviados a você.</p><button className="button-outline" onClick={() => setView('godparent')}>Abrir minha área <ArrowRight size={14} /></button></section>}
      {invitation.siteConfig?.guestCamera?.enabled && invitation.events.length > 0 && <GuestCamera token={token} events={invitation.events} limit={invitation.siteConfig.guestCamera.photoLimit} notify={notify} />}
      {invitation.events.length ? invitation.events.map((event) => <InvitationEventCard key={event.id} event={event} maxPartySize={invitation.guest.partySize} onSubmit={saveRsvp} />) : <section className="role-card"><p>Os detalhes dos eventos ainda não foram publicados.</p></section>}
    </>}
  </RoleFrame>
}

function GuestCamera({ token, events, limit, notify }) {
  const [status, setStatus] = useState(null)
  const [eventId, setEventId] = useState(events[0]?.id || '')
  const [pending, setPending] = useState(null)
  const [consent, setConsent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const fileInput = useRef(null)
  const pendingUrl = useRef('')

  async function loadStatus() {
    const response = await fetch('/api/invitation/photos', { headers: { Authorization: `Bearer ${token}` } })
    const result = await response.json()
    if (!response.ok) throw new Error('Não foi possível abrir a câmera do casamento.')
    setStatus(result)
  }

  useEffect(() => {
    loadStatus().catch((cause) => setError(cause.message))
    return () => { if (pendingUrl.current) URL.revokeObjectURL(pendingUrl.current) }
  }, [token])

  async function preparePhoto(file) {
    if (!file) return
    setError('')
    try {
      const bitmap = await createImageBitmap(file)
      const scale = Math.min(1, 1800 / Math.max(bitmap.width, bitmap.height))
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(bitmap.width * scale)
      canvas.height = Math.round(bitmap.height * scale)
      canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height)
      bitmap.close()
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/webp', 0.82))
      if (!blob) throw new Error('Não foi possível preparar esta foto. Tente outra vez.')
      if (pendingUrl.current) URL.revokeObjectURL(pendingUrl.current)
      pendingUrl.current = URL.createObjectURL(blob)
      setPending({ file: new File([blob], 'momento.webp', { type: 'image/webp' }), url: pendingUrl.current })
      setConsent(false)
    } catch (cause) {
      setError(cause.message || 'Não foi possível abrir esta foto.')
    }
  }

  function retake() {
    if (pendingUrl.current) URL.revokeObjectURL(pendingUrl.current)
    pendingUrl.current = ''
    setPending(null)
    setConsent(false)
    if (fileInput.current) fileInput.current.value = ''
  }

  async function keepPhoto() {
    if (!pending || !eventId || !consent) return
    setBusy(true)
    setError('')
    try {
      const body = new FormData()
      body.set('photo', pending.file)
      body.set('eventId', eventId)
      const response = await fetch('/api/invitation/photos', { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error === 'photo_limit_reached' ? 'Você já enviou o máximo de fotos definido pelo casal.' : result.error === 'photo_storage_unavailable' ? 'O envio de fotos não está disponível agora.' : 'Não foi possível guardar a foto. Tente novamente.')
      retake()
      await loadStatus()
      notify('Foto guardada para o álbum do casal')
    } catch (cause) {
      setError(cause.message)
    } finally {
      setBusy(false)
    }
  }

  return <section className="role-card guest-camera-card" id="guest-camera"><div className="role-card-heading"><div><span className="eyebrow">UMA LEMBRANÇA PELOS SEUS OLHOS</span><h2>A câmera do casamento</h2></div><Camera size={20} /></div><p>Tire uma foto espontânea da celebração. Confira a prévia e escolha se quer guardar ou tentar outra vez. Depois de enviar, ela fica só com o casal — você não verá as fotos da galeria.</p>{events.length > 1 && <label>Evento<select value={eventId} onChange={(event) => setEventId(event.target.value)}>{events.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>}{pending ? <div className="guest-camera-preview"><img src={pending.url} alt="Prévia da foto antes de enviar" /><label className="guest-camera-consent"><input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} /> Autorizo o casal a guardar esta foto no álbum com meu nome.</label><div><button className="button-outline" type="button" onClick={retake} disabled={busy}>Tirar outra</button><button className="button-primary" type="button" onClick={keepPhoto} disabled={busy || !consent}>{busy ? 'Guardando…' : 'Guardar foto'} <Check size={15} /></button></div></div> : <><label className="guest-camera-action">{status?.remaining > 0 ? <><Camera size={17} /> Tirar uma foto</> : 'Limite de fotos enviado'}<input ref={fileInput} type="file" accept="image/*" capture="environment" onChange={(event) => preparePhoto(event.target.files?.[0])} disabled={busy || !status?.remaining} /></label><small>{status ? `${status.remaining} de ${limit} fotos restantes para você` : 'A câmera abre no seu celular e mostra a prévia antes de enviar.'}</small></>}{error && <p className="admin-form-error" role="alert">{error}</p>}</section>
}

function InvitationEventCard({ event, maxPartySize, onSubmit }) {
  const [status, setStatus] = useState(event.rsvp?.status || 'confirmed')
  const [partySize, setPartySize] = useState(String(event.rsvp?.party_size || maxPartySize))
  const [dietaryNotes, setDietaryNotes] = useState(event.rsvp?.dietary_notes || '')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [turnstileToken, setTurnstileToken] = useState('')
  const [turnstileReset, setTurnstileReset] = useState(0)

  async function submit(eventObject) {
    eventObject.preventDefault()
    if (!turnstileToken) {
      setError('Complete a validação antirobô antes de enviar.')
      return
    }
    setBusy(true)
    setError('')
    try {
      await onSubmit({ eventId: event.id, status, partySize: Number(partySize), dietaryNotes, turnstileToken })
    } catch (cause) {
      setError(cause.message)
    } finally {
      setTurnstileToken('')
      setTurnstileReset((current) => current + 1)
      setBusy(false)
    }
  }

  return <section className="role-card invitation-event-card"><div className="role-card-heading"><div><span className="eyebrow">{event.event_type}</span><h2>{event.name}</h2></div>{event.rsvp && <span className="status-pill confirmed"><i /> Resposta registrada</span>}</div><div className="guest-pass-details">{event.starts_at && <span><CalendarDays size={16} /> {new Date(event.starts_at).toLocaleString('pt-BR', { dateStyle: 'medium', timeStyle: 'short' })}</span>}{event.venue_name && <span><MapPin size={16} /> {event.venue_name}{event.address ? ` · ${event.address}` : ''}</span>}</div><form className="invitation-rsvp-form" onSubmit={submit}><label>Resposta<select value={status} onChange={(input) => setStatus(input.target.value)}><option value="confirmed">Confirmo presença</option><option value="declined">Não poderei ir</option></select></label><label>Quantidade de pessoas<select value={partySize} onChange={(input) => setPartySize(input.target.value)}>{Array.from({ length: maxPartySize }, (_, index) => <option key={index + 1} value={index + 1}>{index + 1}</option>)}</select></label><label>Restrição alimentar, se houver<input value={dietaryNotes} maxLength={1000} onChange={(input) => setDietaryNotes(input.target.value)} placeholder="Opcional" /></label><TurnstileChallenge action="rsvp" onToken={setTurnstileToken} resetKey={turnstileReset} />{error && <p className="admin-form-error" role="alert">{error}</p>}<button className="button-primary" type="submit" disabled={busy || !TURNSTILE_SITE_KEY || !turnstileToken}>{busy ? 'Salvando…' : 'Salvar resposta'} <Check size={15} /></button></form></section>
}
function TurnstileChallenge({ onToken, resetKey, action = 'account' }) {
  const container = useRef(null)
  const widgetId = useRef(null)
  const onTokenRef = useRef(onToken)
  const [scriptError, setScriptError] = useState(false)

  useEffect(() => { onTokenRef.current = onToken }, [onToken])

  useEffect(() => {
    if (!TURNSTILE_SITE_KEY || !container.current) return undefined
    let active = true
    loadTurnstileScript().then(() => {
      if (!active || !container.current || widgetId.current !== null) return
      widgetId.current = window.turnstile.render(container.current, {
        sitekey: TURNSTILE_SITE_KEY,
        action,
        callback: (token) => onTokenRef.current(token),
        'expired-callback': () => onTokenRef.current(''),
        'error-callback': () => onTokenRef.current(''),
      })
    }).catch(() => {
      if (active) setScriptError(true)
    })
    return () => {
      active = false
      if (widgetId.current !== null && window.turnstile) window.turnstile.remove(widgetId.current)
      widgetId.current = null
    }
  }, [action])

  useEffect(() => {
    if (resetKey > 0 && widgetId.current !== null && window.turnstile) window.turnstile.reset(widgetId.current)
  }, [resetKey])

  return TURNSTILE_SITE_KEY
    ? <>{scriptError ? <p className="turnstile-unavailable">Não foi possível carregar a validação antirobô. Atualize a página e tente novamente.</p> : <div className="turnstile-challenge" ref={container} aria-label="Validação antirobô" />}</>
    : <p className="turnstile-unavailable">A validação antirobô ainda não foi configurada.</p>
}

function GodparentPortal({ notify }) {
  const [tasks, setTasks] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [busyTask, setBusyTask] = useState('')
  const token = window.location.hash.startsWith('#convite/') ? window.location.hash.slice(9) : ''

  async function loadTasks() {
    if (!token) {
      setError('Abra o link individual enviado pelos noivos para consultar suas orientações.')
      setLoading(false)
      return
    }
    const response = await fetch('/api/godparent/tasks', { headers: { Authorization: `Bearer ${token}` } })
    const result = await response.json()
    if (!response.ok) throw new Error('Este convite não possui acesso à área dos padrinhos.')
    setTasks(result.tasks)
    setError('')
    setLoading(false)
  }

  useEffect(() => { loadTasks().catch((cause) => { setError(cause.message); setLoading(false) }) }, [token])

  async function toggleTask(task) {
    setBusyTask(task.id)
    setError('')
    try {
      const response = await fetch(`/api/godparent/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ done: task.status !== 'done' }),
      })
      if (!response.ok) throw new Error('Não foi possível atualizar esta tarefa.')
      await loadTasks()
      notify('Sua tarefa foi atualizada')
    } catch (cause) {
      setError(cause.message)
    } finally {
      setBusyTask('')
    }
  }

  return <RoleFrame icon={Heart} eyebrow="ESPAÇO DOS PADRINHOS" title="Sua participação faz parte da história." description="Esta área individual mostra apenas tarefas atribuídas ao seu convite. A lista de convidados não está disponível neste perfil." secure secureName="Área dos padrinhos" secureFooter="Acesso individual">
    {loading && <section className="role-card"><p>Carregando suas orientações…</p></section>}
    {error && !loading && <section className="role-card"><p>{error}</p></section>}
    {!loading && !error && <section className="role-card task-card"><div className="role-card-heading"><div><span className="eyebrow">SUAS ORIENTAÇÕES</span><h2>Combinados importantes</h2></div><span className="task-count">{tasks.filter((task) => task.status === 'done').length}/{tasks.length} concluídos</span></div>{tasks.length ? <div className="task-list">{tasks.map((task) => <button className={`task-row ${task.status === 'done' ? 'done' : ''}`} key={task.id} disabled={busyTask === task.id} onClick={() => toggleTask(task)}><span className="task-check"><Check size={14} /></span><span><strong>{task.title}</strong><small>{task.due_at ? new Date(task.due_at).toLocaleString('pt-BR') : 'Sem prazo definido'}{task.details ? ` · ${task.details}` : ''}</small></span><ChevronRight size={15} /></button>)}</div> : <p className="buffet-empty">Os noivos ainda não enviaram tarefas para você.</p>}<p className="godparent-privacy"><LockKeyhole size={14} /> Área individual. Nenhum dado ou lista de convidados é exibido.</p></section>}
  </RoleFrame>
}
function EventStaffPanel({ notify }) {
  const [stage, setStage] = useState('checking')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [turnstileToken, setTurnstileToken] = useState('')
  const [turnstileReset, setTurnstileReset] = useState(0)
  const [events, setEvents] = useState([])
  const [selectedEvent, setSelectedEvent] = useState('')
  const [guests, setGuests] = useState([])
  const [walkIns, setWalkIns] = useState([])
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [query, setQuery] = useState('')
  const [walkInName, setWalkInName] = useState('')
  const [walkInParty, setWalkInParty] = useState('1')
  const [walkInDietaryNotes, setWalkInDietaryNotes] = useState('')
  const [printMode, setPrintMode] = useState('')
  const [scannerOpen, setScannerOpen] = useState(false)
  const [offlineRoster, setOfflineRoster] = useState([])
  const [pendingCheckins, setPendingCheckins] = useState([])
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const currentEvent = events.find((event) => event.id === selectedEvent)
  const visibleGuests = guests.filter((guest) => guest.name.toLowerCase().includes(query.toLowerCase()))
  const peopleCount = guests.filter((guest) => guest.rsvp_status === 'confirmed').reduce((total, guest) => total + guest.party_size, 0) + walkIns.reduce((total, guest) => total + guest.party_size, 0)
  const checkinAllowed = currentEvent?.role === 'checkin_staff'
  const printReport = (mode) => { setPrintMode(mode); window.setTimeout(() => { window.print(); setPrintMode('') }, 120) }

  async function loadEvents() {
    const response = await fetch('/api/staff/events')
    if (!response.ok) throw new Error('Não foi possível carregar os eventos atribuídos.')
    const result = await response.json()
    await storeOfflineEvents(result.events).catch(() => {})
    setEvents(result.events)
    if (!selectedEvent && result.events.length) setSelectedEvent(result.events[0].id)
    setStage('ready')
  }

  async function loadEventGuests(eventId) {
    if (!eventId) return
    try {
      const response = await fetch(`/api/staff/events/${eventId}/guests`)
      const result = await response.json()
      if (!response.ok) throw new Error('Lista do evento indisponível.')
      setGuests(result.guests)
      setWalkIns(result.walkIns)
      if (events.find((event) => event.id === eventId)?.role === 'checkin_staff') {
        const rosterResponse = await fetch(`/api/staff/events/${eventId}/offline-roster`)
        if (!rosterResponse.ok) throw new Error('Nao foi possivel preparar a lista offline.')
        const roster = await rosterResponse.json()
        await storeOfflineRoster(eventId, roster.guests, roster.walkIns).catch(() => {})
        setOfflineRoster(roster.guests)
      }
    } catch (cause) {
      if (navigator.onLine && !(cause instanceof TypeError)) throw cause
      const cached = await readOfflineRoster(eventId).catch(() => null)
      if (!cached) throw new Error(cause.message || 'Lista offline indisponível. Conecte-se antes do evento para preparar este dispositivo.')
      const queued = await readOfflineCheckins(eventId)
      setOfflineRoster(cached.guests)
      setGuests(cached.guests.map((guest) => {
        const pending = queued.find((entry) => entry.guestId === guest.id)
        return pending ? { ...guest, checked_in_at: guest.checked_in_at || pending.createdAt, offline_pending: true } : guest
      }))
      const pendingWalkIns = queued.filter((entry) => entry.name).map((entry) => ({ id: entry.id, name: entry.name, party_size: entry.partySize, dietary_notes: entry.dietaryNotes, checked_in_at: entry.createdAt, offline_pending: true }))
      setWalkIns([...new Map([...(cached.walkIns || []), ...pendingWalkIns].map((entry) => [entry.id, entry])).values()])
      setIsOnline(false)
    }
    setPendingCheckins(await readOfflineCheckins(eventId).catch(() => []))
  }

  async function queueOfflineCheckin(entry) {
    await storeOfflineCheckin({ ...entry, eventId: selectedEvent, createdAt: new Date().toISOString() })
    setPendingCheckins(await readOfflineCheckins(selectedEvent))
  }

  async function syncPendingCheckins(eventId = selectedEvent) {
    if (!eventId || !navigator.onLine) return
    const queued = await readOfflineCheckins(eventId)
    if (!queued.length) return
    const response = await fetch(`/api/staff/events/${eventId}/checkins/sync`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ entries: queued.slice(0, 100).map(({ id, guestId, name, partySize, dietaryNotes }) => ({ id, guestId, name, partySize, dietaryNotes })) }) })
    if (response.status === 401 || response.status === 403) {
      setStage('login')
      throw new Error('Entre novamente para sincronizar as entradas offline.')
    }
    if (!response.ok) throw new Error('Não foi possível sincronizar as entradas offline.')
    const result = await response.json()
    const completedIds = result.results.filter((item) => ['synced', 'already_checked_in'].includes(item.status)).map((item) => item.id)
    await removeOfflineCheckins(completedIds)
    setPendingCheckins(await readOfflineCheckins(eventId))
    if (result.results.some((item) => !['synced', 'already_checked_in'].includes(item.status))) setError('Algumas entradas offline precisam ser revisadas antes de sincronizar.')
    if (completedIds.length) {
      await loadEventGuests(eventId)
      notify(`${completedIds.length} entrada(s) offline sincronizada(s)`)
    }
  }

  async function logoutStaff() {
    if (!navigator.onLine) {
      localStorage.setItem('wedding-staff-locked', '1')
      setEvents([])
      setGuests([])
      setWalkIns([])
      setOfflineRoster([])
      setPendingCheckins([])
      setScannerOpen(false)
      setStage('login')
      setError('Tela bloqueada. As entradas pendentes serão sincronizadas quando a conexão voltar.')
      return
    }
    setBusy(true)
    setError('')
    try {
      const queued = await readAllOfflineCheckins()
      if (queued.length) throw new Error('Sincronize as entradas pendentes antes de sair.')
      localStorage.setItem('wedding-staff-locked', '1')
      const response = await fetch('/api/auth/logout', { method: 'POST' })
      if (!response.ok && response.status !== 401) throw new Error('Não foi possível encerrar a sessão. Tente novamente.')
      await clearOfflineCheckinData()
      window.location.assign('/equipe')
    } catch (cause) {
      if (cause.message === 'offline_data_in_use') {
        setEvents([])
        setGuests([])
        setWalkIns([])
        setOfflineRoster([])
        setPendingCheckins([])
        setStage('login')
        setError('Sessão encerrada. Feche outras abas da equipe neste aparelho para apagar a lista offline.')
      } else if (localStorage.getItem('wedding-staff-locked') === '1') {
        setEvents([])
        setGuests([])
        setWalkIns([])
        setOfflineRoster([])
        setPendingCheckins([])
        setStage('login')
        setError(cause.message)
      } else {
        setError(cause.message)
      }
    } finally {
      setBusy(false)
    }
  }
  useEffect(() => {
    if (localStorage.getItem('wedding-staff-locked') === '1') {
      setStage('login')
      return
    }
    fetch('/api/auth/session').then(async (response) => {
      if (!response.ok) throw new Error('authentication_required')
      const session = await response.json()
      if (session.mfaSetupRequired) {
        setStage('mfa-setup')
        return null
      }
      if (!session.mfaVerified) {
        setError('Entre novamente com o código do autenticador para validar sua sessão.')
        setStage('login')
        return null
      }
      return loadEvents()
    }).catch(async (cause) => {
      if (!(cause instanceof TypeError)) {
        setStage('login')
        return
      }
      const cached = await readOfflineEvents().catch(() => null)
      if (!cached || !cached.events.length) {
        setStage('login')
        return
      }
      setEvents(cached.events)
      setSelectedEvent((current) => current || cached.events[0].id)
      setIsOnline(false)
      setStage('ready')
    })
  }, [])

  useEffect(() => {
    if (stage === 'ready' && selectedEvent) loadEventGuests(selectedEvent).catch((cause) => setError(cause.message))
  }, [stage, selectedEvent])

  useEffect(() => {
    const onOnline = () => {
      setIsOnline(true)
    }
    const onOffline = () => setIsOnline(false)
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    return () => {
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
    }
  }, [selectedEvent])

  useEffect(() => {
    const lockFromAnotherTab = (event) => {
      if (event.key !== 'wedding-staff-locked' || event.newValue !== '1') return
      setEvents([])
      setGuests([])
      setWalkIns([])
      setOfflineRoster([])
      setPendingCheckins([])
      setScannerOpen(false)
      setStage('login')
      setError('O acesso foi bloqueado em outra aba deste aparelho.')
    }
    window.addEventListener('storage', lockFromAnotherTab)
    return () => window.removeEventListener('storage', lockFromAnotherTab)
  }, [])

  useEffect(() => {
    if (stage === 'ready' && selectedEvent && isOnline) syncPendingCheckins().catch((cause) => setError(cause.message))
  }, [stage, selectedEvent, isOnline])

  async function login(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      const response = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password, code, turnstileToken }) })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error === 'turnstile_verification_failed' ? 'Conclua novamente a verificação de segurança.' : result.error === 'turnstile_unavailable' ? 'A verificação de segurança ainda não foi configurada neste site.' : 'E-mail, senha ou código inválido.')
      localStorage.removeItem('wedding-staff-locked')
      if (result.mfaSetupRequired) {
        setStage('mfa-setup')
        return
      }
      await loadEvents()
    } catch (cause) {
      setError(cause.message)
    } finally {
      setTurnstileToken('')
      setTurnstileReset((current) => current + 1)
      setBusy(false)
    }
  }

  async function addWalkIn(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    const name = walkInName.trim()
    const partySize = Number(walkInParty)
    const dietaryNotes = walkInDietaryNotes.trim()
    try {
      if (!navigator.onLine) throw new TypeError('offline')
      const response = await fetch(`/api/staff/events/${selectedEvent}/checkins`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, partySize, dietaryNotes }) })
      if (!response.ok) throw new Error('Nao foi possivel registrar a entrada manual.')
      setWalkInName('')
      setWalkInParty('1')
      setWalkInDietaryNotes('')
      await loadEventGuests(selectedEvent)
      notify('Entrada de ultima hora registrada; buffet atualizado')
    } catch (cause) {
      if (!(cause instanceof TypeError)) {
        setError(cause.message)
        setBusy(false)
        return
      }
      try {
        const entry = { id: crypto.randomUUID(), name, partySize, dietaryNotes }
        await queueOfflineCheckin(entry)
        setWalkIns((current) => [...current, { ...entry, dietary_notes: dietaryNotes, checked_in_at: new Date().toISOString(), offline_pending: true }])
        setWalkInName('')
        setWalkInParty('1')
        setWalkInDietaryNotes('')
        notify('Entrada salva neste dispositivo; sincronizara quando a conexao voltar')
      } catch {
        setError('Nao foi possivel guardar a entrada neste dispositivo.')
      }
    } finally {
      setBusy(false)
    }
  }

  async function checkIn(guestId) {
    setBusy(true)
    setError('')
    try {
      if (!navigator.onLine) throw new TypeError('offline')
      const response = await fetch(`/api/staff/events/${selectedEvent}/checkins`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ guestId }) })
      if (!response.ok) throw new Error(response.status === 409 ? 'Este convite ja teve a entrada registrada.' : 'Nao foi possivel registrar a entrada.')
      await loadEventGuests(selectedEvent)
      notify('Entrada registrada no D1')
    } catch (cause) {
      if (!(cause instanceof TypeError)) {
        setError(cause.message)
        setBusy(false)
        return
      }
      try {
        const guest = guests.find((item) => item.id === guestId)
        if (guest?.rsvp_status === 'declined') throw new Error('Este convite foi recusado para este evento.')
        if (!guest || guest.checked_in_at) throw new Error('Este convite ja aparece como registrado neste dispositivo.')
        await queueOfflineCheckin({ id: crypto.randomUUID(), guestId })
        setGuests((current) => current.map((item) => item.id === guestId ? { ...item, checked_in_at: new Date().toISOString(), offline_pending: true } : item))
        notify(`Entrada salva offline: ${guest.name}`)
      } catch (offlineError) {
        setError(offlineError.message || 'Nao foi possivel guardar a entrada offline.')
      }
    } finally {
      setBusy(false)
    }
  }

  async function queueScannedInvitation(token) {
    const tokenHash = await hashInvitationToken(token)
    const guest = offlineRoster.find((item) => item.access_token_hash === tokenHash)
    if (!guest) throw new Error('Convite nao encontrado na lista offline deste evento.')
    if (guest.rsvp_status === 'declined') throw new Error('Este convite foi recusado para este evento.')
    if (guest.checked_in_at || guests.some((item) => item.id === guest.id && item.checked_in_at)) throw new Error('Este convite ja teve a entrada registrada neste dispositivo.')
    await queueOfflineCheckin({ id: crypto.randomUUID(), guestId: guest.id })
    setGuests((current) => current.map((item) => item.id === guest.id ? { ...item, checked_in_at: new Date().toISOString(), offline_pending: true } : item))
    notify(`Entrada salva offline: ${guest.name} · ${guest.party_size} pessoas`)
  }

  async function scanInvitation(value) {
    setScannerOpen(false)
    setBusy(true)
    setError('')
    try {
      let token = value
      try {
        const scannedUrl = new URL(value)
        token = scannedUrl.hash.match(/^#convite\/([A-Za-z0-9_-]{40,60})$/)?.[1] || ''
      } catch {
        token = value.match(/^([A-Za-z0-9_-]{40,60})$/)?.[1] || ''
      }
      if (!token) throw new Error('Este QR code nao e um convite valido.')
      if (!navigator.onLine) {
        await queueScannedInvitation(token)
        return
      }
      try {
        const response = await fetch(`/api/staff/events/${selectedEvent}/scan`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token }) })
        const result = await response.json()
        if (!response.ok) throw new Error(result.error === 'already_checked_in' ? 'Este convite ja teve a entrada registrada.' : result.error === 'invitation_declined' ? 'Este convite foi recusado para este evento.' : result.error === 'invitation_not_found' ? 'Convite invalido ou nao autorizado para este evento.' : 'Nao foi possivel registrar a entrada.')
        await loadEventGuests(selectedEvent)
        notify(`Entrada registrada: ${result.guest.name} · ${result.guest.partySize} pessoas`)
      } catch (cause) {
        if (!(cause instanceof TypeError)) throw cause
        await queueScannedInvitation(token)
      }
    } catch (cause) {
      setError(cause.message)
    } finally {
      setBusy(false)
    }
  }
  if (stage === 'mfa-setup') return <RoleFrame icon={Shield} eyebrow="SEGUNDO FATOR" title="Proteja sua conta." description="Configure um autenticador para continuar à área da equipe." secure><AccountMfaSetup onComplete={loadEvents} /></RoleFrame>
  if (stage !== 'ready') return <RoleFrame icon={ListChecks} eyebrow="EQUIPE DO EVENTO" title="Acesso ao evento." description="Entre com a conta atribuída pelos noivos. O primeiro acesso exige cadastrar um autenticador; nos próximos, use o código de seis dígitos." secure>
    <form className="role-card admin-login-form" onSubmit={login}><label>E-mail<input type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} required /></label><label>Senha<PasswordInput autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required /></label><label>Código do autenticador, se já cadastrado<input inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength="6" value={code} onChange={(event) => setCode(event.target.value)} /></label><TurnstileChallenge onToken={setTurnstileToken} resetKey={turnstileReset} />{error && <p className="admin-form-error" role="alert">{error}</p>}<button className="button-primary" disabled={busy || stage === 'checking' || !TURNSTILE_SITE_KEY || !turnstileToken} type="submit">Entrar <LockKeyhole size={15} /></button></form>
  </RoleFrame>

  const confirmedCount = guests.filter((guest) => guest.rsvp_status === 'confirmed').length
  const checkinCount = guests.filter((guest) => guest.checked_in_at).length + walkIns.length
  const eventDate = currentEvent?.starts_at ? new Date(currentEvent.starts_at).toLocaleString('pt-BR', { dateStyle: 'medium', timeStyle: 'short' }) : 'Data não definida'
  return <RoleFrame icon={ListChecks} eyebrow="EQUIPE DO EVENTO" title={checkinAllowed ? 'Lista do evento, com acesso controlado.' : 'Nomes dos convidados do evento.'} description={checkinAllowed ? 'Esta lista contém os convidados autorizados para o evento selecionado.' : 'Você consulta somente os nomes da lista dos eventos atribuídos.'} className={`staff-print-${printMode}`} secure headerAction={<button className="button-outline" disabled={busy} onClick={logoutStaff} title={!isOnline ? 'Bloqueia esta tela e preserva as entradas offline pendentes' : ''}>{isOnline ? 'Sair' : 'Bloquear aparelho'}</button>}>
    {events.length > 1 && <label className="staff-event-select">Evento<select value={selectedEvent} onChange={(event) => setSelectedEvent(event.target.value)}>{events.map((event) => <option key={event.id} value={event.id}>{event.name} · {event.starts_at ? new Date(event.starts_at).toLocaleDateString('pt-BR') : 'sem data'}</option>)}</select></label>}
    {error && <p className="admin-form-error" role="alert">{error}</p>}
    {checkinAllowed && <div className="staff-offline-status" role="status"><span className={isOnline ? 'staff-online' : 'staff-offline'}>{isOnline ? 'Conexao ativa' : 'Modo offline'}</span><span>{pendingCheckins.length} entrada(s) aguardando sincronizacao</span>{offlineRoster.length > 0 && <span>Lista temporaria preparada neste dispositivo</span>}{isOnline && pendingCheckins.length > 0 && <button className="button-outline" disabled={busy} onClick={() => syncPendingCheckins().catch((cause) => setError(cause.message))}>Sincronizar agora</button>}</div>}
    {!events.length && <p className="buffet-empty">Nenhum evento foi atribuído a esta conta.</p>}
    {currentEvent && <>
      {checkinAllowed && <div className="role-stat-grid"><div className="role-stat"><span>Confirmados neste evento</span><strong>{confirmedCount}</strong></div><div className="role-stat"><span>Pessoas previstas no buffet</span><strong>{peopleCount}</strong></div><div className="role-stat"><span>Entradas registradas</span><strong>{checkinCount}</strong></div></div>}
      {checkinAllowed && <section className="role-card staff-scanner-card"><div className="role-card-heading"><div><span className="eyebrow">LEITOR DO EVENTO</span><h2>Entrada por QR code</h2></div><QrCode size={20} /></div>{scannerOpen ? <QrCamera onDecode={scanInvitation} onError={(message) => { setError(message); setScannerOpen(false) }} /> : <button className="button-primary" disabled={busy} onClick={() => { setError(''); setScannerOpen(true) }}><Camera size={16} /> Abrir câmera para ler convite</button>}<p>O QR é validado no servidor, limitado a este evento e registrado uma única vez.</p></section>}
      <section className="role-card staff-list-card print-list"><div className="role-card-heading"><div><span className="eyebrow">{eventDate}</span><h2>{currentEvent.name}</h2></div><button className="button-outline print-button" onClick={() => printReport('list')}><Printer size={15} /> Exportar lista em PDF</button></div><label className="search-field"><Search size={15} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar nome" /></label><div className="staff-guest-list">{(printMode === 'list' ? guests : visibleGuests).map((guest) => <div className="staff-guest-row" key={guest.id}><div className="staff-guest-copy"><strong>{guest.name}</strong>{checkinAllowed && <small>{guest.group_name || 'Sem grupo'} · {guest.party_size} {guest.party_size === 1 ? 'pessoa' : 'pessoas'} · {guest.dietary_notes || 'Sem restrição informada'} · {guest.rsvp_status}</small>}</div>{checkinAllowed && (guest.rsvp_status === 'declined' ? <span className="status-pill declined"><i /> Recusado</span> : guest.checked_in_at ? <span className="status-pill confirmed"><i /> Entrada registrada</span> : <button className="checkin-toggle" disabled={busy} onClick={() => checkIn(guest.id)}>Registrar entrada</button>)}</div>)}</div>{checkinAllowed && walkIns.map((guest) => <div className="staff-guest-row walkin-entry" key={guest.id}><div className="staff-guest-copy"><strong>{guest.name} <span>Entrada manual</span></strong><small>{guest.party_size} {guest.party_size === 1 ? 'pessoa' : 'pessoas'} · {guest.dietary_notes || 'Sem restrição informada'} · {guest.checked_in_at ? new Date(guest.checked_in_at).toLocaleString('pt-BR') : 'Agora'}</small></div><span className="status-pill confirmed"><i /> Buffet atualizado</span></div>)}</section>
      {checkinAllowed && <section className="role-card walkin-staff-card"><div><span className="eyebrow">CHEGADA SEM QR CODE</span><h2>Adicionar convidado de última hora</h2><p>O total de pessoas é atualizado para o buffet.</p></div><form className="walkin-form staff-walkin-form" onSubmit={addWalkIn}><label>Nome<input value={walkInName} onChange={(event) => setWalkInName(event.target.value)} maxLength="160" required placeholder="Nome completo" /></label><label>Pessoas<input type="number" min="1" max="20" value={walkInParty} onChange={(event) => setWalkInParty(event.target.value)} required /></label><label>Restrição alimentar<input value={walkInDietaryNotes} onChange={(event) => setWalkInDietaryNotes(event.target.value)} maxLength="1000" placeholder="Opcional" /></label><button className="button-primary" type="submit" disabled={busy}>Adicionar <Check size={15} /></button></form></section>}
    </>}
  </RoleFrame>
}

function QrCamera({ onDecode, onError }) {
  const videoRef = useRef(null)
  const callbacksRef = useRef({ onDecode, onError })
  callbacksRef.current = { onDecode, onError }

  useEffect(() => {
    let active = true
    let controls
    import('@zxing/browser').then(({ BrowserQRCodeReader }) => {
      if (!active) return null
      return new BrowserQRCodeReader().decodeFromVideoDevice(undefined, videoRef.current, (result) => {
        if (!result || !active) return
        active = false
        controls?.stop()
        callbacksRef.current.onDecode(result.getText())
      })
    }).then((nextControls) => {
      if (!nextControls) return
      controls = nextControls
      if (!active) controls.stop()
    }).catch(() => {
      if (active) callbacksRef.current.onError('Não foi possível acessar a câmera. Verifique a permissão do navegador e tente novamente.')
    })
    return () => {
      active = false
      controls?.stop()
    }
  }, [])

  return <div className="staff-camera-view"><video ref={videoRef} muted playsInline /><button className="button-outline" onClick={onError.bind(null, 'Leitura cancelada.')}>Cancelar leitura</button></div>
}
function superadminAccessMessage(code) {
  return ({
    cloudflare_access_unconfigured: 'Configure ACCESS_TEAM_DOMAIN e ACCESS_APPLICATION_AUD nas variáveis do Cloudflare Pages.',
    cloudflare_access_required: 'O Cloudflare Access não validou sua identidade. Confira a regra Allow, o Team domain e o AUD da aplicação antes de tentar novamente.',
    superadmin_email_unconfigured: 'Configure SUPERADMIN_EMAIL nas variáveis do Cloudflare Pages.',
    turnstile_unavailable: 'Configure a chave do Turnstile e o secret TURNSTILE_SECRET_KEY no Cloudflare Pages.',
    turnstile_verification_failed: 'Conclua novamente a verificação de segurança.',
  })[code] || null
}

async function readSuperadminResponse(response) {
  try {
    return await response.json()
  } catch {
    if (response.status === 403 || response.redirected || response.url.includes('.cloudflareaccess.com')) {
      throw new Error('cloudflare_access_required')
    }
    throw new Error('superadmin_response_unavailable')
  }
}

function SuperAdminPanel({ notify }) {
  const [stage, setStage] = useState('checking')
  const [account, setAccount] = useState(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [bootstrapConfirmation, setBootstrapConfirmation] = useState('')
  const [code, setCode] = useState('')
  const [turnstileToken, setTurnstileToken] = useState('')
  const [turnstileReset, setTurnstileReset] = useState(0)
  const [enrollment, setEnrollment] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    fetch('/api/auth/session').then(async (response) => {
      if (!response.ok) throw new Error('authentication_required')
      return response.json()
    }).then((result) => {
      if (!result.isSuperadmin) throw new Error('superadmin_access_required')
      setAccount(result.account)
      setStage(result.mfaVerified ? 'ready' : result.mfaEnabled ? 'login' : 'setup')
    }).catch(() => fetch('/api/superadmin/bootstrap/status').then(async (response) => {
      const result = await readSuperadminResponse(response)
      if (!response.ok) throw new Error(result.error || 'bootstrap_unavailable')
      return result
    }).then((result) => {
      if (result.available) {
        setEmail(result.email)
        setStage('bootstrap')
      } else {
        setStage('login')
      }
    }).catch((cause) => {
      setError(superadminAccessMessage(cause.message) || '')
      setStage('login')
    }))
  }, [])

  useEffect(() => {
    if (stage !== 'setup' || enrollment || !account) return
    fetch('/api/superadmin/mfa/enroll', { method: 'POST' }).then(async (response) => {
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'mfa_setup_unavailable')
      setEnrollment(result)
    }).catch((cause) => setError(superadminAccessMessage(cause.message) || 'Não foi possível iniciar o cadastro do autenticador.'))
  }, [stage, enrollment, account])

  async function login(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      const response = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password, code, turnstileToken }) })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'invalid_credentials')
      if (!result.account.isSuperadmin) throw new Error('superadmin_access_required')
      setAccount(result.account)
      setStage(result.mfaSetupRequired ? 'setup' : 'ready')
    } catch (cause) {
      setError(superadminAccessMessage(cause.message) || (cause.message === 'too_many_attempts' ? 'Muitas tentativas. Aguarde antes de tentar novamente.' : cause.message === 'mfa_unavailable' ? 'O MFA está indisponível no servidor.' : 'E-mail, senha ou código de autenticação inválido.'))
    } finally {
      setTurnstileToken('')
      setTurnstileReset((current) => current + 1)
      setBusy(false)
    }
  }

  async function bootstrap(event) {
    event.preventDefault()
    if (password !== bootstrapConfirmation) {
      setError('As senhas não coincidem.')
      return
    }
    setBusy(true)
    setError('')
    try {
      const response = await fetch('/api/superadmin/bootstrap', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password }) })
      const result = await readSuperadminResponse(response)
      if (!response.ok) throw new Error(superadminAccessMessage(result.error) || (result.error === 'superadmin_already_configured' ? 'A conta inicial já foi configurada. Entre com seu e-mail e senha.' : result.error === 'superadmin_account_exists' ? 'Já existe uma conta com este e-mail. Tente entrar ou recuperar a senha.' : result.error === 'superadmin_bootstrap_failed' ? 'O servidor não concluiu a configuração. O erro foi registrado para diagnóstico; tente novamente mais tarde.' : result.error === 'superadmin_email_unconfigured' ? 'Configure SUPERADMIN_EMAIL no Cloudflare Pages.' : 'A senha precisa ter pelo menos 14 caracteres.'))
      setAccount(result.account)
      setPassword('')
      setBootstrapConfirmation('')
      setStage('setup')
    } catch (cause) {
      setError(superadminAccessMessage(cause.message) || cause.message)
    } finally {
      setBusy(false)
    }
  }

  async function confirmMfa(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      const response = await fetch('/api/superadmin/mfa/confirm', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code }) })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'invalid_mfa_code')
      setStage('ready')
      setCode('')
    } catch (cause) {
      setError(superadminAccessMessage(cause.message) || 'Código inválido. Confira o horário do celular e tente novamente.')
    } finally {
      setBusy(false)
    }
  }

  if (stage === 'checking') return <SuperAdminAccessFrame title="Verificando sua sessão." description="A autorização é conferida no servidor antes de carregar os dados."><p>Carregando sessão segura…</p></SuperAdminAccessFrame>
  if (stage === 'bootstrap') return <SuperAdminAccessFrame title="Configure o primeiro superadmin." description="Esta criação só fica disponível uma vez e requer sua identidade validada pelo Cloudflare Access. Depois, será obrigatório cadastrar o segundo fator.">
    <form className="role-card admin-login-form" onSubmit={bootstrap}><label>E-mail autorizado<input type="email" value={email} readOnly /></label><label>Crie uma senha forte<PasswordInput autoComplete="new-password" minLength="14" maxLength="1024" value={password} onChange={(event) => setPassword(event.target.value)} required /></label><label>Confirme a senha<PasswordInput autoComplete="new-password" minLength="14" maxLength="1024" value={bootstrapConfirmation} onChange={(event) => setBootstrapConfirmation(event.target.value)} required /></label>{error && <p className="admin-form-error" role="alert">{error}</p>}<button className="button-primary" disabled={busy} type="submit">{busy ? 'Criando conta segura…' : 'Criar e configurar MFA'} <Shield size={15} /></button></form>
  </SuperAdminAccessFrame>
  if (stage === 'login') return <SuperAdminAccessFrame title="Acesso administrativo." description="Entre com sua conta. Cloudflare Access e a autenticação do produto são verificados separadamente.">
    <form className="role-card admin-login-form" onSubmit={login}><label>E-mail<input type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} required /></label><label>Senha<PasswordInput autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required /></label><label>Código do autenticador<input inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength="6" value={code} onChange={(event) => setCode(event.target.value)} placeholder="6 dígitos, se já configurado" /></label><TurnstileChallenge onToken={setTurnstileToken} resetKey={turnstileReset} />{error && <p className="admin-form-error" role="alert">{error}</p>}<button className="button-primary" disabled={busy || !TURNSTILE_SITE_KEY || !turnstileToken} type="submit">{busy ? 'Verificando…' : 'Entrar'} <LockKeyhole size={15} /></button><a className="text-link reset-admin-link" href="/recuperar-senha">Esqueci minha senha</a></form>
  </SuperAdminAccessFrame>
  if (stage === 'setup') return <SuperAdminAccessFrame title="Configure seu autenticador." description="Escaneie o QR code com seu aplicativo autenticador e confirme o código de seis dígitos.">
    <form className="role-card admin-login-form" onSubmit={confirmMfa}>{enrollment ? <><TotpSetupQr enrollment={enrollment} /><label>Código de confirmação<input inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength="6" value={code} onChange={(event) => setCode(event.target.value)} required /></label></> : <p className="admin-mfa-instructions">Preparando o cadastro seguro do autenticador…</p>}{error && <p className="admin-form-error" role="alert">{error}</p>}<button className="button-primary" disabled={busy || !enrollment} type="submit">Ativar segundo fator <Shield size={15} /></button></form>
  </SuperAdminAccessFrame>
  return <SuperAdminWorkspace notify={notify} account={account} onLogout={async () => { await fetch('/api/auth/logout', { method: 'POST' }); setStage('login') }} />
}

function SuperAdminAccessFrame({ title, description, children, eyebrow = 'CONTROLE DA PLATAFORMA', brand = 'Administração da plataforma' }) {
  return <div className="role-page"><header className="role-header"><a className="role-brand" href="/"><span>e<span>&</span>t</span><strong>{brand}</strong></a><span className="role-preview"><LockKeyhole size={13} /> ÁREA PROTEGIDA</span></header><main className="role-main admin-auth-main"><div className="role-intro"><span className="role-icon"><Shield size={19} /></span><span className="eyebrow">{eyebrow}</span><h1>{title}</h1><p>{description}</p></div>{children}</main><footer className="role-footer"><span>{brand}</span><a href="https://henriquesouzas.com" target="_blank" rel="noreferrer">henriquesouzas.com</a></footer></div>
}

function SuperAdminWorkspace({ notify, account, onLogout }) {
  const [adminSection, setAdminSection] = useState('overview')
  const [data, setData] = useState(null)
  const [accounts, setAccounts] = useState([])
  const [weddings, setWeddings] = useState([])
  const [accountsPage, setAccountsPage] = useState(1)
  const [weddingsPage, setWeddingsPage] = useState(1)
  const [auditPage, setAuditPage] = useState(1)
  const [accountsHasMore, setAccountsHasMore] = useState(false)
  const [weddingsHasMore, setWeddingsHasMore] = useState(false)
  const [auditHasMore, setAuditHasMore] = useState(false)
  const [policy, setPolicy] = useState(null)
  const [purgeTarget, setPurgeTarget] = useState(null)
  const [confirmation, setConfirmation] = useState('')
  const [coupleEmail, setCoupleEmail] = useState('')
  const [partnerOneName, setPartnerOneName] = useState('')
  const [partnerTwoName, setPartnerTwoName] = useState('')
  const [weddingSlug, setWeddingSlug] = useState('')
  const [weddingDate, setWeddingDate] = useState('')
  const [coupleInvitation, setCoupleInvitation] = useState(null)
  const [emailTestState, setEmailTestState] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function request(path, options = {}) {
    const response = await fetch(path, { ...options, headers: { ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...options.headers } })
    const result = response.status === 204 ? null : await readSuperadminResponse(response)
    if (!response.ok) throw new Error(result?.error || 'request_failed')
    return result
  }

  async function refresh() {
    const [overview, accountRows, weddingRows, feeResult] = await Promise.all([
      request(`/api/superadmin/overview?auditPage=${auditPage}`),
      request(`/api/superadmin/accounts?page=${accountsPage}`),
      request(`/api/superadmin/weddings?page=${weddingsPage}`),
      request('/api/superadmin/fee-policy'),
    ])
    setData(overview)
    setAuditHasMore(overview.auditHasMore)
    setAccounts(accountRows.accounts)
    setWeddings(weddingRows.weddings)
    setAccountsHasMore(accountRows.hasMore)
    setWeddingsHasMore(weddingRows.hasMore)
    const current = feeResult.policy
    setPolicy({ enabled: Boolean(current.enabled), rate: (current.rate_basis_points / 100).toString(), min: (current.minimum_fee_cents / 100).toFixed(2), max: current.maximum_fee_cents === null ? '' : (current.maximum_fee_cents / 100).toFixed(2), paidBy: current.paid_by })
  }

  useEffect(() => {
    refresh().catch((cause) => setError(superadminAccessMessage(cause.message) || (cause.message === 'superadmin_access_required' ? 'A conta não tem permissão de superadmin.' : 'Não foi possível carregar os dados do D1.')))
  }, [accountsPage, weddingsPage, auditPage])

  async function changeAccountStatus(item) {
    setError('')
    try {
      await request(`/api/superadmin/accounts/${item.id}/status`, { method: 'POST', body: JSON.stringify({ status: item.status === 'active' ? 'suspended' : 'active' }) })
      await refresh()
      notify('Status da conta atualizado no D1')
    } catch {
      setError('Não foi possível atualizar esta conta.')
    }
  }

  async function changeWeddingStatus(item) {
    setError('')
    try {
      await request(`/api/superadmin/weddings/${item.id}/status`, { method: 'POST', body: JSON.stringify({ status: item.status === 'active' ? 'suspended' : 'active' }) })
      await refresh()
      notify('Status do casamento atualizado no D1')
    } catch {
      setError('Não foi possível atualizar este casamento.')
    }
  }

  function createWeddingSlug(firstName, secondName) {
    return `${firstName}-${secondName}`.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 30).replace(/-$/g, '')
  }

  async function inviteCouple(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    setCoupleInvitation(null)
    try {
      const result = await request('/api/superadmin/wedding-invitations', { method: 'POST', body: JSON.stringify({
        email: coupleEmail,
        partnerOneName,
        partnerTwoName,
        slug: weddingSlug,
        eventDate: weddingDate || null,
      }) })
      setCoupleInvitation(result)
      setCoupleEmail('')
      setPartnerOneName('')
      setPartnerTwoName('')
      setWeddingSlug('')
      setWeddingDate('')
      await refresh()
      notify('Casamento criado como rascunho; convite pronto para enviar.')
    } catch (cause) {
      setError(cause.message === 'wedding_slug_unavailable' ? 'Este slug já está sendo usado. Escolha outro endereço curto.' : cause.message === 'account_not_ready' ? 'Esta conta ainda não está ativa ou não pode receber este tipo de convite.' : 'Não foi possível criar o casamento. Confira o e-mail, os nomes e o slug.')
    } finally {
      setBusy(false)
    }
  }

  async function copyCoupleInvitation() {
    try {
      await navigator.clipboard.writeText(coupleInvitation.invitationUrl)
      notify('Link do convite copiado')
    } catch {
      notify('Selecione e copie o link do convite')
    }
  }

  async function savePolicy(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      await requestWithRecentMfa(request, '/api/superadmin/fee-policy', { method: 'PUT', body: JSON.stringify({ enabled: policy.enabled, rateBasisPoints: Math.round(Number(policy.rate) * 100), minimumFeeCents: Math.round(Number(policy.min) * 100), maximumFeeCents: policy.max === '' ? null : Math.round(Number(policy.max) * 100), paidBy: policy.paidBy }) })
      await refresh()
      notify('Política de taxas gravada no D1 e registrada na auditoria')
    } catch (cause) {
      setError(cause.message === 'invalid_mfa_code' ? 'O código do autenticador não foi aceito.' : cause.message === 'mfa_reauthentication_cancelled' ? 'A confirmação do autenticador foi cancelada.' : cause.message === 'recent_mfa_required' ? 'Confirme novamente o segundo fator antes de alterar a política.' : 'A política de taxas não foi salva. Confira os valores e tente novamente.')
    } finally {
      setBusy(false)
    }
  }

  async function sendEmailTest() {
    setBusy(true)
    setEmailTestState('')
    setError('')
    try {
      const result = await requestWithRecentMfa(request, '/api/superadmin/email-test', {
        method: 'POST',
        body: JSON.stringify({ confirmation: 'send-test-email' }),
      })
      setEmailTestState(`E-mail de teste enviado para ${result.to}.`)
      notify('E-mail de teste enviado pelo Resend')
    } catch (cause) {
      setEmailTestState(cause.message === 'email_service_unconfigured'
        ? 'O Resend ainda não está ativo na versão publicada. Publique a versão que usa as configurações do Resend.'
        : cause.message === 'email_test_failed'
          ? 'O Resend recusou o envio. Confira o domínio remetente e a chave da API.'
          : cause.message === 'email_test_rate_limited'
            ? 'Já foi enviado um teste nesta hora. Confira sua caixa de entrada e o spam.'
            : cause.message === 'mfa_reauthentication_cancelled' || cause.message === 'invalid_mfa_code'
              ? 'Confirme novamente o código do autenticador para enviar o teste.'
              : 'Não foi possível enviar o e-mail de teste.')
    } finally {
      setBusy(false)
    }
  }

  async function anonymizeWedding() {
    if (!purgeTarget || confirmation !== `ANONIMIZAR ${purgeTarget.id}`) return
    setBusy(true)
    setError('')
    try {
      await requestWithRecentMfa(request, `/api/superadmin/weddings/${purgeTarget.id}/anonymize`, { method: 'POST', body: JSON.stringify({ confirmation }) })
      setPurgeTarget(null)
      setConfirmation('')
      await refresh()
      notify('Dados pessoais anonimizados; auditoria preservada')
    } catch (cause) {
      setError(cause.message === 'invalid_mfa_code' ? 'O c\u00f3digo do autenticador n\u00e3o foi aceito.' : cause.message === 'mfa_reauthentication_cancelled' ? 'A confirma\u00e7\u00e3o do autenticador foi cancelada.' : cause.message === 'recent_mfa_required' ? 'Confirme novamente o segundo fator antes de continuar.' : 'N\u00e3o foi poss\u00edvel anonimizar os dados.')
    } finally {
      setBusy(false)
    }
  }

  if (!data || !policy) return <RoleFrame icon={Shield} eyebrow="CONTROLE DA PLATAFORMA" title="Visão global protegida." description={error || 'Carregando dados do D1…'}>{error && <p className="admin-form-error" role="alert">{error}</p>}</RoleFrame>
  return <div className="role-page"><header className="role-header"><a className="role-brand" href="/"><span>e<span>&</span>t</span><strong>Administração da plataforma</strong></a><span className="role-preview">Acesso: {account?.email}</span><button className="button-outline" onClick={onLogout}>Sair</button></header><main className="role-main"><div className="role-intro"><span className="role-icon"><Shield size={19} /></span><span className="eyebrow">CONTROLE DA PLATAFORMA</span><h1>Visão global, com trilha de auditoria.</h1><p>Os dados e alterações deste painel são consultados e gravados no D1 após validação de papel no servidor.</p></div>
    {error && <p className="admin-form-error" role="alert">{error}</p>}
    <div className="role-stat-grid"><div className="role-stat"><span>Casamentos ativos</span><strong>{data.weddings.active || 0}</strong></div><div className="role-stat"><span>Contas ativas</span><strong>{data.accounts.active || 0}</strong></div><div className="role-stat"><span>Convidados registrados</span><strong>{data.guests.total || 0}</strong></div><div className="role-stat"><span>Taxas</span><strong>{policy.enabled ? `${policy.rate}%` : 'Desativadas'}</strong></div></div>
    <div className="role-stat-grid admin-financial-stats"><div className="role-stat"><span>Presentes confirmados</span><strong>{formatBrlCents(data.financials.gifts_received_cents)}</strong></div><div className="role-stat"><span>Taxas recebidas</span><strong>{formatBrlCents(data.financials.fees_received_cents)}</strong></div><div className="role-stat"><span>Taxas pendentes</span><strong>{formatBrlCents(data.financials.fees_due_cents)}</strong></div></div>
     <nav className="superadmin-tabs" aria-label="Seções do superadmin" role="tablist">{[{ id: 'overview', label: 'Visão geral', icon: House }, { id: 'weddings', label: 'Casamentos', icon: Heart }, { id: 'accounts', label: 'Contas', icon: Users }, { id: 'fees', label: 'Taxas', icon: Wallet }, { id: 'audit', label: 'Auditoria', icon: LockKeyhole }].map((item) => <button key={item.id} id={`superadmin-tab-${item.id}`} type="button" role="tab" aria-selected={adminSection === item.id} aria-controls={`superadmin-panel-${item.id}`} className={adminSection === item.id ? 'active' : ''} onClick={() => setAdminSection(item.id)}><item.icon size={15} /> {item.label}</button>)}</nav>
     {adminSection === 'overview' && <div className="superadmin-section" id="superadmin-panel-overview" role="tabpanel" aria-labelledby="superadmin-tab-overview"><section className="role-card superadmin-card email-test-card"><div className="role-card-heading"><div><span className="eyebrow">CONFIGURAÇÃO DE E-MAIL</span><h2>Testar envio pelo Resend</h2></div><Mail size={19} /></div><p>Envia uma única mensagem para a conta superadmin ({account?.email}). O teste exige autenticação recente e fica limitado a um envio por hora.</p><button className="button-primary" type="button" onClick={sendEmailTest} disabled={busy}><Mail size={15} /> {busy ? 'Enviando teste…' : 'Enviar e-mail de teste'}</button>{emailTestState && <p className="email-test-state" role="status">{emailTestState}</p>}</section></div>}
     {adminSection === 'weddings' && <div className="superadmin-section" id="superadmin-panel-weddings" role="tabpanel" aria-labelledby="superadmin-tab-weddings">
    <section className="role-card superadmin-card"><div className="role-card-heading"><div><span className="eyebrow">NOVO CASAMENTO</span><h2>Criar espaço dos noivos</h2></div><Users size={19} /></div><p className="team-access-note">O casamento começa como rascunho. O slug fica reservado no D1 e não depende do domínio da plataforma. O link pode ser enviado manualmente até o serviço de e-mail ser escolhido.</p><form className="superadmin-wedding-form" onSubmit={inviteCouple}><label>E-mail dos noivos<input type="email" value={coupleEmail} onChange={(event) => setCoupleEmail(event.target.value)} maxLength="254" required /></label><label>Nome do primeiro noivo<input value={partnerOneName} onChange={(event) => { const next = event.target.value; setPartnerOneName(next); setWeddingSlug(createWeddingSlug(next, partnerTwoName)) }} maxLength="100" required /></label><label>Nome do segundo noivo<input value={partnerTwoName} onChange={(event) => { const next = event.target.value; setPartnerTwoName(next); setWeddingSlug(createWeddingSlug(partnerOneName, next)) }} maxLength="100" required /></label><label>Slug reservado<input value={weddingSlug} onChange={(event) => setWeddingSlug(event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 30))} minLength="3" maxLength="30" pattern="[a-z0-9][a-z0-9-]{1,28}[a-z0-9]" required /></label><label>Data do casamento<input type="date" value={weddingDate} onChange={(event) => setWeddingDate(event.target.value)} /></label><button className="button-primary" type="submit" disabled={busy}>Criar e gerar convite <ArrowRight size={15} /></button></form>{coupleInvitation && <div className="team-invitation-result"><strong>Convite de {coupleInvitation.email}</strong><span>{coupleInvitation.requiresLogin ? 'A pessoa entrará com a conta existente.' : 'A pessoa criará uma senha para ativar a conta.'} Link válido até {new Date(coupleInvitation.expiresAt).toLocaleString('pt-BR')}.</span><div><input readOnly value={coupleInvitation.invitationUrl} aria-label="Link de convite dos noivos" onFocus={(event) => event.target.select()} /><button className="button-outline" onClick={copyCoupleInvitation}><Copy size={14} /> Copiar</button></div></div>}</section>
    <section className="role-card superadmin-card"><div className="role-card-heading"><div><span className="eyebrow">CONTAS E SITES</span><h2>Casamentos cadastrados</h2></div><span className="task-count">{data.weddings.total || 0} registros</span></div><div className="superadmin-table-wrap"><table className="superadmin-table"><thead><tr><th>CASAL</th><th>SLUG</th><th>RESPONSÁVEL</th><th>CONVIDADOS</th><th>STATUS</th><th>AÇÕES</th></tr></thead><tbody>{weddings.map((item) => <tr key={item.id}><td><strong>{item.partner_one_name} & {item.partner_two_name}</strong><small>{item.event_date || 'Data não definida'}</small></td><td>{item.slug}</td><td>{item.owner_email}</td><td>{item.guest_count}</td><td><span className={`admin-state ${item.status === 'active' ? 'admin-state-active' : ''}`}>{item.status}</span></td><td><div className="admin-row-actions"><button onClick={() => changeWeddingStatus(item)}>{item.status === 'active' ? 'Suspender' : 'Ativar'}</button><button onClick={() => { setPurgeTarget(item); setConfirmation('') }}><Trash2 size={14} /> Limpar dados</button></div></td></tr>)}</tbody></table></div><div className="admin-pagination"><span>Página {weddingsPage}</span><div><button className="button-outline" type="button" disabled={weddingsPage === 1 || busy} onClick={() => setWeddingsPage((page) => page - 1)}>Anterior</button><button className="button-outline" type="button" disabled={!weddingsHasMore || busy} onClick={() => setWeddingsPage((page) => page + 1)}>Próxima</button></div></div>{purgeTarget && <div className="purge-confirm"><div><span className="eyebrow">LIMPEZA IRREVERSÍVEL DE DADOS</span><p>Remove convidados, respostas, tarefas, check-ins e eventos operacionais. Preserva o extrato financeiro e a auditoria. Exige MFA recente.</p></div><label>Digite ANONIMIZAR {purgeTarget.id}<input value={confirmation} onChange={(event) => setConfirmation(event.target.value)} /></label><div className="admin-row-actions"><button onClick={() => setPurgeTarget(null)}>Cancelar</button><button disabled={busy || confirmation !== `ANONIMIZAR ${purgeTarget.id}`} onClick={anonymizeWedding}>Confirmar limpeza e anonimização</button></div></div>}</section>
     </div>}
     {adminSection === 'accounts' && <div className="superadmin-section" id="superadmin-panel-accounts" role="tabpanel" aria-labelledby="superadmin-tab-accounts"><section className="role-card superadmin-card"><div className="role-card-heading"><div><span className="eyebrow">ACESSO À PLATAFORMA</span><h2>Contas cadastradas</h2></div><span className="task-count">{data.accounts.total || 0} contas</span></div><div className="superadmin-table-wrap"><table className="superadmin-table accounts-table"><thead><tr><th>E-MAIL</th><th>CASAMENTOS</th><th>STATUS</th><th>AÇÃO</th></tr></thead><tbody>{accounts.map((item) => <tr key={item.id}><td><strong>{item.email}</strong><small>{item.email_verified_at ? 'E-mail verificado' : 'E-mail pendente'}</small><small>Criada {new Date(item.created_at).toLocaleDateString('pt-BR')}</small><small>Ultimo acesso: {item.last_login_at ? new Date(item.last_login_at).toLocaleString('pt-BR') : 'nunca'}</small></td><td>{item.wedding_count}</td><td><span className={`admin-state ${item.status === 'active' ? 'admin-state-active' : ''}`}>{item.status}</span></td><td><button className="account-status-action" disabled={item.id === account?.id && item.status === 'active'} onClick={() => changeAccountStatus(item)}>{item.status === 'active' ? 'Suspender' : 'Ativar'}</button></td></tr>)}</tbody></table></div><div className="admin-pagination"><span>Página {accountsPage}</span><div><button className="button-outline" type="button" disabled={accountsPage === 1 || busy} onClick={() => setAccountsPage((page) => page - 1)}>Anterior</button><button className="button-outline" type="button" disabled={!accountsHasMore || busy} onClick={() => setAccountsPage((page) => page + 1)}>Próxima</button></div></div></section></div>}
     {adminSection === 'fees' && <div className="superadmin-section" id="superadmin-panel-fees" role="tabpanel" aria-labelledby="superadmin-tab-fees"><section className="role-card fee-admin-card"><div className="role-card-heading"><div><span className="eyebrow">REGRAS COMERCIAIS</span><h2>Taxas por presente</h2></div><span className={`fee-switch-label ${policy.enabled ? 'fee-active' : ''}`}>{policy.enabled ? 'Taxa ativada' : 'Sem taxas'}</span></div><form className="fee-form" onSubmit={savePolicy}><label className="fee-toggle"><input type="checkbox" checked={policy.enabled} onChange={(event) => setPolicy((current) => ({ ...current, enabled: event.target.checked }))} /><span>Ativar taxa para presentes</span></label><div className="fee-fields"><label>Percentual (%)<input type="number" min="0" max="100" step="0.01" value={policy.rate} onChange={(event) => setPolicy((current) => ({ ...current, rate: event.target.value }))} disabled={!policy.enabled} /></label><label>Mínimo (R$)<input type="number" min="0" step="0.01" value={policy.min} onChange={(event) => setPolicy((current) => ({ ...current, min: event.target.value }))} disabled={!policy.enabled} /></label><label>Máximo (R$)<input type="number" min="0" step="0.01" value={policy.max} onChange={(event) => setPolicy((current) => ({ ...current, max: event.target.value }))} disabled={!policy.enabled} placeholder="Sem limite" /></label><label>Quem paga<select value={policy.paidBy} onChange={(event) => setPolicy((current) => ({ ...current, paidBy: event.target.value }))} disabled={!policy.enabled}><option value="couple">Noivos</option><option value="guest">Convidado</option></select></label></div><div className="fee-form-footer"><p>Alterações são salvas no D1 e registradas na trilha de auditoria.</p><button className="button-primary" type="submit" disabled={busy}>Salvar política <Check size={15} /></button></div></form></section></div>}
     {adminSection === 'audit' && <div className="superadmin-section" id="superadmin-panel-audit" role="tabpanel" aria-labelledby="superadmin-tab-audit"><section className="role-card audit-card"><div className="role-card-heading"><div><span className="eyebrow">SEGURANÇA</span><h2>Atividade administrativa</h2></div><span><LockKeyhole size={15} /> {data.auditTotal} registros</span></div>{data.audit.length ? <div className="audit-list">{data.audit.map((item, index) => <div key={`${item.target_id}-${item.created_at}-${index}`}><span>{item.action}</span><strong>{item.target_type} · {item.target_id || '—'}</strong><small>{item.actor_email || 'Conta de sistema'} {' \u00b7 '} {new Date(item.created_at).toLocaleString('pt-BR')}</small></div>)}</div> : <p className="buffet-empty">Ainda não há ações administrativas registradas.</p>}<div className="admin-pagination"><span>P\u00e1gina {data.auditPage} de {Math.max(1, Math.ceil(data.auditTotal / 20))}</span><div><button className="button-outline" type="button" disabled={auditPage === 1 || busy} onClick={() => setAuditPage((page) => page - 1)}>Anterior</button><button className="button-outline" type="button" disabled={!auditHasMore || busy} onClick={() => setAuditPage((page) => page + 1)}>Pr\u00f3xima</button></div></div></section></div>}
    <div className="admin-security-note"><Shield size={16} /><span>Cloudflare Access, sessão com MFA e papel superadmin são verificados antes das operações. A anonimização preserva registros de auditoria e financeiros.</span></div>
  </main><footer className="role-footer"><span>Administração da plataforma</span><a href="https://henriquesouzas.com" target="_blank" rel="noreferrer">henriquesouzas.com</a></footer></div>
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
    const csv = rows.map((row) => row.map(csvCell).join(';')).join('\n')
    const url = URL.createObjectURL(new Blob(['\ufeff', csv], { type: 'text/csv;charset=utf-8' }))
    const link = document.createElement('a')
    link.href = url
    link.download = 'lista-do-buffet.csv'
    link.click()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
    notify('Lista do buffet exportada')
  }

  const buffetCount = walkIns.reduce((total, guest) => total + guest.partySize, 0)
  return <div className="checkin-page"><div className="checkin-top"><a href="#entrada" className="checkin-brand"><span>e<span>&</span>t</span><div><strong>Entrada do evento</strong><small>Elisa & Tomás · demonstração local</small></div></a><span className="checkin-demo-tag">PRÉVIA INTERATIVA</span></div><div className="checkin-content"><div className="checkin-heading"><span className="eyebrow">MODO EQUIPE</span><h1>Uma chegada<br />tranquila começa aqui.</h1><p>Registre a entrada pelo convite ou inclua alguém que chegou de última hora. As entradas manuais compõem a lista do buffet.</p></div><div className="scanner-card"><div className="scanner-topline"><span><i /> LEITOR DE CONVITES</span><span>18 SET 2027</span></div><div className="scanner-view"><div className="scanner-frame"><i /><i /><i /><i /><span className="scanner-line" /><QrCode size={48} strokeWidth={1} /></div><span className="scanner-caption">Leitor de QR ilustrativo nesta prévia</span></div><div className="scanner-bottom"><span><span className="connection-indicator" /> Dados de demonstração salvos neste dispositivo</span><span>1.248 convites preparados</span></div></div><div className={`checkin-result ${checkedIn ? 'checked-in' : ''}`}><span className="guest-avatar guest-avatar-1">A</span><div><span className="eyebrow">CONVIDADA DE EXEMPLO</span><strong>Ana Beatriz Costa</strong><small>Convite para 2 pessoas · Família da noiva</small></div><span className={`status-pill ${checkedIn ? 'confirmed' : 'waiting'}`}><i />{checkedIn ? 'Entrada registrada' : 'Ainda não entrou'}</span></div><button className="button-primary checkin-action" onClick={() => { setCheckedIn(!checkedIn); notify(checkedIn ? 'Entrada de demonstração desfeita' : 'Entrada de demonstração registrada') }}>{checkedIn ? 'Desfazer entrada de exemplo' : 'Registrar entrada de exemplo'} <Check size={16} /></button>
    <section className="walkin-card"><div className="walkin-heading"><div><span className="eyebrow">CONVIDADO DE ÚLTIMA HORA</span><h2>Adicionar entrada manual</h2></div><span className="walkin-count">{buffetCount} {buffetCount === 1 ? 'pessoa' : 'pessoas'} no buffet</span></div><form className="walkin-form" onSubmit={addWalkIn}><label>Nome do convidado<input value={name} onChange={(event) => setName(event.target.value)} placeholder="Ex.: Marina Oliveira" required /></label><label>Número de pessoas<input type="number" min="1" max="20" value={partySize} onChange={(event) => setPartySize(event.target.value)} required /></label><label className="walkin-dietary">Restrição alimentar ou observação<input value={dietary} onChange={(event) => setDietary(event.target.value)} placeholder="Opcional · ex.: vegetariano" /></label><button className="button-primary" type="submit">Registrar e incluir no buffet <Check size={15} /></button></form><div className="buffet-heading"><strong>Lista para o buffet</strong><button type="button" className="buffet-export" onClick={exportBuffetList} disabled={!walkIns.length}>Exportar CSV</button></div>{walkIns.length ? <div className="buffet-list">{walkIns.map((guest) => <div className="buffet-row" key={guest.id}><span className="guest-avatar">{guest.name.charAt(0).toUpperCase()}</span><div><strong>{guest.name}</strong><small>{guest.dietary || 'Sem observação alimentar'}</small></div><span>{guest.partySize} {guest.partySize === 1 ? 'pessoa' : 'pessoas'}</span></div>)}</div> : <p className="buffet-empty">As entradas manuais aparecerão aqui e serão somadas para o buffet.</p>}</section>
    <div className="checkin-footnote"><CircleHelp size={15} /> A câmera, os convites e a sincronização com o banco ainda não estão conectados; esta prévia salva entradas localmente neste navegador.</div></div><footer className="checkin-footer"><span>e<span>&</span>t · ferramenta de entrada</span><a href="https://henriquesouzas.com" target="_blank" rel="noreferrer">henriquesouzas.com</a></footer></div>
}
export default App
