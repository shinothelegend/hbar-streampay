import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const FORBIDDEN_PATTERN = /npm\s+(install|test|build|dev|start)\b/g;

function getTrackedFiles() {
  try {
    const output = execSync('git ls-files', { encoding: 'utf-8' });
    return output.split('\n').filter(Boolean);
  } catch (e) {
    console.error('Failed to get tracked files. Are you in a git repository?');
    process.exit(1);
  }
}

const files = getTrackedFiles();
let failed = false;

for (const file of files) {
  if (
    file.includes('node_modules') || 
    file.includes('.next') || 
    file.startsWith('.') ||
    file.startsWith('agent') ||
    !file.endsWith('.md')
  ) {
    continue;
  }

  const content = fs.readFileSync(file, 'utf-8');
  if (FORBIDDEN_PATTERN.test(content)) {
    console.error(`Error: File ${file} contains forbidden "npm <command>" pattern.`);
    console.error(`Please change "npm run <command>" to "yarn <command>" or similar in docs to prevent scaffold replacement corruption.`);
    failed = true;
  }
}

if (failed) {
  process.exit(1);
} else {
  console.log("Scaffold text check passed.");
}
