import { useEffect, useRef, useState } from 'react'
import { BedDouble, ChevronLeft, Gift, Home, ListChecks, PencilLine, PiggyBank, Plane, Plus, ShoppingBag, Sparkles, UtensilsCrossed, X } from 'lucide-react'
import { GIFT_PRESETS, PRESET_CATEGORIES, presetTotalCents } from './gift-presets.js'
import './gift-hub.css'

const GIFT_LIMIT = 60
const brl = (cents) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100)

const COVER_ICONS = { Casa: Home, 'Lua de mel': Plane, 'Experiências': Sparkles, Outros: Gift }
const coverIcon = (preset) => (preset.id === 'cozinha' || preset.id === 'area-gourmet' ? UtensilsCrossed : preset.id === 'quarto-do-casal' ? BedDouble : COVER_ICONS[preset.category] || Gift)

function PresetCover({ preset }) {
  const Icon = coverIcon(preset)
  return <span className={`gift-preset-cover gift-cover-${preset.id}`} aria-hidden="true"><Icon size={46} strokeWidth={1.4} /></span>
}

function PresetDialog({ activeCount, busy, onClose, onAdd }) {
  const [category, setCategory] = useState('Todas')
  const [openId, setOpenId] = useState(null)
  const dialogRef = useRef(null)
  const room = GIFT_LIMIT - activeCount
  const opened = GIFT_PRESETS.find((item) => item.id === openId)
  const visible = GIFT_PRESETS.filter((item) => category === 'Todas' || item.category === category)

  useEffect(() => {
    const previous = document.activeElement
    dialogRef.current?.querySelector('button')?.focus()
    const onKey = (event) => { if (event.key === 'Escape' && !busy) onClose() }
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('keydown', onKey); previous?.focus?.() }
  }, [busy, onClose])

  const limitMessage = (preset) => preset.items.length > room ? `Esta lista tem ${preset.items.length} presentes e só cabem mais ${Math.max(room, 0)} (limite de ${GIFT_LIMIT} ativos). Arquivem alguns itens para continuar.` : ''

  return <div className="gift-preset-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) onClose() }}>
    <section className="gift-preset-dialog gift-catalog-view" role="dialog" aria-modal="true" aria-labelledby="gift-preset-title" ref={dialogRef}>
      <header>
        <div className="gift-catalog-heading">{opened && <button type="button" className="gift-preset-back" onClick={() => setOpenId(null)} aria-label="Voltar às listas"><ChevronLeft size={22} /></button>}<div><span className="eyebrow">LISTAS PRONTAS</span><h2 id="gift-preset-title">{opened ? opened.name : 'Listas pré-prontas'}</h2></div></div>
        <button type="button" className="gift-preset-close" onClick={onClose} disabled={busy} aria-label="Fechar"><X size={20} /></button>
      </header>
      {opened ? <>
        <p>{opened.note}. Os valores são sugestões: depois de adicionar, vocês podem editar, trocar ou excluir cada presente.</p>
        <ul className="gift-preset-items" aria-label={`Presentes da lista ${opened.name}`}>{opened.items.map((item) => <li key={item.title}><span>{item.title}<small>{item.description}</small></span><strong>{brl(item.amountCents)}</strong></li>)}</ul>
        <p className="gift-preset-total">{opened.items.length} presentes · {brl(presetTotalCents(opened))} no total</p>
        {limitMessage(opened) && <p className="admin-form-error" role="alert">{limitMessage(opened)}</p>}
        <footer><button type="button" className="button-outline" onClick={() => setOpenId(null)} disabled={busy}>Voltar</button><button type="button" className="button-primary" disabled={busy || opened.items.length > room} onClick={() => onAdd(opened)}>{busy ? 'Adicionando…' : `Adicionar ${opened.items.length} presentes`}</button></footer>
      </> : <>
        <div className="gift-catalog-tabs" role="tablist" aria-label="Categorias">{PRESET_CATEGORIES.map((item) => <button type="button" role="tab" aria-selected={category === item} className={category === item ? 'active' : ''} key={item} onClick={() => setCategory(item)}>{item}</button>)}</div>
        <ul className="gift-catalog-grid">{visible.map((preset) => <li key={preset.id} className="gift-catalog-card">
          <button type="button" className="gift-catalog-open" onClick={() => setOpenId(preset.id)} aria-label={`Ver itens da lista ${preset.name}`}><PresetCover preset={preset} /><span className="gift-catalog-info"><strong>{preset.name}</strong><span><small>{preset.items.length} presentes</small><small>{brl(presetTotalCents(preset))}</small></span></span></button>
          <button type="button" className="gift-catalog-add" disabled={busy || preset.items.length > room} title={limitMessage(preset) || undefined} onClick={() => onAdd(preset)}><Plus size={16} /> Adicionar</button>
        </li>)}</ul>
        {room < 1 && <p className="admin-form-error" role="alert">O limite de {GIFT_LIMIT} presentes ativos foi atingido. Arquivem alguns itens para adicionar uma lista.</p>}
      </>}
    </section>
  </div>
}

function CatalogDialog({ gifts, busy, onClose, onAdd }) {
  const catalogItems = GIFT_PRESETS.flatMap((preset) => preset.items.map((item) => ({ ...item, category: preset.name })))
    .filter((item) => !gifts.some((gift) => gift.status === 'active' && gift.title.trim().toLocaleLowerCase('pt-BR') === item.title.toLocaleLowerCase('pt-BR')))
  const [selectedTitle, setSelectedTitle] = useState(catalogItems[0]?.title || '')
  const selectedItem = catalogItems.find((item) => item.title === selectedTitle) || catalogItems[0]

  async function addItem() {
    if (selectedItem && await onAdd({ name: 'Catálogo', items: [selectedItem] })) onClose()
  }

  return <div className="gift-preset-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) onClose() }}>
    <section className="gift-preset-dialog" role="dialog" aria-modal="true" aria-labelledby="gift-catalog-title">
      <header><div><span className="eyebrow">IDEIAS PARA A LISTA</span><h2 id="gift-catalog-title">Adicionar presente do catálogo</h2></div><button type="button" className="gift-preset-close" onClick={onClose} disabled={busy} aria-label="Fechar"><X size={20} /></button></header>
      {selectedItem ? <><label>Escolha um presente<select value={selectedItem.title} onChange={(event) => setSelectedTitle(event.target.value)}>{catalogItems.map((item) => <option key={`${item.category}-${item.title}`} value={item.title}>{item.title} · {item.category}</option>)}</select></label><div className="gift-catalog-preview"><strong>{selectedItem.title}</strong><span>{selectedItem.description}</span><b>{brl(selectedItem.amountCents)}</b></div></> : <p>Todos os presentes do catálogo já estão na lista.</p>}
      <footer><button type="button" className="button-outline" onClick={onClose} disabled={busy}>Cancelar</button><button type="button" className="button-primary" disabled={busy || !selectedItem || gifts.filter((gift) => gift.status === 'active').length >= GIFT_LIMIT} onClick={addItem}>{busy ? 'Adicionando…' : 'Adicionar à lista'}</button></footer>
    </section>
  </div>
}

export default function GiftHub({ gifts, pix, pixEnabled, pixValid, displayLabel, busy, saving, onStart, onAddPreset, onPixChange, onSavePix, onShowList }) {
  const [presetOpen, setPresetOpen] = useState(false)
  const [catalogOpen, setCatalogOpen] = useState(false)
  const active = gifts.filter((gift) => gift.status === 'active')
  const actions = [
    { id: 'preset', icon: ListChecks, label: 'Adicionar lista pré-pronta', run: () => setPresetOpen(true) },
    { id: 'catalog', icon: ShoppingBag, label: 'Adicionar presente do catálogo', run: () => setCatalogOpen(true) },
    { id: 'fixed', icon: PencilLine, label: 'Crie presente do seu jeito', run: () => onStart('fixed') },
    { id: 'free', icon: PiggyBank, label: 'Receber contribuição livre', run: () => onStart('free') },
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
        <p className="gift-hero-text">Cada presente vira uma transferência direta para a chave Pix de vocês.</p>
        <div className="gift-hero-actions"><button type="button" className="gift-hero-primary" onClick={() => onStart('fixed')}>Adicionar presente</button><button type="button" className="gift-hero-link" onClick={onShowList}>Ver itens cadastrados</button></div>
      </article>
      <aside className="gift-summary" aria-labelledby="gift-summary-title">
        <h3 id="gift-summary-title">Chave Pix do casal</h3>
        <p>{displayLabel}. Todo pagamento vai direto para esta chave; a plataforma não recebe nem confirma valores.</p>
        <label className="gift-pix-field">Chave Pix<input autoComplete="off" value={pix.key || ''} maxLength="200" onChange={(event) => onPixChange({ key: event.target.value })} placeholder="CPF, CNPJ, e-mail, telefone ou chave aleatória" aria-invalid={Boolean(pix.key?.trim()) && !pixValid} /></label>
        {pix.key?.trim() && !pixValid && <p className="admin-form-error" role="alert">Esta chave Pix não parece válida. Confira o CPF, CNPJ, e-mail, telefone com DDD ou a chave aleatória.</p>}
        <label className="gift-pix-field">Nome do titular (opcional)<input autoComplete="name" value={pix.holderName || ''} maxLength="120" onChange={(event) => onPixChange({ holderName: event.target.value })} /></label>
        <button type="button" className="gift-summary-button" disabled={saving || !pixValid} onClick={onSavePix}>{saving ? 'Salvando…' : pixEnabled ? 'Salvar e publicar' : 'Ativar Pix e publicar'}</button>
      </aside>
    </div>
    <ul className="gift-hub-actions">{actions.map((action) => <li key={action.id}><button type="button" className="gift-action-card" onClick={action.run} disabled={busy}><span className={`gift-action-icon gift-action-icon-${action.id}`} aria-hidden="true"><action.icon size={30} strokeWidth={1.6} /></span><span className="gift-action-label">{action.label}</span><span className="gift-action-plus" aria-hidden="true"><Plus size={22} /></span></button></li>)}</ul>
    {presetOpen && <PresetDialog activeCount={active.length} busy={busy} onClose={() => setPresetOpen(false)} onAdd={addPreset} />}
    {catalogOpen && <CatalogDialog gifts={gifts} busy={busy} onClose={() => setCatalogOpen(false)} onAdd={onAddPreset} />}
  </section>
}
