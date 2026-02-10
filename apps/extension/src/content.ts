// Content script for LinkedIn Outreach Pro
export {};

console.log('🔌 LinkedIn Outreach Pro: Content script loaded on', window.location.hostname);

// ============================================================
// GLOBALS
// ============================================================

let overlayContainer: HTMLDivElement | null = null;
let statusPanel: HTMLDivElement | null = null;
let isAutomationActive = false;

// ============================================================
// UTILITIES
// ============================================================

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function deepQuerySelector(selector: string, root: Document | Element = document): Element | null {
  const result = root.querySelector(selector);
  if (result) return result;
  
  const allElements = root.querySelectorAll('*');
  for (const el of Array.from(allElements)) {
    if (el.shadowRoot) {
      const shadowResult = deepQuerySelector(selector, el.shadowRoot as unknown as Element);
      if (shadowResult) return shadowResult;
    }
  }
  return null;
}

function deepQuerySelectorAll(selector: string, root: Document | Element = document): Element[] {
  const results: Element[] = [];
  results.push(...Array.from(root.querySelectorAll(selector)));
  
  const allElements = root.querySelectorAll('*');
  for (const el of Array.from(allElements)) {
    if (el.shadowRoot) {
      results.push(...deepQuerySelectorAll(selector, el.shadowRoot as unknown as Element));
    }
  }
  return results;
}

function simulateClick(element: HTMLElement): void {
  element.focus();
  element.click();
  element.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, view: window }));
  element.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true, view: window }));
  element.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
}

async function typeInTextarea(textarea: HTMLTextAreaElement, text: string): Promise<void> {
  textarea.focus();
  textarea.value = '';
  textarea.dispatchEvent(new Event('focus', { bubbles: true }));
  
  for (const char of text) {
    textarea.value += char;
    textarea.dispatchEvent(new InputEvent('input', { bubbles: true, data: char, inputType: 'insertText' }));
    await sleep(30 + Math.random() * 40);
  }
  
  textarea.dispatchEvent(new Event('change', { bubbles: true }));
}

// ============================================================
// UI FUNCTIONS
// ============================================================

function createAgenticUI(): void {
  if (overlayContainer) return;

  const style = document.createElement('style');
  style.id = 'outreach-pro-agentic-styles';
  style.textContent = `
    @keyframes outreach-border-pulse { 0%, 100% { box-shadow: inset 0 0 0 4px rgba(59, 130, 246, 0.8); } 50% { box-shadow: inset 0 0 0 4px rgba(96, 165, 250, 1); } }
    @keyframes outreach-element-pulse { 0%, 100% { box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.8); } 50% { box-shadow: 0 0 0 5px rgba(96, 165, 250, 1); } }
    #outreach-pro-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; pointer-events: none; z-index: 2147483646; animation: outreach-border-pulse 1.5s infinite; }
    #outreach-pro-status { position: fixed; top: 16px; left: 50%; transform: translateX(-50%); z-index: 2147483647; background: linear-gradient(135deg, #1e293b, #0f172a); border: 2px solid #3b82f6; border-radius: 12px; padding: 12px 20px; display: flex; align-items: center; gap: 12px; box-shadow: 0 10px 40px rgba(0,0,0,0.4); font-family: system-ui, sans-serif; }
    #outreach-pro-status .icon { width: 32px; height: 32px; background: #3b82f6; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 18px; }
    #outreach-pro-status .title { color: #f1f5f9; font-size: 14px; font-weight: 600; }
    #outreach-pro-status .message { color: #94a3b8; font-size: 12px; }
    .outreach-highlight { outline: 3px solid #3b82f6 !important; outline-offset: 2px !important; animation: outreach-element-pulse 0.8s infinite !important; }
  `;
  document.head.appendChild(style);

  overlayContainer = document.createElement('div');
  overlayContainer.id = 'outreach-pro-overlay';
  document.body.appendChild(overlayContainer);

  statusPanel = document.createElement('div');
  statusPanel.id = 'outreach-pro-status';
  statusPanel.innerHTML = '<div class="icon">🤖</div><div><div class="title">AI Automation Active</div><div class="message">Initializing...</div></div>';
  document.body.appendChild(statusPanel);
  isAutomationActive = true;
}

function updateStatus(message: string, icon?: string): void {
  if (!statusPanel) return;
  const msgEl = statusPanel.querySelector('.message');
  const iconEl = statusPanel.querySelector('.icon');
  if (msgEl) msgEl.textContent = message;
  if (iconEl && icon) iconEl.textContent = icon;
}

function removeAgenticUI(): void {
  overlayContainer?.remove();
  statusPanel?.remove();
  overlayContainer = null;
  statusPanel = null;
  isAutomationActive = false;
  document.querySelectorAll('.outreach-highlight').forEach(el => el.classList.remove('outreach-highlight'));
}

function highlightElement(element: HTMLElement, _label: string): () => void {
  element.classList.add('outreach-highlight');
  element.scrollIntoView({ behavior: 'smooth', block: 'center' });
  return () => element.classList.remove('outreach-highlight');
}

// ============================================================
// LOGGING
// ============================================================

function log(message: string, type: 'info' | 'success' | 'error' | 'action' = 'info'): void {
  console.log(`[${type.toUpperCase()}] ${message}`);
  chrome.runtime.sendMessage({ type: 'LOG', message, logType: type });
  if (isAutomationActive) {
    const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'action' ? '👆' : '🤖';
    updateStatus(message, icon);
  }
}

// ============================================================
// DASHBOARD BRIDGE (localhost only)
// ============================================================

if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
  console.log('✅ Dashboard bridge active');
  window.postMessage({ type: 'EXTENSION_CONNECTED', version: '1.0.0' }, '*');
  
  const indicator = document.createElement('div');
  indicator.id = 'outreach-pro-indicator';
  indicator.innerHTML = `
    <style>
      #outreach-pro-indicator { position: fixed; bottom: 20px; right: 20px; background: linear-gradient(135deg, #0077b5, #005885); color: white; padding: 8px 14px; border-radius: 20px; font: 500 12px system-ui; z-index: 99999; display: flex; align-items: center; gap: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.2); cursor: pointer; }
      #outreach-pro-indicator .dot { width: 8px; height: 8px; background: #4ade80; border-radius: 50%; }
    </style>
    <span class="dot"></span>
    <span class="text">Extension Connected</span>
  `;
  document.body.appendChild(indicator);
  
  const triggerCheck = () => {
    chrome.runtime.sendMessage({ type: 'CHECK_NOW' });
    indicator.querySelector('.text')!.textContent = 'Checking...';
    setTimeout(() => { indicator.querySelector('.text')!.textContent = 'Extension Connected'; }, 2000);
  };
  
  indicator.addEventListener('click', triggerCheck);
  window.addEventListener('message', (e) => {
    if (e.source === window && e.data.type === 'TRIGGER_EXTENSION_CHECK') {
      triggerCheck();
      window.postMessage({ type: 'EXTENSION_CHECK_TRIGGERED' }, '*');
    }
  });
}

// ============================================================
// LINKEDIN AUTOMATION (linkedin.com only)
// ============================================================

if (window.location.hostname === 'www.linkedin.com') {
  console.log('✅ LinkedIn automation ready');
  
  let isProcessing = false;
  
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.type === 'SEND_CONNECTION') {
      if (isProcessing) {
        sendResponse({ received: false, reason: 'busy' });
        return true;
      }
      
      isProcessing = true;
      log('📨 Starting automation...', 'action');
      createAgenticUI();
      
      (async () => {
        try {
          const result = await sendConnectionRequest(message.task.personalizedNote);
          log(result.success ? '✅ Done!' : `❌ ${result.error}`, result.success ? 'success' : 'error');
          await sleep(2000);
          removeAgenticUI();
          chrome.runtime.sendMessage({ type: 'CONNECTION_RESULT', success: result.success, error: result.error });
        } catch (err) {
          log(`❌ ${(err as Error).message}`, 'error');
          removeAgenticUI();
          chrome.runtime.sendMessage({ type: 'CONNECTION_RESULT', success: false, error: (err as Error).message });
        } finally {
          isProcessing = false;
        }
      })();
      
      sendResponse({ received: true });
    }
    return true;
  });
}

// ============================================================
// PROFILE IDENTIFICATION - STRICT
// ============================================================

function getProfileName(): string | null {
  // 1. Try H1 in Main (Standard)
  const mainSection = document.querySelector('main');
  if (mainSection) {
    const h1 = mainSection.querySelector('h1');
    if (h1?.textContent?.trim()) {
      return h1.textContent.trim();
    }
    
    // 2. Try H2 in Main (Fallback for some profiles)
    const headings = Array.from(mainSection.querySelectorAll('h2'));
    const ignored = new Set([
      'about', 'activity', 'experience', 'education', 'licenses & certifications', 
      'skills', 'interests', 'recommendations', 'honors & awards', 'projects',
      'volunteering', 'languages', 'publications', 'causes', 'highlights',
      'people also viewed', 'people you may know', 'similar profiles', 'featured'
    ]);
    
    for (const h2 of headings) {
      const text = (h2.textContent?.trim() || '').toLowerCase();
      if (!text) continue;
      if (ignored.has(text)) continue;
      
      // If it's a reasonable length and not a known section, assume it's the name
      return h2.textContent!.trim();
    }
  }
  
  // 3. Fallback to Document Title (Very reliable)
  if (document.title) {
    // "Name | LinkedIn" or "Name - Headline | LinkedIn"
    const title = document.title;
    if (title.includes('| LinkedIn')) {
      let name = title.split('| LinkedIn')[0].trim();
      if (name.includes(' - ')) {
        // "Name - Headline" -> "Name"
        name = name.split(' - ')[0].trim();
      }
      if (name) return name;
    }
  }
  
  // 4. Fallback to URL
  const match = window.location.pathname.match(/\/in\/([^\/]+)/);
  return match ? match[1].replace(/-/g, ' ') : null;
}

function getProfileFirstName(fullName: string): string {
  // Remove common prefixes to ensure accurate matching
  const cleanName = fullName.replace(/^(dr|mr|mrs|ms|prof|rev|er)\.?\s+/i, '');
  return cleanName.toLowerCase().split(' ')[0];
}

// ============================================================
// STRICT SIDEBAR DETECTION
// ============================================================

function isInSidebarOrRecommendation(element: HTMLElement): boolean {
  // Check if inside <aside>
  if (element.closest('aside')) {
    return true;
  }
  
  // Walk up to find problematic containers
  let node: HTMLElement | null = element;
  for (let i = 0; i < 10 && node; i++) {
    const className = (node.className || '').toLowerCase();
    const id = (node.id || '').toLowerCase();
    
    // Check for sidebar-related class names
    if (
      className.includes('aside') ||
      className.includes('sidebar') ||
      className.includes('right-rail') ||
      className.includes('pymk') ||  // People You May Know
      className.includes('similar') ||
      className.includes('recommendation') ||
      className.includes('more-profiles') ||
      className.includes('explore-premium')
    ) {
      return true;
    }
    
    // Check for section headings that indicate sidebar content
    const heading = node.querySelector(':scope > h2, :scope > h3, :scope > div > h2, :scope > div > h3');
    if (heading) {
      const headingText = (heading.textContent || '').toLowerCase();
      const sidebarHeadings = [
        'people you may know',
        'people also viewed', 
        'similar profiles',
        'more profiles for you',
        'explore premium',
        'people similar to'
      ];
      if (sidebarHeadings.some(h => headingText.includes(h))) {
        return true;
      }
    }
    
    node = node.parentElement;
  }
  
  return false;
}

function isMainProfileActionButton(button: HTMLElement, profileName: string): boolean {
  // The button must be for the MAIN profile, not sidebar profiles
  
  // 1. Must NOT be in sidebar/recommendation sections
  if (isInSidebarOrRecommendation(button)) {
    return false;
  }
  
  // 2. Check aria-label - must mention the profile owner's name
  const ariaLabel = (button.getAttribute('aria-label') || '').toLowerCase();
  const firstName = getProfileFirstName(profileName);
  const fullNameLower = profileName.toLowerCase();
  
  // If aria-label mentions a name, it MUST be the profile owner's name
  if (ariaLabel.includes('invite') || ariaLabel.includes('connect')) {
    // If it mentions someone's name, check if it's our profile
    const mentionsSomeName = /invite\s+\w+|connect.*\w+/i.test(ariaLabel);
    if (mentionsSomeName) {
      // Must contain the profile owner's first name or full name
      if (!ariaLabel.includes(firstName) && !ariaLabel.includes(fullNameLower)) {
        log(`Skipping button for different person: "${ariaLabel}"`, 'info');
        return false;
      }
    }
  }
  
  // 3. Must be in the profile header area (top part of the page, within main)
  const rect = button.getBoundingClientRect();
  if (rect.top > 600) {
    // Button is too far down the page - likely in sidebar or other sections
    log(`Skipping button too far down page (top: ${rect.top})`, 'info');
    return false;
  }
  
  // 4. Must be inside <main> element
  if (!button.closest('main')) {
    log('Skipping button outside of main element', 'info');
    return false;
  }
  
  return true;
}

// ============================================================
// FIND CONNECT BUTTON - STRICT VERSION
// ============================================================

async function findMainProfileConnectButton(profileName: string): Promise<HTMLElement | null> {
  const firstName = getProfileFirstName(profileName);
  log(`Looking for Connect for "${profileName}" (first name: ${firstName})`, 'info');
  
  // Get all buttons AND links on the page (Connect can be either!)
  const allClickables = Array.from(document.querySelectorAll('button, a'));
  
  // STRATEGY 1: Look for Connect element with profile owner's name in aria-label
  for (const el of allClickables) {
    const ariaLabel = (el.getAttribute('aria-label') || '').toLowerCase();
    
    // Must be a connect/invite element
    if (!ariaLabel.includes('connect') && !ariaLabel.includes('invite')) continue;
    
    // Must mention the profile owner's name
    if (!ariaLabel.includes(firstName)) continue;
    
    // Must NOT be in sidebar
    if (isInSidebarOrRecommendation(el as HTMLElement)) {
      log(`Skipping sidebar Connect: ${ariaLabel}`, 'info');
      continue;
    }
    
    // Verify it's visible and in profile header area
    const rect = el.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0 && rect.top > 0 && rect.top < 600) {
      log(`✅ Found Connect element: "${ariaLabel}"`, 'success');
      return el as HTMLElement;
    }
  }
  
  // STRATEGY 2: Look for element with text "Connect" in main profile area
  for (const el of allClickables) {
    const text = (el.textContent || '').toLowerCase().trim();
    
    if (text !== 'connect') continue;
    
    if (!isMainProfileActionButton(el as HTMLElement, profileName)) continue;
    
    const rect = el.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      log(`✅ Found Connect element in main profile area`, 'success');
      return el as HTMLElement;
    }
  }
  
  // STRATEGY 3: Check "More" dropdown for Connect option
  log('Looking for Connect in More dropdown...', 'info');
  
  // Find the More button in the main profile area
  const moreButton = Array.from(document.querySelectorAll('button')).find(btn => {
    const ariaLabel = (btn.getAttribute('aria-label') || '').toLowerCase();
    const text = (btn.textContent || '').toLowerCase().trim();
    
    const isMore = ariaLabel === 'more' || text === 'more';
    if (!isMore) return false;
    
    // Must be in main profile area
    return isMainProfileActionButton(btn, profileName);
  });
  
  if (moreButton) {
    log('Found More button, clicking to check for Connect...', 'info');
    simulateClick(moreButton);
    await sleep(1000);
    
    // Look for Connect in the dropdown menu
    const menu = document.querySelector('[role="menu"], .artdeco-dropdown__content');
    if (menu) {
      const menuItems = Array.from(menu.querySelectorAll('[role="menuitem"], li, button, a, div[tabindex]'));
      
      for (const item of menuItems) {
        const text = (item.textContent || '').toLowerCase();
        const ariaLabel = (item.getAttribute('aria-label') || '').toLowerCase();
        
        // Must be a connect option
        if (!text.includes('connect') && !ariaLabel.includes('connect') && 
            !text.includes('invite') && !ariaLabel.includes('invite')) continue;
        
        // If it mentions a name, must be the profile owner
        if (ariaLabel.includes('invite') && !ariaLabel.includes(firstName)) {
          log(`Skipping menu item for different person: "${ariaLabel}"`, 'info');
          continue;
        }
        
        log(`✅ Found Connect in More menu: "${item.textContent?.trim()}"`, 'success');
        return item as HTMLElement;
      }
      
      // Close dropdown if Connect not found
      log('Connect not found in More menu, closing...', 'info');
      document.body.click();
      await sleep(300);
    }
  }
  
  return null;
}

// ============================================================
// MODAL HANDLING
// ============================================================

async function findModal(): Promise<Element | null> {
  // Try regular DOM first
  let modal = document.querySelector('div.send-invite[role="dialog"], div.artdeco-modal[role="dialog"]');
  if (modal) return modal;
  
  // Search in shadow roots
  modal = deepQuerySelector('div.send-invite[role="dialog"]');
  if (modal) return modal;
  
  modal = deepQuerySelector('div.artdeco-modal[role="dialog"]');
  if (modal) return modal;
  
  modal = deepQuerySelector('[aria-labelledby="send-invite-modal"]');
  if (modal) return modal;
  
  return null;
}

async function waitForModal(timeout: number = 10000): Promise<Element | null> {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    const modal = await findModal();
    if (modal) return modal;
    await sleep(300);
  }
  return null;
}

function findButtonInElement(container: Element, searchTexts: string[]): HTMLButtonElement | null {
  const buttons = Array.from(container.querySelectorAll('button'));
  
  for (const searchText of searchTexts) {
    const search = searchText.toLowerCase();
    
    for (const btn of buttons) {
      const aria = btn.getAttribute('aria-label')?.toLowerCase().trim();
      if (aria === search) return btn;
    }
    
    for (const btn of buttons) {
      const text = btn.textContent?.replace(/\s+/g, ' ').trim().toLowerCase();
      if (text === search) return btn;
    }
    
    for (const btn of buttons) {
      const aria = btn.getAttribute('aria-label')?.toLowerCase() || '';
      const text = btn.textContent?.toLowerCase() || '';
      if (aria.includes(search) || text.includes(search)) return btn;
    }
  }
  
  return null;
}

// ============================================================
// MAIN CONNECTION LOGIC
// ============================================================

interface ConnectionResult {
  success: boolean;
  error?: string;
}

async function sendConnectionRequest(note: string): Promise<ConnectionResult> {
  log('🔍 Analyzing profile...', 'info');
  await sleep(2000);
  
  // Get profile name from the main H1
  const profileName = getProfileName();
  if (!profileName) {
    return { success: false, error: 'Could not identify profile owner from page' };
  }
  log(`👤 Main profile: "${profileName}"`, 'info');
  
  // Scroll to top to ensure profile header is visible
  window.scrollTo(0, 0);
  await sleep(500);
  
  // Find Connect element - STRICT: only for main profile
  updateStatus(`Finding Connect for ${profileName}...`, '🔍');
  
  let connectBtn: HTMLElement | null = null;
  for (let attempt = 1; attempt <= 5 && !connectBtn; attempt++) {
    connectBtn = await findMainProfileConnectButton(profileName);
    if (!connectBtn) {
      log(`Attempt ${attempt}/5 - Connect not found, waiting...`, 'info');
      await sleep(1500);
    }
  }
  
  if (!connectBtn) {
    // Check why we couldn't find it
    const allConnectBtns = Array.from(document.querySelectorAll('button')).filter(b => 
      /connect|invite/i.test(b.getAttribute('aria-label') || '') ||
      b.textContent?.toLowerCase().trim() === 'connect'
    );
    
    log(`Found ${allConnectBtns.length} total Connect buttons on page:`, 'info');
    allConnectBtns.forEach((b, i) => {
      const inSidebar = isInSidebarOrRecommendation(b);
      log(`  ${i}: "${b.getAttribute('aria-label') || b.textContent?.trim()}" sidebar=${inSidebar}`, 'info');
    });
    
    // Check for pending/connected status
    const mainButtons = document.querySelectorAll('main button');
    for (const btn of Array.from(mainButtons)) {
      const text = btn.textContent?.toLowerCase().trim();
      if (text === 'pending') return { success: false, error: 'Connection already pending' };
    }
    
    // Check for Message button without Connect (already connected)
    const hasMessage = Array.from(mainButtons).some(b => b.textContent?.toLowerCase().trim() === 'message');
    const hasConnect = allConnectBtns.some(b => !isInSidebarOrRecommendation(b));
    if (hasMessage && !hasConnect) {
      return { success: false, error: 'Already connected (no Connect button available)' };
    }
    
    return { success: false, error: 'Connect button not found for main profile' };
  }
  
  log('✅ Found Connect button for main profile', 'success');
  updateStatus('Clicking Connect...', '👆');
  let cleanup = highlightElement(connectBtn, 'Connect');
  await sleep(1000);
  simulateClick(connectBtn);
  cleanup();
  log('👆 Clicked Connect', 'action');
  
  // Wait for modal
  await sleep(2000);
  updateStatus('Waiting for dialog...', '⏳');
  
  const modal = await waitForModal(10000);
  if (!modal) {
    const allDialogs = deepQuerySelectorAll('[role="dialog"]');
    log(`Modal not found. Found ${allDialogs.length} dialogs on page.`, 'error');
    return { success: false, error: 'Connection dialog did not appear' };
  }
  
  log('✅ Dialog opened', 'success');
  await sleep(1500);
  
  // Debug: log modal buttons
  const modalButtons = Array.from(modal.querySelectorAll('button'));
  log(`Found ${modalButtons.length} buttons in modal`, 'info');
  modalButtons.forEach((b, i) => {
    log(`  ${i}: aria="${b.getAttribute('aria-label') || ''}" text="${b.textContent?.trim()}"`, 'info');
  });
  
  // Find "Add a note" button
  updateStatus('Looking for Add a note...', '🔍');
  const addNoteBtn = findButtonInElement(modal, ['add a note']);
  
  if (!addNoteBtn) {
    log('Add a note not found, trying Send without note...', 'info');
    const sendBtn = findButtonInElement(modal, ['send without a note', 'send invitation', 'send']);
    
    if (sendBtn) {
      updateStatus('Sending without note...', '📤');
      cleanup = highlightElement(sendBtn, 'Send');
      await sleep(1000);
      simulateClick(sendBtn);
      cleanup();
      log('📤 Sent without note', 'action');
      await sleep(2000);
      return { success: true };
    }
    
    return { success: false, error: 'No Add a note or Send button found in modal' };
  }
  
  log('✅ Found Add a note button', 'success');
  updateStatus('Clicking Add a note...', '👆');
  cleanup = highlightElement(addNoteBtn, 'Add a note');
  await sleep(800);
  simulateClick(addNoteBtn);
  cleanup();
  log('👆 Clicked Add a note', 'action');
  
  // Wait for textarea
  await sleep(1500);
  updateStatus('Looking for textarea...', '🔍');
  
  let textarea: HTMLTextAreaElement | null = null;
  for (let i = 0; i < 5 && !textarea; i++) {
    textarea = modal.querySelector('textarea') as HTMLTextAreaElement;
    if (!textarea) textarea = deepQuerySelector('textarea') as HTMLTextAreaElement;
    if (!textarea) await sleep(500);
  }
  
  if (!textarea) {
    return { success: false, error: 'Textarea not found after clicking Add a note' };
  }
  
  log('✅ Found textarea', 'success');
  updateStatus('Typing message...', '⌨️');
  cleanup = highlightElement(textarea, 'Message');
  await typeInTextarea(textarea, note);
  cleanup();
  log(`✅ Typed ${note.length} chars`, 'success');
  
  // Find Send button
  await sleep(800);
  updateStatus('Finding Send button...', '🔍');
  
  const sendBtn = findButtonInElement(modal, ['send invitation', 'send now', 'send']);
  
  if (!sendBtn) {
    const primaryBtn = modal.querySelector('button.artdeco-button--primary') as HTMLButtonElement;
    if (primaryBtn && /send/i.test(primaryBtn.textContent || '')) {
      updateStatus('Sending...', '📤');
      cleanup = highlightElement(primaryBtn, 'Send');
      await sleep(800);
      simulateClick(primaryBtn);
      cleanup();
      log('📤 Clicked Send', 'action');
    } else {
      return { success: false, error: 'Send button not found' };
    }
  } else {
    log('✅ Found Send button', 'success');
    updateStatus('Sending...', '📤');
    cleanup = highlightElement(sendBtn, 'Send');
    await sleep(800);
    simulateClick(sendBtn);
    cleanup();
    log('📤 Clicked Send', 'action');
  }
  
  // Verify success
  await sleep(2500);
  
  const stillOpen = await findModal();
  if (stillOpen?.textContent?.toLowerCase().includes('error')) {
    return { success: false, error: 'LinkedIn showed an error' };
  }
  
  updateStatus('Connection sent!', '✅');
  log('✅ Connection request sent successfully!', 'success');
  return { success: true };
}
