# Voa Porco da Silva — projeto editável

Jogo em Three.js + Vite (Beta 1.2). Arquitetura, decisões e plano de escala em
[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md); servidor online em
[docs/ONLINE_SETUP.md](docs/ONLINE_SETUP.md); histórico da versão em [BETA-1.2.md](BETA-1.2.md).

## Comandos

Exigem Node 22+. Rode em `game/`:

```bash
npm ci               # instala dependências
npm run dev          # servidor de desenvolvimento (http://127.0.0.1:5173)
npm test             # testes unitários
npm run lint         # ESLint
npm run format       # Prettier (format:check só confere)
npm run build        # gera game/dist
npm run publish:root # build + copia para a raiz do repositório (GitHub Pages)
```

Para jogar online localmente: em `game/online` rode `npm ci` e `npm run dev`, crie
`game/.env.local` com `VITE_ONLINE_URL=http://127.0.0.1:8787` e abra o jogo em `localhost:5173` ou
`localhost:5174`. Sem essa variável o jogo funciona offline (modo convidado).

## Controles

Espaço, seta para cima ou toque fazem o porco voar; Esc/P pausam. 3D LEVE reduz a resolução e
desliga sombras.

## Jogo

- 21 personagens em voxel, 4 mapas (Cipó Guaçu inicial; Rio, Brasília e Amazônia desbloqueáveis).
- Dificuldades De boa, Na raça e Sem dó alteram velocidade, abertura e espaçamento dos canos. Os
  recordes são separados por mapa e dificuldade.
- Trilha e efeitos são MP3 locais em `public/audio`, com fontes nos JSON da mesma pasta.
