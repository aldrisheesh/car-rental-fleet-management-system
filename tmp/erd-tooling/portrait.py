import xml.etree.ElementTree as E, pathlib, html, json, re
base=pathlib.Path('output/erd-editable')
out=base/'portrait';out.mkdir(exist_ok=True)
doc=E.parse(base/'Briah-ERD-Manuscript.drawio').getroot()
manifest=[];covered=[];edge_count=0
for number,page in enumerate(list(doc)[1:],59):
    cells=list(page.iter('mxCell')); ids={c.get('id'):c for c in cells}
    mains=[c for c in cells if c.get('tableName') and c.get('reference')=='0']
    edges=[c for c in cells if c.get('edge')]
    fields={c.get('id'):[r for r in cells if r.get('parent')==c.get('id') and r.get('fieldName')] for c in mains}
    # Two concise continued views are required for the widest booking section.
    parts=[mains]
    if number==60:
        parts=[[c for c in mains if c.get('tableName') in ('booking_requests','booking_creation_idempotency','booking_finder_context')], [c for c in mains if c.get('tableName') not in ('booking_requests','booking_creation_idempotency','booking_finder_context')]]
    for part,main in enumerate(parts):
        es=[e for e in edges if e.get('childTable') in {c.get('tableName') for c in main}]
        refs=sorted({e.get('parentTable') for e in es})
        pos={};rowpos={};y=28
        for c in main:
            name=c.get('tableName');rows=fields[c.get('id')];h=34+28*len(rows)
            pos[name]=(35,y,350,h,False,[(r.get('fieldName'),r.get('value')) for r in rows])
            for i,r in enumerate(rows):rowpos[(name,r.get('fieldName'))]=(385,y+34+28*i+14)
            y+=h+28;covered.append(name)
        yr=28
        for name in refs:
            targetfields=sorted({ids[e.get('target')].get('fieldName','id') for e in es if e.get('parentTable')==name})
            header=54 if len(name+' (ref)')>29 else 34
            h=header+28*len(targetfields);pos['ref:'+name]=(495,yr,270,h,True,[(f,'PK '+f) for f in targetfields])
            for i,f in enumerate(targetfields):rowpos[('ref:'+name,f)]=(495,yr+header+28*i+14)
            yr+=h+42
        H=max(y-28,yr-42)+28; W=800
        svg=[f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}"><rect width="100%" height="100%" fill="white"/>']
        def line(x1,y1,x2,y2):return f'<path d="M{x1},{y1} L{x2},{y2}" fill="none" stroke="#526775" stroke-width="1.3"/>'
        # Each connector ends at its original FK row and referenced key row.
        for i,e in enumerate(es):
            name=e.get('childTable');field=e.get('fkColumn');target=ids[e.get('target')].get('fieldName','id')
            sx,sy=rowpos[(name,field)];tx,ty=rowpos[('ref:'+e.get('parentTable'),target)]
            lane=416+(i%9)*7
            svg.append(f'<path d="M{sx},{sy} H{lane} V{ty} H{tx}" fill="none" stroke="#526775" stroke-width="1.3"/>')
            style=e.get('style');start=re.search(r'startArrow=([^;]+)',style).group(1);end=re.search(r'endArrow=([^;]+)',style).group(1)
            if start=='ERzeroToMany':
                for dy in (-7,0,7):svg.append(line(sx,sy+dy,sx+10,sy))
            else:svg.append(line(sx+5,sy-7,sx+5,sy+7))
            svg.append(f'<circle cx="{sx+18}" cy="{sy}" r="4" fill="white" stroke="#526775" stroke-width="1.3"/>')
            svg.append(line(tx-5,ty-7,tx-5,ty+7))
            if end=='ERzeroToOne':svg.append(f'<circle cx="{tx-18}" cy="{ty}" r="4" fill="white" stroke="#526775" stroke-width="1.3"/>')
            else:svg.append(line(tx-11,ty-7,tx-11,ty+7))
            edge_count+=1
        for key,(x,y,w,h,ref,rows) in pos.items():
            name=key.removeprefix('ref:');color='#E5EBF0' if ref else '#173E5B';fg='#334155' if ref else 'white'
            svg.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="white" stroke="#718096" stroke-width="1.2"/>')
            title=name+(' (ref)' if ref else '')
            header=54 if ref and len(title)>29 else 34
            svg.append(f'<rect x="{x}" y="{y}" width="{w}" height="{header}" fill="{color}"/>')
            if header==54:
                cuts=[i+1 for i,c in enumerate(name) if c=='_'];cut=min(cuts,key=lambda i:abs(i-len(name)/2))
                titles=[name[:cut],name[cut:]+' (ref)']
            else:titles=[title]
            for j,label in enumerate(titles):svg.append(f'<text x="{x+w/2}" y="{y+22+j*20}" text-anchor="middle" font-family="Arial" font-size="17" font-weight="bold" fill="{fg}">{html.escape(label)}</text>')
            for i,(field,label) in enumerate(rows):
                ry=y+header+28*i
                svg.append(f'<rect x="{x}" y="{ry}" width="{w}" height="28" fill="'+('#F8FAFC' if i%2==0 else '#FFFFFF')+'" stroke="#CBD5E1" stroke-width="0.8"/>')
                svg.append(f'<text x="{x+8}" y="{ry+19}" font-family="Arial" font-size="16" fill="#172B3A"'+(' font-weight="bold"' if 'PK ' in label else '')+f'>{html.escape(label)}</text>')
        svg.append('</svg>');stem=f'figure-{number}'+(f'-{part+1}' if len(parts)>1 else '')
        (out/(stem+'.svg')).write_text(''.join(svg))
        manifest.append(dict(number=number,title=page.get('name'),part=part+1,parts=len(parts),file=str(out/(stem+'.png')),svg=str(out/(stem+'.svg')),width=W,height=H,printWidth=424.9,printHeight=H*424.9/W,printFieldFont=16*424.9/W,tables=[c.get('tableName') for c in main],relationships=len(es)))
assert len(covered)==len(set(covered))==40
assert edge_count==85
assert min(p['printFieldFont'] for p in manifest)>=8
assert max(p['printHeight'] for p in manifest)<580
(out/'manifest.json').write_text(json.dumps(manifest,indent=2))
print(json.dumps({'pages':len(manifest),'publicTables':len(covered),'relationships':edge_count,'minimumFieldFontPt':min(p['printFieldFont'] for p in manifest),'maxImageHeightPt':max(p['printHeight'] for p in manifest)}))
