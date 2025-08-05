#!/usr/bin/env tsx

/**
 * A.V.A.R.I.C.E. Protocol Agent Dispatcher System
 * 
 * Provides true parallel execution for Claude Code agents with terminal independence.
 * Agents run in separate processes while maintaining communication and status monitoring.
 */

import { spawn, ChildProcess } from 'child_process';
import { promises as fs } from 'fs';
import { join } from 'path';
import { EventEmitter } from 'events';

export interface AgentStatus {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'terminated';
  startTime: Date;
  endTime?: Date;
  progress?: string;
  result?: string;
  error?: string;
  pid?: number;
}

export interface AgentTask {
  agentName: string;
  prompt: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  timeout?: number; // milliseconds
}

export class AgentDispatcher extends EventEmitter {
  private activeAgents = new Map<string, AgentStatus>();
  private agentProcesses = new Map<string, ChildProcess>();
  private statusLogPath: string;
  private projectRoot: string;

  constructor(projectRoot: string = process.cwd()) {
    super();
    this.projectRoot = projectRoot;
    this.statusLogPath = join(projectRoot, 'logs', 'agent-dispatcher.json');
    this.ensureLogDirectory();
  }

  private async ensureLogDirectory(): Promise<void> {
    const logDir = join(this.projectRoot, 'logs');
    try {
      await fs.mkdir(logDir, { recursive: true });
    } catch (error) {
      console.warn(`Failed to create log directory: ${error}`);
    }
  }

  /**
   * Deploy an agent asynchronously in a separate process
   */
  async deployAgent(task: AgentTask): Promise<string> {
    const agentId = this.generateAgentId(task.agentName);
    
    const status: AgentStatus = {
      id: agentId,
      name: task.agentName,
      status: 'pending',
      startTime: new Date(),
    };

    this.activeAgents.set(agentId, status);
    await this.saveStatus();

    // Start agent in background process
    this.startAgentProcess(agentId, task);

    console.log(`🚀 Agent '${task.agentName}' deployed with ID: ${agentId}`);
    console.log(`📊 Status: ${status.status} | Priority: ${task.priority}`);
    console.log(`💡 Use 'npm run agent:status ${agentId}' to monitor progress`);
    
    return agentId;
  }

  private async startAgentProcess(agentId: string, task: AgentTask): Promise<void> {
    const status = this.activeAgents.get(agentId)!;
    
    try {
      // Use Claude CLI to run the agent in a separate process
      const agentProcess = spawn('claude', [
        '--print',
        '--output-format', 'json',
        `/agents ${task.agentName}`,
        task.prompt
      ], {
        detached: false,
        stdio: ['ignore', 'pipe', 'pipe'],
        cwd: this.projectRoot
      });

      status.pid = agentProcess.pid;
      status.status = 'running';
      this.agentProcesses.set(agentId, agentProcess);
      
      await this.saveStatus();
      this.emit('agentStarted', agentId, status);

      // Handle process output
      let output = '';
      let error = '';

      agentProcess.stdout?.on('data', (data) => {
        const chunk = data.toString();
        output += chunk;
        status.progress = this.extractProgress(chunk);
        this.emit('agentProgress', agentId, status.progress);
      });

      agentProcess.stderr?.on('data', (data) => {
        error += data.toString();
      });

      // Handle process completion
      agentProcess.on('close', async (code) => {
        status.endTime = new Date();
        status.status = code === 0 ? 'completed' : 'failed';
        status.result = output;
        status.error = error;

        this.agentProcesses.delete(agentId);
        await this.saveStatus();

        if (code === 0) {
          console.log(`✅ Agent '${task.agentName}' (${agentId}) completed successfully`);
          this.emit('agentCompleted', agentId, status);
        } else {
          console.log(`❌ Agent '${task.agentName}' (${agentId}) failed with code ${code}`);
          this.emit('agentFailed', agentId, status);
        }
      });

      agentProcess.on('error', async (err) => {
        status.endTime = new Date();
        status.status = 'failed';
        status.error = err.message;
        
        this.agentProcesses.delete(agentId);
        await this.saveStatus();
        
        console.log(`💥 Agent '${task.agentName}' (${agentId}) encountered error: ${err.message}`);
        this.emit('agentError', agentId, err);
      });

      // Set timeout if specified
      if (task.timeout) {
        setTimeout(() => {
          if (status.status === 'running') {
            this.terminateAgent(agentId);
          }
        }, task.timeout);
      }

    } catch (error) {
      status.status = 'failed';
      status.error = error instanceof Error ? error.message : String(error);
      await this.saveStatus();
      this.emit('agentError', agentId, error);
    }
  }

  /**
   * Get status of a specific agent
   */
  getAgentStatus(agentId: string): AgentStatus | undefined {
    return this.activeAgents.get(agentId);
  }

  /**
   * Get status of all agents
   */
  getAllAgentStatus(): AgentStatus[] {
    return Array.from(this.activeAgents.values());
  }

  /**
   * Get only running agents
   */
  getRunningAgents(): AgentStatus[] {
    return this.getAllAgentStatus().filter(agent => agent.status === 'running');
  }

  /**
   * Terminate a running agent
   */
  async terminateAgent(agentId: string): Promise<boolean> {
    const status = this.activeAgents.get(agentId);
    const process = this.agentProcesses.get(agentId);

    if (!status || !process) {
      return false;
    }

    try {
      process.kill('SIGTERM');
      
      status.status = 'terminated';
      status.endTime = new Date();
      
      this.agentProcesses.delete(agentId);
      await this.saveStatus();
      
      console.log(`🛑 Agent '${status.name}' (${agentId}) terminated`);
      this.emit('agentTerminated', agentId, status);
      
      return true;
    } catch (error) {
      console.error(`Failed to terminate agent ${agentId}:`, error);
      return false;
    }
  }

  /**
   * Terminate all running agents
   */
  async terminateAllAgents(): Promise<number> {
    const runningAgents = this.getRunningAgents();
    let terminated = 0;

    for (const agent of runningAgents) {
      if (await this.terminateAgent(agent.id)) {
        terminated++;
      }
    }

    return terminated;
  }

  /**
   * Clean up completed/failed agents from memory (keeps logs)
   */
  async cleanupCompletedAgents(): Promise<number> {
    const toRemove = this.getAllAgentStatus().filter(
      agent => agent.status === 'completed' || agent.status === 'failed'
    );

    for (const agent of toRemove) {
      this.activeAgents.delete(agent.id);
    }

    await this.saveStatus();
    return toRemove.length;
  }

  private generateAgentId(agentName: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `${agentName}-${timestamp}-${random}`;
  }

  private extractProgress(output: string): string {
    // Try to extract progress information from agent output
    const progressPatterns = [
      /Progress: (.+)/i,
      /Status: (.+)/i,
      /Working on: (.+)/i,
      /Phase: (.+)/i,
      /Step: (.+)/i,
    ];

    for (const pattern of progressPatterns) {
      const match = output.match(pattern);
      if (match) {
        return match[1].trim();
      }
    }

    // Fallback: return last non-empty line
    const lines = output.trim().split('\n').filter(line => line.trim());
    return lines.length > 0 ? lines[lines.length - 1].substring(0, 100) : 'Running...';
  }

  private async saveStatus(): Promise<void> {
    try {
      const statusData = {
        timestamp: new Date().toISOString(),
        agents: Array.from(this.activeAgents.values()),
      };
      
      await fs.writeFile(
        this.statusLogPath,
        JSON.stringify(statusData, null, 2),
        'utf-8'
      );
    } catch (error) {
      console.warn(`Failed to save agent status: ${error}`);
    }
  }

  /**
   * Load status from persistent storage
   */
  async loadStatus(): Promise<void> {
    try {
      const data = await fs.readFile(this.statusLogPath, 'utf-8');
      const statusData = JSON.parse(data);
      
      // Restore non-running agents (running agents are lost on restart)
      for (const agent of statusData.agents) {
        if (agent.status !== 'running') {
          this.activeAgents.set(agent.id, {
            ...agent,
            startTime: new Date(agent.startTime),
            endTime: agent.endTime ? new Date(agent.endTime) : undefined,
          });
        }
      }
    } catch (error) {
      // File doesn't exist or is corrupted - start fresh
      console.log('Starting with empty agent status');
    }
  }
}

// CLI interface for direct usage
if (require.main === module) {
  const dispatcher = new AgentDispatcher();
  
  const command = process.argv[2];
  const args = process.argv.slice(3);

  switch (command) {
    case 'deploy':
      if (args.length < 3) {
        console.error('Usage: agent-dispatcher deploy <agent-name> <description> <prompt>');
        process.exit(1);
      }
      
      dispatcher.deployAgent({
        agentName: args[0],
        description: args[1],
        prompt: args.slice(2).join(' '),
        priority: 'medium'
      }).then(id => {
        console.log(`Agent deployed with ID: ${id}`);
      }).catch(console.error);
      break;

    case 'status':
      dispatcher.loadStatus().then(() => {
        if (args[0]) {
          const status = dispatcher.getAgentStatus(args[0]);
          console.log(status ? JSON.stringify(status, null, 2) : 'Agent not found');
        } else {
          console.log(JSON.stringify(dispatcher.getAllAgentStatus(), null, 2));
        }
      });
      break;

    case 'terminate':
      if (!args[0]) {
        console.error('Usage: agent-dispatcher terminate <agent-id>');
        process.exit(1);
      }
      
      dispatcher.loadStatus().then(() => {
        return dispatcher.terminateAgent(args[0]);
      }).then(success => {
        console.log(success ? 'Agent terminated' : 'Failed to terminate agent');
      });
      break;

    case 'cleanup':
      dispatcher.loadStatus().then(() => {
        return dispatcher.cleanupCompletedAgents();
      }).then(count => {
        console.log(`Cleaned up ${count} completed agents`);
      });
      break;

    default:
      console.log(`
A.V.A.R.I.C.E. Protocol Agent Dispatcher

Usage:
  agent-dispatcher deploy <agent-name> <description> <prompt>
  agent-dispatcher status [agent-id]
  agent-dispatcher terminate <agent-id>
  agent-dispatcher cleanup

Examples:
  agent-dispatcher deploy markdown-qa-enforcer "Fix markdown violations" "Scan and fix all markdown files"
  agent-dispatcher status
  agent-dispatcher status markdown-qa-enforcer-1691234567890-abc123
  agent-dispatcher terminate markdown-qa-enforcer-1691234567890-abc123
      `);
  }
}

export default AgentDispatcher;