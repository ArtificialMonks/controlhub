#!/usr/bin/env node

const fs = require('fs');
const { execSync } = require('child_process');
const { glob } = require('glob');

async function fixAllViolations() {
  console.log('🎯 Starting bulk markdown fixes...');
  
  // Get all markdown files
  const markdownFiles = await glob('**/*.md', {
    ignore: ['node_modules/**', '.next/**', '.git/**', 'dist/**', 'build/**']
  });

  console.log(`📁 Found ${markdownFiles.length} markdown files`);

  let totalFixed = 0;
  for (const file of markdownFiles) {
    try {
      const originalContent = fs.readFileSync(file, 'utf-8');
      let modifiedContent = originalContent;

      // Apply all fixes
      modifiedContent = fixLineLength(modifiedContent);
      modifiedContent = fixEmphasisAsHeading(modifiedContent);
      modifiedContent = fixCodeBlockLanguage(modifiedContent);
      modifiedContent = fixOrderedListPrefix(modifiedContent);
      modifiedContent = fixCodeBlockStyle(modifiedContent);
      modifiedContent = fixTablePipeStyle(modifiedContent);

      // Only write if content changed
      if (modifiedContent !== originalContent) {
        fs.writeFileSync(file, modifiedContent);
        totalFixed++;
        console.log(`✅ Fixed: ${file}`);
      }
    } catch (error) {
      console.error(`❌ Error processing ${file}:`, error);
    }
  }

  console.log(`🎉 Bulk fixing complete! Fixed ${totalFixed} files`);
}

function fixLineLength(content) {
  const lines = content.split('\n');
  const fixedLines = lines.map(line => {
    if (line.length <= 120) return line;
    
    // Don't break code blocks, links, or table headers
    if (line.trim().startsWith('```') || 
        line.includes('http') || 
        line.includes('|') ||
        line.trim().startsWith('#')) {
      return line;
    }

    // Break long lines at word boundaries
    if (line.length > 120) {
      const words = line.split(' ');
      const lines = [];
      let currentLine = '';

      for (const word of words) {
        if ((currentLine + ' ' + word).length > 120 && currentLine.length > 0) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          currentLine = currentLine ? currentLine + ' ' + word : word;
        }
      }
      if (currentLine) lines.push(currentLine);
      return lines.join('\n');
    }
    
    return line;
  });
  
  return fixedLines.join('\n');
}

function fixEmphasisAsHeading(content) {
  // Convert **Phase X:** patterns to proper headings
  return content.replace(/^\*\*(Phase \d+:[^*]+)\*\*$/gm, '#### $1')
    .replace(/^\*\*(PR-\d+:[^*]+)\*\*$/gm, '#### $1');
}

function fixCodeBlockLanguage(content) {
  // Add bash language to code blocks that appear to be shell commands
  return content.replace(/^```\s*$/gm, (match, offset, string) => {
    const nextLines = string.slice(offset + match.length).split('\n').slice(0, 3);
    const hasShellCommands = nextLines.some(line => 
      line.trim().startsWith('npm ') || 
      line.trim().startsWith('git ') ||
      line.trim().startsWith('cd ') ||
      line.trim().startsWith('mkdir ') ||
      line.trim().includes('run ')
    );
    return hasShellCommands ? '```bash' : '```text';
  });
}

function fixOrderedListPrefix(content) {
  const lines = content.split('\n');
  let inOrderedList = false;
  let expectedNumber = 1;
  
  const fixedLines = lines.map(line => {
    const orderedListMatch = line.match(/^(\s*)(\d+)\.\s+(.+)$/);
    
    if (orderedListMatch) {
      if (!inOrderedList) {
        inOrderedList = true;
        expectedNumber = 1;
      }
      const [, indent, , text] = orderedListMatch;
      const result = `${indent}${expectedNumber}. ${text}`;
      expectedNumber++;
      return result;
    } else if (line.trim() === '' && inOrderedList) {
      return line; // Keep blank lines in lists
    } else if (inOrderedList && !line.match(/^\s*[a-zA-Z\-\*]/)) {
      inOrderedList = false;
      expectedNumber = 1;
    }
    
    return line;
  });
  
  return fixedLines.join('\n');
}

function fixCodeBlockStyle(content) {
  // Convert indented code blocks to fenced code blocks
  const lines = content.split('\n');
  const result = [];
  let inIndentedBlock = false;
  let blockLines = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const isIndented = line.match(/^    (.+)$/) && !line.trim().startsWith('*') && !line.trim().startsWith('-');
    
    if (isIndented && !inIndentedBlock) {
      inIndentedBlock = true;
      blockLines = [line.slice(4)];
    } else if (isIndented && inIndentedBlock) {
      blockLines.push(line.slice(4));
    } else if (!isIndented && inIndentedBlock) {
      // End of indented block - convert to fenced
      result.push('```text');
      result.push(...blockLines);
      result.push('```');
      inIndentedBlock = false;
      blockLines = [];
      result.push(line);
    } else {
      result.push(line);
    }
  }

  // Handle block at end of file
  if (inIndentedBlock) {
    result.push('```text');
    result.push(...blockLines);
    result.push('```');
  }

  return result.join('\n');
}

function fixTablePipeStyle(content) {
  return content.replace(/^(\|[^|\n]+)(?!\|)$/gm, '$1|');
}

// Run the fixer
fixAllViolations().catch(console.error);