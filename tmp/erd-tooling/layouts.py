exec(open('tmp/erd-tooling/build.py').read().split("manifest=[")[0])
for n,title,tables in groups:
 g=graph(title,tables,False).replace('splines=polyline','splines=ortho')
 g=re.sub(r'label="[^"\n]* → [^"\n]*",','',g)
 (out/(n+'-manuscript.dot')).write_text(g)
for t in cols:
 g=graph(t,[t],True).replace('splines=polyline','splines=ortho')
 g=re.sub(r'label="[^"\n]* → [^"\n]*",','',g)
 (out/('physical-'+t+'.dot')).write_text(g)
