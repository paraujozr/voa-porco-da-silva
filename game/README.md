# Voa Porco da Silva — Beta 1.1

Prévia local jogável em Three.js + Vite, atualizada em 19/10/2026.

## Jogar

Execute `npm install` e `npm run dev -- --port 5173` nesta pasta. Abra http://127.0.0.1:5173/. Espaço, seta para cima ou toque na tela fazem o porco voar. Esc/P pausam. A opção 3D LEVE reduz a resolução e desliga sombras.

## Esta atualização

- Modelos 3D de voxels com 21 personagens e acessórios próprios, incluindo Mandrake, CLT, Maker Lab FIAP e homenagens de cultura pop.
- Cipó Guaçu como mapa inicial: interpretação criativa com feira, ônibus, futebol, caramelo, churrasco e festa junina.
- Rio, Brasília e Amazônia desbloqueáveis com moedas; é possível visualizar os destinos antes de comprar.
- Cenário com camadas que se deslocam durante o voo, nuvens, aves, pipas, fumaça, pessoas, animais e luzes animadas.
- Bandeirinhas ao vento e pisca-pisca na interface e decoração 3D de Cipó.
- Logo oficial fornecida pelo autor, preservada no arquivo original.
- Progresso anterior preservado; compras cobram uma única vez.

## Dificuldade

De boa, Na raça e Sem dó alteram velocidade, abertura e espaçamento dos obstáculos. As sequências variam distância e altura, com limites de transição. Recordes são separados por mapa e dificuldade; recordes antigos são preservados no nível normal.

## Áudio

A trilha e o FAHH são arquivos MP3 locais em public/audio. A música inicia ao decolar, pausa junto com o jogo e é interrompida pelo efeito de derrota. Não há player ou iframe do YouTube. MÚSICA ON/OFF controla a trilha; SOM ON/OFF controla todo o áudio. As fontes estão registradas nos arquivos JSON dessa pasta.

## Verificação

`npm test` verifica física, colisões, persistência, migração de saves, compras e construção dos 21 modelos. `npm run build` gera a pasta dist. A prévia foi conferida em desktop e em 390 × 844, incluindo seleção de personagens/mapas, pausa, derrota, moedas e reprodução dos arquivos locais.

Esta pasta é a prévia Beta 1.1; esta atualização ainda não foi publicada no GitHub Pages.
