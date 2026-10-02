import fs from 'node:fs';
import path from 'node:path';

function patchFile(p) {
  if (!fs.existsSync(p)) return;
  let content = fs.readFileSync(p, 'utf-8');
  let changed = false;

  // 1. shouldUpdateComponent: component.emitsOptions
  if (content.includes('component.emitsOptions')) {
    content = content.replaceAll(
      'component.emitsOptions',
      '(component ? component.emitsOptions : null)'
    );
    changed = true;
  }

  // 2. instance.emitsOptions
  if (content.includes('instance.emitsOptions')) {
    content = content.replaceAll(
      'instance.emitsOptions',
      '(instance ? instance.emitsOptions : null)'
    );
    changed = true;
  }

  // 3. updateComponent: null instance guard
  if (content.includes('const instance = n2.component = n1.component;\n    if (shouldUpdateComponent(n1, n2, optimized)) {')) {
    content = content.replace(
      'const instance = n2.component = n1.component;\n    if (shouldUpdateComponent(n1, n2, optimized)) {',
      'const instance = n2.component = n1.component;\n    if (!instance) { mountComponent(n2, container, anchor, parentComponent, parentSuspense, namespace, optimized); return; }\n    if (shouldUpdateComponent(n1, n2, optimized)) {'
    );
    changed = true;
  }

  // 4. useCssVars parentNode null guard
  if (content.includes('ob.observe(instance.subTree.el.parentNode, { childList: true });')) {
    content = content.replace(
      'ob.observe(instance.subTree.el.parentNode, { childList: true });',
      'const parent = instance.subTree && instance.subTree.el && instance.subTree.el.parentNode; if (parent) ob.observe(parent, { childList: true });'
    );
    changed = true;
  }

  // 5. patch n2 null guard: const { type, ref, shapeFlag } = n2;
  if (content.includes('const { type, ref, shapeFlag } = n2;') && !content.includes('if (!n2) return;\n    const { type, ref, shapeFlag } = n2;')) {
    content = content.replace(
      'const { type, ref, shapeFlag } = n2;',
      'if (!n2) return;\n    const { type, ref, shapeFlag } = n2;'
    );
    changed = true;
  }

  // 6. unmount vnode null guard: const { type, el, anchor, transition } = vnode;
  if (content.includes('const { type, el, anchor, transition } = vnode;') && !content.includes('if (!vnode) return;\n    const { type, el, anchor, transition } = vnode;')) {
    content = content.replace(
      'const { type, el, anchor, transition } = vnode;',
      'if (!vnode) return;\n    const { type, el, anchor, transition } = vnode;'
    );
    changed = true;
  }

  // 7. remove child parentNode guard
  if (content.includes('const parent = child.parentNode;\n    if (parent) {')) {
    content = content.replace(
      'const parent = child.parentNode;\n    if (parent) {',
      'const parent = child && child.parentNode;\n    if (parent) {'
    );
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(p, content, 'utf-8');
    console.log(`Successfully patched: ${p}`);
  }
}

// Fixed core files
const fixed = [
  'node_modules/@vue/runtime-core/dist/runtime-core.esm-bundler.js',
  'node_modules/@vue/runtime-core/dist/runtime-core.cjs.js',
  'node_modules/@vue/runtime-dom/dist/runtime-dom.esm-bundler.js',
  'node_modules/@vue/runtime-dom/dist/runtime-dom.cjs.js',
];
for (const rel of fixed) {
  patchFile(path.resolve(process.cwd(), rel));
}

// Vite deps directory files if present
const viteDeps = path.resolve(process.cwd(), 'node_modules/.vite/deps');
if (fs.existsSync(viteDeps)) {
  for (const f of fs.readdirSync(viteDeps)) {
    if (f.endsWith('.js') && (f.startsWith('vue') || f.includes('runtime'))) {
      patchFile(path.join(viteDeps, f));
    }
  }
}
