#!/usr/bin/env node

'use strict';

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { createInterface } = require('readline');
const { execSync } = require('child_process');
const os = require('os');
const { createGunzip } = require('zlib');

// ── ANSI Colors (zero-dependency) ──────────────────────────────────────────────
const color = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
};

const icons = {
  check: `${color.green}✓${color.reset}`,
  warn: `${color.yellow}⚠${color.reset}`,
  error: `${color.red}✗${color.reset}`,
  arrow: `${color.cyan}→${color.reset}`,
  rocket: '🚀',
  shield: '🛡️',
  gear: '⚙️',
  book: '📏',
  tool: '🛠️',
  cycle: '🔄',
};

// ── Constants ──────────────────────────────────────────────────────────────────
const REPO_OWNER = 'irahardianto';
const REPO_NAME = 'awesome-agv';
const BRANCH = 'main';
const TARBALL_URL = `https://github.com/${REPO_OWNER}/${REPO_NAME}/archive/refs/heads/${BRANCH}.tar.gz`;
const AGENT_DIR = '.agent';

// ── CLI Argument Parsing ───────────────────────────────────────────────────────
function parseArgs(argv) {
  const args = argv.slice(2);
  const options = {
    force: false,
    targetDir: process.cwd(),
    help: false,
  };

  for (const arg of args) {
    if (arg === '--force' || arg === '-f') {
      options.force = true;
    } else if (arg === '--help' || arg === '-h') {
      options.help = true;
    } else if (!arg.startsWith('-')) {
      options.targetDir = path.resolve(arg);
    }
  }

  return options;
}

// ── Help Text ──────────────────────────────────────────────────────────────────
function printHelp() {
  console.log(`
${color.bold}awesome-agv${color.reset} — Memasang Paket Konfigurasi Agen AI Awesome AGV

${color.bold}CARA PENGGUNAAN${color.reset}
  npx awesome-agv [target-dir] [options]

${color.bold}ARGUMEN${color.reset}
  target-dir    Direktori folder target instalasi (bawaan: direktori berjalan saat ini)

${color.bold}OPSI${color.reset}
  -f, --force   Menimpa (overwrite) folder .agent yang sudah ada tanpa bertanya
  -h, --help    Menampilkan pesan instruksi bantuan ini

${color.bold}CONTOH${color.reset}
  ${color.dim}# Memasang agen di direktori tempat berjalan saat ini${color.reset}
  npx awesome-agv

  ${color.dim}# Memasang agen ke target folder proyek tertentu${color.reset}
  npx awesome-agv ./proyek-saya

  ${color.dim}# Memaksa timpa paksa instalsi yang sudah ada${color.reset}
  npx awesome-agv --force

${color.bold}APA SAJA YANG DIPASANG${color.reset}
  ${icons.book}  30 Aturan    — Panduan standar keamanan, arsitektur, testing, & DevOps
  ${icons.tool}  7 Keahlian    — Ekstensi pemecahan bug, desain antarmuka, dan tinjauan audit
  ${icons.cycle}  10 Alur Kerja — Rute silsilah pedoman proses rilis dari mula sampai jadi

${color.dim}https://github.com/${REPO_OWNER}/${REPO_NAME}${color.reset}
`);
}

// ── User Prompt ────────────────────────────────────────────────────────────────
function promptUser(question) {
  return new Promise((resolve) => {
    const rl = createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim().toLowerCase());
    });
  });
}

// ── HTTP Download with Redirect Following ──────────────────────────────────────
function downloadToFile(url, destPath, maxRedirects = 5) {
  return new Promise((resolve, reject) => {
    if (maxRedirects <= 0) {
      reject(new Error('Too many redirects'));
      return;
    }

    const client = url.startsWith('https') ? https : http;
    client
      .get(url, (res) => {
        // Follow redirects (GitHub returns 302)
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          res.resume(); // Consume response to free up memory
          downloadToFile(res.headers.location, destPath, maxRedirects - 1)
            .then(resolve)
            .catch(reject);
          return;
        }

        if (res.statusCode !== 200) {
          res.resume();
          reject(new Error(`Failed to download: HTTP ${res.statusCode}`));
          return;
        }

        const fileStream = fs.createWriteStream(destPath);
        res.pipe(fileStream);
        fileStream.on('finish', () => {
          fileStream.close(resolve);
        });
        fileStream.on('error', (err) => {
          fs.unlinkSync(destPath);
          reject(err);
        });
      })
      .on('error', reject);
  });
}

// ── Extract .agent directory from tarball ──────────────────────────────────────
function extractAgentDir(tarballPath, targetDir) {
  // The tarball from GitHub has a root directory like: awesome-agv-main/
  // We need to extract awesome-agv-main/.agent/ → targetDir/.agent/
  const stripPrefix = `${REPO_NAME}-${BRANCH}/${AGENT_DIR}`;

  const agentTargetDir = path.join(targetDir, AGENT_DIR);

  // Ensure target exists
  fs.mkdirSync(agentTargetDir, { recursive: true });

  try {
    // Use system tar (available on macOS and Linux)
    execSync(
      `tar -xzf "${tarballPath}" --strip-components=2 -C "${agentTargetDir}" "${stripPrefix}"`,
      { stdio: 'pipe' }
    );
  } catch {
    // Fallback: manual extraction using Node.js streams
    extractManually(tarballPath, targetDir, stripPrefix);
  }
}

// ── Manual tar extraction fallback (for Windows or missing tar) ────────────────
function extractManually(tarballPath, targetDir, stripPrefix) {
  // Read the gzipped tarball
  const gzipData = fs.readFileSync(tarballPath);

  // Decompress using zlib
  const { execFileSync } = require('child_process');
  const tmpExtractDir = path.join(os.tmpdir(), `awesome-agv-extract-${Date.now()}`);
  fs.mkdirSync(tmpExtractDir, { recursive: true });

  try {
    // Try using tar with different flags (Windows Git Bash compatibility)
    execFileSync('tar', ['-xzf', tarballPath, '-C', tmpExtractDir], { stdio: 'pipe' });

    // Find the extracted .agent directory
    const extractedRoot = path.join(tmpExtractDir, `${REPO_NAME}-${BRANCH}`, AGENT_DIR);

    if (fs.existsSync(extractedRoot)) {
      copyDirRecursive(extractedRoot, path.join(targetDir, AGENT_DIR));
    } else {
      throw new Error(`Could not find ${AGENT_DIR} in downloaded archive`);
    }
  } finally {
    // Clean up temp extraction dir
    fs.rmSync(tmpExtractDir, { recursive: true, force: true });
  }
}

// ── Recursive directory copy ───────────────────────────────────────────────────
function copyDirRecursive(src, dest) {
  fs.mkdirSync(dest, { recursive: true });

  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// ── Count files recursively ────────────────────────────────────────────────────
function countFiles(dirPath) {
  let count = 0;
  if (!fs.existsSync(dirPath)) return count;

  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      count += countFiles(fullPath);
    } else {
      count++;
    }
  }
  return count;
}

// ── Print Banner ───────────────────────────────────────────────────────────────
function printBanner() {
  // Load version from package.json
  const { version } = require('../package.json');

  const boxWidth = 44; // inner width between ║ and ║
  const border = '═'.repeat(boxWidth);

  const titleText = `awesome-agv  v${version}`;
  const subtitleText = 'Konfigurasi Agen AI Awesome AGV';

  // Center-pad a visible string inside the box
  function padCenter(text, width) {
    const pad = width - text.length;
    const left = Math.floor(pad / 2);
    const right = pad - left;
    return ' '.repeat(left) + text + ' '.repeat(right);
  }

  const titlePadded = padCenter(titleText, boxWidth);
  const subtitlePadded = padCenter(subtitleText, boxWidth);

  // Build colored title: split at the version part for coloring
  const titleColored = titlePadded.replace(
    titleText,
    `${color.magenta}awesome-agv${color.cyan}${color.bold}  ${color.dim}v${version}${color.cyan}${color.bold}`
  );
  const subtitleColored = subtitlePadded.replace(
    subtitleText,
    `${color.reset}${color.dim}${subtitleText}${color.cyan}${color.bold}`
  );

  console.log(`
${color.bold}${color.cyan}  ╔${border}╗
  ║${titleColored}║
  ║${subtitleColored}║
  ╚${border}╝${color.reset}
`);
}

// ── Print Success Summary ──────────────────────────────────────────────────────
function printSuccess(targetDir) {
  const agentDir = path.join(targetDir, AGENT_DIR);
  const rulesDir = path.join(agentDir, 'rules');
  const skillsDir = path.join(agentDir, 'skills');
  const workflowsDir = path.join(agentDir, 'workflows');

  const rulesCount = fs.existsSync(rulesDir)
    ? fs.readdirSync(rulesDir).filter((f) => f.endsWith('.md')).length
    : 0;
  const skillsCount = fs.existsSync(skillsDir)
    ? fs.readdirSync(skillsDir, { withFileTypes: true }).filter((d) => d.isDirectory()).length
    : 0;
  const workflowsCount = fs.existsSync(workflowsDir)
    ? fs.readdirSync(workflowsDir).filter((f) => f.endsWith('.md')).length
    : 0;
  const totalFiles = countFiles(agentDir);

  console.log(`
${color.green}${color.bold}  Tuntas! Instalasi sukses dilakukan ${icons.rocket}${color.reset}

  ${icons.check} ${color.bold}${totalFiles} rupa folder${color.reset} sukses bermukim ke ${color.cyan}${path.relative(process.cwd(), agentDir) || AGENT_DIR}/${color.reset}

  ${icons.book}  ${color.bold}${rulesCount}${color.reset} Aturan     ${color.dim}Hukum standar keamanan, arsitektur, kelayakan uji${color.reset}
  ${icons.tool}  ${color.bold}${skillsCount}${color.reset} Keahlian   ${color.dim}Panduan bedah bug, rancangan UI, & audit warta kode${color.reset}
  ${icons.cycle}  ${color.bold}${workflowsCount}${color.reset} Rute Alur  ${color.dim}Pedoman urutan proses bangun program ujung ke-ujung${color.reset}

  ${icons.arrow} ${color.dim}Otomatis silsilah agen murni merangkul asuhan folder${color.reset}
    ${color.dim}${AGENT_DIR}/ itu seketika. Murni tiada lagi usapan ubahan apa-apapun!${color.reset}

  💡 ${color.bold}Panduan Cepat Mulai${color.reset} — Buka wahana chat tanyakan agen melaju:
     ${color.cyan}/orchestrator${color.reset}   ${color.dim}Panggul kemudi merancang dari mula tiada s/d utuh rilis${color.reset}
     ${color.cyan}/audit${color.reset}          ${color.dim}Surat panggilan tilang pengadilan kualitas kode${color.reset}
     ${color.cyan}/quick-fix${color.reset}      ${color.dim}Singkat bergas tambal kutu nan bocor darurat${color.reset}
     ${color.dim}Panduan dan jurus dirakit terpisah — seruan mandiri tiada mengekang panggil kapan saja.${color.reset}

  ${icons.shield}  ${color.dim}Gali Wawasan: ${color.cyan}https://github.com/${REPO_OWNER}/${REPO_NAME}${color.reset}
`);
}

// ── Main ───────────────────────────────────────────────────────────────────────
async function main() {
  const options = parseArgs(process.argv);

  if (options.help) {
    printHelp();
    process.exit(0);
  }

  printBanner();

  const targetAgentDir = path.join(options.targetDir, AGENT_DIR);

  // Check if .agent already exists
  if (fs.existsSync(targetAgentDir)) {
    if (!options.force) {
      console.log(
        `  ${icons.warn}  ${color.yellow}Awas telah ditemui sisa tampungan wadah lawas folder ${AGENT_DIR}/ di persinggahan:${color.reset}`
      );
      console.log(`     ${color.dim}${targetAgentDir}${color.reset}\n`);

      const answer = await promptUser(
        `  ${color.bold}Kukuh Tetap Timpa (Overwrite)? ${color.reset}${color.dim}(y/N)${color.reset} `
      );

      if (answer !== 'y' && answer !== 'yes') {
        console.log(`\n  ${icons.arrow} ${color.dim}Pemasangan Ditarik Batal Mandek.${color.reset}\n`);
        process.exit(0);
      }
    }

    // Remove existing .agent directory
    console.log(`  ${icons.arrow} Mengusir minggir wadah tampungan folder lawas sisaan ${AGENT_DIR}/ ...`);
    fs.rmSync(targetAgentDir, { recursive: true, force: true });
  }

  // Download tarball to a temp file
  const tmpDir = os.tmpdir();
  const tarballPath = path.join(tmpDir, `awesome-agv-${Date.now()}.tar.gz`);

  try {
    console.log(`  ${icons.arrow} Mengambil muatan jasad rilis penyetelan mutakhir dari GitHub...`);
    await downloadToFile(TARBALL_URL, tarballPath);

    console.log(`  ${icons.arrow} Membongkar koper wadah wujud ${AGENT_DIR}/ ...`);
    extractAgentDir(tarballPath, options.targetDir);

    printSuccess(options.targetDir);
  } catch (err) {
    console.error(`\n  ${icons.error} ${color.red}Pemasangan Menabrak Gagal Fatal:${color.reset} ${err.message}\n`);

    // Clean up partial installation
    if (fs.existsSync(targetAgentDir)) {
      fs.rmSync(targetAgentDir, { recursive: true, force: true });
    }

    process.exit(1);
  } finally {
    // Clean up tarball
    if (fs.existsSync(tarballPath)) {
      fs.unlinkSync(tarballPath);
    }
  }
}

main();
