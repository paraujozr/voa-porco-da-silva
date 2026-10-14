# 🐷 Voa Porco da Silva

**Um trabalhador, duas asinhas e um céu inteiro de desafios.**

Um jogo 3D de reflexos com cara de Brasil! Escolha seu porco trabalhador, desvie dos canos e tente bater seu próprio recorde. Entre capacetes de obra, camisas de futebol e mochilas de delivery, cada voo vira uma nova história.

## 🚀 Jogue agora

**[Abrir Voa Porco da Silva](https://paraujozr.github.io/voa-porco-da-silva/)**

## 🇧🇷 Escolha seu parceiro de voo

- **Zé da Obra** — capacete amarelo e colete refletivo para encarar qualquer desafio.
- **Porco Craque 10** — a Amarelinha entra em campo… ou melhor, no céu!
- **Rei do Mate & Queijo** — estilo de praia para voar com tranquilidade.
- **Cachorro Louco Delivery** — a próxima entrega é nas alturas.

## 🎮 Como jogar

1. Abra o `index.html` com dois cliques no Chrome, Edge ou outro navegador com suporte a WebGL. Não precisa de servidor nem de instalação.
2. Escolha o personagem pelas setas e clique em **DECOLAR AGORA**.
3. Use **Espaço**, **seta para cima**, **clique** ou **toque na tela** para bater as asas.
4. Aperte **H** durante o jogo para ver a hitbox do porco (círculo vermelho).
5. Passe entre os canos, evite o chão e o limite superior e supere seu recorde!

## ✨ O que tem no jogo

- Personagens e cenário em 3D, com animações, iluminação e sombras.
- Calçadão inspirado em Copacabana e cores do Brasil.
- Efeitos sonoros gerados pelo navegador.
- Recorde salvo no navegador quando o armazenamento local está disponível.
- Menu com seleção à esquerda e personagem em destaque à direita; disposição adaptada em telas estreitas.
- Biblioteca gráfica incluída em `vendor/`: não precisa instalar dependências nem ter internet para jogar localmente.

## 🛠️ Tecnologias

HTML, CSS, JavaScript, Three.js r128 e Web Audio API.

Sem etapa de compilação: HTML, CSS e JavaScript puro (scripts clássicos, sem módulos), organizados num namespace único `window.Voa`. Para hospedagem estática, publique a pasta inteira. O Three.js em `vendor/` mantém seu aviso de licença MIT.

## 🗂️ Estrutura

```
index.html            # apenas a estrutura da página
styles/               # CSS por componente (base, buttons, hud, menu, game-over)
vendor/three.min.js   # Three.js r128 (global THREE)
src/
  main.js             # ponto de entrada (carregado por último)
  game.js             # estado, loop e regras do jogo
  config/             # constantes de física/obstáculos e lista de personagens
  scene/world.js      # renderer, câmera, luzes, chão e nuvens
  entities/           # porco (pig.js) e canos (obstacles.js)
  textures/           # texturas procedurais (canvas)
  audio/sound.js      # efeitos sonoros (Web Audio API)
  ui/dom.js           # única camada que acessa o DOM
  utils/storage.js    # leitura/escrita segura do recorde
```

A ordem das tags `<script>` no `index.html` importa: cada arquivo depende dos anteriores.

As fontes (Lilita One e Baloo 2) vêm do Google Fonts; sem internet o jogo usa fontes do sistema, com visual um pouco diferente.
