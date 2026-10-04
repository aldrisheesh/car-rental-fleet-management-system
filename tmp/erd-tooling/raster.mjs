import sharp from 'sharp';
import fs from 'node:fs';
for(const f of fs.readdirSync('output/erd').filter(x=>x.endsWith('.svg'))){
 await sharp('output/erd/'+f,{limitInputPixels:false}).resize({width:2200,height:2600,fit:'inside'}).png().toFile('tmp/erd-tooling/'+f+'.preview.png');
}
