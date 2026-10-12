# Instruções do projeto: Plataforma de Sites de Casamento

Este arquivo é a fonte de verdade para o agente. Siga exatamente o que está escrito. Não contradiga nenhuma diretriz. Em caso de dúvida, lacuna ou conflito, pergunte ao dono do projeto antes de implementar. Nunca invente requisito.

## 1. Visão

Plataforma em que casais criam um site de casamento personalizável, com lista de presentes, confirmação de presença, notificações, controle de entrada por QR code e um jogo diário opcional. Cada casal tem seu próprio subdomínio. O serviço é cobrado por uma taxa por presente recebido, sem mensalidade.

Nome do produto: usar o nome já definido no Codex. Manter o nome em uma única constante de configuração, nunca espalhado pelo código.

## 2. Regras de trabalho (obrigatórias)

- O repositório serve apenas para versionar. O deploy é feito pela integração Git do Cloudflare. Não criar pipelines de deploy próprios.
- O banco D1 é criado pelo dono do projeto no painel da Cloudflare. Deixar o binding no arquivo de configuração do Wrangler com identificador a preencher e nunca inventar IDs.
- Código limpo, sem nenhum tipo de comentário, em nenhum arquivo.
- Criar o mínimo de arquivos .md. Os únicos permitidos são este AGENTS.md e, se estritamente necessário, um README curto. Não criar documentação extra.
- Todas as páginas públicas têm rodapé com o crédito "henriquesouzas.com", com link para o site.
- Segredos (Stripe, chaves VAPID, assinatura de tokens) ficam apenas em secrets do Worker. Nunca no repositório.
- Mockups só podem mostrar o que é implementável com a stack deste documento. Nada impossível.
- Antes de definir a versão final do visual, gerar mockups das opções para o dono do projeto escolher. As referências de sites do dono do projeto têm prioridade sobre as da seção 17.
- Implementar na ordem das fases da seção 16. Não adiantar fases sem pedido.
- Antes de concluir qualquer entrega, rodar build e lint e corrigir os erros.

## 3. Diretrizes do produto (não negociáveis)

1. Frontend inteiro em React.js, com foco em beleza, personalização e animações.
2. Responsivo para qualquer dispositivo, com abordagem mobile first.
3. Infraestrutura Cloudflare, com banco D1.
4. Os noivos usam o painel pela web.
5. Os convidados acessam por três caminhos, todos obrigatórios: QR code, link curto e link de acesso fornecido pelos noivos no site.
6. PWA primeiro. Deixar os projetos Android e iOS prontos apenas para compilar. O dono do projeto compra as contas e publica nas lojas.
7. Lista de presentes.
8. Lista de presença (RSVP).
9. Notificação push 30 dias antes do casamento, com mensagem personalizada pelos noivos, oferecendo adicionar o evento ao calendário. O sistema pergunta qual calendário o convidado usa: Google, Outlook ou Apple.
10. Site dos noivos totalmente personalizável dentro de limites definidos. Personalização curada, nunca infinita.
11. Presentes em dinheiro por dois modos que convivem: Pix via Stripe e Pix direto na chave Pix dos noivos.
12. Modo de controle de entrada: parte do app dedicada a ler QR code no dia do evento, substituindo a lista física.
13. Jogo diário, uma partida por dia por convidado, com ranking entre convidados. Opcional: os noivos ligam ou desligam.
14. Multi-idioma.
15. Cada casal tem seu subdomínio.
16. Cobrança por taxa por presente.

## 4. Arquitetura (Cloudflare)

- Frontend: React + Vite, servido por Worker com assets estáticos, necessário para atender subdomínios curingas. Validar na implementação.
- API: Cloudflare Workers com Hono, no mesmo repositório.
- Banco: D1 (SQL), com migrations versionadas.
- Imagens e galeria: R2, com redimensionamento no envio.
- Link curto: slug único por casamento, resolvido pelo Worker, com tabela no D1 e cache em KV.
- QR code: gerado no cliente a partir do link curto.
- Anti-bot nos formulários públicos: Turnstile.
- Agendamentos: Cron Triggers.
- Isolamento: todo registro carrega o identificador do casamento e toda consulta filtra por ele.

## 5. Subdomínios

- Formato casal.dominio.com, com DNS curinga e rota curinga apontando para o Worker.
- O Worker identifica o casamento pelo cabeçalho Host, consulta o D1 e guarda em cache no KV.
- Validação do subdomínio: 3 a 30 caracteres, letras minúsculas, números e hífen, único, com lista de nomes reservados (www, app, api, admin, painel, status, mail) e filtro de palavrões.
- O link curto redireciona para o subdomínio.
- O painel dos noivos fica em endereço próprio da plataforma, separado dos subdomínios dos casais.
- Domínio próprio do casal é evolução futura via Cloudflare for SaaS. Não implementar agora.
- O domínio base ainda não foi definido. Perguntar antes de fixar.

## 6. Idiomas

- react-i18next com pt-BR (padrão), en e es. Confirmar a lista final com o dono do projeto.
- Idioma inicial detectado pelo navegador, com seletor visível e escolha lembrada.
- Textos fixos da interface em arquivos de tradução versionados.
- Textos dos noivos (história, convite, mensagens) com campo por idioma e fallback para pt-BR quando faltar tradução.
- Datas, horários e moeda formatados com Intl. Valores de presente sempre em BRL.
- A notificação dos 30 dias sai no idioma salvo do convidado.

## 7. Site dos convidados e personalização

Objetivo: cada casal monta o site do seu jeito, com o nível de controle dos melhores construtores de sites de casamento, mas com pré-visualização real, verificação antes de publicar e proteções que impedem um site feio, ilegível ou quebrado. A personalização é profunda, porém sempre dentro de um sistema de design com limites (diretriz 10). Nunca oferecer CSS, HTML ou JavaScript livre, nem editor de posicionamento por pixel.

### 7.1 Princípios

- O casal nunca começa de uma tela em branco: parte de um tema com conteúdo de exemplo e ajusta.
- Tudo o que o casal altera aparece na pré-visualização ao vivo, em celular, tablet e desktop, antes de publicar.
- Todo controle é feito de tokens de design (cores, fontes, espaçamentos, raios, animações). Trocar um token nunca quebra o layout, o contraste nem a responsividade.
- Trocar de tema preserva todo o conteúdo, as fotos e as configurações de seções.
- Rascunho e versão publicada são separados. O site dos convidados só muda quando o casal publica.
- O site é mobile first: cada opção precisa funcionar bem em tela de celular antes de qualquer outra.

### 7.2 Assistente inicial

- Fluxo curto de até 6 passos no primeiro acesso: nomes, data, local, estilo do casamento (clássico, rústico, praia, minimalista, boho, moderno), foto de capa e idiomas do site.
- As respostas escolhem um tema inicial e já ativam as seções mais comuns. O casal pode pular qualquer passo e voltar depois.
- Ao enviar a foto de capa, o app sugere paletas extraídas da imagem (cálculo no navegador, sem serviço externo) e o ponto focal para recorte.

### 7.3 Temas

- 8 temas prontos no lançamento. Cada tema é um conjunto de tokens: paleta, par de fontes, raio de borda, estilo de botão, estilo de divisores, layout padrão da capa e preset de animação.
- Cada tema traz 6 paletas curadas, todas com contraste validado.
- Os temas devem ser visualmente distintos entre si (claro, escuro, serifado clássico, moderno sem serifa, floral, minimalista, rústico, praia ou tropical).
- Pré-visualização de tema com o conteúdo real do casal antes de aplicar.

### 7.4 Cores

- Escolha entre as paletas do tema, mais cor de destaque personalizada por seletor.
- Ao escolher cor própria, o sistema ajusta automaticamente tons de texto e fundo para manter contraste mínimo de 4,5:1 (WCAG AA) e avisa quando precisou corrigir.
- Papéis de cor fixos: fundo, superfície, texto, texto secundário, destaque, texto sobre destaque, linhas. O casal altera os papéis, nunca elementos soltos.
- Modo claro, escuro ou automático pela preferência do dispositivo, quando o tema suportar.
- A cor do site também define a cor do QR code estilizado, do ícone do PWA e da prévia de compartilhamento.

### 7.5 Tipografia

- 8 pares de fontes pré-definidos (título e corpo), todos com suporte a acentuação de português e espanhol.
- Escala de tamanho do texto: pequena, média ou grande.
- Opções de estilo do título: peso, caixa alta nos rótulos e espaçamento entre letras, dentro de faixas seguras.
- Fontes servidas pelo próprio projeto, com subconjunto de caracteres e carregamento otimizado. Não permitir upload de fontes nem fontes arbitrárias.

### 7.6 Capa

- 6 layouts de capa: foto em tela cheia, foto dividida ao lado do texto, foto em moldura ou arco, somente tipografia, vídeo curto em loop e colagem de 3 fotos.
- Controles: alinhamento do texto, intensidade da camada escura sobre a foto, ponto focal da imagem separado para celular e desktop, frase de apresentação, formato da data.
- Contagem regressiva com formato dias, completo ou oculta.
- Botões de ação da capa à escolha do casal entre: confirmar presença, presentear, ver local, jogar o quiz (se ativo).
- Vídeo da capa: curto, silencioso, comprimido e com foto de reserva para conexões lentas.

### 7.7 Seções

Biblioteca de seções. Cada uma pode ser ligada, desligada e reordenada (arrastar com toque, mouse e teclado), tem título editável por idioma e de 2 a 3 variações de layout:
- Capa com contagem regressiva.
- Nossa história, com texto e fotos.
- Linha do tempo do casal.
- Eventos: cerimônia, recepção e eventos extras, com mapa e como chegar.
- Cronograma do dia.
- Dress code, com paleta sugerida.
- Padrinhos e madrinhas, com foto e frase.
- Lista de presentes.
- Confirmação de presença.
- Galeria, com álbuns e legendas.
- Mural de recados.
- Hospedagem, transporte e dicas.
- Perguntas frequentes.
- Playlist: pedido de músicas e link externo da lista, sem integração obrigatória.
- Vídeo, por link externo ou arquivo curto.
- Contato dos noivos ou do cerimonial.
- Quiz dos Noivos (somente se ativo).
- Seções livres: até 6 blocos de texto, imagem ou links, para o que não estiver na biblioteca.

Opções por seção, sempre em listas fechadas: fundo (cor da paleta, imagem ou padrão sutil), espaçamento (compacto, padrão ou amplo), alinhamento (esquerda ou centro) e largura de leitura.

### 7.8 Eventos e visibilidade por grupo

- Até 6 eventos por casamento (cerimônia, recepção, ensaio, churrasco, brunch e outros), cada um com data, horário, local, mapa, dress code e observações.
- Cada grupo de convidados vê apenas os eventos para os quais foi convidado (por exemplo: padrinhos no ensaio, todos na cerimônia, parte da lista na festa).
- A confirmação de presença é feita por evento e por grupo, com acompanhantes, restrições alimentares e escolha de cardápio quando o casal ativar.
- Mensagem de boas-vindas personalizada com o nome do convidado ou da família.
- Seções inteiras também podem ser limitadas a um grupo de convidados.

### 7.9 Navegação e rodapé

- O menu é gerado automaticamente a partir das seções ativas, com rótulos editáveis por idioma.
- Estilos de menu: fixo no topo, recolhido em menu lateral no celular ou barra inferior no PWA.
- Botão flutuante opcional de confirmar presença.
- O rodapé sempre mostra o crédito "henriquesouzas.com" com link. O casal não pode removê-lo.

### 7.10 Animações

- Presets: suave, elegante, festivo e nenhum. Cada tema define o preset padrão.
- Efeitos disponíveis: entrada das seções ao rolar (fade e deslize), movimento leve na capa, contagem regressiva animada, confete ao confirmar presença e tela de entrada opcional com envelope animado que abre para o site.
- Intensidade: completa, reduzida ou desligada, escolhida pelo casal e também respeitando prefers-reduced-motion e o modo de economia de dados.
- Animar somente transform e opacity, para manter fluidez em celulares simples. Desativar efeitos pesados automaticamente em dispositivos de baixo desempenho.

### 7.11 Imagens e mídia

- Upload para o R2 com compressão, conversão para formatos modernos (WebP ou AVIF), tamanhos responsivos e limite de tamanho por arquivo.
- Recorte guiado por ponto focal, nunca por posicionamento livre.
- Texto alternativo por imagem, por idioma, com lembrete quando faltar.
- Galeria com ordem por arrastar, álbuns (pré-casamento, viagens, família), legendas e visualização ampliada.
- Limites de quantidade por casamento definidos em configuração, não fixos no código.

### 7.12 Idiomas e conteúdo

- Os noivos escolhem quais idiomas ativar entre pt-BR, en e es.
- Todo texto editável tem um campo por idioma, com indicador de completude por seção e opção de copiar o texto de outro idioma.
- Quando faltar tradução, o site mostra o pt-BR (fallback) e o painel avisa.
- Datas, horários e moeda seguem o idioma do visitante.

### 7.13 Compartilhamento e identidade

- Prévia ao compartilhar o link (imagem, título e descrição, por idioma), pensada para o WhatsApp e redes sociais.
- Monograma gerado a partir das iniciais do casal, usando a fonte e as cores do tema. O monograma gera o favicon, o ícone do PWA e a tela de abertura do app instalado.
- Link curto e subdomínio exibidos no painel, com QR code estilizado nas cores do tema e arte pronta para imprimir (PNG e PDF) em formatos de cartão e de convite.
- Mensagem da notificação dos 30 dias: editor por idioma com variáveis como nome do convidado, dias restantes e data, pré-visualização e envio de teste para o próprio casal.
- Título e descrição do evento no calendário (.ics) editáveis por idioma.

### 7.14 Privacidade e acesso

- Três níveis, à escolha do casal: site aberto a quem tem o link, site protegido por senha simples, ou acesso apenas por link individual do convidado.
- Buscadores bloqueados por padrão (noindex). O casal pode liberar.
- Dados de convidados e respostas nunca aparecem em seções públicas.
- O mural de recados pode ser moderado antes de aparecer.

### 7.15 Editor, rascunho e publicação

- Autosave contínuo no rascunho, com desfazer e refazer.
- Pré-visualização ao vivo com alternância entre celular, tablet e desktop e com a escolha de idioma.
- Link privado de pré-visualização para o casal mostrar o rascunho a quem quiser antes de publicar.
- Verificador antes de publicar, com lista de pendências: contraste, texto faltando em algum idioma ativo, imagem sem texto alternativo, imagem muito pesada, seção ativa vazia, local sem endereço e chave Pix ausente quando o Modo B estiver ativo. Pendências de acessibilidade bloqueiam a publicação; as demais apenas avisam.
- Publicação imediata ou agendada.
- Histórico das últimas 20 versões publicadas, com restauração em um toque.
- Colaboradores com papéis: administrador (os noivos), editor (cerimonialista, familiar), leitor e equipe de entrada (acesso somente ao leitor de QR).
- Edição simultânea por duas pessoas é resolvida com aviso de alteração mais nova, sem sobrescrever em silêncio.

### 7.16 Depois do casamento

- Modo agradecimento: a capa muda para mensagem de agradecimento e galeria do evento, e o casal escolhe manter ou fechar RSVP e presentes.
- Encerramento do quiz com revelação do campeão.
- Exclusão ou anonimização dos dados conforme a política de LGPD, com aviso prévio ao casal.

### 7.17 Garantias de qualidade

- Contraste mínimo WCAG AA em qualquer combinação oferecida.
- Alvos de toque de pelo menos 44 px, foco visível, rótulos em todos os campos e navegação completa por teclado.
- Responsivo em todas as larguras, sem rolagem horizontal.
- Meta de desempenho: carregamento da capa rápido em 4G, com imagens responsivas, fontes em subconjunto e carregamento sob demanda das seções abaixo da dobra.
- Todo recurso de personalização é testado nos 3 idiomas e nos 8 temas.

### 7.18 Modelo de dados

- A configuração do site é um documento JSON com versão e esquema validado, guardado no D1: tema, tokens escolhidos, seções (ordem, ativa, variação, conteúdo por idioma), eventos, grupos e acesso.
- Rascunho e publicado são registros separados. Publicar gera um instantâneo imutável servido a partir do cache (KV), o que dá velocidade e permite restaurar versões.
- O esquema é validado no servidor e no cliente. Valor fora das listas permitidas é rejeitado.
- Migração de esquema versionada para que sites antigos continuem abrindo.

### 7.19 Limites (o que não fazer)

- Sem CSS, HTML ou JavaScript livre. Sem upload de fontes. Sem editor de posicionamento por pixel. Sem número ilimitado de seções livres ou de eventos.
- Sem modificar nem remover o crédito do rodapé.
- Novos temas, fontes e layouts entram apenas por atualização do projeto, nunca pelo casal.

### 7.20 Entrega por fase

- Fase 1: assistente inicial, temas, cores, fontes, capa, biblioteca de seções (ligar, desligar, reordenar, variações), eventos, idiomas, imagens com ponto focal, pré-visualização ao vivo, rascunho e publicação, verificador básico, presets simples de animação.
- Fase 2: personalização dos blocos de presentes e dos modos Pix, com chave Pix e taxa exibida de forma transparente.
- Fase 3: mensagem dos 30 dias com variáveis, título do calendário, monograma e ícone do PWA, prévia de compartilhamento, QR estilizado e arte para impressão, envelope animado e confete.
- Fase 5: personalização do quiz (perguntas, prêmio e encerramento).
- Antes da fase 6: visibilidade por grupo refinada, histórico de versões, colaboradores e modo agradecimento, se não tiverem entrado antes por necessidade.
- Se algum item acima for necessário antes da fase indicada, perguntar ao dono do projeto.

### 7.21 Como superamos os sites atuais

- Referências de funcionalidade: Joy (vários eventos, RSVP detalhado), Zola e The Knot (site e lista integrados), iCasei (mural, enquetes, contagem regressiva), Casar.com (lista em dinheiro com Pix), Squarespace e Riley & Grey (tipografia, galeria e acabamento visual), Greenvelope (envelope animado).
- Diferenciais a entregar: pré-visualização real em três dispositivos com idioma, verificador de qualidade antes de publicar, paleta sugerida pela foto de capa, conteúdo e eventos por grupo de convidados, modo agradecimento, histórico de versões, QR e monograma estilizados com a identidade do casal e o mesmo sistema de design em site, PWA e notificação.

## 8. Painel dos noivos

- Convidados: cadastro manual, importação por planilha CSV, grupos e famílias, acompanhantes, restrições alimentares.
- Presença: status por convidado, relatório e exportação.
- Presentes: catálogo, cotas, valores livres, status de recebimento, modos de pagamento, chave Pix, saldo de taxas.
- Convites: link curto, QR code, subdomínio, link de acesso individual ou por grupo.
- Mensagem da notificação dos 30 dias, por idioma.
- Controle de entrada: lista de quem já entrou, em tempo real.
- Jogo: ligar ou desligar, perguntas personalizadas, ranking.
- Personalização do site com pré-visualização ao vivo.

## 9. Notificações push (VAPID)

- Web Push padrão, com chaves VAPID geradas uma vez e guardadas como secrets.
- O service worker do PWA recebe o push e exibe a notificação.
- Inscrições (endpoint e chaves) salvas no D1, ligadas ao convidado e ao casamento.
- Um Cron Trigger diário procura casamentos a 30 dias e envia a mensagem personalizada pelos noivos.
- Em Workers, o pacote web-push do Node não é confiável. Implementar com Web Crypto: assinatura ES256 do VAPID e criptografia aes128gcm.
- Remover inscrições que retornarem 404 ou 410.
- iOS: o push só funciona com o PWA instalado na tela de início (iOS 16.4 ou superior). O fluxo deve convidar claramente a instalar o PWA. Para quem não instalar, o lembrete também sai com link de calendário.
- Pedir permissão de notificação em momento contextual, após confirmar presença. Nunca ao abrir o site.

## 10. Calendário

- Ao tocar na notificação ou após o RSVP, perguntar: Google, Outlook ou Apple.
- Google: link de template do Google Calendar com título, data, local e descrição.
- Outlook: deep link do Outlook Web.
- Apple e demais: arquivo .ics gerado pelo Worker.
- Guardar a escolha do convidado para não perguntar de novo.

## 11. Pagamentos e taxa por presente

Princípio: o registro do presente (ledger no D1) é independente do meio de pagamento. Cada modo é um provedor com a mesma interface: criar cobrança, confirmar, calcular taxa. Adicionar, trocar ou desligar um provedor não pode alterar o resto do app. Valores sempre em centavos inteiros e em BRL. Webhooks idempotentes, com tabela de eventos já processados.

A regra de taxa fica em tabela de configuração (percentual, mínimo e máximo por presente). Nunca fixar no código.

### Modo A: Pix via Stripe (automático)

- Stripe Connect com direct charges. O convidado paga pelo Checkout com Pix e o dinheiro cai na conta Stripe dos noivos.
- A taxa por presente é retida automaticamente como application fee.
- O webhook do Stripe confirma o pagamento e atualiza o D1. Nunca marcar como pago apenas pelo retorno do navegador.
- Opção configurável de repassar a taxa ao convidado, exibida de forma transparente, ou de os noivos absorverem.
- Fatos da documentação do Stripe que devem guiar a implementação:
  - Pix funciona com Connect em direct charges, destination charges e separate charges and transfers.
  - A conta conectada precisa estar no mesmo país da plataforma.
  - Plataforma sediada fora do Brasil não pode cobrar application fee de contas brasileiras. A conta Stripe da plataforma precisa ser brasileira. Perguntar ao dono do projeto sobre a conta antes de implementar.
  - Em direct charges, a própria conta conectada precisa ativar o Pix.
  - Conferir o tratamento de IOF para o caso brasileiro.

### Modo B: Pix direto na chave dos noivos

- Os noivos cadastram chave Pix (CPF, CNPJ, e-mail, telefone ou aleatória), nome do recebedor e cidade.
- O app gera o Pix copia e cola e o QR code (BR Code estático, padrão do Banco Central) no próprio navegador. O dinheiro nunca passa pela plataforma.
- O convidado paga no aplicativo do banco e toca em "Já enviei", informando nome, valor e mensagem opcional. O presente entra no ledger como "informado".
- Os noivos confirmam o recebimento no painel. O presente passa a "confirmado".
- Limitação assumida: a plataforma não enxerga o dinheiro, então não há webhook. A confirmação depende dos noivos.
- A taxa é calculada sobre os presentes confirmados e acumulada em um saldo de taxas do casal.
- A taxa é cobrada à parte, dos noivos, via Stripe (cartão salvo ou Checkout): cobrança automática quando o saldo atinge um limite e cobrança final antes do evento.
- Para ativar o Modo B, os noivos precisam ter um método de cobrança cadastrado.
- Sem quebrar o app: falha na cobrança da taxa nunca derruba o site dos convidados. O site segue no ar, e somente o painel exibe aviso e bloqueia novos recursos até regularizar.
- Segurança contra golpe de troca de chave: alterar a chave Pix exige reautenticação, envia aviso por e-mail e fica registrado em log.

### Regras comuns

- Mostrar aos noivos o extrato de presentes e taxas, por modo.
- Termos de uso explícitos: a plataforma não custodia o dinheiro dos presentes.
- Os noivos escolhem quais modos ativar. A página de presentes mostra apenas os ativos.

## 12. Controle de entrada

- Cada convidado recebe QR único com token assinado e não adivinhável.
- Leitor dentro do PWA usando a câmera, em tela própria para a equipe do evento.
- Funcionar offline: lista baixada antes do evento, check-ins gravados localmente (IndexedDB) e sincronizados quando houver conexão. O sinal em salões costuma ser ruim.
- Impedir entrada duplicada e avisar quando o QR já foi usado.
- Acesso do leitor protegido por código ou por conta de staff criada pelos noivos.

## 13. Jogo diário: Quiz dos Noivos

- 5 perguntas por dia, uma tentativa por dia por convidado, controlada no servidor (D1) com chave convidado e data no fuso do casamento.
- Perguntas: banco padrão curado (tradições de casamento, músicas românticas, cultura pop) mais perguntas personalizadas dos noivos, com foto opcional. O banco padrão garante conteúdo todos os dias até o evento.
- Pontuação: acerto mais bônus de velocidade, sequência de dias seguidos (streak) e selos.
- Ranking semanal e geral por casamento, com apelido do convidado e opção de ocultar pontos.
- Encerramento no dia do casamento, com revelação do campeão e prêmio simbólico definido pelos noivos.
- Validação no servidor: a resposta correta nunca vai ao cliente antes de o convidado responder, e o tempo é medido pelo Worker.
- Totalmente opcional: se desligado, nenhuma tela ou menu do jogo aparece.
- Evolução futura, opcional e separada: "Palpites do grande dia". Não implementar agora.

## 14. Apps de loja

- Empacotar o PWA com Capacitor. Deixar os projetos Android e iOS gerados e configurados, prontos para compilar.
- Push nativo entra apenas nessa fase. No PWA vale o VAPID.
- Risco a tratar na fase das lojas: a Apple pode rejeitar app que seja só um site empacotado, e há regras sobre pagamentos dentro do app.

## 15. Segurança e privacidade

- LGPD: consentimento explícito, política de privacidade e exclusão de dados após o evento.
- Dados de convidados visíveis somente aos noivos do respectivo casamento.
- Limite de requisições e Turnstile nos formulários públicos.
- Tokens de QR e links de acesso assinados, com expiração quando aplicável.

## 16. Fases

1. Núcleo: autenticação dos noivos, subdomínio, site personalizável, multi-idioma, RSVP, link curto e QR.
2. Lista de presentes com ledger, Modo B (Pix direto) e taxa; depois Modo A (Stripe).
3. PWA completo, push VAPID e calendário.
4. Controle de entrada com leitor de QR offline.
5. Quiz diário.
6. Empacotamento para as lojas.

## 17. Referências

Brasil
- Casar.com: lista de presentes em dinheiro com saque por Pix e itens editáveis. Levantamento deles indica que 74% dos casais preferem lista convertida em dinheiro. Referência principal de modelo de negócio e taxa.
- iCasei: site completo com lista, enquetes, contagem regressiva e mural de recados.
- Wedy: layout moderno, confirmação de presença por WhatsApp e formas de arrecadar dinheiro.
- Casamentos.com.br: site de casamento com lista de presentes e link externo.
- Padrões a seguir: lista de presentes para todos os bolsos, opção de lua de mel, resgate via Pix, confirmação pelo WhatsApp.

Internacional (design e produto)
- Joy (withjoy.com): plano gratuito mais completo, com RSVP detalhado (cardápio e acompanhantes) e vários eventos.
- Zola: integração profunda entre site e lista, com fundos em dinheiro.
- The Knot: suíte gratuita completa com RSVP e planejamento.
- Riley & Grey e Bliss & Bone: design autoral, referência de acabamento visual.
- Minted: identidade visual coesa entre papelaria e site.
- Squarespace: tipografia e galeria em tela cheia.
- Greenvelope: convite em envelope animado, referência de animação de abertura.

Jogos
- Betting on the Wedding: palpites sobre o casamento, entrada por link ou QR sem baixar app.
- MyWeddingTrivia e Trivia Anywhere: quiz sobre o casal com entrada por QR e ranking.
- gotrivia (github.com/RKelln/gotrivia): quiz de casamento de código aberto com ranking.
- Kahoot (kahoot.com/home/wedding-games): modelos de perguntas sobre o casal e tradições.
- Hallow (Daily Trivia): 5 perguntas por dia e ranking semanal de segunda a domingo.
- QuizWorld: quiz diário com streaks, XP, selos e ranking local.

Stripe
- docs.stripe.com/payments/pix
- stripe.com/docs/connect/direct-charges
- edge-docs.stripe.com/connect/saas/tasks/app-fees

## 18. Perguntar ao dono do projeto antes de implementar

- Domínio base dos subdomínios.
- Conta Stripe brasileira da plataforma: existe ou será aberta, e com qual tipo de cadastro. É requisito para cobrar a taxa pelo Modo A.
- Valor da taxa: percentual, mínimo e máximo por presente, e quem paga por padrão (noivos ou convidado).
- Modo B: confirmar a exigência de cartão cadastrado pelos noivos para cobrar a taxa acumulada.
- Idiomas finais: pt-BR, en e es.
- Referências próprias do dono do projeto, a enviar.