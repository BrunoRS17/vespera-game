# Véspera — O Último Sino

## Jogar

Abra **index.html** no navegador e clique em **Iniciar**. Os sprites estão incorporados no arquivo: o jogo funciona offline, sem instalação. O progresso permanece durante a sessão; fechar ou recarregar reinicia a peregrinação.

## Controles

| Ação | Teclado | DualShock 4 / Xbox |
| --- | --- | --- |
| Mover | A / D ou setas | Analógico esquerdo / direcional |
| Pular / confirmar | Espaço | ✕ / A |
| Atacar | J | □ / X |
| Defender | Segurar K | L1 / LB |
| Especial | L | △ / Y |
| Interagir | E | ○ / B |
| Menu | Esc | Options / Menu |

Conecte o controle por USB ou pelo Bluetooth do sistema e pressione um botão para o navegador detectá-lo. O indicador fica em **Configurações → Controles**. Controles devem ser reconhecidos pelo navegador com mapeamento padrão. A lógica foi testada por simulação; a conexão física deve ser confirmada no seu computador. Há botões de toque em dispositivos compatíveis.

## Interface e áudio

O jogo ocupa a janela inteira preservando a proporção. Use **Configurações → Entrar em tela cheia** para a tela inteira do monitor. Esc / Options abre a pausa; nela você encontra Configurações, os volumes separados, a ativação da música e dos efeitos e a lista de controles.

Nos menus, use o direcional para selecionar, ✕ / A para confirmar e ○ / B para voltar das configurações. Ao iniciar pelo controle, clique uma vez em Trilha para liberar o áudio no navegador. Preferências de áudio escolhidas antes de iniciar são respeitadas.

## Combate e dificuldade

- Espada: **25 de dano** por acerto.
- Especial: **18 de dano**, custo de **40 de fervor** e intervalo de **1,1 segundo**. A onda atravessa inimigos, mas só acerta cada um uma vez por disparo.
- Fervor: recupera **2,5 por segundo**, **10 por inimigo derrotado**, ou totalmente nos altares.
- Defesa: protege pela frente, consome resistência e não bloqueia pilares ou a investida especial do chefe.
- Vida: 100; uma melhoria opcional aumenta o máximo para 130.

## A peregrinação

1. **Mosteiro das Cinzas:** 10 inimigos, plataformas e abismos. Avance para a direita e descanse nos altares.
2. **Cripta dos Sem-Nome:** 13 inimigos. Suba pelas plataformas após o altar para obter a Relíquia do Eco, que libera pulo duplo e a entrada do santuário.
3. **Guardião do Último Sino:** uma introdução de aproximadamente nove segundos precede a luta. Espaço / ✕ ou o botão Pular introdução permite avançar. O combate fica suspenso durante a cena. A introdução não se repete ao ressurgir, mas reaparece em uma nova peregrinação.

Exploração opcional: volte da cripta ao mosteiro com o pulo duplo e procure o Coração de Cinza na plataforma alta.

## Cinco tipos de inimigo

| Inimigo | Comportamento |
| --- | --- |
| Cavaleiro errante | Ataque corpo a corpo com preparação |
| Guarda rubro | Mais vida e golpes mais fortes |
| Cão das cinzas | Persegue e dispara uma investida curta |
| Acólito espectral | Mantém distância e lança projéteis mirados |
| Caveira flamejante | Flutua, acompanha a altura do jogador e avança |

Os projéteis dos acólitos podem ser defendidos pela frente. Observe o aviso luminoso antes dos ataques de investida.

## Chefe: duas fases

**Primeira vigília:** golpes próximos, ondas pelo chão e Réquiem das Cinzas, com três pilares anunciados por círculos. Saia das marcas; há espaço para esquivar entre os pilares.

**Sino da Ruína:** abaixo de 50% de vida, o Guardião se transforma durante 2,2 segundos. Nesse momento ele fica invulnerável e o jogador recebe uma breve proteção. O chefe se move mais rápido, causa mais dano, prepara golpes em menos tempo e convoca cinco pilares.

Dois ataques adicionais exclusivos desta fase:

- **Investida do Carrasco:** após aviso visual, avança rapidamente. Causa 34 de dano e atravessa a defesa. Salte sobre ele.
- **Coro da Ruína:** anuncia a direção e dispara duas salvas de cinco projéteis em leque. Mude de posição; cada projétil causa 22 de dano e pode ser bloqueado pela frente.

A música do chefe passa de **132 para 172 BPM**, com percussão, baixo e sequência rápida de notas. Os efeitos incluem corte, impacto, bloqueio metálico, morte, magia, passos, golpe pesado e rugido. Música e efeitos são sintetizados localmente.

## Assets e arquivos

A arte pronta vem de **Gothicvania Patreon's Collection**, de Ansimuz, e **Knight Enemy**, de DevWizard, ambos disponibilizados como CC0. Leia **ASSETS-E-CREDITOS.md** para fontes e adaptações. Os ZIPs originais completos, as imagens PNG e o manifesto estão em **assets/**. O jogo usa 20 spritesheets/imagens dessa seleção e mantém fallback procedural caso alguma imagem falhe ao carregar.

Esta é uma versão de protótipo: arte em pixel art, animações adaptadas ao combate e dificuldade ajustável pelo código contido no HTML. Os testes automatizados cobrem progressão, combate, controle simulado, introdução, segunda fase, ataques novos e recortes dos sprites.

## Desenvolvimento

O jogo inteiro está em index.html e não requer instalação de dependências. Para executar os testes, instale Node.js e rode, na raiz do repositório:

    node tests/game.test.cjs

Os testes usam simulação do navegador e do controle. A validação de áudio e controle físico também deve ser feita manualmente.
