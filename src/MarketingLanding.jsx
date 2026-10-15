import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, Bell, CalendarDays, Check, CircleHelp, ExternalLink, Flower2, Gift, Heart, Link, MapPin, Printer, QrCode, ShieldCheck, ShoppingBag, Smartphone, Users, Wallet, X } from 'lucide-react'
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
      <nav aria-label="Navegação principal"><a href="#como-funciona">Como funciona</a><a href="#presentes">Presentes e Pix</a><a href="#planejamento">Planejamento</a><a href="#contato">Contato</a><a className="marketing-login" href="/painel">Entrar</a></nav>
      <a className="marketing-header-cta" href="/cadastro">Criar meu site <ArrowRight size={17} /></a>
    </header>
    <main>
      <section className="marketing-hero" aria-labelledby="marketing-title">
        <div className="marketing-hero-photo"><WeddingPhoto /></div>
        <div className="marketing-hero-copy"><span className="marketing-kicker">O COMEÇO DE UMA HISTÓRIA QUE VOCÊS VÃO COMPARTILHAR</span><h1 id="marketing-title">O casamento de vocês, do primeiro plano ao grande dia.</h1><p>Um espaço bonito e fácil de organizar para contar a história, reunir as informações e enviar o convite para cada pessoa.</p><div className="marketing-hero-actions"><a className="marketing-primary" href="/cadastro">Criar meu site grátis <ArrowRight size={18} /></a><a className="marketing-text-link" href="#como-funciona">Ver como funciona <ArrowRight size={16} /></a></div><span className="marketing-caption">Sem mensalidade para criar o site. A taxa dos presentes aparece antes do pagamento.</span><div className="marketing-hero-detail"><Flower2 size={21} strokeWidth={1.4} /><span>Uma identidade visual pensada para acompanhar cada detalhe.</span></div></div>
      </section>
      <section className="marketing-intro" id="como-funciona"><span className="marketing-kicker">SIMPLES DE MONTAR. FÁCIL DE COMPARTILHAR.</span><h2>As informações do casamento ficam em um só lugar.</h2><p>Vocês organizam o convite pelo painel. Os convidados abrem no celular pelo site, link curto ou QR code e encontram o que precisam.</p><FloralMark className="marketing-flower-intro" /></section>
      <section className="marketing-steps" aria-label="Como o site funciona">
        <article><span className="marketing-step-icon"><Heart size={25} /></span><span className="marketing-step-label">PARA COMEÇAR</span><h3>Contem a história de vocês</h3><p>Escolham um tema, adicionem fotos e coloquem data, local e detalhes da celebração.</p></article>
        <article><span className="marketing-step-icon"><Users size={25} /></span><span className="marketing-step-label">PARA ORGANIZAR</span><h3>Acompanhem as confirmações</h3><p>Os convidados respondem pelo celular. Vocês acompanham as respostas no painel do casal.</p></article>
        <article><span className="marketing-step-icon"><Link size={25} /></span><span className="marketing-step-label">PARA COMPARTILHAR</span><h3>Enviem o convite como preferirem</h3><p>Mandem o link, usem um endereço curto ou incluam o QR code no convite impresso.</p></article>
      </section>
      <section className="marketing-showcase" id="recursos">
        <div className="marketing-showcase-photo"><picture><source srcSet="/images/wedding-moments.avif" type="image/avif" /><img src="/images/wedding-moments.webp" alt="Noivos caminham juntos por uma alameda arborizada" width="960" height="640" loading="lazy" decoding="async" /></picture><span>Foto: Jonathan Borba · Pexels</span><FloralMark className="marketing-flower-showcase" /></div>
        <div className="marketing-showcase-copy"><span className="marketing-kicker">UM CONVITE COM A CARA DE VOCÊS</span><h2>Personalização guiada, sem complicar.</h2><p>O site começa com um tema pronto. Vocês mudam fotos, textos, cores e seções em um painel simples, com prévia antes de publicar.</p><ul><li><Check size={19} /> Temas e paletas em tons cuidadosamente escolhidos</li><li><Check size={19} /> História, fotos, data, local e programação</li><li><Check size={19} /> Confirmação de presença organizada</li><li><Check size={19} /> Link curto e QR code com a identidade do convite</li></ul><a className="marketing-text-link" href="/cadastro">Começar a criar <ArrowRight size={17} /></a></div>
      </section>
      <section className="marketing-gifts" id="presentes" aria-labelledby="marketing-gifts-title">
        <div className="marketing-gifts-copy"><span className="marketing-kicker">PRESENTES E TAXAS, COM TRANSPARÊNCIA</span><h2 id="marketing-gifts-title">O site é gratuito. A taxa só entra quando houver presente pela plataforma.</h2><p>Criar e personalizar o site não tem mensalidade. Se o casal ativar presentes pagos pelo Pix integrado, o convidado verá o valor do presente, os custos de processamento e a taxa da plataforma antes de confirmar.</p><p>Estamos estruturando o pagamento com um provedor brasileiro de split. A integração precisa ser aprovada e testada antes de receber pagamentos; a taxa final será publicada quando as condições estiverem definidas.</p><div className="marketing-gift-note"><ShieldCheck size={21} /><span>Sem presentes pagos pelo site, não há taxa por presente. Nenhum valor será escondido do convidado.</span></div><a className="marketing-text-link" href="/cadastro">Criar o site sem mensalidade <ArrowRight size={17} /></a></div>
        <div className="marketing-gift-flow" aria-label="Fluxo previsto para um presente pago por Pix integrado">
          <div className="marketing-flow-label">FLUXO PREVISTO PARA O PIX INTEGRADO</div>
          <div className="marketing-flow-step"><span className="marketing-flow-icon"><Gift size={21} /></span><div><strong>O convidado escolhe um presente</strong><small>O valor e o total aparecem antes de pagar</small></div></div>
          <div className="marketing-flow-connector"><span /></div>
          <div className="marketing-flow-step"><span className="marketing-flow-icon"><Wallet size={21} /></span><div><strong>O provedor processa e separa os valores</strong><small>A comissão e a parcela do casal ficam registradas</small></div></div>
          <div className="marketing-flow-connector"><span /></div>
          <div className="marketing-flow-step"><span className="marketing-flow-icon"><Check size={21} /></span><div><strong>O casal acompanha o repasse</strong><small>O painel mostra pagamento, taxas e situação do saldo</small></div></div>
          <div className="marketing-flow-footer">A integração será ativada depois da aprovação e dos testes do provedor.</div>
        </div>
      </section>
      <section className="marketing-store-links" aria-labelledby="marketing-store-title"><div><span className="marketing-kicker">LISTA DE PRESENTES COM LIBERDADE DE ESCOLHA</span><h2 id="marketing-store-title">Incluam presentes em dinheiro ou indiquem uma loja.</h2><p>O casal pode organizar presentes em dinheiro e itens de referência. Para itens de loja, o convidado abre o link externo informado pelo casal para consultar preço e disponibilidade diretamente na loja.</p><a className="marketing-text-link" href="/cadastro">Ver como criar o site <ArrowRight size={17} /></a></div><div className="marketing-store-card"><div className="marketing-store-card-top"><ShoppingBag size={21} /><span>EXEMPLO DE ITEM</span></div><strong>Jogo de taças</strong><span className="marketing-store-name">Loja indicada pelos noivos</span><b>Preço na loja</b><small>O link leva à página da loja. Preço e estoque podem mudar por lá.</small></div></section>
      <section className="marketing-planning" id="planejamento" aria-labelledby="marketing-planning-title"><div className="marketing-planning-copy"><span className="marketing-kicker">UM LUGAR PARA SE ORGANIZAR ATÉ O GRANDE DIA</span><h2 id="marketing-planning-title">Planejamento do casamento, do orçamento à recepção.</h2><p>Além do convite, a plataforma está sendo ampliada para ajudar o casal a acompanhar fornecedores, despesas e pagamentos, com lembretes mensais por e-mail ou notificação.</p><span className="marketing-status"><CalendarDays size={17} /> Recurso em desenvolvimento</span></div><div className="marketing-planning-cards"><article><span><Wallet size={20} /></span><strong>Despesas e fornecedores</strong><small>Registrem valores, vencimentos e o que já foi pago.</small></article><article><span><Bell size={20} /></span><strong>Lembretes no tempo certo</strong><small>Alertas mensais ajudam a não perder datas de pagamento.</small></article></div></section>
      <section className="marketing-invites" aria-labelledby="marketing-invites-title"><div className="marketing-invites-photo"><picture><source srcSet="/images/wedding-pexels.avif" type="image/avif" /><img src="/images/wedding-pexels.webp" alt="Casal celebra o casamento em um jardim" width="960" height="640" loading="lazy" decoding="async" /></picture><div className="marketing-invite-stamp"><Flower2 size={23} /><span>feito para vocês</span></div></div><div className="marketing-invites-copy"><span className="marketing-kicker">DO CELULAR AO PAPEL</span><h2 id="marketing-invites-title">O convite acompanha a identidade do site.</h2><p>O QR code e o link curto podem aparecer no convite digital ou impresso. Estamos preparando arquivos em alta qualidade, com formatos para impressão e opção de guardar o convite em carteiras digitais compatíveis.</p><div className="marketing-invite-features"><span><QrCode size={18} /> Link e QR code</span><span><Printer size={18} /> Arquivo para imprimir</span><span><Smartphone size={18} /> Carteira digital</span></div><span className="marketing-status"><Flower2 size={17} /> Impressão avançada e carteira digital em desenvolvimento</span></div></section>
      <section className="marketing-entry" aria-labelledby="marketing-entry-title"><div className="marketing-entry-copy"><span className="marketing-kicker">UMA CHEGADA MAIS ORGANIZADA</span><h2 id="marketing-entry-title">A equipe acompanha a entrada, com QR code ou lista.</h2><p>O controle de entrada está previsto para o dia do evento: a equipe poderá conferir convites e registrar uma pessoa que chegou sem QR code. A lista ajuda o casal e o buffet a acompanhar quem já chegou.</p><ul><li><Check size={18} /> Consulta de entradas confirmadas</li><li><Check size={18} /> Cadastro de última hora sem QR code</li><li><Check size={18} /> Exportação da lista necessária para o evento</li></ul><span className="marketing-status"><QrCode size={17} /> Controle de entrada em desenvolvimento</span></div><div className="marketing-entry-card"><span><QrCode size={28} /></span><div><strong>Entrada organizada</strong><small>Convidados com convite e chegadas adicionadas pela equipe aparecem no controle do evento.</small></div><span className="marketing-entry-rule"><ShieldCheck size={17} /> A equipe acessa apenas as informações necessárias para a entrada.</span></div></section>
      <section className="marketing-guest-journey" aria-labelledby="marketing-journey-title"><div className="marketing-journey-heading"><span className="marketing-kicker">PENSADO PARA QUEM CRIA E PARA QUEM RECEBE</span><h2 id="marketing-journey-title">Um convite fácil de usar, em qualquer tela.</h2><p>O casal prepara as informações no painel. O convidado abre o convite no celular, encontra o que precisa e responde sem instalar um aplicativo.</p></div><div className="marketing-journey-grid"><article><span><Heart size={20} /></span><h3>Para os noivos</h3><p>Um lugar para contar a história, publicar os detalhes e acompanhar as confirmações.</p><a href="/cadastro">Começar meu site <ArrowRight size={15} /></a></article><article><span><Smartphone size={20} /></span><h3>Para os convidados</h3><p>Acesso pelo site, por um link compartilhado ou por QR code no convite.</p><a href="#como-funciona">Ver como funciona <ArrowRight size={15} /></a></article><article><span><MapPin size={20} /></span><h3>Para o dia do casamento</h3><p>Data, local, orientações e controle de entrada reunidos para ajudar a equipe.</p><a href="#recursos">Conhecer os recursos <ArrowRight size={15} /></a></article></div></section>
      <section className="marketing-faq" aria-labelledby="marketing-faq-title"><div className="marketing-faq-heading"><span className="marketing-kicker">ANTES DE COMEÇAR</span><h2 id="marketing-faq-title">Dúvidas comuns, respostas diretas.</h2></div><div className="marketing-faq-list"><details><summary><span><CircleHelp size={18} /> Preciso pagar para criar o site?</span><span className="marketing-faq-symbol" aria-hidden="true">+</span></summary><p>Não há mensalidade para criar e personalizar o site. A taxa da plataforma se aplica aos presentes pagos pelo Pix integrado.</p></details><details><summary><span><CircleHelp size={18} /> Quando vou saber o valor da taxa?</span><span className="marketing-faq-symbol" aria-hidden="true">+</span></summary><p>A taxa da plataforma e o custo de processamento serão apresentados antes de o convidado confirmar o pagamento. O percentual será publicado depois que as condições do provedor forem aprovadas.</p></details><details><summary><span><CircleHelp size={18} /> Os convidados precisam instalar um aplicativo?</span><span className="marketing-faq-symbol" aria-hidden="true">+</span></summary><p>Não. O convite abre no navegador do celular ou computador. O PWA oferece recursos instaláveis sem exigir instalação para consultar o convite.</p></details><details><summary><span><CircleHelp size={18} /> Posso incluir presentes de uma loja?</span><span className="marketing-faq-symbol" aria-hidden="true">+</span></summary><p>Sim. O casal poderá informar o produto e o link da loja. O convidado consulta preço e disponibilidade diretamente no site da loja.</p></details><details><summary><span><CircleHelp size={18} /> O planejamento financeiro já está disponível?</span><span className="marketing-faq-symbol" aria-hidden="true">+</span></summary><p>O controle de despesas com fornecedores e os lembretes mensais estão em desenvolvimento. A página indica quando cada novo recurso estiver disponível.</p></details></div></section>
      <section className="marketing-final"><span className="marketing-kicker">UMA HISTÓRIA DE CADA VEZ</span><h2>Vamos começar a preparar o convite de vocês?</h2><a className="marketing-primary" href="/cadastro">Criar meu site grátis <ArrowRight size={18} /></a><span className="marketing-final-note">Sem mensalidade para criar o site. Taxas dos presentes informadas antes do pagamento.</span><a className="marketing-final-login" href="/painel">Já tenho uma conta</a></section>
    </main>
    <footer className="marketing-footer" id="contato"><div className="marketing-footer-content"><div className="marketing-footer-about"><span className="marketing-footer-brand">e<span>&amp;</span>t</span><h2>Um convite para reunir tudo o que importa.</h2><p>Sites de casamento responsivos, com a história do casal, informações da celebração e caminhos simples para cada convidado.</p></div><div className="marketing-footer-links"><h3>Comece por aqui</h3><a href="/cadastro">Criar meu site</a><a href="#como-funciona">Como funciona</a><a href="#presentes">Presentes e Pix</a><a href="#planejamento">Planejamento</a><a href="/painel">Entrar no painel</a></div><div className="marketing-footer-contact"><h3>Fale com a gente</h3><a href="https://wa.me/5531988924409">WhatsApp: (31) 98892-4409</a><a href="mailto:henriquesouza1832001@gmail.com">henriquesouza1832001@gmail.com</a><a href="https://henriquesouzas.com" target="_blank" rel="noreferrer">henriquesouzas.com <ExternalLink size={14} /></a></div></div><div className="marketing-footer-bottom"><span>e&amp;t · Sites de casamento</span><a href="https://henriquesouzas.com" target="_blank" rel="noreferrer">Desenvolvido por henriquesouzas.com</a></div></footer>
  </div>
}
