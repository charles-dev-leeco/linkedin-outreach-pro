// Background script for LinkedIn Outreach Pro
export {};
const API_BASE = 'http://localhost:3001/api';

interface Task {
  campaignId: string;
  campaignSheetId: string;
  profileUrl: string;
  personalizedNote: string;
  templateUsed: number;
}

// Logging system
async function log(message: string, type: 'info' | 'success' | 'error' | 'action' = 'info') {
  const timestamp = new Date().toLocaleTimeString();
  const logEntry = { timestamp, message, type };
  
  const storage = await chrome.storage.local.get(['logs']);
  const logs = storage.logs || [];
  logs.push(logEntry);
  
  // Keep only last 50 logs
  if (logs.length > 50) logs.shift();
  
  await chrome.storage.local.set({ logs });
  console.log(`[${type.toUpperCase()}] ${message}`);
}

async function clearLogs() {
  await chrome.storage.local.set({ logs: [] });
}

// Check for pending tasks every 5 minutes
chrome.alarms.create('checkTasks', { periodInMinutes: 5 });

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'checkTasks') {
    await checkAndProcessTasks();
  }
});

async function checkAndProcessTasks() {
  await log('🔍 Checking for pending tasks...', 'info');
  
  try {
    const response = await fetch(`${API_BASE}/extension/pending-tasks`);
    const data = await response.json();

    if (!data.success || !data.data || data.data.length === 0) {
      await log('No pending tasks found', 'info');
      return;
    }

    const tasks: Task[] = data.data;
    await log(`✅ Found ${tasks.length} pending tasks`, 'success');

    // Store all tasks
    await chrome.storage.local.set({ pendingTasks: tasks });

    // Start processing the first task
    await processNextTask();
  } catch (error) {
    await log(`❌ Error checking tasks: ${(error as Error).message}`, 'error');
  }
}

async function processNextTask() {
  const storage = await chrome.storage.local.get(['pendingTasks', 'currentTask']);
  const tasks: Task[] = storage.pendingTasks || [];

  // If already processing a task, wait
  if (storage.currentTask) {
    await log('Already processing a task, waiting...', 'info');
    return;
  }

  if (tasks.length === 0) {
    await log('✅ All tasks completed!', 'success');
    return;
  }

  // Get next task
  const task = tasks.shift()!;
  await chrome.storage.local.set({ pendingTasks: tasks, currentTask: task });

  // Extract name from profile URL for logging
  const profileName = task.profileUrl.split('/in/')[1]?.split('/')[0] || task.profileUrl;
  await log(`🚀 Opening profile: ${profileName}`, 'action');

  // Open the profile URL directly
  const tab = await chrome.tabs.create({ url: task.profileUrl, active: true });
  
  // Store the tab ID so we can track it
  await chrome.storage.local.set({ processingTabId: tab.id });
}

// Track if we've already sent the task to prevent duplicates
let taskSentToTab: number | null = null;

// Listen for tab updates to know when profile page has loaded
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status !== 'complete') return;

  const storage = await chrome.storage.local.get(['processingTabId', 'currentTask']);
  
  if (tabId !== storage.processingTabId || !storage.currentTask) return;
  
  // Prevent duplicate sends
  if (taskSentToTab === tabId) {
    console.log('Task already sent to this tab, ignoring duplicate update');
    return;
  }
  taskSentToTab = tabId;

  // Page loaded, tell content script to send the connection request
  await log('📄 Profile page loaded, starting automation...', 'info');
  
  // Wait a bit for dynamic content to load
  setTimeout(async () => {
    try {
      const response = await chrome.tabs.sendMessage(tabId, {
        type: 'SEND_CONNECTION',
        task: storage.currentTask
      });
      
      if (!response?.received) {
        await log('Content script busy or not ready', 'info');
      }
    } catch (error) {
      await log(`Failed to communicate with page: ${(error as Error).message}`, 'error');
      // Retry after a delay
      setTimeout(async () => {
        try {
          await chrome.tabs.sendMessage(tabId, {
            type: 'SEND_CONNECTION',
            task: storage.currentTask
          });
        } catch (e) {
          await log('Content script not responding, marking task failed', 'error');
          await markTaskComplete(storage.currentTask, false, 'Content script not responding');
          taskSentToTab = null; // Reset for next task
        }
      }, 3000);
    }
  }, 2000);
});

async function markTaskComplete(task: Task, success: boolean, errorMessage?: string) {
  const profileName = task.profileUrl.split('/in/')[1]?.split('/')[0] || 'unknown';
  
  if (success) {
    await log(`✅ Connection sent to ${profileName}!`, 'success');
  } else {
    await log(`❌ Failed for ${profileName}: ${errorMessage}`, 'error');
  }
  
  try {
    await fetch(`${API_BASE}/extension/update-status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        campaignId: task.campaignId,
        campaignSheetId: task.campaignSheetId,
        profileUrl: task.profileUrl,
        status: success ? 'sent' : 'failed',
        errorMessage: errorMessage,
      }),
    });
  } catch (error) {
    await log(`Failed to update status in API: ${(error as Error).message}`, 'error');
  }

  // Clear current task
  await chrome.storage.local.remove(['currentTask', 'processingTabId']);
  taskSentToTab = null; // Reset for next task

  // Check remaining tasks
  const storage = await chrome.storage.local.get(['pendingTasks']);
  const remaining = storage.pendingTasks?.length || 0;
  
  if (remaining > 0) {
    // Wait 2-5 minutes before next task (human-like)
    const delay = Math.floor(Math.random() * 180000) + 120000; // 2-5 min
    const delayMins = Math.round(delay / 60000);
    await log(`⏰ Waiting ${delayMins} min before next task (${remaining} remaining)...`, 'info');
    
    setTimeout(() => {
      processNextTask();
    }, delay);
  } else {
    await log('🎉 All tasks in queue completed!', 'success');
  }
}

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'CONNECTION_RESULT') {
    (async () => {
      const storage = await chrome.storage.local.get(['currentTask']);
      if (storage.currentTask) {
        await markTaskComplete(
          storage.currentTask,
          message.success,
          message.error
        );
      }
      sendResponse({ success: true });
    })();
    return true;
  }

  if (message.type === 'LOG') {
    log(message.message, message.logType || 'info');
    return true;
  }

  if (message.type === 'CHECK_NOW') {
    log('🔔 Manual check triggered from dashboard', 'action');
    checkAndProcessTasks();
    sendResponse({ success: true });
    return true;
  }

  if (message.type === 'CLEAR_LOGS') {
    clearLogs();
    sendResponse({ success: true });
    return true;
  }
});

// Initialize on install
chrome.runtime.onInstalled.addListener(() => {
  log('LinkedIn Outreach Pro extension installed', 'success');
});
