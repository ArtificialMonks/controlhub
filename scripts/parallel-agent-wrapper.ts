#!/usr/bin/env tsx

/**
 * Parallel Agent Wrapper for Claude Code
 * 
 * Provides a replacement for the blocking Task tool that enables true parallel execution.
 * This wrapper integrates with Claude Code's native /agents system while providing
 * terminal independence and background processing.
 */

import AgentDispatcher, { AgentTask } from './agent-dispatcher';
import { readdir } from 'fs/promises';
import { join } from 'path';

class ParallelAgentWrapper {
  private dispatcher: AgentDispatcher;
  private availableAgents: string[] = [];

  constructor(projectRoot: string = process.cwd()) {
    this.dispatcher = new AgentDispatcher(projectRoot);
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    this.dispatcher.on('agentStarted', (agentId, status) => {
      console.log(`🚀 Agent '${status.name}' started (${agentId})`);
      console.log(`📊 Monitor with: npm run agent:status ${agentId}`);
    });

    this.dispatcher.on('agentProgress', (agentId, progress) => {
      console.log(`⚡ Agent ${agentId}: ${progress}`);
    });

    this.dispatcher.on('agentCompleted', (agentId, status) => {
      console.log(`✅ Agent '${status.name}' completed in ${this.getDuration(status)}`);
      this.showResult(status);
    });

    this.dispatcher.on('agentFailed', (agentId, status) => {
      console.log(`❌ Agent '${status.name}' failed: ${status.error}`);
    });

    this.dispatcher.on('agentTerminated', (agentId, status) => {
      console.log(`🛑 Agent '${status.name}' was terminated`);
    });
  }

  /**
   * Load available agents from .claude/agents directory
   */
  async loadAvailableAgents(): Promise<void> {
    const agentDirs = [
      join(process.cwd(), '.claude', 'agents'),
      join(process.env.HOME || '~', '.claude', 'agents')
    ];

    this.availableAgents = [];

    for (const dir of agentDirs) {
      try {
        const files = await readdir(dir);
        const mdFiles = files
          .filter(file => file.endsWith('.md'))
          .map(file => file.replace('.md', ''));
        
        this.availableAgents.push(...mdFiles);
      } catch (error) {
        // Directory doesn't exist or can't be read - that's fine
      }
    }

    this.availableAgents = [...new Set(this.availableAgents)]; // Remove duplicates
  }

  /**
   * Deploy an agent with parallel execution (non-blocking)
   */
  async deployAgentParallel(
    agentName: string,
    prompt: string,
    options: {
      description?: string;
      priority?: 'low' | 'medium' | 'high';
      timeout?: number;
    } = {}
  ): Promise<string> {
    await this.loadAvailableAgents();

    if (!this.availableAgents.includes(agentName)) {
      throw new Error(`Agent '${agentName}' not found. Available agents: ${this.availableAgents.join(', ')}`);
    }

    const task: AgentTask = {
      agentName,
      prompt,
      description: options.description || `Parallel execution of ${agentName}`,
      priority: options.priority || 'medium',
      timeout: options.timeout,
    };

    const agentId = await this.dispatcher.deployAgent(task);
    
    console.log(`\n🎯 Agent Deployment Summary:`);
    console.log(`   Agent: ${agentName}`);
    console.log(`   ID: ${agentId}`);
    console.log(`   Priority: ${task.priority}`);
    console.log(`   Status: Running in background`);
    console.log(`\n💡 Your terminal is now free! Agent is working independently.`);
    console.log(`\n📋 Monitoring Commands:`);
    console.log(`   npm run agent:status ${agentId}     # Check specific agent`);
    console.log(`   npm run agent:status               # Check all agents`);
    console.log(`   npm run agent:terminate ${agentId}  # Stop agent if needed`);
    console.log(`\n🔄 The agent will report progress automatically as it works.\n`);

    return agentId;
  }

  /**
   * Get detailed status of all agents
   */
  async getStatus(agentId?: string): Promise<void> {
    await this.dispatcher.loadStatus();

    if (agentId) {
      const status = this.dispatcher.getAgentStatus(agentId);
      if (!status) {
        console.log(`❌ Agent '${agentId}' not found`);
        return;
      }

      this.displayAgentStatus(status);
    } else {
      const allStatus = this.dispatcher.getAllAgentStatus();
      
      if (allStatus.length === 0) {
        console.log(`📭 No agents found`);
        return;
      }

      console.log(`\n📊 Agent Status Summary (${allStatus.length} total):\n`);
      
      const running = allStatus.filter(a => a.status === 'running');
      const completed = allStatus.filter(a => a.status === 'completed');
      const failed = allStatus.filter(a => a.status === 'failed');
      
      console.log(`🟢 Running: ${running.length}`);
      console.log(`✅ Completed: ${completed.length}`);
      console.log(`❌ Failed: ${failed.length}\n`);

      for (const status of allStatus) {
        this.displayAgentStatus(status, true);
      }
    }
  }

  /**
   * List available agents
   */
  async listAgents(): Promise<void> {
    await this.loadAvailableAgents();
    
    console.log(`\n🤖 Available Agents (${this.availableAgents.length}):\n`);
    
    for (const agent of this.availableAgents) {
      console.log(`   • ${agent}`);
    }
    
    console.log(`\n🚀 Deploy with: npm run agent:deploy <agent-name> "<description>" "<prompt>"`);
    console.log(`📖 Use /agents <agent-name> for traditional blocking execution\n`);
  }

  private displayAgentStatus(status: any, compact: boolean = false): void {
    const statusIcons: Record<string, string> = {
      pending: '⏳',
      running: '🔄',
      completed: '✅',
      failed: '❌',
      terminated: '🛑'
    };
    const statusIcon = statusIcons[status.status] || '❓';

    if (compact) {
      console.log(`${statusIcon} ${status.name} (${status.id}) - ${status.status} - ${this.getDuration(status)}`);
    } else {
      console.log(`\n${statusIcon} Agent Status Details:`);
      console.log(`   Name: ${status.name}`);
      console.log(`   ID: ${status.id}`);
      console.log(`   Status: ${status.status}`);
      console.log(`   Started: ${status.startTime}`);
      console.log(`   Duration: ${this.getDuration(status)}`);
      
      if (status.pid) {
        console.log(`   Process ID: ${status.pid}`);
      }
      
      if (status.progress) {
        console.log(`   Progress: ${status.progress}`);
      }
      
      if (status.error) {
        console.log(`   Error: ${status.error}`);
      }
      
      if (status.result && status.status === 'completed') {
        this.showResult(status);
      }
    }
  }

  private getDuration(status: any): string {
    const start = new Date(status.startTime);
    const end = status.endTime ? new Date(status.endTime) : new Date();
    const duration = Math.round((end.getTime() - start.getTime()) / 1000);
    
    if (duration < 60) {
      return `${duration}s`;
    } else if (duration < 3600) {
      return `${Math.round(duration / 60)}m ${duration % 60}s`;
    } else {
      const hours = Math.floor(duration / 3600);
      const minutes = Math.floor((duration % 3600) / 60);
      return `${hours}h ${minutes}m`;
    }
  }

  private showResult(status: any): void {
    if (!status.result) return;

    try {
      const result = JSON.parse(status.result);
      console.log(`\n📄 Agent Result:`);
      console.log(JSON.stringify(result, null, 2));
    } catch {
      // Not JSON, show as text
      console.log(`\n📄 Agent Output:`);
      console.log(status.result.substring(0, 500));
      if (status.result.length > 500) {
        console.log('... (truncated)');
      }
    }
  }
}

// CLI interface
if (require.main === module) {
  const wrapper = new ParallelAgentWrapper();
  
  const command = process.argv[2];
  const args = process.argv.slice(3);

  async function main() {
    switch (command) {
      case 'deploy':
        if (args.length < 3) {
          console.error('Usage: parallel-agent-wrapper deploy <agent-name> <description> <prompt>');
          process.exit(1);
        }
        
        const agentId = await wrapper.deployAgentParallel(args[0], args.slice(2).join(' '), {
          description: args[1],
          priority: 'medium'
        });
        
        console.log(`\n🎉 Agent successfully deployed with ID: ${agentId}`);
        break;

      case 'status':
        await wrapper.getStatus(args[0]);
        break;

      case 'list':
        await wrapper.listAgents();
        break;

      default:
        console.log(`
🤖 Parallel Agent Wrapper - Terminal Independence for Claude Code Agents

Usage:
  parallel-agent-wrapper deploy <agent-name> <description> <prompt>
  parallel-agent-wrapper status [agent-id]
  parallel-agent-wrapper list

Key Benefits:
  ✅ Non-blocking execution - your terminal stays responsive
  ✅ True parallel processing - run multiple agents simultaneously  
  ✅ Real-time progress updates without blocking input
  ✅ Background process management with proper cleanup
  ✅ Full compatibility with existing /agents system

Examples:
  # Deploy agent in background (non-blocking)
  parallel-agent-wrapper deploy markdown-qa-enforcer "Fix violations" "Scan and fix all markdown files"
  
  # Check status without blocking
  parallel-agent-wrapper status markdown-qa-enforcer-1691234567890-abc123
  
  # List available agents
  parallel-agent-wrapper list

Integration with npm scripts:
  npm run agent:deploy markdown-qa-enforcer "Fix violations" "Scan all files"  
  npm run agent:status                    # Check all agents
  npm run agent:status <agent-id>         # Check specific agent
  npm run agent:terminate <agent-id>      # Stop agent
  npm run agent:cleanup                   # Clean completed agents
        `);
    }
  }

  main().catch(console.error);
}

export default ParallelAgentWrapper;