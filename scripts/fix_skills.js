const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const dir = 'C:/Users/Nam/.gemini/antigravity/skills/skills';
const items = fs.readdirSync(dir);
let fixedCount = 0;
let stillFailing = [];

for (const item of items) {
  const itemPath = path.join(dir, item);
  if (!fs.statSync(itemPath).isDirectory()) continue;
  const skillFile = path.join(itemPath, 'SKILL.md');
  if (!fs.existsSync(skillFile)) continue;
  let content = fs.readFileSync(skillFile, 'utf8');
  const endIdx = content.indexOf('---', 3);
  if (endIdx === -1) continue;
  let fmRaw = content.substring(3, endIdx);
  
  let needsFix = false;
  try {
    yaml.load(fmRaw);
  } catch (e) {
    needsFix = true;
  }
  
  if (needsFix) {
    let lines = fmRaw.split(/\r?\n/);
    for (let i = 0; i < lines.length; i++) {
      let l = lines[i];
      // Case 1: description: ">" or "|" or ">-" or "|-"
      if (/^description:\s*["'](>|\||>-|\|-)["']\s*$/.test(l)) {
        lines[i] = l.replace(/["']/g, '');
      } else if (/^description:\s*"(.*)"\s*$/.test(l) && i + 1 < lines.length && /^\s{2,}\S/.test(lines[i + 1])) {
        // Case 2: description: "first line" followed by indented lines
        const match = l.match(/^description:\s*"(.*)"\s*$/);
        if (match) {
          lines[i] = 'description: >\n  ' + match[1];
        }
      }
    }
    const newFm = lines.join('\n');
    try {
      const parsed = yaml.load(newFm);
      if (parsed.name && parsed.description) {
        fixedCount++;
        // Apply fix to file
        const newContent = '---' + newFm + content.substring(endIdx);
        fs.writeFileSync(skillFile, newContent, 'utf8');
      } else {
        stillFailing.push({ item, reason: 'Missing name or desc after parse' });
      }
    } catch (e2) {
      stillFailing.push({ item, err: e2.message, lines: lines.slice(0, 8) });
    }
  }
}

console.log('Fixed count:', fixedCount);
console.log('Still failing count:', stillFailing.length);
if (stillFailing.length > 0) {
  console.log('First 5 still failing:', JSON.stringify(stillFailing.slice(0, 5), null, 2));
}
