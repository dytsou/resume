#!/usr/bin/env node

/**
 * KV Setup Script for Resume Protection
 * 
 * This script helps you set up and manage KV storage for your Cloudflare Worker
 */

import { execSync } from 'child_process';

const commands = {
  // Create KV namespace
  createNamespace: () => {
    console.log('🔧 Creating KV namespace...');
    try {
      const output = execSync('wrangler kv:namespace create "SECRETS"', { encoding: 'utf8' });
      console.log('✅ KV namespace created successfully!');
      console.log(output);
      console.log('\n📝 Copy the namespace ID from above and update wrangler.toml');
    } catch (error) {
      console.error('❌ Error creating KV namespace:', error.message);
    }
  },

  // Create preview namespace
  createPreviewNamespace: () => {
    console.log('🔧 Creating preview KV namespace...');
    try {
      const output = execSync('wrangler kv:namespace create "SECRETS" --preview', { encoding: 'utf8' });
      console.log('✅ Preview KV namespace created successfully!');
      console.log(output);
      console.log('\n📝 Copy the preview namespace ID from above and update wrangler.toml');
    } catch (error) {
      console.error('❌ Error creating preview KV namespace:', error.message);
    }
  },

  // Set secret key
  setSecretKey: (key) => {
    if (!key) {
      console.log('❌ Please provide a secret key');
      console.log('Usage: node scripts/kv-setup.mjs set-key "your-secret-key"');
      return;
    }

    console.log('🔐 Setting secret key in KV storage...');
    try {
      execSync(`wrangler kv:key put "RESUME_SECRET_KEY" "${key}" --binding SECRETS`, { encoding: 'utf8' });
      console.log('✅ Secret key set successfully!');
    } catch (error) {
      console.error('❌ Error setting secret key:', error.message);
    }
  },

  // Set GitHub Pages URL
  setGitHubUrl: (url) => {
    if (!url) {
      console.log('❌ Please provide a GitHub Pages URL');
      console.log('Usage: node scripts/kv-setup.mjs set-url "https://your-username.github.io/your-repo"');
      return;
    }

    console.log('🌐 Setting GitHub Pages URL in KV storage...');
    try {
      execSync(`wrangler kv:key put "GITHUB_PAGES_URL" "${url}" --binding SECRETS`, { encoding: 'utf8' });
      console.log('✅ GitHub Pages URL set successfully!');
    } catch (error) {
      console.error('❌ Error setting GitHub Pages URL:', error.message);
    }
  },

  // Get secret key
  getSecretKey: () => {
    console.log('🔍 Getting secret key from KV storage...');
    try {
      const output = execSync('wrangler kv:key get "RESUME_SECRET_KEY" --binding SECRETS', { encoding: 'utf8' });
      console.log('✅ Secret key retrieved:');
      console.log(output);
    } catch (error) {
      console.error('❌ Error getting secret key:', error.message);
    }
  },

  // List all keys
  listKeys: () => {
    console.log('📋 Listing all keys in KV storage...');
    try {
      const output = execSync('wrangler kv:key list --binding SECRETS', { encoding: 'utf8' });
      console.log('✅ Keys in KV storage:');
      console.log(output);
    } catch (error) {
      console.error('❌ Error listing keys:', error.message);
    }
  },

  // Delete secret key
  deleteSecretKey: () => {
    console.log('🗑️ Deleting secret key from KV storage...');
    try {
      execSync('wrangler kv:key delete "RESUME_SECRET_KEY" --binding SECRETS', { encoding: 'utf8' });
      console.log('✅ Secret key deleted successfully!');
    } catch (error) {
      console.error('❌ Error deleting secret key:', error.message);
    }
  },

  // Show help
  help: () => {
    console.log(`
🔐 KV Storage Management for Resume Protection

Available commands:

1. Create KV namespace:
   node scripts/kv-setup.mjs create-namespace

2. Create preview namespace:
   node scripts/kv-setup.mjs create-preview

3. Set secret key:
   node scripts/kv-setup.mjs set-key "your-secret-key-here"

4. Set GitHub Pages URL:
   node scripts/kv-setup.mjs set-url "https://your-username.github.io/your-repo"

5. Get secret key:
   node scripts/kv-setup.mjs get-key

6. List all keys:
   node scripts/kv-setup.mjs list

7. Delete secret key:
   node scripts/kv-setup.mjs delete-key

8. Show this help:
   node scripts/kv-setup.mjs help

📝 After creating namespaces, update wrangler.toml with the IDs
    `);
  }
};

// Parse command line arguments
const [, , command, ...args] = process.argv;

if (!command || !commands[command]) {
  commands.help();
  process.exit(1);
}

// Execute the command
commands[command](...args);
