import './invite-phone.css'

const PHOTO = '/images/fotos/painel-convidados.webp'
const EVENT_HOUR = 17

function formatDate(d, hourLabel) {
  const text = d.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })
  return `${text.charAt(0).toUpperCase()}${text.slice(1)}${hourLabel ? ` · ${hourLabel}` : ''}`
}
function hourText(time) {
  const m = /^(\d{1,2}):(\d{2})$/.exec(time || '')
  if (!m) return ''
  return `${Number(m[1])}h${m[2] === '00' ? '' : m[2]}`
}
function daysBetween(target) {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  return Math.round((new Date(target.getFullYear(), target.getMonth(), target.getDate()) - start) / 86400000)
}
function countText(days) {
  if (days < 0) return 'Já aconteceu'
  if (days === 0) return 'É hoje!'
  return days === 1 ? 'Falta 1 dia' : `Faltam ${days} dias`
}

/* Convite de exemplo. Sem `live`: data fixa de 19 de dezembro, 17h (se já passou, usa o ano seguinte; nunca mostra data passada).
   Com `live`: reflete nomes, data, áreas e presentes informados no cadastro. */
export function InvitePhoneCard({ live = false, names = ['', ''], date = '', time = '', areas = [], gifts = '' }) {
  let label, count, title = 'Lívia', second = 'Caio'
  if (live) {
    const [a, b] = names.map((n) => (n || '').trim())
    if (a || b) { title = a || '…'; second = b || '…' }
    const d = date ? new Date(`${date}T12:00:00`) : null
    if (d && !Number.isNaN(d.getTime())) { label = formatDate(d, hourText(time)); count = countText(daysBetween(d)) }
    else { label = 'Data a definir'; count = 'Em breve' }
  } else {
    const now = new Date()
    let d = new Date(now.getFullYear(), 11, 19, EVENT_HOUR)
    if (d < now) d = new Date(now.getFullYear() + 1, 11, 19, EVENT_HOUR)
    label = formatDate(d, `${EVENT_HOUR}h`)
    count = countText(daysBetween(d))
  }
  const areaText = areas.length ? `${areas.slice(0, 2).join(' · ')}${areas.length > 2 ? ` +${areas.length - 2}` : ''}` : 'Nenhuma área escolhida'
  return <div className="lp-phone" role="img" aria-label={`Exemplo do convite aberto no celular: ${title} e ${second}, ${label}, ${count.toLowerCase()}, cerimônia e recepção na Casa das Oliveiras, botão Confirmar presença`}>
    <div className="lp-phone-screen" aria-hidden="true">
      <span className="lp-phone-notch" />
      <div className="lp-phone-photo">
        <img src={PHOTO} alt="" width="759" height="506" loading="lazy" decoding="async" />
        <div className="lp-phone-hero-text">
          <p className="lp-phone-kicker">Vamos casar</p>
          <p className="lp-phone-names">{title}<span className="lp-amp">&amp;</span>{second}</p>
          <p className="lp-phone-date" suppressHydrationWarning>{label}</p>
        </div>
      </div>
      <div className="lp-phone-body">
        <p className="lp-phone-count"><span suppressHydrationWarning>{count}</span></p>
        <div className="lp-phone-card"><span><b>Cerimônia e recepção</b><small>Casa das Oliveiras</small></span><span className="lp-phone-map">Ver no mapa</span></div>
        {live && <div className="lp-phone-extra"><span>{areaText}</span><span>Presentes: {gifts}</span></div>}
        <div className="lp-phone-rsvp">Confirmar presença</div>
        <p className="lp-phone-note">Abre direto pelo link, sem instalar nada</p>
      </div>
    </div>
  </div>
}

/* scale < 1 reduz o mesmo convite (300×630) sem mudar a proporção. */
export default function InvitePhone({ scale = 1, ...props }) {
  if (scale === 1) return <InvitePhoneCard {...props} />
  return <div style={{ width: 300 * scale, height: 630 * scale }}><div style={{ width: 300, height: 630, transform: `scale(${scale})`, transformOrigin: 'top left' }}><InvitePhoneCard {...props} /></div></div>
}
