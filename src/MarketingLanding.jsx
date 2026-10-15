import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, CalendarDays, Check, CircleHelp, ExternalLink, Gift, Heart, Link, ShieldCheck, ShoppingBag, Smartphone, Users, Wallet, X } from 'lucide-react'
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
        <div className="marketing-gifts-copy"><span className="marketing-kicker">PRESENTES, SEM SURPRESAS</span><h2 id="marketing-gifts-title">Um jeito claro de presentear e acompanhar cada valor.</h2><p>Os noivos podem organizar uma lista com presentes em dinheiro e itens de referência. O convidado vê o valor antes de escolher; o casal acompanha as contribuições no painel.</p><p>Para o Pix dentro do site, estamos preparando um fluxo com divisão automática entre a taxa do serviço e o valor destinado aos noivos. A taxa e o valor líquido serão mostrados antes da confirmação. Essa opção só será ativada depois da integração e dos testes do provedor.</p><div className="marketing-gift-note"><ShieldCheck size={21} /><span>O pagamento só aparece como confirmado depois que o provedor informa a liquidação.</span></div></div>
        <div className="marketing-gift-flow" aria-label="Fluxo previsto para um presente por Pix na plataforma">
          <div className="marketing-flow-label">COMO O PIX INTEGRADO DEVE FUNCIONAR</div>
          <div className="marketing-flow-step"><span className="marketing-flow-icon"><Gift size={21} /></span><div><strong>O convidado escolhe o presente</strong><small>Valor, taxa e total ficam claros antes do pagamento</small></div></div>
          <div className="marketing-flow-connector"><span /></div>
          <div className="marketing-flow-step"><span className="marketing-flow-icon"><Wallet size={21} /></span><div><strong>O provedor processa o Pix</strong><small>O split separa a comissão e o valor destinado ao casal</small></div></div>
          <div className="marketing-flow-connector"><span /></div>
          <div className="marketing-flow-step"><span className="marketing-flow-icon"><Check size={21} /></span><div><strong>O casal acompanha o resultado</strong><small>O painel registra o valor e a confirmação do pagamento</small></div></div>
          <div className="marketing-flow-footer">Criar e personalizar o site sem mensalidade</div>
        </div>
      </section>
      <section className="marketing-store-links" aria-labelledby="marketing-store-title"><div><span className="marketing-kicker">ITENS DE LOJA, DO JEITO SIMPLES</span><h2 id="marketing-store-title">O convidado vê o item e o preço de referência.</h2><p>Sem catálogo conectado e sem levar a pessoa para outro site. Nesta primeira versão, os noivos informam o nome do item e o preço que encontraram na loja. A compra é combinada por fora; o site apenas organiza a referência.</p></div><div className="marketing-store-card"><div className="marketing-store-card-top"><ShoppingBag size={21} /><span>EXEMPLO ILUSTRATIVO</span></div><strong>Jogo de taças</strong><span className="marketing-store-name">Loja indicada pelos noivos</span><b>R$ 238,00</b><small>Preço informado pelo casal · sem atualização automática</small></div></section>
      <section className="marketing-guest-journey" aria-labelledby="marketing-journey-title"><div className="marketing-journey-heading"><span className="marketing-kicker">PENSADO PARA QUEM CRIA E PARA QUEM RECEBE</span><h2 id="marketing-journey-title">Um convite fácil de usar, em qualquer tela.</h2><p>O casal prepara as informações no painel. O convidado abre o convite no celular, encontra o que precisa e responde sem instalar um aplicativo.</p></div><div className="marketing-journey-grid"><article><span><Heart size={20} /></span><h3>Para os noivos</h3><p>Um lugar para contar a história, publicar os detalhes e acompanhar as confirmações.</p><a href="/cadastro">Começar meu site <ArrowRight size={15} /></a></article><article><span><Smartphone size={20} /></span><h3>Para os convidados</h3><p>Acesso pelo site, por um link compartilhado ou por QR code impresso no convite.</p><a href="#como-funciona">Ver como funciona <ArrowRight size={15} /></a></article><article><span><CalendarDays size={20} /></span><h3>Para o dia do casamento</h3><p>Data, local, orientações e confirmação de presença reunidos em uma página responsiva.</p><a href="#recursos">Conhecer os recursos <ArrowRight size={15} /></a></article></div></section>
      <section className="marketing-faq" aria-labelledby="marketing-faq-title"><div className="marketing-faq-heading"><span className="marketing-kicker">ANTES DE COMEÇAR</span><h2 id="marketing-faq-title">Dúvidas comuns, respostas diretas.</h2></div><div className="marketing-faq-list"><details><summary><span><CircleHelp size={18} /> Preciso pagar mensalidade para criar o site?</span><span className="marketing-faq-symbol" aria-hidden="true">+</span></summary><p>A criação do site está planejada sem mensalidade. Se os noivos ativarem presentes em dinheiro pelo Pix integrado, as taxas serão mostradas antes do pagamento.</p></details><details><summary><span><CircleHelp size={18} /> Os convidados precisam instalar um aplicativo?</span><span className="marketing-faq-symbol" aria-hidden="true">+</span></summary><p>Não. O convite abre no navegador do celular ou computador. Um PWA instalável está previsto para recursos adicionais.</p></details><details><summary><span><CircleHelp size={18} /> Como funcionam os itens de loja?</span><span className="marketing-faq-symbol" aria-hidden="true">+</span></summary><p>Os noivos informam o nome e o preço de referência. Não haverá link externo nem atualização automática de catálogo nesta etapa.</p></details><details><summary><span><CircleHelp size={18} /> O pagamento por Pix já está disponível?</span><span className="marketing-faq-symbol" aria-hidden="true">+</span></summary><p>O split automático ainda está em preparação. Só será apresentado como disponível depois da integração, da configuração das contas e da confirmação do provedor.</p></details></div></section>
      <section className="marketing-final"><span className="marketing-kicker">O PRIMEIRO PASSO É DE VOCÊS</span><h2>Vamos começar a contar essa história?</h2><a className="marketing-primary" href="/cadastro">Criar meu site grátis <ArrowRight size={18} /></a><span className="marketing-final-note">Sem mensalidade para criar o site. As condições dos presentes são informadas antes do pagamento.</span><a className="marketing-final-login" href="/painel">Já tenho uma conta</a></section>
    </main>
    <footer className="marketing-footer"><div className="marketing-footer-content"><div className="marketing-footer-about"><span className="marketing-footer-brand">e<span>&amp;</span>t</span><h2>Sites de casamento para celebrar a história de vocês.</h2><p>Um convite digital para reunir os detalhes do grande dia e compartilhar com quem vocês amam.</p></div><div className="marketing-footer-links"><h3>Comece por aqui</h3><a href="/cadastro">Criar meu site</a><a href="#como-funciona">Como funciona</a><a href="#presentes">Presentes e Pix</a><a href="/painel">Entrar no painel</a></div><div className="marketing-footer-contact"><h3>Fale com a gente</h3><a href="https://wa.me/5531988924409">WhatsApp: (31) 98892-4409</a><a href="mailto:henriquesouza1832001@gmail.com">henriquesouza1832001@gmail.com</a><a href="https://henriquesouzas.com" target="_blank" rel="noreferrer">henriquesouzas.com <ExternalLink size={14} /></a></div></div><div className="marketing-footer-bottom"><span>© 2026 e&t · Sites de casamento</span><a href="https://henriquesouzas.com" target="_blank" rel="noreferrer">Desenvolvido por henriquesouzas.com</a></div></footer>
  </div>
}
