import WhatsAppSession from '../models/WhatsAppSession';
import Restaurant from '../models/Restaurant';
import Category from '../models/Category';
import Product from '../models/Product';
import Order from '../models/Order';
import whatsappService from './whatsappService';

class MessageHandler {
  /**
   * Gelen WhatsApp mesajını işle
   */
  async handleIncomingMessage(from: string, messageType: string, messageContent: any, messageId: string): Promise<void> {
    try {
      // Mesajı okundu olarak işaretle
      await whatsappService.markAsRead(messageId);

      // Kullanıcı session'ını al veya oluştur
      let session = await WhatsAppSession.findOne({ phone: from });
      
      if (!session) {
        session = await WhatsAppSession.create({
          phone: from,
          currentStep: 'menu',
          cart: [],
        });
      }

      // Mesaj tipine göre içeriği al
      let userMessage = '';
      let interactiveReply = null;

      if (messageType === 'text') {
        userMessage = messageContent.toLowerCase().trim();
      } else if (messageType === 'interactive') {
        if (messageContent.type === 'list_reply') {
          interactiveReply = messageContent.list_reply.id;
        } else if (messageContent.type === 'button_reply') {
          interactiveReply = messageContent.button_reply.id;
        }
      }

      // Kullanıcının mevcut adımına göre işlem yap
      if (userMessage === 'merhaba' || userMessage === 'menu' || userMessage === 'ana menü') {
        await this.sendMainMenu(from);
        session.currentStep = 'menu';
      } else if (session.currentStep === 'menu' || interactiveReply === 'siparis_ver') {
        await this.sendRestaurantList(from);
        session.currentStep = 'restaurant';
      } else if (session.currentStep === 'restaurant' && interactiveReply) {
        await this.handleRestaurantSelection(from, interactiveReply, session);
      } else if (session.currentStep === 'category' && interactiveReply) {
        await this.handleCategorySelection(from, interactiveReply, session);
      } else if (session.currentStep === 'product' && interactiveReply) {
        await this.handleProductSelection(from, interactiveReply, session);
      } else if (session.currentStep === 'cart') {
        await this.handleCartActions(from, interactiveReply, session);
      } else if (interactiveReply === 'siparislerim') {
        await this.sendMyOrders(from);
      } else if (interactiveReply === 'siparis_takip') {
        await this.sendOrderTracking(from);
      } else {
        await whatsappService.sendTextMessage(
          from,
          '❓ Anlayamadım. Lütfen "Merhaba" yazarak başlayın veya menüden seçim yapın.'
        );
      }

      // Session'ı güncelle
      session.lastActivity = new Date();
      await session.save();
    } catch (error) {
      console.error('Mesaj işleme hatası:', error);
      await whatsappService.sendTextMessage(
        from,
        '⚠️ Bir hata oluştu. Lütfen tekrar deneyin veya "Merhaba" yazın.'
      );
    }
  }

  /**
   * Ana menüyü gönder
   */
  private async sendMainMenu(to: string): Promise<void> {
    await whatsappService.sendListMessage(
      to,
      '🍽️ Hoş Geldiniz!',
      'Sipariş sistemi menümüze hoş geldiniz. Lütfen yapmak istediğiniz işlemi seçin:',
      'Menüyü Aç',
      [
        {
          title: '📋 Sipariş İşlemleri',
          rows: [
            { id: 'siparis_ver', title: '🛵 Sipariş Ver', description: 'Yeni sipariş oluştur' },
            { id: 'siparislerim', title: '📦 Siparişlerim', description: 'Geçmiş siparişlerini gör' },
            { id: 'siparis_takip', title: '📍 Sipariş Takip', description: 'Son siparişini takip et' },
          ],
        },
        {
          title: '🏪 Restoranlar',
          rows: [
            { id: 'onerileri', title: '⭐ Önerilen Restoranlar', description: 'Popüler ve yüksek puanlı' },
            { id: 'kampanyalar', title: '🔥 Kampanyalı Yerler', description: 'İndirimli siparişler' },
            { id: 'tum_restoranlar', title: '🍽️ Tüm Restoranlar', description: 'Tüm listeyi görüntüle' },
          ],
        },
        {
          title: '❓ Yardım & Bilgi',
          rows: [
            { id: 'yardim', title: '💬 Yardım', description: 'Nasıl sipariş verebilirim?' },
            { id: 'iletisim', title: '📞 İletişim', description: 'Bize ulaşın' },
          ],
        },
      ]
    );
  }

  /**
   * Restoran listesini gönder
   */
  private async sendRestaurantList(to: string): Promise<void> {
    const restaurants = await Restaurant.find({ isActive: true }).sort({ name: 1 });

    if (restaurants.length === 0) {
      await whatsappService.sendTextMessage(
        to,
        '😔 Şu anda aktif restoran bulunmamaktadır. Lütfen daha sonra tekrar deneyin.'
      );
      return;
    }

    const sections = [
      {
        title: '🍽️ Restoranlar',
        rows: restaurants.map((restaurant) => ({
          id: `restaurant_${restaurant._id}`,
          title: `${restaurant.emoji} ${restaurant.name}`,
          description: restaurant.description,
        })),
      },
    ];

    await whatsappService.sendListMessage(
      to,
      '🏪 Restoran Seçimi',
      'Sipariş vermek istediğiniz restoranı seçin:',
      'Restoran Seç',
      sections
    );
  }

  /**
   * Restoran seçimini işle
   */
  private async handleRestaurantSelection(to: string, restaurantId: string, session: any): Promise<void> {
    const id = restaurantId.replace('restaurant_', '');
    const restaurant = await Restaurant.findById(id);

    if (!restaurant) {
      await whatsappService.sendTextMessage(to, '❌ Restoran bulunamadı. Lütfen tekrar deneyin.');
      return;
    }

    // Session'ı güncelle
    session.selectedRestaurantId = restaurant._id;
    session.currentStep = 'category';
    await session.save();

    // Kategorileri getir
    const categories = await Category.find({ restaurantId: restaurant._id, isActive: true }).sort({ order: 1 });

    if (categories.length === 0) {
      await whatsappService.sendTextMessage(
        to,
        `😔 ${restaurant.name} için henüz kategori eklenmemiş. Lütfen başka bir restoran seçin.`
      );
      session.currentStep = 'restaurant';
      await session.save();
      return;
    }

    const sections = [
      {
        title: `📂 ${restaurant.name} Kategorileri`,
        rows: categories.map((category) => ({
          id: `category_${category._id}`,
          title: `${category.emoji} ${category.name}`,
          description: category.description || 'Ürünleri görüntüle',
        })),
      },
    ];

    await whatsappService.sendListMessage(
      to,
      `${restaurant.emoji} ${restaurant.name}`,
      'Kategori seçin ve ürünleri görüntüleyin:',
      'Kategori Seç',
      sections
    );
  }

  /**
   * Kategori seçimini işle
   */
  private async handleCategorySelection(to: string, categoryId: string, session: any): Promise<void> {
    const id = categoryId.replace('category_', '');
    const category = await Category.findById(id);

    if (!category) {
      await whatsappService.sendTextMessage(to, '❌ Kategori bulunamadı.');
      return;
    }

    // Session'ı güncelle
    session.selectedCategoryId = category._id;
    session.currentStep = 'product';
    await session.save();

    // Ürünleri getir
    const products = await Product.find({ categoryId: category._id, isAvailable: true }).sort({ order: 1 });

    if (products.length === 0) {
      await whatsappService.sendTextMessage(
        to,
        `😔 ${category.name} kategorisinde şu anda ürün bulunmamaktadır.`
      );
      session.currentStep = 'category';
      await session.save();
      return;
    }

    const sections = [
      {
        title: `${category.emoji} ${category.name}`,
        rows: products.map((product) => ({
          id: `product_${product._id}`,
          title: product.name,
          description: `${product.price}₺ - ${product.description || 'Sepete ekle'}`,
        })),
      },
    ];

    await whatsappService.sendListMessage(
      to,
      `${category.emoji} ${category.name}`,
      'Ürün seçin ve sepete ekleyin:',
      'Ürün Seç',
      sections
    );
  }

  /**
   * Ürün seçimini işle
   */
  private async handleProductSelection(to: string, productId: string, session: any): Promise<void> {
    const id = productId.replace('product_', '');
    const product = await Product.findById(id);

    if (!product) {
      await whatsappService.sendTextMessage(to, '❌ Ürün bulunamadı.');
      return;
    }

    // Sepete ekle
    const existingItem = session.cart.find((item: any) => item.productId.toString() === product._id.toString());
    
    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      session.cart.push({
        productId: product._id,
        productName: product.name,
        quantity: 1,
        price: product.price,
      });
    }

    session.currentStep = 'cart';
    await session.save();

    // Sepet özeti gönder
    await this.sendCartSummary(to, session);
  }

  /**
   * Sepet özetini gönder
   */
  private async sendCartSummary(to: string, session: any): Promise<void> {
    if (session.cart.length === 0) {
      await whatsappService.sendTextMessage(to, '🛒 Sepetiniz boş.');
      return;
    }

    let cartText = '🛒 *Sepetiniz:*\n\n';
    let total = 0;

    session.cart.forEach((item: any, index: number) => {
      const subtotal = item.price * item.quantity;
      total += subtotal;
      cartText += `${index + 1}. ${item.productName}\n`;
      cartText += `   ${item.quantity} adet x ${item.price}₺ = ${subtotal}₺\n\n`;
    });

    cartText += `\n💰 *Toplam: ${total}₺*`;

    await whatsappService.sendButtonMessage(to, cartText, [
      { id: 'devam_et', title: '➕ Ürün Ekle' },
      { id: 'siparis_tamamla', title: '✅ Siparişi Tamamla' },
      { id: 'sepeti_bosalt', title: '🗑️ Sepeti Boşalt' },
    ]);
  }

  /**
   * Sepet işlemlerini yönet
   */
  private async handleCartActions(to: string, action: string, session: any): Promise<void> {
    if (action === 'siparis_tamamla') {
      await this.createOrder(to, session);
    } else if (action === 'sepeti_bosalt') {
      session.cart = [];
      session.currentStep = 'menu';
      await session.save();
      await whatsappService.sendTextMessage(to, '🗑️ Sepetiniz temizlendi.');
      await this.sendMainMenu(to);
    } else if (action === 'devam_et') {
      const restaurant = await Restaurant.findById(session.selectedRestaurantId);
      if (restaurant) {
        const categories = await Category.find({ restaurantId: restaurant._id, isActive: true }).sort({ order: 1 });
        
        const sections = [
          {
            title: `📂 Kategoriler`,
            rows: categories.map((category) => ({
              id: `category_${category._id}`,
              title: `${category.emoji} ${category.name}`,
              description: category.description || '',
            })),
          },
        ];

        session.currentStep = 'category';
        await session.save();

        await whatsappService.sendListMessage(
          to,
          'Kategori Seçimi',
          'Başka ürün eklemek için kategori seçin:',
          'Kategori Seç',
          sections
        );
      }
    }
  }

  /**
   * Sipariş oluştur
   */
  private async createOrder(to: string, session: any): Promise<void> {
    if (session.cart.length === 0) {
      await whatsappService.sendTextMessage(to, '🛒 Sepetiniz boş. Önce ürün ekleyin.');
      return;
    }

    const restaurant = await Restaurant.findById(session.selectedRestaurantId);
    if (!restaurant) {
      await whatsappService.sendTextMessage(to, '❌ Restoran bulunamadı.');
      return;
    }

    // Toplam tutarı hesapla
    const totalAmount = session.cart.reduce((sum: number, item: any) => sum + item.price * item.quantity, 0);

    // Sipariş oluştur
    const order = await Order.create({
      customerPhone: to,
      restaurantId: restaurant._id,
      restaurantName: restaurant.name,
      items: session.cart,
      totalAmount,
      status: 'pending',
    });

    // Sepeti temizle
    session.cart = [];
    session.currentStep = 'menu';
    await session.save();

    // Onay mesajı gönder
    let orderText = `✅ *Siparişiniz Alındı!*\n\n`;
    orderText += `📝 Sipariş No: *${order.orderNumber}*\n`;
    orderText += `🏪 Restoran: ${restaurant.name}\n`;
    orderText += `💰 Toplam: ${totalAmount}₺\n\n`;
    orderText += `📦 Siparişiniz hazırlanıyor...\n`;
    orderText += `Durumu takip etmek için "Sipariş Takip" menüsünü kullanabilirsiniz.`;

    await whatsappService.sendTextMessage(to, orderText);
    
    // Ana menüye dön
    setTimeout(async () => {
      await this.sendMainMenu(to);
    }, 2000);
  }

  /**
   * Kullanıcının siparişlerini göster
   */
  private async sendMyOrders(to: string): Promise<void> {
    const orders = await Order.find({ customerPhone: to }).sort({ createdAt: -1 }).limit(5);

    if (orders.length === 0) {
      await whatsappService.sendTextMessage(to, '📦 Henüz siparişiniz bulunmamaktadır.');
      return;
    }

    let ordersText = '📦 *Son Siparişleriniz:*\n\n';
    orders.forEach((order, index) => {
      const statusEmoji = {
        pending: '⏳',
        confirmed: '✅',
        preparing: '👨‍🍳',
        ready: '🎉',
        delivered: '✅',
        cancelled: '❌',
      }[order.status];

      ordersText += `${index + 1}. ${statusEmoji} ${order.orderNumber}\n`;
      ordersText += `   🏪 ${order.restaurantName}\n`;
      ordersText += `   💰 ${order.totalAmount}₺\n`;
      ordersText += `   📅 ${order.createdAt.toLocaleDateString('tr-TR')}\n\n`;
    });

    await whatsappService.sendTextMessage(to, ordersText);
  }

  /**
   * Sipariş takibi göster
   */
  private async sendOrderTracking(to: string): Promise<void> {
    const lastOrder = await Order.findOne({ customerPhone: to }).sort({ createdAt: -1 });

    if (!lastOrder) {
      await whatsappService.sendTextMessage(to, '📦 Henüz siparişiniz bulunmamaktadır.');
      return;
    }

    const statusText = {
      pending: '⏳ Sipariş Alındı',
      confirmed: '✅ Sipariş Onaylandı',
      preparing: '👨‍🍳 Hazırlanıyor',
      ready: '🎉 Hazır - Teslim Alınabilir',
      delivered: '✅ Teslim Edildi',
      cancelled: '❌ İptal Edildi',
    }[lastOrder.status];

    let trackingText = `📍 *Sipariş Takibi*\n\n`;
    trackingText += `📝 Sipariş No: *${lastOrder.orderNumber}*\n`;
    trackingText += `🏪 Restoran: ${lastOrder.restaurantName}\n`;
    trackingText += `📊 Durum: ${statusText}\n`;
    trackingText += `💰 Tutar: ${lastOrder.totalAmount}₺\n`;
    trackingText += `📅 Tarih: ${lastOrder.createdAt.toLocaleString('tr-TR')}`;

    await whatsappService.sendTextMessage(to, trackingText);
  }
}

export default new MessageHandler();