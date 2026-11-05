import { PRODUCT_BASE_URL, PRODUCT_NAME } from '../../src/product-config.js'
import { escapeEmailHtml, renderBrandedEmail } from '../../src/email-template.js'

function formatCurrency(cents) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100)
}

function emailProvider(env) {
  const selected = env.EMAIL_PROVIDER?.trim().toLowerCase()
  if (selected === 'resend') return env.RESEND_API_KEY && env.EMAIL_FROM ? 'resend' : null
  if (selected === 'cloudflare') return env.CLOUDFLARE_EMAIL_API_TOKEN && env.CLOUDFLARE_ACCOUNT_ID && env.EMAIL_FROM ? 'cloudflare' : null
  if (selected) return null
  if (env.RESEND_API_KEY && env.EMAIL_FROM) return 'resend'
  if (env.CLOUDFLARE_EMAIL_API_TOKEN && env.CLOUDFLARE_ACCOUNT_ID && env.EMAIL_FROM) return 'cloudflare'
  return null
}

async function sendEmail(env, to, weddingName, expenses) {
  const provider = emailProvider(env)
  if (!provider) return false
  const rows = expenses.map((expense) => {
    const supplier = escapeEmailHtml(expense.supplier_name)
    const dueDate = expense.due_date ? new Date(`${expense.due_date}T12:00:00Z`).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : 'Sem vencimento'
    const balance = Math.max(0, expense.total_amount_cents - expense.paid_amount_cents)
    return `<tr><td style="padding:14px 10px;border-bottom:1px solid #e7e3da;word-break:break-word"><strong style="color:#35483e">${supplier}</strong><br><span style="color:#6d776e;font-size:12px">Vencimento: ${dueDate}</span></td><td align="right" style="padding:14px 10px;border-bottom:1px solid #e7e3da;color:#344b3e;font-weight:700;white-space:nowrap">${formatCurrency(balance)}</td></tr>`
  }).join('')
  const textRows = expenses.map((expense) => `${expense.supplier_name} — saldo ${formatCurrency(Math.max(0, expense.total_amount_cents - expense.paid_amount_cents))} — vencimento ${expense.due_date || 'não informado'}`).join('\n')
  const html = renderBrandedEmail({
    preheader: `${expenses.length} despesa(s) com saldo em aberto no casamento ${weddingName}.`,
    eyebrow: 'Planejamento do casamento',
    title: 'Resumo de despesas do mês',
    bodyHtml: `<p style="margin:0 0 18px">Este é o resumo mensal de despesas de <strong>${escapeEmailHtml(weddingName)}</strong> com vencimento neste mês ou em atraso.</p><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;border-collapse:collapse"><thead><tr><th align="left" style="padding:10px;border-bottom:1px solid #d7cbb7;color:#58665a;font-family:Arial,Helvetica,sans-serif;font-size:11px;letter-spacing:.7px;text-transform:uppercase">Fornecedor e vencimento</th><th align="right" style="padding:10px;border-bottom:1px solid #d7cbb7;color:#58665a;font-family:Arial,Helvetica,sans-serif;font-size:11px;letter-spacing:.7px;text-transform:uppercase">Saldo em aberto</th></tr></thead><tbody>${rows}</tbody></table>`,
    actionLabel: 'Abrir despesas',
    actionUrl: `${PRODUCT_BASE_URL}/painel`,
    notice: 'Os valores são registros de organização do casal. Nenhum pagamento é feito pela plataforma.',
  })
  const isResend = provider === 'resend'
  const endpoint = isResend ? 'https://api.resend.com/emails' : `https://api.cloudflare.com/client/v4/accounts/${env.CLOUDFLARE_ACCOUNT_ID}/email/sending/send`
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { Authorization: `Bearer ${isResend ? env.RESEND_API_KEY : env.CLOUDFLARE_EMAIL_API_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ to: isResend ? [to] : to, from: env.EMAIL_FROM, subject: `Resumo mensal de despesas | ${PRODUCT_NAME}`, text: `Despesas de ${weddingName}:\n${textRows}\n\nAcesse o painel: ${PRODUCT_BASE_URL}/painel\n\nNenhum pagamento é feito pela plataforma.`, html }),
  })
  if (!response.ok) return false
  const result = await response.json().catch(() => null)
  return isResend ? typeof result?.id === 'string' && result.id.length > 0 : result?.success === true && !result.result?.permanent_bounces?.includes(to)
}

async function sendMonthlyExpenseReminders(env, now = new Date()) {
  const provider = emailProvider(env)
  if (!env.DB || !provider) return { sent: 0, skipped: 0, failed: 0 }
  const periodMonth = now.toISOString().slice(0, 7)
  const rangeEndDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0))
  const rangeEnd = rangeEndDate.toISOString().slice(0, 10)
  await env.DB.prepare(`DELETE FROM wedding_expense_reminder_runs
    WHERE status = 'sending' AND created_at <= datetime('now', '-20 minutes')`).run()
  const weddings = await env.DB.prepare(`SELECT DISTINCT w.id AS wedding_id, w.partner_one_name, w.partner_two_name
    FROM wedding_expenses e JOIN weddings w ON w.id = e.wedding_id
    WHERE e.status = 'active' AND e.reminder_enabled = 1 AND e.due_date IS NOT NULL
      AND e.due_date <= ? AND w.status = 'active'`).bind(rangeEnd).all()
  let sent = 0
  let skipped = 0
  let failed = 0
  for (const wedding of weddings.results || []) {
    const expenses = await env.DB.prepare(`SELECT e.id, e.supplier_name, e.total_amount_cents, e.due_date,
        COALESCE(SUM(p.amount_cents), 0) AS paid_amount_cents
      FROM wedding_expenses e LEFT JOIN wedding_expense_payments p ON p.expense_id = e.id AND p.wedding_id = e.wedding_id
      WHERE e.wedding_id = ? AND e.status = 'active' AND e.reminder_enabled = 1 AND e.due_date IS NOT NULL AND e.due_date <= ?
      GROUP BY e.id HAVING COALESCE(SUM(p.amount_cents), 0) < e.total_amount_cents ORDER BY e.due_date, e.supplier_name`).bind(wedding.wedding_id, rangeEnd).all()
    if (!expenses.results?.length) continue
    const weddingName = `${wedding.partner_one_name} e ${wedding.partner_two_name}`
    const recipients = await env.DB.prepare(`SELECT a.id AS account_id, a.email
      FROM wedding_memberships m JOIN accounts a ON a.id = m.account_id
      WHERE m.wedding_id = ? AND m.role = 'couple_admin' AND m.status = 'active' AND a.status = 'active'`).bind(wedding.wedding_id).all()
    for (const recipient of recipients.results || []) {
      const runId = crypto.randomUUID()
      const run = await env.DB.prepare(`INSERT INTO wedding_expense_reminder_runs (id, wedding_id, account_id, period_month, status)
        VALUES (?, ?, ?, ?, 'sending') ON CONFLICT(wedding_id, account_id, period_month) DO NOTHING`).bind(runId, wedding.wedding_id, recipient.account_id, periodMonth).run()
      if (!run.meta.changes) {
        skipped += 1
        continue
      }
      try {
        if (!await sendEmail(env, recipient.email, weddingName, expenses.results)) {
          await env.DB.prepare('DELETE FROM wedding_expense_reminder_runs WHERE id = ? AND status = \'sending\'').bind(runId).run()
          failed += 1
          continue
        }
        await env.DB.prepare(`UPDATE wedding_expense_reminder_runs SET status = 'sent', sent_at = CURRENT_TIMESTAMP WHERE id = ? AND status = 'sending'`).bind(runId).run()
        sent += 1
      } catch {
        await env.DB.prepare('DELETE FROM wedding_expense_reminder_runs WHERE id = ? AND status = \'sending\'').bind(runId).run()
        failed += 1
      }
    }
  }
  return { sent, skipped, failed, rangeEnd }
}

export default {
  async scheduled(controller, env) {
    await sendMonthlyExpenseReminders(env, new Date(controller.scheduledTime))
  },
}

export { sendMonthlyExpenseReminders }

