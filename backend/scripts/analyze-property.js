/**
 * Command-line script to analyze a single property
 * Usage: node scripts/analyze-property.js "123 Main St, Austin, TX 78701"
 */

import backend from '../index.js';

async function main() {
  const address = process.argv[2];

  if (!address) {
    console.error('Error: Please provide an address');
    console.log('Usage: node scripts/analyze-property.js "123 Main St, Austin, TX 78701"');
    process.exit(1);
  }

  try {
    const analysis = await backend.analyzeProperty(address);

    console.log('\n=== ANALYSIS COMPLETE ===\n');
    console.log('Executive Summary:');
    console.log(JSON.stringify(analysis.report.executiveSummary, null, 2));

    console.log('\n\nDistress Analysis:');
    console.log(`Score: ${analysis.distressAnalysis.distressScore}/100`);
    console.log(`Classification: ${analysis.distressAnalysis.classification}`);
    console.log(`Urgency: ${analysis.distressAnalysis.urgency}`);

    console.log('\n\nMonte Carlo Simulation:');
    console.log(`Mean ROI: ${analysis.monteCarlo.roi.mean.toFixed(2)}%`);
    console.log(`Probability of Profit: ${(analysis.monteCarlo.probability.profitableOutcomes * 100).toFixed(1)}%`);

    await backend.shutdown();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();
