import { Router, Request, Response } from 'express';
import Restaurant from '../models/Restaurant';
import Category from '../models/Category';
import Product from '../models/Product';
import Order from '../models/Order';
import User from '../models/User';
import jwt from 'jsonwebtoken';

const router = Router();

// Middleware: JWT Token Doğrulama
const authenticateToken = (req: Request, res: Response, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token bulunamadı' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'secret', (err: any, user: any) => {
    if (err) {
      return res.status(403).json({ error: 'Geçersiz token' });
    }
    (req as any).user = user;
    next();
  });
};

/**
 * Login - Admin giriş
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ username, isActive: true }).populate('restaurantId');
    
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: 'Kullanıcı adı veya şifre hatalı' });
    }

    const token = jwt.sign(
      { id: user._id, username: user.username, role: user.role, restaurantId: user.restaurantId },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '24h' }
    );

    res.json({ 
      token, 
      user: { 
        id: user._id, 
        username: user.username, 
        role: user.role,
        restaurantId: user.restaurantId,
        restaurantName: user.restaurantId ? (user.restaurantId as any).name : null
      } 
    });
  } catch (error) {
    res.status(500).json({ error: 'Giriş hatası' });
  }
});

// ========== RESTORAN YÖNETİMİ ==========

/**
 * Tüm restoranları getir
 */
router.get('/restaurants', authenticateToken, async (req: Request, res: Response) => {
  try {
    const restaurants = await Restaurant.find().sort({ createdAt: -1 });
    res.json(restaurants);
  } catch (error) {
    res.status(500).json({ error: 'Restoranlar getirilemedi' });
  }
});

/**
 * Yeni restoran ekle
 */
router.post('/restaurants', authenticateToken, async (req: Request, res: Response) => {
  try {
    const restaurant = await Restaurant.create(req.body);
    res.status(201).json(restaurant);
  } catch (error) {
    res.status(500).json({ error: 'Restoran eklenemedi' });
  }
});

/**
 * Restoran güncelle
 */
router.put('/restaurants/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const restaurant = await Restaurant.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!restaurant) {
      return res.status(404).json({ error: 'Restoran bulunamadı' });
    }
    res.json(restaurant);
  } catch (error) {
    res.status(500).json({ error: 'Restoran güncellenemedi' });
  }
});

/**
 * Restoran sil
 */
router.delete('/restaurants/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    await Restaurant.findByIdAndDelete(req.params.id);
    res.json({ message: 'Restoran silindi' });
  } catch (error) {
    res.status(500).json({ error: 'Restoran silinemedi' });
  }
});

// ========== KATEGORİ YÖNETİMİ ==========

/**
 * Restoran kategorilerini getir
 */
router.get('/restaurants/:restaurantId/categories', authenticateToken, async (req: Request, res: Response) => {
  try {
    const categories = await Category.find({ restaurantId: req.params.restaurantId }).sort({ order: 1 });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: 'Kategoriler getirilemedi' });
  }
});

/**
 * Yeni kategori ekle
 */
router.post('/categories', authenticateToken, async (req: Request, res: Response) => {
  try {
    const category = await Category.create(req.body);
    res.status(201).json(category);
  } catch (error) {
    res.status(500).json({ error: 'Kategori eklenemedi' });
  }
});

/**
 * Kategori güncelle
 */
router.put('/categories/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const category = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!category) {
      return res.status(404).json({ error: 'Kategori bulunamadı' });
    }
    res.json(category);
  } catch (error) {
    res.status(500).json({ error: 'Kategori güncellenemedi' });
  }
});

/**
 * Kategori sil
 */
router.delete('/categories/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    await Category.findByIdAndDelete(req.params.id);
    res.json({ message: 'Kategori silindi' });
  } catch (error) {
    res.status(500).json({ error: 'Kategori silinemedi' });
  }
});

// ========== ÜRÜN YÖNETİMİ ==========

/**
 * Kategori ürünlerini getir
 */
router.get('/categories/:categoryId/products', authenticateToken, async (req: Request, res: Response) => {
  try {
    const products = await Product.find({ categoryId: req.params.categoryId }).sort({ order: 1 });
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: 'Ürünler getirilemedi' });
  }
});

/**
 * Restoran ürünlerini getir
 */
router.get('/restaurants/:restaurantId/products', authenticateToken, async (req: Request, res: Response) => {
  try {
    const products = await Product.find({ restaurantId: req.params.restaurantId })
      .populate('categoryId')
      .sort({ order: 1 });
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: 'Ürünler getirilemedi' });
  }
});

/**
 * Yeni ürün ekle
 */
router.post('/products', authenticateToken, async (req: Request, res: Response) => {
  try {
    const product = await Product.create(req.body);
    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ error: 'Ürün eklenemedi' });
  }
});

/**
 * Ürün güncelle
 */
router.put('/products/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!product) {
      return res.status(404).json({ error: 'Ürün bulunamadı' });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: 'Ürün güncellenemedi' });
  }
});

/**
 * Ürün sil
 */
router.delete('/products/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: 'Ürün silindi' });
  } catch (error) {
    res.status(500).json({ error: 'Ürün silinemedi' });
  }
});

// ========== SİPARİŞ YÖNETİMİ ==========

/**
 * Tüm siparişleri getir
 */
router.get('/orders', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { status, restaurantId, limit = 50 } = req.query;
    
    const filter: any = {};
    if (status) filter.status = status;
    if (restaurantId) filter.restaurantId = restaurantId;
    
    const orders = await Order.find(filter)
      .sort({ createdAt: -1 })
      .limit(Number(limit));
    
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: 'Siparişler getirilemedi' });
  }
});

/**
 * Sipariş detayı getir
 */
router.get('/orders/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Sipariş bulunamadı' });
    }
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: 'Sipariş getirilemedi' });
  }
});

/**
 * Sipariş durumu güncelle
 */
router.put('/orders/:id/status', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    
    if (!order) {
      return res.status(404).json({ error: 'Sipariş bulunamadı' });
    }
    
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: 'Sipariş durumu güncellenemedi' });
  }
});

// ========== KULLANICI YÖNETİMİ ==========

/**
 * Tüm kullanıcıları getir (Sadece admin)
 */
router.get('/users', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (user.role !== 'admin') {
      return res.status(403).json({ error: 'Bu işlem için yetkiniz yok' });
    }

    const users = await User.find().populate('restaurantId').select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Kullanıcılar getirilemedi' });
  }
});

/**
 * Yeni kullanıcı ekle (Sadece admin)
 */
router.post('/users', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (user.role !== 'admin') {
      return res.status(403).json({ error: 'Bu işlem için yetkiniz yok' });
    }

    const newUser = await User.create(req.body);
    const userResponse = await User.findById(newUser._id).populate('restaurantId').select('-password');
    res.status(201).json(userResponse);
  } catch (error) {
    res.status(500).json({ error: 'Kullanıcı eklenemedi' });
  }
});

/**
 * Kullanıcı güncelle (Sadece admin)
 */
router.put('/users/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (user.role !== 'admin') {
      return res.status(403).json({ error: 'Bu işlem için yetkiniz yok' });
    }

    // Eğer şifre güncellenmiyorsa, body'den kaldır
    if (!req.body.password) {
      delete req.body.password;
    }

    const updatedUser = await User.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate('restaurantId')
      .select('-password');
    
    if (!updatedUser) {
      return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
    }
    
    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ error: 'Kullanıcı güncellenemedi' });
  }
});

/**
 * Kullanıcı sil (Sadece admin)
 */
router.delete('/users/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (user.role !== 'admin') {
      return res.status(403).json({ error: 'Bu işlem için yetkiniz yok' });
    }

    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'Kullanıcı silindi' });
  } catch (error) {
    res.status(500).json({ error: 'Kullanıcı silinemedi' });
  }
});

// ========== İSTATİSTİKLER ==========

/**
 * Dashboard istatistikleri
 */
router.get('/stats/dashboard', authenticateToken, async (req: Request, res: Response) => {
  try {
    const totalRestaurants = await Restaurant.countDocuments();
    const activeRestaurants = await Restaurant.countDocuments({ isActive: true });
    const totalOrders = await Order.countDocuments();
    const pendingOrders = await Order.countDocuments({ status: 'pending' });
    const todayOrders = await Order.countDocuments({
      createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) },
    });
    
    const todayRevenue = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) },
          status: { $ne: 'cancelled' },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$totalAmount' },
        },
      },
    ]);

    res.json({
      totalRestaurants,
      activeRestaurants,
      totalOrders,
      pendingOrders,
      todayOrders,
      todayRevenue: todayRevenue[0]?.total || 0,
    });
  } catch (error) {
    res.status(500).json({ error: 'İstatistikler getirilemedi' });
  }
});

export default router;