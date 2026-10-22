import { useState } from 'react'
import { ArrowDown, ArrowRight, CalendarDays, Check, Clock3, Gift, MapPin, Menu, Smartphone, Tablet, Monitor } from 'lucide-react'
import { PRODUCT_NAME } from './product-config.js'
import './DeviceExperienceConcepts.css'

const devices = [
  { id: 'desktop', label: 'Computador', icon: Monitor, width: 1040 },
  { id: 'tablet', label: 'Tablet', icon: Tablet, width: 760 },
  { id: 'mobile', label: 'Celular', icon: Smartphone, width: 390 },
]

function InvitationSite({ device, mood }) {
  return <div className={`device-site device-site-${device} device-site-mood-${mood}`}>
    <header className="device-site-header"><a className="device-monogram" href="#inicio" aria-label="Início do convite">H<span>&</span>L</a><nav aria-label="Seções do convite"><a href="#evento">O evento</a><a href="#historia">Nossa história</a><a href="#presentes">Presentes</a><a className="device-rsvp-link" href="#confirmar">Confirmar presença <ArrowRight size={14} /></a></nav><button className="device-menu-button" type="button" aria-label="Abrir menu"><Menu size={20} /></button></header>
    <section id="inicio" className="device-site-hero"><div className="device-hero-art" aria-label="Espaço reservado para a foto escolhida pelo casal"><span>FOTO DO CASAL</span><strong>H <i>&</i> L</strong><small>Imagem personalizada no convite</small></div><div className="device-hero-copy"><span className="device-overline">COM ALEGRIA, CONVIDAMOS</span><h1>Henrique <i>&</i><br />Larissa</h1><p>15 de outubro de 2028 <span>·</span> 16h30</p><a href="#confirmar">Confirmar presença <ArrowRight size={16} /></a><small>Faltam 182 dias para o grande dia</small></div><a className="device-scroll-cue" href="#evento"><ArrowDown size={17} /><span>Descubra os detalhes</span></a></section>
    <section id="evento" className="device-event-section"><div className="device-section-heading"><span className="device-overline">UM DIA PARA CELEBRAR</span><h2>Esperamos você</h2><p>Seu convite tem as informações essenciais. O restante está organizado por etapa.</p></div><div className="device-event-card"><span className="device-event-icon"><CalendarDays size={20} /></span><div><span className="device-overline">CERIMÔNIA E RECEPÇÃO</span><h3>Casa das Oliveiras</h3><p><CalendarDays size={14} /> Sábado, 15 de outubro · 16h30</p><p><MapPin size={14} /> Rua das Acácias, 245 · Belo Horizonte</p></div><a href="#evento" aria-label="Ver mapa do evento"><ArrowRight size={17} /></a></div><div id="confirmar" className="device-confirm-card"><span className="device-overline">RESPOSTA AO CONVITE</span><h3>Vocês poderão estar conosco?</h3><p>Respondam por evento. O convite individual fica guardado para consultar depois.</p><button type="button">Responder agora <ArrowRight size={15} /></button><small><Clock3 size={13} /> Até 15 de setembro</small></div></section>
    <section id="historia" className="device-story-section"><span className="device-overline">COM CARINHO</span><h2>Uma celebração feita para compartilhar.</h2><p>Os detalhes foram organizados para que você encontre o que precisa sem procurar pela página inteira.</p><a href="#presentes">Ver lista de presentes <Gift size={15} /></a></section>
    <footer className="device-site-footer">Com carinho, Henrique & Larissa <a href="https://henriquesouzas.com" target="_blank" rel="noreferrer">henriquesouzas.com</a></footer>
    {device === 'mobile' && <div className="device-mobile-actions"><a href="#confirmar">Confirmar presença</a><a href="#evento" aria-label="Ver evento"><CalendarDays size={19} /></a></div>}
  </div>
}

export default function DeviceExperienceConcepts() {
  const [device, setDevice] = useState('desktop')
  const [mood, setMood] = useState('garden')
  const selected = devices.find((item) => item.id === device)
  return <main className="device-study-page">
    <header className="device-study-header"><a href="/"><span>H<span>&</span>L</span><strong>{PRODUCT_NAME}</strong></a><span>Prévia local · conteúdo fictício</span></header>
    <section className="device-study-intro"><span className="device-overline">UM CONVITE, TRÊS EXPERIÊNCIAS</span><h1>O site se adapta a quem está usando.</h1><p>A mesma história, os mesmos dados e a mesma identidade. A composição muda para caber no dispositivo: mais contexto no computador, leitura confortável no tablet e ações rápidas no celular.</p></section>
    <section className="device-study-workspace" aria-label="Prévia responsiva do convite"><div className="device-switcher" role="tablist" aria-label="Escolher dispositivo">{devices.map(({ id, label, icon: Icon }) => <button key={id} id={`device-tab-${id}`} type="button" role="tab" aria-selected={device === id} aria-controls="device-preview" onClick={() => setDevice(id)}><Icon size={18} />{label}</button>)}</div><div className="device-style-switcher" role="group" aria-label="Escolher direção visual"><button type="button" aria-pressed={mood === 'garden'} onClick={() => setMood('garden')}><span className="device-style-swatch device-style-swatch-garden" /> Jardim editorial</button><button type="button" aria-pressed={mood === 'evening'} onClick={() => setMood('evening')}><span className="device-style-swatch device-style-swatch-evening" /> Celebração à noite</button></div><div className={`device-preview-shell device-preview-${device}`} id="device-preview" role="tabpanel" aria-labelledby={`device-tab-${device}`}><div className="device-preview-topbar"><span /><span /><span /><small>henrique-larissa.convite</small></div><div className="device-preview-canvas" style={{ '--device-width': `${selected.width}px` }}><InvitationSite device={device} mood={mood} /></div></div><div className="device-preview-caption"><span><Check size={16} /> Layout adaptado para {selected.label.toLowerCase()}</span><span>Composição demonstrativa, ainda não aplicada ao site publicado</span></div></section>
    <section className="device-study-principles"><article><span>01</span><div><strong>Começar pelo essencial</strong><p>Data, local e confirmação aparecem sem exigir uma rolagem longa.</p></div></article><article><span>02</span><div><strong>Mais espaço onde ajuda</strong><p>Computador e tablet usam colunas e navegação própria; celular mantém ações ao alcance do polegar.</p></div></article><article><span>03</span><div><strong>Um conteúdo sincronizado</strong><p>O casal edita uma vez. A apresentação responde ao tamanho da tela sem criar três sites para manter.</p></div></article></section>
    <footer className="device-study-footer"><span>Estudo visual implementável em React e CSS responsivo.</span><a href="https://henriquesouzas.com" target="_blank" rel="noreferrer">henriquesouzas.com</a></footer>
  </main>
}
