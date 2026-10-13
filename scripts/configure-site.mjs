import {readFile,writeFile} from 'node:fs/promises';
const id=process.argv[2];
if(!id || process.argv.length!==3 || !/^appgprj_[A-Za-z0-9_-]+$/.test(id))throw new Error('Supply the exact project ID returned by Sites.');
const path=new URL('../.openai/hosting.json',import.meta.url);const manifest=JSON.parse(await readFile(path,'utf8'));
if(manifest.project_id&&manifest.project_id!==id)throw new Error('An existing project is configured; refusing to replace its identity.');
manifest.project_id=id;await writeFile(path,JSON.stringify(manifest,null,2)+'\n');console.log('Saved the selected Site identity. Do not publish this configured manifest as a generic template.');
