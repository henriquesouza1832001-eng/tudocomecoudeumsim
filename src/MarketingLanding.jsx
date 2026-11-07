import '@fontsource-variable/fraunces'
import '@fontsource-variable/inter'
import './landing-v2.css'
import { PRODUCT_NAME } from './product-config.js'

/*
 * Créditos das fotos (licença Unsplash — uso comercial livre, atribuição opcional).
 * Arquivos em /images/fotos/*.webp; lista em /creditos.html.
 * Os nomes dos fotógrafos não puderam ser confirmados automaticamente (Unsplash bloqueia robôs).
 */

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

const Icon = ({ d }) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">{d}</svg>
const ICONS = {
  text: <><path d="M4 7V5h16v2" /><path d="M12 5v14" /><path d="M9 19h6" /></>,
  tap: <><path d="M9 11V5a2 2 0 0 1 4 0v6" /><path d="M13 10.5a2 2 0 0 1 4 0V15a6 6 0 0 1-6 6h-1a6 6 0 0 1-5-3l-1.5-3a1.6 1.6 0 0 1 2.7-1.7L9 14" /></>,
  photo: <><rect x="3" y="5" width="18" height="14" rx="2" /><circle cx="9" cy="11" r="2" /><path d="m21 16-5-5-8 8" /></>,
}

function Phone({ className = '' }) {
  return <div className={`lp-phone ${className}`} role="img" aria-label="Exemplo do convite aberto no celular: Lívia e Caio, faltam 42 dias, cerimônia e recepção na Casa das Oliveiras, botão Confirmar presença">
    <div className="lp-phone-screen" aria-hidden="true">
      <div className="lp-phone-photo"><img src={PHOTOS.hero} alt="" width="880" height="1100" loading="lazy" decoding="async" /></div>
      <div className="lp-phone-body">
        <p className="lp-phone-kicker">Vamos casar</p>
        <p className="lp-phone-names">Lívia &amp; Caio</p>
        <p className="lp-phone-date">Sábado, 17 de outubro · 16h</p>
        <p className="lp-phone-count"><strong>Faltam 42 dias</strong></p>
        <div className="lp-phone-card"><span><b>Cerimônia e recepção</b><small>Casa das Oliveiras</small></span><u>Ver no mapa</u></div>
        <div className="lp-phone-rsvp">Confirmar presença</div>
      </div>
    </div>
  </div>
}

const STEPS = [
  ['1', 'Escolham a foto e o texto', 'Nomes, data, local e programação num só lugar.'],
  ['2', 'Enviem o link a cada convidado', 'Cada pessoa abre o próprio convite, sem instalar nada.'],
  ['3', 'Acompanhem as respostas', 'Quem vem, quantos são e o que comem, no painel.'],
]

const PANEL = [
  ['Convidados', PHOTOS.convidados, 'Pessoas reunidas em torno de uma mesa de casamento', 'Lista por família, acompanhantes e restrições alimentares, com as respostas por evento.'],
  ['Presentes', PHOTOS.presentes, 'Presente embrulhado com laço', 'Pix direto, sem taxa para convidados. O valor vai para a chave dos noivos.'],
  ['Controle de entrada', PHOTOS.entrada, 'Convite de papel sobre uma mesa', 'A equipe lê o QR do convite pelo celular e registra quem chegou, mesmo com sinal fraco.'],
]

const ALBUM = [
  [PHOTOS.buque, 'Buquê de flores', 'O buquê'],
  [PHOTOS.cerimonia, 'Duas cadeiras decoradas com flores num gramado, de frente para o lago', 'O lugar da cerimônia'],
  [PHOTOS.mesa, 'Mesa de celebração posta com flores', 'A mesa da celebração'],
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
      <a className="lp-brand" href="/" aria-label={PRODUCT_NAME}>{PRODUCT_NAME}</a>
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
          <img className="lp-hero-photo" src={PHOTOS.hero} alt="Casal de noivos caminhando ao ar livre" width="880" height="1100" fetchpriority="high" decoding="async" />
          <Phone className="lp-phone-hero" />
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
        <p className="lp-note">Galeria com fotos reais, sem miniaturas vazias ou repetidas.</p>
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
        <img src={PHOTOS.fechamento} alt="Casal de noivos diante de uma paisagem aberta" width="1800" height="900" loading="lazy" decoding="async" />
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
        <a href="/ajuda">Central de ajuda</a>
        <a href="/creditos.html">Créditos das fotos</a>
      </nav>
      <a className="lp-contact" href="/ajuda">Fale com a gente pela central de ajuda</a>
    </footer>
  </div>
}
