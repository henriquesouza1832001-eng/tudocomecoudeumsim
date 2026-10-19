import { ArrowRight, Bell, CalendarDays, Flower2, Gift, Heart, MapPin, Printer, QrCode, ShieldCheck, Users, Wallet } from 'lucide-react'
import './MarketingConcepts.css'
import { PRODUCT_NAME } from './product-config.js'

const options = [
  {
    id: 'editorial',
    title: 'Jardim editorial',
    subtitle: 'Romântico, leve e fácil de ler',
    description: 'Fotografia em destaque, fundo marfim, verde sálvia e detalhes florais finos nas bordas. A navegação e os botões ficam evidentes sem competir com a foto.',
    image: '/images/wedding-pexels.webp',
    alt: 'Casal de noivos caminhando juntos em um jardim florido',
    credit: 'Kanishka M Gunathunga · Pexels',
    kicker: 'O CASAMENTO DE VOCÊS, EM UM SÓ LUGAR',
    headline: 'Do primeiro plano ao grande dia, tudo começa com vocês.',
    body: 'Um site bonito e simples de organizar para compartilhar a história, os detalhes e o convite com quem vocês amam.',
    className: 'concept-editorial',
  },
  {
    id: 'botanico',
    title: 'Convite botânico',
    subtitle: 'Mais floral e com presença de papelaria',
    description: 'Molduras botânicas e cartões em tons pastel criam a sensação de um convite impresso. A foto continua protagonista e o texto recebe uma área própria para manter o contraste.',
    image: '/images/wedding-moments.webp',
    alt: 'Noivos caminhando por uma alameda arborizada',
    credit: 'Jonathan Borba · Pexels',
    kicker: 'UM CONVITE PARA CELEBRAR A HISTÓRIA DE VOCÊS',
    headline: 'Cada detalhe do casamento, reunido com carinho.',
    body: 'Contem a história, organizem as informações e enviem o convite digital por link ou QR code.',
    className: 'concept-botanical',
  },
]

function ConceptOption({ option }) {
  return <article className={`concept-option ${option.className}`}>
    <div className="concept-option-heading">
      <div><span className="concept-overline">PROPOSTA VISUAL</span><h2>{option.title}</h2></div>
      <span className="concept-subtitle">{option.subtitle}</span>
    </div>
    <div className="concept-browser">
      <header className="concept-header">
        <a className="concept-brand" href="#inicio" aria-label={PRODUCT_NAME}><span>{PRODUCT_NAME}</span></a>
        <nav aria-label="Prévia de navegação"><a href="#como-funciona">Como funciona</a><a href="#presentes">Presentes</a><a href="#recursos">Recursos</a></nav>
        <a className="concept-login" href="/painel">Entrar</a>
      </header>
      <div className="concept-hero" id="inicio">
        <div className="concept-photo">
          <img src={option.image} alt={option.alt} loading="lazy" width="1280" height="853" />
          <span className="concept-photo-credit">{option.credit}</span>
          <span className="concept-flower concept-flower-one" aria-hidden="true"><Flower2 /></span>
          <span className="concept-flower concept-flower-two" aria-hidden="true"><Flower2 /></span>
        </div>
        <div className="concept-copy">
          <span className="concept-kicker">{option.kicker}</span>
          <h3>{option.headline}</h3>
          <p>{option.body}</p>
          <a className="concept-cta" href="/criar-site">Criar meu site grátis <ArrowRight size={17} /></a>
          <span className="concept-free-note">Site gratuito no piloto. Pix direto e links de loja.</span>
        </div>
      </div>
      <div className="concept-quick-links" aria-label="Destaques da plataforma">
        <span><Heart size={16} /> História de vocês</span><span><Users size={16} /> Confirmação organizada</span><span><QrCode size={16} /> Link e QR code</span>
      </div>
    </div>
    <p className="concept-option-description">{option.description}</p>
  </article>
}

export default function MarketingConcepts() {
  return <main className="concept-page">
    <header className="concept-page-header"><a className="concept-page-brand" href="/">{PRODUCT_NAME} <small>estudo de identidade visual</small></a><a className="concept-return" href="/">Voltar para o site <ArrowRight size={15} /></a></header>
    <section className="concept-intro">
      <span className="concept-overline">UMA IDENTIDADE PARA A PLATAFORMA TODA</span>
      <h1>Romântica no olhar. Clara em cada passo.</h1>
      <p>Preparei duas direções visuais para a página inicial. Ambas usam tons pastel, fotografia pública de casamento, detalhes florais e chamadas legíveis. A estrutura de conteúdo abaixo é comum às duas.</p>
    </section>
    <section className="concept-options" aria-label="Opções de identidade visual">
      {options.map((option) => <ConceptOption option={option} key={option.id} />)}
    </section>
    <section className="concept-system" aria-labelledby="concept-system-title">
      <div className="concept-system-heading"><span className="concept-overline">SISTEMA VISUAL COMPARTILHADO</span><h2 id="concept-system-title">Uma linguagem reconhecível em todo o produto.</h2><p>As mesmas cores, tipografia, molduras e ícones acompanham o site, o painel dos noivos e os convites.</p></div>
      <div className="concept-palette" aria-label="Paleta de cores proposta"><span className="palette-chip palette-paper"><i /> Marfim</span><span className="palette-chip palette-sage"><i /> Sálvia</span><span className="palette-chip palette-rose"><i /> Rosa antigo</span><span className="palette-chip palette-peach"><i /> Pêssego</span><span className="palette-chip palette-ink"><i /> Verde profundo</span></div>
    </section>
    <section className="concept-outline" aria-labelledby="concept-outline-title">
      <div className="concept-system-heading"><span className="concept-overline">A PÁGINA INICIAL EXPLICA A JORNADA</span><h2 id="concept-outline-title">Do planejamento ao fim da festa.</h2><p>O site apresenta cada etapa em linguagem simples. Recursos ainda em construção aparecem como próximos passos, sem parecer que já estão disponíveis.</p></div>
      <div className="concept-outline-grid">
        <article><span><Heart size={20} /></span><h3>Montar o site do casal</h3><p>Escolher um tema, contar a história, publicar data, local e orientações. Criar e personalizar o site sem mensalidade.</p></article>
        <article><span><Users size={20} /></span><h3>Organizar convidados</h3><p>Compartilhar por link curto, convite individual ou QR code; acompanhar confirmações e preparar a recepção.</p></article>
        <article><span><Gift size={20} /></span><h3>Entender os presentes</h3><p>O casal pode publicar uma chave Pix para transferências diretas ou links para presentes físicos em lojas.</p></article>
        <article><span><Wallet size={20} /></span><h3>Oferecer Pix direto</h3><p>O convidado copia a chave e transfere diretamente aos noivos pelo aplicativo do banco.</p></article>
        <article><span><CalendarDays size={20} /></span><h3>Planejar orçamento e fornecedores</h3><p>Registrar despesas, valores e vencimentos e receber alertas mensais por e-mail ou notificação. Recurso planejado, ainda não disponível.</p></article>
        <article><span><Printer size={20} /></span><h3>Enviar e imprimir o convite</h3><p>Aplicar a identidade visual ao QR code e preparar convite digital, arquivo para impressão e carteira digital conforme os formatos implementados.</p></article>
        <article><span><MapPin size={20} /></span><h3>Controlar a entrada</h3><p>Equipe consulta check-ins com e sem QR code e exporta a lista necessária para o buffet, sem expor contatos.</p></article>
        <article><span><Bell size={20} /></span><h3>Receber lembretes</h3><p>Alertas de pagamentos do casamento e avisos do evento em canais configurados pelo casal, quando esses recursos estiverem ativos.</p></article>
      </div>
    </section>
    <section className="concept-flow" id="presentes" aria-labelledby="concept-flow-title">
      <div><span className="concept-overline">PRESENTES POR PIX DIRETO OU LOJA</span><h2 id="concept-flow-title">O presente chega direto ao casal ou à loja.</h2><p>O Pix é transferido pelo aplicativo do banco diretamente aos noivos. Links de loja levam o convidado à página do produto para concluir a compra.</p></div>
      <div className="concept-flow-card"><div><span><Gift size={19} /></span><strong>Convidado escolhe uma ideia</strong><small>Pix direto ou item físico de loja</small></div><ArrowRight className="concept-flow-arrow" /><div><span><ShieldCheck size={19} /></span><strong>Banco do convidado faz o Pix</strong><small>O valor vai direto aos noivos</small></div><ArrowRight className="concept-flow-arrow" /><div><span><Wallet size={19} /></span><strong>Loja recebe o pedido</strong><small>Compra e entrega combinadas fora do site</small></div></div>
    </section>
    <section className="concept-actions"><div><span className="concept-overline">ESCOLHA DA DIREÇÃO VISUAL</span><h2>Qual delas combina mais com a plataforma?</h2><p>Jardim editorial mantém mais espaço para leitura. Convite botânico traz mais textura floral e clima de papelaria. A escolha define a identidade antes do redesenho final da página inicial.</p></div><div className="concept-action-cards"><article><Flower2 size={19} /><strong>Jardim editorial</strong><span>Foto grande, detalhes florais leves, leitura direta.</span></article><article><Flower2 size={19} /><strong>Convite botânico</strong><span>Molduras e cartões florais com mais presença visual.</span></article></div></section>
    <footer className="concept-footer"><span>{PRODUCT_NAME}</span><span>Fotos de referência: Pexels</span><a href="https://henriquesouzas.com" target="_blank" rel="noreferrer">henriquesouzas.com</a></footer>
  </main>
}
