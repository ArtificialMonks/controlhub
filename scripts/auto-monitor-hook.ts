#!/usr/bin/env npx tsx

import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';

/**
 * Auto-Monitor Hook System
 * Automatically detects Claude Task tool usage and starts monitoring
 */
class AutoMonitorHook {
  private monitoringProcesses: Map<string, any> = new Map();
  private logDir: string;

  constructor() {
    this.logDir = path.join(__dirname, '../logs/agent-monitoring');
    this.ensureLogDirectory();
    this.setupFileWatcher();
  }

  private ensureLogDirectory(): void {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  private setupFileWatcher(): void {
    console.log('🔍 Auto-Monitor Hook: Watching for agent deployments...');
    
    // Watch for new log files or process activity that indicates agent deployment
    const logsDir = path.join(__dirname, '../logs');
    
    if (fs.existsSync(logsDir)) {
      fs.watch(logsDir, { recursive: true }, (eventType, filename) => {
        if (filename && eventType === 'change') {
          this.handlePotentialAgentActivity(filename);
        }
      });
    }

    // Also watch for Task tool usage patterns
    this.monitorTaskToolUsage();
  }

  private async monitorTaskToolUsage(): Promise<void> {
    // Monitor system processes for Claude agent activity
    setInterval(() => {
      this.checkForActiveAgents();
    }, 5000); // Check every 5 seconds
  }

  private async checkForActiveAgents(): Promise<void> {
    try {
      // Look for any agent-related processes or recent log activity
      const recentTime = Date.now() - 30000; // Last 30 seconds
      const logsDir = path.join(__dirname, '../logs');
      
      if (fs.existsSync(logsDir)) {
        const files = fs.readdirSync(logsDir);
        
        for (const file of files) {
          if (file.includes('agent') || file.includes('sonarqube') || file.includes('export')) {
            const filePath = path.join(logsDir, file);
            const stats = fs.statSync(filePath);
            
            if (stats.mtime.getTime() > recentTime) {
              // Detected recent agent activity - extract agent name
              const agentName = this.extractAgentName(file);
              if (agentName && !this.monitoringProcesses.has(agentName)) {
                await this.startAutomaticMonitoring(agentName);
              }
            }
          }
        }
      }
    } catch (error) {
      // Silent error handling to avoid noise
    }
  }

  private extractAgentName(filename: string): string | null {
    // Extract agent name from various log file patterns
    const patterns = [
      /agent-([^-]+)/,
      /(sonarqube)/,
      /(export)/,
      /(spelling)/,
      /(markdownfix)/
    ];

    for (const pattern of patterns) {
      const match = filename.match(pattern);
      if (match) {
        return `agent-${match[1]}`;
      }
    }

    return null;
  }

  private handlePotentialAgentActivity(filename: string): void {
    // Detect agent deployment from log file activity
    if (filename.includes('agent') || filename.includes('quality') || filename.includes('export')) {
      const agentName = this.extractAgentName(filename);
      if (agentName && !this.monitoringProcesses.has(agentName)) {
        setTimeout(() => {
          this.startAutomaticMonitoring(agentName);
        }, 2000); // Small delay to ensure agent has started
      }
    }
  }

  private async startAutomaticMonitoring(agentName: string): Promise<void> {
    try {
      console.log(`🚀 Auto-Monitor: Detected ${agentName} deployment - starting automatic monitoring`);
      
      const scriptPath = path.join(__dirname, 'continuous-agent-monitor.ts');
      
      // Start monitoring process
      const monitorProcess = spawn('npx', ['tsx', scriptPath, agentName], {
        detached: true,
        stdio: ['ignore', 'pipe', 'pipe']
      });

      monitorProcess.unref();

      // Store the process reference
      this.monitoringProcesses.set(agentName, {
        process: monitorProcess,
        startTime: Date.now()
      });

      const logPath = path.join(this.logDir, `${agentName}-continuous-monitor.log`);

      // Setup logging
      if (monitorProcess.stdout) {
        monitorProcess.stdout.on('data', (data) => {
          fs.appendFileSync(logPath, data.toString());
        });
      }

      if (monitorProcess.stderr) {
        monitorProcess.stderr.on('data', (data) => {
          fs.appendFileSync(logPath, `ERROR: ${data.toString()}`);
        });
      }

      monitorProcess.on('exit', () => {
        console.log(`🔴 Auto-Monitor: Monitoring ended for ${agentName}`);
        this.monitoringProcesses.delete(agentName);
      });

      console.log(`✅ Auto-Monitor: Background monitoring active for ${agentName} (PID: ${monitorProcess.pid})`);
      console.log(`📋 View monitoring: tail -f ${logPath}`);
      
    } catch (error) {
      console.error(`❌ Auto-Monitor: Failed to start monitoring for ${agentName}:`, error);
    }
  }

  public getActiveMonitors(): string[] {
    return Array.from(this.monitoringProcesses.keys());
  }

  public stopAllMonitoring(): void {
    console.log('🔴 Auto-Monitor: Stopping all monitoring processes...');
    
    for (const [agentName, info] of this.monitoringProcesses) {
      try {
        info.process.kill('SIGTERM');
        console.log(`✅ Stopped monitoring for ${agentName}`);
      } catch (error) {
        console.error(`❌ Failed to stop monitoring for ${agentName}:`, error);
      }
    }
    
    this.monitoringProcesses.clear();
  }
}

// Initialize the auto-monitor hook
const autoMonitor = new AutoMonitorHook();

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n📴 Auto-Monitor Hook shutting down...');
  autoMonitor.stopAllMonitoring();
  process.exit(0);
});

process.on('SIGTERM', () => {
  autoMonitor.stopAllMonitoring();
  process.exit(0);
});

// Keep the process running
console.log('🟢 Auto-Monitor Hook is now active and watching for agent deployments');
console.log('📋 Active monitors:', autoMonitor.getActiveMonitors());

// Prevent process from exiting
setInterval(() => {
  const activeMonitors = autoMonitor.getActiveMonitors();
  if (activeMonitors.length > 0) {
    console.log(`📊 Auto-Monitor Status: ${activeMonitors.length} agents being monitored: ${activeMonitors.join(', ')}`);
  }
}, 60000); // Status update every minute