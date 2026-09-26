# Véspera — O Último Sino

## Um experimento com GPT-6 Astra

**Véspera é um experimento puro de desenvolvimento com GPT-6 Astra, criado para experimentação.** O objetivo foi explorar, por meio de instruções e iterações, até onde a IA conseguiria levar um protótipo de metroidvania 2D inspirado na atmosfera de Blasphemous e Dark Souls. Não se trata de um jogo finalizado ou de um produto pronto para lançamento. Os assets de terceiros utilizados estão identificados em [ASSETS-E-CREDITOS.md](ASSETS-E-CREDITOS.md).

**O resultado não foi 100%.** O protótipo reúne várias funcionalidades, mas ainda apresenta muitos bugs e problemas de movimentação, animações e, principalmente, cenário. O level design, o ritmo, o balanceamento e a experiência como um todo também precisam de revisão e trabalho significativo. Ter sistemas implementados e testes automatizados passando não significa ter um jogo consistente, bem acabado ou validado por jogadores.

## IA como ferramenta, não como muleta

A análise deste experimento volta sempre ao mesmo ponto: com conhecimento, discernimento, revisão, organização e profissionalismo, a IA pode ser uma excelente ferramenta de desenvolvimento. Como profissionais, devemos aprender a utilizá-la para experimentar, acelerar tarefas e explorar soluções — mantendo a responsabilidade sobre aquilo que entregamos.

Mas ela não pode ser uma muleta. Gerar código não substitui compreender o problema, definir uma direção, avaliar a qualidade, testar a experiência e corrigir o que não funciona. Saber pedir ajuda à IA é útil; saber analisar e questionar o resultado é indispensável. Sem esse olhar, é fácil acumular funcionalidades enquanto os problemas fundamentais continuam presentes.

Este repositório registra tanto as possibilidades quanto as limitações dessa experimentação. Seu valor está no aprendizado e na análise crítica do processo, e não em apresentar a geração automática como substituta do conhecimento e do trabalho profissional.

## Jogar o protótipo

Abra **index.html** no navegador e clique em **Iniciar**. Arte, trilha e efeitos funcionam offline. O jogo salva o progresso neste navegador e oferece **Continuar peregrinação** ao reabrir. Os dados são locais: não são compartilhados entre navegadores, computadores ou endereços diferentes.

## Funcionalidades implementadas — ainda sujeitas a bugs

- Duas áreas reconstruídas, com seis distritos cada: 21.600 e 22.800 unidades de extensão, 117 plataformas e oito desafios de progressão.
- 89 inimigos distribuídos nas áreas e mais 28 nas quatro vigílias obrigatórias, divididas em três grupos cada. Há cães, bestas conjuradoras, carrascos, fantasmas e caveiras voadoras.
- Vilarejo noturno, jardim, campanário, aqueduto, claustro, galerias e ossário, com rotas elevadas e relicários opcionais.
- NPCs para orientação e comércio; diário com objetivo atual, mapa de selos/vigílias e viagem entre altares já acesos.
- Almas visíveis deixadas pelos inimigos. Elas são atraídas pelo personagem ao se aproximar e, após alguns segundos, à distância para evitar perdas em abismos.
- Golpes sincronizados com os quadros da lâmina, ataque aéreo próprio, orientação corrigida do cão, salto de ataque e pivôs ajustados para reduzir o deslocamento artificial entre animações.
- O antigo cavaleiro foi substituído pela Hell Beast da coleção Gothicvania. Sua pose de conjuração corresponde ao sopro/tiro; a morte usa a sequência de combustão do pacote.

**Ritmo pretendido:** pelo menos cerca de 10 minutos por área na primeira exploração, considerando combates, conversas, puzzles e segredos. Esse tempo é uma meta de design, ainda não confirmado por uma sessão humana completa cronometrada; jogadores que conhecem as soluções podem terminar mais rápido. Não há espera artificial para impedir a conclusão.

## Controles

| Ação | Teclado | DualShock 4 / Xbox |
| --- | --- | --- |
| Mover | A / D ou setas | Analógico esquerdo / direcional |
| Pular / salto duplo após obter Eco | Espaço | ✕ / A |
| Atacar | J | □ / X |
| Defender / parry | K | L1 / LB |
| Talho Consagrado | L | △ / Y |
| Interagir / conversar | E | ○ / B |
| Diário / mapa / altares | M | Share / View |
| Pausa | Esc | Options / Menu |

Nos diálogos, use Tab e Enter no teclado ou direcional e ✕ / A no controle. Esc ou ○ / B fecha o diálogo/diário. Um controle reconhecido com mapeamento padrão pode ser conectado por USB ou Bluetooth; pressione um botão para detectá-lo. A conexão física de um DualShock deve ser confirmada no computador do jogador. Há botões de toque nos dispositivos compatíveis.

## Combate e melhorias

- **Espada:** 25 de dano básico, com preparação, contato e recuperação. Cada inimigo recebe no máximo um acerto por animação. No ar, o contato acompanha o corte aéreo.
- **Talho Consagrado:** corte baixo no chão, alcance curto, 32 de dano, custo de 35 de fervor e recarga de 1,6 segundo. Não dispara uma onda através da sala.
- **Parry:** os primeiros 0,18 segundo de uma nova defesa podem aparar um golpe frontal. Intervalo de 0,6 segundo entre tentativas; segurar defesa não repete o parry. Recupera vigor/fervor, atordoa o atacante e fortalece em 50% o próximo golpe iniciado em até 2 segundos. Projéteis são devolvidos.
- **Defesa comum:** consome 20 de vigor. Ataques pelas costas e ataques vermelhos não aceitam parry. Os ataques vermelhos exigem salto ou reposicionamento.
- **Baltasar:** cinco têmperas de espada, +4 de dano por nível. Custos: 30, 55, 85, 120 e 160 almas.
- **Iria:** quatro reforços de armadura, redução de 8% por nível, até 32%. Custos: 25, 50, 80 e 115 almas.

Almas, melhorias, itens, selos e vigílias concluídas permanecem após a morte. Inimigos comuns já derrotados permanecem mortos. Vigílias interrompidas reiniciam seus grupos; as almas já recolhidas são preservadas. Altares restauram recursos e fixam o ponto de retorno. O salvamento automático também ocorre ao comprar, coletar e avançar.

## Progressão — contém soluções

**Mosteiro:** tocar os sinos II → I → III; alcançar os três votos nas capelas superiores; empurrar o relicário até a placa; derrotar os três carrascos e romper seus selos. Complete também as duas vigílias indicadas no diário para atravessar a porta final.

**Cripta:** alinhar os espelhos LUA → SOL → ESTRELA; alcançar o Eco pela escadaria; usar o salto duplo para recolher dois fragmentos; ativar a alavanca e tocar o selo do relógio em 18 segundos; acender as chamas III → II → I. As duas vigílias também são necessárias para chegar ao Santuário. Se o relógio fechar após sua travessia, o jogo devolve o personagem à alavanca, evitando aprisionamento.

## O Guardião

700 de vida, cerca de 13% acima da versão anterior. A segunda fase começa com 50% de vida e uma transformação protegida. Há oito padrões ao longo da luta: golpe próximo, ondas de cinza, pilares marcados, investida, salvas de projéteis, sopro profano, maré de brasas e profanação das plataformas. Os dois últimos são exclusivos da segunda fase.

Suba para evitar a maré de brasas; abandone as plataformas marcadas durante a profanação. Os dois sinos elevados interrompem ataques, dissipam perigos e atordoam o chefe, com 24 segundos de recarga por sino. Não há altar de cura ilimitada na arena. A música acelera de 132 para 172 BPM na segunda fase.

## Interface e áudio

A imagem ocupa a janela preservando a proporção. Tela cheia do monitor, música, efeitos, volumes e controles ficam em **Configurações**, acessível pelo menu de pausa. A música e os efeitos são sintetizados localmente. Inicie com um clique para liberar áudio quando o navegador exigir interação.

## Desenvolvimento e verificações

O código editável fica em **src/**. O arquivo **index.html** é gerado com os sprites incorporados a partir do manifesto, sem dependências externas.

Gerar: **node scripts/build.cjs**

Testar: **node tests/game.test.cjs**

Os testes verificam contato da espada, habilidade, defesa/parry/reflexão, direção do cão, moeda e compras, armadura, todos os puzzles, vigílias, colisão de portões, salvamento, morte, saltos até a relíquia, recuperação do relógio, fases/ataques do chefe, recortes dos sprites, controle padrão e áudio. A interface de conversa, compra e prévias das áreas e do chefe também foi inspecionada no navegador. Os testes não substituem uma sessão humana completa para avaliar duração e dificuldade.
