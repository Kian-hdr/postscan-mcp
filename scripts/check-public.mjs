import {readdir,readFile} from 'node:fs/promises';
import {join} from 'node:path';
const ignored=new Set(['.git','node_modules','dist','worker','artifacts','.sites-runtime']);
const patterns=[/gh[pousr]_[A-Za-z0-9]{20,}/,/github_pat_[A-Za-z0-9_]{20,}/,/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,/appgprj_[A-Za-z0-9_-]{12,}/,/plugin_asdk_app_sites_[A-Za-z0-9_-]{12,}/,/https:\/\/[^\s"']*oaiusercontent\.com\/files\/[^\s"']+\/raw\?/,/\/(?:Users|home)\/[A-Za-z0-9_.-]+\//];
let checked=0,failures=[];
async function walk(dir){for(const e of await readdir(dir,{withFileTypes:true})){if(ignored.has(e.name))continue;const p=join(dir,e.name);if(e.isSymbolicLink()){failures.push(p+': symbolic link needs review');continue;}if(e.isDirectory()){await walk(p);continue;}if(p.endsWith('scripts/check-public.mjs'))continue;if(/\.(?:png|pdf)$/.test(p)){checked++;continue;}if(/^\.env|^\.dev\.vars/.test(e.name)&&!e.name.endsWith('.example')){failures.push(p+': runtime configuration');continue;}const text=await readFile(p,'utf8');checked++;if(patterns.some(x=>x.test(text)))failures.push(p+': private identity or credential-like material');}}
await walk('.');
const manifest=JSON.parse(await readFile('.openai/hosting.json','utf8'));if(manifest.project_id)failures.push('.openai/hosting.json: remove deployment identity before public export');
if(failures.length){console.error(failures.join('\n'));process.exit(1);}console.log('Public-tree pattern check passed for '+checked+' files. Inspect binary fixtures and Git history separately.');
