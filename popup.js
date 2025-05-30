// Renk Seçici - Ana JavaScript Dosyası
// Bu dosya renk seçme ve kopyalama işlevselliğini sağlar

document.addEventListener('DOMContentLoaded', function() {
    // DOM elementlerini seç
    const colorPicker = document.getElementById('colorPicker');
    const hexCode = document.getElementById('hexCode');
    const colorPreview = document.getElementById('colorPreview');
    const copyBtn = document.getElementById('copyBtn');
    const status = document.getElementById('status');

    // Başlangıç rengi ayarla
    updateColorDisplay(colorPicker.value);

    // Renk seçici değiştiğinde çalışacak fonksiyon
    colorPicker.addEventListener('input', function() {
        updateColorDisplay(this.value);
    });

    // Renk görünümünü güncelle
    function updateColorDisplay(color) {
        hexCode.value = color.toUpperCase();
        colorPreview.style.backgroundColor = color;
    }

    // Kopyalama butonu için olay dinleyici
    copyBtn.addEventListener('click', function() {
        copyToClipboard(hexCode.value);
    });

    // Hex kodu input alanına tıklandığında da kopyala
    hexCode.addEventListener('click', function() {
        this.select();
        copyToClipboard(this.value);
    });

    // Panoya kopyalama fonksiyonu
    async function copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            showStatus('Renk kodu kopyalandı: ' + text, 'success');
        } catch (err) {
            // Fallback method for older browsers
            fallbackCopyTextToClipboard(text);
        }
    }

    // Eski tarayıcılar için fallback kopyalama metodu
    function fallbackCopyTextToClipboard(text) {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.top = "0";
        textArea.style.left = "0";
        textArea.style.position = "fixed";

        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();

        try {
            const successful = document.execCommand('copy');
            if (successful) {
                showStatus('Renk kodu kopyalandı: ' + text, 'success');
            } else {
                showStatus('Kopyalama başarısız oldu', 'error');
            }
        } catch (err) {
            showStatus('Kopyalama desteklenmiyor', 'error');
        }

        document.body.removeChild(textArea);
    }

    // Durum mesajı göster
    function showStatus(message, type) {
        status.textContent = message;
        status.className = 'status ' + type;
        status.style.display = 'block';

        // 2 saniye sonra mesajı gizle
        setTimeout(() => {
            status.style.display = 'none';
            status.className = 'status';
        }, 2000);
    }

    // Klavye kısayolları
    document.addEventListener('keydown', function(e) {
        // Ctrl+C veya Cmd+C ile kopyala
        if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
            e.preventDefault();
            copyToClipboard(hexCode.value);
        }
    });
}); 