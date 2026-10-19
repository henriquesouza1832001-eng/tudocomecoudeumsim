import './styles.css'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import QRCode from 'qrcode'
import { SITE_MEDIA_LIMITS } from './site-media-config.js'
import { ORDERABLE_SITE_SECTIONS, moveSiteSection as moveSiteSectionOrder, orderedSiteSections, sortEventsByStartTime } from './site-sections.js'
import { SITE_SECTION_LAYOUT_OPTIONS } from './site-section-layouts.js'
import { shouldAutoplayWeddingCoverVideo } from './site-motion.js'
import { getThemePalettes, isValidCustomAccent } from './site-style.js'
import { extractPhotoColorSuggestions } from './photo-palette.js'
import { checkSitePublication } from './site-publication-check.js'
import { createSiteDraftHistory, recordSiteDraftChange, redoSiteDraft, undoSiteDraft } from './site-draft-history.js'
import { EDITABLE_SITE_SECTION_TITLES, getSiteSectionTitle, safeHttpsLink, setSiteSectionBody, setSiteSectionTitle } from './site-section-content.js'
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
  Eye,
  EyeOff,
  ExternalLink,
  Flower2,
  Gift,
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
  Undo2,
  Redo2,
  Users,
  UserRound,
  Video,
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
  garden: { fontPair: 'Clássico editorial', coverLayout: 'split', coverComposition: 'side' },
  editorial: { fontPair: 'Elegante de alto contraste', coverLayout: 'full', coverComposition: 'overlay' },
  minimal: { fontPair: 'Minimalista geométrico', coverLayout: 'split', coverComposition: 'editorial' },
  floral: { fontPair: 'Floral delicado', coverLayout: 'arch', coverComposition: 'editorial' },
  rustic: { fontPair: 'Rústico acolhedor', coverLayout: 'split', coverComposition: 'side' },
  beach: { fontPair: 'Romântico leve', coverLayout: 'full', coverComposition: 'overlay' },
  tropical: { fontPair: 'Contemporâneo humanista', coverLayout: 'full', coverComposition: 'editorial' },
  night: { fontPair: 'Moderno sem serifa', coverLayout: 'full', coverComposition: 'overlay' },
}
const PALETTE_NAMES = ['Original', 'Areia', 'Terracota', 'Rosé', 'Oliva', 'Dourado']
const SITE_FONT_PAIRS = {
  'Clássico editorial': ["'Playfair Display', Georgia, serif", "'DM Sans', Arial, sans-serif"],
  'Romântico leve': ["'Cormorant Garamond', Georgia, serif", "'Lora', Georgia, serif"],
  'Moderno sem serifa': ["'Montserrat', Arial, sans-serif", "'Montserrat', Arial, sans-serif"],
  'Elegante de alto contraste': ["'Libre Baskerville', Georgia, serif", "'Manrope', Arial, sans-serif"],
  'Contemporâneo humanista': ["'Manrope', Arial, sans-serif", "'DM Sans', Arial, sans-serif"],
  'Floral delicado': ["'Lora', Georgia, serif", "'Raleway', Arial, sans-serif"],
  'Minimalista geométrico': ["'Montserrat', Arial, sans-serif", "'Manrope', Arial, sans-serif"],
  'Rústico acolhedor': ["'Cormorant Garamond', Georgia, serif", "'Lora', Georgia, serif"],
}
const FONT_SCALE_OPTIONS = [{ id: 'small', label: 'Compacto' }, { id: 'medium', label: 'Padrão' }, { id: 'large', label: 'Ampliado' }]
function FontScalePicker({ value = 'medium', onChange }) {
  return <div className="font-scale-picker" role="group" aria-label="Tamanho do texto do convite">
    <span>Tamanho do texto</span>
    <div>{FONT_SCALE_OPTIONS.map((option) => <button type="button" key={option.id} className={value === option.id ? 'active' : ''} aria-pressed={value === option.id} onClick={() => onChange(option.id)}>{option.label}</button>)}</div>
  </div>
}
function SiteAccentPicker({ value, appliedValue, onChange }) {
  const customAccent = isValidCustomAccent(value) ? value : null
  const adjusted = Boolean(customAccent && customAccent.toLowerCase() !== appliedValue.toLowerCase())
  return <div className="site-accent-picker"><label>Cor de destaque personalizada<input type="color" value={customAccent || appliedValue} onChange={(event) => onChange(event.target.value)} /></label><small>Opcional. O sistema ajusta a cor quando necessário para manter contraste com o fundo.</small>{adjusted && <small role="status">A cor foi escurecida para manter o contraste mínimo.</small>}{customAccent && <button type="button" className="button-outline" onClick={() => onChange(null)}>Usar cor da paleta</button>}</div>
}
const DEFAULT_SITE_CONFIG = { theme: 'garden', paletteIndex: 0, customAccent: null, coverLayout: 'full', coverComposition: null, coverTextAlign: 'left', coverTextPosition: 'center', coverOverlayOpacity: 45, coverImagePosition: 'center', coverImagePositionDesktop: 'center', coverImagePositionMobile: 'center', giftDisplayMode: 'hidden', pixDisplayMode: 'hidden', coverImage: 'none', coverPhotoId: null, coverCarouselEnabled: false, coverGallery: [], siteGallery: [], imageAltTexts: {}, siteCarouselEnabled: false, siteCarouselPhotos: [], siteCarouselAutoplay: false, fontScale: 'medium', enabledSections: ['Nossa história', 'Eventos', 'Confirmação de presença'], animationPreset: 'Elegante', fontPair: 'Clássico editorial', language: 'pt-BR', coverMessages: { 'pt-BR': 'Com alegria, convidamos você.' }, storyMessages: { 'pt-BR': '' }, shareMessage: '', timeline: [], godparents: [], giftPresentation: {}, sectionContent: {}, sectionLayouts: {}, weddingDetails: { schedule: '', menu: '', dressCode: '' }, guestCamera: { enabled: false, photoLimit: 200 }, pix: { enabled: false, key: '', holderName: '' } }
function imageAltText(config, id, fallback) {
  return config?.imageAltTexts?.[id]?.[config?.language || 'pt-BR']?.trim() || fallback
}

function siteSectionTitle(section) {
  return ({ 'Contagem regressiva': 'Contagem regressiva', 'Nossa história': 'Nossa história', 'Linha do tempo': 'Linha do tempo', Eventos: 'Programação dos eventos', Cronograma: 'Cronograma do dia', 'Dress code': 'Traje sugerido', 'Padrinhos e madrinhas': 'Padrinhos e madrinhas', 'Galeria de fotos': 'Fotos do casal', 'Lista de presentes': 'Presentes e Pix', 'Confirmação de presença': 'Confirmação de presença', 'Hospedagem e dicas': 'Hospedagem e dicas', 'Perguntas frequentes': 'Perguntas frequentes', Playlist: 'Playlist', Vídeo: 'Vídeo', Contato: 'Contato' })[section] || section
}

const EVENT_TYPE_LABELS = { ceremony: 'Cerimônia', reception: 'Recepção', rehearsal: 'Ensaio', brunch: 'Brunch', other: 'Outro' }
const GIFT_CATEGORIES = ['Cozinha', 'Eletrodomésticos', 'Casa e decoração', 'Quarto e banho', 'Experiências', 'Lua de mel', 'Outros']

function formatInviteEventDate(value, locale = 'pt-BR', timezone = 'America/Sao_Paulo') {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  try {
    return new Intl.DateTimeFormat(locale, { dateStyle: 'long', timeStyle: 'short', timeZone: timezone }).format(date)
  } catch {
    return new Intl.DateTimeFormat(locale, { dateStyle: 'long', timeStyle: 'short' }).format(date)
  }
}

function eventMapUrl(address) {
  return address?.trim() ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address.trim())}` : ''
}

function weddingDateTime(dateValue, timeValue, timezone = 'America/Sao_Paulo') {
  if (!dateValue) return null
  const [year, month, day] = dateValue.split('-').map(Number)
  const [hour = 0, minute = 0] = (timeValue || '00:00').split(':').map(Number)
  if (![year, month, day, hour, minute].every(Number.isFinite)) return null
  const desiredUtc = Date.UTC(year, month - 1, day, hour, minute)
  let timestamp = desiredUtc
  try {
    for (let attempt = 0; attempt < 2; attempt += 1) {
      const parts = new Intl.DateTimeFormat('en-CA', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date(timestamp))
      const values = Object.fromEntries(parts.map((part) => [part.type, Number(part.value)]))
      timestamp = desiredUtc - (Date.UTC(values.year, values.month - 1, values.day, values.hour, values.minute) - timestamp)
    }
  } catch {
    return new Date(desiredUtc)
  }
  const target = new Date(timestamp)
  return Number.isNaN(target.getTime()) ? null : target
}

function WeddingCountdown({ date, time, timezone, title }) {
  const target = weddingDateTime(date, time, timezone)
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (!target) return undefined
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [date, time, timezone])
  if (!target) return null
  const remaining = Math.max(0, target.getTime() - now)
  const values = { days: Math.floor(remaining / 86400000), hours: Math.floor(remaining / 3600000) % 24, minutes: Math.floor(remaining / 60000) % 60, seconds: Math.floor(remaining / 1000) % 60 }
  return <section className="public-wedding-countdown" id="contagem-regressiva" aria-live="off"><span className="eyebrow">CONTAGEM REGRESSIVA</span><h2>{title || (remaining ? 'O grande dia se aproxima' : 'Hoje é o grande dia!')}</h2>{remaining > 0 && <div className="public-wedding-countdown-values">{Object.entries(values).map(([unit, value]) => <div key={unit}><strong>{String(value).padStart(unit === 'days' ? 1 : 2, '0')}</strong><small>{{ days: 'dias', hours: 'horas', minutes: 'minutos', seconds: 'segundos' }[unit]}</small></div>)}</div>}</section>
}

function WeddingTimelineSection({ items = [], mediaUrl = () => '', imageAltTexts = {}, title }) {
  const visibleItems = items.filter((item) => item.title?.trim())
  if (!visibleItems.length) return null
  return <section className="public-wedding-timeline" id="historia-marcos"><span className="eyebrow">Nossa história</span><h2>{title || 'Alguns capítulos de nós'}</h2><div>{visibleItems.map((item) => <article key={item.id}>{item.photoId && mediaUrl(item.photoId) && <img src={mediaUrl(item.photoId)} alt={imageAltTexts[item.photoId]?.['pt-BR'] || `Foto de ${item.title}`} /> }<div>{item.date && <time dateTime={item.date}>{new Date(`${item.date}T12:00:00`).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}</time>}<h3>{item.title}</h3>{item.description && <p>{item.description}</p>}</div></article>)}</div></section>
}

function WeddingGodparentsSection({ people = [], mediaUrl = () => '', imageAltTexts = {}, title }) {
  const visiblePeople = people.filter((person) => person.name?.trim() && person.photoId && mediaUrl(person.photoId))
  if (!visiblePeople.length) return null
  return <section className="public-wedding-godparents" id="padrinhos"><span className="eyebrow">QUEM CAMINHA COM VOCÊS</span><h2>{title}</h2><div>{visiblePeople.map((person) => <article key={person.id}><img src={mediaUrl(person.photoId)} alt={imageAltTexts[person.photoId]?.['pt-BR'] || `Foto de ${person.name}`} /><h3>{person.name}</h3>{person.message && <p>{person.message}</p>}</article>)}</div></section>
}

function WeddingEditorialSection({ id, label, title, body }) {
  const paragraphs = String(body || '').split(/\r?\n/).map((paragraph) => paragraph.trim()).filter(Boolean)
  if (!paragraphs.length) return null
  return <section className="public-wedding-editorial-section" id={id}><span className="eyebrow">{label}</span><h2>{title}</h2>{paragraphs.map((paragraph, index) => <p key={`${index}-${paragraph}`}>{paragraph}</p>)}</section>
}

function WeddingPlaylistSection({ title, url }) {
  const href = safeHttpsLink(url)
  if (!href) return null
  return <section className="public-wedding-editorial-section" id="playlist"><span className="eyebrow">TRILHA SONORA</span><h2>{title}</h2><p>Ouçam a playlist escolhida pelo casal.</p><a className="button-outline" href={href} target="_blank" rel="noopener noreferrer">Abrir playlist <ExternalLink size={14} /></a></section>
}

function WeddingVideoSection({ title, videoUrl, externalUrl }) {
  const href = safeHttpsLink(externalUrl)
  if (!videoUrl && !href) return null
  return <section className="public-wedding-editorial-section" id="video"><span className="eyebrow">VÍDEO DO CASAL</span><h2>{title}</h2>{videoUrl ? <video className="public-wedding-section-video" src={videoUrl} controls playsInline preload="metadata" /> : <a className="button-outline" href={href} target="_blank" rel="noopener noreferrer">Assistir vídeo <ExternalLink size={14} /></a>}</section>
}

function WeddingInvitationCover({ theme = 'garden', layout = 'full', composition = null, textAlign = 'left', textPosition = 'center', overlayOpacity = 45, imagePosition = 'center', mobileImagePosition = imagePosition, partnerOneName, partnerTwoName, date, time, message, photoUrl, photoAlt = 'Foto escolhida pelo casal', videoUrl, animationPreset = 'Elegante', showRsvp = true, preview = false, carouselCount = 0, carouselIndex = 0 }) {
  const coverLayout = ['full', 'split', 'arch', 'type', 'video', 'collage'].includes(layout) ? layout : 'full'
  const selectedComposition = ['side', 'overlay', 'editorial'].includes(composition) ? composition : null
  const legacyLayoutClass = selectedComposition ? '' : ` public-wedding-cover-${coverLayout}`
  const objectPositions = { center: 'center center', top: 'center top', bottom: 'center bottom', left: 'left center', right: 'right center' }
  const coverStyle = { '--cover-text-align': textAlign, '--cover-copy-align': ({ left: 'flex-start', center: 'center', right: 'flex-end' })[textAlign] || 'flex-start', '--cover-copy-justify': ({ top: 'flex-start', center: 'center', bottom: 'flex-end' })[textPosition] || 'center', '--cover-overlay-opacity': String(Math.max(10, Math.min(75, overlayOpacity)) / 100), '--cover-image-position-desktop': objectPositions[imagePosition] || 'center center', '--cover-image-position-mobile': objectPositions[mobileImagePosition] || objectPositions[imagePosition] || 'center center' }
  const autoplayVideo = shouldAutoplayWeddingCoverVideo(animationPreset, globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches || false, globalThis.navigator?.connection?.saveData || false)
  return <section id="inicio" className={`public-wedding-cover${legacyLayoutClass} public-cover-theme-${theme}${selectedComposition ? ` public-wedding-cover-composition-${selectedComposition}` : ''} public-wedding-cover-position-${textPosition}${preview ? ' invitation-cover-preview' : ''}`} style={coverStyle}>
    <div className="public-wedding-cover-media">{videoUrl ? <video key={videoUrl} src={videoUrl} poster={photoUrl || undefined} autoPlay={autoplayVideo} controls={!autoplayVideo} muted loop playsInline aria-label="Vídeo do casal" /> : photoUrl ? <img key={photoUrl} src={photoUrl} alt={photoAlt} /> : <div className="public-wedding-cover-placeholder" />}</div>
    {carouselCount > 1 && <span className="invite-gallery-dots" aria-label={`Foto ${carouselIndex + 1} de ${carouselCount}`}>{Array.from({ length: carouselCount }, (_, index) => <i className={index === carouselIndex ? 'active' : ''} key={index} />)}</span>}
    <span className="public-wedding-cover-ornament" aria-hidden="true" />
    <div className="public-wedding-cover-copy"><span className="public-wedding-cover-kicker">Com alegria, convidamos</span><h1><span>{partnerOneName || 'Nome'}</span><i aria-hidden="true">&amp;</i><span>{partnerTwoName || 'Nome'}</span></h1><p className="public-wedding-cover-date">{date || 'Data a confirmar'}{time ? ` · ${time}` : ''}</p>{message && <div className="public-wedding-cover-message">{message}</div>}{showRsvp && <a className="button-primary" href="#confirmar-presenca">Confirmar presença <ArrowRight size={15} /></a>}</div>
  </section>
}

function WeddingNavigation({ items, givingOptions = [] }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [givingOpen, setGivingOpen] = useState(false)
  const toggleRef = useRef(null)
  const activate = (event, action) => {
    setMenuOpen(false)
    setGivingOpen(false)
    if (!action) return
    event.preventDefault()
    action()
  }
  return <><button ref={toggleRef} type="button" className="public-wedding-menu-toggle" aria-controls="public-wedding-navigation-links" aria-expanded={menuOpen} onClick={() => setMenuOpen((current) => !current)}>{menuOpen ? <X size={18} /> : <Menu size={18} />}<span>{menuOpen ? 'Fechar menu' : 'Menu'}</span></button><nav id="public-wedding-navigation-links" className={menuOpen ? 'is-open' : ''} aria-label="Navegação do convite" onKeyDown={(event) => { if (event.key === 'Escape') { setMenuOpen(false); setGivingOpen(false); toggleRef.current?.focus() } }}>{items.map((item) => <a key={item.label} href={item.href} onClick={(event) => activate(event, item.onSelect)}>{item.label}</a>)}{givingOptions.length > 0 && <div className={`public-wedding-giving-menu${givingOpen ? ' is-open' : ''}`}><button type="button" aria-expanded={givingOpen} onClick={() => setGivingOpen((current) => !current)}>Presentear <ChevronDown size={14} /></button>{givingOpen && <div className="public-wedding-giving-options">{givingOptions.map((option) => <a key={option.label} href={option.href} onClick={(event) => activate(event, option.onSelect)}>{option.label}</a>)}</div>}</div>}</nav></>
}

function WeddingInvitationDocument({ theme, animationPreset, style, partnerOneName, partnerTwoName, navigation, preview = false, children }) {
  const motionClass = ({ Suave: 'motion-suave', Elegante: 'motion-elegante', Festivo: 'motion-festivo', Nenhum: 'motion-none' })[animationPreset] || 'motion-elegante'
  return <main className={`public-wedding-page theme-${theme || 'garden'} ${motionClass}`} style={style}>
    <header className="public-wedding-header"><a href="#inicio" aria-label="Início do convite">{partnerOneName} <i>&amp;</i> {partnerTwoName}</a>{navigation}<a href="https://henriquesouzas.com" target={preview ? undefined : '_blank'} rel={preview ? undefined : 'noreferrer'} onClick={preview ? (event) => event.preventDefault() : undefined}>henriquesouzas.com</a></header>
    {children}
    <footer className="public-wedding-footer"><span>Com carinho, {partnerOneName} &amp; {partnerTwoName}</span><a href="https://henriquesouzas.com" target={preview ? undefined : '_blank'} rel={preview ? undefined : 'noreferrer'} onClick={preview ? (event) => event.preventDefault() : undefined}>henriquesouzas.com</a></footer>
  </main>
}

function WeddingInvitationContent({ config, eventDate, eventTime, events, gifts, giftPresentation, mediaUrl, timezone, showGifts, showPix, rsvpSection, wallSection, preview = false, onOpenGifts, onOpenPix, onCopyPix, weddingUrl = '' }) {
  const giftMode = ['inline', 'page', 'hidden'].includes(config?.giftDisplayMode) ? config.giftDisplayMode : 'hidden'
  const pixMode = ['inline', 'page', 'hidden'].includes(config?.pixDisplayMode) ? config.pixDisplayMode : 'hidden'
  const story = config?.storyMessages?.[config?.language] || config?.storyMessages?.['pt-BR'] || ''
  const details = config?.weddingDetails || {}
  const gallery = config?.siteGallery || []
  const carouselPhotos = config?.siteCarouselPhotos || []
  const sectionTitle = (section, fallback) => getSiteSectionTitle(config, section, fallback)
  const orderedSections = orderedSiteSections(config).filter((section) => ORDERABLE_SITE_SECTIONS.includes(section) && (section !== 'Lista de presentes' || showGifts || showPix))
  const sectionContent = {
    'Contagem regressiva': <WeddingCountdown date={eventDate} time={eventTime} timezone={timezone} title={config?.sectionContent?.['Contagem regressiva']?.['pt-BR']?.title} preview={preview} />,
    'Nossa história': story && <section className="public-wedding-story" id="nossa-historia"><span className="eyebrow">{sectionTitle('Nossa história', 'NOSSA HISTÓRIA')}</span><p>{story}</p></section>,
    'Linha do tempo': <WeddingTimelineSection items={config?.timeline || []} mediaUrl={mediaUrl} imageAltTexts={config?.imageAltTexts} title={sectionTitle('Linha do tempo', 'Alguns capítulos de nós')} preview={preview} />,
    'Padrinhos e madrinhas': <WeddingGodparentsSection people={config?.godparents || []} mediaUrl={mediaUrl} imageAltTexts={config?.imageAltTexts} title={sectionTitle('Padrinhos e madrinhas')} />,
    'Mural de recados': wallSection,
    Eventos: <>
      <WeddingEventsSection events={events} timezone={timezone} title={sectionTitle('Eventos', 'Esperamos vocês')} preview={preview} />
      {(details.schedule || details.menu) && <section className="public-wedding-details">{details.schedule && <article><span className="eyebrow">ORIENTAÇÕES</span><p>{details.schedule}</p></article>}{details.menu && <article><span className="eyebrow">CARDÁPIO</span><p>{details.menu}</p></article>}</section>}
    </>,
    Cronograma: events.length > 0 && <WeddingDayScheduleSection events={events} timezone={timezone} title={sectionTitle('Cronograma', 'Momentos da celebração')} />,
    'Dress code': details.dressCode && <section className="public-wedding-details" id="dress-code"><article><span className="eyebrow">{sectionTitle('Dress code', 'TRAJE SUGERIDO')}</span><p>{details.dressCode}</p></article></section>,
    'Galeria de fotos': <div id="fotos-do-casal">{config?.siteCarouselEnabled && carouselPhotos.length > 0 && <WeddingPhotoCarousel photos={carouselPhotos} mediaUrl={mediaUrl} autoplay={Boolean(config.siteCarouselAutoplay)} imageAltTexts={config.imageAltTexts} title={sectionTitle('Galeria de fotos', 'Alguns instantes nossos')} />}{gallery.length > 0 && <section className="public-wedding-gallery">{!config?.siteCarouselEnabled && <span className="eyebrow">{sectionTitle('Galeria de fotos', 'FOTOS DO CASAL')}</span>}<div>{gallery.map((id) => mediaUrl(id) && <img key={id} src={mediaUrl(id)} alt={imageAltText(config, id, 'Foto do casal')} />)}</div></section>}</div>,
    'Lista de presentes': (showGifts || showPix) && <div className="public-wedding-giving-sections">{showGifts && (giftMode === 'inline' ? <WeddingGiftsSection gifts={gifts} presentation={giftPresentation} mediaUrl={mediaUrl} imageAltTexts={config?.imageAltTexts} title={sectionTitle('Lista de presentes', 'Um carinho para os noivos')} preview={preview} /> : <section className="public-wedding-display-cta"><span className="eyebrow">LISTA DE PRESENTES</span><h2>{sectionTitle('Lista de presentes', 'Um carinho para os noivos')}</h2>{preview ? <button className="button-primary" type="button" onClick={onOpenGifts}>Ver lista de presentes <ArrowRight size={15} /></button> : <a className="button-primary" href={`${weddingUrl}?pagina=presentes`}>Ver lista de presentes <ArrowRight size={15} /></a>}</section>)}{showPix && (pixMode === 'inline' ? <WeddingPixSection pix={config?.pix || {}} title={sectionTitle('Lista de presentes', 'Um presente com carinho')} preview={preview} onCopy={onCopyPix} /> : <section className="public-wedding-display-cta"><span className="eyebrow">UM PRESENTE COM CARINHO</span><h2>{sectionTitle('Lista de presentes', 'Um presente com carinho')}</h2>{preview ? <button className="button-primary" type="button" onClick={onOpenPix}>Presentear via Pix <ArrowRight size={15} /></button> : <a className="button-primary" href={`${weddingUrl}?pagina=pix`}>Presentear via Pix <ArrowRight size={15} /></a>}</section>)}</div>,
    'Hospedagem e dicas': <WeddingEditorialSection id="hospedagem" label="HOSPEDAGEM E DICAS" title={sectionTitle('Hospedagem e dicas')} body={config?.sectionContent?.['Hospedagem e dicas']?.['pt-BR']?.body} />,
    'Perguntas frequentes': <WeddingEditorialSection id="perguntas-frequentes" label="PERGUNTAS FREQUENTES" title={sectionTitle('Perguntas frequentes')} body={config?.sectionContent?.['Perguntas frequentes']?.['pt-BR']?.body} />,
    Playlist: <WeddingPlaylistSection title={sectionTitle('Playlist')} url={config?.sectionContent?.Playlist?.['pt-BR']?.body} />,
    Vídeo: <WeddingVideoSection title={sectionTitle('Vídeo')} videoUrl={config?.coverVideoId ? mediaUrl(config.coverVideoId) : ''} externalUrl={config?.sectionContent?.Vídeo?.['pt-BR']?.body} />,
    Contato: <WeddingEditorialSection id="contato" label="CONTATO" title={sectionTitle('Contato')} body={config?.sectionContent?.Contato?.['pt-BR']?.body} />,
    'Confirmação de presença': rsvpSection,
  }
  return <>
    {orderedSections.map((section) => <div className={`public-wedding-section-group section-layout-${config?.sectionLayouts?.[section] || 'classic'}`} key={section}>{sectionContent[section]}</div>)}
  </>
}

function WeddingWallSection({ messages = [], slug, preview = false, title = 'Deixe um recado para os noivos' }) {
  const [authorName, setAuthorName] = useState('')
  const [message, setMessage] = useState('')
  const [turnstileToken, setTurnstileToken] = useState('')
  const [turnstileReset, setTurnstileReset] = useState(0)
  const [error, setError] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [busy, setBusy] = useState(false)

  async function submit(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      const response = await fetch(`/api/public/weddings/${encodeURIComponent(slug)}/wall-messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ authorName, message, turnstileToken }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error === 'too_many_requests' ? 'Muitas tentativas. Aguarde alguns minutos e tente novamente.' : result.error === 'security_challenge_unavailable' ? 'O envio está temporariamente indisponível. Tente novamente mais tarde.' : result.error === 'security_challenge_failed' ? 'A verificação de segurança não foi concluída. Tente novamente.' : 'Não foi possível enviar o recado. Tente novamente.')
      setSubmitted(true)
      setAuthorName('')
      setMessage('')
    } catch (cause) {
      setError(cause.message)
    } finally {
      setTurnstileToken('')
      setTurnstileReset((current) => current + 1)
      setBusy(false)
    }
  }

  return <section className="public-wedding-wall" id="mural-de-recados"><span className="eyebrow">MENSAGENS DE CARINHO</span><h2>{title}</h2><p>Os recados passam pela aprovação dos noivos antes de aparecerem aqui.</p>{messages.length > 0 && <div className="public-wedding-wall-list">{messages.map((item) => <article key={item.id}><p>{item.message}</p><strong>{item.authorName}</strong></article>)}</div>}{preview ? <div className="public-wedding-wall-preview"><strong>Uma mensagem de carinho aparecerá aqui</strong><span>Prévia da seção publicada</span></div> : submitted ? <p className="public-wedding-wall-success" role="status">Obrigado pelo carinho. Seu recado foi enviado para aprovação.</p> : <form onSubmit={submit}><label>Seu nome<input value={authorName} onChange={(event) => setAuthorName(event.target.value)} maxLength="80" required /></label><label>Recado<textarea value={message} onChange={(event) => setMessage(event.target.value)} maxLength="1200" rows="3" required /></label><TurnstileChallenge action="wedding_message" onToken={setTurnstileToken} resetKey={turnstileReset} />{error && <p className="admin-form-error" role="alert">{error}</p>}<button type="submit" className="button-primary" disabled={busy || !TURNSTILE_SITE_KEY || !turnstileToken}>{busy ? 'Enviando…' : 'Enviar recado'} <MessageCircle size={15} /></button></form>}</section>
}

function WeddingWallModeration({ weddingId }) {
  const [messages, setMessages] = useState([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function load() {
    const response = await fetch(`/api/couple/weddings/${encodeURIComponent(weddingId)}/wall-messages`)
    const result = await response.json()
    if (!response.ok) throw new Error('Não foi possível carregar os recados.')
    setMessages(result.messages || [])
  }

  useEffect(() => { load().catch((cause) => setError(cause.message)) }, [weddingId])

  async function updateMessage(messageId, status) {
    setBusy(true)
    setError('')
    try {
      const response = await fetch(`/api/couple/weddings/${encodeURIComponent(weddingId)}/wall-messages/${encodeURIComponent(messageId)}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) })
      if (!response.ok) throw new Error('Não foi possível atualizar o recado.')
      await load()
    } catch (cause) {
      setError(cause.message)
    } finally {
      setBusy(false)
    }
  }

  return <section className="role-card guest-wall-moderation"><div className="role-card-heading"><div><span className="eyebrow">MURAL DO SITE</span><h2>Recados dos convidados</h2></div><span className="task-count">{messages.filter((item) => item.status === 'pending').length} aguardando</span></div><p className="team-access-note">Aprovem os recados que desejam exibir no site publicado. Os demais ficam privados.</p>{error && <p className="admin-form-error" role="alert">{error}</p>}{messages.length ? <div className="guest-wall-message-list">{messages.map((item) => <article key={item.id}><div><strong>{item.authorName}</strong><p>{item.message}</p><small>{item.status === 'pending' ? 'Aguardando aprovação' : item.status === 'approved' ? 'Publicado' : 'Recusado'}</small></div>{item.status !== 'approved' && <button type="button" className="button-primary" disabled={busy} onClick={() => updateMessage(item.id, 'approved')}>Aprovar</button>}{item.status !== 'rejected' && <button type="button" className="button-outline" disabled={busy} onClick={() => updateMessage(item.id, 'rejected')}>Recusar</button>}</article>)}</div> : <p className="buffet-empty">Nenhum recado recebido ainda.</p>}</section>
}

function WeddingInvitationRsvp({ title, requestUrl, publicRsvpStatus, publicCredential, rsvpEmailSent, error, eventList, eventId, setEventId, name, setName, email, setEmail, phone, setPhone, attendanceStatus, setAttendanceStatus, companions, maxCompanions, changeCompanion, setCompanions, setTurnstileToken, turnstileToken, turnstileReset, submitRsvp, busy }) {
  return <section className="public-wedding-rsvp" id="confirmar-presenca"><span className="eyebrow">RESPOSTA AO CONVITE</span><h2>{title || 'Vocês poderão estar conosco?'}</h2><p>Respondam para cada evento. O QR individual aparece após a confirmação; acompanhantes precisam de aprovação dos noivos.</p>{requestUrl ? <div className="public-wedding-request-success"><strong>{publicRsvpStatus === 'confirmed' ? 'Presença confirmada' : 'Resposta registrada'}</strong><p>{publicCredential ? rsvpEmailSent ? 'Enviamos seu link individual por e-mail.' : 'Baixe o QR e guarde o link privado para consultar sua confirmação depois.' : 'Sua resposta foi salva. O link abaixo permite consultá-la mais tarde.'}</p>{publicCredential && <CredentialCard credential={publicCredential} />}{error && <p className="admin-form-error" role="alert">{error}</p>}<a className="button-outline" href={requestUrl}>Consultar confirmação e recuperar QR <ArrowRight size={15} /></a><input readOnly value={requestUrl} aria-label="Link privado para consultar a confirmação" onFocus={(event) => event.target.select()} /></div> : <form onSubmit={submitRsvp}>
    <label>Evento<select value={eventId} onChange={(event) => setEventId(event.target.value)} required><option value="">Selecione um evento</option>{eventList.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
    <label>Nome completo<input value={name} onChange={(event) => setName(event.target.value)} maxLength="160" autoComplete="name" required /></label>
    <div className="public-wedding-contact-fields"><label>E-mail<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} maxLength="254" autoComplete="email" /></label><label>Telefone<input type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} maxLength="40" autoComplete="tel" /></label><small>Preencham pelo menos um contato para receber e recuperar o QR individual.</small></div>
    <label>Você poderá comparecer?<select value={attendanceStatus} onChange={(event) => { setAttendanceStatus(event.target.value); if (event.target.value === 'declined') setCompanions([]) }}><option value="confirmed">Vou comparecer</option><option value="declined">Não poderei comparecer</option></select></label>
    {attendanceStatus === 'confirmed' && maxCompanions > 0 && <div className="public-wedding-companions"><div><strong>Acompanhantes</strong><span>Os noivos analisarão cada solicitação. O nome é necessário antes da emissão do QR individual.</span></div>{companions.map((person, index) => <fieldset key={index}><legend>Acompanhante {index + 1}</legend><label>Nome, se já souber<input value={person.name} onChange={(event) => changeCompanion(index, { name: event.target.value })} maxLength="160" /></label><div className="public-wedding-contact-fields"><label>E-mail opcional<input value={person.email} onChange={(event) => changeCompanion(index, { email: event.target.value })} maxLength="254" /></label><label>Telefone opcional<input value={person.phone} onChange={(event) => changeCompanion(index, { phone: event.target.value })} maxLength="40" /></label></div></fieldset>)}{companions.length < maxCompanions && <button type="button" className="button-outline" onClick={() => setCompanions((current) => [...current, { name: '', email: '', phone: '' }])}>Solicitar acompanhante</button>}</div>}
    <p className="public-rsvp-credential-note">Após confirmar, seu QR será exibido aqui. Informe um e-mail válido para também receber o link individual.</p><TurnstileChallenge action="rsvp" onToken={setTurnstileToken} resetKey={turnstileReset} />{error && <p className="admin-form-error" role="alert">{error}</p>}<button className="button-primary" type="submit" disabled={busy || !eventId || !TURNSTILE_SITE_KEY || !turnstileToken}>{busy ? 'Enviando…' : 'Registrar resposta'} <Check size={15} /></button>
  </form>}</section>
}

function WeddingInvitationRsvpPreview({ events, title }) {
  return <section className="public-wedding-rsvp" id="confirmar-presenca"><span className="eyebrow">RESPOSTA AO CONVITE</span><h2>{title || 'Vocês poderão estar conosco?'}</h2><p>Respondam para cada evento. O QR individual aparece após a confirmação; acompanhantes precisam de aprovação dos noivos.</p><label>Evento<select disabled><option>{events[0]?.name || 'Evento publicado pelos noivos'}</option></select></label><label>Nome completo<input disabled placeholder="Nome do convidado" /></label><div className="public-wedding-contact-fields"><label>E-mail<input disabled placeholder="E-mail" /></label><label>Telefone<input disabled placeholder="Telefone" /></label></div><p className="public-rsvp-credential-note">Informem e-mail ou telefone para receber o link individual e recuperar o QR.</p><label>Você poderá comparecer?<select disabled><option>Vou comparecer</option></select></label><button className="button-primary" type="button" disabled>Registrar resposta <Check size={15} /></button></section>
}

function WeddingPhotoCarousel({ photos, mediaUrl, autoplay, imageAltTexts = {}, title }) {
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(false)
  const pointerStart = useRef(null)
  const resumeTimer = useRef(null)
  const slideCount = photos.length
  const activePhoto = photos[index % Math.max(slideCount, 1)]
  const activePhotoUrl = activePhoto ? mediaUrl(activePhoto) : ''
  const moveTo = (nextIndex) => setIndex((nextIndex + slideCount) % slideCount)

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const updatePreference = () => setReducedMotion(media.matches)
    updatePreference()
    media.addEventListener?.('change', updatePreference)
    return () => media.removeEventListener?.('change', updatePreference)
  }, [])

  useEffect(() => {
    setIndex((current) => current % Math.max(slideCount, 1))
    if (!autoplay || reducedMotion || paused || slideCount < 2) return undefined
    const timer = window.setInterval(() => setIndex((current) => (current + 1) % slideCount), 5000)
    return () => window.clearInterval(timer)
  }, [autoplay, paused, reducedMotion, slideCount])

  useEffect(() => () => window.clearTimeout(resumeTimer.current), [])

  if (!slideCount || !activePhotoUrl) return null

  const pauseForInteraction = () => {
    if (!autoplay) return
    setPaused(true)
    window.clearTimeout(resumeTimer.current)
    resumeTimer.current = window.setTimeout(() => setPaused(false), 5000)
  }

  const handlePointerDown = (event) => {
    pointerStart.current = event.clientX
    pauseForInteraction()
  }

  const handlePointerUp = (event) => {
    if (pointerStart.current === null) return
    const distance = event.clientX - pointerStart.current
    pointerStart.current = null
    if (Math.abs(distance) > 45) moveTo(index + (distance < 0 ? 1 : -1))
  }

  return <section className="public-wedding-photo-carousel" aria-label="Carrossel de fotos do casal" onPointerDown={handlePointerDown} onPointerUp={handlePointerUp} onPointerCancel={() => { pointerStart.current = null }} onKeyDown={(event) => { if (event.key === 'ArrowLeft') { event.preventDefault(); pauseForInteraction(); moveTo(index - 1) } if (event.key === 'ArrowRight') { event.preventDefault(); pauseForInteraction(); moveTo(index + 1) } }}>
    <span className="eyebrow">FOTOS DO CASAL</span>
    <h2>{title || 'Alguns instantes nossos'}</h2>
    <div className="public-wedding-photo-carousel-stage" aria-live="off">
      <img key={activePhoto} src={activePhotoUrl} alt={imageAltTexts[activePhoto]?.['pt-BR'] || `Foto ${index + 1} de ${slideCount}`} draggable="false" />
      {slideCount > 1 && <><button className="public-wedding-photo-carousel-arrow is-previous" type="button" aria-label="Foto anterior" onClick={() => { pauseForInteraction(); moveTo(index - 1) }}><ArrowLeft size={19} /></button><button className="public-wedding-photo-carousel-arrow is-next" type="button" aria-label="Próxima foto" onClick={() => { pauseForInteraction(); moveTo(index + 1) }}><ArrowRight size={19} /></button></>}
    </div>
    {slideCount > 1 && <div className="public-wedding-photo-carousel-indicators" role="group" aria-label="Escolher foto">{photos.map((photo, photoIndex) => <button key={photo} type="button" className={photoIndex === index ? 'active' : ''} aria-label={`Mostrar foto ${photoIndex + 1}`} aria-current={photoIndex === index ? 'true' : undefined} onClick={() => { pauseForInteraction(); moveTo(photoIndex) }} />)}</div>}
  </section>
}

function WeddingEventsSection({ events, timezone, title, preview = false }) {
  return <section className="public-wedding-events" id="eventos"><span className="eyebrow">A celebração</span><h2>{title || 'Esperamos vocês'}</h2>{events.length ? events.map((event) => <article key={event.id}><div><small>{EVENT_TYPE_LABELS[event.event_type] || 'Evento'}</small><h3>{event.name}</h3></div><p>{event.starts_at ? formatInviteEventDate(event.starts_at, 'pt-BR', timezone) : 'Data a definir'}</p>{(event.venue_name || event.address) && <div className="public-wedding-event-location">{event.venue_name && <strong>{event.venue_name}</strong>}{event.address && <><span>{event.address}</span><a href={eventMapUrl(event.address)} target={preview ? undefined : '_blank'} rel={preview ? undefined : 'noreferrer'} onClick={preview ? (eventObject) => eventObject.preventDefault() : undefined}>Ver localização <ExternalLink size={14} /></a></>}</div>}</article>) : <p>Os detalhes dos eventos ainda não foram publicados.</p>}</section>
}

function WeddingDayScheduleSection({ events, timezone, title }) {
  const scheduledEvents = sortEventsByStartTime(events)
  return <section className="public-wedding-schedule" id="cronograma-do-dia"><span className="eyebrow">CRONOGRAMA DO DIA</span><h2>{title || 'Momentos da celebração'}</h2><div>{scheduledEvents.map((event) => <article key={event.id}><time dateTime={event.starts_at || undefined}>{event.starts_at ? formatInviteEventDate(event.starts_at, 'pt-BR', timezone) : 'Horário a confirmar'}</time><div><small>{EVENT_TYPE_LABELS[event.event_type] || 'Evento'}</small><h3>{event.name}</h3>{event.venue_name && <p>{event.venue_name}</p>}</div></article>)}</div></section>
}

function WeddingGiftsSection({ gifts, presentation = {}, mediaUrl = () => '', imageAltTexts = {}, title, preview = false }) {
  const [selectedCategory, setSelectedCategory] = useState('Todas')
  const activeGifts = gifts.filter((gift) => !gift.status || gift.status === 'active')
  const categoryFor = (gift) => presentation[gift.id]?.category || 'Outros'
  const categories = [...new Set(activeGifts.map(categoryFor))]
  const visibleGifts = selectedCategory === 'Todas' ? activeGifts : activeGifts.filter((gift) => categoryFor(gift) === selectedCategory)
  return <section className="public-wedding-gifts" id="presentes"><span className="eyebrow">Com carinho</span><h2>{title || 'Um carinho para os noivos'}</h2>{categories.length > 1 && <div className="public-gift-filters" role="group" aria-label="Filtrar presentes por categoria"><button type="button" className={selectedCategory === 'Todas' ? 'active' : ''} aria-pressed={selectedCategory === 'Todas'} onClick={() => setSelectedCategory('Todas')}>Todas</button>{categories.map((category) => <button type="button" key={category} className={selectedCategory === category ? 'active' : ''} aria-pressed={selectedCategory === category} onClick={() => setSelectedCategory(category)}>{category}</button>)}</div>}<div className="public-gift-grid">{visibleGifts.map((gift) => { const photoId = presentation[gift.id]?.photoId; const image = photoId ? mediaUrl(photoId) : ''; return <article key={gift.id}>{image ? <img className="public-gift-photo" src={image} alt={imageAltTexts[photoId]?.['pt-BR'] || `Foto do presente: ${gift.title}`} /> : <div className="public-gift-monogram" aria-hidden="true"><Gift size={23} /></div>}<div><small className="public-gift-category">{categoryFor(gift)}</small><h3>{gift.title}</h3>{gift.description && <p>{gift.description}</p>}{gift.fulfillment_type === 'store_link' && <small>A compra e a entrega são concluídas com a loja.</small>}</div>{gift.fulfillment_type === 'store_link' && gift.store_url ? preview ? <span>Ver presente <ArrowRight size={14} /></span> : <a href={gift.store_url} target="_blank" rel="noopener noreferrer">Ver presente <ExternalLink size={14} /></a> : <span>{gift.gift_type === 'custom' ? 'Valor livre' : `Sugestão: ${formatBrlCents(gift.amount_cents)}`}</span>}</article> })}</div></section>
}

function WeddingPixSection({ pix, title, preview = false, onCopy }) {
  return <section className="public-wedding-pix" id="pix"><span className="eyebrow">Um presente para celebrar</span><h2>{title || 'Um presente com carinho'}</h2><p>Se desejarem, vocês podem enviar um presente diretamente aos noivos. Copiem a chave e façam a transferência pelo aplicativo do próprio banco.</p>{pix.holderName && <p>Titular: {pix.holderName}</p>}<div className={preview ? 'public-wedding-pix-copy' : ''}><input readOnly aria-label={preview ? 'Prévia da chave Pix' : 'Chave Pix dos noivos'} value={pix.key} onFocus={(event) => event.target.select()} /><button className="button-primary" type="button" disabled={preview} onClick={onCopy}><Copy size={15} /> Copiar chave</button></div><small>A transferência é feita diretamente ao casal; a plataforma não processa pagamentos.</small></section>
}

function WeddingDisplayPage({ kind, href, weddingName, gifts, presentation, mediaUrl, imageAltTexts, pix, preview = false, onBack, onCopy }) {
  return <section className="public-wedding-display-page"><a className="public-wedding-back-link" href={preview ? undefined : href} onClick={preview ? onBack : undefined}><ArrowLeft size={15} /> Voltar ao convite</a><span className="eyebrow">{kind === 'gifts' ? 'LISTA DO CASAMENTO' : 'UM PRESENTE DIRETO AOS NOIVOS'}</span><h1>{kind === 'gifts' ? 'Um carinho para ' : 'Um gesto de carinho para '}{weddingName}</h1>{kind === 'gifts' ? <WeddingGiftsSection gifts={gifts} presentation={presentation} mediaUrl={mediaUrl} imageAltTexts={imageAltTexts} preview={preview} /> : <WeddingPixSection pix={pix} preview={preview} onCopy={onCopy} />}</section>
}

function InvitationPreviewWindow({ device, animationPreset, children }) {
  const frameRef = useRef(null)
  const viewportRef = useRef(null)
  const [frameDocument, setFrameDocument] = useState(null)
  const [scale, setScale] = useState(1)
  const dimensions = { desktop: [1440, 1000], tablet: [820, 1180], mobile: [390, 844] }[device] || [1440, 1000]

  useEffect(() => {
    const viewport = viewportRef.current
    if (!viewport) return undefined
    const updateScale = () => {
      const bounds = viewport.getBoundingClientRect()
      setScale(Math.min(bounds.width / dimensions[0], bounds.height / dimensions[1], 1))
    }
    const observer = new ResizeObserver(updateScale)
    observer.observe(viewport)
    updateScale()
    return () => observer.disconnect()
  }, [dimensions[0], dimensions[1]])

  useEffect(() => {
    if (!frameDocument || animationPreset === 'Nenhum' || frameDocument.defaultView.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in frameDocument.defaultView)) return undefined
    const sections = frameDocument.querySelectorAll('.public-wedding-story, .public-wedding-timeline, .public-wedding-countdown, .public-wedding-events, .public-wedding-details, .public-wedding-gallery, .public-wedding-gifts, .public-wedding-pix, .public-wedding-rsvp')
    sections.forEach((section) => section.classList.add('invite-section-reveal'))
    const observer = new frameDocument.defaultView.IntersectionObserver((entries) => entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible')
        observer.unobserve(entry.target)
      }
    }), { threshold: 0.12 })
    sections.forEach((section) => observer.observe(section))
    return () => observer.disconnect()
  }, [frameDocument, animationPreset, children])

  function prepareFrame() {
    const frame = frameRef.current
    const doc = frame?.contentDocument
    if (!doc) return
    doc.querySelectorAll('[data-preview-styles]').forEach((node) => node.remove())
    document.querySelectorAll('style, link[rel="stylesheet"]').forEach((source) => {
      const copy = source.cloneNode(true)
      copy.setAttribute('data-preview-styles', '')
      doc.head.appendChild(copy)
    })
    setFrameDocument(doc.getElementById('invitation-preview-root') ? doc : null)
  }

  const width = dimensions[0] * scale
  const height = dimensions[1] * scale
  const frameStyle = { width: `${dimensions[0]}px`, height: `${dimensions[1]}px`, transform: `scale(${scale})`, transformOrigin: 'top left' }
  const srcDoc = `<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"><base href="${window.location.origin}/"></head><body style="margin:0;overflow-x:hidden"><div id="invitation-preview-root"></div></body></html>`

  return <div ref={viewportRef} className="invitation-preview-viewport" aria-label={`Prévia do convite em ${device === 'mobile' ? 'celular' : device === 'tablet' ? 'tablet' : 'desktop'}`}><div className="invitation-preview-scaled-frame" style={{ width: `${width}px`, height: `${height}px` }}><iframe ref={frameRef} title={`Prévia do convite em ${device}`} srcDoc={srcDoc} onLoad={prepareFrame} style={frameStyle} /></div>{frameDocument && createPortal(<div className={`invitation-preview-document browser-frame device-${device}`}><div className="browser-bar"><span /><span /><span /><div>convite do casal</div><ExternalLink size={12} /></div>{children}</div>, frameDocument.getElementById('invitation-preview-root'))}</div>
}

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
  { title: 'Contribuição para a viagem', type: 'Pix direto', description: 'Valor sugerido pelos noivos' },
  { title: 'Jogo de jantar', type: 'Loja externa', description: 'Compra concluída na loja escolhida' },
  { title: 'Contribuição livre', type: 'Pix direto', description: 'O convidado escolhe o valor no banco' },
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

function createOpaqueToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(32))
  return btoa(String.fromCharCode(...bytes)).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '')
}

async function requestWithRecentMfa(request, path, options, requestPrompt) {
  try {
    return await request(path, options)
  } catch (cause) {
    if (cause.message !== 'recent_mfa_required') throw cause
    const code = await requestPrompt({ title: 'Confirme sua identidade', message: 'Digite o código de seis dígitos do autenticador para continuar.', label: 'Código do autenticador', type: 'text', confirmLabel: 'Confirmar código' })
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

function IdentityDialog({ config, onResolve }) {
  const [value, setValue] = useState('')
  const input = useRef(null)
  const [message, supplementalMessage] = config.message.split('\n\n', 2)

  useEffect(() => {
    if (config.type === 'prompt') input.current?.focus()
    const handleKey = (event) => {
      if (event.key === 'Escape') onResolve(config.type === 'prompt' ? null : false)
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [config.type, onResolve])

  function submit(event) {
    event.preventDefault()
    onResolve(config.type === 'prompt' ? value.trim() || null : true)
  }

  return <div className="identity-dialog-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onResolve(config.type === 'prompt' ? null : false)}><form className={`identity-dialog${config.type === 'confirm' ? ' identity-dialog-confirm' : ''}`} role="alertdialog" aria-modal="true" aria-labelledby="identity-dialog-title" onSubmit={submit}>
    <h2 id="identity-dialog-title">{config.title}</h2>
    <p>{message}</p>
    {supplementalMessage && <p className="identity-dialog-notice">{supplementalMessage}</p>}
    {config.type === 'prompt' && <label className="identity-dialog-field">{config.label}<input ref={input} type="text" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength="6" value={value} onChange={(event) => setValue(event.target.value.replace(/\D/g, '').slice(0, 6))} required /></label>}
    <div className="identity-dialog-actions"><button type="button" className="button-outline" onClick={() => onResolve(config.type === 'prompt' ? null : false)}>Cancelar</button><button type="submit" className={config.danger ? 'identity-dialog-danger' : 'button-primary'}>{config.confirmLabel || 'Continuar'}</button></div>
  </form></div>
}

function App() {
  const [view, setView] = useState(resolveCurrentView)
  const [theme, setTheme] = useState('garden')

  useEffect(() => {
    const robotsMeta = document.querySelector('meta[name="robots"]')
    if (view !== 'public-wedding') {
      robotsMeta?.remove()
      return
    }
    const meta = robotsMeta || document.createElement('meta')
    meta.name = 'robots'
    meta.content = 'noindex, nofollow'
    if (!robotsMeta) document.head.append(meta)
    return () => meta.remove()
  }, [view])
  const [adminPage, setAdminPage] = useState('overview')
  const [toast, setToast] = useState('')
  const [dialog, setDialog] = useState(null)
  const dialogResolver = useRef(null)

  function notify(message) {
    setToast(message)
    window.setTimeout(() => setToast(''), 2400)
  }

  function askDialog(options) {
    return new Promise((resolve) => {
      dialogResolver.current = resolve
      setDialog(options)
    })
  }

  function finishDialog(value) {
    dialogResolver.current?.(value)
    dialogResolver.current = null
    setDialog(null)
  }

  function confirmAction(message, title = 'Confirmar ação', confirmLabel = 'Confirmar', danger = false) {
    return askDialog({ type: 'confirm', title, message, confirmLabel, danger })
  }

  function promptAction(options) {
    return askDialog({ ...options, type: 'prompt' })
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
      {view === 'dashboard' && <CouplePanel notify={notify} confirmAction={confirmAction} />}
      {view === 'public-customizer' && <PublicSiteCustomizer />}
      {view === 'help-center' && <HelpCenter />}
      {view === 'legal-draft' && <LegalDraft />}
      {view === 'couple-signup' && <CoupleSignup />}
      {view === 'email-confirmation' && <CoupleEmailConfirmation />}
      {view === 'password-reset-request' && <PasswordResetRequest />}
      {view === 'password-reset' && <PasswordReset />}
      {view === 'team-invitation' && <TeamInvitationAcceptance />}
      {view === 'dashboard-preview' && <Dashboard theme={theme} setTheme={setTheme} page={adminPage} setPage={setAdminPage} notify={notify} demo />}
      {view === 'customization-study' && <CustomizationStudy />}
      {view === 'guest-portal' && <GuestPortal notify={notify} setView={navigateView} />}
      {view === 'public-wedding' && <GeneralWeddingSite notify={notify} />}
      {view === 'attendance-request' && <AttendanceRequestPortal notify={notify} confirmAction={confirmAction} />}
      {view === 'godparent' && <GodparentPortal notify={notify} />}
      {view === 'event-staff' && <EventStaffPanel notify={notify} />}
      {view === 'superadmin' && <SuperAdminPanel notify={notify} promptAction={promptAction} />}
      {view === 'checkin' && <CheckIn notify={notify} />}
      {toast && <div className="toast" role="status"><Check size={16} /> {toast}</div>}
      {dialog && <IdentityDialog key={`${dialog.title}-${dialog.type}`} config={dialog} onResolve={finishDialog} />}
    </main>
  )
}

function CustomizationStudy() {
  const [option, setOption] = useState('atelier')
  const [device, setDevice] = useState('desktop')
  const isAtelier = option === 'atelier'
  const steps = ['Foto e vídeo', 'Identidade visual', 'Texto do convite', 'Detalhes do site']
  const preview = <div className={`study-preview-device study-device-${device}`}><div className="study-browser-bar"><i /><i /><i /><span>henrique-laryssa.convite</span></div><div className="study-cover"><img src="/images/wedding-moments.webp" alt="Noivos caminham juntos por um jardim" /><div><small>15 de outubro de 2028</small><h3>Henrique <i>&</i><br />Laryssa</h3><p>Com alegria, convidamos você.</p><button type="button">Ver convite <ArrowRight size={14} /></button></div></div><div className="study-preview-links"><span>Evento</span><i>·</i><span>Nossa história</span><i>·</i><span>Presença</span></div></div>
  const sectionCards = <><section className="study-paper-card study-photo-card"><div className="study-card-heading"><span className="study-number">01</span><div><small>PRIMEIRO PASSO</small><h3>A foto de vocês</h3></div><Camera size={19} /></div><p>A foto principal dá o tom do convite. Adicionem outras imagens ou um vídeo quando quiserem.</p><button type="button" className="study-upload"><Camera size={17} /> Escolher foto do casal</button><div className="study-mini-gallery"><img src="/images/wedding-moments.webp" alt="Prévia de uma foto do casal" /><img src="/images/wedding-pexels.webp" alt="Prévia de outra foto do casal" /><span>+ adicionar</span></div></section><section className="study-paper-card"><div className="study-card-heading"><span className="study-number">02</span><div><small>IDENTIDADE</small><h3>Escolham o clima</h3></div><Flower2 size={19} /></div><div className="study-theme-row"><button className="study-theme selected" type="button"><span className="study-theme-art study-theme-garden">H <i>&</i> L</span><strong>Jardim editorial</strong><Check size={16} /></button><button className="study-theme" type="button"><span className="study-theme-art study-theme-sunset">H <i>&</i> L</span><strong>Romance ao entardecer</strong></button></div><span className="study-field-label">Paleta do jardim</span><div className="study-swatches"><i /><i /><i /><i /><i /><span>Oliva e areia</span></div></section><section className="study-paper-card study-copy-card"><div className="study-card-heading"><span className="study-number">03</span><div><small>RECADO DE ABERTURA</small><h3>Uma frase de vocês</h3></div><Pencil size={18} /></div><p>Uma mensagem breve aparece na capa do convite. As informações do evento ficam organizadas no site.</p><div className="study-input-preview">Com alegria, convidamos você.</div><span className="study-inline-hint"><Check size={14} /> Prévia atualizada ao editar</span></section><section className="study-paper-card study-details-card"><div className="study-card-heading"><span className="study-number">04</span><div><small>O SITE DO CASAL</small><h3>Contem a história toda</h3></div><Heart size={18} /></div><p>Ativem só as partes que fazem sentido para vocês. Datas e locais vêm da aba Eventos.</p><div className="study-content-chips"><span>✓ Nossa história</span><span>✓ Fotos do casal</span><span>＋ Padrinhos</span><span>＋ Hospedagem</span></div></section></>
  return <div className="customization-study"><header className="study-header"><a className="study-brand" href="/"><span>e<span>&</span>t</span><strong>Estudo do editor</strong></a><span>PRÉVIAS DE DIREÇÃO VISUAL</span><a href="/painel/demo">Voltar ao painel <ArrowRight size={15} /></a></header><main className="study-main"><div className="study-intro"><span className="study-kicker"><Flower2 size={15} /> JARDIM EDITORIAL · PERSONALIZAÇÃO</span><h1>Um editor com cara de celebração.</h1><p>Comparamos duas formas de organizar as escolhas do casal. As cores, os detalhes botânicos e a foto seguem a identidade aprovada.</p></div><div className="study-option-tabs" role="tablist" aria-label="Opções de organização do editor"><button type="button" role="tab" aria-selected={isAtelier} className={isAtelier ? 'selected' : ''} onClick={() => setOption('atelier')}><span>01</span><strong>Ateliê do convite</strong><small>Etapas claras e prévia sempre ao lado</small></button><button type="button" role="tab" aria-selected={!isAtelier} className={!isAtelier ? 'selected' : ''} onClick={() => setOption('caderno')}><span>02</span><strong>Caderno do casal</strong><small>Blocos organizados como uma coleção</small></button></div>{isAtelier ? <section className="study-editor study-editor-atelier" aria-label="Prévia Ateliê do convite"><aside className="study-steps"><span className="study-kicker">MONTEM A CELEBRAÇÃO</span><h2>Seu convite,<br />do seu jeito.</h2><nav>{steps.map((step, index) => <div className={index === 0 ? 'current' : ''} key={step}><span>{index + 1}</span>{step}{index === 0 && <i>Em edição</i>}</div>)}</nav><div className="study-steps-note"><Flower2 size={18} /><span>As mudanças aparecem na prévia antes de publicar.</span></div></aside><div className="study-controls"><div className="study-controls-heading"><div><span className="study-kicker">ETAPA 1 DE 4</span><h2>Comecem pela foto</h2></div><span>Salvo neste rascunho</span></div><div className="study-control-grid">{sectionCards}</div><div className="study-next-row"><span><Check size={15} /> A foto pode ser adicionada depois</span><button type="button">Continuar <ArrowRight size={15} /></button></div></div><aside className="study-live-preview"><div className="study-live-heading"><span><i /> PRÉVIA AO VIVO</span><div>{[['desktop', Monitor], ['tablet', Tablet], ['mobile', Smartphone]].map(([size, Icon]) => <button key={size} className={device === size ? 'selected' : ''} type="button" aria-label={`Prévia ${size}`} onClick={() => setDevice(size)}><Icon size={16} /></button>)}</div></div>{preview}<p>A prévia acompanha o tema, as fotos e os textos escolhidos.</p></aside></section> : <section className="study-editor study-editor-notebook" aria-label="Prévia Caderno do casal"><div className="study-notebook-top"><div><span className="study-kicker"><Flower2 size={14} /> O PROJETO DE HENRIQUE & LARYSSA</span><h2>Uma história que começa<br />pelo convite.</h2><p>Organizem as ideias no ritmo de vocês. Cada bloco abre só quando quiserem editar.</p></div><div className="study-notebook-cover">{preview}</div></div><div className="study-notebook-progress"><span>O convite está tomando forma</span><div><i /></div><small>1 de 4 partes</small></div><div className="study-notebook-grid">{sectionCards}</div><div className="study-next-row"><span><Check size={15} /> Rascunho salvo automaticamente</span><button type="button">Abrir prévia completa <ArrowRight size={15} /></button></div></section>}<p className="study-footer"><a href="https://henriquesouzas.com" target="_blank" rel="noreferrer">henriquesouzas.com</a> · Estudo de organização do editor</p></main></div>
}

function resolveCurrentView() {
  const path = window.location.pathname
  if (path === '/estudo-personalizacao') return 'customization-study'
  if (path === '/superadmin' || path.startsWith('/superadmin/')) return 'superadmin'
  if (path === '/cadastro') return 'couple-signup'
  if (path === '/criar-site') return 'public-customizer'
  if (path === '/ajuda') return 'help-center'
  if (path === '/documentos-legais/rascunho') return 'legal-draft'
  if (path === '/painel/demo') return 'dashboard-preview'
  if (path === '/confirmar-email' || window.location.hash.startsWith('#confirmar-email/')) return 'email-confirmation'
  if (path === '/confirmar-presenca') return 'attendance-request'
  if (path.startsWith('/casamento/')) return 'public-wedding'
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

function LegalDraft() {
  return <RoleFrame icon={Shield} eyebrow="DOCUMENTOS DA PLATAFORMA" title="Privacidade e termos" description="Minuta de trabalho alinhada aos recursos atuais. Este texto ainda precisa dos dados jurídicos do responsável e da definição dos prazos de retenção antes de ser publicado como documento vigente." publicPage secureName="Documentos legais" secureFooter="Minuta para revisão" headerAction={<a className="button-outline" href="/">Voltar ao início</a>}>
    <section className="role-card help-center-start"><span className="eyebrow">MINUTA · NÃO PUBLICAR COMO VERSÃO FINAL</span><p>Responsável pela plataforma: [NOME EMPRESARIAL OU NOME DO CONTROLADOR], [CNPJ/CPF], com endereço em [ENDEREÇO], contato de privacidade: [E-MAIL]. Esses dados precisam ser confirmados antes da publicação.</p></section>
    <section className="role-card help-center-topics"><h2>Política de privacidade</h2>
      <details open><summary>1. Dados e finalidades</summary><p>A plataforma trata dados de cadastro e autenticação para criar e proteger contas; dados do casamento, conteúdo, fotos e preferências para montar o site; e dados de convidados, contatos, grupos, eventos e respostas para entregar convites, RSVP e controle de entrada. Registros técnicos e de auditoria apoiam segurança, prevenção de abuso e funcionamento do serviço.</p></details>
      <details open><summary>2. Papéis e compartilhamento</summary><p>Os noivos controlam os dados que cadastram sobre o casamento e os convidados. A plataforma trata esses dados para prestar os recursos solicitados. A plataforma também usa dados mínimos de conta, segurança e suporte para administrar o serviço. A infraestrutura pode envolver Cloudflare e, quando configurado, um provedor de envio de e-mail. A lista final de operadores, localidades e contratos deve ser confirmada pelo responsável.</p></details>
      <details open><summary>3. Presentes e informações públicas</summary><p>Chaves Pix e links de lojas só são exibidos quando os noivos os habilitam. O Pix é pago diretamente aos noivos no aplicativo bancário do convidado; a plataforma não recebe nem confirma o pagamento. Links de loja abrem serviços externos, sujeitos às políticas deles. Endereços residenciais e dados privados de entrega não devem ser publicados.</p></details>
      <details open><summary>4. Acesso, segurança e retenção</summary><p>O acesso é limitado por conta, papel e casamento. A plataforma aplica controles técnicos como sessão protegida, limitação de tentativas, verificação antiabuso e permissões no servidor. Fotos e conteúdo só ficam acessíveis conforme as configurações do serviço. Prazo de retenção após o evento, janela de aviso, cópias de segurança e prazo de exclusão: [DEFINIR E VALIDAR COM O RESPONSÁVEL].</p></details>
      <details open><summary>5. Direitos e solicitações</summary><p>A pessoa titular pode solicitar confirmação e acesso, correção, informação sobre compartilhamento, oposição ou revisão quando aplicável e eliminação nos limites legais. Para solicitar atendimento, use [E-MAIL DO ENCARREGADO/CONTATO]. A plataforma pode pedir informações proporcionais para confirmar a identidade e encaminhar pedidos sobre dados de convidados aos noivos responsáveis.</p></details>
      <details open><summary>6. Cookies, menores e mudanças</summary><p>Cookies estritamente necessários podem manter a sessão e a segurança. [CONFIRMAR ANALÍTICA, COOKIES OPCIONAIS E FERRAMENTAS DE TERCEIROS.] O serviço é voltado à organização de casamentos por adultos; eventual tratamento de dados de crianças ou adolescentes precisa de fluxo e salvaguardas próprios. Mudanças materiais serão comunicadas nesta página com a data de atualização.</p></details>
    </section>
    <section className="role-card help-center-topics"><h2>Termos de uso</h2>
      <details open><summary>1. Uso da plataforma</summary><p>A plataforma oferece ferramentas para criar páginas de casamento, organizar convidados, convites, RSVP, tarefas e controle de entrada. O acesso do piloto é gratuito enquanto assim indicado no produto. O usuário deve manter os dados da conta corretos, proteger a senha e ter autorização para enviar conteúdo e dados de convidados.</p></details>
      <details open><summary>2. Conteúdo e permissões</summary><p>O casal responde pelas informações, fotos, textos, convites, permissões de acesso, lista de convidados e dados que publica. Só deve enviar imagens e dados que tenha autorização para usar. Conteúdo público deve respeitar direitos de terceiros, privacidade e a lei.</p></details>
      <details open><summary>3. Pix e lojas externas</summary><p>Pix é uma transferência entre convidado e casal, fora da plataforma. A plataforma não atua como instituição de pagamento, não recebe, guarda, divide ou repassa valores e não confirma transferências. Links de lojas apenas encaminham para outro site; compra, preço, disponibilidade, entrega e atendimento são responsabilidade da loja, do comprador e do casal.</p></details>
      <details open><summary>4. Disponibilidade e encerramento</summary><p>O serviço pode receber manutenção e apresentar indisponibilidade. O encerramento de um site ou subdomínio não significa exclusão imediata dos dados: aviso, exportação, retenção, anonimização e exclusão precisam seguir a política de privacidade definitiva. Procedimento e prazos: [DEFINIR].</p></details>
      <details open><summary>5. Contato, alterações e foro</summary><p>Suporte: [E-MAIL E CANAL DE ATENDIMENTO]. Identificação jurídica do fornecedor, data de vigência, regras completas de cancelamento, responsabilidade, foro e solução de conflitos: [PREENCHER E VALIDAR]. A versão final deve indicar quando os termos mudaram e como o usuário será informado.</p></details>
    </section>
    <p className="study-footer">Base legal a revisar: Lei nº 13.709/2018 (LGPD), direitos dos titulares e orientação da ANPD sobre controlador e operador. Documento em preparação; não substitui revisão jurídica.</p>
  </RoleFrame>
}

function HelpCenter() {
  return <RoleFrame icon={CircleHelp} eyebrow="AJUDA PARA ORGANIZAR COM CALMA" title="Um passo de cada vez." description="Encontre o próximo passo do convite e saiba quem pode ajudar. As respostas são curtas; os detalhes ficam onde você precisa deles." className="help-center-page" publicPage secureName="Central de ajuda" secureFooter="Ajuda da plataforma" headerAction={<a className="button-outline" href="/">Voltar ao início</a>}>
    <section className="role-card help-center-start"><span className="eyebrow">POR ONDE COMEÇAR</span><h2>Comecem criando o acesso do casal.</h2><p>Depois de confirmar o e-mail, preencham os nomes e as fotos na personalização. Cadastrem datas, horários e locais na área Eventos; traje e outras orientações ficam nos detalhes do site.</p><div className="help-center-actions"><a className="button-primary" href="/cadastro">Criar acesso <ArrowRight size={15} /></a><a className="button-outline" href="/painel">Entrar no painel</a></div></section>
    <section className="help-center-topics" aria-label="Ajuda por assunto">
      <details className="role-card"><summary>Como escolher e ajustar um tema</summary><p>O tema define as cores de fundo, os detalhes, os títulos e a composição inicial da capa. Escolham uma opção pela prévia; depois, se quiserem, ajustem a paleta, a fonte e o formato da foto.</p></details>
      <details className="role-card"><summary>O que informar aos convidados</summary><p>Comecem pelo essencial: data, local, horário e confirmação de presença. Cadastrem data, local e horário em Eventos. Traje, paleta, cardápio e dicas para quem vem de longe podem ser organizados nos detalhes do site.</p></details>
      <details className="role-card"><summary>Como pedir ajuda ao cerimonialista</summary><p>No painel, abram “Equipe e acessos”, informem o e-mail do cerimonialista e escolham “Editor do site e eventos”. Copiem o convite gerado e enviem diretamente. Esse perfil pode editar o site e os eventos; não recebe a lista de convidados nem as áreas financeiras.</p><a className="text-arrow" href="/painel#equipe">Ver equipe e acessos <ArrowRight size={14} /></a></details>
      <details className="role-card"><summary>Como compartilhar o convite</summary><p>Na área de convidados, criem os convites individuais e compartilhem o link ou o QR code correspondente. Cada pessoa acessa apenas os eventos liberados para o seu convite.</p></details>
      <details className="role-card"><summary>Precisa falar com a equipe?</summary><p>Escreva por e-mail ou WhatsApp. Conte em qual etapa está e, se puder, inclua uma captura de tela.</p><div className="help-center-actions"><a className="button-outline" href="mailto:henriquesouza1832001@gmail.com"><Mail size={15} /> Enviar e-mail</a><a className="button-outline" href="https://wa.me/5531988924409" target="_blank" rel="noreferrer"><MessageCircle size={15} /> Abrir WhatsApp</a></div></details>
    </section>
  </RoleFrame>
}

function ThemePicker({ theme, setTheme, compact = false, limit = THEMES.length, partnerOneName = 'Seus nomes', partnerTwoName = 'seu par' }) {
  const [showAll, setShowAll] = useState(false)
  const visibleThemes = showAll ? THEMES : THEMES.slice(0, limit)
  return (
    <div className={`theme-picker ${compact ? 'theme-picker-compact' : ''}`} aria-label="Escolha uma opção visual">
      {!compact && <div className="theme-picker-intro"><span className="eyebrow">OITO TEMAS DE PARTIDA</span><span className="theme-picker-caption">A estrutura é a mesma; cores, tipografia e detalhes mudam.</span></div>}
      <div className="theme-options">
        {visibleThemes.map((item, index) => (
          <button className={`theme-option ${theme === item.id ? 'active' : ''}`} key={item.id} onClick={() => setTheme(item.id)} aria-pressed={theme === item.id}>
            <span className={`theme-option-preview preview-${item.id}`} style={{ '--theme-ink': item.colors[0], '--theme-accent': item.colors[1], '--theme-paper': item.colors[2], '--theme-font-heading': SITE_FONT_PAIRS[THEME_PRESETS[item.id]?.fontPair]?.[0] || SITE_FONT_PAIRS['Clássico editorial'][0] }}><b>{coupleMonogram(partnerOneName, partnerTwoName)}</b><em /></span>
            <span className="theme-option-copy"><strong>{item.name}</strong>{!compact && <small>{item.note}</small>}</span>
            {theme === item.id && <Check size={15} className="theme-option-check" />}
            {index === 0 && compact && <span className="theme-popular">Base</span>}
          </button>
        ))}
      </div>
      {THEMES.length > limit && <button type="button" className="theme-picker-more" onClick={() => setShowAll((current) => !current)}>{showAll ? 'Mostrar menos estilos' : 'Ver todos os estilos'}</button>}
    </div>
  )
}

function coupleMonogram(partnerOneName, partnerTwoName) {
  const initial = (name, fallback) => {
    const value = String(name || '').trim()
    if (!value || ['seus nomes', 'seu par', 'nome'].includes(value.toLocaleLowerCase('pt-BR'))) return fallback
    return Array.from(value)[0].toLocaleUpperCase('pt-BR')
  }
  return `${initial(partnerOneName, 'A')} & ${initial(partnerTwoName, 'R')}`
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
        <a className="nav-rsvp nav-signup" href="/cadastro">Criar acesso <ArrowRight size={15} /></a>
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

      {gift && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setGift(null)}><div className="gift-modal" role="dialog" aria-modal="true" aria-labelledby="gift-modal-title"><button className="modal-close" onClick={() => setGift(null)} aria-label="Fechar"><X size={19} /></button><span className="modal-flower">{gift.icon}</span><span className="eyebrow">PRESENTE DE DEMONSTRAÇÃO</span><h3 id="gift-modal-title">{gift.title}</h3><p>No site do casal, os presentes podem usar Pix direto aos noivos ou um link para uma loja externa.</p><div className="payment-choice"><span><Wallet size={17} /> Pix direto</span><span className="future-tag">Pelo aplicativo do banco</span></div><div className="payment-choice"><span><ArrowRight size={17} /> Loja externa</span><span className="future-tag">Compra fora do site</span></div><button className="button-primary" onClick={() => { setGift(null); notify('Esta prévia não inicia transferências nem compras') }}>Entendi <Check size={16} /></button><small>A plataforma não recebe pagamentos nem conclui compras.</small></div></div>}
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
  return <section className="guest-camera-settings" id={id}><div><span className="eyebrow">LEMBRANÇAS DOS CONVIDADOS</span><h3>Uma câmera para o álbum</h3><p>As fotos são espontâneas: ao tirar, cada imagem é enviada direto para o álbum compartilhado. O limite é total para o casamento, sem cota por convidado.</p></div><label className="guest-camera-toggle"><input type="checkbox" checked={camera.enabled} onChange={(event) => onChange({ ...camera, enabled: event.target.checked })} /><span>Ativar a câmera do casamento</span></label>{camera.enabled && <label className="font-pair-label">Limite total do álbum<input type="number" min="1" max="300" step="1" value={camera.photoLimit} onChange={(event) => { const photoLimit = Number(event.target.value); if (Number.isInteger(photoLimit) && photoLimit >= 1 && photoLimit <= 300) onChange({ ...camera, photoLimit }) }} /><small>Escolham o total que desejam, até 300 fotos. Todos os convidados compartilham esse limite.</small></label>}<small>Antes da primeira foto, cada convidado autoriza o envio automático. As fotos ficam privadas para o casal.</small></section>
}

function PublicSiteCustomizer() {
  const savedDraft = readPublicSiteDraft()
  const [draft, setDraft] = useState(() => ({
    partnerOneName: '',
    partnerTwoName: '',
    eventDate: '',
    ...savedDraft,
    siteConfig: { ...DEFAULT_SITE_CONFIG, ...savedDraft.siteConfig, customAccent: isValidCustomAccent(savedDraft.siteConfig?.customAccent) ? savedDraft.siteConfig.customAccent : null, coverLayout: ['full', 'split', 'arch'].includes(savedDraft.siteConfig?.coverLayout) ? savedDraft.siteConfig.coverLayout : (THEME_PRESETS[savedDraft.siteConfig?.theme] || THEME_PRESETS.garden).coverLayout, coverMessages: { ...DEFAULT_SITE_CONFIG.coverMessages, ...savedDraft.siteConfig?.coverMessages }, storyMessages: { ...DEFAULT_SITE_CONFIG.storyMessages, ...savedDraft.siteConfig?.storyMessages }, weddingDetails: { schedule: savedDraft.siteConfig?.weddingDetails?.schedule || '', menu: savedDraft.siteConfig?.weddingDetails?.menu || '', dressCode: savedDraft.siteConfig?.weddingDetails?.dressCode || '' } },
  }))
  const [saved, setSaved] = useState(true)
  const [device, setDevice] = useState('desktop')
  const [wizardStep, setWizardStep] = useState('invite')
  const [showAllThemes, setShowAllThemes] = useState(false)
  const theme = THEMES.find((item) => item.id === draft.siteConfig.theme) || THEMES[0]
  const palettes = getThemePalettes(theme, draft.siteConfig.customAccent)
  const selectedPalette = palettes[draft.siteConfig.paletteIndex] || palettes[0]
  const fontPair = SITE_FONT_PAIRS[draft.siteConfig.fontPair] || SITE_FONT_PAIRS['Clássico editorial']
  const coverMessage = draft.siteConfig.coverMessages?.['pt-BR'] || ''
  const storyMessage = draft.siteConfig.storyMessages?.['pt-BR'] || ''
  const dateLabel = draft.eventDate ? new Date(`${draft.eventDate}T12:00:00`).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Data a definir'
  const layoutOptions = [{ id: 'full', label: 'Foto em destaque' }, { id: 'split', label: 'Foto ao lado' }, { id: 'arch', label: 'Moldura em arco' }]
  const initialThemes = THEMES.slice(0, 4)
  const visibleThemes = showAllThemes ? THEMES : initialThemes.some((item) => item.id === theme.id) ? initialThemes : [...initialThemes, theme]
  const activeStory = storyMessage.trim()
  const style = {
    '--customizer-ink': selectedPalette[0],
    '--customizer-accent': selectedPalette[1],
    '--customizer-paper': selectedPalette[2],
    '--customizer-font-heading': fontPair[0],
    '--customizer-font-body': fontPair[1],
    '--customizer-text-scale': draft.siteConfig.fontScale === 'small' ? '.92' : draft.siteConfig.fontScale === 'large' ? '1.1' : '1',
  }

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

  function updateStory(value) {
    setDraft((current) => ({ ...current, siteConfig: { ...current.siteConfig, storyMessages: { ...DEFAULT_SITE_CONFIG.storyMessages, ...current.siteConfig.storyMessages, 'pt-BR': value }, enabledSections: value.trim() ? [...new Set([...(current.siteConfig.enabledSections || []), 'Nossa história'])] : current.siteConfig.enabledSections } }))
  }

  function selectTheme(themeId) {
    const preset = THEME_PRESETS[themeId] || THEME_PRESETS.garden
    setDraft((current) => ({ ...current, siteConfig: { ...current.siteConfig, theme: themeId, paletteIndex: 0, fontPair: preset.fontPair, coverLayout: preset.coverLayout, coverComposition: preset.coverComposition } }))
  }

  function goToWizardStep(step) {
    setWizardStep(step)
  }

  return <div className={`public-customizer customizer-theme-${theme.id}`} style={style}>
    <header className="customizer-header"><a className="customizer-brand" href="/" aria-label="e&t sites de casamento">e<span>&amp;</span>t <small>sites de casamento</small></a><div><a href="/ajuda">Central de ajuda</a><span role="status">{saved ? 'Rascunho salvo neste aparelho' : 'Salvando…'}</span><a href="/painel">Entrar</a></div></header>
    <main className="customizer-main">
      <section className="customizer-intro"><span className="marketing-kicker">Convite do casamento</span><h1>Comecem pela foto.</h1><p>Escolham como ela vai aparecer no convite. Nomes, data e o restante podem vir depois.</p></section>
      <nav className="customizer-stage-nav customizer-stage-nav-two" aria-label="Etapas da criação do convite"><button className={wizardStep === 'invite' ? 'active' : 'complete'} type="button" aria-current={wizardStep === 'invite' ? 'step' : undefined} onClick={() => goToWizardStep('invite')}>Foto e convite</button><button className={wizardStep === 'start' ? 'active' : ''} type="button" aria-current={wizardStep === 'start' ? 'step' : undefined} onClick={() => goToWizardStep('start')}>Nomes e identidade</button></nav>
      <div className="customizer-workspace">
        <section className="customizer-controls" aria-label="Personalização do convite">
          {wizardStep === 'start' ? <section className="customizer-wizard-panel customizer-start-panel" aria-labelledby="customizer-wizard-title"><h2 className="customizer-wizard-title" id="customizer-wizard-title">Vamos começar</h2>
            <div className="customizer-step" id="customizer-couple"><span>Quem vai celebrar?</span><div className="customizer-name-fields"><label>Primeiro nome<input autoComplete="given-name" maxLength="100" value={draft.partnerOneName} onChange={(event) => updateDraft('partnerOneName', event.target.value)} placeholder="Nome" /></label><label>Segundo nome<input autoComplete="additional-name" maxLength="100" value={draft.partnerTwoName} onChange={(event) => updateDraft('partnerTwoName', event.target.value)} placeholder="Nome" /></label></div><label>Data do casamento<input type="date" value={draft.eventDate} onChange={(event) => updateDraft('eventDate', event.target.value)} /></label></div>
            <div className="customizer-step" id="customizer-style"><span>Escolham a identidade</span><p className="customizer-control-help">O tema e a paleta mudam as cores e as letras do convite.</p><div className="customizer-theme-grid" role="group" aria-label="Temas do convite">{visibleThemes.map((item) => <button type="button" className={'customizer-theme-option' + (theme.id === item.id ? ' active' : '')} key={item.id} onClick={() => selectTheme(item.id)} aria-pressed={theme.id === item.id}><span className={`customizer-theme-mini mini-${item.id}`} style={{ '--theme-ink': item.colors[0], '--theme-accent': item.colors[1], '--theme-paper': item.colors[2], '--theme-font-heading': SITE_FONT_PAIRS[THEME_PRESETS[item.id]?.fontPair]?.[0] || SITE_FONT_PAIRS['Clássico editorial'][0] }}><b>{coupleMonogram(draft.partnerOneName, draft.partnerTwoName)}</b><em /></span><strong>{item.name}</strong></button>)}</div>{!showAllThemes && <button className="customizer-more-themes" type="button" onClick={() => setShowAllThemes(true)}>Ver outros estilos</button>}</div>
            <div className="customizer-choice-group customizer-public-palettes"><strong>Paleta de cores</strong><div className="customizer-palette-options">{palettes.map((colors, index) => <button type="button" className={draft.siteConfig.paletteIndex === index ? 'active' : ''} key={PALETTE_NAMES[index]} onClick={() => updateConfig('paletteIndex', index)} aria-label={`Paleta ${PALETTE_NAMES[index]}`} aria-pressed={draft.siteConfig.paletteIndex === index}><span>{colors.map((color) => <i key={color} style={{ backgroundColor: color }} />)}</span><small>{PALETTE_NAMES[index]}</small></button>)}</div><SiteAccentPicker value={draft.siteConfig.customAccent} appliedValue={selectedPalette[1]} onChange={(value) => updateConfig('customAccent', value)} /></div>
            <FontScalePicker value={draft.siteConfig.fontScale} onChange={(value) => updateConfig('fontScale', value)} />
            <div className="customizer-wizard-actions"><button type="button" className="customizer-back" onClick={() => goToWizardStep('invite')}><ArrowLeft size={16} /> Voltar à foto</button><a className="customizer-next customizer-continue" href="/cadastro" onClick={() => window.localStorage.setItem(PUBLIC_SITE_DRAFT_KEY, JSON.stringify(draft))}>Guardar e criar acesso <ArrowRight size={16} /></a></div>
          </section> : <section className="customizer-wizard-panel customizer-invite-panel" aria-labelledby="customizer-wizard-title"><h2 className="customizer-wizard-title" id="customizer-wizard-title">Deixem com a cara de vocês</h2>
            <div className="customizer-step" id="customizer-cover"><span>Foto do casal</span><div className="customizer-photo-placeholder"><Camera size={23} /><strong>A foto principal será de vocês.</strong><p>Depois de criar o acesso, enviem a foto escolhida no painel. Não usamos fotos de modelo no convite.</p></div><div className="customizer-layout-options" role="group" aria-label="Composição da foto"><span>Como a foto aparece</span><div>{layoutOptions.map((layout) => <button type="button" className={draft.siteConfig.coverLayout === layout.id ? 'active' : ''} key={layout.id} onClick={() => updateConfig('coverLayout', layout.id)} aria-pressed={draft.siteConfig.coverLayout === layout.id}>{layout.label}</button>)}</div></div></div>
            <div className="customizer-step"><span>Um recado breve</span><label>Mensagem para os convidados<textarea maxLength="140" rows="2" value={coverMessage} onChange={(event) => updateConfig('coverMessages', { ...DEFAULT_SITE_CONFIG.coverMessages, ...draft.siteConfig.coverMessages, 'pt-BR': event.target.value })} placeholder="Ex.: Vai ser uma alegria celebrar com vocês." /><small>{coverMessage.length}/140 caracteres</small></label></div>
            <details className="customizer-extra-fields"><summary>Adicionar uma lembrança ou orientações</summary><div><label className="font-pair-label">Uma história curta, se quiserem<textarea rows="3" maxLength="360" value={storyMessage} onChange={(event) => updateStory(event.target.value)} placeholder="Uma ou duas frases sobre vocês." /><small>{storyMessage.length}/360 caracteres</small></label><label className="font-pair-label">Cardápio<textarea rows="2" maxLength="280" value={draft.siteConfig.weddingDetails.menu} onChange={(event) => updateConfig('weddingDetails', { ...draft.siteConfig.weddingDetails, menu: event.target.value })} placeholder="Opcional" /></label><label className="font-pair-label">Traje sugerido<input maxLength="100" value={draft.siteConfig.weddingDetails.dressCode} onChange={(event) => updateConfig('weddingDetails', { ...draft.siteConfig.weddingDetails, dressCode: event.target.value })} placeholder="Ex.: esporte fino" /></label></div></details>
            <div className="customizer-wizard-actions"><button type="button" className="customizer-next" onClick={() => goToWizardStep('start')}>Continuar sem foto por agora <ArrowRight size={16} /></button></div>
            <p className="customizer-note">A foto será escolhida no painel depois que vocês criarem acesso. O convite não usa fotos de modelo.</p>
          </section>}
        </section>
        <section className="customizer-preview" aria-label="Prévia do site dos noivos">
          <div className="customizer-preview-heading"><span>Prévia do convite</span><div role="group" aria-label="Tamanho da prévia">{[['desktop', Monitor, 'Computador'], ['tablet', Tablet, 'Tablet'], ['mobile', Smartphone, 'Celular']].map(([size, Icon, label]) => <button key={size} className={device === size ? 'selected' : ''} type="button" aria-label={label} aria-pressed={device === size} onClick={() => setDevice(size)}><Icon size={17} /></button>)}</div></div>
          <div className={`customizer-browser customizer-${device} customizer-cover-${draft.siteConfig.coverLayout}`} style={style}>
            <div className="customizer-browser-bar"><i /><i /><i /><span>convite do casal</span></div>
            <div className="customizer-live-cover customizer-live-cover-empty"><div><span>{dateLabel}</span><h2>{draft.partnerOneName || 'Nome'} <i>&amp;</i><br />{draft.partnerTwoName || 'Nome'}</h2><p>{coverMessage || 'Uma mensagem curta para receber quem vocês amam.'}</p><a href="#customizer-preview-summary">Ver detalhes do convite <ArrowDown size={14} /></a></div></div>
            <div className="customizer-invite-summary" id="customizer-preview-summary"><span>Detalhes do dia</span><strong>{dateLabel}</strong><p>Local, horário e confirmação de presença podem ser organizados depois.</p></div>
            {activeStory && <div className="customizer-invite-story"><span>Um pouco sobre vocês</span><p>{storyMessage}</p></div>}
            {(draft.siteConfig.weddingDetails.menu || draft.siteConfig.weddingDetails.dressCode) && <div className="customizer-invite-details"><span>Orientações para os convidados</span>{draft.siteConfig.weddingDetails.menu && <p><strong>Cardápio</strong>{draft.siteConfig.weddingDetails.menu}</p>}{draft.siteConfig.weddingDetails.dressCode && <p><strong>Traje</strong>{draft.siteConfig.weddingDetails.dressCode}</p>}</div>}
            <div className="customizer-live-footer"><span>{draft.partnerOneName || 'Nome'} &amp; {draft.partnerTwoName || 'Nome'}</span><span>henriquesouzas.com</span></div>
          </div>
          <p className="customizer-preview-caption">A prévia acompanha as escolhas. Sem foto, ela mostra as cores e a composição do tema sem imagem de modelo.</p>
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
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [eventDate, setEventDate] = useState(publicDraft.eventDate || '')
  const [eventTime, setEventTime] = useState('')
  const [turnstileToken, setTurnstileToken] = useState('')
  const [turnstileReset, setTurnstileReset] = useState(0)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [submitted, setSubmitted] = useState(false)

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
        body: JSON.stringify({ email, password, eventDate: eventDate || null, eventTime: eventTime || null, partnerOneName: publicDraft.partnerOneName || '', partnerTwoName: publicDraft.partnerTwoName || '', siteConfig: publicDraft.siteConfig || null, turnstileToken }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'signup_failed')
      if (publicDraft.siteConfig) window.localStorage.removeItem(PUBLIC_SITE_DRAFT_KEY)
      setSubmitted(true)
      setPassword('')
      setConfirmation('')
    } catch (cause) {
      setError(cause.message === 'email_service_unconfigured' ? 'O envio de e-mails ainda está sendo configurado. Tente novamente em breve.'
        : cause.message === 'turnstile_unavailable' ? 'A verificação de segurança ainda não foi configurada neste site.'
          : cause.message === 'turnstile_verification_failed' ? 'Conclua novamente a verificação de segurança.'
            : cause.message === 'email_unavailable' ? 'Este e-mail já está cadastrado. Confira os dados e tente entrar.'
              : cause.message === 'too_many_attempts' ? 'Muitas tentativas neste aparelho. Aguarde e tente novamente.'
                : cause.message === 'verification_email_failed' ? 'Não foi possível enviar o e-mail de confirmação. Confira os dados e tente novamente.'
                  : 'Não foi possível criar o acesso. Confira os campos e tente novamente.')
    } finally {
      setTurnstileToken('')
      setTurnstileReset((current) => current + 1)
      setBusy(false)
    }
  }

  return <RoleFrame icon={Heart} eyebrow="ESPAÇO DOS NOIVOS" title={submitted ? 'Confira seu e-mail.' : 'Crie o acesso do casal.'} description={submitted ? 'Enviamos um link de confirmação para ' + email + '. Ele vale por 24 horas.' : publicDraft.siteConfig ? 'Criem o acesso para guardar no casamento o tema, a paleta e os textos que escolheram. A foto poderá ser enviada depois, no painel.' : 'Cadastrem o e-mail e a senha para abrir o painel e criar o convite com as próprias fotos.'} secure secureName="Cadastro dos noivos" secureFooter="Acesso individual" className="signup-page">
    {submitted ? <section className="role-card admin-login-form"><p>Depois de confirmar o e-mail, vocês poderão abrir o painel. O rascunho iniciado em “Criar site” já estará salvo no casamento; a foto pode ser enviada por lá.</p><a className="button-primary signup-submit" href="/painel">Ir para o painel <ArrowRight size={15} /></a><p><a href="/cadastro">Usar outro e-mail</a></p></section> : <form className="role-card admin-login-form signup-form" onSubmit={signup}>
      <label>E-mail<input type="email" autoComplete="email" maxLength="254" value={email} onChange={(event) => setEmail(event.target.value)} required /></label>
      <div className="wedding-profile-date-grid"><label>Data do casamento, opcional<input type="date" value={eventDate} onChange={(event) => setEventDate(event.target.value)} /></label><label>Horário, opcional<input type="time" value={eventTime} onChange={(event) => setEventTime(event.target.value)} /></label></div>
      <label>Crie uma senha<PasswordInput autoComplete="new-password" minLength="12" maxLength="1024" value={password} onChange={(event) => setPassword(event.target.value)} required /></label>
      <label>Confirme a senha<PasswordInput autoComplete="new-password" minLength="12" maxLength="1024" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} required /></label>
      <TurnstileChallenge onToken={setTurnstileToken} resetKey={turnstileReset} />
      {!TURNSTILE_SITE_KEY && <p className="admin-form-error signup-security-unavailable" role="status">O cadastro está temporariamente indisponível porque a verificação de segurança ainda não foi configurada.</p>}
      {error && <p className="admin-form-error" role="alert">{error}</p>}
      <button className="button-primary signup-submit" type="submit" disabled={busy || !TURNSTILE_SITE_KEY || !turnstileToken}>{busy ? 'Criando acesso…' : 'Criar acesso'} <ArrowRight size={15} /></button>
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
      if (!response.ok) throw new Error('invalid')
      setStatus('verified')
    }).catch(() => setStatus('invalid'))
  }, [token])

  const verified = status === 'verified'
  return <RoleFrame icon={verified ? Check : Shield} eyebrow="CONFIRMAÇÃO DE E-MAIL" title={status === 'confirming' ? 'Validando seu cadastro.' : verified ? 'Cadastro confirmado.' : 'Este link não está mais válido.'} description={status === 'confirming' ? 'Só um instante enquanto ativamos o acesso do casal.' : verified ? 'Seu espaço está pronto. Entre com seu e-mail e sua senha para abrir o painel.' : 'O link pode ter expirado ou já ter sido utilizado. Volte ao cadastro para começar novamente.'} secure secureName="Cadastro dos noivos" secureFooter="Acesso individual">
    <section className="role-card admin-login-form">{status === 'confirming' && <p>Confirmando endereço de e-mail…</p>}{verified && <a className="button-primary signup-submit" href="/painel">Abrir painel dos noivos <ArrowRight size={15} /></a>}{status === 'invalid' && <a className="button-primary signup-submit" href="/cadastro">Voltar ao cadastro <ArrowRight size={15} /></a>}</section>
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

  return <RoleFrame icon={LockKeyhole} eyebrow="SEGURANÇA DA CONTA" title={complete ? 'Senha atualizada.' : invalid ? 'Solicite um novo link.' : 'Escolha uma nova senha.'} description={complete ? 'As sessões anteriores foram encerradas. Entre novamente e use seu e-mail e sua senha.' : invalid ? 'O link informado expirou, já foi utilizado ou está incompleto.' : 'O link é de uso único e válido por 30 minutos.'} secure secureName="Recuperação de conta" secureFooter="Acesso individual">
    {complete ? <section className="role-card admin-login-form"><a className="button-primary signup-submit" href="/painel">Entrar no painel dos noivos <ArrowRight size={15} /></a></section> : invalid ? <section className="role-card admin-login-form"><a className="button-primary signup-submit" href="/recuperar-senha">Solicitar outro link <ArrowRight size={15} /></a></section> : <form className="role-card admin-login-form" onSubmit={resetPassword}><label>Nova senha<PasswordInput autoComplete="new-password" minLength="12" maxLength="1024" value={password} onChange={(event) => setPassword(event.target.value)} required /></label><label>Confirme a senha<PasswordInput autoComplete="new-password" minLength="12" maxLength="1024" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} required /></label>{error && <p className="admin-form-error" role="alert">{error}</p>}<button className="button-primary signup-submit" type="submit" disabled={busy}>{busy ? 'Atualizando…' : 'Redefinir senha'} <Shield size={15} /></button></form>}
  </RoleFrame>
}

function CouplePanel({ notify, confirmAction }) {
  const [stage, setStage] = useState('checking')
  const [account, setAccount] = useState(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [turnstileToken, setTurnstileToken] = useState('')
  const [turnstileReset, setTurnstileReset] = useState(0)
  const [weddings, setWeddings] = useState([])
  const [weddingId, setWeddingId] = useState('')
  const [guests, setGuests] = useState([])
  const [guestPolicy, setGuestPolicy] = useState({ companionsAllowed: false, maxCompanions: 0 })
  const [attendanceRequests, setAttendanceRequests] = useState([])
  const [companionRequests, setCompanionRequests] = useState([])
  const [guestAuthorizations, setGuestAuthorizations] = useState([])
  const [companionNameDrafts, setCompanionNameDrafts] = useState({})
  const [guestImportResults, setGuestImportResults] = useState([])
  const [guestImportErrors, setGuestImportErrors] = useState([])
  const [groups, setGroups] = useState([])
  const [groupName, setGroupName] = useState('')
  const [groupType, setGroupType] = useState('family')
  const [events, setEvents] = useState([])
  const [rsvps, setRsvps] = useState([])
  const [gifts, setGifts] = useState([])
  const [expenses, setExpenses] = useState([])
  const [editingGift, setEditingGift] = useState(null)
  const [giftType, setGiftType] = useState('fixed')
  const [giftTitle, setGiftTitle] = useState('')
  const [giftDescription, setGiftDescription] = useState('')
  const [giftAmount, setGiftAmount] = useState('')
  const [giftGoal, setGiftGoal] = useState('')
  const [giftFulfillmentType, setGiftFulfillmentType] = useState('pix_direct')
  const [giftStoreUrl, setGiftStoreUrl] = useState('')
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
  const [teamName, setTeamName] = useState('')
  const [teamEmail, setTeamEmail] = useState('')
  const [teamProfession, setTeamProfession] = useState('cerimonialista')
  const [teamEventIds, setTeamEventIds] = useState([])
  const [teamInvitation, setTeamInvitation] = useState(null)
  const [godparentTasks, setGodparentTasks] = useState([])
  const [siteConfig, setSiteConfig] = useState(DEFAULT_SITE_CONFIG)
  const [savedSiteConfig, setSavedSiteConfig] = useState(DEFAULT_SITE_CONFIG)
  const [publishedSiteConfig, setPublishedSiteConfig] = useState(null)
  const [sitePublishedAt, setSitePublishedAt] = useState(null)
  const [siteConfigLoading, setSiteConfigLoading] = useState(false)
  const [tab, setTab] = useState(() => window.location.hash === '#equipe' ? 'team' : 'site')
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const mobileNavToggleRef = useRef(null)
  const mobileNavRef = useRef(null)
  const [guestName, setGuestName] = useState('')
  const [guestListQuery, setGuestListQuery] = useState('')
  const [guestEmail, setGuestEmail] = useState('')
  const [guestPhone, setGuestPhone] = useState('')
  const [guestGroup, setGuestGroup] = useState('')
  const [guestPartySize, setGuestPartySize] = useState('1')
  const [guestType, setGuestType] = useState('guest')
  const [guestDietaryNotes, setGuestDietaryNotes] = useState('')
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
  const [eventFormOpen, setEventFormOpen] = useState(false)
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
      setGuestPolicy({ companionsAllowed: false, maxCompanions: 0 })
      setAttendanceRequests([])
      setCompanionRequests([])
      setGuestAuthorizations([])
      setGroups([])
      setEvents(result.events)
      setRsvps([])
      setGifts([])
      setExpenses([])
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
      setGuestPolicy({ companionsAllowed: false, maxCompanions: 0 })
      setAttendanceRequests([])
      setCompanionRequests([])
      setGuestAuthorizations([])
      setGroups(groupResult.groups)
      setEvents(eventResult.events)
      setRsvps([])
      setGifts([])
      setExpenses([])
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
    const [guestResult, groupResult, eventResult, rsvpResult, giftResult, expenseResult, memberResult, assignmentResult, taskResult, siteConfigResult, guestPolicyResult, attendanceResult, authorizationResult] = await Promise.all([
      request(`${base}/guests`),
      request(`${base}/groups`),
      request(`${base}/events`),
      request(`${base}/rsvps`),
      request(`${base}/gifts`),
      request(`${base}/expenses`),
      request(`${base}/members`),
      request(`${base}/event-assignments`),
      request(`${base}/godparent-tasks`),
      request(`${base}/site-config`),
      request(`${base}/guest-policy`),
      request(`${base}/attendance-requests`),
      request(`${base}/guest-authorizations`),
    ])
    setGuests(guestResult.guests)
    setGuestPolicy(guestPolicyResult.policy)
    setAttendanceRequests(attendanceResult.requests)
    setCompanionRequests(attendanceResult.companions)
    setGuestAuthorizations(authorizationResult.authorizations)
    setGroups(groupResult.groups)
    setEvents(eventResult.events)
    setRsvps(rsvpResult.rsvps)
    setGifts(giftResult.gifts)
    setExpenses(expenseResult.expenses)
    setMembers(memberResult.members)
    setAssignments(assignmentResult.assignments)
    setGodparentTasks(taskResult.tasks)
    setSiteConfig(siteConfigResult.draft)
    setSavedSiteConfig(siteConfigResult.draft)
    setPublishedSiteConfig(siteConfigResult.published)
    setSitePublishedAt(siteConfigResult.publishedAt)
    setSiteConfigLoading(false)
  }

  async function saveWeddingProfile(profile) {
    const result = await request(`/api/couple/weddings/${weddingId}/profile`, { method: 'PATCH', body: JSON.stringify(profile) })
    setWeddings((current) => current.map((item) => item.id === weddingId ? { ...item, ...result.wedding } : item))
    return result.wedding
  }

  async function saveSiteDraft(profile, configOverride = siteConfig, { silent = false } = {}) {
    setSiteConfigLoading(true)
    setError('')
    try {
      if (profile) await saveWeddingProfile(profile)
      const result = await request(`/api/couple/weddings/${weddingId}/site-config`, { method: 'PUT', body: JSON.stringify(configOverride) })
      setSiteConfig((current) => JSON.stringify(current) === JSON.stringify(configOverride) ? result.draft : current)
      setSavedSiteConfig(result.draft)
      if (!silent) notify('Rascunho do site salvo')
      return true
    } catch (cause) {
      setError(cause.message === 'site_media_not_found' ? 'Uma foto do convite não está mais disponível. Remova-a ou envie novamente antes de salvar.' : cause.message === 'media_storage_unavailable' ? 'O armazenamento de fotos está indisponível no momento.' : 'Não foi possível salvar o rascunho do site. Tente novamente.')
      return false
    } finally {
      setSiteConfigLoading(false)
    }
  }

  async function publishSite(profile, configOverride = siteConfig) {
    if (siteConfigLoading) return
    setSiteConfigLoading(true)
    setError('')
    try {
      const publicationCheck = checkSitePublication(configOverride, events)
      if (publicationCheck.blockers.length) {
        setError(publicationCheck.blockers.join(' '))
        return
      }
      const warningText = publicationCheck.warnings.length ? ` Antes de publicar, confira: ${publicationCheck.warnings.join(' ')}` : ''
      if (!await confirmAction(`Seu convite ficará disponível para os convidados que receberem o link individual. Deseja continuar?${warningText}`, 'Publicar convite', 'Publicar convite')) return
      if (profile) await saveWeddingProfile(profile)
      let draft = configOverride
      if (JSON.stringify(configOverride) !== JSON.stringify(savedSiteConfig)) {
        const saved = await request(`/api/couple/weddings/${weddingId}/site-config`, { method: 'PUT', body: JSON.stringify(configOverride) })
        draft = saved.draft
        setSiteConfig(draft)
        setSavedSiteConfig(draft)
      }
      const result = await request(`/api/couple/weddings/${weddingId}/site-config/publish`, { method: 'POST' })
      setPublishedSiteConfig(result.published)
      setSitePublishedAt(result.publishedAt)
      setWeddings((current) => current.map((item) => item.id === weddingId ? { ...item, status: result.status } : item))
      notify('Site publicado para os convites individuais')
    } catch (cause) {
      setError(cause.message === 'wedding_profile_incomplete' ? 'Preencha os nomes do casal na etapa Aparência antes de publicar.' : cause.message === 'site_accessibility_incomplete' ? 'Preencha a descrição acessível das fotos usadas no convite antes de publicar.' : cause.message === 'wedding_not_publishable' ? 'Este casamento está encerrado e não pode ser publicado.' : cause.message === 'wedding_suspended' ? 'Este casamento está suspenso e não pode ser publicado.' : cause.message === 'site_media_not_found' ? 'Uma foto do convite não está mais disponível. Remova-a ou envie novamente antes de publicar.' : cause.message === 'invalid_site_config' ? 'Revise os dados do convite e tente publicar novamente.' : cause.message === 'media_storage_unavailable' ? 'O armazenamento de fotos está indisponível no momento.' : 'Não foi possível publicar o convite. Tente novamente.')
    } finally {
      setSiteConfigLoading(false)
    }
  }

  useEffect(() => {
    fetch('/api/auth/session').then(async (response) => {
      if (!response.ok) throw new Error('authentication_required')
      const session = await response.json()
      setAccount(session.account)
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
      const response = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password, turnstileToken }) })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'invalid_credentials')
      setAccount(result.account)
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

  async function createGuestGroup(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      await request(`/api/couple/weddings/${weddingId}/groups`, {
        method: 'POST',
        body: JSON.stringify({ name: groupName, groupType }),
      })
      setGroupName('')
      await loadWeddingData(weddingId)
      notify('Grupo criado para organizar os convites.')
    } catch (cause) {
      setError(cause.message === 'guest_group_already_exists' ? 'Já existe um grupo com esse nome.' : 'Não foi possível criar o grupo. Confira o nome e tente novamente.')
    } finally {
      setBusy(false)
    }
  }

  async function saveGuestPolicy(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      const result = await request(`/api/couple/weddings/${weddingId}/guest-policy`, { method: 'PUT', body: JSON.stringify(guestPolicy) })
      setGuestPolicy(result.policy)
      notify('Limites de acompanhantes atualizados.')
    } catch {
      setError('Não foi possível salvar os limites de acompanhantes.')
    } finally {
      setBusy(false)
    }
  }

  async function reviewAttendanceRequest(item, decision) {
    const action = decision === 'approved' ? 'aprovar' : 'recusar'
    if (!await confirmAction(`Deseja ${action} a solicitação de ${item.name} para ${item.event_name}?`, decision === 'approved' ? 'Aprovar solicitação' : 'Recusar solicitação', decision === 'approved' ? 'Aprovar' : 'Recusar', decision === 'rejected')) return
    setBusy(true)
    setError('')
    try {
      await request(`/api/couple/weddings/${weddingId}/attendance-requests/${item.id}`, { method: 'PATCH', body: JSON.stringify({ decision }) })
      await loadWeddingData(weddingId)
      notify(decision === 'approved' ? 'Registro antigo aprovado. A credencial individual está disponível na lista de convidados.' : 'Registro antigo recusado; a resposta foi mantida.')
    } catch (cause) {
      setError(cause.message === 'matching_guest_requires_individual_invitation' ? 'Este contato já está em um convite. Para evitar duplicidade, envie o link individual já criado para essa pessoa.' : 'Não foi possível analisar esta solicitação.')
    } finally {
      setBusy(false)
    }
  }

  async function reviewCompanionRequest(item, decision) {
    const action = decision === 'approved' ? 'aprovar' : 'recusar'
    const name = companionNameDrafts[item.id] ?? item.name
    if (decision === 'approved' && !name?.trim()) {
      setError('Informe o nome da pessoa antes de aprovar e emitir a credencial individual.')
      return
    }
    if (!await confirmAction(`Deseja ${action} ${name?.trim() || 'este acompanhante'} para ${item.event_name}?`, decision === 'approved' ? 'Aprovar acompanhante' : 'Recusar acompanhante', decision === 'approved' ? 'Aprovar' : 'Recusar', decision === 'rejected')) return
    setBusy(true)
    setError('')
    try {
      const result = await request(`/api/couple/weddings/${weddingId}/companion-requests/${item.id}`, { method: 'PATCH', body: JSON.stringify({ decision, name }) })
      setCompanionNameDrafts((current) => { const next = { ...current }; delete next[item.id]; return next })
      await loadWeddingData(weddingId)
      notify(decision === 'approved' ? result.emailSent ? 'Acompanhante aprovado. O link individual foi enviado por e-mail.' : 'Acompanhante aprovado. Gere o link individual na lista de convidados para compartilhá-lo.' : 'Acompanhante recusado; a solicitação foi mantida.')
    } catch (cause) {
      const messages = { companion_limit_reached: 'O limite de acompanhantes definido para este convite foi atingido.', attendance_request_not_approved: 'Aprove primeiro a solicitação principal.', companion_not_ready: 'Confirme a solicitação principal e identifique o acompanhante antes de aprovar.', host_not_confirmed: 'O convidado responsável precisa confirmar presença neste evento.' }
      setError(messages[cause.message] || 'Não foi possível analisar esta solicitação de acompanhante.')
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
      setError('O arquivo deve ter no máximo 1 MB.')
      return
    }
    setBusy(true)
    try {
      const isExcelFile = file.name.toLocaleLowerCase('pt-BR').endsWith('.xlsx')
      const source = isExcelFile
        ? (await import('read-excel-file/browser')).readSheet(file).then((rows) => rows.map((row) => row.map((value) => `"${String(value ?? '').replaceAll('"', '""')}"`).join(';')).join('\n'))
        : file.text()
      const importedGuests = parseGuestCsv(await source)
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
      setError(cause.message === 'O CSV precisa ter um cabeçalho e ao menos um convidado.' || cause.message === 'Inclua uma coluna nome ou name no cabeçalho.' || cause.message === 'O CSV contém aspas sem fechamento.' ? cause.message : 'Não foi possível ler o arquivo. Use um CSV ou uma planilha Excel .xlsx válida.')
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
    if (!await confirmAction(`Remover ${guest.name}? Os dados pessoais e o link serão apagados; RSVP e check-in serão preservados sem identificação.`, 'Remover convidado', 'Remover', true)) return
    setBusy(true)
    setError('')
    try {
      await request(`/api/couple/weddings/${weddingId}/guests/${guest.id}`, { method: 'DELETE' })
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

  function resetGiftForm() {
    setEditingGift(null)
    setGiftType('fixed')
    setGiftTitle('')
    setGiftDescription('')
    setGiftAmount('')
    setGiftGoal('')
    setGiftFulfillmentType('pix_direct')
    setGiftStoreUrl('')
  }

  function startGiftEdit(gift) {
    setEditingGift(gift)
    setGiftType(gift.gift_type)
    setGiftTitle(gift.title)
    setGiftDescription(gift.description || '')
    setGiftAmount(gift.amount_cents === null ? '' : (gift.amount_cents / 100).toFixed(2))
    setGiftGoal(gift.goal_cents === null ? '' : (gift.goal_cents / 100).toFixed(2))
    setGiftFulfillmentType(gift.fulfillment_type || 'pix_direct')
    setGiftStoreUrl(gift.store_url || '')
  }

  async function saveGift(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      const body = {
        giftType: giftFulfillmentType === 'store_link' ? 'custom' : giftType,
        fulfillmentType: giftFulfillmentType,
        storeUrl: giftFulfillmentType === 'store_link' ? giftStoreUrl : '',
        title: giftTitle,
        description: giftDescription,
        amountCents: giftFulfillmentType === 'pix_direct' && giftType === 'fixed' ? parseBrlCents(giftAmount) : null,
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
      setError(cause.message === 'gift_limit_reached' ? 'O limite atual é de 60 presentes ativos por casamento.' : cause.message === 'invalid_store_url' ? 'Use o endereço HTTPS da página do produto na loja.' : 'Não foi possível salvar o presente. Confira o título e os valores em reais.')
    } finally {
      setBusy(false)
    }
  }

  async function archiveGift(gift) {
    if (!await confirmAction(`Arquivar “${gift.title}”? O presente deixa de ficar ativo na lista.`, 'Arquivar presente', 'Arquivar', true)) return
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
    setEventName(EVENT_TYPE_LABELS.ceremony)
    setEventType('ceremony')
    setEventStartsAt('')
    setEventVenue('')
    setEventAddress('')
    setEventGroupIds([])
    setEventFormOpen(false)
  }

  function openWeddingEventForm() {
    setEditingEventId('')
    setEventType('ceremony')
    setEventName(EVENT_TYPE_LABELS.ceremony)
    setEventStartsAt(wedding?.event_date && wedding?.event_time ? `${wedding.event_date}T${wedding.event_time}` : '')
    setEventVenue('')
    setEventAddress('')
    setEventGroupIds([])
    setError('')
    setEventFormOpen(true)
  }

  function changeWeddingEventType(nextType) {
    const previousDefaultName = EVENT_TYPE_LABELS[eventType]
    setEventType(nextType)
    setEventName((current) => !current || current === previousDefaultName ? EVENT_TYPE_LABELS[nextType] : current)
  }

  function editWeddingEvent(item) {
    setEditingEventId(item.id)
    setEventName(item.name)
    setEventType(item.event_type)
    setEventStartsAt(item.starts_at ? new Date(new Date(item.starts_at).getTime() - new Date(item.starts_at).getTimezoneOffset() * 60000).toISOString().slice(0, 16) : '')
    setEventVenue(item.venue_name || '')
    setEventAddress(item.address || '')
    setEventGroupIds(item.group_ids || [])
    setEventFormOpen(true)
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

  async function deleteWeddingEvent(item) {
    if (!await confirmAction(`Excluir o evento “${item.name}”? O convite publicado também será atualizado. Confirmações, entradas, fotos ou acessos de equipe vinculados impedem a exclusão.`, 'Excluir evento', 'Excluir evento', true)) return
    setBusy(true)
    setError('')
    try {
      const response = await fetch(`/api/couple/weddings/${weddingId}/events/${item.id}`, { method: 'DELETE' })
      const result = await response.json()
      if (!response.ok) {
        if (result.error === 'event_has_related_data') {
          const labels = { rsvps: 'confirmações de presença', checkins: 'entradas registradas', photos: 'fotos enviadas', staff: 'acessos de equipe' }
          const related = Object.entries(result.relatedData || {}).filter(([, count]) => count > 0).map(([key, count]) => `${count} ${labels[key]}`)
          setError(`Não foi possível excluir “${item.name}” porque há ${related.join(', ')} vinculadas.`)
          return
        }
        throw new Error(result.error || 'event_delete_failed')
      }
      if (editingEventId === item.id) resetWeddingEventForm()
      setManualEventId((current) => current === item.id ? '' : current)
      setRsvpExportEventId((current) => current === item.id ? '' : current)
      await loadWeddingData(weddingId)
      notify('Evento excluído.')
    } catch {
      setError('Não foi possível excluir este evento. Atualize a página e tente novamente.')
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

  async function createTeamInvitation(event) {
    event.preventDefault()
    if (!teamEventIds.length) return
    setBusy(true)
    setError('')
    try {
      const invitation = await request(`/api/couple/weddings/${weddingId}/members/team-invitations`, {
        method: 'POST',
        body: JSON.stringify({ name: teamName, email: teamEmail, profession: teamProfession, eventIds: teamEventIds }),
      })
      setTeamInvitation(invitation)
      setTeamName('')
      setTeamEmail('')
      setTeamEventIds([])
      await loadWeddingData(weddingId)
      notify('Acesso individual criado. Compartilhe o link com o profissional.')
    } catch (cause) {
      const messages = {
        account_already_member: 'Este e-mail já possui acesso a este casamento.',
        account_not_ready: 'A conta deste e-mail ainda não está ativa. Tente novamente depois que ela for confirmada.',
        invalid_team_events: 'Revise os eventos selecionados.',
      }
      setError(messages[cause.message] || 'Não foi possível criar o acesso da equipe.')
    } finally {
      setBusy(false)
    }
  }

  async function deleteTeamMember(member) {
    if (!await confirmAction(`Excluir o acesso de ${member.display_name || member.email}? A pessoa perderá imediatamente o acesso a todos os eventos deste casamento.`, 'Excluir acesso da equipe', 'Excluir acesso', true)) return
    setBusy(true)
    setError('')
    try {
      await request(`/api/couple/weddings/${weddingId}/members/${member.id}`, { method: 'DELETE' })
      await loadWeddingData(weddingId)
      notify('Acesso da equipe excluído')
    } catch {
      setError('Não foi possível excluir este acesso.')
    } finally {
      setBusy(false)
    }
  }

  async function copyTeamInvitation() {
    if (!teamInvitation?.invitationUrl) return
    try {
      await navigator.clipboard.writeText(teamInvitation.invitationUrl)
      notify('Link individual copiado')
    } catch {
      setError('Não foi possível copiar o link. Selecione e copie o endereço exibido.')
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

  function closeMobileNav() {
    setMobileNavOpen(false)
    if (window.matchMedia('(max-width: 760px)').matches) mobileNavToggleRef.current?.focus()
  }

  function selectPanelTab(nextTab) {
    setTab(nextTab)
    closeMobileNav()
  }

  useEffect(() => {
    if (!mobileNavOpen) return undefined
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    mobileNavRef.current?.querySelector('button.selected')?.focus()
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') closeMobileNav()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [mobileNavOpen])

  if (stage !== 'ready') return <SuperAdminAccessFrame title="Painel dos noivos." description="Entre com o e-mail e a senha da conta vinculada ao seu casamento." eyebrow="ÁREA DOS NOIVOS" brand="Painel dos noivos">
    <form className="role-card admin-login-form" onSubmit={login}><label>E-mail<input type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} required /></label><label>Senha<PasswordInput autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required /></label><TurnstileChallenge onToken={setTurnstileToken} resetKey={turnstileReset} />{error && <p className="admin-form-error" role="alert">{error}</p>}<button className="button-primary" type="submit" disabled={busy || stage === 'checking' || !TURNSTILE_SITE_KEY || !turnstileToken}>Entrar <LockKeyhole size={15} /></button><a className="text-link reset-admin-link" href="/recuperar-senha">Esqueci minha senha</a><p className="signup-login-link">Ainda não têm uma conta? <a href="/cadastro">Criar acesso</a></p><p className="signup-login-link">Querem conhecer o painel? <a href="/painel/demo">Abrir demonstração sem cadastro</a></p></form>
  </SuperAdminAccessFrame>

  if (isReader) return <PublishedOnlyDashboard account={account} wedding={wedding} config={siteConfig} events={events} publishedAt={sitePublishedAt} onLogout={async () => { await fetch('/api/auth/logout', { method: 'POST' }); window.location.assign('/') }} />

  return <div className={`role-page couple-role-page${rsvpPrintActive ? ' couple-print-rsvps' : ''}`}><header className="role-header"><a className="role-brand" href="/"><span>e<span>&amp;</span>t</span><strong>Painel dos noivos</strong></a><div className="couple-header-actions"><span className="role-preview">{account?.email}</span><a className="button-outline couple-header-help" href="/ajuda">Ajuda</a><button className="button-outline" onClick={() => setTab('site')}>{isEditor ? 'Editar site' : 'Meu site'}</button><button className="button-outline" onClick={async () => { await fetch('/api/auth/logout', { method: 'POST' }); window.location.assign('/') }}>Sair</button></div></header><main className={`role-main${tab === 'site' ? ' couple-customizing' : ''}`}><div className="role-intro"><span className="role-icon"><Settings2 size={19} /></span><span className="eyebrow">{isEditor ? 'EDITOR DO CASAMENTO' : 'ÁREA DOS NOIVOS'}</span><h1>{wedding ? `${wedding.partner_one_name} & ${wedding.partner_two_name}` : 'Seu casamento'}</h1><p>{isEditor ? 'Você pode alterar o site e os eventos deste casamento.' : 'Convidados e respostas ficam limitados ao casamento autorizado nesta sessão.'}</p></div>
    {weddings.length > 1 && <label className="staff-event-select">Casamento<select value={weddingId} onChange={(event) => { setWeddingId(event.target.value); setTab('site') }}>{weddings.map((item) => <option key={item.id} value={item.id}>{item.partner_one_name} & {item.partner_two_name}</option>)}</select></label>}
    {error && <p className="admin-form-error" role="alert">{error}</p>}
    {!isEditor && <div className="role-stat-grid"><div className="role-stat"><span>Convidados</span><strong>{guests.length}</strong></div><div className="role-stat"><span>Eventos</span><strong>{events.length}</strong></div></div>}
    <button ref={mobileNavToggleRef} type="button" className="couple-mobile-menu-toggle" aria-expanded={mobileNavOpen} aria-controls="couple-panel-tabs" onClick={() => setMobileNavOpen(true)}><Menu size={19} />Navegação do casamento</button>
    {mobileNavOpen && <button type="button" className="couple-mobile-nav-backdrop" aria-label="Fechar navegação" onClick={closeMobileNav} />}
    <nav id="couple-panel-tabs" ref={mobileNavRef} className={`couple-panel-tabs${mobileNavOpen ? ' mobile-open' : ''}`} aria-label="Áreas do casamento">
      <div className="couple-mobile-nav-heading"><strong>Áreas do casamento</strong><button type="button" aria-label="Fechar menu" onClick={closeMobileNav}><X size={20} /></button></div>
      <div className="couple-nav-guide"><strong>Organize por etapa</strong><span>Escolha uma área para continuar. Seus dados ficam salvos no casamento.</span></div>
      <button className={tab === 'site' ? 'selected' : ''} aria-current={tab === 'site' ? 'page' : undefined} onClick={() => selectPanelTab('site')}><Paintbrush size={18} /><span>Personalizar</span></button>
      {(isEditor || !isReader) && <button className={tab === 'events' ? 'selected' : ''} aria-current={tab === 'events' ? 'page' : undefined} onClick={() => selectPanelTab('events')}><CalendarDays size={18} /><span>Eventos</span></button>}
      {!isEditor && <>
        <button className={tab === 'guests' ? 'selected' : ''} aria-current={tab === 'guests' ? 'page' : undefined} onClick={() => selectPanelTab('guests')}><Users size={18} /><span>Convidados</span></button>
        <button className={tab === 'team' ? 'selected' : ''} aria-current={tab === 'team' ? 'page' : undefined} onClick={() => selectPanelTab('team')}><Shield size={18} /><span>Equipe</span></button>
        <button className={tab === 'godparents' ? 'selected' : ''} aria-current={tab === 'godparents' ? 'page' : undefined} onClick={() => selectPanelTab('godparents')}><Heart size={18} /><span>Padrinhos</span></button>
        <button className={tab === 'memories' ? 'selected' : ''} aria-current={tab === 'memories' ? 'page' : undefined} onClick={() => selectPanelTab('memories')}><Camera size={18} /><span>Álbum</span></button>
        {!isReader && <button className={tab === 'expenses' ? 'selected' : ''} aria-current={tab === 'expenses' ? 'page' : undefined} onClick={() => selectPanelTab('expenses')}><Wallet size={18} /><span>Despesas</span></button>}
        <button className={tab === 'gifts' ? 'selected' : ''} aria-current={tab === 'gifts' ? 'page' : undefined} onClick={() => selectPanelTab('gifts')}><Gift size={18} /><span>Presentes</span></button>
      </>}
    </nav><div className="couple-panel-content">{tab === 'guests' && !isEditor && <WeddingWallModeration weddingId={weddingId} />}{tab === 'guests' && <>
      <section className="role-card guest-import-card"><div className="role-card-heading"><div><span className="eyebrow">COMECE PELA SUA LISTA</span><h2>Importar convidados</h2></div><Users size={18} /></div><p className="team-access-note">Envie até 100 pessoas de uma vez por CSV ou planilha Excel (.xlsx). Use o modelo para organizar nomes, grupos e acompanhantes; se uma linha tiver erro, nada será importado.</p>{!isEditor && <details className="guest-group-tools"><summary>Preparar grupos para a lista <span>{groups.length} grupos</span></summary><div><form className="couple-group-form guest-group-create-form" onSubmit={createGuestGroup}><label>Nome do grupo<input value={groupName} onChange={(event) => setGroupName(event.target.value)} maxLength="100" placeholder="Ex.: Família da noiva" required /></label><label>Categoria<select value={groupType} onChange={(event) => setGroupType(event.target.value)}><option value="family">Família</option><option value="friends">Amigos</option><option value="godparent">Padrinhos</option><option value="guest">Convidados</option><option value="other">Outro</option></select></label><button type="submit" className="button-outline" disabled={busy}>Criar grupo</button></form>{groups.length > 0 && <ul aria-label="Grupos cadastrados">{groups.map((group) => <li key={group.id}>{group.name}</li>)}</ul>}<small>Os grupos ajudam a importar a planilha e definir quais eventos cada pessoa pode ver.</small></div></details>}<div className="guest-import-actions"><button type="button" className="button-outline" onClick={downloadGuestCsvTemplate}>Baixar modelo CSV</button><label className="button-primary guest-import-file">{busy ? 'Importando…' : 'Importar lista'}<input type="file" accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" onChange={importGuestCsv} disabled={busy} /></label></div>{guestImportErrors.length > 0 && <div className="guest-import-errors" role="alert"><strong>Revise o arquivo</strong>{guestImportErrors.map((item) => <span key={item.row}>Linha {item.row}: {item.fields.join(', ')}</span>)}</div>}{guestImportResults.length > 0 && <div className="guest-import-success"><span>{guestImportResults.length} convidados importados. Os links individuais foram criados.</span><button type="button" className="button-outline" onClick={downloadImportedGuestLinks}>Baixar links dos convites <QrCode size={14} /></button></div>}</section>
      <section className="role-card guest-manual-card"><div className="role-card-heading"><div><span className="eyebrow">CADASTRO RÁPIDO</span><h2>Adicionar uma pessoa</h2></div></div><form className="couple-guest-form" onSubmit={createGuest}><label>Nome<input value={guestName} onChange={(event) => setGuestName(event.target.value)} maxLength="160" required /></label><label>Pessoas<input type="number" min="1" max="20" value={guestPartySize} onChange={(event) => setGuestPartySize(event.target.value)} required /></label><label>Grupo<select value={guestGroup} onChange={(event) => setGuestGroup(event.target.value)}><option value="">Sem grupo</option>{groups.map((group) => <option value={group.id} key={group.id}>{group.name}</option>)}</select></label><details className="guest-extra-fields"><summary>Contato e detalhes opcionais</summary><div><label>Telefone<input type="tel" value={guestPhone} onChange={(event) => setGuestPhone(event.target.value)} /></label><label>E-mail<input type="email" value={guestEmail} onChange={(event) => setGuestEmail(event.target.value)} /></label><label>Perfil<select value={guestType} onChange={(event) => setGuestType(event.target.value)}><option value="guest">Convidado</option><option value="godparent">Padrinho ou madrinha</option></select></label><label className="couple-guest-wide">Restrição alimentar<input value={guestDietaryNotes} maxLength="1000" onChange={(event) => setGuestDietaryNotes(event.target.value)} /></label><small>O e-mail é opcional. Ele poderá ser usado em notificações quando esse recurso estiver disponível.</small></div></details><button type="submit" className="button-primary" disabled={busy}>Salvar pessoa e criar convite <QrCode size={15} /></button></form></section>
      {editingGuest && <section className="role-card"><div className="role-card-heading"><div><span className="eyebrow">EDITAR CONVITE</span><h2>{editingGuest.name}</h2></div></div><form className="couple-guest-form" onSubmit={saveGuest}><label>Nome<input value={editingGuest.name} onChange={(event) => setEditingGuest({ ...editingGuest, name: event.target.value })} maxLength="160" required /></label><label>Telefone<input type="tel" value={editingGuest.phone || ''} onChange={(event) => setEditingGuest({ ...editingGuest, phone: event.target.value })} /></label><label>Grupo<select value={editingGuest.group_id || ''} onChange={(event) => setEditingGuest({ ...editingGuest, group_id: event.target.value })}><option value="">Sem grupo</option>{groups.map((group) => <option value={group.id} key={group.id}>{group.name}</option>)}</select></label><label>E-mail opcional<input type="email" value={editingGuest.email || ''} onChange={(event) => setEditingGuest({ ...editingGuest, email: event.target.value })} /></label><label>Pessoas<input type="number" min="1" max="20" value={editingGuest.party_size} onChange={(event) => setEditingGuest({ ...editingGuest, party_size: event.target.value })} required /></label><label>Perfil<select value={editingGuest.guest_type} onChange={(event) => setEditingGuest({ ...editingGuest, guest_type: event.target.value })}><option value="guest">Convidado</option><option value="godparent">Padrinho ou madrinha</option></select></label><label className="couple-guest-wide">Restrição alimentar<input value={editingGuest.dietary_notes || ''} maxLength="1000" onChange={(event) => setEditingGuest({ ...editingGuest, dietary_notes: event.target.value })} /></label><button type="submit" className="button-primary" disabled={busy}>Salvar alterações <Check size={15} /></button><button type="button" className="button-outline" disabled={busy} onClick={() => setEditingGuest(null)}>Cancelar</button></form></section>}
      {share && <InvitationShare share={share} onClose={() => setShare(null)} notify={notify} />}
      <section className="role-card superadmin-card couple-guest-list-card"><div className="role-card-heading"><div><span className="eyebrow">LISTA PRIVADA</span><h2>Convidados</h2></div><span className="task-count">{guests.length} pessoas</span></div><label className="guest-list-search">Localizar pessoa<input type="search" value={guestListQuery} onChange={(event) => setGuestListQuery(event.target.value)} placeholder="Digite um nome" /></label><div className="couple-guest-card-grid">{guests.filter((guest) => guest.name.toLocaleLowerCase('pt-BR').includes(guestListQuery.trim().toLocaleLowerCase('pt-BR'))).map((guest) => <article className="couple-guest-card" key={guest.id}><div className="couple-guest-card-heading"><strong>{guest.name}</strong><span>{guest.guest_type === 'godparent' ? 'Padrinho' : guest.group_name || 'Convidado'}</span></div><div className="couple-guest-card-facts"><span>{guest.party_size} {guest.party_size === 1 ? 'pessoa' : 'pessoas'}</span><span>{guest.rsvp_status === 'confirmed' ? 'Confirmado' : guest.rsvp_status === 'declined' ? 'Não poderá ir' : 'Sem resposta'}</span></div><small>{guest.email || guest.phone || 'Sem contato cadastrado'}</small><div className="guest-admin-actions"><button className="button-outline" disabled={busy} onClick={() => setEditingGuest({ ...guest })} aria-label={`Editar ${guest.name}`}><Pencil size={14} /></button><button className="button-outline" disabled={busy} onClick={() => rotateGuestLink(guest)} aria-label={`Gerar novo link de ${guest.name}`}><QrCode size={14} /></button><button className="button-outline guest-remove-button" disabled={busy} onClick={() => removeGuest(guest)} aria-label={`Remover ${guest.name}`}><Trash2 size={14} /></button></div></article>)}{!guests.length && <p className="buffet-empty">Importe uma lista ou cadastre a primeira pessoa.</p>}{guests.length > 0 && !guests.some((guest) => guest.name.toLocaleLowerCase('pt-BR').includes(guestListQuery.trim().toLocaleLowerCase('pt-BR'))) && <p className="buffet-empty">Nenhuma pessoa encontrada.</p>}</div></section>
    </>}
    {tab === 'guests' && <details className="role-card couple-inline-rsvps"><summary>Respostas, acompanhantes e acessos</summary><div>
      <AttendanceRequestManager policy={guestPolicy} setPolicy={setGuestPolicy} requests={attendanceRequests} companions={companionRequests} companionNameDrafts={companionNameDrafts} setCompanionNameDrafts={setCompanionNameDrafts} onSavePolicy={saveGuestPolicy} onReviewRequest={reviewAttendanceRequest} onReviewCompanion={reviewCompanionRequest} busy={busy} />
      <GuestAuthorizationManager weddingId={weddingId} guests={guests} events={events} authorizations={guestAuthorizations} onReload={() => loadWeddingData(weddingId)} confirmAction={confirmAction} notify={notify} busy={busy} />
      <section className="role-card"><div className="role-card-heading"><div><span className="eyebrow">REGISTRO MANUAL</span><h2>{editingRsvp ? 'Corrigir confirmação' : 'Registrar resposta recebida'}</h2></div><ListChecks size={18} /></div><p className="team-access-note">Use quando o convidado responder por telefone ou mensagem. A alteração fica registrada na auditoria do casamento.</p><form className="couple-guest-form" onSubmit={saveManualRsvp}>
        {!editingRsvp && <><label>Evento<select value={manualEventId} onChange={(event) => { setManualEventId(event.target.value); setManualGuestId('') }} required><option value="">Selecione um evento</option>{events.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><label className="couple-guest-wide">Convidado sem resposta neste evento<select value={manualGuestId} onChange={(event) => { const guest = guests.find((item) => item.id === event.target.value); setManualGuestId(event.target.value); setManualRsvpPartySize(String(guest?.party_size || 1)) }} required disabled={!manualEventId}><option value="">Selecione um convidado</option>{availableManualGuests.map((guest) => <option key={guest.id} value={guest.id}>{guest.name} · até {guest.party_size} pessoa(s)</option>)}</select></label></>}
        {editingRsvp && <><label>Convidado<input value={editingRsvp.guest_name} readOnly /></label><label>Evento<input value={editingRsvp.event_name} readOnly /></label></>}
        <label>Resposta<select value={editingRsvp ? editingRsvp.status : manualRsvpStatus} onChange={(event) => editingRsvp ? setEditingRsvp({ ...editingRsvp, status: event.target.value }) : setManualRsvpStatus(event.target.value)}><option value="confirmed">Confirmou presença</option><option value="declined">Não poderá comparecer</option></select></label>
        <label>Pessoas<input type="number" min="1" max={editingRsvp?.invited_party_size || guests.find((item) => item.id === manualGuestId)?.party_size || 20} value={editingRsvp ? editingRsvp.party_size : manualRsvpPartySize} onChange={(event) => editingRsvp ? setEditingRsvp({ ...editingRsvp, party_size: event.target.value }) : setManualRsvpPartySize(event.target.value)} required /></label>
        <label className="couple-guest-wide">Restrições alimentares<textarea rows="2" maxLength="1000" value={editingRsvp ? editingRsvp.dietary_notes : manualRsvpDietaryNotes} onChange={(event) => editingRsvp ? setEditingRsvp({ ...editingRsvp, dietary_notes: event.target.value }) : setManualRsvpDietaryNotes(event.target.value)} /></label>
        <button type="submit" className="button-primary" disabled={busy || (!editingRsvp && (!manualGuestId || !events.length))}>{editingRsvp ? 'Salvar correção' : 'Registrar confirmação'} <Check size={15} /></button>{editingRsvp && <button type="button" className="button-outline" disabled={busy} onClick={() => setEditingRsvp(null)}>Cancelar</button>}
      </form>{manualEventId && !availableManualGuests.length && !editingRsvp && <p className="buffet-empty">Todos os convidados elegíveis já têm resposta para este evento.</p>}</section>
      <section className="role-card superadmin-card couple-rsvp-print"><div className="role-card-heading"><div><span className="eyebrow">RESPOSTAS POR EVENTO</span><h2>Lista de presenças</h2></div><span className="task-count">{rsvpExportRows.length} respostas</span></div><div className="couple-rsvp-toolbar"><label>Filtrar relatório<select value={rsvpExportEventId} onChange={(event) => setRsvpExportEventId(event.target.value)}><option value="">Todos os eventos</option>{events.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><button className="button-outline print-button" disabled={!rsvpExportRows.length} onClick={exportRsvpPdf}><Printer size={15} /> Exportar relatório em PDF</button></div><div className="superadmin-table-wrap"><table className="superadmin-table"><thead><tr><th>CONVIDADO</th><th>EVENTO</th><th>RESPOSTA</th><th>PESSOAS</th><th>RESTRIÇÕES</th><th>AÇÃO</th></tr></thead><tbody>{rsvpExportRows.map((item) => <tr key={item.id}><td><strong>{item.guest_name}</strong></td><td>{item.event_name}</td><td>{item.status === 'confirmed' ? 'Confirmou' : 'Não poderá comparecer'}</td><td>{item.party_size}</td><td>{item.dietary_notes || '—'}</td><td><button className="button-outline print-button" disabled={busy} onClick={() => editRsvp(item)} aria-label={`Corrigir resposta de ${item.guest_name} para ${item.event_name}`}><Pencil size={14} /> Corrigir</button></td></tr>)}</tbody></table></div>{!rsvpExportRows.length && <p className="buffet-empty">As respostas dos convidados aparecerão aqui.</p>}</section>
    </div></details>}    {tab === 'events' && <div className="couple-events-tab">
      <section className="role-card event-management-card"><div className="role-card-heading"><div><h2>Eventos</h2></div><div className="event-management-actions"><span className="task-count">{events.length}/6 eventos</span>{!eventFormOpen && events.length < 6 && <button className="button-primary" type="button" onClick={openWeddingEventForm}>Adicionar evento <CalendarDays size={15} /></button>}</div></div><p className="team-access-note">O nome, a data e os dados do local aparecem no convite depois que vocês salvam o evento e publicam as alterações do site.</p>
        {eventFormOpen && <div className="event-editor-panel"><div className="event-editor-heading"><div><h3>{editingEventId ? 'Editar evento' : 'Novo evento'}</h3><p>Defina os dados deste evento e quem poderá acessá-lo.</p></div><button className="button-outline" type="button" onClick={resetWeddingEventForm} disabled={busy}>Fechar</button></div><form className="wedding-event-form" onSubmit={saveWeddingEvent}><label>Tipo<select value={eventType} onChange={(event) => changeWeddingEventType(event.target.value)}><option value="ceremony">Cerimônia</option><option value="reception">Recepção</option><option value="rehearsal">Ensaio</option><option value="brunch">Brunch</option><option value="other">Outro</option></select></label><label>Nome do evento<input value={eventName} onChange={(event) => setEventName(event.target.value)} maxLength="120" required placeholder="Nome que aparecerá para os convidados" /></label><label>Data e hora<input type="datetime-local" value={eventStartsAt} onChange={(event) => setEventStartsAt(event.target.value)} />{!editingEventId && wedding?.event_date && !wedding?.event_time && <small className="event-date-note">O casamento tem uma data, mas não um horário cadastrado. Informe a data e o horário deste evento.</small>}</label><label>Local<input value={eventVenue} onChange={(event) => setEventVenue(event.target.value)} maxLength="160" /></label><label className="event-form-wide">Endereço<input value={eventAddress} onChange={(event) => setEventAddress(event.target.value)} maxLength="500" /></label>{groups.length > 0 && <fieldset className="event-group-access"><legend>Quem pode acessar este evento?</legend><p>Se nenhum grupo for selecionado, todos os convidados poderão acessar.</p><div>{groups.map((group) => <label key={group.id}><input type="checkbox" checked={eventGroupIds.includes(group.id)} onChange={(change) => setEventGroupIds((current) => change.target.checked ? [...current, group.id] : current.filter((id) => id !== group.id))} />{group.name}</label>)}</div></fieldset>}<div className="event-form-actions"><button className="button-primary" type="submit" disabled={busy || (!editingEventId && events.length >= 6)}>{editingEventId ? 'Salvar alterações' : 'Criar evento'} <CalendarDays size={15} /></button><button className="button-outline" type="button" disabled={busy} onClick={resetWeddingEventForm}>Cancelar</button></div></form></div>}
        {error && <p className="admin-form-error event-page-error" role="alert">{error}</p>}
        <div className="wedding-event-list">{events.length ? events.map((item) => <article key={item.id}><div className="event-list-details"><strong>{item.name}</strong><small>{item.starts_at ? new Date(item.starts_at).toLocaleString('pt-BR') : 'Data a definir'} · {item.venue_name || 'Local a definir'}</small><small>{item.group_ids?.length ? `Acesso: ${groups.filter((group) => item.group_ids.includes(group.id)).map((group) => group.name).join(', ')}` : 'Acesso: todos os convidados'}</small></div><div className="wedding-event-actions"><span className="admin-state admin-state-active">{EVENT_TYPE_LABELS[item.event_type] || EVENT_TYPE_LABELS.other}</span><button className="button-outline" disabled={busy} onClick={() => editWeddingEvent(item)}>Editar</button><button className="button-outline event-delete-button" disabled={busy} onClick={() => deleteWeddingEvent(item)}>Excluir</button></div></article>) : <p className="buffet-empty event-empty-state">Nenhum evento cadastrado.</p>}</div>
      </section>
    </div>}
    {tab === 'team' && <>
      <section className="role-card"><div className="role-card-heading"><div><span className="eyebrow">ACESSO PROFISSIONAL</span><h2>Adicionar à equipe</h2></div><Shield size={18} /></div><p className="team-access-note">Cada profissional recebe um acesso próprio, limitado aos eventos selecionados e ao controle de entrada. O painel administrativo do casal não fica disponível para essa conta.</p><form className="team-invitation-form" onSubmit={createTeamInvitation}><label>Nome<input value={teamName} onChange={(event) => setTeamName(event.target.value)} maxLength="160" required /></label><label>E-mail<input type="email" value={teamEmail} onChange={(event) => setTeamEmail(event.target.value)} maxLength="254" required /></label><label>Função<select value={teamProfession} onChange={(event) => setTeamProfession(event.target.value)}><option value="cerimonialista">Cerimonialista</option><option value="seguranca">Segurança</option></select></label><fieldset><legend>Eventos autorizados</legend>{events.map((event) => <label key={event.id}><input type="checkbox" checked={teamEventIds.includes(event.id)} disabled={busy} onChange={(input) => setTeamEventIds((current) => input.target.checked ? [...current, event.id] : current.filter((id) => id !== event.id))} />{event.name}</label>)}{!events.length && <span>Cadastre um evento antes de convidar a equipe.</span>}</fieldset><button type="submit" className="button-primary" disabled={busy || !events.length || !teamEventIds.length}>{busy ? 'Criando acesso…' : 'Gerar link individual'} <ArrowRight size={15} /></button></form>{teamInvitation && <div className="team-invitation-result"><strong>Convite de {teamInvitation.name}</strong><span>{teamInvitation.email} · {teamInvitation.profession === 'seguranca' ? 'Segurança' : 'Cerimonialista'} · válido até {new Date(teamInvitation.expiresAt).toLocaleString('pt-BR')}</span><div><input readOnly value={teamInvitation.invitationUrl} aria-label="Link individual para acesso da equipe" onFocus={(event) => event.target.select()} /><button type="button" className="button-outline" onClick={copyTeamInvitation}><Copy size={14} /> Copiar link</button><a className="button-outline" href={`https://wa.me/?text=${encodeURIComponent(`Acesse a área segura da equipe do casamento: ${teamInvitation.invitationUrl}`)}`} target="_blank" rel="noreferrer"><MessageCircle size={14} /> Enviar pelo WhatsApp</a></div></div>}</section>
      <section className="role-card"><div className="role-card-heading"><div><span className="eyebrow">MEMBROS DO CASAMENTO</span><h2>Equipe cadastrada</h2></div><span className="task-count">{members.filter((member) => ['event_staff', 'checkin_staff'].includes(member.role)).length} profissionais</span></div><p className="team-access-note">Os acessos podem ser desativados ou excluídos a qualquer momento. Cada profissional só consulta os eventos que vocês liberaram.</p><div className="team-member-list">{members.filter((member) => ['event_staff', 'checkin_staff'].includes(member.role)).map((member) => <article className="team-member-row" key={member.id}><div><strong>{member.display_name || member.email}</strong><small>{member.email} · {member.profession === 'seguranca' ? 'Segurança' : member.profession === 'cerimonialista' ? 'Cerimonialista' : 'Equipe de entrada'}</small></div><label>Status<select value={member.status} disabled={busy || member.status === 'pending'} onChange={(event) => updateMember(member, { status: event.target.value })}><option value="active">Ativo</option><option value="revoked">Desativado</option><option value="pending" disabled>Pendente</option></select></label><button type="button" className="button-outline guest-remove-button" disabled={busy} onClick={() => deleteTeamMember(member)}><Trash2 size={14} /> Excluir</button></article>)}{!members.some((member) => ['event_staff', 'checkin_staff'].includes(member.role)) && <p className="buffet-empty">Nenhum profissional foi adicionado à equipe.</p>}</div></section>
      {events.length > 0 && members.some((member) => ['event_staff', 'checkin_staff'].includes(member.role)) && <section className="role-card"><span className="eyebrow">ACESSO POR EVENTO</span><h2>Gerenciar eventos autorizados</h2><div className="team-assignment-list">{members.filter((member) => ['event_staff', 'checkin_staff'].includes(member.role)).map((member) => <article key={member.id}><strong>{member.display_name || member.email}<small>{member.email}</small></strong><div>{events.map((event) => { const assigned = assignments.some((item) => item.membership_id === member.id && item.event_id === event.id); return <label key={event.id}><input type="checkbox" checked={assigned} disabled={busy || member.status !== 'active'} onChange={(input) => assignMember(event.id, member, input.target.checked)} />{event.name}</label> })}</div></article>)}</div></section>}
    </>}
    {tab === 'gifts' && <>
      <section className="role-card"><div className="role-card-heading"><div><span className="eyebrow">CATÁLOGO DO CASAMENTO</span><h2>{editingGift ? 'Editar presente' : 'Adicionar presente'}</h2></div><Gift size={18} /></div><p className="team-access-note">Pix vai direto à chave do casal. Para um presente físico, adicione o link da loja; a compra e a entrega são acertadas fora do site.</p><form className="gift-management-form" onSubmit={saveGift}><label>Nome do presente<input value={giftTitle} onChange={(event) => setGiftTitle(event.target.value)} maxLength="120" required /></label><label>Como presentear<select value={giftFulfillmentType} onChange={(event) => setGiftFulfillmentType(event.target.value)}><option value="pix_direct">Contribuição via Pix</option><option value="store_link">Presente físico em uma loja</option></select></label>{giftFulfillmentType === 'pix_direct' && <><label>Valor para sugerir<select value={giftType} onChange={(event) => setGiftType(event.target.value)}><option value="fixed">Sugerir um valor</option><option value="custom">Deixar livre</option></select></label>{giftType === 'fixed' && <label>Valor sugerido (R$)<input inputMode="decimal" value={giftAmount} onChange={(event) => setGiftAmount(event.target.value)} placeholder="150,00" required /></label>}</>}{giftFulfillmentType === 'store_link' && <label className="gift-form-wide">Link do produto na loja<input type="url" inputMode="url" value={giftStoreUrl} onChange={(event) => setGiftStoreUrl(event.target.value)} placeholder="https://loja.com/produto" required /></label>}<label className="gift-form-wide">Descrição<textarea rows="3" maxLength="500" value={giftDescription} onChange={(event) => setGiftDescription(event.target.value)} /></label>{editingGift && <label>Status<select value={editingGift.status} onChange={(event) => setEditingGift({ ...editingGift, status: event.target.value })}><option value="active">Ativo</option><option value="archived">Arquivado</option></select></label>}<div className="gift-form-actions"><button type="submit" className="button-primary" disabled={busy || (!editingGift && gifts.filter((item) => item.status === 'active').length >= 60) || (giftFulfillmentType === 'store_link' && !giftStoreUrl.trim())}>{editingGift ? 'Salvar presente' : 'Adicionar à lista'} <Check size={15} /></button>{editingGift && <button type="button" className="button-outline" disabled={busy} onClick={resetGiftForm}>Cancelar</button>}</div></form></section>

      <section className="role-card"><div className="role-card-heading"><div><span className="eyebrow">LISTA DE PRESENTES</span><h2>Itens cadastrados</h2></div><span className="task-count">{gifts.filter((item) => item.status === 'active').length}/60 ativos</span></div><div className="couple-gift-list">{gifts.map((gift) => <article key={gift.id}><div><strong>{gift.title}</strong><small>{gift.fulfillment_type === 'store_link' ? 'Presente físico · link de loja' : `Pix direto · ${gift.gift_type === 'custom' ? 'valor livre' : `sugestão ${formatBrlCents(gift.amount_cents)}`}`}</small>{gift.description && <p>{gift.description}</p>}</div><span className={`admin-state ${gift.status === 'active' ? 'admin-state-active' : ''}`}>{gift.status === 'active' ? 'Ativo' : 'Arquivado'}</span><div className="guest-admin-actions"><button className="button-outline" disabled={busy} onClick={() => startGiftEdit(gift)} aria-label={`Editar ${gift.title}`}><Pencil size={14} /></button>{gift.status === 'active' && <button className="button-outline guest-remove-button" disabled={busy} onClick={() => archiveGift(gift)} aria-label={`Arquivar ${gift.title}`}><Trash2 size={14} /></button>}</div></article>)}{!gifts.length && <p className="buffet-empty">Adicione os primeiros presentes para este casamento.</p>}</div></section>
      <GiftPresentationManager weddingId={weddingId} gifts={gifts} config={siteConfig} setConfig={setSiteConfig} onSave={saveSiteDraft} onPublish={publishSite} saving={siteConfigLoading} />
      <section className="role-card couple-pix-settings"><div className="role-card-heading"><div><span className="eyebrow">PIX DIRETO</span><h2>Chave Pix no convite</h2></div><Wallet size={19} /></div><p className="team-access-note">O convidado copia a chave e transfere pelo próprio banco. O valor vai diretamente para vocês; a plataforma não movimenta nem confirma pagamentos.</p><label className="pix-toggle"><input type="checkbox" checked={Boolean(siteConfig.pix?.enabled)} disabled={!siteConfig.pix?.enabled && !siteConfig.pix?.key?.trim()} onChange={(event) => setSiteConfig((current) => ({ ...current, pix: { enabled: event.target.checked, key: current.pix?.key || '', holderName: current.pix?.holderName || '' } }))} /><span>Ativar esta chave Pix para uso no convite</span></label><label className="pix-key-field">Chave Pix<input autoComplete="off" value={siteConfig.pix?.key || ''} onChange={(event) => setSiteConfig((current) => ({ ...current, pix: { enabled: Boolean(current.pix?.enabled), key: event.target.value, holderName: current.pix?.holderName || '' } }))} maxLength="200" placeholder="CPF, CNPJ, e-mail, telefone ou chave aleatória" /></label><label className="pix-key-field">Nome do titular (opcional)<input autoComplete="name" value={siteConfig.pix?.holderName || ''} onChange={(event) => setSiteConfig((current) => ({ ...current, pix: { enabled: Boolean(current.pix?.enabled), key: current.pix?.key || '', holderName: event.target.value } }))} maxLength="120" /></label>{!siteConfig.pix?.key?.trim() && <p className="customizer-step-note" role="status">Informem a chave Pix para poder ativar essa opção.</p>}{(!wedding?.partner_one_name?.trim() || !wedding?.partner_two_name?.trim()) && <p className="customizer-step-note" role="status">Preencham os nomes do casal na etapa Aparência para publicar o convite.</p>}<div className="gift-form-actions"><button type="button" className="button-primary" disabled={siteConfigLoading} onClick={() => publishSite(null, siteConfig)}>{siteConfigLoading ? 'Publicando…' : 'Salvar e publicar no convite'} <Check size={15} /></button></div><p className="team-access-note">A publicação atualiza o convite inteiro com o rascunho salvo.</p></section>
    </>}
    {tab === 'godparents' && <>
      <section className="role-card godparent-welcome"><span className="eyebrow">QUEM CAMINHA COM VOCÊS</span><h2>Um espaço especial para padrinhos e madrinhas.</h2><p>Compartilhem orientações e tarefas com cada pessoa. O convite individual mostra apenas o que foi enviado a ela, sem expor a lista de convidados.</p><a href="#godparent-task-form">Preparar uma orientação <ArrowRight size={17} /></a></section>
      <section className="role-card"><div className="role-card-heading"><div><span className="eyebrow">ORIENTAÇÕES INDIVIDUAIS</span><h2>Atribuir tarefa a um padrinho</h2></div></div><form className="godparent-task-form" id="godparent-task-form" onSubmit={createGodparentTask}><label>Padrinho ou madrinha<select value={taskGuestId} onChange={(event) => setTaskGuestId(event.target.value)} required><option value="">Selecione um convite</option>{guests.filter((guest) => guest.guest_type === 'godparent').map((guest) => <option value={guest.id} key={guest.id}>{guest.name}</option>)}</select></label><label>Tarefa<input value={taskTitle} onChange={(event) => setTaskTitle(event.target.value)} maxLength="160" required /></label><label>Prazo<input type="datetime-local" value={taskDueAt} onChange={(event) => setTaskDueAt(event.target.value)} /></label><label className="godparent-task-wide">Detalhes<textarea value={taskDetails} onChange={(event) => setTaskDetails(event.target.value)} maxLength="2000" rows="3" /></label><button className="button-primary" disabled={busy || !guests.some((guest) => guest.guest_type === 'godparent')} type="submit">Enviar orientação <Heart size={15} /></button></form>{!guests.some((guest) => guest.guest_type === 'godparent') && <p className="buffet-empty">Cadastre um convidado com perfil de padrinho para atribuir tarefas.</p>}</section>
      <section className="role-card"><div className="role-card-heading"><div><span className="eyebrow">TAREFAS ENVIADAS</span><h2>Orientações por convite</h2></div><span className="task-count">{godparentTasks.length} tarefas</span></div><div className="godparent-admin-task-list">{godparentTasks.map((task) => <article key={task.id}><div><strong>{task.title}</strong><small>{task.guest_name} · {task.due_at ? new Date(task.due_at).toLocaleString('pt-BR') : 'Sem prazo'}</small>{task.details && <p>{task.details}</p>}</div><span className={`admin-state ${task.status === 'done' ? 'admin-state-active' : ''}`}>{task.status === 'done' ? 'Concluída' : 'Pendente'}</span></article>)}{!godparentTasks.length && <p className="buffet-empty">As tarefas atribuídas aparecerão aqui.</p>}</div></section>
    </>}
    {tab === 'memories' && <GuestPhotoAlbum weddingId={weddingId} notify={notify} confirmAction={confirmAction} />}
    {tab === 'expenses' && !isReader && !isEditor && <WeddingExpenseManager weddingId={weddingId} expenses={expenses} onReload={() => loadWeddingData(weddingId)} />}
    {tab === 'site' && <CoupleSiteEditor key={weddingId} wedding={wedding} events={events} gifts={gifts} config={siteConfig} savedConfig={savedSiteConfig} publishedConfig={publishedSiteConfig} publishedAt={sitePublishedAt} setConfig={setSiteConfig} onSave={saveSiteDraft} onPublish={publishSite} saving={siteConfigLoading} confirmAction={confirmAction} notify={notify} />}
   </div></main><footer className="role-footer"><span>Área dos noivos</span><a href="https://henriquesouzas.com" target="_blank" rel="noreferrer">henriquesouzas.com</a></footer></div>
}

function WeddingExpenseManager({ weddingId, expenses, onReload }) {
  const [draft, setDraft] = useState({ supplierName: '', supplierContact: '', category: '', description: '', totalAmount: '', dueDate: '', reminderEnabled: false })
  const [editingId, setEditingId] = useState('')
  const [payments, setPayments] = useState({})
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const activeExpenses = expenses.filter((expense) => expense.status === 'active')
  const totals = activeExpenses.reduce((sum, expense) => ({
    total: sum.total + expense.total_amount_cents,
    paid: sum.paid + expense.paid_amount_cents,
  }), { total: 0, paid: 0 })

  function resetDraft() {
    setDraft({ supplierName: '', supplierContact: '', category: '', description: '', totalAmount: '', dueDate: '', reminderEnabled: false })
    setEditingId('')
  }

  async function submit(event) {
    event.preventDefault()
    const totalAmountCents = parseBrlCents(draft.totalAmount)
    if (totalAmountCents === null || totalAmountCents < 1) {
      setError('Informem um valor total válido em reais.')
      return
    }
    setBusy(true)
    setError('')
    try {
      const response = await fetch(`/api/couple/weddings/${weddingId}/expenses${editingId ? `/${editingId}` : ''}`, {
        method: editingId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...draft, totalAmountCents, dueDate: draft.dueDate || null }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'expense_save_failed')
      resetDraft()
      await onReload()
    } catch (cause) {
      setError(cause.message === 'expense_total_below_paid_amount' ? 'O valor total não pode ficar abaixo do que já foi registrado como pago.' : 'Não foi possível salvar esta despesa. Tentem novamente.')
    } finally {
      setBusy(false)
    }
  }

  function startEdit(expense) {
    setEditingId(expense.id)
    setDraft({ supplierName: expense.supplier_name, supplierContact: expense.supplier_contact, category: expense.category, description: expense.description, totalAmount: (expense.total_amount_cents / 100).toFixed(2), dueDate: expense.due_date || '', reminderEnabled: expense.reminder_enabled })
    document.getElementById('wedding-expense-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  async function archive(expense) {
    setBusy(true)
    setError('')
    try {
      const response = await fetch(`/api/couple/weddings/${weddingId}/expenses/${expense.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'archived' }) })
      if (!response.ok) throw new Error('expense_archive_failed')
      await onReload()
    } catch {
      setError('Não foi possível arquivar este registro.')
    } finally {
      setBusy(false)
    }
  }

  async function addPayment(expense) {
    const payment = payments[expense.id] || { amount: '', paidAt: new Date().toISOString().slice(0, 10), notes: '' }
    const amountCents = parseBrlCents(payment.amount)
    if (amountCents === null || amountCents < 1) {
      setError('Informem um valor válido para registrar o pagamento.')
      return
    }
    setBusy(true)
    setError('')
    try {
      const response = await fetch(`/api/couple/weddings/${weddingId}/expenses/${expense.id}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amountCents, paidAt: payment.paidAt, notes: payment.notes }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'expense_payment_failed')
      setPayments((current) => ({ ...current, [expense.id]: { amount: '', paidAt: new Date().toISOString().slice(0, 10), notes: '' } }))
      await onReload()
    } catch (cause) {
      setError(cause.message === 'expense_payment_exceeds_balance' ? 'Esse valor ultrapassa o saldo que falta pagar.' : 'Não foi possível registrar o pagamento.')
    } finally {
      setBusy(false)
    }
  }

  return <div className="wedding-expense-manager">
    <section className="role-card"><div className="role-card-heading"><div><span className="eyebrow">PLANEJAMENTO FINANCEIRO</span><h2>Fornecedores e despesas</h2></div><Wallet size={19} /></div><p className="team-access-note">Registrem contratos, valores pagos e próximos vencimentos. Os pagamentos são anotações privadas do casal; a plataforma não movimenta dinheiro.</p><div className="expense-summary-grid"><article><span>Valor contratado</span><strong>{formatBrlCents(totals.total)}</strong></article><article><span>Registrado como pago</span><strong>{formatBrlCents(totals.paid)}</strong></article><article><span>Saldo previsto</span><strong>{formatBrlCents(totals.total - totals.paid)}</strong></article></div></section>
      <section className="role-card"><div className="role-card-heading"><div><span className="eyebrow">NOVO REGISTRO</span><h2>{editingId ? 'Editar fornecedor ou despesa' : 'Adicionar fornecedor ou despesa'}</h2></div></div><form id="wedding-expense-form" className="wedding-expense-form" onSubmit={submit}><label>Fornecedor<input value={draft.supplierName} maxLength="160" onChange={(event) => setDraft((current) => ({ ...current, supplierName: event.target.value }))} required /></label><label>Contato do fornecedor, opcional<input value={draft.supplierContact} maxLength="254" onChange={(event) => setDraft((current) => ({ ...current, supplierContact: event.target.value }))} /></label><label>Categoria, opcional<input value={draft.category} maxLength="80" onChange={(event) => setDraft((current) => ({ ...current, category: event.target.value }))} placeholder="Ex.: decoração" /></label><label>Valor total (R$)<input inputMode="decimal" value={draft.totalAmount} onChange={(event) => setDraft((current) => ({ ...current, totalAmount: event.target.value }))} placeholder="0,00" required /></label><label>Próximo vencimento<input type="date" value={draft.dueDate} onChange={(event) => setDraft((current) => ({ ...current, dueDate: event.target.value, reminderEnabled: event.target.value ? current.reminderEnabled : false }))} /></label><label className="expense-reminder-toggle"><input type="checkbox" checked={draft.reminderEnabled} disabled={!draft.dueDate} onChange={(event) => setDraft((current) => ({ ...current, reminderEnabled: event.target.checked }))} /><span>Incluir no resumo mensal por e-mail{!draft.dueDate && <small>Informe um vencimento para ativar.</small>}</span></label><label className="expense-description-field">Descrição e observações<textarea rows="3" maxLength="2000" value={draft.description} onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))} /></label><div className="expense-form-actions"><button className="button-primary" disabled={busy} type="submit">{busy ? 'Salvando…' : editingId ? 'Salvar alterações' : 'Adicionar registro'} <Check size={15} /></button>{editingId && <button className="button-outline" disabled={busy} type="button" onClick={resetDraft}>Cancelar</button>}</div></form>{error && <p className="admin-form-error" role="alert">{error}</p>}</section>
    <section className="role-card"><div className="role-card-heading"><div><span className="eyebrow">REGISTROS DO CASAMENTO</span><h2>Despesas cadastradas</h2></div><span className="task-count">{activeExpenses.length} ativas</span></div><div className="wedding-expense-list">{expenses.map((expense) => { const remaining = expense.total_amount_cents - expense.paid_amount_cents; const payment = payments[expense.id] || { amount: '', paidAt: new Date().toISOString().slice(0, 10), notes: '' }; return <article className={expense.status === 'archived' ? 'is-archived' : ''} key={expense.id}><div className="wedding-expense-heading"><div><strong>{expense.supplier_name}</strong><small>{[expense.category, expense.description].filter(Boolean).join(' · ') || 'Sem descrição adicional'}</small></div><span className={`admin-state ${expense.status === 'active' ? 'admin-state-active' : ''}`}>{expense.status === 'active' ? 'Ativa' : 'Arquivada'}</span></div><div className="wedding-expense-values"><span>Contrato <strong>{formatBrlCents(expense.total_amount_cents)}</strong></span><span>Pago <strong>{formatBrlCents(expense.paid_amount_cents)}</strong></span><span>Saldo <strong>{formatBrlCents(remaining)}</strong></span><span>Vencimento <strong>{expense.due_date ? new Date(`${expense.due_date}T12:00:00`).toLocaleDateString('pt-BR') : 'Não informado'}</strong></span></div>{expense.supplier_contact && <p className="team-access-note">Contato: {expense.supplier_contact}</p>}{expense.status === 'active' && <><details className="expense-payment-details"><summary>Registrar pagamento</summary><div className="expense-payment-form"><label>Valor pago (R$)<input inputMode="decimal" value={payment.amount} onChange={(event) => setPayments((current) => ({ ...current, [expense.id]: { ...payment, amount: event.target.value } }))} placeholder="0,00" /></label><label>Data<input type="date" value={payment.paidAt} onChange={(event) => setPayments((current) => ({ ...current, [expense.id]: { ...payment, paidAt: event.target.value } }))} /></label><label>Observação<input value={payment.notes} maxLength="500" onChange={(event) => setPayments((current) => ({ ...current, [expense.id]: { ...payment, notes: event.target.value } }))} /></label><button className="button-outline" type="button" disabled={busy || remaining === 0} onClick={() => addPayment(expense)}>Salvar pagamento</button></div></details><div className="wedding-expense-actions"><button className="button-outline" type="button" disabled={busy} onClick={() => startEdit(expense)}>Editar</button><button className="button-outline" type="button" disabled={busy} onClick={() => archive(expense)}>Arquivar</button></div></>}{expense.payments.length > 0 && <details className="expense-payment-history"><summary>Histórico de pagamentos ({expense.payments.length})</summary><ul>{expense.payments.map((item) => <li key={item.id}><span>{new Date(`${item.paid_at}T12:00:00`).toLocaleDateString('pt-BR')} · {item.notes || 'Pagamento registrado'}</span><strong>{formatBrlCents(item.amount_cents)}</strong></li>)}</ul></details>}</article> })}{!expenses.length && <p className="buffet-empty">Adicionem o primeiro fornecedor para acompanhar valores e vencimentos.</p>}</div></section>
  </div>
}

function GiftPresentationManager({ weddingId, gifts, config, setConfig, onSave, onPublish, saving }) {
  const [media, setMedia] = useState([])
  const [mediaUrls, setMediaUrls] = useState({})
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const photoInputs = useRef({})
  const mediaUrlRegistry = useRef(new Set())
  const selectedPhotos = Object.values(config.giftPresentation || {}).map((item) => item?.photoId).filter(Boolean)
  const giftDisplayMode = ['inline', 'page', 'hidden'].includes(config.giftDisplayMode) ? config.giftDisplayMode : (config.enabledSections || []).includes('Lista de presentes') ? 'inline' : 'hidden'
  const pixDisplayMode = ['inline', 'page', 'hidden'].includes(config.pixDisplayMode) ? config.pixDisplayMode : config.pix?.enabled ? 'inline' : 'hidden'

  useEffect(() => {
    let active = true
    fetch(`/api/couple/weddings/${weddingId}/site-media`).then(async (response) => {
      if (!response.ok) throw new Error('Não foi possível carregar as fotos do casamento.')
      return response.json()
    }).then((result) => {
      if (active) setMedia(result.media || [])
    }).catch((cause) => {
      if (active) setError(cause.message)
    }).finally(() => {
      if (active) setLoading(false)
    })
    return () => { active = false }
  }, [weddingId])

  useEffect(() => {
    let active = true
    const ids = [...new Set(selectedPhotos)].filter((id) => !mediaUrls[id])
    if (!ids.length) return undefined
      Promise.all(ids.map(async (id) => {
      const response = await fetch(`/api/site-media/${id}`)
      if (!response.ok) return [id, null]
      const url = URL.createObjectURL(await response.blob())
      mediaUrlRegistry.current.add(url)
      return [id, url]
    })).then((entries) => {
      if (active) setMediaUrls((current) => ({ ...current, ...Object.fromEntries(entries.filter(([, url]) => url)) }))
    }).catch(() => {})
    return () => { active = false }
  }, [weddingId, JSON.stringify(selectedPhotos), JSON.stringify(Object.keys(mediaUrls))])

  useEffect(() => () => mediaUrlRegistry.current.forEach((url) => URL.revokeObjectURL(url)), [])

  function updateGiftPresentation(giftId, values) {
    setConfig((current) => ({ ...current, giftPresentation: { ...current.giftPresentation, [giftId]: { category: 'Outros', ...current.giftPresentation?.[giftId], ...values } } }))
  }

  async function uploadGiftPhoto(file, giftId) {
    if (!file) return
    setBusy(true)
    setError('')
    try {
      if (!file.type.startsWith('image/')) throw new Error('Escolha um arquivo de imagem compatível com o navegador.')
      let bitmap
      try {
        bitmap = await createImageBitmap(file)
      } catch {
        throw new Error('Não foi possível abrir esta imagem. Salve-a como JPG, PNG ou WebP e tente novamente.')
      }
      const scale = Math.min(1, 2400 / Math.max(bitmap.width, bitmap.height))
      const canvas = document.createElement('canvas')
      canvas.width = Math.max(1, Math.round(bitmap.width * scale))
      canvas.height = Math.max(1, Math.round(bitmap.height * scale))
      const context = canvas.getContext('2d')
      if (!context) {
        bitmap.close()
        throw new Error('Não foi possível preparar esta imagem. Tente outra vez.')
      }
      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
      bitmap.close()
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/webp', 0.84))
      if (!blob) throw new Error('Não foi possível preparar esta imagem. Tente outra vez.')
      const upload = new File([blob], 'foto.webp', { type: 'image/webp' })
      const body = new FormData()
      body.set('file', upload)
      body.set('mediaType', 'image')
      const response = await fetch(`/api/couple/weddings/${weddingId}/site-media`, { method: 'POST', body })
      const result = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(result.error === 'gallery_limit_reached' ? `O casamento já atingiu o limite de ${SITE_MEDIA_LIMITS.photosPerWedding} fotos.` : result.error === 'media_storage_unavailable' || result.error === 'media_storage_write_failed' ? 'O armazenamento está indisponível agora. Tente novamente em alguns minutos.' : 'Não foi possível guardar esta foto. Tente novamente.')
      setMedia((current) => [...current, result])
      updateGiftPresentation(giftId, { photoId: result.id })
    } catch (cause) {
      setError(cause.message || 'Não foi possível guardar esta foto.')
    } finally {
      setBusy(false)
      Object.values(photoInputs.current).forEach((input) => { if (input) input.value = '' })
    }
  }

  return <section className="role-card"><div className="role-card-heading"><div><span className="eyebrow">APRESENTAÇÃO DOS PRESENTES</span><h2>Organizar presentes</h2></div><Gift size={19} /></div><p className="team-access-note">Categorias, fotos e formas de exibir a lista ficam nesta área. As alterações são aplicadas ao convite quando salvas ou publicadas.</p><div className="customizer-section-toggles"><label><input type="checkbox" checked={giftDisplayMode !== 'hidden'} onChange={(event) => setConfig((current) => ({ ...current, giftDisplayMode: event.target.checked ? 'inline' : 'hidden' }))} /><span>Mostrar presentes no convite</span></label></div>{giftDisplayMode !== 'hidden' && <label className="font-pair-label">Como os presentes aparecem<select value={giftDisplayMode} onChange={(event) => setConfig((current) => ({ ...current, giftDisplayMode: event.target.value }))}><option value="inline">Exibir presentes diretamente no convite</option><option value="page">Mostrar somente o botão “Ver lista de presentes”</option></select></label>}<div className="customizer-section-toggles"><label><input type="checkbox" checked={pixDisplayMode !== 'hidden'} disabled={!config.pix?.key?.trim() && pixDisplayMode === 'hidden'} onChange={(event) => setConfig((current) => ({ ...current, pixDisplayMode: event.target.checked ? 'inline' : 'hidden', pix: { ...current.pix, enabled: event.target.checked && Boolean(current.pix?.key?.trim()) } }))} /><span>Mostrar Pix no convite</span></label></div>{pixDisplayMode !== 'hidden' && <label className="font-pair-label">Como o Pix aparece<select value={pixDisplayMode} onChange={(event) => setConfig((current) => ({ ...current, pixDisplayMode: event.target.value, pix: { ...current.pix, enabled: event.target.value === 'hidden' ? Boolean(current.pix?.enabled) : Boolean(current.pix?.key?.trim()) } }))}><option value="inline">Exibir chave Pix diretamente no convite</option><option value="page" disabled={!config.pix?.key?.trim()}>Mostrar somente o botão “Presentear via Pix”</option></select>{!config.pix?.key?.trim() && <small>Cadastrem a chave Pix abaixo para ativar esta opção.</small>}</label>}{loading ? <p className="team-access-note">Carregando as fotos do casamento…</p> : gifts.some((gift) => gift.status === 'active') ? <div className="customizer-gift-presentation-editor">{gifts.filter((gift) => gift.status === 'active').map((gift) => { const photoId = config.giftPresentation?.[gift.id]?.photoId || ''; const photo = mediaUrls[photoId]; return <fieldset key={gift.id}><legend>{gift.title}</legend><label className="font-pair-label">Categoria<select value={config.giftPresentation?.[gift.id]?.category || 'Outros'} onChange={(event) => updateGiftPresentation(gift.id, { category: event.target.value })}>{GIFT_CATEGORIES.map((category) => <option key={category} value={category}>{category}</option>)}</select></label><label className="font-pair-label">Foto do produto, opcional<select value={photoId} onChange={(event) => updateGiftPresentation(gift.id, { photoId: event.target.value || null })}><option value="">Sem foto</option>{media.filter((item) => item.mediaType === 'image').map((image) => <option key={image.id} value={image.id}>Foto enviada · {image.id.slice(0, 8)}</option>)}</select></label>{photo && <img className="gift-presentation-preview-image" src={photo} alt={`Foto escolhida para ${gift.title}`} />}<input ref={(element) => { photoInputs.current[gift.id] = element }} type="file" accept="image/*" hidden onChange={(event) => uploadGiftPhoto(event.target.files?.[0], gift.id)} /><button type="button" className="button-outline" disabled={busy || media.filter((item) => item.mediaType === 'image').length >= SITE_MEDIA_LIMITS.photosPerWedding} onClick={() => photoInputs.current[gift.id]?.click()}><Camera size={15} /> Enviar foto do presente</button></fieldset> })}</div> : <p className="team-access-note">Cadastrem presentes acima para escolher categorias e fotos para cada item.</p>}{error && <p className="admin-form-error" role="alert">{error}</p>}<div className="gift-form-actions"><button type="button" className="button-outline" disabled={saving} onClick={() => onSave(null, config)}>{saving ? 'Salvando…' : 'Salvar rascunho'}</button><button type="button" className="button-primary" disabled={saving} onClick={() => onPublish(null, config)}>{saving ? 'Publicando…' : 'Salvar e publicar no convite'} <Check size={15} /></button></div></section>
}

function GuestPhotoAlbum({ weddingId, notify, confirmAction }) {
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
    if (!await confirmAction(`Remover a foto enviada por ${photo.guest_name}?`, 'Remover foto', 'Remover', true)) return
    setBusyPhoto(photo.id)
    try {
      const response = await fetch(`/api/couple/weddings/${weddingId}/photos/${photo.id}`, { method: 'DELETE' })
      if (!response.ok) throw new Error('Não foi possível remover esta foto.')
      setPhotos((current) => current.filter((item) => item.id !== photo.id))
      notify('Foto removida do álbum')
    } catch (cause) {
      setError(cause.message)
    } finally {
      setBusyPhoto('')
    }
  }

  return <section className="role-card guest-photo-album"><div className="role-card-heading"><div><span className="eyebrow">LEMBRANÇAS DA CELEBRAÇÃO</span><h2>Fotos pelos olhos dos convidados</h2></div><button className="button-outline photo-album-print-button" onClick={() => window.print()} disabled={!photos.length}><Printer size={15} /> Salvar álbum em PDF</button></div><p>As fotos aparecem aqui com o nome de quem registrou o momento. Na impressão do navegador, escolha “Salvar como PDF” para guardar um álbum que se adapta à tela e ao papel.</p>{error && <p className="admin-form-error" role="alert">{error}</p>}{loading ? <p>Carregando as lembranças…</p> : photos.length ? <div className="guest-photo-grid">{photos.map((photo) => <figure key={photo.id}><img src={`/api/couple/weddings/${weddingId}/photos/${photo.id}/image`} alt={`Foto enviada por ${photo.guest_name} no evento ${photo.event_name}`} loading="lazy" /><figcaption><span><strong>{photo.guest_name}</strong><small>{photo.event_name} · {new Date(photo.created_at).toLocaleDateString('pt-BR')}</small></span><button className="button-outline guest-remove-button photo-remove-button" onClick={() => removePhoto(photo)} disabled={busyPhoto === photo.id} aria-label={`Remover foto enviada por ${photo.guest_name}`}><Trash2 size={14} /></button></figcaption></figure>)}</div> : <div className="guest-photo-empty"><Camera size={23} /><strong>O álbum começa com uma foto espontânea.</strong><span>Ativem a câmera na personalização do convite. O álbum tem um limite total compartilhado por todos os convidados.</span></div>}</section>
}

function PublishedOnlyDashboard({ account, wedding, config, events, publishedAt, onLogout }) {
  const published = publishedAt ? new Date(publishedAt).toLocaleString('pt-BR') : 'Ainda não publicado'
  return <div className="role-page couple-role-page"><header className="role-header"><a className="role-brand" href="/"><span>e<span>&</span>t</span><strong>Conteúdo publicado</strong></a><span className="role-preview">Acesso: {account?.email}</span><button className="button-outline" onClick={onLogout}>Sair</button></header><main className="role-main"><div className="role-intro"><span className="role-icon"><Eye size={19} /></span><span className="eyebrow">ACESSO DE LEITURA</span><h1>{wedding.partner_one_name} & {wedding.partner_two_name}</h1><p>Esta área mostra apenas a última versão publicada do site e dos eventos.</p></div><section className="role-card published-reader-card"><div className="role-card-heading"><div><span className="eyebrow">SITE DOS NOIVOS</span><h2>{config?.coverMessages?.['pt-BR'] || 'Convite do casamento'}</h2></div><span className="admin-state admin-state-active">Publicado</span></div><p>Endereço curto: {wedding.slug}</p><p>Estilo: {config?.theme || 'garden'} · Capa: {config?.coverLayout || 'full'} · Idioma: {config?.language || 'pt-BR'}</p><div className="browser-below published-reader-sections">{(config?.enabledSections || []).map((section) => <span key={section}>{section}</span>)}</div><small>Última publicação: {published}</small></section><section className="role-card"><div className="role-card-heading"><div><span className="eyebrow">PROGRAMAÇÃO PUBLICADA</span><h2>Eventos</h2></div><span className="task-count">{events.length} eventos</span></div>{events.length ? <div className="wedding-event-list">{events.map((event) => <article key={event.id}><div><strong>{event.name}</strong><small>{event.starts_at ? new Date(event.starts_at).toLocaleString('pt-BR') : 'Data a definir'} · {event.venue_name || 'Local a definir'}</small>{event.address && <small>{event.address}</small>}</div><span className="admin-state admin-state-active">{event.event_type}</span></article>)}</div> : <p className="buffet-empty">Nenhum evento está publicado.</p>}</section></main><footer className="role-footer"><span>Leitura do site publicado</span><a href="https://henriquesouzas.com" target="_blank" rel="noreferrer">henriquesouzas.com</a></footer></div>
}

function SitePhotoLibrary({ images, totalImages = images.length, mediaUrls, mediaLoadErrors, coverPhotoId, coverGallery, siteGallery, siteCarouselPhotos, siteCarouselEnabled, siteCarouselAutoplay, coverCarouselEnabled, mediaBusy, mediaError, remaining, coverInput, onUpload, onCoverSelect, onCarouselToggle, onCarouselPhotoToggle, onSitePhotoToggle, onSiteCarouselToggle, onSiteCarouselPhotoToggle, onReorderSiteCarousel, onSiteCarouselAutoplayToggle, onImageError, onDelete }) {
  return <section className="customizer-photo-library" aria-labelledby="customizer-photo-library-title">
    <div className="customizer-photo-library-heading"><div><span className="eyebrow">FOTOS DO CASAL</span><h4 id="customizer-photo-library-title">Capa, carrossel e galeria do site</h4><p>Enviem cada foto uma vez e escolham onde ela aparece. Até {SITE_MEDIA_LIMITS.photosPerWedding} imagens no total.</p></div><span className="customizer-photo-count">{totalImages}/{SITE_MEDIA_LIMITS.photosPerWedding} fotos</span></div>
    <div className="customizer-photo-upload-actions"><input ref={coverInput} type="file" accept="image/*" multiple hidden onChange={(event) => onUpload(event, 'cover')} /><button type="button" className="button-outline" disabled={mediaBusy || remaining < 1} onClick={() => coverInput.current?.click()}><Camera size={17} /> Adicionar foto</button></div>
    <small>As fotos são reduzidas para facilitar o envio pelo celular. MP4 até 15 MB; imagens até 8 MB após a redução.</small>
    {mediaError && <p className="admin-form-error" role="alert">{mediaError}</p>}
    <label className="customizer-carousel-toggle"><input type="checkbox" checked={coverCarouselEnabled} disabled={coverGallery.length < 2} onChange={(event) => onCarouselToggle(event.target.checked)} /><span><strong>Ativar carrossel na capa</strong><small>{coverGallery.length < 2 ? 'Marquem pelo menos duas fotos como carrossel.' : 'As fotos escolhidas alternam na abertura do convite.'}</small></span></label>
    <label className="customizer-carousel-toggle"><input type="checkbox" checked={siteCarouselEnabled} disabled={siteCarouselPhotos.length === 0} onChange={(event) => onSiteCarouselToggle(event.target.checked)} /><span><strong>Exibir carrossel no convite</strong><small>{siteCarouselPhotos.length ? `${siteCarouselPhotos.length} foto(s) selecionada(s), em uma seção após a história e antes dos eventos.` : 'Escolham pelo menos uma foto abaixo para exibir o carrossel.'}</small></span></label>
    {siteCarouselEnabled && <label className="customizer-carousel-toggle customizer-carousel-autoplay"><input type="checkbox" checked={siteCarouselAutoplay} disabled={siteCarouselPhotos.length < 2} onChange={(event) => onSiteCarouselAutoplayToggle(event.target.checked)} /><span><strong>Reproduzir automaticamente</strong><small>{siteCarouselPhotos.length < 2 ? 'Selecionem duas ou mais fotos para ativar a reprodução.' : 'Avança suavemente a cada 5 segundos.'}</small></span></label>}
    {siteCarouselPhotos.length > 0 && <ol className="customizer-photo-carousel-order" aria-label="Ordem das fotos do carrossel">{siteCarouselPhotos.map((id, index) => <li key={id}><span>{mediaUrls[id] ? <img src={mediaUrls[id]} alt="" /> : <span className="customizer-photo-loading">{index + 1}</span>}<strong>Foto {index + 1}</strong></span><div><button type="button" className="button-outline" aria-label={`Mover foto ${index + 1} para antes`} disabled={index === 0} onClick={() => onReorderSiteCarousel(id, -1)}><ArrowLeft size={14} /></button><button type="button" className="button-outline" aria-label={`Mover foto ${index + 1} para depois`} disabled={index === siteCarouselPhotos.length - 1} onClick={() => onReorderSiteCarousel(id, 1)}><ArrowRight size={14} /></button></div></li>)}</ol>}
    {images.length > 0 ? <div className="customizer-photo-library-grid">{images.map((item) => { const carouselIndex = siteCarouselPhotos.indexOf(item.id); return <article className="customizer-photo-library-item" key={item.id}>{mediaUrls[item.id] && !mediaLoadErrors.includes(item.id) ? <img src={mediaUrls[item.id]} alt="Foto enviada pelo casal" onError={() => onImageError(item.id)} /> : <span className="customizer-photo-loading">{mediaLoadErrors.includes(item.id) ? 'Foto indisponível' : 'Carregando foto…'}</span>}<div className="customizer-photo-roles"><label><input type="radio" name="cover-photo-choice" checked={coverPhotoId === item.id} onChange={() => onCoverSelect(item.id)} /> Foto principal</label><label><input type="checkbox" checked={coverGallery.includes(item.id)} disabled={coverCarouselEnabled && coverPhotoId === item.id} onChange={(event) => onCarouselPhotoToggle(item.id, event.target.checked)} /> No carrossel da capa</label><label><input type="checkbox" checked={siteGallery.includes(item.id)} onChange={(event) => onSitePhotoToggle(item.id, event.target.checked)} /> Galeria do site</label><label><input type="checkbox" checked={carouselIndex >= 0} onChange={(event) => onSiteCarouselPhotoToggle(item.id, event.target.checked)} /> No carrossel do convite</label>{carouselIndex >= 0 && <small>Posição: {carouselIndex + 1}</small>}</div><button type="button" className="customizer-delete-photo-button" disabled={mediaBusy} onClick={() => onDelete(item)}><Trash2 size={14} /> Excluir foto</button></article> })}</div> : <div className="customizer-photo-library-empty"><Camera size={23} /><strong>{totalImages ? 'As fotos dos produtos ficam organizadas na aba Presentes.' : 'Adicionem as fotos que querem compartilhar.'}</strong><span>{totalImages ? 'Enviem ou escolham fotos para a capa e a galeria nesta etapa.' : 'As imagens ficam privadas no rascunho até vocês publicarem o site.'}</span></div>}
  </section>
}

function CoupleSiteEditor({ wedding, events = [], gifts = [], config, savedConfig, publishedConfig, publishedAt, setConfig, onSave, onPublish, saving, confirmAction, notify }) {
  const [device, setDevice] = useState('desktop')
  const [previewPage, setPreviewPage] = useState('invitation')
  const [step, setStep] = useState('visual')
  const [partnerOneName, setPartnerOneName] = useState(wedding?.partner_one_name || '')
  const [partnerTwoName, setPartnerTwoName] = useState(wedding?.partner_two_name || '')
  const [eventDate, setEventDate] = useState(wedding?.event_date || '')
  const [eventTime, setEventTime] = useState(wedding?.event_time || '')
  const [siteMedia, setSiteMedia] = useState([])
  const [mediaUrls, setMediaUrls] = useState({})
  const [mediaBusy, setMediaBusy] = useState(false)
  const [mediaError, setMediaError] = useState('')
  const [mediaLoadErrors, setMediaLoadErrors] = useState([])
  const [photoAccentSuggestions, setPhotoAccentSuggestions] = useState([])
  const mediaUrlRegistry = useRef(new Set())
  const [previewCoverIndex, setPreviewCoverIndex] = useState(0)
  const [draftHistory, setDraftHistory] = useState(() => createSiteDraftHistory({ config, profile: { partnerOneName, partnerTwoName, eventDate, eventTime } }))
  const [autosaveStatus, setAutosaveStatus] = useState('saved')
  const photoInput = useRef(null)
  const videoInput = useRef(null)
  const autosaveTimer = useRef(null)
  const autosaveRun = useRef({ running: false, pending: false })
  const latestDraft = useRef(null)
  const saveDraftRef = useRef(onSave)
  const theme = THEMES.find((item) => item.id === config.theme) || THEMES[0]
  const palettes = getThemePalettes(theme, config.customAccent)
  const selectedPalette = palettes[config.paletteIndex] || palettes[0]
  const selectedFonts = SITE_FONT_PAIRS[config.fontPair] || SITE_FONT_PAIRS[THEME_PRESETS[theme.id]?.fontPair] || SITE_FONT_PAIRS['Clássico editorial']
  const coverLayouts = [{ id: 'side', label: 'Lado a lado' }, { id: 'overlay', label: 'Sobre a foto' }, { id: 'editorial', label: 'Editorial' }]
  const coverLayout = coverLayouts.some((item) => item.id === config.coverLayout) ? config.coverLayout : 'full'
  const coverComposition = ['side', 'overlay', 'editorial'].includes(config.coverComposition) ? config.coverComposition : config.coverLayout === 'split' ? 'side' : config.coverLayout === 'full' ? 'overlay' : null
  const coverImagePositionDesktop = config.coverImagePositionDesktop || config.coverImagePosition || 'center'
  const coverImagePositionMobile = config.coverImagePositionMobile || coverImagePositionDesktop
  const draftChanged = JSON.stringify(config) !== JSON.stringify(savedConfig)
  const profile = { partnerOneName, partnerTwoName, eventDate: eventDate || null, eventTime: eventTime || null }
  const historySnapshot = { config, profile: { partnerOneName, partnerTwoName, eventDate, eventTime } }
  latestDraft.current = { config, profile }
  const profileChanged = partnerOneName !== (wedding?.partner_one_name || '') || partnerTwoName !== (wedding?.partner_two_name || '') || eventDate !== (wedding?.event_date || '') || eventTime !== (wedding?.event_time || '')
  const published = publishedAt ? new Date(publishedAt).toLocaleString('pt-BR') : ''
  const language = 'pt-BR'

  useEffect(() => {
    saveDraftRef.current = onSave
  }, [onSave])

  useEffect(() => {
    setDraftHistory((current) => recordSiteDraftChange(current, historySnapshot))
  }, [wedding?.id, config, partnerOneName, partnerTwoName, eventDate, eventTime])

  useEffect(() => {
    if (!draftChanged && !profileChanged) {
      setAutosaveStatus('saved')
      return undefined
    }
    if (saving) return undefined
    autosaveRun.current.pending = true
    setAutosaveStatus('waiting')
    window.clearTimeout(autosaveTimer.current)
    autosaveTimer.current = window.setTimeout(async () => {
      if (autosaveRun.current.running) return
      autosaveRun.current.running = true
      setAutosaveStatus('saving')
      let saveFailed = false
      while (autosaveRun.current.pending) {
        autosaveRun.current.pending = false
        const snapshot = latestDraft.current
        const succeeded = await saveDraftRef.current(snapshot.profile, snapshot.config, { silent: true })
        if (!succeeded) {
          saveFailed = true
          break
        }
        if (JSON.stringify(latestDraft.current) !== JSON.stringify(snapshot)) autosaveRun.current.pending = true
      }
      autosaveRun.current.running = false
      setAutosaveStatus(saveFailed ? 'error' : 'saved')
    }, 700)
    return () => window.clearTimeout(autosaveTimer.current)
  }, [wedding?.id, config, partnerOneName, partnerTwoName, eventDate, eventTime, draftChanged, profileChanged, saving])

  function restoreDraftHistory(nextHistory) {
    if (nextHistory === draftHistory) return
    setDraftHistory(nextHistory)
    setConfig(nextHistory.present.config)
    setPartnerOneName(nextHistory.present.profile.partnerOneName)
    setPartnerTwoName(nextHistory.present.profile.partnerTwoName)
    setEventDate(nextHistory.present.profile.eventDate)
    setEventTime(nextHistory.present.profile.eventTime)
  }

  function undoDraftChange() {
    restoreDraftHistory(undoSiteDraft(draftHistory))
  }

  function redoDraftChange() {
    restoreDraftHistory(redoSiteDraft(draftHistory))
  }
  const coverMessage = config.coverMessages?.[language] || config.coverMessages?.['pt-BR'] || ''
  const storyMessage = config.storyMessages?.[language] || config.storyMessages?.['pt-BR'] || ''
  const storyEnabled = (config.enabledSections || []).includes('Nossa história')
  const eventsEnabled = (config.enabledSections || []).includes('Eventos')
  const giftDisplayMode = ['inline', 'page', 'hidden'].includes(config.giftDisplayMode) ? config.giftDisplayMode : (config.enabledSections || []).includes('Lista de presentes') ? 'inline' : 'hidden'
  const giftsEnabled = giftDisplayMode !== 'hidden'
  const timelineEnabled = (config.enabledSections || []).includes('Linha do tempo')
  const countdownEnabled = (config.enabledSections || []).includes('Contagem regressiva')
  const timelineItems = config.timeline || []
  const giftPresentation = config.giftPresentation || {}
  const siteCarouselPhotos = config.siteCarouselPhotos || []
  const pixDisplayMode = ['inline', 'page', 'hidden'].includes(config.pixDisplayMode) ? config.pixDisplayMode : config.pix?.enabled ? 'inline' : 'hidden'
  const previewPixEnabled = Boolean(config.pix?.enabled && config.pix.key?.trim() && pixDisplayMode !== 'hidden')
  const previewGifts = giftsEnabled ? gifts.filter((gift) => gift.fulfillment_type === 'store_link' || previewPixEnabled) : []
  const previewCoverId = config.coverCarouselEnabled && config.coverGallery?.length ? config.coverGallery[previewCoverIndex] : config.coverPhotoId
  const previewPhotoUrl = mediaUrls[previewCoverId]
  const previewVideoUrl = mediaUrls[config.coverVideoId]
  const previewHasCover = Boolean(previewVideoUrl || previewPhotoUrl)
  const uploadedImages = siteMedia.filter((item) => item.mediaType === 'image')
  const siteGallery = config.siteGallery || []
  const godparents = config.godparents || []
  const nonGiftMediaIds = new Set([config.coverPhotoId, ...(config.coverGallery || []), ...siteGallery, ...siteCarouselPhotos, ...(config.timeline || []).map((item) => item.photoId), ...godparents.map((item) => item.photoId)].filter(Boolean))
  const giftOnlyPhotoIds = new Set(Object.values(config.giftPresentation || {}).map((item) => item?.photoId).filter((id) => id && !nonGiftMediaIds.has(id)))
  const customizerImages = uploadedImages.filter((image) => !giftOnlyPhotoIds.has(image.id))
  const remainingPhotoSlots = Math.max(0, SITE_MEDIA_LIMITS.photosPerWedding - uploadedImages.length)
  const update = (values) => setConfig((current) => ({ ...current, ...values }))
  const updateSectionTitle = (section, title) => setConfig((current) => setSiteSectionTitle(current, section, title))
  const updateSectionBody = (section, body) => setConfig((current) => setSiteSectionBody(current, section, body))

  useEffect(() => {
    setPhotoAccentSuggestions([])
    if (!previewPhotoUrl) {
      return undefined
    }
    let active = true
    const image = new window.Image()
    image.onload = () => {
      if (!active) return
      try {
        const canvas = document.createElement('canvas')
        canvas.width = 32
        canvas.height = 32
        const context = canvas.getContext('2d', { willReadFrequently: true })
        if (!context) return setPhotoAccentSuggestions([])
        context.drawImage(image, 0, 0, canvas.width, canvas.height)
        setPhotoAccentSuggestions(extractPhotoColorSuggestions(context.getImageData(0, 0, canvas.width, canvas.height).data))
      } catch {
        setPhotoAccentSuggestions([])
      }
    }
    image.onerror = () => {
      if (active) setPhotoAccentSuggestions([])
    }
    image.src = previewPhotoUrl
    return () => {
      active = false
      image.onload = null
      image.onerror = null
    }
  }, [previewPhotoUrl])
  const selectTheme = (themeId) => {
    const preset = THEME_PRESETS[themeId] || THEME_PRESETS.garden
    update({ theme: themeId, paletteIndex: 0, fontPair: preset.fontPair, coverLayout: preset.coverLayout, coverComposition: preset.coverComposition })
  }
  const toggleSection = (section, enabled) => setConfig((current) => {
    const sections = current.enabledSections || []
    return { ...current, enabledSections: enabled ? [...new Set([...sections, section])] : sections.filter((item) => item !== section) }
  })
  const moveSiteSection = (section, direction) => setConfig((current) => {
    if (!ORDERABLE_SITE_SECTIONS.includes(section)) return current
    const sections = moveSiteSectionOrder(orderedSiteSections(current), section, direction)
    return sections.every((item, index) => item === current.enabledSections?.[index]) ? current : { ...current, enabledSections: sections }
  })
  const toggleStory = () => toggleSection('Nossa história', !storyEnabled)
  const updateTimelineItem = (id, values) => update({ timeline: (config.timeline || []).map((item) => item.id === id ? { ...item, ...values } : item) })
  const addTimelineItem = () => update({ timeline: [...(config.timeline || []), { id: crypto.randomUUID(), title: '', date: '', description: '', photoId: null }] })
  const removeTimelineItem = (id) => update({ timeline: (config.timeline || []).filter((item) => item.id !== id) })
  const updateGodparent = (id, values) => update({ godparents: (config.godparents || []).map((person) => person.id === id ? { ...person, ...values } : person) })
  const addGodparent = () => update({ godparents: [...(config.godparents || []), { id: crypto.randomUUID(), name: '', message: '', photoId: null }] })
  const removeGodparent = (id) => update({ godparents: (config.godparents || []).filter((person) => person.id !== id) })
  const updateStory = (value) => update({ storyMessages: { ...DEFAULT_SITE_CONFIG.storyMessages, ...config.storyMessages, [language]: value } })
  const updateCoverMessage = (value) => update({ coverMessages: { ...DEFAULT_SITE_CONFIG.coverMessages, ...config.coverMessages, [language]: value } })
  const selectCoverPhoto = (id) => setConfig((current) => ({ ...current, coverPhotoId: id, coverGallery: current.coverCarouselEnabled ? [...new Set([id, ...(current.coverGallery || []).filter((item) => item !== id)])] : current.coverGallery || [] }))
  const toggleCarouselPhoto = (id, included) => setConfig((current) => {
    const selected = current.coverGallery || []
    const next = included ? [...new Set([...selected, id])] : selected.filter((item) => item !== id)
    if (current.coverPhotoId && !next.includes(current.coverPhotoId)) next.unshift(current.coverPhotoId)
    return { ...current, coverGallery: next, coverCarouselEnabled: next.length > 1 && (current.coverCarouselEnabled || included) }
  })
  const toggleSitePhoto = (id, included) => setConfig((current) => {
    const selected = current.siteGallery || []
    const next = included ? [...new Set([...selected, id])] : selected.filter((item) => item !== id)
    const enabledSections = next.length
      ? [...new Set([...(current.enabledSections || []), 'Galeria de fotos'])]
      : (current.enabledSections || []).filter((section) => section !== 'Galeria de fotos')
    return { ...current, siteGallery: next, enabledSections }
  })
  const toggleSiteCarouselPhoto = (id, included) => setConfig((current) => {
    const selected = current.siteCarouselPhotos || []
    const photos = included ? [...new Set([...selected, id])] : selected.filter((photoId) => photoId !== id)
    return { ...current, siteCarouselPhotos: photos, siteCarouselEnabled: photos.length ? current.siteCarouselEnabled : false, siteCarouselAutoplay: photos.length > 1 ? current.siteCarouselAutoplay : false }
  })
  const reorderSiteCarouselPhoto = (id, direction) => setConfig((current) => {
    const photos = [...(current.siteCarouselPhotos || [])]
    const index = photos.indexOf(id)
    const target = index + direction
    if (index < 0 || target < 0 || target >= photos.length) return current
    const selected = photos[index]
    photos[index] = photos[target]
    photos[target] = selected
    return { ...current, siteCarouselPhotos: photos }
  })
  const toggleSiteCarousel = (enabled) => setConfig((current) => {
    const active = enabled && (current.siteCarouselPhotos || []).length > 0
    const sections = current.enabledSections || []
    return { ...current, siteCarouselEnabled: active, enabledSections: active ? [...new Set([...sections, 'Galeria de fotos'])] : (current.siteGallery || []).length ? sections : sections.filter((section) => section !== 'Galeria de fotos') }
  })
  const handlePhotoUpload = (event, usage) => {
    const input = event.currentTarget
    const files = [...input.files].slice(0, remainingPhotoSlots)
    files.reduce((queue, file) => queue.then(() => uploadSiteMedia(file, 'image', usage)), Promise.resolve()).finally(() => { input.value = '' })
  }
  const toggleCoverCarousel = (enabled) => update({ coverCarouselEnabled: enabled && (config.coverGallery || []).length > 1 })
  const style = {
    '--forest': selectedPalette[0],
    '--ink': selectedPalette[0],
    '--accent': selectedPalette[1],
    '--paper': selectedPalette[2],
    '--deep': selectedPalette[0],
    '--font-heading': selectedFonts[0],
    '--font-body': selectedFonts[1],
    '--site-text-scale': config.fontScale === 'small' ? '.92' : config.fontScale === 'large' ? '1.1' : '1',
  }

  useEffect(() => {
    setPartnerOneName(wedding?.partner_one_name || '')
    setPartnerTwoName(wedding?.partner_two_name || '')
    setEventDate(wedding?.event_date || '')
    setEventTime(wedding?.event_time || '')
  }, [wedding?.id])

  useEffect(() => {
    const gallery = config.coverGallery || []
    if (!config.coverCarouselEnabled || gallery.length < 2) return undefined
    const timer = window.setInterval(() => setPreviewCoverIndex((current) => (current + 1) % gallery.length), 5000)
    return () => window.clearInterval(timer)
  }, [config.coverCarouselEnabled, JSON.stringify(config.coverGallery || [])])

  useEffect(() => () => mediaUrlRegistry.current.forEach((url) => URL.revokeObjectURL(url)), [])

  useEffect(() => {
    let active = true
    fetch(`/api/couple/weddings/${wedding.id}/site-media`).then((response) => response.ok ? response.json() : { media: [] }).then((result) => { if (active) setSiteMedia(result.media || []) }).catch(() => { if (active) setSiteMedia([]) })
    return () => { active = false }
  }, [wedding.id])

  useEffect(() => {
    let active = true
    const ids = [...new Set([...siteMedia.map((item) => item.id), ...(config.coverPhotoId ? [config.coverPhotoId] : []), ...(config.coverGallery || []), ...(config.siteGallery || []), ...(config.siteCarouselPhotos || []), ...(config.coverVideoId ? [config.coverVideoId] : [])])].filter((id) => !mediaUrls[id])
    if (!ids.length) return () => { active = false }
    Promise.all(ids.map(async (id) => {
      const response = await fetch(`/api/site-media/${id}`)
      if (!response.ok) return [id, null]
      const url = URL.createObjectURL(await response.blob())
      mediaUrlRegistry.current.add(url)
      return [id, url]
    })).then((entries) => {
      if (!active) return
      const loaded = entries.filter(([, url]) => url)
      setMediaUrls((current) => ({ ...current, ...Object.fromEntries(loaded) }))
    }).catch(() => {})
    return () => { active = false }
  }, [wedding.id, JSON.stringify(siteMedia.map((item) => item.id)), JSON.stringify(Object.keys(mediaUrls)), config.coverPhotoId, JSON.stringify(config.coverGallery || []), JSON.stringify(config.siteGallery || []), JSON.stringify(config.siteCarouselPhotos || []), config.coverVideoId])

  useEffect(() => {
    setPreviewCoverIndex(0)
    if (!config.coverCarouselEnabled || (config.coverGallery || []).length < 2) return undefined
    const timer = window.setInterval(() => setPreviewCoverIndex((current) => (current + 1) % config.coverGallery.length), 5000)
    return () => window.clearInterval(timer)
  }, [config.coverCarouselEnabled, JSON.stringify(config.coverGallery || [])])

  async function uploadSiteMedia(file, mediaType, usage = 'cover') {
    if (!file) return
    setMediaError('')
    setMediaBusy(true)
    try {
      let uploadFile = file
      if (mediaType === 'image') {
        if (!file.type.startsWith('image/')) throw new Error('Escolha um arquivo de imagem compatível com o navegador.')
        let bitmap
        try {
          bitmap = await createImageBitmap(file)
        } catch {
          throw new Error('Não foi possível abrir esta imagem no navegador. Salve-a como JPG, PNG ou WebP e tente novamente.')
        }
        const scale = Math.min(1, 2400 / Math.max(bitmap.width, bitmap.height))
        const canvas = document.createElement('canvas')
        canvas.width = Math.max(1, Math.round(bitmap.width * scale))
        canvas.height = Math.max(1, Math.round(bitmap.height * scale))
        const canvasContext = canvas.getContext('2d')
        if (!canvasContext) {
          bitmap.close()
          throw new Error('Não foi possível preparar esta imagem. Tente outra vez.')
        }
        canvasContext.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
        bitmap.close()
        const imageBlob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/webp', 0.84))
        if (!imageBlob) throw new Error('Não foi possível preparar esta imagem. Tente outra vez.')
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(imageBlob.type)) throw new Error('O navegador não conseguiu converter esta imagem para um formato compatível.')
        const extension = imageBlob.type === 'image/png' ? 'png' : imageBlob.type === 'image/jpeg' ? 'jpg' : 'webp'
        uploadFile = new File([imageBlob], `foto.${extension}`, { type: imageBlob.type })
      }
      const body = new FormData()
      body.set('file', uploadFile)
      body.set('mediaType', mediaType)
      const response = await fetch(`/api/couple/weddings/${wedding.id}/site-media`, { method: 'POST', body })
      const result = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(result.error === 'gallery_limit_reached' ? `A galeria aceita até ${SITE_MEDIA_LIMITS.photosPerWedding} fotos.` : result.error === 'video_limit_reached' ? 'A abertura aceita um vídeo.' : result.error === 'invalid_media_size' ? 'O arquivo excede o limite permitido. Imagens até 8 MB e vídeos MP4 até 15 MB.' : result.error === 'unsupported_media_type' || result.error === 'invalid_media_content' ? 'Formato não compatível. Use JPG, PNG ou WebP para fotos e MP4 para vídeo.' : result.error === 'media_storage_unavailable' || result.error === 'media_storage_write_failed' ? 'O armazenamento está indisponível agora. Tente novamente em alguns minutos.' : 'Não foi possível guardar este arquivo. Tente novamente.')
      setSiteMedia((current) => [...current, result])
      const url = URL.createObjectURL(uploadFile)
      setMediaUrls((current) => ({ ...current, [result.id]: url }))
      mediaUrlRegistry.current.add(url)
      if (mediaType === 'image' && !config.coverPhotoId) setConfig((current) => ({ ...current, coverPhotoId: result.id }))
      if (mediaType === 'image' && usage === 'site') setConfig((current) => ({ ...current, siteGallery: [...new Set([...(current.siteGallery || []), result.id])], enabledSections: [...new Set([...(current.enabledSections || []), 'Galeria de fotos'])] }))
      else if (mediaType === 'image') setConfig((current) => ({ ...current, coverPhotoId: current.coverPhotoId || result.id, coverGallery: current.coverCarouselEnabled ? [...new Set([...(current.coverGallery || []), result.id])] : current.coverGallery || [] }))
      else setConfig((current) => ({ ...current, coverVideoId: result.id }))
    } catch (error) {
      setMediaError(error.message)
    } finally {
      setMediaBusy(false)
    }
  }

  async function deleteSiteMedia(item) {
    const usages = []
    for (const [label, current] of [['rascunho', config], ['convite publicado', publishedConfig]]) {
      if (!current) continue
      if (current.coverPhotoId === item.id) usages.push(`${label}: foto principal da capa`)
      if (current.coverGallery?.includes(item.id)) usages.push(`${label}: carrossel da capa`)
      if (current.siteGallery?.includes(item.id)) usages.push(`${label}: galeria do site`)
      if (current.siteCarouselPhotos?.includes(item.id)) usages.push(`${label}: carrossel do convite`)
      if (current.coverVideoId === item.id) usages.push(`${label}: vídeo de abertura`)
      if (current.timeline?.some((milestone) => milestone.photoId === item.id)) usages.push(`${label}: linha do tempo`)
      if (current.godparents?.some((person) => person.photoId === item.id)) usages.push(`${label}: padrinhos e madrinhas`)
      if (Object.values(current.giftPresentation || {}).some((gift) => gift?.photoId === item.id)) usages.push(`${label}: foto de presente`)
    }
    const isPublished = usages.some((usage) => usage.startsWith('convite publicado:'))
    const usageText = usages.length ? `\n\nEsta foto está sendo utilizada na capa ou na galeria do convite. ${isPublished ? 'Substitua-a e publique a alteração antes de excluí-la.' : 'Remova-a desses locais e salve o rascunho antes de excluí-la.'}` : ''
    if (!await confirmAction(`Deseja excluir esta foto? Essa ação não poderá ser desfeita.${usageText}`, 'Excluir foto', 'Excluir foto', true)) return
    setMediaBusy(true)
    setMediaError('')
    try {
      const response = await fetch(`/api/couple/weddings/${wedding.id}/site-media/${item.id}`, { method: 'DELETE' })
      const result = await response.json().catch(() => ({}))
      if (!response.ok) {
        if (result.error === 'site_media_in_use') {
          const isPublished = (result.references || []).some((reference) => reference.startsWith('convite publicado:'))
          throw new Error(isPublished ? 'Esta foto ainda está sendo usada no convite publicado. Escolham outra foto, salvem e publiquem a alteração antes de excluí-la.' : 'Esta foto ainda está sendo usada no rascunho. Escolham outra foto ou removam-na da capa e da galeria; depois salvem o rascunho antes de excluí-la.')
        }
        throw new Error('Não foi possível excluir esta foto. Atualize a página e tente novamente.')
      }
      const url = mediaUrls[item.id]
      if (url) {
        URL.revokeObjectURL(url)
        mediaUrlRegistry.current.delete(url)
      }
      setSiteMedia((current) => current.filter((media) => media.id !== item.id))
      setMediaUrls((current) => Object.fromEntries(Object.entries(current).filter(([id]) => id !== item.id)))
      setMediaLoadErrors((current) => current.filter((id) => id !== item.id))
      setConfig((current) => {
        const siteGallery = (current.siteGallery || []).filter((id) => id !== item.id)
        const siteCarouselPhotos = (current.siteCarouselPhotos || []).filter((id) => id !== item.id)
        const imageAltTexts = Object.fromEntries(Object.entries(current.imageAltTexts || {}).filter(([id]) => id !== item.id))
        return { ...current, coverPhotoId: current.coverPhotoId === item.id ? null : current.coverPhotoId, coverGallery: (current.coverGallery || []).filter((id) => id !== item.id), siteGallery, siteCarouselPhotos, imageAltTexts, siteCarouselEnabled: siteCarouselPhotos.length ? current.siteCarouselEnabled : false, siteCarouselAutoplay: siteCarouselPhotos.length > 1 ? current.siteCarouselAutoplay : false, timeline: (current.timeline || []).map((milestone) => milestone.photoId === item.id ? { ...milestone, photoId: null } : milestone), godparents: (current.godparents || []).map((person) => person.photoId === item.id ? { ...person, photoId: null } : person), giftPresentation: Object.fromEntries(Object.entries(current.giftPresentation || {}).map(([giftId, gift]) => [giftId, gift.photoId === item.id ? { ...gift, photoId: null } : gift])), enabledSections: siteGallery.length ? current.enabledSections : (current.enabledSections || []).filter((section) => section !== 'Galeria de fotos'), coverVideoId: current.coverVideoId === item.id ? null : current.coverVideoId }
      })
      notify('Foto excluída do armazenamento deste casamento.')
    } catch (error) {
      setMediaError(error.message)
    } finally {
      setMediaBusy(false)
    }
  }

  const previewHasGifts = previewGifts.some((gift) => !gift.status || gift.status === 'active')
  const visibleSiteSections = orderedSiteSections(config).filter((section) => ORDERABLE_SITE_SECTIONS.includes(section) && (section !== 'Lista de presentes' || previewHasGifts || previewPixEnabled))
  const previewNavItems = orderedSiteSections(config).flatMap((section) => {
    if (section === 'Nossa história' && storyMessage) return [{ label: getSiteSectionTitle(config, section), href: '#nossa-historia' }]
    if (section === 'Linha do tempo' && timelineItems.some((item) => item.title?.trim())) return [{ label: getSiteSectionTitle(config, section), href: '#historia-marcos' }]
    if (section === 'Padrinhos e madrinhas' && godparents.some((person) => person.name?.trim() && person.photoId)) return [{ label: getSiteSectionTitle(config, section), href: '#padrinhos' }]
    if (section === 'Mural de recados') return [{ label: getSiteSectionTitle(config, section), href: '#mural-de-recados' }]
    if (section === 'Contagem regressiva' && eventDate) return [{ label: getSiteSectionTitle(config, section), href: '#contagem-regressiva' }]
    if (section === 'Eventos' && eventsEnabled) return [{ label: getSiteSectionTitle(config, section), href: '#eventos' }]
    if (section === 'Cronograma' && events.length) return [{ label: getSiteSectionTitle(config, section), href: '#cronograma-do-dia' }]
    if (section === 'Dress code' && config.weddingDetails?.dressCode?.trim()) return [{ label: getSiteSectionTitle(config, section), href: '#dress-code' }]
    if (section === 'Galeria de fotos' && (siteGallery.length || (config.siteCarouselEnabled && siteCarouselPhotos.length))) return [{ label: getSiteSectionTitle(config, section), href: '#fotos-do-casal' }]
    if (section === 'Hospedagem e dicas' && config.sectionContent?.[section]?.['pt-BR']?.body?.trim()) return [{ label: getSiteSectionTitle(config, section), href: '#hospedagem' }]
    if (section === 'Perguntas frequentes' && config.sectionContent?.[section]?.['pt-BR']?.body?.trim()) return [{ label: getSiteSectionTitle(config, section), href: '#perguntas-frequentes' }]
    if (section === 'Playlist' && safeHttpsLink(config.sectionContent?.[section]?.['pt-BR']?.body)) return [{ label: getSiteSectionTitle(config, section), href: '#playlist' }]
    if (section === 'Vídeo' && (config.coverVideoId || safeHttpsLink(config.sectionContent?.[section]?.['pt-BR']?.body))) return [{ label: getSiteSectionTitle(config, section), href: '#video' }]
    if (section === 'Contato' && config.sectionContent?.[section]?.['pt-BR']?.body?.trim()) return [{ label: getSiteSectionTitle(config, section), href: '#contato' }]
    if (section === 'Confirmação de presença') return [{ label: getSiteSectionTitle(config, section), href: '#confirmar-presenca' }]
    return []
  })
  const previewGivingOptions = [
    ...(previewHasGifts ? [{ label: 'Ver lista de presentes', href: giftDisplayMode === 'inline' ? '#presentes' : '?pagina=presentes', onSelect: giftDisplayMode === 'page' ? () => setPreviewPage('gifts') : undefined }] : []),
    ...(previewPixEnabled ? [{ label: 'Presentear via Pix', href: pixDisplayMode === 'inline' ? '#pix' : '?pagina=pix', onSelect: pixDisplayMode === 'page' ? () => setPreviewPage('pix') : undefined }] : []),
  ]

  return <div className="customize-layout simplified-customizer">
    <div className="customize-controls">
      <div className="customizer-wizard-nav" role="tablist" aria-label="Etapas para personalizar o convite">
        <button type="button" role="tab" aria-selected={step === 'visual'} className={step === 'visual' ? 'active' : ''} onClick={() => setStep('visual')}><span>1</span> Aparência</button>
        <button type="button" role="tab" aria-selected={step === 'content'} className={step === 'content' ? 'active' : ''} onClick={() => setStep('content')}><span>2</span> Recado e detalhes</button>
      </div>
      {step === 'visual' ? <section className="dash-card customize-card customizer-step-card">
        <div className="card-heading"><div><span className="eyebrow">PASSO UM</span><h3>Comecem pela foto</h3></div></div>
        <SitePhotoLibrary images={customizerImages} totalImages={uploadedImages.length} mediaUrls={mediaUrls} mediaLoadErrors={mediaLoadErrors} coverPhotoId={config.coverPhotoId} coverGallery={config.coverGallery || []} siteGallery={siteGallery} siteCarouselPhotos={siteCarouselPhotos} siteCarouselEnabled={config.siteCarouselEnabled || false} siteCarouselAutoplay={config.siteCarouselAutoplay || false} coverCarouselEnabled={config.coverCarouselEnabled || false} mediaBusy={mediaBusy} mediaError={mediaError} remaining={remainingPhotoSlots} coverInput={photoInput} onUpload={handlePhotoUpload} onCoverSelect={selectCoverPhoto} onCarouselToggle={toggleCoverCarousel} onCarouselPhotoToggle={toggleCarouselPhoto} onSitePhotoToggle={toggleSitePhoto} onSiteCarouselToggle={toggleSiteCarousel} onSiteCarouselPhotoToggle={toggleSiteCarouselPhoto} onReorderSiteCarousel={reorderSiteCarouselPhoto} onSiteCarouselAutoplayToggle={(enabled) => update({ siteCarouselAutoplay: enabled && siteCarouselPhotos.length > 1 })} onImageError={(id) => setMediaLoadErrors((current) => [...new Set([...current, id])])} onDelete={deleteSiteMedia} />
        <details className="customizer-extra-fields"><summary>Descrições acessíveis das fotos</summary><div><p>Descrevam cada imagem para que leitores de tela expliquem o que aparece nela. Para publicar uma foto usada no convite, preencham a descrição acessível. Fotos fora das seções ativas não bloqueiam a publicação.</p>{uploadedImages.map((item) => <label className="font-pair-label customizer-photo-alt-field" key={item.id}>{mediaUrls[item.id] && <img src={mediaUrls[item.id]} alt="" />}Descrição desta foto<input maxLength={250} value={config.imageAltTexts?.[item.id]?.['pt-BR'] || ''} placeholder="Ex.: O casal caminhando no jardim" onChange={(event) => update({ imageAltTexts: { ...config.imageAltTexts, [item.id]: { 'pt-BR': event.target.value } } })} />{!config.imageAltTexts?.[item.id]?.['pt-BR']?.trim() && <small>Necessária para publicar se esta foto aparecer no convite.</small>}</label>)}</div></details>
        <div className="wedding-profile-fields"><label>Noivo(a) 1<input maxLength="100" value={partnerOneName} onChange={(event) => setPartnerOneName(event.target.value)} required /></label><label>Noivo(a) 2<input maxLength="100" value={partnerTwoName} onChange={(event) => setPartnerTwoName(event.target.value)} required /></label><div className="wedding-profile-date-grid"><label>Data do casamento<input type="date" value={eventDate} onChange={(event) => setEventDate(event.target.value)} /></label><label>Horário<input type="time" value={eventTime} onChange={(event) => setEventTime(event.target.value)} /></label></div></div>
        <p>O tema define as cores e as letras. A prévia acompanha cada escolha.</p>
        <ThemePicker theme={theme.id} setTheme={selectTheme} compact limit={4} partnerOneName={wedding.partner_one_name || 'Seus nomes'} partnerTwoName={wedding.partner_two_name || 'seu par'} />
        <div className="palette-picker"><div className="palette-heading"><strong>Paleta</strong><small>{PALETTE_NAMES[config.paletteIndex] || PALETTE_NAMES[0]}</small></div><div className="palette-swatches">{palettes.map((colors, index) => <button type="button" className={config.paletteIndex === index ? 'active' : ''} key={index} onClick={() => update({ paletteIndex: index })} aria-label={`Paleta ${PALETTE_NAMES[index]}`} aria-pressed={config.paletteIndex === index}>{colors.map((color) => <i key={color} style={{ backgroundColor: color }} />)}</button>)}</div>{photoAccentSuggestions.length > 0 && <div className="photo-palette-suggestions"><strong>Paletas inspiradas na foto de capa</strong><div>{photoAccentSuggestions.map((color, index) => { const suggestedPalette = getThemePalettes(theme, color)[config.paletteIndex] || selectedPalette; return <button type="button" key={color} onClick={() => update({ customAccent: color })} aria-label={`Usar paleta inspirada na foto ${index + 1}`} aria-pressed={config.customAccent === color} title={`Paleta sugerida ${index + 1}`}><span aria-hidden="true">{suggestedPalette.map((tokenColor) => <i key={tokenColor} style={{ backgroundColor: tokenColor }} />)}</span></button> })}</div><small>Extraídas neste dispositivo. A cor de destaque é ajustada para manter o contraste.</small></div>}<SiteAccentPicker value={config.customAccent} appliedValue={selectedPalette[1]} onChange={(customAccent) => update({ customAccent })} /></div>
        <div className="customizer-upload-panel customizer-video-panel"><div><strong>Vídeo de abertura <span>Opcional</span></strong><p>Vídeo MP4 curto, sem som automático, com uma foto de reserva para conexões lentas.</p></div><input ref={videoInput} type="file" accept="video/mp4" hidden onChange={(event) => { uploadSiteMedia(event.target.files?.[0], 'video'); event.target.value = '' }} /><button type="button" className="button-outline" onClick={() => videoInput.current?.click()} disabled={mediaBusy || siteMedia.some((item) => item.mediaType === 'video')}><Video size={16} /> {config.coverVideoId ? 'Vídeo adicionado' : 'Escolher vídeo MP4'}</button></div>
        <div className="customizer-layout-options" role="group" aria-label="Composição da capa"><span>Composição da capa</span><div>{coverLayouts.map((layout) => <button type="button" key={layout.id} className={`customizer-layout-choice ${coverComposition === layout.id ? 'active' : ''}`} onClick={() => update({ coverComposition: layout.id })} aria-pressed={coverComposition === layout.id}><span className={`customizer-layout-thumb layout-thumb-${layout.id}`} aria-hidden="true"><i /><b /><em /></span><span>{layout.label}</span>{coverComposition === layout.id && <Check size={18} aria-hidden="true" />}</button>)}</div></div>
        <div className="cover-tuning-controls"><label className="font-pair-label">Alinhamento do texto<select value={config.coverTextAlign || 'left'} onChange={(event) => update({ coverTextAlign: event.target.value })}><option value="left">À esquerda</option><option value="center">Centralizado</option><option value="right">À direita</option></select></label><label className="font-pair-label">Posição vertical do texto<select value={config.coverTextPosition || 'center'} onChange={(event) => update({ coverTextPosition: event.target.value })}><option value="top">Parte superior</option><option value="center">Centro</option><option value="bottom">Parte inferior</option></select></label><label className="font-pair-label">Enquadramento no computador<select value={coverImagePositionDesktop} onChange={(event) => update({ coverImagePosition: event.target.value, coverImagePositionDesktop: event.target.value })}><option value="center">Centro</option><option value="top">Priorizar parte superior</option><option value="bottom">Priorizar parte inferior</option><option value="left">Priorizar lado esquerdo</option><option value="right">Priorizar lado direito</option></select></label><label className="font-pair-label">Enquadramento no celular<select value={coverImagePositionMobile} onChange={(event) => update({ coverImagePositionMobile: event.target.value })}><option value="center">Centro</option><option value="top">Priorizar parte superior</option><option value="bottom">Priorizar parte inferior</option><option value="left">Priorizar lado esquerdo</option><option value="right">Priorizar lado direito</option></select></label><label className="font-pair-label cover-overlay-control">Sobreposição escura <span>{config.coverOverlayOpacity ?? 45}%</span><input type="range" min="10" max="75" step="5" value={config.coverOverlayOpacity ?? 45} onChange={(event) => update({ coverOverlayOpacity: Number(event.target.value) })} /><small>Ajuda a manter o texto legível sobre a fotografia.</small></label></div>
        <FontScalePicker value={config.fontScale} onChange={(fontScale) => update({ fontScale })} />
      </section> : <section className="dash-card customize-card customizer-step-card">
        <div className="card-heading"><div><span className="eyebrow">PASSO DOIS</span><h3>Contem só o que importa</h3></div></div>
        <div className="customizer-content-group"><div className="customizer-content-heading"><span>01</span><div><strong>Mensagem do convite</strong><small>Escrevam um recado breve para os convidados.</small></div></div><label className="font-pair-label">Mensagem para os convidados<textarea rows="3" maxLength="140" value={coverMessage} onChange={(event) => updateCoverMessage(event.target.value)} placeholder="Ex.: Vai ser uma alegria celebrar com você." /><small>{coverMessage.length}/140 caracteres</small></label></div>
        <div className="customizer-content-group"><div className="customizer-content-heading"><span>02</span><div><strong>Nossa história</strong><small>Uma lembrança curta sobre vocês.</small></div></div><label className="customizer-story-toggle"><input type="checkbox" checked={storyEnabled} onChange={toggleStory} /><span><strong>Mostrar nossa história no convite</strong><small>Opcional. Um parágrafo já é suficiente.</small></span></label>{storyEnabled && <label className="font-pair-label">Como tudo começou<textarea rows="3" maxLength="360" value={storyMessage} onChange={(event) => updateStory(event.target.value)} placeholder="Contem em poucas linhas como se conheceram." /><small>{storyMessage.length}/360 caracteres</small></label>}</div>
        <div className="customizer-content-group"><div className="customizer-content-heading"><span>03</span><div><strong>Linha do tempo</strong><small>Adicionem até seis marcos reais da história de vocês.</small></div></div><label className="customizer-story-toggle"><input type="checkbox" checked={timelineEnabled} onChange={(event) => toggleSection('Linha do tempo', event.target.checked)} /><span><strong>Mostrar a linha do tempo</strong><small>Ela só aparece no convite quando houver marcos com título.</small></span></label>{timelineEnabled && <div className="customizer-timeline-editor">{timelineItems.map((item, index) => <fieldset key={item.id}><legend>Marco {index + 1}</legend><label className="font-pair-label">Título<input maxLength="100" value={item.title} onChange={(event) => updateTimelineItem(item.id, { title: event.target.value })} placeholder="Ex.: Onde nos conhecemos" /></label><label className="font-pair-label">Data, opcional<input type="date" value={item.date || ''} onChange={(event) => updateTimelineItem(item.id, { date: event.target.value })} /></label><label className="font-pair-label">Descrição<textarea rows="2" maxLength="1200" value={item.description || ''} onChange={(event) => updateTimelineItem(item.id, { description: event.target.value })} placeholder="Escrevam com as próprias palavras." /></label><label className="font-pair-label">Fotografia, opcional<select value={item.photoId || ''} onChange={(event) => updateTimelineItem(item.id, { photoId: event.target.value || null })}><option value="">Sem fotografia</option>{uploadedImages.map((image) => <option key={image.id} value={image.id}>Foto enviada · {image.id.slice(0, 8)}</option>)}</select></label><button type="button" className="button-outline" onClick={() => removeTimelineItem(item.id)}>Remover marco</button></fieldset>)}<button type="button" className="button-outline" disabled={timelineItems.length >= 6} onClick={addTimelineItem}>Adicionar marco {timelineItems.length}/6</button></div>}</div>
        <div className="customizer-content-group"><div className="customizer-content-heading"><span>04</span><div><strong>Contagem regressiva</strong><small>Usa a data, o horário e o fuso do casamento.</small></div></div><label className="customizer-story-toggle"><input type="checkbox" checked={countdownEnabled} onChange={(event) => toggleSection('Contagem regressiva', event.target.checked)} /><span><strong>Mostrar a contagem regressiva</strong><small>Quando o horário chegar, ela muda para “Hoje é o grande dia!”.</small></span></label></div>
        <div className="customizer-content-group"><div className="customizer-content-heading"><span>05</span><div><strong>O que aparece no site</strong><small>Ativem só as seções que tiverem conteúdo para compartilhar.</small></div></div><div className="customizer-section-toggles">{[['Mural de recados', 'Recados dos convidados'], ['Eventos', 'Programação dos eventos'], ['Cronograma', 'Cronograma do dia'], ['Dress code', 'Traje sugerido'], ['Confirmação de presença', 'Confirmação de presença'], ['Hospedagem e dicas', 'Hospedagem e dicas'], ['Perguntas frequentes', 'Perguntas frequentes'], ['Playlist', 'Playlist'], ['Vídeo', 'Vídeo'], ['Contato', 'Contato']].map(([section, label]) => <label key={section}><input type="checkbox" checked={(config.enabledSections || []).includes(section)} onChange={(event) => toggleSection(section, event.target.checked)} /><span>{label}</span></label>)}</div><label className="customizer-story-toggle"><input type="checkbox" checked={(config.enabledSections || []).includes('Padrinhos e madrinhas')} onChange={(event) => toggleSection('Padrinhos e madrinhas', event.target.checked)} /><span><strong>Mostrar padrinhos e madrinhas</strong><small>Exibam apenas as pessoas e fotos escolhidas por vocês.</small></span></label>{(config.enabledSections || []).includes('Padrinhos e madrinhas') && <div className="customizer-timeline-editor customizer-godparents-editor">{godparents.map((person, index) => <fieldset key={person.id}><legend>Pessoa {index + 1}</legend><label className="font-pair-label">Nome<input maxLength="160" value={person.name} onChange={(event) => updateGodparent(person.id, { name: event.target.value })} /></label><label className="font-pair-label">Mensagem, opcional<textarea rows="2" maxLength="1200" value={person.message} onChange={(event) => updateGodparent(person.id, { message: event.target.value })} /></label><label className="font-pair-label">Foto<select value={person.photoId || ''} onChange={(event) => updateGodparent(person.id, { photoId: event.target.value || null })}><option value="">Escolham uma foto</option>{uploadedImages.map((image) => <option key={image.id} value={image.id}>Foto enviada · {image.id.slice(0, 8)}</option>)}</select></label><button type="button" className="button-outline" onClick={() => removeGodparent(person.id)}>Remover pessoa</button></fieldset>)}<button type="button" className="button-outline" disabled={godparents.length >= SITE_MEDIA_LIMITS.photosPerWedding} onClick={addGodparent}>Adicionar pessoa {godparents.length}/{SITE_MEDIA_LIMITS.photosPerWedding}</button></div>}<details className="customizer-extra-fields"><summary>Editar conteúdo das seções de apoio</summary><div className="customizer-section-copy-fields">{[['Hospedagem e dicas', 'Informações de hospedagem, transporte e chegada', 'Ex.: hotéis próximos, estacionamento, transporte e acessibilidade.'], ['Perguntas frequentes', 'Perguntas e respostas', 'Escrevam cada pergunta e resposta em linhas separadas.'], ['Playlist', 'Link HTTPS da playlist', 'https://'], ['Vídeo', 'Link HTTPS do vídeo, se não houver vídeo enviado', 'https://'], ['Contato', 'Contato público que os noivos querem compartilhar', 'Ex.: telefone do cerimonial. Evitem divulgar endereço residencial.']].filter(([section]) => (config.enabledSections || []).includes(section)).map(([section, label, placeholder]) => <label className="font-pair-label" key={section}>{label}{['Playlist', 'Vídeo'].includes(section) ? <input type="url" inputMode="url" maxLength="4000" value={config.sectionContent?.[section]?.['pt-BR']?.body || ''} placeholder={placeholder} onChange={(event) => updateSectionBody(section, event.target.value)} /> : <textarea rows="3" maxLength="4000" value={config.sectionContent?.[section]?.['pt-BR']?.body || ''} placeholder={placeholder} onChange={(event) => updateSectionBody(section, event.target.value)} />}</label>)}</div></details><details className="customizer-title-editor"><summary>Personalizar títulos das seções</summary><div>{EDITABLE_SITE_SECTION_TITLES.map(([section, fallback]) => <label className="font-pair-label" key={section}>{section}<input value={config.sectionContent?.[section]?.['pt-BR']?.title || ''} maxLength="120" placeholder={fallback} onChange={(event) => updateSectionTitle(section, event.target.value)} /></label>)}</div></details><details className="customizer-layout-editor"><summary>Apresentacao das secoes</summary><div>{visibleSiteSections.map((section) => <label className="font-pair-label" key={section}>{siteSectionTitle(section)}<select value={config.sectionLayouts?.[section] || "classic"} onChange={(event) => update({ sectionLayouts: { ...config.sectionLayouts, [section]: event.target.value } })}>{SITE_SECTION_LAYOUT_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>)}</div></details><div className="customizer-order-heading"><strong>Ordem das seções</strong><small>Use as setas para escolher o que aparece primeiro no site.</small></div><ol className="customizer-section-order">{visibleSiteSections.map((section, index, ordered) => <li key={section}><span>{siteSectionTitle(section)}</span><div className="section-reorder-controls"><button type="button" aria-label={`Mover ${section} para cima`} disabled={index === 0} onClick={() => moveSiteSection(section, -1)}><ArrowUp size={14} /></button><button type="button" aria-label={`Mover ${section} para baixo`} disabled={index === ordered.length - 1} onClick={() => moveSiteSection(section, 1)}><ArrowDown size={14} /></button></div></li>)}</ol></div>
        <details className="customizer-extra-fields"><summary>Mais fotos no convite, opcional</summary><div><label className="customizer-story-toggle"><input type="checkbox" checked={config.coverCarouselEnabled || false} onChange={(event) => update({ coverCarouselEnabled: event.target.checked, ...(event.target.checked && config.coverPhotoId ? { coverGallery: [...new Set([config.coverPhotoId, ...(config.coverGallery || [])])] } : {}) })} /><span><strong>Alternar a foto de abertura</strong><small>Escolham as fotos na etapa Aparência. Sem esta opção, o convite mantém uma foto fixa.</small></span></label>{config.coverCarouselEnabled && !config.coverGallery?.length && <p className="customizer-step-note">Na etapa Aparência, marquem quais fotos entram no carrossel.</p>}</div></details>
        <details className="customizer-extra-fields"><summary>Informações adicionais, se forem importantes</summary><div><label className="font-pair-label">Cardápio<textarea rows="2" maxLength="1200" value={config.weddingDetails?.menu || ''} onChange={(event) => update({ weddingDetails: { ...config.weddingDetails, menu: event.target.value } })} placeholder="Uma observação breve para os convidados." /></label><label className="font-pair-label">Traje sugerido<input maxLength="120" value={config.weddingDetails?.dressCode || ''} onChange={(event) => update({ weddingDetails: { ...config.weddingDetails, dressCode: event.target.value } })} placeholder="Ex.: esporte fino" /></label><label className="font-pair-label">Orientações aos convidados<textarea rows="3" maxLength="1200" value={config.weddingDetails?.schedule || ''} onChange={(event) => update({ weddingDetails: { ...config.weddingDetails, schedule: event.target.value } })} placeholder="Informações úteis sobre chegada, estacionamento ou acessibilidade." /></label></div></details>
        <details className="customizer-extra-fields"><summary>Fotos espontâneas dos convidados</summary><GuestCameraSettings settings={config.guestCamera} onChange={(guestCamera) => update({ guestCamera })} /></details>
        <p className="customizer-step-note">Data, local e horários são organizados na aba Eventos. Não precisam ser preenchidos de novo aqui.</p>
      </section>}
      <PublishedInviteShare wedding={wedding} profile={profile} config={config} update={update} publishedAt={publishedAt} notify={notify} />
      <div className="site-draft-toolbar"><span role="status" aria-live="polite">{autosaveStatus === 'saving' || saving ? 'Salvando rascunho…' : autosaveStatus === 'waiting' ? 'Alterações aguardando salvamento' : autosaveStatus === 'error' ? 'Não foi possível salvar. Tentem novamente.' : 'Rascunho salvo automaticamente'}</span><div><button type="button" className="button-outline" onClick={undoDraftChange} disabled={!draftHistory.past.length || saving} aria-label="Desfazer alteração"><Undo2 size={16} /> Desfazer</button><button type="button" className="button-outline" onClick={redoDraftChange} disabled={!draftHistory.future.length || saving} aria-label="Refazer alteração"><Redo2 size={16} /> Refazer</button></div></div>
      <div className="site-editor-actions"><button type="button" className="button-primary save-customize" onClick={() => onSave(profile, config)} disabled={saving || (!draftChanged && !profileChanged)}>{saving ? 'Salvando…' : 'Salvar rascunho agora'} <Check size={15} /></button><button type="button" className="button-outline" onClick={() => onPublish(profile, config)} disabled={saving || !partnerOneName.trim() || !partnerTwoName.trim()}>{saving ? 'Publicando…' : publishedAt ? 'Publicar alterações' : 'Publicar convite'}</button></div>
    </div>
    <div className="customize-preview">
      <div className="preview-sticky-label"><span><span className="status-dot" /> {publishedAt && !draftChanged && JSON.stringify(config) === JSON.stringify(publishedConfig) ? 'PUBLICADO' : 'PRÉVIA AO VIVO'}</span><div className="preview-device-switch"><button type="button" className={device === 'desktop' ? 'active' : ''} aria-label="Prévia em desktop" onClick={() => setDevice('desktop')}><Monitor size={14} /></button><button type="button" className={device === 'tablet' ? 'active' : ''} aria-label="Prévia em tablet" onClick={() => setDevice('tablet')}><Tablet size={14} /></button><button type="button" className={device === 'mobile' ? 'active' : ''} aria-label="Prévia em celular" onClick={() => setDevice('mobile')}><Smartphone size={14} /></button></div></div>
      <InvitationPreviewWindow device={device} animationPreset={config.animationPreset}>
        <WeddingInvitationDocument theme={theme.id} animationPreset={config.animationPreset} style={style} partnerOneName={partnerOneName || 'Nomes do casal'} partnerTwoName={partnerTwoName || 'seu par'} preview navigation={previewPage === 'invitation' ? <WeddingNavigation items={previewNavItems} givingOptions={previewGivingOptions} /> : <button type="button" className="button-outline" onClick={() => setPreviewPage('invitation')}>Voltar ao convite</button>}>
          {previewPage === 'invitation' ? <>
            <WeddingInvitationCover animationPreset={config.animationPreset} theme={theme.id} layout={coverLayout} composition={config.coverComposition} textAlign={config.coverTextAlign} textPosition={config.coverTextPosition} overlayOpacity={config.coverOverlayOpacity} imagePosition={coverImagePositionDesktop} mobileImagePosition={coverImagePositionMobile} photoAlt={imageAltText(config, previewCoverId, 'Foto escolhida pelo casal')} partnerOneName={partnerOneName} partnerTwoName={partnerTwoName} date={eventDate ? new Date(`${eventDate}T12:00:00`).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Data a confirmar'} time={eventTime} message={coverMessage} photoUrl={previewPhotoUrl} videoUrl={previewVideoUrl} showRsvp={(config.enabledSections || []).includes('Confirmação de presença')} preview carouselCount={config.coverCarouselEnabled ? (config.coverGallery || []).length : 0} carouselIndex={previewCoverIndex} />
            <WeddingInvitationContent config={config} eventDate={eventDate} eventTime={eventTime} events={events} gifts={previewGifts} giftPresentation={giftPresentation} mediaUrl={(id) => mediaUrls[id] || ''} timezone={wedding?.timezone} showGifts={previewHasGifts} showPix={previewPixEnabled} rsvpSection={(config.enabledSections || []).includes('Confirmação de presença') ? <WeddingInvitationRsvpPreview events={events} title={getSiteSectionTitle(config, EDITABLE_SITE_SECTION_TITLES[8][0])} /> : null} wallSection={(config.enabledSections || []).includes('Mural de recados') ? <WeddingWallSection preview title={getSiteSectionTitle(config, 'Mural de recados')} /> : null} preview onOpenGifts={() => setPreviewPage('gifts')} onOpenPix={() => setPreviewPage('pix')} onCopyPix={() => {}} />
          </> : <WeddingDisplayPage kind={previewPage} weddingName={`${partnerOneName || 'Nomes do casal'} & ${partnerTwoName || 'seu par'}`} gifts={previewGifts.filter((gift) => gift.status === 'active')} presentation={giftPresentation} mediaUrl={(id) => mediaUrls[id] || ''} imageAltTexts={config.imageAltTexts} pix={config.pix} preview onBack={() => setPreviewPage('invitation')} />}
        </WeddingInvitationDocument>
      </InvitationPreviewWindow>
      <div className="preview-notice"><CircleHelp size={15} /> {!previewHasCover ? 'Sem foto ainda: a capa usa as cores do tema e mostra como o texto ficará.' : publishedAt ? `Última publicação: ${published}. As mudanças aparecem para os convidados depois de publicar.` : 'Esta prévia é privada até vocês publicarem o convite.'}</div>
    </div>
  </div>
}
function PublishedInviteShare({ wedding, profile, config, update, publishedAt, notify }) {
  const url = wedding?.slug ? `${window.location.origin}/casamento/${encodeURIComponent(wedding.slug)}` : ''
  if (!publishedAt || !url) return null
  const names = [profile.partnerOneName, profile.partnerTwoName].map((name) => name?.trim()).filter(Boolean).join(' & ')
  const date = profile.eventDate ? new Date(`${profile.eventDate}T12:00:00`).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' }) : ''
  const time = profile.eventTime || ''
  const defaultMessage = `Com muita alegria, queremos convidar você para celebrar um dos dias mais especiais das nossas vidas! 💍\n\n💕 ${names || 'Os noivos'}\n\n${date ? `📅 ${date}\n` : ''}${time ? `🕓 ${time}\n` : ''}\nPreparamos um convite especial com todos os detalhes do nosso casamento.\n\nAcesse nosso convite e confirme sua presença:\n\n{{link}}\n\nEsperamos você para celebrar esse momento conosco! ❤️`
  const storedMessage = config.shareMessage || ''
  const message = (storedMessage || defaultMessage).replaceAll('{{link}}', url)
  const saveMessage = (value) => {
    let next = value.split(url).join('{{link}}')
    if (!next.includes('{{link}}')) next = `${next.trimEnd()}\n\n{{link}}`
    update({ shareMessage: next })
  }
  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url)
      notify('Link público copiado.')
    } catch {
      notify('Selecione o endereço para copiá-lo.')
    }
  }
  async function copyMessage() {
    try {
      await navigator.clipboard.writeText(message)
      notify('Mensagem copiada.')
    } catch {
      notify('Selecione a mensagem para copiá-la.')
    }
  }
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`
  return <section className="role-card published-invite-share"><div><span className="eyebrow">CONVITE PUBLICADO</span><h2>Compartilhar convite</h2><p>O link público permite que cada pessoa registre a própria resposta e receba um QR individual. Para convites pessoais, use o link exclusivo da lista.</p><label>Link público<input readOnly value={url} onFocus={(event) => event.target.select()} /></label><div className="role-actions"><button type="button" className="button-primary" onClick={copyLink}><Copy size={15} /> Copiar link</button><a className="button-outline" href={url} target="_blank" rel="noreferrer"><ExternalLink size={15} /> Visualizar convite</a></div><label className="share-message-field">Mensagem para compartilhar<textarea rows="10" maxLength="4000" value={message} onChange={(event) => saveMessage(event.target.value)} /><small>A mensagem personalizada é salva junto com o rascunho do convite.</small></label><div className="role-actions"><button type="button" className="button-primary" onClick={copyMessage}><Copy size={15} /> Copiar mensagem</button><a className="button-outline" href={whatsappUrl} target="_blank" rel="noreferrer"><MessageCircle size={15} /> Compartilhar pelo WhatsApp</a></div></div></section>
}

function AttendanceRequestManager({ policy, setPolicy, requests, companions, companionNameDrafts, setCompanionNameDrafts, onSavePolicy, onReviewRequest, onReviewCompanion, busy }) {
  const pendingRequests = requests.filter((item) => item.review_status === 'pending')
  const pendingCompanions = companions.filter((item) => item.status === 'pending')
  const labelStatus = (status, automatic = false) => automatic && status === 'approved' ? 'Resposta registrada' : ({ pending: 'Aguardando análise', approved: 'Aprovado', rejected: 'Recusado' }[status] || status)
  return <>
    <section className="role-card attendance-policy-card"><div className="role-card-heading"><div><span className="eyebrow">ACESSO E ACOMPANHANTES</span><h2>Respostas pelo convite público</h2></div><span className="task-count">{pendingRequests.length + pendingCompanions.length} pendentes</span></div><p className="team-access-note">A pessoa que confirma recebe seu QR individual. Acompanhantes continuam sujeitos à aprovação. Compartilhe links individuais com quem foi convidado.</p><form className="attendance-policy-form" onSubmit={onSavePolicy}><label className="attendance-policy-toggle"><input type="checkbox" checked={policy.companionsAllowed} onChange={(event) => setPolicy((current) => ({ companionsAllowed: event.target.checked, maxCompanions: event.target.checked ? Math.max(current.maxCompanions, 1) : 0 }))} /> Permitir solicitação de acompanhantes</label>{policy.companionsAllowed && <label>Máximo por convite<input type="number" min="1" max="19" value={policy.maxCompanions} onChange={(event) => setPolicy((current) => ({ ...current, maxCompanions: Number(event.target.value) }))} required /></label>}<button type="submit" className="button-outline" disabled={busy}>Salvar limite</button></form></section>
    <section className="role-card attendance-request-list"><div className="role-card-heading"><div><span className="eyebrow">RESPOSTAS RECEBIDAS</span><h2>Confirmações de presença</h2></div></div>{requests.length ? requests.map((item) => <article className="attendance-request-row" key={item.id}><div><strong>{item.name}</strong><small>{item.event_name} · {item.email || item.phone} · {item.attendance_status === 'confirmed' ? 'Vai comparecer' : 'Não poderá comparecer'}{item.created_at ? ` · ${new Date(item.created_at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}` : ''}</small>{item.companions_pending > 0 && <small>1 titular · {item.companions_pending} acompanhante(s) aguardando decisão individual</small>}<span>{labelStatus(item.review_status, Boolean(item.guest_id))}{item.possible_existing_guest && item.review_status === 'pending' ? ' · contato já consta na lista; oriente a usar o link individual existente' : ''}</span>{item.guest_id && <small>Convidado incluído na lista. O QR pode ser consultado ou renovado na tabela de convidados.</small>}</div>{item.review_status === 'pending' && <div className="role-actions"><button type="button" className="button-primary" disabled={busy || Boolean(item.possible_existing_guest)} onClick={() => onReviewRequest(item, 'approved')}>Aprovar registro antigo</button><button type="button" className="button-outline" disabled={busy} onClick={() => onReviewRequest(item, 'rejected')}>Recusar</button></div>}</article>) : <p className="buffet-empty">As respostas recebidas pelo convite aparecerão aqui.</p>}</section>
    <section className="role-card attendance-request-list"><div className="role-card-heading"><div><span className="eyebrow">AUTORIZAÇÃO INDIVIDUAL</span><h2>Acompanhantes</h2></div></div>{companions.length ? companions.map((item) => <article className="attendance-request-row" key={item.id}><div><strong>{item.name || 'Nome ainda não informado'}</strong><small>{item.requester_name} · {item.event_name}{item.email ? ` · ${item.email}` : ''}{item.phone ? ` · ${item.phone}` : ''}</small><span>{labelStatus(item.status)}</span>{item.status === 'pending' && <label>Nome para a credencial<input maxLength="160" value={companionNameDrafts[item.id] ?? item.name ?? ''} onChange={(event) => setCompanionNameDrafts((current) => ({ ...current, [item.id]: event.target.value }))} required /></label>}{item.guest_id && <small>Credencial individual emitida. O convidado responsável pode recuperá-la pelo link individual.</small>}</div>{item.status === 'pending' && <div className="role-actions"><button type="button" className="button-primary" disabled={busy || !(companionNameDrafts[item.id] ?? item.name)?.trim()} onClick={() => onReviewCompanion(item, 'approved')}>Aprovar</button><button type="button" className="button-outline" disabled={busy} onClick={() => onReviewCompanion(item, 'rejected')}>Recusar</button></div>}</article>) : <p className="buffet-empty">Nenhum acompanhante solicitado.</p>}</section>
  </>
}

function GuestAuthorizationManager({ weddingId, guests, events, authorizations, onReload, confirmAction, notify, busy }) {
  const [guestId, setGuestId] = useState('')
  const [eventId, setEventId] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  async function setAuthorization(guest, event, status) {
    const action = status === 'revoked' ? 'revogar' : 'restaurar'
    if (!await confirmAction(`Deseja ${action} o acesso de ${guest.name} a ${event.name}?`, status === 'revoked' ? 'Revogar acesso' : 'Restaurar acesso', status === 'revoked' ? 'Revogar' : 'Restaurar', status === 'revoked')) return
    setSaving(true)
    setError('')
    try {
      const response = await fetch(`/api/couple/weddings/${weddingId}/guest-authorizations`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ guestId: guest.id, eventId: event.id, status }) })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'guest_authorization_failed')
      await onReload()
      notify(status === 'revoked' ? 'Acesso revogado para este evento.' : 'Acesso restaurado para este evento.')
    } catch {
      setError('Não foi possível atualizar a autorização deste evento.')
    } finally {
      setSaving(false)
    }
  }
  const selectedGuest = guests.find((item) => item.id === guestId)
  const selectedEvent = events.find((item) => item.id === eventId)
  return <section className="role-card guest-authorization-manager"><div className="role-card-heading"><div><span className="eyebrow">PERMISSÕES POR EVENTO</span><h2>Revogar ou restaurar acesso</h2></div></div><p className="team-access-note">A alteração vale só para o evento escolhido. Um QR revogado deixa de ser aceito pelo servidor.</p><div className="guest-authorization-form"><label>Convidado<select value={guestId} onChange={(event) => setGuestId(event.target.value)}><option value="">Selecione</option>{guests.map((guest) => <option key={guest.id} value={guest.id}>{guest.name}</option>)}</select></label><label>Evento<select value={eventId} onChange={(event) => setEventId(event.target.value)}><option value="">Selecione</option>{events.map((event) => <option key={event.id} value={event.id}>{event.name}</option>)}</select></label><button type="button" className="button-outline" disabled={busy || saving || !selectedGuest || !selectedEvent} onClick={() => setAuthorization(selectedGuest, selectedEvent, 'revoked')}>Revogar acesso</button><button type="button" className="button-primary" disabled={busy || saving || !selectedGuest || !selectedEvent} onClick={() => setAuthorization(selectedGuest, selectedEvent, 'authorized')}>Restaurar acesso</button></div>{error && <p className="admin-form-error" role="alert">{error}</p>}{authorizations.length > 0 && <div className="guest-authorization-list">{authorizations.map((item) => <div key={`${item.guest_id}-${item.event_id}`}><span><strong>{item.guest_name}</strong><small>{item.event_name} · {item.status === 'revoked' ? 'Acesso revogado' : 'Acesso autorizado'}</small></span>{item.status === 'revoked' && <button type="button" className="button-outline" disabled={busy || saving} onClick={() => setAuthorization({ id: item.guest_id, name: item.guest_name }, { id: item.event_id, name: item.event_name }, 'authorized')}>Restaurar</button>}</div>)}</div>}</section>
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
  const individualMessage = `Com carinho, convidamos você para celebrar conosco! 💍\n\n💕 ${share.name}\n\nAcesse seu convite individual e confirme sua presença:\n${share.url}`
  const individualWhatsAppUrl = `https://wa.me/?text=${encodeURIComponent(individualMessage)}`
  return <section className="role-card invitation-share-card"><div><span className="eyebrow">LINK INDIVIDUAL GERADO</span><h2>{share.name}</h2><p>Este link dá acesso somente ao convite desta pessoa. Guarde-o para compartilhar; ele não volta a ser exibido depois que você fechar esta janela.</p><input aria-label="Link individual" readOnly value={share.url} onFocus={(event) => event.target.select()} /><div className="role-actions"><button className="button-primary" onClick={copyLink}>Copiar link <Copy size={15} /></button><a className="button-outline" href={individualWhatsAppUrl} target="_blank" rel="noreferrer"><MessageCircle size={15} /> Enviar pelo WhatsApp</a><button className="button-outline" onClick={onClose}>Fechar</button></div></div>{qr && <img src={qr} alt={`QR code do convite individual de ${share.name}`} />}</section>
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
        <header className="dashboard-topbar"><div className="dash-breadcrumb"><span>Meu espaço</span><ChevronRight size={14} /><strong>{pageTitle}</strong></div><div className="dash-top-actions"><span className="save-state"><span /> Prévia local</span><button className="icon-button" aria-label="Notificações" onClick={() => notify('Nenhuma notificação de demonstração')}><Bell size={18} /><i /></button><button className="preview-site-button" onClick={() => demo ? window.location.assign('/cadastro') : notify('A prévia pública está na aba Site do casal')}>{demo ? 'Criar acesso' : 'Ver meu site'} <ExternalLink size={14} /></button></div></header>
        <div className="dashboard-content">
          {demo && <aside className="dashboard-demo-notice"><span><Eye size={17} /> Demonstração do painel</span><p>Explore os menus e teste os controles com dados fictícios. Para criar o convite, crie seu acesso, confirme o e-mail e personalize dentro do painel.</p><a href="/cadastro">Criar acesso <ArrowRight size={14} /></a></aside>}
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
    gifts: 'Organize presentes por Pix direto aos noivos ou links de lojas externas.',
    customize: 'Escolha um tema e ajuste apenas o que faz sentido para vocês.',
    game: 'Uma brincadeira opcional para aproximar seus convidados.',
  }
  return subtitles[page]
}

function Overview({ setPage, notify }) {
  return <>
    <div className="welcome-card"><div className="welcome-copy"><span className="eyebrow">18 DE SETEMBRO DE 2027 · PARATY, RJ</span><h2>O próximo capítulo<br />começa a ganhar forma.</h2><p>Seu site está em uma prévia de demonstração, com exemplos de conteúdo.</p><div className="welcome-actions"><button className="button-primary" onClick={() => setPage('customize')}>Personalizar site <ArrowRight size={15} /></button><button className="welcome-link" onClick={() => setPage('invites')}>Ver convite <ExternalLink size={14} /></button></div></div><div className="welcome-art"><img src="/images/wedding-pexels.webp" alt="Imagem de capa de demonstração" /><span>e<span>&</span>t</span></div><div className="welcome-bottom"><span><span className="status-dot" /> SITE DE DEMONSTRAÇÃO</span><button onClick={() => notify('O domínio será definido pelo dono do projeto')}>Endereço a definir <ArrowRight size={14} /></button></div></div>
    <div className="stats-grid"><Stat icon={Users} label="Convidados" value="128" note="exemplos cadastrados" tint="sage" /><Stat icon={Check} label="Confirmações" value="86" note="respostas de demonstração" tint="sand" /><Stat icon={Gift} label="Presentes" value="3 itens" note="exemplo de lista" tint="rose" /></div>
    <div className="overview-grid"><section className="dash-card checklist-card"><div className="card-heading"><div><span className="eyebrow">PRÓXIMOS PASSOS</span><h3>Seu planejamento</h3></div><button className="round-arrow" onClick={() => notify('Lista de planejamento de demonstração')}><ArrowRight size={16} /></button></div><div className="progress-summary"><div><strong>3 de 6</strong><span>etapas iniciadas</span></div><div className="progress-track"><span style={{ width: '52%' }} /></div></div><div className="checklist-row done"><span className="check-circle"><Check size={13} /></span><span><strong>Definir data e local</strong><small>Informações de demonstração</small></span><ChevronRight size={15} /></div><div className="checklist-row done"><span className="check-circle"><Check size={13} /></span><span><strong>Montar a lista de convidados</strong><small>128 nomes de demonstração</small></span><ChevronRight size={15} /></div><div className="checklist-row"><span className="check-circle" /><span><strong>Escolher o visual do site</strong><small>Compare os oito temas</small></span><button onClick={() => setPage('customize')}>Escolher</button></div><div className="checklist-row"><span className="check-circle" /><span><strong>Enviar convites</strong><small>O domínio ainda será definido</small></span><button onClick={() => setPage('invites')}>Preparar</button></div><button className="all-checklist" onClick={() => notify('Lista demonstrativa')}>Ver planejamento completo <ArrowRight size={14} /></button></section>
      <section className="dash-card response-card"><div className="card-heading"><div><span className="eyebrow">CONVIDADOS</span><h3>Respostas recentes</h3></div><button className="text-arrow" onClick={() => setPage('guests')}>Ver todos <ArrowRight size={14} /></button></div><div className="response-visual"><div className="donut-chart"><div><strong>67%</strong><small>confirmados</small></div></div><div className="response-legend"><span><i className="legend-confirmed" /> Confirmaram <b>86</b></span><span><i className="legend-waiting" /> Aguardando <b>32</b></span><span><i className="legend-declined" /> Não poderão ir <b>10</b></span></div></div><div className="response-footer"><span>Dados ilustrativos para o mockup</span><button onClick={() => setPage('guests')}>Abrir lista <ArrowRight size={13} /></button></div></section></div>
  </>
}

function Stat({ icon: Icon, label, value, note, tint }) {
  return <article className="stat-card"><span className={`stat-icon ${tint}`}><Icon size={17} /></span><div><span className="stat-label">{label}</span><strong>{value}</strong><small>{note}</small></div><span className="stat-arrow"><ArrowRight size={14} /></span></article>
}

function SiteSettings({ setPage, notify }) {
  const sections = ['Nossa história', 'Cerimônia e recepção', 'Cronograma', 'Lista de presentes', 'Confirmação de presença', 'Galeria de fotos', 'Mural de recados', 'Hospedagem e dicas']
  return <div className="site-settings-grid"><section className="dash-card settings-card"><div className="card-heading"><div><span className="eyebrow">CONTEÚDO DO SITE</span><h3>Suas informações principais</h3></div><button className="text-arrow" onClick={() => notify('Campos editáveis serão definidos na implementação')}>Editar <ArrowRight size={14} /></button></div><div className="site-info-row"><span className="site-info-icon"><CalendarDays size={16} /></span><div><small>Data do casamento</small><strong>18 de setembro de 2027</strong></div><span className="info-status">Preenchido</span></div><div className="site-info-row"><span className="site-info-icon"><MapPin size={16} /></span><div><small>Local da celebração</small><strong>Paraty, Rio de Janeiro</strong></div><span className="info-status">Preenchido</span></div><div className="site-info-row"><span className="site-info-icon"><Heart size={16} /></span><div><small>História do casal</small><strong>Uma história de encontros</strong></div><span className="info-status">Prévia</span></div><div className="site-info-row"><span className="site-info-icon"><LanguagesIcon /></span><div><small>Idiomas</small><strong>Português (Brasil)</strong></div><span className="info-status info-pending">A confirmar</span></div><button className="settings-full-button" onClick={() => notify('Edição de conteúdo não conectada neste mockup')}>Revisar conteúdo <ArrowRight size={14} /></button></section><section className="dash-card site-preview-card"><div className="card-heading"><div><span className="eyebrow">PRÉ-VISUALIZAÇÃO</span><h3>Como seus convidados veem</h3></div><button className="round-arrow" onClick={() => notify('Use a aba Site do casal para ver o mockup completo')}><ExternalLink size={15} /></button></div><div className="mini-site"><img src="/images/wedding-pexels.webp" alt="Capa do site de demonstração" /><div><span className="mini-script">Elisa & Tomás</span><span className="mini-date">18 · 09 · 2027</span></div></div><div className="preview-meta"><span><span className="status-dot" /> Conteúdo demonstrativo</span><button onClick={() => setPage('customize')}>Editar visual <Paintbrush size={14} /></button></div></section><section className="dash-card section-list-card"><div className="card-heading"><div><span className="eyebrow">SEÇÕES PUBLICADAS</span><h3>O que aparece no seu site</h3></div><button className="text-arrow" onClick={() => setPage('customize')}>Organizar <ArrowRight size={14} /></button></div><div className="section-chips">{sections.map((section, index) => <span key={section}><b>{String(index + 1).padStart(2, '0')}</b>{section}<Check size={14} /></span>)}</div></section></div>
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
  return <><div className="gift-summary-grid"><Stat icon={Gift} label="Itens na lista" value="3" note="exemplo de organização" tint="rose" /><Stat icon={Wallet} label="Pix" value="Direto" note="transferido ao casal" tint="sand" /><Stat icon={Users} label="Compras" value="Na loja" note="fora da plataforma" tint="sage" /></div><div className="gift-admin-grid"><section className="dash-card admin-gift-list"><div className="card-heading"><div><span className="eyebrow">LISTA DE PRESENTES</span><h3>Ideias para presentear</h3></div><button className="button-primary" onClick={() => notify('Entre no painel do casal para adicionar presentes')}>+ Novo presente</button></div><div className="gift-admin-rows">{GIFT_ROWS.map((gift) => <div className="gift-admin-row" key={gift.title}><span className="gift-row-icon"><Gift size={18} /></span><div className="gift-row-copy"><strong>{gift.title}</strong><small>{gift.type} · {gift.description}</small></div><span className="future-tag">Exemplo</span></div>)}</div></section><section className="dash-card payment-method-card"><span className="eyebrow">COMO OS PRESENTES FUNCIONAM</span><h3>O casal decide como quer receber.</h3><p>Esta lista de exemplo mostra duas opções que podem ser configuradas pelo casal.</p><div className="method-row"><span className="payment-method-icon"><Wallet size={17} /></span><div><strong>Pix direto aos noivos</strong><small>O convidado copia a chave e transfere pelo banco.</small></div></div><div className="method-row"><span className="payment-method-icon pix">↗</span><div><strong>Presente físico</strong><small>Link para comprar na loja e combinar a entrega.</small></div></div><div className="fee-note"><CircleHelp size={14} /> A plataforma não recebe nem acompanha pagamentos ou compras.</div><button className="button-outline full-width" onClick={() => notify('Configure a chave Pix e os itens na aba Presentes do casamento')}>Configurar presentes</button></section></div></>
}

function Customize({ theme, setTheme, enabledSections, toggleSection, notify }) {
  const sectionNames = ['Nossa história', 'Linha do tempo', 'Eventos', 'Cronograma', 'Dress code', 'Padrinhos e madrinhas', 'Lista de presentes', 'Confirmação de presença', 'Galeria de fotos', 'Mural de recados', 'Hospedagem e dicas', 'Perguntas frequentes', 'Playlist', 'Vídeo', 'Contato', 'Quiz dos noivos']
  const layouts = [{ id: 'full', label: 'Foto em tela cheia' }, { id: 'split', label: 'Foto ao lado' }, { id: 'arch', label: 'Moldura ou arco' }, { id: 'type', label: 'Só tipografia' }, { id: 'video', label: 'Vídeo curto' }, { id: 'collage', label: 'Colagem de fotos' }]
  const [device, setDevice] = useState('desktop')
  const [coverLayout, setCoverLayout] = useState('full')
  const [paletteIndex, setPaletteIndex] = useState(0)
  const selectTheme = (themeId) => { setTheme(themeId); setPaletteIndex(0); setCoverLayout(THEME_PRESETS[themeId]?.coverLayout || 'full') }
  const [animationPreset, setAnimationPreset] = useState('Elegante')
  const palette = THEMES.find((item) => item.id === theme)?.colors || THEMES[0].colors
  const languageCopy = { date: '18 · 09 · 2027', message: 'Com alegria, convidamos você.', button: 'Descobrir o convite' }
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
  </div><div className="customize-preview" style={{ '--forest': selectedPalette[0], '--accent': selectedPalette[1], '--paper': selectedPalette[2], '--font-heading': SITE_FONT_PAIRS[THEME_PRESETS[theme]?.fontPair]?.[0] || SITE_FONT_PAIRS['Clássico editorial'][0], '--font-body': SITE_FONT_PAIRS[THEME_PRESETS[theme]?.fontPair]?.[1] || SITE_FONT_PAIRS['Clássico editorial'][1] }}><div className="preview-sticky-label"><span><span className="status-dot" /> PRÉVIA AO VIVO</span><div className="preview-device-switch"><button className={device === 'desktop' ? 'active' : ''} aria-label="Prévia em desktop" onClick={() => setDevice('desktop')}><Monitor size={14} /></button><button className={device === 'tablet' ? 'active' : ''} aria-label="Prévia em tablet" onClick={() => setDevice('tablet')}><Tablet size={14} /></button><button className={device === 'mobile' ? 'active' : ''} aria-label="Prévia em celular" onClick={() => setDevice('mobile')}><Smartphone size={14} /></button></div><span className="preview-language">Português (Brasil)</span></div><div className={`browser-frame device-${device}`}><div className="browser-bar"><span /><span /><span /><div>elisa-tomas.dominio-a-definir</div><ExternalLink size={12} /></div><div className={`browser-content cover-${coverLayout} cover-empty`}><div className="browser-overlay" /><span className="browser-date">{languageCopy.date}</span><strong>Elisa <i>&</i><br />Tomás</strong><small>{languageCopy.message}</small><button onClick={() => notify('A prévia visual não abre um endereço publicado')}>{languageCopy.button} <ArrowRight size={13} /></button>{coverLayout === 'video' && <span className="video-preview-tag">Vídeo de capa · silencioso</span>}</div><div className="browser-below"><span>um dia para celebrar</span><i>♡</i><span>nossa história</span></div></div><div className="preview-quality"><div><Check size={14} /><span><strong>Contraste do tema</strong><small>Combinação dentro da paleta curada</small></span></div><div><Check size={14} /><span><strong>Layout responsivo</strong><small>Prévia em {device === 'mobile' ? 'celular' : device === 'tablet' ? 'tablet' : 'desktop'}</small></span></div><button onClick={() => notify('Verificador de publicação demonstrativo')}>Verificador antes de publicar <ArrowRight size={13} /></button></div><div className="preview-notice"><CircleHelp size={15} /> A prévia mostra opções viáveis. Conteúdo e publicação ainda não estão conectados.</div></div></div>
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
  const [turnstileToken, setTurnstileToken] = useState('')
  const [turnstileReset, setTurnstileReset] = useState(0)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(true)
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
        const loginResponse = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: invitation.email, password: loginPassword, turnstileToken }) })
        if (!loginResponse.ok) throw new Error('Confira o e-mail e a senha da sua conta.')
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


  const isCoupleInvitation = ['couple_admin', 'editor', 'reader'].includes(invitation?.role)
  const invitationRoleName = ({ couple_admin: 'administrador do casamento', editor: 'editor do site e eventos', reader: 'leitor do conteúdo publicado', event_staff: 'equipe do evento', checkin_staff: 'equipe de entrada' })[invitation?.role] || 'equipe do evento'
  const invitationDescription = invitation?.role === 'editor' ? 'Edite o site e os eventos deste casamento. ' : invitation?.role === 'reader' ? 'Consulte somente o conteúdo publicado. ' : invitation?.role === 'couple_admin' ? 'Acesse o painel completo deste casamento. ' : 'A permissão é limitada aos eventos escolhidos pelos noivos.'
  return <RoleFrame icon={LockKeyhole} eyebrow={isCoupleInvitation ? "ACESSO DO CASAMENTO" : "ACESSO DA EQUIPE"} title={isCoupleInvitation ? "Ative seu acesso ao casamento." : "Ative seu acesso ao evento."} description={invitationDescription} secure secureName="Convite do casamento" secureFooter="Acesso individual">
    <form className="role-card admin-login-form" onSubmit={acceptInvitation}>{loading && <p>Validando o convite…</p>}{invitation?.requiresLogin ? <><p>Este convite foi enviado para <strong>{invitation.email}</strong>. Entre com sua conta para aceitar o acesso de {invitationRoleName}.</p><label>Senha da conta<PasswordInput autoComplete="current-password" value={loginPassword} onChange={(event) => setLoginPassword(event.target.value)} required /></label><TurnstileChallenge onToken={setTurnstileToken} resetKey={turnstileReset} /></> : invitation && <><p>Convite para <strong>{invitation.email}</strong>. Crie uma senha com pelo menos 12 caracteres. No primeiro acesso, confirme o convite e defina sua senha.</p><label>Nova senha<PasswordInput autoComplete="new-password" minLength="12" maxLength="1024" value={password} onChange={(event) => setPassword(event.target.value)} required /></label><label>Confirme a senha<PasswordInput autoComplete="new-password" minLength="12" maxLength="1024" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} required /></label></>}{error && <p className="admin-form-error" role="alert">{error}</p>}<button className="button-primary" disabled={busy || loading || !invitation || (invitation.requiresLogin && (!TURNSTILE_SITE_KEY || !turnstileToken))} type="submit">{busy ? 'Ativando…' : isCoupleInvitation ? 'Aceitar convite e abrir painel' : 'Aceitar convite e entrar'} <ArrowRight size={15} /></button></form>
  </RoleFrame>
}

function GeneralWeddingSite({ notify }) {
  const slug = decodeURIComponent(window.location.pathname.split('/')[2] || '')
  const requestedPage = new URLSearchParams(window.location.search).get('pagina')
  const weddingUrl = `/casamento/${encodeURIComponent(slug)}`
  const [data, setData] = useState(null)
  const [coverIndex, setCoverIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [eventId, setEventId] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [attendanceStatus, setAttendanceStatus] = useState('confirmed')
  const [companions, setCompanions] = useState([])
  const [turnstileToken, setTurnstileToken] = useState('')
  const [turnstileReset, setTurnstileReset] = useState(0)
  const [busy, setBusy] = useState(false)
  const [requestUrl, setRequestUrl] = useState('')
  const [publicCredential, setPublicCredential] = useState(null)
  const [rsvpEmailSent, setRsvpEmailSent] = useState(false)
  const [publicRsvpStatus, setPublicRsvpStatus] = useState('')
  const siteTheme = THEMES.find((item) => item.id === data?.siteConfig?.theme)
  const sitePalettes = siteTheme ? getThemePalettes(siteTheme, data?.siteConfig?.customAccent) : []
  const activePalette = sitePalettes[data?.siteConfig?.paletteIndex] || sitePalettes[0]
  const siteFonts = SITE_FONT_PAIRS[data?.siteConfig?.fontPair] || SITE_FONT_PAIRS['Clássico editorial']
  const siteStyle = activePalette ? { '--forest': activePalette[0], '--ink': activePalette[0], '--accent': activePalette[1], '--paper': activePalette[2], '--font-heading': siteFonts[0], '--font-body': siteFonts[1], '--site-text-scale': data?.siteConfig?.fontScale === 'small' ? '.92' : data?.siteConfig?.fontScale === 'large' ? '1.1' : '1' } : undefined
  const config = data?.siteConfig
  const eventList = data?.events || []
  const giftList = data?.gifts || []
  const pixDisplayMode = ['inline', 'page', 'hidden'].includes(config?.pixDisplayMode) ? config.pixDisplayMode : config?.pix?.enabled ? 'inline' : 'hidden'
  const giftDisplayMode = ['inline', 'page', 'hidden'].includes(config?.giftDisplayMode) ? config.giftDisplayMode : config?.enabledSections?.includes('Lista de presentes') ? 'inline' : 'hidden'
  const showPix = Boolean(config?.pix?.enabled && config.pix.key?.trim() && pixDisplayMode !== 'hidden')
  const publicGiftList = giftList.filter((gift) => gift.fulfillment_type === 'store_link' || showPix)
  const showGifts = giftDisplayMode !== 'hidden' && publicGiftList.some((gift) => !gift.status || gift.status === 'active')
  const maxCompanions = data?.guestPolicy?.companionsAllowed ? data.guestPolicy.maxCompanions : 0
  const coverGallery = config?.coverGallery || []
  const coverId = config?.coverCarouselEnabled && coverGallery.length ? coverGallery[coverIndex] : config?.coverPhotoId || coverGallery[0] || ''
  const coverUrl = coverId ? `/api/public/weddings/${encodeURIComponent(slug)}/media/${coverId}` : ''
  const coverVideoUrl = config?.coverVideoId ? `/api/public/weddings/${encodeURIComponent(slug)}/media/${config.coverVideoId}` : ''
  const idempotencyKey = useRef('')
  const requestTokenRef = useRef('')
  const savedRequestToken = window.location.hash.startsWith('#presenca/') ? window.location.hash.slice(10) : ''

  useEffect(() => {
    let active = true
    fetch(`/api/public/weddings/${encodeURIComponent(slug)}`).then(async (response) => {
      const result = await response.json()
      if (!response.ok) throw new Error('Não foi possível abrir este convite. Confira o link enviado pelos noivos.')
      if (!active) return
      setData(result)
      setEventId(result.events[0]?.id || '')
    }).catch((cause) => { if (active) setError(cause.message) }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [slug])

  useEffect(() => {
    if (!config?.coverCarouselEnabled || coverGallery.length < 2) return undefined
    const timer = window.setInterval(() => setCoverIndex((current) => (current + 1) % coverGallery.length), 5000)
    return () => window.clearInterval(timer)
  }, [config?.coverCarouselEnabled, JSON.stringify(coverGallery)])

  useEffect(() => {
    if (!data || config?.animationPreset === 'Nenhum' || window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return undefined
    const sections = document.querySelectorAll('.public-wedding-story, .public-wedding-timeline, .public-wedding-countdown, .public-wedding-events, .public-wedding-details, .public-wedding-gallery, .public-wedding-gifts, .public-wedding-pix, .public-wedding-rsvp, .public-wedding-wall')
    sections.forEach((section) => section.classList.add('invite-section-reveal'))
    const observer = new IntersectionObserver((entries) => entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible')
        observer.unobserve(entry.target)
      }
    }), { threshold: 0.12 })
    sections.forEach((section) => observer.observe(section))
    return () => observer.disconnect()
  }, [Boolean(data), config?.animationPreset])

  useEffect(() => {
    if (!savedRequestToken) return undefined
    let active = true
    setRequestUrl(`${window.location.origin}/confirmar-presenca#solicitacao/${savedRequestToken}`)
    fetch('/api/public/attendance-requests/lookup', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ requestToken: savedRequestToken }) })
      .then(async (response) => {
        const result = await response.json()
        if (!response.ok) throw new Error('O link salvo não está mais disponível.')
        if (!active) return
        setPublicRsvpStatus(result.request.attendanceStatus)
        if (result.request.attendanceStatus === 'confirmed' && result.request.reviewStatus === 'approved') {
          const credentialResponse = await fetch('/api/public/attendance-requests/credentials', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ requestToken: savedRequestToken }) })
          const credentialResult = await credentialResponse.json()
          if (!credentialResponse.ok) throw new Error('Não foi possível recuperar o QR agora. Tente novamente mais tarde.')
          if (active) setPublicCredential(credentialResult.credentials[0] || null)
        }
      }).catch((cause) => { if (active) setError(cause.message) })
    return () => { active = false }
  }, [savedRequestToken])

  function changeCompanion(index, value) {
    setCompanions((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, ...value } : item))
  }

  async function copyPixKey() {
    try {
      await navigator.clipboard.writeText(config.pix.key)
      notify('Chave Pix copiada.')
    } catch {
      notify('Selecione a chave para copiá-la.')
    }
  }

  async function submitRsvp(event) {
    event.preventDefault()
    if (!turnstileToken) {
      setError('Conclua a verificação de segurança para enviar a solicitação.')
      return
    }
    setBusy(true)
    setError('')
    try {
      if (!idempotencyKey.current) idempotencyKey.current = crypto.randomUUID()
      if (!requestTokenRef.current) requestTokenRef.current = createOpaqueToken()
      const response = await fetch(`/api/public/weddings/${encodeURIComponent(slug)}/rsvp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId, name, email, phone, attendanceStatus, companions: attendanceStatus === 'confirmed' ? companions : [], idempotencyKey: idempotencyKey.current, requestToken: requestTokenRef.current, turnstileToken }),
      })
      const result = await response.json()
      if (!response.ok) {
      const messages = { too_many_requests: 'Muitas tentativas. Aguarde alguns minutos e tente novamente.', turnstile_unavailable: 'A validação de segurança não está disponível agora.', turnstile_verification_failed: 'A validação expirou. Faça-a novamente.', event_not_available: 'Este evento não está disponível pelo link público.', companion_limit_reached: 'A quantidade de acompanhantes ultrapassa o limite definido pelos noivos.', use_individual_invitation: 'Este contato já tem um convite individual. Use o link enviado pelos noivos.', rsvp_unavailable: 'A confirmação não está disponível neste convite.' }
        throw new Error(messages[result.error] || 'Não foi possível enviar a solicitação. Confira os dados e tente novamente.')
      }
      const token = result.requestToken || (requestUrl ? requestUrl.split('#solicitacao/')[1] : '')
      if (token) setRequestUrl(`${window.location.origin}/confirmar-presenca#solicitacao/${token}`)
      setPublicCredential(result.credential || null)
      setRsvpEmailSent(Boolean(result.emailSent))
      setPublicRsvpStatus(attendanceStatus)
      if (token) window.history.replaceState(window.history.state, '', `${window.location.pathname}${window.location.search}#presenca/${token}`)
      idempotencyKey.current = ''
      requestTokenRef.current = ''
      setTurnstileToken('')
      setTurnstileReset((current) => current + 1)
      notify(result.credential ? 'Presença confirmada. Seu QR individual está disponível.' : 'Resposta registrada.')
    } catch (cause) {
      setError(cause.message || 'Não foi possível enviar a solicitação.')
      setTurnstileToken('')
      setTurnstileReset((current) => current + 1)
    } finally {
      setBusy(false)
    }
  }

  if (loading) return <RoleFrame icon={Heart} eyebrow="CONVITE DO CASAMENTO" title="Abrindo o convite." description="Carregando as informações publicadas pelos noivos." publicPage secureName="Convite do casamento" secureFooter="Link do convite" />
  if (error && !data) return <RoleFrame icon={Heart} eyebrow="CONVITE DO CASAMENTO" title="Este convite não está disponível." description={error} publicPage secureName="Convite do casamento" secureFooter="Link do convite" />

  const publicNavigationItems = orderedSiteSections(config).flatMap((section) => {
    if (section === 'Nossa história' && (config?.storyMessages?.[config?.language] || config?.storyMessages?.['pt-BR'])) return [{ label: getSiteSectionTitle(config, section), href: '#nossa-historia' }]
    if (section === 'Linha do tempo' && config?.timeline?.some((item) => item.title?.trim())) return [{ label: getSiteSectionTitle(config, section), href: '#historia-marcos' }]
    if (section === 'Padrinhos e madrinhas' && config?.godparents?.some((person) => person.name?.trim() && person.photoId)) return [{ label: getSiteSectionTitle(config, section), href: '#padrinhos' }]
    if (section === 'Mural de recados') return [{ label: getSiteSectionTitle(config, section), href: '#mural-de-recados' }]
    if (section === 'Contagem regressiva' && data.wedding.eventDate) return [{ label: getSiteSectionTitle(config, section), href: '#contagem-regressiva' }]
    if (section === 'Eventos') return [{ label: getSiteSectionTitle(config, section), href: '#eventos' }]
    if (section === 'Cronograma' && eventList.length) return [{ label: getSiteSectionTitle(config, section), href: '#cronograma-do-dia' }]
    if (section === 'Dress code' && config?.weddingDetails?.dressCode?.trim()) return [{ label: getSiteSectionTitle(config, section), href: '#dress-code' }]
    if (section === 'Galeria de fotos' && (config?.siteGallery?.length || (config?.siteCarouselEnabled && config?.siteCarouselPhotos?.length))) return [{ label: getSiteSectionTitle(config, section), href: '#fotos-do-casal' }]
    if (section === 'Hospedagem e dicas' && config?.sectionContent?.[section]?.['pt-BR']?.body?.trim()) return [{ label: getSiteSectionTitle(config, section), href: '#hospedagem' }]
    if (section === 'Perguntas frequentes' && config?.sectionContent?.[section]?.['pt-BR']?.body?.trim()) return [{ label: getSiteSectionTitle(config, section), href: '#perguntas-frequentes' }]
    if (section === 'Playlist' && safeHttpsLink(config?.sectionContent?.[section]?.['pt-BR']?.body)) return [{ label: getSiteSectionTitle(config, section), href: '#playlist' }]
    if (section === 'Vídeo' && (config?.coverVideoId || safeHttpsLink(config?.sectionContent?.[section]?.['pt-BR']?.body))) return [{ label: getSiteSectionTitle(config, section), href: '#video' }]
    if (section === 'Contato' && config?.sectionContent?.[section]?.['pt-BR']?.body?.trim()) return [{ label: getSiteSectionTitle(config, section), href: '#contato' }]
    if (section === 'Confirmação de presença') return [{ label: getSiteSectionTitle(config, section), href: '#confirmar-presenca' }]
    return []
  })
  const publicGivingOptions = [
    ...(showGifts ? [{ label: 'Ver lista de presentes', href: giftDisplayMode === 'inline' ? '#presentes' : `${weddingUrl}?pagina=presentes` }] : []),
    ...(showPix ? [{ label: 'Presentear via Pix', href: pixDisplayMode === 'inline' ? '#pix' : `${weddingUrl}?pagina=pix` }] : []),
  ]

  if (requestedPage === 'presentes' || requestedPage === 'pix') {
    const kind = requestedPage === 'presentes' ? 'gifts' : 'pix'
    const pageAvailable = kind === 'gifts' ? showGifts : showPix
    return <main className={`public-wedding-page theme-${config?.theme || 'garden'}`} style={siteStyle}><header className="public-wedding-header"><a href={weddingUrl}>{data.wedding.partnerOneName} <i>&amp;</i> {data.wedding.partnerTwoName}</a><a className="public-wedding-back-link" href={weddingUrl}><ArrowLeft size={15} /> Voltar ao convite</a><a href="https://henriquesouzas.com" target="_blank" rel="noreferrer">henriquesouzas.com</a></header>{pageAvailable ? <WeddingDisplayPage kind={kind} href={weddingUrl} weddingName={`${data.wedding.partnerOneName} & ${data.wedding.partnerTwoName}`} gifts={publicGiftList} presentation={config.giftPresentation || {}} mediaUrl={(id) => `/api/public/weddings/${encodeURIComponent(slug)}/media/${id}`} imageAltTexts={config.imageAltTexts} pix={config.pix} onCopy={copyPixKey} /> : <section className="public-wedding-display-page"><span className="eyebrow">CONVITE</span><h1>Esta opção não está disponível.</h1><a className="button-outline" href={weddingUrl}>Voltar ao convite</a></section>}<footer className="public-wedding-footer"><span>Com carinho, {data.wedding.partnerOneName} &amp; {data.wedding.partnerTwoName}</span><a href="https://henriquesouzas.com" target="_blank" rel="noreferrer">henriquesouzas.com</a></footer></main>
  }

  return <WeddingInvitationDocument theme={config?.theme} animationPreset={config?.animationPreset} style={siteStyle} partnerOneName={data.wedding.partnerOneName} partnerTwoName={data.wedding.partnerTwoName} navigation={<WeddingNavigation items={publicNavigationItems} givingOptions={publicGivingOptions} />}>
    <WeddingInvitationCover animationPreset={config?.animationPreset} theme={config?.theme || 'garden'} layout={config?.coverLayout} composition={config?.coverComposition} textAlign={config?.coverTextAlign} textPosition={config?.coverTextPosition} overlayOpacity={config?.coverOverlayOpacity} imagePosition={config?.coverImagePositionDesktop || config?.coverImagePosition} mobileImagePosition={config?.coverImagePositionMobile || config?.coverImagePositionDesktop || config?.coverImagePosition} photoAlt={imageAltText(config, coverId, 'Foto escolhida pelo casal')} partnerOneName={data.wedding.partnerOneName} partnerTwoName={data.wedding.partnerTwoName} date={data.wedding.eventDate ? new Date(`${data.wedding.eventDate}T12:00:00`).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Data a confirmar'} time={data.wedding.eventTime} message={config?.coverMessages?.[config?.language] || config?.coverMessages?.['pt-BR']} photoUrl={coverUrl} videoUrl={coverVideoUrl} showRsvp={config?.enabledSections?.includes('Confirmação de presença')} carouselCount={config?.coverCarouselEnabled ? coverGallery.length : 0} carouselIndex={coverIndex} />
    <WeddingInvitationContent config={config} eventDate={data.wedding.eventDate} eventTime={data.wedding.eventTime} events={eventList} gifts={publicGiftList} giftPresentation={config.giftPresentation || {}} mediaUrl={(id) => `/api/public/weddings/${encodeURIComponent(slug)}/media/${id}`} timezone={data.wedding.timezone} showGifts={showGifts} showPix={showPix} rsvpSection={config?.enabledSections?.includes('Confirmação de presença') ? <WeddingInvitationRsvp title={getSiteSectionTitle(config, EDITABLE_SITE_SECTION_TITLES[8][0])} requestUrl={requestUrl} publicRsvpStatus={publicRsvpStatus} publicCredential={publicCredential} rsvpEmailSent={rsvpEmailSent} error={error} eventList={eventList} eventId={eventId} setEventId={setEventId} name={name} setName={setName} email={email} setEmail={setEmail} phone={phone} setPhone={setPhone} attendanceStatus={attendanceStatus} setAttendanceStatus={setAttendanceStatus} companions={companions} maxCompanions={maxCompanions} changeCompanion={changeCompanion} setCompanions={setCompanions} setTurnstileToken={setTurnstileToken} turnstileToken={turnstileToken} turnstileReset={turnstileReset} submitRsvp={submitRsvp} busy={busy} /> : null} wallSection={config?.enabledSections?.includes('Mural de recados') ? <WeddingWallSection messages={data.wallMessages} slug={slug} title={getSiteSectionTitle(config, 'Mural de recados')} /> : null} onCopyPix={copyPixKey} weddingUrl={weddingUrl} />
  </WeddingInvitationDocument>
}

function AttendanceRequestPortal({ notify }) {
  const requestToken = window.location.hash.startsWith('#solicitacao/') ? window.location.hash.slice(13) : ''
  const [data, setData] = useState(null)
  const [credentials, setCredentials] = useState([])
  const [loading, setLoading] = useState(Boolean(requestToken))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    if (!requestToken) {
      setLoading(false)
      setError('Abra o link seguro que apareceu após enviar a solicitação.')
      return undefined
    }
    fetch('/api/public/attendance-requests/lookup', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ requestToken }) })
      .then(async (response) => {
        const result = await response.json()
        if (!response.ok) throw new Error('Este link não é válido ou não está mais disponível.')
        if (!active) return
        setData(result)
        if (result.request.reviewStatus === 'approved' && result.request.attendanceStatus === 'confirmed') {
          const credentialResponse = await fetch('/api/public/attendance-requests/credentials', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ requestToken }) })
          const credentialResult = await credentialResponse.json()
          if (!credentialResponse.ok) throw new Error('Não foi possível recuperar o QR agora. Tente novamente mais tarde.')
          if (active) setCredentials(credentialResult.credentials)
        }
      }).catch((cause) => { if (active) setError(cause.message) }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [requestToken])

  async function recoverCredentials() {
    setBusy(true)
    setError('')
    try {
      const statusResponse = await fetch('/api/public/attendance-requests/lookup', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ requestToken }) })
      const statusResult = await statusResponse.json()
      if (!statusResponse.ok) throw new Error('Não foi possível atualizar a situação da confirmação.')
      setData(statusResult)
      if (statusResult.request.reviewStatus !== 'approved' || statusResult.request.attendanceStatus !== 'confirmed') {
        setCredentials([])
        notify('A solicitação ainda está aguardando a análise dos noivos.')
        return
      }
      const response = await fetch('/api/public/attendance-requests/credentials', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ requestToken }) })
      const result = await response.json()
      if (!response.ok) throw new Error('As credenciais ainda não estão disponíveis.')
      setCredentials(result.credentials)
      notify('Confirmação atualizada. Os QRs disponíveis foram carregados.')
    } catch (cause) {
      setError(cause.message)
    } finally {
      setBusy(false)
    }
  }

  const request = data?.request
  const reviewLabel = request?.reviewStatus === 'pending' ? 'Aguardando análise dos noivos' : request?.reviewStatus === 'rejected' ? 'Resposta não aprovada' : 'Resposta registrada'
  return <RoleFrame icon={QrCode} eyebrow="ACOMPANHAMENTO DO CONVITE" title={loading ? 'Abrindo solicitação.' : request ? `Olá, ${request.name}.` : 'Solicitação de presença.'} description={loading ? 'Consultando o andamento.' : request ? `${request.partnerOneName} e ${request.partnerTwoName} · ${request.eventName}` : error} secure secureName="Acompanhamento da presença" secureFooter="Link individual e privado">
    {request && <section className="role-card attendance-request-card"><span className={`admin-state ${request.reviewStatus === 'approved' ? 'admin-state-active' : ''}`}>{reviewLabel}</span><p>Resposta: {request.attendanceStatus === 'confirmed' ? 'Vou comparecer' : 'Não poderei comparecer'}.</p>{request.reviewStatus === 'pending' && <p>Os noivos ainda estão analisando esta resposta.</p>}{request.reviewStatus === 'rejected' && <p>Fale diretamente com os noivos se precisar revisar esta resposta.</p>}{data.companions.length > 0 && <div className="attendance-request-companions"><strong>Acompanhantes solicitados</strong>{data.companions.map((item) => <span key={item.id}>{item.name || 'Nome ainda não informado'} · {item.status === 'pending' ? 'Aguardando análise' : item.status === 'approved' ? 'Aprovado' : 'Não aprovado'}</span>)}</div>}{request.reviewStatus === 'approved' && request.attendanceStatus === 'confirmed' && <button type="button" className="button-outline" disabled={busy} onClick={recoverCredentials}>{busy ? 'Carregando…' : 'Atualizar QR individual'} <QrCode size={15} /></button>}</section>}
    {credentials.map((item) => <CredentialCard key={item.guestId} credential={item} />)}
    {error && !loading && <p className="admin-form-error" role="alert">{error}</p>}
  </RoleFrame>
}

function CredentialCard({ credential }) {
  const [qr, setQr] = useState('')
  const [walletInfo, setWalletInfo] = useState(null)
  const accessToken = credential.accessUrl.includes('#convite/') ? credential.accessUrl.split('#convite/')[1] : ''
  useEffect(() => { QRCode.toDataURL(credential.accessUrl, { width: 220, margin: 1, errorCorrectionLevel: 'M' }).then(setQr).catch(() => setQr('')) }, [credential.accessUrl])
  useEffect(() => {
    if (!accessToken) return
    fetch('/api/invitation', { headers: { Authorization: `Bearer ${accessToken}` } }).then((response) => response.ok ? response.json() : null).then((result) => { if (result?.wallets) setWalletInfo(result.wallets) }).catch(() => {})
  }, [accessToken])
  return <><section className="role-card individual-credential-card"><div><span className="eyebrow">CREDENCIAL INDIVIDUAL</span><h2>{credential.name}</h2><p>Este QR code vale somente para esta pessoa. Apresente-o à equipe na entrada do evento.</p><input readOnly aria-label={`Link individual de ${credential.name}`} value={credential.accessUrl} onFocus={(event) => event.target.select()} /></div>{qr && <div><img src={qr} alt={`QR code individual de ${credential.name}`} /><a className="button-outline" href={qr} download={`qr-${credential.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.png`}>Baixar QR code</a></div>}</section>{walletInfo && <InvitationWallet token={accessToken} wallets={walletInfo} guestName={credential.name} />}</>
}

function InvitationWallet({ token, wallets, guestName }) {
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')

  async function add(provider) {
    setBusy(provider)
    setError('')
    try {
      const response = await fetch(`/api/invitation/wallet/${provider}`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } })
      if (!response.ok) {
        const result = await response.json().catch(() => ({}))
        throw new Error(result.error === 'wallet_not_configured' ? 'A carteira ainda não foi configurada pelos noivos.' : 'Não foi possível preparar o convite para a carteira. Tente novamente ou abra o link individual.')
      }
      if (provider === 'google') {
        const result = await response.json()
        window.location.assign(result.url)
      } else {
        const file = await response.blob()
        const url = URL.createObjectURL(file)
        const link = document.createElement('a')
        link.href = url
        link.download = `convite-${guestName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.pkpass`
        document.body.append(link)
        link.click()
        link.remove()
        window.setTimeout(() => URL.revokeObjectURL(url), 60_000)
      }
    } catch (cause) {
      setError(cause.message)
    } finally {
      setBusy('')
    }
  }

  return <section className="role-card guest-wallet-card"><div><span className="eyebrow">SEU CONVITE NO CELULAR</span><h2>Adicionar à carteira</h2><p>Guarde o convite individual no Apple Wallet ou no Google Wallet e apresente o QR code na entrada.</p></div><div>{wallets?.apple && <button type="button" className="button-outline" disabled={Boolean(busy)} onClick={() => add('apple')}>{busy === 'apple' ? 'Preparando…' : 'Adicionar ao Apple Wallet'} <Wallet size={15} /></button>}{wallets?.google && <button type="button" className="button-primary" disabled={Boolean(busy)} onClick={() => add('google')}>{busy === 'google' ? 'Preparando…' : 'Adicionar ao Google Wallet'} <Wallet size={15} /></button>}{!wallets?.apple && !wallets?.google && <p className="guest-wallet-unavailable">A carteira digital ainda não está configurada para este convite. Use o QR code ou o link individual.</p>}{error && <p className="admin-form-error" role="alert">{error}</p>}</div></section>
}

function GuestPortal({ notify, setView }) {
  const [invitation, setInvitation] = useState(null)
  const [invitationMedia, setInvitationMedia] = useState({})
  const [coverIndex, setCoverIndex] = useState(0)
  const [siteOpen, setSiteOpen] = useState(false)
  const [guestPage, setGuestPage] = useState('')
  const [focusRsvp, setFocusRsvp] = useState(false)
  const [focusGifts, setFocusGifts] = useState(false)
  const [focusPix, setFocusPix] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const token = window.location.hash.startsWith('#convite/') ? window.location.hash.slice(9) : ''
  const siteTheme = THEMES.find((item) => item.id === invitation?.siteConfig?.theme)
  const sitePalettes = siteTheme ? getThemePalettes(siteTheme, invitation?.siteConfig?.customAccent) : []
  const activePalette = sitePalettes[invitation?.siteConfig?.paletteIndex] || sitePalettes[0]
  const siteFonts = SITE_FONT_PAIRS[invitation?.siteConfig?.fontPair] || SITE_FONT_PAIRS['Clássico editorial'];
  const siteStyle = activePalette ? { '--forest': activePalette[0], '--ink': activePalette[0], '--accent': activePalette[1], '--paper': activePalette[2], '--font-heading': siteFonts[0], '--font-body': siteFonts[1], '--site-text-scale': invitation?.siteConfig?.fontScale === 'small' ? '.92' : invitation?.siteConfig?.fontScale === 'large' ? '1.1' : '1' } : undefined
  const coverLayout = invitation?.siteConfig?.coverVideoId ? 'video' : ['full', 'split', 'arch'].includes(invitation?.siteConfig?.coverLayout) ? invitation.siteConfig.coverLayout : 'full'
  const coverComposition = ['side', 'overlay', 'editorial'].includes(invitation?.siteConfig?.coverComposition) ? invitation.siteConfig.coverComposition : invitation?.siteConfig?.coverLayout === 'split' ? 'side' : invitation?.siteConfig?.coverLayout === 'full' ? 'overlay' : null
  const coverTextAlign = ['left', 'center', 'right'].includes(invitation?.siteConfig?.coverTextAlign) ? invitation.siteConfig.coverTextAlign : 'left'
  const coverTextPosition = ['top', 'center', 'bottom'].includes(invitation?.siteConfig?.coverTextPosition) ? invitation.siteConfig.coverTextPosition : 'center'
  const coverImagePositionDesktopValue = invitation?.siteConfig?.coverImagePositionDesktop || invitation?.siteConfig?.coverImagePosition || 'center'
  const coverImagePositionMobileValue = invitation?.siteConfig?.coverImagePositionMobile || coverImagePositionDesktopValue
  const coverObjectPositions = { center: 'center center', top: 'center top', bottom: 'center bottom', left: 'left center', right: 'right center' }
  const coverOverlayOpacity = Number.isInteger(invitation?.siteConfig?.coverOverlayOpacity) ? Math.min(75, Math.max(10, invitation.siteConfig.coverOverlayOpacity)) : 45
  const guestCoverStyle = { '--cover-text-align': coverTextAlign, '--cover-copy-align': coverTextAlign === 'center' ? 'center' : coverTextAlign === 'right' ? 'flex-end' : 'flex-start', '--cover-copy-justify': ({ top: 'flex-start', center: 'center', bottom: 'flex-end' })[coverTextPosition], '--cover-overlay-opacity': coverOverlayOpacity / 100, '--cover-image-position-desktop': coverObjectPositions[coverImagePositionDesktopValue] || 'center center', '--cover-image-position-mobile': coverObjectPositions[coverImagePositionMobileValue] || coverObjectPositions[coverImagePositionDesktopValue] || 'center center' }
  const coverGallery = invitation?.siteConfig?.coverGallery || []
  const siteGallery = invitation?.siteConfig?.siteGallery || []
  const activeCoverId = invitation?.siteConfig?.coverCarouselEnabled && coverGallery.length ? coverGallery[coverIndex] : invitation?.siteConfig?.coverPhotoId || coverGallery[0]
  const activeCoverUrl = invitationMedia[activeCoverId] || ''
  const autoplayCoverVideo = shouldAutoplayWeddingCoverVideo(invitation?.siteConfig?.animationPreset, globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches || false, globalThis.navigator?.connection?.saveData || false)
  const publicSections = invitation?.siteConfig?.enabledSections || []
  const showEvents = publicSections.includes('Eventos')
  const showRsvp = publicSections.includes('Confirmação de presença')
  const giftDisplayMode = ['inline', 'page', 'hidden'].includes(invitation?.siteConfig?.giftDisplayMode) ? invitation.siteConfig.giftDisplayMode : publicSections.includes('Lista de presentes') ? 'inline' : 'hidden'
  const pixDisplayMode = ['inline', 'page', 'hidden'].includes(invitation?.siteConfig?.pixDisplayMode) ? invitation.siteConfig.pixDisplayMode : invitation?.siteConfig?.pix?.enabled ? 'inline' : 'hidden'
  const showPix = Boolean(invitation?.siteConfig?.pix?.enabled && invitation.siteConfig.pix.key?.trim() && pixDisplayMode !== 'hidden')
  const maxInvitedCompanions = invitation?.guestPolicy?.companionsAllowed ? Math.min(Math.max(0, invitation.guest.partySize - 1), invitation.guestPolicy.maxCompanions) : 0
  const publicGifts = giftDisplayMode === 'hidden' ? [] : (invitation?.gifts || []).filter((gift) => gift.fulfillment_type === 'store_link' || showPix)
  const showGifts = giftDisplayMode !== 'hidden' && publicGifts.length > 0
  const hasMoreInvitationContent = Boolean(
    (showEvents && (invitation?.siteConfig?.weddingDetails?.menu
      || invitation?.siteConfig?.weddingDetails?.dressCode
      || invitation?.siteConfig?.weddingDetails?.schedule))
    || (invitation?.siteConfig?.enabledSections?.includes('Nossa história') && (invitation.siteConfig.storyMessages?.[invitation.siteConfig.language] || invitation.siteConfig.storyMessages?.['pt-BR']))
    || showPix
    || showGifts
    || (publicSections.includes('Galeria de fotos') && siteGallery.length > 0)
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

  useEffect(() => {
    if (!siteOpen) return
    const target = focusRsvp ? 'guest-site-rsvp' : focusGifts ? 'guest-site-gifts' : focusPix ? 'guest-site-pix' : null
    if (!target) return
    document.getElementById(target)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    setFocusRsvp(false)
    setFocusGifts(false)
    setFocusPix(false)
  }, [siteOpen, focusRsvp, focusGifts, focusPix])

  useEffect(() => {
    if (!invitation?.siteConfig) return
    let active = true
    const ids = [...new Set([...(invitation.siteConfig.coverPhotoId ? [invitation.siteConfig.coverPhotoId] : []), ...(invitation.siteConfig.coverGallery || []), ...(invitation.siteConfig.siteGallery || []), ...(invitation.siteConfig.coverVideoId ? [invitation.siteConfig.coverVideoId] : []), ...(invitation.siteConfig.timeline || []).map((item) => item.photoId).filter(Boolean), ...(invitation.siteConfig.godparents || []).map((item) => item.photoId).filter(Boolean), ...Object.values(invitation.siteConfig.giftPresentation || {}).map((item) => item.photoId).filter(Boolean)])]
    Promise.all(ids.map(async (id) => {
      const response = await fetch(`/api/site-media/${id}`, { headers: { Authorization: `Bearer ${token}` } })
      if (!response.ok) return [id, '']
      return [id, URL.createObjectURL(await response.blob())]
    })).then((entries) => {
      if (!active) { entries.forEach(([, url]) => url && URL.revokeObjectURL(url)); return }
      setInvitationMedia(Object.fromEntries(entries.filter(([, url]) => url)))
    }).catch(() => {})
    return () => { active = false }
  }, [invitation?.siteConfig?.coverPhotoId, invitation?.siteConfig?.coverVideoId, JSON.stringify(invitation?.siteConfig?.coverGallery || []), JSON.stringify(invitation?.siteConfig?.siteGallery || []), token])

  useEffect(() => {
    const gallery = invitation?.siteConfig?.coverGallery || []
    if (!invitation?.siteConfig?.coverCarouselEnabled || gallery.length < 2) return undefined
    const timer = window.setInterval(() => setCoverIndex((current) => (current + 1) % gallery.length), 5000)
    return () => window.clearInterval(timer)
  }, [invitation?.siteConfig?.coverCarouselEnabled, invitation?.siteConfig?.coverGallery])

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

  async function copyPixKey() {
    try {
      await navigator.clipboard.writeText(invitation.siteConfig.pix.key)
      notify('Chave Pix copiada!')
    } catch {
      notify('Selecione a chave Pix e copie para usar no aplicativo do seu banco.')
    }
  }

  return <RoleFrame icon={UserRound} eyebrow="CONVITE INDIVIDUAL" title={invitation ? `Olá, ${invitation.guest.name}.` : 'Seu convite individual.'} description={invitation ? `Você está convidado para celebrar com ${invitation.wedding.partnerOneName} e ${invitation.wedding.partnerTwoName}.` : 'Os detalhes são exibidos somente pelo link individual enviado pelos noivos.'} secure secureName="Seu convite" secureFooter="Convite individual" compactIntro={Boolean(invitation)} className="guest-invitation-page" style={siteStyle}>
    {loading && <section className="role-card"><p>Carregando os detalhes do seu convite…</p></section>}
    {error && !loading && <section className="role-card"><p>{error}</p></section>}
    {invitation && <>
      <section className={`role-card guest-pass-card${activeCoverUrl ? '' : ' guest-cover-no-photo'}`}><div className={`guest-invitation-cover guest-cover-${coverLayout}${coverComposition ? ` public-wedding-cover-composition-${coverComposition}` : ''}${activeCoverUrl ? '' : ' guest-cover-no-photo'}`} style={guestCoverStyle}>{invitation?.siteConfig?.coverVideoId && invitationMedia[invitation.siteConfig.coverVideoId] ? <video className="guest-cover-video" src={invitationMedia[invitation.siteConfig.coverVideoId]} poster={activeCoverUrl || undefined} autoPlay={autoplayCoverVideo} controls={!autoplayCoverVideo} muted loop playsInline aria-label="Vídeo de abertura dos noivos" /> : activeCoverUrl ? <img src={activeCoverUrl} alt={imageAltText(invitation.siteConfig, activeCoverId, "Foto do casal no convite")} /> : <div className="guest-cover-placeholder"><Camera size={38} /><span>Escolham uma foto do casal no painel</span></div>}{invitation.siteConfig?.coverCarouselEnabled && coverGallery.length > 1 && <span className="guest-cover-count">Foto {coverIndex + 1} de {coverGallery.length}</span>}<div><span>CONVITE</span><h2>{invitation.wedding.partnerOneName} <i>&amp;</i> {invitation.wedding.partnerTwoName}</h2><p>{invitation.wedding.eventDate ? new Date(`${invitation.wedding.eventDate}T12:00:00`).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Data a confirmar'}{invitation.wedding.eventTime ? ` · ${invitation.wedding.eventTime}` : ''}</p></div></div><div className="role-card-heading"><span className="eyebrow">Convite de {invitation.guest.name}</span></div><div className="guest-pass-details"><span><Users size={16} /> Até {invitation.guest.partySize} {invitation.guest.partySize === 1 ? 'pessoa' : 'pessoas'}</span></div>{invitation.siteConfig && <p className="guest-cover-message">{invitation.siteConfig.coverMessages?.[invitation.siteConfig.language] || invitation.siteConfig.coverMessages?.['pt-BR']}</p>}<div className="guest-invitation-actions"><button type="button" className="button-primary" onClick={() => setSiteOpen(true)}>Abrir site do casamento <ArrowRight size={16} /></button>{showRsvp && <button type="button" className="button-outline" onClick={() => { setFocusRsvp(true); setSiteOpen(true) }}>Confirmar presença</button>}{showGifts && <button type="button" className="button-outline" onClick={() => { setFocusGifts(giftDisplayMode === 'inline'); setGuestPage(giftDisplayMode === 'page' ? 'gifts' : ''); setSiteOpen(true) }}>{giftDisplayMode === 'page' ? 'Ver lista de presentes' : 'Lista de presentes'} <Gift size={15} /></button>}{showPix && <button type="button" className="button-outline" onClick={() => { setFocusPix(pixDisplayMode === 'inline'); setGuestPage(pixDisplayMode === 'page' ? 'pix' : ''); setSiteOpen(true) }}>{pixDisplayMode === 'page' ? 'Presentear via Pix' : 'Contribuir via Pix'} <Wallet size={15} /></button>}</div></section>
      <InvitationWallet token={token} wallets={invitation.wallets} guestName={invitation.guest.name} />
      {siteOpen && <div className="guest-full-site-heading"><div><span className="eyebrow">SITE DO CASAMENTO</span><h2>{guestPage === 'gifts' ? 'Lista de presentes' : guestPage === 'pix' ? 'Presentear via Pix' : 'Informações para celebrar com vocês'}</h2></div><button type="button" className="button-outline" onClick={() => { if (guestPage) { setGuestPage(''); return } setSiteOpen(false); window.scrollTo({ top: 0, behavior: 'smooth' }) }}>{guestPage ? 'Voltar ao site' : 'Voltar ao convite'}</button></div>}
      {siteOpen && guestPage && <section className="guest-invitation-content guest-invitation-subpage">{guestPage === 'gifts' ? <WeddingGiftsSection gifts={publicGifts} presentation={invitation.siteConfig.giftPresentation || {}} mediaUrl={(id) => invitationMedia[id] || ''} imageAltTexts={invitation.siteConfig.imageAltTexts} /> : <WeddingPixSection pix={invitation.siteConfig.pix} onCopy={copyPixKey} />}</section>}
      {siteOpen && !guestPage && <>
      {siteOpen && hasMoreInvitationContent && <div className="guest-invitation-content">
        {invitation.siteConfig?.enabledSections?.includes('Nossa história') && (invitation.siteConfig.storyMessages?.[invitation.siteConfig.language] || invitation.siteConfig.storyMessages?.['pt-BR']) && <section className="guest-story-section"><span className="eyebrow">NOSSA HISTÓRIA</span><p>{invitation.siteConfig.storyMessages?.[invitation.siteConfig.language] || invitation.siteConfig.storyMessages?.['pt-BR']}</p></section>}
        {showEvents && invitation.siteConfig?.weddingDetails?.schedule && <section className="guest-story-section"><span className="eyebrow">ORIENTAÇÕES</span><p>{invitation.siteConfig.weddingDetails.schedule}</p></section>}
        {showEvents && invitation.siteConfig?.weddingDetails?.menu && <section className="guest-story-section"><span className="eyebrow">CARDÁPIO</span><p>{invitation.siteConfig.weddingDetails.menu}</p></section>}
        {showEvents && invitation.siteConfig?.weddingDetails?.dressCode && <section className="guest-story-section"><span className="eyebrow">TRAJE</span><h2>{invitation.siteConfig.weddingDetails.dressCode}</h2></section>}
      </div>}
      {siteOpen && invitation.guest.guestType === 'godparent' && <section className="role-card"><span className="eyebrow">ESPAÇO DOS PADRINHOS</span><h2>Orientações individuais</h2><p>Consulte as tarefas e os combinados enviados a você.</p><button className="button-outline" onClick={() => setView('godparent')}>Abrir minha área <ArrowRight size={14} /></button></section>}
      {siteOpen && invitation.siteConfig?.guestCamera?.enabled && invitation.events.length > 0 && <GuestCamera token={token} events={invitation.events} limit={invitation.siteConfig.guestCamera.photoLimit} notify={notify} />}
      {siteOpen && showEvents && !showRsvp && <section className="guest-site-events guest-site-events-readonly"><span className="eyebrow">PROGRAMAÇÃO</span>{invitation.events.length ? invitation.events.map((event) => <article className="guest-public-event" key={event.id}><div><small>{EVENT_TYPE_LABELS[event.event_type] || 'Evento'}</small><h3>{event.name}</h3></div><p>{event.starts_at ? formatInviteEventDate(event.starts_at, 'pt-BR', invitation.wedding.timezone) : 'Data a definir'}</p>{(event.venue_name || event.address) && <div className="public-wedding-event-location">{event.venue_name && <strong>{event.venue_name}</strong>}{event.address && <><span>{event.address}</span><a href={eventMapUrl(event.address)} target="_blank" rel="noreferrer">Ver localização <ExternalLink size={14} /></a></>}</div>}</article>) : <p>Os detalhes dos eventos ainda não foram publicados.</p>}</section>}
      {siteOpen && showRsvp && <section id="guest-site-rsvp" className="guest-site-events"><span className="eyebrow">EVENTOS E CONFIRMAÇÃO</span>{invitation.events.length ? invitation.events.map((event, index) => <InvitationEventCard key={event.id} event={event} timezone={invitation.wedding.timezone} initialOpen={index === 0} maxPartySize={maxInvitedCompanions} onSubmit={saveRsvp} />) : <section className="role-card"><p>Os detalhes dos eventos ainda não foram publicados.</p></section>}</section>}
      {siteOpen && showRsvp && <GuestCompanionManager token={token} events={invitation.events} partySize={invitation.guest.partySize} notify={notify} />}
      {siteOpen && publicSections.includes('Galeria de fotos') && siteGallery.length > 0 && <section className="guest-story-section guest-site-gallery-public"><span className="eyebrow">FOTOS DO CASAL</span><div>{siteGallery.map((id) => invitationMedia[id] && <img key={id} src={invitationMedia[id]} alt={imageAltText(invitation.siteConfig, id, "Foto do casal")} />)}</div></section>}
      {siteOpen && showGifts && (giftDisplayMode === 'inline' ? <section id="guest-site-gifts" className="guest-site-gifts"><div className="guest-site-section-heading"><span className="eyebrow">LISTA DE PRESENTES</span><h2>Um carinho para os noivos</h2><p>Escolha uma ideia. O Pix vai diretamente aos noivos; compras e entregas de itens físicos são combinadas fora do site.</p></div><div className="guest-public-gifts">{publicGifts.map((gift) => <article className="guest-public-gift" key={gift.id}><div><h3>{gift.title}</h3>{gift.description && <p>{gift.description}</p>}{gift.fulfillment_type === 'store_link' && <small>A compra e a entrega são concluídas com a loja.</small>}</div>{gift.fulfillment_type === 'store_link' && gift.store_url ? <a href={gift.store_url} target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer">Abrir loja <ArrowRight size={14} /></a> : <div className="guest-gift-action">{gift.gift_type === 'custom' ? <strong>Qualquer valor</strong> : <strong>Valor sugerido: {formatBrlCents(gift.amount_cents)}</strong>}{showPix && <button type="button" className="button-outline" onClick={() => { setFocusPix(true); document.getElementById('guest-site-pix')?.scrollIntoView({ behavior: 'smooth', block: 'start' }) }}>Presentear via Pix <ArrowRight size={14} /></button>}</div>}</article>)}</div></section> : <section className="public-wedding-display-cta"><span className="eyebrow">LISTA DE PRESENTES</span><h2>Um carinho para os noivos</h2><button className="button-primary" type="button" onClick={() => setGuestPage('gifts')}>Ver lista de presentes <ArrowRight size={15} /></button></section>)}
      {siteOpen && showPix && (pixDisplayMode === 'inline' ? <section id="guest-site-pix" className="guest-site-pix"><span className="eyebrow">PRESENTE DIRETO AOS NOIVOS</span><h2>Pix direto, sem intermediação</h2><p>Copie a chave e transfira pelo aplicativo do seu banco. Se escolheu um item com valor sugerido, digite esse valor no banco e confira o nome do titular antes de confirmar. A plataforma não recebe nem registra a transferência.</p>{invitation.siteConfig.pix.holderName && <p className="guest-pix-holder">Titular: {invitation.siteConfig.pix.holderName}</p>}<div className="guest-pix-copy-row"><input readOnly aria-label="Chave Pix dos noivos" value={invitation.siteConfig.pix.key} onFocus={(event) => event.target.select()} /><button type="button" className="button-primary" onClick={copyPixKey}><Copy size={15} /> Copiar chave</button></div></section> : <section className="public-wedding-display-cta"><span className="eyebrow">UM PRESENTE COM CARINHO</span><h2>Se desejarem, presenteiem os noivos via Pix.</h2><button className="button-primary" type="button" onClick={() => setGuestPage('pix')}>Presentear via Pix <ArrowRight size={15} /></button></section>)}
      </>}
    </>}
  </RoleFrame>
}

function GuestCompanionManager({ token, events, partySize, notify }) {
  const [companions, setCompanions] = useState([])
  const [policy, setPolicy] = useState({ companionsAllowed: false, maxCompanions: 0 })
  const [remaining, setRemaining] = useState(0)
  const [eventId, setEventId] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [turnstileToken, setTurnstileToken] = useState('')
  const [turnstileReset, setTurnstileReset] = useState(0)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [share, setShare] = useState(null)
  const confirmedEvents = events.filter((event) => event.rsvp?.status === 'confirmed')
  async function load() {
    const response = await fetch('/api/invitation/companions', { headers: { Authorization: `Bearer ${token}` } })
    const result = await response.json()
    if (!response.ok) throw new Error('Não foi possível carregar as solicitações de acompanhantes.')
    setCompanions(result.companions)
    setPolicy(result.policy)
    setRemaining(result.remaining)
    setEventId((current) => current || confirmedEvents[0]?.id || '')
  }
  useEffect(() => { load().catch((cause) => setError(cause.message)) }, [token, events.length])
  async function submit(event) {
    event.preventDefault()
    setError('')
    if (!turnstileToken) return setError('Conclua a verificação de segurança.')
    setBusy(true)
    try {
      const response = await fetch('/api/invitation/companions', { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ eventId, idempotencyKey: crypto.randomUUID(), turnstileToken, companions: [{ name, email, phone }] }) })
      const result = await response.json()
      if (!response.ok) {
        const messages = { companion_limit_reached: 'O limite de acompanhantes deste convite foi atingido.', host_not_confirmed: 'Confirme primeiro sua presença no evento.', turnstile_unavailable: 'A validação de segurança não está disponível agora.', turnstile_verification_failed: 'A validação expirou. Faça-a novamente.' }
        throw new Error(messages[result.error] || 'Não foi possível solicitar o acompanhante.')
      }
      setName('')
      setEmail('')
      setPhone('')
      await load()
      notify('Pedido de acompanhante enviado aos noivos.')
    } catch (cause) {
      setError(cause.message)
    } finally {
      setTurnstileToken('')
      setTurnstileReset((current) => current + 1)
      setBusy(false)
    }
  }
  async function saveName(companionId, value) {
    setBusy(true)
    setError('')
    try {
      const response = await fetch(`/api/invitation/companions/${companionId}`, { method: 'PATCH', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ name: value }) })
      if (!response.ok) throw new Error('Não foi possível atualizar o nome.')
      await load()
      notify('Nome atualizado para análise dos noivos.')
    } catch (cause) {
      setError(cause.message)
    } finally {
      setBusy(false)
    }
  }
  async function recover(companion) {
    setBusy(true)
    setError('')
    try {
      const response = await fetch(`/api/invitation/companions/${companion.id}/credential`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } })
      const result = await response.json()
      if (!response.ok) throw new Error('A credencial ainda não está disponível.')
      setShare({ name: companion.approved_name || companion.name, url: result.accessUrl })
    } catch (cause) {
      setError(cause.message)
    } finally {
      setBusy(false)
    }
  }
  if (!policy.companionsAllowed || !partySize || !confirmedEvents.length) return null
  return <section className="role-card guest-companion-manager"><div className="role-card-heading"><div><span className="eyebrow">ACOMPANHANTES</span><h2>Solicitar acompanhantes</h2></div><span className="task-count">{remaining} disponíveis</span></div><p>Os noivos analisam cada pedido. A pessoa só recebe o próprio QR após aprovação e identificação.</p>{remaining > 0 && <form onSubmit={submit}><label>Evento<select value={eventId} onChange={(event) => setEventId(event.target.value)} required>{confirmedEvents.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select></label><label>Nome, se já souber<input value={name} onChange={(event) => setName(event.target.value)} maxLength="160" /></label><div className="public-wedding-contact-fields"><label>E-mail opcional<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} maxLength="254" /></label><label>Telefone opcional<input type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} maxLength="40" /></label></div><TurnstileChallenge action="rsvp" onToken={setTurnstileToken} resetKey={turnstileReset} />{error && <p className="admin-form-error" role="alert">{error}</p>}<button className="button-primary" type="submit" disabled={busy || !eventId || !TURNSTILE_SITE_KEY || !turnstileToken}>{busy ? 'Enviando…' : 'Enviar solicitação'}</button></form>}{companions.map((item) => <article className="guest-companion-status" key={item.id}><div><strong>{item.approved_name || item.name || 'Acompanhante sem nome'}</strong><small>{item.event_name} · {item.status === 'pending' ? 'Aguardando aprovação' : item.status === 'approved' ? 'Aprovado' : 'Recusado'}</small>{item.status === 'pending' && !item.name && <NameCompletion onSave={(value) => saveName(item.id, value)} busy={busy} />}</div>{item.status === 'approved' && <button type="button" className="button-outline" disabled={busy} onClick={() => recover(item)}>Recuperar QR individual <QrCode size={14} /></button>}</article>)}{error && !remaining && <p className="admin-form-error" role="alert">{error}</p>}{share && <InvitationShare share={share} onClose={() => setShare(null)} notify={notify} />}</section>
}

function NameCompletion({ onSave, busy }) {
  const [name, setName] = useState('')
  return <form className="guest-companion-name-form" onSubmit={(event) => { event.preventDefault(); if (name.trim()) onSave(name.trim()) }}><label>Informe o nome antes da aprovação<input value={name} onChange={(event) => setName(event.target.value)} maxLength="160" required /></label><button className="button-outline" disabled={busy || !name.trim()}>Salvar nome</button></form>
}

function GuestCamera({ token, events, notify }) {
  const [status, setStatus] = useState(null)
  const [eventId, setEventId] = useState(events[0]?.id || '')
  const [consent, setConsent] = useState(false)
  const [cameraStream, setCameraStream] = useState(null)
  const [processing, setProcessing] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const videoRef = useRef(null)
  const cameraStreamRef = useRef(null)
  const retryPhoto = useRef(null)

  async function loadStatus() {
    const response = await fetch('/api/invitation/photos', { headers: { Authorization: `Bearer ${token}` } })
    const result = await response.json()
    if (!response.ok) throw new Error('Não foi possível abrir a câmera do casamento.')
    setStatus(result)
  }

  useEffect(() => {
    loadStatus().catch((cause) => setError(cause.message))
  }, [token])

  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState !== 'visible') return
      fetch('/api/invitation/photos', { headers: { Authorization: `Bearer ${token}` } }).then(async (response) => {
        const result = await response.json()
        if (response.ok) setStatus(result)
      }).catch(() => {})
    }
    window.addEventListener('focus', refresh)
    document.addEventListener('visibilitychange', refresh)
    return () => {
      window.removeEventListener('focus', refresh)
      document.removeEventListener('visibilitychange', refresh)
    }
  }, [token])

  useEffect(() => {
    if (!cameraStream || !videoRef.current) return undefined
    videoRef.current.srcObject = cameraStream
    videoRef.current.play().catch(() => setError('Não foi possível iniciar a câmera. Confira a permissão do navegador.'))
    return () => {
      if (videoRef.current) videoRef.current.srcObject = null
    }
  }, [cameraStream])

  useEffect(() => () => cameraStreamRef.current?.getTracks().forEach((track) => track.stop()), [])

  function stopCamera() {
    cameraStreamRef.current?.getTracks().forEach((track) => track.stop())
    cameraStreamRef.current = null
    setCameraStream(null)
  }

  async function startCamera() {
    setError('')
    if (!navigator.mediaDevices?.getUserMedia) {
      setError('Este navegador não oferece captura direta. Abra o convite em um navegador atualizado com acesso à câmera.')
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false })
      cameraStreamRef.current = stream
      setCameraStream(stream)
    } catch {
      setError('Não foi possível acessar a câmera. Permita o uso nas configurações do navegador e tente novamente.')
    }
  }

  async function acceptConsent() {
    setBusy(true)
    setError('')
    try {
      const response = await fetch('/api/invitation/photos/consent', { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ accepted: true }) })
      if (!response.ok) throw new Error('Não foi possível ativar a câmera. Tente novamente.')
      setConsent(true)
      setStatus((current) => ({ ...current, consented: true }))
    } catch (cause) {
      setError(cause.message)
    } finally {
      setBusy(false)
    }
  }

  async function sendPhoto(file) {
    if (!file || !eventId) return
    setBusy(true)
    setError('')
    try {
      const body = new FormData()
      body.set('photo', file)
      body.set('eventId', eventId)
      const response = await fetch('/api/invitation/photos', { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body })
      const result = await response.json()
      if (!response.ok) {
        if (result.error === 'photo_limit_reached') {
          retryPhoto.current = null
          await loadStatus()
          throw new Error('O álbum atingiu o limite de fotos escolhido pelo casal.')
        }
        throw new Error(result.error === 'photo_storage_unavailable' || result.error === 'photo_storage_failed' ? 'O envio não está disponível agora. A foto ficou pronta para tentar novamente.' : result.error === 'photo_too_large' || result.error === 'invalid_photo' ? 'Esta foto não pôde ser enviada. Tente outra foto.' : 'Não foi possível guardar a foto. Ela ficou pronta para tentar novamente.')
      }
      retryPhoto.current = null
      notify('Foto enviada para o álbum do casal')
      await loadStatus().catch(() => setStatus((current) => current ? { ...current, saved: current.saved + 1, remaining: Math.max(0, current.remaining - 1) } : current))
    } catch (cause) {
      retryPhoto.current = cause.message === 'O álbum atingiu o limite de fotos escolhido pelo casal.' ? null : file
      setError(cause.message)
    } finally {
      setBusy(false)
    }
  }

  async function capturePhoto() {
    if (!cameraStream || !videoRef.current || busy || processing) return
    setError('')
    setProcessing(true)
    try {
      const video = videoRef.current
      const scale = Math.min(1, 1800 / Math.max(video.videoWidth, video.videoHeight))
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(video.videoWidth * scale)
      canvas.height = Math.round(video.videoHeight * scale)
      canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height)
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/webp', 0.82))
      if (!blob) throw new Error('Não foi possível preparar esta foto. Tente outra vez.')
      stopCamera()
      await sendPhoto(new File([blob], 'momento.webp', { type: 'image/webp' }))
    } catch (cause) {
      setError(cause.message || 'Não foi possível capturar esta foto.')
    } finally {
      setProcessing(false)
    }
  }

  return <section className="role-card guest-camera-card" id="guest-camera"><div className="role-card-heading"><div><span className="eyebrow">UMA LEMBRANÇA PELOS SEUS OLHOS</span><h2>A câmera do casamento</h2></div><Camera size={20} /></div><p>Enquadre o momento e toque no botão. A foto é capturada e enviada direto para o álbum do casal, sem tela de revisão.</p>{events.length > 1 && <label>Evento<select value={eventId} onChange={(event) => setEventId(event.target.value)}>{events.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>}<div className="guest-camera-album-counter" role="status"><strong>{status?.remaining ?? '—'} fotos restantes</strong><span>{status ? `${status.saved} de ${status.limit} fotos no álbum` : 'Carregando o limite compartilhado'}</span></div>{status && status.remaining < 1 ? <div className="guest-camera-album-full">O álbum já recebeu todas as {status.limit} fotos.</div> : status?.consented ? <div className="guest-camera-live">{cameraStream ? <><video ref={videoRef} autoPlay muted playsInline aria-label="Enquadramento ao vivo da câmera" /><div><button className="button-primary" type="button" onClick={capturePhoto} disabled={busy || processing}>{processing ? 'Capturando…' : busy ? 'Enviando…' : <><Camera size={17} /> Tirar foto</>}</button><button className="button-outline" type="button" onClick={stopCamera} disabled={busy || processing}>Fechar câmera</button></div></> : <button className="button-primary" type="button" onClick={startCamera} disabled={busy}><Camera size={17} /> Abrir câmera</button>}{retryPhoto.current && <button className="button-outline" type="button" disabled={busy} onClick={() => sendPhoto(retryPhoto.current)}>Tentar enviar a foto novamente</button>}</div> : <div className="guest-camera-consent-start"><p>Ao ativar a câmera, você autoriza o envio imediato das fotos tiradas para o álbum privado do casal, identificadas pelo seu convite. Não será possível revisar ou escolher cada foto antes do envio.</p><label className="guest-camera-consent"><input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} /> Entendi e autorizo o envio automático das fotos que eu tirar.</label><button className="button-primary" type="button" onClick={acceptConsent} disabled={busy || !consent || !status?.remaining}>{busy ? 'Ativando câmera…' : 'Ativar câmera'}</button></div>}{error && <p className="admin-form-error" role="alert">{error}</p>}</section>
}

function InvitationEventCard({ event, timezone, maxPartySize, onSubmit, initialOpen = false }) {
  const [status, setStatus] = useState(event.rsvp?.status || 'confirmed')
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
      await onSubmit({ eventId: event.id, status, partySize: 1, dietaryNotes, turnstileToken })
    } catch (cause) {
      setError(cause.message)
    } finally {
      setTurnstileToken('')
      setTurnstileReset((current) => current + 1)
      setBusy(false)
    }
  }

  return <details className="role-card invitation-event-card" open={initialOpen}><summary><span><small>{EVENT_TYPE_LABELS[event.event_type] || 'Evento'}</small><strong>{event.name}</strong>{event.starts_at && <em>{formatInviteEventDate(event.starts_at, 'pt-BR', timezone)}</em>}</span>{event.rsvp ? <b>{event.rsvp.status === 'declined' ? 'Não poderá comparecer' : 'Resposta registrada'}</b> : <b>Responder</b>}<ChevronDown size={17} /></summary><div className="invitation-event-content">{(event.venue_name || event.address) && <p className="invitation-event-venue"><MapPin size={16} /> <span>{event.venue_name}{event.address && <><br />{event.address}<br /><a href={eventMapUrl(event.address)} target="_blank" rel="noreferrer">Ver localização</a></>}</span></p>}<form className="invitation-rsvp-form" onSubmit={submit}><label>Você vai participar?<select value={status} onChange={(input) => setStatus(input.target.value)}><option value="confirmed">Sim, estarei lá</option><option value="declined">Não poderei ir</option></select></label><p className="invitation-rsvp-wide guest-rsvp-person-count">Esta resposta confirma você. Cada acompanhante deve ser solicitado e autorizado separadamente para receber seu próprio QR code. Vocês podem solicitar até {Math.max(0, maxPartySize - 1)} acompanhante(s), conforme o limite do convite.</p><label className="invitation-rsvp-wide">Restrição alimentar, se houver<input value={dietaryNotes} maxLength={1000} onChange={(input) => setDietaryNotes(input.target.value)} placeholder="Opcional" /></label><div className="invitation-rsvp-wide"><TurnstileChallenge action="rsvp" onToken={setTurnstileToken} resetKey={turnstileReset} /></div>{error && <p className="admin-form-error invitation-rsvp-wide" role="alert">{error}</p>}<button className="button-primary invitation-rsvp-wide" type="submit" disabled={busy || !TURNSTILE_SITE_KEY || !turnstileToken}>{busy ? 'Salvando…' : 'Confirmar presença'} <Check size={15} /></button></form></div></details>
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
  const refreshRosterRef = useRef(null)
  const currentEvent = events.find((event) => event.id === selectedEvent)
  const visibleGuests = guests.filter((guest) => guest.name.toLowerCase().includes(query.toLowerCase()))
  const peopleCount = guests.reduce((total, guest) => total + guest.party_size, 0) + walkIns.reduce((total, guest) => total + guest.party_size, 0)
  const arrivedCount = guests.filter((guest) => guest.checked_in_at).reduce((total, guest) => total + guest.party_size, 0) + walkIns.reduce((total, guest) => total + guest.party_size, 0)
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

  refreshRosterRef.current = loadEventGuests

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
    if (stage !== 'ready' || !selectedEvent || !isOnline) return undefined
    const timer = window.setInterval(async () => {
      try {
        const response = await fetch('/api/staff/events')
        if (!response.ok) throw new Error('staff_access_revoked')
        const result = await response.json()
        setEvents(result.events)
        if (!result.events.some((event) => event.id === selectedEvent)) {
          setGuests([])
          setWalkIns([])
          setOfflineRoster([])
          setSelectedEvent(result.events[0]?.id || '')
          if (!result.events.length) setError('Seu acesso aos eventos foi revogado pelos noivos.')
          return
        }
        await refreshRosterRef.current?.(selectedEvent)
      } catch (cause) {
        setGuests([])
        setWalkIns([])
        setOfflineRoster([])
        if (cause.message === 'staff_access_revoked') setStage('login')
        setError(cause.message === 'staff_access_revoked' ? 'Seu acesso foi revogado. Entre em contato com os noivos.' : cause.message)
      }
    }, 5000)
    return () => window.clearInterval(timer)
  }, [stage, selectedEvent, isOnline])

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
      const response = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password, turnstileToken }) })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error === 'turnstile_verification_failed' ? 'Conclua novamente a verificação de segurança.' : result.error === 'turnstile_unavailable' ? 'A verificação de segurança ainda não foi configurada neste site.' : 'E-mail, senha ou código inválido.')
      localStorage.removeItem('wedding-staff-locked')
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
        if (!response.ok) throw new Error(result.error === 'already_checked_in' ? `Entrada já realizada${result.checkedInAt ? ` em ${new Date(result.checkedInAt).toLocaleString('pt-BR')}` : ''}.` : result.error === 'invitation_declined' ? 'Entrada não autorizada: este convite foi recusado para o evento.' : result.error === 'invitation_not_confirmed' ? 'Entrada não autorizada: a presença ainda não foi confirmada pelos noivos.' : result.error === 'invitation_not_found' ? 'Entrada não autorizada: credencial inválida, revogada ou sem permissão para este evento.' : 'Não foi possível registrar a entrada.')
        await loadEventGuests(selectedEvent)
        notify(`Entrada autorizada: ${result.guest.name}`)
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
  if (stage !== 'ready') return <RoleFrame icon={ListChecks} eyebrow="EQUIPE DO EVENTO" title="Acesso ao evento." description="Entre com o e-mail e a senha da conta atribuída pelos noivos." secure>
    <form className="role-card admin-login-form" onSubmit={login}><label>E-mail<input type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} required /></label><label>Senha<PasswordInput autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required /></label><TurnstileChallenge onToken={setTurnstileToken} resetKey={turnstileReset} />{error && <p className="admin-form-error" role="alert">{error}</p>}<button className="button-primary" disabled={busy || stage === 'checking' || !TURNSTILE_SITE_KEY || !turnstileToken} type="submit">Entrar <LockKeyhole size={15} /></button></form>
  </RoleFrame>

  const eventDate = currentEvent?.starts_at ? new Date(currentEvent.starts_at).toLocaleString('pt-BR', { dateStyle: 'medium', timeStyle: 'short' }) : 'Data não definida'
  return <RoleFrame icon={ListChecks} eyebrow="EQUIPE DO EVENTO" title={checkinAllowed ? 'Controle de entrada.' : 'Nomes dos convidados do evento.'} description={checkinAllowed ? 'A lista mostra somente presenças confirmadas e autorizadas para os eventos selecionados.' : 'Você consulta somente os nomes da lista dos eventos atribuídos.'} className={`staff-print-${printMode}`} secure headerAction={<button className="button-outline" disabled={busy} onClick={logoutStaff} title={!isOnline ? 'Bloqueia esta tela e preserva as entradas offline pendentes' : ''}>{isOnline ? 'Sair' : 'Bloquear aparelho'}</button>}>
    {events.length > 1 && <label className="staff-event-select">Evento<select value={selectedEvent} onChange={(event) => setSelectedEvent(event.target.value)}>{events.map((event) => <option key={event.id} value={event.id}>{event.name} · {event.starts_at ? new Date(event.starts_at).toLocaleDateString('pt-BR') : 'sem data'}</option>)}</select></label>}
    {error && <p className="admin-form-error" role="alert">{error}</p>}
    {checkinAllowed && <div className="staff-offline-status" role="status"><span className={isOnline ? 'staff-online' : 'staff-offline'}>{isOnline ? 'Conexao ativa' : 'Modo offline'}</span><span>{pendingCheckins.length} entrada(s) aguardando sincronizacao</span>{offlineRoster.length > 0 && <span>Lista temporaria preparada neste dispositivo</span>}{isOnline && pendingCheckins.length > 0 && <button className="button-outline" disabled={busy} onClick={() => syncPendingCheckins().catch((cause) => setError(cause.message))}>Sincronizar agora</button>}</div>}
    {!events.length && <p className="buffet-empty">Nenhum evento foi atribuído a esta conta.</p>}
    {currentEvent && <>
      {checkinAllowed && <div className="role-stat-grid"><div className="role-stat"><span>Total de pessoas esperadas</span><strong>{peopleCount}</strong></div><div className="role-stat"><span>Já entraram</span><strong>{arrivedCount}</strong></div><div className="role-stat"><span>Ainda aguardados</span><strong>{Math.max(0, peopleCount - arrivedCount)}</strong></div></div>}
      {checkinAllowed && <section className="role-card staff-scanner-card"><div className="role-card-heading"><div><span className="eyebrow">LEITOR DO EVENTO</span><h2>Entrada por QR code</h2></div><QrCode size={20} /></div>{scannerOpen ? <QrCamera onDecode={scanInvitation} onError={(message) => { setError(message); setScannerOpen(false) }} /> : <button className="button-primary" disabled={busy} onClick={() => { setError(''); setScannerOpen(true) }}><Camera size={16} /> Escanear QR Code</button>}<p>O QR é validado no servidor, limitado a este evento e registrado uma única vez.</p></section>}
      <section className="role-card staff-list-card print-list"><div className="role-card-heading"><div><span className="eyebrow">{eventDate}</span><h2>{currentEvent.name}</h2></div><button className="button-outline print-button" onClick={() => printReport('list')}><Printer size={15} /> Exportar lista em PDF</button></div><label className="search-field"><Search size={15} /><input aria-label="Pesquisar convidado pelo nome" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar nome" /></label><div className="staff-guest-list">{(printMode === 'list' ? guests : visibleGuests).map((guest) => <div className="staff-guest-row" key={guest.id}><div className="staff-guest-copy"><strong>{guest.name}</strong>{checkinAllowed && <small>{guest.checked_in_at ? `Entrou às ${new Date(guest.checked_in_at).toLocaleString('pt-BR')}` : 'Presença confirmada · Ainda aguardado'}</small>}</div>{checkinAllowed && (guest.checked_in_at ? <span className="status-pill confirmed"><i /> Entrou</span> : <><span className="status-pill waiting"><i /> Aguardando</span><button className="checkin-toggle" disabled={busy} onClick={() => checkIn(guest.id)}>Registrar entrada</button></>)}</div>)}{!visibleGuests.length && query && <p className="buffet-empty">Nenhum convidado encontrado com esse nome.</p>}{!guests.length && <p className="buffet-empty">Nenhuma presença confirmada para este evento.</p>}</div>{checkinAllowed && walkIns.map((guest) => <div className="staff-guest-row walkin-entry" key={guest.id}><div className="staff-guest-copy"><strong>{guest.name} <span>Entrada manual</span></strong><small>{guest.checked_in_at ? new Date(guest.checked_in_at).toLocaleString('pt-BR') : 'Agora'}</small></div><span className="status-pill confirmed"><i /> Entrou</span></div>)}</section>
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

function SuperAdminPanel({ notify, promptAction }) {
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
  return <SuperAdminWorkspace notify={notify} promptAction={promptAction} account={account} onLogout={async () => { await fetch('/api/auth/logout', { method: 'POST' }); setStage('login') }} />
}

function SuperAdminAccessFrame({ title, description, children, eyebrow = 'CONTROLE DA PLATAFORMA', brand = 'Administração da plataforma' }) {
  return <div className="role-page"><header className="role-header"><a className="role-brand" href="/"><span>e<span>&</span>t</span><strong>{brand}</strong></a><span className="role-preview"><LockKeyhole size={13} /> ÁREA PROTEGIDA</span></header><main className="role-main admin-auth-main"><div className="role-intro"><span className="role-icon"><Shield size={19} /></span><span className="eyebrow">{eyebrow}</span><h1>{title}</h1><p>{description}</p></div>{children}</main><footer className="role-footer"><span>{brand}</span><a href="https://henriquesouzas.com" target="_blank" rel="noreferrer">henriquesouzas.com</a></footer></div>
}

function SuperAdminWorkspace({ notify, promptAction, account, onLogout }) {
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
    const [overview, accountRows, weddingRows] = await Promise.all([
      request(`/api/superadmin/overview?auditPage=${auditPage}`),
      request(`/api/superadmin/accounts?page=${accountsPage}`),
      request(`/api/superadmin/weddings?page=${weddingsPage}`),
    ])
    setData(overview)
    setAuditHasMore(overview.auditHasMore)
    setAccounts(accountRows.accounts)
    setWeddings(weddingRows.weddings)
    setAccountsHasMore(accountRows.hasMore)
    setWeddingsHasMore(weddingRows.hasMore)
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

  async function sendEmailTest() {
    setBusy(true)
    setEmailTestState('')
    setError('')
    try {
      const result = await requestWithRecentMfa(request, '/api/superadmin/email-test', {
        method: 'POST',
        body: JSON.stringify({ confirmation: 'send-test-email' }),
      }, promptAction)
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
      await requestWithRecentMfa(request, `/api/superadmin/weddings/${purgeTarget.id}/anonymize`, { method: 'POST', body: JSON.stringify({ confirmation }) }, promptAction)
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

  if (!data) return <RoleFrame icon={Shield} eyebrow="CONTROLE DA PLATAFORMA" title="Visão global protegida." description={error || 'Carregando dados do D1…'}>{error && <p className="admin-form-error" role="alert">{error}</p>}</RoleFrame>
  return <div className="role-page"><header className="role-header"><a className="role-brand" href="/"><span>e<span>&</span>t</span><strong>Administração da plataforma</strong></a><span className="role-preview">Acesso: {account?.email}</span><button className="button-outline" onClick={onLogout}>Sair</button></header><main className="role-main"><div className="role-intro"><span className="role-icon"><Shield size={19} /></span><span className="eyebrow">CONTROLE DA PLATAFORMA</span><h1>Visão global, com trilha de auditoria.</h1><p>Os dados e alterações deste painel são consultados e gravados no D1 após validação de papel no servidor.</p></div>
    {error && <p className="admin-form-error" role="alert">{error}</p>}
    <div className="role-stat-grid"><div className="role-stat"><span>Casamentos ativos</span><strong>{data.weddings.active || 0}</strong></div><div className="role-stat"><span>Contas ativas</span><strong>{data.accounts.active || 0}</strong></div><div className="role-stat"><span>Convidados registrados</span><strong>{data.guests.total || 0}</strong></div></div>
     <nav className="superadmin-tabs" aria-label="Seções do superadmin" role="tablist">{[{ id: 'overview', label: 'Visão geral', icon: House }, { id: 'weddings', label: 'Casamentos', icon: Heart }, { id: 'accounts', label: 'Contas', icon: Users }, { id: 'audit', label: 'Auditoria', icon: LockKeyhole }].map((item) => <button key={item.id} id={`superadmin-tab-${item.id}`} type="button" role="tab" aria-selected={adminSection === item.id} aria-controls={`superadmin-panel-${item.id}`} className={adminSection === item.id ? 'active' : ''} onClick={() => setAdminSection(item.id)}><item.icon size={15} /> {item.label}</button>)}</nav>
     {adminSection === 'overview' && <div className="superadmin-section" id="superadmin-panel-overview" role="tabpanel" aria-labelledby="superadmin-tab-overview"><section className="role-card superadmin-card email-test-card"><div className="role-card-heading"><div><span className="eyebrow">CONFIGURAÇÃO DE E-MAIL</span><h2>Testar envio pelo Resend</h2></div><Mail size={19} /></div><p>Envia uma única mensagem para a conta superadmin ({account?.email}). O teste exige autenticação recente e fica limitado a um envio por hora.</p><button className="button-primary" type="button" onClick={sendEmailTest} disabled={busy}><Mail size={15} /> {busy ? 'Enviando teste…' : 'Enviar e-mail de teste'}</button>{emailTestState && <p className="email-test-state" role="status">{emailTestState}</p>}</section></div>}
     {adminSection === 'weddings' && <div className="superadmin-section" id="superadmin-panel-weddings" role="tabpanel" aria-labelledby="superadmin-tab-weddings">
    <section className="role-card superadmin-card"><div className="role-card-heading"><div><span className="eyebrow">NOVO CASAMENTO</span><h2>Criar espaço dos noivos</h2></div><Users size={19} /></div><p className="team-access-note">O casamento começa como rascunho. O slug fica reservado no D1 e não depende do domínio da plataforma. O link pode ser enviado manualmente até o serviço de e-mail ser escolhido.</p><form className="superadmin-wedding-form" onSubmit={inviteCouple}><label>E-mail dos noivos<input type="email" value={coupleEmail} onChange={(event) => setCoupleEmail(event.target.value)} maxLength="254" required /></label><label>Nome do primeiro noivo<input value={partnerOneName} onChange={(event) => { const next = event.target.value; setPartnerOneName(next); setWeddingSlug(createWeddingSlug(next, partnerTwoName)) }} maxLength="100" required /></label><label>Nome do segundo noivo<input value={partnerTwoName} onChange={(event) => { const next = event.target.value; setPartnerTwoName(next); setWeddingSlug(createWeddingSlug(partnerOneName, next)) }} maxLength="100" required /></label><label>Slug reservado<input value={weddingSlug} onChange={(event) => setWeddingSlug(event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 30))} minLength="3" maxLength="30" pattern="[a-z0-9][a-z0-9-]{1,28}[a-z0-9]" required /></label><label>Data do casamento<input type="date" value={weddingDate} onChange={(event) => setWeddingDate(event.target.value)} /></label><button className="button-primary" type="submit" disabled={busy}>Criar e gerar convite <ArrowRight size={15} /></button></form>{coupleInvitation && <div className="team-invitation-result"><strong>Convite de {coupleInvitation.email}</strong><span>{coupleInvitation.requiresLogin ? 'A pessoa entrará com a conta existente.' : 'A pessoa criará uma senha para ativar a conta.'} Link válido até {new Date(coupleInvitation.expiresAt).toLocaleString('pt-BR')}.</span><div><input readOnly value={coupleInvitation.invitationUrl} aria-label="Link de convite dos noivos" onFocus={(event) => event.target.select()} /><button className="button-outline" onClick={copyCoupleInvitation}><Copy size={14} /> Copiar</button></div></div>}</section>
    <section className="role-card superadmin-card"><div className="role-card-heading"><div><span className="eyebrow">CONTAS E SITES</span><h2>Casamentos cadastrados</h2></div><span className="task-count">{data.weddings.total || 0} registros</span></div><div className="superadmin-table-wrap"><table className="superadmin-table"><thead><tr><th>CASAL</th><th>SLUG</th><th>RESPONSÁVEL</th><th>CONVIDADOS</th><th>STATUS</th><th>AÇÕES</th></tr></thead><tbody>{weddings.map((item) => <tr key={item.id}><td><strong>{item.partner_one_name} & {item.partner_two_name}</strong><small>{item.event_date || 'Data não definida'}</small></td><td>{item.slug}</td><td>{item.owner_email}</td><td>{item.guest_count}</td><td><span className={`admin-state ${item.status === 'active' ? 'admin-state-active' : ''}`}>{item.status}</span></td><td><div className="admin-row-actions"><button onClick={() => changeWeddingStatus(item)}>{item.status === 'active' ? 'Suspender' : 'Ativar'}</button><button onClick={() => { setPurgeTarget(item); setConfirmation('') }}><Trash2 size={14} /> Limpar dados</button></div></td></tr>)}</tbody></table></div><div className="admin-pagination"><span>Página {weddingsPage}</span><div><button className="button-outline" type="button" disabled={weddingsPage === 1 || busy} onClick={() => setWeddingsPage((page) => page - 1)}>Anterior</button><button className="button-outline" type="button" disabled={!weddingsHasMore || busy} onClick={() => setWeddingsPage((page) => page + 1)}>Próxima</button></div></div>{purgeTarget && <div className="purge-confirm"><div><span className="eyebrow">LIMPEZA IRREVERSÍVEL DE DADOS</span><p>Remove convidados, respostas, tarefas, check-ins e eventos operacionais. Preserva registros históricos legados de presentes, se existirem, e a auditoria. O fluxo atual de presentes não registra pagamentos. Exige MFA recente.</p></div><label>Digite ANONIMIZAR {purgeTarget.id}<input value={confirmation} onChange={(event) => setConfirmation(event.target.value)} /></label><div className="admin-row-actions"><button onClick={() => setPurgeTarget(null)}>Cancelar</button><button disabled={busy || confirmation !== `ANONIMIZAR ${purgeTarget.id}`} onClick={anonymizeWedding}>Confirmar limpeza e anonimização</button></div></div>}</section>
     </div>}
     {adminSection === 'accounts' && <div className="superadmin-section" id="superadmin-panel-accounts" role="tabpanel" aria-labelledby="superadmin-tab-accounts"><section className="role-card superadmin-card"><div className="role-card-heading"><div><span className="eyebrow">ACESSO À PLATAFORMA</span><h2>Contas cadastradas</h2></div><span className="task-count">{data.accounts.total || 0} contas</span></div><div className="superadmin-table-wrap"><table className="superadmin-table accounts-table"><thead><tr><th>E-MAIL</th><th>CASAMENTOS</th><th>STATUS</th><th>AÇÃO</th></tr></thead><tbody>{accounts.map((item) => <tr key={item.id}><td><strong>{item.email}</strong><small>{item.email_verified_at ? 'E-mail verificado' : 'E-mail pendente'}</small><small>Criada {new Date(item.created_at).toLocaleDateString('pt-BR')}</small><small>Ultimo acesso: {item.last_login_at ? new Date(item.last_login_at).toLocaleString('pt-BR') : 'nunca'}</small></td><td>{item.wedding_count}</td><td><span className={`admin-state ${item.status === 'active' ? 'admin-state-active' : ''}`}>{item.status}</span></td><td><button className="account-status-action" disabled={item.id === account?.id && item.status === 'active'} onClick={() => changeAccountStatus(item)}>{item.status === 'active' ? 'Suspender' : 'Ativar'}</button></td></tr>)}</tbody></table></div><div className="admin-pagination"><span>Página {accountsPage}</span><div><button className="button-outline" type="button" disabled={accountsPage === 1 || busy} onClick={() => setAccountsPage((page) => page - 1)}>Anterior</button><button className="button-outline" type="button" disabled={!accountsHasMore || busy} onClick={() => setAccountsPage((page) => page + 1)}>Próxima</button></div></div></section></div>}
     {adminSection === 'audit' && <div className="superadmin-section" id="superadmin-panel-audit" role="tabpanel" aria-labelledby="superadmin-tab-audit"><section className="role-card audit-card"><div className="role-card-heading"><div><span className="eyebrow">SEGURANÇA</span><h2>Atividade administrativa</h2></div><span><LockKeyhole size={15} /> {data.auditTotal} registros</span></div>{data.audit.length ? <div className="audit-list">{data.audit.map((item, index) => <div key={`${item.target_id}-${item.created_at}-${index}`}><span>{item.action}</span><strong>{item.target_type} · {item.target_id || '—'}</strong><small>{item.actor_email || 'Conta de sistema'} {' \u00b7 '} {new Date(item.created_at).toLocaleString('pt-BR')}</small></div>)}</div> : <p className="buffet-empty">Ainda não há ações administrativas registradas.</p>}<div className="admin-pagination"><span>P\u00e1gina {data.auditPage} de {Math.max(1, Math.ceil(data.auditTotal / 20))}</span><div><button className="button-outline" type="button" disabled={auditPage === 1 || busy} onClick={() => setAuditPage((page) => page - 1)}>Anterior</button><button className="button-outline" type="button" disabled={!auditHasMore || busy} onClick={() => setAuditPage((page) => page + 1)}>Pr\u00f3xima</button></div></div></section></div>}
    <div className="admin-security-note"><Shield size={16} /><span>Cloudflare Access, sessão com MFA e papel superadmin são verificados antes das operações. A anonimização preserva a auditoria e registros históricos legados de presentes, se existirem; o fluxo atual não registra pagamentos.</span></div>
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
