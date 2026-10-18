import { useState } from 'react'
import { ArrowLeft, ArrowRight, Check, ChevronDown, CircleHelp, Gift, Heart, ListChecks, Plus, Sparkles, Wallet } from 'lucide-react'
import './gift-concepts.css'

const examples = [
  { title: 'Jantar especial', type: 'fixed', amount: '180,00', goal: '', description: 'Uma noite para celebrar o começo da vida a dois.' },
  { title: 'Lua de mel', type: 'custom', amount: '', goal: '', description: 'Uma contribuição para uma viagem inesquecível.' },
]

function GiftTypeCard({ active, icon: Icon, title, description, onClick }) {
  return <button className={`gift-concept-type${active ? ' is-active' : ''}`} type="button" aria-pressed={active} onClick={onClick}><span className="gift-concept-type-icon"><Icon size={19} /></span><span><strong>{title}</strong><small>{description}</small></span>{active && <Check size={17} />}</button>
}

function GiftItem({ gift, preview = false }) {
  return <article className={`gift-concept-item${preview ? ' gift-concept-item-preview' : ''}`}><span className="gift-concept-item-icon"><Gift size={19} /></span><div className="gift-concept-item-copy"><span className="gift-concept-item-type">{gift.type === 'fixed' ? 'Cota com valor definido' : 'Contribuição livre'}</span><strong>{gift.title || 'Nome do presente'}</strong><p>{gift.description || 'Uma descrição breve ajuda os convidados a entenderem a ideia.'}</p></div><div className="gift-concept-item-value"><strong>{gift.type === 'fixed' ? `R$ ${gift.amount || '0,00'}` : 'Você escolhe'}</strong>{preview && <button type="button">Escolher presente</button>}</div></article>
}

function GiftEditor({ gift, setGift, onAdd, compact = false }) {
  return <section className={`gift-concept-paper gift-concept-editor${compact ? ' gift-concept-editor-compact' : ''}`}><div className="gift-concept-section-heading"><div><span className="gift-concept-kicker">NOVO ITEM DA LISTA</span><h2>O que vocês gostariam de receber?</h2></div><span className="gift-concept-step">01</span></div><p className="gift-concept-lead">Escolham um formato. Vocês podem editar ou arquivar qualquer presente depois.</p><div className="gift-concept-type-list"><GiftTypeCard active={gift.type === 'fixed'} icon={Gift} title="Cota com valor definido" description="O convidado escolhe uma cota com valor conhecido." onClick={() => setGift((current) => ({ ...current, type: 'fixed' }))} /><GiftTypeCard active={gift.type === 'custom'} icon={Wallet} title="Valor livre" description="O convidado decide quanto quer contribuir." onClick={() => setGift((current) => ({ ...current, type: 'custom' }))} /></div><div className="gift-concept-fields"><label className="gift-concept-field-wide">Nome do presente<input value={gift.title} maxLength="120" onChange={(event) => setGift((current) => ({ ...current, title: event.target.value }))} placeholder="Ex.: uma noite na lua de mel" /></label>{gift.type === 'fixed' && <label>Valor da cota<input inputMode="decimal" value={gift.amount} onChange={(event) => setGift((current) => ({ ...current, amount: event.target.value }))} placeholder="150,00" /><small>O convidado verá este valor em reais.</small></label>}<label>Meta opcional<input inputMode="decimal" value={gift.goal} onChange={(event) => setGift((current) => ({ ...current, goal: event.target.value }))} placeholder="Sem meta" /><small>A meta é o total que vocês gostariam de receber para este item.</small></label><details className="gift-concept-more gift-concept-field-wide"><summary>Adicionar uma descrição <ChevronDown size={16} /></summary><textarea rows="3" maxLength="500" value={gift.description} onChange={(event) => setGift((current) => ({ ...current, description: event.target.value }))} placeholder="Contem aos convidados por que escolheram este presente." /></details></div><button className="gift-concept-primary" type="button" onClick={onAdd}><Plus size={18} /> Adicionar à lista</button>{!compact && <p className="gift-concept-safe-note"><CircleHelp size={15} /> Este estudo não salva alterações nem inicia pagamentos.</p>}</section>
}

function LivePreview({ gift }) {
  return <aside className="gift-concept-paper gift-concept-preview"><div className="gift-concept-section-heading"><div><span className="gift-concept-kicker">PRÉVIA DO CONVIDADO</span><h2>Um carinho para a nova etapa</h2></div><Heart size={19} /></div><p className="gift-concept-lead">Assim o item aparece na lista do casal.</p><GiftItem gift={gift} preview /><div className="gift-concept-preview-foot"><Sparkles size={16} /><span>O presente fica ligado à lista deste casamento.</span></div></aside>
}

function GiftList({ gifts, title = 'Presentes cadastrados', action }) {
  return <section className="gift-concept-paper gift-concept-list"><div className="gift-concept-section-heading"><div><span className="gift-concept-kicker">LISTA DO CASAL · EXEMPLOS</span><h2>{title}</h2></div>{action || <span className="gift-concept-count">{gifts.length} exemplos</span>}</div><div className="gift-concept-items">{gifts.map((item, index) => <GiftItem gift={item} key={`${item.title}-${index}`} />)}</div></section>
}

function AtelierOption() {
  const [gift, setGift] = useState({ ...examples[0] })
  const [gifts, setGifts] = useState(examples)
  const [notice, setNotice] = useState('')
  function addGift() {
    if (!gift.title.trim()) return setNotice('Escrevam o nome do presente para ver a prévia.')
    setGifts((current) => [gift, ...current])
    setNotice('Item incluído nesta prévia de demonstração.')
  }
  return <div className="gift-concept-layout gift-concept-atelier-layout"><div className="gift-concept-main-column"><GiftEditor gift={gift} setGift={setGift} onAdd={addGift} /><GiftList gifts={gifts} /></div><div className="gift-concept-side-column"><LivePreview gift={gift} /><div className="gift-concept-help"><Check size={17} /><span>O texto, o valor e o formato da prévia acompanham o tipo escolhido.</span></div></div>{notice && <div className="gift-concept-toast" role="status">{notice}</div>}</div>
}

function ActivityOption() {
  const [tab, setTab] = useState('list')
  const [gift, setGift] = useState({ title: '', type: 'fixed', amount: '', goal: '', description: '' })
  const [gifts, setGifts] = useState(examples)
  const [showForm, setShowForm] = useState(false)
  const [notice, setNotice] = useState('')
  function addGift() {
    if (!gift.title.trim()) return setNotice('Preencham o nome do presente antes de adicionar.')
    setGifts((current) => [gift, ...current])
    setGift({ title: '', type: 'fixed', amount: '', goal: '', description: '' })
    setShowForm(false)
    setNotice('Item incluído apenas neste mockup.')
  }
  return <div className="gift-concept-activity-layout"><section className="gift-concept-paper gift-concept-overview"><div className="gift-concept-section-heading"><div><span className="gift-concept-kicker">ORGANIZAÇÃO DO CASAMENTO</span><h2>Acompanhem a lista sem misturar tarefas.</h2></div><ListChecks size={21} /></div><p className="gift-concept-lead">A lista pode misturar contribuições por Pix e presentes físicos de lojas.</p><div className="gift-concept-tabs" role="tablist" aria-label="Áreas de presentes"><button className={tab === 'list' ? 'is-active' : ''} type="button" role="tab" aria-selected={tab === 'list'} onClick={() => setTab('list')}><Gift size={17} /> Montar lista</button><button className={tab === 'activity' ? 'is-active' : ''} type="button" role="tab" aria-selected={tab === 'activity'} onClick={() => setTab('activity')}><Wallet size={17} /> Como funciona</button></div></section>{tab === 'list' ? <><section className="gift-concept-paper gift-concept-list"><div className="gift-concept-section-heading"><div><span className="gift-concept-kicker">ITENS DA LISTA</span><h2>Presentes cadastrados</h2></div><button className="gift-concept-primary gift-concept-add-button" type="button" onClick={() => setShowForm((current) => !current)}><Plus size={17} /> Novo presente</button></div><p className="gift-concept-limit-note">Até 60 itens ativos por casamento. A lista fica privada até vocês publicarem.</p>{showForm && <GiftEditor gift={gift} setGift={setGift} onAdd={addGift} compact />}{gifts.map((item) => <GiftItem gift={item} key={item.title} />)}</section></> : <section className="gift-concept-paper gift-concept-activity"><div className="gift-concept-section-heading"><div><span className="gift-concept-kicker">PIX DIRETO OU LOJA</span><h2>Como o presente chega</h2></div></div><div className="gift-concept-empty"><span><Wallet size={22} /></span><strong>A plataforma não movimenta os presentes</strong><p>O convidado transfere o Pix diretamente pelo banco ou conclui a compra na loja escolhida.</p></div><button className="gift-concept-secondary" type="button" disabled><Wallet size={16} /> Transferência e compra fora do site</button></section>}{notice && <div className="gift-concept-toast" role="status">{notice}</div>}</div>
}

export default function GiftConcepts() {
  const [option, setOption] = useState('atelier')
  const isAtelier = option === 'atelier'
  return <div className="gift-concept-page"><header className="gift-concept-header"><a className="gift-concept-brand" href="/"><span>e<span>&amp;</span>t</span><strong>Estudo da aba Presentes</strong></a><a href="/painel/demo">Painel de demonstração <ArrowRight size={15} /></a></header><main className="gift-concept-shell"><div className="gift-concept-intro"><span className="gift-concept-kicker">MOCKUPS INTERATIVOS · JARDIM EDITORIAL</span><h1>Uma lista simples de montar,<br />fácil de entender.</h1><p>As opções abaixo usam componentes possíveis em React: campos, cartões selecionáveis, abas, prévia responsiva e estados vazios.</p></div><div className="gift-concept-choice" role="tablist" aria-label="Opções de organização dos presentes"><button className={isAtelier ? 'is-active' : ''} type="button" role="tab" aria-selected={isAtelier} onClick={() => setOption('atelier')}><span>01</span><strong>Prévia ao montar</strong><small>Editar e ver o presente na visão do convidado</small></button><button className={!isAtelier ? 'is-active' : ''} type="button" role="tab" aria-selected={!isAtelier} onClick={() => setOption('activity')}><span>02</span><strong>Lista e formas de presentear</strong><small>Pix direto ou presente físico em loja</small></button></div>{isAtelier ? <AtelierOption /> : <ActivityOption />}<p className="gift-concept-disclaimer">Mockup interativo com dados de exemplo. As ações não salvam no casamento e não processam pagamentos.</p></main><footer className="gift-concept-footer"><a href="https://henriquesouzas.com" target="_blank" rel="noreferrer">henriquesouzas.com</a><a href="/painel/demo"><ArrowLeft size={14} /> Voltar à demonstração</a></footer></div>
}
