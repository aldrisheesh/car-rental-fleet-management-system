from pathlib import Path
import json,xml.etree.ElementTree as E,html,zipfile
out=Path('output/erd-editable');schema=json.load(open('tmp/defense-audit/schema-current.json'));relationships=json.load(open('output/erd/relationships.json'));manifest=json.load(open('output/erd/manifest.json'));expected=sorted((r['child'],r['field'],r['parent']) for r in relationships)
verification={}
for f in out.glob('*.drawio'):
 root=E.parse(f).getroot();edges=[];ownfields=[];owntables=set()
 for i,d in enumerate(root):
  cs=list(d.iter('mxCell'));ids={c.get('id'):c for c in cs}
  for c in cs:
   if c.get('fieldName') and ids[c.get('parent')].get('reference')=='0':ownfields.append((ids[c.get('parent')].get('tableName'),c.get('fieldName')));owntables.add(ids[c.get('parent')].get('tableName'))
   if c.get('edge') and (f.stem!='Briah-ERD-Manuscript' or i>0):
    edges.append((c.get('childTable'),c.get('fkColumn'),c.get('parentTable')))
    assert c.get('source') in ids and c.get('target') in ids
 assert sorted(edges)==expected,(f,len(edges))
 assert owntables==set(c['table_name'] for c in schema['columns'])
 if f.stem=='Briah-ERD-Complete-Attributes':assert sorted(ownfields)==sorted((c['table_name'],c['column_name']) for c in schema['columns'])
 verification[f.name]={'pages':len(root),'public_tables':len(owntables),'foreign_keys':len(edges),'complete_attributes':478 if f.stem=='Briah-ERD-Complete-Attributes' else 'keys only'}
for directory in ['images','print-panels']:
 for f in (out/directory).glob('*.json'):
  data=json.loads(f.read_text());assert data['svg'].endswith('</svg>');assert f.with_suffix('.png').exists();assert f.with_suffix('.svg').exists()
  if directory=='print-panels':assert data['text'][0]['text']==f.stem,(f,data['text'][0]['text'])
(out/'verification.json').write_text(json.dumps(verification,indent=2))
intro='The entity–relationship diagrams present the implemented database structure of the Briah Car Rental and Fleet Management System. The diagrams show primary keys, foreign keys, and the relationships between entities, while the accompanying data dictionary provides the complete field definitions. The model is divided into functional sections to improve readability. Repeated grey entities identify references to tables documented in another section; they do not represent additional tables. Relationship multiplicities follow the database foreign-key, nullability, and uniqueness constraints.'
guide=f'''# Briah ERD transfer guide

Prepared from the audited database schema snapshot on 2 October 2026: **40 public tables, 478 columns, and 85 declared foreign keys**. The externally managed `auth.users` entity is shown only by its referenced key and is not included in the count of public tables. No customer records are included.

## Files

- `Briah-ERD-Manuscript.drawio`: overview and eight functional sections, with native editable entities and connectors.
- `images/`: nine SVG diagrams and high-resolution PNGs corresponding to the grouped file. The overview is a reference map; do not compress it into a small portrait figure and expect every field to remain readable.
- `Briah-ERD-Manuscript-Detail-Panels.drawio` and `print-panels/`: forty compact panels, one main table per panel, with its outgoing relationships. Use these as continued figures where a grouped image becomes too small, especially the booking section. A panel with no connector represents an entity without a declared outgoing foreign key; incoming relationships appear on the child entity's panel.
- `Briah-ERD-Complete-Attributes.drawio`: forty reference pages containing all 478 attributes, verified against the schema snapshot. This is a reference companion to the dictionary, rather than a requirement to add another forty full-attribute figures to the manuscript.
- `index.html`: preview gallery.
- `verification.json`: structural coverage results.

## Suggested manuscript introduction

{intro}

## Insertion sequence and caption wording

Use the numbering already required by the manuscript. Assign actual figure numbers only during transfer, then update the List of Figures and page references after pagination is stable.

| Order | Diagram | Suggested caption |
|---|---|---|
'''
for i,f in enumerate(sorted((out/'images').glob('*.svg')),1):
 d=json.loads(f.with_suffix('.json').read_text());title=d['text'][0]['text'];guide+=f'| {i} | `{f.name}` | Entity–relationship diagram — {title.lower()} |\n'
guide+='''
## Transfer with the updated dictionary

1. Use the updated **Revised Database Schema and Dictionary** tab in the separate manuscript as the dictionary source. Do not copy the older dictionary from the original proposal.
2. Place the ERD introduction and diagrams in the database-design section before the complete data dictionary, following the manuscript's existing figure and table style.
3. Insert PNGs through the document's image controls. Keep the original proportions. Use landscape sections where permitted. If text becomes too small at the required page size, replace the affected grouped image with the matching compact panels as continued figures; do not shrink the complete overview to serve as the only ERD.
4. Keep the grouped section order below when using compact panels. Each panel is named after its main table. All tables appear once as a main entity across the detail collection; grey references may repeat.
5. Retain the complete dictionary's exact table names, field names, types, nullability, and constraints. Grey `(ref)` labels belong only to the ERD and are not part of database table names.
6. Reconcile figure numbers, table numbers, cross-references, List of Figures, List of Tables, and page references after insertion. Review the final exported manuscript at its actual page size to confirm readable text and intact captions.

The official Chapters 1–3 manuscript has not been modified during this ERD preparation. Its final pagination and submission readiness must be checked after transfer.

## Compact-panel grouping

'''
for item in manifest[1:9]:
 guide+='### '+item['title']+'\n\n'+', '.join('`'+t+'`' for t in item['tables'])+'.\n\n'
guide+='''## Notation

- PK: primary key. Multiple PK-labelled attributes collectively form a composite primary key.
- FK: declared foreign key.
- `?` after a type: nullable column.
- Crow's foot: many; circle: zero; bar: one. A non-null child foreign key points to one parent. A nullable child foreign key allows zero or one parent. A parent may have zero children; a unique child foreign key limits the child count to at most one.
- Grey reference boxes identify existing entities shown elsewhere. Unconnected tables are not assigned invented relationships merely because they contain a UUID or a similarly named field.

## Scope of verification

The table and relationship coverage was checked against the audited schema snapshot. All 478 attributes in the complete reference file were matched by table and column name. The compact and grouped detail collections each contain the same 85 declared foreign keys. The grouped and compact panels were rendered through diagrams.net; the provided SVG/PNG files preserve the rendered entity and connector geometry. No application code, database records, or official manuscript content was changed.
'''
(out/'TRANSFER-GUIDE.md').write_text(guide)
sections=[]
for folder,title in [('images','Grouped ERDs'),('print-panels','Compact panels for continued figures')]:
 cards=[]
 for f in sorted((out/folder).glob('*.svg')):
  label=json.loads(f.with_suffix('.json').read_text())['text'][0]['text'];cards.append(f'<article><h3>{html.escape(label)}</h3><a href="{folder}/{f.name}"><img src="{folder}/{f.name}" alt="{html.escape(label)}"></a><p><a href="{folder}/{f.stem}.png">PNG</a> · <a href="{folder}/{f.name}">SVG</a></p></article>')
 sections.append('<h2>'+title+'</h2>'+''.join(cards))
(out/'index.html').write_text('<!doctype html><html><head><meta charset="utf-8"><title>Briah ERD manuscript package</title><style>body{font:16px Arial;max-width:1200px;margin:40px auto;color:#173e5b}article{border-top:1px solid #ccd5dd;margin:35px 0;padding-top:20px}img{max-width:100%;height:auto;background:white}a{color:#225b85}p{line-height:1.6}</style></head><body><h1>Briah ERD manuscript package</h1><p>40 public tables · 478 columns · 85 foreign keys. Read TRANSFER-GUIDE.md before manuscript insertion.</p>'+''.join(sections)+'</body></html>')
with zipfile.ZipFile('output/Briah-ERD-Manuscript-Package.zip','w',zipfile.ZIP_DEFLATED) as z:
 for f in out.rglob('*'):
  if f.is_file() and f.suffix!='.json' or (f.is_file() and f.name=='verification.json'):z.write(f,'Briah-ERD-Manuscript-Package/'+str(f.relative_to(out)))
print(json.dumps(verification,indent=2))
print('Packaged editable diagrams, 49 SVGs, 49 PNGs, preview gallery, and transfer guide')
