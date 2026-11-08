import '@fontsource-variable/fraunces'
import '@fontsource-variable/inter'
import './landing-v2.css'
import { PRODUCT_NAME } from './product-config.js'

const PHOTOS = {
  hero: '/images/fotos/hero-casal.webp',
  convite: '/images/fotos/convite-casal.webp',
  buque: '/images/fotos/album-buque.webp',
  cerimonia: '/images/fotos/album-cerimonia.webp',
  mesa: '/images/fotos/album-mesa.webp',
  convidados: '/images/fotos/painel-convidados.webp',
  presentes: '/images/fotos/painel-presentes.webp',
  entrada: '/images/fotos/painel-entrada.webp',
  fechamento: '/images/fotos/fechamento.webp',
}

const PHOTO_CREDITS = [
  ['Albino Sambo', 'https://www.pexels.com/pt-br/foto/cerimonia-de-casamento-elegante-ao-ar-livre-com-um-casal-feliz-40144234/'],
  ['Pavel Danilyuk', 'https://www.pexels.com/photo/bride-and-groom-kissing-passionately-7119190/'],
  ['Melike B', 'https://www.pexels.com/photo/beautiful-wedding-bouquet-10074782/'],
  ['Alexander Mass', 'https://www.pexels.com/photo/romantic-outdoor-wedding-ceremony-under-floral-arch-37710821/'],
  ['Key Notez', 'https://www.pexels.com/photo/forman-table-setting-in-a-reception-12317806/'],
  ['Kawê Rodrigues', 'https://www.pexels.com/photo/newlyweds-and-guests-smiling-together-17529931/'],
  ['Letícia Alvares', 'https://www.pexels.com/photo/elegant-wedding-gift-wrapped-in-soft-ribbon-30151961/'],
  ['Taylor Thompson', 'https://www.pexels.com/photo/elegant-wedding-flat-lay-with-invitations-34579982/'],
  ['Jonathan Borba', 'https://www.pexels.com/photo/newlyweds-holding-hands-and-walking-together-19841050/'],
]

const Icon = ({ d }) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">{d}</svg>
const ICONS = {
  text: <><path d="M4 7V5h16v2" /><path d="M12 5v14" /><path d="M9 19h6" /></>,
  tap: <><path d="M9 11V5a2 2 0 0 1 4 0v6" /><path d="M13 10.5a2 2 0 0 1 4 0V15a6 6 0 0 1-6 6h-1a6 6 0 0 1-5-3l-1.5-3a1.6 1.6 0 0 1 2.7-1.7L9 14" /></>,
  photo: <><rect x="3" y="5" width="18" height="14" rx="2" /><circle cx="9" cy="11" r="2" /><path d="m21 16-5-5-8 8" /></>,
}

const EVENT_HOUR = 17
function nextEvent() {
  // Data fixa do exemplo: 19 de dezembro, 17h. Se já passou, usa o mesmo dia do ano seguinte; nunca mostra data passada.
  const now = new Date()
  let d = new Date(now.getFullYear(), 11, 19, EVENT_HOUR)
  if (d < now) d = new Date(now.getFullYear() + 1, 11, 19, EVENT_HOUR)
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const days = Math.round((new Date(d.getFullYear(), d.getMonth(), d.getDate()) - start) / 86400000)
  const text = d.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })
  return { days, label: `${text.charAt(0).toUpperCase()}${text.slice(1)} · ${EVENT_HOUR}h` }
}

function PhoneCard() {
  const { days, label } = nextEvent()
  const count = days === 0 ? 'É hoje!' : days === 1 ? 'Falta 1 dia' : `Faltam ${days} dias`
  return <div className="lp-phone" role="img" aria-label={`Exemplo do convite aberto no celular: Lívia e Caio, ${label}, ${count.toLowerCase()}, cerimônia e recepção na Casa das Oliveiras, botão Confirmar presença`}>
    <div className="lp-phone-screen" aria-hidden="true">
      <span className="lp-phone-notch" />
      <div className="lp-phone-photo">
        <img src={PHOTOS.convite} alt="" width="750" height="1124" loading="lazy" decoding="async" />
        <div className="lp-phone-hero-text">
          <p className="lp-phone-kicker">Vamos casar</p>
          <p className="lp-phone-names">Lívia<span className="lp-amp">&amp;</span>Caio</p>
          <p className="lp-phone-date" suppressHydrationWarning>{label}</p>
        </div>
      </div>
      <div className="lp-phone-body">
        <p className="lp-phone-count"><span suppressHydrationWarning>{count}</span></p>
        <div className="lp-phone-card"><span><b>Cerimônia e recepção</b><small>Casa das Oliveiras</small></span><span className="lp-phone-map">Ver no mapa</span></div>
        <div className="lp-phone-rsvp">Confirmar presença</div>
        <p className="lp-phone-note">Abre direto pelo link, sem instalar nada</p>
      </div>
    </div>
  </div>
}

function Phone({ small = false }) {
  return small
    ? <div className="lp-phone-scale"><div className="lp-phone-scale-inner"><PhoneCard /></div></div>
    : <PhoneCard />
}

const STEPS = [
  ['1', 'Escolham a foto e o texto', 'Nomes, data, local e programação num só lugar.'],
  ['2', 'Enviem o link a cada convidado', 'Cada pessoa abre o próprio convite, sem instalar nada.'],
  ['3', 'Acompanhem as respostas', 'Quem vem, quantos são e o que comem, no painel.'],
]

const PANEL = [
  ['Convidados', PHOTOS.convidados, 'Noivos e convidados reunidos e sorrindo durante a celebração', 'Lista por família, acompanhantes e restrições alimentares, com as respostas por evento.'],
  ['Presentes', PHOTOS.presentes, 'Presente de casamento embrulhado com fita delicada', 'Pix direto, sem taxa para convidados. O valor vai para a chave dos noivos.'],
  ['Controle de entrada', PHOTOS.entrada, 'Convites de casamento e acessórios organizados sobre uma mesa', 'A equipe lê o QR do convite pelo celular e registra quem chegou, mesmo com sinal fraco.'],
]

const ALBUM = [
  [PHOTOS.buque, 'Buquê de flores da noiva', 'O buquê'],
  [PHOTOS.cerimonia, 'Noivos trocando votos sob um arco floral em uma cerimônia ao ar livre', 'O lugar da cerimônia'],
  [PHOTOS.mesa, 'Mesa de recepção de casamento decorada com flores e velas', 'A mesa da celebração'],
]

const FAQ = [
  ['Os convidados precisam instalar um aplicativo?', 'Não. O convite abre direto pelo link, no navegador do celular.'],
  ['Como funciona o Pix dos presentes?', 'O casal publica uma chave Pix. O convidado transfere pelo próprio banco, direto aos noivos. A plataforma não recebe nem confirma o pagamento.'],
  ['Posso indicar uma loja para um presente físico?', 'Sim. O link abre o produto na loja para o convidado concluir a compra e combinar a entrega.'],
  ['Como compartilho o convite?', 'Depois de publicar, enviem o link individual de cada convidado por mensagem.'],
  ['A equipe consegue conferir a entrada?', 'Sim. A equipe usa o leitor de QR, registra entradas manuais e consulta a lista do evento.'],
  ['Também posso organizar os pagamentos do casamento?', 'Sim. Registrem fornecedores, despesas e vencimentos no painel do casal.'],
]

export default function MarketingLanding() {
  return <div className="lp">
    <a className="lp-skip" href="#conteudo">Ir para o conteúdo</a>
    <header className="lp-header">
      <a className="lp-brand" href="/" aria-label={PRODUCT_NAME}><img className="lp-brand-logo" src="/images/branding/logo-meu-altar.png" alt={PRODUCT_NAME} width="688" height="230" /></a>
      <nav aria-label="Principal">
        <a className="lp-link" href="#como-funciona">Como funciona</a>
        <a className="lp-link" href="/painel">Entrar</a>
        <a className="lp-btn" href="/cadastro">Criar meu site</a>
      </nav>
    </header>
    <main id="conteudo">
      <section className="lp-hero" aria-labelledby="t-hero">
        <div className="lp-hero-copy">
          <p className="lp-eyebrow">Site e convite de casamento</p>
          <h1 id="t-hero">Um convite com a história de vocês e os detalhes do dia.</h1>
          <p className="lp-lead">Data, local e confirmação de presença no mesmo endereço, prontos para abrir no celular.</p>
          <div className="lp-actions"><a className="lp-btn" href="/cadastro">Criar meu site</a><a className="lp-link lp-underline" href="#como-funciona">Ver como funciona</a></div>
        </div>
        <div className="lp-hero-art">
          <img className="lp-hero-photo" src={PHOTOS.hero} alt="Noivos sorrindo juntos em um jardim durante o casamento" width="880" height="1173" fetchpriority="high" decoding="async" />
          <div className="lp-phone-hero"><Phone small /></div>
        </div>
      </section>

      <section className="lp-steps" id="como-funciona" aria-labelledby="t-steps">
        <h2 id="t-steps">Como funciona</h2>
        <ol>{STEPS.map(([n, t, p]) => <li key={n}><span className="lp-num" aria-hidden="true">{n}</span><div><h3>{t}</h3><p>{p}</p></div></li>)}</ol>
      </section>

      <section className="lp-invite" id="convite" aria-labelledby="t-invite">
        <Phone />
        <div className="lp-invite-copy">
          <p className="lp-eyebrow">No celular</p>
          <h2 id="t-invite">O convite que cada convidado abre no próprio celular.</h2>
          <p className="lp-lead">Abre direto pelo link, sem instalar nada. Vocês escolhem tema, foto e texto e veem a prévia antes de publicar.</p>
          <ul className="lp-points">
            <li><Icon d={ICONS.text} /><span>Texto legível</span></li>
            <li><Icon d={ICONS.tap} /><span>Botões fáceis de tocar</span></li>
            <li><Icon d={ICONS.photo} /><span>Fotos bem enquadradas</span></li>
          </ul>
          <a className="lp-link lp-underline" href="/criar-site">Experimentar temas e ver a prévia</a>
        </div>
      </section>

      <section className="lp-album" id="album" aria-labelledby="t-album">
        <p className="lp-eyebrow">Álbum do casal</p>
        <h2 id="t-album">As fotos também contam a história do dia.</h2>
        <p className="lp-lead">Os convidados enviam fotos pela câmera do convite; o casal reúne tudo no painel.</p>
        <ul className="lp-album-grid">
          {ALBUM.map(([src, alt, cap]) => <li key={cap}><figure><img src={src} alt={alt} width="900" height="600" loading="lazy" decoding="async" /><figcaption>{cap}</figcaption></figure></li>)}
        </ul>
        <p className="lp-note">Fotos ilustrativas do Pexels; cada casal escolhe suas próprias imagens.</p>
        <details className="lp-photo-credits">
          <summary>Créditos das fotografias</summary>
          <p>Fotos: {PHOTO_CREDITS.map(([name, href], index) => <span key={name}><a href={href} target="_blank" rel="noreferrer">{name}</a>{index < PHOTO_CREDITS.length - 1 ? ', ' : ''}</span>)} · via <a href="https://www.pexels.com/pt-br/" target="_blank" rel="noreferrer">Pexels</a></p>
        </details>
      </section>

      <section className="lp-panel" id="painel" aria-labelledby="t-panel">
        <h2 id="t-panel">O painel do casal, do convite à entrada.</h2>
        <ul className="lp-panel-grid">{PANEL.map(([t, src, alt, p]) => <li key={t}><img src={src} alt={alt} width="600" height="400" loading="lazy" decoding="async" /><div><h3>{t}</h3><p>{p}</p></div></li>)}</ul>
      </section>

      <section className="lp-faq" id="duvidas" aria-labelledby="t-faq">
        <h2 id="t-faq">Dúvidas comuns</h2>
        <div>{FAQ.map(([q, a]) => <details key={q} name="faq"><summary>{q}</summary><p>{a}</p></details>)}</div>
      </section>

      <section className="lp-closing" aria-labelledby="t-close">
        <img src={PHOTOS.fechamento} alt="Casal de recém-casados caminhando de mãos dadas após a cerimônia" width="1800" height="1200" loading="lazy" decoding="async" />
        <div className="lp-closing-copy">
          <h2 id="t-close">Vamos preparar o convite de vocês?</h2>
          <a className="lp-btn" href="/cadastro">Criar meu site</a>
          <a className="lp-link lp-underline" href="/painel">Já tenho uma conta</a>
        </div>
      </section>
    </main>
    <footer className="lp-footer">
      <span className="lp-brand-foot">{PRODUCT_NAME}</span>
      <nav aria-label="Rodapé">
        <a href="/cadastro">Criar meu site</a>
        <a href="#como-funciona">Como funciona</a>
      </nav>
    </footer>
  </div>
}
