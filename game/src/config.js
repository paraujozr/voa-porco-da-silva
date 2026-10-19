export const MAPS=[
{id:'cipo',name:'Cipó Guaçu',short:'CIPÓ',icon:'⌂',cost:0,tag:'A RESENHA COMEÇA EM CASA',desc:'Uma homenagem imaginada a Cipó: bairro, mata, feira, futebol e festa junina.',caption:'CIPÓ GUAÇU • ARRAIÁ DO PORCO',sky:0x96d9e2,fog:0xb9e2cf,water:0x56a8ad,ground:0x86aa65,pipe:0xc77745},
{id:'rio',name:'Rio de Janeiro',short:'RIO',icon:'☀',cost:40,tag:'SOL, MAR E UM VOO SEM PRESSA',desc:'Orla, calçadão, bondinho e cartões-postais em blocos.',caption:'RIO • DO CALÇADÃO ÀS NUVENS',sky:0x81d3e8,fog:0xb7e5dc,water:0x2ba6bb,ground:0xe9cf92,pipe:0x369781},
{id:'brasilia',name:'Brasília',short:'BSB',icon:'◇',cost:90,tag:'AQUI ATÉ A PROMESSA TEM ASAS',desc:'Congresso, políticos fictícios e promessas de pista livre.',caption:'BRASÍLIA • PROMETO NÃO BATER',sky:0xafd7e9,fog:0xe5ddc0,water:0x75a7b6,ground:0xa7b873,pipe:0x688cb4},
{id:'amazonia',name:'Amazônia',short:'AMZ',icon:'♣',cost:140,tag:'CALMA, CAPIVARA!',desc:'Floresta viva, rio, tucanos e um jacaré que só observa.',caption:'AMAZÔNIA • A NATUREZA É DA RESENHA',sky:0x9ed0b6,fog:0x92c1aa,water:0x579782,ground:0x467e51,pipe:0x9b854f}
];
const pig=(id,name,label,desc,skin,shirt,cost=0,category='Brasil')=>({id,name,label,desc,skin,shirt,cost,category,icon:category==='Pop'?'★':'◆'});
export const PIGS=[
pig('mandrake','Porco Mandrake','CRIA DE CIPÓ','Juliet no rosto, corrente no peito. O céu é dos cria.',0xba7049,0xba7049),
pig('clt','Porco CLT','ESCALA 6×1','Bate o ponto, bate a asa. O vale-voo caiu!',0xe7a08c,0x77a7ba),
pig('maker','Maker Lab FIAP','IDEIA → PROTÓTIPO','Se não voar, a gente imprime outra asa.',0xe69a95,0x212938),
pig('obra','Zé da Obra','CAPACETE E CORAGEM','Obra atrasada? Só se for a gravidade.',0xefa49b,0xf09b3d),
pig('craque','Craque do Voo','RECEBA!','É sobre isso. E tá tudo voando.',0xf2b2a7,0xf4d14b,10),
pig('praia','Rei do Mate','SEXTOU NA ORLA','O pai tá on. O mate tá gelado.',0xeaa29b,0x4ab4bc,15),
pig('delivery','Cachorro Louco Delivery','O PEDIDO DECOLOU','Caramelo de capacete, bag nas costas e entrega nas nuvens.',0xb77a43,0x26364e,20),
pig('maromba','Porco do Shape','TÁ PAGO!','Hoje é treino de asa. Bora, bill!',0xe4a094,0x8559a5,30),
pig('coroa','Rei da Resenha','LÁ ELE!','Receba! O céu acaba de ganhar um rei.',0xf5aaa6,0x469777,60),
pig('babe','Babe','PORQUINHO ATRAPALHADO','Um pequeno herói, uma grande aventura.',0xeeb1a0,0xeeb1a0,25,'Pop'),
pig('porky','Gaguinho','PORKY PIG','Por hoje é só… depois de mais uma partida!',0xf4b2a5,0x397ab7,30,'Pop'),
pig('piggy','Miss Piggy','ESTRELA DO VOO','Luzes, câmera e uma entrada triunfal.',0xf0b69e,0x9e68bf,40,'Pop'),
pig('piglet','Leitão','PIGLET','Pequenininho, mas cheio de coragem.',0xf8b7bc,0xc7487f,35,'Pop'),
pig('peppa','Peppa Pig','POCINHAS & ASINHAS','Pular na lama ganhou uma nova altitude.',0xf3a0b4,0xdb434b,40,'Pop'),
pig('rabico','Marquês de Rabicó','SÍTIO & GOIABADA','Marquês por título. Fominha por vocação.',0xc59b7e,0xd4ae76,45,'Pop'),
pig('torresmo','Torresmo','TURMA DO CHICO','Da lama do sítio para as nuvens de Cipó.',0xf1b1a4,0xf1b1a4,30,'Pop'),
pig('gobbato','Gobbato','PORCO DO PALMEIRAS','Avanti! Hoje o drible é nas alturas.',0xd19d88,0x168253,50,'Pop'),
pig('spiderham','Porco-Aranha','SPIDER-HAM','Seu amigo suíno da vizinhança.',0xe05059,0x2869b2,65,'Pop'),
pig('waddles','Waddles (Ginga)','GRAVITY FALLS','O mistério é como esse porquinho voa.',0xeea6ab,0xeea6ab,45,'Pop'),
pig('hamm','Porquinho (Hamm)','TOY STORY','Hoje o cofrinho vai atrás das moedas.',0xe7a5a2,0xe7a5a2,55,'Pop'),
pig('hawk','Hawk','CAPITÃO DAS SOBRAS','Fiscal oficial do rango e da resenha.',0xe9a6ae,0xe9a6ae,60,'Pop')
];
export const MEMES=['RECEBA!','BORA, BILL!','O PAI TÁ ON','CALMA, CALABRESO','É SOBRE ISSO','SEXTOU!','LÁ ELE!','TÁ PAGO!','SÓ MAIS UMA','AMOSTRADINHO','CÊ É O BICHÃO','QUE SHOW DA XUXA!','CANETA AZUL','OLHA A COBRA! É MENTIRA!','É PAVÊ OU PACUMÊ?','NA VOLTA A GENTE COMPRA','NÃO É MOLE NÃO'];
export const STEP=1/120;
export function integrate(y,velocity,dt){const v=velocity-19*dt;return {y:y+v*dt,velocity:v};}
export function hitGate(x,y,gate){const cx=x+.1,cy=y+.05,r=.65;for(const side of [-1,1]){const edge=gate.center+side*gate.gap/2;const minY=side<0?edge-30:edge,maxY=side<0?edge:edge+30;const nx=Math.max(gate.x-.96,Math.min(cx,gate.x+.96)),ny=Math.max(minY,Math.min(cy,maxY));if((cx-nx)**2+(cy-ny)**2<r*r)return true;}return false;}
export function readSave(storage){const base={coins:0,best:{},unlocked:[],maps:['cipo'],muted:false,low:false};try{const s=JSON.parse(storage.getItem('voaporco-beta-save')||'{}');if(!s||typeof s!=='object')return base;const legacy=Math.max(0,Number(storage.getItem('voaPorcoBest'))||0);return {coins:Number.isFinite(Number(s.coins))?Math.max(0,Math.floor(Number(s.coins))):0,best:s.best&&typeof s.best==='object'?s.best:{rio:legacy},unlocked:Array.isArray(s.unlocked)?s.unlocked:[],maps:[...new Set(['cipo',...(Array.isArray(s.maps)?s.maps:[])])],muted:!!s.muted,low:!!s.low};}catch{return base;}}
export function writeSave(storage,data){try{storage.setItem('voaporco-beta-save',JSON.stringify(data));return true;}catch{return false;}}
export function purchase(save,item,kind){const key=kind==='map'?'maps':'unlocked';if(!item.cost||save[key].includes(item.id))return 'owned';if(save.coins<item.cost)return 'insufficient';save.coins-=item.cost;save[key].push(item.id);return 'purchased';}
