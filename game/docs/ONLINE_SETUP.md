# Online gratuito — Beta 1.2

Servidor: https://voaporco-online.voaporco-online.workers.dev
Jogo: https://paraujozr.github.io/voa-porco-da-silva/

## Contas e duelos
- Nome de usuário (3–18 letras/números/_), senha (12–128 caracteres), apelido editável.
- Senhas com scrypt N=32768/r=8/p=3 e salt aleatório; nunca armazenadas em texto.
- Código de recuperação mostrado no cadastro; sem e-mail, é necessário guardá-lo para redefinir a senha. Recuperação revoga sessões antigas.
- Sessão de conta por 7 dias. Convidado online por 6 horas, sem cadastro, com progresso solo local.
- Duelo por código de seis dígitos, sala para dois, início sincronizado, WebSocket com reconexão. Convidados não acumulam recompensas na nuvem.
- O servidor reproduz entradas de voo para validar canos/moedas; compras, continue e recompensas são transacionais e idempotentes.
- Progresso de convidado não é importado para contas: dados locais podem ser modificados pelo navegador.

## Desenvolvimento
Em game/online: npm ci e npm run dev (porta 8787).
Em game/.env.local: VITE_ONLINE_URL=http://127.0.0.1:8787
Em game/: npm ci e npm run dev -- --port 5174.
Teste real do servidor: node online/check.mjs (servidor local ligado).
Teste de produção opcional: ONLINE_TEST_URL apontando para o servidor publicado; cria contas QA sem informação pessoal.
Publicar servidor: npm run deploy em game/online após wrangler login. O Wrangler usa a conta do proprietário; nenhuma credencial administrativa é incluída no jogo.
O build usa game/.env.production. Não publique um build apontando para localhost.

## Hospedagem e limites
Cloudflare Workers Free + Durable Object com SQLite, sem cartão. Um objeto coordena a beta e mantém transações atômicas. É adequado para a beta; antes de escalar, dividir por contas/salas e monitorar carga.
Free: 100.000 requisições DO/dia, 13.000 GB-s/dia; SQLite 5 milhões de linhas lidas/dia, 100.000 escritas/dia e 5 GB totais. Workers têm limites próprios. Ao esgotar a franquia Free, operações falham até a renovação do limite, sem excedentes pagos automáticos.
https://developers.cloudflare.com/durable-objects/platform/pricing/
https://developers.cloudflare.com/workers/platform/pricing/
WebSockets usam hibernação. Limites por IP/conta protegem autenticação; sessões, salas e partidas antigas expiram. O tráfego usa HTTPS e origens autorizadas. O placar é por canos, não metros. Isto não impede bots que executem voos válidos.

## Firebase anterior
O projeto Firebase gratuito foi criado, mas não é utilizado nesta versão. O adaptador em server/index.js ficou apenas para regressão histórica local. Não ativar Blaze nem publicar Functions.

## Duração das partidas
Solo: até 60 minutos, com aviso no último minuto e resultado salvo ao concluir. Duelo: 3 minutos. O orçamento de replay é limitado no servidor. O limite solo antigo de 10 minutos encerrava o modo normal perto de 300 canos; foi corrigido em 19/10/2026.
