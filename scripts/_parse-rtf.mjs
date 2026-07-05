import { readFileSync } from "fs";
const td1251 = new TextDecoder("windows-1251");
const dec1251 = b => (b < 0x80) ? String.fromCharCode(b) : td1251.decode(new Uint8Array([b]));
const rtf = readFileSync(process.argv[2], "latin1");
const len = rtf.length;
const BS = String.fromCharCode(92); // backslash
const isAlpha = c => (c >= "a" && c <= "z") || (c >= "A" && c <= "Z");
let out = [], i = 0;
while (i < len) {
  const c = rtf[i];
  if (c === BS) {
    const n = rtf[i + 1];
    if (n === "'") { const hex = rtf.substr(i + 2, 2); out.push(dec1251(parseInt(hex, 16))); i += 4; continue; }
    if (n === "u" && (rtf[i+2] === "-" || (rtf[i+2] >= "0" && rtf[i+2] <= "9"))) {
      let j = i + 2, sign = ""; if (rtf[j] === "-") { sign = "-"; j++; }
      let num = ""; while (j < len && rtf[j] >= "0" && rtf[j] <= "9") { num += rtf[j]; j++; }
      let code = parseInt(sign + num, 10); if (code < 0) code += 65536;
      out.push(String.fromCharCode(code));
      if (rtf[j] === " ") j++;
      if (rtf[j] === BS && rtf[j + 1] === "'") j += 4;
      else if (rtf[j] === "?") j++;
      else if (rtf[j] && rtf[j] !== BS && rtf[j] !== "{" && rtf[j] !== "}") j++;
      i = j; continue;
    }
    if (isAlpha(n)) {
      let j = i + 1, word = ""; while (j < len && isAlpha(rtf[j])) { word += rtf[j]; j++; }
      if (rtf[j] === "-") j++; while (j < len && rtf[j] >= "0" && rtf[j] <= "9") j++;
      if (rtf[j] === " ") j++;
      if (word === "par" || word === "row" || word === "line") out.push("\n");
      else if (word === "cell" || word === "tab") out.push("\t");
      i = j; continue;
    }
    if (n === BS || n === "{" || n === "}") { out.push(n); i += 2; continue; }
    i += 2; continue;
  }
  if (c === "{" || c === "}" || c === "\r" || c === "\n") { i++; continue; }
  out.push(c); i++;
}
let text = out.join("").split("\n").map(l => l.replace(/[ \t]+/g, " ").trim()).filter(Boolean).join("\n");
console.log(text);
