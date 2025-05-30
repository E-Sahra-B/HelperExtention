// Enhanced Color, Font & Size Picker Extension
// Modern tab-based interface with background script state management

class ExtensionController {
    constructor() {
        this.isColorPickerOpen = false;
        this.isFontInspectorActive = false;
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

        // Color variations'a tıklama event'i
        document.querySelectorAll('.color-variation').forEach(variation => {
            variation.addEventListener('click', (e) => {
                const variationType = e.currentTarget.dataset.variation;
                this.selectColorVariation(variationType);
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

        // Klavye kısayolları
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardShortcuts(e);
        });

        // Background script'ten mesajları dinle
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            if (message.action === 'elementSelected') {
                this.updateFontDisplay(message.data);
                this.setInspectorState(false);
            } else if (message.action === 'inspectionStarted') {
                this.setInspectorState(true);
            } else if (message.action === 'inspectionStopped') {
                this.setInspectorState(false);
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

        // Hex kodu otomatik kopyala
        this.autocopyhexCode(color.toUpperCase());
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

    lightenDarkenColor(color, amount) {
        const rgb = this.hexToRgb(color);
        if (!rgb) return color;

        // RGB değerlerini HSL'e çevir
        const hsl = this.rgbToHsl(rgb.r, rgb.g, rgb.b);
        
        // Lightness'ı değiştir
        hsl.l = Math.max(0, Math.min(1, hsl.l + (amount * 0.15)));
        
        // HSL'i RGB'ye geri çevir
        const newRgb = this.hslToRgb(hsl.h, hsl.s, hsl.l);
        
        return this.rgbToHex(Math.round(newRgb.r), Math.round(newRgb.g), Math.round(newRgb.b));
    }

    rgbToHsl(r, g, b) {
        r /= 255; g /= 255; b /= 255;
        const max = Math.max(r, g, b), min = Math.min(r, g, b);
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
        return { h, s, l };
    }

    hslToRgb(h, s, l) {
        let r, g, b;
        if (s === 0) {
            r = g = b = l;
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
        return { r: r * 255, g: g * 255, b: b * 255 };
    }

    updateColorVariations(baseColor) {
        const variations = {
            lighter2: this.lightenDarkenColor(baseColor, 2),
            lighter1: this.lightenDarkenColor(baseColor, 1),
            original: baseColor,
            darker1: this.lightenDarkenColor(baseColor, -1),
            darker2: this.lightenDarkenColor(baseColor, -2)
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
            this.setInspectorState(false);
            try {
                await chrome.runtime.sendMessage({ action: 'stopInspecting' });
            } catch (error) {
                console.log('Stop inspecting failed:', error);
            }
            return;
        }

        try {
            // Inspector'ı başlat
            this.setInspectorState(true);

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
            
            this.setInspectorState(false);
        }
    }

    setInspectorState(active) {
        this.isFontInspectorActive = active;
        const inspectBtn = document.getElementById('inspectFont');
        
        if (inspectBtn) {
            if (active) {
                inspectBtn.classList.add('active');
                inspectBtn.textContent = '❌ İptal Et';
            } else {
                inspectBtn.classList.remove('active');
                inspectBtn.textContent = '🔍 Element Seç';
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
                this.setInspectorState(false);
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
    }

// Extension'ı başlat
document.addEventListener('DOMContentLoaded', () => {
    new ExtensionController();
});

// Popup kapatılırken inspector'ı temizle
window.addEventListener('beforeunload', () => {
    chrome.runtime.sendMessage({ action: 'stopInspecting' }).catch(() => {});
}); 