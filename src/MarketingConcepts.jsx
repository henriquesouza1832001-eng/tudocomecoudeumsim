import { ArrowRight, CalendarDays, Check, Flower2, Gift, Heart, Link, QrCode, Users, Wallet } from 'lucide-react'
import './MarketingConcepts.css'
import { PRODUCT_NAME } from './product-config.js'


function ConceptPreview() {
  return <div className="concept-product-preview" aria-label="Demonstração ilustrativa da interface do convite">
    <div className="concept-preview-cover">
      <span className="concept-preview-kicker">UM DIA PARA CELEBRAR</span>
      <div className="concept-preview-photo"><Flower2 aria-hidden="true" /><span>Área da foto escolhida pelo casal</span></div>
      <strong>Nome do casal</strong>
      <span className="concept-preview-date">Data e horário do casamento</span>
      <span className="concept-preview-tag">Demonstração da interface</span>
    </div>
    <div className="concept-preview-details">
      <span className="concept-preview-label">CONVITE DO CASAL</span>
      <h3>Uma história, um convite, todos os detalhes do dia.</h3>
      <p>Endereço, programação e confirmação aparecem no convite publicado pelo casal.</p>
      <div className="concept-preview-event"><CalendarDays size={17} /><span><strong>Programação</strong><small>Eventos e horários cadastrados pelo casal</small></span></div>
      <div className="concept-preview-rsvp"><Check size={15} /> Confirmar presença por evento</div>
    </div>
  </div>
}

export default function MarketingConcepts() {
  return <main className="concept-page">
    <header className="concept-page-header"><a className="concept-page-brand" href="/">{PRODUCT_NAME} <small>identidade visual</small></a><a className="concept-return" href="/">Voltar para o site <ArrowRight size={15} /></a></header>
    <section className="concept-intro">
      <span className="concept-overline">DIREÇÃO VISUAL APROVADA</span>
      <h1>Jardim editorial, com leitura clara em cada etapa.</h1>
      <p>Marfim, verde sálvia e tipografia editorial dão espaço às informações do casamento. A foto do convite é escolhida pelo casal; esta demonstração mostra apenas a área reservada para ela.</p>
    </section>
    <section className="concept-options" aria-label="Demonstração do convite">
      <article className="concept-option concept-editorial">
        <div className="concept-option-heading"><div><span className="concept-overline">PRÉVIA ILUSTRATIVA</span><h2>Um convite feito para vocês</h2></div><span className="concept-subtitle">Demonstração da interface</span></div>
        <div className="concept-browser">
          <header className="concept-header">
            <a className="concept-brand" href="#inicio" aria-label={PRODUCT_NAME}><span>{PRODUCT_NAME}</span></a>
            <nav aria-label="Navegação da demonstração"><a href="#como-funciona">Como funciona</a><a href="#presentes">Presentes</a><a href="#recursos">Recursos</a></nav>
            <a className="concept-login" href="/painel">Entrar</a>
          </header>
          <div className="concept-hero" id="inicio">
            <ConceptPreview />
            <div className="concept-copy">
              <span className="concept-kicker">O CASAMENTO DE VOCÊS, EM UM SÓ LUGAR</span>
              <h3>Do planejamento ao grande dia, tudo começa com vocês.</h3>
              <p>Organizem o convite, os eventos e as confirmações em um endereço para compartilhar com cada pessoa.</p>
              <a className="concept-cta" href="/criar-site">Conhecer a plataforma <ArrowRight size={17} /></a>
              <span className="concept-free-note">Presentes são transferidos ou comprados fora da plataforma.</span>
            </div>
          </div>
          <div className="concept-quick-links" aria-label="Recursos demonstrados"><span><Heart size={16} /> História do casal</span><span><Users size={16} /> Confirmação por evento</span><span><QrCode size={16} /> QR para entrada</span></div>
        </div>
        <p className="concept-option-description">A interface reserva espaço para a foto real do casal, destaca data e programação e mantém as ações de confirmação visíveis em telas pequenas.</p>
      </article>
    </section>
    <section className="concept-system" id="recursos" aria-labelledby="concept-system-title">
      <div className="concept-system-heading"><span className="concept-overline">SISTEMA VISUAL</span><h2 id="concept-system-title">Uma linguagem contínua entre o convite e o painel.</h2><p>O mesmo verde profundo orienta ações e estados. O fundo marfim, a sálvia e poucos detalhes botânicos deixam os textos e os controles em primeiro plano.</p></div>
      <div className="concept-palette" aria-label="Paleta visual"><span className="palette-chip palette-paper"><i /> Marfim</span><span className="palette-chip palette-sage"><i /> Sálvia</span><span className="palette-chip palette-rose"><i /> Rosa antigo</span><span className="palette-chip palette-peach"><i /> Pêssego</span><span className="palette-chip palette-ink"><i /> Verde profundo</span></div>
    </section>
    <section className="concept-outline" id="como-funciona" aria-labelledby="concept-outline-title">
      <div className="concept-system-heading"><span className="concept-overline">O QUE A PLATAFORMA OFERECE</span><h2 id="concept-outline-title">Um lugar para organizar o casamento.</h2><p>Estas ações estão disponíveis no produto. Os recursos futuros não aparecem como se já estivessem ativos.</p></div>
      <div className="concept-outline-grid">
        <article><span><Heart size={20} /></span><h3>Personalizar o convite</h3><p>Escolher tema, cores, texto e seções e revisar a prévia antes de publicar.</p></article>
        <article><span><Users size={20} /></span><h3>Organizar convidados</h3><p>Cadastrar pessoas e grupos, compartilhar links individuais e acompanhar respostas por evento.</p></article>
        <article><span><CalendarDays size={20} /></span><h3>Gerenciar eventos</h3><p>Publicar datas, horários, locais e a programação da celebração.</p></article>
        <article><span><QrCode size={20} /></span><h3>Conferir a entrada</h3><p>A equipe valida o QR individual ou registra a chegada manualmente no evento.</p></article>
        <article><span><Wallet size={20} /></span><h3>Acompanhar despesas</h3><p>Registrar fornecedores, valores, pagamentos e vencimentos no painel do casal.</p></article>
        <article><span><Gift size={20} /></span><h3>Compartilhar presentes</h3><p>Exibir uma chave Pix direta aos noivos ou links para lojas escolhidas pelo casal.</p></article>
      </div>
    </section>
    <section className="concept-flow" id="presentes" aria-labelledby="concept-flow-title">
      <div><span className="concept-overline">PIX DIRETO OU LINK DE LOJA</span><h2 id="concept-flow-title">O presente vai ao casal ou à loja escolhida.</h2><p>O convidado faz a transferência no aplicativo do próprio banco ou conclui a compra no site da loja. A plataforma não recebe nem confirma pagamentos de presentes.</p></div>
      <div className="concept-flow-card"><div><span><Gift size={19} /></span><strong>O casal escolhe a opção</strong><small>Chave Pix ou produto de loja</small></div><ArrowRight className="concept-flow-arrow" /><div><span><Wallet size={19} /></span><strong>O convidado conclui</strong><small>No aplicativo do banco ou na loja</small></div><ArrowRight className="concept-flow-arrow" /><div><span><Link size={19} /></span><strong>O pagamento é externo</strong><small>Direto ao casal ou à loja</small></div></div>
    </section>
    <footer className="concept-footer"><span>{PRODUCT_NAME}</span><span>Prévia ilustrativa; não representa dados de um casal</span></footer>
  </main>
}
