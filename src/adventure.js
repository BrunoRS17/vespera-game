// Campaign state. All simulation uses seconds and runs at 120 Hz.
const SAVE_KEY='vespera-peregrinacao-v2';
let souls=0,damageLevel=0,armorLevel=0,orbs=[],flags={},litAltars=new Set(),bellSequence=[],clockLeft=0,elapsed=[0,0,0],lastDistrict='',saveClock=0;
const damageCosts=[30,55,85,120,160],armorCosts=[25,50,80,115];
// Pivot coordinates are measured in each source frame, never in world pixels.
// Jump sheets include baked-in vertical motion; stable foot pivots avoid a second jump.
const spritePivots={heroIdle:{x:22,y:48},heroRun:{x:40,y:48},heroAttack:{x:48,y:48},heroHurt:{x:25,y:48},heroCrouch:{x:26,y:48},heroSpecial:{x:[32,29,33,34],y:32},heroJump:{x:[37,29,35,34,40],y:[76,67,50,40,60]},heroAir:{x:[40,43,43,46,38,40],y:[76,67,48,39,49,50]},demonIdle:{x:82,y:140},demonAttack:{x:96,y:171},demonBreath:{x:155,y:183}};
function anchoredSprite(name,x,feet,scale,frame,dir=1,alpha=1){const a=art[name];if(!a)return false;const i=Math.max(0,Math.min(a.frames-1,Math.floor(frame))),pivot=spritePivots[name];if(pivot){const px=Array.isArray(pivot.x)?pivot.x[i]:pivot.x,py=Array.isArray(pivot.y)?pivot.y[i]:pivot.y;x+=(a.img.naturalWidth/a.frames/2-px)*scale*dir;feet+=(a.img.naturalHeight-py)*scale;}return sprite(name,x,feet,scale,i,dir,alpha);}
const districts=[['Adro dos Esquecidos','Campanário Partido','Jardim dos Votos','Aqueduto de Cinza','Claustro dos Carrascos','Porta da Vigília'],['Ossário Velado','Galeria dos Espelhos','Arquivo dos Ecos','Relógio dos Mortos','Sepulcro das Três Chamas','Escadaria do Silêncio']];
function platform(x,y,w=160){return{x,y,w}}
function makeArea(s){
 const r={width:s?22800:21600,door:s?22650:21450,altar:240,platforms:[],gaps:[],enemies:[],objects:[],gates:[]};
 const add=(kind,x,y=GROUND,data={})=>r.objects.push({id:s+'-'+kind+'-'+x,kind,x,y,...data});
 function stairs(x,top=209){for(let i=0;i<3;i++)r.platforms.push(platform(x+i*140,GROUND-82*(i+1),170));r.platforms.push(platform(x+410,top,210));}
 for(let d=0;d<6;d++){
  const base=d*3500;
  add('altar',base+(d===1?150:240),GROUND,{name:districts[s][d]});
  add('npc',base+430,GROUND,{name:d%2?'Iria, guardiã das cinzas':'Baltasar, o ferreiro',role:d%2?'armor':'damage'});
  stairs(base+1200);
  // Each district has a different silhouette and upper route, with an unbroken
  // lower return path around quest hubs and the pushable reliquary.
  const layouts=[[[1940,355,220],[2230,280,160],[2470,350,210]],[[1910,300,250],[2220,220,230],[2520,300,190]],[[1970,370,120],[2190,330,140],[2430,270,210]],[[1940,345,360],[2420,260,280]],[[1920,300,130],[2180,350,130],[2420,285,130],[2640,365,120]],[[1910,345,280],[2240,255,210],[2510,170,250]]];
  for(const [x,y,w]of layouts[(d+s)%layouts.length])r.platforms.push(platform(base+x,y,w));
  if(d!==3){r.gaps.push([base+2800,base+2910]);r.platforms.push(platform(base+2740,365,120));}
  for(let j=0;j<8;j++){
   const x=base+760+j*285,type=['pilgrim','hound','warden','acolyte','wraith','hound','pilgrim','warden'][(j+s+d)%8];
   if(!r.gaps.some(([a,b])=>x>a-50&&x<b+50))r.enemies.push(enemy(x,type==='wraith'?335:GROUND,type));
  }
  add('cache',base+1660,175,{value:12});
 }
 add('npc',175,GROUND,{name:s?'Soror Nara, a arquivista':'O Peregrino Cego',role:'guide'});
 if(!s){
  add('inscription',3120,GROUND,{message:'A pedra canta: II → I → III. Toque os sinos nessa ordem. Um erro silencia a sequência.'});
  for(let i=0;i<3;i++)add('bell',3540+i*240,GROUND,{value:i+1});
  r.gates.push({x:4700,key:'bells',name:'Portão do Campanário'});
  for(const x of [6500,7350,8350]){stairs(x-430);add('vow',x,175);}
  r.gates.push({x:9500,key:'vows',name:'Selo dos Três Votos'});
  add('inscription',10830,GROUND,{message:'O peso da penitência abre o aqueduto. Empurre o relicário até a placa dourada; E o traz de volta se necessário.'});
  add('crate',11220,GROUND,{start:11220});add('plate',11900,GROUND);
  r.gates.push({x:13400,key:'weight',name:'Comporta da Penitência'});
  for(const x of [15300,16400,17500]){const e=enemy(x,GROUND,'warden');e.guardian=true;e.hp=e.max=125;r.enemies.push(e);add('seal',x+100,GROUND,{guardX:x});}
  r.gates.push({x:18500,key:'wardens',name:'Selo dos Carrascos'});
 }else{
  add('inscription',3070,GROUND,{message:'A luz lê os espelhos da esquerda para a direita: LUA, SOL, ESTRELA. Gire cada espelho com E.'});
  for(let i=0;i<3;i++)add('mirror',3540+i*240,GROUND,{value:0,index:i});
  r.gates.push({x:4700,key:'mirrors',name:'Galeria dos Espelhos'});
  stairs(5600);add('echo',6030,175);
  for(const x of [7340,8530]){r.platforms.push(platform(x-340,360,170),platform(x-130,195,180));add('shard',x-40,160);}
  r.gates.push({x:9700,key:'echoes',name:'Portão dos Ecos'});
  add('lever',12400,GROUND);r.gates.push({x:13600,key:'clock',name:'Portão do Relógio'});add('clockSeal',13800,GROUND);
  r.gaps.push([12630,12750],[13040,13160]);r.platforms.push(platform(12610,355,150),platform(12830,280,160),platform(13030,350,150));
  add('inscription',14500,GROUND,{message:'As últimas chamas se acendem contra o tempo: III → II → I. Acenda a mais distante primeiro. Os altares já acesos encurtam a volta.'});
  for(let i=0;i<3;i++)add('flame',15300+i*1150,GROUND,{value:i+1});
  r.gates.push({x:19300,key:'flames',name:'Sepulcro das Três Chamas'});
 }
 // Two combat vigils per area mix short waves with safe preparation at the altar.
 for(const [i,x]of (s?[4360,21600]:[4300,20720]).entries())add('trial',x,GROUND,{name:i?'A Vigília da Passagem':'A Vigília dos Exilados',wave:0,active:false,cleared:false,timer:0});
 r.enemies.forEach((e,i)=>{e.id=s+'-enemy-'+i;e.stun=0;e.rewarded=false;});
 r.platforms.sort((a,b)=>a.y-b.y);return r;
}
function reset(){
 introSeen=false;introTime=0;pillars=[];resumeMode='play';hideMenus();clearInput();
 p={x:100,y:GROUND-48,w:22,h:48,vx:0,vy:0,dir:1,hp:100,max:100,mana:100,stamina:100,on:true,jumps:0,inv:0,attack:0,cd:0,cast:0,block:false,double:false,relic:false,bonus:false,specialCd:0,stepTime:0,coyote:0,gait:0,run:0,guard:0,land:0,hurt:0,combo:0,parry:0,parryCd:0,guardHeld:false,riposte:0,action:null};
 souls=0;damageLevel=0;armorLevel=0;flags={};orbs=[];litAltars=new Set(['0-altar-240']);bellSequence=[];clockLeft=0;elapsed=[0,0,0];saveClock=0;lastDistrict='';
 rooms=[makeArea(0),makeArea(1),{width:1400,door:1320,altar:-999,platforms:[platform(310,355,160),platform(910,355,160),platform(610,280,170)],gaps:[],enemies:[],gates:[],objects:[{id:'arena-bell-left',kind:'arenaBell',x:370,y:355,cooldown:0},{id:'arena-bell-right',kind:'arenaBell',x:970,y:355,cooldown:0}]}];
 stage=0;cam=0;boss=null;particles=[];shots=[];kills=0;visited=new Set([0]);checkpoint={stage:0,x:240};mode='play';overlay.hidden=true;
 notify('Fale com o Peregrino · E / ○. Diário e mapa: M / Share.');
}
function objective(s=stage){
 if(s===2)return 'Use as plataformas contra as chamas. Toque os sinos elevados para interromper o Guardião.';
 if(s===0){if(!flags.bells)return 'Campanário: descubra a ordem e toque os três sinos.';if(!flags.vows)return 'Jardim: recolha os três votos nas capelas elevadas.';if(!flags.weight)return 'Aqueduto: empurre o relicário até a placa dourada.';if(!flags.wardens)return 'Claustro: derrote os três carrascos e rompa seus selos.';return 'Atravesse a porta da Vigília e desça à cripta.';}
 if(!flags.mirrors)return 'Galeria: alinhe os espelhos em LUA, SOL, ESTRELA.';if(!p.double)return 'Arquivo: encontre a Relíquia do Eco no alto da escadaria.';if(!flags.echoes)return 'Use o salto duplo para alcançar os dois fragmentos elevados.';if(!flags.clock)return 'Ative a alavanca e alcance o selo além do portão antes do tempo acabar.';if(!flags.flames)return 'Sepulcro: acenda as chamas na ordem III, II, I.';return 'Suba à Escadaria do Silêncio e enfrente o Guardião.';
}
function gateOpen(g){return !!flags[g.key]||(g.key==='clock'&&clockLeft>0)}
function nearestObject(){let best=null,dist=Infinity;for(const o of rooms[stage].objects){if(o.taken||o.kind==='plate')continue;const d=Math.abs(p.x+11-o.x),dy=Math.abs(p.y+p.h-o.y);if(d<65&&dy<65&&d<dist){best=o;dist=d}}return best;}
function interact(){
 const r=rooms[stage],o=nearestObject();
 if(o){
  if(o.kind==='npc')return openNPC(o);
  if(o.kind==='trial'){if(o.cleared)return notify('Esta vigília foi vencida.');if(o.active)return;return dialogue(o.name,'Três grupos guardam esta passagem. Vença-os para quebrar a marca da vigília. É possível recuar e tentar novamente; suas almas serão preservadas.',[{label:'INICIAR VIGÍLIA',action:()=>{closeDialogue();o.active=true;o.wave=0;o.timer=.3;notify('A vigília começou.');}}]);}
  if(o.kind==='inscription')return dialogue('Inscrição na cinza',o.message);
  if(o.kind==='altar'){p.hp=p.max;p.mana=100;p.stamina=100;checkpoint={stage,x:o.x};litAltars.add(o.id);saveGame();tone(600,.6);burst(o.x,GROUND-40,'#ddc27c',20);return dialogue(o.name,'Vida e fervor restaurados. Seu progresso foi salvo. As almas e os selos conquistados permanecem após a morte.',[{label:'VIAJAR ENTRE ALTARES',action:openJournal}]);}
  if(o.kind==='cache'){o.taken=true;souls+=o.value;sfx('cast');notify('Relicário encontrado · +'+o.value+' almas');saveGame();return;}
  if(o.kind==='bell'){if(flags.bells)return notify('Os três sinos já cantam juntos.');const target=[2,1,3];bellSequence.push(o.value);tone(180+o.value*110,.8);if(o.value!==target[bellSequence.length-1]){bellSequence=[];notify('A sequência se desfez. A inscrição guarda a resposta.');}else if(bellSequence.length===3){flags.bells=true;notify('O Campanário se abriu.');saveGame()}else notify('Sino '+o.value+' · '+bellSequence.length+'/3');return;}
  if(o.kind==='vow'||o.kind==='shard'){if(o.kind==='shard'&&!p.double)return; o.taken=true;const count=r.objects.filter(x=>x.kind===o.kind&&x.taken).length,goal=o.kind==='vow'?3:2;flags[o.kind==='vow'?'vows':'echoes']=count===goal;notify((o.kind==='vow'?'Voto':'Fragmento do Eco')+' · '+count+'/'+goal);burst(o.x,o.y,'#b9ded5',25);saveGame();return;}
  if(o.kind==='echo'){o.taken=true;p.double=true;p.relic=true;notify('RELÍQUIA DO ECO · agora você pode saltar duas vezes.');tone(760,.8);saveGame();return;}
  if(o.kind==='crate'){o.x=o.start;notify('Relicário reposicionado. Empurre-o caminhando.');return;}
  if(o.kind==='seal'){const e=r.enemies.find(e=>e.guardian&&e.home===o.guardX);if(e&&e.hp>0)return notify('O carrasco ainda sustenta este selo.');o.taken=true;flags.wardens=r.objects.filter(x=>x.kind==='seal').every(x=>x.taken);notify(flags.wardens?'Os selos do Claustro se romperam.':'Selo do carrasco rompido.');saveGame();return;}
  if(o.kind==='mirror'){o.value=(o.value+1)%3;const mirrors=r.objects.filter(x=>x.kind==='mirror');flags.mirrors=mirrors.every((x,i)=>x.value===[1,0,2][i]);notify(flags.mirrors?'A luz atravessa o portão.':['SOL','LUA','ESTRELA'][o.value]);saveGame();return;}
  if(o.kind==='lever'){if(flags.clock)return notify('O relógio já foi silenciado.');clockLeft=18;notify('18 segundos · atravesse o portão e toque o selo.');sfx('block');return;}
  if(o.kind==='clockSeal'){if(clockLeft<=0&&!flags.clock)return notify('O tempo acabou. Reative a alavanca.');flags.clock=true;clockLeft=0;notify('O portão permanecerá aberto.');saveGame();return;}
  if(o.kind==='flame'){if(flags.flames)return;const count=r.objects.filter(x=>x.kind==='flame'&&x.lit).length;if(o.value!==3-count){for(const f of r.objects.filter(x=>x.kind==='flame'))f.lit=false;notify('A chama se apagou. Ordem: III → II → I.')}else{o.lit=true;flags.flames=count===2;notify(flags.flames?'O Sepulcro se abriu.':'Chama '+o.value+' acesa.');saveGame()}return;}
  if(o.kind==='arenaBell'){if(o.cooldown>0)return notify('O sino precisa se recompor.');o.cooldown=24;boss.stun=2;boss.wind=0;boss.swing=0;boss.breath=0;boss.dash=0;boss.volley=0;boss.flood=0;boss.cd=2.8;pillars=[];shots=shots.filter(s=>s.friendly);hit(boss,22);burst(boss.x+32,boss.y-60,'#dbe2b1',45);tone(180,1);notify('O sino interrompeu o Guardião.');return;}
 }
 if(stage<2&&p.x>r.door-75){if(r.gates.some(g=>!gateOpen(g)))return notify(objective());if(r.objects.some(o=>o.kind==='trial'&&!o.cleared))return notify('Complete as duas vigílias marcadas no diário antes de atravessar.');if(stage===1&&!p.double)return notify('Encontre a Relíquia do Eco.');travel(stage+1,120);return;}
 if(stage===1&&p.x<95)travel(0,rooms[0].door-100);
}
function dialogue(title,body,actions=[]){
 mode='dialogue';clearInput();overlay.hidden=false;overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');
 overlay.innerHTML='<div class="panel dialogue-panel"><div class="eyebrow">VÉSPERA · PEREGRINAÇÃO</div><h2>'+title+'</h2><p>'+body+'</p>'+actions.map((a,i)=>'<button class="primary" id="choice-'+i+'">'+a.label+'</button>').join('')+'<button class="secondary" id="dialogue-back">VOLTAR À JORNADA</button></div>';
 actions.forEach((a,i)=>document.getElementById('choice-'+i).onclick=a.action);document.getElementById('dialogue-back').onclick=closeDialogue;document.getElementById(actions.length?'choice-0':'dialogue-back').focus();
}
function closeDialogue(){mode='play';hideMenus();clearInput();p.inv=Math.max(p.inv,.4);}
function upgrade(kind){const level=kind==='damage'?damageLevel:armorLevel,costs=kind==='damage'?damageCosts:armorCosts;if(level>=costs.length||souls<costs[level])return false;souls-=costs[level];if(kind==='damage')damageLevel++;else armorLevel++;sfx('block');saveGame();return true;}
function openNPC(o){
 if(o.role==='guide')return dialogue(o.name,stage===0?'O sino calou os mortos, mas não sua fome. Defenda no instante do impacto para aparar; um clarão dourado marca os golpes que aceitam parry. O vermelho exige esquiva ou salto. Recolha as almas e procure Baltasar e Iria. Para deixar cada área, vença as duas vigílias assinaladas no diário.':'Um segundo salto repousa no Arquivo. A cripta exige luz, eco e tempo. Consulte o diário para recordar o caminho.',[{label:'SOBRE O CAMINHO',action:()=>dialogue(o.name,objective())},{label:'TALHO CONSAGRADO',action:()=>dialogue(o.name,'L / △ executa um corte baixo de curta distância, com os pés no chão. Consome 35 de fervor, acerta durante o arco da lâmina e não atravessa a sala. Depois de um parry, seu próximo golpe em até 2 segundos causa 50% mais dano.')}]);
 const kind=o.role,level=kind==='damage'?damageLevel:armorLevel,costs=kind==='damage'?damageCosts:armorCosts,max=level>=costs.length;
 const desc=kind==='damage'?'Cada têmpera acrescenta 4 de dano à espada e ao Talho Consagrado.':'Cada reforço reduz o dano recebido em 8%, até 32%.';
 dialogue(o.name,desc+'<br><span class="journal-objective">'+souls+' almas · nível '+level+'/'+costs.length+'</span>',[{label:max?'MELHORIA MÁXIMA':(kind==='damage'?'TEMPERAR ESPADA':'REFORÇAR ARMADURA')+' · '+costs[level]+' ALMAS',action:()=>{const ok=upgrade(kind);openNPC(o);if(!ok&&!max)document.querySelector('.dialogue-panel p').innerHTML+=' <br>Almas insuficientes.';}},{label:'PEDIR CONSELHO',action:()=>dialogue(o.name,objective(),[{label:'VOLTAR AO OFÍCIO',action:()=>openNPC(o)}])}]);
}
function openJournal(){
 const r=rooms[stage],pct=Math.round(p.x/r.width*100);let actions=[];
 if(stage<2)for(let s=0;s<2;s++)for(const a of rooms[s].objects.filter(o=>o.kind==='altar'&&litAltars.has(o.id))){actions.push({label:(s===stage?'':'CRIPTA / MOSTEIRO · ')+a.name,action:()=>{closeDialogue();travel(s,a.x);checkpoint={stage:s,x:a.x};saveGame();}})}
 dialogue('Diário da vigília','<span class="journal-objective">'+objective()+'</span><br>'+names[stage]+' · '+Math.floor(elapsed[stage]/60)+' min de jornada<br>'+r.objects.filter(o=>o.kind==='trial').map(o=>o.name+': '+(o.cleared?'concluída':Math.round(o.x/r.width*100)+'% do caminho')).join(' · ')+'<svg class="journal-map" viewBox="0 0 600 40" aria-label="Posição na área"><path d="M10 20 H590" stroke="#74674f"/>'+r.gates.map(g=>'<rect x="'+(10+g.x/r.width*580)+'" y="12" width="4" height="16" fill="'+(gateOpen(g)?'#8fbea9':'#bb7762')+'"/>').join('')+r.objects.filter(o=>o.kind==='trial').map(o=>'<path d="M'+(10+o.x/r.width*580)+' 7 l5 6 -5 6 -5 -6z" fill="'+(o.cleared?'#88c2af':'#db9968')+'"/>').join('')+'<circle cx="'+(10+pct*5.8)+'" cy="20" r="5" fill="#efe1b4"/></svg><small>◆ Você · barras: selos · losangos: vigílias · altares acesos: viagem rápida</small>',actions);mode='journal';
}
function saveGame(){try{if(typeof localStorage==='undefined')return;localStorage.setItem(SAVE_KEY,JSON.stringify({version:2,stage,checkpoint,souls,damageLevel,armorLevel,flags,double:p.double,lit:[...litAltars],elapsed,introSeen,kills,dead:rooms.flatMap(r=>r.enemies.filter(e=>e.hp<=0).map(e=>e.id)),objects:rooms.flatMap(r=>r.objects.filter(o=>o.kind!=='arenaBell').map(o=>({id:o.id,taken:!!o.taken,value:o.value,lit:!!o.lit,cleared:!!o.cleared,x:o.x}))),orbs}));}catch{notify('O navegador não permitiu salvar. A jornada continua nesta sessão.')}}
function loadGame(){try{
 const data=JSON.parse(localStorage.getItem(SAVE_KEY));if(data?.version!==2||!Number.isInteger(data.stage)||data.stage<0||data.stage>2)return false;
 reset();stage=data.stage;checkpoint=data.checkpoint&&data.checkpoint.stage===stage?data.checkpoint:{stage,x:120};p.x=Math.max(20,Math.min(rooms[stage].width-40,Number(checkpoint.x)||120));p.double=!!data.double;p.relic=p.double;souls=Math.max(0,Number(data.souls)||0);damageLevel=Math.max(0,Math.min(5,Number(data.damageLevel)||0));armorLevel=Math.max(0,Math.min(4,Number(data.armorLevel)||0));flags=data.flags||{};elapsed=data.elapsed||[0,0,0];litAltars=new Set(data.lit||[]);introSeen=!!data.introSeen;kills=data.kills||0;
 for(const r of rooms){for(const e of r.enemies)if((data.dead||[]).includes(e.id)){e.hp=0;e.rewarded=true;}for(const o of r.objects){const d=(data.objects||[]).find(x=>x.id===o.id);if(d){o.taken=d.taken;o.lit=d.lit;o.cleared=!!d.cleared;if(Number.isFinite(d.value))o.value=d.value;if(o.kind==='crate'&&Number.isFinite(d.x))o.x=d.x;}}}
 orbs=(data.orbs||[]).filter(o=>Number.isFinite(o.x)&&Number.isFinite(o.value));cam=Math.max(0,Math.min(rooms[stage].width-W,p.x-300));if(stage===2){makeBoss();if(flags.victory){boss.hp=0;mode='win';show('O silêncio se rompeu','Esta peregrinação já foi concluída.','NOVA PEREGRINAÇÃO',reset);}else if(!introSeen)beginIntro()}notify('Peregrinação retomada no último altar.');return true;
 }catch{return false}}
function installContinue(){try{if(!localStorage.getItem(SAVE_KEY))return;const btn=document.createElement('button');btn.className='secondary';btn.textContent='CONTINUAR PEREGRINAÇÃO';btn.onclick=()=>{if(audioPreferencesChosen)initAudio();else enableAudio();if(!loadGame())notify('Não foi possível ler a jornada salva.');};document.getElementById('start').insertAdjacentElement('beforebegin',btn);}catch{}}
function makeBoss(){boss={x:1040,y:GROUND,w:64,h:113,hp:700,max:700,dir:-1,cd:1.8,wind:0,flash:0,phase:1,kind:0,cycles:0,gait:0,motion:0,swing:0,hurt:0,windMax:1,enrage:0,dash:0,dashHit:false,volley:0,aim:0,stun:0,breath:0,flood:0,attackClock:0,emitted:false};}
function travel(s,x){cancelTrials();stage=s;p.x=x;p.y=GROUND-p.h;p.vy=0;p.vx=0;p.inv=1.4;p.on=true;p.action=null;p.attack=0;p.cast=0;p.block=false;p.guardHeld=false;cam=Math.max(0,Math.min(rooms[s].width-W,x-300));shots=[];pillars=[];boss=null;visited.add(s);checkpoint={stage:s,x:s===2?120:x};clockLeft=0;lastDistrict='';if(s===2){makeBoss();if(!introSeen)beginIntro();}else notify(names[s]);saveGame();}
function respawn(){cancelTrials();const cp={...checkpoint};p.hp=p.max;p.mana=100;p.stamina=100;p.inv=1.5;p.vx=0;p.vy=0;p.y=GROUND-p.h;p.x=cp.x;stage=cp.stage;p.attack=0;p.cast=0;p.action=null;p.cd=0;p.specialCd=0;p.jumps=0;p.land=0;p.hurt=0;p.guard=0;p.block=false;p.guardHeld=false;p.parry=0;p.parryCd=0;p.riposte=0;cam=Math.max(0,Math.min(rooms[stage].width-W,p.x-300));shots=[];pillars=[];clockLeft=0;clearInput();if(stage===2){makeBoss();for(const o of rooms[2].objects)o.cooldown=0;}else for(const e of rooms[stage].enemies)if(e.hp>0){e.hp=e.max;e.x=e.home;e.y=e.homeY;e.dash=0;e.wind=0;e.swing=0;e.cd=1;e.stun=0;}mode='play';hideMenus();saveGame();}
function hit(e,damage){if(e.hp<=0||(e===boss&&e.enrage>0))return;e.hp=Math.max(0,e.hp-damage);e.flash=.15;e.hurt=.3;burst(e.x+e.w/2,e.y-e.h/2,'#b59567');sfx('hit');if(e.hp<=0){e.death=.9;sfx(e===boss?'roar':'death');kills++;p.mana=Math.min(100,p.mana+7);if(e===boss){pillars=[];shots=[];mode='win';flags.victory=true;saveGame();show('O silêncio se rompeu','O último sino volta a soar. '+kills+' criaturas derrotadas · '+souls+' almas guardadas.','NOVA PEREGRINAÇÃO',reset);tone(460,.9);}else if(!e.rewarded){e.rewarded=true;orbs.push({x:e.x+13,y:e.y-28,vx:(Math.random()-.5)*80,vy:-125,age:0,stage,value:e.guardian?22:e.type==='warden'?10:7});saveGame();}}}
function hurt(damage,sourceX,unblockable=false,attacker=null){
 if(p.inv>0||mode!=='play')return 'immune';const facing=(sourceX-(p.x+11))*p.dir>=0;
 if(!unblockable&&p.block&&facing&&p.parry>0){p.parry=0;p.inv=.24;p.stamina=Math.min(100,p.stamina+20);p.mana=Math.min(100,p.mana+12);p.riposte=2;if(attacker){attacker.stun=attacker===boss?.9:1.4;attacker.wind=0;attacker.swing=0;attacker.dash=0;attacker.cd=1.4;}burst(p.x+11+p.dir*18,p.y+22,'#fff0b1',28);sfx('block');tone(1100,.25);shake=3;notify('PARRY · próximo golpe fortalecido');return 'parry';}
 if(!unblockable&&p.block&&facing&&p.stamina>=20){p.stamina-=20;p.inv=.16;burst(p.x+p.dir*18,p.y+22,'#d8d8b9');sfx('block');return 'block';}
 p.hp-=Math.max(1,Math.round(damage*(1-armorLevel*.08)));p.hurt=.28;p.inv=.95;p.action=null;p.attack=0;p.cast=0;shake=6;burst(p.x,p.y+20,'#a74745');sfx('hit');if(p.hp<=0){p.hp=0;mode='dead';sfx('death');pillars=[];show('A cinza se lembra','Seus selos, melhorias e almas permanecem. Erga-se no último altar.','RESSURGIR',respawn);}return 'hit';
}
function startAction(special=false){if(special&&!p.on){notify('O Talho Consagrado exige apoio no chão.');return false;}if(p.action||p.block||p.cd>0||(special&&(p.mana<35||p.specialCd>0)))return false;const duration=special?.64:.48;p.action={special,air:!p.on,age:0,duration,dir:p.dir,hits:new Set(),riposte:p.riposte>0?1.5:1};p.riposte=0;p.cd=duration+.09;p.attack=duration;if(special){p.mana-=35;p.cast=duration;p.specialCd=1.6;}sfx('swipe');return true;}
function updateAction(dt){const a=p.action;if(!a)return;a.age+=dt;p.attack=Math.max(0,a.duration-a.age);p.cast=a.special?p.attack:0;const begin=a.air&&!a.special?.32:.16,end=a.air&&!a.special?.44:.32;
 if(a.age>=begin&&a.age<=end)for(const e of [...rooms[stage].enemies,...(boss?[boss]:[])]){const dx=e.x+e.w/2-(p.x+11),dy=e.y-e.h/2-(p.y+(a.special?35:24));if(e.hp>0&&!a.hits.has(e)&&dx*a.dir>-12&&dx*a.dir<(a.special?90:74)&&Math.abs(dy)<(a.special?48:55)){a.hits.add(e);hit(e,Math.round(((a.special?32:25)+damageLevel*4)*a.riposte));}}
 if(a.age>=a.duration){p.action=null;p.attack=0;p.cast=0;}
}
function updateOrbs(dt){for(const o of orbs){if(o.stage!==stage)continue;o.age+=dt;const dx=p.x+11-o.x,dy=p.y+22-o.y,dist=Math.hypot(dx,dy);if(dist<150||o.age>8){const speed=Math.min(620,180+o.age*60);o.vx=dx/Math.max(1,dist)*speed;o.vy=dy/Math.max(1,dist)*speed;}else{o.vy+=400*dt;o.vx*=Math.pow(.1,dt);if(o.y>GROUND-12){o.y=GROUND-12;o.vy=-Math.abs(o.vy)*.25;}}o.x+=o.vx*dt;o.y+=o.vy*dt;if(dist<22){o.collected=true;souls+=o.value;tone(850,.12,'sine',.025);burst(o.x,o.y,'#a6e2d0',7);}}
 if(orbs.some(o=>o.collected)){orbs=orbs.filter(o=>!o.collected);saveGame();}}
function cancelTrials(){for(const r of rooms){for(const o of r.objects)if(o.kind==='trial'&&o.active){o.active=false;o.wave=0;o.timer=0;}r.enemies=r.enemies.filter(e=>!e.trial);}}
function updateTrials(dt){const r=rooms[stage];for(const o of r.objects.filter(o=>o.kind==='trial'&&o.active)){
 if(Math.abs(p.x-o.x)>650){o.active=false;o.wave=0;r.enemies=r.enemies.filter(e=>e.trial!==o.id);notify('Você deixou a vigília. Retorne para tentar novamente.');continue;}
 if(r.enemies.some(e=>e.trial===o.id&&e.hp>0))continue;
 o.timer-=dt;if(o.timer>0)continue;
 if(o.wave===3){o.cleared=true;o.active=false;souls+=20;p.hp=Math.min(p.max,p.hp+25);notify('VIGÍLIA CONCLUÍDA · +20 almas · vida restaurada');saveGame();continue;}
 const formations=[['hound','pilgrim'],['acolyte','warden'],['hound','wraith','warden']];const formation=formations[o.wave];formation.forEach((type,i)=>{const e=enemy(o.x+(i%2?230:-230)+(i===2?90:0),type==='wraith'?335:GROUND,type);e.id=o.id+'-'+o.wave+'-'+i;e.trial=o.id;e.stun=0;e.hp=e.max=Math.round(e.max*(1.3+stage*.15));r.enemies.push(e);burst(e.x,e.y-25,'#c9b286',22);});o.wave++;o.timer=1.5;notify(o.name+' · grupo '+o.wave+'/3');
}}
function updateEnemies(dt){for(const e of rooms[stage].enemies){e.flash=Math.max(0,e.flash-dt);e.hurt=Math.max(0,e.hurt-dt);e.cd-=dt;if(e.hp<=0){e.death=Math.max(0,e.death-dt);continue;}if(Math.abs(e.x-p.x)>900){e.wind=0;e.swing=0;e.dash=0;continue;}if(e.stun>0){e.stun-=dt;e.motion=0;continue;}
 const oldX=e.x,dx=p.x-e.x,near=Math.abs(dx)<480,vertical=Math.abs(p.y+p.h-e.y);if(e.wind<=0&&e.swing<=0&&e.dash<=0)e.dir=dx>0?1:-1;
 if(e.type==='wraith')e.y+=(Math.max(240,Math.min(430,p.y+35+Math.sin(time*2+e.home)*14))-e.y)*dt*1.4;
 if(e.dash>0){e.dash-=dt;const nx=e.x+e.dir*(e.type==='hound'?340:235)*dt;if(e.type==='wraith'||groundAt(nx+13))e.x=nx;if(Math.abs(p.x-e.x)<43&&vertical<65&&!e.dashHit){e.dashHit=true;hurt(18,e.x,false,e);}if(e.dash<=0){e.swing=.2;e.y=e.homeY;}}
 else if(e.wind>0){e.wind-=dt;if(e.wind<=0){if(e.type==='hound'||e.type==='wraith'){e.dash=.42;e.dashHit=false;e.cd=1.8;sfx('swipe');}else{e.swing=.55;e.fired=false;e.cd=e.type==='acolyte'?2.7:1.9;}}}
 else if(e.swing>0){e.swing=Math.max(0,e.swing-dt);if(e.swing<.38&&!e.fired){e.fired=true;const ranged=e.type==='acolyte'||e.type==='pilgrim'||e.type==='warden',sx=e.x+13+e.dir*24,sy=e.y-(e.type==='acolyte'?32:45);if(ranged){const close=(p.x+11-e.x-13)*e.dir;if(close>-10&&close<78&&vertical<65){hurt(e.type==='warden'?22:16,e.x,false,e);sfx('swipe');continue;}const angle=Math.atan2(p.y+24-sy,p.x+11-sx),count=e.type==='warden'?3:1;for(let i=0;i<count;i++){const a=angle+(i-(count-1)/2)*.16;shots.push({x:sx,y:sy,vx:Math.cos(a)*(e.type==='acolyte'?225:275),vy:Math.sin(a)*225,life:e.type==='acolyte'?2.5:1.15,friendly:false,damage:e.type==='warden'?22:16,color:e.type==='acolyte'?'#b590e3':'#eba16d',owner:e});}sfx('cast');}}}
 else if(near&&e.cd<=0&&vertical<190&&(Math.abs(dx)<(e.type==='hound'?180:e.type==='wraith'?145:360))){e.wind=e.type==='hound'?.6:e.type==='wraith'?.65:.8;e.windMax=e.wind;}
 else if(near){const distance=['pilgrim','warden','acolyte'].includes(e.type)?190:55;const direction=Math.abs(dx)>distance?e.dir:0,nx=e.x+direction*(e.type==='hound'?105:e.type==='wraith'?70:e.type==='acolyte'?50:0)*dt;const blocked=rooms[stage].gates.some(g=>!gateOpen(g)&&(e.x-g.x)*(nx-g.x)<=0);if(!blocked&&(e.type==='wraith'||groundAt(nx+13)))e.x=nx;}
 e.x=Math.max(25,Math.min(rooms[stage].width-40,e.x));e.motion+=(Math.abs(e.x-oldX)/dt/90-e.motion)*Math.min(1,dt*9);e.gait+=dt*(1+e.motion*9);
}}
function updateBoss(dt){if(!boss||boss.hp<=0)return;const b=boss;b.flash=Math.max(0,b.flash-dt);b.hurt=Math.max(0,b.hurt-dt);b.cd-=dt;
 if(b.hp<=b.max*.5&&b.phase===1){b.phase=2;b.enrage=2.2;b.wind=0;b.swing=0;b.cd=3;b.cycles=0;b.dash=0;b.volley=0;b.breath=0;b.flood=0;b.stun=0;pillars=[];shots=shots.filter(s=>s.friendly);p.inv=Math.max(p.inv,2.4);notify('SEGUNDA VIGÍLIA · a cripta arde.');burst(b.x+32,b.y-70,'#ed9563',70);sfx('roar');}
 if(b.enrage>0){b.enrage=Math.max(0,b.enrage-dt);return;}if(b.stun>0){b.stun-=dt;return;}
 if(b.volley>0){b.volley-=dt;if(b.volley<=0)bossVolley(b);}
 if(b.flood>0){b.flood-=dt;if(p.y+p.h>GROUND-32)hurt(24,b.x,true);}
 if(b.breath>0){b.breath-=dt;const dx=(p.x+11-(b.x+32))*b.dir;if(dx>0&&dx<300&&p.y+p.h>b.y-76&&p.y<b.y-18)hurt(26,b.x+32,true);}
 if(b.dash>0){b.dash-=dt;b.x=Math.max(100,Math.min(1250,b.x+b.dir*670*dt));if(!b.dashHit&&Math.abs(p.x+11-(b.x+32))<64&&p.y+p.h>GROUND-65){b.dashHit=true;hurt(32,b.x+32,true,b);}if(b.dash<=0){b.swing=.45;b.cd=1.35;}return;}
 if(b.wind>0){b.wind-=dt;if(b.wind<=0){b.swing=b.kind===5?1.2:.8;b.attackClock=0;b.emitted=false;}return;}
 if(b.swing>0){b.swing-=dt;b.attackClock+=dt;if(!b.emitted&&b.attackClock>=.18){b.emitted=true;
  if(b.kind===0){const dx=(p.x+11-b.x-32)*b.dir;if(dx>-25&&dx<110&&p.y+p.h>b.y-90)hurt(b.phase===2?34:28,b.x+32,false,b);sfx('swipe');}
  if(b.kind===1){for(const dir of [-1,1])shots.push({x:b.x+32,y:GROUND-18,vx:dir*(b.phase===2?320:240),life:5,friendly:false,damage:25,owner:b});sfx('slam');}
  if(b.kind===2){const offsets=b.phase===2?[-240,-120,0,120,240]:[-145,0,145];offsets.forEach((x,i)=>pillars.push({x:Math.max(65,Math.min(1330,b.target+x)),age:-1-i*.18,delay:1+i*.18,hit:false,fired:false}));sfx('cast');}
  if(b.kind===3){b.dash=.58;b.dashHit=false;b.swing=0;sfx('roar');}
  if(b.kind===4){bossVolley(b);b.volley=.45;}
  if(b.kind===5){b.breath=.95;sfx('roar');}
  if(b.kind===6){b.flood=3.8;sfx('slam');}
  if(b.kind===7){for(const f of rooms[2].platforms)pillars.push({x:f.x+f.w/2,age:-1.1,delay:1.1,hit:false,fired:false});sfx('cast');}
 }return;}
 if(b.cd<=0){const pattern=b.phase===2?[6,4,3,5,7,0,2,1]:[0,5,1,2,0,4];b.kind=pattern[b.cycles++%pattern.length];b.dir=p.x>b.x?1:-1;b.wind=b.kind===6?1.6:b.kind===7?1.25:b.phase===2?.85:1.1;b.windMax=b.wind;b.cd=b.wind+(b.kind===6?5.1:b.kind===5?2.9:2.2);b.target=p.x+11;b.aim=Math.atan2(p.y+24-(b.y-84),p.x+11-(b.x+32));
 const warnings=['Garras · clarão dourado: pode aparar.','Ondas de cinza · salte ou apare.','Réquiem · saia dos círculos.','Investida · salte ou suba.','Coro da Ruína · projéteis podem ser aparados.','Sopro profano · passe por trás ou suba.','MARÉ DE BRASAS · procure as plataformas!','Profanação dos altares · deixe as plataformas marcadas!'];notify(warnings[b.kind]);tone(90,.3);return;}
 b.dir=p.x>b.x?1:-1;if(Math.abs(p.x-b.x)>110)b.x+=b.dir*(b.phase===2?110:65)*dt;b.x=Math.max(120,Math.min(1240,b.x));b.gait+=dt*5;
}
function update(dt){time+=dt;toastTime=Math.max(0,toastTime-dt);shake=Math.max(0,shake-dt*22);for(const f of particles){f.x+=f.vx*dt;f.y+=f.vy*dt;f.vy+=240*dt;f.life-=dt;}particles=particles.filter(f=>f.life>0);
 if(mode==='intro'){introTime+=dt;if(introTime>=8.8||(introTime>.5&&pressed.Space))finishIntro();return;}if(mode!=='play')return;
 const r=rooms[stage];elapsed[stage]+=dt;saveClock+=dt;if(saveClock>10){saveClock=0;saveGame();}
 for(const key of ['specialCd','stepTime','inv','cd','parry','parryCd','riposte','hurt'])p[key]=Math.max(0,p[key]-dt);
 const guard=held('KeyK');p.block=!!(guard&&p.stamina>2&&!p.action);if(p.block&&!p.guardHeld&&p.parryCd===0){p.parry=.18;p.parryCd=.6;}if(!p.block)p.parry=0;p.guardHeld=guard;
 p.stamina=Math.min(100,p.stamina+dt*(p.block?5:28));p.mana=Math.min(100,p.mana+dt*2.5);
 const move=((keys.KeyD||keys.ArrowRight?1:0)-(keys.KeyA||keys.ArrowLeft?1:0))||padAxis;if(move&&!p.action)p.dir=Math.sign(move);p.vx=move*(p.block?75:p.action?95:225);p.coyote=p.on?.1:Math.max(0,p.coyote-dt);
 if((pressed.Space||pressed.KeyW||pressed.ArrowUp)&&!p.action?.special){if(p.on||p.coyote>0||(p.double&&p.jumps<2)){p.vy=-540;p.jumps=p.on||p.coyote>0?1:2;p.on=false;p.coyote=0;if(p.action)p.action.air=true;tone(p.jumps===2?390:270,.13);}}
 if(pressed.KeyJ)startAction();if(pressed.KeyL)startAction(true);updateAction(dt);
 const oldX=p.x,oldBottom=p.y+p.h,wasGrounded=p.on,fallSpeed=p.vy;p.x=Math.max(15,Math.min(r.width-35,p.x+p.vx*dt));
 for(const g of r.gates)if(!gateOpen(g)&&p.x+p.w>g.x-10&&p.x<g.x+10){p.x=oldX<g.x?g.x-10-p.w:g.x+10;}
 const crate=r.objects.find(o=>o.kind==='crate');if(crate&&!flags.weight&&p.y+p.h>GROUND-45&&p.x+p.w>crate.x-22&&p.x<crate.x+22){crate.x=Math.max(crate.start-100,Math.min(11920,crate.x+(p.x-oldX)));p.x=move>0?crate.x-22-p.w:crate.x+22;const plate=r.objects.find(o=>o.kind==='plate');if(Math.abs(crate.x-plate.x)<18){flags.weight=true;notify('A comporta do aqueduto se abriu.');saveGame();}}
 p.vy+=1250*dt;p.y+=p.vy*dt;p.on=false;if(p.vy>=0){const floors=[...r.platforms,...(groundAt(p.x+11)?[platform(0,GROUND,r.width)]:[])];for(const f of floors)if(p.x+p.w>f.x&&p.x<f.x+f.w&&oldBottom<=f.y+1&&p.y+p.h>=f.y){p.y=f.y-p.h;p.vy=0;p.on=true;p.jumps=0;break;}}
 if(p.on&&!wasGrounded&&fallSpeed>150){p.land=Math.min(1,fallSpeed/650);burst(p.x+11,p.y+48,'#8c8c7b',5);}if(p.y>H+150){p.inv=0;hurt(22,p.x,true);if(mode==='play'){p.x=checkpoint.x;p.y=GROUND-p.h;p.vy=0;p.inv=1.5;}}
 if(pressed.KeyE)interact();if(pressed.KeyM)openJournal();if(mode!=='play')return;
 if(clockLeft>0){clockLeft=Math.max(0,clockLeft-dt);if(clockLeft===0&&!flags.clock){const g=r.gates.find(g=>g.key==='clock');if(g&&p.x>g.x-40){p.x=12400;p.y=GROUND-p.h;p.vx=0;p.vy=0;p.inv=1.2;shots=[];}notify('O relógio parou. Reative a alavanca.');}}
 for(const o of r.objects)if(o.cooldown>0)o.cooldown=Math.max(0,o.cooldown-dt);
 updateTrials(dt);updateEnemies(dt);updateBoss(dt);updatePillars(dt);updateOrbs(dt);
 for(const s of shots){s.x+=s.vx*dt;s.y+=(s.vy||0)*dt;s.life-=dt;if(s.friendly){s.hit=s.hit||new Set();for(const e of [...r.enemies,...(boss?[boss]:[])])if(e.hp>0&&!s.hit.has(e)&&s.x>e.x-22&&s.x<e.x+e.w+22&&s.y>e.y-e.h-15&&s.y<e.y+15){s.hit.add(e);hit(e,s.damage||18);s.life=0;}}
 else if(Math.abs(s.x-(p.x+11))<25&&s.y>p.y-8&&s.y<p.y+p.h+8){const result=hurt(s.damage||23,s.x,false,s.owner);if(result==='parry'){s.friendly=true;s.vx=-s.vx*1.25;s.vy=-(s.vy||0);s.damage=25+damageLevel*2;s.hit=new Set();s.life=2;s.x=p.x+11+p.dir*35;}else s.life=0;}}
 shots=shots.filter(s=>s.life>0);if(p.on&&Math.abs(p.vx)>80&&p.stepTime===0){sfx('step');p.stepTime=.28;}p.gait+=dt*(4+Math.abs(p.vx)*.064);p.run+=(Math.abs(p.vx)/225-p.run)*Math.min(1,dt*12);p.guard+=((p.block?1:0)-p.guard)*Math.min(1,dt*20);p.land=Math.max(0,p.land-dt*5);
 const district=stage<2?districts[stage][Math.min(5,Math.floor(p.x/3500))]:names[2];if(lastDistrict!==district){lastDistrict=district;if(toastTime===0)notify(district);}
 cam+=(Math.max(0,Math.min(r.width-W,p.x-W*.38))-cam)*Math.min(1,dt*7);
}
function assetPlayer(){let name='heroIdle',frame=Math.floor(time*7)%4,scale=1.22,y=p.y+p.h+2,dir=p.dir;
 if(p.action){const a=p.action;dir=a.dir;name=a.special?'heroSpecial':a.air?'heroAir':'heroAttack';frame=Math.min(art[name].frames-1,Math.floor(a.age/a.duration*art[name].frames));if(a.special)scale=1.5;}
 else if(p.hurt>0){name='heroHurt';frame=Math.min(2,Math.floor((.28-p.hurt)*12));}else if(p.block){name='heroCrouch';frame=1;}else if(!p.on){name='heroJump';frame=p.vy<-260?1:p.vy<0?2:p.vy<260?3:4;}else if(p.run>.12){name='heroRun';frame=Math.floor(p.gait*.75)%12;}
 const ok=anchoredSprite(name,p.x+11,y,scale,frame,dir,p.inv>0?.6+.4*Math.sin(time*35)**2:1);
 if(p.block){ctx.save();ctx.translate(p.x+11+p.dir*15,p.y+28);ctx.scale(p.dir,1);shape([[-4,-10],[7,-12],[11,-5],[8,10],[2,15],[-5,5]],p.parry>0?'#fff0b1':'#779895');limb(2,-7,0,16,1.6,'#e4cea0');ctx.restore();}if(p.riposte>0){ctx.strokeStyle='#f4d486';ctx.beginPath();ctx.arc(p.x+11,p.y+25,30,0,Math.PI*2);ctx.stroke();}return ok;
}
function assetEnemy(e){if(e.hp<=0&&e.death<=0)return true;let name,frame=0,scale=1,dir=-e.dir,y=e.y+3;
 if(e.type==='hound'){name=e.dash>0?'houndJump':e.motion>.1?'houndRun':'houndIdle';frame=e.dash>0?Math.min(5,Math.floor((.42-e.dash)/.42*6)):Math.floor(e.gait*1.5)%(name==='houndRun'?5:8);scale=1.55;if(e.dash>0)y-=Math.sin((.42-e.dash)/.42*Math.PI)*14;}
 else if(e.type==='acolyte'){name=e.wind>0||e.swing>0?'ghostCast':'ghostIdle';frame=e.wind>0?Math.min(1,Math.floor((1-e.wind/.8)*2)):e.swing>0?2+Math.min(1,Math.floor((.55-e.swing)/.55*2)):Math.floor(time*7)%7;scale=.85;dir=e.dir;}
 else if(e.type==='wraith'){name='skull';frame=Math.floor(time*10)%8;scale=.57;}
 else{name=e.wind>0||e.swing>0?'beastCast':'beastIdle';frame=e.wind>0?Math.min(1,Math.floor((1-e.wind/.8)*2)):e.swing>0?2+Math.min(1,Math.floor((.55-e.swing)/.55*2)):Math.floor(e.gait)%6;scale=e.type==='warden'?1.28:1.05;}
 if(e.hp<=0&&(e.type==='pilgrim'||e.type==='warden')){name='beastDeath';frame=Math.min(5,Math.floor((.9-e.death)/.9*6));}ctx.save();if(e.flash>0)ctx.filter='brightness(1.8)';else if(e.type==='warden')ctx.filter='sepia(.4) saturate(.7)';if(e.hp<=0&&name!=='beastDeath'){ctx.translate(e.x+13,e.y);ctx.rotate((1-e.death/.9)*e.dir*1.3);ctx.translate(-e.x-13,-e.y);}const ok=sprite(name,e.x+13,y,scale,frame,dir,e.hp<=0?e.death/.9:1);ctx.restore();
 if(e.wind>0){text('✧',e.x+13,e.y-e.h-27,24,'#f0cb82','center');}if(e.stun>0)text('✦',e.x+13,e.y-e.h-20,14,'#d8f2eb','center');if(e.hp>0&&e.hp<e.max){rect(e.x-5,e.y-e.h-12,36,2,'#292a30');rect(e.x-5,e.y-e.h-12,36*e.hp/e.max,2,'#ae6b63');}return ok;
}
function assetBoss(b){if(b.hp<=0)return true;const active=b.wind>0||b.swing>0||b.breath>0,name=b.kind===5&&active?'demonBreath':active?'demonAttack':'demonIdle';let frame=Math.floor(time*5)%6;
 if(active){if(b.kind===5)frame=b.wind>0?Math.min(5,Math.floor((1-b.wind/b.windMax)*6)):6+Math.min(4,Math.floor(b.attackClock/1.2*5));else frame=b.wind>0?Math.min(2,Math.floor((1-b.wind/b.windMax)*3)):3+Math.min(4,Math.floor(b.attackClock/.8*5));}
 ctx.save();if(b.flash>0)ctx.filter='brightness(2)';else if(b.phase===2)ctx.filter='sepia(.3) saturate(1.6)';if(b.stun>0)ctx.globalAlpha=.75;const ok=anchoredSprite(name,b.x+32,b.y-3+Math.sin(time*2)*3,b.phase===2?1.05:.95,frame,-b.dir);ctx.restore();
 if(b.wind>0){const red=[3,5,6,7].includes(b.kind);text(red?'!':'✧',b.x+32,b.y-159,27,red?'#ec765e':'#efd295','center');if(b.kind===5){rect(b.dir>0?b.x+32:b.x-268,b.y-76,300,58,'#dd665522');}if(b.kind===6){rect(cam,GROUND-30,W,30,'#dd665533');text('SUBA',cam+W/2,GROUND-45,15,'#efaa83','center');}if(b.kind===7)for(const f of rooms[2].platforms){rect(f.x,f.y-5,f.w,5,'#ee796a');text('!',f.x+f.w/2,f.y-20,20,'#e99c7f','center');}}
 if(b.breath>0){const left=b.dir>0?b.x+45:b.x-265,g=ctx.createLinearGradient(left,0,left+300,0);g.addColorStop(0,b.dir>0?'#99eeebbb':'#6be0e300');g.addColorStop(1,b.dir>0?'#6be0e300':'#99eeebbb');ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(b.x+32,b.y-57);for(let i=0;i<=12;i++){const x=b.x+32+b.dir*(i*24),y=b.y-51-Math.sin(time*18-i*.6)*12-i*.7;ctx.lineTo(x,y);}for(let i=12;i>=0;i--)ctx.lineTo(b.x+32+b.dir*i*24,b.y-25+Math.sin(time*14-i)*9);ctx.closePath();ctx.fill();}
 if(b.flood>0){for(let x=Math.floor(cam/20)*20;x<cam+W;x+=20)shape([[x,GROUND],[x+7,GROUND-25-Math.sin(time*13+x)*8],[x+20,GROUND]],'#eb8759');}
 if(b.enrage>0){ctx.strokeStyle='#f4b176';ctx.beginPath();ctx.arc(b.x+32,b.y-70,45+(2.2-b.enrage)*60,0,Math.PI*2);ctx.stroke();}return ok;
}
function assetBackground(){if(!ready('castleBG'))return false;ctx.save();ctx.imageSmoothingEnabled=false;rect(0,0,W,H,stage===1?'#10141d':'#12212b');
 const district=Math.floor(p.x/3500),outdoor=stage===0&&[0,2,3].includes(district);
 if(outdoor){const g=ctx.createLinearGradient(0,0,0,GROUND);g.addColorStop(0,'#0b1725');g.addColorStop(1,'#576065');ctx.fillStyle=g;ctx.fillRect(0,0,W,GROUND);ctx.fillStyle='#c5c5ab';ctx.beginPath();ctx.arc(735-cam*.015%120,105,34,0,Math.PI*2);ctx.fill();for(const [id,scale,parallax]of [['mountainBG',3,.12],['townBG',2.1,.3]])if(ready(id)){const img=art[id].img,width=img.naturalWidth*scale,offset=cam*parallax%width;for(let x=-offset-width;x<W;x+=width)ctx.drawImage(img,x,GROUND-img.naturalHeight*scale,width,img.naturalHeight*scale);}}
 else{const bg=art.castleBG.img,scale=1.5,width=bg.naturalWidth*scale,offset=cam*.32%width;for(let x=-offset-width;x<W;x+=width)ctx.drawImage(bg,x,GROUND-bg.naturalHeight*scale,width,bg.naturalHeight*scale);rect(0,0,W,GROUND,stage===1?['#111b3540','#16353640','#281c3340'][district%3]:'#321e3340');}
 for(let i=0;i<35;i++)rect(((i*127+time*8-cam*.3)%W+W)%W,(i*67+Math.sin(time+i)*8)%450,1,2,'#d7c48b55');ctx.restore();return true;
}
function drawWorldObjects(){const r=rooms[stage];for(const g of r.gates){if(g.x<cam-80||g.x>cam+W+80)continue;rect(g.x-15,75,30,380,'#283139');for(let y=95;y<GROUND;y+=38){rect(g.x-19,y,38,8,gateOpen(g)?'#607566':'#a38a61');}if(!gateOpen(g)){for(let x=g.x-40;x<g.x+45;x+=14)rect(x,70,4,GROUND-70,'#bc936c');text('SELO',g.x,65,10,'#dbc899','center');}}
 for(const o of r.objects){if(o.taken||o.x<cam-100||o.x>cam+W+100)continue;const x=o.x,y=o.y;
 if(o.kind==='altar'){arch(x-25,y-77,50,77,'#20292e');rect(x-28,y-14,56,14,'#737572');candle(x-19,y-28);candle(x+19,y-28);text('✧',x,y-52,35,litAltars.has(o.id)?'#e6ca85':'#7e887e','center');}
 else if(o.kind==='npc'){ctx.save();ctx.translate(x,y);const sway=Math.sin(time*2+x)*1.5;shape([[-13,0],[-9,-34],[-12,-48],[0,-60],[12,-47],[9,-33],[16,0]],o.role==='armor'?'#566769':'#6d5559');shape([[-6,-46],[1,-51],[7,-44],[5,-33],[-5,-33]],'#ae9c7c');rect(-2,-43,8,3,'#263439');limb(11,-35,.1+sway*.025,26,3,'#9b8765');rect(17,y-y-49,3,50,'#947a52');text('◇',0,-72+sway,20,'#e3cc93','center');ctx.restore();}
 else if(o.kind==='crate'){rect(x-22,y-44,44,44,'#504139');ctx.strokeStyle='#c2a574';ctx.strokeRect(x-22,y-44,44,44);text('†',x,y-12,30,'#bc9c6c','center');}
 else if(o.kind==='plate'){rect(x-35,y-5,70,5,flags.weight?'#a0cbb7':'#b99356');}
 else if(o.kind==='trial'){arch(x-32,y-91,64,91,'#34403e');rect(x-40,y-12,80,12,'#786b56');text(o.cleared?'✧':'⚔',x,y-45,29,o.cleared?'#a5dbbf':'#e0ac76','center');text(o.cleared?'VIGÍLIA VENCIDA':o.active?'GRUPO '+o.wave+'/3':'VIGÍLIA',x,y-109,11,'#d8c498','center');}
 else if(o.kind==='inscription'){rect(x-22,y-60,44,60,'#58605e');for(let i=0;i<4;i++)rect(x-13,y-47+i*9,26-i*3,2,'#beb196');text('…',x,y-70,17,'#e2ce9e','center');}
 else if(o.kind==='bell'||o.kind==='arenaBell'){rect(x-3,y-85,6,50,'#967e52');arch(x-17,y-48,34,35,o.cooldown>0?'#69665d':'#baa16a');rect(x-22,y-14,44,5,'#d5b875');text(o.kind==='bell'?['','I','II','III'][o.value]:o.cooldown>0?Math.ceil(o.cooldown)+'s':'SINO',x,y-98,12,'#e8d5a5','center');}
 else if(o.kind==='mirror'){rect(x-3,y-65,6,65,'#8a7960');ctx.strokeStyle='#c1b585';ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(x,y-59,24,30,0,0,Math.PI*2);ctx.stroke();text(['☀','☾','✧'][o.value],x,y-50,27,'#b7d9d4','center');}
 else if(o.kind==='lever'){rect(x-18,y-23,36,23,'#616664');limb(x,y-19,clockLeft>0?.65:-.65,34,5,'#c5a77b');}
 else if(o.kind==='flame'){rect(x-15,y-35,30,35,'#535959');if(o.lit)candle(x,y-36);text(['','I','II','III'][o.value],x,y-55,17,o.lit?'#f7c979':'#aca798','center');}
 else {relic(x,o.kind==='seal'||o.kind==='clockSeal'?y-35:y);if(o.kind==='echo')text('ECO',x,y-34,11,'#c1dcd2','center');}
 }
 for(const o of orbs)if(o.stage===stage){ctx.save();ctx.shadowColor='#9de4d1';ctx.shadowBlur=14;ctx.fillStyle='#c0eee0';ctx.beginPath();ctx.arc(o.x,o.y,5+Math.sin(time*7)*1,0,Math.PI*2);ctx.fill();ctx.restore();}
}
function hud(){text('✦',31,42,22,'#bfa06b');rect(55,25,160,7,'#342b30');rect(55,25,160*p.hp/p.max,7,'#a9645e');rect(55,39,130,3,'#243743');rect(55,39,130*p.mana/100,3,'#8db7ba');rect(55,49,110,2,'#363b31');rect(55,49,110*p.stamina/100,2,'#b6a66c');text('◈ '+souls,240,35,15,'#b8dfcc');text(stage<2?districts[stage][Math.min(5,Math.floor(p.x/3500))]:'Santuário do Último Sino',55,69,10,'#b4b2a1');
 if(toastTime>0){rect(160,85,640,35,'#0c131be8');text(toast,480,107,12,'#d7c8a7','center');}
 const o=nearestObject();let hint='';if(o){const labels={trial:'DESAFIAR VIGÍLIA',npc:'CONVERSAR',altar:'DESCANSAR',inscription:'LER',bell:'TOCAR',arenaBell:'TOCAR SINO',crate:'REPOSICIONAR',mirror:'GIRAR',lever:'ATIVAR RELÓGIO',flame:'ACENDER',seal:'ROMPER SELO',clockSeal:'FIXAR PORTÃO',cache:'RECOLHER ALMAS',echo:'RECEBER O ECO',vow:'RECOLHER VOTO',shard:'RECOLHER FRAGMENTO'};hint=labels[o.kind]||'INTERAGIR';}else if(stage<2&&p.x>rooms[stage].door-75)hint='ATRAVESSAR';else if(stage===1&&p.x<95)hint='VOLTAR AO MOSTEIRO';if(hint)text((padId!==null?'○ / B':'E')+' · '+hint,480,415,12,'#eee0ba','center','Arial');if(clockLeft>0)text('RELÓGIO · '+clockLeft.toFixed(1)+' s',480,150,20,'#edc381','center');
 if(boss&&boss.hp>0){text('O GUARDIÃO DO ÚLTIMO SINO'+(boss.phase===2?' · SEGUNDA VIGÍLIA':''),480,488,13,'#d9c19a','center');rect(220,503,520,8,'#332c32');rect(220,503,520*boss.hp/boss.max,8,'#ac6b57');}else text(padId!==null?'Share · Diário':'M · Diário',920,515,10,'#aaa897','right','Arial');
}
