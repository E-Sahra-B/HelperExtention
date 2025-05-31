// Enhanced Color, Font & Size Picker Extension
// Modern tab-based interface with background script state management

class ExtensionController {
    constructor() {
        this.isColorPickerOpen = false;
        this.isFontInspectorActive = false;
        this.isSpacingInspectorActive = false;
        this.currentTab = 'color';
        this.currentTabId = null;
        
        this.initializeExtension();
    }

    async initializeExtension() {
        // First load state from background, then initialize UI
        await this.loadStateFromBackground();
        this.initializeUI();
        this.setupEventListeners();
    }

    async loadStateFromBackground() {
        try {
            const response = await chrome.runtime.sendMessage({ action: 'getState' });
            if (response?.state) {
                // Restore the last active tab
                if (response.state.lastActiveTab) {
                    this.currentTab = response.state.lastActiveTab;
                    this.switchTab(response.state.lastActiveTab);
                }
                
                // Load font information
                if (response.state.lastElementData) {
                    this.updateFontDisplay(response.state.lastElementData);
                }
                // Load spacing information
                if (response.state.lastSpacingData) {
                    this.updateSpacingDisplay(response.state.lastSpacingData);
                }
                
                return true; // State was loaded successfully
            }
        } catch (error) {
            // Extension might have been reloaded, continue silently
        }
        return false; // No state was loaded
    }

    initializeUI() {
        // Only activate default tab if no state was restored
        if (!document.querySelector('.tab-btn.active')) {
            this.switchTab('color');
        }
        
        // Color picker initial value
        const colorPicker = document.getElementById('colorPicker');
        const initialColor = colorPicker.value;
        this.updateColorDisplay(initialColor);
    }

    setupEventListeners() {
        // Tab transitions
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchTab(e.currentTarget.dataset.tab);
            });
        });

        // Color picker - hidden input
    const colorPicker = document.getElementById('colorPicker');
        colorPicker.addEventListener('input', async (e) => {
            const selectedColor = e.target.value;
            
            // Update the display first
            this.updateColorDisplay(selectedColor);
            
            // Close the color picker dialog
            e.target.blur();
            
            // Automatically copy the hex color
            try {
                await navigator.clipboard.writeText(selectedColor.toUpperCase());
                this.showStatus(`${selectedColor.toUpperCase()} copied!`, 'success');
            } catch (error) {
                console.error('Auto-copy error:', error);
                this.showStatus('Color selected but copy failed', 'warning');
            }
        });

        // Also handle the 'change' event for when the picker is closed
        colorPicker.addEventListener('change', async (e) => {
            const selectedColor = e.target.value;
            
            // Close the color picker dialog
            e.target.blur();
            
            // Only copy and close if it's different from current value
            // (to avoid double-copying on some browsers)
            const currentHex = document.getElementById('hexCode').value;
            if (selectedColor.toUpperCase() !== currentHex) {
                try {
                    await navigator.clipboard.writeText(selectedColor.toUpperCase());
                    this.showStatus(`${selectedColor.toUpperCase()} copied!`, 'success');
                } catch (error) {
                    console.error('Auto-copy error:', error);
                    this.showStatus('Color selected but copy failed', 'warning');
                }
            }
        });

        // Open color picker when clicking on color preview
        const colorPreview = document.getElementById('colorPreview');
        if (colorPreview) {
            colorPreview.addEventListener('click', () => {
                colorPicker.click();
            });
        }

        // Listen to hex code input values
        const hexCodeInput = document.getElementById('hexCode');
        if (hexCodeInput) {
            hexCodeInput.addEventListener('input', (e) => {
                this.handleHexInput(e.target.value);
            });
            hexCodeInput.addEventListener('blur', (e) => {
                this.handleHexInput(e.target.value, true);
            });
        }

        // Listen to RGB code input values
        const rgbCodeInput = document.getElementById('rgbCode');
        if (rgbCodeInput) {
            rgbCodeInput.addEventListener('input', (e) => {
                this.handleRgbInput(e.target.value);
            });
            rgbCodeInput.addEventListener('blur', (e) => {
                this.handleRgbInput(e.target.value, true);
            });
        }

        // Color variations click event
        document.querySelectorAll('.color-variation').forEach(variation => {
            variation.addEventListener('click', (e) => {
                const variationType = e.currentTarget.dataset.variation;
                this.selectColorVariation(variationType);
            });
        });

        // Compatible colors click event
        document.querySelectorAll('.compatible-color').forEach(compatible => {
            compatible.addEventListener('click', (e) => {
                const harmonyType = e.currentTarget.dataset.harmony;
                this.selectCompatibleColor(harmonyType);
            });
        });

        // Add click events to copyable inputs
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('copyable-input')) {
                this.copyInputValue(e.target);
            }
        });

        // Inspect buttons
        const inspectFontBtn = document.getElementById('inspectFont');
        if (inspectFontBtn) {
            inspectFontBtn.addEventListener('click', () => {
                this.toggleFontInspector();
            });
        }

        const inspectSpacingBtn = document.getElementById('inspectSpacing');
        if (inspectSpacingBtn) {
            inspectSpacingBtn.addEventListener('click', () => {
                this.toggleSpacingInspector();
            });
        }

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardShortcuts(e);
        });

        // Listen to messages from background script
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            if (message.action === 'elementSelected') {
                if (this.isFontInspectorActive) {
                    this.updateFontDisplay(message.data);
                    this.setInspectorState('font', false);
                } else if (this.isSpacingInspectorActive) {
                    this.updateSpacingDisplay(message.data);
                    this.setInspectorState('spacing', false);
                }
            } else if (message.action === 'inspectionStarted') {
                // Check which inspector is active
                if (this.isFontInspectorActive) {
                    this.setInspectorState('font', true);
                } else if (this.isSpacingInspectorActive) {
                    this.setInspectorState('spacing', true);
                }
            } else if (message.action === 'inspectionStopped') {
                this.setInspectorState('font', false);
                this.setInspectorState('spacing', false);
            }
        });
    }

    switchTab(tabName) {
        // Deactivate previous tab
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelectorAll('.tab-panel').forEach(panel => {
            panel.classList.remove('active');
        });

        // Activate new tab
        const tabBtn = document.querySelector(`[data-tab="${tabName}"]`);
        const tabPanel = document.getElementById(`${tabName}-panel`);
        
        if (tabBtn && tabPanel) {
            tabBtn.classList.add('active');
            tabPanel.classList.add('active');
            this.currentTab = tabName;
            
            // Save current tab to background script
            chrome.runtime.sendMessage({
                action: 'setActiveTab',
                tab: tabName
            }).catch(error => {
                // Failed to save tab state - continue silently
            });
        }
    }

    updateColorDisplay(color) {
        // Update main color preview
        const preview = document.getElementById('colorPreview');
        if (preview) preview.style.backgroundColor = color;

        // Update hex and RGB codes
    const hexCode = document.getElementById('hexCode');
        const rgbCode = document.getElementById('rgbCode');
        
        if (hexCode) hexCode.value = color.toUpperCase();
        
        // Convert hex to RGB
        const rgb = this.hexToRgb(color);
        if (rgbCode && rgb) {
            rgbCode.value = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
        }

        // Update color variations
        this.updateColorVariations(color);

        // Update compatible colors
        this.updateCompatibleColors(color);
    }

    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }

    rgbToHex(r, g, b) {
        return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    }

    // New HSL-based color shading function
    adjustColorLightness(hexColor, amount) {
        // Convert hex to RGB
        let r = parseInt(hexColor.substring(1, 3), 16);
        let g = parseInt(hexColor.substring(3, 5), 16);
        let b = parseInt(hexColor.substring(5, 7), 16);

        // Convert RGB to HSL
        r /= 255, g /= 255, b /= 255;
        let max = Math.max(r, g, b), min = Math.min(r, g, b);
        let h, s, l = (max + min) / 2;

        if (max === min) {
            h = s = 0; // achromatic
        } else {
            let d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            h /= 6;
        }

        // Adjust lightness value
        l += amount / 100;
        l = Math.min(1, Math.max(0, l));

        // Convert HSL back to RGB
        if (s === 0) {
            r = g = b = l; // achromatic
        } else {
            function hue2rgb(p, q, t) {
                if (t < 0) t += 1;
                if (t > 1) t -= 1;
                if (t < 1/6) return p + (q - p) * 6 * t;
                if (t < 1/2) return q;
                if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
                return p;
            }

            let q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            let p = 2 * l - q;
            r = hue2rgb(p, q, h + 1/3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1/3);
        }

        // Convert RGB back to hex
        r = Math.round(r * 255);
        g = Math.round(g * 255);
        b = Math.round(b * 255);
        
        return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
    }

    updateColorVariations(baseColor) {
        // Create new HSL lightness-based color variations
        const variations = {
            lighter2: this.adjustColorLightness(baseColor, 20),  // 20% lighter
            lighter1: this.adjustColorLightness(baseColor, 10),  // 10% lighter
            original: baseColor,                                 // Original
            darker1: this.adjustColorLightness(baseColor, -10),  // 10% darker
            darker2: this.adjustColorLightness(baseColor, -20)   // 20% darker
        };

        // Update each variation
        Object.keys(variations).forEach(key => {
            const preview = document.getElementById(`${key}Preview`);
            if (preview) {
                preview.style.backgroundColor = variations[key];
                preview.dataset.color = variations[key];
            }
        });

        // Also update original preview
        const originalPreview = document.getElementById('originalPreview');
        if (originalPreview) {
            originalPreview.style.backgroundColor = baseColor;
            originalPreview.dataset.color = baseColor;
        }
    }

    selectColorVariation(variationType) {
        // Update active state
        document.querySelectorAll('.color-variation').forEach(v => {
            v.classList.remove('active');
    });
        document.querySelector(`[data-variation="${variationType}"]`).classList.add('active');

        // Get selected color
        const preview = document.getElementById(`${variationType}Preview`);
        const selectedColor = preview.dataset.color;

        if (selectedColor) {
            // Update main color codes
            const hexCode = document.getElementById('hexCode');
            const rgbCode = document.getElementById('rgbCode');
            
            if (hexCode) hexCode.value = selectedColor.toUpperCase();
            
            const rgb = this.hexToRgb(selectedColor);
            if (rgbCode && rgb) {
                rgbCode.value = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
    }

            // Update main color picker
            const colorPicker = document.getElementById('colorPicker');
            if (colorPicker) colorPicker.value = selectedColor;

            // Auto-copy hex code
            this.autocopyhexCode(selectedColor.toUpperCase());
        }
    }

    async toggleFontInspector() {
        const inspectBtn = document.getElementById('inspectFont');
        
        if (this.isFontInspectorActive) {
            // Stop inspector
            this.setInspectorState('font', false);
            try {
                await chrome.runtime.sendMessage({ action: 'stopInspecting' });
            } catch (error) {
                // Stop inspecting failed - continue silently
            }
            return;
        }

        try {
            // Start inspector
            this.setInspectorState('font', true);

            // Start inspector through background script
            const response = await chrome.runtime.sendMessage({ 
                action: 'startInspecting',
                type: 'font',
                activeTab: this.currentTab
            });
            
            if (!response?.success) {
                throw new Error(response?.error || 'Inspector could not be started');
            }
            
        } catch (error) {
            console.error('Font inspector error:', error);
            
            // User-friendly error message
            if (error.message?.includes('Could not establish connection')) {
                this.showStatus('Extension is reloading, please refresh the page (F5)', 'info');
            } else {
                this.showStatus('Element selector could not be started, please refresh the page', 'error');
            }
            
            this.setInspectorState('font', false);
        }
    }

    async toggleSpacingInspector() {
        try {
            // First check current state
            const currentTabInfo = await chrome.tabs.query({ active: true, currentWindow: true });
            
            if (!currentTabInfo[0]) {
                this.showStatus('Active tab not found', 'error');
                return;
            }

            this.currentTabId = currentTabInfo[0].id;

            if (this.isSpacingInspectorActive) {
                // Stop inspector
                await chrome.tabs.sendMessage(this.currentTabId, { action: 'stopInspecting' });
                this.setInspectorState('spacing', false);
            } else {
                // If font inspector is active, stop it
                if (this.isFontInspectorActive) {
                    await chrome.tabs.sendMessage(this.currentTabId, { action: 'stopInspecting' });
                    this.setInspectorState('font', false);
                }
                
                // Save current tab before starting inspection
                chrome.runtime.sendMessage({
                    action: 'setActiveTab',
                    tab: this.currentTab
                }).catch(error => {
                    // Failed to save tab state - continue silently
                });
                
                // Start spacing inspector
                await chrome.tabs.sendMessage(this.currentTabId, { action: 'startInspecting' });
                this.isSpacingInspectorActive = true;
                this.setInspectorState('spacing', true);
            }
        } catch (error) {
            console.error('Spacing inspector error:', error);
            this.showStatus('Inspector could not be started. Please refresh the page.', 'error');
            this.setInspectorState('spacing', false);
        }
    }

    setInspectorState(type, active) {
        if (type === 'font') {
            this.isFontInspectorActive = active;
            const btn = document.getElementById('inspectFont');
            if (btn) {
                if (active) {
                    btn.classList.add('active');
                    btn.textContent = '⏹️';
                } else {
                    btn.classList.remove('active');
                    btn.textContent = '🔍';
                }
            }
        } else if (type === 'spacing') {
            this.isSpacingInspectorActive = active;
            const btn = document.getElementById('inspectSpacing');
            if (btn) {
                if (active) {
                    btn.classList.add('active');
                    btn.textContent = '⏹️';
                } else {
                    btn.classList.remove('active');
                    btn.textContent = '🔍';
                }
            }
        }
    }

    updateFontDisplay(elementData) {
        if (!elementData) return;

        // Check element data structure
        const fontData = elementData.font || {};
        const elementInfo = elementData.element || {};

        // Calculate font size in different units
        const fontSizePx = fontData.size || '16px';
        const fontSizeNum = parseFloat(fontSizePx);
        const fontSizePt = Math.round(fontSizeNum * 0.75 * 100) / 100 + 'pt';
        const fontSizeRem = Math.round(fontSizeNum / 16 * 100) / 100 + 'rem';

        // Fill input fields
        this.setInputValue('primaryFont', fontData.primaryFont || 'Unknown');
        this.setInputValue('fontFamily', fontData.family || 'Unknown');
        this.setInputValue('fontWeight', fontData.weight || 'normal');
        this.setInputValue('fontSizePt', fontSizePt);
        this.setInputValue('fontSizePx', fontSizePx);
        this.setInputValue('fontSizeRem', fontSizeRem);
        this.setInputValue('elementInfo', `${elementInfo.tag}${elementInfo.class ? '.' + elementInfo.class : ''}`);
        this.setInputValue('elementText', elementInfo.text || 'Text not found');

        // Process color information and display in hex format
        const colorData = elementData.colors || {};
        const textColor = this.convertColorToHex(colorData.text || fontData.color || 'rgb(0, 0, 0)');
        const backgroundColor = this.convertColorToHex(colorData.background || fontData.backgroundColor || 'rgba(0, 0, 0, 0)');
        
        this.setInputValue('textColor', textColor);
        this.setInputValue('backgroundColor', backgroundColor);

        // Update visual styles of input fields
        this.updateColorInputStyles(colorData.text || fontData.color, colorData.background || fontData.backgroundColor);

        // Update font preview - remove reference to missing fontPreview element
        // const preview = document.getElementById('fontPreview');
        // if (preview && fontData.primaryFont && fontSizePx) {
        //     preview.style.setProperty('--preview-font', fontData.primaryFont);
        //     preview.style.setProperty('--preview-size', fontSizePx);
        //     preview.style.fontFamily = fontData.primaryFont;
        //     preview.style.fontSize = fontSizePx;
        // }

        // Hide placeholder, show content
        const placeholder = document.querySelector('#fontInfo .info-placeholder');
        const content = document.querySelector('#fontInfo .info-content');
        
        if (placeholder) placeholder.style.display = 'none';
        if (content) content.style.display = 'block';

        this.showStatus('Font information retrieved!', 'success');
    }

    // Helper function to convert color format to hex
    convertColorToHex(color) {
        if (!color || color === 'transparent') return 'Transparent';
        
        // If already in hex format
        if (color.startsWith('#')) {
            return color.toUpperCase();
        }
        
        // Convert from RGB or RGBA format to hex
        const rgbMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
        if (rgbMatch) {
            const r = parseInt(rgbMatch[1]);
            const g = parseInt(rgbMatch[2]);
            const b = parseInt(rgbMatch[3]);
            const a = rgbMatch[4] ? parseFloat(rgbMatch[4]) : 1;
            
            // If there's transparency and it's fully transparent
            if (a === 0) return 'Transparent';
            
            // Convert RGB to hex
            const hex = this.rgbToHex(r, g, b);
            
            // Indicate alpha value if present
            if (a < 1) {
                return `${hex} (${Math.round(a * 100)}% opaque)`;
            }
            
            return hex;
        }
        
        // For other color formats (named colors etc.)
        return color;
    }

    setInputValue(id, value) {
        const input = document.getElementById(id);
        if (input) {
            input.value = value || '';
        }
    }

    async copyInputValue(input) {
        if (!input || !input.value) return;

        try {
            await navigator.clipboard.writeText(input.value);
            
            // Visual feedback
            const originalBg = input.style.backgroundColor;
            input.style.backgroundColor = '#4caf50';
            input.style.color = 'white';
            
            setTimeout(() => {
                input.style.backgroundColor = originalBg;
                input.style.color = '';
            }, 200);
            
            this.showStatus(`${input.value} copied!`, 'success');
        } catch (error) {
            console.error('Copying error:', error);
            this.showStatus('Copying failed', 'error');
        }
    }

    handleKeyboardShortcuts(e) {
        // Tab transitions (1, 2)
        if (e.key === '1') {
            e.preventDefault();
            this.switchTab('color');
        } else if (e.key === '2') {
            e.preventDefault();
            this.switchTab('font');
        }
        
        // Copy (Ctrl+C)
        else if (e.ctrlKey && e.key === 'c') {
            const activePanel = document.querySelector('.tab-panel.active');
            if (activePanel) {
                const inputs = activePanel.querySelectorAll('.copyable-input');
                if (inputs.length > 0) {
                    e.preventDefault();
                    this.copyInputValue(inputs[0]);
                }
            }
        }
        
        // Inspector cancel (ESC)
        else if (e.key === 'Escape') {
            if (this.isFontInspectorActive) {
                e.preventDefault();
                this.setInspectorState('font', false);
                chrome.runtime.sendMessage({ action: 'stopInspecting' });
            }
        }
    }

    showStatus(message, type = 'info') {
        const status = document.getElementById('status');
        if (!status) return;

        status.textContent = message;
        status.className = `status ${type}`;
        status.style.display = 'block';

        setTimeout(() => {
            status.style.display = 'none';
        }, 3000);
    }

    async autocopyhexCode(hexValue) {
        try {
            await navigator.clipboard.writeText(hexValue);
            this.showStatus(`${hexValue} copied!`, 'success');
        } catch (error) {
            console.error('Automatic copying error:', error);
        }
    }

    updateSpacingDisplay(elementData) {
        const infoCard = document.getElementById('spacingInfo');
        const placeholder = infoCard.querySelector('.info-placeholder');
        const content = infoCard.querySelector('.info-content');
        
        if (placeholder && content) {
            placeholder.style.display = 'none';
            content.style.display = 'block';
        }
        
        // Box model'den margin ve padding değerlerini al
        const spacing = elementData.spacing || {};
        
        // Margin değerleri
        // this.setInputValue('marginTop', spacing.marginTop || '0px');
        // this.setInputValue('marginRight', spacing.marginRight || '0px');
        // this.setInputValue('marginBottom', spacing.marginBottom || '0px');
        // this.setInputValue('marginLeft', spacing.marginLeft || '0px');
        
        // Padding değerleri
        // this.setInputValue('paddingTop', spacing.paddingTop || '0px');
        // this.setInputValue('paddingRight', spacing.paddingRight || '0px');
        // this.setInputValue('paddingBottom', spacing.paddingBottom || '0px');
        // this.setInputValue('paddingLeft', spacing.paddingLeft || '0px');
        
        // Element bilgileri
        const tagName = elementData.tagName || 'unknown';
        const className = elementData.className || '';
        let elementInfo = tagName;
        if (className) {
            elementInfo += `.${className.split(' ').join('.')}`;
        }
        
        this.setInputValue('spacingElementInfo', elementInfo);
        this.setInputValue('boxSizing', spacing.boxSizing || 'content-box');
        
        // Content size'ı güncelle
        const contentSize = document.getElementById('contentSize');
        if (contentSize && spacing.contentWidth && spacing.contentHeight) {
            contentSize.textContent = `${spacing.contentWidth}×${spacing.contentHeight}`;
        }
        
        // Box model preview'ında değerleri göster
        this.updateBoxModelPreview(spacing);
        
        // Background'a veriyi kaydet
        chrome.runtime.sendMessage({
            action: 'saveSpacingData',
            data: elementData
        }).catch(error => {
            console.error('Error saving spacing data:', error);
        });
    }

    updateBoxModelPreview(spacing) {
        // Margin alanındaki değerleri güncelle
        const marginBox = document.querySelector('.box-margin');
        if (marginBox) {
            // Helper function to remove 'px' from values
            const removePixelUnit = (value) => {
                if (!value || value === '0' || value === '0px') return '0';
                return value.replace('px', '');
            };

            // Değerleri kenarların etrafına yerleştir
            const marginTop = removePixelUnit(spacing.marginTop || '0');
            const marginRight = removePixelUnit(spacing.marginRight || '0');
            const marginBottom = removePixelUnit(spacing.marginBottom || '0');
            const marginLeft = removePixelUnit(spacing.marginLeft || '0');
            
            // Border değerleri
            const borderTop = removePixelUnit(spacing.borderTop || '0');
            const borderRight = removePixelUnit(spacing.borderRight || '0');
            const borderBottom = removePixelUnit(spacing.borderBottom || '0');
            const borderLeft = removePixelUnit(spacing.borderLeft || '0');
            
            // Padding değerleri
            const paddingTop = removePixelUnit(spacing.paddingTop || '0');
            const paddingRight = removePixelUnit(spacing.paddingRight || '0');
            const paddingBottom = removePixelUnit(spacing.paddingBottom || '0');
            const paddingLeft = removePixelUnit(spacing.paddingLeft || '0');
            
            // Content dimensions without px
            const contentWidth = removePixelUnit(spacing.contentWidth || '0px');
            const contentHeight = removePixelUnit(spacing.contentHeight || '0px');
            
            // Box model'i Chrome DevTools tarzında oluştur
            marginBox.innerHTML = `
                <div class="box-label-corner">margin</div>
                <div class="value-top">${marginTop}</div>
                <div class="value-right">${marginRight}</div>
                <div class="value-bottom">${marginBottom}</div>
                <div class="value-left">${marginLeft}</div>
                
                <div class="box-border">
                    <div class="box-label-corner">border</div>
                    <div class="value-top">${borderTop}</div>
                    <div class="value-right">${borderRight}</div>
                    <div class="value-bottom">${borderBottom}</div>
                    <div class="value-left">${borderLeft}</div>
                    
                    <div class="box-padding">
                        <div class="box-label-corner">padding</div>
                        <div class="value-top">${paddingTop}</div>
                        <div class="value-right">${paddingRight}</div>
                        <div class="value-bottom">${paddingBottom}</div>
                        <div class="value-left">${paddingLeft}</div>
                        
                        <div class="box-content">
                            <div class="content-dimensions">
                                ${contentWidth} × ${contentHeight}
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }
    }

    updateColorInputStyles(textColor, backgroundColor) {
        // Text color input'unun görsel stillerini güncelle
        const textColorInput = document.getElementById('textColor');
        if (textColorInput && textColor && textColor !== 'transparent') {
            const hexTextColor = this.getRawHexFromColor(textColor);
            if (hexTextColor && hexTextColor !== 'transparent') {
                textColorInput.style.color = hexTextColor;
                textColorInput.style.backgroundColor = this.getContrastColor(hexTextColor);
            }
        }

        // Background color input'unun görsel stillerini güncelle  
        const backgroundColorInput = document.getElementById('backgroundColor');
        if (backgroundColorInput && backgroundColor && backgroundColor !== 'transparent') {
            const hexBgColor = this.getRawHexFromColor(backgroundColor);
            if (hexBgColor && hexBgColor !== 'transparent') {
                backgroundColorInput.style.backgroundColor = hexBgColor;
                backgroundColorInput.style.color = this.getContrastColor(hexBgColor);
            }
        }
    }

    // Herhangi bir renk formatından temiz hex değeri al
    getRawHexFromColor(color) {
        if (!color || color === 'transparent') return null;
        
        // Eğer zaten hex formatındaysa
        if (color.startsWith('#')) {
            return color.toUpperCase();
        }
        
        // RGB veya RGBA formatından hex'e çevir
        const rgbMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
        if (rgbMatch) {
            const r = parseInt(rgbMatch[1]);
            const g = parseInt(rgbMatch[2]);
            const b = parseInt(rgbMatch[3]);
            const a = rgbMatch[4] ? parseFloat(rgbMatch[4]) : 1;
            
            // Eğer tam şeffafsa null döndür
            if (a === 0) return null;
            
            return this.rgbToHex(r, g, b);
        }
        
        return null;
    }

    // Renk için en iyi kontrast rengini hesapla (siyah veya beyaz)
    getContrastColor(hexColor) {
        if (!hexColor || !hexColor.startsWith('#')) return '#000000';
        
        const r = parseInt(hexColor.substring(1, 3), 16);
        const g = parseInt(hexColor.substring(3, 5), 16);
        const b = parseInt(hexColor.substring(5, 7), 16);
        
        // Relative luminance hesapla (WCAG formula)
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        
        // Eğer renk açıksa siyah, koyuysa beyaz yazı kullan
        return luminance > 0.5 ? '#000000' : '#FFFFFF';
    }

    // Uyumlu renkleri güncelle
    updateCompatibleColors(baseColor) {
        // Yeni renk paleti fonksiyonunu kullan
        const palette = this.generateColorPalette(baseColor);
        
        // HTML elementleriyle eşleştir
        const compatibleColors = {
            analogous1: palette[0],      // Analog renk (30 derece fark)
            complementary: palette[1],   // Tamamlayıcı renk (180 derece fark)
            triadic1: palette[2],        // Triadic renk 1 (120 derece fark)
            triadic2: palette[3],        // Triadic renk 2 (240 derece fark)
            analogous2: palette[4]       // Aynı ton, farklı doygunluk
        };

        // Her uyumlu rengi güncelle
        Object.keys(compatibleColors).forEach(key => {
            const preview = document.getElementById(`${key}Preview`);
            if (preview) {
                preview.style.backgroundColor = compatibleColors[key];
                preview.dataset.color = compatibleColors[key];
            }
        });
    }

    // Gelişmiş renk paleti oluşturma fonksiyonu
    generateColorPalette(baseColor) {
        // HEX rengini RGB'ye çevir
        const hexToRgb = (hex) => {
            const r = parseInt(hex.slice(1, 3), 16);
            const g = parseInt(hex.slice(3, 5), 16);
            const b = parseInt(hex.slice(5, 7), 16);
            return { r, g, b };
        };

        // RGB'yi HEX'e çevir
        const rgbToHex = (r, g, b) => {
            return "#" + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
        };

        // HSL'ye çevirme (renk manipülasyonu için)
        const rgbToHsl = (r, g, b) => {
            r /= 255, g /= 255, b /= 255;
            const max = Math.max(r, g, b), min = Math.min(r, g, b);
            let h, s, l = (max + min) / 2;

            if (max === min) {
                h = s = 0; // gri ton
            } else {
                const d = max - min;
                s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
                switch (max) {
                    case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                    case g: h = (b - r) / d + 2; break;
                    case b: h = (r - g) / d + 4; break;
                }
                h /= 6;
            }
            return { h: h * 360, s: s * 100, l: l * 100 };
        };

        // HSL'yi RGB'ye çevirme
        const hslToRgb = (h, s, l) => {
            h /= 360, s /= 100, l /= 100;
            let r, g, b;
            if (s === 0) {
                r = g = b = l; // gri ton
            } else {
                const hue2rgb = (p, q, t) => {
                    if (t < 0) t += 1;
                    if (t > 1) t -= 1;
                    if (t < 1/6) return p + (q - p) * 6 * t;
                    if (t < 1/2) return q;
                    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
                    return p;
                };
                const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
                const p = 2 * l - q;
                r = hue2rgb(p, q, h + 1/3);
                g = hue2rgb(p, q, h);
                b = hue2rgb(p, q, h - 1/3);
            }
            return {
                r: Math.round(r * 255),
                g: Math.round(g * 255),
                b: Math.round(b * 255)
            };
        };

        // Renk manipülasyonu (hue offset ekleyerek yeni renkler oluştur)
        const adjustHue = (h, offset) => (h + offset) % 360;

        const baseRgb = hexToRgb(baseColor);
        const baseHsl = rgbToHsl(baseRgb.r, baseRgb.g, baseRgb.b);

        // 5 farklı renk oluşturma stratejisi:
        const palette = [];
        
        // 1. Analog renk (30 derece fark)
        const analogHsl = { ...baseHsl, h: adjustHue(baseHsl.h, 30) };
        const analogRgb = hslToRgb(analogHsl.h, analogHsl.s, analogHsl.l);
        palette.push(rgbToHex(analogRgb.r, analogRgb.g, analogRgb.b));

        // 2. Tamamlayıcı (complementary) renk (180 derece fark)
        const compHsl = { ...baseHsl, h: adjustHue(baseHsl.h, 180) };
        const compRgb = hslToRgb(compHsl.h, compHsl.s, compHsl.l);
        palette.push(rgbToHex(compRgb.r, compRgb.g, compRgb.b));

        // 3. Triadic renk 1 (120 derece fark)
        const triadic1Hsl = { ...baseHsl, h: adjustHue(baseHsl.h, 120) };
        const triadic1Rgb = hslToRgb(triadic1Hsl.h, triadic1Hsl.s, triadic1Hsl.l);
        palette.push(rgbToHex(triadic1Rgb.r, triadic1Rgb.g, triadic1Rgb.b));

        // 4. Triadic renk 2 (240 derece fark)
        const triadic2Hsl = { ...baseHsl, h: adjustHue(baseHsl.h, 240) };
        const triadic2Rgb = hslToRgb(triadic2Hsl.h, triadic2Hsl.s, triadic2Hsl.l);
        palette.push(rgbToHex(triadic2Rgb.r, triadic2Rgb.g, triadic2Rgb.b));

        // 5. Aynı ton, farklı doygunluk (saturation -20%)
        const desatHsl = { ...baseHsl, s: Math.max(0, baseHsl.s - 20) };
        const desatRgb = hslToRgb(desatHsl.h, desatHsl.s, desatHsl.l);
        palette.push(rgbToHex(desatRgb.r, desatRgb.g, desatRgb.b));

        return palette;
    }

    // Hex'i HSL'ye çevir - Eski fonksiyon (artık kullanılmıyor)
    hexToHsl(hex) {
        const r = parseInt(hex.substring(1, 3), 16) / 255;
        const g = parseInt(hex.substring(3, 5), 16) / 255;
        const b = parseInt(hex.substring(5, 7), 16) / 255;

        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        let h, s, l = (max + min) / 2;

        if (max === min) {
            h = s = 0;
        } else {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            h /= 6;
        }

        return { h: h * 360, s: s * 100, l: l * 100 };
    }

    // HSL'yi Hex'e çevir - Eski fonksiyon (artık kullanılmıyor)
    hslToHex({ h, s, l }) {
        h = h / 360;
        s = s / 100;
        l = l / 100;

        const hue2rgb = (p, q, t) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1/6) return p + (q - p) * 6 * t;
            if (t < 1/2) return q;
            if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
        };

        let r, g, b;
        if (s === 0) {
            r = g = b = l;
        } else {
            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;
            r = hue2rgb(p, q, h + 1/3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1/3);
        }

        const toHex = c => {
            const hex = Math.round(c * 255).toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        };

        return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    }

    // Tamamlayıcı renk - Eski fonksiyon (artık kullanılmıyor)
    getComplementaryColor(hsl) {
        return {
            h: (hsl.h + 180) % 360,
            s: hsl.s,
            l: hsl.l
        };
    }

    // Üçlü uyum renkleri - Eski fonksiyon (artık kullanılmıyor)
    getTriadicColor(hsl, degrees) {
        return {
            h: (hsl.h + degrees) % 360,
            s: hsl.s,
            l: hsl.l
        };
    }

    // Benzer renkler - Eski fonksiyon (artık kullanılmıyor)
    getAnalogousColor(hsl, degrees) {
        return {
            h: (hsl.h + degrees + 360) % 360,
            s: hsl.s,
            l: hsl.l
        };
    }

    // Uyumlu renk seçimi
    selectCompatibleColor(harmonyType) {
        // Aktif durumu güncelle
        document.querySelectorAll('.compatible-color').forEach(c => {
            c.classList.remove('active');
        });
        document.querySelector(`[data-harmony="${harmonyType}"]`).classList.add('active');

        // Seçilen rengi al
        const preview = document.getElementById(`${harmonyType}Preview`);
        const selectedColor = preview.dataset.color;

        if (selectedColor) {
            // Ana renk kodlarını güncelle
            const hexCode = document.getElementById('hexCode');
            const rgbCode = document.getElementById('rgbCode');
            
            if (hexCode) hexCode.value = selectedColor.toUpperCase();
            
            const rgb = this.hexToRgb(selectedColor);
            if (rgbCode && rgb) {
                rgbCode.value = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
            }

            // Ana color picker'ı güncelle
            const colorPicker = document.getElementById('colorPicker');
            if (colorPicker) colorPicker.value = selectedColor;

            // Ana renk preview'ını güncelle
            const mainPreview = document.getElementById('colorPreview');
            if (mainPreview) mainPreview.style.backgroundColor = selectedColor;

            // Renk tonlamalarını güncelle
            this.updateColorVariations(selectedColor);

            // Uyumlu renkleri güncelle
            this.updateCompatibleColors(selectedColor);

            // Hex kodu otomatik kopyala
            this.autocopyhexCode(selectedColor.toUpperCase());
        }
    }

    calculateCompatibleColors(baseColor) {
        // Bu fonksiyon artık kullanılmıyor, updateCompatibleColors kullanılıyor
        return [];
    }

    displayCompatibleColors(colors) {
        // Bu fonksiyon artık kullanılmıyor, updateCompatibleColors kullanılıyor
    }

    // Input'tan gelen renk ile tüm sistemi güncelle
    updateColorFromInput(hexColor) {
        // Ana renk preview'ını güncelle
        const preview = document.getElementById('colorPreview');
        if (preview) preview.style.backgroundColor = hexColor;

        // Color picker'ı güncelle
        const colorPicker = document.getElementById('colorPicker');
        if (colorPicker) colorPicker.value = hexColor;

        // Diğer input'u güncelle
        const rgb = this.hexToRgb(hexColor);
        if (rgb) {
            const hexCodeInput = document.getElementById('hexCode');
            const rgbCodeInput = document.getElementById('rgbCode');
            
            if (hexCodeInput && hexCodeInput.value.toUpperCase() !== hexColor.toUpperCase()) {
                hexCodeInput.value = hexColor.toUpperCase();
            }
            
            if (rgbCodeInput) {
                const rgbString = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
                if (rgbCodeInput.value !== rgbString) {
                    rgbCodeInput.value = rgbString;
                }
            }
        }

        // Renk tonlamalarını güncelle
        this.updateColorVariations(hexColor);

        // Uyumlu renkleri güncelle
        this.updateCompatibleColors(hexColor);

        // Renk variations'da active state'i sıfırla
        document.querySelectorAll('.color-variation').forEach(v => {
            v.classList.remove('active');
        });
        document.querySelector('[data-variation="original"]').classList.add('active');

        // Compatible colors'da active state'i sıfırla
        document.querySelectorAll('.compatible-color').forEach(c => {
            c.classList.remove('active');
        });
    }

    // Input error handling
    showInputError(inputId, message) {
        const input = document.getElementById(inputId);
        if (input) {
            input.style.borderColor = '#e74c3c';
            input.style.backgroundColor = '#fdf2f2';
            input.title = message;
        }
        this.showStatus(message, 'error');
    }

    // Clear input error
    clearInputError(inputId) {
        const input = document.getElementById(inputId);
        if (input) {
            input.style.borderColor = '#e1e8ed';
            input.style.backgroundColor = 'white';
            input.title = inputId === 'hexCode' ? 'Enter hex code (e.g: #FF5733)' : 'Enter RGB code (e.g: rgb(255, 87, 51))';
        }
    }

    // Hex code input handling
    handleHexInput(value, isBlur = false) {
        // Clean hex format
        let hexValue = value.trim();
        
        // Add # symbol
        if (hexValue && !hexValue.startsWith('#')) {
            hexValue = '#' + hexValue;
        }
        
        // Validate hex format
        const hexPattern = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
        
        if (hexPattern.test(hexValue)) {
            // Valid hex code
            this.updateColorFromInput(hexValue);
            this.clearInputError('hexCode');
        } else if (isBlur && hexValue) {
            // Show error on blur event if invalid format
            this.showInputError('hexCode', 'Invalid hex format (e.g: #FF5733)');
        }
    }

    // RGB code input handling
    handleRgbInput(value, isBlur = false) {
        let rgbValue = value.trim();
        
        // Validate RGB format
        const rgbPattern = /^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/;
        const match = rgbValue.match(rgbPattern);
        
        if (match) {
            const r = parseInt(match[1]);
            const g = parseInt(match[2]);
            const b = parseInt(match[3]);
            
            // Check that RGB values are between 0-255
            if (r >= 0 && r <= 255 && g >= 0 && g <= 255 && b >= 0 && b <= 255) {
                // Convert RGB to hex
                const hexValue = this.rgbToHex(r, g, b);
                this.updateColorFromInput(hexValue);
                this.clearInputError('rgbCode');
            } else {
                if (isBlur) {
                    this.showInputError('rgbCode', 'RGB values must be between 0-255');
                }
            }
        } else if (isBlur && rgbValue) {
            // Show error on blur event if invalid format
            this.showInputError('rgbCode', 'Invalid RGB format (e.g: rgb(255, 87, 51))');
        }
    }
}

// Extension'ı başlat
document.addEventListener('DOMContentLoaded', () => {
    new ExtensionController();
});

// Popup kapatılırken inspector'ı temizle
window.addEventListener('beforeunload', () => {
    chrome.runtime.sendMessage({ action: 'stopInspecting' }).catch(() => {});
}); 