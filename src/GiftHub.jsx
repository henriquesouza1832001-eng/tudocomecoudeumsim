import { useEffect, useRef, useState } from 'react'
import { Gift, ListChecks, PencilLine, PiggyBank, Plus, Wallet, X } from 'lucide-react'
import { GIFT_PRESETS, presetTotalCents } from './gift-presets.js'
import './gift-hub.css'

const GIFT_LIMIT = 60
const brl = (cents) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100)

function PresetDialog({ activeCount, busy, onClose, onAdd }) {
  const [selected, setSelected] = useState(GIFT_PRESETS[0].id)
  const dialogRef = useRef(null)
  const preset = GIFT_PRESETS.find((item) => item.id === selected) || GIFT_PRESETS[0]
  const room = GIFT_LIMIT - activeCount
  const fits = preset.items.length <= room

  useEffect(() => {
    const previous = document.activeElement
    dialogRef.current?.querySelector('button')?.focus()
    const onKey = (event) => { if (event.key === 'Escape' && !busy) onClose() }
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('keydown', onKey); previous?.focus?.() }
  }, [busy, onClose])

  return <div className="gift-preset-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) onClose() }}>
    <section className="gift-preset-dialog" role="dialog" aria-modal="true" aria-labelledby="gift-preset-title" ref={dialogRef}>
      <header><div><span className="eyebrow">LISTAS PRONTAS</span><h2 id="gift-preset-title">Adicionar lista pré-pronta</h2></div><button type="button" className="gift-preset-close" onClick={onClose} disabled={busy} aria-label="Fechar"><X size={20} /></button></header>
      <p>Escolham um tema e ajustem depois. Os valores são sugestões iniciais: vocês podem editar, trocar ou excluir cada presente.</p>
      <div className="gift-preset-options" role="radiogroup" aria-label="Tema da lista">{GIFT_PRESETS.map((item) => <button type="button" role="radio" aria-checked={selected === item.id} className={selected === item.id ? 'active' : ''} key={item.id} onClick={() => setSelected(item.id)}><strong>{item.name}</strong><small>{item.note}</small></button>)}</div>
      <ul className="gift-preset-items" aria-label={`Presentes da lista ${preset.name}`}>{preset.items.map((item) => <li key={item.title}><span>{item.title}</span><strong>{brl(item.amountCents)}</strong></li>)}</ul>
      <p className="gift-preset-total">{preset.items.length} presentes · {brl(presetTotalCents(preset))} no total</p>
      {!fits && <p className="admin-form-error" role="alert">Esta lista tem {preset.items.length} presentes e só cabem mais {Math.max(room, 0)} (limite de {GIFT_LIMIT} ativos). Arquivem alguns itens para continuar.</p>}
      <footer><button type="button" className="button-outline" onClick={onClose} disabled={busy}>Cancelar</button><button type="button" className="button-primary" disabled={busy || !fits} onClick={() => onAdd(preset)}>{busy ? 'Adicionando…' : `Adicionar ${preset.items.length} presentes`}</button></footer>
    </section>
  </div>
}

export default function GiftHub({ gifts, pixEnabled, displayLabel, busy, onStart, onAddPreset, onShowPix, onShowList }) {
  const [presetOpen, setPresetOpen] = useState(false)
  const active = gifts.filter((gift) => gift.status === 'active')
  const fixedTotal = active.reduce((sum, gift) => sum + (gift.gift_type === 'fixed' && gift.amount_cents ? gift.amount_cents : 0), 0)
  const actions = [
    { id: 'preset', icon: ListChecks, label: 'Adicionar lista pré-pronta', run: () => setPresetOpen(true) },
    { id: 'fixed', icon: PencilLine, label: 'Presente genérico com valor', run: () => onStart('fixed') },
    { id: 'free', icon: PiggyBank, label: 'Contribuição de valor livre', run: () => onStart('free') },
    { id: 'pix', icon: Wallet, label: pixEnabled ? 'Chave Pix do casal' : 'Configurar a chave Pix', run: onShowPix },
  ]

  async function addPreset(preset) {
    if (await onAddPreset(preset)) setPresetOpen(false)
  }

  return <section className="gift-hub" aria-labelledby="gift-hub-title">
    <div className="gift-hub-top">
      <article className="gift-hero">
        <span className="gift-hero-icon" aria-hidden="true"><Gift size={22} /></span>
        <h2 id="gift-hub-title">Lista de presentes</h2>
        <p className="gift-hero-status">{active.length} de {GIFT_LIMIT} presentes ativos · Pix {pixEnabled ? 'configurado' : 'ainda não configurado'}</p>
        <p className="gift-hero-text">Todos os presentes são pagos por Pix, direto para a chave de vocês. Escolham presentes genéricos com valor ou deixem o valor livre; a plataforma não recebe nem repassa o dinheiro.</p>
        <div className="gift-hero-actions"><button type="button" className="gift-hero-primary" onClick={() => onStart('fixed')}>Adicionar presente</button><button type="button" className="gift-hero-link" onClick={onShowList}>Ver itens cadastrados</button></div>
      </article>
      <aside className="gift-summary" aria-labelledby="gift-summary-title">
        <h3 id="gift-summary-title">Sua lista em números</h3>
        <dl>
          <div><dt>Presentes ativos</dt><dd>{active.length}/{GIFT_LIMIT}</dd></div>
          <div><dt>Soma dos valores fixos</dt><dd>{brl(fixedTotal)}</dd></div>
          <div><dt>Chave Pix</dt><dd>{pixEnabled ? 'Configurada' : 'Pendente'}</dd></div>
          <div><dt>No convite</dt><dd>{displayLabel}</dd></div>
        </dl>
        <button type="button" className="gift-summary-button" onClick={onShowPix}>{pixEnabled ? 'Rever chave Pix' : 'Configurar chave Pix'}</button>
      </aside>
    </div>
    {!pixEnabled && <p className="gift-hub-alert" role="alert"><span>Antes de publicar, configurem a chave Pix: todos os pagamentos vão para ela e, sem ela, os convidados não conseguem pagar.</span><button type="button" onClick={onShowPix}>Configurar chave Pix</button></p>}
    <ul className="gift-hub-actions">{actions.map((action) => <li key={action.id}><button type="button" className="gift-action-card" onClick={action.run} disabled={busy}><span className={`gift-action-icon gift-action-icon-${action.id}`} aria-hidden="true"><action.icon size={30} strokeWidth={1.6} /></span><span className="gift-action-label">{action.label}</span><span className="gift-action-plus" aria-hidden="true"><Plus size={22} /></span></button></li>)}</ul>
    {presetOpen && <PresetDialog activeCount={active.length} busy={busy} onClose={() => setPresetOpen(false)} onAdd={addPreset} />}
  </section>
}
