import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, Check, Expand, ExternalLink, Heart, QrCode, Users, X } from 'lucide-react'
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
        <span className="marketing-photo-label"><span>Exemplo de convite</span><small>{photo.credit}</small></span>
        <span className="marketing-photo-expand"><Expand size={16} /> Ver foto</span>
      </button>
      <button className="marketing-photo-arrow marketing-photo-previous" type="button" onClick={() => changePhoto(-1)} aria-label="Ver foto anterior"><ArrowLeft size={17} /></button>
      <button className="marketing-photo-arrow marketing-photo-next" type="button" onClick={() => changePhoto(1)} aria-label="Ver próxima foto"><ArrowRight size={17} /></button>
      <span className="marketing-photo-count" aria-live="polite">Foto {activePhoto + 1} de {photos.length}</span>
    </div>
    <dialog ref={dialog} className="marketing-photo-dialog" aria-label="Foto de casamento ampliada" onClose={() => setIsOpen(false)} onClick={(event) => { if (event.target === dialog.current) setIsOpen(false) }}>
      <button className="marketing-dialog-close" type="button" onClick={() => setIsOpen(false)} aria-label="Fechar foto ampliada" autoFocus><X size={21} /></button>
      <picture><source srcSet={photo.avif} type="image/avif" /><img src={photo.src} alt={photo.alt} width="1280" height="853" /></picture>
      <p>{photo.credit}</p>
    </dialog>
  </>
}

export default function MarketingLanding() {
  return <div className="marketing-page">
    <header className="marketing-header"><a className="marketing-brand" href="/" aria-label="Página inicial"><span>e<span>&</span>t</span><strong>sites de casamento</strong></a><nav aria-label="Navegação principal"><a href="#como-funciona">Como funciona</a><a href="#recursos">Recursos</a><a href="https://wa.me/5531988924409">Contato</a><a className="marketing-login" href="/painel">Entrar</a></nav><a className="marketing-header-cta" href="/cadastro">Criar meu site <ArrowRight size={17} /></a></header>
    <main>
      <section className="marketing-hero" aria-labelledby="marketing-title">
        <div className="marketing-hero-photo"><WeddingPhoto /></div>
        <div className="marketing-hero-copy"><span className="marketing-kicker">PARA CELEBRAR O AMOR DE VOCÊS</span><h1 id="marketing-title">Um site de casamento com a história de vocês.</h1><p>Reúnam o convite, os detalhes do grande dia, a confirmação de presença e a lista de presentes em um só lugar.</p><div className="marketing-hero-actions"><a className="marketing-primary" href="/cadastro">Criar meu site de casamento <ArrowRight size={18} /></a><a className="marketing-text-link" href="#como-funciona">Ver como funciona</a></div><span className="marketing-caption">Personalizem o convite e compartilhem com quem faz parte desse dia.</span></div>
      </section>
      <section className="marketing-intro" id="como-funciona"><span className="marketing-kicker">FÁCIL DE CRIAR E COMPARTILHAR</span><h2>O que vocês precisam para organizar o grande dia.</h2><p>O casal monta o site. Os convidados abrem o link no celular, encontram as informações e confirmam presença.</p></section>
      <section className="marketing-steps"><article><div><Heart size={24} /><span className="marketing-step-label">PERSONALIZAÇÃO</span><h3>Um site com a cara de vocês</h3><p>Escolham um tema e contem a história do casal em um convite digital.</p></div></article><article><div><Users size={24} /><span className="marketing-step-label">ORGANIZAÇÃO</span><h3>Confirmações em um só lugar</h3><p>Acompanhem as respostas dos convidados pelo painel dos noivos.</p></div></article><article><div><QrCode size={24} /><span className="marketing-step-label">COMPARTILHAMENTO</span><h3>Um link fácil de enviar</h3><p>Compartilhem o convite pelo site, por um link curto ou por QR code.</p></div></article></section>
      <section className="marketing-showcase" id="recursos"><div className="marketing-showcase-photo"><picture><source srcSet="/images/wedding-moments.avif" type="image/avif" /><img src="/images/wedding-moments.webp" alt="Casal caminha junto em um jardim no dia do casamento" width="960" height="640" loading="lazy" decoding="async" /></picture><span>Foto: Jonathan Borba · Pexels</span></div><div className="marketing-showcase-copy"><span className="marketing-kicker">UM CONVITE QUE APROXIMA</span><h2>As informações do casamento, sempre à mão.</h2><ul><li><Check size={19} /> História e fotos do casal</li><li><Check size={19} /> Data, local e programação</li><li><Check size={19} /> Confirmação de presença</li><li><Check size={19} /> Link de acesso e QR code</li></ul><a className="marketing-text-link" href="/cadastro">Criar meu site <ArrowRight size={17} /></a></div></section>
      <section className="marketing-final"><span className="marketing-kicker">O PRIMEIRO PASSO É DE VOCÊS</span><h2>Vamos criar o convite do grande dia?</h2><a className="marketing-primary" href="/cadastro">Começar meu site <ArrowRight size={18} /></a><a className="marketing-final-login" href="/painel">Já tenho uma conta</a></section>
    </main><footer className="marketing-footer"><div className="marketing-footer-content"><div className="marketing-footer-about"><span className="marketing-footer-brand">e<span>&</span>t</span><h2>Sites de casamento para celebrar a história de vocês.</h2><p>Um convite digital para reunir os detalhes do grande dia e compartilhar com quem vocês amam.</p></div><div className="marketing-footer-links"><h3>Comece por aqui</h3><a href="/cadastro">Criar meu site</a><a href="#como-funciona">Como funciona</a><a href="/painel">Entrar no painel</a></div><div className="marketing-footer-contact"><h3>Fale com a gente</h3><a href="https://wa.me/5531988924409">WhatsApp: (31) 98892-4409</a><a href="mailto:henriquesouza1832001@gmail.com">henriquesouza1832001@gmail.com</a><a href="https://henriquesouzas.com" target="_blank" rel="noreferrer">henriquesouzas.com <ExternalLink size={14} /></a></div></div><div className="marketing-footer-bottom"><span>© 2026 e&t · Sites de casamento</span><a href="https://henriquesouzas.com" target="_blank" rel="noreferrer">Desenvolvido por henriquesouzas.com</a></div></footer>
  </div>
}
