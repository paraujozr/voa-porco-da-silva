// Builds the game and copies the result to the repository root, which GitHub Pages serves.
//
//   npm run publish:root      (from game/)
//
// Only the generated files are touched: the root index.html, logo, audio/ and the whole
// assets/ folder (emptied first, so stale bundles from earlier releases never pile up).
// Review `git status` afterwards and commit the result.
import {execSync} from 'node:child_process';
import {cpSync, existsSync, rmSync} from 'node:fs';
import {fileURLToPath} from 'node:url';

const game = fileURLToPath(new URL('..', import.meta.url));
const root = fileURLToPath(new URL('../..', import.meta.url));
const dist = `${game}dist`;

execSync('npm run build', {cwd: game, stdio: 'inherit'});
if (!existsSync(`${dist}/index.html`)) throw new Error('build did not produce dist/index.html');

rmSync(`${root}assets`, {recursive: true, force: true});
// dist holds exactly what the site needs: index.html, assets/, audio/ and the logo.
cpSync(dist, root, {recursive: true});
console.log('Published game/dist to the repository root.');
