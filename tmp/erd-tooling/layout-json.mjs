import {instance} from './node_modules/@viz-js/viz/dist/viz.js';import fs from 'node:fs';const viz=await instance();
for(const f of fs.readdirSync('output/erd').filter(x=>x.endsWith('-manuscript.dot')||x.startsWith('physical-')&&x.endsWith('.dot')||x==='00-overview.dot')){
 fs.writeFileSync('tmp/erd-tooling/'+f+'.json',viz.renderString(fs.readFileSync('output/erd/'+f,'utf8'),{format:'json',engine:'dot'}));
}
