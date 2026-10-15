import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, Check, Expand, ExternalLink, Heart, QrCode, Users, X } from 'lucide-react'

const photos = [
  { src: '/images/wedding-pexels.webp', alt: 'Casal caminha de mãos dadas por um jardim no dia do casamento', credit: 'Kanishka M Gunathunga · Pexels' },
  { src: '/images/wedding-moments.webp', alt: 'Noivos caminham juntos por uma alameda arborizada', credit: 'Jonathan Borba · Pexels' },
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
        <img src={photo.src} alt={photo.alt} width="1280" height="853" fetchPriority="high" decoding="async" />
        <span className="marketing-photo-label"><span>Foto de referência</span><small>{photo.credit}</small></span>
        <span className="marketing-photo-expand"><Expand size={16} /> Ver foto</span>
      </button>
      <button className="marketing-photo-arrow marketing-photo-previous" type="button" onClick={() => changePhoto(-1)} aria-label="Ver foto anterior"><ArrowLeft size={17} /></button>
      <button className="marketing-photo-arrow marketing-photo-next" type="button" onClick={() => changePhoto(1)} aria-label="Ver próxima foto"><ArrowRight size={17} /></button>
      <span className="marketing-photo-count" aria-live="polite">{String(activePhoto + 1).padStart(2, '0')} / {String(photos.length).padStart(2, '0')}</span>
    </div>
    <dialog ref={dialog} className="marketing-photo-dialog" aria-label="Foto de casamento ampliada" onClose={() => setIsOpen(false)} onClick={(event) => { if (event.target === dialog.current) setIsOpen(false) }}>
      <button className="marketing-dialog-close" type="button" onClick={() => setIsOpen(false)} aria-label="Fechar foto ampliada" autoFocus><X size={21} /></button>
      <img src={photo.src} alt={photo.alt} width="1280" height="853" />
      <p>{photo.credit}</p>
    </dialog>
  </>
}

export default function MarketingLanding() {
  return <div className="marketing-page">
    <header className="marketing-header"><a className="marketing-brand" href="/" aria-label="Página inicial"><span>e<span>&</span>t</span><strong>sites de casamento</strong></a><nav aria-label="Navegação principal"><a href="#como-funciona">Como funciona</a><a href="#recursos">Recursos</a><a className="marketing-login" href="/painel">Entrar</a></nav></header>
    <main>
      <section className="marketing-hero" aria-labelledby="marketing-title">
        <div className="marketing-hero-photo"><WeddingPhoto /></div>
        <div className="marketing-hero-copy"><span className="marketing-kicker">UM CONVITE QUE CONTA A HISTÓRIA DE VOCÊS</span><h1 id="marketing-title">O grande dia começa com <i>um convite feito por vocês.</i></h1><p>Um site para reunir a história do casal, os detalhes da celebração e as pessoas que fazem parte dela.</p><div className="marketing-hero-actions"><a className="marketing-primary" href="/cadastro">Criar meu site <ArrowRight size={16} /></a><a className="marketing-text-link" href="#como-funciona">Conhecer a plataforma <ArrowRight size={15} /></a></div><span className="marketing-caption">Escolham um tema e personalizem no tempo de vocês.</span></div>
      </section>
      <section className="marketing-intro" id="como-funciona"><span className="marketing-kicker">SEM COMPLICAÇÃO, DO PRIMEIRO PASSO AO CONVITE</span><h2>As informações do casamento<br /><i>em um lugar fácil de encontrar.</i></h2><p>Compartilhem um link com os convidados. Eles abrem o site no celular, conferem os detalhes e confirmam presença.</p></section>
      <section className="marketing-steps"><article><span>01</span><div><Heart size={19} /><h3>Montem o site do casal</h3><p>Escolham um tema, contem a história de vocês e organizem as informações do dia.</p></div></article><article><span>02</span><div><Users size={19} /><h3>Acompanhem as confirmações</h3><p>Organizem os convidados e consultem as respostas em um só painel.</p></div></article><article><span>03</span><div><QrCode size={19} /><h3>Compartilhem com todos</h3><p>Enviem o link ou o QR code para os convidados acessarem o convite.</p></div></article></section>
      <section className="marketing-showcase" id="recursos"><div className="marketing-showcase-photo"><img src="/images/wedding-moments.webp" alt="Casal caminha junto em um jardim no dia do casamento" width="960" height="640" loading="lazy" decoding="async" /><span>Foto: Jonathan Borba · Pexels</span></div><div className="marketing-showcase-copy"><span className="marketing-kicker">OS DETALHES EM UM SÓ LUGAR</span><h2>Um convite acolhedor, do jeito de vocês.</h2><ul><li><Check size={16} /> História, fotos e programação</li><li><Check size={16} /> Confirmação de presença organizada</li><li><Check size={16} /> Acesso por link e QR code</li><li><Check size={16} /> Temas que se adaptam ao celular</li></ul><a className="marketing-text-link" href="/cadastro">Começar a criar <ArrowRight size={15} /></a></div></section>
      <section className="marketing-final"><span className="marketing-kicker">O PRIMEIRO PASSO É DE VOCÊS</span><h2>Vamos começar a contar essa história?</h2><a className="marketing-primary" href="/cadastro">Criar meu site <ArrowRight size={16} /></a><a className="marketing-final-login" href="/painel">Já tenho uma conta</a></section>
    </main><footer className="marketing-footer"><span>e<span>&</span>t · sites de casamento</span><a href="https://henriquesouzas.com" target="_blank" rel="noreferrer">henriquesouzas.com <ExternalLink size={12} /></a></footer>
  </div>
}
