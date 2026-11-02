// Build a double-clickable, self-contained homepage for visual approval.
import { build } from 'esbuild';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { project } from '../src/data/portfolio.js';

const root = fileURLToPath(new URL('../', import.meta.url));
const built = await readFile(path.join(root,'dist/index.html'),'utf8');
const bundle = await build({
  absWorkingDir:root,bundle:true,minify:true,write:false,format:'iife',jsx:'automatic',
  define:{'process.env.NODE_ENV':'"production"','import.meta.env':'{}'},
  stdin:{resolveDir:root,loader:'jsx',contents:`
    import {createRoot} from 'react-dom/client';
    import App from './src/App.jsx';
    createRoot(document.getElementById('root')).render(<App/>);
    document.addEventListener('click', e => {
      const link=e.target.closest('a');
      if(link?.getAttribute('href')?.startsWith('/')){
        link.href=new URL(link.getAttribute('href'),'https://fazhere.com').href;
      }
    },true);`},
  plugins:[{name:'use-built-styles',setup(b){b.onLoad({filter:/\.css$/},()=>({contents:'',loader:'js'}));}}],
});
const styles = [...new Set([...built.matchAll(/<link\b[^>]*href="([^"]+\.css)"[^>]*>/g)].map(m=>m[1]))];
let css = (await Promise.all(styles.map(p=>readFile(path.join(root,'dist',p),'utf8')))).join('\n');
css = css.replace(/@import[^;]+;/g,'');
const fonts=await readFile(path.join(root,'public/fonts/fonts.css'),'utf8');
css=fonts+'\n'+css;
const fontsUsed=[...new Set([...css.matchAll(/\/fonts\/[\w.-]+\.woff2/g)].map(m=>m[0]))];
for(const f of fontsUsed) css=css.replaceAll(f,'data:font/woff2;base64,'+(await readFile(path.join(root,'public',f))).toString('base64'));
let script=bundle.outputFiles[0].text;
for(const f of [project.screenshot,'/characters/favas-character.webp','/images/projects/gymdrobe-mobile-20261102.webp','/images/projects/gymdrobe-shirt-black.webp','/images/projects/gymdrobe-shirt-red.webp']){
  script=script.replaceAll(f,'data:image/webp;base64,'+(await readFile(path.join(root,'public',f))).toString('base64'));
}
const file=path.join(root,'.sites-runtime/Fazhere-Worktable-Preview.html');
await mkdir(path.dirname(file),{recursive:true});
await writeFile(file,'<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Fazhere — Worktable design preview</title><style>'+css+'</style></head><body><div id="root"></div><script>'+script.replace(/<\/script/gi,'<\\/script')+'</script></body></html>');
console.log(file);
