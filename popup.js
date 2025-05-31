// Enhanced Color, Font & Size Picker Extension
// Modern tab-based interface with background script state management

class ExtensionController {
    constructor() {
        this.isColorPickerOpen = false;
        this.isFontInspectorActive = false;
        this.isSpacingInspectorActive = false;
        this.currentTab = 'color';
        this.currentTabId = null;
        
        this.initializeUI();
        this.setupEventListeners();
        this.loadStateFromBackground();
    }

    async loadStateFromBackground() {
        try {
            const response = await chrome.runtime.sendMessage({ action: 'getState' });
            if (response?.state) {
                // Font bilgilerini yükle
                if (response.state.lastElementData) {
                    this.updateFontDisplay(response.state.lastElementData);
                }
                // Spacing bilgilerini yükle
                if (response.state.lastSpacingData) {
                    this.updateSpacingDisplay(response.state.lastSpacingData);
                }
            }
        } catch (error) {
            console.log('State loading failed:', error);
            // Extension yeniden yüklenmiş olabilir, sessiz bir şekilde devam et
        }
    }

    initializeUI() {
        // İlk tab'ı aktif et
        this.switchTab('color');
        
        // Renk seçici başlangıç değeri
        const colorPicker = document.getElementById('colorPicker');
        const initialColor = colorPicker.value;
        this.updateColorDisplay(initialColor);
    }

    setupEventListeners() {
        // Tab geçişleri
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchTab(e.currentTarget.dataset.tab);
            });
        });

        // Renk seçici - gizli input
    const colorPicker = document.getElementById('colorPicker');
        colorPicker.addEventListener('input', (e) => {
            this.updateColorDisplay(e.target.value);
        });

        // Color preview'a tıklayınca color picker'ı aç
        const colorPreview = document.getElementById('colorPreview');
        if (colorPreview) {
            colorPreview.addEventListener('click', () => {
                colorPicker.click();
            });
        }

        // Hex kod input'una yazılan değerleri dinle
        const hexCodeInput = document.getElementById('hexCode');
        if (hexCodeInput) {
            hexCodeInput.addEventListener('input', (e) => {
                this.handleHexInput(e.target.value);
            });
            hexCodeInput.addEventListener('blur', (e) => {
                this.handleHexInput(e.target.value, true);
            });
        }

        // RGB kod input'una yazılan değerleri dinle
        const rgbCodeInput = document.getElementById('rgbCode');
        if (rgbCodeInput) {
            rgbCodeInput.addEventListener('input', (e) => {
                this.handleRgbInput(e.target.value);
            });
            rgbCodeInput.addEventListener('blur', (e) => {
                this.handleRgbInput(e.target.value, true);
            });
        }

        // Color variations'a tıklama event'i
        document.querySelectorAll('.color-variation').forEach(variation => {
            variation.addEventListener('click', (e) => {
                const variationType = e.currentTarget.dataset.variation;
                this.selectColorVariation(variationType);
            });
        });

        // Compatible colors'a tıklama event'i
        document.querySelectorAll('.compatible-color').forEach(compatible => {
            compatible.addEventListener('click', (e) => {
                const harmonyType = e.currentTarget.dataset.harmony;
                this.selectCompatibleColor(harmonyType);
            });
        });

        // Copyable input'lara click event ekle
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('copyable-input')) {
                this.copyInputValue(e.target);
            }
        });

        // Inspect butonları
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

        // Klavye kısayolları
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardShortcuts(e);
        });

        // Background script'ten mesajları dinle
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
                // Hangi inspector aktif olduğunu kontrol et
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
        // Önceki tab'ı deaktif et
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelectorAll('.tab-panel').forEach(panel => {
            panel.classList.remove('active');
        });

        // Yeni tab'ı aktif et
        const tabBtn = document.querySelector(`[data-tab="${tabName}"]`);
        const tabPanel = document.getElementById(`${tabName}-panel`);
        
        if (tabBtn && tabPanel) {
            tabBtn.classList.add('active');
            tabPanel.classList.add('active');
            this.currentTab = tabName;
        }
    }

    updateColorDisplay(color) {
        // Ana renk preview'ını güncelle
        const preview = document.getElementById('colorPreview');
        if (preview) preview.style.backgroundColor = color;

        // Hex ve RGB kodlarını güncelle
    const hexCode = document.getElementById('hexCode');
        const rgbCode = document.getElementById('rgbCode');
        
        if (hexCode) hexCode.value = color.toUpperCase();
        
        // Hex'i RGB'ye çevir
        const rgb = this.hexToRgb(color);
        if (rgbCode && rgb) {
            rgbCode.value = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
        }

        // Renk tonlamalarını güncelle
        this.updateColorVariations(color);

        // Uyumlu renkleri güncelle
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

    // Yeni HSL bazlı renk tonlama fonksiyonu
    adjustColorLightness(hexColor, amount) {
        // Hex'i RGB'ye çevir
        let r = parseInt(hexColor.substring(1, 3), 16);
        let g = parseInt(hexColor.substring(3, 5), 16);
        let b = parseInt(hexColor.substring(5, 7), 16);

        // RGB'yi HSL'ye çevir
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

        // Lightness değerini ayarla
        l += amount / 100;
        l = Math.min(1, Math.max(0, l));

        // HSL'yi tekrar RGB'ye çevir
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

        // RGB'yi tekrar Hex'e çevir
        r = Math.round(r * 255);
        g = Math.round(g * 255);
        b = Math.round(b * 255);
        
        return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
    }

    updateColorVariations(baseColor) {
        // Yeni HSL lightness bazlı renk tonlamaları oluştur
        const variations = {
            lighter2: this.adjustColorLightness(baseColor, 20),  // %20 daha açık
            lighter1: this.adjustColorLightness(baseColor, 10),  // %10 daha açık
            original: baseColor,                                 // Orijinal
            darker1: this.adjustColorLightness(baseColor, -10),  // %10 daha koyu
            darker2: this.adjustColorLightness(baseColor, -20)   // %20 daha koyu
        };

        // Her tonlamayı güncelle
        Object.keys(variations).forEach(key => {
            const preview = document.getElementById(`${key}Preview`);
            if (preview) {
                preview.style.backgroundColor = variations[key];
                preview.dataset.color = variations[key];
            }
        });

        // Orijinal preview'ı da güncelle
        const originalPreview = document.getElementById('originalPreview');
        if (originalPreview) {
            originalPreview.style.backgroundColor = baseColor;
            originalPreview.dataset.color = baseColor;
        }

        // Konsol'da renk tonlarını göster
        console.log('HSL Lightness bazlı renk tonları:', {
            'Çok Açık (+20%)': variations.lighter2,
            'Açık (+10%)': variations.lighter1, 
            'Orijinal (0%)': variations.original,
            'Koyu (-10%)': variations.darker1,
            'Çok Koyu (-20%)': variations.darker2
        });
    }

    selectColorVariation(variationType) {
        // Aktif durumu güncelle
        document.querySelectorAll('.color-variation').forEach(v => {
            v.classList.remove('active');
    });
        document.querySelector(`[data-variation="${variationType}"]`).classList.add('active');

        // Seçilen rengi al
        const preview = document.getElementById(`${variationType}Preview`);
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

            // Hex kodu otomatik kopyala
            this.autocopyhexCode(selectedColor.toUpperCase());
        }
    }

    async toggleFontInspector() {
        const inspectBtn = document.getElementById('inspectFont');
        
        if (this.isFontInspectorActive) {
            // Inspector'ı durdur
            this.setInspectorState('font', false);
            try {
                await chrome.runtime.sendMessage({ action: 'stopInspecting' });
            } catch (error) {
                console.log('Stop inspecting failed:', error);
            }
            return;
        }

        try {
            // Inspector'ı başlat
            this.setInspectorState('font', true);

            // Background script aracılığıyla inspector'ı başlat
            const response = await chrome.runtime.sendMessage({ 
                action: 'startInspecting',
                type: 'font'
            });
            
            if (!response?.success) {
                throw new Error(response?.error || 'Inspector başlatılamadı');
            }
            
        } catch (error) {
            console.error('Font inspector hatası:', error);
            
            // Kullanıcı dostu hata mesajı
            if (error.message?.includes('Could not establish connection')) {
                this.showStatus('Extension yeniden yükleniyor, sayfayı yenileyin (F5)', 'info');
            } else {
                this.showStatus('Element seçici başlatılamadı, sayfayı yenileyin', 'error');
            }
            
            this.setInspectorState('font', false);
        }
    }

    async toggleSpacingInspector() {
        try {
            // Önce mevcut durumu kontrol et
            const currentTabInfo = await chrome.tabs.query({ active: true, currentWindow: true });
            
            if (!currentTabInfo[0]) {
                this.showStatus('Aktif tab bulunamadı', 'error');
                return;
            }

            this.currentTabId = currentTabInfo[0].id;

            if (this.isSpacingInspectorActive) {
                // Inspectoru durdur
                await chrome.tabs.sendMessage(this.currentTabId, { action: 'stopInspecting' });
                this.setInspectorState('spacing', false);
            } else {
                // Font inspector aktifse onu durdur
                if (this.isFontInspectorActive) {
                    await chrome.tabs.sendMessage(this.currentTabId, { action: 'stopInspecting' });
                    this.setInspectorState('font', false);
                }
                
                // Spacing inspector'ı başlat
                await chrome.tabs.sendMessage(this.currentTabId, { action: 'startInspecting' });
                this.isSpacingInspectorActive = true;
                this.setInspectorState('spacing', true);
            }
        } catch (error) {
            console.error('Spacing inspector error:', error);
            this.showStatus('Inspector başlatılamadı. Sayfayı yenileyin.', 'error');
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

        console.log('Updating font display with:', elementData);

        // Element data yapısını kontrol et
        const fontData = elementData.font || {};
        const elementInfo = elementData.element || {};

        // Font size'ı farklı birimlerle hesapla
        const fontSizePx = fontData.size || '16px';
        const fontSizeNum = parseFloat(fontSizePx);
        const fontSizePt = Math.round(fontSizeNum * 0.75 * 100) / 100 + 'pt';
        const fontSizeRem = Math.round(fontSizeNum / 16 * 100) / 100 + 'rem';

        // Input alanlarını doldur
        this.setInputValue('primaryFont', fontData.primaryFont || 'Bilinmiyor');
        this.setInputValue('fontFamily', fontData.family || 'Bilinmiyor');
        this.setInputValue('fontWeight', fontData.weight || 'normal');
        this.setInputValue('fontSizePt', fontSizePt);
        this.setInputValue('fontSizePx', fontSizePx);
        this.setInputValue('fontSizeRem', fontSizeRem);
        this.setInputValue('elementInfo', `${elementInfo.tag}${elementInfo.class ? '.' + elementInfo.class : ''}`);
        this.setInputValue('elementText', elementInfo.text || 'Metin bulunamadı');

        // Renk bilgilerini işle ve hex formatında göster
        const colorData = elementData.colors || {};
        const textColor = this.convertColorToHex(colorData.text || fontData.color || 'rgb(0, 0, 0)');
        const backgroundColor = this.convertColorToHex(colorData.background || fontData.backgroundColor || 'rgba(0, 0, 0, 0)');
        
        this.setInputValue('textColor', textColor);
        this.setInputValue('backgroundColor', backgroundColor);

        // Input alanlarının görsel stillerini güncelle
        this.updateColorInputStyles(colorData.text || fontData.color, colorData.background || fontData.backgroundColor);

        // Font preview'ı güncelle
        const preview = document.getElementById('fontPreview');
        if (preview && fontData.primaryFont && fontSizePx) {
            preview.style.setProperty('--preview-font', fontData.primaryFont);
            preview.style.setProperty('--preview-size', fontSizePx);
            preview.style.fontFamily = fontData.primaryFont;
            preview.style.fontSize = fontSizePx;
            preview.style.fontWeight = fontData.weight || 'normal';
        }

        // Placeholder'ı gizle, içeriği göster
        const placeholder = document.querySelector('#fontInfo .info-placeholder');
        const content = document.querySelector('#fontInfo .info-content');
        
        if (placeholder) placeholder.style.display = 'none';
        if (content) content.style.display = 'block';

        this.showStatus('Font bilgileri alındı!', 'success');
    }

    // Renk formatını hex'e çeviren yardımcı fonksiyon
    convertColorToHex(color) {
        if (!color || color === 'transparent') return 'Şeffaf';
        
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
            
            // Eğer şeffaflık varsa ve tam şeffafsa
            if (a === 0) return 'Şeffaf';
            
            // RGB'yi hex'e çevir
            const hex = this.rgbToHex(r, g, b);
            
            // Eğer alpha değeri varsa belirt
            if (a < 1) {
                return `${hex} (${Math.round(a * 100)}% opak)`;
            }
            
            return hex;
        }
        
        // Diğer renk formatları için (named colors vs.)
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
            
            this.showStatus(`${input.value} kopyalandı!`, 'success');
        } catch (error) {
            console.error('Kopyalama hatası:', error);
            this.showStatus('Kopyalama başarısız', 'error');
        }
    }

    handleKeyboardShortcuts(e) {
        // Tab geçişleri (1, 2)
        if (e.key === '1') {
            e.preventDefault();
            this.switchTab('color');
        } else if (e.key === '2') {
            e.preventDefault();
            this.switchTab('font');
        }
        
        // Kopyalama (Ctrl+C)
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
        
        // Inspector iptal (ESC)
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
            this.showStatus(`${hexValue} kopyalandı!`, 'success');
        } catch (error) {
            console.error('Otomatik kopyalama hatası:', error);
        }
    }

    updateSpacingDisplay(elementData) {
        console.log('Updating spacing display with data:', elementData);
        
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
        this.setInputValue('marginTop', spacing.marginTop || '0px');
        this.setInputValue('marginRight', spacing.marginRight || '0px');
        this.setInputValue('marginBottom', spacing.marginBottom || '0px');
        this.setInputValue('marginLeft', spacing.marginLeft || '0px');
        
        // Padding değerleri
        this.setInputValue('paddingTop', spacing.paddingTop || '0px');
        this.setInputValue('paddingRight', spacing.paddingRight || '0px');
        this.setInputValue('paddingBottom', spacing.paddingBottom || '0px');
        this.setInputValue('paddingLeft', spacing.paddingLeft || '0px');
        
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

        console.log('Uyumlu renkler:', compatibleColors);
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

    // Hex kod input'u işleme
    handleHexInput(value, isBlur = false) {
        // Hex formatını düzenle
        let hexValue = value.trim();
        
        // # işaretini ekle
        if (hexValue && !hexValue.startsWith('#')) {
            hexValue = '#' + hexValue;
        }
        
        // Hex formatını validate et
        const hexPattern = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
        
        if (hexPattern.test(hexValue)) {
            // Geçerli hex kodu
            this.updateColorFromInput(hexValue);
            this.clearInputError('hexCode');
        } else if (isBlur && hexValue) {
            // Blur olayında geçersiz format varsa hata göster
            this.showInputError('hexCode', 'Geçersiz hex format (örn: #FF5733)');
        }
    }

    // RGB kod input'u işleme
    handleRgbInput(value, isBlur = false) {
        let rgbValue = value.trim();
        
        // RGB formatını validate et
        const rgbPattern = /^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/;
        const match = rgbValue.match(rgbPattern);
        
        if (match) {
            const r = parseInt(match[1]);
            const g = parseInt(match[2]);
            const b = parseInt(match[3]);
            
            // RGB değerlerinin 0-255 arasında olduğunu kontrol et
            if (r >= 0 && r <= 255 && g >= 0 && g <= 255 && b >= 0 && b <= 255) {
                // RGB'yi hex'e çevir
                const hexValue = this.rgbToHex(r, g, b);
                this.updateColorFromInput(hexValue);
                this.clearInputError('rgbCode');
            } else {
                if (isBlur) {
                    this.showInputError('rgbCode', 'RGB değerleri 0-255 arasında olmalı');
                }
            }
        } else if (isBlur && rgbValue) {
            // Blur olayında geçersiz format varsa hata göster
            this.showInputError('rgbCode', 'Geçersiz RGB format (örn: rgb(255, 87, 51))');
        }
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

    // Input hata gösterme
    showInputError(inputId, message) {
        const input = document.getElementById(inputId);
        if (input) {
            input.style.borderColor = '#e74c3c';
            input.style.backgroundColor = '#fdf2f2';
            input.title = message;
        }
        this.showStatus(message, 'error');
    }

    // Input hata temizleme
    clearInputError(inputId) {
        const input = document.getElementById(inputId);
        if (input) {
            input.style.borderColor = '#e1e8ed';
            input.style.backgroundColor = 'white';
            input.title = inputId === 'hexCode' ? 'Hex kod girin (örn: #FF5733)' : 'RGB kod girin (örn: rgb(255, 87, 51))';
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