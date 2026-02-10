// Popup script for LinkedIn Outreach Pro
export {};

const API_BASE = 'http://localhost:3001/api';

document.addEventListener('DOMContentLoaded', async () => {
  // Initial load
  await updateStatus();
  await loadLogs();
  
  // Refresh logs every second for live updates
  setInterval(loadLogs, 1000);
  
  // Check Tasks button
  document.getElementById('checkTasksBtn')?.addEventListener('click', async () => {
    const btn = document.getElementById('checkTasksBtn') as HTMLButtonElement;
    btn.textContent = '⏳ Checking...';
    btn.disabled = true;
    
    chrome.runtime.sendMessage({ type: 'CHECK_NOW' });
    
    setTimeout(() => {
      btn.textContent = '▶ Check for Tasks';
      btn.disabled = false;
      updateStatus();
      loadLogs();
    }, 2000);
  });
  
  // Open Dashboard button
  document.getElementById('openDashboardBtn')?.addEventListener('click', () => {
    chrome.tabs.create({ url: 'http://localhost:3000' });
  });
  
  // Clear Logs button
  document.getElementById('clearLogsBtn')?.addEventListener('click', async () => {
    chrome.runtime.sendMessage({ type: 'CLEAR_LOGS' });
    await loadLogs();
  });
});

async function updateStatus() {
  const statusDot = document.getElementById('statusDot');
  const statusText = document.getElementById('statusText');
  const taskCount = document.getElementById('taskCount');
  
  try {
    // Get storage state
    const storage = await chrome.storage.local.get(['pendingTasks', 'currentTask']);
    const pending = storage.pendingTasks?.length || 0;
    const isProcessing = !!storage.currentTask;
    
    // Update task count
    if (taskCount) {
      taskCount.textContent = `${pending} task${pending !== 1 ? 's' : ''} queued`;
    }
    
    // Update status indicator
    if (statusDot && statusText) {
      if (isProcessing) {
        statusDot.className = 'status-dot processing';
        const profileName = storage.currentTask.profileUrl.split('/in/')[1]?.split('/')[0] || 'profile';
        statusText.textContent = `Processing: ${profileName}`;
      } else if (pending > 0) {
        statusDot.className = 'status-dot active';
        statusText.textContent = 'Ready - Tasks waiting';
      } else {
        // Check API for any pending
        const response = await fetch(`${API_BASE}/extension/pending-tasks`);
        const data = await response.json();
        
        if (data.success && data.data?.length > 0) {
          statusDot.className = 'status-dot active';
          statusText.textContent = `${data.data.length} tasks available`;
        } else {
          statusDot.className = 'status-dot';
          statusText.textContent = 'Idle - No pending tasks';
        }
      }
    }
  } catch (error) {
    if (statusDot) statusDot.className = 'status-dot';
    if (statusText) statusText.textContent = 'API not available';
  }
}

async function loadLogs() {
  const container = document.getElementById('logsContainer');
  if (!container) return;
  
  const storage = await chrome.storage.local.get(['logs']);
  const logs = storage.logs || [];
  
  if (logs.length === 0) {
    container.innerHTML = '<div class="empty-logs">No activity yet. Click "Check for Tasks" to start.</div>';
    return;
  }
  
  // Render logs (newest first)
  container.innerHTML = [...logs].reverse().map((log: any) => `
    <div class="log-entry ${log.type}">
      <span class="log-time">${log.timestamp}</span>
      <span class="log-message">${escapeHtml(log.message)}</span>
    </div>
  `).join('');
  
  // Auto-scroll to top (newest)
  container.scrollTop = 0;
}

function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
