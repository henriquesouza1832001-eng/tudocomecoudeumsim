# Tudo começou de um sim

Plataforma responsiva para casais criarem o site do casamento e organizarem convites, convidados, eventos e detalhes da celebração. O modelo comercial aprovado é um pagamento único de R$ 90,00 pelo acesso; o checkout ainda está em sandbox e não libera acesso automaticamente. Presentes são pagos diretamente aos noivos por Pix ou comprados em lojas externas; a plataforma não recebe nem movimenta esse dinheiro.

## Como a plataforma funciona

- **Noivos:** criam o acesso, configuram a identidade do convite, publicam o site, cadastram eventos e convidados, acompanham confirmações e planejam despesas com fornecedores.
- **Convidados:** abrem o convite individual por link ou QR code, consultam somente os eventos autorizados, confirmam presença e usam os recursos habilitados pelo casal.
- **Padrinhos:** recebem orientações e tarefas ligadas ao próprio convite.
- **Equipe do evento:** acessa apenas os eventos atribuídos. A equipe de entrada usa o leitor de QR e registra presenças.
- **Superadmin:** administra a plataforma em uma área protegida por Cloudflare Access e autenticação de dois fatores.
- **Site público:** mostra a versão publicada. O rascunho do casal só aparece aos convidados depois da publicação.

O editor oferece temas e escolhas visuais curadas, prévia em celular, tablet e computador, biblioteca de seções e mídia do casal. O convite pode continuar sem foto. A lista de presentes pode exibir uma chave Pix dos noivos ou encaminhar o convidado para uma loja externa. Valores de fornecedores são anotações privadas do casal; lembretes mensais dependem da configuração do Worker de despesas.

O jogo ainda não tem API nem persistência. O controle de quiz foi removido da demonstração `/painel/demo` porque só alterava estado local e não registrava respostas ou ranking. O fluxo de cobrança do acesso também permanece em sandbox: os endpoints de teste do Mercado Pago não liberam acesso automaticamente.

### Áreas da API

- `/api/auth/*`: cadastro, confirmação de e-mail, login, redefinição de senha e sessões.
- `/api/couple/weddings/*`: recursos privados do casamento, incluindo editor, mídia, eventos, convidados, RSVP, equipe, presentes e despesas.
- `/api/public/weddings/*`: conteúdo publicado, mural e confirmação pública de presença.
- `/api/invitation/*`: convite individual, acompanhantes, fotos espontâneas e carteiras digitais.
- `/api/godparent/*` e `/api/staff/*`: tarefas individuais dos padrinhos, eventos atribuídos, consulta de lista e controle de entrada.
- `/api/superadmin/*`: operações administrativas protegidas por Cloudflare Access e autorização do produto.

As rotas privadas verificam a sessão e o escopo do casamento no servidor. As rotas de convidados usam credenciais individuais; as respostas públicas expõem apenas conteúdo publicado ou os dados mínimos necessários à ação solicitada. Mensagens internas de erro são convertidas em orientações para o usuário nas telas do aplicativo.

## Tecnologias

- React 18 e Vite para a interface.
- Cloudflare Pages para os arquivos estáticos e Pages Functions.
- Hono para as rotas HTTP da API.
- Cloudflare D1 para contas, casamentos, eventos, convites, confirmações e despesas.
- Cloudflare R2 para fotos e arquivos de mídia.
- Workers para roteamento de subdomínios e execução agendada dos lembretes de despesas.
- Cloudflare Turnstile para proteger formulários públicos.

As referências de Cloudflare ficam em `wrangler.jsonc`, `wrangler.worker.jsonc` e `workers/expense-reminders/wrangler.jsonc`. O site publicado usa a integração Git do Cloudflare. Não há pipeline próprio de publicação.

## Estrutura do repositório

- `src/App.jsx`: rotas de interface, painel, editor e fluxos de convidados.
- `src/MarketingLanding.jsx`: página pública do produto.
- `src/product-config.js`: nome oficial do produto e endereço base público.
- `src/site-*.js`: regras de estilo, seções, publicação, histórico e mídia do site.
- `functions/api/[[route]].js`: API de autenticação, painel, convites, eventos, RSVP, presentes, despesas e entrada.
- `functions/_middleware.js`: metadados públicos, acesso administrativo e regras de resposta do Pages.
- `src/worker.js`: Worker para identificar casamentos pelo subdomínio.
- `workers/expense-reminders/`: envio agendado dos lembretes mensais.
- `migrations/`: alterações versionadas do esquema D1.
- `public/`: imagens, ícones, manifesto PWA, sitemap e arquivos públicos.
- `tests/`: testes automatizados de API, acesso, autenticação, mídia, convites, despesas e regras do editor.

## Perfis e fluxos

- **Casal:** cadastro e confirmação de e-mail, personalização e publicação, eventos, convidados por cadastro ou importação, RSVP, equipe, álbum, despesas e presentes.
- **Convidado:** link individual, eventos autorizados, RSVP, acompanhantes sujeitos às regras do casal, carteira digital quando configurada e câmera espontânea com limite compartilhado do casamento.
- **Padrinho:** tarefas ligadas ao próprio convite, sem acesso à lista geral.
- **Equipe:** consulta somente os eventos atribuídos; a equipe de entrada pode fazer check-in e preparar/sincronizar a lista offline.
- **Superadmin:** painel restrito, operações administrativas e autenticação TOTP.

Os testes do repositório exercitam regras de autorização, respostas e operações com dependências simuladas. Um teste de superfície percorre as 107 rotas com chamadas sem sessão ou com dados inválidos para detectar rotas não registradas e exceções HTTP 500. O simulador local também verifica respostas fictícias para navegar nas áreas principais. Esses testes não validam todas as operações bem-sucedidas contra D1 nem chamadas reais de provedores externos. A suíte cobre fluxos específicos de convites, padrinhos, equipe, check-in, mídia, despesas e presentes. Consulte `npm test` para o resultado do checkout local.

## Desenvolvimento e validação

Requer Node.js e npm. Na raiz do repositório:

```sh
npm install
npm run dev
```

O comando `npm run dev` serve a interface pelo Vite. Para testar a API e os bindings locais do Cloudflare, gere o build e rode `npx wrangler pages dev dist`.

Para percorrer as telas com dados fictícios sem chamar o Worker, use `npm run dev` e abra `http://localhost:5173/verificar/`. Os mesmos links ficam disponíveis no caminho `/verificar/` dos deploys de prévia do Pages. Nesses endereços, acrescente `?teste-local=1` para ativar a demonstração. Os formulários recebem respostas simuladas no navegador e não persistem alterações. O sinalizador só ativa no Vite local ou em um subdomínio de prévia do Pages; no domínio principal ele não desativa a autenticação.

O ambiente temporário `tudocomecoudeumsim-qa-20261021` tem D1 migrado e semeado com registros fictícios, além de um bucket R2 temporário. O modo visual intercepta chamadas de API no navegador, portanto as ações da demonstração não gravam no D1. As APIs continuam protegidas por sessão. Ao terminar a revisão, remova os recursos temporários pelo Wrangler depois de confirmar que ninguém mais está usando a prévia.

Antes de compartilhar alterações, rode:

```sh
npm run build
npm run lint
npm test
```

`npm run build` gera `dist/` e prepara a página pública para entrega estática. Para validar Pages Functions e bindings localmente, use o Wrangler com a configuração do projeto e dados de desenvolvimento. Não aplique migrações locais ou remotas sem conferir o estado do banco correspondente.

## Dados e configuração Cloudflare

O binding D1 `DB` e o bucket R2 `GUEST_PHOTOS` estão declarados nos arquivos Wrangler. O domínio base dos subdomínios continua em aberto no Worker, em `BASE_DOMAIN`; preencha quando o domínio for definido. Credenciais e chaves privadas devem ficar nas variáveis e secrets do Cloudflare, nunca no repositório.

Entre os nomes de configuração usados pelo Worker estão `ACCESS_TEAM_DOMAIN`, `ACCESS_APPLICATION_AUD`, `SUPERADMIN_EMAIL`, `TURNSTILE_SECRET_KEY`, `GUEST_CREDENTIALS_ENCRYPTION_KEY`, `MFA_ENCRYPTION_KEY`, `RESEND_API_KEY` e as credenciais dos recursos Google Wallet e Apple Wallet. Confira o código e os bindings antes de criar ou alterar secrets; não use os exemplos de demonstração como credenciais.

O preço de acesso fica centralizado em `src/product-config.js`. O Mercado Pago disponível no painel é apenas de teste e não provisiona o acesso pago; não trate esses endpoints como checkout de produção.

Antes de aplicar uma migração, confira no D1 correto quais versões já foram executadas e revise a ordem dos arquivos em `migrations/`. O histórico deste projeto contém dois arquivos com prefixo `0014`; não deduza o estado do banco apenas pela numeração do nome.

As consultas da API devem validar sessão, papel e escopo do casamento no servidor. Registros ligados a um casamento precisam ser filtrados pelo `wedding_id`. Respostas públicas não incluem a lista privada de convidados.
