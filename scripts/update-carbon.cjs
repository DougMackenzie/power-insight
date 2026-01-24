#!/usr/bin/env node

/**
 * Carbon Tracker Update Script
 *
 * Usage:
 *   node scripts/update-carbon.js <input_tokens> <output_tokens>
 *   node scripts/update-carbon.js 50000 15000
 *
 * Or run via npm:
 *   npm run update-carbon -- 50000 15000
 *
 * This script adds the specified token counts to the running total
 * and recalculates the carbon footprint.
 */

const fs = require('fs');
const path = require('path');

const TRACKER_PATH = path.join(__dirname, '..', 'carbon-tracker.json');
const G_CO2_PER_1K_TOKENS = 1.0;  // grams CO2 per 1000 tokens (Claude Opus estimate)
const HAMBURGER_KG_CO2 = 3.5;     // kg CO2 per beef hamburger

function main() {
    const args = process.argv.slice(2);

    if (args.length === 0) {
        // Show current stats
        showStats();
        return;
    }

    if (args[0] === '--help' || args[0] === '-h') {
        showHelp();
        return;
    }

    if (args[0] === '--set') {
        // Set total tokens directly: --set <total_tokens>
        const totalTokens = parseInt(args[1], 10);
        if (isNaN(totalTokens)) {
            console.error('Error: Invalid token count');
            process.exit(1);
        }
        setTokens(totalTokens);
        return;
    }

    // Add tokens: <input> <output>
    const inputTokens = parseInt(args[0], 10);
    const outputTokens = parseInt(args[1], 10) || 0;

    if (isNaN(inputTokens)) {
        console.error('Error: Invalid input token count');
        showHelp();
        process.exit(1);
    }

    addTokens(inputTokens, outputTokens);
}

function loadTracker() {
    if (!fs.existsSync(TRACKER_PATH)) {
        return {
            development: {
                totalInputTokens: 0,
                totalOutputTokens: 0,
                totalTokens: 0,
                sessions: 0,
                lastUpdated: null
            },
            carbonMetrics: {
                gCO2PerThousandTokens: G_CO2_PER_1K_TOKENS,
                totalKgCO2: 0,
                hamburgerEquivalentKg: HAMBURGER_KG_CO2
            },
            notes: "Token counts are updated periodically during development."
        };
    }
    return JSON.parse(fs.readFileSync(TRACKER_PATH, 'utf-8'));
}

function saveTracker(data) {
    fs.writeFileSync(TRACKER_PATH, JSON.stringify(data, null, 2) + '\n');
}

function calculateCarbon(totalTokens) {
    return (totalTokens / 1000) * G_CO2_PER_1K_TOKENS / 1000; // Convert to kg
}

function showStats() {
    const data = loadTracker();
    const { development, carbonMetrics } = data;
    const hamburgers = carbonMetrics.totalKgCO2 / HAMBURGER_KG_CO2;

    console.log('\n📊 Carbon Tracker Stats');
    console.log('========================');
    console.log(`Total tokens:     ${development.totalTokens.toLocaleString()}`);
    console.log(`  Input tokens:   ${development.totalInputTokens.toLocaleString()}`);
    console.log(`  Output tokens:  ${development.totalOutputTokens.toLocaleString()}`);
    console.log(`Sessions:         ${development.sessions}`);
    console.log(`Last updated:     ${development.lastUpdated || 'Never'}`);
    console.log('');
    console.log(`Total CO₂:        ${carbonMetrics.totalKgCO2.toFixed(2)} kg`);
    console.log(`Hamburgers:       ${hamburgers.toFixed(2)} 🍔`);
    console.log('');
}

function addTokens(inputTokens, outputTokens) {
    const data = loadTracker();
    const totalNew = inputTokens + outputTokens;

    data.development.totalInputTokens += inputTokens;
    data.development.totalOutputTokens += outputTokens;
    data.development.totalTokens += totalNew;
    data.development.sessions += 1;
    data.development.lastUpdated = new Date().toISOString().split('T')[0];

    data.carbonMetrics.totalKgCO2 = calculateCarbon(data.development.totalTokens);

    saveTracker(data);

    const hamburgers = data.carbonMetrics.totalKgCO2 / HAMBURGER_KG_CO2;
    console.log(`✅ Added ${totalNew.toLocaleString()} tokens (${inputTokens.toLocaleString()} in, ${outputTokens.toLocaleString()} out)`);
    console.log(`   Total: ${data.development.totalTokens.toLocaleString()} tokens = ${data.carbonMetrics.totalKgCO2.toFixed(2)} kg CO₂ (${hamburgers.toFixed(2)} 🍔)`);
}

function setTokens(totalTokens) {
    const data = loadTracker();

    data.development.totalTokens = totalTokens;
    data.development.lastUpdated = new Date().toISOString().split('T')[0];
    data.carbonMetrics.totalKgCO2 = calculateCarbon(totalTokens);

    saveTracker(data);

    const hamburgers = data.carbonMetrics.totalKgCO2 / HAMBURGER_KG_CO2;
    console.log(`✅ Set total to ${totalTokens.toLocaleString()} tokens`);
    console.log(`   = ${data.carbonMetrics.totalKgCO2.toFixed(2)} kg CO₂ (${hamburgers.toFixed(2)} 🍔)`);
}

function showHelp() {
    console.log(`
Carbon Tracker Update Script

Usage:
  node scripts/update-carbon.js                   Show current stats
  node scripts/update-carbon.js <in> <out>        Add tokens from a session
  node scripts/update-carbon.js --set <total>     Set total tokens directly
  node scripts/update-carbon.js --help            Show this help

Examples:
  node scripts/update-carbon.js 50000 15000       Add 50k input + 15k output tokens
  node scripts/update-carbon.js --set 500000      Set total to 500k tokens

After a Claude Code session, you can get token counts from:
  - Run '/cost' in Claude Code to see session usage
  - Check the OpenTelemetry metrics if configured
  - Use 'ccusage' tool for historical tracking
`);
}

main();
