import json,xml.etree.ElementTree as E,sys
from pathlib import Path
p=Path(sys.argv[1] if len(sys.argv)>1 else 'output/erd-editable/images');ns='http://www.w3.org/2000/svg';E.register_namespace('',ns)
for f in p.glob('*.json'):
 d=json.loads(f.read_text());root=E.fromstring(d['svg']);
 for parent in root.iter():
  for c in list(parent):
   if c.tag.split('}')[-1]=='foreignObject' or (c.get('stroke')=='#c0c0c0' and c.get('stroke-dasharray')):parent.remove(c)
  parent.attrib.pop('style',None)
  for attr in ['pointer-events','cursor']:parent.attrib.pop(attr,None)
 for t in d['text']:
  E.SubElement(root,'text',x=str(t['x']),y=str(t['y']+t['h']/2),fill=t['color'],**{'dominant-baseline':'central','font-size':str(t['fontSize']),'font-family':'Arial, Liberation Sans, sans-serif','font-weight':t['weight']}).text=t['text']
 boxes=d['boxes']+d['text'];x=min(b['x'] for b in boxes)-20;y=min(b['y'] for b in boxes)-20;w=max(b['x']+b['w'] for b in boxes)-x+20;h=max(b['y']+b['h'] for b in boxes)-y+20
 root.set('xmlns',ns);root.set('viewBox',f'{x} {y} {w} {h}');root.set('width',str(w));root.set('height',str(h));root.set('style','background:white')
 f.with_suffix('.svg').write_text(E.tostring(root,encoding='unicode'))
print('Nine SVG exports from browser-rendered diagram geometry')
