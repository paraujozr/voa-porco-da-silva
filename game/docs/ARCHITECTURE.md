# Arquitetura

## Visão geral

```
game/
├─ core/            Regras do jogo e handlers de servidor. Código sem DOM, sem rede, sem three.js.
│  ├─ engine.js     Simulação determinística (voo, canos, moedas, replay, créditos, duelo)
│  ├─ catalog.js    Ids e preços de skins e mapas (fonte de verdade do servidor)
│  └─ handlers.js   Compras, voos, continue e salas, sobre uma interface de documentos
├─ src/             Cliente (Vite + three.js)
│  ├─ main.js       Bootstrap: monta Session, Stage, Game e eventos
│  ├─ game.js       Máquina de estados e laço de quadros (Game)
│  ├─ duel.js       Fluxo do duelo 1v1 (DuelController)
│  ├─ controls.js   Liga eventos de DOM/janela ao Game
│  ├─ stage.js      Renderer, câmera e luzes
│  ├─ entities.js   Malhas de canos, moedas e partículas
│  ├─ menu-ui.js, modal.js, dom.js   Desenho do menu, diálogo e helpers de DOM
│  ├─ session.js    Conta, convidado e chamadas ao servidor
│  ├─ guest-profile.js  Persistência do convidado (localStorage + migração)
│  ├─ transport.js  HTTP + WebSocket com reconexão
│  └─ social-ui.js  Painéis de perfil, pódio e duelo
├─ online/          Backend Cloudflare Worker + Durable Object (SQLite)
│  ├─ worker.js     Roteamento, sessões, limites, WebSocket e broadcast
│  ├─ store.js      Adaptador de documentos sobre SQLite
│  ├─ auth.js       Usuário, senha (scrypt) e tokens
│  └─ check.mjs     Teste de integração contra um servidor local
├─ test/            Testes unitários (`npm test`)
└─ scripts/publish-root.mjs   Gera o build e copia para a raiz do repositório (GitHub Pages)
```

A raiz do repositório contém apenas o **build publicado** (`index.html`, `assets/`, `audio/`,
`logo-oficial.png`) mais a documentação. Não edite esses arquivos: rode `npm run publish:root`.

## Princípios

1. **Uma única definição das regras.** `core/engine.js` roda no navegador (para jogar) e no servidor
   (para reproduzir e validar o voo). Qualquer número de jogabilidade (velocidades, aberturas,
   gravidade) vive lá. O cliente guarda apenas rótulos (`src/difficulty.js`) e visual (`src/config.js`).
   Preços existem em `core/catalog.js` e em `src/config.js`; um teste (`test/rules.test.js`) falha se
   divergirem.
2. **O servidor não confia no cliente.** O cliente envia o instante (tick) de cada batida de asa; o
   servidor reproduz a partida com a mesma semente, confere o tempo decorrido e só então credita
   moedas, recordes e ranking. Convidados jogam solo apenas localmente (sem ranking nem recompensas).
3. **`Game` é o dono do estado mutável.** Módulos de apoio (`Stage`, `RunEntities`, `menu-ui`,
   `modal`) recebem o que precisam e não guardam estado de jogo.
4. **IDs do DOM são checados por teste.** `test/dom-ids.test.js` garante que todo
   `$('id')` existe em `index.html`.

## Servidor

Um Worker recebe as requisições e as encaminha ao Durable Object `GameServer` (`'beta-v1'`). Ele:

- serializa todas as requisições (fila), então leituras/escritas no SQLite nunca se intercalam;
- aplica limites por IP, conta e WebSocket;
- após cada escrita, empurra snapshots (perfil, sala, ranking) aos WebSockets conectados.

`core/handlers.js` foi escrito para uma interface de documentos com transações (`db.doc`,
`runTransaction`); `online/store.js` a implementa sobre SQLite.

### Custos medidos (máquina de desenvolvimento, `workerd` local)

| Operação                                   | Antes   | Depois |
| ------------------------------------------ | ------- | ------ |
| Login (scrypt N=32768, r=8, p=3)           | ~550 ms | ~160 ms |
| Requisição simples durante 4 logins juntos | ~2,1 s  | ~0,6 s |
| Reprodução de um voo de 72.000 ticks       | ~25 ms  | —      |
| `node online/check.mjs` completo           | ~19 s   | ~6 s   |

O hash roda na mesma thread do isolate, então mover o hash para fora da fila **não** ajudou
(testado). Hoje um login bloqueia as demais requisições por ~160 ms.

### Limites conhecidos e plano de escala

O servidor atual é adequado para a beta (um único Durable Object). Antes de crescer:

1. **Particionar por responsabilidade.** Contas/perfis/ranking em um objeto; cada sala de duelo em
   seu próprio objeto (`idFromName('room:' + código)`), de modo que um duelo não atrase os outros e o
   broadcast deixe de ser O(conexões) global.
2. **Tirar o hash da thread principal** (ou limitar logins globais por minuto) para que uma onda de
   cadastros não congele partidas em andamento.
3. **Monitorar** requisições por dia (franquia gratuita: 100.000 requisições de DO/dia). Cada
   `duelTick` (a cada ~2,2 s por jogador) conta como uma.
4. **Ranking:** o placar mede canos, mas um bot que execute voos válidos o vence. Considere limitar a
   frequência de partidas ranqueadas por conta ou exigir conta com tempo de existência mínimo.

Ao particionar, mantenha `ALLOWED_ORIGINS` e os nomes de objeto em constantes únicas e adicione uma
migração de Durable Object (`wrangler.jsonc`) em vez de renomear `GameServer`.

## Testes e CI

- `npm test` (em `game/`): regras, replay, perfil de convidado, sessão, transporte, autenticação,
  IDs do DOM, modelos 3D e animação.
- `npm run lint` e `npm run format:check`: ESLint e Prettier.
- `node online/check.mjs` (com `npm run dev` em `game/online`): registro, login, recuperação,
  convidados, salas, duelo, WebSocket e CORS contra o Worker local.
- `.github/workflows/ci.yml` executa tudo isso em cada push e pull request.

## Publicação

1. `cd game && npm run publish:root` (gera o build e substitui `assets/`, `index.html`, `audio/`,
   `logo-oficial.png` na raiz).
2. Revise `git status` e faça o commit. O GitHub Pages serve a raiz da branch principal.
3. Servidor: `cd game/online && npx wrangler login && npm run deploy`.

O CI avisa (sem falhar) quando o build da raiz está desatualizado em relação ao código.
