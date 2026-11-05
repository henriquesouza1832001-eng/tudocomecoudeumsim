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
