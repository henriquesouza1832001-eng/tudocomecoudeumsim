import { useState } from 'react'
import { ArrowRight, CalendarDays, Camera, Check, CircleHelp, Gift, Heart, Image, ListChecks, Menu, Paintbrush, Users, Wallet } from 'lucide-react'
import { PRODUCT_NAME } from './product-config.js'
import './NavigationConcepts.css'

const areas = [
  { title: 'Convite', items: [{ label: 'Personalizar', icon: Paintbrush }, { label: 'Eventos', icon: CalendarDays }] },
  { title: 'Convidados', items: [{ label: 'Lista e confirmações', icon: Users }, { label: 'Padrinhos', icon: Heart }, { label: 'Equipe', icon: ListChecks }] },
  { title: 'Organização', items: [{ label: 'Despesas', icon: Wallet }, { label: 'Presentes', icon: Gift }, { label: 'Álbum', icon: Camera }] },
]

const steps = ['Definam os detalhes do evento', 'Montem a lista de convidados', 'Personalizem e publiquem o convite']

function GuidedSteps() {
  const [visible, setVisible] = useState(true)
  const [complete, setComplete] = useState([])
  if (!visible) return <button className="nav-concept-reopen" type="button" onClick={() => setVisible(true)}>Mostrar próximos passos</button>
  return <section className="nav-concept-guide" aria-labelledby="nav-concept-guide-title">
    <div className="nav-concept-guide-heading"><span><small>COMEÇO RÁPIDO</small><strong id="nav-concept-guide-title">Três passos para deixar tudo pronto</strong></span><button type="button" onClick={() => setVisible(false)}>Pular</button></div>
    <div className="nav-concept-steps">{steps.map((step, index) => <button type="button" key={step} className={complete.includes(index) ? 'done' : ''} onClick={() => setComplete((current) => current.includes(index) ? current.filter((item) => item !== index) : [...current, index])}><span>{complete.includes(index) ? <Check size={15} /> : index + 1}</span>{step}<ArrowRight size={15} /></button>)}</div>
    <small className="nav-concept-progress">{complete.length} de 3 concluídos · vocês podem voltar quando quiserem</small>
  </section>
}

function ContentPreview({ active }) {
  return <section className="nav-concept-content">
    <span className="nav-concept-eyebrow">ÁREA DO CASAL</span>
    <div className="nav-concept-content-heading"><div><h3>{active}</h3><p>As informações ficam organizadas neste casamento e podem ser ajustadas depois.</p></div><button type="button">Abrir {active.toLowerCase()} <ArrowRight size={15} /></button></div>
    <div className="nav-concept-cards"><article><span>PRÓXIMO PASSO</span><strong>Incluam as informações essenciais</strong><small>O restante pode ser preenchido mais tarde.</small></article><article><span>SALVO NO CASAMENTO</span><strong>Continuem de onde pararam</strong><small>As alterações são mantidas no painel.</small></article></div>
  </section>
}

function SidebarOption() {
  const [active, setActive] = useState('Personalizar')
  return <article className="nav-concept-option">
    <header><span className="nav-concept-eyebrow">OPÇÃO A</span><h2>Menu lateral por áreas</h2><p>As áreas ficam sempre visíveis. O passo a passo aparece no início e pode ser pulado ou reaberto.</p></header>
    <div className="nav-concept-frame nav-concept-sidebar-frame">
      <aside className="nav-concept-sidebar"><div className="nav-concept-brand"><span>e&t</span><div><strong>Henrique & Laryssa</strong><small>Área dos noivos</small></div></div>{areas.map((group) => <div className="nav-concept-nav-group" key={group.title}><small>{group.title}</small>{group.items.map(({ label, icon: Icon }) => <button key={label} className={active === label ? 'active' : ''} type="button" onClick={() => setActive(label)}><Icon size={17} />{label}</button>)}</div>)}<a href="/ajuda"><CircleHelp size={16} /> Ajuda</a></aside>
      <div className="nav-concept-workspace"><div className="nav-concept-mobile-bar"><button type="button" aria-label="Abrir navegação"><Menu size={18} /></button><strong>{active}</strong></div><GuidedSteps /><ContentPreview active={active} /></div>
    </div>
  </article>
}

function StagesOption() {
  const [active, setActive] = useState('Convidados')
  const stageItems = [{ label: 'Convite', icon: Image }, { label: 'Convidados', icon: Users }, { label: 'Evento', icon: CalendarDays }, { label: 'Orçamento', icon: Wallet }]
  return <article className="nav-concept-option">
    <header><span className="nav-concept-eyebrow">OPÇÃO B</span><h2>Etapas no topo e atalhos</h2><p>Quatro etapas reduzem as escolhas iniciais; as ferramentas específicas aparecem como cartões na área selecionada.</p></header>
    <div className="nav-concept-frame nav-concept-stages-frame">
      <div className="nav-concept-stage-bar" aria-label="Etapas do casamento">{stageItems.map(({ label, icon: Icon }, index) => <button type="button" className={active === label ? 'active' : ''} key={label} onClick={() => setActive(label)}><span>{index + 1}</span><Icon size={17} />{label}</button>)}</div>
      <div className="nav-concept-stage-workspace"><div className="nav-concept-welcome"><div><span className="nav-concept-eyebrow">VAMOS COM CALMA</span><h3>{active === 'Convidados' ? 'Comecem por quem vai celebrar com vocês.' : `Organizem ${active.toLowerCase()} em poucos passos.`}</h3><p>Façam o essencial agora. O painel guarda o progresso e vocês podem continuar depois.</p></div><Heart size={25} /></div><GuidedSteps /><div className="nav-concept-shortcuts"><button type="button" onClick={() => setActive('Convidados')}><Users size={18} /><span><strong>Lista de convidados</strong><small>Importar ou cadastrar pessoas</small></span><ArrowRight size={15} /></button><button type="button"><Gift size={18} /><span><strong>Presentes</strong><small>Pix direto ou links de lojas</small></span><ArrowRight size={15} /></button></div></div>
    </div>
  </article>
}

export default function NavigationConcepts() {
  return <main className="nav-concepts-page">
    <header className="nav-concepts-header"><a href="/"><span>e&t</span><strong>{PRODUCT_NAME}</strong></a><span>Estudo local · não é a tela publicada</span></header>
    <section className="nav-concepts-intro"><span className="nav-concept-eyebrow">NAVEGAÇÃO E PRIMEIROS PASSOS</span><h1>Menos procura. Mais clareza.</h1><p>Dois caminhos possíveis para encurtar a navegação, manter a identidade de casamento e ajudar o casal a retomar o planejamento sem preencher tudo de uma vez.</p></section>
    <div className="nav-concepts-options"><SidebarOption /><StagesOption /></div>
    <footer className="nav-concepts-footer"><span>As informações e os nomes são apenas exemplos de interface.</span><a href="https://henriquesouzas.com" target="_blank" rel="noreferrer">henriquesouzas.com</a></footer>
  </main>
}
