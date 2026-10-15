import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, Check, ExternalLink, Gift, Heart, Link, QrCode, ShieldCheck, Users, Wallet, X } from 'lucide-react'
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
      <button className="marketing-photo-arrow marketing-photo-previous" type="button" onClick={() => changePhoto(-1)} aria-label="Ver foto anterior"><ArrowLeft size={18} /></button>
      <button className="marketing-photo-arrow marketing-photo-next" type="button" onClick={() => changePhoto(1)} aria-label="Ver próxima foto"><ArrowRight size={18} /></button>
      <span className="marketing-photo-count" aria-live="polite">0{activePhoto + 1} <span>/ 0{photos.length}</span></span>
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
    <header className="marketing-header">
      <a className="marketing-brand" href="/" aria-label="Página inicial"><span>e<span>&amp;</span>t</span><strong>sites de casamento</strong></a>
      <nav aria-label="Navegação principal"><a href="#como-funciona">Como funciona</a><a href="#presentes">Presentes e Pix</a><a href="#recursos">Recursos</a><a href="https://wa.me/5531988924409">Contato</a><a className="marketing-login" href="/painel">Entrar</a></nav>
      <a className="marketing-header-cta" href="/cadastro">Criar meu site <ArrowRight size={17} /></a>
    </header>
    <main>
      <section className="marketing-hero" aria-labelledby="marketing-title">
        <div className="marketing-hero-photo"><WeddingPhoto /></div>
        <div className="marketing-hero-copy"><span className="marketing-kicker">O CONVITE COMEÇA COM A HISTÓRIA DE VOCÊS</span><h1 id="marketing-title">O grande dia começa com um convite feito por vocês.</h1><p>Reúnam a história do casal, os detalhes da celebração, as confirmações e os presentes em um só lugar, fácil de compartilhar com cada convidado.</p><div className="marketing-hero-actions"><a className="marketing-primary" href="/cadastro">Criar meu site grátis <ArrowRight size={18} /></a><a className="marketing-text-link" href="#como-funciona">Ver como funciona</a></div><span className="marketing-caption">Sem mensalidade para criar o site. A taxa dos presentes será informada antes do pagamento.</span></div>
      </section>
      <section className="marketing-intro" id="como-funciona"><span className="marketing-kicker">DO PRIMEIRO PASSO AO DIA DO CASAMENTO</span><h2>Uma página para organizar e compartilhar tudo o que importa.</h2><p>Vocês montam o convite; cada pessoa acessa pelo link ou QR code para encontrar as informações e responder ao convite.</p></section>
      <section className="marketing-steps" aria-label="Etapas para criar e compartilhar o site">
        <article><div className="marketing-step-number">01</div><Heart size={25} /><span className="marketing-step-label">CRIEM</span><h3>Comecem com a história de vocês</h3><p>Escolham um tema, adicionem fotos e organizem data, local e programação do casamento.</p></article>
        <article><div className="marketing-step-number">02</div><Users size={25} /><span className="marketing-step-label">ORGANIZEM</span><h3>Acompanhem as confirmações</h3><p>Convidados respondem pelo celular e vocês acompanham as respostas no painel do casal.</p></article>
        <article><div className="marketing-step-number">03</div><Link size={25} /><span className="marketing-step-label">COMPARTILHEM</span><h3>Enviem o convite do jeito mais fácil</h3><p>Compartilhem o site por mensagem, link curto ou QR code no convite impresso.</p></article>
      </section>
      <section className="marketing-showcase" id="recursos">
        <div className="marketing-showcase-photo"><picture><source srcSet="/images/wedding-moments.avif" type="image/avif" /><img src="/images/wedding-moments.webp" alt="Casal caminha junto em um jardim no dia do casamento" width="960" height="640" loading="lazy" decoding="async" /></picture><span>Foto ilustrativa · Jonathan Borba · Pexels</span></div>
        <div className="marketing-showcase-copy"><span className="marketing-kicker">UM CONVITE QUE AJUDA DE VERDADE</span><h2>As informações do casamento, sempre à mão.</h2><ul><li><Check size={19} /> História e fotos do casal</li><li><Check size={19} /> Data, local e programação</li><li><Check size={19} /> Confirmação de presença organizada</li><li><Check size={19} /> Acesso por link e QR code</li><li><Check size={19} /> Lista de presentes e orientações</li></ul><a className="marketing-text-link" href="/cadastro">Criar meu site <ArrowRight size={17} /></a></div>
      </section>
      <section className="marketing-gifts" id="presentes" aria-labelledby="marketing-gifts-title">
        <div className="marketing-gifts-copy"><span className="marketing-kicker">PRESENTES COM VALORES À VISTA</span><h2 id="marketing-gifts-title">Um jeito claro de presentear e acompanhar o que foi recebido.</h2><p>A lista pode reunir presentes em dinheiro e links de lojas. Para o Pix pago dentro da plataforma, o fluxo previsto é um split automático pelo provedor: a taxa da plataforma e a tarifa de processamento aparecem antes da confirmação; o restante é destinado à conta conectada do casal.</p><p>Essa integração ainda está em preparação. A confirmação do pagamento dependerá do provedor; não vamos apresentar um presente como pago apenas porque alguém voltou ao site.</p><div className="marketing-gift-note"><ShieldCheck size={21} /><span>Taxas, valor líquido e forma de repasse devem ficar visíveis antes de o convidado pagar.</span></div></div>
        <div className="marketing-gift-flow" aria-label="Fluxo previsto para um presente por Pix na plataforma">
          <div className="marketing-flow-label">FLUXO PREVISTO PARA O PIX NA PLATAFORMA</div>
          <div className="marketing-flow-step"><span className="marketing-flow-icon"><Gift size={21} /></span><div><strong>O convidado escolhe o presente</strong><small>Valor e taxas aparecem no checkout</small></div></div>
          <div className="marketing-flow-connector"><span /></div>
          <div className="marketing-flow-step"><span className="marketing-flow-icon"><Wallet size={21} /></span><div><strong>O provedor confirma e separa</strong><small>Comissão da plataforma + tarifa do meio de pagamento</small></div></div>
          <div className="marketing-flow-connector"><span /></div>
          <div className="marketing-flow-step"><span className="marketing-flow-icon"><QrCode size={21} /></span><div><strong>O casal acompanha o recebimento</strong><small>O saldo líquido segue para a conta conectada</small></div></div>
          <div className="marketing-flow-footer">Criar e personalizar o site sem mensalidade</div>
        </div>
      </section>
      <section className="marketing-store-links"><div><span className="marketing-kicker">PRESENTES DE LOJAS</span><h2>Uma lista que também pode levar direto à loja.</h2><p>Na primeira etapa, os itens de lojas usam links externos para a página de compra. Integrações de catálogo serão avaliadas depois, loja por loja.</p></div><div className="marketing-store-card"><ExternalLink size={23} /><strong>Compra direto na loja</strong><span>O convidado abre o link e conclui a compra no site da loja. Esse pedido não passa pelo checkout Pix da plataforma.</span></div></section>
      <section className="marketing-final"><span className="marketing-kicker">O PRIMEIRO PASSO É DE VOCÊS</span><h2>Vamos começar a contar essa história?</h2><a className="marketing-primary" href="/cadastro">Criar meu site grátis <ArrowRight size={18} /></a><span className="marketing-final-note">Sem mensalidade para criar o site. As condições dos presentes são informadas antes do pagamento.</span><a className="marketing-final-login" href="/painel">Já tenho uma conta</a></section>
    </main>
    <footer className="marketing-footer"><div className="marketing-footer-content"><div className="marketing-footer-about"><span className="marketing-footer-brand">e<span>&amp;</span>t</span><h2>Sites de casamento para celebrar a história de vocês.</h2><p>Um convite digital para reunir os detalhes do grande dia e compartilhar com quem vocês amam.</p></div><div className="marketing-footer-links"><h3>Comece por aqui</h3><a href="/cadastro">Criar meu site</a><a href="#como-funciona">Como funciona</a><a href="#presentes">Presentes e Pix</a><a href="/painel">Entrar no painel</a></div><div className="marketing-footer-contact"><h3>Fale com a gente</h3><a href="https://wa.me/5531988924409">WhatsApp: (31) 98892-4409</a><a href="mailto:henriquesouza1832001@gmail.com">henriquesouza1832001@gmail.com</a><a href="https://henriquesouzas.com" target="_blank" rel="noreferrer">henriquesouzas.com <ExternalLink size={14} /></a></div></div><div className="marketing-footer-bottom"><span>© 2026 e&t · Sites de casamento</span><a href="https://henriquesouzas.com" target="_blank" rel="noreferrer">Desenvolvido por henriquesouzas.com</a></div></footer>
  </div>
}
