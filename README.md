## Beta 1.3 — Brasil afora com poderes

- Campanha: Cipó (80 canos) → Rio (100) → Brasília (120) → Amazônia (150). Concluir libera o próximo destino; mapas já comprados continuam liberados. Voo Livre mantém partidas longas.
- A velocidade cresce com tempo ativo, canos e moedas. Sem dó começa em 8,2 unidades/s, tem vãos de 3,25–4,05 e inimigos mais frequentes. Aceleração limitada por nível para manter o controle possível.
- 22 skins com habilidades, duração e recarga. Use **E** ou o botão de poder no celular. Porco do Queijo lança queijo; Cachorro Louco usa moto, acelera e fica protegido; Maker dispara laser; Porco-Aranha abre vãos com teias.
- Pipas, gaivotas, drones e Boitatá com colisão. Monumentos se deslocam em paralaxe e o horizonte ganha variação procedural.
- Duelo usa Mandrake e a mesma habilidade para ambos. Servidor reexecuta impulsos e poderes; recarga e histórico não podem ser alterados pelo cliente.
- Falhas ao salvar permanecem na tela. Simulação anterior preservada para partidas antigas. CORS aceita o site e as prévias locais na porta 5174.

Validação: `cd game`, `npm test`, `npm run lint`, `npm run format:check`; integração real local em `game/online` com `npm test`. `node scripts/qa-flight.mjs` realiza uma busca opcional de trajetórias usando física e colisões reais. Publicar o frontend com `npm run publish:root` e o Worker com `npm run deploy` em `game/online`.

# Voa Porco da Silva — Beta 1.2

Um porco com asas, um Brasil inteiro de resenha e só mais uma tentativa.

## Jogar agora

https://paraujozr.github.io/voa-porco-da-silva/

21 personagens em voxel 3D, Cipó Guaçu como mapa inicial, Rio de Janeiro, Brasília e Amazônia desbloqueáveis, moedas, recordes e três níveis de dificuldade. Os canos variam em altura, abertura e espaçamento. Cenários animados e trilha/efeitos em arquivos locais.

**Controles:** espaço, seta para cima ou toque para voar; Esc/P para pausar. Música e efeitos podem ser desligados no topo.

## Desenvolvimento

O projeto editável está em `game/` (veja [game/README.md](game/README.md) e [game/docs/ARCHITECTURE.md](game/docs/ARCHITECTURE.md)): `npm ci`, `npm test`, `npm run dev`. A raiz contém só a versão compilada publicada no GitHub Pages, gerada por `npm run publish:root` em `game/`; não edite esses arquivos à mão.

A branch `beta-1.0` preserva a versão anterior e as alterações originais do autor. A Beta 1.2 mantém a identidade visual e evolui o jogo existente.

Projeto de Pedro Araújo. Personagens de cultura pop são homenagens estilizadas de fã. Fontes dos áudios em `audio/*-source.json`.

## Online sem Google

Crie sua conta com nome e senha para guardar moedas, skins e recordes. Guarde o código de recuperação exibido no cadastro. O duelo 1v1 também funciona sem cadastro: crie a sala, compartilhe os seis números e ambos cliquem em Pronto. Quem passar mais canos vence.

Backend gratuito Cloudflare, sem cartão. Configuração e limites em [game/docs/ONLINE_SETUP.md](game/docs/ONLINE_SETUP.md). O Firebase usado em versões anteriores foi removido do código.
