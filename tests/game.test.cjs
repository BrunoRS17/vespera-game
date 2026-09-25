const fs=require('fs'),vm=require('vm'),assert=require('assert');
const html=fs.readFileSync(require('path').join(__dirname,'../index.html'),'utf8');const js=html.match(/<script>([\s\S]*)<\/script>/)[1];
const gradient={addColorStop(){}};const ctx=new Proxy({createLinearGradient:()=>gradient,createRadialGradient:()=>gradient,drawImage(img,...a){if(a.length===8){const [x,y,w,h]=a;assert(x>=0&&y>=0&&w>0&&h>0&&x+w<=img.naturalWidth+.01&&y+h<=img.naturalHeight+.01,'sprite crop bounds')}}},{get:(o,k)=>k in o?o[k]:()=>{}});
const els={};const element=id=>els[id]||(els[id]={hidden:false,innerHTML:'',getContext:()=>ctx,addEventListener(){},setAttribute(){},focus(){},querySelectorAll:()=>[]});
class AssetImage{set src(value){const b=Buffer.from(value.split(',')[1],'base64');this.naturalWidth=b.readUInt32BE(16);this.naturalHeight=b.readUInt32BE(20);this.complete=true}}
const sandbox={console,Math,Set,Image:AssetImage,document:{getElementById:element,addEventListener(){},querySelectorAll:()=>[],querySelector:element},window:{addEventListener(){}},requestAnimationFrame(){}};vm.createContext(sandbox);vm.runInContext(js,sandbox);
vm.runInContext(`
function check(ok,msg){if(!ok)throw Error(msg)}
reset();check(mode==='play'&&p.hp===100,'start');
keys.KeyD=true;for(let i=0;i<60;i++)update(1/120);delete keys.KeyD;check(p.x>200,'movement');
pressed.Space=true;update(1/120);delete pressed.Space;check(p.vy<0,'jump');for(let i=0;i<130;i++)update(1/120);check(p.on,'landing');
p.x=600;p.y=407;p.dir=1;let e=rooms[0].enemies[0];e.x=650;e.hp=50;pressed.KeyJ=true;update(1/120);delete pressed.KeyJ;check(e.hp===25,'attack');
p.attack=0;p.inv=0;p.block=true;p.stamina=100;let hp=p.hp;hurt(16,p.x+40);check(p.hp===hp&&p.stamina===80,'front defense');p.inv=0;hurt(16,p.x-40);check(p.hp<hp,'rear damage');
p.block=false;p.mana=100;pressed.KeyL=true;update(1/120);delete pressed.KeyL;check(shots.length===1&&p.mana<70,'special');
p.x=rooms[0].altar;p.y=407;p.vy=0;pressed.KeyE=true;update(1/120);delete pressed.KeyE;check(p.hp===p.max&&checkpoint.x===1440,'altar');
p.x=2700;pressed.KeyE=true;update(1/120);delete pressed.KeyE;check(stage===1,'stage transition');
p.x=2180;p.y=112;p.vy=0;update(1/120);check(p.double,'relic');p.on=false;p.coyote=0;p.jumps=1;pressed.Space=true;update(1/120);delete pressed.Space;check(p.jumps===2&&p.vy<0,'double jump');
p.x=2900;p.y=407;p.vy=0;pressed.KeyE=true;update(1/120);delete pressed.KeyE;check(stage===2&&boss.hp===620&&mode==='intro','boss enter');finishIntro();
boss.hp=300;update(1/120);check(boss.phase===2&&boss.enrage>0,'boss phase');for(let i=0;i<270;i++)updateBoss(1/120);boss.wind=.001;boss.kind=1;update(1/120);check(shots.filter(s=>!s.friendly).length===2,'boss waves');
p.inv=0;p.block=false;hurt(1000,p.x+1);check(mode==='dead','death');respawn();check(mode==='play'&&p.hp===p.max&&boss.hp===620,'respawn');
hit(boss,1000);check(mode==='win','victory');render();
reset();travel(1,1720);rooms[1].enemies=[];p.y=407;p.on=true;
function tick(n){for(let i=0;i<n;i++)update(1/120)}
function jump(){pressed.Space=true;update(1/120);delete pressed.Space}
jump();tick(110);check(p.on&&Math.abs(p.y+48-353)<1,'relic first platform reachable');
p.x=1795;jump();keys.KeyD=true;tick(52);delete keys.KeyD;tick(60);check(p.on&&Math.abs(p.y+48-255)<1,'relic second platform reachable');
p.x=2015;jump();keys.KeyD=true;tick(75);delete keys.KeyD;tick(50);check(p.on&&Math.abs(p.y+48-170)<1&&p.double,'relic reachable without double jump');
reset();rooms[0].enemies=[];p.x=1200;jump();keys.KeyD=true;tick(100);delete keys.KeyD;tick(30);check(p.x>1350&&p.on&&p.hp===100,'pit clearable');
`,sandbox);console.log('PASS: movement, jump, landing, combat, directional defense, special, altar, transitions, relic, double jump, boss phases/waves, death, respawn, victory, rendering.');
let pads=[];sandbox.navigator={getGamepads:()=>pads};
const pad={index:0,connected:true,mapping:'standard',id:'Simulated standard DualShock 4',axes:[0,0],buttons:Array.from({length:17},()=>({pressed:false,value:0}))};
const run=code=>vm.runInContext(code,sandbox);
pads=[pad];run("reset();pollGamepad();check(padId===0,'controller connection')");
pad.axes[0]=.15;run("pollGamepad();check(padAxis===0,'stick deadzone')");pad.axes[0]=.6;run("pollGamepad();check(Math.abs(padAxis-.5)<.001,'analog half speed');let px=p.x;tick(30);check(p.x>px,'controller movement')");
pad.axes[0]=0;pad.buttons[0].pressed=true;run("pollGamepad();check(pressed.Space,'cross jump edge');update(1/120);delete pressed.Space;pollGamepad();check(!pressed.Space,'held button does not repeat')");
pad.buttons[0].pressed=false;pad.buttons[2].pressed=true;pad.buttons[3].pressed=true;pad.buttons[1].pressed=true;pad.buttons[4].pressed=true;run("pollGamepad();check(pressed.KeyJ&&pressed.KeyL&&pressed.KeyE&&held('KeyK'),'face buttons and L1 mapping');for(const k in pressed)delete pressed[k]");
pad.buttons.forEach(b=>b.pressed=false);pad.buttons[9].pressed=true;run("pollGamepad();check(mode==='pause','options pause')");pad.buttons[9].pressed=false;run('pollGamepad()');pad.buttons[0].pressed=true;run("pollGamepad();check(mode==='play','cross resumes menu')");
pad.buttons[0].pressed=false;pad.buttons[4].pressed=true;run('pollGamepad()');pads=[];run("keys.KeyD=true;pollGamepad();check(mode==='pause'&&!held('KeyK')&&padAxis===0&&!keys.KeyD,'disconnect pauses and clears held inputs');delete keys.KeyD");
pads=[{...pad,mapping:''}];run("pollGamepad();check(padId===null,'unmapped pad handled safely')");pads=[];
run("reset();for(const k in pressed)delete pressed[k];for(const state of ['idle','run','jump','fall','land','guard','attack','cast','hurt']){p.on=true;p.vy=0;p.run=0;p.guard=0;p.attack=0;p.cast=0;p.hurt=0;p.land=0;if(state==='run')p.run=1;if(state==='jump'){p.on=false;p.vy=-300}if(state==='fall'){p.on=false;p.vy=300}if(state==='land')p.land=1;if(state==='guard')p.guard=1;if(state==='attack')p.attack=.2;if(state==='cast')p.cast=.2;if(state==='hurt')p.hurt=.2;for(let i=0;i<10;i++){p.gait+=.3;player()}} ");
const param=()=>({value:0,setValueAtTime(){},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){},setTargetAtTime(){},cancelScheduledValues(){}});
let oscillatorStarts=0;class MockAudio{constructor(){this.currentTime=0;this.sampleRate=100;this.state='running';this.destination={}}createGain(){return{gain:param(),connect(){},disconnect(){}}}createOscillator(){return{frequency:param(),connect(){},disconnect(){},start(){oscillatorStarts++},stop(){}}}createConvolver(){return{connect(){}}}createBuffer(c,n){return{getChannelData:()=>new Float32Array(n)}}resume(){return Promise.resolve()}}
sandbox.window.AudioContext=MockAudio;
run("enableAudio();check(sound&&music&&audio,'audio startup');scheduleMusic();check(musicTheme==='monastery'&&voices.size>0,'monastery music');stage=1;scheduleMusic();check(musicTheme==='crypt','crypt music');stage=2;makeBoss();scheduleMusic();check(musicTheme==='boss','boss music');boss.phase=2;scheduleMusic();check(musicTheme==='rage','intense boss score');mode='pause';scheduleMusic();check(musicTheme==='silent'&&voices.size===0,'pause fades and clears voices');mode='play';music=false;scheduleMusic();check(musicTheme==='silent','music mute');music=true;focused=false;scheduleMusic();check(musicTheme==='silent','background muted');focused=true;tone(440);check(sound,'effects independent from music')");
assert(oscillatorStarts>10);console.log('PASS: simulated controller mapping, analog deadzone, button edges, menus, disconnect, all animation poses, music themes, mute/pause and separate effects. Physical controller and listening verification still require user hardware.');
run(`
reset();travel(2,520);check(mode==='intro','intro triggered');const introHP=p.hp, bossHP=boss.hp, startX=p.x, bossX=boss.x;keys.KeyD=true;pressed.KeyJ=true;
tick(240);check(mode==='intro'&&p.x===startX&&boss.x===bossX&&p.hp===introHP&&boss.hp===bossHP,'cinematic freezes combat');
pause();const savedIntro=introTime;tick(120);check(introTime===savedIntro&&mode==='pause','cinematic pause');pause();check(mode==='intro','cinematic resume');
openSettings();tick(120);check(mode==='settings'&&introTime===savedIntro,'settings freezes cinematic');closeSettings();check(mode==='intro','settings resumes cinematic');
for(const k in pressed)delete pressed[k];tick(900);check(mode==='play'&&introSeen,'cinematic ends automatically');
p.hp=1;p.inv=0;p.block=false;hurt(20,p.x+1);respawn();check(mode==='play'&&boss.hp===620,'retry skips seen cinematic');
reset();travel(2,520);tick(70);pressed.Space=true;update(1/120);delete pressed.Space;check(mode==='play'&&introSeen,'skip cinematic');
boss.cd=0;boss.cycles=2;boss.swing=0;updateBoss(1/120);check(boss.kind===2&&pillars.length===3,'new attack casts three marks');
const mark=pillars[1];p.x=mark.x-11;p.y=407;p.inv=0;p.block=true;p.stamina=100;const beforeHP=p.hp;updatePillars(.9);check(p.hp===beforeHP,'marks warn before damage');updatePillars(.6);check(p.hp===beforeHP-28,'pillar damage bypasses shield');const damagedHP=p.hp;updatePillars(.01);check(p.hp===damagedHP,'pillar does not hit repeatedly');
pillars=[];boss.wind=0;boss.swing=0;boss.cd=0;boss.cycles=3;boss.phase=2;updateBoss(1/120);check(pillars.length===5,'phase two casts five marks');
const safeX=(pillars[1].x+pillars[2].x)/2;p.x=safeX-11;p.inv=0;const safeHP=p.hp;for(let i=0;i<360;i++)updatePillars(1/120);check(p.hp===safeHP,'gaps between pillars allow evasion');
for(const kind of [0,1,2]){boss.kind=kind;boss.wind=.5;boss.windMax=1;drawBoss(boss);boss.wind=0;boss.swing=.4;drawBoss(boss)}
const npc=rooms[0].enemies[0];hit(npc,100);check(npc.death>0,'enemy death animation');drawEnemy(npc);render();
openSettings();check(mode==='settings','open settings');closeSettings();check(mode==='play','settings restores play');
`);console.log('PASS: cinematic protection, auto completion, skip, pause/settings resume, retry flow, pillar telegraph, unblockable damage, evasion gaps, phase two and actor animation rendering.');
run(`
reset();check(rooms[0].enemies.length===10&&rooms[1].enemies.length===13,'increased encounters');check(new Set(rooms[0].enemies.map(e=>e.type)).size===5,'five archetypes');
rooms[0].enemies=[enemy(150)];p.x=100;p.dir=1;pressed.KeyL=true;update(1/120);delete pressed.KeyL;check(p.mana<61&&p.specialCd>1,'special cost and cooldown');const manaBefore=p.mana;pressed.KeyL=true;update(1/120);delete pressed.KeyL;check(p.mana>=manaBefore&&shots.length===1,'no special spam');tick(15);check(rooms[0].enemies[0].hp===32,'special damage is 18');
rooms[0].enemies=[enemy(330,GROUND,'acolyte')];p.x=100;shots=[];rooms[0].enemies[0].cd=0;updateEnemies(.01);check(rooms[0].enemies[0].wind>0,'ranged telegraph');updateEnemies(.9);check(shots.length===1&&shots[0].damage===18,'ranged shot');
rooms[0].enemies=[enemy(245,GROUND,'hound')];rooms[0].enemies[0].cd=0;updateEnemies(.01);check(rooms[0].enemies[0].wind>0,'hound telegraph');updateEnemies(.7);check(rooms[0].enemies[0].dash>0,'hound charge');
reset();travel(2,520);finishIntro();boss.hp=300;updateBoss(.01);check(boss.enrage>2&&boss.phase===2,'protected transformation');const protectedHP=boss.hp;hit(boss,18);check(boss.hp===protectedHP,'transformation invulnerability');for(let i=0;i<270;i++)updateBoss(1/120);
boss.cd=0;boss.cycles=0;boss.swing=0;boss.wind=0;updateBoss(.01);check(boss.kind===3&&boss.wind>.8,'phase two dash telegraph');updateBoss(1);check(boss.dash>0,'dash release');p.x=boss.x+21+boss.dir*20;p.y=407;p.inv=0;p.block=true;const dashHP=p.hp;updateBoss(.01);check(p.hp===dashHP-34,'dash bypasses defense');
boss.dash=.3;boss.dashHit=false;p.x=boss.x+21+boss.dir*20;p.y=GROUND-150;p.inv=0;const jumpHP=p.hp;updateBoss(.01);check(p.hp===jumpHP,'jump evades dash');
boss.dash=0;boss.wind=0;boss.swing=0;boss.cd=0;boss.cycles=2;shots=[];updateBoss(.01);check(boss.kind===4&&boss.wind>1,'volley telegraph');updateBoss(1.1);check(shots.length===5,'first volley');updateBoss(.41);check(shots.length===10,'second volley');
check(shots.some(s=>Math.abs(s.vy)>1),'projectiles travel diagonally');
for(const [name,a] of Object.entries(art)){check(a.img.naturalWidth%a.frames===0,'integral sprite frames '+name);for(let i=0;i<a.frames;i++)sprite(name,100,455,1,i);}
for(const type of ['pilgrim','warden','hound','acolyte','wraith']){const actor=enemy(300,GROUND,type);actor.motion=.7;actor.gait=2;assetEnemy(actor);actor.wind=.3;assetEnemy(actor)}
boss.enrage=1;assetBoss(boss);boss.enrage=0;for(let kind=0;kind<5;kind++){boss.kind=kind;boss.wind=.3;assetBoss(boss);boss.wind=0;boss.swing=.3;assetBoss(boss)}
`);console.log('PASS: special nerf/cooldown, 23 encounters and five archetypes, ranged AI, charges, phase-two transformation, dash damage/evasion, two volleys, all embedded sprite frame bounds.');
