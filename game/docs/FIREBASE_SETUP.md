# Beta 1.2 — configuração Firebase

A prévia funciona como convidado sem configurar serviços. A versão publicada 1.1 permanece separada. Pontuação, recordes, ranking e duelo contam **canos atravessados**; Six Seven dispara uma vez no 67º cano. Distância física interna serve apenas para mover o cenário.

## Ativar a nuvem

1. Crie um projeto no [Firebase Console](https://console.firebase.google.com/) e registre um aplicativo Web.
2. Ative Authentication > Google, escolha o e-mail de suporte e autorize `paraujozr.github.io` e `localhost` em Authorized domains.
3. Crie o Firestore em modo produção. A implementação usa Functions em `southamerica-east1`.
4. Copie `.env.example` para `.env.local` em `game/`. Preencha os quatro valores públicos do aplicativo Web. Não coloque chave de conta de serviço no frontend. Mantenha `VITE_FIREBASE_EMULATORS=false` em produção.
5. Instale Node 22, execute `npm ci` em `game/` e `game/server/`.
6. Autentique o Firebase CLI, selecione seu projeto e execute, de `game/`: `firebase deploy --only firestore,functions --project SEU_PROJECT_ID`.
7. Execute `npm run build` com a configuração final e publique `dist/` no GitHub Pages, após validar login e duelo em dois aparelhos.

**Cloud Functions em produção exige plano Blaze com faturamento habilitado.** Isso não foi ativado. O teste local usa emuladores gratuitos. Confira [a documentação oficial](https://firebase.google.com/docs/functions/get-started) antes de ativar o serviço. Configure alertas de orçamento; alertas não são um limite rígido de gastos.

## Teste local reproduzível

Na pasta `game/`, com Java instalado:

```powershell
npx firebase-tools@14.22.0 emulators:start --only auth,firestore,functions --project demo-voaporco
```

Em outro terminal na mesma pasta:

```powershell
$env:FIRESTORE_EMULATOR_HOST='127.0.0.1:8080'
node server/scripts/emulator-check.mjs
```

O script só aceita o emulador local e cria usuários fictícios. Verifica perfis, isolamento entre contas, replay inválido, crédito e continue sem duplicação, concorrência pela segunda vaga, largada, empate e bloqueio de alterações diretas de moedas.

Para testar a interface com os emuladores, use valores de demonstração no `.env.local`: project ID `demo-voaporco`, API key `demo-key`, auth domain `localhost`, app ID `demo-app` e `VITE_FIREBASE_EMULATORS=true`. Reinicie Vite. O Google simulado não testa consentimento/OAuth real.

## Regras do jogo e dados

- Convidado: dados locais, sem envio à nuvem. Moedas e skins da 1.1 são preservadas; dados locais não são importados como saldo confiável para contas online.
- Perfil privado: moedas, compras e recordes. Ranking público: apelido, canos, mapa e data do recorde.
- O campo interno `distance` em resultados, ranking e salas armazena a quantidade de canos por compatibilidade do esquema. A simulação `run.distance` continua sendo deslocamento físico; `run.passed` é o placar.
- O servidor reproduz os impulsos com a mesma física e semente. Não aceita pontuação fornecida pelo cliente. Isso limita adulteração de placar, mas não elimina bots.
- Continue custa 25, 50 e 100 moedas, no máximo três vezes. Preserva canos e concede proteção breve. Voos continuados não aumentam o ranking.
- Duelo: Cipó/normal, mesma semente, largada futura compartilhada, até 180 segundos, sem continue. Atualização a cada 2,2 segundos. Desconexão/saída encerra a participação com a última pontuação validada. Empates são permitidos.
- Firestore rules negam escritas diretas; compras e recompensas passam por transações nas Functions. Configure uma política de retenção para documentos de partidas/salas antes de escalar o serviço.

Validação em produção, teste em Safari/iPhone físico e teste multiplayer entre redes diferentes ainda são necessários antes de lançar os modos online.
