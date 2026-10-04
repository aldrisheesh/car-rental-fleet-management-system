import fs from 'node:fs/promises';
import sharp from '/Users/aldrich/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp/dist/index.mjs';
const pages=JSON.parse(await fs.readFile('output/erd-editable/portrait/manifest.json','utf8'));
for(const p of pages){await sharp(p.svg,{density:300}).flatten({background:'#fff'}).png().toFile(p.file);await sharp(p.svg).resize({width:500,height:740,fit:'contain',background:'#fff'}).png().toFile(p.file.replace('.png','-thumb.png'));}
await sharp({create:{width:1500,height:2220,channels:3,background:'#ddd'}}).composite(pages.map((p,i)=>({input:p.file.replace('.png','-thumb.png'),left:(i%3)*500,top:Math.floor(i/3)*740}))).png().toFile('output/erd-editable/portrait/contact.png');
