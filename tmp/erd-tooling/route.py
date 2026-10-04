import xml.etree.ElementTree as E,heapq,bisect
from pathlib import Path
for file in Path('output/erd-editable').glob('*.drawio'):
 doc=E.parse(file)
 for d in doc.getroot():
  if d.get('name')=='ERD Overview':continue
  cells=list(d.iter('mxCell')); ids={c.get('id'):c for c in cells};entities=[c for c in cells if c.get('tableName')]
  rect={c.get('id'):tuple(float(c.find('mxGeometry').get(k,'0')) for k in ('x','y','width','height')) for c in entities}
  obstacles=[(x-7,y-7,x+w+7,y+h+7) for x,y,w,h in rect.values()]
  def anchor(cid,right):
   c=ids[cid]; g=c.find('mxGeometry'); x,y,w,h=(float(g.get(k,'0')) for k in ('x','y','width','height')); px,py,_,_=rect[c.get('parent')]; return (round(px+x+(w if right else 0),2),round(py+y+h/2,2))
  edges=[c for c in cells if c.get('edge')]; endpoints={c.get('id'):(anchor(c.get('source'),True),anchor(c.get('target'),False)) for c in edges}
  xs=set();ys=set()
  for x,y,w,h in rect.values(): xs.update([round(x-20,2),round(x+w+20,2)]);ys.update([round(y-20,2),round(y+h+20,2)])
  for a,b in endpoints.values():xs.update([round(a[0]+20,2),round(b[0]-20,2)]);ys.update([a[1],b[1]])
  xs=sorted(xs);ys=sorted(ys);X=len(xs);Y=len(ys)
  def safe(x,y):return not any(l<x<r and t<y<b for l,t,r,b in obstacles)
  allowed={(i,j) for i,x in enumerate(xs) for j,y in enumerate(ys) if safe(x,y)}
  def clear(a,b):
   x,y=xs[a[0]],ys[a[1]];xx,yy=xs[b[0]],ys[b[1]]
   return not any((t<y<bt and max(min(x,xx),l)<min(max(x,xx),r)) if y==yy else (l<x<r and max(min(y,yy),t)<min(max(y,yy),bt)) for l,t,r,bt in obstacles)
  neigh={}
  for a in allowed:
   aa=[]
   for di,dj in [(1,0),(-1,0),(0,1),(0,-1)]:
    b=(a[0]+di,a[1]+dj)
    if b in allowed and clear(a,b):aa.append((b,0 if di else 1,abs(xs[a[0]]-xs[b[0]])+abs(ys[a[1]]-ys[b[1]])))
   neigh[a]=aa
  used={}
  for e in edges:
   a,b=endpoints[e.get('id')];s=(xs.index(round(a[0]+20,2)),ys.index(a[1]));t=(xs.index(round(b[0]-20,2)),ys.index(b[1]));q=[(0,s,0)];dist={(s,0):0};prev={};end=None
   while q:
    cost,n,orient=heapq.heappop(q)
    if cost!=dist.get((n,orient)):continue
    if n==t:end=(n,orient);break
    for m,o,length in neigh.get(n,[]):
     key=tuple(sorted([n,m]));nc=cost+length+(25 if o!=orient else 0)+used.get(key,0)*14
     if nc<dist.get((m,o),1e99):dist[m,o]=nc;prev[m,o]=(n,orient);heapq.heappush(q,(nc,m,o))
   assert end,(file,d.get('name'),e.get('id'))
   route=[]
   while end:
    route.append(end[0]);end=prev.get(end)
   route.reverse()
   for n,m in zip(route,route[1:]):key=tuple(sorted([n,m]));used[key]=used.get(key,0)+1
   pts=[a]+[(xs[i],ys[j]) for i,j in route]+[b];simple=[pts[0]]
   for i in range(1,len(pts)-1):
    p,c,n=pts[i-1:i+2]
    if (p[0]==c[0]==n[0]) or (p[1]==c[1]==n[1]):continue
    simple.append(c)
   simple.append(pts[-1]);g=e.find('mxGeometry')
   for child in list(g):g.remove(child)
   ar=E.SubElement(g,'Array',{'as':'points'})
   for x,y in simple[1:-1]:E.SubElement(ar,'mxPoint',x=str(x),y=str(y))
   e.set('style',e.get('style').replace('edgeStyle=orthogonalEdgeStyle;','edgeStyle=none;'))
 E.indent(doc);doc.write(file,encoding='utf-8',xml_declaration=True)
print('Routed detailed connectors around entity boxes')
