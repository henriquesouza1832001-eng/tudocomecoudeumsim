import { Hono } from 'hono'
import { createRemoteJWKSet, jwtVerify } from 'jose'
import { zipSync, zlibSync } from 'fflate'
import { createOpenSslCompatiblePkcs7Signature } from '@swapnanildhol/passkit-pkcs7-signature'
import { SITE_MEDIA_LIMITS } from '../../src/site-media-config.js'
import {
  authenticate,
  checkLoginLimit,
  clearCookie,
  clearLoginFailures,
  confirmTotpEnrollment,
  createSession,
  hashPassword,
  loadSession,
  recordLoginFailure,
  startTotpEnrollment,
  verifyRecentTotp,
} from '../../src/server/auth.js'

const app = new Hono()
const PRODUCT_NAME = 'Tudo começou de um sim'
const accessKeySets = new Map()
const siteThemes = ['garden', 'editorial', 'minimal', 'floral', 'rustic', 'beach', 'tropical', 'night']
const siteCoverLayouts = ['full', 'split', 'arch', 'type', 'video', 'collage']
const siteAnimations = ['Suave', 'Elegante', 'Festivo', 'Nenhum']
const siteLanguages = ['pt-BR', 'en', 'es']
const siteFontPairs = ['Clássico editorial', 'Romântico leve', 'Moderno sem serifa', 'Elegante de alto contraste', 'Contemporâneo humanista', 'Floral delicado', 'Minimalista geométrico', 'Rústico acolhedor']
const siteSections = ['Nossa história', 'Linha do tempo', 'Contagem regressiva', 'Eventos', 'Cronograma', 'Dress code', 'Padrinhos e madrinhas', 'Lista de presentes', 'Confirmação de presença', 'Galeria de fotos', 'Mural de recados', 'Hospedagem e dicas', 'Perguntas frequentes', 'Playlist', 'Vídeo', 'Contato', 'Quiz dos noivos']
const siteGiftCategories = ['Cozinha', 'Eletrodomésticos', 'Casa e decoração', 'Quarto e banho', 'Experiências', 'Lua de mel', 'Outros']
const coverCompositions = ['side', 'overlay', 'editorial']
const coverTextAlignments = ['left', 'center', 'right']
const coverImagePositions = ['center', 'top', 'bottom', 'left', 'right']
const giftDisplayModes = ['inline', 'page', 'hidden']
const pixDisplayModes = ['inline', 'page', 'hidden']
const defaultSiteConfig = { theme: 'garden', paletteIndex: 0, coverLayout: 'full', coverComposition: null, coverTextAlign: 'left', coverOverlayOpacity: 45, coverImagePosition: 'center', giftDisplayMode: 'hidden', pixDisplayMode: 'hidden', coverImage: 'none', coverPhotoId: null, coverCarouselEnabled: false, coverGallery: [], siteGallery: [], fontScale: 'medium', enabledSections: ['Nossa história', 'Eventos', 'Confirmação de presença'], animationPreset: 'Elegante', fontPair: 'Clássico editorial', language: 'pt-BR', coverMessages: { 'pt-BR': 'Com alegria, convidamos você.', en: 'With joy, we invite you.', es: 'Con alegría, te invitamos.' }, storyMessages: { 'pt-BR': '', en: '', es: '' }, timeline: [], giftPresentation: {}, sectionContent: {}, weddingDetails: { schedule: '', menu: '', dressCode: '' }, guestCamera: { enabled: false, photoLimit: 200 }, pix: { enabled: false, key: '', holderName: '' } }
const guestPhotoConsentVersion = 'guest-camera-v1'
function validPixSettings(pix) {
  if (pix === undefined) return defaultSiteConfig.pix
  if (!pix || typeof pix !== 'object' || Array.isArray(pix) || typeof pix.enabled !== 'boolean' || typeof pix.key !== 'string' || pix.key.length > 200 || /\p{Cc}/u.test(pix.key) || (pix.holderName !== undefined && (typeof pix.holderName !== 'string' || pix.holderName.length > 120 || /\p{Cc}/u.test(pix.holderName)))) return null
  const key = pix.key.trim()
  const holderName = (pix.holderName || '').trim()
  if (pix.enabled && !key) return null
  return { enabled: pix.enabled, key, holderName }
}

function publicSiteConfig(config) {
  if (!config) return config
  const pixEnabled = config.pix?.enabled && config.pixDisplayMode !== 'hidden'
  return { ...config, pix: pixEnabled ? config.pix : { enabled: false, key: '', holderName: '' } }
}

function normalizedGiftDisplayMode(config) {
  return giftDisplayModes.includes(config?.giftDisplayMode) ? config.giftDisplayMode : config?.enabledSections?.includes('Lista de presentes') ? 'inline' : 'hidden'
}

function normalizedPixDisplayMode(config) {
  return pixDisplayModes.includes(config?.pixDisplayMode) ? config.pixDisplayMode : config?.pix?.enabled ? 'inline' : 'hidden'
}

function siteMediaReferences(value, id) {
  let config
  try {
    config = JSON.parse(value || '{}')
  } catch {
    return ['configuração indisponível']
  }
  if (!config || typeof config !== 'object' || Array.isArray(config)) return []
  const uses = []
  if (config.coverPhotoId === id) uses.push('foto principal da capa')
  if (Array.isArray(config.coverGallery) && config.coverGallery.includes(id)) uses.push('carrossel da capa')
  if (Array.isArray(config.siteGallery) && config.siteGallery.includes(id)) uses.push('galeria do site')
  if (Array.isArray(config.timeline) && config.timeline.some((item) => item.photoId === id)) uses.push('linha do tempo')
  if (config.giftPresentation && Object.values(config.giftPresentation).some((item) => item?.photoId === id)) uses.push('foto de presente')
  if (config.coverVideoId === id) uses.push('vídeo de abertura')
  return uses
}

function validGuestCamera(camera) {
  if (camera === undefined) return defaultSiteConfig.guestCamera
  if (!camera || typeof camera !== 'object' || Array.isArray(camera) || typeof camera.enabled !== 'boolean' || !Number.isInteger(camera.photoLimit)) return null
  if (camera.photoLimit < 1 || camera.photoLimit > 300) return null
  return { enabled: camera.enabled, photoLimit: camera.photoLimit }
}

function validCoverMessages(messages) {
  if (messages === undefined) return defaultSiteConfig.coverMessages
  if (!messages || typeof messages !== 'object' || Array.isArray(messages)) return null
  if (siteLanguages.some((language) => typeof messages[language] !== 'string' || messages[language].length > 240)) return null
  return Object.fromEntries(siteLanguages.map((language) => [language, messages[language].trim()]))
}

function validStoryMessages(messages) {
  if (messages === undefined) return defaultSiteConfig.storyMessages
  if (!messages || typeof messages !== 'object' || Array.isArray(messages)) return null
  if (siteLanguages.some((language) => typeof messages[language] !== 'string' || messages[language].length > 3000)) return null
  return Object.fromEntries(siteLanguages.map((language) => [language, messages[language].trim()]))
}

function validSectionContent(content) {
  if (content === undefined) return defaultSiteConfig.sectionContent
  if (!content || typeof content !== 'object' || Array.isArray(content) || Object.keys(content).some((section) => !siteSections.includes(section))) return null
  const result = {}
  for (const [section, translations] of Object.entries(content)) {
    if (!translations || typeof translations !== 'object' || Array.isArray(translations) || Object.keys(translations).some((language) => !siteLanguages.includes(language))) return null
    result[section] = {}
    for (const language of siteLanguages) {
      const item = translations[language] || {}
      if (!item || typeof item !== 'object' || Array.isArray(item) || Object.keys(item).some((key) => !['title', 'body'].includes(key))) return null
      const title = item.title ?? ''
      const body = item.body ?? ''
      if (typeof title !== 'string' || title.length > 120 || typeof body !== 'string' || body.length > 4000) return null
      result[section][language] = { title: title.trim(), body: body.trim() }
    }
  }
  return result
}

function validTimeline(timeline) {
  if (timeline === undefined) return []
  if (!Array.isArray(timeline) || timeline.length > 6) return null
  const result = []
  for (const item of timeline) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) return null
    const { id, title, date, description, photoId } = item
    const parsedDate = typeof date === 'string' && date ? new Date(`${date}T00:00:00.000Z`) : null
    if (typeof id !== 'string' || !/^[0-9a-f-]{36}$/i.test(id)
      || typeof title !== 'string' || title.length > 100
      || typeof date !== 'string' || date.length > 10 || (date && (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(parsedDate.getTime()) || parsedDate.toISOString().slice(0, 10) !== date))
      || typeof description !== 'string' || description.length > 1200
      || (photoId !== null && photoId !== undefined && (typeof photoId !== 'string' || !/^[0-9a-f-]{36}$/i.test(photoId)))) return null
    result.push({ id, title: title.trim(), date, description: description.trim(), photoId: photoId || null })
  }
  return result
}

function validGiftPresentation(presentation) {
  if (presentation === undefined) return {}
  if (!presentation || typeof presentation !== 'object' || Array.isArray(presentation) || Object.keys(presentation).length > 60) return null
  const result = {}
  for (const [giftId, item] of Object.entries(presentation)) {
    if (!/^[0-9a-f-]{36}$/i.test(giftId) || !item || typeof item !== 'object' || Array.isArray(item)
      || !siteGiftCategories.includes(item.category || 'Outros')
      || (item.photoId !== null && item.photoId !== undefined && (typeof item.photoId !== 'string' || !/^[0-9a-f-]{36}$/i.test(item.photoId)))) return null
    result[giftId] = { category: item.category || 'Outros', photoId: item.photoId || null }
  }
  return result
}

function validWeddingDetails(details) {
  const fallback = { schedule: '', menu: '', dressCode: '' }
  if (details === undefined) return fallback
  const allowedKeys = new Set([...Object.keys(fallback), 'venue', 'address', 'ceremonyTime', 'receptionTime'])
  if (!details || typeof details !== 'object' || Array.isArray(details) || Object.keys(details).some((key) => !allowedKeys.has(key))) return null
  const limits = { schedule: 1200, menu: 1200, dressCode: 120 }
  const result = {}
  for (const [key, limit] of Object.entries(limits)) {
    const value = details[key] ?? ''
    if (typeof value !== 'string' || value.length > limit) return null
    result[key] = value.trim()
  }
  return result
}
function parseSiteConfig(value) {
  if (!value || value === '{}') return null
  try {
    const config = JSON.parse(value || '{}')
    if (!siteThemes.includes(config.theme) || !Number.isInteger(config.paletteIndex) || config.paletteIndex < 0 || config.paletteIndex > 5
      || !siteCoverLayouts.includes(config.coverLayout) || !siteAnimations.includes(config.animationPreset)
      || !siteFontPairs.includes(config.fontPair) || !siteLanguages.includes(config.language)
      || !['small', 'medium', 'large'].includes(config.fontScale || 'medium') || !['none', 'wedding-pexels', 'wedding-moments'].includes(config.coverImage || 'none')
      || !Array.isArray(config.enabledSections) || config.enabledSections.some((section) => !siteSections.includes(section))) return null
    const coverMessages = validCoverMessages(config.coverMessages)
    if (!coverMessages) return null
    const storyMessages = validStoryMessages(config.storyMessages)
    if (!storyMessages) return null
    const sectionContent = validSectionContent(config.sectionContent)
    if (!sectionContent) return null
    const timeline = validTimeline(config.timeline)
    if (!timeline) return null
    const giftPresentation = validGiftPresentation(config.giftPresentation)
    if (!giftPresentation) return null
    const weddingDetails = validWeddingDetails(config.weddingDetails)
    if (!weddingDetails) return null
    const guestCamera = validGuestCamera(config.guestCamera)
    if (!guestCamera) return null
    const pix = validPixSettings(config.pix)
    if (!pix) return null
    if ((config.coverComposition !== undefined && config.coverComposition !== null && !coverCompositions.includes(config.coverComposition))
      || (config.coverTextAlign !== undefined && !coverTextAlignments.includes(config.coverTextAlign))
      || (config.coverOverlayOpacity !== undefined && (!Number.isInteger(config.coverOverlayOpacity) || config.coverOverlayOpacity < 10 || config.coverOverlayOpacity > 75))
      || (config.coverImagePosition !== undefined && !coverImagePositions.includes(config.coverImagePosition))
      || (config.giftDisplayMode !== undefined && !giftDisplayModes.includes(config.giftDisplayMode))
      || (config.pixDisplayMode !== undefined && !pixDisplayModes.includes(config.pixDisplayMode))) return null
    if (config.coverGallery !== undefined && (!Array.isArray(config.coverGallery) || config.coverGallery.length > SITE_MEDIA_LIMITS.photosPerWedding || config.coverGallery.some((id) => typeof id !== 'string' || !/^[0-9a-f-]{36}$/i.test(id)))) return null
    if (config.siteGallery !== undefined && (!Array.isArray(config.siteGallery) || config.siteGallery.length > SITE_MEDIA_LIMITS.photosPerWedding || config.siteGallery.some((id) => typeof id !== 'string' || !/^[0-9a-f-]{36}$/i.test(id)))) return null
    if (config.coverPhotoId !== undefined && config.coverPhotoId !== null && (typeof config.coverPhotoId !== 'string' || !/^[0-9a-f-]{36}$/i.test(config.coverPhotoId))) return null
    if (config.coverVideoId !== undefined && config.coverVideoId !== null && (typeof config.coverVideoId !== 'string' || !/^[0-9a-f-]{36}$/i.test(config.coverVideoId))) return null
    return { ...defaultSiteConfig, ...config, coverComposition: config.coverComposition || null, coverTextAlign: config.coverTextAlign || 'left', coverOverlayOpacity: config.coverOverlayOpacity ?? 45, coverImagePosition: config.coverImagePosition || 'center', giftDisplayMode: normalizedGiftDisplayMode(config), pixDisplayMode: normalizedPixDisplayMode(config), coverImage: 'none', coverPhotoId: config.coverPhotoId || null, coverCarouselEnabled: config.coverCarouselEnabled === true, coverGallery: config.coverGallery || [], siteGallery: config.siteGallery || [], coverVideoId: config.coverVideoId || null, enabledSections: [...new Set(config.enabledSections)], coverMessages, storyMessages, timeline, giftPresentation, sectionContent, weddingDetails, guestCamera, pix }
  } catch {
    return null
  }
}

function validateSiteConfig(body) {
  if (!body || !siteThemes.includes(body.theme) || !Number.isInteger(body.paletteIndex) || body.paletteIndex < 0 || body.paletteIndex > 5
    || !siteCoverLayouts.includes(body.coverLayout) || !siteAnimations.includes(body.animationPreset)
    || !siteFontPairs.includes(body.fontPair) || !siteLanguages.includes(body.language)
    || !['small', 'medium', 'large'].includes(body.fontScale || 'medium') || !['none', 'wedding-pexels', 'wedding-moments'].includes(body.coverImage || 'none')
    || !Array.isArray(body.enabledSections) || body.enabledSections.length > siteSections.length
    || body.enabledSections.some((section) => !siteSections.includes(section))) return null
  const coverMessages = validCoverMessages(body.coverMessages)
  if (!coverMessages) return null
  const storyMessages = validStoryMessages(body.storyMessages)
  if (!storyMessages) return null
  const sectionContent = validSectionContent(body.sectionContent)
  if (!sectionContent) return null
  const timeline = validTimeline(body.timeline)
  if (!timeline) return null
  const giftPresentation = validGiftPresentation(body.giftPresentation)
  if (!giftPresentation) return null
  const weddingDetails = validWeddingDetails(body.weddingDetails)
  if (!weddingDetails) return null
  const guestCamera = validGuestCamera(body.guestCamera)
  if (!guestCamera) return null
  const pix = validPixSettings(body.pix)
  if (!pix) return null
  if ((body.coverComposition !== undefined && body.coverComposition !== null && !coverCompositions.includes(body.coverComposition))
    || (body.coverTextAlign !== undefined && !coverTextAlignments.includes(body.coverTextAlign))
    || (body.coverOverlayOpacity !== undefined && (!Number.isInteger(body.coverOverlayOpacity) || body.coverOverlayOpacity < 10 || body.coverOverlayOpacity > 75))
    || (body.coverImagePosition !== undefined && !coverImagePositions.includes(body.coverImagePosition))
    || (body.giftDisplayMode !== undefined && !giftDisplayModes.includes(body.giftDisplayMode))
    || (body.pixDisplayMode !== undefined && !pixDisplayModes.includes(body.pixDisplayMode))) return null
  if (body.coverGallery !== undefined && (!Array.isArray(body.coverGallery) || body.coverGallery.length > SITE_MEDIA_LIMITS.photosPerWedding || body.coverGallery.some((id) => typeof id !== 'string' || !/^[0-9a-f-]{36}$/i.test(id)))) return null
  if (body.siteGallery !== undefined && (!Array.isArray(body.siteGallery) || body.siteGallery.length > SITE_MEDIA_LIMITS.photosPerWedding || body.siteGallery.some((id) => typeof id !== 'string' || !/^[0-9a-f-]{36}$/i.test(id)))) return null
  if (body.coverPhotoId !== undefined && body.coverPhotoId !== null && (typeof body.coverPhotoId !== 'string' || !/^[0-9a-f-]{36}$/i.test(body.coverPhotoId))) return null
  if (body.coverVideoId !== undefined && body.coverVideoId !== null && (typeof body.coverVideoId !== 'string' || !/^[0-9a-f-]{36}$/i.test(body.coverVideoId))) return null
  return { theme: body.theme, paletteIndex: body.paletteIndex, coverLayout: body.coverLayout, coverComposition: body.coverComposition || null, coverTextAlign: body.coverTextAlign || 'left', coverOverlayOpacity: body.coverOverlayOpacity ?? 45, coverImagePosition: body.coverImagePosition || 'center', giftDisplayMode: normalizedGiftDisplayMode(body), pixDisplayMode: normalizedPixDisplayMode(body), coverImage: 'none', coverPhotoId: body.coverPhotoId || null, coverCarouselEnabled: body.coverCarouselEnabled === true, fontScale: body.fontScale || 'medium', coverGallery: body.coverGallery || [], siteGallery: body.siteGallery || [], coverVideoId: body.coverVideoId || null, enabledSections: [...new Set(body.enabledSections)], animationPreset: body.animationPreset, fontPair: body.fontPair, language: body.language, coverMessages, storyMessages, timeline, giftPresentation, sectionContent, weddingDetails, guestCamera, pix }
}

function jsonError(context, status, error) {
  return context.json({ error }, status, { 'Cache-Control': 'no-store' })
}

async function purgeR2Prefix(bucket, prefix) {
  if (!bucket) return
  let cursor
  do {
    const page = await bucket.list({ prefix, cursor, limit: 1000 })
    if (page.objects.length) await bucket.delete(page.objects.map((object) => object.key))
    cursor = page.truncated ? page.cursor : undefined
  } while (cursor)
}

async function verifyAccessIdentity(context, expectedEmail) {
  const teamDomain = context.env.ACCESS_TEAM_DOMAIN || context.env.CLOUDFLARE_ACCESS_TEAM_DOMAIN
  const audiences = (context.env.ACCESS_APPLICATION_AUD || context.env.CLOUDFLARE_ACCESS_AUD)?.split(',').map((audience) => audience.trim()).filter(Boolean) || []
  if (!teamDomain || !audiences.length) return { configured: false, valid: false }
  let issuer
  try {
    const domain = new URL(teamDomain)
    if (domain.protocol !== 'https:' || domain.pathname !== '/' || domain.search || domain.hash || domain.username || domain.password) {
      return { configured: false, valid: false }
    }
    issuer = domain.origin
  } catch {
    return { configured: false, valid: false }
  }
  const token = context.req.header('Cf-Access-Jwt-Assertion')
  if (!token || token.length > 8192) return { configured: true, valid: false }
  try {
    let keySet = accessKeySets.get(issuer)
    if (!keySet) {
      keySet = createRemoteJWKSet(new URL(`${issuer}/cdn-cgi/access/certs`))
      accessKeySets.set(issuer, keySet)
    }
    const { payload } = await jwtVerify(token, keySet, { issuer, audience: audiences, algorithms: ['RS256'] })
    const tokenEmail = typeof payload.email === 'string' ? payload.email.trim().toLowerCase() : ''
    return { configured: true, valid: payload.type === 'app' && Boolean(expectedEmail) && tokenEmail === expectedEmail.trim().toLowerCase() }
  } catch {
    return { configured: true, valid: false }
  }
}

async function requireCloudflareAccess(context, next) {
  const expectedEmail = context.env.SUPERADMIN_EMAIL?.trim().toLowerCase()
  if (!expectedEmail) return jsonError(context, 503, 'superadmin_email_unconfigured')
  const access = await verifyAccessIdentity(context, expectedEmail)
  if (!access.configured) return jsonError(context, 503, 'cloudflare_access_unconfigured')
  if (!access.valid) return jsonError(context, 403, 'cloudflare_access_required')
  return next()
}

function validOrigin(context) {
  const origin = context.req.header('Origin')
  return origin === new URL(context.req.url).origin
}

async function requireSession(context, next) {
  const session = await loadSession(context)
  if (!session) return jsonError(context, 401, 'authentication_required')
  const setupAllowed = ['/api/auth/session', '/api/auth/logout', '/api/superadmin/mfa/enroll', '/api/superadmin/mfa/confirm']
  if (session.is_superadmin && !session.mfa_verified_at && !setupAllowed.includes(context.req.path)) return jsonError(context, 403, session.mfa_enabled_at ? 'mfa_verification_required' : 'mfa_setup_required')
  context.set('session', session)
  return next()
}

async function requireSuperadmin(context, next) {
  const session = context.get('session')
  if (!session?.mfa_verified_at || !context.env.SUPERADMIN_EMAIL || session.email.toLowerCase() !== context.env.SUPERADMIN_EMAIL.toLowerCase()) {
    return jsonError(context, 403, 'superadmin_access_required')
  }
  const access = await verifyAccessIdentity(context, session.email)
  if (!access.configured) return jsonError(context, 503, 'cloudflare_access_unconfigured')
  if (!access.valid) return jsonError(context, 403, 'cloudflare_access_required')
  const admin = await context.env.DB.prepare("SELECT 1 AS allowed FROM platform_admins WHERE account_id = ? AND role = 'superadmin'").bind(session.account_id).first()
  if (!admin) return jsonError(context, 403, 'superadmin_access_required')
  context.set('actorId', session.account_id)
  return next()
}

async function requireSuperadminIdentity(context, next) {
  const session = context.get('session')
  if (!session || !context.env.SUPERADMIN_EMAIL || session.email.toLowerCase() !== context.env.SUPERADMIN_EMAIL.toLowerCase()) {
    return jsonError(context, 403, 'superadmin_access_required')
  }
  const access = await verifyAccessIdentity(context, session.email)
  if (!access.configured) return jsonError(context, 503, 'cloudflare_access_unconfigured')
  if (!access.valid) return jsonError(context, 403, 'cloudflare_access_required')
  const admin = await context.env.DB.prepare("SELECT 1 AS allowed FROM platform_admins WHERE account_id = ? AND role = 'superadmin'").bind(session.account_id).first()
  if (!admin) return jsonError(context, 403, 'superadmin_access_required')
  context.set('actorId', session.account_id)
  return next()
}

async function weddingMembership(context, weddingId, roles) {
  const placeholders = roles.map(() => '?').join(', ')
  return context.env.DB.prepare(`
    SELECT m.id, m.role, w.status AS wedding_status
    FROM wedding_memberships m JOIN weddings w ON w.id = m.wedding_id
    WHERE m.wedding_id = ? AND m.account_id = ? AND m.status = 'active'
      AND w.status != 'deleted' AND m.role IN (${placeholders})
  `).bind(weddingId, context.get('session').account_id, ...roles).first()
}

function encodeToken(bytes) {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

async function tokenHash(token) {
  return encodeToken(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token))))
}

async function guestCredentialCipher(context, token) {
  const secret = context.env.GUEST_CREDENTIALS_ENCRYPTION_KEY
  if (typeof secret !== 'string' || secret.length < 32) return null
  const keyBytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(secret))
  const key = await crypto.subtle.importKey('raw', keyBytes, 'AES-GCM', false, ['encrypt'])
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(token))
  return { ciphertext: encodeToken(new Uint8Array(ciphertext)), iv: encodeToken(iv) }
}

async function openGuestCredential(context, ciphertext, encodedIv) {
  const secret = context.env.GUEST_CREDENTIALS_ENCRYPTION_KEY
  if (typeof secret !== 'string' || secret.length < 32 || !ciphertext || !encodedIv) return null
  const keyBytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(secret))
  const key = await crypto.subtle.importKey('raw', keyBytes, 'AES-GCM', false, ['decrypt'])
  const decode = (value) => Uint8Array.from(atob(value.replace(/-/g, '+').replace(/_/g, '/')), (character) => character.charCodeAt(0))
  try {
    const plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: decode(encodedIv) }, key, decode(ciphertext))
    return new TextDecoder().decode(plaintext)
  } catch {
    return null
  }
}

async function allowCoupleSignup(context) {
  const now = Math.floor(Date.now() / 1000)
  const windowSeconds = 3600
  const maximumRequests = 3
  const remoteIp = context.req.header('CF-Connecting-IP') || 'unknown'
  const identifierHash = await tokenHash(`couple-signup:${remoteIp}`)
  const current = await context.env.DB.prepare(`
    INSERT INTO auth_rate_limits (identifier_hash, failed_attempts, window_started_at, blocked_until)
    VALUES (?, 1, ?, NULL)
    ON CONFLICT(identifier_hash) DO UPDATE SET
      failed_attempts = CASE WHEN auth_rate_limits.window_started_at <= ? THEN 1 ELSE auth_rate_limits.failed_attempts + 1 END,
      window_started_at = CASE WHEN auth_rate_limits.window_started_at <= ? THEN excluded.window_started_at ELSE auth_rate_limits.window_started_at END,
      blocked_until = CASE
        WHEN auth_rate_limits.blocked_until > ? THEN auth_rate_limits.blocked_until
        WHEN auth_rate_limits.window_started_at <= ? THEN NULL
        WHEN auth_rate_limits.failed_attempts + 1 >= ? THEN ?
        ELSE NULL
      END
    RETURNING blocked_until
  `).bind(identifierHash, now, now - windowSeconds, now - windowSeconds, now, now - windowSeconds, maximumRequests, now + windowSeconds).first()
  return !(current?.blocked_until > now)
}

async function allowPasswordReset(context, email) {
  const now = Math.floor(Date.now() / 1000)
  const windowSeconds = 3600
  const maximumRequests = 3
  const remoteIp = context.req.header('CF-Connecting-IP') || 'unknown'
  const identifierHash = await tokenHash(`password-reset:${remoteIp}:${email}`)
  const current = await context.env.DB.prepare(`
    INSERT INTO auth_rate_limits (identifier_hash, failed_attempts, window_started_at, blocked_until)
    VALUES (?, 1, ?, NULL)
    ON CONFLICT(identifier_hash) DO UPDATE SET
      failed_attempts = CASE WHEN auth_rate_limits.window_started_at <= ? THEN 1 ELSE auth_rate_limits.failed_attempts + 1 END,
      window_started_at = CASE WHEN auth_rate_limits.window_started_at <= ? THEN excluded.window_started_at ELSE auth_rate_limits.window_started_at END,
      blocked_until = CASE
        WHEN auth_rate_limits.blocked_until > ? THEN auth_rate_limits.blocked_until
        WHEN auth_rate_limits.window_started_at <= ? THEN NULL
        WHEN auth_rate_limits.failed_attempts + 1 >= ? THEN ?
        ELSE NULL
      END
    RETURNING blocked_until
  `).bind(identifierHash, now, now - windowSeconds, now - windowSeconds, now, now - windowSeconds, maximumRequests, now + windowSeconds).first()
  return !(current?.blocked_until > now)
}

function configuredEmailProvider(env) {
  const selectedProvider = env.EMAIL_PROVIDER?.trim().toLowerCase()
  if (selectedProvider === 'resend') return env.RESEND_API_KEY && env.EMAIL_FROM ? 'resend' : null
  if (selectedProvider === 'cloudflare') return env.CLOUDFLARE_EMAIL_API_TOKEN && env.CLOUDFLARE_ACCOUNT_ID && env.EMAIL_FROM ? 'cloudflare' : null
  if (selectedProvider) return null
  if (env.CLOUDFLARE_EMAIL_API_TOKEN && env.CLOUDFLARE_ACCOUNT_ID && env.EMAIL_FROM) return 'cloudflare'
  if (env.RESEND_API_KEY && env.EMAIL_FROM) return 'resend'
  return null
}

async function sendTransactionalEmail(context, { to, subject, text, html }) {
  const provider = configuredEmailProvider(context.env)
  if (!provider) return false
  const isResend = provider === 'resend'
  const apiToken = isResend ? context.env.RESEND_API_KEY : context.env.CLOUDFLARE_EMAIL_API_TOKEN
  const endpoint = isResend
    ? 'https://api.resend.com/emails'
    : `https://api.cloudflare.com/client/v4/accounts/${context.env.CLOUDFLARE_ACCOUNT_ID}/email/sending/send`
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ to: isResend ? [to] : to, from: context.env.EMAIL_FROM, subject, text, html: brandedEmail(html) }),
  })
  if (!response.ok) return false
  const result = await response.json().catch(() => null)
  if (isResend) return typeof result?.id === 'string' && result.id.length > 0
  return result?.success === true && !result.result?.permanent_bounces?.includes(to)
}

function brandedEmail(content) {
  const formattedContent = content.replace(/<a href="([^"]+)">([^<]+)<\/a>/, '<a href="$1" style="display:inline-block;margin:8px 0;padding:13px 22px;background:#40574a;color:#fffdf9;font-weight:bold;text-decoration:none">$2</a>')
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><meta name="color-scheme" content="light"><title>${PRODUCT_NAME}</title></head><body style="margin:0;background:#f3f0e9;color:#35483e;font-family:Arial,sans-serif"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f3f0e9;padding:32px 12px"><tr><td align="center"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;background:#fffdf9;border:1px solid #e5ded2"><tr><td style="padding:26px 32px 20px;border-bottom:1px solid #e5ded2"><span style="display:inline-block;border:1px solid #d9d4c8;border-radius:50%;padding:12px 9px;color:#be8052;font-family:Georgia,serif;font-size:18px">e&amp;t</span><span style="margin-left:12px;color:#31483c;font-family:Georgia,serif;font-size:19px">${PRODUCT_NAME}</span><div style="height:2px;margin-top:22px;background:#d7c4a8"></div></td></tr><tr><td style="padding:34px 32px 38px;font-size:16px;line-height:1.7">${formattedContent}</td></tr><tr><td style="padding:20px 32px;background:#f7f5ef;border-top:1px solid #e5ded2;color:#667166;font-size:12px;line-height:1.7">Uma plataforma para celebrar histórias e organizar cada detalhe.<br>Esta mensagem é automática e não recebe respostas. Dúvidas? <a href="mailto:henriquesouza1832001@gmail.com" style="color:#40574a">Fale com a gente</a> · <a href="https://henriquesouzas.com" style="color:#40574a">henriquesouzas.com</a></td></tr></table></td></tr></table></body></html>`
}

async function sendAccountVerification(context, email, token) {
  const verificationUrl = `${new URL(context.req.url).origin}/confirmar-email#confirmar-email/${token}`
  const contactText = '\n\nEsta mensagem \u00e9 autom\u00e1tica e n\u00e3o recebe respostas. Se precisar de ajuda, fale conosco pelo telefone (31) 98892-4409 ou pelo e-mail henriquesouza1832001@gmail.com.'
  const contactHtml = '<hr><p>Esta mensagem \u00e9 autom\u00e1tica e n\u00e3o recebe respostas. Se precisar de ajuda, fale conosco pelo telefone <a href="tel:+5531988924409">(31) 98892-4409</a> ou pelo e-mail <a href="mailto:henriquesouza1832001@gmail.com">henriquesouza1832001@gmail.com</a>.</p>'
  return sendTransactionalEmail(context, {
    to: email,
    subject: `Confirme seu cadastro | ${PRODUCT_NAME}`,
    text: `Confirme seu endere\u00e7o de e-mail acessando: ${verificationUrl}\n\nEste link expira em 24 horas.${contactText}`,
    html: `<p>Confirme seu endere\u00e7o de e-mail para ativar seu cadastro.</p><p><a href="${verificationUrl}">Confirmar meu e-mail</a></p><p>Este link expira em 24 horas.</p>${contactHtml}`,
  })
}

async function sendPasswordReset(context, email, token) {
  const resetUrl = `${new URL(context.req.url).origin}/redefinir-senha#redefinir-senha/${token}`
  const contactText = '\n\nEsta mensagem \u00e9 autom\u00e1tica e n\u00e3o recebe respostas. Se precisar de ajuda, fale conosco pelo telefone (31) 98892-4409 ou pelo e-mail henriquesouza1832001@gmail.com.'
  const contactHtml = '<hr><p>Esta mensagem \u00e9 autom\u00e1tica e n\u00e3o recebe respostas. Se precisar de ajuda, fale conosco pelo telefone <a href="tel:+5531988924409">(31) 98892-4409</a> ou pelo e-mail <a href="mailto:henriquesouza1832001@gmail.com">henriquesouza1832001@gmail.com</a>.</p>'
  return sendTransactionalEmail(context, {
    to: email,
    subject: `Redefina sua senha | ${PRODUCT_NAME}`,
    text: `Use este link para redefinir sua senha. Ele expira em 30 minutos.\n\n${resetUrl}${contactText}`,
    html: `<p>Use o link abaixo para redefinir sua senha. Ele expira em 30 minutos.</p><p><a href="${resetUrl}">Redefinir senha</a></p>${contactHtml}`,
  })
}

async function verifyTurnstile(context, token, expectedAction = 'account') {
  const secret = context.env.TURNSTILE_SECRET_KEY
  if (!secret) return { configured: false, verified: false }
  if (typeof token !== 'string' || token.length < 1 || token.length > 2048) return { configured: true, verified: false }
  const body = new URLSearchParams({ secret, response: token, idempotency_key: crypto.randomUUID() })
  const remoteIp = context.req.header('CF-Connecting-IP')
  if (remoteIp) body.set('remoteip', remoteIp)
  try {
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body })
    const result = await response.json()
    const hostname = new URL(context.req.url).hostname
    return { configured: true, verified: response.ok && result.success === true && result.action === expectedAction && result.hostname === hostname }
  } catch {
    return { configured: true, verified: false }
  }
}

async function allowRsvpRequest(context, guestId) {
  const now = Math.floor(Date.now() / 1000)
  const windowSeconds = 600
  const maximumRequests = 8
  const windowCutoff = now - windowSeconds
  const remoteIp = context.req.header('CF-Connecting-IP') || 'unknown'
  const identifierHash = await tokenHash(`rsvp:${guestId}:${remoteIp}`)
  const current = await context.env.DB.prepare(`
    INSERT INTO public_request_limits (identifier_hash, guest_id, request_count, window_started_at, blocked_until)
    VALUES (?, ?, 1, ?, NULL)
    ON CONFLICT(identifier_hash) DO UPDATE SET
      request_count = CASE
        WHEN public_request_limits.blocked_until > ? THEN public_request_limits.request_count
        WHEN (public_request_limits.blocked_until IS NOT NULL AND public_request_limits.blocked_until <= ?)
          OR public_request_limits.window_started_at <= ? THEN 1
        ELSE public_request_limits.request_count + 1
      END,
      window_started_at = CASE
        WHEN public_request_limits.blocked_until > ? THEN public_request_limits.window_started_at
        WHEN (public_request_limits.blocked_until IS NOT NULL AND public_request_limits.blocked_until <= ?)
          OR public_request_limits.window_started_at <= ? THEN excluded.window_started_at
        ELSE public_request_limits.window_started_at
      END,
      blocked_until = CASE
        WHEN public_request_limits.blocked_until > ? THEN public_request_limits.blocked_until
        WHEN (public_request_limits.blocked_until IS NOT NULL AND public_request_limits.blocked_until <= ?)
          OR public_request_limits.window_started_at <= ? THEN NULL
        WHEN public_request_limits.request_count + 1 > ? THEN ?
        ELSE NULL
      END
    RETURNING request_count, blocked_until
  `).bind(identifierHash, guestId, now, now, now, windowCutoff, now, now, windowCutoff, now, now, windowCutoff, maximumRequests, now + windowSeconds).first()
  return { allowed: !(current?.blocked_until > now), retryAfter: current?.blocked_until > now ? current.blocked_until - now : 0 }
}

async function allowPublicWeddingRequest(context, weddingId) {
  const now = Math.floor(Date.now() / 1000)
  const windowSeconds = 600
  const maximumRequests = 8
  const remoteIp = context.req.header('CF-Connecting-IP') || 'unknown'
  const identifierHash = await tokenHash(`public-wedding-rsvp:${weddingId}:${remoteIp}`)
  const current = await context.env.DB.prepare(`
    INSERT INTO public_wedding_request_limits (identifier_hash, wedding_id, request_count, window_started_at, blocked_until)
    VALUES (?, ?, 1, ?, NULL)
    ON CONFLICT(identifier_hash) DO UPDATE SET
      request_count = CASE
        WHEN public_wedding_request_limits.blocked_until > ? THEN public_wedding_request_limits.request_count
        WHEN (public_wedding_request_limits.blocked_until IS NOT NULL AND public_wedding_request_limits.blocked_until <= ?)
          OR public_wedding_request_limits.window_started_at <= ? THEN 1
        ELSE public_wedding_request_limits.request_count + 1
      END,
      window_started_at = CASE
        WHEN public_wedding_request_limits.blocked_until > ? THEN public_wedding_request_limits.window_started_at
        WHEN (public_wedding_request_limits.blocked_until IS NOT NULL AND public_wedding_request_limits.blocked_until <= ?)
          OR public_wedding_request_limits.window_started_at <= ? THEN excluded.window_started_at
        ELSE public_wedding_request_limits.window_started_at
      END,
      blocked_until = CASE
        WHEN public_wedding_request_limits.blocked_until > ? THEN public_wedding_request_limits.blocked_until
        WHEN (public_wedding_request_limits.blocked_until IS NOT NULL AND public_wedding_request_limits.blocked_until <= ?)
          OR public_wedding_request_limits.window_started_at <= ? THEN NULL
        WHEN public_wedding_request_limits.request_count + 1 > ? THEN ?
        ELSE NULL
      END
    RETURNING request_count, blocked_until
  `).bind(identifierHash, weddingId, now, now, now, now - windowSeconds, now, now, now - windowSeconds, now, now, now - windowSeconds, maximumRequests, now + windowSeconds).first()
  return { allowed: !(current?.blocked_until > now), retryAfter: current?.blocked_until > now ? current.blocked_until - now : 0 }
}

async function invitationGuest(context) {
  const authorization = context.req.header('Authorization') || ''
  const match = authorization.match(/^Bearer ([A-Za-z0-9_-]{40,60})$/)
  if (!match) return null
  return context.env.DB.prepare(`
    SELECT g.id, g.wedding_id, g.group_id, g.name, g.party_size, g.guest_type, g.source, g.photo_consent_at,
      CASE WHEN w.site_published_at IS NULL THEN w.partner_one_name ELSE w.published_partner_one_name END AS partner_one_name,
      CASE WHEN w.site_published_at IS NULL THEN w.partner_two_name ELSE w.published_partner_two_name END AS partner_two_name,
      CASE WHEN w.site_published_at IS NULL THEN w.event_date ELSE w.published_event_date END AS event_date,
      CASE WHEN w.site_published_at IS NULL THEN w.event_time ELSE w.published_event_time END AS event_time,
      w.timezone, w.status AS wedding_status,
      w.published_site_config_json, w.published_events_json
    FROM guests g JOIN weddings w ON w.id = g.wedding_id
    WHERE g.access_token_hash = ? AND g.deleted_at IS NULL AND w.status = 'active'
  `).bind(await tokenHash(match[1])).first()
}

function walletReady(env, provider) {
  if (provider === 'google') return Boolean(env.GOOGLE_WALLET_ISSUER_ID && env.GOOGLE_WALLET_CLASS_ID && env.GOOGLE_WALLET_SERVICE_ACCOUNT_EMAIL && env.GOOGLE_WALLET_PRIVATE_KEY)
  return Boolean(env.APPLE_WALLET_PASS_TYPE_IDENTIFIER && env.APPLE_WALLET_TEAM_IDENTIFIER && env.APPLE_WALLET_SIGNER_CERTIFICATE && env.APPLE_WALLET_PRIVATE_KEY_PKCS8 && env.APPLE_WALLET_WWDR_CERTIFICATE)
}

async function invitationEvents(context, guest) {
  const [eventsRow, authorizations] = await Promise.all([
    context.env.DB.prepare('SELECT published_events_json FROM weddings WHERE id = ? AND status = \'active\'').bind(guest.wedding_id).first(),
    context.env.DB.prepare('SELECT event_id, status FROM guest_event_authorizations WHERE wedding_id = ? AND guest_id = ?').bind(guest.wedding_id, guest.id).all(),
  ])
  const events = JSON.parse(eventsRow?.published_events_json || '[]')
  const statuses = new Map(authorizations.results.map((item) => [item.event_id, item.status]))
  return events.filter((event) => statuses.get(event.id) !== 'revoked' && (statuses.get(event.id) === 'authorized' || !event.group_ids.length || event.group_ids.includes(guest.group_id)))
}

function base64Url(value) {
  const bytes = typeof value === 'string' ? new TextEncoder().encode(value) : value
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
}

function pemBytes(pem) {
  return Uint8Array.from(atob(pem.replace(/-----[^-]+-----/g, '').replace(/\s/g, '')), (character) => character.charCodeAt(0))
}

async function googleWalletUrl(env, guest, wedding, token, events) {
  const issuerId = env.GOOGLE_WALLET_ISSUER_ID.trim()
  const classId = env.GOOGLE_WALLET_CLASS_ID.trim()
  const objectSuffix = `${wedding.id}-${guest.id}`.replace(/[^A-Za-z0-9._-]/g, '-').slice(0, 64)
  const payload = {
    iss: env.GOOGLE_WALLET_SERVICE_ACCOUNT_EMAIL.trim(),
    aud: 'google',
    typ: 'savetowallet',
    iat: Math.floor(Date.now() / 1000),
    origins: [],
    payload: {
      genericObjects: [{
        id: `${issuerId}.${objectSuffix}`,
        classId,
        state: 'ACTIVE',
        cardTitle: { defaultValue: { language: 'pt-BR', value: `${wedding.partner_one_name} & ${wedding.partner_two_name}` } },
        header: { defaultValue: { language: 'pt-BR', value: 'Convite de casamento' } },
        subheader: { defaultValue: { language: 'pt-BR', value: guest.name } },
        textModulesData: [
          { id: 'data', header: 'Data', body: wedding.event_date || 'Consulte o convite' },
          { id: 'eventos', header: 'Eventos', body: events.slice(0, 3).map((event) => event.name).join(' · ') || 'Consulte o convite' },
        ],
        barcode: { type: 'QR_CODE', value: token, alternateText: 'Convite individual' },
        hexBackgroundColor: '#405849',
      }],
    },
  }
  const header = base64Url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
  const body = base64Url(JSON.stringify(payload))
  const signingInput = `${header}.${body}`
  const privateKey = env.GOOGLE_WALLET_PRIVATE_KEY.replace(/\\n/g, '\n')
  const key = await crypto.subtle.importKey('pkcs8', pemBytes(privateKey), { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign'])
  const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(signingInput))
  return `https://pay.google.com/gp/v/save/${signingInput}.${base64Url(new Uint8Array(signature))}`
}

function walletIconPng() {
  const width = 128
  const height = 128
  const pixels = new Uint8Array(width * height * 4)
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = (y * width + x) * 4
      const dx = x - width / 2
      const dy = y - height / 2
      const radius = Math.hypot(dx, dy)
      const heartX = Math.abs(dx) / 24
      const heartY = dy / 23
      const heart = (heartX * heartX + heartY * heartY - 1) ** 3 - heartX * heartX * heartY ** 3 <= 0
      const insideCircle = radius < 55
      const color = heart && insideCircle ? [255, 253, 249] : [64, 88, 73]
      pixels.set([...color, 255], index)
    }
  }
  const rows = new Uint8Array(height * (width * 4 + 1))
  for (let y = 0; y < height; y += 1) rows.set(pixels.subarray(y * width * 4, (y + 1) * width * 4), y * (width * 4 + 1) + 1)
  const checksum = (bytes) => {
    let crc = 0xffffffff
    for (const byte of bytes) {
      crc ^= byte
      for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0)
    }
    return (crc ^ 0xffffffff) >>> 0
  }
  const chunk = (name, data) => {
    const type = new TextEncoder().encode(name)
    const output = new Uint8Array(data.length + 12)
    const view = new DataView(output.buffer)
    view.setUint32(0, data.length)
    output.set(type, 4)
    output.set(data, 8)
    view.setUint32(output.length - 4, checksum(output.subarray(4, output.length - 4)))
    return output
  }
  const header = new Uint8Array(13)
  new DataView(header.buffer).setUint32(0, width)
  new DataView(header.buffer).setUint32(4, height)
  header.set([8, 6, 0, 0, 0], 8)
  const chunks = [new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', header), chunk('IDAT', zlibSync(rows, { level: 6 })), chunk('IEND', new Uint8Array())]
  const result = new Uint8Array(chunks.reduce((sum, item) => sum + item.length, 0))
  let offset = 0
  for (const item of chunks) { result.set(item, offset); offset += item.length }
  return result
}

async function appleWalletPass(env, guest, wedding, token, events) {
  const pass = {
    formatVersion: 1,
    passTypeIdentifier: env.APPLE_WALLET_PASS_TYPE_IDENTIFIER.trim(),
    serialNumber: `${wedding.id}-${guest.id}`,
    teamIdentifier: env.APPLE_WALLET_TEAM_IDENTIFIER.trim(),
    organizationName: `${wedding.partner_one_name} & ${wedding.partner_two_name}`,
    description: 'Convite individual de casamento',
    logoText: `${wedding.partner_one_name} & ${wedding.partner_two_name}`,
    foregroundColor: 'rgb(255, 253, 249)',
    backgroundColor: 'rgb(64, 88, 73)',
    labelColor: 'rgb(224, 193, 159)',
    eventTicket: {
      primaryFields: [{ key: 'casal', label: 'CASAMENTO', value: `${wedding.partner_one_name} & ${wedding.partner_two_name}` }],
      secondaryFields: [{ key: 'convidado', label: 'CONVIDADO', value: guest.name }],
      auxiliaryFields: [{ key: 'data', label: 'DATA', value: wedding.event_date || 'Consulte o convite' }],
      backFields: events.slice(0, 6).map((event, index) => ({ key: `evento-${index}`, label: event.name, value: [event.event_date, event.start_time, event.venue_name].filter(Boolean).join(' · ') || 'Consulte os detalhes no convite' })),
    },
    barcodes: [{ format: 'PKBarcodeFormatQR', message: token, messageEncoding: 'iso-8859-1', altText: 'Convite individual' }],
  }
  const files = {
    'pass.json': new TextEncoder().encode(JSON.stringify(pass)),
    'icon.png': walletIconPng(),
  }
  const manifest = {}
  for (const [name, bytes] of Object.entries(files)) manifest[name] = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-1', bytes)), (byte) => byte.toString(16).padStart(2, '0')).join('')
  const manifestJson = JSON.stringify(manifest)
  files['manifest.json'] = new TextEncoder().encode(manifestJson)
  files.signature = await createOpenSslCompatiblePkcs7Signature({ manifest: manifestJson, signerCertPem: env.APPLE_WALLET_SIGNER_CERTIFICATE, privateKeyPkcs8Pem: env.APPLE_WALLET_PRIVATE_KEY_PKCS8, wwdrPem: env.APPLE_WALLET_WWDR_CERTIFICATE })
  return zipSync(files, { level: 6 })
}

async function guestCanAccessEvent(context, guest, eventId) {
  const row = await context.env.DB.prepare('SELECT published_events_json FROM weddings WHERE id = ? AND status = \'active\'').bind(guest.wedding_id).first()
  const events = JSON.parse(row?.published_events_json || '[]')
  const event = events.find((item) => item.id === eventId)
  if (!event) return null
  const authorization = await context.env.DB.prepare('SELECT status FROM guest_event_authorizations WHERE wedding_id = ? AND event_id = ? AND guest_id = ?')
    .bind(guest.wedding_id, eventId, guest.id).first()
  if (authorization?.status === 'revoked') return null
  if (authorization?.status === 'authorized') return event
  const groups = Array.isArray(event.group_ids) ? event.group_ids : JSON.parse(event.group_ids_json || '[]')
  return !groups.length || groups.includes(guest.group_id) ? event : null
}

async function guestAttendanceStatus(context, weddingId, eventId, guestId) {
  return context.env.DB.prepare(`SELECT COALESCE(r.status, g.rsvp_status) AS rsvp_status
    FROM guests g LEFT JOIN guest_rsvps r ON r.guest_id = g.id AND r.event_id = ?
    WHERE g.id = ? AND g.wedding_id = ? AND g.deleted_at IS NULL`).bind(eventId, guestId, weddingId).first()
}

async function publicWeddingBySlug(context, slug) {
  return context.env.DB.prepare(`SELECT id, slug, published_partner_one_name AS partner_one_name,
    published_partner_two_name AS partner_two_name, published_event_date AS event_date,
    published_event_time AS event_time, timezone, published_site_config_json, published_events_json,
    site_published_at FROM weddings WHERE slug = ? COLLATE NOCASE AND status = 'active' AND site_published_at IS NOT NULL`)
    .bind(slug).first()
}

function publicWeddingEvents(wedding) {
  return JSON.parse(wedding.published_events_json || '[]').filter((event) => {
    const groups = Array.isArray(event.group_ids) ? event.group_ids : JSON.parse(event.group_ids_json || '[]')
    return groups.length === 0
  }).map((event) => {
    const result = { ...event }
    delete result.group_ids
    delete result.group_ids_json
    return result
  })
}

async function assignedStaff(context, eventId, roles) {
  const placeholders = roles.map(() => '?').join(', ')
  return context.env.DB.prepare(`
    SELECT e.id AS event_id, e.wedding_id, m.id AS membership_id, m.role
    FROM events e JOIN wedding_memberships m ON m.wedding_id = e.wedding_id
    JOIN weddings w ON w.id = e.wedding_id
    JOIN membership_event_access a ON a.event_id = e.id AND a.membership_id = m.id
    WHERE e.id = ? AND m.account_id = ? AND m.status = 'active'
      AND w.status = 'active' AND m.role IN (${placeholders})
  `).bind(eventId, context.get('session').account_id, ...roles).first()
}

async function staffCanSeeGuest(context, eventId, weddingId, guestId) {
  return context.env.DB.prepare(`
    SELECT g.id, COALESCE(r.status, g.rsvp_status) AS rsvp_status FROM guests g
    LEFT JOIN guest_rsvps r ON r.guest_id = g.id AND r.event_id = ?
    WHERE g.id = ? AND g.wedding_id = ? AND g.deleted_at IS NULL
      AND NOT EXISTS (SELECT 1 FROM guest_event_authorizations x WHERE x.event_id = ? AND x.guest_id = g.id AND x.status = 'revoked')
      AND (EXISTS (SELECT 1 FROM guest_event_authorizations x WHERE x.event_id = ? AND x.guest_id = g.id AND x.status = 'authorized')
        OR NOT EXISTS (SELECT 1 FROM event_group_access x WHERE x.event_id = ?)
        OR EXISTS (SELECT 1 FROM event_group_access x WHERE x.event_id = ? AND x.group_id = g.group_id))
      AND (g.source != 'companion' OR EXISTS (
        SELECT 1 FROM guest_companion_requests c
        LEFT JOIN guest_rsvp_requests pr ON pr.id = c.rsvp_request_id AND pr.wedding_id = c.wedding_id
        JOIN guests h ON h.id = COALESCE(c.host_guest_id, pr.guest_id) AND h.wedding_id = c.wedding_id
        LEFT JOIN guest_rsvps hr ON hr.guest_id = h.id AND hr.event_id = c.event_id
        WHERE c.guest_id = g.id AND c.event_id = ? AND c.status = 'approved'
          AND (c.host_guest_id IS NOT NULL OR pr.review_status = 'approved') AND COALESCE(hr.status, h.rsvp_status) = 'confirmed'
      ))
  `).bind(eventId, guestId, weddingId, eventId, eventId, eventId, eventId, eventId).first()
}

app.use('/api/*', async (context, next) => {
  context.header('Cache-Control', 'no-store')
  context.header('X-Content-Type-Options', 'nosniff')
  if (!['GET', 'HEAD', 'OPTIONS'].includes(context.req.method) && !validOrigin(context)) return jsonError(context, 403, 'invalid_origin')
  await next()
})

app.post('/api/auth/couple-signup', async (context) => {
  const body = await context.req.json().catch(() => null)
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''
  const password = typeof body?.password === 'string' ? body.password : ''
  const eventDate = body?.eventDate || null
  const eventTime = body?.eventTime || null
  const parsedEventDate = typeof eventDate === 'string' ? new Date(`${eventDate}T00:00:00.000Z`) : null
  const dateIsValid = eventDate === null || (typeof eventDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(eventDate)
    && Number.isFinite(parsedEventDate?.getTime()) && parsedEventDate.toISOString().slice(0, 10) === eventDate)
  const timeIsValid = eventTime === null || (typeof eventTime === 'string' && /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(eventTime))
  if (!body || !/^\S+@\S+\.\S+$/.test(email) || email.length > 254 || password.length < 12 || password.length > 1024
    || !dateIsValid || !timeIsValid) return jsonError(context, 400, 'invalid_signup')
  if (!configuredEmailProvider(context.env)) return jsonError(context, 503, 'email_service_unconfigured')
  if (!await allowCoupleSignup(context)) return context.json({ error: 'too_many_attempts' }, 429, { 'Retry-After': '3600' })
  const challenge = await verifyTurnstile(context, body.turnstileToken)
  if (!challenge.configured) return jsonError(context, 503, 'turnstile_unavailable')
  if (!challenge.verified) return jsonError(context, 403, 'turnstile_verification_failed')
  const accountId = crypto.randomUUID()
  const weddingId = crypto.randomUUID()
  const membershipId = crypto.randomUUID()
  const challengeId = crypto.randomUUID()
  const slug = `rascunho-${weddingId.slice(0, 8)}`
  const token = encodeToken(crypto.getRandomValues(new Uint8Array(32)))
  const challengeHash = await tokenHash(token)
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
  const passwordHash = await hashPassword(password)
  try {
    await context.env.DB.batch([
      context.env.DB.prepare(`INSERT INTO accounts (id, email, password_hash, status)
        VALUES (?, ?, ?, 'pending')`).bind(accountId, email, passwordHash),
      context.env.DB.prepare(`INSERT INTO weddings (id, slug, owner_account_id, event_date, event_time, timezone, status, site_config_json)
        VALUES (?, ?, ?, ?, ?, 'America/Sao_Paulo', 'draft', ?)`).bind(weddingId, slug, accountId, eventDate, eventTime, JSON.stringify(defaultSiteConfig)),
      context.env.DB.prepare(`INSERT INTO wedding_memberships (id, wedding_id, account_id, role, status)
        VALUES (?, ?, ?, 'couple_admin', 'pending')`).bind(membershipId, weddingId, accountId),
      context.env.DB.prepare(`INSERT INTO auth_challenges (id, account_id, purpose, token_hash, expires_at, membership_id)
        VALUES (?, ?, 'email_verification', ?, ?, ?)`).bind(challengeId, accountId, challengeHash, expiresAt, membershipId),
    ])
  } catch {
    return jsonError(context, 409, 'email_unavailable')
  }
  let sent = false
  try {
    sent = await sendAccountVerification(context, email, token)
  } catch {
    sent = false
  }
  if (!sent) {
    await context.env.DB.batch([
      context.env.DB.prepare('DELETE FROM auth_challenges WHERE id = ?').bind(challengeId),
      context.env.DB.prepare('DELETE FROM wedding_memberships WHERE id = ?').bind(membershipId),
      context.env.DB.prepare('DELETE FROM weddings WHERE id = ?').bind(weddingId),
      context.env.DB.prepare('DELETE FROM accounts WHERE id = ? AND status = \'pending\'').bind(accountId),
    ])
    return jsonError(context, 503, 'verification_email_failed')
  }
  await context.env.DB.prepare(`INSERT INTO audit_logs (id, actor_account_id, wedding_id, action, target_type, target_id, details_json)
    VALUES (?, ?, ?, 'couple_signup_created', 'account', ?, '{}')`).bind(crypto.randomUUID(), accountId, weddingId, accountId).run()
  return context.json({ status: 'pending_email_verification' }, 201)
})

app.post('/api/auth/verify-couple-email', async (context) => {
  const body = await context.req.json().catch(() => null)
  const token = typeof body?.token === 'string' ? body.token : ''
  if (!/^[A-Za-z0-9_-]{40,60}$/.test(token)) return jsonError(context, 400, 'invalid_verification')
  const challengeHash = await tokenHash(token)
  const challenge = await context.env.DB.prepare(`
    SELECT a.id AS account_id, a.email, w.id AS wedding_id, m.id AS membership_id
    FROM auth_challenges c JOIN accounts a ON a.id = c.account_id
    JOIN wedding_memberships m ON m.id = c.membership_id AND m.account_id = a.id AND m.status = 'pending' AND m.role = 'couple_admin'
    JOIN weddings w ON w.id = m.wedding_id AND w.owner_account_id = a.id AND w.status = 'draft'
    WHERE c.token_hash = ? AND c.purpose = 'email_verification' AND c.consumed_at IS NULL AND c.expires_at > CURRENT_TIMESTAMP AND a.status = 'pending'
  `).bind(challengeHash).first()
  if (!challenge) return jsonError(context, 400, 'verification_expired_or_used')
  const verifiedAt = new Date().toISOString()
  const results = await context.env.DB.batch([
    context.env.DB.prepare(`UPDATE auth_challenges SET consumed_at = CURRENT_TIMESTAMP
      WHERE token_hash = ? AND purpose = 'email_verification' AND consumed_at IS NULL AND expires_at > CURRENT_TIMESTAMP`).bind(challengeHash),
    context.env.DB.prepare(`UPDATE accounts SET status = 'active', email_verified_at = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND status = 'pending'`).bind(verifiedAt, challenge.account_id),
    context.env.DB.prepare(`UPDATE wedding_memberships SET status = 'active'
      WHERE id = ? AND account_id = ? AND status = 'pending'`).bind(challenge.membership_id, challenge.account_id),
    context.env.DB.prepare(`INSERT INTO audit_logs (id, actor_account_id, wedding_id, action, target_type, target_id, details_json)
      VALUES (?, ?, ?, 'couple_email_verified', 'account', ?, '{}')`).bind(crypto.randomUUID(), challenge.account_id, challenge.wedding_id, challenge.account_id),
  ])
  if (results[0].meta.changes !== 1 || results[1].meta.changes !== 1 || results[2].meta.changes !== 1) return jsonError(context, 400, 'verification_expired_or_used')
  const session = await createSession(context, challenge.account_id, true)
  return context.json({ account: { id: challenge.account_id, email: challenge.email }, expiresAt: session.expiresAt }, 201)
})

app.post('/api/auth/password-reset/request', async (context) => {
  const body = await context.req.json().catch(() => null)
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''
  if (!/^\S+@\S+\.\S+$/.test(email) || email.length > 254) return jsonError(context, 400, 'invalid_email')
  const challenge = await verifyTurnstile(context, body.turnstileToken)
  if (!challenge.configured) return jsonError(context, 503, 'turnstile_unavailable')
  if (!challenge.verified) return jsonError(context, 403, 'turnstile_verification_failed')
  if (!configuredEmailProvider(context.env)) return jsonError(context, 503, 'email_service_unconfigured')
  if (!await allowPasswordReset(context, email)) return context.json({ requested: true }, 202)
  const account = await context.env.DB.prepare(`SELECT id, email FROM accounts
    WHERE email = ? COLLATE NOCASE AND status = 'active' AND email_verified_at IS NOT NULL`).bind(email).first()
  if (!account) return context.json({ requested: true }, 202)
  const token = encodeToken(crypto.getRandomValues(new Uint8Array(32)))
  const tokenDigest = await tokenHash(token)
  const challengeId = crypto.randomUUID()
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString()
  await context.env.DB.batch([
    context.env.DB.prepare(`UPDATE auth_challenges SET consumed_at = CURRENT_TIMESTAMP
      WHERE account_id = ? AND purpose = 'password_reset' AND consumed_at IS NULL`).bind(account.id),
    context.env.DB.prepare(`INSERT INTO auth_challenges (id, account_id, purpose, token_hash, expires_at)
      VALUES (?, ?, 'password_reset', ?, ?)`).bind(challengeId, account.id, tokenDigest, expiresAt),
  ])
  let sent = false
  try {
    sent = await sendPasswordReset(context, account.email, token)
  } catch {
    sent = false
  }
  if (!sent) await context.env.DB.prepare('DELETE FROM auth_challenges WHERE id = ? AND consumed_at IS NULL').bind(challengeId).run()
  return context.json({ requested: true }, 202)
})

app.post('/api/auth/password-reset/confirm', async (context) => {
  const body = await context.req.json().catch(() => null)
  const token = typeof body?.token === 'string' ? body.token : ''
  const password = typeof body?.password === 'string' ? body.password : ''
  if (!/^[A-Za-z0-9_-]{40,60}$/.test(token) || password.length < 12 || password.length > 1024) return jsonError(context, 400, 'invalid_password_reset')
  const tokenDigest = await tokenHash(token)
  const challenge = await context.env.DB.prepare(`SELECT a.id, a.email FROM auth_challenges c
    JOIN accounts a ON a.id = c.account_id
    WHERE c.token_hash = ? AND c.purpose = 'password_reset' AND c.consumed_at IS NULL
      AND c.expires_at > CURRENT_TIMESTAMP AND a.status = 'active' AND a.email_verified_at IS NOT NULL`).bind(tokenDigest).first()
  if (!challenge) return jsonError(context, 400, 'password_reset_expired_or_used')
  const passwordHash = await hashPassword(password)
  const resetAt = new Date().toISOString()
  const results = await context.env.DB.batch([
    context.env.DB.prepare(`UPDATE auth_challenges SET consumed_at = ?
      WHERE token_hash = ? AND purpose = 'password_reset' AND consumed_at IS NULL AND expires_at > CURRENT_TIMESTAMP`).bind(resetAt, tokenDigest),
    context.env.DB.prepare(`UPDATE accounts SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND status = 'active'
      AND EXISTS (SELECT 1 FROM auth_challenges WHERE token_hash = ? AND purpose = 'password_reset' AND consumed_at = ?)`).bind(passwordHash, challenge.id, tokenDigest, resetAt),
    context.env.DB.prepare(`UPDATE auth_sessions SET revoked_at = ? WHERE account_id = ? AND revoked_at IS NULL
      AND EXISTS (SELECT 1 FROM auth_challenges WHERE token_hash = ? AND purpose = 'password_reset' AND consumed_at = ?)`).bind(resetAt, challenge.id, tokenDigest, resetAt),
    context.env.DB.prepare(`INSERT INTO audit_logs (id, actor_account_id, action, target_type, target_id, details_json)
      SELECT ?, ?, 'account_password_reset', 'account', ?, '{}'
      WHERE EXISTS (SELECT 1 FROM auth_challenges WHERE token_hash = ? AND purpose = 'password_reset' AND consumed_at = ?)`).bind(crypto.randomUUID(), challenge.id, challenge.id, tokenDigest, resetAt),
  ])
  if (results[0].meta.changes !== 1 || results[1].meta.changes !== 1) return jsonError(context, 400, 'password_reset_expired_or_used')
  return context.json({ email: challenge.email, passwordReset: true })
})

app.post('/api/auth/login', async (context) => {
  let body
  try {
    body = await context.req.json()
  } catch {
    return jsonError(context, 400, 'invalid_request')
  }
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  const password = typeof body.password === 'string' ? body.password : ''
  const code = typeof body.code === 'string' ? body.code.trim() : ''
  if (!email || email.length > 254 || password.length < 1 || password.length > 1024) return jsonError(context, 400, 'invalid_request')

  const retryAfter = await checkLoginLimit(context, email)
  if (retryAfter) return context.json({ error: 'too_many_attempts' }, 429, { 'Retry-After': String(retryAfter), 'Cache-Control': 'no-store' })

  const challenge = await verifyTurnstile(context, body.turnstileToken)
  if (!challenge.configured) return jsonError(context, 503, 'turnstile_unavailable')
  if (!challenge.verified) return jsonError(context, 403, 'turnstile_verification_failed')

  const result = await authenticate(context, email, password, code)
  if (result.error === 'mfa_setup_required') {
    await clearLoginFailures(context, email)
    const session = await createSession(context, result.accountId, false)
    return context.json({ account: { id: result.accountId, email: result.email, isSuperadmin: result.isSuperadmin }, expiresAt: session.expiresAt, mfaSetupRequired: true })
  }
  if (result.error === 'invalid_credentials') {
    const limit = await recordLoginFailure(context, email)
    if (limit.blocked) return context.json({ error: 'too_many_attempts' }, 429, { 'Retry-After': String(limit.retryAfter), 'Cache-Control': 'no-store' })
    return jsonError(context, 401, 'invalid_credentials')
  }
  if (result.error === 'mfa_unavailable') return jsonError(context, 503, 'mfa_unavailable')

  await clearLoginFailures(context, email)
  const session = await createSession(context, result.accountId, result.mfaVerified)
  return context.json({ account: { id: result.accountId, email: result.email, isSuperadmin: result.isSuperadmin }, expiresAt: session.expiresAt })
})

app.post('/api/auth/mfa/enroll', requireSession, requireSuperadminIdentity, async (context) => {
  const session = context.get('session')
  if (!session.is_superadmin) return jsonError(context, 404, 'not_found')
  if (session.mfa_verified_at) return jsonError(context, 409, 'mfa_already_enabled')
  try {
    const enrollment = await startTotpEnrollment(context, session.account_id, session.email)
    if (!enrollment) return jsonError(context, 409, 'mfa_already_enabled')
    return context.json(enrollment)
  } catch {
    return jsonError(context, 503, 'mfa_setup_unavailable')
  }
})

app.post('/api/auth/mfa/confirm', requireSession, requireSuperadminIdentity, async (context) => {
  const session = context.get('session')
  if (!session.is_superadmin) return jsonError(context, 404, 'not_found')
  if (session.mfa_verified_at) return jsonError(context, 409, 'mfa_already_enabled')
  const body = await context.req.json().catch(() => null)
  if (!body || typeof body.code !== 'string') return jsonError(context, 400, 'invalid_request')
  const retryAfter = await checkLoginLimit(context, session.email)
  if (retryAfter) return context.json({ error: 'too_many_attempts' }, 429, { 'Retry-After': String(retryAfter), 'Cache-Control': 'no-store' })
  const enabled = await confirmTotpEnrollment(context, session.account_id, body.code)
  if (!enabled) {
    const limit = await recordLoginFailure(context, session.email)
    if (limit.blocked) return context.json({ error: 'too_many_attempts' }, 429, { 'Retry-After': String(limit.retryAfter), 'Cache-Control': 'no-store' })
    return jsonError(context, 400, 'invalid_mfa_code')
  }
  await clearLoginFailures(context, session.email)
  const now = new Date().toISOString()
  await context.env.DB.batch([
    context.env.DB.prepare('UPDATE auth_sessions SET mfa_verified_at = ? WHERE id = ? AND revoked_at IS NULL').bind(now, session.id),
    context.env.DB.prepare('UPDATE auth_sessions SET revoked_at = ? WHERE account_id = ? AND id != ? AND revoked_at IS NULL').bind(now, session.account_id, session.id),
    context.env.DB.prepare(`INSERT INTO audit_logs (id, actor_account_id, action, target_type, target_id, details_json)
      VALUES (?, ?, 'account_mfa_enabled', 'account', ?, '{}')`).bind(crypto.randomUUID(), session.account_id, session.account_id),
  ])
  return context.json({ mfaEnabled: true })
})

app.post('/api/auth/mfa/reauth', requireSession, requireSuperadminIdentity, async (context) => {
  const session = context.get('session')
  if (!session.is_superadmin) return jsonError(context, 404, 'not_found')
  const body = await context.req.json().catch(() => null)
  if (!body || typeof body.code !== 'string' || !/^\d{6}$/.test(body.code)) return jsonError(context, 400, 'invalid_mfa_code')
  const retryAfter = await checkLoginLimit(context, session.email)
  if (retryAfter) return context.json({ error: 'too_many_attempts' }, 429, { 'Retry-After': String(retryAfter), 'Cache-Control': 'no-store' })
  const verified = await verifyRecentTotp(context, session.account_id, body.code)
  if (!verified) {
    const limit = await recordLoginFailure(context, session.email)
    if (limit.blocked) return context.json({ error: 'too_many_attempts' }, 429, { 'Retry-After': String(limit.retryAfter), 'Cache-Control': 'no-store' })
    return jsonError(context, 403, 'invalid_mfa_code')
  }
  await clearLoginFailures(context, session.email)
  const verifiedAt = new Date().toISOString()
  await context.env.DB.batch([
    context.env.DB.prepare('UPDATE auth_sessions SET mfa_verified_at = ? WHERE id = ? AND revoked_at IS NULL').bind(verifiedAt, session.id),
    context.env.DB.prepare(`INSERT INTO audit_logs (id, actor_account_id, action, target_type, target_id, details_json)
      VALUES (?, ?, 'account_mfa_reauthenticated', 'account', ?, '{}')`).bind(crypto.randomUUID(), session.account_id, session.account_id),
  ])
  return context.json({ mfaVerified: true, verifiedAt })
})

app.post('/api/auth/team-invitation-preview', async (context) => {
  const body = await context.req.json().catch(() => null)
  const token = typeof body?.token === 'string' ? body.token : ''
  if (!/^[A-Za-z0-9_-]{40,60}$/.test(token)) return jsonError(context, 400, 'invalid_invitation')
  const invitation = await context.env.DB.prepare(`
    SELECT a.email, a.status, m.role FROM auth_challenges c
    JOIN accounts a ON a.id = c.account_id
    JOIN wedding_memberships m ON m.id = c.membership_id AND m.account_id = a.id AND m.status = 'pending'
    JOIN weddings w ON w.id = m.wedding_id
    WHERE c.token_hash = ? AND c.purpose = 'email_verification' AND c.consumed_at IS NULL
      AND c.expires_at > CURRENT_TIMESTAMP AND w.status IN ('draft', 'active')
  `).bind(await tokenHash(token)).first()
  if (!invitation || !['pending', 'active'].includes(invitation.status)) return jsonError(context, 404, 'invitation_expired_or_used')
  return context.json({ email: invitation.email, role: invitation.role, requiresLogin: invitation.status === 'active' })
})

app.post('/api/auth/accept-team-invitation', async (context) => {
  const body = await context.req.json().catch(() => null)
  const token = typeof body?.token === 'string' ? body.token : ''
  const password = typeof body?.password === 'string' ? body.password : ''
  if (!/^[A-Za-z0-9_-]{40,60}$/.test(token)) return jsonError(context, 400, 'invalid_invitation')
  const tokenDigest = await tokenHash(token)
  const invitation = await context.env.DB.prepare(`
    SELECT a.id, a.email, a.status, m.id AS membership_id, m.wedding_id, m.role
    FROM auth_challenges c JOIN accounts a ON a.id = c.account_id
    JOIN wedding_memberships m ON m.id = c.membership_id AND m.account_id = a.id AND m.status = 'pending'
    JOIN weddings w ON w.id = m.wedding_id
    WHERE c.token_hash = ? AND c.purpose = 'email_verification' AND c.consumed_at IS NULL
      AND c.expires_at > CURRENT_TIMESTAMP AND w.status IN ('draft', 'active')
  `).bind(tokenDigest).first()
  if (!invitation) return jsonError(context, 400, 'invitation_expired_or_used')
  let session = null
  let passwordHash = null
  if (invitation.status === 'active') {
    session = await loadSession(context)
    if (!session) return jsonError(context, 401, 'invitation_login_required')
    if (session.account_id !== invitation.id) return jsonError(context, 403, 'invitation_account_mismatch')
  } else if (invitation.status === 'pending' && password.length >= 12 && password.length <= 1024) {
    passwordHash = await hashPassword(password)
  } else {
    return jsonError(context, 400, 'invalid_invitation_password')
  }
  const statements = [context.env.DB.prepare(`UPDATE auth_challenges SET consumed_at = CURRENT_TIMESTAMP
    WHERE token_hash = ? AND purpose = 'email_verification' AND consumed_at IS NULL AND expires_at > CURRENT_TIMESTAMP
      AND membership_id IS NOT NULL
      AND EXISTS (SELECT 1 FROM wedding_memberships m WHERE m.id = auth_challenges.membership_id AND m.account_id = auth_challenges.account_id AND m.status = 'pending')`).bind(tokenDigest)]
  if (passwordHash) statements.push(context.env.DB.prepare(`UPDATE accounts SET password_hash = ?, status = 'active', email_verified_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
    WHERE id = ? AND status = 'pending'`).bind(passwordHash, invitation.id))
  statements.push(context.env.DB.prepare(`UPDATE wedding_memberships SET status = 'active' WHERE id = ? AND status = 'pending'`).bind(invitation.membership_id))
  statements.push(context.env.DB.prepare(`INSERT INTO audit_logs (id, actor_account_id, wedding_id, action, target_type, target_id, details_json)
    VALUES (?, ?, ?, 'team_invitation_accepted', 'membership', ?, '{}')`).bind(crypto.randomUUID(), invitation.id, invitation.wedding_id, invitation.membership_id))
  const results = await context.env.DB.batch(statements)
  const membershipResult = results[passwordHash ? 2 : 1]
  if (results[0].meta.changes !== 1 || (passwordHash && results[1].meta.changes !== 1) || membershipResult.meta.changes !== 1) return jsonError(context, 400, 'invitation_expired_or_used')
  if (!session) {
    session = await createSession(context, invitation.id, true)
    return context.json({ account: { id: invitation.id, email: invitation.email }, role: invitation.role, expiresAt: session.expiresAt })
  }
  return context.json({ account: { id: invitation.id, email: invitation.email }, role: invitation.role, expiresAt: session.expires_at })
})

app.get('/api/auth/session', requireSession, async (context) => {
  const session = context.get('session')
  const sessionInfo = {
    account: { id: session.account_id, email: session.email },
    mfaVerified: !session.is_superadmin || Boolean(session.mfa_verified_at),
    mfaEnabled: Boolean(session.is_superadmin && session.mfa_enabled_at),
    mfaSetupRequired: Boolean(session.is_superadmin && !session.mfa_enabled_at),
    mfaReauthenticationRequired: Boolean(session.is_superadmin && session.mfa_enabled_at && !session.mfa_verified_at),
  }
  const admin = await context.env.DB.prepare("SELECT 1 AS allowed FROM platform_admins WHERE account_id = ? AND role = 'superadmin'").bind(session.account_id).first()
  if (session.is_superadmin && !session.mfa_verified_at) return context.json({ ...sessionInfo, roles: [], isSuperadmin: Boolean(admin) })
  const memberships = await context.env.DB.prepare(`
    SELECT m.wedding_id, m.role, m.status, w.slug
    FROM wedding_memberships m JOIN weddings w ON w.id = m.wedding_id
    WHERE m.account_id = ? AND m.status = 'active' AND w.status != 'deleted'
    ORDER BY w.created_at DESC
  `).bind(session.account_id).all()
  return context.json({ ...sessionInfo, roles: memberships.results.map((membership) => ({ weddingId: membership.wedding_id, slug: membership.slug, role: membership.role, status: membership.status })), isSuperadmin: Boolean(admin) })
})

app.post('/api/auth/logout', requireSession, async (context) => {
  const session = context.get('session')
  await context.env.DB.prepare('UPDATE auth_sessions SET revoked_at = CURRENT_TIMESTAMP WHERE id = ? AND revoked_at IS NULL').bind(session.id).run()
  clearCookie(context)
  return context.body(null, 204)
})

app.get('/api/superadmin/bootstrap/status', requireCloudflareAccess, async (context) => {
  if (!context.env.SUPERADMIN_EMAIL) return jsonError(context, 503, 'superadmin_email_unconfigured')
  const admin = await context.env.DB.prepare("SELECT 1 AS configured FROM platform_admins WHERE role = 'superadmin' LIMIT 1").first()
  return context.json({ available: !admin, email: context.env.SUPERADMIN_EMAIL })
})

app.post('/api/superadmin/bootstrap', requireCloudflareAccess, async (context) => {
  const configuredEmail = context.env.SUPERADMIN_EMAIL?.trim().toLowerCase()
  if (!configuredEmail) return jsonError(context, 503, 'superadmin_email_unconfigured')
  const body = await context.req.json().catch(() => null)
  const password = typeof body?.password === 'string' ? body.password : ''
  if (password.length < 14 || password.length > 1024) return jsonError(context, 400, 'invalid_bootstrap_password')
  const admin = await context.env.DB.prepare("SELECT 1 AS configured FROM platform_admins WHERE role = 'superadmin' LIMIT 1").first()
  if (admin) return jsonError(context, 409, 'superadmin_already_configured')
  const accountId = crypto.randomUUID()
  try {
    await context.env.DB.batch([
      context.env.DB.prepare(`INSERT INTO accounts (id, email, password_hash, status, email_verified_at)
        VALUES (?, ?, ?, 'active', CURRENT_TIMESTAMP)`).bind(accountId, configuredEmail, await hashPassword(password)),
      context.env.DB.prepare("INSERT INTO platform_admins (account_id, role, granted_by) VALUES (?, 'superadmin', ?)").bind(accountId, accountId),
      context.env.DB.prepare(`INSERT INTO audit_logs (id, actor_account_id, action, target_type, target_id, details_json)
        VALUES (?, ?, 'superadmin_bootstrapped', 'account', ?, '{}')`).bind(crypto.randomUUID(), accountId, accountId),
    ])
  } catch (error) {
    const existingAdmin = await context.env.DB.prepare("SELECT 1 AS configured FROM platform_admins WHERE role = 'superadmin' LIMIT 1").first()
    if (existingAdmin) return jsonError(context, 409, 'superadmin_already_configured')
    const existingAccount = await context.env.DB.prepare('SELECT 1 AS configured FROM accounts WHERE email = ? COLLATE NOCASE LIMIT 1').bind(configuredEmail).first()
    if (existingAccount) return jsonError(context, 409, 'superadmin_account_exists')
    console.error('superadmin_bootstrap_failed', String(error?.message || error).slice(0, 240))
    return jsonError(context, 500, 'superadmin_bootstrap_failed')
  }
  const session = await createSession(context, accountId, false)
  return context.json({ account: { id: accountId, email: configuredEmail, isSuperadmin: true }, expiresAt: session.expiresAt, mfaSetupRequired: true }, 201)
})

app.get('/api/couple/weddings', requireSession, async (context) => {
  const result = await context.env.DB.prepare(`
    SELECT w.id, w.slug, w.partner_one_name, w.partner_two_name, w.event_date, w.event_time, w.status, m.role
    FROM wedding_memberships m JOIN weddings w ON w.id = m.wedding_id
    WHERE m.account_id = ? AND m.status = 'active' AND m.role IN ('couple_admin', 'editor', 'reader') AND w.status != 'deleted'
    ORDER BY w.created_at DESC
  `).bind(context.get('session').account_id).all()
  return context.json({ weddings: result.results })
})

app.patch('/api/couple/weddings/:weddingId/profile', requireSession, async (context) => {
  const weddingId = context.req.param('weddingId')
  const membership = await weddingMembership(context, weddingId, ['couple_admin', 'editor'])
  if (!membership) return jsonError(context, 404, 'wedding_not_found')
  if (membership.wedding_status === 'suspended') return jsonError(context, 409, 'wedding_suspended')
  const body = await context.req.json().catch(() => null)
  const partnerOneName = typeof body?.partnerOneName === 'string' ? body.partnerOneName.trim() : ''
  const partnerTwoName = typeof body?.partnerTwoName === 'string' ? body.partnerTwoName.trim() : ''
  const eventDate = body?.eventDate || null
  const eventTime = body?.eventTime || null
  const parsedEventDate = typeof eventDate === 'string' ? new Date(`${eventDate}T00:00:00.000Z`) : null
  const dateIsValid = eventDate === null || (typeof eventDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(eventDate)
    && Number.isFinite(parsedEventDate?.getTime()) && parsedEventDate.toISOString().slice(0, 10) === eventDate)
  const timeIsValid = eventTime === null || (typeof eventTime === 'string' && /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(eventTime))
  if (!body || !partnerOneName || partnerOneName.length > 100 || !partnerTwoName || partnerTwoName.length > 100 || !dateIsValid || !timeIsValid) return jsonError(context, 400, 'invalid_wedding_profile')
  const wedding = await context.env.DB.prepare('SELECT slug, site_published_at FROM weddings WHERE id = ?').bind(weddingId).first()
  if (!wedding) return jsonError(context, 404, 'wedding_not_found')
  let slug = wedding.slug
  if (!wedding.site_published_at) {
    const base = `${partnerOneName}-${partnerTwoName}`.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 21).replace(/-$/g, '')
    const reserved = ['www', 'app', 'api', 'admin', 'painel', 'status', 'mail', 'superadmin', 'cadastro']
    slug = base.length >= 3 && !reserved.includes(base) ? base : `casal-${weddingId.slice(0, 8)}`
    const conflict = await context.env.DB.prepare('SELECT 1 AS found FROM weddings WHERE slug = ? COLLATE NOCASE AND id != ?').bind(slug, weddingId).first()
    if (conflict) slug = `${slug.slice(0, 20)}-${weddingId.slice(0, 8)}`
  }
  await context.env.DB.prepare(`UPDATE weddings SET partner_one_name = ?, partner_two_name = ?, event_date = ?, event_time = ?, slug = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`)
    .bind(partnerOneName, partnerTwoName, eventDate, eventTime, slug, weddingId).run()
  return context.json({ wedding: { id: weddingId, slug, partner_one_name: partnerOneName, partner_two_name: partnerTwoName, event_date: eventDate, event_time: eventTime } })
})

app.get('/api/couple/weddings/:weddingId/site-config', requireSession, async (context) => {
  const weddingId = context.req.param('weddingId')
  const membership = await weddingMembership(context, weddingId, ['couple_admin', 'editor'])
  if (!membership) return jsonError(context, 404, 'wedding_not_found')
  const wedding = await context.env.DB.prepare('SELECT site_config_json, published_site_config_json, site_published_at FROM weddings WHERE id = ?').bind(weddingId).first()
  const published = parseSiteConfig(wedding.published_site_config_json)
  return context.json({ draft: parseSiteConfig(wedding.site_config_json) || defaultSiteConfig, published, publishedAt: wedding.site_published_at })
})

app.get('/api/couple/weddings/:weddingId/site-media', requireSession, async (context) => {
  const weddingId = context.req.param('weddingId')
  if (!await weddingMembership(context, weddingId, ['couple_admin', 'editor'])) return jsonError(context, 404, 'wedding_not_found')
  const result = await context.env.GUEST_PHOTOS?.list({ prefix: `${weddingId}/site/`, limit: 100 })
  const media = (result?.objects || []).map((object) => {
    const match = object.key.match(/\/([0-9a-f-]{36})\.(jpg|png|webp|mp4)$/i)
    return match ? { id: match[1], mediaType: object.customMetadata?.mediaType || (match[2] === 'mp4' ? 'video' : 'image'), contentType: object.httpMetadata?.contentType || '', sizeBytes: object.size } : null
  }).filter(Boolean)
  return context.json({ media })
})

app.delete('/api/couple/weddings/:weddingId/site-media/:mediaId', requireSession, async (context) => {
  const weddingId = context.req.param('weddingId')
  const mediaId = context.req.param('mediaId')
  const membership = await weddingMembership(context, weddingId, ['couple_admin', 'editor'])
  if (!membership) return jsonError(context, 404, 'wedding_not_found')
  if (membership.wedding_status === 'suspended') return jsonError(context, 409, 'wedding_suspended')
  if (!/^[0-9a-f-]{36}$/i.test(mediaId)) return jsonError(context, 400, 'invalid_media_id')
  if (!context.env.GUEST_PHOTOS) return jsonError(context, 503, 'media_storage_unavailable')
  const configs = await context.env.DB.prepare('SELECT site_config_json, published_site_config_json FROM weddings WHERE id = ?').bind(weddingId).first()
  if (!configs) return jsonError(context, 404, 'wedding_not_found')
  const references = [
    ...siteMediaReferences(configs.site_config_json, mediaId).map((use) => `rascunho: ${use}`),
    ...siteMediaReferences(configs.published_site_config_json, mediaId).map((use) => `convite publicado: ${use}`),
  ]
  if (references.length) return context.json({ error: 'site_media_in_use', references }, 409, { 'Cache-Control': 'no-store' })
  let objectKey
  for (const extension of ['jpg', 'png', 'webp', 'mp4']) {
    const key = `${weddingId}/site/${mediaId}.${extension}`
    const object = await context.env.GUEST_PHOTOS.get(key)
    if (object?.customMetadata?.weddingId === weddingId) {
      objectKey = key
      break
    }
  }
  if (!objectKey) return jsonError(context, 404, 'media_not_found')
  await context.env.GUEST_PHOTOS.delete(objectKey)
  await context.env.DB.prepare(`INSERT INTO audit_logs (id, actor_account_id, wedding_id, action, target_type, target_id, details_json)
    VALUES (?, ?, ?, 'wedding_site_media_deleted', 'site_media', ?, '{}')`)
    .bind(crypto.randomUUID(), context.get('session').account_id, weddingId, mediaId).run()
  return context.json({ id: mediaId, deleted: true })
})

app.post('/api/couple/weddings/:weddingId/site-media', requireSession, async (context) => {
  const weddingId = context.req.param('weddingId')
  if (!await weddingMembership(context, weddingId, ['couple_admin', 'editor'])) return jsonError(context, 404, 'wedding_not_found')
  if (!context.env.GUEST_PHOTOS) return jsonError(context, 503, 'media_storage_unavailable')
  const body = await context.req.parseBody().catch(() => null)
  const file = body?.file
  const mediaType = body?.mediaType
  if (!['image', 'video'].includes(mediaType)) return jsonError(context, 400, 'unsupported_media_type')
  if (Number(context.req.header('Content-Length') || 0) > 16_000_000) return jsonError(context, 413, 'invalid_media_size')
  const maxBytes = mediaType === 'video' ? 15_728_640 : 8_388_608
  if (!(file instanceof File) || file.size < 1 || file.size > maxBytes) return jsonError(context, 413, 'invalid_media_size')
  if ((mediaType === 'image' && !['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) || (mediaType === 'video' && file.type !== 'video/mp4')) return jsonError(context, 400, 'unsupported_media_type')
  const current = await context.env.GUEST_PHOTOS.list({ prefix: `${weddingId}/site/`, limit: 100 })
  const media = current.objects.map((object) => object.customMetadata?.mediaType || (object.key.endsWith('.mp4') ? 'video' : 'image'))
  if (mediaType === 'image' && media.filter((type) => type === 'image').length >= SITE_MEDIA_LIMITS.photosPerWedding) return jsonError(context, 409, 'gallery_limit_reached')
  if (mediaType === 'video' && media.includes('video')) return jsonError(context, 409, 'video_limit_reached')
  const bytes = new Uint8Array(await file.arrayBuffer())
  const isMp4 = mediaType === 'video' && String.fromCharCode(...bytes.slice(4, 8)) === 'ftyp'
  const isImage = file.type === 'image/jpeg' ? bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255 : file.type === 'image/png' ? bytes[0] === 137 && bytes[1] === 80 && bytes[2] === 78 && bytes[3] === 71 : String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF' && String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP'
  if (!(mediaType === 'video' ? isMp4 : isImage)) return jsonError(context, 400, 'invalid_media_content')
  const id = crypto.randomUUID()
  const extension = file.type === 'image/jpeg' ? 'jpg' : file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'mp4'
  const objectKey = `${weddingId}/site/${id}.${extension}`
  try {
    await context.env.GUEST_PHOTOS.put(objectKey, bytes, { httpMetadata: { contentType: file.type, cacheControl: 'private, no-store' }, customMetadata: { weddingId, mediaType } })
  } catch (error) {
    console.error('site_media_save_failed', { weddingId, mediaType, error: error instanceof Error ? error.message : 'unknown' })
    return jsonError(context, 503, 'media_storage_write_failed')
  }
  return context.json({ id, mediaType, contentType: file.type, sizeBytes: file.size }, 201)
})

app.get('/api/site-media/:mediaId', async (context) => {
  const id = context.req.param('mediaId')
  const guest = await invitationGuest(context)
  const session = guest ? null : await loadSession(context)
  let weddingIds = guest ? [guest.wedding_id] : []
  if (!guest && session) {
    context.set('session', session)
    const weddings = await context.env.DB.prepare(`SELECT w.id FROM weddings w JOIN wedding_memberships m ON m.wedding_id = w.id
      WHERE m.account_id = ? AND m.status = 'active' AND m.role IN ('couple_admin', 'editor') AND w.status != 'deleted'`).bind(session.account_id).all()
    weddingIds = weddings.results.map((wedding) => wedding.id)
  }
  if (!weddingIds.length) return jsonError(context, guest ? 401 : 401, guest ? 'invitation_invalid' : 'authentication_required')
  let object
  for (const weddingId of weddingIds) {
    if (guest) {
      const config = parseSiteConfig(guest.published_site_config_json)
      if (config?.coverPhotoId !== id && !config?.coverGallery?.includes(id) && !config?.siteGallery?.includes(id) && config?.coverVideoId !== id
        && !config?.timeline?.some((item) => item.photoId === id) && !Object.values(config?.giftPresentation || {}).some((item) => item?.photoId === id)) continue
    }
    for (const extension of ['jpg', 'png', 'webp', 'mp4']) {
      object = await context.env.GUEST_PHOTOS?.get(`${weddingId}/site/${id}.${extension}`)
      if (object) break
    }
    if (object) break
  }
  if (!object) return jsonError(context, 404, 'media_not_found')
  context.header('Content-Type', object.httpMetadata?.contentType || 'application/octet-stream')
  context.header('Cache-Control', 'private, no-store')
  context.header('X-Content-Type-Options', 'nosniff')
  return context.body(object.body)
})
app.get('/api/couple/weddings/:weddingId/published', requireSession, async (context) => {
  const weddingId = context.req.param('weddingId')
  const membership = await weddingMembership(context, weddingId, ['reader'])
  if (!membership) return jsonError(context, 404, 'wedding_not_found')
  const wedding = await context.env.DB.prepare(`SELECT slug,
    CASE WHEN site_published_at IS NULL THEN partner_one_name ELSE published_partner_one_name END AS partner_one_name,
    CASE WHEN site_published_at IS NULL THEN partner_two_name ELSE published_partner_two_name END AS partner_two_name,
    CASE WHEN site_published_at IS NULL THEN event_date ELSE published_event_date END AS event_date,
    CASE WHEN site_published_at IS NULL THEN event_time ELSE published_event_time END AS event_time,
    published_site_config_json, published_events_json, site_published_at
    FROM weddings WHERE id = ?`).bind(weddingId).first()
  if (!wedding?.site_published_at) return jsonError(context, 404, 'published_site_not_found')
  return context.json({
    wedding: { slug: wedding.slug, partner_one_name: wedding.partner_one_name, partner_two_name: wedding.partner_two_name, event_date: wedding.event_date, event_time: wedding.event_time },
    siteConfig: publicSiteConfig(parseSiteConfig(wedding.published_site_config_json)),
    events: JSON.parse(wedding.published_events_json || '[]').filter((event) => !event.group_ids.length).map((event) => {
      const publicEvent = { ...event }
      delete publicEvent.group_ids
      return publicEvent
    }),
    publishedAt: wedding.site_published_at,
  })
})

app.put('/api/couple/weddings/:weddingId/site-config', requireSession, async (context) => {
  const weddingId = context.req.param('weddingId')
  const membership = await weddingMembership(context, weddingId, ['couple_admin', 'editor'])
  if (!membership) return jsonError(context, 404, 'wedding_not_found')
  if (membership.wedding_status === 'suspended') return jsonError(context, 409, 'wedding_suspended')
  const config = validateSiteConfig(await context.req.json().catch(() => null))
  if (!config) return jsonError(context, 400, 'invalid_site_config')
  const mediaIds = [...new Set([...(config.coverPhotoId ? [config.coverPhotoId] : []), ...config.coverGallery, ...config.siteGallery, ...(config.coverVideoId ? [config.coverVideoId] : []), ...config.timeline.map((item) => item.photoId).filter(Boolean), ...Object.values(config.giftPresentation).map((item) => item.photoId).filter(Boolean)])]
  if (mediaIds.length) {
    if (!context.env.GUEST_PHOTOS) return jsonError(context, 503, 'media_storage_unavailable')
    for (const id of mediaIds) {
      let exists = false
      for (const extension of ['jpg', 'png', 'webp', 'mp4']) {
        if (await context.env.GUEST_PHOTOS.get(`${weddingId}/site/${id}.${extension}`)) { exists = true; break }
      }
      if (!exists) return jsonError(context, 400, 'site_media_not_found')
    }
  }  await context.env.DB.batch([
    context.env.DB.prepare('UPDATE weddings SET site_config_json = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').bind(JSON.stringify(config), weddingId),
    context.env.DB.prepare(`INSERT INTO audit_logs (id, actor_account_id, wedding_id, action, target_type, target_id, details_json)
      VALUES (?, ?, ?, 'wedding_site_draft_saved', 'wedding', ?, ?)`)
      .bind(crypto.randomUUID(), context.get('session').account_id, weddingId, weddingId, JSON.stringify({ theme: config.theme, coverLayout: config.coverLayout, enabledSections: config.enabledSections.length })),
  ])
  return context.json({ draft: config })
})

app.post('/api/couple/weddings/:weddingId/site-config/publish', requireSession, async (context) => {
  const weddingId = context.req.param('weddingId')
  const membership = await weddingMembership(context, weddingId, ['couple_admin', 'editor'])
  if (!membership) return jsonError(context, 404, 'wedding_not_found')
  if (membership.wedding_status === 'suspended') return jsonError(context, 409, 'wedding_suspended')
  if (membership.wedding_status === 'completed') return jsonError(context, 409, 'wedding_not_publishable')
  const configRow = await context.env.DB.prepare('SELECT site_config_json, partner_one_name, partner_two_name, event_date, event_time FROM weddings WHERE id = ?').bind(weddingId).first()
  if (!configRow?.partner_one_name || !configRow?.partner_two_name) return jsonError(context, 400, 'wedding_profile_incomplete')
  const config = parseSiteConfig(configRow?.site_config_json) || defaultSiteConfig
  const eventsResult = await context.env.DB.prepare(`SELECT e.id, e.name, e.event_type, e.starts_at, e.venue_name, e.address,
    (SELECT json_group_array(x.group_id) FROM event_group_access x WHERE x.event_id = e.id) AS group_ids_json
    FROM events e WHERE e.wedding_id = ? ORDER BY e.starts_at`).bind(weddingId).all()
  const publishedEvents = eventsResult.results.map((event) => ({ ...event, group_ids: JSON.parse(event.group_ids_json || '[]') }))
  const publishedAt = new Date().toISOString()
  await context.env.DB.batch([
    context.env.DB.prepare(`UPDATE weddings SET published_site_config_json = ?, published_events_json = ?, published_partner_one_name = ?, published_partner_two_name = ?, published_event_date = ?, published_event_time = ?, site_published_at = ?, status = 'active', updated_at = CURRENT_TIMESTAMP WHERE id = ?`)
      .bind(JSON.stringify(config), JSON.stringify(publishedEvents), configRow.partner_one_name, configRow.partner_two_name, configRow.event_date, configRow.event_time, publishedAt, weddingId),
    context.env.DB.prepare(`INSERT INTO audit_logs (id, actor_account_id, wedding_id, action, target_type, target_id, details_json)
      VALUES (?, ?, ?, 'wedding_site_published', 'wedding', ?, ?)`)
      .bind(crypto.randomUUID(), context.get('session').account_id, weddingId, weddingId, JSON.stringify({ theme: config.theme, coverLayout: config.coverLayout })),
  ])
  return context.json({ published: config, events: publishedEvents, publishedAt, status: 'active' })
})

app.get('/api/couple/weddings/:weddingId/groups', requireSession, async (context) => {
  const weddingId = context.req.param('weddingId')
  const membership = await weddingMembership(context, weddingId, ['couple_admin', 'editor'])
  if (!membership) return jsonError(context, 404, 'wedding_not_found')
  const result = await context.env.DB.prepare('SELECT id, name, group_type FROM guest_groups WHERE wedding_id = ? ORDER BY name').bind(weddingId).all()
  return context.json({ groups: result.results })
})

app.post('/api/couple/weddings/:weddingId/groups', requireSession, async (context) => {
  const weddingId = context.req.param('weddingId')
  const membership = await weddingMembership(context, weddingId, ['couple_admin'])
  if (!membership) return jsonError(context, 404, 'wedding_not_found')
  if (membership.wedding_status === 'suspended') return jsonError(context, 409, 'wedding_suspended')
  const body = await context.req.json().catch(() => null)
  const name = typeof body?.name === 'string' ? body.name.trim() : ''
  const groupType = body?.groupType || 'other'
  if (!body || !name || name.length > 100 || !['guest', 'godparent', 'family', 'friends', 'other'].includes(groupType)) return jsonError(context, 400, 'invalid_guest_group')
  const id = crypto.randomUUID()
  try {
    await context.env.DB.prepare('INSERT INTO guest_groups (id, wedding_id, name, group_type) VALUES (?, ?, ?, ?)').bind(id, weddingId, name, groupType).run()
  } catch {
    return jsonError(context, 409, 'guest_group_already_exists')
  }
  return context.json({ id, name, groupType }, 201)
})

app.get('/api/couple/weddings/:weddingId/events', requireSession, async (context) => {
  const weddingId = context.req.param('weddingId')
  const membership = await weddingMembership(context, weddingId, ['couple_admin', 'editor'])
  if (!membership) return jsonError(context, 404, 'wedding_not_found')
  const result = await context.env.DB.prepare(`
    SELECT e.id, e.name, e.event_type, e.starts_at, e.venue_name, e.address,
      (SELECT json_group_array(x.group_id) FROM event_group_access x WHERE x.event_id = e.id) AS group_ids_json
    FROM events e WHERE e.wedding_id = ? ORDER BY e.starts_at
  `).bind(weddingId).all()
  return context.json({ events: result.results.map((event) => ({ ...event, group_ids: JSON.parse(event.group_ids_json || '[]') })) })
})

app.post('/api/couple/weddings/:weddingId/events', requireSession, async (context) => {
  const weddingId = context.req.param('weddingId')
  const membership = await weddingMembership(context, weddingId, ['couple_admin', 'editor'])
  if (!membership) return jsonError(context, 404, 'wedding_not_found')
  if (membership.wedding_status === 'suspended') return jsonError(context, 409, 'wedding_suspended')
  const body = await context.req.json().catch(() => null)
  const name = typeof body?.name === 'string' ? body.name.trim() : ''
  const eventType = body?.eventType || 'other'
  const startsAt = body?.startsAt || null
  const venueName = typeof body?.venueName === 'string' ? body.venueName.trim() : ''
  const address = typeof body?.address === 'string' ? body.address.trim() : ''
  const groupIds = Array.isArray(body?.groupIds) ? [...new Set(body.groupIds)] : []
  if (!body || !name || name.length > 120 || !['ceremony', 'reception', 'rehearsal', 'brunch', 'other'].includes(eventType)
    || (startsAt && (typeof startsAt !== 'string' || !Number.isFinite(Date.parse(startsAt))))
    || venueName.length > 160 || address.length > 500 || groupIds.length > 50 || groupIds.some((id) => typeof id !== 'string')) return jsonError(context, 400, 'invalid_event')
  const count = await context.env.DB.prepare('SELECT COUNT(*) AS total FROM events WHERE wedding_id = ?').bind(weddingId).first()
  if (count.total >= 6) return jsonError(context, 409, 'event_limit_reached')
  if (groupIds.length) {
    const placeholders = groupIds.map(() => '?').join(', ')
    const validGroups = await context.env.DB.prepare(`SELECT COUNT(*) AS total FROM guest_groups WHERE wedding_id = ? AND id IN (${placeholders})`).bind(weddingId, ...groupIds).first()
    if (validGroups.total !== groupIds.length) return jsonError(context, 400, 'invalid_event_groups')
  }
  const id = crypto.randomUUID()
  await context.env.DB.batch([
    context.env.DB.prepare(`INSERT INTO events (id, wedding_id, name, event_type, starts_at, venue_name, address)
      VALUES (?, ?, ?, ?, ?, ?, ?)`).bind(id, weddingId, name, eventType, startsAt, venueName || null, address || null),
    ...groupIds.map((groupId) => context.env.DB.prepare('INSERT INTO event_group_access (event_id, group_id) VALUES (?, ?)').bind(id, groupId)),
  ])
  return context.json({ id, name, eventType, startsAt, venueName, address, groupIds }, 201)
})

app.patch('/api/couple/weddings/:weddingId/events/:eventId', requireSession, async (context) => {
  const weddingId = context.req.param('weddingId')
  const membership = await weddingMembership(context, weddingId, ['couple_admin', 'editor'])
  if (!membership) return jsonError(context, 404, 'wedding_not_found')
  if (membership.wedding_status === 'suspended') return jsonError(context, 409, 'wedding_suspended')
  const eventId = context.req.param('eventId')
  const exists = await context.env.DB.prepare('SELECT id FROM events WHERE id = ? AND wedding_id = ?').bind(eventId, weddingId).first()
  if (!exists) return jsonError(context, 404, 'event_not_found')
  const body = await context.req.json().catch(() => null)
  const name = typeof body?.name === 'string' ? body.name.trim() : ''
  const eventType = body?.eventType || 'other'
  const startsAt = body?.startsAt || null
  const venueName = typeof body?.venueName === 'string' ? body.venueName.trim() : ''
  const address = typeof body?.address === 'string' ? body.address.trim() : ''
  const groupIds = Array.isArray(body?.groupIds) ? [...new Set(body.groupIds)] : []
  if (!body || !name || name.length > 120 || !['ceremony', 'reception', 'rehearsal', 'brunch', 'other'].includes(eventType)
    || (startsAt && (typeof startsAt !== 'string' || !Number.isFinite(Date.parse(startsAt))))
    || venueName.length > 160 || address.length > 500 || groupIds.length > 50 || groupIds.some((id) => typeof id !== 'string')) return jsonError(context, 400, 'invalid_event')
  if (groupIds.length) {
    const placeholders = groupIds.map(() => '?').join(', ')
    const validGroups = await context.env.DB.prepare(`SELECT COUNT(*) AS total FROM guest_groups WHERE wedding_id = ? AND id IN (${placeholders})`).bind(weddingId, ...groupIds).first()
    if (validGroups.total !== groupIds.length) return jsonError(context, 400, 'invalid_event_groups')
  }
  await context.env.DB.batch([
    context.env.DB.prepare(`UPDATE events SET name = ?, event_type = ?, starts_at = ?, venue_name = ?, address = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND wedding_id = ?`).bind(name, eventType, startsAt, venueName || null, address || null, eventId, weddingId),
    context.env.DB.prepare('DELETE FROM event_group_access WHERE event_id = ?').bind(eventId),
    ...groupIds.map((groupId) => context.env.DB.prepare('INSERT INTO event_group_access (event_id, group_id) VALUES (?, ?)').bind(eventId, groupId)),
  ])
  return context.json({ id: eventId, name, eventType, startsAt, venueName, address, groupIds })
})

app.delete('/api/couple/weddings/:weddingId/events/:eventId', requireSession, async (context) => {
  const weddingId = context.req.param('weddingId')
  const membership = await weddingMembership(context, weddingId, ['couple_admin', 'editor'])
  if (!membership) return jsonError(context, 404, 'wedding_not_found')
  if (membership.wedding_status === 'suspended') return jsonError(context, 409, 'wedding_suspended')
  const eventId = context.req.param('eventId')
  const dependencies = `
    NOT EXISTS (SELECT 1 FROM guest_rsvps WHERE event_id = events.id)
    AND NOT EXISTS (SELECT 1 FROM check_ins WHERE event_id = events.id)
    AND NOT EXISTS (SELECT 1 FROM guest_photos WHERE event_id = events.id)
    AND NOT EXISTS (SELECT 1 FROM membership_event_access WHERE event_id = events.id)
  `
  const results = await context.env.DB.batch([
    context.env.DB.prepare(`DELETE FROM events
      WHERE id = ? AND wedding_id = ? AND ${dependencies}`).bind(eventId, weddingId),
    context.env.DB.prepare(`UPDATE weddings
      SET published_events_json = COALESCE((
        SELECT json_group_array(json(value)) FROM json_each(weddings.published_events_json)
        WHERE json_extract(value, '$.id') != ?
      ), '[]'), updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND changes() = 1`).bind(eventId, weddingId),
  ])
  if (results[0]?.meta?.changes === 1) return context.json({ deleted: true })
  const exists = await context.env.DB.prepare('SELECT id FROM events WHERE id = ? AND wedding_id = ?').bind(eventId, weddingId).first()
  if (!exists) return jsonError(context, 404, 'event_not_found')
  const relatedData = await context.env.DB.prepare(`
    SELECT
      (SELECT COUNT(*) FROM guest_rsvps WHERE event_id = ?) AS rsvps,
      (SELECT COUNT(*) FROM check_ins WHERE event_id = ?) AS checkins,
      (SELECT COUNT(*) FROM guest_photos WHERE event_id = ?) AS photos,
      (SELECT COUNT(*) FROM membership_event_access WHERE event_id = ?) AS staff
  `).bind(eventId, eventId, eventId, eventId).first()
  if (Object.values(relatedData || {}).some((count) => Number(count) > 0)) {
    return context.json({ error: 'event_has_related_data', relatedData }, 409, { 'Cache-Control': 'no-store' })
  }
  return jsonError(context, 409, 'event_delete_failed')
})

app.get('/api/couple/weddings/:weddingId/members', requireSession, async (context) => {
  const weddingId = context.req.param('weddingId')
  const membership = await weddingMembership(context, weddingId, ['couple_admin'])
  if (!membership) return jsonError(context, 404, 'wedding_not_found')
  const result = await context.env.DB.prepare(`
    SELECT m.id, m.account_id, m.role, m.status, a.email
    FROM wedding_memberships m JOIN accounts a ON a.id = m.account_id
    WHERE m.wedding_id = ? ORDER BY m.created_at
  `).bind(weddingId).all()
  return context.json({ members: result.results })
})

app.post('/api/couple/weddings/:weddingId/members/invitations', requireSession, async (context) => {
  const weddingId = context.req.param('weddingId')
  const membership = await weddingMembership(context, weddingId, ['couple_admin'])
  if (!membership) return jsonError(context, 404, 'wedding_not_found')
  if (membership.wedding_status === 'suspended') return jsonError(context, 409, 'wedding_suspended')
  const body = await context.req.json().catch(() => null)
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''
  const role = body?.role
  if (!/^\S+@\S+\.\S+$/.test(email) || email.length > 254 || !['couple_admin', 'editor', 'reader', 'event_staff', 'checkin_staff'].includes(role)) return jsonError(context, 400, 'invalid_invitation')
  const existingAccount = await context.env.DB.prepare('SELECT id, status FROM accounts WHERE email = ? COLLATE NOCASE').bind(email).first()
  if (existingAccount && existingAccount.status !== 'active') return jsonError(context, 409, 'account_not_ready')
  const accountId = existingAccount?.id || crypto.randomUUID()
  const previousMembership = existingAccount ? await context.env.DB.prepare('SELECT id FROM wedding_memberships WHERE wedding_id = ? AND account_id = ?').bind(weddingId, accountId).first() : null
  if (previousMembership) return jsonError(context, 409, 'account_already_member')
  const memberId = crypto.randomUUID()
  const challengeId = crypto.randomUUID()
  const token = encodeToken(crypto.getRandomValues(new Uint8Array(32)))
  const challengeHash = await tokenHash(token)
  const temporaryPasswordHash = existingAccount ? null : await hashPassword(encodeToken(crypto.getRandomValues(new Uint8Array(32))))
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  await context.env.DB.batch([
    ...(!existingAccount ? [context.env.DB.prepare(`INSERT INTO accounts (id, email, password_hash, status)
      VALUES (?, ?, ?, 'pending')`).bind(accountId, email, temporaryPasswordHash)] : []),
    context.env.DB.prepare(`INSERT INTO wedding_memberships (id, wedding_id, account_id, role, status, invited_by)
      VALUES (?, ?, ?, ?, 'pending', ?)`).bind(memberId, weddingId, accountId, role, context.get('session').account_id),
    context.env.DB.prepare(`INSERT INTO auth_challenges (id, account_id, purpose, token_hash, expires_at, membership_id)
      VALUES (?, ?, 'email_verification', ?, ?, ?)`).bind(challengeId, accountId, challengeHash, expiresAt, memberId),
    context.env.DB.prepare(`INSERT INTO audit_logs (id, actor_account_id, wedding_id, action, target_type, target_id, details_json)
      VALUES (?, ?, ?, 'team_invitation_created', 'membership', ?, ?)`).bind(crypto.randomUUID(), context.get('session').account_id, weddingId, memberId, JSON.stringify({ role, expiresAt })),
  ])
  return context.json({ id: memberId, email, role, status: 'pending', requiresLogin: Boolean(existingAccount), expiresAt, invitationUrl: `${new URL(context.req.url).origin}/aceitar-equipe#aceitar-equipe/${token}` }, 201)
})

app.get('/api/couple/weddings/:weddingId/event-assignments', requireSession, async (context) => {
  const weddingId = context.req.param('weddingId')
  const membership = await weddingMembership(context, weddingId, ['couple_admin'])
  if (!membership) return jsonError(context, 404, 'wedding_not_found')
  const result = await context.env.DB.prepare(`
    SELECT a.membership_id, a.event_id FROM membership_event_access a
    JOIN wedding_memberships m ON m.id = a.membership_id
    JOIN events e ON e.id = a.event_id
    WHERE m.wedding_id = ? AND e.wedding_id = ?
  `).bind(weddingId, weddingId).all()
  return context.json({ assignments: result.results })
})

app.patch('/api/couple/weddings/:weddingId/members/:membershipId', requireSession, async (context) => {
  const weddingId = context.req.param('weddingId')
  const actor = context.get('session').account_id
  const membership = await weddingMembership(context, weddingId, ['couple_admin'])
  if (!membership) return jsonError(context, 404, 'wedding_not_found')
  if (membership.wedding_status === 'suspended') return jsonError(context, 409, 'wedding_suspended')
  const body = await context.req.json().catch(() => null)
  const roles = ['couple_admin', 'editor', 'reader', 'event_staff', 'checkin_staff']
  if (!body || (body.role !== undefined && !roles.includes(body.role)) || (body.status !== undefined && !['active', 'revoked'].includes(body.status)) || (body.role === undefined && body.status === undefined)) return jsonError(context, 400, 'invalid_membership_change')
  const membershipId = context.req.param('membershipId')
  const target = await context.env.DB.prepare('SELECT id, account_id, role, status FROM wedding_memberships WHERE id = ? AND wedding_id = ?').bind(membershipId, weddingId).first()
  if (!target) return jsonError(context, 404, 'membership_not_found')
  const nextRole = body.role || target.role
  const nextStatus = body.status || target.status
  if (target.role === 'couple_admin' && target.status === 'active' && (nextRole !== 'couple_admin' || nextStatus !== 'active')) {
    const admins = await context.env.DB.prepare("SELECT COUNT(*) AS total FROM wedding_memberships WHERE wedding_id = ? AND role = 'couple_admin' AND status = 'active'").bind(weddingId).first()
    if (admins.total <= 1) return jsonError(context, 409, 'cannot_remove_last_couple_admin')
  }
  await context.env.DB.batch([
    context.env.DB.prepare('UPDATE wedding_memberships SET role = ?, status = ? WHERE id = ? AND wedding_id = ?').bind(nextRole, nextStatus, membershipId, weddingId),
    ...(nextStatus !== 'active' || !['event_staff', 'checkin_staff'].includes(nextRole)
      ? [context.env.DB.prepare('DELETE FROM membership_event_access WHERE membership_id = ?').bind(membershipId)]
      : []),
    context.env.DB.prepare(`INSERT INTO audit_logs (id, actor_account_id, wedding_id, action, target_type, target_id, details_json)
      VALUES (?, ?, ?, 'wedding_membership_changed', 'membership', ?, ?)`)
      .bind(crypto.randomUUID(), actor, weddingId, membershipId, JSON.stringify({ fromRole: target.role, toRole: nextRole, fromStatus: target.status, toStatus: nextStatus })),
  ])
  return context.json({ id: membershipId, role: nextRole, status: nextStatus })
})

app.put('/api/couple/weddings/:weddingId/events/:eventId/members/:membershipId', requireSession, async (context) => {
  const weddingId = context.req.param('weddingId')
  const membership = await weddingMembership(context, weddingId, ['couple_admin'])
  if (!membership) return jsonError(context, 404, 'wedding_not_found')
  if (membership.wedding_status === 'suspended') return jsonError(context, 409, 'wedding_suspended')
  const body = await context.req.json().catch(() => null)
  if (typeof body?.assigned !== 'boolean') return jsonError(context, 400, 'invalid_assignment')
  const eventId = context.req.param('eventId')
  const membershipId = context.req.param('membershipId')
  const event = await context.env.DB.prepare('SELECT id FROM events WHERE id = ? AND wedding_id = ?').bind(eventId, weddingId).first()
  const staffMembership = await context.env.DB.prepare(`
    SELECT id, role, status FROM wedding_memberships
    WHERE id = ? AND wedding_id = ? AND role IN ('event_staff', 'checkin_staff')
  `).bind(membershipId, weddingId).first()
  if (!event || !staffMembership || staffMembership.status !== 'active') return jsonError(context, 404, 'assignment_target_not_found')
  const assignmentChange = body.assigned
    ? context.env.DB.prepare('INSERT OR IGNORE INTO membership_event_access (membership_id, event_id) VALUES (?, ?)').bind(membershipId, eventId)
    : context.env.DB.prepare('DELETE FROM membership_event_access WHERE membership_id = ? AND event_id = ?').bind(membershipId, eventId)
  await context.env.DB.batch([
    assignmentChange,
    context.env.DB.prepare(`INSERT INTO audit_logs (id, actor_account_id, wedding_id, action, target_type, target_id, details_json)
      VALUES (?, ?, ?, 'event_staff_assignment_changed', 'event', ?, ?)`)
      .bind(crypto.randomUUID(), context.get('session').account_id, weddingId, eventId, JSON.stringify({ membershipId, assigned: body.assigned, role: staffMembership.role })),
  ])
  return context.json({ eventId, membershipId, assigned: body.assigned })
})

app.get('/api/couple/weddings/:weddingId/godparent-tasks', requireSession, async (context) => {
  const weddingId = context.req.param('weddingId')
  const membership = await weddingMembership(context, weddingId, ['couple_admin'])
  if (!membership) return jsonError(context, 404, 'wedding_not_found')
  const result = await context.env.DB.prepare(`
    SELECT t.id, t.guest_id, g.name AS guest_name, t.title, t.details, t.due_at, t.status
    FROM godparent_tasks t JOIN guests g ON g.id = t.guest_id AND g.wedding_id = t.wedding_id
    WHERE t.wedding_id = ? AND g.deleted_at IS NULL AND g.guest_type = 'godparent'
    ORDER BY t.due_at, g.name
  `).bind(weddingId).all()
  return context.json({ tasks: result.results })
})

app.post('/api/couple/weddings/:weddingId/godparent-tasks', requireSession, async (context) => {
  const weddingId = context.req.param('weddingId')
  const membership = await weddingMembership(context, weddingId, ['couple_admin'])
  if (!membership) return jsonError(context, 404, 'wedding_not_found')
  if (membership.wedding_status === 'suspended') return jsonError(context, 409, 'wedding_suspended')
  const body = await context.req.json().catch(() => null)
  const title = typeof body?.title === 'string' ? body.title.trim() : ''
  const details = typeof body?.details === 'string' ? body.details.trim() : ''
  const dueAt = body?.dueAt || null
  if (!body || !title || title.length > 160 || details.length > 2000 || (dueAt && (typeof dueAt !== 'string' || !Number.isFinite(Date.parse(dueAt))))) return jsonError(context, 400, 'invalid_task')
  const godparent = await context.env.DB.prepare(`SELECT id FROM guests WHERE id = ? AND wedding_id = ? AND guest_type = 'godparent' AND deleted_at IS NULL`)
    .bind(body.guestId, weddingId).first()
  if (!godparent) return jsonError(context, 404, 'godparent_not_found')
  const id = crypto.randomUUID()
  await context.env.DB.prepare('INSERT INTO godparent_tasks (id, wedding_id, guest_id, title, details, due_at) VALUES (?, ?, ?, ?, ?, ?)')
    .bind(id, weddingId, godparent.id, title, details, dueAt).run()
  return context.json({ id, guestId: godparent.id, title, details, dueAt, status: 'open' }, 201)
})

app.get('/api/couple/weddings/:weddingId/guests', requireSession, async (context) => {
  const weddingId = context.req.param('weddingId')
  const membership = await weddingMembership(context, weddingId, ['couple_admin'])
  if (!membership) return jsonError(context, 404, 'wedding_not_found')
  const result = await context.env.DB.prepare(`
    SELECT g.id, g.group_id, g.name, g.email, g.phone, g.party_size, g.rsvp_status, g.source,
      g.dietary_notes, g.guest_type, g.created_at, gg.name AS group_name
    FROM guests g LEFT JOIN guest_groups gg ON gg.id = g.group_id
    WHERE g.wedding_id = ? AND g.deleted_at IS NULL
    ORDER BY g.name COLLATE NOCASE
  `).bind(weddingId).all()
  return context.json({ guests: result.results })
})

app.get('/api/couple/weddings/:weddingId/rsvps', requireSession, async (context) => {
  const weddingId = context.req.param('weddingId')
  const membership = await weddingMembership(context, weddingId, ['couple_admin'])
  if (!membership) return jsonError(context, 404, 'wedding_not_found')
  const result = await context.env.DB.prepare(`
    SELECT r.id, r.event_id, e.name AS event_name, r.guest_id, g.name AS guest_name,
      r.status, r.party_size, g.party_size AS invited_party_size, r.dietary_notes, r.updated_at
    FROM guest_rsvps r JOIN events e ON e.id = r.event_id AND e.wedding_id = r.wedding_id
    JOIN guests g ON g.id = r.guest_id AND g.wedding_id = r.wedding_id
    WHERE r.wedding_id = ? AND g.deleted_at IS NULL
    ORDER BY e.starts_at, g.name COLLATE NOCASE
  `).bind(weddingId).all()
  return context.json({ rsvps: result.results })
})

app.get('/api/couple/weddings/:weddingId/guest-policy', requireSession, async (context) => {
  const weddingId = context.req.param('weddingId')
  if (!await weddingMembership(context, weddingId, ['couple_admin'])) return jsonError(context, 404, 'wedding_not_found')
  const policy = await context.env.DB.prepare('SELECT companions_allowed, max_companions FROM wedding_guest_policies WHERE wedding_id = ?').bind(weddingId).first()
  return context.json({ policy: { companionsAllowed: Boolean(policy?.companions_allowed), maxCompanions: policy?.max_companions || 0 } })
})

app.put('/api/couple/weddings/:weddingId/guest-policy', requireSession, async (context) => {
  const weddingId = context.req.param('weddingId')
  const membership = await weddingMembership(context, weddingId, ['couple_admin'])
  if (!membership) return jsonError(context, 404, 'wedding_not_found')
  if (membership.wedding_status === 'suspended') return jsonError(context, 409, 'wedding_suspended')
  const body = await context.req.json().catch(() => null)
  if (typeof body?.companionsAllowed !== 'boolean' || !Number.isInteger(body.maxCompanions) || body.maxCompanions < 0 || body.maxCompanions > 19 || (!body.companionsAllowed && body.maxCompanions !== 0)) return jsonError(context, 400, 'invalid_guest_policy')
  await context.env.DB.batch([
    context.env.DB.prepare(`INSERT INTO wedding_guest_policies (wedding_id, companions_allowed, max_companions, updated_by, updated_at)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(wedding_id) DO UPDATE SET companions_allowed = excluded.companions_allowed, max_companions = excluded.max_companions, updated_by = excluded.updated_by, updated_at = CURRENT_TIMESTAMP`)
      .bind(weddingId, body.companionsAllowed ? 1 : 0, body.companionsAllowed ? body.maxCompanions : 0, context.get('session').account_id),
    context.env.DB.prepare(`INSERT INTO audit_logs (id, actor_account_id, wedding_id, action, target_type, target_id, details_json)
      VALUES (?, ?, ?, 'guest_companion_policy_changed', 'wedding', ?, ?)`)
      .bind(crypto.randomUUID(), context.get('session').account_id, weddingId, weddingId, JSON.stringify({ companionsAllowed: body.companionsAllowed, maxCompanions: body.companionsAllowed ? body.maxCompanions : 0 })),
  ])
  return context.json({ policy: { companionsAllowed: body.companionsAllowed, maxCompanions: body.companionsAllowed ? body.maxCompanions : 0 } })
})

app.get('/api/couple/weddings/:weddingId/attendance-requests', requireSession, async (context) => {
  const weddingId = context.req.param('weddingId')
  if (!await weddingMembership(context, weddingId, ['couple_admin'])) return jsonError(context, 404, 'wedding_not_found')
  const requests = await context.env.DB.prepare(`SELECT r.id, r.event_id, e.name AS event_name, r.name, r.email, r.phone,
      r.attendance_status, r.review_status, r.guest_id, r.created_at, r.decided_at,
      (SELECT COUNT(*) FROM guest_companion_requests c WHERE c.rsvp_request_id = r.id AND c.status = 'pending') AS companions_pending,
      EXISTS (SELECT 1 FROM guests g WHERE g.wedding_id = r.wedding_id AND g.deleted_at IS NULL
        AND ((r.email IS NOT NULL AND lower(g.email) = lower(r.email)) OR (r.phone IS NOT NULL
          AND replace(replace(replace(replace(replace(replace(g.phone, '+', ''), ' ', ''), '-', ''), '(', ''), ')', ''), '.', '')
          = replace(replace(replace(replace(replace(replace(r.phone, '+', ''), ' ', ''), '-', ''), '(', ''), ')', ''), '.', '')))) AS possible_existing_guest
    FROM guest_rsvp_requests r JOIN events e ON e.id = r.event_id AND e.wedding_id = r.wedding_id
    WHERE r.wedding_id = ? ORDER BY CASE r.review_status WHEN 'pending' THEN 0 ELSE 1 END, r.created_at DESC`).bind(weddingId).all()
  const companions = await context.env.DB.prepare(`SELECT c.id, c.event_id, e.name AS event_name, c.rsvp_request_id, c.host_guest_id,
      COALESCE(r.name, h.name) AS requester_name, c.name, c.email, c.phone, c.status, c.guest_id, c.created_at, c.decided_at
    FROM guest_companion_requests c JOIN events e ON e.id = c.event_id AND e.wedding_id = c.wedding_id
    LEFT JOIN guest_rsvp_requests r ON r.id = c.rsvp_request_id AND r.wedding_id = c.wedding_id
    LEFT JOIN guests h ON h.id = c.host_guest_id AND h.wedding_id = c.wedding_id
    WHERE c.wedding_id = ? ORDER BY CASE c.status WHEN 'pending' THEN 0 ELSE 1 END, c.created_at DESC`).bind(weddingId).all()
  return context.json({ requests: requests.results, companions: companions.results })
})

app.get('/api/couple/weddings/:weddingId/guest-authorizations', requireSession, async (context) => {
  const weddingId = context.req.param('weddingId')
  if (!await weddingMembership(context, weddingId, ['couple_admin'])) return jsonError(context, 404, 'wedding_not_found')
  const result = await context.env.DB.prepare(`SELECT a.guest_id, g.name AS guest_name, a.event_id, e.name AS event_name, a.status, a.decided_at
    FROM guest_event_authorizations a JOIN guests g ON g.id = a.guest_id AND g.wedding_id = a.wedding_id AND g.deleted_at IS NULL
    JOIN events e ON e.id = a.event_id AND e.wedding_id = a.wedding_id WHERE a.wedding_id = ? ORDER BY e.starts_at, g.name COLLATE NOCASE`)
    .bind(weddingId).all()
  return context.json({ authorizations: result.results })
})

app.put('/api/couple/weddings/:weddingId/guest-authorizations', requireSession, async (context) => {
  const weddingId = context.req.param('weddingId')
  const membership = await weddingMembership(context, weddingId, ['couple_admin'])
  if (!membership) return jsonError(context, 404, 'wedding_not_found')
  if (membership.wedding_status === 'suspended') return jsonError(context, 409, 'wedding_suspended')
  const body = await context.req.json().catch(() => null)
  if (!body || !/^[0-9a-f-]{36}$/i.test(body.guestId || '') || !/^[0-9a-f-]{36}$/i.test(body.eventId || '') || !['authorized', 'revoked'].includes(body.status)) return jsonError(context, 400, 'invalid_guest_authorization')
  const [guest, event] = await Promise.all([
    context.env.DB.prepare('SELECT id FROM guests WHERE id = ? AND wedding_id = ? AND deleted_at IS NULL').bind(body.guestId, weddingId).first(),
    context.env.DB.prepare('SELECT id FROM events WHERE id = ? AND wedding_id = ?').bind(body.eventId, weddingId).first(),
  ])
  if (!guest || !event) return jsonError(context, 404, 'guest_or_event_not_found')
  const actorId = context.get('session').account_id
  await context.env.DB.batch([
    context.env.DB.prepare(`INSERT INTO guest_event_authorizations (wedding_id, event_id, guest_id, status, decided_by)
      VALUES (?, ?, ?, ?, ?) ON CONFLICT(event_id, guest_id) DO UPDATE SET status = excluded.status, decided_by = excluded.decided_by, decided_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP`)
      .bind(weddingId, body.eventId, body.guestId, body.status, actorId),
    context.env.DB.prepare(`INSERT INTO audit_logs (id, actor_account_id, wedding_id, action, target_type, target_id, details_json)
      VALUES (?, ?, ?, 'guest_event_authorization_changed', 'guest', ?, ?)`)
      .bind(crypto.randomUUID(), actorId, weddingId, body.guestId, JSON.stringify({ eventId: body.eventId, status: body.status })),
  ])
  return context.json({ guestId: body.guestId, eventId: body.eventId, status: body.status })
})

app.patch('/api/couple/weddings/:weddingId/attendance-requests/:requestId', requireSession, async (context) => {
  const weddingId = context.req.param('weddingId')
  const requestId = context.req.param('requestId')
  const membership = await weddingMembership(context, weddingId, ['couple_admin'])
  if (!membership) return jsonError(context, 404, 'wedding_not_found')
  if (membership.wedding_status === 'suspended') return jsonError(context, 409, 'wedding_suspended')
  const body = await context.req.json().catch(() => null)
  if (!['approved', 'rejected'].includes(body?.decision)) return jsonError(context, 400, 'invalid_attendance_decision')
  const request = await context.env.DB.prepare(`SELECT r.*, e.group_ids_json FROM guest_rsvp_requests r
    JOIN events e ON e.id = r.event_id AND e.wedding_id = r.wedding_id
    WHERE r.id = ? AND r.wedding_id = ?`).bind(requestId, weddingId).first()
  if (!request) return jsonError(context, 404, 'attendance_request_not_found')
  if (request.review_status !== 'pending') return jsonError(context, 409, 'attendance_request_already_reviewed')
  if (body.decision === 'approved') {
    const matchingGuest = await context.env.DB.prepare(`SELECT id FROM guests WHERE wedding_id = ? AND deleted_at IS NULL
      AND ((? IS NOT NULL AND lower(email) = lower(?)) OR (? IS NOT NULL
        AND replace(replace(replace(replace(replace(replace(phone, '+', ''), ' ', ''), '-', ''), '(', ''), ')', ''), '.', '')
        = replace(replace(replace(replace(replace(replace(?, '+', ''), ' ', ''), '-', ''), '(', ''), ')', ''), '.', ''))) LIMIT 1`)
      .bind(weddingId, request.email, request.email, request.phone, request.phone).first()
    if (matchingGuest) return jsonError(context, 409, 'matching_guest_requires_individual_invitation')
  }
  const guestId = body.decision === 'approved' ? crypto.randomUUID() : null
  const accessToken = guestId && request.attendance_status === 'confirmed' ? encodeToken(crypto.getRandomValues(new Uint8Array(32))) : null
  const credential = accessToken ? await guestCredentialCipher(context, accessToken) : null
  const statements = [context.env.DB.prepare(`UPDATE guest_rsvp_requests SET review_status = ?, guest_id = ?, decided_by = ?, decided_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
    WHERE id = ? AND wedding_id = ? AND review_status = 'pending'`).bind(body.decision, guestId, context.get('session').account_id, requestId, weddingId)]
  if (guestId) {
    const partySize = await context.env.DB.prepare('SELECT COUNT(*) AS total FROM guest_companion_requests WHERE rsvp_request_id = ?').bind(requestId).first()
    statements.push(context.env.DB.prepare(`INSERT INTO guests (id, wedding_id, invited_by, name, email, phone, access_token_hash, access_token_ciphertext, access_token_iv, party_size, rsvp_status, guest_type, source)
      SELECT ?, ?, ?, name, email, phone, ?, ?, ?, ?, attendance_status, 'guest', 'public_request'
      FROM guest_rsvp_requests WHERE id = ? AND review_status = 'approved' AND guest_id = ?`)
      .bind(guestId, weddingId, context.get('session').account_id, accessToken ? await tokenHash(accessToken) : null, credential?.ciphertext || null, credential?.iv || null, (partySize?.total || 0) + 1, requestId, guestId))
    statements.push(context.env.DB.prepare(`INSERT INTO guest_rsvps (id, wedding_id, event_id, guest_id, status, party_size)
      SELECT ?, wedding_id, event_id, ?, attendance_status, 1 FROM guest_rsvp_requests WHERE id = ? AND review_status = 'approved' AND guest_id = ?
      ON CONFLICT(event_id, guest_id) DO NOTHING`).bind(crypto.randomUUID(), guestId, requestId, guestId))
    if (request.attendance_status === 'confirmed') statements.push(context.env.DB.prepare(`INSERT INTO guest_event_authorizations (wedding_id, event_id, guest_id, status, decided_by)
      SELECT wedding_id, event_id, ?, 'authorized', ? FROM guest_rsvp_requests WHERE id = ? AND review_status = 'approved' AND guest_id = ?
      ON CONFLICT(event_id, guest_id) DO UPDATE SET status = 'authorized', decided_by = excluded.decided_by, decided_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP`)
      .bind(guestId, context.get('session').account_id, requestId, guestId))
  }
  statements.push(context.env.DB.prepare(`INSERT INTO audit_logs (id, actor_account_id, wedding_id, action, target_type, target_id, details_json)
    SELECT ?, ?, ?, 'guest_attendance_request_reviewed', 'guest_rsvp_request', ?, ?
    WHERE EXISTS (SELECT 1 FROM guest_rsvp_requests WHERE id = ? AND review_status = ? AND guest_id IS ?)`)
    .bind(crypto.randomUUID(), context.get('session').account_id, weddingId, requestId, JSON.stringify({ decision: body.decision, attendanceStatus: request.attendance_status }), requestId, body.decision, guestId))
  const results = await context.env.DB.batch(statements)
  if (!results[0].meta.changes) return jsonError(context, 409, 'attendance_request_already_reviewed')
  return context.json({ id: requestId, reviewStatus: body.decision })
})

app.patch('/api/couple/weddings/:weddingId/companion-requests/:companionId', requireSession, async (context) => {
  const weddingId = context.req.param('weddingId')
  const companionId = context.req.param('companionId')
  const membership = await weddingMembership(context, weddingId, ['couple_admin'])
  if (!membership) return jsonError(context, 404, 'wedding_not_found')
  if (membership.wedding_status === 'suspended') return jsonError(context, 409, 'wedding_suspended')
  const body = await context.req.json().catch(() => null)
  if (!['approved', 'rejected'].includes(body?.decision) || (body.name !== undefined && (typeof body.name !== 'string' || body.name.trim().length > 160))) return jsonError(context, 400, 'invalid_companion_decision')
  const companion = await context.env.DB.prepare(`SELECT c.*, r.review_status AS request_status, r.attendance_status AS request_attendance_status,
      r.guest_id AS request_guest_id, h.group_id AS host_group_id, h.party_size AS host_party_size, h.guest_type AS host_guest_type
    FROM guest_companion_requests c
    LEFT JOIN guest_rsvp_requests r ON r.id = c.rsvp_request_id AND r.wedding_id = c.wedding_id
    LEFT JOIN guests h ON h.id = c.host_guest_id AND h.wedding_id = c.wedding_id
    WHERE c.id = ? AND c.wedding_id = ?`).bind(companionId, weddingId).first()
  if (!companion) return jsonError(context, 404, 'companion_request_not_found')
  if (companion.status !== 'pending') return jsonError(context, 409, 'companion_request_already_reviewed')
  const name = typeof body.name === 'string' ? body.name.trim() : companion.name.trim()
  if (body.decision === 'approved' && (!name || (companion.rsvp_request_id && (companion.request_status !== 'approved' || companion.request_attendance_status !== 'confirmed')))) return jsonError(context, 409, 'companion_not_ready')
  if (companion.host_guest_id && companion.host_guest_type === 'companion') return jsonError(context, 409, 'companion_host_not_allowed')
  const hostGuestId = companion.host_guest_id || companion.request_guest_id
  if (body.decision === 'approved' && !hostGuestId) return jsonError(context, 409, 'attendance_request_not_approved')
  if (body.decision === 'approved' && companion.host_guest_id) {
    const attendance = await guestAttendanceStatus(context, weddingId, companion.event_id, hostGuestId)
    if (attendance?.rsvp_status !== 'confirmed') return jsonError(context, 409, 'host_not_confirmed')
  }
  const policy = await context.env.DB.prepare('SELECT companions_allowed, max_companions FROM wedding_guest_policies WHERE wedding_id = ?').bind(weddingId).first()
  if (body.decision === 'approved' && (!policy?.companions_allowed || await (async () => {
    const total = await context.env.DB.prepare(`SELECT COUNT(*) AS total FROM guest_companion_requests
      WHERE wedding_id = ? AND status = 'approved' AND ((host_guest_id = ? AND ? IS NOT NULL) OR (rsvp_request_id = ? AND ? IS NOT NULL))`)
      .bind(weddingId, companion.host_guest_id, companion.host_guest_id, companion.rsvp_request_id, companion.rsvp_request_id).first()
    const requested = companion.host_guest_id ? companion.host_party_size - 1 : await context.env.DB.prepare('SELECT COUNT(*) AS total FROM guest_companion_requests WHERE rsvp_request_id = ?').bind(companion.rsvp_request_id).first().then((result) => result?.total || 0)
    return (total?.total || 0) >= Math.min(policy?.max_companions || 0, requested)
  })())) return jsonError(context, 409, 'companion_limit_reached')
  const requestedCount = companion.host_guest_id
    ? Math.max(0, companion.host_party_size - 1)
    : await context.env.DB.prepare('SELECT COUNT(*) AS total FROM guest_companion_requests WHERE rsvp_request_id = ?').bind(companion.rsvp_request_id).first().then((result) => result?.total || 0)
  const approvalLimit = Math.min(policy?.max_companions || 0, requestedCount)
  const guestId = body.decision === 'approved' ? crypto.randomUUID() : null
  const accessToken = guestId ? encodeToken(crypto.getRandomValues(new Uint8Array(32))) : null
  const credential = accessToken ? await guestCredentialCipher(context, accessToken) : null
  const statements = [context.env.DB.prepare(`UPDATE guest_companion_requests SET name = ?, status = ?, guest_id = ?, decided_by = ?, decided_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
    WHERE id = ? AND wedding_id = ? AND status = 'pending' AND (? != 'approved' OR (
      SELECT COUNT(*) FROM guest_companion_requests c WHERE c.wedding_id = ? AND c.status = 'approved'
        AND ((c.host_guest_id = ? AND ? IS NOT NULL) OR (c.rsvp_request_id = ? AND ? IS NOT NULL))
    ) < ?)`).bind(name, body.decision, guestId, context.get('session').account_id, companionId, weddingId, body.decision, weddingId, companion.host_guest_id, companion.host_guest_id, companion.rsvp_request_id, companion.rsvp_request_id, approvalLimit)]
  if (guestId) {
    statements.push(context.env.DB.prepare(`INSERT INTO guests (id, wedding_id, group_id, invited_by, name, email, phone, access_token_hash, access_token_ciphertext, access_token_iv, party_size, rsvp_status, guest_type, source)
      SELECT ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 'confirmed', 'guest', 'companion'
      WHERE EXISTS (SELECT 1 FROM guest_companion_requests WHERE id = ? AND status = 'approved' AND guest_id = ?)`)
      .bind(guestId, weddingId, companion.host_group_id || null, context.get('session').account_id, name, companion.email, companion.phone, await tokenHash(accessToken), credential?.ciphertext || null, credential?.iv || null, companionId, guestId))
    statements.push(context.env.DB.prepare(`INSERT INTO guest_rsvps (id, wedding_id, event_id, guest_id, status, party_size)
      SELECT ?, wedding_id, event_id, ?, 'confirmed', 1 FROM guest_companion_requests WHERE id = ? AND status = 'approved' AND guest_id = ?
      ON CONFLICT(event_id, guest_id) DO NOTHING`).bind(crypto.randomUUID(), guestId, companionId, guestId))
    statements.push(context.env.DB.prepare(`INSERT INTO guest_event_authorizations (wedding_id, event_id, guest_id, status, decided_by)
      SELECT wedding_id, event_id, ?, 'authorized', ? FROM guest_companion_requests WHERE id = ? AND status = 'approved' AND guest_id = ?
      ON CONFLICT(event_id, guest_id) DO UPDATE SET status = 'authorized', decided_by = excluded.decided_by, decided_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP`)
      .bind(guestId, context.get('session').account_id, companionId, guestId))
  }
  statements.push(context.env.DB.prepare(`INSERT INTO audit_logs (id, actor_account_id, wedding_id, action, target_type, target_id, details_json)
    SELECT ?, ?, ?, 'guest_companion_request_reviewed', 'guest_companion_request', ?, ?
    WHERE EXISTS (SELECT 1 FROM guest_companion_requests WHERE id = ? AND status = ? AND guest_id IS ?)`)
    .bind(crypto.randomUUID(), context.get('session').account_id, weddingId, companionId, JSON.stringify({ decision: body.decision, guestId }), companionId, body.decision, guestId))
  const results = await context.env.DB.batch(statements)
  if (!results[0].meta.changes) {
    const current = await context.env.DB.prepare('SELECT status FROM guest_companion_requests WHERE id = ? AND wedding_id = ?').bind(companionId, weddingId).first()
    return jsonError(context, 409, current?.status === 'pending' ? 'companion_limit_reached' : 'companion_request_already_reviewed')
  }
  let emailSent = false
  if (body.decision === 'approved' && companion.email && accessToken) {
    const accessUrl = `${new URL(context.req.url).origin}/convidado#convite/${accessToken}`
    try {
      emailSent = await sendTransactionalEmail(context, {
        to: companion.email,
        subject: 'Seu acesso individual ao casamento',
        text: `Seu pedido de presença foi aprovado. Apresente seu QR individual na entrada: ${accessUrl}`,
        html: `<p>Seu pedido de presença foi aprovado.</p><p><a href="${accessUrl}">Abrir meu convite individual e QR code</a></p>`,
      })
    } catch {
      emailSent = false
    }
  }
  return context.json({ id: companionId, status: body.decision, guestId, emailSent })
})

app.get('/api/couple/weddings/:weddingId/gifts', requireSession, async (context) => {
  const weddingId = context.req.param('weddingId')
  const membership = await weddingMembership(context, weddingId, ['couple_admin'])
  if (!membership) return jsonError(context, 404, 'wedding_not_found')
  const result = await context.env.DB.prepare(`SELECT id, gift_type, fulfillment_type, store_url, title, description, amount_cents, goal_cents, status, display_order, created_at, updated_at
    FROM gifts WHERE wedding_id = ? ORDER BY CASE status WHEN 'active' THEN 0 ELSE 1 END, display_order, created_at`).bind(weddingId).all()
  return context.json({ gifts: result.results })
})

app.post('/api/couple/weddings/:weddingId/gifts', requireSession, async (context) => {
  const weddingId = context.req.param('weddingId')
  const membership = await weddingMembership(context, weddingId, ['couple_admin'])
  if (!membership) return jsonError(context, 404, 'wedding_not_found')
  if (membership.wedding_status === 'suspended') return jsonError(context, 409, 'wedding_suspended')
  const body = await context.req.json().catch(() => null)
  const title = typeof body?.title === 'string' ? body.title.trim() : ''
  const description = typeof body?.description === 'string' ? body.description.trim() : ''
  const fulfillmentType = body?.fulfillmentType === 'store_link' ? 'store_link' : 'pix_direct'
  const storeUrl = typeof body?.storeUrl === 'string' ? body.storeUrl.trim() : ''
  let safeStoreUrl = null
  if (fulfillmentType === 'store_link') {
    try {
      const parsed = new URL(storeUrl)
      if (parsed.protocol !== 'https:' || !parsed.hostname || parsed.username || parsed.password || storeUrl.length > 2048) throw new Error('invalid_store_url')
      safeStoreUrl = parsed.toString()
    } catch { return jsonError(context, 400, 'invalid_store_url') }
  }
  const amountCents = body?.giftType === 'custom' ? null : body?.amountCents
  const goalCents = body?.goalCents === '' || body?.goalCents === undefined ? null : body?.goalCents
  const validInteger = (value) => Number.isSafeInteger(value) && value > 0
  if (!body || !['fixed', 'custom'].includes(body.giftType) || !title || title.length > 120 || description.length > 500
    || (body.giftType === 'fixed' && !validInteger(amountCents)) || (goalCents !== null && !validInteger(goalCents))) return jsonError(context, 400, 'invalid_gift')
  const count = await context.env.DB.prepare('SELECT COUNT(*) AS total FROM gifts WHERE wedding_id = ? AND status = \'active\'').bind(weddingId).first()
  if (count.total >= 60) return jsonError(context, 409, 'gift_limit_reached')
  const id = crypto.randomUUID()
  const actorId = context.get('session').account_id
  await context.env.DB.batch([
    context.env.DB.prepare(`INSERT INTO gifts (id, wedding_id, gift_type, fulfillment_type, store_url, title, description, amount_cents, goal_cents, display_order)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .bind(id, weddingId, body.giftType, fulfillmentType, safeStoreUrl, title, description, amountCents, goalCents, count.total),
    context.env.DB.prepare(`INSERT INTO audit_logs (id, actor_account_id, wedding_id, action, target_type, target_id, details_json)
      VALUES (?, ?, ?, 'gift_created', 'gift', ?, ?)`)
      .bind(crypto.randomUUID(), actorId, weddingId, id, JSON.stringify({ giftType: body.giftType, fulfillmentType, amountCents, goalCents })),
  ])
  return context.json({ gift: { id, gift_type: body.giftType, fulfillment_type: fulfillmentType, store_url: safeStoreUrl, title, description, amount_cents: amountCents, goal_cents: goalCents, status: 'active', display_order: count.total } }, 201)
})

app.patch('/api/couple/weddings/:weddingId/gifts/:giftId', requireSession, async (context) => {
  const weddingId = context.req.param('weddingId')
  const giftId = context.req.param('giftId')
  const membership = await weddingMembership(context, weddingId, ['couple_admin'])
  if (!membership) return jsonError(context, 404, 'wedding_not_found')
  if (membership.wedding_status === 'suspended') return jsonError(context, 409, 'wedding_suspended')
  const body = await context.req.json().catch(() => null)
  const title = typeof body?.title === 'string' ? body.title.trim() : ''
  const description = typeof body?.description === 'string' ? body.description.trim() : ''
  const fulfillmentType = body?.fulfillmentType === 'store_link' ? 'store_link' : 'pix_direct'
  const storeUrl = typeof body?.storeUrl === 'string' ? body.storeUrl.trim() : ''
  let safeStoreUrl = null
  if (fulfillmentType === 'store_link') {
    try {
      const parsed = new URL(storeUrl)
      if (parsed.protocol !== 'https:' || !parsed.hostname || parsed.username || parsed.password || storeUrl.length > 2048) throw new Error('invalid_store_url')
      safeStoreUrl = parsed.toString()
    } catch { return jsonError(context, 400, 'invalid_store_url') }
  }
  const amountCents = body?.giftType === 'custom' ? null : body?.amountCents
  const goalCents = body?.goalCents === '' || body?.goalCents === undefined ? null : body?.goalCents
  const validInteger = (value) => Number.isSafeInteger(value) && value > 0
  if (!body || !['fixed', 'custom'].includes(body.giftType) || !title || title.length > 120 || description.length > 500
    || (body.giftType === 'fixed' && !validInteger(amountCents)) || (goalCents !== null && !validInteger(goalCents)) || !['active', 'archived'].includes(body.status)) return jsonError(context, 400, 'invalid_gift')
  const current = await context.env.DB.prepare('SELECT id FROM gifts WHERE id = ? AND wedding_id = ?').bind(giftId, weddingId).first()
  if (!current) return jsonError(context, 404, 'gift_not_found')
  const actorId = context.get('session').account_id
  await context.env.DB.batch([
    context.env.DB.prepare(`UPDATE gifts SET gift_type = ?, fulfillment_type = ?, store_url = ?, title = ?, description = ?, amount_cents = ?, goal_cents = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND wedding_id = ?`)
      .bind(body.giftType, fulfillmentType, safeStoreUrl, title, description, amountCents, goalCents, body.status, giftId, weddingId),
    context.env.DB.prepare(`INSERT INTO audit_logs (id, actor_account_id, wedding_id, action, target_type, target_id, details_json)
      VALUES (?, ?, ?, 'gift_updated', 'gift', ?, ?)`)
      .bind(crypto.randomUUID(), actorId, weddingId, giftId, JSON.stringify({ giftType: body.giftType, fulfillmentType, amountCents, goalCents, status: body.status })),
  ])
  return context.json({ gift: { id: giftId, gift_type: body.giftType, fulfillment_type: fulfillmentType, store_url: safeStoreUrl, title, description, amount_cents: amountCents, goal_cents: goalCents, status: body.status } })
})

app.delete('/api/couple/weddings/:weddingId/gifts/:giftId', requireSession, async (context) => {
  const weddingId = context.req.param('weddingId')
  const giftId = context.req.param('giftId')
  const membership = await weddingMembership(context, weddingId, ['couple_admin'])
  if (!membership) return jsonError(context, 404, 'wedding_not_found')
  if (membership.wedding_status === 'suspended') return jsonError(context, 409, 'wedding_suspended')
  const gift = await context.env.DB.prepare('SELECT id, status FROM gifts WHERE id = ? AND wedding_id = ?').bind(giftId, weddingId).first()
  if (!gift) return jsonError(context, 404, 'gift_not_found')
  const actorId = context.get('session').account_id
  await context.env.DB.batch([
    context.env.DB.prepare('UPDATE gifts SET status = \'archived\', updated_at = CURRENT_TIMESTAMP WHERE id = ? AND wedding_id = ?').bind(giftId, weddingId),
    context.env.DB.prepare(`INSERT INTO audit_logs (id, actor_account_id, wedding_id, action, target_type, target_id, details_json)
      VALUES (?, ?, ?, 'gift_archived', 'gift', ?, '{}')`).bind(crypto.randomUUID(), actorId, weddingId, giftId),
  ])
  return context.json({ id: giftId, status: 'archived' })
})

app.post('/api/couple/weddings/:weddingId/rsvps', requireSession, async (context) => {
  const weddingId = context.req.param('weddingId')
  const membership = await weddingMembership(context, weddingId, ['couple_admin'])
  if (!membership) return jsonError(context, 404, 'wedding_not_found')
  if (membership.wedding_status === 'suspended') return jsonError(context, 409, 'wedding_suspended')
  const body = await context.req.json().catch(() => null)
  if (!body || typeof body.guestId !== 'string' || typeof body.eventId !== 'string' || !['confirmed', 'declined'].includes(body.status)
    || !Number.isInteger(body.partySize) || body.partySize < 1 || body.partySize > 20
    || (body.dietaryNotes !== undefined && body.dietaryNotes !== null && (typeof body.dietaryNotes !== 'string' || body.dietaryNotes.length > 1000))) return jsonError(context, 400, 'invalid_rsvp')
  const guest = await context.env.DB.prepare('SELECT id, party_size, group_id FROM guests WHERE id = ? AND wedding_id = ? AND deleted_at IS NULL').bind(body.guestId, weddingId).first()
  if (!guest) return jsonError(context, 404, 'guest_not_found')
  if (body.partySize > guest.party_size) return jsonError(context, 400, 'party_size_exceeds_invitation')
  const event = await context.env.DB.prepare(`SELECT id FROM events WHERE id = ? AND wedding_id = ? AND (
    NOT EXISTS (SELECT 1 FROM event_group_access x WHERE x.event_id = events.id)
    OR EXISTS (SELECT 1 FROM event_group_access x WHERE x.event_id = events.id AND x.group_id = ?)
  )`).bind(body.eventId, weddingId, guest.group_id).first()
  if (!event) return jsonError(context, 404, 'event_not_available_for_guest')
  const existing = await context.env.DB.prepare('SELECT id FROM guest_rsvps WHERE wedding_id = ? AND event_id = ? AND guest_id = ?').bind(weddingId, event.id, guest.id).first()
  if (existing) return jsonError(context, 409, 'rsvp_already_exists')
  const id = crypto.randomUUID()
  await context.env.DB.batch([
    context.env.DB.prepare(`INSERT INTO guest_rsvps (id, wedding_id, event_id, guest_id, status, party_size, dietary_notes, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`)
      .bind(id, weddingId, event.id, guest.id, body.status, body.partySize, body.dietaryNotes?.trim() || null),
    context.env.DB.prepare(`INSERT INTO audit_logs (id, actor_account_id, wedding_id, action, target_type, target_id, details_json)
      VALUES (?, ?, ?, 'guest_rsvp_manually_changed', 'guest_rsvp', ?, ?)`)
      .bind(crypto.randomUUID(), context.get('session').account_id, weddingId, guest.id, JSON.stringify({ eventId: event.id, status: body.status, partySize: body.partySize })),
  ])
  return context.json({ guestId: guest.id, eventId: event.id, status: body.status, partySize: body.partySize }, 201)
})

app.put('/api/couple/weddings/:weddingId/rsvps/:rsvpId', requireSession, async (context) => {
  const weddingId = context.req.param('weddingId')
  const membership = await weddingMembership(context, weddingId, ['couple_admin'])
  if (!membership) return jsonError(context, 404, 'wedding_not_found')
  if (membership.wedding_status === 'suspended') return jsonError(context, 409, 'wedding_suspended')
  const body = await context.req.json().catch(() => null)
  const rsvpId = context.req.param('rsvpId')
  const current = await context.env.DB.prepare(`SELECT r.id, r.guest_id, r.event_id, g.party_size AS invited_party_size, g.group_id
    FROM guest_rsvps r JOIN guests g ON g.id = r.guest_id AND g.wedding_id = r.wedding_id
    WHERE r.id = ? AND r.wedding_id = ? AND g.deleted_at IS NULL`).bind(rsvpId, weddingId).first()
  if (!current) return jsonError(context, 404, 'rsvp_not_found')
  if (!body || !['confirmed', 'declined'].includes(body.status) || !Number.isInteger(body.partySize) || body.partySize < 1
    || body.partySize > current.invited_party_size || (body.dietaryNotes !== undefined && body.dietaryNotes !== null && (typeof body.dietaryNotes !== 'string' || body.dietaryNotes.length > 1000))) return jsonError(context, 400, 'invalid_rsvp')
  await context.env.DB.batch([
    context.env.DB.prepare(`UPDATE guest_rsvps SET status = ?, party_size = ?, dietary_notes = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND wedding_id = ?`)
      .bind(body.status, body.partySize, body.dietaryNotes?.trim() || null, rsvpId, weddingId),
    context.env.DB.prepare(`INSERT INTO audit_logs (id, actor_account_id, wedding_id, action, target_type, target_id, details_json)
      VALUES (?, ?, ?, 'guest_rsvp_manually_changed', 'guest_rsvp', ?, ?)`)
      .bind(crypto.randomUUID(), context.get('session').account_id, weddingId, current.guest_id, JSON.stringify({ eventId: current.event_id, status: body.status, partySize: body.partySize })),
  ])
  return context.json({ id: rsvpId, guestId: current.guest_id, eventId: current.event_id, status: body.status, partySize: body.partySize })
})

app.post('/api/couple/weddings/:weddingId/guests', requireSession, async (context) => {
  const weddingId = context.req.param('weddingId')
  const membership = await weddingMembership(context, weddingId, ['couple_admin'])
  if (!membership) return jsonError(context, 404, 'wedding_not_found')
  if (membership.wedding_status === 'suspended') return jsonError(context, 409, 'wedding_suspended')
  const body = await context.req.json().catch(() => null)
  const name = typeof body?.name === 'string' ? body.name.trim() : ''
  const email = typeof body?.email === 'string' && body.email.trim() ? body.email.trim().toLowerCase() : null
  const phone = typeof body?.phone === 'string' && body.phone.trim() ? body.phone.trim() : null
  const partySize = body?.partySize
  const guestType = body?.guestType || 'guest'
  const dietaryNotes = typeof body?.dietaryNotes === 'string' && body.dietaryNotes.trim() ? body.dietaryNotes.trim() : null
  if (!body || !name || name.length > 160 || (email && (email.length > 254 || !/^\S+@\S+\.\S+$/.test(email))) || (phone && phone.length > 40) || !Number.isInteger(partySize) || partySize < 1 || partySize > 20 || !['guest', 'godparent'].includes(guestType) || (dietaryNotes && dietaryNotes.length > 1000)) return jsonError(context, 400, 'invalid_guest')
  if (body.groupId) {
    const group = await context.env.DB.prepare('SELECT id FROM guest_groups WHERE id = ? AND wedding_id = ?').bind(body.groupId, weddingId).first()
    if (!group) return jsonError(context, 400, 'invalid_guest_group')
  }
  const id = crypto.randomUUID()
  const accessToken = encodeToken(crypto.getRandomValues(new Uint8Array(32)))
  const credential = await guestCredentialCipher(context, accessToken)
  await context.env.DB.batch([
    context.env.DB.prepare(`INSERT INTO guests (id, wedding_id, group_id, invited_by, name, email, phone, access_token_hash, access_token_ciphertext, access_token_iv, party_size, dietary_notes, guest_type)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .bind(id, weddingId, body.groupId || null, context.get('session').account_id, name, email, phone, await tokenHash(accessToken), credential?.ciphertext || null, credential?.iv || null, partySize, dietaryNotes, guestType),
    context.env.DB.prepare(`INSERT INTO audit_logs (id, actor_account_id, wedding_id, action, target_type, target_id, details_json)
      VALUES (?, ?, ?, 'guest_invited', 'guest', ?, '{}')`)
      .bind(crypto.randomUUID(), context.get('session').account_id, weddingId, id),
  ])
  return context.json({ guest: { id, name, email, phone, groupId: body.groupId || null, partySize, guestType }, accessToken, accessUrl: `${new URL(context.req.url).origin}/convidado#convite/${accessToken}` }, 201)
})

app.post('/api/couple/weddings/:weddingId/guests/import', requireSession, async (context) => {
  const weddingId = context.req.param('weddingId')
  const membership = await weddingMembership(context, weddingId, ['couple_admin'])
  if (!membership) return jsonError(context, 404, 'wedding_not_found')
  if (membership.wedding_status === 'suspended') return jsonError(context, 409, 'wedding_suspended')
  const body = await context.req.json().catch(() => null)
  if (!Array.isArray(body?.guests) || !body.guests.length || body.guests.length > 100) return jsonError(context, 400, 'invalid_guest_import')
  const groupResult = await context.env.DB.prepare('SELECT id, name FROM guest_groups WHERE wedding_id = ?').bind(weddingId).all()
  const groupsByName = new Map(groupResult.results.map((group) => [group.name.trim().toLocaleLowerCase('pt-BR'), group.id]))
  const existingEmails = await context.env.DB.prepare('SELECT lower(email) AS email FROM guests WHERE wedding_id = ? AND deleted_at IS NULL AND email IS NOT NULL').bind(weddingId).all()
  const seenEmails = new Set(existingEmails.results.map((item) => item.email))
  const rows = []
  const errors = []
  for (const [index, value] of body.guests.entries()) {
    const row = index + 2
    const name = typeof value?.name === 'string' ? value.name.trim() : ''
    const email = typeof value?.email === 'string' && value.email.trim() ? value.email.trim().toLowerCase() : null
    const phone = typeof value?.phone === 'string' && value.phone.trim() ? value.phone.trim() : null
    const groupName = typeof value?.groupName === 'string' ? value.groupName.trim() : ''
    const groupId = groupName ? groupsByName.get(groupName.toLocaleLowerCase('pt-BR')) : null
    const dietaryNotes = typeof value?.dietaryNotes === 'string' && value.dietaryNotes.trim() ? value.dietaryNotes.trim() : null
    const guestType = value?.guestType || 'guest'
    const partySize = value?.partySize
    const issues = []
    if (!name || name.length > 160) issues.push('nome')
    if (email && (email.length > 254 || !/^\S+@\S+\.\S+$/.test(email))) issues.push('email')
    if (email && seenEmails.has(email)) issues.push('email duplicado')
    if (email) seenEmails.add(email)
    if (phone && phone.length > 40) issues.push('telefone')
    if (!Number.isInteger(partySize) || partySize < 1 || partySize > 20) issues.push('pessoas (1 a 20)')
    if (groupName && !groupId) issues.push('grupo inexistente')
    if (dietaryNotes && dietaryNotes.length > 1000) issues.push('restrição alimentar')
    if (!['guest', 'godparent'].includes(guestType)) issues.push('perfil')
    if (issues.length) errors.push({ row, fields: issues })
    else rows.push({ name, email, phone, groupId, groupName: groupName || null, dietaryNotes, guestType, partySize })
  }
  if (errors.length) return context.json({ error: 'guest_import_validation_failed', rows: errors }, 400)
  const created = await Promise.all(rows.map(async (guest) => {
    const token = encodeToken(crypto.getRandomValues(new Uint8Array(32)))
    return { ...guest, id: crypto.randomUUID(), token, credential: await guestCredentialCipher(context, token) }
  }))
  const statements = []
  for (const guest of created) {
    statements.push(context.env.DB.prepare(`INSERT INTO guests (id, wedding_id, group_id, invited_by, name, email, phone, access_token_hash, access_token_ciphertext, access_token_iv, party_size, dietary_notes, guest_type, source)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'csv_import')`)
      .bind(guest.id, weddingId, guest.groupId, context.get('session').account_id, guest.name, guest.email, guest.phone, await tokenHash(guest.token), guest.credential?.ciphertext || null, guest.credential?.iv || null, guest.partySize, guest.dietaryNotes, guest.guestType))
    statements.push(context.env.DB.prepare(`INSERT INTO audit_logs (id, actor_account_id, wedding_id, action, target_type, target_id, details_json)
      VALUES (?, ?, ?, 'guest_invited', 'guest', ?, '{"source":"csv_import"}')`)
      .bind(crypto.randomUUID(), context.get('session').account_id, weddingId, guest.id))
  }
  await context.env.DB.batch(statements)
  const origin = new URL(context.req.url).origin
  return context.json({ guests: created.map((guest) => ({ id: guest.id, name: guest.name, email: guest.email, groupName: guest.groupName, accessUrl: `${origin}/convidado#convite/${guest.token}` })) }, 201)
})

app.patch('/api/couple/weddings/:weddingId/guests/:guestId', requireSession, async (context) => {
  const weddingId = context.req.param('weddingId')
  const guestId = context.req.param('guestId')
  const membership = await weddingMembership(context, weddingId, ['couple_admin'])
  if (!membership) return jsonError(context, 404, 'wedding_not_found')
  if (membership.wedding_status === 'suspended') return jsonError(context, 409, 'wedding_suspended')
  const body = await context.req.json().catch(() => null)
  if (!body) return jsonError(context, 400, 'invalid_guest')
  const current = await context.env.DB.prepare('SELECT id, name, email, phone, group_id, party_size, dietary_notes, guest_type FROM guests WHERE id = ? AND wedding_id = ? AND deleted_at IS NULL').bind(guestId, weddingId).first()
  if (!current) return jsonError(context, 404, 'guest_not_found')
  const name = body.name === undefined ? current.name : typeof body.name === 'string' ? body.name.trim() : ''
  const email = body.email === undefined ? current.email : typeof body.email === 'string' && body.email.trim() ? body.email.trim().toLowerCase() : null
  const phone = body.phone === undefined ? current.phone : typeof body.phone === 'string' && body.phone.trim() ? body.phone.trim() : null
  const groupId = body.groupId === undefined ? current.group_id : body.groupId || null
  const partySize = body.partySize === undefined ? current.party_size : body.partySize
  const dietaryNotes = body.dietaryNotes === undefined ? current.dietary_notes : typeof body.dietaryNotes === 'string' && body.dietaryNotes.trim() ? body.dietaryNotes.trim() : null
  const guestType = body.guestType === undefined ? current.guest_type : body.guestType
  if (!name || name.length > 160 || (email && (email.length > 254 || !/^\S+@\S+\.\S+$/.test(email))) || (phone && phone.length > 40) || !Number.isInteger(partySize) || partySize < 1 || partySize > 20 || !['guest', 'godparent'].includes(guestType) || (dietaryNotes && dietaryNotes.length > 1000)) return jsonError(context, 400, 'invalid_guest')
  if (groupId) {
    const group = await context.env.DB.prepare('SELECT id FROM guest_groups WHERE id = ? AND wedding_id = ?').bind(groupId, weddingId).first()
    if (!group) return jsonError(context, 400, 'invalid_guest_group')
  }
  await context.env.DB.prepare(`UPDATE guests SET name = ?, email = ?, phone = ?, group_id = ?, party_size = ?, dietary_notes = ?, guest_type = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND wedding_id = ?`)
    .bind(name, email, phone, groupId, partySize, dietaryNotes, guestType, guestId, weddingId).run()
  return context.json({ guest: { id: guestId, name, email, phone, groupId, partySize, dietaryNotes, guestType } })
})

app.delete('/api/couple/weddings/:weddingId/guests/:guestId', requireSession, async (context) => {
  const weddingId = context.req.param('weddingId')
  const guestId = context.req.param('guestId')
  const membership = await weddingMembership(context, weddingId, ['couple_admin'])
  if (!membership) return jsonError(context, 404, 'wedding_not_found')
  if (membership.wedding_status === 'suspended') return jsonError(context, 409, 'wedding_suspended')
  const guest = await context.env.DB.prepare('SELECT id FROM guests WHERE id = ? AND wedding_id = ? AND deleted_at IS NULL').bind(guestId, weddingId).first()
  if (!guest) return jsonError(context, 404, 'guest_not_found')
  const guestPhotos = await context.env.DB.prepare('SELECT object_key FROM guest_photos WHERE wedding_id = ? AND guest_id = ?').bind(weddingId, guestId).all()
  if (guestPhotos.results.length && context.env.GUEST_PHOTOS) await context.env.GUEST_PHOTOS.delete(guestPhotos.results.map((photo) => photo.object_key))
  await context.env.DB.batch([
    context.env.DB.prepare('DELETE FROM guest_photos WHERE wedding_id = ? AND guest_id = ?').bind(weddingId, guestId),
    context.env.DB.prepare(`UPDATE guests SET name = 'Convidado removido', email = NULL, phone = NULL, access_token_hash = NULL, access_token_ciphertext = NULL, access_token_iv = NULL, dietary_notes = NULL,
      deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND wedding_id = ? AND deleted_at IS NULL`).bind(guestId, weddingId),
    context.env.DB.prepare('UPDATE guest_rsvps SET dietary_notes = NULL WHERE wedding_id = ? AND guest_id = ?').bind(weddingId, guestId),
    context.env.DB.prepare(`UPDATE godparent_tasks SET title = 'Orientação removida', details = '', updated_at = CURRENT_TIMESTAMP WHERE wedding_id = ? AND guest_id = ?`).bind(weddingId, guestId),
    context.env.DB.prepare(`UPDATE check_ins SET dietary_notes = NULL WHERE wedding_id = ? AND guest_id = ?`).bind(weddingId, guestId),
    context.env.DB.prepare('UPDATE gift_contributions SET guest_id = NULL, payer_name = NULL, message = NULL WHERE wedding_id = ? AND guest_id = ?').bind(weddingId, guestId),
    context.env.DB.prepare(`INSERT INTO audit_logs (id, actor_account_id, wedding_id, action, target_type, target_id, details_json)
      VALUES (?, ?, ?, 'guest_personal_data_removed', 'guest', ?, '{"rsvp_and_checkin_history_preserved":true}')`)
      .bind(crypto.randomUUID(), context.get('session').account_id, weddingId, guestId),
  ])
  return context.json({ id: guestId, deleted: true, historyPreserved: true })
})

app.post('/api/couple/weddings/:weddingId/guests/:guestId/invitation-token', requireSession, async (context) => {
  const weddingId = context.req.param('weddingId')
  const guestId = context.req.param('guestId')
  const membership = await weddingMembership(context, weddingId, ['couple_admin'])
  if (!membership) return jsonError(context, 404, 'wedding_not_found')
  if (membership.wedding_status === 'suspended') return jsonError(context, 409, 'wedding_suspended')
  const guest = await context.env.DB.prepare('SELECT id FROM guests WHERE id = ? AND wedding_id = ? AND deleted_at IS NULL').bind(guestId, weddingId).first()
  if (!guest) return jsonError(context, 404, 'guest_not_found')
  const accessToken = encodeToken(crypto.getRandomValues(new Uint8Array(32)))
  const credential = await guestCredentialCipher(context, accessToken)
  await context.env.DB.batch([
    context.env.DB.prepare('UPDATE guests SET access_token_hash = ?, access_token_ciphertext = ?, access_token_iv = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND wedding_id = ?')
      .bind(await tokenHash(accessToken), credential?.ciphertext || null, credential?.iv || null, guestId, weddingId),
    context.env.DB.prepare(`INSERT INTO audit_logs (id, actor_account_id, wedding_id, action, target_type, target_id, details_json)
      VALUES (?, ?, ?, 'guest_access_rotated', 'guest', ?, '{}')`)
      .bind(crypto.randomUUID(), context.get('session').account_id, weddingId, guestId),
  ])
  return context.json({ accessToken, accessUrl: `${new URL(context.req.url).origin}/convidado#convite/${accessToken}` })
})

app.get('/api/public/weddings/:slug', async (context) => {
  const wedding = await publicWeddingBySlug(context, context.req.param('slug'))
  if (!wedding) return jsonError(context, 404, 'published_site_not_found')
  const policy = await context.env.DB.prepare('SELECT companions_allowed, max_companions FROM wedding_guest_policies WHERE wedding_id = ?').bind(wedding.id).first()
  const parsedConfig = parseSiteConfig(wedding.published_site_config_json)
  const siteConfig = publicSiteConfig(parsedConfig)
  const giftDisplayMode = normalizedGiftDisplayMode(parsedConfig)
  const showPix = parsedConfig?.pix?.enabled && normalizedPixDisplayMode(parsedConfig) !== 'hidden'
  const gifts = giftDisplayMode !== 'hidden'
    ? await context.env.DB.prepare(`SELECT id, gift_type, fulfillment_type, store_url, title, description, amount_cents, goal_cents
      FROM gifts WHERE wedding_id = ? AND status = 'active' AND (? = 1 OR fulfillment_type = 'store_link') ORDER BY display_order, created_at`).bind(wedding.id, showPix ? 1 : 0).all()
    : { results: [] }
  return context.json({
    wedding: { slug: wedding.slug, partnerOneName: wedding.partner_one_name, partnerTwoName: wedding.partner_two_name, eventDate: wedding.event_date, eventTime: wedding.event_time, timezone: wedding.timezone },
    siteConfig,
    events: publicWeddingEvents(wedding),
    gifts: gifts.results,
    guestPolicy: { companionsAllowed: Boolean(policy?.companions_allowed), maxCompanions: policy?.max_companions || 0 },
  }, 200, { 'Cache-Control': 'public, max-age=60' })
})

app.get('/api/public/weddings/:slug/media/:mediaId', async (context) => {
  const wedding = await publicWeddingBySlug(context, context.req.param('slug'))
  if (!wedding || !context.env.GUEST_PHOTOS) return jsonError(context, 404, 'media_not_found')
  const mediaId = context.req.param('mediaId')
  if (!/^[0-9a-f-]{36}$/i.test(mediaId)) return jsonError(context, 404, 'media_not_found')
  const config = parseSiteConfig(wedding.published_site_config_json)
  if (!config || ![config.coverPhotoId, config.coverVideoId, ...config.coverGallery, ...config.siteGallery, ...(config.timeline || []).map((item) => item.photoId), ...Object.values(config.giftPresentation || {}).map((item) => item.photoId)].includes(mediaId)) return jsonError(context, 404, 'media_not_found')
  let object
  for (const extension of ['jpg', 'png', 'webp', 'mp4']) {
    object = await context.env.GUEST_PHOTOS.get(`${wedding.id}/site/${mediaId}.${extension}`)
    if (object) break
  }
  if (!object) return jsonError(context, 404, 'media_not_found')
  context.header('Content-Type', object.httpMetadata?.contentType || 'application/octet-stream')
  context.header('Cache-Control', 'public, max-age=300')
  context.header('X-Content-Type-Options', 'nosniff')
  return context.body(object.body)
})

app.post('/api/public/weddings/:slug/rsvp', async (context) => {
  const wedding = await publicWeddingBySlug(context, context.req.param('slug'))
  if (!wedding) return jsonError(context, 404, 'published_site_not_found')
  const body = await context.req.json().catch(() => null)
  const name = typeof body?.name === 'string' ? body.name.trim() : ''
  const email = typeof body?.email === 'string' && body.email.trim() ? body.email.trim().toLowerCase() : null
  const phone = typeof body?.phone === 'string' && body.phone.trim() ? body.phone.trim() : null
  const companions = Array.isArray(body?.companions) ? body.companions : []
  if (!body || !/^[0-9a-f-]{36}$/i.test(body.eventId || '') || !name || name.length > 160 || (email && (email.length > 254 || !/^\S+@\S+\.\S+$/.test(email))) || (phone && (phone.length > 40 || phone.replace(/\D/g, '').length < 8)) || (!email && !phone)
    || !['confirmed', 'declined'].includes(body.attendanceStatus) || !/^[A-Za-z0-9_-]{20,80}$/.test(body.idempotencyKey || '') || !/^[A-Za-z0-9_-]{40,60}$/.test(body.requestToken || '')
    || companions.length > 19 || companions.some((item) => !item || typeof item.name !== 'string' || item.name.trim().length > 160 || (item.email && (typeof item.email !== 'string' || item.email.length > 254 || !/^\S+@\S+\.\S+$/.test(item.email))) || (item.phone && (typeof item.phone !== 'string' || item.phone.length > 40)))) return jsonError(context, 400, 'invalid_public_rsvp')
  const config = parseSiteConfig(wedding.published_site_config_json)
  if (!config?.enabledSections.includes('Confirmação de presença')) return jsonError(context, 404, 'rsvp_unavailable')
  const event = publicWeddingEvents(wedding).find((item) => item.id === body.eventId)
  if (!event) return jsonError(context, 404, 'event_not_available')
  const policy = await context.env.DB.prepare('SELECT companions_allowed, max_companions FROM wedding_guest_policies WHERE wedding_id = ?').bind(wedding.id).first()
  if ((companions.length && !policy?.companions_allowed) || companions.length > (policy?.max_companions || 0) || (body.attendanceStatus === 'declined' && companions.length)) return jsonError(context, 400, 'companion_limit_reached')
  const requestTokenHash = await tokenHash(body.requestToken)
  const idempotencyHash = await tokenHash(body.idempotencyKey)
  const duplicate = await context.env.DB.prepare('SELECT id, request_token_hash, guest_id, review_status FROM guest_rsvp_requests WHERE wedding_id = ? AND idempotency_hash = ?').bind(wedding.id, idempotencyHash).first()
  if (duplicate) {
    if (duplicate.request_token_hash !== requestTokenHash) return jsonError(context, 409, 'request_already_submitted')
    let credential = null
    if (duplicate.guest_id && body.attendanceStatus === 'confirmed') {
      const guest = await context.env.DB.prepare(`SELECT g.id, g.name, g.access_token_ciphertext, g.access_token_iv FROM guests g
        JOIN guest_rsvps r ON r.guest_id = g.id AND r.event_id = ? AND r.wedding_id = g.wedding_id AND r.status = 'confirmed'
        JOIN guest_event_authorizations a ON a.guest_id = g.id AND a.event_id = ? AND a.wedding_id = g.wedding_id AND a.status = 'authorized'
        WHERE g.id = ? AND g.wedding_id = ? AND g.deleted_at IS NULL AND g.rsvp_status = 'confirmed'`)
        .bind(event.id, event.id, duplicate.guest_id, wedding.id).first()
      const accessToken = guest && await openGuestCredential(context, guest.access_token_ciphertext, guest.access_token_iv)
      if (accessToken) credential = { guestId: guest.id, name: guest.name, accessUrl: `${new URL(context.req.url).origin}/convidado#convite/${accessToken}` }
    }
    return context.json({ id: duplicate.id, duplicate: true, reviewStatus: duplicate.review_status, requestToken: body.requestToken, requestUrl: `${new URL(context.req.url).origin}/confirmar-presenca#solicitacao/${body.requestToken}`, credential }, 200, { 'Cache-Control': 'no-store' })
  }
  const limit = await allowPublicWeddingRequest(context, wedding.id)
  if (!limit.allowed) return context.json({ error: 'too_many_requests' }, 429, { 'Retry-After': String(limit.retryAfter), 'Cache-Control': 'no-store' })
  const challenge = await verifyTurnstile(context, body.turnstileToken, 'rsvp')
  if (!challenge.configured) return jsonError(context, 503, 'turnstile_unavailable')
  if (!challenge.verified) return jsonError(context, 403, 'turnstile_verification_failed')
  if (body.attendanceStatus === 'confirmed' && (typeof context.env.GUEST_CREDENTIALS_ENCRYPTION_KEY !== 'string' || context.env.GUEST_CREDENTIALS_ENCRYPTION_KEY.length < 32)) return jsonError(context, 503, 'guest_credentials_unavailable')
  const matchingGuest = await context.env.DB.prepare(`SELECT id FROM guests WHERE wedding_id = ? AND deleted_at IS NULL
    AND ((? IS NOT NULL AND lower(email) = lower(?)) OR (? IS NOT NULL
      AND replace(replace(replace(replace(replace(replace(phone, '+', ''), ' ', ''), '-', ''), '(', ''), ')', ''), '.', '')
      = replace(replace(replace(replace(replace(replace(?, '+', ''), ' ', ''), '-', ''), '(', ''), ')', ''), '.', ''))) LIMIT 1`)
    .bind(wedding.id, email, email, phone, phone).first()
  if (matchingGuest) return jsonError(context, 409, 'use_individual_invitation')
  const id = crypto.randomUUID()
  const guestId = crypto.randomUUID()
  const requestToken = body.requestToken
  const accessToken = body.attendanceStatus === 'confirmed' ? encodeToken(crypto.getRandomValues(new Uint8Array(32))) : null
  const credential = accessToken ? await guestCredentialCipher(context, accessToken) : { ciphertext: null, iv: null }
  const statements = [context.env.DB.prepare(`INSERT INTO guests (id, wedding_id, invited_by, name, email, phone, access_token_hash, access_token_ciphertext, access_token_iv, party_size, rsvp_status, guest_type, source)
    VALUES (?, ?, NULL, ?, ?, ?, ?, ?, ?, ?, ?, 'guest', 'public_request')`)
    .bind(guestId, wedding.id, name, email, phone, accessToken ? await tokenHash(accessToken) : null, credential.ciphertext, credential.iv, companions.length + 1, body.attendanceStatus),
  context.env.DB.prepare(`INSERT INTO guest_rsvp_requests (id, wedding_id, event_id, name, email, phone, attendance_status, review_status, request_token_hash, idempotency_hash, guest_id, decided_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'approved', ?, ?, ?, CURRENT_TIMESTAMP)`)
    .bind(id, wedding.id, event.id, name, email, phone, body.attendanceStatus, requestTokenHash, idempotencyHash, guestId),
  context.env.DB.prepare(`INSERT INTO guest_rsvps (id, wedding_id, event_id, guest_id, status, party_size)
    VALUES (?, ?, ?, ?, ?, 1) ON CONFLICT(event_id, guest_id) DO NOTHING`)
    .bind(crypto.randomUUID(), wedding.id, event.id, guestId, body.attendanceStatus)]
  if (body.attendanceStatus === 'confirmed') statements.push(context.env.DB.prepare(`INSERT INTO guest_event_authorizations (wedding_id, event_id, guest_id, status)
    VALUES (?, ?, ?, 'authorized') ON CONFLICT(event_id, guest_id) DO UPDATE SET status = 'authorized', decided_by = NULL, decided_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP`)
    .bind(wedding.id, event.id, guestId))
  for (const companion of companions) statements.push(context.env.DB.prepare(`INSERT INTO guest_companion_requests (id, wedding_id, event_id, rsvp_request_id, name, email, phone)
    VALUES (?, ?, ?, ?, ?, ?, ?)`)
    .bind(crypto.randomUUID(), wedding.id, event.id, id, companion.name.trim(), companion.email?.trim().toLowerCase() || null, companion.phone?.trim() || null))
  statements.push(context.env.DB.prepare(`INSERT INTO audit_logs (id, actor_account_id, wedding_id, action, target_type, target_id, details_json)
    VALUES (?, NULL, ?, 'guest_rsvp_requested', 'guest_rsvp_request', ?, ?)`)
    .bind(crypto.randomUUID(), wedding.id, id, JSON.stringify({ eventId: event.id, attendanceStatus: body.attendanceStatus, companionsRequested: companions.length })))
  await context.env.DB.batch(statements)
  const requestUrl = `${new URL(context.req.url).origin}/confirmar-presenca#solicitacao/${requestToken}`
  const accessUrl = accessToken ? `${new URL(context.req.url).origin}/convidado#convite/${accessToken}` : null
  let emailSent = false
  if (email && accessUrl) {
    try {
      emailSent = await sendTransactionalEmail(context, {
        to: email,
        subject: 'Sua confirmação de presença',
        text: `Sua presença foi confirmada. Guarde seu QR individual para a entrada: ${accessUrl}\n\nVocê também pode consultar sua confirmação por este link: ${requestUrl}`,
        html: `<p>Sua presença foi confirmada.</p><p><a href="${accessUrl}">Abrir meu convite individual e QR code</a></p><p><a href="${requestUrl}">Consultar confirmação</a></p>`,
      })
    } catch {
      emailSent = false
    }
  }
  return context.json({ id, reviewStatus: 'approved', requestToken, requestUrl, credential: accessUrl ? { guestId, name, accessUrl } : null, emailSent }, 201, { 'Cache-Control': 'no-store' })
})

app.post('/api/public/attendance-requests/lookup', async (context) => {
  const body = await context.req.json().catch(() => null)
  if (!/^[A-Za-z0-9_-]{40,60}$/.test(body?.requestToken || '')) return jsonError(context, 400, 'invalid_request_token')
  const request = await context.env.DB.prepare(`SELECT r.id, r.wedding_id, r.name, r.attendance_status, r.review_status, r.event_id, e.name AS event_name,
      w.partner_one_name, w.partner_two_name
    FROM guest_rsvp_requests r JOIN events e ON e.id = r.event_id AND e.wedding_id = r.wedding_id
    JOIN weddings w ON w.id = r.wedding_id
    WHERE r.request_token_hash = ? AND w.status = 'active'`).bind(await tokenHash(body.requestToken)).first()
  if (!request) return jsonError(context, 404, 'attendance_request_not_found')
  const limit = await allowPublicWeddingRequest(context, request.wedding_id)
  if (!limit.allowed) return context.json({ error: 'too_many_requests' }, 429, { 'Retry-After': String(limit.retryAfter), 'Cache-Control': 'no-store' })
  const companions = await context.env.DB.prepare(`SELECT id, name, status FROM guest_companion_requests
    WHERE rsvp_request_id = ? ORDER BY created_at`).bind(request.id).all()
  return context.json({ request: { id: request.id, name: request.name, attendanceStatus: request.attendance_status, reviewStatus: request.review_status, eventName: request.event_name, partnerOneName: request.partner_one_name, partnerTwoName: request.partner_two_name }, companions: companions.results }, 200, { 'Cache-Control': 'no-store' })
})

app.post('/api/public/attendance-requests/credentials', async (context) => {
  const body = await context.req.json().catch(() => null)
  if (!/^[A-Za-z0-9_-]{40,60}$/.test(body?.requestToken || '')) return jsonError(context, 400, 'invalid_request_token')
  if (typeof context.env.GUEST_CREDENTIALS_ENCRYPTION_KEY !== 'string' || context.env.GUEST_CREDENTIALS_ENCRYPTION_KEY.length < 32) return jsonError(context, 503, 'guest_credentials_unavailable')
  const request = await context.env.DB.prepare(`SELECT id, wedding_id, event_id, guest_id, attendance_status, review_status
    FROM guest_rsvp_requests WHERE request_token_hash = ?`).bind(await tokenHash(body.requestToken)).first()
  if (!request) return jsonError(context, 404, 'attendance_request_not_found')
  if (request.review_status !== 'approved' || request.attendance_status !== 'confirmed' || !request.guest_id) return jsonError(context, 409, 'credentials_not_available')
  const limit = await allowPublicWeddingRequest(context, request.wedding_id)
  if (!limit.allowed) return context.json({ error: 'too_many_requests' }, 429, { 'Retry-After': String(limit.retryAfter), 'Cache-Control': 'no-store' })
  const guest = await context.env.DB.prepare(`SELECT g.id, g.name, g.access_token_ciphertext, g.access_token_iv
    FROM guests g JOIN guest_rsvps r ON r.guest_id = g.id AND r.event_id = ? AND r.wedding_id = g.wedding_id AND r.status = 'confirmed'
    JOIN guest_event_authorizations a ON a.guest_id = g.id AND a.event_id = ? AND a.wedding_id = g.wedding_id AND a.status = 'authorized'
    WHERE g.id = ? AND g.wedding_id = ? AND g.deleted_at IS NULL AND g.rsvp_status = 'confirmed'`)
    .bind(request.event_id, request.event_id, request.guest_id, request.wedding_id).first()
  if (!guest) return jsonError(context, 409, 'credentials_not_available')
  const companions = await context.env.DB.prepare(`SELECT c.id AS companion_request_id, g.id, g.name, g.access_token_ciphertext, g.access_token_iv
    FROM guest_companion_requests c
    JOIN guests g ON g.id = c.guest_id AND g.wedding_id = c.wedding_id
    JOIN guest_rsvps r ON r.guest_id = g.id AND r.event_id = c.event_id AND r.wedding_id = c.wedding_id AND r.status = 'confirmed'
    JOIN guest_event_authorizations a ON a.guest_id = g.id AND a.event_id = c.event_id AND a.wedding_id = c.wedding_id AND a.status = 'authorized'
    WHERE c.rsvp_request_id = ? AND c.wedding_id = ? AND c.event_id = ? AND c.status = 'approved'
      AND g.deleted_at IS NULL AND g.rsvp_status = 'confirmed'
    ORDER BY c.created_at`).bind(request.id, request.wedding_id, request.event_id).all()
  const credentials = []
  for (const person of [guest, ...(companions.results || [])]) {
    let accessToken = await openGuestCredential(context, person.access_token_ciphertext, person.access_token_iv)
    if (!accessToken) {
      accessToken = encodeToken(crypto.getRandomValues(new Uint8Array(32)))
      const credential = await guestCredentialCipher(context, accessToken)
      await context.env.DB.batch([
        context.env.DB.prepare(`UPDATE guests SET access_token_hash = ?, access_token_ciphertext = ?, access_token_iv = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ? AND wedding_id = ? AND deleted_at IS NULL AND rsvp_status = 'confirmed'`)
        .bind(await tokenHash(accessToken), credential?.ciphertext || null, credential?.iv || null, person.id, request.wedding_id),
        context.env.DB.prepare(`INSERT INTO audit_logs (id, actor_account_id, wedding_id, action, target_type, target_id, details_json)
          VALUES (?, NULL, ?, 'guest_credential_recovered', 'guest', ?, '{}')`)
          .bind(crypto.randomUUID(), request.wedding_id, person.id),
      ])
    }
    credentials.push({
      guestId: person.id,
      name: person.name || '',
      ...(person.companion_request_id ? { companionRequestId: person.companion_request_id } : {}),
      accessUrl: `${new URL(context.req.url).origin}/convidado#convite/${accessToken}`,
    })
  }
  return context.json({ credentials }, 200, { 'Cache-Control': 'no-store' })
})

app.get('/api/invitation/companions', async (context) => {
  const guest = await invitationGuest(context)
  if (!guest || guest.source === 'companion') return jsonError(context, 403, 'companion_management_unavailable')
  const result = await context.env.DB.prepare(`SELECT c.id, c.event_id, c.name, c.email, c.phone, c.status, c.guest_id,
      e.name AS event_name, g.name AS approved_name
    FROM guest_companion_requests c JOIN events e ON e.id = c.event_id AND e.wedding_id = c.wedding_id
    LEFT JOIN guests g ON g.id = c.guest_id AND g.wedding_id = c.wedding_id
    WHERE c.wedding_id = ? AND c.host_guest_id = ? ORDER BY c.created_at`).bind(guest.wedding_id, guest.id).all()
  const policy = await context.env.DB.prepare('SELECT companions_allowed, max_companions FROM wedding_guest_policies WHERE wedding_id = ?').bind(guest.wedding_id).first()
  const total = await context.env.DB.prepare(`SELECT COUNT(*) AS total FROM guest_companion_requests
    WHERE wedding_id = ? AND host_guest_id = ? AND status IN ('pending', 'approved')`).bind(guest.wedding_id, guest.id).first()
  return context.json({ companions: result.results, policy: { companionsAllowed: Boolean(policy?.companions_allowed), maxCompanions: policy?.max_companions || 0 }, remaining: Math.max(0, Math.min(guest.party_size - 1, policy?.max_companions || 0) - (total?.total || 0)) }, 200, { 'Cache-Control': 'no-store' })
})

app.post('/api/invitation/companions', async (context) => {
  const guest = await invitationGuest(context)
  if (!guest || guest.source === 'companion') return jsonError(context, 403, 'companion_management_unavailable')
  const body = await context.req.json().catch(() => null)
  const companions = Array.isArray(body?.companions) ? body.companions : []
  if (!body || !/^[0-9a-f-]{36}$/i.test(body.eventId || '') || !/^[A-Za-z0-9_-]{20,80}$/.test(body.idempotencyKey || '') || !companions.length || companions.length > 19
    || companions.some((item) => !item || typeof item.name !== 'string' || item.name.trim().length > 160 || (item.email && (typeof item.email !== 'string' || item.email.length > 254 || !/^\S+@\S+\.\S+$/.test(item.email))) || (item.phone && (typeof item.phone !== 'string' || item.phone.length > 40)))) return jsonError(context, 400, 'invalid_companion_request')
  const event = await guestCanAccessEvent(context, guest, body.eventId)
  if (!event) return jsonError(context, 404, 'event_not_found')
  const attendance = await guestAttendanceStatus(context, guest.wedding_id, body.eventId, guest.id)
  if (attendance?.rsvp_status !== 'confirmed') return jsonError(context, 409, 'host_not_confirmed')
  const policy = await context.env.DB.prepare('SELECT companions_allowed, max_companions FROM wedding_guest_policies WHERE wedding_id = ?').bind(guest.wedding_id).first()
  const maximum = Math.min(guest.party_size - 1, policy?.max_companions || 0)
  if (!policy?.companions_allowed || companions.length > maximum) return jsonError(context, 400, 'companion_limit_reached')
  const idempotencyHash = await tokenHash(body.idempotencyKey)
  const duplicate = await context.env.DB.prepare(`SELECT id FROM guest_companion_requests WHERE host_guest_id = ? AND idempotency_hash = ?`).bind(guest.id, idempotencyHash).first()
  if (duplicate) return context.json({ duplicate: true, id: duplicate.id }, 200, { 'Cache-Control': 'no-store' })
  const existing = await context.env.DB.prepare(`SELECT COUNT(*) AS total FROM guest_companion_requests
    WHERE wedding_id = ? AND host_guest_id = ? AND status IN ('pending', 'approved')`).bind(guest.wedding_id, guest.id).first()
  if ((existing?.total || 0) + companions.length > maximum) return jsonError(context, 409, 'companion_limit_reached')
  const limit = await allowRsvpRequest(context, guest.id)
  if (!limit.allowed) return context.json({ error: 'too_many_requests' }, 429, { 'Retry-After': String(limit.retryAfter), 'Cache-Control': 'no-store' })
  const challenge = await verifyTurnstile(context, body.turnstileToken, 'rsvp')
  if (!challenge.configured) return jsonError(context, 503, 'turnstile_unavailable')
  if (!challenge.verified) return jsonError(context, 403, 'turnstile_verification_failed')
  const statements = []
  for (const [index, item] of companions.entries()) statements.push(context.env.DB.prepare(`INSERT INTO guest_companion_requests
    (id, wedding_id, event_id, host_guest_id, name, email, phone, idempotency_hash)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
    .bind(crypto.randomUUID(), guest.wedding_id, event.id, guest.id, item.name.trim(), item.email?.trim().toLowerCase() || null, item.phone?.trim() || null, await tokenHash(`${body.idempotencyKey}:${index}`)))
  statements.push(context.env.DB.prepare(`INSERT INTO audit_logs (id, actor_account_id, wedding_id, action, target_type, target_id, details_json)
    VALUES (?, NULL, ?, 'guest_companions_requested', 'guest', ?, ?)`)
    .bind(crypto.randomUUID(), guest.wedding_id, guest.id, JSON.stringify({ eventId: event.id, count: companions.length })))
  await context.env.DB.batch(statements)
  return context.json({ requested: companions.length }, 201, { 'Cache-Control': 'no-store' })
})

app.patch('/api/invitation/companions/:companionId', async (context) => {
  const guest = await invitationGuest(context)
  if (!guest || guest.source === 'companion') return jsonError(context, 403, 'companion_management_unavailable')
  const body = await context.req.json().catch(() => null)
  const name = typeof body?.name === 'string' ? body.name.trim() : ''
  if (!name || name.length > 160) return jsonError(context, 400, 'invalid_companion_name')
  const result = await context.env.DB.prepare(`UPDATE guest_companion_requests SET name = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ? AND wedding_id = ? AND host_guest_id = ? AND status = 'pending'`)
    .bind(name, context.req.param('companionId'), guest.wedding_id, guest.id).run()
  if (!result.meta.changes) return jsonError(context, 404, 'companion_request_not_found')
  return context.json({ id: context.req.param('companionId'), name })
})

app.post('/api/invitation/companions/:companionId/credential', async (context) => {
  const guest = await invitationGuest(context)
  if (!guest || guest.source === 'companion') return jsonError(context, 403, 'companion_management_unavailable')
  if (typeof context.env.GUEST_CREDENTIALS_ENCRYPTION_KEY !== 'string' || context.env.GUEST_CREDENTIALS_ENCRYPTION_KEY.length < 32) return jsonError(context, 503, 'guest_credentials_unavailable')
  const limit = await allowRsvpRequest(context, guest.id)
  if (!limit.allowed) return context.json({ error: 'too_many_requests' }, 429, { 'Retry-After': String(limit.retryAfter), 'Cache-Control': 'no-store' })
  const companion = await context.env.DB.prepare(`SELECT c.id, c.guest_id, c.event_id, g.name, g.access_token_ciphertext, g.access_token_iv
    FROM guest_companion_requests c JOIN guests g ON g.id = c.guest_id AND g.wedding_id = c.wedding_id
    WHERE c.id = ? AND c.wedding_id = ? AND c.host_guest_id = ? AND c.status = 'approved' AND c.guest_id IS NOT NULL AND g.deleted_at IS NULL`)
    .bind(context.req.param('companionId'), guest.wedding_id, guest.id).first()
  if (!companion) return jsonError(context, 404, 'companion_credential_not_found')
  const event = await guestCanAccessEvent(context, guest, companion.event_id)
  const [attendance, companionAttendance] = await Promise.all([
    guestAttendanceStatus(context, guest.wedding_id, companion.event_id, guest.id),
    guestAttendanceStatus(context, guest.wedding_id, companion.event_id, companion.guest_id),
  ])
  if (!event || attendance?.rsvp_status !== 'confirmed' || companionAttendance?.rsvp_status !== 'confirmed') return jsonError(context, 409, 'companion_credential_not_available')
  let token = await openGuestCredential(context, companion.access_token_ciphertext, companion.access_token_iv)
  if (!token) {
    token = encodeToken(crypto.getRandomValues(new Uint8Array(32)))
    const credential = await guestCredentialCipher(context, token)
    await context.env.DB.batch([
      context.env.DB.prepare(`UPDATE guests SET access_token_hash = ?, access_token_ciphertext = ?, access_token_iv = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND wedding_id = ? AND deleted_at IS NULL`)
        .bind(await tokenHash(token), credential?.ciphertext || null, credential?.iv || null, companion.guest_id, guest.wedding_id),
      context.env.DB.prepare(`INSERT INTO audit_logs (id, actor_account_id, wedding_id, action, target_type, target_id, details_json)
        VALUES (?, NULL, ?, 'guest_companion_credential_recovered', 'guest', ?, '{}')`)
        .bind(crypto.randomUUID(), guest.wedding_id, companion.guest_id),
    ])
  }
  return context.json({ accessUrl: `${new URL(context.req.url).origin}/convidado#convite/${token}` }, 200, { 'Cache-Control': 'no-store' })
})

app.get('/api/invitation', async (context) => {
  const guest = await invitationGuest(context)
  if (!guest) return jsonError(context, 401, 'invitation_invalid')
  const publishedEvents = JSON.parse(guest.published_events_json || '[]')
  const invitationConfig = parseSiteConfig(guest.published_site_config_json)
  const invitationShowsGifts = normalizedGiftDisplayMode(invitationConfig) !== 'hidden'
  const invitationShowsPix = Boolean(invitationConfig?.pix?.enabled && invitationConfig.pix.key?.trim() && normalizedPixDisplayMode(invitationConfig) !== 'hidden')
  const [rsvps, gifts, authorizations, guestPolicy] = await Promise.all([
    context.env.DB.prepare('SELECT event_id, status, party_size, dietary_notes FROM guest_rsvps WHERE wedding_id = ? AND guest_id = ?').bind(guest.wedding_id, guest.id).all(),
    context.env.DB.prepare(`SELECT id, gift_type, fulfillment_type, store_url, title, description, amount_cents, goal_cents
      FROM gifts WHERE wedding_id = ? AND status = 'active' AND (? = 1) AND (? = 1 OR fulfillment_type = 'store_link') ORDER BY display_order, created_at`).bind(guest.wedding_id, invitationShowsGifts ? 1 : 0, invitationShowsPix ? 1 : 0).all(),
    context.env.DB.prepare('SELECT event_id, status FROM guest_event_authorizations WHERE wedding_id = ? AND guest_id = ?').bind(guest.wedding_id, guest.id).all(),
    context.env.DB.prepare('SELECT companions_allowed, max_companions FROM wedding_guest_policies WHERE wedding_id = ?').bind(guest.wedding_id).first(),
  ])
  const eventAuthorization = new Map(authorizations.results.map((item) => [item.event_id, item.status]))
  const guestEvents = publishedEvents.filter((event) => eventAuthorization.get(event.id) !== 'revoked' && (eventAuthorization.get(event.id) === 'authorized' || !event.group_ids.length || event.group_ids.includes(guest.group_id)))
  return context.json({
    guest: { id: guest.id, name: guest.name, partySize: guest.party_size, guestType: guest.guest_type },
    wedding: { partnerOneName: guest.partner_one_name, partnerTwoName: guest.partner_two_name, eventDate: guest.event_date, eventTime: guest.event_time, timezone: guest.timezone },
    siteConfig: publicSiteConfig(invitationConfig),
    events: guestEvents.map((event) => {
      const publicEvent = { ...event }
      delete publicEvent.group_ids
      return { ...publicEvent, rsvp: rsvps.results.find((rsvp) => rsvp.event_id === event.id) || null }
    }),
    guestPolicy: { companionsAllowed: Boolean(guestPolicy?.companions_allowed), maxCompanions: guestPolicy?.max_companions || 0 },
    gifts: gifts.results,
    wallets: { apple: walletReady(context.env, 'apple'), google: walletReady(context.env, 'google') },
  })
})

app.post('/api/invitation/wallet/google', async (context) => {
  const guest = await invitationGuest(context)
  if (!guest) return jsonError(context, 401, 'invitation_invalid')
  if (!walletReady(context.env, 'google')) return jsonError(context, 503, 'wallet_not_configured')
  const token = (context.req.header('Authorization') || '').slice(7)
  const events = await invitationEvents(context, guest)
  const wedding = { id: guest.wedding_id, partner_one_name: guest.partner_one_name, partner_two_name: guest.partner_two_name, event_date: guest.event_date, event_time: guest.event_time }
  try {
    const url = await googleWalletUrl(context.env, guest, wedding, token, events)
    if (url.length > 1800) return jsonError(context, 422, 'wallet_pass_too_large')
    return context.json({ url }, 200, { 'Cache-Control': 'no-store' })
  } catch {
    return jsonError(context, 503, 'wallet_unavailable')
  }
})

app.post('/api/invitation/wallet/apple', async (context) => {
  const guest = await invitationGuest(context)
  if (!guest) return jsonError(context, 401, 'invitation_invalid')
  if (!walletReady(context.env, 'apple')) return jsonError(context, 503, 'wallet_not_configured')
  const token = (context.req.header('Authorization') || '').slice(7)
  const events = await invitationEvents(context, guest)
  const wedding = { id: guest.wedding_id, partner_one_name: guest.partner_one_name, partner_two_name: guest.partner_two_name, event_date: guest.event_date, event_time: guest.event_time }
  try {
    const pass = await appleWalletPass(context.env, guest, wedding, token, events)
    const filename = `convite-${guest.id}.pkpass`
    return new Response(pass, { headers: { 'Content-Type': 'application/vnd.apple.pkpass', 'Content-Disposition': `attachment; filename="${filename}"`, 'Cache-Control': 'no-store' } })
  } catch {
    return jsonError(context, 503, 'wallet_unavailable')
  }
})

app.get('/api/invitation/photos', async (context) => {
  const guest = await invitationGuest(context)
  if (!guest) return jsonError(context, 401, 'invitation_invalid')
  const config = parseSiteConfig(guest.published_site_config_json)
  if (!config?.guestCamera?.enabled) return jsonError(context, 404, 'guest_camera_unavailable')
  const current = await context.env.DB.prepare('SELECT COUNT(*) AS total FROM guest_photos WHERE wedding_id = ?').bind(guest.wedding_id).first()
  return context.json({ saved: current?.total || 0, limit: config.guestCamera.photoLimit, remaining: Math.max(0, config.guestCamera.photoLimit - (current?.total || 0)), consented: Boolean(guest.photo_consent_at) })
})

app.post('/api/invitation/photos/consent', async (context) => {
  const guest = await invitationGuest(context)
  if (!guest) return jsonError(context, 401, 'invitation_invalid')
  const config = parseSiteConfig(guest.published_site_config_json)
  if (!config?.guestCamera?.enabled) return jsonError(context, 404, 'guest_camera_unavailable')
  const body = await context.req.json().catch(() => null)
  if (body?.accepted !== true) return jsonError(context, 400, 'photo_consent_required')
  await context.env.DB.prepare(`UPDATE guests SET photo_consent_at = COALESCE(photo_consent_at, CURRENT_TIMESTAMP), photo_consent_version = COALESCE(photo_consent_version, ?) WHERE id = ? AND wedding_id = ?`).bind(guestPhotoConsentVersion, guest.id, guest.wedding_id).run()
  return context.json({ consented: true })
})

app.post('/api/invitation/photos', async (context) => {
  const guest = await invitationGuest(context)
  if (!guest) return jsonError(context, 401, 'invitation_invalid')
  const config = parseSiteConfig(guest.published_site_config_json)
  if (!config?.guestCamera?.enabled) return jsonError(context, 404, 'guest_camera_unavailable')
  if (!guest.photo_consent_at) return jsonError(context, 403, 'photo_consent_required')
  if (!context.env.GUEST_PHOTOS) return jsonError(context, 503, 'photo_storage_unavailable')
  const contentLength = Number(context.req.header('Content-Length') || 0)
  if (contentLength > 7_000_000) return jsonError(context, 413, 'photo_too_large')
  const body = await context.req.parseBody().catch(() => null)
  const photo = body?.photo
  const eventId = typeof body?.eventId === 'string' ? body.eventId : ''
  if (!(photo instanceof File) || photo.size < 1 || photo.size > 6_291_456) return jsonError(context, 400, 'invalid_photo')
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(photo.type)) return jsonError(context, 400, 'unsupported_photo_type')
  const event = await guestCanAccessEvent(context, guest, eventId)
  if (!event) return jsonError(context, 404, 'event_not_found')
  const current = await context.env.DB.prepare('SELECT COUNT(*) AS total FROM guest_photos WHERE wedding_id = ?').bind(guest.wedding_id).first()
  if ((current?.total || 0) >= config.guestCamera.photoLimit) return jsonError(context, 409, 'photo_limit_reached')
  const bytes = new Uint8Array(await photo.arrayBuffer())
  const jpeg = bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255
  const png = bytes[0] === 137 && bytes[1] === 80 && bytes[2] === 78 && bytes[3] === 71 && bytes[4] === 13 && bytes[5] === 10 && bytes[6] === 26 && bytes[7] === 10
  const webp = String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF' && String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP'
  if (!(photo.type === 'image/jpeg' && jpeg) && !(photo.type === 'image/png' && png) && !(photo.type === 'image/webp' && webp)) return jsonError(context, 400, 'invalid_photo_content')
  const id = crypto.randomUUID()
  const extension = photo.type === 'image/jpeg' ? 'jpg' : photo.type === 'image/png' ? 'png' : 'webp'
  const objectKey = `${guest.wedding_id}/${eventId}/${guest.id}/${id}.${extension}`
  try {
    await context.env.GUEST_PHOTOS.put(objectKey, bytes, { httpMetadata: { contentType: photo.type, cacheControl: 'private, no-store' }, customMetadata: { weddingId: guest.wedding_id, guestId: guest.id, eventId } })
  } catch (error) {
    console.error('guest_photo_storage_failed', { weddingId: guest.wedding_id, eventId, error: error instanceof Error ? error.message : 'unknown' })
    return jsonError(context, 503, 'photo_storage_failed')
  }
  try {
    const result = await context.env.DB.prepare(`
      INSERT INTO guest_photos (id, wedding_id, event_id, guest_id, object_key, content_type, size_bytes)
      SELECT ?, ?, ?, ?, ?, ?, ? WHERE (
        SELECT COUNT(*) FROM guest_photos WHERE wedding_id = ?
      ) < ?
    `).bind(id, guest.wedding_id, eventId, guest.id, objectKey, photo.type, photo.size, guest.wedding_id, config.guestCamera.photoLimit).run()
    if (!result.meta.changes) {
      await context.env.GUEST_PHOTOS.delete(objectKey)
      return jsonError(context, 409, 'photo_limit_reached')
    }
  } catch (error) {
    await context.env.GUEST_PHOTOS.delete(objectKey)
    console.error('guest_photo_record_failed', { weddingId: guest.wedding_id, eventId, error: error instanceof Error ? error.message : 'unknown' })
    return jsonError(context, 500, 'photo_save_failed')
  }
  return context.json({ saved: true }, 201)
})

app.get('/api/couple/weddings/:weddingId/photos', requireSession, async (context) => {
  const weddingId = context.req.param('weddingId')
  const membership = await weddingMembership(context, weddingId, ['couple_admin'])
  if (!membership) return jsonError(context, 404, 'wedding_not_found')
  const result = await context.env.DB.prepare(`
    SELECT p.id, p.event_id, e.name AS event_name, g.name AS guest_name, p.content_type, p.size_bytes, p.created_at
    FROM guest_photos p JOIN events e ON e.id = p.event_id JOIN guests g ON g.id = p.guest_id
    WHERE p.wedding_id = ? ORDER BY p.created_at DESC
  `).bind(weddingId).all()
  return context.json({ photos: result.results }, 200, { 'Cache-Control': 'no-store' })
})

app.get('/api/couple/weddings/:weddingId/photos/:photoId/image', requireSession, async (context) => {
  const weddingId = context.req.param('weddingId')
  const membership = await weddingMembership(context, weddingId, ['couple_admin'])
  if (!membership || !context.env.GUEST_PHOTOS) return jsonError(context, 404, 'photo_not_found')
  const photo = await context.env.DB.prepare('SELECT object_key, content_type FROM guest_photos WHERE id = ? AND wedding_id = ?').bind(context.req.param('photoId'), weddingId).first()
  if (!photo) return jsonError(context, 404, 'photo_not_found')
  const object = await context.env.GUEST_PHOTOS.get(photo.object_key)
  if (!object) return jsonError(context, 404, 'photo_not_found')
  context.header('Content-Type', photo.content_type)
  context.header('Cache-Control', 'private, no-store')
  context.header('Content-Disposition', 'inline')
  context.header('X-Content-Type-Options', 'nosniff')
  return context.body(object.body)
})

app.delete('/api/couple/weddings/:weddingId/photos/:photoId', requireSession, async (context) => {
  const weddingId = context.req.param('weddingId')
  const membership = await weddingMembership(context, weddingId, ['couple_admin'])
  if (!membership) return jsonError(context, 404, 'wedding_not_found')
  const photo = await context.env.DB.prepare('SELECT object_key FROM guest_photos WHERE id = ? AND wedding_id = ?').bind(context.req.param('photoId'), weddingId).first()
  if (!photo) return jsonError(context, 404, 'photo_not_found')
  await context.env.DB.batch([
    context.env.DB.prepare('DELETE FROM guest_photos WHERE id = ? AND wedding_id = ?').bind(context.req.param('photoId'), weddingId),
    context.env.DB.prepare(`INSERT INTO audit_logs (id, actor_account_id, wedding_id, action, target_type, target_id, details_json)
      VALUES (?, ?, ?, 'guest_photo_deleted', 'guest_photo', ?, '{}')`).bind(crypto.randomUUID(), context.get('session').account_id, weddingId, context.req.param('photoId')),
  ])
  await context.env.GUEST_PHOTOS?.delete(photo.object_key)
  return context.json({ deleted: true })
})

app.post('/api/invitation/rsvp', async (context) => {
  const guest = await invitationGuest(context)
  if (!guest) return jsonError(context, 401, 'invitation_invalid')
  const body = await context.req.json().catch(() => null)
  if (!body || typeof body.eventId !== 'string' || !['confirmed', 'declined'].includes(body.status) || body.partySize !== 1 || guest.party_size < 1 || (body.dietaryNotes && (typeof body.dietaryNotes !== 'string' || body.dietaryNotes.length > 1000))) return jsonError(context, 400, 'invalid_rsvp')
  const limit = await allowRsvpRequest(context, guest.id)
  if (!limit.allowed) return context.json({ error: 'too_many_requests' }, 429, { 'Retry-After': String(limit.retryAfter), 'Cache-Control': 'no-store' })
  const challenge = await verifyTurnstile(context, body.turnstileToken)
  if (!challenge.configured) return jsonError(context, 503, 'turnstile_unavailable')
  if (!challenge.verified) return jsonError(context, 403, 'turnstile_verification_failed')
  const event = await guestCanAccessEvent(context, guest, body.eventId)
  if (!event) return jsonError(context, 404, 'event_not_found')
  await context.env.DB.batch([
    context.env.DB.prepare(`INSERT INTO guest_rsvps (id, wedding_id, event_id, guest_id, status, party_size, dietary_notes, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(event_id, guest_id) DO UPDATE SET status = excluded.status, party_size = excluded.party_size, dietary_notes = excluded.dietary_notes, updated_at = CURRENT_TIMESTAMP`)
      .bind(crypto.randomUUID(), guest.wedding_id, event.id, guest.id, body.status, body.partySize, body.dietaryNotes || null),
  ])
  return context.json({ eventId: event.id, status: body.status, partySize: body.partySize })
})

app.get('/api/godparent/tasks', async (context) => {
  const guest = await invitationGuest(context)
  if (!guest || guest.guest_type !== 'godparent') return jsonError(context, 403, 'godparent_access_required')
  const result = await context.env.DB.prepare(`
    SELECT id, title, details, due_at, status FROM godparent_tasks
    WHERE wedding_id = ? AND guest_id = ? ORDER BY due_at
  `).bind(guest.wedding_id, guest.id).all()
  return context.json({ tasks: result.results })
})

app.patch('/api/godparent/tasks/:taskId', async (context) => {
  const guest = await invitationGuest(context)
  if (!guest || guest.guest_type !== 'godparent') return jsonError(context, 403, 'godparent_access_required')
  const body = await context.req.json().catch(() => null)
  if (typeof body?.done !== 'boolean') return jsonError(context, 400, 'invalid_task_status')
  const result = await context.env.DB.prepare(`
    UPDATE godparent_tasks SET status = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ? AND wedding_id = ? AND guest_id = ?
  `).bind(body.done ? 'done' : 'open', context.req.param('taskId'), guest.wedding_id, guest.id).run()
  if (!result.meta.changes) return jsonError(context, 404, 'task_not_found')
  return context.json({ id: context.req.param('taskId'), done: body.done })
})

app.get('/api/staff/events', requireSession, async (context) => {
  const result = await context.env.DB.prepare(`
    SELECT DISTINCT e.id, e.wedding_id, e.name, e.event_type, e.starts_at, e.venue_name, m.role
    FROM membership_event_access a JOIN events e ON e.id = a.event_id
    JOIN wedding_memberships m ON m.id = a.membership_id AND m.wedding_id = e.wedding_id
    JOIN weddings w ON w.id = e.wedding_id
    WHERE m.account_id = ? AND m.status = 'active' AND m.role IN ('event_staff', 'checkin_staff') AND w.status = 'active'
    ORDER BY e.starts_at
  `).bind(context.get('session').account_id).all()
  return context.json({ events: result.results }, 200, { 'Cache-Control': 'no-store' })
})

app.get('/api/staff/events/:eventId/guests', requireSession, async (context) => {
  const eventId = context.req.param('eventId')
  const assignment = await assignedStaff(context, eventId, ['event_staff', 'checkin_staff'])
  if (!assignment) return jsonError(context, 404, 'event_not_found')
  if (assignment.role === 'event_staff') {
    const result = await context.env.DB.prepare(`
      SELECT g.id, g.name
      FROM guests g
      WHERE g.wedding_id = ? AND g.deleted_at IS NULL AND (
        NOT EXISTS (SELECT 1 FROM event_group_access x WHERE x.event_id = ?)
        OR EXISTS (SELECT 1 FROM event_group_access x WHERE x.event_id = ? AND x.group_id = g.group_id)
      ) ORDER BY g.name COLLATE NOCASE
    `).bind(assignment.wedding_id, eventId, eventId).all()
    return context.json({ guests: result.results, walkIns: [] }, 200, { 'Cache-Control': 'no-store' })
  }
  const result = await context.env.DB.prepare(`
    SELECT g.id, g.name, COALESCE(r.party_size, g.party_size) AS party_size,
      COALESCE(r.status, g.rsvp_status) AS rsvp_status, COALESCE(r.dietary_notes, g.dietary_notes) AS dietary_notes,
      gg.name AS group_name, c.checked_in_at
    FROM guests g LEFT JOIN guest_groups gg ON gg.id = g.group_id
    LEFT JOIN guest_rsvps r ON r.guest_id = g.id AND r.event_id = ?
    LEFT JOIN check_ins c ON c.guest_id = g.id AND c.event_id = ?
    WHERE g.wedding_id = ? AND g.deleted_at IS NULL
      AND NOT EXISTS (SELECT 1 FROM guest_event_authorizations x WHERE x.event_id = ? AND x.guest_id = g.id AND x.status = 'revoked')
      AND (EXISTS (SELECT 1 FROM guest_event_authorizations x WHERE x.event_id = ? AND x.guest_id = g.id AND x.status = 'authorized')
        OR NOT EXISTS (SELECT 1 FROM event_group_access x WHERE x.event_id = ?)
        OR EXISTS (SELECT 1 FROM event_group_access x WHERE x.event_id = ? AND x.group_id = g.group_id))
      AND (g.source != 'companion' OR EXISTS (
        SELECT 1 FROM guest_companion_requests c
        LEFT JOIN guest_rsvp_requests pr ON pr.id = c.rsvp_request_id AND pr.wedding_id = c.wedding_id
        JOIN guests h ON h.id = COALESCE(c.host_guest_id, pr.guest_id) AND h.wedding_id = c.wedding_id
        LEFT JOIN guest_rsvps hr ON hr.guest_id = h.id AND hr.event_id = c.event_id
        WHERE c.guest_id = g.id AND c.event_id = ? AND c.status = 'approved'
          AND (c.host_guest_id IS NOT NULL OR pr.review_status = 'approved') AND COALESCE(hr.status, h.rsvp_status) = 'confirmed'
      ))
    ORDER BY g.name COLLATE NOCASE
  `).bind(eventId, eventId, assignment.wedding_id, eventId, eventId, eventId, eventId, eventId).all()
  const walkIns = await context.env.DB.prepare(`
    SELECT id, manual_name AS name, party_size, dietary_notes, checked_in_at
    FROM check_ins WHERE event_id = ? AND wedding_id = ? AND guest_id IS NULL ORDER BY checked_in_at
  `).bind(eventId, assignment.wedding_id).all()
  return context.json({ guests: result.results, walkIns: walkIns.results }, 200, { 'Cache-Control': 'no-store' })
})

app.post('/api/staff/events/:eventId/scan', requireSession, async (context) => {
  const eventId = context.req.param('eventId')
  const assignment = await assignedStaff(context, eventId, ['checkin_staff'])
  if (!assignment) return jsonError(context, 404, 'event_not_found')
  const body = await context.req.json().catch(() => null)
  const token = typeof body?.token === 'string' ? body.token : ''
  if (!/^[A-Za-z0-9_-]{40,60}$/.test(token)) return jsonError(context, 400, 'invalid_invitation')
  const guest = await context.env.DB.prepare(`
    SELECT g.id, g.name, COALESCE(r.party_size, g.party_size) AS party_size,
      COALESCE(r.status, g.rsvp_status) AS rsvp_status, gg.name AS group_name
    FROM guests g LEFT JOIN guest_groups gg ON gg.id = g.group_id
    LEFT JOIN guest_rsvps r ON r.guest_id = g.id AND r.event_id = ?
    WHERE g.access_token_hash = ? AND g.wedding_id = ? AND g.deleted_at IS NULL AND (
      EXISTS (SELECT 1 FROM guest_event_authorizations x WHERE x.wedding_id = g.wedding_id AND x.event_id = ? AND x.guest_id = g.id AND x.status = 'authorized')
      OR NOT EXISTS (SELECT 1 FROM event_group_access x WHERE x.event_id = ?)
      OR EXISTS (SELECT 1 FROM event_group_access x WHERE x.event_id = ? AND x.group_id = g.group_id)
    )
  `).bind(eventId, await tokenHash(token), assignment.wedding_id, eventId, eventId, eventId).first()
  if (!guest) return jsonError(context, 404, 'invitation_not_found')
  const visibleGuest = await staffCanSeeGuest(context, eventId, assignment.wedding_id, guest.id)
  if (!visibleGuest) return jsonError(context, 404, 'invitation_not_found')
  if (guest.rsvp_status === 'declined') return jsonError(context, 409, 'invitation_declined')
  if (guest.rsvp_status !== 'confirmed') return jsonError(context, 409, 'invitation_not_confirmed')
  const existing = await context.env.DB.prepare('SELECT checked_in_at FROM check_ins WHERE wedding_id = ? AND event_id = ? AND guest_id = ?').bind(assignment.wedding_id, eventId, guest.id).first()
  if (existing) return context.json({ error: 'already_checked_in', checkedInAt: existing.checked_in_at }, 409, { 'Cache-Control': 'no-store' })
  const id = crypto.randomUUID()
  try {
    await context.env.DB.prepare('INSERT INTO check_ins (id, wedding_id, event_id, guest_id, checked_in_by) VALUES (?, ?, ?, ?, ?)')
      .bind(id, assignment.wedding_id, eventId, guest.id, context.get('session').account_id).run()
  } catch {
    const previous = await context.env.DB.prepare('SELECT checked_in_at FROM check_ins WHERE wedding_id = ? AND event_id = ? AND guest_id = ?').bind(assignment.wedding_id, eventId, guest.id).first()
    return context.json({ error: 'already_checked_in', checkedInAt: previous?.checked_in_at || null }, 409, { 'Cache-Control': 'no-store' })
  }
  return context.json({ id, checkedIn: true, guest: { id: guest.id, name: guest.name, partySize: guest.party_size, groupName: guest.group_name } }, 201)
})

app.post('/api/staff/events/:eventId/checkins', requireSession, async (context) => {
  const eventId = context.req.param('eventId')
  const assignment = await assignedStaff(context, eventId, ['checkin_staff'])
  if (!assignment) return jsonError(context, 404, 'event_not_found')
  const body = await context.req.json().catch(() => null)
  if (!body) return jsonError(context, 400, 'invalid_checkin')
  const id = crypto.randomUUID()
  if (typeof body.guestId === 'string') {
    const guest = await staffCanSeeGuest(context, eventId, assignment.wedding_id, body.guestId)
    if (!guest) return jsonError(context, 404, 'guest_not_found')
    if (guest.rsvp_status === 'declined') return jsonError(context, 409, 'invitation_declined')
    if (guest.rsvp_status !== 'confirmed') return jsonError(context, 409, 'invitation_not_confirmed')
    const existing = await context.env.DB.prepare('SELECT id FROM check_ins WHERE wedding_id = ? AND event_id = ? AND guest_id = ?').bind(assignment.wedding_id, eventId, body.guestId).first()
    if (existing) return jsonError(context, 409, 'already_checked_in')
    try {
      await context.env.DB.prepare('INSERT INTO check_ins (id, wedding_id, event_id, guest_id, checked_in_by) VALUES (?, ?, ?, ?, ?)')
        .bind(id, assignment.wedding_id, eventId, body.guestId, context.get('session').account_id).run()
    } catch {
      return jsonError(context, 409, 'already_checked_in')
    }
    return context.json({ id, checkedIn: true }, 201)
  }
  const manualName = typeof body.name === 'string' ? body.name.trim() : ''
  const partySize = body.partySize
  const dietaryNotes = typeof body.dietaryNotes === 'string' && body.dietaryNotes.trim() ? body.dietaryNotes.trim() : null
  if (!manualName || manualName.length > 160 || !Number.isInteger(partySize) || partySize < 1 || partySize > 20 || (dietaryNotes && dietaryNotes.length > 1000)) return jsonError(context, 400, 'invalid_walk_in')
  await context.env.DB.prepare('INSERT INTO check_ins (id, wedding_id, event_id, checked_in_by, manual_name, party_size, dietary_notes) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .bind(id, assignment.wedding_id, eventId, context.get('session').account_id, manualName, partySize, dietaryNotes).run()
  return context.json({ id, checkedIn: true, walkIn: true, partySize }, 201)
})

app.get('/api/staff/events/:eventId/offline-roster', requireSession, async (context) => {
  const eventId = context.req.param('eventId')
  const assignment = await assignedStaff(context, eventId, ['checkin_staff'])
  if (!assignment) return jsonError(context, 404, 'event_not_found')
  const [result, walkIns] = await Promise.all([context.env.DB.prepare(`
    SELECT g.id, g.name, g.access_token_hash, COALESCE(r.party_size, g.party_size) AS party_size,
      gg.name AS group_name, COALESCE(r.status, g.rsvp_status) AS rsvp_status,
      COALESCE(r.dietary_notes, g.dietary_notes) AS dietary_notes, c.checked_in_at
    FROM guests g LEFT JOIN guest_groups gg ON gg.id = g.group_id
    LEFT JOIN guest_rsvps r ON r.guest_id = g.id AND r.event_id = ?
    LEFT JOIN check_ins c ON c.guest_id = g.id AND c.event_id = ?
    WHERE g.wedding_id = ? AND g.deleted_at IS NULL AND g.access_token_hash IS NOT NULL
      AND COALESCE(r.status, g.rsvp_status) = 'confirmed'
      AND NOT EXISTS (SELECT 1 FROM guest_event_authorizations x WHERE x.event_id = ? AND x.guest_id = g.id AND x.status = 'revoked')
      AND (EXISTS (SELECT 1 FROM guest_event_authorizations x WHERE x.event_id = ? AND x.guest_id = g.id AND x.status = 'authorized')
        OR NOT EXISTS (SELECT 1 FROM event_group_access x WHERE x.event_id = ?)
        OR EXISTS (SELECT 1 FROM event_group_access x WHERE x.event_id = ? AND x.group_id = g.group_id))
      AND (g.source != 'companion' OR EXISTS (
        SELECT 1 FROM guest_companion_requests c
        LEFT JOIN guest_rsvp_requests pr ON pr.id = c.rsvp_request_id AND pr.wedding_id = c.wedding_id
        JOIN guests h ON h.id = COALESCE(c.host_guest_id, pr.guest_id) AND h.wedding_id = c.wedding_id
        LEFT JOIN guest_rsvps hr ON hr.guest_id = h.id AND hr.event_id = c.event_id
        WHERE c.guest_id = g.id AND c.event_id = ? AND c.status = 'approved'
          AND (c.host_guest_id IS NOT NULL OR pr.review_status = 'approved') AND COALESCE(hr.status, h.rsvp_status) = 'confirmed'
      ))
    ORDER BY g.name COLLATE NOCASE
  `).bind(eventId, eventId, assignment.wedding_id, eventId, eventId, eventId, eventId, eventId).all(), context.env.DB.prepare(`
    SELECT id, manual_name AS name, party_size, dietary_notes, checked_in_at
    FROM check_ins WHERE event_id = ? AND wedding_id = ? AND guest_id IS NULL ORDER BY checked_in_at
  `).bind(eventId, assignment.wedding_id).all()])
  return context.json({ guests: result.results, walkIns: walkIns.results }, 200, { 'Cache-Control': 'no-store' })
})

app.post('/api/staff/events/:eventId/checkins/sync', requireSession, async (context) => {
  const eventId = context.req.param('eventId')
  const assignment = await assignedStaff(context, eventId, ['checkin_staff'])
  if (!assignment) return jsonError(context, 404, 'event_not_found')
  const body = await context.req.json().catch(() => null)
  if (!Array.isArray(body?.entries) || body.entries.length > 100) return jsonError(context, 400, 'invalid_sync_batch')
  const results = []
  for (const entry of body.entries) {
    if (!entry || typeof entry.id !== 'string' || !/^[A-Za-z0-9-]{36}$/.test(entry.id)) {
      results.push({ id: entry?.id || null, status: 'invalid' })
      continue
    }
    const previous = await context.env.DB.prepare('SELECT id, guest_id, checked_in_by FROM check_ins WHERE id = ? AND event_id = ? AND wedding_id = ?').bind(entry.id, eventId, assignment.wedding_id).first()
    if (previous) {
      results.push({ id: entry.id, status: previous.checked_in_by === context.get('session').account_id ? 'synced' : 'already_checked_in' })
      continue
    }
    if (typeof entry.guestId === 'string') {
      const guest = await staffCanSeeGuest(context, eventId, assignment.wedding_id, entry.guestId)
      if (!guest) {
        results.push({ id: entry.id, status: 'guest_not_found' })
        continue
      }
      if (guest.rsvp_status === 'declined') {
        results.push({ id: entry.id, guestId: guest.id, status: 'invitation_declined' })
        continue
      }
      if (guest.rsvp_status !== 'confirmed') {
        results.push({ id: entry.id, guestId: guest.id, status: 'invitation_not_confirmed' })
        continue
      }
      try {
        const inserted = await context.env.DB.prepare('INSERT INTO check_ins (id, wedding_id, event_id, guest_id, checked_in_by) VALUES (?, ?, ?, ?, ?)')
          .bind(entry.id, assignment.wedding_id, eventId, guest.id, context.get('session').account_id).run()
        results.push({ id: entry.id, guestId: guest.id, status: inserted.meta.changes ? 'synced' : 'already_checked_in' })
      } catch {
        results.push({ id: entry.id, guestId: guest.id, status: 'already_checked_in' })
      }
      continue
    }
    const name = typeof entry.name === 'string' ? entry.name.trim() : ''
    const partySize = entry.partySize
    const dietaryNotes = typeof entry.dietaryNotes === 'string' && entry.dietaryNotes.trim() ? entry.dietaryNotes.trim() : null
    if (!name || name.length > 160 || !Number.isInteger(partySize) || partySize < 1 || partySize > 20 || (dietaryNotes && dietaryNotes.length > 1000)) {
      results.push({ id: entry.id, status: 'invalid' })
      continue
    }
    try {
      await context.env.DB.prepare('INSERT INTO check_ins (id, wedding_id, event_id, checked_in_by, manual_name, party_size, dietary_notes) VALUES (?, ?, ?, ?, ?, ?, ?)')
        .bind(entry.id, assignment.wedding_id, eventId, context.get('session').account_id, name, partySize, dietaryNotes).run()
      results.push({ id: entry.id, status: 'synced' })
    } catch {
      results.push({ id: entry.id, status: 'sync_conflict' })
    }
  }
  return context.json({ results }, 200, { 'Cache-Control': 'no-store' })
})

app.post('/api/superadmin/mfa/enroll', requireSession, requireSuperadminIdentity, async (context) => {
  try {
    const enrollment = await startTotpEnrollment(context, context.get('actorId'), context.get('session').email)
    if (!enrollment) return jsonError(context, 409, 'mfa_already_enabled')
    return context.json(enrollment)
  } catch {
    return jsonError(context, 503, 'mfa_setup_unavailable')
  }
})

app.post('/api/superadmin/mfa/confirm', requireSession, requireSuperadminIdentity, async (context) => {
  const body = await context.req.json().catch(() => null)
  if (!body || typeof body.code !== 'string') return jsonError(context, 400, 'invalid_request')
  const session = context.get('session')
  const retryAfter = await checkLoginLimit(context, session.email)
  if (retryAfter) return context.json({ error: 'too_many_attempts' }, 429, { 'Retry-After': String(retryAfter), 'Cache-Control': 'no-store' })
  const actorId = context.get('actorId')
  const enrolled = await confirmTotpEnrollment(context, actorId, body.code)
  if (!enrolled) {
    const limit = await recordLoginFailure(context, session.email)
    if (limit.blocked) return context.json({ error: 'too_many_attempts' }, 429, { 'Retry-After': String(limit.retryAfter), 'Cache-Control': 'no-store' })
    return jsonError(context, 400, 'invalid_mfa_code')
  }
  await clearLoginFailures(context, session.email)
  const now = new Date().toISOString()
  await context.env.DB.batch([
    context.env.DB.prepare('UPDATE auth_sessions SET mfa_verified_at = ? WHERE id = ? AND revoked_at IS NULL').bind(now, session.id),
    context.env.DB.prepare('UPDATE auth_sessions SET revoked_at = ? WHERE account_id = ? AND id != ? AND revoked_at IS NULL').bind(now, session.account_id, session.id),
    context.env.DB.prepare(`INSERT INTO audit_logs (id, actor_account_id, action, target_type, target_id, details_json)
      VALUES (?, ?, 'account_mfa_enabled', 'account', ?, '{}')`).bind(crypto.randomUUID(), actorId, actorId),
  ])
  return context.json({ mfaEnabled: true })
})

app.get('/api/superadmin/overview', requireSession, requireSuperadmin, async (context) => {
  const auditPage = Number(context.req.query('auditPage') || 1)
  if (!Number.isSafeInteger(auditPage) || auditPage < 1 || auditPage > 10000) return jsonError(context, 400, 'invalid_page')
  const auditLimit = 20
  const auditOffset = (auditPage - 1) * auditLimit
  const [accounts, weddings, guests, audit, auditCount] = await Promise.all([
    context.env.DB.prepare("SELECT COUNT(*) AS total, SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) AS active FROM accounts WHERE status != 'deleted'").first(),
    context.env.DB.prepare("SELECT COUNT(*) AS total, SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) AS active FROM weddings WHERE status != 'deleted'").first(),
    context.env.DB.prepare('SELECT COUNT(*) AS total FROM guests WHERE deleted_at IS NULL').first(),
    context.env.DB.prepare(`
      SELECT l.action, l.target_type, l.target_id, l.created_at, a.email AS actor_email
      FROM audit_logs l LEFT JOIN accounts a ON a.id = l.actor_account_id
      ORDER BY l.created_at DESC, l.id DESC LIMIT ? OFFSET ?
    `).bind(auditLimit, auditOffset).all(),
    context.env.DB.prepare('SELECT COUNT(*) AS total FROM audit_logs').first(),
  ])
  return context.json({ accounts, weddings, guests, audit: audit.results, auditPage, auditTotal: auditCount.total, auditHasMore: auditCount.total > auditOffset + audit.results.length })
})

app.get('/api/superadmin/accounts', requireSession, requireSuperadmin, async (context) => {
  const page = Number(context.req.query('page') || 1)
  if (!Number.isSafeInteger(page) || page < 1 || page > 1000) return jsonError(context, 400, 'invalid_page')
  const limit = 50
  const offset = (page - 1) * limit
  const [result, count] = await Promise.all([context.env.DB.prepare(`
    SELECT a.id, a.email, a.status, a.email_verified_at, a.created_at, a.last_login_at,
      EXISTS (SELECT 1 FROM platform_admins p WHERE p.account_id = a.id AND p.role = 'superadmin') AS is_superadmin,
      (SELECT COUNT(*) FROM wedding_memberships m WHERE m.account_id = a.id AND m.status = 'active') AS wedding_count
    FROM accounts a WHERE a.status != 'deleted'
    ORDER BY a.created_at DESC LIMIT ? OFFSET ?
  `).bind(limit, offset).all(), context.env.DB.prepare("SELECT COUNT(*) AS total FROM accounts WHERE status != 'deleted'").first()])
  return context.json({ accounts: result.results, page, limit, total: count.total, hasMore: count.total > offset + result.results.length })
})

app.get('/api/superadmin/weddings', requireSession, requireSuperadmin, async (context) => {
  const page = Number(context.req.query('page') || 1)
  if (!Number.isSafeInteger(page) || page < 1 || page > 1000) return jsonError(context, 400, 'invalid_page')
  const limit = 50
  const offset = (page - 1) * limit
  const [result, count] = await Promise.all([context.env.DB.prepare(`
    SELECT w.id, w.slug, w.partner_one_name, w.partner_two_name, w.event_date, w.status, w.created_at,
      a.email AS owner_email,
      (SELECT COUNT(*) FROM guests g WHERE g.wedding_id = w.id AND g.deleted_at IS NULL) AS guest_count
    FROM weddings w JOIN accounts a ON a.id = w.owner_account_id
    WHERE w.status != 'deleted'
    ORDER BY w.created_at DESC LIMIT ? OFFSET ?
  `).bind(limit, offset).all(), context.env.DB.prepare("SELECT COUNT(*) AS total FROM weddings WHERE status != 'deleted'").first()])
  return context.json({ weddings: result.results, page, limit, total: count.total, hasMore: count.total > offset + result.results.length })
})

app.post('/api/superadmin/wedding-invitations', requireSession, requireSuperadmin, async (context) => {
  const body = await context.req.json().catch(() => null)
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''
  const partnerOneName = typeof body?.partnerOneName === 'string' ? body.partnerOneName.trim() : ''
  const partnerTwoName = typeof body?.partnerTwoName === 'string' ? body.partnerTwoName.trim() : ''
  const slug = typeof body?.slug === 'string' ? body.slug.trim().toLowerCase() : ''
  const eventDate = body?.eventDate || null
  const reservedSlugs = ['www', 'app', 'api', 'admin', 'painel', 'status', 'mail']
  const slugIsValid = /^[a-z0-9](?:[a-z0-9-]{1,28}[a-z0-9])$/.test(slug) && !reservedSlugs.includes(slug)
  const parsedEventDate = typeof eventDate === 'string' ? new Date(`${eventDate}T00:00:00.000Z`) : null
  const dateIsValid = eventDate === null || (typeof eventDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(eventDate)
    && Number.isFinite(parsedEventDate?.getTime()) && parsedEventDate.toISOString().slice(0, 10) === eventDate)
  if (!body || !/^\S+@\S+\.\S+$/.test(email) || email.length > 254 || !partnerOneName || partnerOneName.length > 100
    || !partnerTwoName || partnerTwoName.length > 100 || !slugIsValid || !dateIsValid) return jsonError(context, 400, 'invalid_wedding_invitation')
  const existingSlug = await context.env.DB.prepare('SELECT id FROM weddings WHERE slug = ? COLLATE NOCASE').bind(slug).first()
  if (existingSlug) return jsonError(context, 409, 'wedding_slug_unavailable')
  const existingAccount = await context.env.DB.prepare(`SELECT a.id, a.status, a.email_verified_at,
      EXISTS (SELECT 1 FROM platform_admins p WHERE p.account_id = a.id) AS is_platform_admin
    FROM accounts a WHERE a.email = ? COLLATE NOCASE`).bind(email).first()
  if (existingAccount && (existingAccount.status !== 'active' || !existingAccount.email_verified_at || existingAccount.is_platform_admin)) return jsonError(context, 409, 'account_not_ready')
  const accountId = existingAccount?.id || crypto.randomUUID()
  const weddingId = crypto.randomUUID()
  const membershipId = crypto.randomUUID()
  const challengeId = crypto.randomUUID()
  const token = encodeToken(crypto.getRandomValues(new Uint8Array(32)))
  const challengeHash = await tokenHash(token)
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  const temporaryPasswordHash = existingAccount ? null : await hashPassword(encodeToken(crypto.getRandomValues(new Uint8Array(32))))
  const statements = [
    ...(!existingAccount ? [context.env.DB.prepare(`INSERT INTO accounts (id, email, password_hash, status)
      VALUES (?, ?, ?, 'pending')`).bind(accountId, email, temporaryPasswordHash)] : []),
    context.env.DB.prepare(`INSERT INTO weddings (id, slug, owner_account_id, partner_one_name, partner_two_name, event_date, timezone, status)
      VALUES (?, ?, ?, ?, ?, ?, 'America/Sao_Paulo', 'draft')`).bind(weddingId, slug, accountId, partnerOneName, partnerTwoName, eventDate),
    context.env.DB.prepare(`INSERT INTO wedding_memberships (id, wedding_id, account_id, role, status, invited_by)
      VALUES (?, ?, ?, 'couple_admin', 'pending', ?)`).bind(membershipId, weddingId, accountId, context.get('actorId')),
    context.env.DB.prepare(`INSERT INTO auth_challenges (id, account_id, purpose, token_hash, expires_at, membership_id)
      VALUES (?, ?, 'email_verification', ?, ?, ?)`).bind(challengeId, accountId, challengeHash, expiresAt, membershipId),
    context.env.DB.prepare(`INSERT INTO audit_logs (id, actor_account_id, wedding_id, action, target_type, target_id, details_json)
      VALUES (?, ?, ?, 'couple_invitation_created', 'wedding', ?, ?)`).bind(crypto.randomUUID(), context.get('actorId'), weddingId, weddingId, JSON.stringify({ role: 'couple_admin', expiresAt })),
  ]
  try {
    await context.env.DB.batch(statements)
  } catch {
    return jsonError(context, 409, 'wedding_slug_or_membership_unavailable')
  }
  return context.json({ id: weddingId, slug, email, role: 'couple_admin', status: 'draft', requiresLogin: Boolean(existingAccount), expiresAt, invitationUrl: `${new URL(context.req.url).origin}/aceitar-equipe#aceitar-equipe/${token}` }, 201)
})

app.post('/api/superadmin/weddings/:weddingId/status', requireSession, requireSuperadmin, async (context) => {
  const weddingId = context.req.param('weddingId')
  const body = await context.req.json().catch(() => null)
  if (!body || !['active', 'suspended'].includes(body.status)) return jsonError(context, 400, 'invalid_status')
  const wedding = await context.env.DB.prepare("SELECT id, status FROM weddings WHERE id = ? AND status != 'deleted'").bind(weddingId).first()
  if (!wedding) return jsonError(context, 404, 'wedding_not_found')
  await context.env.DB.batch([
    context.env.DB.prepare('UPDATE weddings SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').bind(body.status, weddingId),
    context.env.DB.prepare(`INSERT INTO audit_logs (id, actor_account_id, wedding_id, action, target_type, target_id, details_json)
      VALUES (?, ?, ?, 'wedding_status_changed', 'wedding', ?, ?)`)
      .bind(crypto.randomUUID(), context.get('actorId'), weddingId, weddingId, JSON.stringify({ from: wedding.status, to: body.status })),
  ])
  return context.json({ id: weddingId, status: body.status })
})

app.post('/api/superadmin/weddings/:weddingId/anonymize', requireSession, requireSuperadmin, async (context) => {
  const session = context.get('session')
  const mfaVerifiedAt = Date.parse(session.mfa_verified_at)
  const now = Date.now()
  if (!Number.isFinite(mfaVerifiedAt) || mfaVerifiedAt > now || now - mfaVerifiedAt > 300000) return jsonError(context, 403, 'recent_mfa_required')
  const weddingId = context.req.param('weddingId')
  const body = await context.req.json().catch(() => null)
  if (body?.confirmation !== `ANONIMIZAR ${weddingId}`) return jsonError(context, 400, 'confirmation_required')
  const wedding = await context.env.DB.prepare("SELECT id, status FROM weddings WHERE id = ? AND status != 'deleted'").bind(weddingId).first()
  if (!wedding) return jsonError(context, 404, 'wedding_not_found')
  const actorId = session.account_id
  await purgeR2Prefix(context.env.GUEST_PHOTOS, `${weddingId}/`)
  const auditId = crypto.randomUUID()
  await context.env.DB.batch([
    context.env.DB.prepare(`UPDATE weddings SET status = 'deleted', deleted_at = CURRENT_TIMESTAMP, slug = ?, partner_one_name = 'Dados anonimizados', partner_two_name = 'Dados anonimizados', event_date = NULL, event_time = NULL, published_partner_one_name = NULL, published_partner_two_name = NULL, published_event_date = NULL, published_event_time = NULL, site_config_json = '{}', published_site_config_json = '{}', published_events_json = '[]', site_published_at = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND status != 'deleted'`)
      .bind(`removido-${weddingId}`, weddingId),
    context.env.DB.prepare('UPDATE gift_contributions SET guest_id = NULL, payer_name = NULL, message = NULL WHERE wedding_id = ?').bind(weddingId),
    context.env.DB.prepare(`UPDATE gifts SET title = 'Presente anonimizado', description = '', status = 'archived', updated_at = CURRENT_TIMESTAMP WHERE wedding_id = ?`).bind(weddingId),
    context.env.DB.prepare("UPDATE wedding_memberships SET status = 'revoked' WHERE wedding_id = ?").bind(weddingId),
    context.env.DB.prepare(`UPDATE accounts SET email = 'anon+' || id || '@invalid.local', password_hash = 'disabled', status = 'deleted', email_verified_at = NULL, updated_at = CURRENT_TIMESTAMP
      WHERE id IN (
        SELECT owner_account_id FROM weddings WHERE id = ?
        UNION
        SELECT account_id FROM wedding_memberships WHERE wedding_id = ?
      )
      AND NOT EXISTS (SELECT 1 FROM platform_admins p WHERE p.account_id = accounts.id)
      AND NOT EXISTS (SELECT 1 FROM weddings w WHERE w.owner_account_id = accounts.id AND w.id != ? AND w.status != 'deleted')
      AND NOT EXISTS (SELECT 1 FROM wedding_memberships m JOIN weddings w ON w.id = m.wedding_id WHERE m.account_id = accounts.id AND m.wedding_id != ? AND m.status IN ('active', 'pending') AND w.status != 'deleted')`).bind(weddingId, weddingId, weddingId, weddingId),
    context.env.DB.prepare("DELETE FROM account_mfa WHERE account_id IN (SELECT id FROM accounts WHERE status = 'deleted')"),
    context.env.DB.prepare("DELETE FROM auth_sessions WHERE account_id IN (SELECT id FROM accounts WHERE status = 'deleted')"),
    context.env.DB.prepare("DELETE FROM auth_challenges WHERE account_id IN (SELECT id FROM accounts WHERE status = 'deleted')"),
    context.env.DB.prepare(`UPDATE audit_logs SET details_json = json_remove(details_json, '$.email', '$.slug')
      WHERE wedding_id = ? AND action IN ('team_invitation_created', 'couple_invitation_created')`).bind(weddingId),
    context.env.DB.prepare(`INSERT INTO audit_logs (id, actor_account_id, wedding_id, action, target_type, target_id, details_json)
      VALUES (?, ?, ?, 'wedding_personal_data_anonymized', 'wedding', ?, '{"personal_data_removed":true,"operational_data_purged":true}')`)
      .bind(auditId, actorId, weddingId, weddingId),
    context.env.DB.prepare('DELETE FROM public_request_limits WHERE guest_id IN (SELECT id FROM guests WHERE wedding_id = ?)').bind(weddingId),
    context.env.DB.prepare('DELETE FROM guest_rsvps WHERE wedding_id = ?').bind(weddingId),
    context.env.DB.prepare('DELETE FROM godparent_tasks WHERE wedding_id = ?').bind(weddingId),
    context.env.DB.prepare('DELETE FROM check_ins WHERE wedding_id = ?').bind(weddingId),
    context.env.DB.prepare('DELETE FROM event_group_access WHERE event_id IN (SELECT id FROM events WHERE wedding_id = ?)').bind(weddingId),
    context.env.DB.prepare('DELETE FROM auth_challenges WHERE membership_id IN (SELECT id FROM wedding_memberships WHERE wedding_id = ?)').bind(weddingId),
    context.env.DB.prepare('DELETE FROM membership_event_access WHERE membership_id IN (SELECT id FROM wedding_memberships WHERE wedding_id = ?)').bind(weddingId),
    context.env.DB.prepare('DELETE FROM guests WHERE wedding_id = ?').bind(weddingId),
    context.env.DB.prepare('DELETE FROM events WHERE wedding_id = ?').bind(weddingId),
    context.env.DB.prepare('DELETE FROM guest_groups WHERE wedding_id = ?').bind(weddingId),
    context.env.DB.prepare('DELETE FROM wedding_memberships WHERE wedding_id = ?').bind(weddingId),
    context.env.DB.prepare('DELETE FROM fee_policies WHERE wedding_id = ?').bind(weddingId),
  ])
  return context.json({ id: weddingId, status: 'deleted', personalDataAnonymized: true, operationalDataPurged: true, financialRecordsChanged: false, auditPreserved: true })
})

app.post('/api/superadmin/accounts/:accountId/status', requireSession, requireSuperadmin, async (context) => {
  const accountId = context.req.param('accountId')
  const body = await context.req.json().catch(() => null)
  if (!body || !['active', 'suspended'].includes(body.status)) return jsonError(context, 400, 'invalid_status')
  const actorId = context.get('actorId')
  if (accountId === actorId && body.status === 'suspended') return jsonError(context, 409, 'cannot_suspend_current_account')
  const account = await context.env.DB.prepare('SELECT id, status FROM accounts WHERE id = ? AND status != \'deleted\'').bind(accountId).first()
  if (!account) return jsonError(context, 404, 'account_not_found')
  if (body.status === 'suspended') {
    const lastAdmin = await context.env.DB.prepare(`
      SELECT COUNT(*) AS total FROM platform_admins p
      JOIN accounts a ON a.id = p.account_id
      WHERE p.role = 'superadmin' AND a.status = 'active'
    `).first()
    const targetAdmin = await context.env.DB.prepare("SELECT 1 AS allowed FROM platform_admins WHERE account_id = ? AND role = 'superadmin'").bind(accountId).first()
    if (targetAdmin && lastAdmin.total <= 1) return jsonError(context, 409, 'cannot_suspend_last_superadmin')
  }
  const auditId = crypto.randomUUID()
  await context.env.DB.batch([
    context.env.DB.prepare('UPDATE accounts SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').bind(body.status, accountId),
    context.env.DB.prepare("UPDATE auth_sessions SET revoked_at = CURRENT_TIMESTAMP WHERE account_id = ? AND revoked_at IS NULL AND ? = 'suspended'").bind(accountId, body.status),
    context.env.DB.prepare(`INSERT INTO audit_logs (id, actor_account_id, action, target_type, target_id, details_json)
      VALUES (?, ?, 'account_status_changed', 'account', ?, ?)`)
      .bind(auditId, actorId, accountId, JSON.stringify({ from: account.status, to: body.status })),
  ])
  return context.json({ id: accountId, status: body.status })
})

app.post('/api/superadmin/email-test', requireSession, requireSuperadmin, async (context) => {
  const session = context.get('session')
  const now = Date.now()
  const mfaVerifiedAt = Date.parse(session.mfa_verified_at)
  if (!Number.isFinite(mfaVerifiedAt) || mfaVerifiedAt > now || now - mfaVerifiedAt > 300000) return jsonError(context, 403, 'recent_mfa_required')
  const body = await context.req.json().catch(() => null)
  if (body?.confirmation !== 'send-test-email') return jsonError(context, 400, 'confirmation_required')
  const recipient = context.env.SUPERADMIN_EMAIL?.trim().toLowerCase()
  if (!recipient || recipient !== session.email.trim().toLowerCase()) return jsonError(context, 503, 'superadmin_email_unconfigured')
  if (context.env.EMAIL_PROVIDER?.trim().toLowerCase() !== 'resend' || !configuredEmailProvider(context.env)) return jsonError(context, 503, 'email_service_unconfigured')
  const previousTest = await context.env.DB.prepare(`SELECT id FROM audit_logs
    WHERE actor_account_id = ? AND action = 'superadmin_email_test_sent'
      AND created_at >= datetime('now', '-1 hour') LIMIT 1`).bind(session.account_id).first()
  if (previousTest) return jsonError(context, 429, 'email_test_rate_limited')
  const sent = await sendTransactionalEmail(context, {
    to: recipient,
    subject: `Teste de envio | ${PRODUCT_NAME}`,
    text: 'Este é um teste do envio de e-mails da plataforma. O endereço remetente não recebe respostas. Para suporte, use henriquesouza1832001@gmail.com ou (31) 98892-4409.',
    html: '<p>Este é um teste do envio de e-mails da plataforma.</p><p>O endereço remetente não recebe respostas. Para suporte, use <a href="mailto:henriquesouza1832001@gmail.com">henriquesouza1832001@gmail.com</a> ou <a href="tel:+5531988924409">(31) 98892-4409</a>.</p>',
  }).catch(() => false)
  if (!sent) return jsonError(context, 502, 'email_test_failed')
  await context.env.DB.prepare(`INSERT INTO audit_logs (id, actor_account_id, action, target_type, target_id, details_json)
    VALUES (?, ?, 'superadmin_email_test_sent', 'email_service', 'resend', '{}')`)
    .bind(crypto.randomUUID(), session.account_id).run()
  return context.json({ sent: true, to: recipient })
})

export { app }

export const onRequest = (context) => app.fetch(context.request, context.env, context)
