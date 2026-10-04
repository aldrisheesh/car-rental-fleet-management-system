import json,xml.etree.ElementTree as E,pathlib,re
s=json.load(open('tmp/defense-audit/schema-current.json'));fk=json.load(open('output/erd/relationships.json'));cols={}
for c in s['columns']:cols.setdefault(c['table_name'],[]).append(c)
pk={}
for c in s['constraints']:
 if c['contype']=='p':pk[c['table_name']]=set(re.search(r'\(([^)]+)\)',c['definition']).group(1).split(', '))
xml=pathlib.Path('output/erd-editable');xml.mkdir(exist_ok=True)
manifest=json.load(open('output/erd/manifest.json'))
def makefile(path,layouts,full):
 doc=E.Element('mxfile',host='app.diagrams.net',type='device',compressed='false')
 def page(title,file,tables):
  j=json.load(open(file)); bb=list(map(float,j['bb'].split(',')));W,H=bb[2],bb[3];scale=1.2
  diagram=E.SubElement(doc,'diagram',name=title,id='p'+str(len(doc)))
  graph=E.SubElement(diagram,'mxGraphModel',dx='1100',dy='800',grid='0',guides='1',tooltips='1',connect='1',arrows='1',fold='1',page='1',pageScale='1',pageWidth=str(round(W*scale+100)),pageHeight=str(round(H*scale+110)),math='0',shadow='0')
  root=E.SubElement(graph,'root');E.SubElement(root,'mxCell',id='0');E.SubElement(root,'mxCell',id='1',parent='0')
  def cell(id,value,style,x,y,w,h,parent='1',extra=None):
   c=E.SubElement(root,'mxCell',id=id,value=value,style=style,vertex='1',parent=parent,**(extra or {}));E.SubElement(c,'mxGeometry',x=str(round(x,2)),y=str(round(y,2)),width=str(round(w,2)),height=str(round(h,2)),**{'as':'geometry'});return c
  cell('title',title,'text;html=1;align=left;verticalAlign=middle;fontFamily=Arial;fontSize=22;fontStyle=1;fontColor=#173E5B;',40,15,W*scale,34)
  cell('legend','PK: primary key · FK: foreign key · ?: nullable · Grey: referenced entity · Crow’s foot: multiplicity', 'text;html=1;align=left;verticalAlign=middle;fontFamily=Arial;fontSize=12;fontColor=#526775;',40,50,W*scale,25)
  for n in j['objects']:
   if 'pos' not in n:continue
   name=n['name'];fields=cols.get(name,[dict(column_name='id',udt_name='uuid',is_nullable='NO')]);keys=pk.get(name,{'id'} if name=='auth.users' else set());fkeys={f['field'] for f in fk if f['child']==name};ref=name not in tables
   if not full:fields=[c for c in fields if c['column_name'] in keys|fkeys]
   if ref:fields=[c for c in fields if c['column_name'] in keys|{f['target'] for f in fk if f['parent']==name}]
   px,py=map(float,n['pos'].split(','));w=float(n['width'])*72*scale;h=float(n['height'])*72*scale;x=(px-float(n['width'])*36)*scale+40;y=(H-py-float(n['height'])*36)*scale+85
   id='n'+str(n['_gvid']);header=32;rh=(h-header)/max(1,len(fields))
   cell(id,name+(' (ref)' if ref else ''),'swimlane;html=1;startSize=32;horizontal=1;rounded=0;collapsible=0;recursiveResize=0;fontFamily=Arial;fontSize=13;fontStyle=1;align=center;fillColor='+('#E5EBF0' if ref else '#173E5B')+';swimlaneFillColor=#FFFFFF;strokeColor=#718096;fontColor='+('#334155' if ref else '#FFFFFF')+';',x,y,w,h,extra={'tableName':name,'reference':'1' if ref else '0'})
   for i,c in enumerate(fields):
    field=c['column_name'];mark=('PK ' if field in keys else '')+('FK ' if field in fkeys else '');typ=c['udt_name'];typ={'int2':'smallint','int4':'integer','int8':'bigint','bool':'boolean'}.get(typ,typ)
    if typ=='numeric' and c.get('numeric_precision'):typ+=f'({c["numeric_precision"]},{c["numeric_scale"]})'
    if c['is_nullable']=='YES':typ+=' ?'
    # Use native attribute and type cells for editability.
    bw=max(78,w*0.30);base='html=1;whiteSpace=wrap;rounded=0;fillColor='+('#F8FAFC' if i%2==0 else '#FFFFFF')+';strokeColor=#CBD5E1;align=left;verticalAlign=middle;spacingLeft=6;fontFamily=Arial;fontSize=12;fontColor=#172B3A;'
    cell(id+'-'+str(i),mark+field,base+('fontStyle=1;' if field in keys else ''),0,header+i*rh,w-bw,rh,id,{'fieldName':field})
    cell(id+'-'+str(i)+'t',typ,base,w-bw,header+i*rh,bw,rh,id)
  for k,e in enumerate(j.get('edges',[])):
   child=j['objects'][e['tail']]['name'];parent=j['objects'][e['head']]['name']
   candidates=[f for f in fk if f['child']==child and f['parent']==parent]
   # Graphviz preserves source order of the input edge list.
   prior=sum(1 for pe in j['edges'][:k] if pe['tail']==e['tail'] and pe['head']==e['head']);f=candidates[prior]
   start='ERzeroToOne' if f['unique'] else 'ERzeroToMany';end='ERzeroToOne' if f['optional'] else 'ERone'
   c=E.SubElement(root,'mxCell',id='e'+str(k),value=f['field'],edge='1',parent='1',source='n'+str(e['tail']),target='n'+str(e['head']),style=f'edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;startArrow={start};endArrow={end};startSize=12;endSize=12;strokeColor=#526775;strokeWidth=1.25;fontFamily=Arial;fontSize=10;fontColor=#334155;labelBackgroundColor=#FFFFFF;',fkColumn=f['field'],childTable=child,parentTable=parent)
   geom=E.SubElement(c,'mxGeometry',relative='1',**{'as':'geometry'});pts=re.findall(r'(?<![\w.])(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)',e['pos']);arr=E.SubElement(geom,'Array',**{'as':'points'})
   # Preserve the orthogonal routing supplied by Graphviz.
   for xx,yy in pts[1:-1]:E.SubElement(arr,'mxPoint',x=str(round(float(xx)*scale+40,2)),y=str(round((H-float(yy))*scale+85,2)))
  cell('footer',('Complete attributes are documented in the verified data dictionary.' if not full else 'Complete entity attributes; referenced tables are shown by key only.'),'text;html=1;align=left;fontFamily=Arial;fontSize=12;fontColor=#526775;',40,H*scale+88,W*scale,20)
 for title,file,tables in layouts:page(title,file,tables)
 E.indent(doc);E.ElementTree(doc).write(path,encoding='utf-8',xml_declaration=True)
logical=[('ERD Overview','tmp/erd-tooling/00-overview.dot.json',list(cols))]+[(d['title'],f'tmp/erd-tooling/{i:02}-manuscript.dot.json',d['tables']) for i,d in enumerate(manifest[1:9],1)]
makefile(xml/'Briah-ERD-Manuscript.drawio',logical,False)
physical=[(t,f'tmp/erd-tooling/physical-{t}.dot.json',[t]) for t in cols]
makefile(xml/'Briah-ERD-Complete-Attributes.drawio',physical,True)
# Verify complete dictionary and relationship coverage, excluding repeated reference entities.
r=E.parse(xml/'Briah-ERD-Complete-Attributes.drawio').getroot();found=[]
for diagram in r:
 nodes={c.get('id'):c for c in diagram.iter('mxCell') if c.get('tableName')}
 found += [(nodes[c.get('parent')].get('tableName'),c.get('fieldName')) for c in diagram.iter('mxCell') if c.get('fieldName') and nodes[c.get('parent')].get('reference')=='0']
assert sorted(found)==sorted((c['table_name'],c['column_name']) for c in s['columns'])
for file in ['Briah-ERD-Manuscript.drawio','Briah-ERD-Complete-Attributes.drawio']:
 r=E.parse(xml/file).getroot();edges=[c for d in list(r)[1:] if file.endswith('Manuscript.drawio') for c in d.iter('mxCell') if c.get('edge')] if file.endswith('Manuscript.drawio') else [c for c in r.iter('mxCell') if c.get('edge')]
 assert len(edges)==85,(file,len(edges))
print('Verified 478 complete attributes and 85 native FK connectors in each detail collection.')
