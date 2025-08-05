#!/usr/bin/env tsx
/**
 * Playwright Automation for Supabase SQL Editor
 * Automates the SQL execution in Supabase Dashboard
 */

import { chromium, Browser, BrowserContext, Page } from 'playwright'
import { config } from 'dotenv'
import * as path from 'path'
import * as fs from 'fs'

// Load environment variables from .env.local
config({ path: path.join(process.cwd(), '.env.local') })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing required environment variables')
  process.exit(1)
}

// Extract project ID from Supabase URL
const projectId = SUPABASE_URL?.split('//')[1]?.split('.')[0]

async function getSQL(): Promise<string> {
  const sqlPath = path.join(process.cwd(), 'scripts', 'setup-supabase-sql.sql')
  return fs.readFileSync(sqlPath, 'utf8')
}

async function automateSupabaseSQL() {
  console.log('🚀 Starting Playwright automation for Supabase SQL Editor...')
  
  let browser: Browser | null = null
  let context: BrowserContext | null = null
  let page: Page | null = null
  
  try {
    // Launch browser
    console.log('🌐 Launching browser...')
    browser = await chromium.launch({ 
      headless: false, // Set to true for headless mode
      slowMo: 1000 // Slow down for visibility
    })
    
    context = await browser.newContext()
    page = await context.newPage()
    
    // Navigate to Supabase Dashboard
    console.log('📊 Navigating to Supabase Dashboard...')
    await page.goto('https://supabase.com/dashboard/sign-in')
    
    // Check if already logged in or need to login
    await page.waitForTimeout(3000)
    
    const currentUrl = page.url()
    if (currentUrl.includes('sign-in')) {
      console.log('🔐 Login required - please complete authentication manually')
      console.log('   1. Complete login in the browser window that opened')
      console.log('   2. Navigate to your project dashboard')
      console.log('   3. Press Enter here when ready to continue...')
      
      // Wait for user input
      await new Promise((resolve) => {
        process.stdin.once('data', () => resolve(void 0))
      })
    }
    
    // Navigate to project SQL Editor
    console.log(`🎯 Navigating to project SQL Editor: ${projectId}`)
    await page.goto(`https://supabase.com/dashboard/project/${projectId}/sql`)
    
    // Wait for SQL Editor to load
    console.log('⏳ Waiting for SQL Editor to load...')
    await page.waitForSelector('.monaco-editor', { timeout: 30000 })
    
    // Get the SQL content
    const sqlContent = await getSQL()
    
    // Clear existing content and insert SQL
    console.log('📝 Inserting SQL content...')
    
    // Click in the editor to focus
    await page.click('.monaco-editor')
    
    // Select all and delete
    await page.keyboard.press('Control+A')
    await page.keyboard.press('Delete')
    
    // Type the SQL content
    await page.keyboard.type(sqlContent)
    
    // Wait a moment for content to be inserted
    await page.waitForTimeout(2000)
    
    // Look for and click the Run button
    console.log('▶️  Executing SQL...')
    
    // Try different selectors for the Run button
    const runButtonSelectors = [
      'button:has-text("Run")',
      '[data-testid="run-button"]',
      '.btn-primary:has-text("Run")',
      'button[type="submit"]:has-text("Run")'
    ]
    
    let runButtonFound = false
    for (const selector of runButtonSelectors) {
      try {
        await page.click(selector, { timeout: 5000 })
        runButtonFound = true
        console.log('✅ Run button clicked successfully')
        break
      } catch (error) {
        console.log(`❌ Run button selector failed: ${selector}`)
      }
    }
    
    if (!runButtonFound) {
      console.log('⌨️  Trying keyboard shortcut (Ctrl+Enter)...')
      await page.keyboard.press('Control+Enter')
    }
    
    // Wait for execution results
    console.log('⏳ Waiting for SQL execution results...')
    await page.waitForTimeout(5000)
    
    // Check for success or error messages
    const successIndicators = [
      '.text-green',
      '.success',
      ':has-text("Success")',
      ':has-text("completed successfully")'
    ]
    
    const errorIndicators = [
      '.text-red',
      '.error',
      ':has-text("Error")',
      ':has-text("failed")'
    ]
    
    let executionSuccess = false
    for (const selector of successIndicators) {
      try {
        await page.waitForSelector(selector, { timeout: 3000 })
        executionSuccess = true
        console.log('✅ SQL execution appears successful')
        break
      } catch {
        // Continue checking
      }
    }
    
    if (!executionSuccess) {
      for (const selector of errorIndicators) {
        try {
          await page.waitForSelector(selector, { timeout: 3000 })
          console.log('❌ SQL execution appears to have failed')
          break
        } catch {
          // Continue checking
        }
      }
    }
    
    // Take a screenshot for verification
    console.log('📸 Taking screenshot for verification...')
    await page.screenshot({ 
      path: 'supabase-sql-execution-result.png',
      fullPage: true 
    })
    
    console.log('✅ Automation completed')
    console.log('📸 Screenshot saved: supabase-sql-execution-result.png')
    
    // Keep browser open for manual verification
    console.log('🔍 Browser will remain open for manual verification')
    console.log('   Press Enter to close browser and continue...')
    
    await new Promise((resolve) => {
      process.stdin.once('data', () => resolve(void 0))
    })
    
    return true
    
  } catch (error) {
    console.error(`❌ Automation failed: ${error}`)
    return false
  } finally {
    if (browser) {
      await browser.close()
    }
  }
}

async function main() {
  console.log('🏗️  Supabase SQL Editor Automation\n')
  
  const success = await automateSupabaseSQL()
  
  if (success) {
    console.log('\n🎉 Automation completed!')
    console.log('🔄 Now testing table creation...')
    
    // Test if tables were created
    const { exec } = require('child_process')
    exec('npx tsx scripts/create-tables-manually.ts --with-sample-data', (error: any, stdout: string, stderr: string) => {
      if (error) {
        console.error(`❌ Table test failed: ${error}`)
        return
      }
      console.log(stdout)
      if (stderr) console.error(stderr)
    })
  } else {
    console.log('\n❌ Automation failed - manual execution required')
  }
}

if (require.main === module) {
  main().catch(console.error)
}