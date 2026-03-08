import express, { Application } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import bodyParser from 'body-parser';
import connectDB from './config/database';
import webhookRoutes from './routes/webhook';
import adminRoutes from './routes/admin';
import User from './models/User';

// Environment variables
dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Static files for admin panel
app.use('/admin', express.static('admin'));

// Routes
app.use('/webhook', webhookRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/', (req, res) => {
  res.json({
    status: 'OK',
    message: 'WhatsApp Sipariş Sistemi API - Çalışıyor',
    version: '1.0.0',
  });
});

// Initialize database and create default admin user
const initializeApp = async () => {
  try {
    // Connect to database
    await connectDB();

    // Create default admin user if not exists
    const adminExists = await User.findOne({ username: 'admin' });
    
    if (!adminExists) {
      await User.create({
        username: 'admin',
        email: 'admin@system.com',
        password: 'admin123',
        role: 'admin',
        isActive: true,
      });
      console.log('✅ Varsayılan admin kullanıcısı oluşturuldu');
      console.log('   Kullanıcı adı: admin');
      console.log('   Şifre: admin123');
      console.log('   ⚠️ Lütfen şifreyi değiştirin!');
    }

    // Start server
    app.listen(PORT, () => {
      console.log('');
      console.log('╔═══════════════════════════════════════════════════════╗');
      console.log('║                                                       ║');
      console.log('║   🚀 WhatsApp Sipariş Sistemi Başlatıldı            ║');
      console.log('║                                                       ║');
      console.log('╚═══════════════════════════════════════════════════════╝');
      console.log('');
      console.log(`📡 Server çalışıyor: http://localhost:${PORT}`);
      console.log(`📱 WhatsApp Webhook: http://localhost:${PORT}/webhook`);
      console.log(`🔐 Admin API: http://localhost:${PORT}/api/admin`);
      console.log('');
      console.log('⚙️  Konfigürasyon:');
      console.log(`   - MongoDB: ${process.env.MONGODB_URI || 'mongodb://localhost:27017/whatsapp-order-system'}`);
      console.log(`   - Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log('');
    });
  } catch (error) {
    console.error('❌ Uygulama başlatma hatası:', error);
    process.exit(1);
  }
};

// Start application
initializeApp();

// Handle unhandled promise rejections
process.on('unhandledRejection', (err: Error) => {
  console.error('❌ Unhandled Promise Rejection:', err);
  process.exit(1);
});

export default app;