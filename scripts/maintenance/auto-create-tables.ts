#!/usr/bin/env tsx
/**
 * Automated Table Creation using Playwright Browser Automation
 * This script logs into Supabase and creates tables via SQL Editor
 */

import { chromium, Browser, BrowserContext, Page } from 'playwright'
import { createClient } from '@supabase/supabase-js'
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

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

// Login credentials
const SUPABASE_EMAIL = 'artificialmonks@gmail.com'
const SUPABASE_PASSWORD = '4M.Sup@base'
const PROJECT_ID = 'trphfbzhurabdmgqimwj'

async function getSQL(): Promise<string> {
  const sqlPath = path.join(process.cwd(), 'scripts', 'setup-supabase-sql.sql')
  if (!fs.existsSync(sqlPath)) {
    throw new Error('SQL file not found: scripts/setup-supabase-sql.sql')
  }
  return fs.readFileSync(sqlPath, 'utf8')
}

async function loginToSupabase(page: Page): Promise<boolean> {
  console.log('🔐 Logging into Supabase Dashboard...')
  
  try {
    await page.goto('https://supabase.com/dashboard/sign-in', { 
      waitUntil: 'domcontentloaded',
      timeout: 60000 
    })
    await page.waitForTimeout(5000)
    
    // Enter email
    const emailInput = page.locator('input[type="email"]').first()
    await emailInput.waitFor({ timeout: 10000 })
    await emailInput.fill(SUPABASE_EMAIL)
    console.log('📧 Email entered')
    
    // Enter password
    const passwordInput = page.locator('input[type="password"]').first()
    await passwordInput.waitFor({ timeout: 5000 })
    await passwordInput.fill(SUPABASE_PASSWORD)
    console.log('🔑 Password entered')
    
    // Click sign in button
    const signInButton = page.locator('button:has-text("Sign in")').first()
    await signInButton.click()
    console.log('🚀 Login submitted')
    
    // Wait for any redirect and check where we landed
    await page.waitForTimeout(8000)
    
    const currentUrl = page.url()
    console.log(`📍 Current URL: ${currentUrl}`)
    
    if (currentUrl.includes('dashboard') || currentUrl.includes('organizations')) {
      console.log('✅ Successfully logged into Supabase')
      return true
    } else if (currentUrl.includes('sign-in')) {
      console.log('❌ Still on sign-in page - login may have failed')
      return false
    } else {
      console.log('✅ Login appears successful - redirected to unexpected page')
      return true
    }
    
  } catch (error) {
    console.error(`❌ Login failed: ${error}`)
    return false
  }
}

async function navigateToSQLEditor(page: Page): Promise<boolean> {
  console.log('📂 Navigating to SQL Editor...')
  
  try {
    const sqlEditorUrl = `https://supabase.com/dashboard/project/${PROJECT_ID}/sql`
    await page.goto(sqlEditorUrl, { waitUntil: 'networkidle' })
    
    // Wait for Monaco editor to load
    await page.waitForSelector('.monaco-editor', { timeout: 30000 })
    console.log('✅ SQL Editor loaded')
    return true
    
  } catch (error) {
    console.error(`❌ Failed to navigate to SQL Editor: ${error}`)
    return false
  }
}

async function executeSQLInEditor(page: Page): Promise<boolean> {
  console.log('📝 Executing SQL in editor...')
  
  try {
    const sqlContent = await getSQL()
    
    // Focus on the editor
    await page.click('.monaco-editor .view-lines')
    await page.waitForTimeout(1000)
    
    // Clear and insert SQL
    await page.keyboard.press('Control+a')
    await page.keyboard.press('Delete')
    await page.keyboard.type(sqlContent, { delay: 5 })
    console.log('📄 SQL content inserted')
    
    await page.waitForTimeout(2000)
    
    // Find and click Run button
    const runSelectors = [
      'button:has-text("Run")',
      '[data-testid="run-button"]',
      '.btn:has-text("Run")',
      'button[title*="Run"]'
    ]
    
    let executed = false
    for (const selector of runSelectors) {
      try {
        const button = page.locator(selector).first()
        if (await button.isVisible({ timeout: 3000 })) {
          await button.click()
          console.log('▶️  Run button clicked')
          executed = true
          break
        }
      } catch (error) {
        // Try next selector
      }
    }
    
    if (!executed) {
      console.log('⌨️  Using Ctrl+Enter shortcut')
      await page.keyboard.press('Control+Enter')
    }
    
    // Wait for execution
    await page.waitForTimeout(10000)
    console.log('✅ SQL execution completed')
    return true
    
  } catch (error) {
    console.error(`❌ SQL execution failed: ${error}`)
    return false
  }
}

async function verifyTablesCreated(): Promise<boolean> {
  console.log('🔍 Verifying tables were created...')
  
  try {
    const tables = ['profiles', 'automations', 'audit_logs']
    const results: { [key: string]: boolean } = {}
    
    for (const table of tables) {
      try {
        const { error } = await supabase.from(table).select('*').limit(1)
        results[table] = !error
        console.log(`${results[table] ? '✅' : '❌'} Table '${table}': ${results[table] ? 'exists' : 'not found'}`)
      } catch (err) {
        results[table] = false
        console.log(`❌ Table '${table}': error checking`)
      }
    }
    
    const allExist = Object.values(results).every(exists => exists)
    return allExist
    
  } catch (error) {
    console.error(`❌ Verification failed: ${error}`)
    return false
  }
}

async function insertSampleData(): Promise<boolean> {
  console.log('📊 Inserting sample data...')
  
  try {
    const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers()
    
    if (usersError || !users.length) {
      console.log('ℹ️  No users found - skipping sample data')
      return true
    }
    
    const userId = users[0].id
    
    const sampleAutomations = [
      {
        user_id: userId,
        name: 'Customer Data Sync',
        description: 'Synchronizes customer data between systems',
        client_name: 'Acme Corporation',
        status: 'Running',
        webhook_url: 'https://n8n.artificialmonks.com/webhook/customer-sync',
        priority: 'High',
        tags: ['sync', 'customer', 'data'],
        run_count: 150,
        success_count: 147,
        error_count: 3,
        avg_execution_time: 2500
      },
      {
        user_id: userId,
        name: 'Email Campaign Automation',
        description: 'Automated email marketing campaigns',
        client_name: 'Acme Corporation',
        status: 'Stopped',
        webhook_url: 'https://n8n.artificialmonks.com/webhook/email-campaign',
        priority: 'Medium',
        tags: ['email', 'marketing'],
        run_count: 85,
        success_count: 81,
        error_count: 4,
        avg_execution_time: 1800
      },
      {
        user_id: userId,
        name: 'Inventory Management',
        description: 'Manages inventory levels and reordering',
        client_name: 'TechStart Inc',
        status: 'Error',
        webhook_url: 'https://n8n.artificialmonks.com/webhook/inventory',
        priority: 'Critical',
        tags: ['inventory', 'management'],
        run_count: 42,
        success_count: 38,
        error_count: 4,
        avg_execution_time: 3200
      }
    ]
    
    const { error } = await supabase.from('automations').insert(sampleAutomations)
    
    if (error) {
      console.error(`❌ Sample data insertion failed: ${error.message}`)
      return false
    }
    
    console.log('✅ Sample data inserted successfully')
    return true
    
  } catch (error) {
    console.error(`❌ Sample data error: ${error}`)
    return false
  }
}

async function main() {
  console.log('🚀 Automated Supabase Table Creation with Browser Automation\n')
  
  let browser: Browser | null = null
  
  try {
    // Launch browser
    console.log('🌐 Launching browser...')
    browser = await chromium.launch({ 
      headless: false,  // Keep visible
      slowMo: 500,
      args: ['--no-sandbox', '--disable-dev-shm-usage']
    })
    
    const context = await browser.newContext({
      viewport: { width: 1200, height: 800 },
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    })
    
    const page = await context.newPage()
    
    // Step 1: Login
    const loginSuccess = await loginToSupabase(page)
    if (!loginSuccess) {
      console.log('❌ Login failed')
      return
    }
    
    // Step 2: Navigate to SQL Editor
    const navigationSuccess = await navigateToSQLEditor(page)
    if (!navigationSuccess) {
      console.log('❌ Navigation failed')
      return
    }
    
    // Step 3: Execute SQL
    const executionSuccess = await executeSQLInEditor(page)
    if (!executionSuccess) {
      console.log('❌ SQL execution failed')
      return
    }
    
    // Take screenshot
    await page.screenshot({ 
      path: 'supabase-table-creation.png',
      fullPage: true 
    })
    console.log('📸 Screenshot saved: supabase-table-creation.png')
    
    // Keep browser open briefly
    await page.waitForTimeout(5000)
    
  } catch (error) {
    console.error(`❌ Browser automation error: ${error}`)
  } finally {
    if (browser) {
      await browser.close()
    }
  }
  
  // Step 4: Verify tables
  console.log('\n🔍 Testing table creation...')
  const tablesExist = await verifyTablesCreated()
  
  if (tablesExist) {
    console.log('\n🎉 SUCCESS! All tables created successfully! 🎉')
    
    // Step 5: Insert sample data
    const sampleDataSuccess = await insertSampleData()
    
    if (sampleDataSuccess) {
      console.log('\n✅ COMPLETE SETUP SUCCESSFUL!')
      console.log('   • Tables created: profiles, automations, audit_logs')
      console.log('   • Sample data inserted')
      console.log('   • Ready for application testing')
      
      console.log('\n🚀 Next steps:')
      console.log('   1. npm run dev')
      console.log('   2. Test automation management features')
    }
  } else {
    console.log('\n❌ Table verification failed')
    console.log('📋 Please check the Supabase Dashboard manually')
  }
}

if (require.main === module) {
  main().catch(console.error)
}