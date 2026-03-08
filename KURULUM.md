# 🚀 WhatsApp Sipariş Sistemi - Hızlı Kurulum Rehberi

## 📦 1. Adım: Bağımlılıkları Yükle

Proje klasöründe terminal açın ve şu komutu çalıştırın:

```bash
cd C:\Users\melih\Desktop\whatsapp-order-system
npm install
```

Bu komut tüm gerekli paketleri (Express, MongoDB, TypeScript, vb.) yükleyecek.

## ⚙️ 2. Adım: Environment Ayarları

1. `.env.example` dosyasını kopyalayıp `.env` adıyla kaydedin
2. `.env` dosyasını açın ve şu değerleri doldurun:

```env
# WhatsApp Business API bilgilerinizi buraya girin
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id_here
WHATSAPP_ACCESS_TOKEN=your_access_token_here
WHATSAPP_VERIFY_TOKEN=my_secret_verify_token_123
WHATSAPP_BUSINESS_ACCOUNT_ID=your_business_account_id_here

# MongoDB bağlantısı (varsayılan olarak bırakabilirsiniz)
MONGODB_URI=mongodb://localhost:27017/whatsapp-order-system

# JWT Secret (Mutlaka değiştirin!)
JWT_SECRET=super_secret_key_change_this_12345
```

### 📱 WhatsApp Business API Bilgilerini Nereden Alacaksınız?

1. [Meta for Developers](https://developers.facebook.com/) adresine gidin
2. Uygulama oluşturun veya mevcut uygulamanızı seçin
3. WhatsApp > Getting Started bölümüne gidin
4. Şu bilgileri kopyalayın:
   - **Phone Number ID** → `WHATSAPP_PHONE_NUMBER_ID`
   - **Temporary Access Token** veya kalıcı token → `WHATSAPP_ACCESS_TOKEN`
   - **Business Account ID** → `WHATSAPP_BUSINESS_ACCOUNT_ID`
5. `WHATSAPP_VERIFY_TOKEN` için istediğiniz bir şifre belirleyin

## 🗄️ 3. Adım: MongoDB Kurulumu

### Windows için MongoDB Kurulumu:

1. [MongoDB Download](https://www.mongodb.com/try/download/community) adresinden indirin
2. Kurulum sihirbazını takip edin
3. MongoDB Compass'ı da kurun (opsiyonel ama tavsiye edilir)

### MongoDB'yi Başlatma:

**Yöntem 1: Windows Service**
MongoDB kurulumda service olarak eklendiyse otomatik çalışır.

**Yöntem 2: Manuel Başlatma**
```bash
mongod
```

**MongoDB çalışıyor mu kontrol:**
```bash
mongo
```

## 🔨 4. Adım: Projeyi Çalıştırma

### Development Mode (Geliştirme):
```bash
npm run dev
```

### Production Mode:
```bash
npm run build
npm start
```

## ✅ 5. Adım: Test Etme

### 1. API Test:
Tarayıcınızda açın: http://localhost:3000

Şunu görmelisiniz:
```json
{
  "status": "OK",
  "message": "WhatsApp Sipariş Sistemi API - Çalışıyor",
  "version": "1.0.0"
}
```

### 2. Admin Panel Test:
Tarayıcınızda açın: http://localhost:3000/admin

Giriş bilgileri:
- Kullanıcı: `admin`
- Şifre: `admin123`

### 3. WhatsApp Webhook Ayarı:

**Önemli:** WhatsApp webhook için public URL gereklidir. Lokal test için:

#### Ngrok Kullanımı (Önerilen):

1. [Ngrok İndir](https://ngrok.com/download)
2. Ngrok'u başlatın:
```bash
ngrok http 3000
```
3. Size verilen HTTPS URL'ini alın (örn: https://abc123.ngrok.io)
4. Meta Developer Console > WhatsApp > Configuration > Webhook'a gidin
5. Callback URL: `https://abc123.ngrok.io/webhook`
6. Verify Token: `.env` dosyasındaki `WHATSAPP_VERIFY_TOKEN` değeri
7. "Verify and Save" tıklayın
8. "messages" eventini subscribe edin

## 🎯 6. Adım: İlk Restoran Ekleme

### Postman veya cURL ile:

```bash
# 1. Giriş yap ve token al
curl -X POST http://localhost:3000/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Token'ı kopyalayın ve aşağıdaki komutta kullanın

# 2. Restoran ekle
curl -X POST http://localhost:3000/api/admin/restaurants \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "name": "Lezzet Durağı",
    "description": "Kebap & Türk Mutfağı",
    "type": "restaurant",
    "emoji": "🍖",
    "phone": "0555 123 4567",
    "address": "İstanbul, Türkiye",
    "isActive": true,
    "workingHours": {
      "open": "09:00",
      "close": "23:00"
    }
  }'

# 3. Kategori ekle (restaurant ID'yi yukarıdaki yanıttan alın)
curl -X POST http://localhost:3000/api/admin/categories \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "restaurantId": "RESTAURANT_ID_HERE",
    "name": "Kebaplar",
    "description": "Izgara kebap çeşitleri",
    "emoji": "🍖",
    "order": 1,
    "isActive": true
  }'

# 4. Ürün ekle
curl -X POST http://localhost:3000/api/admin/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "categoryId": "CATEGORY_ID_HERE",
    "restaurantId": "RESTAURANT_ID_HERE",
    "name": "Adana Kebap",
    "description": "Közde pişmiş - 250g",
    "price": 150,
    "isAvailable": true,
    "order": 1
  }'
```

## 📱 7. Adım: WhatsApp'tan Test

1. WhatsApp Business numaranıza "Merhaba" yazın
2. Ana menü gelecek
3. "Sipariş Ver" seçin
4. Restoranınızı seçin
5. Kategori seçin
6. Ürün ekleyin
7. Siparişi tamamlayın

## 🎉 Tebrikler!

Sisteminiz hazır! Artık WhatsApp üzerinden sipariş alabilirsiniz.

## 🔧 Sorun Giderme

### MongoDB Bağlanamıyor:
```bash
# MongoDB'nin çalıştığını kontrol edin
mongo

# Eğer hata veriyorsa, MongoDB'yi başlatın
mongod
```

### Port 3000 kullanımda:
`.env` dosyasında PORT değişkenini değiştirin:
```env
PORT=5000
```

### TypeScript Hataları:
```bash
npm install
npm run build
```

### WhatsApp Mesaj Gelmiyor:
1. Webhook URL'inin doğru olduğunu kontrol edin
2. HTTPS kullandığınızdan emin olun (ngrok)
3. Verify Token'ın doğru olduğunu kontrol edin
4. Meta Console'da "messages" event'ine subscribe olduğunuzdan emin olun

## 📞 Destek

Sorularınız için:
- README.md dosyasına bakın
- GitHub Issues kullanın
- API dokümantasyonunu inceleyin

---

**Hazırlayan:** WhatsApp Order System
**Versiyon:** 1.0.0
**Tarih:** 2026