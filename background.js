// Background Script - State Management & Communication Hub
// Bu script popup kapandığında bile state'i korur

let extensionState = {
    isInspecting: false,
    inspectionType: null,
    lastElementData: null,
    contentScriptReady: false,
    activeTabId: null
};

// Install ve startup
chrome.runtime.onInstalled.addListener(() => {
    console.log('Extension installed');
});

// Popup ve content script arasındaki mesajlaşmayı yönet
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('Background received message:', message.action, 'from:', sender);

    switch (message.action) {
        case 'getState':
            // Popup açıldığında state'i gönder
            sendResponse({
                state: extensionState,
                success: true
            });
            break;

        case 'setState':
            // State'i güncelle
            extensionState = { ...extensionState, ...message.data };
            console.log('State updated:', extensionState);
            sendResponse({ success: true });
            break;

        case 'startInspecting':
            // Content script'e inspection başlat komutu gönder
            handleStartInspecting(message, sender, sendResponse);
            break;

        case 'stopInspecting':
            // Content script'e inspection durdur komutu gönder
            handleStopInspecting(message, sender, sendResponse);
            break;

        case 'elementSelected':
            // Content script'ten element seçimi geldi
            extensionState.lastElementData = message.data;
            extensionState.isInspecting = false;
            extensionState.inspectionType = null;
            
            // Popup'a bildir (eğer açıksa)
            broadcastToPopup('elementSelected', message.data);
            sendResponse({ success: true });
            break;

        case 'contentScriptReady':
            // Content script hazır
            extensionState.contentScriptReady = true;
            extensionState.activeTabId = sender.tab?.id;
            console.log('Content script ready on tab:', sender.tab?.id);
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

        // Content script'e mesaj gönder
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

// Popup'a mesaj yayınla (eğer açıksa)
function broadcastToPopup(action, data) {
    // Popup'ın açık olup olmadığını kontrol etmek zor
    // Bu yüzden try-catch ile deniyoruz
    try {
        chrome.runtime.sendMessage({
            action: action,
            data: data,
            fromBackground: true
        }).catch(() => {
            // Popup kapalı, ses çıkarma
        });
    } catch (error) {
        // Popup kapalı veya başka hata
    }
}

// Tab değişikliklerini izle
chrome.tabs.onActivated.addListener((activeInfo) => {
    // Aktif tab değişti, inspection'ı durdur
    if (extensionState.isInspecting) {
        extensionState.isInspecting = false;
        extensionState.inspectionType = null;
    }
    extensionState.contentScriptReady = false;
});

// Tab kapatılınca state temizle
chrome.tabs.onRemoved.addListener((tabId) => {
    if (extensionState.activeTabId === tabId) {
        extensionState.isInspecting = false;
        extensionState.inspectionType = null;
        extensionState.contentScriptReady = false;
        extensionState.activeTabId = null;
    }
}); 