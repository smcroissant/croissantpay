#!/usr/bin/env node

/**
 * Version bump script for CroissantPay monorepo
 * 
 * Usage:
 *   node scripts/bump-version.js <major|minor|patch|version>
 * 
 * Examples:
 *   node scripts/bump-version.js patch     # 0.1.0 -> 0.1.1
 *   node scripts/bump-version.js minor     # 0.1.0 -> 0.2.0
 *   node scripts/bump-version.js major     # 0.1.0 -> 1.0.0
 *   node scripts/bump-version.js 1.2.3     # Set to specific version
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.join(__dirname, '..');
const VERSION_FILE = path.join(ROOT_DIR, 'VERSION');

// All package.json files to update
const PACKAGE_FILES = [
  'package.json',
  'apps/web/package.json',
  'packages/react-native-crp/package.json',
];

function readVersion() {
  return fs.readFileSync(VERSION_FILE, 'utf8').trim();
}

function writeVersion(version) {
  fs.writeFileSync(VERSION_FILE, version + '\n');
}

function parseVersion(version) {
  const match = version.match(/^(\d+)\.(\d+)\.(\d+)$/);
  if (!match) {
    throw new Error(`Invalid version format: ${version}`);
  }
  return {
    major: parseInt(match[1], 10),
    minor: parseInt(match[2], 10),
    patch: parseInt(match[3], 10),
  };
}

function bumpVersion(currentVersion, type) {
  const { major, minor, patch } = parseVersion(currentVersion);
  
  switch (type) {
    case 'major':
      return `${major + 1}.0.0`;
    case 'minor':
      return `${major}.${minor + 1}.0`;
    case 'patch':
      return `${major}.${minor}.${patch + 1}`;
    default:
      // Assume it's a specific version
      parseVersion(type); // Validate format
      return type;
  }
}

function updatePackageJson(filePath, newVersion) {
  const fullPath = path.join(ROOT_DIR, filePath);
  if (!fs.existsSync(fullPath)) {
    console.log(`  Skipping ${filePath} (not found)`);
    return;
  }
  
  const content = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
  const oldVersion = content.version;
  content.version = newVersion;
  fs.writeFileSync(fullPath, JSON.stringify(content, null, 2) + '\n');
  console.log(`  Updated ${filePath}: ${oldVersion} -> ${newVersion}`);
}

function main() {
  const args = process.argv.slice(2);
  
  if (args.length !== 1) {
    console.error('Usage: node scripts/bump-version.js <major|minor|patch|version>');
    process.exit(1);
  }
  
  const type = args[0];
  const currentVersion = readVersion();
  const newVersion = bumpVersion(currentVersion, type);
  
  console.log(`\nBumping version: ${currentVersion} -> ${newVersion}\n`);
  
  // Update VERSION file
  writeVersion(newVersion);
  console.log(`  Updated VERSION file`);
  
  // Update all package.json files
  for (const file of PACKAGE_FILES) {
    updatePackageJson(file, newVersion);
  }
  
  console.log(`\n✓ Version bumped to ${newVersion}`);
  console.log(`\nNext steps:`);
  console.log(`  1. Update CHANGELOG.md with the changes`);
  console.log(`  2. Commit: git commit -am "chore: bump version to ${newVersion}"`);
  console.log(`  3. Tag: git tag v${newVersion}`);
  console.log(`  4. Push: git push && git push --tags`);
}

main();
