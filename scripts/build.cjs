const fs=require('fs'),path=require('path');
const root=path.join(__dirname,'..');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'assets/manifest.json')));
const sprites=Object.entries(manifest.embedded).map(([id,[file,frames]])=>`loadArt(${JSON.stringify(id)},'data:image/png;base64,${fs.readFileSync(path.join(root,'assets/sprites',file)).toString('base64')}',${frames});`).join('\n');
const source=['core.js','adventure.js','input.js'].map(file=>fs.readFileSync(path.join(root,'src',file),'utf8')).join('\n').replace('/* EMBEDDED_SPRITES */',sprites);
new(require('vm').Script)(source);
const html=fs.readFileSync(path.join(root,'src/shell.html'),'utf8').replace('/* GAME_CODE */',()=>source);
fs.writeFileSync(path.join(root,'index.html'),html);
console.log('Standalone atualizado: index.html');
