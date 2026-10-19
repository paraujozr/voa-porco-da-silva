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

Backend gratuito Cloudflare, sem cartão. Configuração e limites em [game/docs/ONLINE_SETUP.md](game/docs/ONLINE_SETUP.md). O projeto Firebase anterior não é utilizado.
