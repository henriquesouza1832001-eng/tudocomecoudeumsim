// Listas de presentes prontas. Valores iniciais e editáveis depois pelos noivos; o dinheiro vai direto para a chave Pix do casal.
const brl = (reais) => reais * 100

export const GIFT_PRESETS = [
  {
    id: 'lua-de-mel',
    category: 'Lua de mel',
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
    category: 'Casa',
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
    category: 'Casa',
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
    category: 'Experiências',
    name: 'Experiências',
    note: 'Momentos para viver juntos',
    items: [
      { title: 'Noite de cinema', description: 'Ingressos e pipoca para um programa a dois.', amountCents: brl(100) },
      { title: 'Curso para fazer juntos', description: 'Uma aula ou oficina para o casal.', amountCents: brl(200) },
      { title: 'Fim de semana fora', description: 'Uma escapada para descansar.', amountCents: brl(500) },
      { title: 'Sessão de fotos do casal', description: 'Para guardar a lembrança dessa fase.', amountCents: brl(350) },
    ],
  },
  {
    id: 'quarto-do-casal',
    category: 'Casa',
    name: 'Quarto do casal',
    note: 'Conforto para descansar juntos',
    items: [
      { title: 'Edredom e cobertor', description: 'Para as noites mais frias.', amountCents: brl(240) },
      { title: 'Travesseiros', description: 'Um par de travesseiros macios.', amountCents: brl(120) },
      { title: 'Abajur de cabeceira', description: 'Luz aconchegante para o quarto.', amountCents: brl(110) },
      { title: 'Cortina blackout', description: 'Para dormir até mais tarde.', amountCents: brl(190) },
    ],
  },
  {
    id: 'viagem-praia',
    category: 'Lua de mel',
    name: 'Lua de mel na praia',
    note: 'Sol, mar e descanso',
    items: [
      { title: 'Diária em pousada na praia', description: 'Uma noite de descanso à beira-mar.', amountCents: brl(450) },
      { title: 'Passeio de lancha', description: 'Um dia para conhecer as praias da região.', amountCents: brl(320) },
      { title: 'Jantar com os pés na areia', description: 'Um jantar romântico à beira-mar.', amountCents: brl(280) },
      { title: 'Aluguel de buggy', description: 'Para explorar as dunas e as praias.', amountCents: brl(260) },
      { title: 'Massagem para o casal', description: 'Um momento de relaxamento a dois.', amountCents: brl(300) },
    ],
  },
  {
    id: 'viagem-internacional',
    category: 'Lua de mel',
    name: 'Lua de mel internacional',
    note: 'Para viajar longe',
    items: [
      { title: 'Passagem aérea (parte do valor)', description: 'Uma ajuda com as passagens da viagem.', amountCents: brl(600) },
      { title: 'Passeio guiado pela cidade', description: 'Conhecer os pontos turísticos com um guia.', amountCents: brl(350) },
      { title: 'Jantar em restaurante típico', description: 'Para provar a culinária local.', amountCents: brl(300) },
      { title: 'Seguro viagem', description: 'Tranquilidade durante toda a viagem.', amountCents: brl(220) },
      { title: 'Passeio de trem panorâmico', description: 'Paisagens para guardar na memória.', amountCents: brl(400) },
    ],
  },
  {
    id: 'area-gourmet',
    category: 'Casa',
    name: 'Área gourmet',
    note: 'Para churrasco e reuniões',
    items: [
      { title: 'Kit churrasco', description: 'Espetos, facas e tábua para o churrasco.', amountCents: brl(180) },
      { title: 'Jogo de taças de vinho', description: 'Para brindar com os amigos.', amountCents: brl(150) },
      { title: 'Tábua de frios', description: 'Para receber com estilo.', amountCents: brl(90) },
      { title: 'Caixa térmica', description: 'Para bebidas sempre geladas.', amountCents: brl(160) },
    ],
  },
  {
    id: 'ate-200',
    category: 'Outros',
    name: 'Presentes até R$ 200',
    note: 'Para todos os bolsos',
    items: [
      { title: 'Cota simbólica', description: 'Uma contribuição para a nova fase.', amountCents: brl(50) },
      { title: 'Cafezinho da manhã', description: 'Para começar o dia bem.', amountCents: brl(40) },
      { title: 'Pizza de comemoração', description: 'Para a primeira noite na casa nova.', amountCents: brl(80) },
      { title: 'Buquê de flores', description: 'Para enfeitar a casa.', amountCents: brl(120) },
      { title: 'Vale-presente da casa', description: 'Para comprar o que estiver faltando.', amountCents: brl(200) },
    ],
  },
  {
    id: 'favoritos',
    category: 'Outros',
    name: 'Favoritos dos convidados',
    note: 'Os mais escolhidos',
    items: [
      { title: 'Cota da lua de mel', description: 'Uma ajuda para a viagem dos sonhos.', amountCents: brl(150) },
      { title: 'Cota para a casa nova', description: 'Para o que a casa precisar.', amountCents: brl(150) },
      { title: 'Jantar romântico', description: 'Uma noite especial a dois.', amountCents: brl(250) },
      { title: 'Kit de toalhas', description: 'Macias para o dia a dia.', amountCents: brl(180) },
      { title: 'Cafeteira', description: 'Para o café de todas as manhãs.', amountCents: brl(300) },
    ],
  },
]

export const PRESET_CATEGORIES = ['Todas', 'Casa', 'Lua de mel', 'Experiências', 'Outros']

export const presetTotalCents = (preset) => preset.items.reduce((sum, item) => sum + item.amountCents, 0)
