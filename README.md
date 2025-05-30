# Renk Seçici - Tarayıcı Eklentisi

Bu basit ve kullanışlı tarayıcı eklentisi, renk seçmenizi ve seçilen rengin hex kodunu kopyalamanızı sağlar.

## 🌟 Özellikler

- ✅ Basit ve temiz arayüz
- ✅ Renk seçici ile kolay renk seçimi
- ✅ Hex kod görüntüleme
- ✅ Tek tıkla panoya kopyalama
- ✅ Türkçe karakter desteği
- ✅ Klavye kısayolları (Ctrl+C)
- ✅ Responsive tasarım
- ✅ İkon gerektirmez

## 📁 Dosya Yapısı

```
HelperExtension/
├── manifest.json      # Eklenti yapılandırma dosyası
├── popup.html         # Ana arayüz dosyası
├── popup.js          # JavaScript işlevsellik dosyası
├── styles.css        # Stil dosyası
└── README.md         # Bu dosya
```

## 🔧 Dosyalar Arası İlişkiler

### manifest.json
- Eklentinin temel bilgilerini içerir
- Chrome Extension API v3 kullanır
- `popup.html` dosyasını ana popup olarak tanımlar
- Panoya yazma izni (`clipboardWrite`) verir

### popup.html
- Ana kullanıcı arayüzünü tanımlar
- `styles.css` dosyasını stil için bağlar
- `popup.js` dosyasını işlevsellik için bağlar
- Türkçe karakter desteği için UTF-8 kodlaması kullanır

### popup.js
- Renk seçici ve kopyalama işlevselliğini sağlar
- Modern async/await yapısını kullanır
- Eski tarayıcılar için fallback metotları içerir
- Klavye kısayolları desteği sunar

### styles.css
- Modern ve minimal tasarım stilleri
- Gradient arka plan ve cam efekti
- Responsive tasarım kuralları
- Animasyonlar ve geçiş efektleri

## 🚀 Kurulum ve Test Etme

### Chrome/Edge için:

1. **Geliştirici Modunu Etkinleştirin:**
   - Chrome: `chrome://extensions/` adresine gidin
   - Edge: `edge://extensions/` adresine gidin
   - Sağ üst köşedeki "Geliştirici modu"nu açın

2. **Eklentiyi Yükleyin:**
   - "Paketlenmemiş öğeyi yükle" butonuna tıklayın
   - Bu klasörü (`HelperExtension`) seçin

3. **Test Edin:**
   - Tarayıcı araç çubuğunda eklenti simgesi görünecek
   - Simgeye tıklayarak renk seçiciyi açın
   - Renk seçin ve hex kodunu kopyalayın

### Firefox için:

1. **Geçici Yükleme:**
   - `about:debugging` adresine gidin
   - "Bu Firefox" sekmesine tıklayın
   - "Geçici Eklenti Yükle" butonuna tıklayın
   - `manifest.json` dosyasını seçin

## 💡 Kullanım

1. **Renk Seçin:** Renk seçici ile istediğiniz rengi seçin
2. **Hex Kodunu Görün:** Seçilen rengin hex kodu otomatik olarak gösterilir
3. **Kopyalayın:** 
   - Kopyala butonuna (📋) tıklayın
   - Hex kod alanına tıklayın
   - Veya Ctrl+C kısayolunu kullanın

## 🎨 Özelleştirme

Eklentiyi özelleştirmek için:

- **Renkler:** `styles.css` dosyasındaki renk değerlerini değiştirin
- **Boyutlar:** `.container` class'ındaki genişlik/yükseklik değerlerini ayarlayın
- **Dil:** `popup.html` ve `popup.js` dosyalarındaki metinleri değiştirin

## 🔒 Güvenlik

- Eklenti sadece panoya yazma izni kullanır
- Hiçbir dış sunucuya veri gönderilmez
- Tamamen yerel olarak çalışır

## 🐛 Sorun Giderme

- **Kopyalama çalışmıyor:** Tarayıcının HTTPS sayfasında olduğundan emin olun
- **Eklenti görünmüyor:** Geliştirici modunun açık olduğunu kontrol edin
- **Stil problemleri:** Tarayıcı önbelleğini temizleyin

## 📱 Tarayıcı Uyumluluğu

- ✅ Chrome 88+
- ✅ Edge 88+
- ✅ Firefox 89+ (manifest.json'u v2'ye çevirin)
- ✅ Opera 74+

## 🤝 Katkıda Bulunma

Bu proje açık kaynak kodludur. İyileştirme önerilerinizi memnuniyetle karşılarız.

---

**Not:** Bu eklenti manifest v3 kullanır ve modern tarayıcılarla uyumludur. 