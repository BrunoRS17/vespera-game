
'use strict';
const canvas=document.getElementById('game'),ctx=canvas.getContext('2d'),overlay=document.getElementById('overlay');
const W=960,H=540,GROUND=455,keys={},pressed={},padKeys={};
ctx.setTransform(2,0,0,2,0,0);
const held=k=>!!(keys[k]||padKeys[k]);
let padId=null,padPrevious=[],focused=true,padAxis=0;

let mode='title',stage=0,cam=0,time=0,last=0,acc=0,shake=0,toast='',toastTime=0,checkpoint={stage:0,x:100},audio=null,sound=false;
let p,rooms,particles=[],shots=[],boss=null,visited=new Set(),kills=0;
// Downloaded CC0 artwork is embedded so the standalone HTML still works offline.
const art={};
function loadArt(name,data,frames=1){if(typeof Image==='undefined')return;const img=new Image();art[name]={img,frames};img.src=data;}
/* EMBEDDED_SPRITES */
function ready(name){return art[name]&&art[name].img.complete&&art[name].img.naturalWidth>0}
function sprite(name,x,feet,scale,frame,dir=1,alpha=1){if(!ready(name))return false;const a=art[name],fw=a.img.naturalWidth/a.frames,fh=a.img.naturalHeight;frame=Math.max(0,Math.min(a.frames-1,Math.floor(frame)));ctx.save();ctx.imageSmoothingEnabled=false;ctx.globalAlpha*=alpha;ctx.translate(x,feet);ctx.scale(dir,1);ctx.drawImage(a.img,frame*fw,0,fw,fh,-fw*scale/2,-fh*scale,fw*scale,fh*scale);ctx.restore();return true}
function assetTerrain(){if(!ready('tiles'))return;ctx.save();ctx.imageSmoothingEnabled=false;const img=art.tiles.img,r=rooms[stage];for(let x=Math.max(0,Math.floor((cam-320)/40)*40);x<Math.min(r.width,cam+W+600);x+=40)if(groundAt(x+20))ctx.drawImage(img,320,80,32,32,x,GROUND,40,40);for(const f of r.platforms.filter(f=>f.x+f.w>cam-320&&f.x<cam+W+600))for(let x=f.x;x<f.x+f.w;x+=32){const w=Math.min(32,f.x+f.w-x);ctx.drawImage(img,320,80,w,16,x,f.y,w,16)}ctx.restore();}

let noiseBuffer=null;
function noiseSound(at,duration,volume,cutoff,bus,high=false){if(!audio||!audio.createBufferSource)return;
 if(!noiseBuffer){noiseBuffer=audio.createBuffer(1,audio.sampleRate,audio.sampleRate);const d=noiseBuffer.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;}
 const src=audio.createBufferSource(),filter=audio.createBiquadFilter(),gain=audio.createGain();src.buffer=noiseBuffer;filter.type=high?'highpass':'lowpass';filter.frequency.value=cutoff;gain.gain.setValueAtTime(volume,at);gain.gain.exponentialRampToValueAtTime(.0001,at+duration);src.connect(filter);filter.connect(gain);gain.connect(bus);src.start(at);src.stop(at+duration);src.onended=()=>{src.disconnect();filter.disconnect();gain.disconnect()};
}
function sfx(kind){if(!sound||!audio||audio.state!=='running')return;const t=audio.currentTime;
 if(kind==='swipe'){noiseSound(t,.16,.11,1800,effectsBus,true);tone(310,.1,'triangle',.035)}
 if(kind==='hit'){noiseSound(t,.13,.2,900,effectsBus);tone(115,.13,'triangle',.08);tone(650,.045,'sine',.02)}
 if(kind==='block'){noiseSound(t,.07,.12,3000,effectsBus,true);for(const f of [680,1130,1920])tone(f,.28,'sine',.035)}
 if(kind==='death'){noiseSound(t,.34,.16,650,effectsBus);tone(175,.45,'sawtooth',.045);tone(78,.3,'sine',.09)}
 if(kind==='slam'){noiseSound(t,.45,.25,500,effectsBus);tone(65,.5,'sine',.15);tone(460,.25,'triangle',.045)}
 if(kind==='cast'){noiseSound(t,.2,.06,2100,effectsBus,true);tone(760,.32,'sine',.045);tone(380,.35,'triangle',.035)}
 if(kind==='roar'){noiseSound(t,.9,.22,480,effectsBus);tone(86,.9,'sawtooth',.065);tone(52,1.1,'sine',.1)}
 if(kind==='step')noiseSound(t,.045,.025,600,effectsBus);
}
function combatMusic(root,t,beat,index,rage){
 // Sixteenth-note hats, offbeat snare, double kick and string ostinato.
 for(let q=0;q<4;q++)noiseSound(t+beat*q/4,.04,q%2?.018:.03,6500,musicBus,true);
 if(index%2===1)noiseSound(t,.13,.085,2400,musicBus);
 musicNote(25,t,.16,.12,'sine',true);if(rage&&index%2===0)musicNote(27,t+beat*.5,.15,.1,'sine',true);
 const pattern=[0,7,12,15,12,7,10,7];for(let q=0;q<2;q++){const note=root+pattern[(index*2+q)%pattern.length];musicNote(note,t+beat*q/2,beat*.43,.038,'sawtooth',true);musicNote(note+12,t+beat*q/2,beat*.4,.02,'triangle',true)}
}

let introTime=0,introSeen=false,pillars=[],resumeMode='play',settingsReturn='title';
const smooth=v=>{v=Math.max(0,Math.min(1,v));return v*v*(3-2*v)};
function clearInput(){for(const k in keys)delete keys[k];for(const k in pressed)delete pressed[k];for(const k in padKeys)delete padKeys[k];padAxis=0;}
function hideMenus(){overlay.hidden=true;document.getElementById('settings').hidden=true;}
function openSettings(){settingsReturn=mode;mode='settings';clearInput();overlay.hidden=true;document.getElementById('settings').hidden=false;document.getElementById('settings-back').focus();}
function closeSettings(){document.getElementById('settings').hidden=true;mode=settingsReturn;overlay.hidden=!['title','pause','dead','win'].includes(mode);clearInput();}
function pause(){
 if(mode==='dialogue'||mode==='journal'){closeDialogue();return}if(mode==='settings'){closeSettings();return}
 if(mode==='play'||mode==='intro'){resumeMode=mode;mode='pause';clearInput();show('Pausa','','CONTINUAR',pause);}
 else if(mode==='pause'){mode=resumeMode;hideMenus();clearInput();}
}
function beginIntro(){mode='intro';introTime=0;hideMenus();clearInput();shots=[];pillars=[];p.inv=2;toastTime=0;tone(82,2,'sine',.12);}
function finishIntro(){if(mode!=='intro')return;introSeen=true;mode='play';introTime=9;boss.cd=1.6;boss.wind=0;boss.swing=0;p.inv=1.5;cam=Math.max(0,Math.min(rooms[stage].width-W,p.x-W*.38));clearInput();document.getElementById('skip').hidden=true;}
async function toggleFullscreen(){try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch{document.getElementById('fullscreen').textContent='USE F11 PARA TELA CHEIA';}}
function gamepadMenu(buttons,edge){
 if(mode==='intro'){if(edge(0)&&introTime>.5)finishIntro();else if(edge(9))pause();return true}
 if(mode==='play')return false;
 if(edge(9)){if(mode==='settings'||mode==='pause')pause();else if(mode==='title')reset();return true}
 const root=mode==='settings'?document.getElementById('settings'):overlay;
 const items=Array.from(root.querySelectorAll('button,input,summary')).filter(el=>el.getClientRects().length);
 let index=items.indexOf(document.activeElement);
 if(edge(12)||edge(13)){index=(index+(edge(13)?1:-1)+items.length)%items.length;items[index]?.focus();}
 if(mode==='settings'&&(edge(14)||edge(15))&&document.activeElement?.type==='range'){const el=document.activeElement;el.value=Math.max(0,Math.min(100,Number(el.value)+(edge(15)?5:-5)));el.dispatchEvent(new Event('input',{bubbles:true}));}
 if(edge(1)&&mode==='settings')closeSettings();else if(edge(1)&&(mode==='dialogue'||mode==='journal'))closeDialogue();
 if(edge(0)){if(index>=0)items[index].click();else if(mode==='title'||mode==='win')reset();else if(mode==='dead')respawn();else if(mode==='pause')pause();else items[0]?.focus();}
 return true;
}
function drawIntro(){
 const t=introTime,fade=Math.min(smooth(t/.8),1-smooth((t-7.4)/1.3));
 rect(0,0,W,52*fade,'#040608');rect(0,H-67*fade,W,67*fade,'#040608');
 ctx.save();ctx.globalAlpha=fade;
 if(t<3.8){ctx.globalAlpha*=smooth((t-.9)/.8)*(1-smooth((t-3.2)/.6));text('Quando a última prece se cala…',W/2,451,17,'#d7c9ad','center');}
 if(t>3.6){ctx.globalAlpha=fade*smooth((t-3.6)/1);text('AQUELE QUE GUARDA O SILÊNCIO',W/2,365,10,'#a99470','center','Arial');text('O Guardião do Último Sino',W/2,406,30,'#e0d1b3','center');ctx.strokeStyle='#ba9f69';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(310,425);ctx.lineTo(650,425);ctx.stroke();}
 ctx.restore();
}
function drawPillars(){for(const f of pillars){const width=40,charge=Math.min(1,(f.age+f.delay)/f.delay);
 if(f.age<0){ctx.save();ctx.globalAlpha=.45+charge*.45;ctx.strokeStyle='#efb875';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(f.x,GROUND-2,width,9,0,0,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.ellipse(f.x,GROUND-2,width*(1-charge),9*(1-charge),0,0,Math.PI*2);ctx.stroke();ctx.restore();}
 else{const height=210*Math.min(1,f.age/.12),alpha=1-Math.max(0,(f.age-.38)/.24);ctx.save();ctx.globalAlpha=alpha;const glow=ctx.createLinearGradient(f.x-35,0,f.x+35,0);glow.addColorStop(0,'#d0833500');glow.addColorStop(.5,'#ffdc9ccc');glow.addColorStop(1,'#d0833500');ctx.fillStyle=glow;ctx.fillRect(f.x-40,GROUND-height,80,height);shape([[f.x-22,GROUND],[f.x-12,GROUND-height*.7],[f.x,GROUND-height],[f.x+13,GROUND-height*.8],[f.x+23,GROUND]],'#ffe3ac');ctx.restore();}
}}

function bossVolley(b){const sx=b.x+32,sy=b.y-84;for(const offset of [-.44,-.22,0,.22,.44])shots.push({x:sx,y:sy,vx:Math.cos(b.aim+offset)*300,vy:Math.sin(b.aim+offset)*300,life:3.4,friendly:false,damage:22,color:'#db97df'});sfx('cast');}
function updatePillars(dt){for(const f of pillars){f.age+=dt;if(f.age>=0&&!f.fired){f.fired=true;shake=5;burst(f.x,GROUND-10,'#f2bf7b',16);sfx('slam');}
 if(f.age>=0&&f.age<.48&&!f.hit&&Math.abs(p.x+11-f.x)<38&&p.y+p.h>GROUND-210&&p.y<GROUND){f.hit=true;hurt(28,f.x,true);}
 }pillars=pillars.filter(f=>f.age<.62);}

// Standard Gamepad mapping: https://w3c.github.io/gamepad/#remapping
// Keyboard/touch and controller states remain separate, so disconnects cannot stick keys.
function pollGamepad(){
 let pads=[];try{pads=typeof navigator!=='undefined'&&navigator.getGamepads?Array.from(navigator.getGamepads()):[]}catch{}
 const connected=pads.filter(g=>g&&g.connected);const g=connected.find(g=>g.index===padId&&g.mapping==='standard')||connected.find(g=>g.mapping==='standard');
 if(!g){if(padId!==null){padId=null;padPrevious=[];padAxis=0;for(const k in padKeys)delete padKeys[k];for(const k in pressed)delete pressed[k];if(mode==='play'||mode==='intro')pause()}
 document.getElementById('pad-status').textContent=connected.length?'CONTROLE SEM MAPEAMENTO · TENTE CHROME / EDGE':'CONTROLE: CONECTE E PRESSIONE UM BOTÃO';return;}
 if(padId!==g.index){padId=g.index;padPrevious=[];notify('Controle conectado.');}
 const buttons=g.buttons.map(b=>b.pressed||b.value>.5);const edge=i=>buttons[i]&&!padPrevious[i];
 document.getElementById('pad-status').textContent='CONTROLE CONECTADO';
 if(focused){const axis=g.axes[0]||0;padAxis=buttons[14]?-1:buttons[15]?1:Math.abs(axis)>.2?Math.sign(axis)*(Math.abs(axis)-.2)/.8:0;
 const map={Space:0,KeyJ:2,KeyK:4,KeyL:3,KeyE:1};
 const menu=mode!=='play';for(const [key,i] of Object.entries(map)){padKeys[key]=!!buttons[i];if(!menu&&edge(i))pressed[key]=true;}
 if(menu)gamepadMenu(buttons,edge);else if(edge(9))pause();else if(edge(8))openJournal();
 }else{padAxis=0;for(const k in padKeys)delete padKeys[k];}
 padPrevious=buttons;
}
// Original ambient score, synthesized locally. No audio files or external requests.
let audioPreferencesChosen=false;let effectsVolume=.7;let music=false,musicVolume=.45,musicBus=null,effectsBus=null,masterBus=null,reverb=null;
let musicNext=0,musicBeat=0,musicTheme='',voices=new Set();
function initAudio(){
 if(!audio){const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio){notify('Áudio indisponível neste navegador.');return false}audio=new Audio();
 masterBus=audio.createGain();masterBus.gain.value=.7;masterBus.connect(audio.destination);
 musicBus=audio.createGain();musicBus.gain.value=0;musicBus.connect(masterBus);
 effectsBus=audio.createGain();effectsBus.gain.value=effectsVolume;effectsBus.connect(masterBus);
 reverb=audio.createConvolver();const impulse=audio.createBuffer(2,audio.sampleRate*2.4,audio.sampleRate);
 for(let c=0;c<2;c++){const data=impulse.getChannelData(c);for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*Math.pow(1-i/data.length,3)*.35}reverb.buffer=impulse;
 const wet=audio.createGain();wet.gain.value=.28;musicBus.connect(reverb);reverb.connect(wet);wet.connect(masterBus);
 }audio.resume().catch(()=>{});return true;
}
function enableAudio(){if(initAudio()){sound=true;music=true;musicTheme='';syncAudioUI()}}
function syncAudioUI(){for(const [id,on,label]of [['sound',sound,'EFEITOS'],['music',music,'TRILHA']]){const el=document.getElementById(id);el.textContent=label+': '+(on?'ON':'OFF');el.setAttribute('aria-pressed',String(on))}}
function musicNote(midi,at,duration,volume,type='sine',bell=false){
 const o=audio.createOscillator(),g=audio.createGain();o.type=type;o.frequency.value=440*Math.pow(2,(midi-69)/12);g.gain.setValueAtTime(0,at);g.gain.linearRampToValueAtTime(volume,at+(bell?.012:.3));g.gain.exponentialRampToValueAtTime(.0001,at+duration);o.connect(g);g.connect(musicBus);o.start(at);o.stop(at+duration+.05);const voice={o,g};voices.add(voice);o.onended=()=>{voices.delete(voice);o.disconnect();g.disconnect()};
}
function stopScore(){if(!audio)return;for(const v of voices){v.g.gain.cancelScheduledValues(audio.currentTime);v.g.gain.setTargetAtTime(0,audio.currentTime,.035);try{v.o.stop(audio.currentTime+.18)}catch{}}voices.clear()}
function scheduleMusic(){
 if(!audio||audio.state!=='running')return;
 const theme=!music||!focused||(mode==='pause'||mode==='settings')?'silent':mode==='dead'?'dead':mode==='win'?'win':mode==='intro'?'intro':stage===2?(boss&&boss.phase===2?'rage':'boss'):stage===1?'crypt':'monastery';
 if(theme!==musicTheme){stopScore();musicTheme=theme;musicBeat=0;musicNext=audio.currentTime+.06;}
 musicBus.gain.setTargetAtTime(theme==='silent'?0:musicVolume*.65,audio.currentTime,.12);
 if(theme==='silent')return;
 const bpm=theme==='rage'?172:theme==='boss'?132:theme==='intro'?42:theme==='crypt'?55:64,beat=60/bpm;
 if(musicNext<audio.currentTime-.25)musicNext=audio.currentTime+.03;
 let n=0;while(musicNext<audio.currentTime+.16&&n++<4){const t=musicNext,i=musicBeat,combat=theme==='boss'||theme==='rage';
 const roots=theme==='win'?[50,53,57,55]:theme==='crypt'?[38,34,41,33]:[38,41,34,36];const root=roots[Math.floor(i/8)%4];
 if(i%8===0){for(const interval of [0,7,12,theme==='win'?16:15])musicNote(root+interval,t,beat*9,.033,'sine');musicNote(root-12,t,beat*7,.038,'triangle');}
 const melody=[24,null,31,27,null,26,19,null,24,31,null,34,31,null,27,26];const note=melody[i%16];
 if(note!==null) {musicNote(root+note,t,beat*2.8,.034,'sine',true);musicNote(root+note+12,t,beat*1.3,.006,'sine',true)}
 if(combat)combatMusic(root,t,beat,i,theme==='rage');
 musicBeat++;musicNext+=beat;
 }
}

const names=['MOSTEIRO DAS CINZAS','CRIPTA DOS SEM-NOME','SANTUÁRIO DO ÚLTIMO SINO'];
function enemy(x,y=GROUND,type='pilgrim'){return{x,y,w:26,h:45,hp:({warden:80,hound:45,acolyte:55,wraith:35}[type]||50),max:({warden:80,hound:45,acolyte:55,wraith:35}[type]||50),vx:0,dir:-1,type,home:x,homeY:y,dash:0,dashHit:false,cd:1,wind:0,flash:0,gait:0,motion:0,swing:0,hurt:0,death:0};}
function notify(s){toast=s;toastTime=4.5}
function tone(freq,dur=.1,type='triangle',volume=.035){if(!sound||!audio||audio.state!=='running')return;const o=audio.createOscillator(),g=audio.createGain();o.type=type;o.frequency.setValueAtTime(freq,audio.currentTime);o.frequency.exponentialRampToValueAtTime(Math.max(30,freq*.45),audio.currentTime+dur);g.gain.setValueAtTime(volume,audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+dur);o.connect(g);g.connect(effectsBus);o.start();o.stop(audio.currentTime+dur);o.onended=()=>{o.disconnect();g.disconnect()}}
function burst(x,y,color,n=12){for(let i=0;i<n;i++)particles.push({x,y,vx:(Math.random()-.5)*210,vy:(Math.random()-.7)*180,life:.3+Math.random()*.5,color});}
function groundAt(x){return !rooms[stage].gaps.some(([a,b])=>x>a&&x<b)}
function show(title,desc,button,fn){overlay.hidden=false;overlay.innerHTML='<div class="panel"><h2>'+title+'</h2>'+(desc?'<p>'+desc+'</p>':'')+'<button class="primary" id="action">'+button+'</button><button class="secondary" id="menu-settings">CONFIGURAÇÕES</button></div>';document.getElementById('action').onclick=fn;document.getElementById('menu-settings').onclick=openSettings;document.getElementById('action').focus();}
function rect(x,y,w,h,c){ctx.fillStyle=c;ctx.fillRect(Math.round(x),Math.round(y),w,h)}
function text(s,x,y,size=12,color='#d5c7a6',align='left',font='Georgia'){ctx.fillStyle=color;ctx.font=size+'px '+font;ctx.textAlign=align;ctx.fillText(s,x,y)}
function arch(x,y,w,h,c){ctx.fillStyle=c;ctx.beginPath();ctx.moveTo(x,y+h);ctx.lineTo(x,y+w/2);ctx.quadraticCurveTo(x+w/2,y-w*.35,x+w,y+w/2);ctx.lineTo(x+w,y+h);ctx.closePath();ctx.fill()}
function background(){if(assetBackground())return;const crypt=stage===1;const g=ctx.createLinearGradient(0,0,0,H);g.addColorStop(0,crypt?'#101523':'#111e2b');g.addColorStop(1,crypt?'#273039':'#394247');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
ctx.fillStyle='#acb4a344';ctx.beginPath();ctx.arc(760-cam*.06,100,49,0,Math.PI*2);ctx.fill();ctx.fillStyle='#16212b';ctx.beginPath();ctx.arc(740-cam*.06,83,46,0,Math.PI*2);ctx.fill();
for(let i=-1;i<10;i++){const x=i*190-(cam*.17)%190;rect(x,180,115,300,'#18252e');arch(x+15,115,85,335,'#18252e');rect(x+48,92,17,80,'#18252e');rect(x+24,118,65,10,'#18252e');for(let j=0;j<3;j++)arch(x+24+j*28,220,15,90,'#344047');}
for(let i=-1;i<9;i++){const x=i*220-(cam*.36)%220;rect(x,65,29,390,crypt?'#1d252d':'#202c32');rect(x-8,85,45,12,'#303940');arch(x+28,120,192,350,'#16202999');arch(x+42,143,164,313,crypt?'#1a2533':'#26343b');for(let j=0;j<4;j++)rect(x+61+j*35,204,3,220,'#19242c');rect(x+33,294,179,8,'#17222a');}
const fog=ctx.createLinearGradient(0,280,0,GROUND);fog.addColorStop(0,'#69868200');fog.addColorStop(1,crypt?'#59778530':'#8b999530');ctx.fillStyle=fog;ctx.fillRect(0,280,W,175);
for(let i=0;i<44;i++){let x=((i*127.31+time*(5+i%3)-cam*.3)%W+W)%W,y=(i*61.9+Math.sin(time*.4+i)*15)%450;rect(x,y,i%4===0?2:1,2,'#d9c58d'+(i%3===0?'65':'25'));}}
function candle(x,y){rect(x-2,y-12,4,12,'#b2a28b');rect(x-1,y-17+Math.sin(time*8+x),3,6,'#e6b761');const g=ctx.createRadialGradient(x,y-12,0,x,y-12,35);g.addColorStop(0,'#efae392d');g.addColorStop(1,'#efae3900');ctx.fillStyle=g;ctx.fillRect(x-35,y-47,70,70)}
function terrain(){const r=rooms[stage];for(let x=Math.max(0,Math.floor((cam-320)/40)*40);x<Math.min(r.width,cam+W+600);x+=40){if(!groundAt(x+20))continue;rect(x,GROUND,40,85,'#1b2125');rect(x,GROUND,40,5,'#727575');rect(x+2,GROUND+7,36,15,'#42494b');rect(x+3,GROUND+25,34,21,'#30383c');rect(x+1,GROUND+49,38,19,'#292f33');rect(x+7,GROUND+28,20,1,'#52574f');}
for(const f of r.platforms.filter(f=>f.x+f.w>cam-320&&f.x<cam+W+600)){rect(f.x,f.y,f.w,7,'#81817a');rect(f.x,f.y+7,f.w,13,'#424b50');for(let x=f.x+5;x<f.x+f.w;x+=28){rect(x,f.y+9,23,8,'#343d43');rect(x+4,f.y+20,13,12,'#30383d')}rect(f.x+12,f.y+32,10,19,'#293239');}
for(let x=210+Math.max(0,Math.floor((cam-400)/370))*370;x<Math.min(r.width,cam+W+600);x+=370){if(!groundAt(x))continue;rect(x,GROUND-34,21,34,'#3f484b');arch(x-3,GROUND-55,27,25,'#586064');rect(x+9,GROUND-46,3,23,'#242e34');rect(x+3,GROUND-39,15,3,'#242e34');candle(x+31,GROUND);}
for(const [a,b]of r.gaps){for(let x=a+8;x<b;x+=18){ctx.fillStyle='#444b50';ctx.beginPath();ctx.moveTo(x,530);ctx.lineTo(x+7,499);ctx.lineTo(x+14,530);ctx.fill();}}

if(stage<2){arch(r.door-30,GROUND-140,88,140,'#11181d');arch(r.door-19,GROUND-124,66,124,'#a38b5333');for(let y=GROUND-110;y<GROUND;y+=18)rect(r.door-17,y,60,2,'#bcaa6333');text('→',r.door+14,GROUND-64,28,'#cfb47a','center');}
}
function relic(x,y){y+=Math.sin(time*3)*5;ctx.save();ctx.translate(x,y);ctx.rotate(Math.PI/4);rect(-7,-7,14,14,'#b0e0d2');rect(-4,-4,8,8,'#526f7c');ctx.restore();ctx.strokeStyle='#98b9b866';ctx.beginPath();ctx.arc(x,y,22,0,Math.PI*2);ctx.stroke();}
// Articulated, continuously interpolated silhouette. Physics hitbox stays 22 x 48.
function shape(points,color){ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(...points[0]);for(let i=1;i<points.length;i++)ctx.lineTo(...points[i]);ctx.closePath();ctx.fill()}
function limb(x,y,angle,length,width,color){const end={x:x+Math.sin(angle)*length,y:y+Math.cos(angle)*length};ctx.lineCap='round';ctx.strokeStyle='#18262c';ctx.lineWidth=width+2;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(end.x,end.y);ctx.stroke();ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke();return end}
function player(){assetPlayer()}
function metal(x1,y1,x2,y2,dark,light){const g=ctx.createLinearGradient(x1,y1,x2,y2);g.addColorStop(0,dark);g.addColorStop(.4,light);g.addColorStop(.66,dark);g.addColorStop(1,light);return g}
function drawEnemy(e,isBoss=false){if(isBoss)assetBoss(e);else assetEnemy(e)}
function drawBoss(b){assetBoss(b)}
function render(){ctx.save();if(shake)ctx.translate((Math.random()-.5)*shake,(Math.random()-.5)*shake);background();ctx.save();const cinematic=mode==='intro'||(mode==='pause'&&resumeMode==='intro')||(mode==='settings'&&settingsReturn==='intro');if(cinematic){const settle=smooth((introTime-6.8)/2),zoom=1+(1-settle)*(.5+smooth(introTime/5)*.25);const normal=p.x-W*.38;const center=(boss.x+32-W/2)*(1-settle)+normal*settle;const centerY=(GROUND-62)*(1-settle)+H/2*settle;ctx.translate(W/2,H/2);ctx.scale(zoom,zoom);ctx.translate(-W/2,-centerY);ctx.translate(-Math.max(0,center),0);}else ctx.translate(-cam,0);terrain();assetTerrain();drawWorldObjects();drawPillars();for(const e of rooms[stage].enemies)if(e.x>cam-180&&e.x<cam+W+180)drawEnemy(e);if(boss)drawEnemy(boss,true);player();for(const s of shots){const col=s.friendly?'#a9dfdb':(s.color||'#e2a375');ctx.fillStyle=col;ctx.beginPath();ctx.ellipse(s.x,s.y,s.friendly?17:s.color?8:12,s.friendly?8:s.color?8:19,0,0,Math.PI*2);ctx.fill();rect(s.x-(s.vx>0?40:0),s.y-2,40,4,col+'55')}for(const f of particles)rect(f.x,f.y,3,3,f.color);ctx.restore();const v=ctx.createRadialGradient(480,280,160,480,280,580);v.addColorStop(0,'#0000');v.addColorStop(1,'#050810b0');ctx.fillStyle=v;ctx.fillRect(0,0,W,H);ctx.restore();if(cinematic)drawIntro();else if(mode==='play')hud();document.getElementById('skip').hidden=mode!=='intro';document.getElementById('pause').hidden=mode!=='play'&&mode!=='intro';document.querySelector('.touch').hidden=mode!=='play';}
function loop(ts){pollGamepad();scheduleMusic();const dt=Math.min(.05,(ts-last)/1000||0);last=ts;acc+=dt;while(acc>=1/120){update(1/120);for(const k in pressed)delete pressed[k];acc-=1/120}render();requestAnimationFrame(loop)}
