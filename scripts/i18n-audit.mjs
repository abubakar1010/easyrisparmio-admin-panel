// Italian-first guard for the dashboard.
//
//   node scripts/i18n-audit.mjs              fail on missing translations or hard-coded UI text
//   node scripts/i18n-audit.mjs --inventory  list every hard-coded UI string candidate
//
// Every string an admin can read must come from the locale files, with Italian as
// the source of truth. The scan follows a literal through ternaries, `||`/`??`
// fallbacks and template strings to where it is displayed (JSX text, a display
// attribute or property, or a message/notification call).
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

export const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]));

export const displayNames = new Set([
  'label', 'title', 'description', 'placeholder', 'message', 'okText', 'cancelText', 'confirmButtonText',
  'cancelButtonText', 'text', 'tooltip', 'emptyText', 'aria-label', 'alt', 'help', 'extra', 'content',
  'note', 'hint', 'caption', 'heading', 'subtitle', 'subTitle', 'addonBefore', 'addonAfter', 'suffix', 'prefix', 'checkedChildren', 'unCheckedChildren', 'notFoundContent',
]);

const displayCall = /^(?:message|notification|toast|messageApi|notificationApi|modal|Modal)\.(?:success|error|warning|info|open|loading|confirm)$|^(?:Swal\.fire|alert|confirm|setError|setSubmitError|setFormError|errorMessageAlert)$/;

/** Text that is legitimately the same in every language. */
const untranslatable = [
  /^(?:ID|IBAN|PEC|POD|PDR|POD \/ PDR|CAP|SLA:?|OCR|PDF|CSV|FAQ|VAT|kWh|SMc|Smc|MI|v|IT|EN|\(EUR\)|Email|E-mail|Italiano|English|VYZI|VYZI S\.r\.l\.|VYZI)$/,
  /^https?:\/\//, /^[^\s@]+@[^\s@]+\.[^\s@]+$/, // URLs, emails
  /^(?:IT\d|RSSMRA|Mario|Rossi|Via Roma|Milano|Enel Energia|\d)/, // Italian sample values in placeholders
  /^&[a-z]+;$/, // HTML entities
];

const looksTranslatable = (value) => {
  const v = value.replace(/\s+/g, ' ').trim();
  if (!/[A-Za-z]{2,}/.test(v)) return false;
  if (/^[a-z0-9_.\-/:#?=&%]+$/.test(v)) return false; // keys, identifiers, paths, classes
  if (/^[\w-]+(?:\.[\w-]+)+$/.test(v)) return false; // dotted i18n keys
  if (/^(?:text|bg|border|ring|from|to|via)-/.test(v)) return false;
  return !untranslatable.some((r) => r.test(v));
};

/** Walks up through expressions that only pass the value along. */
function displaySite(node, ast) {
  let n = node;
  for (;;) {
    const p = n.parent;
    if (!p) return null;
    if (ts.isParenthesizedExpression(p) || ts.isAsExpression(p) || ts.isNonNullExpression(p) || ts.isTemplateSpan(p) || ts.isTemplateExpression(p)) { n = p; continue; }
    if (ts.isConditionalExpression(p) && p.condition !== n) { n = p; continue; }
    if (ts.isBinaryExpression(p) && [ts.SyntaxKind.BarBarToken, ts.SyntaxKind.QuestionQuestionToken, ts.SyntaxKind.PlusToken].includes(p.operatorToken.kind)) { n = p; continue; }
    if (ts.isJsxExpression(p)) {
      const holder = p.parent;
      if (ts.isJsxAttribute(holder)) return displayNames.has(holder.name.getText(ast)) ? 'attribute' : null;
      return 'expression';
    }
    if (ts.isJsxAttribute(p)) return displayNames.has(p.name.getText(ast)) ? 'attribute' : null;
    if (ts.isPropertyAssignment(p) && p.initializer === n) {
      if (displayNames.has(p.name.getText(ast).replace(/['"]/g, ''))) return 'property';
      // Lookup tables named for what they hold: `statusLabel = { active: "Active" }`.
      const owner = ts.findAncestor(p, ts.isVariableDeclaration);
      return owner && /(?:Label|Labels|Text|Texts|Title|Titles|Message|Messages)$/.test(owner.name.getText(ast)) ? 'property' : null;
    }
    if (ts.isReturnStatement(p) || ts.isArrowFunction(p)) {
      // `get label() { return "X"; }` and `label: () => "X"` style accessors
      const fn = ts.isArrowFunction(p) ? p : ts.findAncestor(p, ts.isFunctionLike);
      const owner = fn?.name?.getText?.(ast) ?? (fn && ts.isPropertyAssignment(fn.parent) ? fn.parent.name.getText(ast) : '');
      return displayNames.has(owner) ? 'property' : null;
    }
    if ((ts.isCallExpression(p) || ts.isNewExpression(p)) && p.arguments?.includes(n)) {
      const callee = p.expression.getText(ast);
      if (ts.isNewExpression(p) && callee === 'Error') return 'message';
      return displayCall.test(callee) ? 'message' : null;
    }
    return null;
  }
}

export function inventory(file) {
  const source = fs.readFileSync(file, 'utf8');
  const ast = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, file.endsWith('tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const rows = [];
  const add = (n, kind, value) => {
    if (!looksTranslatable(value)) return;
    rows.push({ file: file.replaceAll('\\', '/'), line: ast.getLineAndCharacterOfPosition(n.getStart(ast)).line + 1, start: n.getStart(ast), end: n.end, kind, value: value.replace(/\s+/g, ' ').trim() });
  };
  function visit(n) {
    if (ts.isImportDeclaration(n) || ts.isExportDeclaration(n) || ts.isTypeNode(n)) return;
    if (ts.isJsxText(n) && n.text.trim()) add(n, 'jsx', n.text);
    else if (ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n)) {
      const kind = displaySite(n, ast);
      if (kind) add(n, kind, n.text);
    } else if (ts.isTemplateExpression(n)) {
      const kind = displaySite(n, ast);
      const literal = [n.head.text, ...n.templateSpans.map((s) => s.literal.text)].join(' ');
      if (kind) add(n, kind, literal);
    }
    ts.forEachChild(n, visit);
  }
  visit(ast);
  return { source, ast, rows };
}

export function flatten(obj, prefix = '', result = {}) {
  for (const [key, value] of Object.entries(obj)) {
    const full = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'string') result[full] = value;
    else flatten(value, full, result);
  }
  return result;
}

/** Every locale pair: the main catalogue plus the `<name>.it.json`/`<name>.en.json` sections. */
function catalogues(dir) {
  const read = (f) => JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
  const pairs = [{ name: 'main', it: read('it.json'), en: read('en.json') }];
  for (const f of fs.readdirSync(dir).filter((f) => /\.it\.json$/.test(f))) {
    const name = f.replace(/\.it\.json$/, '');
    pairs.push({ name, it: read(f), en: read(`${name}.en.json`) });
  }
  return pairs;
}

if (process.argv[1]?.endsWith('i18n-audit.mjs')) {
  const files = walk('src').filter((f) => /\.tsx?$/.test(f) && !/[\\/]i18n[\\/]/.test(f));
  const rows = files.flatMap((f) => inventory(f).rows);
  if (process.argv.includes('--inventory')) {
    console.log(rows.map((r) => `${r.file}:${r.line} [${r.kind}] ${r.value}`).join('\n'));
  } else {
    const errors = [];
    let keys = 0;
    for (const { name, it, en } of catalogues('src/i18n/locales')) {
      const itFlat = flatten(it), enFlat = flatten(en);
      keys += Object.keys(itFlat).length;
      for (const key of new Set([...Object.keys(itFlat), ...Object.keys(enFlat)])) {
        if (!itFlat[key]) errors.push(`[${name}] missing Italian translation: ${key}`);
        if (!enFlat[key]) errors.push(`[${name}] missing English translation: ${key}`);
        const params = (value) => [...(value || '').matchAll(/{{\s*([^}]+?)\s*}}/g)].map((m) => m[1]).sort().join(',');
        if (itFlat[key] && enFlat[key] && params(enFlat[key]) !== params(itFlat[key])) errors.push(`[${name}] interpolation mismatch: ${key}`);
      }
    }
    // Every static key the code asks for must exist in Italian, or i18next falls
    // back to a `defaultValue` that is usually English.
    const italian = {};
    for (const { name, it } of catalogues('src/i18n/locales')) {
      const prefix = name === 'main' ? '' : name.replaceAll('-', '_');
      Object.assign(italian, flatten(it, prefix));
    }
    const hasKey = (key) => key in italian || `${key}_one` in italian || `${key}_other` in italian;
    for (const file of files) {
      const source = fs.readFileSync(file, 'utf8');
      for (const m of source.matchAll(/\b(?:t|i18n\.t)\(\s*["']([a-z0-9_]+(?:\.[\w' -]+)+)["']/g)) {
        if (!hasKey(m[1])) {
          const line = source.slice(0, m.index).split('\n').length;
          errors.push(`unknown translation key ${file.replaceAll('\\', '/')}:${line} ${m[1]}`);
        }
      }
    }

    for (const r of rows) errors.push(`hard-coded UI text ${r.file}:${r.line} [${r.kind}] ${r.value}`);
    console.log(`${files.length} source files; ${keys} Italian keys; ${rows.length} hard-coded UI strings.`);
    if (errors.length) console.log(errors.join('\n'));
    process.exitCode = errors.length ? 1 : 0;
  }
}
