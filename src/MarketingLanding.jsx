import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, Bell, CalendarDays, Camera, Check, CircleHelp, ClipboardList, ExternalLink, Flower2, Heart, Link, Printer, QrCode, ShieldCheck, Smartphone, Users, Wallet, X } from 'lucide-react'
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
  const [headerVisible, setHeaderVisible] = useState(true)
  const headerRef = useRef(null)
  const lastScrollY = useRef(0)

  useEffect(() => {
    let frame = 0
    function handleScroll() {
      if (frame) return
      frame = window.requestAnimationFrame(() => {
        const currentScrollY = window.scrollY
        const scrollDelta = currentScrollY - lastScrollY.current
        const headerHasFocus = headerRef.current?.contains(document.activeElement)
        if (currentScrollY < 80 || headerHasFocus || scrollDelta < -8) setHeaderVisible(true)
        else if (currentScrollY > 160 && scrollDelta > 8) setHeaderVisible(false)
        lastScrollY.current = currentScrollY
        frame = 0
      })
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.cancelAnimationFrame(frame)
    }
  }, [])

  return <div className="marketing-page">
    <header className={`marketing-header${headerVisible ? '' : ' marketing-header-hidden'}`} id="marketing-header" ref={headerRef} aria-hidden={!headerVisible} inert={!headerVisible}>
      <a className="marketing-brand" href="/" aria-label="Página inicial"><span>e<span>&amp;</span>t</span><strong>sites de casamento</strong></a>
      <nav aria-label="Navegação principal"><a href="#como-funciona">Como funciona</a><a href="#convite">O convite</a><a href="#presentes">Presentes</a><a href="#planejamento">Planejamento</a><a href="#entrada">Entrada</a><a className="marketing-login" href="/painel">Entrar</a></nav>
      <a className="marketing-header-cta" href="/cadastro">Criar acesso <ArrowRight size={17} /></a>
    </header>
    <main>
      <section className="marketing-hero" aria-labelledby="marketing-title">
        <div className="marketing-hero-photo"><WeddingPhoto /></div>
        <div className="marketing-hero-copy"><span className="marketing-kicker">Site, convite e organização do casamento</span><h1 id="marketing-title">Um convite com a história de vocês e os detalhes do dia.</h1><p>Data, local, confirmação de presença e programação ficam no mesmo endereço, pronto para abrir no celular.</p><div className="marketing-hero-actions"><a className="marketing-primary" href="/cadastro">Criar acesso <ArrowRight size={18} /></a><a className="marketing-text-link" href="#como-funciona">Ver como funciona</a></div><span className="marketing-caption">O site é gratuito no piloto. Presentes por Pix vão direto aos noivos; links de loja levam à compra fora da plataforma.</span><div className="marketing-hero-detail"><Flower2 size={21} strokeWidth={1.4} /><span>O mesmo desenho acompanha o site, o convite e o QR code.</span></div></div>
      </section>
      <section className="marketing-intro" id="como-funciona"><span className="marketing-kicker">Como o convite chega aos convidados</span><h2>Uma página para contar a história e responder às dúvidas do dia.</h2><p>Vocês escolhem o que mostrar. Os convidados encontram data, local, programação e confirmação de presença pelo link que receberam.</p><FloralMark className="marketing-flower-intro" /></section>
      <section className="marketing-steps" aria-label="Como o site funciona">
        <article><span className="marketing-step-icon"><Heart size={25} /></span><span className="marketing-step-label">O site do casal</span><h3>Escolham o que querem contar</h3><p>Adicionem fotos, história, data, local e programação. A prévia acompanha as escolhas de vocês.</p></article>
        <article><span className="marketing-step-icon"><Users size={25} /></span><span className="marketing-step-label">As confirmações</span><h3>Saibam quem vai à celebração</h3><p>Organizem convidados e eventos. Cada pessoa confirma presença pelo próprio convite.</p></article>
        <article><span className="marketing-step-icon"><Link size={25} /></span><span className="marketing-step-label">O compartilhamento</span><h3>Enviem o convite por link ou QR code</h3><p>O convite abre no navegador do celular. Se preferirem, também pode acompanhar a papelaria impressa.</p></article>
      </section>
      <section className="marketing-showcase" id="convite">
        <div className="marketing-showcase-photo"><picture><source srcSet="/images/wedding-moments.avif" type="image/avif" /><img src="/images/wedding-moments.webp" alt="Noivos caminham juntos por uma alameda arborizada" width="960" height="640" loading="lazy" decoding="async" /></picture><span>Foto: Jonathan Borba · Pexels</span><FloralMark className="marketing-flower-showcase" /></div>
        <div className="marketing-showcase-copy"><span className="marketing-kicker">Um convite com a cara de vocês</span><h2>Um site bonito, simples de montar e fácil de ler.</h2><p>Partam de um tema pronto e adaptem a experiência ao estilo do casamento. A prévia mostra o convite em celular, tablet e computador enquanto vocês personalizam.</p><ul><li><Check size={19} /> Temas, paletas e pares de fontes</li><li><Check size={19} /> História, fotos, data, local e programação</li><li><Check size={19} /> Seções que vocês podem escolher e organizar</li><li><Check size={19} /> Prévia antes de publicar as alterações</li></ul><a className="marketing-text-link" href="/cadastro">Criar o site do casal <ArrowRight size={17} /></a></div>
      </section>
      <section className="marketing-photo-story" aria-labelledby="marketing-photo-story-title"><div className="marketing-photo-story-copy"><span className="marketing-kicker">Um álbum feito por quem estava lá</span><h2 id="marketing-photo-story-title">O casamento visto pelos olhos dos convidados.</h2><p>Durante a festa, cada pessoa pode registrar um momento com a câmera do convite. O casal escolhe o limite de fotos; depois, recebe as imagens com o nome de quem fotografou.</p><a className="marketing-text-link" href="/cadastro">Conhecer o álbum do casal <ArrowRight size={17} /></a></div><div className="marketing-photo-story-art"><figure className="marketing-photo-story-main"><img src="/images/wedding-pexels.webp" alt="Noivos celebram juntos em um jardim" loading="lazy" /><figcaption>O dia de vocês, visto de perto</figcaption></figure><figure className="marketing-photo-story-detail"><img src="/images/wedding-moments.webp" alt="Casal caminha junto durante o casamento" loading="lazy" /><figcaption>Uma lembrança de cada convidado</figcaption></figure><span className="marketing-photo-story-flower" aria-hidden="true"><Flower2 /></span></div></section>
      <section className="marketing-feature-band" id="confirmacoes"><div className="marketing-feature-band-intro"><span className="marketing-kicker">Confirmações que ajudam a planejar</span><h2>Saibam quem vai celebrar com vocês.</h2><p>Convidados respondem pelo próprio convite. O painel mostra as respostas por pessoa e por evento e ajuda a preparar a lista do buffet.</p><a className="marketing-text-link" href="/cadastro">Organizar convidados <ArrowRight size={17} /></a></div><div className="marketing-feature-cards"><article><Users size={23} /><h3>Lista organizada</h3><p>Importem convidados, agrupem famílias, indiquem acompanhantes e registrem observações alimentares.</p></article><article><CalendarDays size={23} /><h3>Eventos separados</h3><p>Publiquem cerimônia, recepção e outras celebrações. Cada pessoa recebe as informações do seu convite.</p></article><article><Bell size={23} /><h3>Lembretes e calendário em preparação</h3><p>O envio de lembretes e a integração com calendários ainda não estão disponíveis.</p></article></div></section>
      <section className="marketing-gifts-section" id="presentes" aria-labelledby="marketing-gifts-title"><div className="marketing-gifts-copy"><span className="marketing-kicker">Presentes no convite</span><h2 id="marketing-gifts-title">Uma lista feita para a viagem e a vida a dois.</h2><p>A lista fica no convite. O Pix vai direto à chave dos noivos; os links levam às lojas para concluir a compra e combinar a entrega.</p><div className="marketing-gift-flow"><article><span>Para quem presenteia</span><strong>Escolhe como presentear</strong><p>Transfere pelo próprio banco ou conclui a compra na loja.</p></article><ArrowRight size={20} /><article><span>Para o casal</span><strong>Recebe diretamente</strong><p>Compartilha uma chave Pix ou os links dos presentes escolhidos.</p></article></div><div className="marketing-free-note"><ShieldCheck size={21} /><p><strong>O piloto é gratuito.</strong> A plataforma não recebe, processa nem repassa o dinheiro dos presentes.</p></div><a className="marketing-primary" href="/cadastro">Montar meu convite <ArrowRight size={17} /></a></div><aside className="marketing-gifts-card"><span className="marketing-gifts-card-icon"><Wallet size={24} /></span><span className="marketing-kicker">Exemplos para a lista</span><h3>O casal escolhe os presentes.</h3><div className="marketing-gift-line"><span>Contribuição para a viagem</span><strong>Pix direto aos noivos</strong></div><div className="marketing-gift-line"><span>Utensílio para a casa</span><strong>Link da loja escolhida</strong></div><div className="marketing-gift-line"><span>Contribuição livre</span><strong>Valor escolhido pelo convidado</strong></div><div className="marketing-gifts-total"><span>Transferência e compra fora da plataforma</span><Check size={17} /></div></aside></section>
      <section className="marketing-invitation-print"><div className="marketing-print-copy"><span className="marketing-kicker">Do celular ao papel</span><h2>O convite digital acompanha a identidade do site.</h2><p>Compartilhem o convite pelo link individual ou QR code. A geração de arquivos para impressão está em preparação.</p><div className="marketing-print-options"><article><QrCode size={22} /><strong>Link e QR code</strong><span>Um acesso simples para cada convidado.</span></article><article><Printer size={22} /><strong>Arquivo para impressão</strong><span>Recurso em preparação.</span></article><article><Smartphone size={22} /><strong>Carteira digital</strong><span>Disponível quando os noivos configurarem o serviço.</span></article></div><a className="marketing-text-link" href="/cadastro">Montar meu convite <ArrowRight size={17} /></a></div><div className="marketing-print-photo"><picture><source srcSet="/images/wedding-pexels.avif" type="image/avif" /><img src="/images/wedding-pexels.webp" alt="Casal celebra o casamento em um jardim" width="1280" height="853" loading="lazy" decoding="async" /></picture><div className="marketing-print-card"><span>CONVITE</span><strong>Um dia para guardar</strong><small>Com carinho, esperamos por você</small><QrCode size={36} /></div></div></section>
      <section className="marketing-checkin-section" id="entrada"><div className="marketing-checkin-heading"><span className="marketing-kicker">Controle da entrada</span><h2>A equipe confere o convite e registra quem chegou.</h2><p>O leitor usa a câmera do celular. Se alguém aparecer sem o convite, a equipe registra a entrada e os acompanhantes para atualizar a lista do buffet.</p></div><div className="marketing-checkin-grid"><article className="marketing-checkin-device"><div className="marketing-device-top"><span>Exemplo de registro</span><ShieldCheck size={19} /></div><div className="marketing-device-person"><span>OK</span><div><strong>Convite conferido</strong><small>Acesso válido para o evento</small></div></div><div className="marketing-device-success"><Check size={18} /> Entrada registrada</div><p>O mesmo convite não pode ser usado para registrar entradas duplicadas.</p></article><div className="marketing-checkin-details"><article><QrCode size={21} /><div><h3>Leitor rápido, mesmo com sinal fraco</h3><p>A equipe pode baixar a lista antes da festa. Os registros sincronizam quando a conexão retorna.</p></div></article><article><ClipboardList size={21} /><div><h3>A equipe consulta os nomes dos convidados</h3><p>Cada pessoa da equipe acessa somente a lista dos eventos atribuídos. Telefones e e-mails ficam restritos ao casal.</p></div></article><article><Users size={21} /><div><h3>Entrada manual para convidados de última hora</h3><p>A equipe de entrada pode registrar a pessoa, acompanhantes e observações para o buffet.</p></div></article><article><Printer size={21} /><div><h3>Relatório do evento</h3><p>Os responsáveis consultam e exportam a lista e as entradas registradas.</p></div></article></div></div></section>
      <section className="marketing-planning-section" id="planejamento"><div className="marketing-planning-copy"><span className="marketing-kicker">Planejamento financeiro em preparação</span><h2>Fornecedores, despesas e vencimentos em um só lugar.</h2><p>O painel de planejamento está previsto para uma próxima etapa. Ainda não é possível cadastrar fornecedores ou acompanhar pagamentos.</p><div className="marketing-planning-list"><div><Check size={18} /><span>Despesas por fornecedor e categoria</span></div><div><Check size={18} /><span>Valores pagos e parcelas pendentes</span></div><div><Check size={18} /><span>Vencimentos com lembrete por e-mail ou push</span></div><div><Check size={18} /><span>Visão do orçamento e do saldo a pagar</span></div></div><span className="marketing-text-link">Recurso em preparação</span></div><div className="marketing-budget-card"><div className="marketing-budget-heading"><span><ClipboardList size={19} /> Prévia do planejamento</span><span>Exemplo visual</span></div><div className="marketing-budget-total"><small>Um registro pode incluir</small><strong>Fornecedor e vencimento</strong><span>A prévia mostra valores e datas que o recurso deverá organizar.</span></div><div className="marketing-budget-row"><span><i className="paid" /> Pago</span><strong>Valor registrado pelo casal</strong></div><div className="marketing-budget-row"><span><i className="pending" /> A pagar</span><strong>Próxima data de vencimento</strong></div><div className="marketing-budget-reminder"><Bell size={17} /><span><strong>Lembrete escolhido por vocês</strong><small>Por e-mail ou notificação no celular</small></span></div></div></section>
      <section className="marketing-pwa-section"><div className="marketing-pwa-art"><div className="marketing-pwa-phone"><span className="marketing-phone-camera" /><div className="marketing-phone-invite"><img src="/images/wedding-moments.webp" alt="Prévia de foto no convite de casamento" loading="lazy" /><span>ANA & LUCAS</span><strong>Um dia para celebrar</strong><small>Esperamos por você</small><button type="button">Abrir convite <ArrowRight size={13} /></button></div></div><span className="marketing-pwa-flower"><Flower2 /></span></div><div className="marketing-pwa-copy"><span className="marketing-kicker">O convite acompanha o convidado</span><h2>Data, endereço e confirmação sempre à mão.</h2><p>O convite abre no navegador e pode ser instalado no celular. Se os noivos ativarem a câmera, os convidados podem enviar fotos espontâneas ao álbum.</p><div className="marketing-pwa-points"><span><Check size={17} /> Abre pelo link, sem instalar aplicativo</span><span><Check size={17} /> Pode ser instalado como aplicativo no celular</span><span><Camera size={17} /> Câmera opcional para fotos do casamento</span><span><CalendarDays size={17} /> Calendário e lembretes estão em preparação</span></div><a className="marketing-text-link" href="/cadastro">Criar acesso</a></div></section>
      <section className="marketing-guest-journey" aria-labelledby="marketing-journey-title"><div className="marketing-journey-heading"><span className="marketing-kicker">Um convite para cada pessoa</span><h2 id="marketing-journey-title">O casal envia. Cada convidado abre no celular.</h2><p>O link leva ao convite certo. Ali a pessoa consulta a programação e confirma presença para os eventos a que foi chamada.</p></div><div className="marketing-journey-grid"><article><span><Heart size={20} /></span><h3>Para o casal</h3><p>Personalizem o convite e acompanhem as respostas no painel.</p><a href="/cadastro">Criar acesso</a></article><article><span><Smartphone size={20} /></span><h3>Para os convidados</h3><p>O convite abre no navegador. A confirmação fica ligada ao convite recebido.</p><a href="#convite">Ver como funciona</a></article><article><span><ShieldCheck size={20} /></span><h3>Para a equipe</h3><p>A equipe confere a entrada por QR code ou registra quem chegou sem convite.</p><a href="#entrada">Conhecer a entrada</a></article></div></section>
      <section className="marketing-faq" aria-labelledby="marketing-faq-title"><div className="marketing-faq-heading"><span className="marketing-kicker">Antes de começar</span><h2 id="marketing-faq-title">Dúvidas comuns, respostas diretas.</h2></div><div className="marketing-faq-list"><details><summary><span><CircleHelp size={18} /> Preciso pagar para criar o site?</span><span className="marketing-faq-symbol" aria-hidden="true">+</span></summary><p>Não. Criar o site e organizar o casamento na plataforma é gratuito no piloto.</p></details><details><summary><span><CircleHelp size={18} /> Como funciona o Pix dos presentes?</span><span className="marketing-faq-symbol" aria-hidden="true">+</span></summary><p>O casal publica uma chave Pix. O convidado copia e transfere pelo próprio aplicativo do banco, diretamente aos noivos. A plataforma não recebe nem confirma o pagamento.</p></details><details><summary><span><CircleHelp size={18} /> Posso indicar uma loja para um presente físico?</span><span className="marketing-faq-symbol" aria-hidden="true">+</span></summary><p>Sim. O link abre a página do produto na loja para o convidado concluir a compra e combinar a entrega.</p></details><details><summary><span><CircleHelp size={18} /> Posso fazer convite impresso?</span><span className="marketing-faq-symbol" aria-hidden="true">+</span></summary><p>O convite digital pode ser compartilhado pelo link e QR code. A geração de arquivos de impressão ainda está em preparação.</p></details><details><summary><span><CircleHelp size={18} /> A equipe consegue conferir a entrada?</span><span className="marketing-faq-symbol" aria-hidden="true">+</span></summary><p>Sim. A equipe usa o leitor de QR code, registra entradas manuais e consulta ou exporta a lista do evento.</p></details><details><summary><span><CircleHelp size={18} /> Também posso organizar os pagamentos do casamento?</span><span className="marketing-faq-symbol" aria-hidden="true">+</span></summary><p>Ainda não. O planejamento de fornecedores, despesas, vencimentos e lembretes está previsto para uma próxima etapa.</p></details><details><summary><span><CircleHelp size={18} /> Os convidados precisam instalar um aplicativo?</span><span className="marketing-faq-symbol" aria-hidden="true">+</span></summary><p>Não. O convite abre no navegador. Quem quiser pode instalar o site como aplicativo no celular.</p></details></div></section>
      <section className="marketing-final"><span className="marketing-kicker">Uma história de cada vez</span><h2>Vamos começar a preparar o convite de vocês?</h2><a className="marketing-primary" href="/cadastro">Criar acesso <ArrowRight size={18} /></a><span className="marketing-final-note">Criar e usar o site não tem mensalidade.</span><a className="marketing-final-login" href="/painel">Já tenho uma conta</a></section>
    </main>
    <footer className="marketing-footer" id="contato"><div className="marketing-footer-content"><div className="marketing-footer-about"><span className="marketing-footer-brand">e<span>&amp;</span>t</span><h2>Um convite para reunir tudo o que importa.</h2><p>Sites de casamento responsivos, com a história do casal, informações da celebração e caminhos simples para cada convidado.</p></div><div className="marketing-footer-links"><h3>Comece por aqui</h3><a href="/cadastro">Criar acesso</a><a href="/ajuda">Central de ajuda</a><a href="#como-funciona">Como funciona</a><a href="#confirmacoes">Confirmação de presença</a><a href="#planejamento">Planejamento</a><a href="#entrada">Controle de entrada</a><a href="/painel">Entrar no painel</a></div><div className="marketing-footer-contact"><h3>Fale com a gente</h3><a href="https://wa.me/5531988924409">WhatsApp: (31) 98892-4409</a><a href="mailto:henriquesouza1832001@gmail.com">henriquesouza1832001@gmail.com</a><a href="https://henriquesouzas.com" target="_blank" rel="noreferrer">henriquesouzas.com <ExternalLink size={14} /></a></div></div><div className="marketing-footer-bottom"><span>e&amp;t · Sites de casamento</span><a href="https://henriquesouzas.com" target="_blank" rel="noreferrer">Desenvolvido por henriquesouzas.com</a></div></footer>
  </div>
}
