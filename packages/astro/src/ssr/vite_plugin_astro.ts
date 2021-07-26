import type { Plugin } from 'vite';
import type { CompileOptions } from '../@types/compiler';

import fs from 'fs';
import path from 'path';
import slash from 'slash';
import { fileURLToPath } from 'url';
import { compileComponent } from '../compiler/index.js';

/** Allow Vite to load .astro files */
export default function astro(compileOptions: CompileOptions): Plugin {
  const buildCache = new URL('./.astro-cache/', compileOptions.astroConfig.projectRoot);
  const buildCSSCache = new URL('./css/', buildCache);

  // start loading renderers on init
  let rendererInstancesPromise = Promise.all((compileOptions.astroConfig.renderers || []).map((name) => import(name).then((m) => m.default)));

  return {
    name: '@astrojs/vite-plugin-astro',
    enforce: 'pre', // we want to load .astro files before anything else can!
    async load(id) {
      if (id.endsWith('__astro_component.js')) {
        let code = '';
        let rendererInstances = await rendererInstancesPromise;
        let contentsPromise = fs.promises.readFile(id, 'utf8');
        rendererInstances.forEach((renderer, n) => {
          code += `import __renderer_${n} from '${renderer.name}${renderer.server.replace(/^\./, '')}';`;
        });
        code += `\nconst rendererInstances = [`;
        rendererInstances.forEach((renderer, n) => {
          code += `\n  { source: '${renderer.name}${renderer.client.replace(/^\./, '')}', renderer: __renderer_${n}, polyfills: [], hydrationPolyfills: [] },`;
        });
        code += `\n];`;
        code += '\n';
        code += await contentsPromise;
        console.log({ code });
        return code;
      }
      if (id.endsWith('.astro') || id.endsWith('.md')) {
        const src = await fs.promises.readFile(id, 'utf8');
        const result = await compileComponent(src, {
          compileOptions,
          filename: id,
          projectRoot: fileURLToPath(compileOptions.astroConfig.projectRoot),
        });
        let code = result.contents;
        if (result.css && result.css.code) {
          const cssID = `${slash(id).replace(compileOptions.astroConfig.projectRoot.pathname, '/')}.css`;
          // write to file system
          const filePath = new URL(`.${cssID}`, buildCSSCache);
          const relPath = path.posix.relative(slash(path.dirname(id)), fileURLToPath(buildCSSCache));
          await fs.promises.mkdir(new URL('./', filePath), { recursive: true });
          await fs.promises.writeFile(filePath, result.css.code, 'utf8');
          if (result.css.map) await fs.promises.writeFile(filePath + '.map', result.css.map.toString(), 'utf8');
          code += `import '${relPath}${cssID}'\n;`;
        }
        return code;
      }
      return null;
    },
  };
}
