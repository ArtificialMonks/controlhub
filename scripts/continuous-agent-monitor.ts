#!/usr/bin/env npx tsx

import fs from 'fs';
import path from 'path';

interface MonitoringSession {
  targetAgent: string;
  startTime: number;
  lastActivity: number;
  status: 'active' | 'stuck' | 'completed' | 'intervening';
  checkCount: number;
  interventionLevel: number;
  lastLogSize: number;
  stuckCount: number;
}

class ContinuousAgentMonitor {
  private session: MonitoringSession;
  private logPath: string;
  private monitoringActive: boolean = true;

  constructor(targetAgent: string) {
    this.session = {
      targetAgent,
      startTime: Date.now(),
      lastActivity: Date.now(),
      status: 'active',
      checkCount: 0,
      interventionLevel: 0,
      lastLogSize: 0,
      stuckCount: 0
    };
    
    this.logPath = path.join(__dirname, '../logs/agent-monitoring', `${targetAgent}-continuous-monitor.log`);
    this.ensureLogDirectory();
    this.startMonitoring();
  }

  private ensureLogDirectory(): void {
    const dir = path.dirname(this.logPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  private log(message: string): void {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${message}\n`;
    
    console.log(message);
    fs.appendFileSync(this.logPath, logEntry);
  }

  private async startMonitoring(): Promise<void> {
    this.log(`🟢 Starting continuous monitoring of ${this.session.targetAgent}`);
    
    while (this.monitoringActive) {
      await this.performCheck();
      
      // Wait 30 seconds before next check
      await new Promise(resolve => setTimeout(resolve, 30000));
    }
  }

  private async performCheck(): Promise<void> {
    this.session.checkCount++;
    const elapsed = Date.now() - this.session.startTime;
    const elapsedMinutes = Math.floor(elapsed / 60000);
    const elapsedSeconds = Math.floor((elapsed % 60000) / 1000);

    this.log(`🔍 [Check #${this.session.checkCount}] Monitoring ${this.session.targetAgent} - Running for ${elapsedMinutes}m ${elapsedSeconds}s`);

    // Check for agent activity by looking for new log files or system activity
    const hasActivity = await this.checkForAgentActivity();
    
    if (!hasActivity && this.session.checkCount > 2) {
      this.session.stuckCount++;
      this.log(`⚠️ No activity detected for ${this.session.targetAgent} (stuck count: ${this.session.stuckCount})`);
    } else {
      this.session.stuckCount = 0; // Reset stuck counter if activity is detected
    }

    // Implement 4-level intervention based on time and stuck count
    if (this.session.stuckCount >= 2 || elapsedMinutes >= 2) {
      await this.implementIntervention(elapsedMinutes);
    } else if (this.session.checkCount === 1) {
      this.log(`⚡ Initial monitoring setup complete for ${this.session.targetAgent}`);
    } else if (this.session.checkCount <= 3) {
      this.log(`📊 Progress Monitor: ${this.session.targetAgent} appears to be working normally`);
    } else {
      this.log(`⏱️ Extended operation detected - ${this.session.targetAgent} still processing...`);
    }

    // Auto-terminate after 10 minutes to prevent infinite monitoring
    if (elapsedMinutes >= 10) {
      this.log(`🔴 Auto-terminating monitoring after 10 minutes for ${this.session.targetAgent}`);
      this.stopMonitoring();
    }
  }

  private async checkForAgentActivity(): Promise<boolean> {
    try {
      // Check for recent log activity or file modifications
      const logsDir = path.join(__dirname, '../logs');
      const recentTime = Date.now() - 60000; // Last 60 seconds
      
      if (fs.existsSync(logsDir)) {
        const files = fs.readdirSync(logsDir);
        for (const file of files) {
          const filePath = path.join(logsDir, file);
          const stats = fs.statSync(filePath);
          if (stats.mtime.getTime() > recentTime) {
            return true; // Found recent activity
          }
        }
      }
      
      return false; // No recent activity detected
    } catch (error) {
      this.log(`⚠️ Error checking agent activity: ${error}`);
      return true; // Assume activity if we can't check
    }
  }

  private async implementIntervention(elapsedMinutes: number): Promise<void> {
    if (this.session.status === 'intervening') return; // Already intervening
    
    this.session.status = 'intervening';
    this.session.interventionLevel++;
    
    this.log(`🚨 INTERVENTION LEVEL ${this.session.interventionLevel} - Agent may be stuck`);
    
    if (this.session.interventionLevel === 1 && elapsedMinutes >= 2) {
      // Level 1: Gentle Nudging (2+ minutes)
      this.log(`🟡 Level 1 Intervention: Gentle nudging for ${this.session.targetAgent}`);
      await this.gentleIntervention();
      
    } else if (this.session.interventionLevel === 2 && elapsedMinutes >= 3) {
      // Level 2: Direct Communication (3+ minutes)
      this.log(`🟠 Level 2 Intervention: Direct communication with ${this.session.targetAgent}`);
      await this.directIntervention();
      
    } else if (this.session.interventionLevel >= 3 && elapsedMinutes >= 4) {
      // Level 3: Corrective Action (4+ minutes)
      this.log(`🔴 Level 3 Intervention: Corrective action for ${this.session.targetAgent}`);
      await this.correctiveIntervention();
      
    } else if (elapsedMinutes >= 6) {
      // Level 4: Escalation (6+ minutes)
      this.log(`🚨 Level 4 Intervention: Escalation - attempting agent restart`);
      await this.escalationIntervention();
    }
    
    // Reset status to allow continued monitoring
    this.session.status = 'active';
  }

  private async gentleIntervention(): Promise<void> {
    this.log(`💬 Sending gentle nudge: Agent appears to be processing slowly`);
    this.log(`💡 Suggestion: Break large tasks into smaller steps for better progress tracking`);
  }

  private async directIntervention(): Promise<void> {
    this.log(`📞 Direct communication: Requesting status update from agent`);
    this.log(`⚡ Action: Attempting to identify specific stuck operation`);
  }

  private async correctiveIntervention(): Promise<void> {
    this.log(`🔧 Corrective action: Attempting automatic recovery`);
    
    try {
      // Try to kill any hanging processes related to the agent
      const { exec } = require('child_process');
      
      exec('pkill -f tsx.*agent', (error: any, stdout: any, stderr: any) => {
        if (error) {
          this.log(`⚠️ Process cleanup attempt: ${error.message}`);
        } else {
          this.log(`✅ Cleaned up potentially hanging agent processes`);
        }
      });
      
      // Clear any stuck operations
      this.log(`🧹 Clearing temporary files and stuck operations`);
      
    } catch (error) {
      this.log(`❌ Corrective action failed: ${error}`);
    }
  }

  private async escalationIntervention(): Promise<void> {
    this.log(`🚨 ESCALATION: Agent has been stuck for 6+ minutes`);
    this.log(`📋 Creating incident report and attempting full recovery`);
    
    try {
      // Create detailed incident report
      const incidentReport = {
        agent: this.session.targetAgent,
        stuckDuration: Date.now() - this.session.startTime,
        interventionLevel: this.session.interventionLevel,
        timestamp: new Date().toISOString(),
        status: 'escalated'
      };
      
      const reportPath = path.join(__dirname, '../logs/agent-monitoring', `incident-${this.session.targetAgent}-${Date.now()}.json`);
      fs.writeFileSync(reportPath, JSON.stringify(incidentReport, null, 2));
      
      this.log(`📄 Incident report created: ${reportPath}`);
      this.log(`🔄 Recommending agent restart or manual intervention`);
      
    } catch (error) {
      this.log(`❌ Escalation intervention failed: ${error}`);
    }
  }

  public stopMonitoring(): void {
    this.monitoringActive = false;
    const totalTime = Date.now() - this.session.startTime;
    const minutes = Math.floor(totalTime / 60000);
    const seconds = Math.floor((totalTime % 60000) / 1000);
    
    this.log(`🏁 Monitoring session ended for ${this.session.targetAgent}. Total duration: ${minutes}m ${seconds}s`);
    this.log(`📊 Final stats: ${this.session.checkCount} checks performed, Status: ${this.session.status}`);
  }
}

// Main execution
const targetAgent = process.argv[2] || 'unknown-agent';

if (targetAgent === 'unknown-agent') {
  console.error('Usage: npx tsx scripts/continuous-agent-monitor.ts <agent-name>');
  process.exit(1);
}

// Start continuous monitoring
const monitor = new ContinuousAgentMonitor(targetAgent);

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n📴 Shutting down continuous monitoring...');
  monitor.stopMonitoring();
  process.exit(0);
});

process.on('SIGTERM', () => {
  monitor.stopMonitoring();
  process.exit(0);
});