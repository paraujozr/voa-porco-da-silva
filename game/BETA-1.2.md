# Beta 1.2 — prévia em desenvolvimento

- Placar por canos, evento no 67º cano com áudio local, fogos e animação.
- Perfil convidado, apelido, estatísticas, continue com moedas e skin Porco-Aranha revisada.
- Layout mobile compacto, personagem com mais espaço, alvos de toque maiores e instruções sem teclado no celular.
- Firebase preparado: Google, ranking sincronizado, salas privadas 1v1 e validação das partidas no servidor.

Online depende da configuração descrita em `docs/FIREBASE_SETUP.md`. O modo convidado funciona sem ela. Repositórios de assets estão em `docs/ASSETS.md`.

Desenvolvimento: `npm ci`, `npm run dev -- --port 5174`. Verificação: `npm test`, `npm run build`. Backend: `npm ci` em `server/`.

A versão pública 1.1 não foi substituída por esta prévia.

Atualização: voo com fase contínua de asas e movimentos articulados; Cachorro Louco Delivery (ID de compra preservado) com capacete, viseira, bag e visual caramelo. Saída de duelo não reconecta mais por atualizações atrasadas. Moedas e estatísticas do duelo são creditadas pelo servidor uma única vez. Efeitos locais usam AudioContext liberado por interação para melhorar compatibilidade móvel.
