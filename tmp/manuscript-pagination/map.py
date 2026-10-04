import json,re,pathlib,pypdf,pdfplumber
root=pathlib.Path('tmp/manuscript-pagination')
d=json.loads((root/'doc-current.json').read_text())
pages=[p.extract_text() for p in pypdf.PdfReader('/Users/aldrich/Downloads/Proposal Paper (2).pdf').pages]
(root/'pages-current.json').write_text(json.dumps(pages))
def norm(t):return re.sub(r'[^a-z0-9]','',t.lower())
np=[norm(t) for t in pages]
pdf=pdfplumber.open('/Users/aldrich/Downloads/Proposal Paper (2).pdf')
if (root/'lines.json').exists():lines=json.loads((root/'lines.json').read_text())
else:
 lines=[(p.extract_text() or '').splitlines() for p in pdf.pages]
 (root/'lines.json').write_text(json.dumps(lines))
body_start=next(i for i,l in enumerate(lines) if any(norm(x)=='chapter1' for x in l))
body=d['paragraphs']; changes=[]; errors=[]; report=[]
def txt(c):return ''.join(e.get('textRun',{}).get('content','') for x in c['content'] for e in x.get('paragraph',{}).get('elements',[])).strip()
def setcell(c,v):
 p=next(x for x in c['content'] if 'paragraph' in x);old=txt(c)
 if old!=v:changes.append(dict(s=p['startIndex'],e=p['endIndex']-1,value=v))
def findpage(text,kind=''):
 n=norm(text);hits=[i for i,l in enumerate(lines) if i>=body_start and any(norm(' '.join(l[k:k+j]))==n for k in range(len(l)) for j in range(1,4))]
 if not hits:errors.append((kind,text));return ''
 i=hits[0];return str(i-body_start+1)
toc,lt,lf=d['lists']
aliases={'Storage, Backup and Recovery Procedure':'Storage, Backup, and Recovery Procedure','Requirements – Features Matrix':'Requirement – Features Matrix','Problem-Requirements Matrix':'Problem Requirements Matrix','Appendix 1          Data Gathering Instrument':'APPENDIX 1','Appendix 2          Client Forms and Reports':'APPENDIX 2'}
aliases.update({'Car Rental Industry and Operational Context':'A. Car Rental Industry and Operational Context','Fleet Management and Operational Decision-Making':'B. Fleet Management and Operational Decision-Making','Context-Aware Transportation and Operational Intelligence':'C. Context-Aware Transportation and Operational Intelligence','Related Systems and Research Gaps':'D. Related Systems and Research Gaps','Synthesis of the Study':'E. Synthesis of the Study','Use Case Diagram':'Use Case Diagrams','Use Case Report':'Use Case Reports'})
for i,r in enumerate(toc['table']['tableRows']):
 cells=r['tableCells'];label=' '.join(txt(c) for c in cells[:-1]).strip()
 if i==39:label='Operational and Decision-Support Logic';setcell(cells[1],label)
 if label in ('Use Case Diagram','Use Case Report'):
  newlabel=aliases[label];setcell(cells[1],newlabel);label=newlabel
 if not label or i==0:continue
 if i<=4:v=['','i','ii','iv','vii'][i]
 elif label.startswith('1 INTRODUCTION'):v='1'
 elif label.startswith('2 REVIEW'):v=findpage('Chapter 2','toc')
 elif label.startswith('3 METHODOLOGY'):v=findpage('Chapter 3','toc')
 else:v=findpage(aliases.get(label,label),'toc')
 if v:setcell(cells[-1],v)
 report.append(('toc',label,v))
caps=[]
for j,p in enumerate(body):
 if p['start']<12000:continue
 m=re.match(r'^Table (\d+)(?:\s|\x0b)',p['text'])
 if m and (re.fullmatch(r'Table \d+\s*',p['text']) or '\x0b' in p['text']):
  title=p['text'].split('\x0b',1)[1].strip() if '\x0b' in p['text'] else body[j+1]['text'].strip()
  caps.append((int(m[1]),title))
assert len(caps)==70,(len(caps),caps)
for i,(num,title) in enumerate(caps,1):
 cells=lt['table']['tableRows'][i]['tableCells'];v=findpage(title,'table')
 setcell(cells[0],str(num));setcell(cells[1],title)
 if v:setcell(cells[2],v)
 report.append(('table',num,title,v))
for i,r in enumerate(lf['table']['tableRows'][1:],1):
 cells=r['tableCells'];num=int(txt(cells[0]));matches=[p for p in body if p['start']>12000 and re.match(r'^Figure '+str(num)+r'(?:\.|\s*$)',p['text'].strip())]
 if not matches:errors.append(('figure caption',num));continue
 cap=matches[0]['text'].strip();v=findpage(cap,'figure')
 if v:setcell(cells[2],v)
 report.append(('figure',num,cap,v))
(root/'changes.json').write_text(json.dumps(changes))
(root/'report.json').write_text(json.dumps(report,indent=2))
print(json.dumps({'pages':len(pages),'changes':len(changes),'errors':errors,'toc':[x for x in report if x[0]=='toc']},indent=2))
