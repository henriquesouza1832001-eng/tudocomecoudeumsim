// Listas de presentes prontas. Valores iniciais e editáveis depois pelos noivos; o dinheiro vai direto para a chave Pix do casal.
const brl = (reais) => reais * 100

export const GIFT_PRESETS = [
  {
    id: 'lua-de-mel',
    name: 'Lua de mel',
    note: 'Experiências para a viagem a dois',
    items: [
      { title: 'Jantar romântico', description: 'Uma noite especial a dois durante a viagem.', amountCents: brl(250) },
      { title: 'Passeio de barco', description: 'Um passeio para guardar de lembrança.', amountCents: brl(300) },
      { title: 'Café da manhã na cama', description: 'Para começar o dia com calma.', amountCents: brl(120) },
      { title: 'Uma noite de hospedagem', description: 'Ajuda com a hospedagem da lua de mel.', amountCents: brl(400) },
      { title: 'Passeio e fotos da viagem', description: 'Para registrar os melhores momentos.', amountCents: brl(180) },
    ],
  },
  {
    id: 'casa-nova',
    name: 'Casa nova',
    note: 'Itens para começar a casa',
    items: [
      { title: 'Jogo de toalhas', description: 'Para o banheiro da casa nova.', amountCents: brl(180) },
      { title: 'Jogo de lençóis', description: 'Conforto para o quarto do casal.', amountCents: brl(220) },
      { title: 'Conjunto de panelas', description: 'Para as primeiras refeições em casa.', amountCents: brl(350) },
      { title: 'Aspirador de pó', description: 'Para manter a casa em ordem.', amountCents: brl(450) },
      { title: 'Cortinas da sala', description: 'Para deixar a sala aconchegante.', amountCents: brl(280) },
    ],
  },
  {
    id: 'cozinha',
    name: 'Cozinha',
    note: 'Para cozinhar e receber bem',
    items: [
      { title: 'Jogo de pratos', description: 'Para receber amigos e família.', amountCents: brl(260) },
      { title: 'Jogo de talheres', description: 'Para o dia a dia e para as visitas.', amountCents: brl(150) },
      { title: 'Cafeteira', description: 'Para o café de todas as manhãs.', amountCents: brl(300) },
      { title: 'Liquidificador', description: 'Praticidade no preparo das receitas.', amountCents: brl(200) },
      { title: 'Taças e copos', description: 'Para brindar nas ocasiões especiais.', amountCents: brl(140) },
    ],
  },
  {
    id: 'experiencias',
    name: 'Experiências',
    note: 'Momentos para viver juntos',
    items: [
      { title: 'Noite de cinema', description: 'Ingressos e pipoca para um programa a dois.', amountCents: brl(100) },
      { title: 'Curso para fazer juntos', description: 'Uma aula ou oficina para o casal.', amountCents: brl(200) },
      { title: 'Fim de semana fora', description: 'Uma escapada para descansar.', amountCents: brl(500) },
      { title: 'Sessão de fotos do casal', description: 'Para guardar a lembrança dessa fase.', amountCents: brl(350) },
    ],
  },
]

export const presetTotalCents = (preset) => preset.items.reduce((sum, item) => sum + item.amountCents, 0)
