// Background Script - State Management & Communication Hub
// This script preserves state even when popup is closed

let extensionState = {
    isInspecting: false,
    inspectionType: null,
    lastElementData: null,
    lastSpacingData: null,
    contentScriptReady: false,
    activeTabId: null,
    popupWasOpen: false,
    lastActiveTab: 'color' // Default to color tab
};

// Install and startup
chrome.runtime.onInstalled.addListener(() => {
    // Remove debug console.log
    // console.log('Extension installed');
});

// Manage messaging between popup and content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    // Remove debug console.log
    // console.log('Background received message:', message.action, 'from:', sender);

    switch (message.action) {
        case 'getState':
            // Send state when popup opens
            extensionState.popupWasOpen = true;
            sendResponse({
                state: extensionState,
                success: true
            });
            break;

        case 'setState':
            // Update state
            extensionState = { ...extensionState, ...message.data };
            // Remove debug console.log
            // console.log('State updated:', extensionState);
            sendResponse({ success: true });
            break;

        case 'setActiveTab':
            // Store the active tab when user switches tabs
            extensionState.lastActiveTab = message.tab;
            sendResponse({ success: true });
            break;

        case 'startInspecting':
            // Mark that popup was open when inspection started
            extensionState.popupWasOpen = true;
            extensionState.lastActiveTab = message.activeTab || extensionState.lastActiveTab;
            // Send start inspection command to content script
            handleStartInspecting(message, sender, sendResponse);
            break;

        case 'stopInspecting':
            // Send stop inspection command to content script
            handleStopInspecting(message, sender, sendResponse);
            break;

        case 'elementSelected':
            // Element selection received from content script
            extensionState.lastElementData = message.data;
            // Also store spacing data separately
            if (message.data.spacing) {
                extensionState.lastSpacingData = message.data;
            }
            extensionState.isInspecting = false;
            extensionState.inspectionType = null;
            
            // Notify popup (if open)
            broadcastToPopup('elementSelected', message.data);
            
            // Auto-reopen popup if it was open during inspection
            if (extensionState.popupWasOpen) {
                setTimeout(async () => {
                    try {
                        await chrome.action.openPopup();
                        // Remove debug console.log
                        // console.log('Popup auto-reopened after element selection');
                    } catch (error) {
                        // Remove debug console.log
                        // console.log('Could not auto-reopen popup:', error);
                    }
                }, 100); // Small delay to ensure proper timing
            }
            
            sendResponse({ success: true });
            break;

        case 'saveSpacingData':
            // Save spacing data
            extensionState.lastSpacingData = message.data;
            // Remove debug console.log
            // console.log('Spacing data saved:', message.data);
            sendResponse({ success: true });
            break;

        case 'contentScriptReady':
            // Content script is ready
            extensionState.contentScriptReady = true;
            extensionState.activeTabId = sender.tab?.id;
            // Remove debug console.log
            // console.log('Content script ready on tab:', sender.tab?.id);
            sendResponse({ success: true });
            break;

        case 'inspectionStarted':
            extensionState.isInspecting = true;
            broadcastToPopup('inspectionStarted', { success: true });
            sendResponse({ success: true });
            break;

        case 'inspectionStopped':
            extensionState.isInspecting = false;
            extensionState.inspectionType = null;
            broadcastToPopup('inspectionStopped', { success: true });
            sendResponse({ success: true });
            break;

        default:
            sendResponse({ success: false, error: 'Unknown action' });
    }

    return true; // Keep message channel open
});

async function handleStartInspecting(message, sender, sendResponse) {
    try {
        const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        if (!activeTab) {
            sendResponse({ success: false, error: 'No active tab' });
            return;
        }

        extensionState.activeTabId = activeTab.id;
        extensionState.isInspecting = true;
        extensionState.inspectionType = message.type || 'font';

        // Send message to content script
        const response = await chrome.tabs.sendMessage(activeTab.id, {
            action: 'startInspecting'
        });

        sendResponse(response);
    } catch (error) {
        console.error('Error starting inspection:', error);
        extensionState.isInspecting = false;
        sendResponse({ success: false, error: error.message });
    }
}

async function handleStopInspecting(message, sender, sendResponse) {
    try {
        if (extensionState.activeTabId) {
            await chrome.tabs.sendMessage(extensionState.activeTabId, {
                action: 'stopInspecting'
            });
        }

        extensionState.isInspecting = false;
        extensionState.inspectionType = null;
        
        sendResponse({ success: true });
    } catch (error) {
        console.error('Error stopping inspection:', error);
        extensionState.isInspecting = false;
        sendResponse({ success: false, error: error.message });
    }
}

// Broadcast message to popup (if open)
function broadcastToPopup(action, data) {
    // It's difficult to check if popup is open
    // So we try with try-catch
    try {
        chrome.runtime.sendMessage({
            action: action,
            data: data,
            fromBackground: true
        }).catch(() => {
            // Popup is closed, don't make noise
        });
    } catch (error) {
        // Popup is closed or other error
    }
}

// Watch tab changes
chrome.tabs.onActivated.addListener((activeInfo) => {
    // Active tab changed, stop inspection
    if (extensionState.isInspecting) {
        extensionState.isInspecting = false;
        extensionState.inspectionType = null;
    }
    extensionState.contentScriptReady = false;
});

// Clean state when tab is closed
chrome.tabs.onRemoved.addListener((tabId) => {
    if (extensionState.activeTabId === tabId) {
        extensionState.isInspecting = false;
        extensionState.inspectionType = null;
        extensionState.contentScriptReady = false;
        extensionState.activeTabId = null;
    }
}); 