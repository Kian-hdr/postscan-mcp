import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
const [input,output]=process.argv.slice(2);
if(!input||!output||resolve(input)===resolve(output))throw new Error('Supply separate input and output ZIP paths. Python 3 is required.');
const icon=fileURLToPath(new URL('../assets/postscan-icon.png',import.meta.url));
const program=`
from zipfile import ZipFile,ZIP_DEFLATED
from pathlib import Path
import json,sys
source,target,icon=sys.argv[1:]
with ZipFile(source) as old:
 names=old.namelist()
 if '.app.json' not in names or '.codex-plugin/plugin.json' not in names: raise ValueError('Expected a generated Sites plugin ZIP')
 manifest=json.loads(old.read('.codex-plugin/plugin.json'))
 manifest.setdefault('interface',{}).update({'logo':'./assets/postscan-icon.png','composerIcon':'./assets/postscan-icon.png','logoDark':'./assets/postscan-icon.png','composerIconDark':'./assets/postscan-icon.png','brandColor':'#FFCC00','brandColorDark':'#FFCC00'})
 # Keep the existing name, version and app identity. The upload service owns revisions.
 with ZipFile(target,'x',ZIP_DEFLATED) as new:
  for name in names:
   if name=='assets/postscan-icon.png': continue
   new.writestr(name,json.dumps(manifest,indent=2) if name=='.codex-plugin/plugin.json' else old.read(name))
  new.writestr('assets/postscan-icon.png',Path(icon).read_bytes())
print('Branded package saved. It contains private instance identifiers; do not publish it.')
`;
const result=spawnSync('python3',['-c',program,resolve(input),resolve(output),icon],{stdio:'inherit'});if(result.error)throw result.error;process.exit(result.status??1);
