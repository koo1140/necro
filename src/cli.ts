#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const args = process.argv.slice(2);

if (args.length === 0) {
  import('./index.js');
} else {
  const arg = args[0];

  if (arg === '--help' || arg === '-help') {
    console.log(`Usage: necro [options]

Options:
  --help, -help           Show this help message
  --version, -version     Print the version number
  --upgrade, -upgrade     Upgrade necro (not yet implemented)

Without arguments, launches the interactive Necromancer CLI.`);
    process.exit(0);
  }

  if (arg === '--version' || arg === '-version') {
    const pkg = JSON.parse(readFileSync(join(__dirname, '..', 'package.json'), 'utf-8'));
    console.log(pkg.version);
    process.exit(0);
  }

  if (arg === '--upgrade' || arg === '-upgrade') {
    console.log('Upgrade not yet implemented');
    process.exit(0);
  }

  import('./index.js');
}
