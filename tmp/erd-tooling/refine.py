from pathlib import Path
import xml.etree.ElementTree as E,zlib,urllib.parse,base64
out=Path('output/erd-editable')
for file in out.glob('*.drawio'):
 doc=E.parse(file)
 for diagram in doc.getroot():
  cells=list(diagram.iter('mxCell'));byid={c.get('id'):c for c in cells};fields={}
  for c in cells:
   if c.get('fieldName'):fields[(c.get('parent'),c.get('fieldName'))]=c.get('id')
  for c in cells:
   if not c.get('edge'):continue
   source=c.get('source');target=c.get('target');field=c.get('fkColumn');row=fields.get((source,field));trow=fields.get((target,'id'))
   if row and trow:
    c.set('source',row+'t');c.set('target',trow);c.set('value','');c.set('style',c.get('style')+'exitX=1;exitY=0.5;exitPerimeter=0;entryX=0;entryY=0.5;entryPerimeter=0;')
 doc.write(file,encoding='utf-8',xml_declaration=True)
links=[]
for name in ['Briah-ERD-Manuscript','Briah-ERD-Complete-Attributes']:
 raw=urllib.parse.quote((out/(name+'.drawio')).read_text(),safe="~()*!.'-_").encode();c=zlib.compressobj(wbits=-15);enc=base64.b64encode(c.compress(raw)+c.flush()).decode()
 links.append(f'<p><a href="https://app.diagrams.net/#R{enc}">{name}</a></p>')
(out/'open-in-drawio.html').write_text('<!doctype html><html><head><title>Open Briah ERD in draw.io</title></head><body><h1>Editable Briah ERDs</h1>'+''.join(links)+'</body></html>')
print('Native row connectors refined')
