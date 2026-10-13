import { build } from 'esbuild';
import { mkdir,copyFile } from 'node:fs/promises';
await mkdir('worker',{recursive:true});
await build({entryPoints:['src/index.js'],outfile:'worker/index.js',bundle:true,format:'esm',platform:'browser',target:'es2022',minify:true,loader:{'.svg':'text','.png':'base64'}});
await mkdir('dist/server',{recursive:true});await mkdir('dist/.openai',{recursive:true});
await copyFile('worker/index.js','dist/server/index.js');await copyFile('.openai/hosting.json','dist/.openai/hosting.json');
