#!/usr/bin/env node
// Build script to inject environment variables into frontend

const fs = require('fs');
const path = require('path');

const apiBase = process.env.PROMPTLY_API_BASE || 'http://localhost:8000';

const indexPath = path.join(__dirname, 'frontend', 'index.html');
let content = fs.readFileSync(indexPath, 'utf8');

content = content.replace('__PROMPTLY_API_BASE__', apiBase);

fs.writeFileSync(indexPath, content);
console.log(`Injected API_BASE: ${apiBase}`);