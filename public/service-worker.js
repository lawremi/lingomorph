// Enable opening side panel on action click
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });

const getMenuTitle = (language) => `Adapt text to your ${language || 'Target Language'} level`;

chrome.runtime.onInstalled.addListener(async () => {
  console.log('Lingomorph installed');

  // Get current settings to set initial title
  const result = await chrome.storage.local.get('settings');
  const targetLang = result.settings?.targetLanguage;

  chrome.contextMenus.create({
    id: 'lingomorph-adapt',
    title: getMenuTitle(targetLang),
    contexts: ['selection']
  });
});

// Update context menu when settings change
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'local' && changes.settings?.newValue) {
    const newSettings = changes.settings.newValue;
    if (newSettings.targetLanguage) {
      chrome.contextMenus.update('lingomorph-adapt', {
        title: getMenuTitle(newSettings.targetLanguage)
      });
    }
  }
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'lingomorph-adapt' && info.selectionText) {
    // Save selection to storage so side panel can pick it up
    chrome.storage.local.set({ pendingSelection: info.selectionText });

    // Open the side panel
    if (tab?.windowId) {
      chrome.sidePanel.open({ windowId: tab.windowId });
    }
  }
});
