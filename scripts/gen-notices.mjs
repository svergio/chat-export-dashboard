import { readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const productLicense = pkg.license || 'MIT';

const lc = spawnSync('npx', ['--yes', 'license-checker', '--production', '--json'], {
  cwd: root,
  encoding: 'utf8',
  maxBuffer: 8 * 1024 * 1024
});

if (lc.status !== 0) {
  console.error(lc.stderr?.trim() || 'license-checker failed');
  process.exit(lc.status || 1);
}

const tree = JSON.parse(lc.stdout);
const direct = Object.keys(pkg.dependencies || {}).sort();

function licenseFor(dep) {
  const key = Object.keys(tree).find((k) => {
    const at = k.lastIndexOf('@');
    return at > 0 && k.slice(0, at) === dep;
  });
  return key ? String(tree[key].licenses || 'UNKNOWN') : 'UNKNOWN';
}

const npmRows = direct.map((d) => `| \`${d}\` | ${licenseFor(d)} | npm runtime |`);

const body = `# Third-party notices

chat-export-dashboard is licensed under the [MIT License](./LICENSE).

Production UI is static files built into \`public/\` (React runtime + scheduler). Build tooling (Vite, TypeScript) is dev-only and not shipped in the nginx image except as compiled assets.

Regenerate: \`npm run licenses\` (\`npx license-checker\`; not a committed dependency).

## Direct runtime dependencies

| Package | License | Notes |
| --- | --- | --- |
${npmRows.join('\n')}

## How this repo fits the product

Served at \`/dashboard/\` by [chat-export-server](https://github.com/svergio/chat-export-server) (embedded submodule) or via the optional [Dockerfile](./Dockerfile) (**nginx:alpine** + built static assets). Talks to the server over same-origin \`/dashboard/api\`; the [Chat Export extension](https://github.com/svergio/chat-export-extension) bridge is unrelated to npm deps here.

## Optional integrations (not dependencies)

Cursor, Open WebUI, BibLLMsteak, Bonsai-27B, and NodeRed maintainer trees are not npm or runtime dependencies.

---

_Generated for ${pkg.name}@${pkg.version}. Product license: ${productLicense}._
`;

const out = join(root, 'THIRD_PARTY_NOTICES.md');
writeFileSync(out, body);
console.log(`wrote ${out}`);
