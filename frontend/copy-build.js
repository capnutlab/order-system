import { readdirSync, statSync, copyFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');
const distDir = join(rootDir, 'dist');

// dist/trial.htmlをルート直下にコピー
const trialHtmlPath = join(distDir, 'trial.html');
const rootTrialHtmlPath = join(rootDir, 'trial.html');

if (existsSync(trialHtmlPath)) {
  copyFileSync(trialHtmlPath, rootTrialHtmlPath);
  console.log('✓ Copied trial.html to root');
}

// dist/assetsをルート直下のassetsにコピー
const distAssetsDir = join(distDir, 'assets');
const rootAssetsDir = join(rootDir, 'assets');

if (existsSync(distAssetsDir)) {
  if (!existsSync(rootAssetsDir)) {
    mkdirSync(rootAssetsDir, { recursive: true });
  }
  
  const files = readdirSync(distAssetsDir);
  
  for (const file of files) {
    const srcPath = join(distAssetsDir, file);
    const destPath = join(rootAssetsDir, file);
    if (statSync(srcPath).isFile()) {
      copyFileSync(srcPath, destPath);
    }
  }
  
  console.log('✓ Copied assets to root/assets');
}

console.log('Build files copied successfully!');
