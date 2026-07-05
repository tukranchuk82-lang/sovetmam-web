import { readFileSync } from "fs";
const buf = readFileSync(process.argv[2]);
const out = [];
// scan for UTF-16LE runs of Cyrillic/latin/punct
let cur = "";
for (let i=0;i+1<buf.length;i+=2){
  const code = buf[i] | (buf[i+1]<<8);
  const ok = (code>=0x0410&&code<=0x044F)||code===0x0401||code===0x0451||(code>=0x20&&code<=0x7E)||code===0x2116||code===0x2013||code===0x2014||code===0xAB||code===0xBB||code===0x2019||code===0x2026;
  if(ok){ cur += String.fromCharCode(code); }
  else { if(cur.length>=6) out.push(cur); cur=""; }
}
if(cur.length>=6) out.push(cur);
// also cp1251 single-byte runs
const td=new TextDecoder("windows-1251");
let s=null;
for(let i=0;i<buf.length;i++){
  const b=buf[i];
  const ok=(b>=0xC0&&b<=0xFF)||b===0xA8||b===0xB8||(b>=0x20&&b<=0x7E);
  if(ok){ if(s===null)s=i; }
  else { if(s!==null&&i-s>=8){ out.push(td.decode(buf.subarray(s,i))); } s=null; }
}
// dedup + filter to lines with cyrillic
const seen=new Set();
for(const t of out){ const x=t.replace(/\s+/g," ").trim(); if(x.length>=8 && /[А-Яа-я]{4}/.test(x) && !seen.has(x)){ seen.add(x); console.log(x); } }
