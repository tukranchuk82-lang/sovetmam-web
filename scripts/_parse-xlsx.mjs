import { readFileSync, readdirSync } from "fs";
const dir = process.argv[2];
const ss = readFileSync(dir+"/xl/sharedStrings.xml","utf8");
const dec = s=>s.replace(/&amp;/g,"&").replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&quot;/g,'"').replace(/&apos;/g,"'").replace(/&#10;/g,"\n").replace(/&#xA;/g,"\n");
const strings = [];
for (const m of ss.matchAll(/<si>([\s\S]*?)<\/si>/g)){
  let txt = ""; for (const t of m[1].matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)) txt += t[1];
  strings.push(dec(txt));
}
const sheets = readdirSync(dir+"/xl/worksheets").filter(f=>f.endsWith(".xml")).sort();
for (const sh of sheets){
  const xml = readFileSync(dir+"/xl/worksheets/"+sh,"utf8");
  console.log(`\n######## ${sh} ########`);
  for (const row of xml.matchAll(/<row\b[^>]*>([\s\S]*?)<\/row>/g)){
    const cells = [];
    for (const c of row[1].matchAll(/<c\b([^>]*)>([\s\S]*?)<\/c>/g)){
      const attrs = c[1], body = c[2];
      const type = (attrs.match(/\bt="([^"]+)"/)||[])[1];
      const vm = body.match(/<v>([\s\S]*?)<\/v>/);
      const ism = body.match(/<t[^>]*>([\s\S]*?)<\/t>/);
      let val = "";
      if (type==="inlineStr" && ism) val = dec(ism[1]);
      else if (vm) val = (type==="s") ? (strings[+vm[1]]??"") : vm[1];
      cells.push(val.replace(/\s+/g," ").trim());
    }
    const line = cells.join("  ||  ").trim();
    if (line.replace(/\|/g,"").trim()) console.log(line);
  }
}
