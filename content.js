// Content Script - Element Detection & CSS Extraction
// This script detects elements on web pages and extracts CSS properties

let isInspecting = false;
let highlightedElement = null;
let lastSelectedData = null;

// Create highlight overlay element
const highlightOverlay = document.createElement('div');
highlightOverlay.id = 'font-inspector-highlight';
document.body.appendChild(highlightOverlay);

// Message listener for communication with background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    // Remove debug console.log
    // console.log('Content script received message:', request.action);
    
    switch (request.action) {
        case 'ping':
            sendResponse({success: true, ready: true});
            break;
        case 'startInspecting':
            startInspecting();
            sendResponse({success: true});
            break;
        case 'stopInspecting':
            stopInspecting();
            sendResponse({success: true});
            break;
        case 'getLastData':
            sendResponse({data: lastSelectedData});
            break;
        default:
            sendResponse({success: false, error: 'Unknown action'});
    }
    
    return true; // Keep message channel open for async response
});

function startInspecting() {
    // Remove debug console.log
    // console.log('Starting inspection mode');
    isInspecting = true;
    document.body.style.cursor = 'crosshair';
    document.body.classList.add('font-inspector-active');
    
    // Add event listeners
    document.addEventListener('mouseover', handleMouseOver, true);
    document.addEventListener('mouseout', handleMouseOut, true);
    document.addEventListener('click', handleClick, true);
    
    // Prevent page scrolling
    document.addEventListener('scroll', preventScroll, true);
    
    // Exit with escape key
    document.addEventListener('keydown', handleKeyDown, true);
    
    // Send success message to background
    chrome.runtime.sendMessage({
        action: 'inspectionStarted',
        success: true
    }).catch(error => {
        console.error('Error sending inspection started message:', error);
    });
}

function stopInspecting() {
    // Remove debug console.log
    // console.log('Stopping inspection mode');
    isInspecting = false;
    document.body.style.cursor = '';
    document.body.classList.remove('font-inspector-active');
    
    // Remove event listeners
    document.removeEventListener('mouseover', handleMouseOver, true);
    document.removeEventListener('mouseout', handleMouseOut, true);
    document.removeEventListener('click', handleClick, true);
    document.removeEventListener('scroll', preventScroll, true);
    document.removeEventListener('keydown', handleKeyDown, true);
    
    // Hide highlight
    hideHighlight();
    
    // Send stop message to background
    chrome.runtime.sendMessage({
        action: 'inspectionStopped',
        success: true
    }).catch(error => {
        console.error('Error sending inspection stopped message:', error);
    });
}

function handleMouseOver(event) {
    if (!isInspecting) return;
    
    event.preventDefault();
    event.stopPropagation();
    
    const element = event.target;
    if (element && element !== highlightOverlay && element.id !== 'font-inspector-highlight') {
        highlightElement(element);
    }
}

function handleMouseOut(event) {
    if (!isInspecting) return;
    // Don't remove highlight as it will be continuously updated
}

function handleClick(event) {
    if (!isInspecting) return;
    
    event.preventDefault();
    event.stopPropagation();
    
    const element = event.target;
    if (element && element !== highlightOverlay && element.id !== 'font-inspector-highlight') {
        // Remove debug console.log statements
        // console.log('Element clicked:', element);
        const elementData = extractElementData(element);
        // console.log('Element data extracted:', elementData);
        
        lastSelectedData = elementData;
        
        // Send data to background (background will relay to popup)
        chrome.runtime.sendMessage({
            action: 'elementSelected',
            data: elementData
        }).then(() => {
            // Remove debug console.log
            // console.log('Element data sent to background');
        }).catch(error => {
            console.error('Error sending element data:', error);
        });
        
        stopInspecting();
    }
}

function handleKeyDown(event) {
    if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        stopInspecting();
    }
}

function preventScroll(event) {
    if (isInspecting) {
        event.preventDefault();
        event.stopPropagation();
    }
}

function highlightElement(element) {
    try {
        const rect = element.getBoundingClientRect();
        const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        highlightOverlay.style.display = 'block';
        highlightOverlay.style.left = (rect.left + scrollLeft) + 'px';
        highlightOverlay.style.top = (rect.top + scrollTop) + 'px';
        highlightOverlay.style.width = rect.width + 'px';
        highlightOverlay.style.height = rect.height + 'px';
        
        highlightedElement = element;
    } catch (error) {
        console.error('Error highlighting element:', error);
    }
}

function hideHighlight() {
    highlightOverlay.style.display = 'none';
    highlightedElement = null;
}

function extractElementData(element) {
    try {
        const computedStyle = window.getComputedStyle(element);
        
        // Font information
        const fontFamily = computedStyle.fontFamily;
        const fontSize = computedStyle.fontSize;
        const fontWeight = computedStyle.fontWeight;
        const fontStyle = computedStyle.fontStyle;
        
        // Color information
        const color = computedStyle.color;
        const backgroundColor = computedStyle.backgroundColor;
        
        // Spacing information (margin, padding, border)
        const spacing = {
            marginTop: computedStyle.marginTop,
            marginRight: computedStyle.marginRight,
            marginBottom: computedStyle.marginBottom,
            marginLeft: computedStyle.marginLeft,
            paddingTop: computedStyle.paddingTop,
            paddingRight: computedStyle.paddingRight,
            paddingBottom: computedStyle.paddingBottom,
            paddingLeft: computedStyle.paddingLeft,
            borderTop: computedStyle.borderTopWidth,
            borderRight: computedStyle.borderRightWidth,
            borderBottom: computedStyle.borderBottomWidth,
            borderLeft: computedStyle.borderLeftWidth,
            boxSizing: computedStyle.boxSizing
        };
        
        // Element dimension information
        const rect = element.getBoundingClientRect();
        spacing.contentWidth = Math.round(rect.width) + 'px';
        spacing.contentHeight = Math.round(rect.height) + 'px';
        
        // Element information
        const tagName = element.tagName.toLowerCase();
        const className = element.className || '';
        const textContent = element.textContent ? element.textContent.trim().substring(0, 50) : '';
        
        // Convert font size to points (px to pt: pt = px * 0.75)
        const fontSizeInPx = parseFloat(fontSize);
        const fontSizeInPt = Math.round(fontSizeInPx * 0.75 * 100) / 100;
        
        // Get first font from font family
        const primaryFont = fontFamily.split(',')[0].replace(/["']/g, '').trim();
        
        // Remove debug console.log statements
        // console.log('Extracted font info:', {
        //     fontFamily,
        //     fontSize,
        //     fontWeight,
        //     primaryFont
        // });
        
        // console.log('Extracted spacing info:', spacing);
        
        return {
            element: {
                tag: tagName,
                class: className,
                text: textContent || 'Text not found'
            },
            font: {
                family: fontFamily,
                primaryFont: primaryFont,
                size: fontSize,
                sizeInPt: fontSizeInPt + 'pt',
                weight: fontWeight,
                style: fontStyle
            },
            colors: {
                text: color,
                background: backgroundColor,
                textHex: rgbToHex(color),
                backgroundHex: rgbToHex(backgroundColor)
            },
            spacing: spacing,
            tagName: tagName,
            className: className,
            timestamp: new Date().toLocaleTimeString()
        };
    } catch (error) {
        console.error('Error extracting element data:', error);
        return {
            element: { tag: 'error', class: '', text: 'Error occurred while retrieving data' },
            font: { family: 'Unknown', primaryFont: 'Unknown', size: '0px', sizeInPt: '0pt', weight: 'normal', style: 'normal' },
            colors: { text: '#000', background: '#fff', textHex: '#000000', backgroundHex: '#ffffff' },
            spacing: { marginTop: '0px', marginRight: '0px', marginBottom: '0px', marginLeft: '0px', paddingTop: '0px', paddingRight: '0px', paddingBottom: '0px', paddingLeft: '0px', boxSizing: 'content-box' },
            tagName: 'error',
            className: '',
            timestamp: new Date().toLocaleTimeString()
        };
    }
}

// Convert RGB value to HEX
function rgbToHex(rgb) {
    if (!rgb || rgb === 'rgba(0, 0, 0, 0)' || rgb === 'transparent') {
        return 'transparent';
    }
    
    const result = rgb.match(/\d+/g);
    if (!result || result.length < 3) return rgb;
    
    const r = parseInt(result[0]);
    const g = parseInt(result[1]);
    const b = parseInt(result[2]);
    
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

// Send ready message to background when page loads
function notifyReady() {
    chrome.runtime.sendMessage({
        action: 'contentScriptReady'
    }).catch(error => {
        console.error('Error notifying ready state:', error);
    });
    
    // Remove debug console.log
    // console.log('Content script ready on:', window.location.href);
}

// When page loads
window.addEventListener('load', notifyReady);

// Also send on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', notifyReady);
} else {
    // Already loaded
    notifyReady();
} 