// @ts-ignore
import * as prettier from 'https://unpkg.com/prettier@3.4.2/standalone.mjs';
// @ts-ignore
import prettierPluginBabel from 'https://unpkg.com/prettier@3.4.2/plugins/babel.mjs';
// @ts-ignore
import prettierPluginEstree from 'https://unpkg.com/prettier@3.4.2/plugins/estree.mjs';

export const formatCode = (code: string): Promise<string> => {
  return prettier.format(code, {
    parser: 'babel',
    plugins: [prettierPluginBabel, prettierPluginEstree],
  });
};
