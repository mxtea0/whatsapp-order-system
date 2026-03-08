import mongoose from 'mongoose';

const connectDB = async (): Promise<void> => {
  try {
    // Railway environment variable kontrolü
    const mongoURI = process.env.MONGODB_URI || process.env.MONGO_URL || process.env.DATABASE_URL;
    
    if (!mongoURI) {
      console.error('❌ HATA: MongoDB URI bulunamadı!');
      console.error('Environment variables:', {
        MONGODB_URI: process.env.MONGODB_URI ? 'var' : 'yok',
        MONGO_URL: process.env.MONGO_URL ? 'var' : 'yok',
        DATABASE_URL: process.env.DATABASE_URL ? 'var' : 'yok'
      });
      throw new Error('MongoDB URI tanımlı değil! Railway Variables kontrol edin.');
    }
    
    console.log('🔗 MongoDB URI bulundu, bağlanıyor...');
    console.log('🔗 URI başlangıcı:', mongoURI.substring(0, 20) + '...');
    
    await mongoose.connect(mongoURI);
    
    console.log('✅ MongoDB bağlantısı başarılı');
    console.log('📊 Bağlı database:', mongoose.connection.db?.databaseName);
    
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB bağlantı hatası:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.log('⚠️ MongoDB bağlantısı kesildi');
    });
    
  } catch (error) {
    console.error('❌ MongoDB bağlantı hatası:', error);
    console.error('💡 Çözüm: Railway Variables sekmesinde MONGODB_URI ayarlayın');
    process.exit(1);
  }
};

export default connectDB;
