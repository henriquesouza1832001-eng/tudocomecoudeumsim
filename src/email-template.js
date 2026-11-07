import { PRODUCT_BASE_URL, PRODUCT_NAME } from './product-config.js'

export function escapeEmailHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character])
}

const font = 'Arial,Helvetica,sans-serif'
const serif = "Georgia,'Times New Roman',serif"

export function styleEmailLinks(html) {
  return String(html).replace(/<a href=/g, '<a style="color:#8a2f35;text-decoration:underline" href=')
}

function detailsBlock(details) {
  const rows = (details || []).filter(([, value]) => value)
  if (!rows.length) return ''
  const items = rows.map(([label, value]) => `<tr><td valign="top" style="padding:11px 16px 11px 0;border-top:1px solid #e4dccd;color:#6b6258;font-family:${font};font-size:13px;line-height:1.5;width:92px">${escapeEmailHtml(label)}</td><td valign="top" style="padding:11px 0;border-top:1px solid #e4dccd;color:#1f1c18;font-family:${font};font-size:15px;line-height:1.5">${escapeEmailHtml(value)}</td></tr>`).join('')
  return `<tr><td style="padding:0 36px 22px"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">${items}<tr><td colspan="2" style="border-top:1px solid #e4dccd;font-size:0;line-height:0;height:1px">&nbsp;</td></tr></table></td></tr>`
}

function actionBlock(actionLabel, actionUrl, secondaryLinks) {
  if (!actionLabel || !actionUrl) return ''
  const secondary = (secondaryLinks || []).filter((item) => item?.label && item?.url)
    .map((item) => `<p style="margin:12px 0 0;font-family:${font};font-size:14px;line-height:1.6;text-align:center"><a href="${escapeEmailHtml(item.url)}" style="color:#8a2f35;text-decoration:underline">${escapeEmailHtml(item.label)}</a></p>`).join('')
  return `<tr><td align="center" style="padding:4px 36px 26px"><table role="presentation" cellspacing="0" cellpadding="0" border="0"><tr><td align="center" bgcolor="#1f1c18" style="border-radius:0"><a href="${escapeEmailHtml(actionUrl)}" style="display:inline-block;padding:15px 28px;border:1px solid #1f1c18;color:#f3eee4;font-family:${font};font-size:15px;font-weight:700;line-height:20px;text-align:center;text-decoration:none">${escapeEmailHtml(actionLabel)}</a></td></tr></table>${secondary}<p style="margin:16px 0 0;color:#6b6258;font-family:${font};font-size:12px;line-height:1.6;text-align:center">Se o botão não abrir, copie este endereço:<br><a href="${escapeEmailHtml(actionUrl)}" style="color:#8a2f35;word-break:break-all;text-decoration:underline">${escapeEmailHtml(actionUrl)}</a></p></td></tr>`
}

export function renderBrandedEmail({ preheader, eyebrow, title, bodyHtml, details, actionLabel, actionUrl, secondaryLinks, notice }) {
  const eyebrowRow = eyebrow ? `<p style="margin:0 0 8px;color:#6b6258;font-family:${font};font-size:13px;line-height:1.5">${escapeEmailHtml(eyebrow)}</p>` : ''
  const noticeRow = notice
    ? `<tr><td style="padding:0 36px 26px"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f6f1e8;border:1px solid #e4dccd"><tr><td style="padding:14px 16px;color:#4b4036;font-family:${font};font-size:13px;line-height:1.6">${escapeEmailHtml(notice)}</td></tr></table></td></tr>`
    : ''
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><meta name="color-scheme" content="light"><meta name="supported-color-schemes" content="light"><title>${escapeEmailHtml(title)}</title></head><body style="margin:0;padding:0;background-color:#f3eee4;color:#1f1c18;font-family:${font}"><div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;mso-hide:all">${escapeEmailHtml(preheader)}</div><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="#f3eee4" style="width:100%;background-color:#f3eee4"><tr><td align="center" style="padding:30px 14px"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:640px;background-color:#fffdf8;border:1px solid #ddd3c4"><tr><td style="padding:26px 36px 20px;border-bottom:1px solid #e4dccd"><table role="presentation" cellspacing="0" cellpadding="0" border="0"><tr><td valign="middle"><img src="${PRODUCT_BASE_URL}/icons/wedding-180.png" width="40" height="40" alt="" style="display:block;border:0;border-radius:9px"></td><td valign="middle" style="padding-left:12px;color:#1f1c18;font-family:${serif};font-size:19px;line-height:1.3">${escapeEmailHtml(PRODUCT_NAME)}</td></tr></table></td></tr><tr><td style="padding:32px 36px 14px">${eyebrowRow}<h1 style="margin:0;color:#1f1c18;font-family:${serif};font-size:32px;font-weight:400;line-height:1.15">${escapeEmailHtml(title)}</h1></td></tr><tr><td style="padding:0 36px 20px;color:#3d372f;font-family:${font};font-size:15px;line-height:1.7">${bodyHtml}</td></tr>${detailsBlock(details)}${actionBlock(actionLabel, actionUrl, secondaryLinks)}${noticeRow}<tr><td style="padding:20px 36px 24px;border-top:1px solid #e4dccd;background-color:#f6f1e8;color:#6b6258;font-family:${font};font-size:12px;line-height:1.7"><p style="margin:0 0 8px">Esta mensagem é automática e não recebe respostas. Precisa de ajuda? <a href="mailto:henriquesouza1832001@gmail.com" style="color:#8a2f35;text-decoration:underline">Fale com a gente</a> ou ligue para <a href="tel:+5531988924409" style="color:#8a2f35;text-decoration:underline">(31) 98892-4409</a>.</p></td></tr></table></td></tr></table></body></html>`
}
