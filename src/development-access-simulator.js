const weddingId = 'demo-wedding'
const eventId = 'demo-event'
const guestId = 'demo-guest'
const sampleWedding = { id: weddingId, slug: 'ana-e-caio', partner_one_name: 'Ana', partner_two_name: 'Caio', event_date: '2027-10-16', event_time: '16:00', status: 'active', role: 'couple_admin', owner_email: 'casal@example.test', guest_count: 2, timezone: 'America/Sao_Paulo' }
const sampleEvent = { id: eventId, name: 'Cerimônia e recepção', event_type: 'ceremony', starts_at: '2027-10-16T16:00:00-03:00', venue_name: 'Jardim das Flores', address: 'Belo Horizonte, MG', group_ids: ['demo-group'], role: 'checkin_staff' }
const sampleGuest = { id: guestId, name: 'Marina Almeida', email: 'marina@example.test', phone: '', group_id: 'demo-group', group_name: 'Família', party_size: 2, guest_type: 'guest', dietary_notes: '', status: 'active', invitation_token: 'sample-invitation-token' }
const sampleConfig = { theme: 'garden', paletteIndex: 0, coverLayout: 'full', coverComposition: 'overlay', coverTextAlign: 'center', coverTextPosition: 'center', coverOverlayOpacity: 35, coverImagePosition: 'center', coverImagePositionDesktop: 'center', coverImagePositionMobile: 'center', giftDisplayMode: 'inline', pixDisplayMode: 'inline', coverImage: 'none', coverPhotoId: null, coverCarouselEnabled: false, coverGallery: [], siteGallery: [], imageAltTexts: {}, siteCarouselEnabled: false, siteCarouselPhotos: [], siteCarouselAutoplay: false, fontScale: 'medium', enabledSections: ['Nossa história', 'Eventos', 'Lista de presentes', 'Confirmação de presença', 'Galeria de fotos'], animationPreset: 'Elegante', fontPair: 'Clássico editorial', language: 'pt-BR', coverMessages: { 'pt-BR': 'Com alegria, convidamos você.' }, storyMessages: { 'pt-BR': 'Nossa história começou com uma conversa que virou planos para a vida toda.' }, shareMessage: '', timeline: [], godparents: [], giftPresentation: {}, sectionContent: {}, sectionLayouts: {}, weddingDetails: { schedule: 'Cerimônia às 16h e recepção às 18h.', menu: 'Jantar servido após a cerimônia.', dressCode: 'Esporte fino' }, guestCamera: { enabled: false, photoLimit: 200 }, pix: { enabled: true, key: 'ana.caio@example.test', holderName: 'Ana e Caio' } }
const sampleGift = { id: 'demo-gift', title: 'Jogo de jantar', description: 'Para a casa nova', fulfillment_type: 'store_link', store_url: 'https://example.com/presente', status: 'active' }
const sampleRsvp = { id: 'demo-rsvp', guest_id: guestId, guest_name: 'Marina Almeida', event_id: eventId, event_name: sampleEvent.name, attendance_status: 'confirmed', party_size: 2, dietary_notes: '', review_status: 'approved', created_at: '2026-10-01T12:00:00.000Z' }
const sampleExpense = { id: 'demo-expense', supplier_name: 'Jardim das Flores', supplier_contact: '', category: 'Espaço', description: 'Cerimônia e recepção', total_amount_cents: 850000, paid_amount_cents: 250000, due_date: '2027-01-15', reminder_enabled: false, status: 'active', payments: [{ id: 'demo-payment', amount_cents: 250000, paid_at: '2026-09-01', notes: 'Sinal demonstrativo' }] }
const sampleTask = { id: 'demo-task', title: 'Confirmar horário da cerimônia', details: 'Chegar com antecedência para as fotos.', due_at: '2027-10-10T12:00:00.000Z', status: 'pending' }
const sampleInvitation = { wedding: { id: weddingId, slug: sampleWedding.slug, partnerOneName: 'Ana', partnerTwoName: 'Caio', eventDate: sampleWedding.event_date, eventTime: sampleWedding.event_time, timezone: sampleWedding.timezone }, guest: { id: guestId, name: sampleGuest.name, partySize: 2, guestType: 'guest' }, events: [sampleEvent], guestPolicy: { companionsAllowed: true, maxCompanions: 1 }, gifts: [sampleGift], siteConfig: sampleConfig, wallets: { google: false, apple: false } }

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } })
}

function routeData(path) {
  if (path === '/api/auth/session') {
    const isSuperadmin = window.location.pathname.startsWith('/superadmin')
    return { account: { id: 'demo-account', email: isSuperadmin ? 'admin@example.test' : 'casal@example.test', role: isSuperadmin ? 'superadmin' : 'couple_admin' }, isSuperadmin, mfaEnabled: true, mfaVerified: true }
  }
  if (path === '/api/superadmin/bootstrap/status') return { available: false }
  if (path === '/api/couple/weddings') return { weddings: [sampleWedding] }
  if (path === `/api/couple/weddings/${weddingId}/guests`) return { guests: [sampleGuest] }
  if (path === `/api/couple/weddings/${weddingId}/groups`) return { groups: [{ id: 'demo-group', name: 'Família', group_type: 'family' }] }
  if (path === `/api/couple/weddings/${weddingId}/events`) return { events: [sampleEvent] }
  if (path === `/api/couple/weddings/${weddingId}/rsvps`) return { rsvps: [sampleRsvp] }
  if (path === `/api/couple/weddings/${weddingId}/gifts`) return { gifts: [sampleGift] }
  if (path === `/api/couple/weddings/${weddingId}/expenses`) return { expenses: [sampleExpense] }
  if (path === `/api/couple/weddings/${weddingId}/members`) return { members: [{ id: 'demo-member', email: 'equipe@example.test', display_name: 'Equipe de cerimônia', role: 'event_staff', status: 'active' }] }
  if (path === `/api/couple/weddings/${weddingId}/event-assignments`) return { assignments: [] }
  if (path === `/api/couple/weddings/${weddingId}/godparent-tasks`) return { tasks: [sampleTask] }
  if (path === `/api/couple/weddings/${weddingId}/site-config`) return { draft: sampleConfig, published: sampleConfig, publishedAt: '2026-10-01T12:00:00.000Z' }
  if (path === `/api/couple/weddings/${weddingId}/guest-policy`) return { policy: { companionsAllowed: true, maxCompanions: 1 } }
  if (path === `/api/couple/weddings/${weddingId}/attendance-requests`) return { requests: [], companions: [] }
  if (path === `/api/couple/weddings/${weddingId}/guest-authorizations`) return { authorizations: [] }
  if (path === `/api/couple/weddings/${weddingId}/published`) return { siteConfig: sampleConfig, events: [sampleEvent], publishedAt: '2026-10-01T12:00:00.000Z' }
  if (path === `/api/couple/weddings/${weddingId}/photos`) return { photos: [] }
  if (path === `/api/couple/weddings/${weddingId}/site-media`) return { media: [] }
  if (path === '/api/invitation') return sampleInvitation
  if (path === '/api/invitation/companions') return { companions: [] }
  if (path === '/api/invitation/photos') return { photos: [], limit: 200, remaining: 200 }
  if (path === '/api/godparent/tasks') return { tasks: [sampleTask] }
  if (path === '/api/public/weddings/ana-e-caio') return { wedding: sampleInvitation.wedding, siteConfig: sampleConfig, events: [sampleEvent], gifts: [sampleGift], guestPolicy: { companionsAllowed: true, maxCompanions: 1 } }
  if (path === '/api/staff/events') return { events: [sampleEvent] }
  if (path === `/api/staff/events/${eventId}/guests`) return { guests: [{ ...sampleGuest, attendance_status: 'confirmed', checked_in_at: null }], walkIns: [] }
  if (path === `/api/staff/events/${eventId}/offline-roster`) return { guests: [sampleGuest], walkIns: [] }
  if (path === '/api/superadmin/overview') return { weddings: { active: 1, total: 1 }, accounts: { active: 1, total: 1 }, guests: { total: 2 }, audit: [], auditTotal: 0, auditPage: 1, auditHasMore: false }
  if (path === '/api/superadmin/accounts') return { accounts: [{ id: 'demo-account', email: 'casal@example.test', wedding_count: 1, status: 'active', email_verified_at: '2026-10-01T12:00:00.000Z', created_at: '2026-09-01T12:00:00.000Z', last_login_at: '2026-10-20T12:00:00.000Z' }], hasMore: false }
  if (path === '/api/superadmin/weddings') return { weddings: [sampleWedding], hasMore: false }
  return null
}

export function installDevelopmentAccessSimulator() {
  window.__APP_DEMO_MODE__ = true
  const originalFetch = window.fetch.bind(window)
  window.localStorage.removeItem('wedding-staff-locked')
  window.fetch = async (input, init = {}) => {
    const url = new URL(typeof input === 'string' || input instanceof URL ? input : input.url, window.location.origin)
    if (!url.pathname.startsWith('/api/')) return originalFetch(input, init)
    const path = url.pathname
    const method = String(init.method || (input instanceof Request ? input.method : 'GET')).toUpperCase()
    const data = routeData(path)
    if (data) return json(data)
    if (path === '/api/site-media/' || path.startsWith('/api/site-media/')) return new Response(null, { status: 404 })
    if (method !== 'GET' && method !== 'HEAD') return json({ ok: true, demo: true })
    return json({})
  }
}
