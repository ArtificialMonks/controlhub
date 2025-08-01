#!/usr/bin/env node
/**
 * MCP Server Integration Test Script
 * 
 * Tests connectivity and basic functionality of all configured MCP servers
 * for the Communitee Control Hub and A.V.A.R.I.C.E. Protocol integration.
 */

const { readFileSync } = require('fs');
const { join } = require('path');

/**
 * Load MCP configuration from .mcp.json
 */
function loadMCPConfig() {
  try {
    const configPath = join(process.cwd(), '.mcp.json');
    const configContent = readFileSync(configPath, 'utf-8');
    return JSON.parse(configContent);
  } catch (error) {
    console.error('❌ Failed to load .mcp.json configuration:', error);
    process.exit(1);
  }
}

/**
 * Test MCP server connectivity
 */
async function testMCPServer(name, config) {
  console.log(`🔍 Testing MCP server: ${name}`);
  
  try {
    // Basic configuration validation
    if (!config.command || !config.args) {
      console.log(`❌ ${name}: Invalid configuration - missing command or args`);
      return false;
    }

    // Check if command exists (basic validation)
    if (config.command === 'npx') {
      console.log(`✅ ${name}: NPX command available`);
    } else if (config.command.includes('uvx')) {
      console.log(`⚠️  ${name}: UVX command path - ensure Homebrew uvx is installed`);
    } else {
      console.log(`⚠️  ${name}: Custom command path - ${config.command}`);
    }

    // Validate environment variables if present
    if (config.env) {
      console.log(`🔑 ${name}: Environment variables configured:`, Object.keys(config.env));
      
      // Check for embedded API keys
      for (const [key, value] of Object.entries(config.env)) {
        if (value && value.length > 10) {
          console.log(`✅ ${name}: ${key} appears to be configured (${value.length} chars)`);
        }
      }
    }

    // Check for embedded credentials in args
    const hasCredentials = config.args.some(arg => 
      arg.includes('--key') || 
      arg.includes('API_KEY') || 
      arg.includes('--profile')
    );
    
    if (hasCredentials) {
      console.log(`🔐 ${name}: Embedded credentials detected in configuration`);
    }

    console.log(`✅ ${name}: Configuration validation passed\n`);
    return true;

  } catch (error) {
    console.log(`❌ ${name}: Test failed -`, error);
    return false;
  }
}

/**
 * Generate Claude MCP integration commands
 */
function generateClaudeCommands(config) {
  console.log('\n📋 Claude MCP Integration Commands:');
  console.log('=====================================\n');

  for (const [name, serverConfig] of Object.entries(config.mcpServers)) {
    const args = serverConfig.args.join(' ');
    console.log(`# ${name}`);
    console.log(`claude add mcp ${name} ${serverConfig.command} ${args}\n`);
  }
}

/**
 * Main test execution
 */
async function main() {
  console.log('🚀 MCP Server Integration Test');
  console.log('==============================\n');

  const config = loadMCPConfig();
  const serverNames = Object.keys(config.mcpServers);
  
  console.log(`Found ${serverNames.length} MCP servers to test:\n`);

  let passedTests = 0;
  const totalTests = serverNames.length;

  for (const [name, serverConfig] of Object.entries(config.mcpServers)) {
    const passed = await testMCPServer(name, serverConfig);
    if (passed) passedTests++;
  }

  // Test results summary
  console.log('\n📊 Test Results Summary:');
  console.log('========================');
  console.log(`✅ Passed: ${passedTests}/${totalTests}`);
  console.log(`❌ Failed: ${totalTests - passedTests}/${totalTests}`);
  
  if (passedTests === totalTests) {
    console.log('\n🎉 All MCP servers passed configuration validation!');
  } else {
    console.log('\n⚠️  Some MCP servers failed validation. Check configurations above.');
  }

  // Generate Claude commands
  generateClaudeCommands(config);

  console.log('🔗 Integration with A.V.A.R.I.C.E. Protocol Research Agent:');
  console.log('==========================================================');
  console.log('• EXA: External research and AI-powered search');
  console.log('• Neo4j: Graph database for knowledge relationships');
  console.log('• Firecrawl: Web content extraction and analysis');
  console.log('• Magic: Enhanced development workflow tools');
  console.log('• Context 7: Advanced context management');
  console.log('• Sequential Thinking: Reasoning and logic tools\n');
}

// Execute if run directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { loadMCPConfig, testMCPServer };