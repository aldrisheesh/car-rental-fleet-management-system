import {instance} from './node_modules/@viz-js/viz/dist/viz.js';
import fs from 'node:fs';
const viz=await instance();const root='output/erd/';
for(const f of fs.readdirSync(root).filter(x=>x.endsWith('.dot'))){
 const svg=viz.renderString(fs.readFileSync(root+f,'utf8'),{format:'svg',engine:'dot'});
 fs.writeFileSync(root+f.replace('.dot','.svg'),svg);console.log(f,svg.length);
}
