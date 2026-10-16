import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, Check, CircleHelp, ExternalLink, Flower2, Heart, Link, MapPin, Smartphone, Users, X } from 'lucide-react'
import './MarketingLanding.css'

const photos = [
  { src: '/images/wedding-pexels.webp', avif: '/images/wedding-pexels.avif', alt: 'Casal caminha de mãos dadas por um jardim no dia do casamento', credit: 'Kanishka M Gunathunga · Pexels' },
  { src: '/images/wedding-moments.webp', avif: '/images/wedding-moments.avif', alt: 'Noivos caminham juntos por uma alameda arborizada', credit: 'Jonathan Borba · Pexels' },
]

function WeddingPhoto() {
  const [activePhoto, setActivePhoto] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const photoFrame = useRef(null)
  const dialog = useRef(null)
  const photo = photos[activePhoto]

  useEffect(() => {
    const currentDialog = dialog.current
    if (!currentDialog) return
    if (isOpen && !currentDialog.open) currentDialog.showModal()
    if (!isOpen && currentDialog.open) currentDialog.close()
  }, [isOpen])

  function movePhoto(event) {
    if (event.pointerType !== 'mouse' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const bounds = photoFrame.current.getBoundingClientRect()
    const offsetX = (event.clientX - bounds.left) / bounds.width - 0.5
    const offsetY = (event.clientY - bounds.top) / bounds.height - 0.5
    photoFrame.current.style.setProperty('--photo-shift-x', `${offsetX * -12}px`)
    photoFrame.current.style.setProperty('--photo-shift-y', `${offsetY * -12}px`)
  }

  function resetPhoto() {
    photoFrame.current?.style.setProperty('--photo-shift-x', '0px')
    photoFrame.current?.style.setProperty('--photo-shift-y', '0px')
  }

  function changePhoto(direction) {
    resetPhoto()
    setActivePhoto((current) => (current + direction + photos.length) % photos.length)
  }

  return <>
    <div className="marketing-photo-frame" ref={photoFrame} onPointerMove={movePhoto} onPointerLeave={resetPhoto}>
      <button className="marketing-photo-button" type="button" onClick={() => setIsOpen(true)} aria-label={`Ampliar foto: ${photo.alt}`} aria-haspopup="dialog">
        <picture><source srcSet={photo.avif} type="image/avif" /><img src={photo.src} alt={photo.alt} width="1280" height="853" fetchPriority="high" decoding="async" /></picture>
        <span className="marketing-photo-label"><span>Uma ideia para o convite de vocês</span><small>{photo.credit}</small></span>
      </button>
      <span className="marketing-flower-mark marketing-flower-hero" aria-hidden="true"><Flower2 /></span>
      <button className="marketing-photo-arrow marketing-photo-previous" type="button" onClick={() => changePhoto(-1)} aria-label="Ver foto anterior"><ArrowLeft size={18} /></button>
      <button className="marketing-photo-arrow marketing-photo-next" type="button" onClick={() => changePhoto(1)} aria-label="Ver próxima foto"><ArrowRight size={18} /></button>
    </div>
    <dialog ref={dialog} className="marketing-photo-dialog" aria-label="Foto de casamento ampliada" onClose={() => setIsOpen(false)} onClick={(event) => { if (event.target === dialog.current) setIsOpen(false) }}>
      <button className="marketing-dialog-close" type="button" onClick={() => setIsOpen(false)} aria-label="Fechar foto ampliada" autoFocus><X size={21} /></button>
      <picture><source srcSet={photo.avif} type="image/avif" /><img src={photo.src} alt={photo.alt} width="1280" height="853" /></picture>
      <p>{photo.credit}</p>
    </dialog>
  </>
}

function FloralMark({ className = '' }) {
  return <span className={`marketing-flower-mark ${className}`} aria-hidden="true"><Flower2 /></span>
}

export default function MarketingLanding() {
  return <div className="marketing-page">
    <header className="marketing-header">
      <a className="marketing-brand" href="/" aria-label="Página inicial"><span>e<span>&amp;</span>t</span><strong>sites de casamento</strong></a>
      <nav aria-label="Navegação principal"><a href="#como-funciona">Como funciona</a><a href="#presenca">Confirmações</a><a href="#recursos">Recursos</a><a href="#contato">Contato</a><a className="marketing-login" href="/painel">Entrar</a></nav>
      <a className="marketing-header-cta" href="/cadastro">Criar meu site <ArrowRight size={17} /></a>
    </header>
    <main>
      <section className="marketing-hero" aria-labelledby="marketing-title">
        <div className="marketing-hero-photo"><WeddingPhoto /></div>
        <div className="marketing-hero-copy"><span className="marketing-kicker">O COMEÇO DE UMA HISTÓRIA QUE VOCÊS VÃO COMPARTILHAR</span><h1 id="marketing-title">O casamento de vocês, do primeiro plano ao grande dia.</h1><p>Um espaço bonito e fácil de organizar para contar a história, reunir as informações e enviar o convite para cada pessoa.</p><div className="marketing-hero-actions"><a className="marketing-primary" href="/cadastro">Criar meu site grátis <ArrowRight size={18} /></a><a className="marketing-text-link" href="#como-funciona">Ver como funciona <ArrowRight size={16} /></a></div><span className="marketing-caption">Sem mensalidade para criar o site.</span><div className="marketing-hero-detail"><Flower2 size={21} strokeWidth={1.4} /><span>Uma identidade visual pensada para acompanhar cada detalhe.</span></div></div>
      </section>
      <section className="marketing-intro" id="como-funciona"><span className="marketing-kicker">SIMPLES DE MONTAR. FÁCIL DE COMPARTILHAR.</span><h2>As informações do casamento ficam em um só lugar.</h2><p>Vocês organizam o convite pelo painel. Os convidados abrem no celular pelo site, link curto ou QR code e encontram o que precisam.</p><FloralMark className="marketing-flower-intro" /></section>
      <section className="marketing-steps" aria-label="Como o site funciona">
        <article><span className="marketing-step-icon"><Heart size={25} /></span><span className="marketing-step-label">PARA COMEÇAR</span><h3>Contem a história de vocês</h3><p>Escolham um tema, escrevam a história e informem data, local e detalhes da celebração.</p></article>
        <article><span className="marketing-step-icon"><Users size={25} /></span><span className="marketing-step-label">PARA ORGANIZAR</span><h3>Acompanhem as confirmações</h3><p>Os convidados respondem pelo celular. Vocês acompanham as respostas no painel do casal.</p></article>
        <article><span className="marketing-step-icon"><Link size={25} /></span><span className="marketing-step-label">PARA COMPARTILHAR</span><h3>Enviem o convite como preferirem</h3><p>Mandem o link, usem um endereço curto ou incluam o QR code no convite impresso.</p></article>
      </section>
      <section className="marketing-showcase" id="recursos">
        <div className="marketing-showcase-photo"><picture><source srcSet="/images/wedding-moments.avif" type="image/avif" /><img src="/images/wedding-moments.webp" alt="Noivos caminham juntos por uma alameda arborizada" width="960" height="640" loading="lazy" decoding="async" /></picture><span>Foto: Jonathan Borba · Pexels</span><FloralMark className="marketing-flower-showcase" /></div>
        <div className="marketing-showcase-copy"><span className="marketing-kicker">UM CONVITE COM A CARA DE VOCÊS</span><h2>Personalização guiada, sem complicar.</h2><p>O site começa com um tema pronto. Vocês ajustam textos, cores e seções em um painel simples, com prévia antes de publicar.</p><ul><li><Check size={19} /> Temas e paletas em tons cuidadosamente escolhidos</li><li><Check size={19} /> História, data, local e programação</li><li><Check size={19} /> Confirmação de presença organizada</li><li><Check size={19} /> Link individual e QR code do convite</li></ul><a className="marketing-text-link" href="/cadastro">Começar a criar <ArrowRight size={17} /></a></div>
      </section>
      <section className="marketing-platform-gifts" id="presenca" aria-labelledby="marketing-presence-title"><div><span className="marketing-kicker">RESPOSTAS ORGANIZADAS</span><h2 id="marketing-presence-title">Saibam quem estará com vocês.</h2><p>Os convidados confirmam presença pelo convite. As respostas ficam reunidas no painel do casal para facilitar a organização da celebração.</p><p>O convite abre direto no navegador, sem exigir instalação de aplicativo.</p><a className="marketing-text-link" href="/cadastro">Criar meu site grátis <ArrowRight size={17} /></a></div><div className="marketing-platform-gifts-card"><span><Users size={24} /></span><strong>Confirmação pelo celular</strong><p>Os convidados respondem pelo próprio convite e o casal acompanha as respostas no painel.</p><small>Sem mensalidade para usar o site</small></div></section>
      <section className="marketing-guest-journey" aria-labelledby="marketing-journey-title"><div className="marketing-journey-heading"><span className="marketing-kicker">PENSADO PARA QUEM CRIA E PARA QUEM RECEBE</span><h2 id="marketing-journey-title">Um convite fácil de usar, em qualquer tela.</h2><p>O casal prepara as informações no painel. O convidado abre o convite no celular, encontra o que precisa e responde sem instalar um aplicativo.</p></div><div className="marketing-journey-grid"><article><span><Heart size={20} /></span><h3>Para os noivos</h3><p>Um lugar para contar a história, publicar os detalhes e acompanhar as confirmações.</p><a href="/cadastro">Começar meu site <ArrowRight size={15} /></a></article><article><span><Smartphone size={20} /></span><h3>Para os convidados</h3><p>Acesso pelo convite individual ou pelo QR code que os noivos compartilham.</p><a href="#como-funciona">Ver como funciona <ArrowRight size={15} /></a></article><article><span><MapPin size={20} /></span><h3>Para a celebração</h3><p>Data, local e programação reunidos nas informações do convite.</p><a href="#recursos">Conhecer o convite <ArrowRight size={15} /></a></article></div></section>
      <section className="marketing-faq" aria-labelledby="marketing-faq-title"><div className="marketing-faq-heading"><span className="marketing-kicker">ANTES DE COMEÇAR</span><h2 id="marketing-faq-title">Dúvidas comuns, respostas diretas.</h2></div><div className="marketing-faq-list"><details><summary><span><CircleHelp size={18} /> Preciso pagar para criar o site?</span><span className="marketing-faq-symbol" aria-hidden="true">+</span></summary><p>Não. Criar e compartilhar o site é gratuito e não tem mensalidade.</p></details><details><summary><span><CircleHelp size={18} /> Como os convidados confirmam presença?</span><span className="marketing-faq-symbol" aria-hidden="true">+</span></summary><p>Respondem pelo convite no celular ou computador. O casal acompanha as respostas pelo painel.</p></details><details><summary><span><CircleHelp size={18} /> Os convidados precisam instalar um aplicativo?</span><span className="marketing-faq-symbol" aria-hidden="true">+</span></summary><p>Não. O convite abre no navegador do celular ou computador.</p></details></div></section>
      <section className="marketing-final"><span className="marketing-kicker">UMA HISTÓRIA DE CADA VEZ</span><h2>Vamos começar a preparar o convite de vocês?</h2><a className="marketing-primary" href="/cadastro">Criar meu site grátis <ArrowRight size={18} /></a><span className="marketing-final-note">Criar e usar o site não tem mensalidade.</span><a className="marketing-final-login" href="/painel">Já tenho uma conta</a></section>
    </main>
    <footer className="marketing-footer" id="contato"><div className="marketing-footer-content"><div className="marketing-footer-about"><span className="marketing-footer-brand">e<span>&amp;</span>t</span><h2>Um convite para reunir tudo o que importa.</h2><p>Sites de casamento responsivos, com a história do casal, informações da celebração e caminhos simples para cada convidado.</p></div><div className="marketing-footer-links"><h3>Comece por aqui</h3><a href="/cadastro">Criar meu site</a><a href="#como-funciona">Como funciona</a><a href="#presenca">Confirmação de presença</a><a href="/painel">Entrar no painel</a></div><div className="marketing-footer-contact"><h3>Fale com a gente</h3><a href="https://wa.me/5531988924409">WhatsApp: (31) 98892-4409</a><a href="mailto:henriquesouza1832001@gmail.com">henriquesouza1832001@gmail.com</a><a href="https://henriquesouzas.com" target="_blank" rel="noreferrer">henriquesouzas.com <ExternalLink size={14} /></a></div></div><div className="marketing-footer-bottom"><span>e&amp;t · Sites de casamento</span><a href="https://henriquesouzas.com" target="_blank" rel="noreferrer">Desenvolvido por henriquesouzas.com</a></div></footer>
  </div>
}
