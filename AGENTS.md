# Instruções do projeto: Plataforma de Sites de Casamento

Este arquivo é a fonte de verdade para o agente. Siga exatamente o que está escrito. Não contradiga nenhuma diretriz. Em caso de dúvida, lacuna ou conflito, pergunte ao dono do projeto antes de implementar. Nunca invente requisito.

## 1. Visão

Plataforma em que casais criam um site de casamento personalizável, com lista de presentes, confirmação de presença, notificações, controle de entrada por QR code e um jogo diário opcional. O uso é gratuito no piloto; presentes são pagos diretamente aos noivos por Pix ou comprados em lojas externas acessadas por links do casal. A plataforma não recebe nem processa esses valores.

Nome do produto: usar o nome já definido no Codex. Manter o nome em uma única constante de configuração, nunca espalhado pelo código.

## 2. Regras de trabalho (obrigatórias)

- O repositório serve apenas para versionar. O deploy é feito pela integração Git do Cloudflare. Não criar pipelines de deploy próprios.
- O dono do projeto autoriza commits diretos em `main` neste repositório. Antes de qualquer commit ou merge, atualizar as referências remotas e conferir o estado de `main`, `hen` e `lar`, as alterações locais e se já existe um merge em andamento.
- Antes de integrar branches, revisar os commits e arquivos que cada uma altera e verificar conflitos. Não presumir que uma branch está atualizada nem descartar alterações com resolução automática ampla (`ours` ou `theirs`).
- Se houver alterações pendentes de outra pessoa, merge em andamento, conflito ou arquivo/instrução que contradiga outra fonte do projeto, parar a ação afetada e perguntar ao dono do projeto como proceder antes de editar, sobrescrever, resolver ou enviar. Continuar apenas trabalho independente que não dependa dessa decisão.
- Depois de resolver uma integração, revisar o diff completo e executar build, lint e os testes existentes antes de atualizar `main` ou enviar a branch. Nunca usar force push para contornar divergências.
- `main` é a referência principal e `hen` e `lar` são branches de trabalho compartilhadas. Depois que uma branch receber um novo commit, avisar o dono nesta conversa e indicar às pessoas responsáveis pelas outras branches qual commit precisam buscar e integrar.
- Manter `main`, `hen` e `lar` apontando para o mesmo commit depois de cada integração concluída. Atualizar as demais por fast-forward quando possível; preservar e integrar todos os commits exclusivos antes de sincronizar. Não considerar uma entrega compartilhada enquanto alguma branch estiver atrasada.
- Se uma branch tiver commits ou alterações locais ainda não integrados, avisar o dono e a pessoa responsável por ela antes de sincronizar. Nunca apagar, sobrescrever ou reescrever esse trabalho para igualar as branches; resolver divergências sem perda e pedir orientação ao dono se houver conflito.
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
11. Presentes por Pix direto aos noivos ou links externos de loja. A plataforma apenas exibe o Pix ou encaminha o convidado à loja; não inicia compras, cobra, processa, guarda ou repassa dinheiro.
12. Modo de controle de entrada: parte do app dedicada a ler QR code no dia do evento, substituindo a lista física.
13. Jogo diário, uma partida por dia por convidado, com ranking entre convidados. Opcional: os noivos ligam ou desligam.
14. Idioma do piloto: somente português brasileiro (pt-BR). Suporte multilíngue é uma evolução futura que depende de autorização do dono.
15. Cada casal tem seu subdomínio.
16. Piloto gratuito. Não cobrar taxa por presente nem processar valores dentro da plataforma.
17. A lista pode conter Pix direto aos noivos e links de produtos em lojas externas. O link apenas encaminha para a loja; compra e entrega ocorrem fora da plataforma. O casal usa o site gratuitamente no piloto.
18. O produto pode ter potencial comercial futuro, mas não publicar taxas ou promessas comerciais até o dono aprovar um modelo.
19. O painel apresenta o planejamento de despesas com fornecedores, registro de valores e vencimentos e lembretes mensais por e-mail ou push como parte da experiência da plataforma.
20. Convites físicos e digitais usam a identidade do site. O casal pode preparar arquivos de impressão em formatos definidos e qualidade adequada, e adicionar o convite à carteira digital quando o recurso estiver implementado.

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

- No piloto, toda a interface e o conteúdo editável usam somente pt-BR. Não exibir seletor de idioma nem pedir traduções ao casal.
- Não detectar ou persistir idioma do visitante no piloto. Datas, horários e moeda são formatados com `Intl` usando pt-BR; valores de presente sempre em BRL.
- A estrutura multilíngue (react-i18next, en e es, campos traduzidos e fallback para pt-BR) só entra após nova autorização expressa do dono.
- A notificação dos 30 dias, quando implementada, usa pt-BR no piloto.

## 7. Site dos convidados e personalização

Objetivo: cada casal monta o site do seu jeito, com o nível de controle dos melhores construtores de sites de casamento, mas com pré-visualização real, verificação antes de publicar e proteções que impedem um site feio, ilegível ou quebrado. A personalização é profunda, porém sempre dentro de um sistema de design com limites (diretriz 10). Nunca oferecer CSS, HTML ou JavaScript livre, nem editor de posicionamento por pixel.

### 7.1 Princípios

- O casal começa escolhendo a foto que quer usar no convite; pode continuar sem foto e voltar depois. A prévia sem imagem usa um espaço neutro, nunca fotos de modelo. Exemplos de texto e tema devem ser identificados como demonstração.
- Tudo o que o casal altera aparece na pré-visualização ao vivo, em celular, tablet e desktop, antes de publicar.
- Todo controle é feito de tokens de design (cores, fontes, espaçamentos, raios, animações). Trocar um token nunca quebra o layout, o contraste nem a responsividade.
- Trocar de tema preserva todo o conteúdo, as fotos e as configurações de seções.
- Rascunho e versão publicada são separados. O site dos convidados só muda quando o casal publica.
- O site é mobile first: cada opção precisa funcionar bem em tela de celular antes de qualquer outra.

### 7.2 Assistente inicial

- O primeiro fluxo público começa pela foto e sua composição; o arquivo é enviado depois da criação do acesso, no painel. Em seguida vêm nomes, data, estilo, paleta e escala de texto. Local e horários são cadastrados em Eventos. O idioma do piloto é pt-BR.
- O casal pode pular etapas e voltar depois. A prévia sem foto usa um espaço neutro, sem fotografia de modelo.
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

- 8 pares de fontes pré-definidos (título e corpo), todos com suporte à acentuação do português brasileiro.
- Escala de tamanho do texto: pequena, média ou grande.
- Opções de estilo do título: peso, caixa alta nos rótulos e espaçamento entre letras, dentro de faixas seguras.
- Fontes servidas pelo próprio projeto, com subconjunto de caracteres e carregamento otimizado. Não permitir upload de fontes nem fontes arbitrárias.

### 7.6 Capa

- No piloto, oferecer somente as três composições já implementadas: foto em destaque, foto ao lado e foto em moldura. Tipografia sem foto, vídeo de abertura e colagem ficam fora do seletor até terem prévia, persistência e saída publicada validadas e uma nova aprovação visual.
- Controles: alinhamento do texto, intensidade da camada escura sobre a foto, ponto focal da imagem separado para celular e desktop, frase de apresentação, formato da data.
- Contagem regressiva com formato dias, completo ou oculta.
- Botões de ação da capa à escolha do casal entre: confirmar presença, presentear, ver local, jogar o quiz (se ativo).
- Vídeo da capa: curto, silencioso, comprimido e com foto de reserva para conexões lentas.

### 7.7 Seções

Biblioteca de seções. Cada uma pode ser ligada, desligada e reordenada (arrastar com toque, mouse e teclado), tem título editável em pt-BR e de 2 a 3 variações de layout:
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

- O menu é gerado automaticamente a partir das seções ativas, com rótulos editáveis em pt-BR.
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
- Texto alternativo por imagem em pt-BR, com lembrete quando faltar.
- Galeria com ordem por arrastar, álbuns (pré-casamento, viagens, família), legendas e visualização ampliada.
- Limites de quantidade por casamento definidos em configuração, não fixos no código.

### 7.12 Idiomas e conteúdo

- Durante o piloto, o idioma é pt-BR e cada conteúdo editável tem um único campo.
- Não exibir seletor de idioma, completude de tradução nem campos paralelos de conteúdo.
- Datas e horários usam pt-BR; valores de presentes permanecem em BRL.
- Uma futura expansão multilíngue precisa de autorização do dono e revisão desta seção antes de começar.

### 7.13 Compartilhamento e identidade

- Prévia ao compartilhar o link (imagem, título e descrição em pt-BR), pensada para o WhatsApp e redes sociais.
- Monograma gerado a partir das iniciais do casal, usando a fonte e as cores do tema. O monograma gera o favicon, o ícone do PWA e a tela de abertura do app instalado.
- Link curto e subdomínio exibidos no painel, com QR code estilizado nas cores do tema e arte pronta para imprimir (PNG e PDF) em formatos de cartão e de convite.
- Mensagem da notificação dos 30 dias em pt-BR, com variáveis como nome do convidado, dias restantes e data, pré-visualização e envio de teste para o próprio casal.
- Título e descrição do evento no calendário (.ics) em pt-BR.

### 7.14 Privacidade e acesso

- Três níveis, à escolha do casal: site aberto a quem tem o link, site protegido por senha simples, ou acesso apenas por link individual do convidado.
- Buscadores bloqueados por padrão (noindex). O casal pode liberar.
- Dados de convidados e respostas nunca aparecem em seções públicas.
- O mural de recados pode ser moderado antes de aparecer.

### 7.15 Editor, rascunho e publicação

- Autosave contínuo no rascunho, com desfazer e refazer.
- Pré-visualização ao vivo com alternância entre celular, tablet e desktop. O conteúdo usa pt-BR.
- Link privado de pré-visualização para o casal mostrar o rascunho a quem quiser antes de publicar.
- Verificador antes de publicar, com lista de pendências: contraste, texto obrigatório ausente, imagem sem texto alternativo, imagem muito pesada, seção ativa vazia, local sem endereço e chave Pix ausente quando o Modo B estiver ativo. Pendências de acessibilidade bloqueiam a publicação; as demais apenas avisam.
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
- Todo recurso de personalização do piloto é testado em pt-BR e nos 8 temas.

### 7.18 Modelo de dados

- A configuração do site é um documento JSON com versão e esquema validado, guardado no D1: tema, tokens escolhidos, seções (ordem, ativa, variação, conteúdo em pt-BR), eventos, grupos e acesso.
- Rascunho e publicado são registros separados. Publicar gera um instantâneo imutável servido a partir do cache (KV), o que dá velocidade e permite restaurar versões.
- O esquema é validado no servidor e no cliente. Valor fora das listas permitidas é rejeitado.
- Migração de esquema versionada para que sites antigos continuem abrindo.

### 7.19 Limites (o que não fazer)

- Sem CSS, HTML ou JavaScript livre. Sem upload de fontes. Sem editor de posicionamento por pixel. Sem número ilimitado de seções livres ou de eventos.
- Sem modificar nem remover o crédito do rodapé.
- Novos temas, fontes e layouts entram apenas por atualização do projeto, nunca pelo casal.

### 7.20 Entrega por fase

- Fase 1: assistente inicial, temas, cores, fontes, capa, biblioteca de seções (ligar, desligar, reordenar, variações), eventos, idioma pt-BR, imagens com ponto focal, pré-visualização ao vivo, rascunho e publicação, verificador básico, presets simples de animação.
- Fase 2: personalização dos presentes, chave Pix direta dos noivos e links HTTPS de lojas externas.
- Fase 3: mensagem dos 30 dias com variáveis, título do calendário, monograma e ícone do PWA, prévia de compartilhamento, QR estilizado e arte para impressão, envelope animado e confete.
- Fase 5: personalização do quiz (perguntas, prêmio e encerramento).
- Antes da fase 6: visibilidade por grupo refinada, histórico de versões, colaboradores e modo agradecimento, se não tiverem entrado antes por necessidade.
- Se algum item acima for necessário antes da fase indicada, perguntar ao dono do projeto.

### 7.21 Como superamos os sites atuais

- Referências de funcionalidade: Joy (vários eventos, RSVP detalhado), Zola e The Knot (site e lista integrados), iCasei (mural, enquetes, contagem regressiva), Casar.com (lista em dinheiro com Pix), Squarespace e Riley & Grey (tipografia, galeria e acabamento visual), Greenvelope (envelope animado).
- Diferenciais a entregar: pré-visualização real em três dispositivos, verificador de qualidade antes de publicar, paleta sugerida pela foto de capa, conteúdo e eventos por grupo de convidados, modo agradecimento, histórico de versões, QR e monograma estilizados com a identidade do casal e o mesmo sistema de design em site, PWA e notificação.

## 8. Painel dos noivos

- Convidados: cadastro manual, importação por planilha CSV, grupos e famílias, acompanhantes, restrições alimentares.
- Presença: status por convidado, relatório e exportação.
- Presentes: catálogo de itens com Pix direto ou link de loja externa. Não registrar recebimentos nem taxas.
- Convites: link curto, QR code, subdomínio, link de acesso individual ou por grupo.
- Mensagem da notificação dos 30 dias em pt-BR.
- Controle de entrada: lista de quem já entrou, em tempo real.
- Jogo: ligar ou desligar, perguntas personalizadas, ranking.
- Personalização do site com pré-visualização ao vivo.
- Planejamento: despesas, fornecedores, vencimentos e lembretes mensais por e-mail ou push.
- Convites: identidade visual compartilhada com o site, arquivos de impressão em formatos definidos e convites digitais para carteiras compatíveis.

### 8.1 Perfis e áreas de acesso

- Superadmin: administração global de contas, casamentos, status e auditoria. A área exige login com senha e segundo fator TOTP. A autorização é validada no servidor em toda operação; esconder uma rota no frontend não é controle de acesso.
- Noivos: administradores do próprio casamento, com acesso aos convidados, RSVP, presentes, convites e personalização daquele casamento.
- Convidados: acesso somente ao convite individual, eventos autorizados, RSVP, presentes e recursos habilitados pelos noivos.
- Padrinhos: não têm acesso à lista de convidados. A área individual pode mostrar apenas eventos, orientações e tarefas atribuídas ao próprio padrinho.
- Equipe do evento: acesso restrito aos eventos atribuídos. Pode consultar e exportar em PDF a lista necessária para o evento, sem acesso amplo a contatos ou dados de outros casamentos. O PDF do site público usa apenas conteúdo publicado.
- Equipe de entrada: permissão separada para check-in do evento, sem acesso às configurações financeiras ou de personalização.
- Todas as consultas e mutações de dados verificam conta, papel, casamento e evento no servidor. O cliente nunca escolhe livremente o identificador do casamento autorizado.
- Convidados e padrinhos usam token individual armazenado apenas como hash; o servidor limita eventos pelo grupo autorizado. Padrinhos só consultam e atualizam tarefas ligadas ao próprio convite.
- Equipe do evento e equipe de entrada só consultam eventos atribuídos por `membership_event_access`. A lista da equipe não inclui e-mail ou telefone; somente `checkin_staff` pode registrar entradas e acompanhantes de última hora.
- A exclusão administrativa remove ou anonimiza dados pessoais de convidados conforme política de retenção, preservando trilha de auditoria e, se existirem, registros históricos legados de presentes. O fluxo atual de Pix direto e links de loja não cria registros financeiros. Operações irreversíveis exigem reautenticação, confirmação explícita e registro de auditoria.
- Nenhuma tela do casal ou superadmin deve sugerir que a plataforma recebe ou repassa os presentes no piloto.

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

## 11. Presentes por Pix direto e links de loja

- A plataforma não recebe, processa, guarda ou repassa dinheiro dos presentes. Não criar checkout, split, comissão, ledger financeiro ou confirmação automática de pagamento para este fluxo.
- O casal pode cadastrar uma chave Pix e instruções curtas. O convidado usa o app bancário dele para pagar diretamente ao casal. A interface informa que a confirmação ocorre fora da plataforma.
- O casal pode cadastrar presente físico com nome, descrição, imagem opcional e URL de uma loja. O botão abre a página externa para o convidado concluir a compra e combinar a entrega. A plataforma não vende o item nem promete disponibilidade ou preço.
- Validar URLs como HTTPS e mostrar claramente quando o convidado sairá do site. Rejeitar esquemas de script, URLs locais e protocolos que não sejam HTTP(S).
- Não expor endereços residenciais ou dados privados de entrega em páginas públicas; orientar a combinação direta entre convidado e casal.
- Nenhuma taxa por presente está ativa no piloto. Qualquer futura monetização depende de nova decisão do dono e da atualização deste arquivo.
- A lista pública mostra somente formas habilitadas pelo casal e dados explicitamente marcados como públicos.
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
- A minuta acessível em `/documentos-legais/rascunho` não é política ou termo vigente. Não adicionar links de aceite nem apresentá-la como final até confirmar a identidade do responsável, contato de privacidade, prazos de retenção e subprocessadores.
- Dados de convidados visíveis somente aos noivos do respectivo casamento.
- Limite de requisições e Turnstile nos formulários públicos.
- Tokens de QR e links de acesso assinados, com expiração quando aplicável.
- Superadmin protegido pelo Cloudflare Access com política para o e-mail autorizado e MFA independente. O middleware Pages valida assinatura, emissor, audiência, validade e identidade do token nas rotas `/superadmin/*` e `/api/superadmin/*`.
- Configurar `ACCESS_TEAM_DOMAIN`, `ACCESS_APPLICATION_AUD` e `SUPERADMIN_EMAIL` como variáveis do Pages e `MFA_ENCRYPTION_KEY` como secret. A rota falha fechada se a configuração ou o token estiver ausente ou inválido.
- Cloudflare Access é uma barreira adicional. A API ainda valida a sessão do produto, papel superadmin e autorização no D1 em cada operação.
- Sessões do produto usam cookie seguro HttpOnly, hash do token no D1, validade limitada e senha PBKDF2. TOTP é obrigatório somente para superadmin; contas de noivos e equipe usam senha, limites de tentativa, escopo de papel e casamento e confirmação explícita nas ações destrutivas.
- Anonimização global exige MFA validado nos últimos cinco minutos, frase com o ID do casamento e gravação de auditoria. Preservar registros históricos legados de presentes, quando existirem, e trilha de auditoria; o fluxo atual de presentes não cria linhas financeiras.

## 16. Fases

1. Personalização: assistente inicial, tokens de tema e fonte aplicados à prévia e ao convite publicado, conteúdo e seções, mídia, responsividade, rascunho e publicação.
2. Convidados e convites: lista, grupos, eventos, RSVP, acesso individual por link curto e QR code.
3. Entrada: leitor de QR para a equipe, funcionamento offline, registro manual de última hora, buffet e exportação de entradas.
4. Despesas: fornecedores, orçamento, pagamentos, vencimentos e lembretes por e-mail ou push.
5. Convites físicos e digitais: formatos de impressão em alta resolução, QR estilizado e integração de carteira digital.
6. Presentes: lista pública com Pix direto aos noivos e/ou links externos de loja; sem checkout, ledger financeiro, split ou repasse pela plataforma. Esta etapa vem depois do controle de despesas.
7. PWA, notificações e calendários: instalação, lembrete personalizado e escolha de calendário em pt-BR.
8. Quiz diário.
9. Empacotamento para as lojas.

Executar em ordem crescente de dependência e esforço, concluindo e validando cada etapa antes de abrir a seguinte. Na interface do painel, deixar personalização como primeira entrada e presentes após planejamento financeiro. Manter exceção manual para convidados de última hora; o fluxo regular de entrada usa QR code.

## 17. Referências

- Direção visual aprovada para a identidade principal: jardim editorial, com fotografia de casamento em destaque, tons pastéis e detalhes florais leves. Priorizar leitura confortável, navegação clara e contraste antes de ornamentos.

Brasil
- Casar.com: lista de presentes em dinheiro com saque por Pix e itens editáveis. Levantamento deles indica que 74% dos casais preferem lista convertida em dinheiro. Referência principal de modelo de negócio e taxa.
- iCasei: site completo com lista, enquetes, contagem regressiva e mural de recados.
- Wedy: layout moderno, confirmação de presença por WhatsApp e formas de arrecadar dinheiro.
- Lista de presentes vinculada ao convite do casal, com Pix direto ou links externos de lojas.
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
- Não há provedor ou split no piloto. O Pix é transferido diretamente pelos convidados aos noivos.
- Não há taxa por presente no piloto. Um modelo comercial futuro exige nova decisão do dono.
- Idioma confirmado para o piloto: somente pt-BR. Idiomas adicionais dependem de nova decisão do dono.
- Referências próprias do dono do projeto, a enviar.
- Serviço de e-mail transacional para verificação de conta e recuperação de senha.

## 19. Estado para continuidade em outro Codex

Estas notas registram o estado conhecido em 15/10/2026. Atualize-as quando o trabalho for validado, enviado ou publicado. Elas nao substituem as diretrizes anteriores.

### Decisoes confirmadas pelo dono

- O dono retomou o desenvolvimento nesta conversa. Continue o trabalho a partir das fases definidas neste arquivo; nao trate a transferencia anterior como uma pausa vigente.
- A identidade visual aprovada para a landing e jardim editorial: fotografia de casamento em destaque, tons pasteis e detalhes florais discretos, com texto legivel e navegacao clara.
- O piloto é gratuito. A lista de presentes aceita Pix direto aos noivos e links externos de lojas; a plataforma apenas exibe o Pix ou encaminha para a loja, sem processar pagamentos.
- Não cobrar taxa no piloto. Qualquer modelo comercial futuro depende de decisão expressa do dono. A comunicação pública não deve sugerir que a plataforma processa pagamentos.
- O Pix é pago diretamente ao casal, fora da plataforma. Não mencionar split, repasse ou taxas da plataforma.
- O fluxo público de presentes pode oferecer Pix direto ao casal e redirecionamento para loja externa, sem compra dentro da plataforma.
- A prioridade e corrigir a porta de entrada e preparar o personalizador para a Fase 1 da secao 7.20. O personalizador deve ser curado e seguro, sem CSS, HTML ou JavaScript livre.
- O dono pediu para nao usar numeracao decorativa nos blocos de etapas da landing.
- Nao alterar decisoes aprovadas sem perguntar quando houver uma lacuna material. Nao pedir novamente uma decisao que ja consta neste arquivo.

### Estado confirmado na transferencia

- Repositorio: `https://github.com/henriquesouza1832001-eng/tudocomecoudeumsim.git`.
- Commit mais recente: `2d9b55b Clarify Pix gifts and wedding site editor`, enviado para `origin/main`. A arvore de trabalho estava limpa no ultimo check.
- Esse commit alterou `AGENTS.md`, `functions/api/[[route]].js`, `src/App.jsx`, `src/MarketingLanding.css`, `src/MarketingLanding.jsx` e `src/styles.css`.
- A landing explica a experiência do produto sem sugerir processamento de pagamentos; presentes usam Pix direto aos noivos ou redirecionamento para loja.
- O commit adiciona `storyMessages` a configuracao, campos de historia por idioma no personalizador, previa desse texto e exibicao no convite individual publicado. Limite atual: 3000 caracteres por idioma; fallback para pt-BR.
- O personalizador existente ja tinha escolhas curadas de tema, paleta, par de fontes, layout de capa, idioma, animacao, secoes reordenaveis, rascunho, publicacao e previa de dispositivo. Confira a implementacao antes de descrever o conjunto como completo; parte da previa pode ser apenas visual.
- `npm run lint` e `npm run build` passaram para o commit `2d9b55b`.
- O push para GitHub foi confirmado. A publicacao Cloudflare Pages nao foi confirmada. No ultimo acesso a `https://tudocomecoudeumsim.pages.dev`, o bundle remoto ainda continha a frase antiga "Estamos estruturando o pagamento". A verificacao posterior foi interrompida; confira novamente o estado atual antes de informar se publicou.

### Acoes para concluir o trabalho

- Confirmado em 15/10/2026: o Pages serviu os bundles da entrega `b8c5297` em `https://tudocomecoudeumsim.pages.dev`. Deploy pela integracao Git do Cloudflare; nao fazer deploy manual nem criar pipeline.
- Conferir a landing publicada: explicar que o Pix vai direto ao casal e os links externos levam às lojas para concluir a compra.
- O dono pediu para continuar o desenvolvimento seguindo este arquivo. A landing pode apresentar a visão completa do produto conforme a decisão da seção 20; não anunciar oficialmente o lançamento antes da autorização do dono nem ativar fluxos incompletos como se estivessem operacionais.
- Concluir e conferir o personalizador da Fase 1 dentro dos limites definidos na secao 7. Nao considerar layouts ou temas implementados so porque aparecem numa previa: comparar controles, persistencia e saida publicada.
- `npm run lint`, `npm run build` e `git diff --check` passaram para `b8c5297`; repetir depois de qualquer nova alteracao.
- A decisão sobre domínio próprio e qualquer modelo comercial futuro permanece pendente. Não implementar processamento de pagamentos.
- Segredos e credenciais nao devem ser copiados para este arquivo, para o repositorio ou para mensagens. Usar secrets e variaveis apropriados e confirmar valores sem revela-los.

## 20. Atualizacao de desenvolvimento em 15/10/2026

- Decisao posterior do dono: o piloto usa somente pt-BR. O editor e as previas nao oferecem seletor nem campos em ingles/espanhol. A API grava/publica `language: 'pt-BR'`; campos multilíngues preexistentes sao mantidos apenas para compatibilidade e nao sao exibidos.
- Cloudflare Pages nao oferece subdominios curinga em `*.pages.dev`. Enquanto o dominio proprio nao for comprado e configurado, manter o acesso atual por `tudocomecoudeumsim.pages.dev/casamento/:slug`. Nao inventar nem fixar um dominio base; implementar subdominios curinga depois que o dono fornecer o dominio.
- A entrega `b8c5297` adicionou campos multilíngues de título e texto por seção. A decisão posterior do dono restringiu a interface do piloto a pt-BR; os campos em outros idiomas podem permanecer nos dados antigos por compatibilidade, mas não são oferecidos no painel.
- A landing evolui para apresentar a plataforma de ponta a ponta, com fotografia de casamento, identidade pastel/floral, textos legíveis e seções dedicadas a RSVP, presentes por Pix direto ou links de loja, convites, check-in, despesas, PWA e calendário. Evitar numeração decorativa nos cards de etapas.
- A Fase 1 continua incompleta. O editor já permite enviar fotos ao R2, definir ponto focal por dispositivo, verificar contraste de cores e descrições acessíveis antes de publicar, além de aplicar três variantes curadas por seção: clássico, moldura suave e compacto. Ainda faltam um assistente inicial que cubra os requisitos da seção 7.2 e a conclusão da biblioteca de seções e do site público. O idioma do piloto foi confirmado como pt-BR. Não apresentar o personalizador como completo até verificar os itens da seção 7.20.
- A edição de títulos em pt-BR agora alcança 16 seções renderizadas, com rascunho, prévia, navegação e convite publicado conectados. Hospedagem e dicas, perguntas frequentes e contato usam texto; playlist e vídeo aceitam links HTTPS, e vídeo também pode usar arquivo enviado. Padrinhos e madrinhas têm perfis públicos escolhidos pelo casal, com foto, nome e mensagem. A paleta pode sugerir cores extraídas localmente da foto de capa, preservando o ajuste de contraste. O mural permite envio público protegido por Turnstile e moderação do casal antes de publicar. O quiz ainda precisa de seu fluxo próprio, então a biblioteca da Fase 1 permanece incompleta.
- A diretriz mais recente do dono determina que a comunicacao da landing descreva a experiencia completa do produto sem rotulos ou ressalvas de desenvolvimento, pois o lancamento publico ainda sera anunciado por ele. Essa decisao substitui as notas anteriores que pediam omitir recursos futuros.
- Links externos de lojas são permitidos somente como redirecionamento para compra fora da plataforma. Não processar pagamento nem cobrar taxa no piloto.
- A tela de cadastro recebeu ajuste de escala tipografica e marca; confirmar no Pages que o monograma nao empilha letras em telas estreitas.
- Em 15/10/2026, o dono reorganizou a entrega por esforço e dependencias: personalizador primeiro; convidados/convites e QR; controle de entrada por QR com excecao manual; despesas antes de presentes; presentes por Pix direto ou links externos; impressao/carteira digital depois da base de convites.
- O painel dos noivos agora abre em “Personalizar site” e ordena as abas pelo fluxo, deixando Presentes no fim. Os oito pares tipograficos curados agora fornecem tokens de fonte para a previa do editor e o convite individual publicado, com familias locais do sistema e fallbacks.
- Em 15/10/2026, o commit `4577b15` publicou a landing completa com blocos de RSVP, presentes Pix, convites digitais/impressos/carteira, check-in com entrada manual e relatorios, despesas e lembretes, PWA e calendario. O rodape tem links internos validos e contatos. O menu mobile permite rolagem horizontal sem estourar a viewport.
- O mesmo commit atualizou title, description, Open Graph e `public/llms.txt` para refletir a plataforma. Confirmados HTTP 200 na pagina inicial, `/cadastro` e `/llms.txt`; os novos assets e estilos de cadastro estavam presentes no Pages.
- `npm run lint`, `npm run build` e `git diff --check` passaram antes do push. Commits `6b2b897` e `4577b15` enviados a `origin/main`; Cloudflare Pages confirmou os arquivos publicados.
- Em 15/10/2026, o commit `70640f5` iniciou essa ordem: o painel abre em Personalizar site, coloca presentes após as áreas operacionais e aplica o par tipográfico escolhido à prévia e ao convite publicado. `npm run lint`, `npm run build` e `git diff --check` passaram; os arquivos de aplicação e estilos foram verificados no Cloudflare Pages.
- Em 15/10/2026, `/criar-site` abre a personalização pública sem login e salva rascunho local. `/cadastro` cria a conta e grava o conteúdo validado no D1. Não escolher domínio base nem alterar o endereço dos convites nesta etapa.

## Diretriz de comunicação visual e textual

- Para a página inicial, aplicar como referências de revisão os repositórios `miqdadbadjuber/anti-slop`, `petergyang/no-ai-slop` e `conorbronsdon/avoid-ai-writing`.
- Usar português direto, específico e natural. Evitar frases promocionais genéricas, títulos artificiais em caixa alta, ícones decorativos repetidos e setas em todos os links.
- Não inventar valores, resultados, nomes, depoimentos, números de uso ou estados de interface para ilustrar recursos. Identificar exemplos visuais como exemplos e usar informações configuradas pelo casal.
- Preservar a direção aprovada de jardim editorial: fotos de casamento identificadas, tons pastéis, detalhes florais leves, leitura confortável e navegação clara.

- Em 15/10/2026, `/criar-site` foi ampliado para permitir a escolha de tema, paleta, par tipográfico, escala de leitura e composição da capa antes do cadastro. A prévia acompanha as escolhas em computador, tablet e celular.
- O catálogo mantém oito temas curados. `Rock & romance` e `Festa no jardim` atendem casais que querem uma estética mais marcante sem liberar CSS ou cores sem limite. O seletor de capa ativo oferece `full`, `split` e `arch`.
- O painel autenticado envia fotos e um vídeo de abertura ao R2; o navegador converte fotos para WebP antes do envio. `/criar-site` não envia mídia antes da criação de acesso e orienta o casal a escolher a foto no painel.

## Continuidade de trabalho — personalizador e convite compacto

Registro histórico atualizado em 17/10/2026. Esta seção preserva o pedido e o estado da branch `hen` daquele momento; consulte o estado Git atual antes de continuar.

### Pedido confirmado

- O personalizador deve começar com uma tela visual coerente com a identidade do painel e do convite: jardim editorial, tons pastéis, leitura confortável e poucas escolhas por vez.
- Conferir cada opção de personalização. Toda opção apresentada precisa alterar de forma perceptível a prévia e, quando aplicável, o convite publicado. Remover controles sem efeito ou deixar claro onde se aplicam.
- Corrigir as paletas: no estado anterior, várias opções pareciam iguais. A cor selecionada deve aparecer na prévia e no site real, preservando contraste e legibilidade.
- Simplificar o convite do convidado. Deve apresentar o casal, data e local/evento, uma mensagem curta, fotos escolhidas e ações claras. Evitar um convite longo com blocos de texto redundantes; história, cardápio e traje são informações opcionais e resumidas.
- Reduzir campos no personalizador e evitar despejar muitas configurações em uma tela. Separar o essencial de informações opcionais, com linguagem direta.
- Não pedir ao casal para escrever o mesmo texto em três idiomas. A interface mantém o idioma normal do produto; não replicar campos de conteúdo por idioma neste fluxo simplificado sem uma decisão nova do dono.
- Carrossel ou galeria de fotos deve ser opcional e compacto. Não exigir detalhes íntimos ou perguntas sobre o casal para concluir um convite.

### Histórico da branch de prévia

- Naquele período, a antiga branch `preview` havia sido renomeada para `hen` e `lar` partia do mesmo commit. Atualmente, `main`, `hen` e `lar` devem ser conferidas e sincronizadas conforme as regras da seção 2.
- O dono autorizou integrar em `main` as alterações da personalização depois de validar testes, lint e build. Antes de iniciar a integração, verificar se existe merge, rebase ou cherry-pick em andamento e confirmar que a árvore está limpa após o commit.
- Há alterações de trabalho em `src/App.jsx` e `src/styles.css` que simplificam o editor autenticado do painel para duas áreas, aparência e recado/detalhes. O editor reduz a escolha inicial de temas, permite expandir os demais e mostra na prévia a paleta, foto, composição, mensagem, história curta e informações do evento.
- A lista de paletas foi alterada para produzir cores visivelmente distintas; o tema noturno deixou de impor um fundo que anulava a paleta escolhida.
- O convite publicado recebeu ajustes para usar a composição selecionada e manter detalhes opcionais recolhidos. Eventos e RSVP foram compactados em linhas expansíveis; o convite deve continuar sendo conferido visualmente em celular e desktop.
- Esses ajustes foram posteriormente conferidos e integrados à versão de produção. Não declarar novos controles concluídos apenas porque aparecem na prévia.
- O fluxo público `/criar-site` é separado do editor autenticado e ainda precisa ser revisado para receber a mesma simplificação: poucas etapas, conteúdo em um idioma de entrada, opções com efeito real e prévia compacta. Não deixar que o fluxo aberto e o painel ofereçam modelos incompatíveis.
- Conferir o ciclo completo: criar/alterar rascunho, recarregar, salvar, publicar e abrir o convite do convidado. Verificar especialmente tema, paleta, foto, composição, mensagem, história curta e detalhes do evento.
- Verificar responsividade, contraste, controles de toque e ausência de rolagem horizontal. Não ampliar novamente o convite ou o personalizador sem necessidade demonstrável.

### Validação registrada nesta continuação

- `npm run lint`, `npm run build` e `git diff --check` passaram para as alterações em andamento de `src/App.jsx` e `src/styles.css`.
- `npm test` teve 10 de 11 testes aprovados. O teste `event staff can read only assigned event rosters without contact fields` falhou em `tests/wedding-role-access.test.js:101`, ao acessar `name` na linha 107. O fluxo testado não foi alterado nesta continuação; investigar a falha antes de atribuí-la às mudanças de interface.
- A versão revisada do convite compacto foi integrada e publicada pelo fluxo Git do Cloudflare; mudanças posteriores devem repetir validação e integração.

## Personalizador público simplificado — 17/10/2026

- Esta etapa começou na antiga branch `preview`, que depois foi renomeada para `hen`; `lar` foi criada no mesmo commit. A personalização simplificada foi integrada à versão de produção no commit `82a8505`.
- `/criar-site` agora tem duas etapas curtas: foto e composição primeiro, depois nomes, data, tema, paleta e escala. O arquivo de foto é escolhido no painel após a criação de acesso. O idioma de texto começa em pt-BR e não há campos repetidos por idioma nem seletor de idioma apenas para a prévia.
- A prévia mostra um convite compacto com a foto, composição, nomes, data, recado e os detalhes opcionais que foram preenchidos. Foram removidos os blocos longos de conteúdo fictício e os controles de personalização que não eram necessários para começar.
- As três composições oferecidas (`full`, `split`, `arch`) existem no convite publicado e são aceitas pela validação da API. Rascunhos locais antigos com layouts `type`, `video` ou `collage` são normalizados para o layout correspondente ao tema escolhido.
- Alterar a história curta ativa a seção de história no rascunho, para o conteúdo da prévia também poder aparecer no convite após cadastro/publicação.
- O editor autenticado continua com duas áreas. Foi removido um bloco duplicado de cardápio e traje encontrado durante a revisão.
- A API lê configurações antigas com seis layouts para compatibilidade, mas normaliza `type`, `video` e `collage` para `full` ao servir o convite. Novas gravações e publicações aceitam somente `full`, `split` e `arch`. Não reintroduzir controles antigos sem validar a saída real.
- `npm run lint`, `npm run build` e `git diff --check` passaram após essas alterações. A versão foi promovida à produção depois da validação registrada na seção seguinte.

## Publicação após validação — 17/10/2026

- O dono autorizou levar alterações concluídas para produção depois de validar. Para esta entrega, rodar `npm test`, `npm run lint` e `npm run build`; se passarem, integrar a branch de trabalho em `main` e enviar pelo Git para o deploy automático do Cloudflare Pages. Não fazer deploy manual nem criar pipeline.
- O teste da equipe do evento falhava porque o mock da base não respondia à consulta reduzida da rota de `event_staff`. A fixture em `tests/wedding-role-access.test.js` agora responde a essa consulta com apenas `id` e `name`; a implementação de autorização não foi alterada.
- Validação desta promoção: `npm test` passou com 11/11 testes; `npm run lint` e `npm run build` também passaram. O commit `6335794` foi integrado e enviado a `main`; depois do push, `https://tudocomecoudeumsim.pages.dev` respondeu HTTP 200 e serviu o novo bundle de produção.

## Tamanho de texto no personalizador — 17/10/2026

- O campo `fontScale` já era aceito e persistido pela API, mas não tinha controle visível no personalizador e a prévia do painel forçava tamanho padrão.
- `FontScalePicker` oferece Compacto, Padrão e Ampliado tanto em `/criar-site` quanto no editor autenticado, dentro da etapa Aparência. As escolhas atualizam as prévias na hora e são guardadas no mesmo rascunho.
- A escala também é aplicada ao convite individual publicado, incluindo capa, recado e detalhes. Valores permitidos continuam sendo `small`, `medium` e `large`, validados pela API.
- Validação: `npm test` passou com 11/11 testes, `npm run lint`, `npm run build` e `git diff --check` passaram. O commit `5f1c6eb` foi enviado por `hen` e integrado por fast-forward a `main`. A página de produção respondeu HTTP 200 e serviu o bundle com o seletor de tamanho e as regras CSS correspondentes.

## 21. Decisão de produto confirmada em 17/10/2026

- O objetivo imediato é concluir uma plataforma utilizável no chá de panela dos amigos e no casamento no ano seguinte, gratuita no piloto e adequada como case de portfólio com potencial comercial futuro.
- Presentes: Pix diretamente aos noivos ou redirecionamento para loja externa. A plataforma não realiza a compra, não recebe ou repassa valores e não cobra taxa no piloto.
- Priorizar a experiência real do casal e dos convidados, especialmente site público, mobile, compartilhamento por link/QR, informações do evento, RSVP e presentes configurados pelo casal.
- Não confundir mockups, dados de demonstração ou controles visuais com recursos persistidos e funcionais.
- Exceção de ordem aprovada pelo dono para o piloto: concluir Presentes por Pix direto e links externos antes da Fase 4 (Despesas), para uso imediato no chá de panela. A plataforma não recebe nem registra pagamentos. Esta exceção não muda a sequência das demais fases.
- Em 17/10, o D1 tinha as migrations até `0015` aplicadas; não renomear nem reaplicar as duas migrations `0014`, pois alteram tabelas/colunas distintas e o histórico registra o nome exato.
- Auditoria remota de 18/10/2026: o D1 `tudocomecoudeumsim-db` tem aplicadas todas as migrations de `0001` a `0018`, incluindo as duas `0014`; Wrangler informou que não há migrations pendentes. A próxima migration deve usar o prefixo `0019`. Esta conferência só consulta o histórico; não aplicou SQL.

## Presentes utilizáveis no piloto — 17/10/2026

- O painel do casal cadastra contribuições com valor Pix sugerido ou livre e presentes físicos com URL HTTPS de loja. Para presentes de loja não se pede nem se exibe preço, que pode mudar; compra e entrega são concluídas fora da plataforma.
- Ativar o Pix no painel também ativa a seção de presentes no rascunho. A chave só aparece aos convidados depois de publicada e fica visível para quem acessa a lista. O convite permite copiar a chave, mostra como usar um valor sugerido e lembra conferir o titular no app do banco.
- A lista pública oculta contribuições Pix quando a chave não está publicada; cada contribuição visível aponta para o Pix direto. Itens físicos abrem o endereço HTTPS em outra aba e informam que compra e entrega são combinadas com a loja.
- A landing, os estudos visuais de presentes e o painel de demonstração foram atualizados para não prometer split, recebimentos ou taxas e explicar o modelo gratuito do piloto.
- Nenhuma migration ou dado remoto foi alterado nesta etapa. A migration `0015_gift_fulfillment_options.sql` já está aplicada no D1 e dá suporte ao tipo e URL de loja.
- Validação: `npm run lint`, `npm test` (29/29), `npm run build` e `git diff --check` passaram.
- O primeiro check do Pages para `9e3af68` publicou apenas o preview de `hen`. Depois da atualização única em `main` no commit `f88b718`, `https://tudocomecoudeumsim.pages.dev` respondeu HTTP 200 e passou a servir os assets gerados pelo build validado (`index-DBbvOpQJ.js`, `App-f-ODa_og.js` e `MarketingLanding-4Q1wuAh-.js`). A publicação foi feita pela integração Git do Cloudflare.

## Auditoria de contradições — 18/10/2026

- O painel permite reordenar com botões acessíveis as seções de contagem regressiva, história, linha do tempo, eventos, fotos, presentes/Pix e RSVP. Essa ordem é salva no rascunho, refletida na prévia e usada pelo convite publicado e sua navegação. O carrossel ativo aparece junto à seção de fotos.
- A reordenação cobre contagem regressiva, história, linha do tempo, eventos, fotos, presentes/Pix e RSVP. Presentes/Pix e RSVP acompanham a ordem escolhida no convite e na prévia. A biblioteca completa da seção 7.7 ainda não está implementada; várias seções listadas ainda não têm editor nem renderização pública. Não declarar a biblioteca ou o requisito de reordenação de todas as seções concluídos.
- A paleta oferece seis combinações curadas por tema e um seletor opcional de cor de destaque. A API valida e persiste a cor; prévia e convite usam a cor corrigida para obter contraste mínimo de 4,5:1 contra o papel. O teste cobre as paletas dos oito temas e a correção da cor personalizada. Ainda falta o verificador antes de publicar para todas as pendências de contraste e acessibilidade da seção 7.15.
- O enquadramento da capa agora tem controles separados para computador e celular, com prévia responsiva e persistência no JSON existente. Convites antigos que só têm `coverImagePosition` continuam funcionando e usam essa posição nos dois dispositivos até o casal personalizar cada uma.
- A biblioteca de fotos permite registrar texto alternativo em português para cada imagem. O texto é limitado a 250 caracteres, validado pela API e salvo junto ao rascunho; capa, galeria, linha do tempo, carrossel e fotos de presentes o usam na prévia e no convite. Quando está vazio, o painel avisa e o site usa uma descrição padrão.
- Variantes por seção agora têm três opções curadas no editor, são salvas no rascunho e snapshot publicado e rejeitam valores fora da lista permitida. Ainda falta o assistente inicial completo e concluir a biblioteca de seções antes de considerar o personalizador finalizado.
- Validação local da reordenação: `npm run lint`, `npm run build`, `npm test` (77 testes) e `git diff --check` passaram. Os branches remotos `main`, `hen` e `lar` foram sincronizados no commit `a8a8a27`.
- O seletor personalizado de cor de destaque está presente no fluxo público e no painel. A configuração usa a coluna JSON já existente, sem migration; testes verificam validação/gravação da configuração e leitura no convite público. Após essa alteração, `npm run lint`, `npm run build`, `npm test` (79 testes) e `git diff --check` passaram.
- O enquadramento independente da capa para computador e celular foi adicionado ao editor, à prévia e à configuração pública. A API valida ambos e converte configurações antigas sem perda; a mudança não exige migration D1. Validação local: `npm run lint`, `npm run build`, `npm test` (80 testes) e `git diff --check` passaram.
- Texto alternativo editável por imagem foi adicionado ao painel e é renderizado nos usos públicos das fotos. A API valida o formato e o limite de 250 caracteres e remove descrições ligadas a fotos excluídas. A lista fica no JSON de configuração já existente, sem migration D1. Validação local: `npm run lint`, `npm run build`, `npm test` (80 testes) e `git diff --check` passaram.
- A ordem salva agora também inclui presentes/Pix e RSVP; Pix acompanha a seção de presentes. Os recursos continuam com ativação independente. A biblioteca completa de seções permanece incompleta. Validação local naquela entrega: `npm run lint`, `npm run build`, `npm test` (81 testes) e `git diff --check` passaram.
- Em 18/10/2026, a aparência das seções recebeu três variantes curadas por seção, gravadas no JSON do rascunho existente e aplicadas à prévia e ao convite publicado. A API rejeita chaves de seção e variantes fora das listas permitidas; não exige migration. `npm run lint`, `npm run build`, `npm test` (121 testes) e `git diff --check` passaram. `main`, `hen` e `lar` estão no commit `0aa8805`.
- Em 18/10/2026, o rascunho iniciado em `/criar-site` segue ao cadastro e é validado pelo Worker antes de ser gravado junto ao casamento pendente no D1. A rota do assistente foi reconectada; nomes, data, tema, paleta, escala, composição e textos sobrevivem à confirmação de e-mail. Fotos continuam sendo enviadas pelo painel autenticado, sem aceitar IDs ou arquivos do navegador no cadastro. O cadastro permanece em português, conforme decisão do dono.
- Em 18/10/2026, o personalizador autenticado salva automaticamente perfil e configuração no D1, oferece desfazer/refazer com histórico limitado às 50 alterações recentes e remonta quando muda o casamento selecionado. O salvamento de perfil aceita rascunhos incompletos e só muda o slug quando os dois nomes estão preenchidos; a publicação continua bloqueada até completar o perfil. Não exige migration. Validação final desta rodada: `npm run lint`, `npm run build`, `npm test` (102 testes) e `git diff --check` passaram.
