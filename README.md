# WhatsApp Sipariş Sistemi

Meta Business API entegrasyonlu profesyonel WhatsApp sipariş sistemi. Restoran, cafe ve yemek işletmeleri için tam teşekküllü sipariş yönetim platformu.

## 🚀 Özellikler

### WhatsApp Entegrasyonu
- ✅ Meta Cloud API ile tam entegrasyon
- ✅ İnteraktif mesaj desteği (List, Button)
- ✅ Otomatik mesaj yanıtlama
- ✅ Sipariş takip sistemi
- ✅ Sepet yönetimi
- ✅ Session yönetimi

### Yönetim Paneli
- ✅ Restoran ekleme/düzenleme/silme
- ✅ Kategori yönetimi (Her işletme için özel)
- ✅ Ürün yönetimi
- ✅ Sipariş takibi ve durum güncelleme
- ✅ İstatistikler ve raporlama
- ✅ JWT Authentication

### Veritabanı
- ✅ MongoDB ile esnek yapı
- ✅ İlişkisel modeller
- ✅ Otomatik sipariş numarası
- ✅ Session auto-cleanup

## 📋 Gereksinimler

- Node.js 18+
- MongoDB 6+
- WhatsApp Business Account
- Meta Developer Account

## 🛠️ Kurulum

### 1. Bağımlılıkları Yükle

```bash
cd whatsapp-order-system
npm install
```

### 2. Environment Ayarları

`.env.example` dosyasını `.env` olarak kopyalayın ve değerleri doldurun:

```bash
cp .env.example .env
```

**Önemli:** Aşağıdaki değerleri mutlaka doldurun:

```env
# WhatsApp Business API Configuration
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id_here
WHATSAPP_ACCESS_TOKEN=your_access_token_here
WHATSAPP_VERIFY_TOKEN=your_verify_token_here
WHATSAPP_BUSINESS_ACCOUNT_ID=your_business_account_id_here

# MongoDB
MONGODB_URI=mongodb://localhost:27017/whatsapp-order-system

# JWT Secret (Değiştirin!)
JWT_SECRET=your_super_secret_key_change_this_in_production
```

### 3. MongoDB'yi Başlat

```bash
# MongoDB'nin çalıştığından emin olun
mongod
```

### 4. Uygulamayı Başlat

Development:
```bash
npm run dev
```

Production:
```bash
npm run build
npm start
```

## 🔐 WhatsApp Business API Kurulumu

### Meta Developer Console'da:

1. [Meta for Developers](https://developers.facebook.com/) adresine gidin
2. Yeni bir uygulama oluşturun veya mevcut uygulamanızı seçin
3. WhatsApp Business Platform ekleyin
4. Telefon numaranızı ekleyin ve doğrulayın
5. Aşağıdaki bilgileri alın:
   - `WHATSAPP_PHONE_NUMBER_ID`: Telefon numarası ID'si
   - `WHATSAPP_ACCESS_TOKEN`: Kalıcı erişim token'ı
   - `WHATSAPP_BUSINESS_ACCOUNT_ID`: Business hesap ID'si

### Webhook Konfigürasyonu:

1. Meta Developer Console'da Webhooks bölümüne gidin
2. Webhook URL'ini ayarlayın: `https://your-domain.com/webhook`
3. Verify Token: `.env` dosyasındaki `WHATSAPP_VERIFY_TOKEN` ile aynı olmalı
4. Subscribe to: `messages` event'ini seçin

## 📱 Kullanım

### WhatsApp Üzerinden:

1. WhatsApp Business numaranıza "Merhaba" yazın
2. Ana menü açılacak
3. "Sipariş Ver" seçeneğini seçin
4. Restoran seçin
5. Kategori seçin
6. Ürün ekleyin
7. Siparişi tamamlayın

### Admin Panel:

Admin paneline erişim: `http://localhost:3000/admin`

**Varsayılan Giriş Bilgileri:**
- Kullanıcı adı: `admin`
- Şifre: `admin123`

⚠️ **ÖNEMLİ:** İlk girişten sonra şifrenizi mutlaka değiştirin!

## 🔧 API Endpoints

### Webhook
- `GET /webhook` - Webhook doğrulama
- `POST /webhook` - Mesaj alma

### Admin API

#### Authentication
- `POST /api/admin/login` - Giriş yap

#### Restoranlar
- `GET /api/admin/restaurants` - Tüm restoranlar
- `POST /api/admin/restaurants` - Yeni restoran
- `PUT /api/admin/restaurants/:id` - Restoran güncelle
- `DELETE /api/admin/restaurants/:id` - Restoran sil

#### Kategoriler
- `GET /api/admin/restaurants/:restaurantId/categories` - Restoran kategorileri
- `POST /api/admin/categories` - Yeni kategori
- `PUT /api/admin/categories/:id` - Kategori güncelle
- `DELETE /api/admin/categories/:id` - Kategori sil

#### Ürünler
- `GET /api/admin/categories/:categoryId/products` - Kategori ürünleri
- `GET /api/admin/restaurants/:restaurantId/products` - Restoran ürünleri
- `POST /api/admin/products` - Yeni ürün
- `PUT /api/admin/products/:id` - Ürün güncelle
- `DELETE /api/admin/products/:id` - Ürün sil

#### Siparişler
- `GET /api/admin/orders` - Tüm siparişler
- `GET /api/admin/orders/:id` - Sipariş detayı
- `PUT /api/admin/orders/:id/status` - Sipariş durumu güncelle

#### İstatistikler
- `GET /api/admin/stats/dashboard` - Dashboard istatistikleri

## 📊 Veritabanı Modelleri

### Restaurant
- Restoran bilgileri
- Tip: Restaurant / Cafe
- Çalışma saatleri
- Aktif/Pasif durumu

### Category
- Restorana özel kategoriler
- Emoji desteği
- Sıralama

### Product
- Ürün bilgileri
- Fiyat
- Stok durumu
- Kategori ilişkisi

### Order
- Sipariş bilgileri
- Ürün listesi
- Toplam tutar
- Durum takibi

### WhatsAppSession
- Kullanıcı oturumları
- Sepet bilgisi
- Mevcut adım
- Otomatik temizleme (24 saat)

## 🎯 Sipariş Akışı

1. **Ana Menü**: Kullanıcı "Merhaba" yazar
2. **Restoran Seçimi**: Aktif restoranlar listelenir
3. **Kategori Seçimi**: Seçilen restoran kategorileri gösterilir
4. **Ürün Seçimi**: Kategori ürünleri listelenir
5. **Sepet**: Ürünler sepete eklenir
6. **Sipariş Tamamlama**: Sipariş oluşturulur
7. **Takip**: Sipariş durumu takip edilir

## 🔒 Güvenlik

- JWT Authentication
- Password hashing (bcrypt)
- Environment variables
- CORS yapılandırması
- Input validation

## 📝 Geliştirme

### Proje Yapısı

```
whatsapp-order-system/
├── src/
│   ├── config/
│   │   └── database.ts         # MongoDB bağlantısı
│   ├── models/
│   │   ├── Restaurant.ts       # Restoran modeli
│   │   ├── Category.ts         # Kategori modeli
│   │   ├── Product.ts          # Ürün modeli
│   │   ├── Order.ts            # Sipariş modeli
│   │   ├── User.ts             # Kullanıcı modeli
│   │   └── WhatsAppSession.ts  # Session modeli
│   ├── services/
│   │   ├── whatsappService.ts  # WhatsApp API servisi
│   │   └── messageHandler.ts   # Mesaj işleme servisi
│   ├── routes/
│   │   ├── webhook.ts          # Webhook route'ları
│   │   └── admin.ts            # Admin API route'ları
│   └── server.ts               # Ana server dosyası
├── admin/                      # Admin panel (HTML/CSS/JS)
├── .env.example                # Environment örneği
├── package.json
├── tsconfig.json
└── README.md
```

## 🐛 Hata Ayıklama

### MongoDB bağlantı hatası
```bash
# MongoDB'nin çalıştığından emin olun
sudo systemctl start mongod  # Linux
brew services start mongodb-community  # Mac
```

### WhatsApp API hatası
- Token'ın geçerli olduğundan emin olun
- Phone Number ID'nin doğru olduğunu kontrol edin
- Webhook URL'inin HTTPS olduğundan emin olun (production)

## 📞 Destek

Sorunlar için GitHub Issues kullanın.

## 📄 Lisans

MIT License

## 👨‍💻 Geliştirici Notları

- TypeScript kullanılmıştır
- Mongoose ORM
- Express.js framework
- Meta Cloud API
- JWT authentication
- RESTful API tasarımı

---

**⚡ Önemli Hatırlatmalar:**

1. `.env` dosyasını mutlaka doldurun
2. MongoDB'yi başlatın
3. WhatsApp Business API'yi yapılandırın
4. Webhook URL'ini Meta Console'da ayarlayın
5. Production'da HTTPS kullanın
6. Admin şifresini değiştirin
7. JWT_SECRET'ı güçlü bir değer yapın