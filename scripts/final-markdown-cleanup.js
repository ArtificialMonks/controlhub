#!/usr/bin/env node

const fs = require('fs');
const { execSync } = require('child_process');

// Get list of files with violations from markdownlint
function getViolatingFiles() {
  try {
    execSync('npm run lint:md', { stdio: 'pipe' });
    return [];
  } catch (error) {
    const output = error.stdout.toString();
    const files = [...new Set(output.match(/[^\s]+\.md/g) || [])];
    return files;
  }
}

function fixMarkdownFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    let fixed = content;

    // Fix MD031: Blanks around fences
    fixed = fixed.replace(/(\n)?```(\w*)\n/g, '\n\n```$2\n');
    fixed = fixed.replace(/\n```(\n[^`])/g, '\n```\n$1');
    fixed = fixed.replace(/([^`\n])\n```/g, '$1\n\n```');

    // Fix MD032: Blanks around lists  
    fixed = fixed.replace(/(\n[^\n\-\*\+\s].*)\n([\-\*\+] )/g, '$1\n\n$2');
    fixed = fixed.replace(/([\-\*\+] [^\n]*)\n([^\n\-\*\+\s])/g, '$1\n\n$2');

    // Fix MD029: Ordered list prefixes
    const lines = fixed.split('\n');
    let inOrderedList = false;
    let expectedNumber = 1;
    let listIndent = '';
    
    const fixedLines = lines.map(line => {
      const orderedListMatch = line.match(/^(\s*)(\d+)\.\s+(.+)$/);
      
      if (orderedListMatch) {
        const [, indent, , text] = orderedListMatch;
        if (!inOrderedList || indent !== listIndent) {
          inOrderedList = true;
          expectedNumber = 1;
          listIndent = indent;
        }
        const result = `${indent}${expectedNumber}. ${text}`;
        expectedNumber++;
        return result;
      } else if (line.trim() === '' && inOrderedList) {
        return line; // Keep blank lines in lists
      } else if (inOrderedList && !line.match(/^\s*$/)) {
        // Check if we're still in the list context
        if (!line.match(/^\s/)) {
          inOrderedList = false;
          expectedNumber = 1;
          listIndent = '';
        }
      }
      
      return line;
    });
    
    fixed = fixedLines.join('\n');

    // Fix MD009: Trailing spaces
    fixed = fixed.replace(/[ \t]+$/gm, '');

    // Fix MD047: Single trailing newline
    fixed = fixed.replace(/\n*$/, '\n');

    // Fix MD025: Multiple H1 headings - convert extra # to ##
    const h1Count = (fixed.match(/^# /gm) || []).length;
    if (h1Count > 1) {
      let foundFirst = false;
      fixed = fixed.replace(/^# (.+)$/gm, (match, text) => {
        if (!foundFirst) {
          foundFirst = true;
          return match;
        }
        return `## ${text}`;
      });
    }

    // Fix MD007: List indentation
    fixed = fixed.replace(/^(\s{1,3})(\*|\-|\+) /gm, '$2 ');

    // Only write if content changed
    if (fixed !== content) {
      fs.writeFileSync(filePath, fixed);
      console.log(`✅ Fixed: ${filePath}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`❌ Error fixing ${filePath}:`, error.message);
    return false;
  }
}

async function main() {
  console.log('🔧 Running final markdown cleanup...');
  
  const violatingFiles = getViolatingFiles();
  console.log(`📁 Found ${violatingFiles.length} files with violations`);

  let fixedCount = 0;
  for (const file of violatingFiles) {
    if (fixMarkdownFile(file)) {
      fixedCount++;
    }
  }

  console.log(`🎉 Fixed ${fixedCount} files`);
  
  // Run final validation
  console.log('🔍 Running final validation...');
  try {
    execSync('npm run lint:md', { stdio: 'inherit' });
    console.log('✅ All markdown quality issues resolved!');
  } catch (error) {
    console.log('⚠️  Some issues may still remain - checking again...');
  }
}

main().catch(console.error);