const { chromium } = require('playwright-core');
const axios = require('axios');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const dotenv = require(path.join(__dirname, '../Backend/node_modules/dotenv'));
dotenv.config({ path: path.join(__dirname, '../Backend/.env') });
const jwt = require('../Backend/dist/src/utils/jwt');
const prisma = require('../Backend/dist/src/config/prisma').default;

const API_BASE = 'http://localhost:5000/api/v1';
const WEB_BASE = 'http://localhost:3000';
const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const SCREENSHOTS_DIR = path.join(__dirname, '../screenshots');

if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

let backendProcess = null;
let frontendProcess = null;

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function waitForServer(url, timeoutMs = 60000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await axios.get(url, { validateStatus: () => true, timeout: 5000 });
      if (res.status >= 200 && res.status < 500) {
        return true;
      }
    } catch (e) {}
    await sleep(800);
  }
  return false;
}

async function ensureServersRunning() {
  try {
    const res = await axios.get('http://localhost:5000/health', { timeout: 3000 });
    if (res.status === 200) {
      console.log('✅ Backend is online on port 5000.');
    }
  } catch (err) {
    console.log('🚀 Spawning Backend server on port 5000...');
    backendProcess = spawn('node', ['dist/src/index.js'], {
      cwd: path.join(__dirname, '../Backend'),
      env: { ...process.env, PORT: '5000' },
      stdio: 'inherit'
    });
    const ready = await waitForServer('http://localhost:5000/health', 30000);
    if (!ready) throw new Error('Failed to start Backend server on port 5000');
    console.log('✅ Backend server is online and healthy.');
  }

  try {
    const res = await axios.get('http://localhost:3000', { timeout: 3000 });
    if (res.status < 500) {
      console.log('✅ Frontend is online on port 3000.');
    }
  } catch (err) {
    console.log('🚀 Spawning Frontend Next.js production server on port 3000...');
    frontendProcess = spawn('npx', ['next', 'start', '-p', '3000'], {
      cwd: path.join(__dirname),
      env: { ...process.env, PORT: '3000' },
      stdio: 'inherit'
    });
    const ready = await waitForServer('http://localhost:3000', 30000);
    if (!ready) throw new Error('Failed to start Frontend server on port 3000');
    console.log('✅ Frontend server is online.');
  }
}

async function captureAllScreenshots() {
  console.log('🚀 Starting Comprehensive Screenshots Capture using Playwright & Chromium...');
  console.log(`📁 Target directory: ${SCREENSHOTS_DIR}\n`);

  await ensureServersRunning();

  // Clean old screenshots before generating the complete unified set
  const existingFiles = fs.readdirSync(SCREENSHOTS_DIR);
  for (const f of existingFiles) {
    if (f.endsWith('.png')) {
      try {
        fs.unlinkSync(path.join(SCREENSHOTS_DIR, f));
      } catch (e) {}
    }
  }
  console.log('🧹 Cleaned existing screenshots in directory.\n');

  // 1. Retrieve persistent Super Admin and Tenant records from PostgreSQL
  const superAdminUser = await prisma.user.findFirst({
    where: { email: 'admin@xonit.space' },
    include: {
      userRoles: { include: { role: true } },
      branch: true,
    }
  });

  if (!superAdminUser) {
    throw new Error('Required Super Admin user (admin@xonit.space) not found in database');
  }

  // Find tenant with journal entries and active data
  const tenant = await prisma.tenant.findFirst({
    where: { slug: { contains: 'artisan-grocers' } },
    orderBy: { createdAt: 'desc' }
  }) || await prisma.tenant.findFirst({ orderBy: { createdAt: 'desc' } });

  if (!tenant) throw new Error('No tenant found in database');

  const branch = await prisma.branch.findFirst({
    where: { tenantId: tenant.id }
  }) || await prisma.branch.findFirst();

  console.log(`👤 Platform Super Admin: ${superAdminUser.name} (${superAdminUser.email})`);
  console.log(`🏢 Selected Tenant: ${tenant.name} (${tenant.id})`);
  console.log(`📍 Selected Branch: ${branch?.name} (${branch?.id})\n`);

  // 2. Auth Tokens & Cookie Payload
  const csrfToken = 'test-csrf-token-1234567890abcdef1234567890abcdef';
  
  // Platform superadmin token (tenantId: null) for /superadmin
  const superAdminToken = jwt.generateAccessToken({
    userId: superAdminUser.id,
    email: superAdminUser.email,
    roles: ['SUPER_PLATFORM_ADMIN', 'SUPER_ADMIN', 'Super Admin', 'ADMIN'],
    permissions: ['*'],
    tenantId: null,
    branchId: null
  });

  // Tenant-scoped admin token for /admin/*, /branch-admin, and /pos
  const tenantAdminToken = jwt.generateAccessToken({
    userId: superAdminUser.id,
    email: superAdminUser.email,
    roles: ['SUPER_PLATFORM_ADMIN', 'SUPER_ADMIN', 'Super Admin', 'ADMIN', 'TENANT_ADMIN'],
    permissions: ['*'],
    tenantId: tenant.id,
    branchId: branch?.id
  });

  const tenantUserProfile = {
    id: superAdminUser.id,
    email: superAdminUser.email,
    name: superAdminUser.name,
    status: superAdminUser.status,
    tenantId: tenant.id,
    tenant: {
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      businessType: tenant.businessType,
      subscriptionTier: tenant.subscriptionTier || 'ENTERPRISE'
    },
    branchId: branch?.id,
    branch: branch ? { id: branch.id, name: branch.name, code: branch.code } : null,
    roles: ['Super Admin', 'SUPER_ADMIN', 'ADMIN'],
    permissions: ['*'],
    createdAt: superAdminUser.createdAt.toISOString()
  };

  // 3. Launch Playwright Chromium
  console.log('🌐 Launching Chromium browser with Playwright...');
  const browser = await chromium.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 960 },
    deviceScaleFactor: 2
  });

  // Inject initial superadmin authentication cookies
  await context.addCookies([
    { name: 'laural_access_token', value: superAdminToken, domain: 'localhost', path: '/' },
    { name: 'laural_role', value: 'Super Admin', domain: 'localhost', path: '/' },
    { name: 'laural_csrf', value: csrfToken, domain: 'localhost', path: '/' },
    { name: 'laural_tenant_id', value: tenant.id, domain: 'localhost', path: '/' },
    { name: 'laural_tenant_slug', value: tenant.slug, domain: 'localhost', path: '/' },
    { name: 'x_tenant_id', value: tenant.id, domain: 'localhost', path: '/' },
    { name: 'x_tenant_slug', value: tenant.slug, domain: 'localhost', path: '/' }
  ]);

  const page = await context.newPage();
  const capturedList = [];

  async function takeScreenshot(fileName, description) {
    const filePath = path.join(SCREENSHOTS_DIR, fileName);
    await page.screenshot({ path: filePath, fullPage: false });
    console.log(`📸 [${capturedList.length + 1}] Saved: ${fileName} - ${description}`);
    capturedList.push({ fileName, description, filePath });
    await sleep(400);
  }

  // Helper to safely navigate with domcontentloaded + timeout fallback
  async function safeGoto(url, waitMs = 2000) {
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    } catch (e) {
      console.log(`   ⚠️ goto notice for ${url}: ${e.message}`);
    }
    await sleep(waitMs);
  }

  // Switch to tenant-scoped authentication context
  async function applyTenantContext() {
    await context.addCookies([
      { name: 'laural_access_token', value: tenantAdminToken, domain: 'localhost', path: '/' },
      { name: 'laural_role', value: 'Super Admin', domain: 'localhost', path: '/' },
      { name: 'laural_csrf', value: csrfToken, domain: 'localhost', path: '/' },
      { name: 'laural_tenant_id', value: tenant.id, domain: 'localhost', path: '/' },
      { name: 'laural_tenant_slug', value: tenant.slug, domain: 'localhost', path: '/' },
      { name: 'x_tenant_id', value: tenant.id, domain: 'localhost', path: '/' },
      { name: 'x_tenant_slug', value: tenant.slug, domain: 'localhost', path: '/' }
    ]);

    await page.evaluate(({ tId, tSlug, bId, uProfile }) => {
      try {
        localStorage.setItem('laural_tenant_id', tId);
        localStorage.setItem('active_tenant_id', tId);
        localStorage.setItem('laural_tenant_slug', tSlug);
        localStorage.setItem('active_tenant_slug', tSlug);
        if (bId) {
          localStorage.setItem('laural_branch_id', bId);
          localStorage.setItem('active_branch_id', bId);
        }
        localStorage.setItem('laural_user', JSON.stringify(uProfile));
      } catch (e) {}
    }, {
      tId: tenant.id,
      tSlug: tenant.slug,
      bId: branch?.id,
      uProfile: tenantUserProfile
    });
  }

  try {
    // ==========================================
    // 1. SUPER ADMIN: Overview Dashboard
    // ==========================================
    console.log('\n--- 1. Super Admin Overview ---');
    await safeGoto(`${WEB_BASE}/superadmin`, 2500);
    try {
      await page.waitForSelector('text=Monthly Recurring Revenue', { timeout: 8000 });
    } catch (e) {}
    await sleep(1500);
    await takeScreenshot('01-superadmin-dashboard-overview.png', 'Super Admin Overview with live Active Tenants, MRR, GMV, and monthly revenue analytics');

    // ==========================================
    // 2. SUPER ADMIN: Tenants Management Tab
    // ==========================================
    console.log('\n--- 2. Super Admin Tenants Tab ---');
    const tenantsTabBtn = page.locator('button:has-text("Dashboard 2 (Tenants)"), button:has-text("Tenants")').first();
    if (await tenantsTabBtn.isVisible()) {
      await tenantsTabBtn.click();
      await sleep(1500);
    }
    await takeScreenshot('02-superadmin-tenants-management.png', 'Super Admin Tenants Management list with tiers, statuses, branch/user quotas, and Admins button');

    // ==========================================
    // 3. SUPER ADMIN: Tenant Admins Modal
    // ==========================================
    console.log('\n--- 3. Tenant Super Admins Modal ---');
    const adminsBtn = page.locator('button:has-text("Admins")').first();
    if (await adminsBtn.isVisible()) {
      await adminsBtn.click();
      await sleep(1500);
      await takeScreenshot('03-superadmin-tenant-admins-modal.png', 'Tenant Super Admins Modal with Accounts, statuses, and password reset');

      // 4. SUPER ADMIN: Add Admin Form inside Modal
      console.log('\n--- 4. Add Tenant Admin Form ---');
      const addAdminBtn = page.locator('button:has-text("Add Super Admin")');
      if (await addAdminBtn.isVisible()) {
        await addAdminBtn.click();
        await sleep(1000);
        await takeScreenshot('04-superadmin-add-tenant-admin-form.png', 'Add Super Admin Form inside Modal with credentials and role assignment');
      }

      // Close modal
      const closeBtn = page.locator('button:has-text("Close"), button:has-text("✕")').first();
      if (await closeBtn.isVisible()) {
        await closeBtn.click();
        await sleep(600);
      } else {
        await page.keyboard.press('Escape');
        await sleep(600);
      }
    }

    // ==========================================
    // 5. SUPER ADMIN: Cluster Telemetry
    // ==========================================
    console.log('\n--- 5. Super Admin Cluster Telemetry ---');
    const telemetryTabBtn = page.locator('button:has-text("Cluster Telemetry")').first();
    if (await telemetryTabBtn.isVisible()) {
      await telemetryTabBtn.click();
      await sleep(1800);
      await takeScreenshot('05-superadmin-cluster-telemetry.png', 'Super Admin Infrastructure Telemetry (Postgres, Redis cluster, CPU, memory, connection pools)');
    }

    // ==========================================
    // SWITCH TO TENANT SCOPED CONTEXT
    // ==========================================
    await applyTenantContext();

    // ==========================================
    // 6. STORE OPERATIONS: Branch Admin Dashboard
    // ==========================================
    console.log('\n--- 6. Branch Store Operations Dashboard ---');
    await safeGoto(`${WEB_BASE}/branch-admin`, 2000);
    await applyTenantContext();
    try {
      await page.waitForSelector('text=BRANCH STORE OPERATIONS', { timeout: 8000 });
      await page.waitForFunction(() => !document.body.innerText.includes('animate-pulse'), { timeout: 8000 });
    } catch (e) {}
    await sleep(2000);
    await takeScreenshot('06-branch-store-operations-dashboard.png', 'Branch Store Operations Dashboard (/branch-admin) showing store KPIs, terminal trigger, and stock requests');

    // ==========================================
    // 7. POS: Register & Product Catalog
    // ==========================================
    console.log('\n--- 7. POS Terminal Register ---');
    await safeGoto(`${WEB_BASE}/pos`, 2500);
    await applyTenantContext();

    // If shift is closed, open shift
    const openShiftNowBtn = page.locator('button:has-text("Open Shift Now")');
    if (await openShiftNowBtn.isVisible()) {
      await openShiftNowBtn.click();
      await sleep(1000);
      const openRegisterBtn = page.locator('button:has-text("Open Register Shift")');
      if (await openRegisterBtn.isVisible()) {
        await openRegisterBtn.click();
        await sleep(2000);
      }
    }
    await sleep(1500);
    await takeScreenshot('07-pos-terminal-register.png', 'POS Terminal Register with Products, Categories, and Cart Summary');

    // ==========================================
    // 8. POS: Variant Selection Modal
    // ==========================================
    console.log('\n--- 8. POS Variant Selection Modal ---');
    const firstProduct = page.locator('button[class*="group relative flex flex-col"], div[class*="group relative flex flex-col"], button[class*="bg-surface border border-border rounded-xl"]').first();
    if (await firstProduct.isVisible()) {
      await firstProduct.click();
      await sleep(1200);
      await takeScreenshot('08-pos-variant-selection-modal.png', 'POS Variant Selection Modal with size, color, quantity options');

      // Add to Order to populate cart
      const addToOrderBtn = page.locator('button:has-text("Add to Order")').first();
      if (await addToOrderBtn.isVisible() && !await addToOrderBtn.isDisabled()) {
        await addToOrderBtn.click();
        await sleep(1000);
      }
    }

    // ==========================================
    // 9. POS: Cart with Items
    // ==========================================
    console.log('\n--- 9. POS Cart with Items ---');
    await takeScreenshot('09-pos-cart-with-items.png', 'POS Cart populated with products, quantity modifiers, tax, and discount button');

    // ==========================================
    // 10. POS: Apply Order Discount Modal
    // ==========================================
    console.log('\n--- 10. POS Apply Order Discount Modal ---');
    const addDiscountBtn = page.locator('button:has-text("+ Add"), button:has-text("+ Add Discount")').first();
    if (await addDiscountBtn.isVisible()) {
      await addDiscountBtn.click();
      await sleep(1000);
      await takeScreenshot('10-pos-apply-discount-modal.png', 'POS Apply Discount Modal with Fixed Rs. and Percentage % options');

      // 11. POS: Manager PIN Dialog (>10% discount)
      console.log('\n--- 11. POS Manager PIN Required Dialog ---');
      const percentTab = page.locator('button:has-text("Percentage (%)")').first();
      if (await percentTab.isVisible()) {
        await percentTab.click();
        await sleep(400);
      }

      const preset20 = page.locator('[data-testid="discount-preset-20"], button:has-text("20%")').first();
      if (await preset20.isVisible()) {
        await preset20.click();
        await sleep(500);
      }

      const applyBtn = page.locator('[data-testid="apply-discount-btn"], button:has-text("Apply Discount")').first();
      if (await applyBtn.isVisible()) {
        await applyBtn.click();
        await sleep(1000);
        await takeScreenshot('11-pos-manager-pin-dialog.png', 'POS Manager PIN Security Dialog for >10% discount approval');

        // Authorize with PIN 1234
        const pinInput = page.locator('[data-testid="manager-pin-input"], input[type="password"]');
        if (await pinInput.isVisible()) {
          await pinInput.fill('1234');
          await sleep(400);
          const authBtn = page.locator('[data-testid="manager-pin-authorize-btn"], button:has-text("Authorize")').first();
          if (await authBtn.isVisible()) {
            await authBtn.click();
            await sleep(1200);
          }
        }
      }
    }

    // Dismiss open modal
    await page.keyboard.press('Escape');
    await sleep(500);

    // ==========================================
    // 12. POS: Payment Checkout Modal
    // ==========================================
    console.log('\n--- 12. POS Payment Checkout Modal ---');
    const chargeBtn = page.locator('button:has-text("Charge")').first();
    if (await chargeBtn.isVisible() && !await chargeBtn.isDisabled()) {
      await chargeBtn.click();
      await sleep(1500);
      await takeScreenshot('12-pos-payment-checkout-modal.png', 'POS Payment Checkout Modal with Cash, Card, and Change calculator');

      const closePaymentBtn = page.locator('button:has-text("Cancel")').first();
      if (await closePaymentBtn.isVisible()) {
        await closePaymentBtn.click();
      } else {
        await page.keyboard.press('Escape');
      }
      await sleep(800);
    }

    // ==========================================
    // 13. POS: Held Orders Modal
    // ==========================================
    console.log('\n--- 13. POS Held Orders Modal ---');
    const holdCartBtn = page.locator('button:has-text("Hold Cart")').first();
    if (await holdCartBtn.isVisible() && !await holdCartBtn.isDisabled()) {
      await holdCartBtn.click();
      await sleep(1200);
    }

    const heldOrdersBtn = page.locator('button:has-text("Held Orders")').first();
    if (await heldOrdersBtn.isVisible()) {
      await heldOrdersBtn.click();
      await sleep(1200);
      await takeScreenshot('13-pos-held-orders-modal.png', 'POS Held Orders Parked Carts Modal with Recall Cart action');

      const closeHeldBtn = page.locator('[data-testid="close-held-carts"]').first();
      if (await closeHeldBtn.isVisible()) {
        await closeHeldBtn.click();
      } else {
        await page.keyboard.press('Escape');
      }
      await sleep(800);
    }

    // ==========================================
    // 14. POS: Hardware / Thermal Printer Settings Modal
    // ==========================================
    console.log('\n--- 14. POS Hardware Settings Modal ---');
    const hardwareBtn = page.locator('button:has-text("Hardware")').first();
    if (await hardwareBtn.isVisible()) {
      await hardwareBtn.click();
      await sleep(1200);
      await takeScreenshot('14-pos-hardware-printer-modal.png', 'POS Hardware & Thermal Printer Settings (node-print Bridge & Cash Drawer)');
      await page.keyboard.press('Escape');
      await sleep(800);
    }

    // ==========================================
    // 15. POS: Secondary Customer-Facing Display
    // ==========================================
    console.log('\n--- 15. POS Customer Facing Display ---');
    await safeGoto(`${WEB_BASE}/customer-display`, 2000);
    await takeScreenshot('15-pos-customer-facing-display.png', 'Secondary Customer-Facing Monitor Display (/customer-display) showing cart summary and LankaQR scan code');

    // ==========================================
    // 16. POS: Mobile Responsive Topbar (375x667)
    // ==========================================
    console.log('\n--- 16. POS Mobile Responsive View ---');
    await safeGoto(`${WEB_BASE}/pos`, 2000);
    await page.setViewportSize({ width: 375, height: 667 });
    await sleep(2000);
    await takeScreenshot('16-pos-mobile-responsive-view.png', 'POS Mobile Responsive Layout at 375px with zero horizontal overflow');
    // Restore desktop viewport
    await page.setViewportSize({ width: 1440, height: 960 });
    await sleep(1000);

    // ==========================================
    // 17. ADMIN ERP: General Ledger - Journal Entries
    // ==========================================
    console.log('\n--- 17. ERP General Ledger - Journal Entries ---');
    await safeGoto(`${WEB_BASE}/admin/erp/general-ledger`, 2000);
    await applyTenantContext();
    await sleep(2000);
    await takeScreenshot('17-admin-general-ledger-journal-entries.png', 'ERP Double-Entry General Ledger Journals with debits and balanced credits');

    // ==========================================
    // 18. ADMIN ERP: General Ledger - Trial Balance
    // ==========================================
    console.log('\n--- 18. ERP Trial Balance Tab ---');
    const tbTabBtn = page.locator('button:has-text("Trial Balance")').first();
    if (await tbTabBtn.isVisible()) {
      await tbTabBtn.click();
      await sleep(1800);
      await takeScreenshot('18-admin-general-ledger-trial-balance.png', 'ERP Trial Balance verification showing balanced accounts parity');
    }

    // ==========================================
    // 19. ADMIN ERP: General Ledger - Balance Sheet
    // ==========================================
    console.log('\n--- 19. ERP Balance Sheet Tab ---');
    const bsTabBtn = page.locator('button:has-text("Balance Sheet")').first();
    if (await bsTabBtn.isVisible()) {
      await bsTabBtn.click();
      await sleep(1800);
      await takeScreenshot('19-admin-general-ledger-balance-sheet.png', 'ERP Formal Balance Sheet statement (Assets, Liabilities, and Owners Equity parity)');
    }

    // ==========================================
    // 20. ADMIN ERP: General Ledger - Chart of Accounts
    // ==========================================
    console.log('\n--- 20. ERP Chart of Accounts Tab ---');
    const coaTabBtn = page.locator('button:has-text("Chart of Accounts")').first();
    if (await coaTabBtn.isVisible()) {
      await coaTabBtn.click();
      await sleep(1800);
      await takeScreenshot('20-admin-general-ledger-chart-of-accounts.png', 'ERP Chart of Accounts hierarchy categorized into 5 canonical account classes');
    }

    // ==========================================
    // 21. ADMIN ERP: AP Aging Report (Suppliers)
    // ==========================================
    console.log('\n--- 21. ERP Accounts Payable & Aging Report ---');
    await safeGoto(`${WEB_BASE}/admin/erp/aging`, 2000);
    const apBtn = page.locator('button:has-text("AP"), button:has-text("Suppliers")').first();
    if (await apBtn.isVisible()) {
      await apBtn.click();
      await sleep(1500);
    }
    await takeScreenshot('21-admin-accounts-payable-aging-report.png', 'ERP Accounts Payable (AP) Aging Report with 0-30, 31-60, 61-90, 90+ days buckets and vendor bills');

    // ==========================================
    // 22. ADMIN ERP: AR Aging Report (Customers)
    // ==========================================
    console.log('\n--- 22. ERP Accounts Receivable Aging Report ---');
    const arBtn = page.locator('button:has-text("AR"), button:has-text("Customers")').first();
    if (await arBtn.isVisible()) {
      await arBtn.click();
      await sleep(1500);
    }
    await takeScreenshot('22-admin-accounts-receivable-aging-report.png', 'ERP Accounts Receivable (AR) Aging Report showing outstanding customer credit and overdue aging schedules');

    // ==========================================
    // 23. ADMIN ERP: Stocktaking & Cycle Counting Register
    // ==========================================
    console.log('\n--- 23. ERP Stocktaking Register ---');
    await safeGoto(`${WEB_BASE}/admin/erp/stocktaking`, 2500);
    await takeScreenshot('23-admin-stocktaking-cycle-counting.png', 'ERP Stocktaking & Cycle Counting Sessions Register');

    // ==========================================
    // 24. ADMIN ERP: Stocktaking Active Count & Reconciliation Workspace
    // ==========================================
    console.log('\n--- 24. ERP Stocktaking Count & Reconciliation Workspace ---');
    const viewAuditBtn = page.locator('button:has-text("View Audit"), button:has-text("Open Count Workspace")').first();
    if (await viewAuditBtn.isVisible()) {
      await viewAuditBtn.click();
      await sleep(2000);
      await takeScreenshot('24-admin-stocktaking-workspace-reconciliation.png', 'ERP Stocktaking Active Workspace showing frozen system counts, physical counts, shrinkage variance, and GL reconciliation');
    }

    // ==========================================
    // 25. ADMIN ERP: Executive P&L Statement
    // ==========================================
    console.log('\n--- 25. ERP Executive P&L Statement ---');
    await safeGoto(`${WEB_BASE}/admin/reports/pnl`, 2500);
    await takeScreenshot('25-admin-executive-pnl-statement.png', 'ERP Executive Profit & Loss Statement showing Gross Revenue, COGS, Gross Profit, and Operating Expenses');

    // ==========================================
    // 26. ADMIN AI: Support Copilot RAG Chat
    // ==========================================
    console.log('\n--- 26. AI Support Copilot Chat ---');
    await safeGoto(`${WEB_BASE}/admin/ai-assistant`, 2500);
    await takeScreenshot('26-admin-ai-assistant-copilot.png', 'XONIT AI Support Copilot with tenant-isolated RAG pipeline, live financial context, and suggested query chips');

    // ==========================================
    // 27. ADMIN AI: Custom Knowledge Base Management
    // ==========================================
    console.log('\n--- 27. AI Knowledge Base Management ---');
    const kbTabBtn = page.locator('button:has-text("Knowledge Base"), button:has-text("Operational Documents")').first();
    if (await kbTabBtn.isVisible()) {
      await kbTabBtn.click();
      await sleep(1800);
      await takeScreenshot('27-admin-ai-assistant-knowledge-base.png', 'AI Copilot Custom Knowledge Base & Document management repository');
    }

    // ==========================================
    // 28. ADMIN: Executive Dashboard
    // ==========================================
    console.log('\n--- 28. Admin Executive Dashboard ---');
    await safeGoto(`${WEB_BASE}/admin`, 2500);
    await takeScreenshot('28-admin-executive-dashboard.png', 'Tenant Executive Dashboard overview showing revenue, quick stats, and performance');

    // ==========================================
    // 29. ADMIN PAYMENTS: Financial Ledger & KPIs
    // ==========================================
    console.log('\n--- 29. Admin Payments Ledger & KPIs ---');
    await safeGoto(`${WEB_BASE}/admin/payments`, 2500);
    await takeScreenshot('29-admin-payments-ledger-and-kpis.png', 'Admin Payments Register, method breakdown, and financial KPIs');

    // ==========================================
    // 30. ADMIN INVENTORY: Multi-Branch Stock
    // ==========================================
    console.log('\n--- 30. Admin Inventory Management ---');
    await safeGoto(`${WEB_BASE}/admin/inventory`, 2500);
    await takeScreenshot('30-admin-inventory-dual-branch-stock.png', 'Admin Inventory & Multi-Branch Stock Allocation');

    // ==========================================
    // 31. ADMIN INVENTORY: Barcode Label Printer
    // ==========================================
    console.log('\n--- 31. Admin Barcode Label Printer ---');
    await safeGoto(`${WEB_BASE}/admin/inventory/barcode-printer`, 2500);
    await takeScreenshot('31-admin-inventory-barcode-printer.png', 'Admin Barcode Label Generator & Thermal Shelf Tag Stencil (/admin/inventory/barcode-printer)');

    // ==========================================
    // 32. ADMIN ORDERS: Orders Management & Dispatch
    // ==========================================
    console.log('\n--- 32. Admin Orders Management ---');
    await safeGoto(`${WEB_BASE}/admin/orders`, 2500);
    await takeScreenshot('32-admin-orders-management.png', 'Admin Orders Management with fulfillment statuses and quick dispatch trigger');

    // ==========================================
    // 33. ADMIN ORDERS: Quick Dispatch Workflow
    // ==========================================
    console.log('\n--- 33. Admin Orders Quick Dispatch ---');
    await safeGoto(`${WEB_BASE}/admin/orders/quick-dispatch`, 2500);
    await takeScreenshot('33-admin-orders-quick-dispatch.png', 'Admin Quick Dispatch Fulfillment Workspace (/admin/orders/quick-dispatch) with courier logistics and tracking');

    // ==========================================
    // 34. ADMIN BRANCHES: Multi-Branch Outlets
    // ==========================================
    console.log('\n--- 34. Admin Branches Management ---');
    await safeGoto(`${WEB_BASE}/admin/branches`, 2500);
    await takeScreenshot('34-admin-branches-management.png', 'Admin Multi-Branch Outlets Management and Configuration');

    // ==========================================
    // 35. ADMIN CUSTOMERS: Customer Accounts & Credit
    // ==========================================
    console.log('\n--- 35. Admin Customers & Credit Accounts ---');
    await safeGoto(`${WEB_BASE}/admin/customers`, 2500);
    await takeScreenshot('35-admin-customers-credit-management.png', 'Admin Customers & Accounts Management (/admin/customers) with customer credit ledgers');

    // ==========================================
    // 36. ADMIN RETURNS: RMA & Refunds Ledger
    // ==========================================
    console.log('\n--- 36. Admin Returns & RMA Management ---');
    await safeGoto(`${WEB_BASE}/admin/returns`, 2500);
    await takeScreenshot('36-admin-returns-rma-management.png', 'Admin Returns, Exchanges & RMA Ledger (/admin/returns) with refund authorizations');

    // ==========================================
    // 37. ADMIN LOYALTY: Rewards & Tiers
    // ==========================================
    console.log('\n--- 37. Admin Loyalty Rewards & Tiers ---');
    await safeGoto(`${WEB_BASE}/admin/loyalty`, 2500);
    await takeScreenshot('37-admin-loyalty-rewards-tiers.png', 'Admin Loyalty Rewards & Membership Points Program (/admin/loyalty)');

    // ==========================================
    // 38. ADMIN USERS: Staff & Cashiers Management
    // ==========================================
    console.log('\n--- 38. Admin Staff & Cashiers Management ---');
    await safeGoto(`${WEB_BASE}/admin/system/users`, 2500);
    await takeScreenshot('38-admin-staff-cashiers-management.png', 'Admin Staff & Cashiers RBAC Management (/admin/system/users) with roles and POS PINs');

    // ==========================================
    // 39. ADMIN SYSTEM: Unified Audit Trail
    // ==========================================
    console.log('\n--- 39. Admin Unified Audit Trail ---');
    await safeGoto(`${WEB_BASE}/admin/system/audit`, 2500);
    await takeScreenshot('39-admin-unified-audit-trail.png', 'Admin Unified System Audit Trail with user attribution and entity logs');

    // ==========================================
    // 40. ADMIN SETTINGS: Developer API & Headless
    // ==========================================
    console.log('\n--- 40. Admin Settings Developer API ---');
    await safeGoto(`${WEB_BASE}/admin/settings/developer-api`, 2000);
    await takeScreenshot('40-admin-developer-api-settings.png', 'Developer API Keys & Headless Integration Docs');

    // ==========================================
    // 41. ADMIN SETTINGS: Integrations & Gateways
    // ==========================================
    console.log('\n--- 41. Admin Settings Integrations ---');
    await safeGoto(`${WEB_BASE}/admin/settings/integrations`, 2000);
    await takeScreenshot('41-admin-integrations-gateways.png', 'Payment & Logistics Gateways Integrations Hub');

  } catch (err) {
    console.error('❌ Error during screenshot capture:', err);
  } finally {
    await browser.close();
    if (backendProcess) backendProcess.kill();
    if (frontendProcess) frontendProcess.kill();
  }

  console.log(`\n🎉 Successfully captured ${capturedList.length} high-resolution screenshots!`);
  console.log(`📂 Saved to: ${SCREENSHOTS_DIR}`);
  return capturedList;
}

captureAllScreenshots()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    if (backendProcess) backendProcess.kill();
    if (frontendProcess) frontendProcess.kill();
    process.exit(1);
  });
