import {readFile, writeFile, mkdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {resolve, dirname} from 'node:path';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = name => readFile(resolve(root, name), 'utf8');
const [template, css, app, corpus, dialogue, configText, portrait] = await Promise.all([
  read('src/template.html'), read('src/style.css'), read('src/app.js'), read('shared/corpus.mjs'), read('shared/dialogue.mjs'), read('config.json'), readFile(resolve(root, 'assets/anne-frank.jpg'))
]);
const config = JSON.parse(configText);
if (Object.keys(config).some(key => key !== 'dialogueEndpoint')) throw new Error('Seule dialogueEndpoint est autorisée dans la configuration publique.');
if (config.dialogueEndpoint) {
  const endpoint = new URL(config.dialogueEndpoint);
  if (endpoint.protocol !== 'https:' || endpoint.pathname !== '/dialogue' || endpoint.search || endpoint.hash || endpoint.username || endpoint.password) throw new Error('URL HTTPS requise : https://votre-service.workers.dev/dialogue');
}
const standalone = '(function(){\n' + corpus.replace(/^export /mg,'') + '\n' + dialogue.replace(/^import .*;\n/mg, '').replace(/^export /mg,'') + '\nconst APP_CONFIG = ' + JSON.stringify(config).replace(/</g,'\\u003c') + ';\n' + app + '\n})();';
const html = template.replace('/* STYLE */', () => css).replace('/* PORTRAIT */', () => 'data:image/jpeg;base64,' + portrait.toString('base64')).replace('/* APPLICATION */', () => standalone.replace(/<\/script/gi, '<\\/script'));
if (/\/\* (STYLE|PORTRAIT|APPLICATION) \*\//.test(html)) throw new Error('Emplacement non remplacé');
await writeFile(resolve(root,'index.html'),html);
await mkdir(resolve(root,'dist'),{recursive:true});
await writeFile(resolve(root,'dist/index.html'),html);
await writeFile(resolve(root,'dist/.nojekyll'),'');
console.log('index.html : ' + Buffer.byteLength(html) + ' octets, autonome, sans dépendance ni requête réseau au démarrage.');
