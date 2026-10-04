from pathlib import Path
import xml.etree.ElementTree as E,json,urllib.parse,zlib,base64
out=Path('output/erd-editable');removed=0
for f in out.glob('*.drawio'):
 doc=E.parse(f)
 for root in doc.findall('.//root'):
  for c in list(root):
   if c.get('id') in ['legend','footer']:root.remove(c);removed+=1
 E.indent(doc);doc.write(f,encoding='utf-8',xml_declaration=True)
for folder in ['images','print-panels']:
 for f in (out/folder).glob('*.json'):
  d=json.loads(f.read_text());d['text']=[t for t in d['text'] if not t['text'].startswith(('PK: primary key','Complete attributes are documented','Complete entity attributes;'))];f.write_text(json.dumps(d))
links=[]
for name in ['Briah-ERD-Manuscript','Briah-ERD-Manuscript-Detail-Panels','Briah-ERD-Complete-Attributes']:
 raw=urllib.parse.quote((out/(name+'.drawio')).read_text(),safe="~()*!.'-_").encode();c=zlib.compressobj(wbits=-15);enc=base64.b64encode(c.compress(raw)+c.flush()).decode();links.append('<p><a href="https://app.diagrams.net/#R'+enc+'">'+name+'</a></p>')
(out/'open-in-drawio.html').write_text('<!doctype html><html><head><title>Open Briah ERD in draw.io</title></head><body><h1>Editable Briah ERDs</h1>'+''.join(links)+'</body></html>')
print('Removed',removed,'annotation cells across 89 diagram pages')
