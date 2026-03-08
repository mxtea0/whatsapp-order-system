# 📝 .env Dosyası Doldurma Rehberi

`.env` dosyası oluşturuldu ve Desktop'ta `whatsapp-order-system` klasöründe bulunuyor. Şimdi adım adım dolduralım!

---

## 🎯 ADIM 1: Meta Developer Console'a Git

### 1.1 Hesap Oluştur/Giriş Yap
1. Tarayıcınızı açın
2. [https://developers.facebook.com/](https://developers.facebook.com/) adresine gidin
3. Facebook hesabınızla giriş yapın
4. Eğer hesabınız yoksa "Create Account" ile oluşturun

### 1.2 Uygulama Oluştur veya Seç
1. Sağ üstte "My Apps" tıklayın
2. "Create App" tıklayın
3. "Business" tipini seçin
4. Uygulama adı girin (örn: "Sipariş Sistemi")
5. Email girin
6. "Create App" tıklayın

---

## 📱 ADIM 2: WhatsApp Business API Ekle

### 2.1 WhatsApp Ürününü Ekle
1. Sol menüden "Add Product" bulun
2. "WhatsApp" kartını bulun
3. "Set Up" butonuna tıklayın

### 2.2 Telefon Numarası Ekle
1. "WhatsApp" > "Getting Started" sayfasına gidin
2. "Add phone number" tıklayın
3. Telefon numaranızı ekleyin (WhatsApp Business numaranız olmalı)
4. Doğrulama kodunu girin

---

## 🔑 ADIM 3: Gerekli Bilgileri Kopyala

Şimdi `.env` dosyasına ekleyeceğiniz bilgileri alacaksınız:

### 3.1 Phone Number ID Al

**Nereden:**
- WhatsApp > Getting Started sayfasında
- "Phone Number ID" başlığı altında

**Nasıl görünür:**
```
Phone Number ID: 123456789012345
```

**Nereye kopyala:**
```env
WHATSAPP_PHONE_NUMBER_ID=123456789012345
```

### 3.2 Access Token Al

**Nereden:**
- WhatsApp > Getting Started sayfasında
- "Temporary access token" veya "Access token" başlığı altında
- Yanında bir "Copy" butonu var

**Nasıl görünür:**
```
EAAB... (uzun bir token, yaklaşık 200+ karakter)
```

**ÖNEMLİ:** Temporary token 24 saat geçerlidir. Kalıcı token için:
1. WhatsApp > Configuration > Access Tokens
2. "Generate new token" tıklayın
3. "whatsapp_business_messaging" iznini seçin
4. Token'ı kopyalayın

**Nereye kopyala:**
```env
WHATSAPP_ACCESS_TOKEN=EAABwzL...çok_uzun_token...xyz
```

### 3.3 Business Account ID Al

**Nereden:**
- WhatsApp > Getting Started sayfasında
- "WhatsApp Business Account ID" başlığı altında

**Nasıl görünür:**
```
Business Account ID: 987654321098765
```

**Nereye kopyala:**
```env
WHATSAPP_BUSINESS_ACCOUNT_ID=987654321098765
```

### 3.4 Verify Token Belirle

**Bu kısmı SİZ belirliyorsunuz!**

Herhangi bir şifre/token belirleyin. Meta'da webhook kurarken aynı şifreyi kullanacaksınız.

**Örnek:**
```env
WHATSAPP_VERIFY_TOKEN=mySecretToken123
```

**veya şöyle:**
```env
WHATSAPP_VERIFY_TOKEN=RestaurantSystem2024!
```

---

## 🔐 ADIM 4: JWT Secret Değiştir

Güvenlik için JWT_SECRET'ı değiştirin:

**Mevcut (varsayılan):**
```env
JWT_SECRET=super_secret_jwt_key_2024_change_this_now
```

**Değiştirin (örnek):**
```env
JWT_SECRET=MyVerySecretKey2024!@#Restaurant
```

**veya rastgele:**
```env
JWT_SECRET=aB3$kL9@mN2xP7&qR5*wT8
```

---

## ✅ ADIM 5: Final .env Dosyanız

Sonuçta `.env` dosyanız şöyle görünmeli:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/whatsapp-order-system

# WhatsApp Business API Configuration
WHATSAPP_API_URL=https://graph.facebook.com/v18.0
WHATSAPP_PHONE_NUMBER_ID=123456789012345
WHATSAPP_ACCESS_TOKEN=EAABwzLixnjYBO7r9ZCrAd... (çok uzun)
WHATSAPP_VERIFY_TOKEN=mySecretToken123
WHATSAPP_BUSINESS_ACCOUNT_ID=987654321098765

# JWT Secret
JWT_SECRET=MyVerySecretKey2024!@#Restaurant

# Admin Panel
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123

# Upload Configuration
UPLOAD_DIR=uploads
MAX_FILE_SIZE=5242880
```

---

## 📋 ÖZET KONTROL LİSTESİ

Aşağıdakileri doldurduğunuzdan emin olun:

- [ ] `WHATSAPP_PHONE_NUMBER_ID` → Meta'dan aldınız
- [ ] `WHATSAPP_ACCESS_TOKEN` → Meta'dan aldınız (uzun token)
- [ ] `WHATSAPP_BUSINESS_ACCOUNT_ID` → Meta'dan aldınız
- [ ] `WHATSAPP_VERIFY_TOKEN` → Kendiniz belirlediniz
- [ ] `JWT_SECRET` → Değiştirdiniz
- [ ] `MONGODB_URI` → Varsayılan bıraktınız (mongodb://localhost:27017...)
- [ ] `PORT` → 3000 bıraktınız
- [ ] `NODE_ENV` → development bıraktınız

---

## 🚀 SONRAKİ ADIMLAR

`.env` dosyası hazır olduktan sonra:

### 1. MongoDB'yi Başlat
```bash
# Windows'ta MongoDB'yi başlatın
# Eğer service olarak kuruluysa otomatik çalışır
# Manuel başlatmak için:
mongod
```

### 2. Paketleri Yükle
```bash
cd C:\Users\melih\Desktop\whatsapp-order-system
npm install
```

### 3. Sistemi Başlat
```bash
npm run dev
```

### 4. Test Et
- API: http://localhost:3000
- Admin: http://localhost:3000/admin

---

## ❓ SORU-CEVAP

### S: Phone Number ID nereden bulacağım?
**C:** Meta Developer Console > WhatsApp > Getting Started sayfasında, telefon numaranızın altında "Phone Number ID" yazıyor.

### S: Access Token çok uzun mu olmalı?
**C:** Evet, normal. Yaklaşık 200-300 karakter olabilir. Tamamını kopyalayın.

### S: Temporary token mu kalıcı token mi kullanayım?
**C:** Test için temporary yeterli ama production için kalıcı token oluşturun.

### S: Verify Token'ı nereden alacağım?
**C:** Bunu SİZ belirliyorsunuz. İstediğiniz bir şifre/token yazın. Webhook kurarken aynısını kullanacaksınız.

### S: MongoDB URI değiştirmeli miyim?
**C:** Hayır, varsayılan olarak bırakın: `mongodb://localhost:27017/whatsapp-order-system`

### S: Port 3000'i kullanıyor başka uygulama, değiştirebilir miyim?
**C:** Evet, PORT değerini değiştirin (örn: 5000)

---

## 🎯 ÖNEMLİ NOTLAR

1. ⚠️ `.env` dosyasını asla paylaşmayın (token'larınız var)
2. ⚠️ Git'e pushlarsanız `.gitignore` dosyasında `.env` olduğundan emin olun
3. ✅ Access Token'ınızı güvende tutun
4. ✅ JWT_SECRET'ı mutlaka değiştirin
5. ✅ Production'da daha güçlü şifreler kullanın

---

Hazırsınız! .env dosyası doldurulduktan sonra sistemi başlatabilirsiniz! 🚀