import test from 'node:test'
import assert from 'node:assert/strict'
import { escapeEmailHtml, renderBrandedEmail } from '../src/email-template.js'

test('branded email uses responsive table layout and escapes visible and linked values', () => {
  const email = renderBrandedEmail({
    preheader: 'Continue seu cadastro',
    eyebrow: 'CONFIRMAÇÃO',
    title: 'Confirme <seu> e-mail',
    bodyHtml: '<p>Uma frase de orientação.</p>',
    actionLabel: 'Confirmar & continuar',
    actionUrl: 'https://example.com/confirmar?origem=email&tipo=cadastro',
    notice: 'Este link expira em 24 horas.',
  })

  assert.match(email, /role="presentation"/)
  assert.match(email, /max-width:640px/)
  assert.match(email, /Confirme &lt;seu&gt; e-mail/)
  assert.match(email, /Confirmar &amp; continuar/)
  assert.match(email, /href="https:\/\/example\.com\/confirmar\?origem=email&amp;tipo=cadastro"/)
  assert.match(email, /Este link expira em 24 horas\./)
  assert.doesNotMatch(email, /<seu>/)
})

test('email text escaping handles HTML delimiters and quotes', () => {
  assert.equal(escapeEmailHtml('<script a="b"> &'), '&lt;script a=&quot;b&quot;&gt; &amp;')
})

test('guest emails list couple, event, date and place and style every link', async () => {
  const { styleEmailLinks } = await import('../src/email-template.js')
  const email = renderBrandedEmail({
    preheader: 'Presença confirmada',
    title: 'Presença confirmada',
    bodyHtml: '<p>Olá, Marina.</p>',
    details: [['Casal', 'Ana e Caio'], ['Evento', 'Cerimônia'], ['Quando', 'sábado, 16 de outubro de 2027 16:00'], ['Onde', 'Jardim das Flores'], ['Vazio', '']],
    actionLabel: 'Abrir meu convite e QR code',
    actionUrl: 'https://example.com/convidado#convite/abc',
    secondaryLinks: [{ label: 'Consultar esta confirmação', url: 'https://example.com/confirmar-presenca#x' }],
  })
  assert.match(email, /Ana e Caio/)
  assert.match(email, /Jardim das Flores/)
  assert.doesNotMatch(email, /Vazio/)
  assert.match(email, /Consultar esta confirmação/)
  assert.doesNotMatch(email, /font-style:italic/)
  assert.equal(styleEmailLinks('<a href="https://x.test">x</a>'), '<a style="color:#8a2f35;text-decoration:underline" href="https://x.test">x</a>')
})
