import json,re,html,pathlib
s=json.load(open('tmp/defense-audit/schema-current.json'));out=pathlib.Path('output/erd')
cols={}
for c in s['columns']:cols.setdefault(c['table_name'],[]).append(c)
pks={};uks={};fks=[]
for c in s['constraints']:
 t=c['table_name'];d=c['definition']
 if c['contype'] in ('p','u'):
  fields=tuple(x.strip(' "') for x in re.search(r'\(([^)]+)\)',d).group(1).split(','))
  uks.setdefault(t,[]).append(set(fields))
  if c['contype']=='p':pks[t]=set(fields)
 if c['contype']=='f':
  m=re.match(r'FOREIGN KEY \(([^)]+)\) REFERENCES ([\w.]+)\(([^)]+)\)',d);assert m,d
  field,parent,target=m.groups();assert ',' not in field
  parent=parent if '.' in parent else parent
  ccol=next(x for x in cols[t] if x['column_name']==field)
  fks.append(dict(child=t,field=field,parent=parent,target=target,optional=ccol['is_nullable']=='YES',unique={field} in uks.get(t,[]),definition=d))
# Uniqueness must be evaluated after all constraints have been read.
for f in fks:f['unique']={f['field']} in uks.get(f['child'],[])
groups=[('01','Fleet and identity',['profiles','branches','vehicle_categories','vehicles','vehicle_images','vehicle_operational_state_events']),('02','Bookings and requirements',['booking_requests','booking_creation_idempotency','booking_finder_context','renter_requirement_sets','renter_requirement_documents','renter_requirement_reviews']),('03','Payments and retained quotations',['payment_methods','payments','payment_proofs','booking_payment_quotes','rate_cards','booking_rate_quotes']),('04','Rental and maintenance',['rental_transactions','maintenance_records']),('05','Demand forecasting',['forecast_runs','forecasts','forecast_inputs','forecast_demand_coverage']),('06','Supply and allocation',['supply_evaluations','supply_evaluation_vehicles','allocation_recommendation_batches','allocation_recommendations','allocation_recommendation_candidates']),('07','Notifications and audit',['notifications','notification_preferences','operational_notification_conditions','email_deliveries','audit_events']),('08','Recovery and public contact',['backup_runs','backup_artifacts','recovery_drills','public_contact_settings','public_contact_locations','contact_inquiries'])]
assert sorted(t for _,_,ts in groups for t in ts)==sorted(cols)
def esc(x):return html.escape(str(x),quote=True)
def q(x):return json.dumps(x,ensure_ascii=False)
def node(t,detail,reference=False):
 fields=cols.get(t,[dict(column_name='id',udt_name='uuid',is_nullable='NO')]);keyfields=pks.get(t,{'id'} if t=='auth.users' else set())
 fkfields={f['field'] for f in fks if f['child']==t}
 if not detail:fields=[c for c in fields if c['column_name'] in keyfields|fkfields]
 if reference:fields=[c for c in fields if c['column_name'] in keyfields|{f['target'] for f in fks if f['parent']==t}]
 rows=[]
 for c in fields:
  n=c['column_name'];mark=('PK ' if n in keyfields else '')+('FK ' if n in fkfields else '')
  typ=c['udt_name'];
  if typ=='numeric' and c.get('numeric_precision'):typ+=f"({c['numeric_precision']},{c['numeric_scale']})"
  rows.append(f'<TR><TD ALIGN="LEFT">{esc(mark+n)}</TD><TD ALIGN="LEFT">{esc(typ)}</TD><TD>{"NULL" if c["is_nullable"]=="YES" else "NOT NULL"}</TD></TR>')
 color='#e2e8f0' if reference else '#163e5b';fg='#263746' if reference else 'white'
 label=f'<TABLE BORDER="0" CELLBORDER="1" CELLSPACING="0" CELLPADDING="6"><TR><TD COLSPAN="3" BGCOLOR="{color}"><FONT COLOR="{fg}"><B>{esc(t)}</B>{" (reference)" if reference else ""}</FONT></TD></TR>'+''.join(rows)+'</TABLE>'
 return f'{q(t)} [label=<{label}>];'
def graph(title,tables,detail,allrefs=False):
 edges=[f for f in fks if f['child'] in tables];parents={f['parent'] for f in edges};refs=parents-set(tables)
 lines=['digraph ERD {','graph [rankdir=LR, bgcolor="white", nodesep=0.5, ranksep=1.5, pad=0.4, splines=polyline, overlap=false, fontname="Arial", fontsize=20, labelloc=t, label='+q(title+'\nPK = primary key; FK = foreign key. Labels show database-enforced multiplicity.')+'];','node [shape=plain,fontname="Arial",fontsize=11];','edge [fontname="Arial",fontsize=9,color="#64748b",fontcolor="#334155",arrowsize=0.6];']
 for t in tables:lines.append(node(t,detail))
 for t in sorted(refs):lines.append(node(t,False,True))
 for f in edges:
  parentcard='0..1' if f['optional'] else '1';childcard='0..1' if f['unique'] else '0..N'
  lines.append(f'{q(f["child"])} -> {q(f["parent"])} [dir=none,label={q(f["field"]+" → "+f["target"])},taillabel={q(childcard)},headlabel={q(parentcard)},labeldistance=2];')
 return '\n'.join(lines+['}'])
manifest=[dict(file='00-overview',title='ERD overview - keys and relationships',tables=sorted(cols))]
(out/'00-overview.dot').write_text(graph('Briah Car Rental - ERD overview',sorted(cols),False))
(out/'09-full-physical.dot').write_text(graph('Briah Car Rental - full physical ERD (478 public columns)',sorted(cols),True))
for n,title,tables in groups:
 stem=n+'-'+title.lower().replace(' ','-');(out/(stem+'.dot')).write_text(graph(title,tables,True));manifest.append(dict(file=stem,title=title,tables=tables))
manifest.append(dict(file='09-full-physical',title='Full physical ERD - all columns',tables=sorted(cols)))
(out/'manifest.json').write_text(json.dumps(manifest,indent=2))
(out/'relationships.json').write_text(json.dumps(fks,indent=2))
(out/'README.md').write_text('''# Briah Car Rental ERD review package\n\nBased on the database snapshot audited on 2 October 2026: 40 public tables, 478 public columns, 85 foreign-key relationships. `auth.users` appears only as an external referenced entity.\n\nOpen `index.html` for a zoomable overview and eight complete detail diagrams. The full physical diagram is also provided for tracing all relationships. SVG files remain sharp when zoomed and can be imported into diagrams.net as images. DOT files are editable diagram source.\n\nEach detail diagram shows all columns of its assigned tables and every outgoing FK. Grey reference boxes repeat the target keys of tables documented in other diagrams. No table is cut across image slices.\n\nMultiplicity is derived from FK nullability and single-column uniqueness: a child references 1 parent, or 0..1 if its FK is nullable; a parent can have 0..N children, or 0..1 where that FK is unique. Composite uniqueness does not imply uniqueness of an individual FK. Mandatory child existence cannot be inferred from a FK. These are implemented database constraints, not invented business requirements.\n\nRetained `rate_cards` and `booking_rate_quotes` are shown because they remain in the physical database; this does not imply the active booking workflow uses them. This package has not been inserted into the official manuscript. Choose readable detail diagrams rather than shrinking the overview to one portrait page.\n''')
print(json.dumps({'tables':len(cols),'columns':sum(map(len,cols.values())),'relationships':len(fks),'detail_relationships':sum(sum(f['child'] in ts for f in fks) for _,_,ts in groups),'diagrams':len(manifest)}))
