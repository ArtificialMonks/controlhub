import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const AGENTS_DIR = path.resolve(__dirname, '../.claude/agents');
const LOGS_DIR = path.resolve(__dirname, '../logs/agent-monitoring');

// Ensure logs directory exists
if (!fs.existsSync(LOGS_DIR)) {
  fs.mkdirSync(LOGS_DIR, { recursive: true });
}

/**
 * Wrapper for deploying agents with automatic progress monitoring
 */
async function deployAgentWithMonitoring(agentName: string, args: string[] = []) {
  const progressMonitorPath = path.join(AGENTS_DIR, 'agent-progress-monitor.md');
  const agentPath = path.join(AGENTS_DIR, `${agentName}.md`);
  const logFile = path.join(LOGS_DIR, `${agentName}-deployment.log`);

  // Validate agent files exist
  if (!fs.existsSync(agentPath)) {
    console.error(`Agent not found: ${agentName}`);
    return false;
  }

  if (!fs.existsSync(progressMonitorPath)) {
    console.error('Progress Monitor agent not found!');
    return false;
  }

  // Create log stream
  const logStream = fs.createWriteStream(logFile, { flags: 'a' });

  try {
    console.log(`🚀 Deploying ${agentName} with Progress Monitor`);
    
    // Spawn agent process
    const agentProcess = spawn('npx', ['tsx', __filename, 'run-agent', agentName, ...args], {
      detached: true,
      stdio: ['ignore', 'pipe', 'pipe']
    });

    // Spawn progress monitor process
    const monitorProcess = spawn('npx', ['tsx', __filename, 'monitor-agent', agentName], {
      detached: true,
      stdio: ['ignore', 'pipe', 'pipe']
    });

    // Pipe outputs to log
    agentProcess.stdout.pipe(logStream);
    agentProcess.stderr.pipe(logStream);
    monitorProcess.stdout.pipe(logStream);
    monitorProcess.stderr.pipe(logStream);

    // Handle process events
    agentProcess.on('error', (error) => {
      console.error(`Agent ${agentName} deployment error:`, error);
      logStream.write(`Deployment Error: ${error}\n`);
    });

    monitorProcess.on('error', (error) => {
      console.error(`Progress Monitor for ${agentName} error:`, error);
      logStream.write(`Monitor Error: ${error}\n`);
    });

    return true;
  } catch (error) {
    console.error(`Deployment of ${agentName} failed:`, error);
    return false;
  }
}

/**
 * Handle agent deployment and monitoring commands
 */
async function main() {
  const [, , command, ...args] = process.argv;

  switch (command) {
    case 'deploy':
      const [agentName, ...deployArgs] = args;
      await deployAgentWithMonitoring(agentName, deployArgs);
      break;

    case 'run-agent':
      // Actual agent execution logic would go here
      console.log(`Running agent: ${args[0]}`);
      break;

    case 'monitor-agent':
      // Monitoring logic for a specific agent
      console.log(`Monitoring agent: ${args[0]}`);
      break;

    default:
      console.error('Invalid command. Use deploy, run-agent, or monitor-agent.');
      process.exit(1);
  }
}

main().catch(console.error);