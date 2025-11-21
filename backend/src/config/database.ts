import mongoose from 'mongoose';

const connectDatabase = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || process.env.MONGODB_URI_LOCAL || 'mongodb://localhost:27017/etchi_db';
    
    // Opções de conexão para melhorar estabilidade
    const options = {
      serverSelectionTimeoutMS: 10000, // 10 segundos para seleção de servidor
      socketTimeoutMS: 45000, // 45 segundos para operações de socket
      connectTimeoutMS: 10000, // 10 segundos para conexão inicial
      maxPoolSize: 10, // Máximo de conexões no pool
      minPoolSize: 5, // Mínimo de conexões no pool
      retryWrites: true,
      w: 'majority' as const,
    };

    console.log('🔄 Tentando conectar ao MongoDB...');
    console.log(`📍 URI: ${mongoUri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')}`); // Ocultar credenciais no log
    
    await mongoose.connect(mongoUri, options);
    
    console.log('✅ MongoDB Connected');
    console.log(`📊 Database: ${mongoose.connection.name}`);
    console.log(`🌐 Host: ${mongoose.connection.host}`);
    
    mongoose.connection.on('error', (err: unknown) => {
      console.error('❌ MongoDB error:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️  MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('✅ MongoDB reconnected');
    });
    
  } catch (error: any) {
    console.error('❌ Failed to connect to MongoDB:', error.message);
    
    // Se for erro de timeout ou conexão, tentar MongoDB local como fallback
    if (error.code === 'ETIMEOUT' || error.code === 'ENOTFOUND' || error.name === 'MongoServerSelectionError') {
      const currentMongoUri = process.env.MONGODB_URI || process.env.MONGODB_URI_LOCAL || 'mongodb://localhost:27017/etchi_db';
      const localUri = process.env.MONGODB_URI_LOCAL || 'mongodb://localhost:27017/etchi_db';
      
      if (currentMongoUri !== localUri) {
        console.warn('⚠️  Tentando conectar ao MongoDB local como fallback...');
        try {
          await mongoose.connect(localUri, {
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
          });
          console.log('✅ Conectado ao MongoDB local');
          console.log(`📊 Database: ${mongoose.connection.name}`);
        } catch (localError: any) {
          console.error('❌ Falha ao conectar ao MongoDB local também:', localError.message);
          console.error('\n💡 Soluções possíveis:');
          console.error('   1. Verifique sua conexão com a internet');
          console.error('   2. Verifique se seu IP está na whitelist do MongoDB Atlas');
          console.error('   3. Verifique se o MongoDB local está rodando: mongod');
          console.error('   4. Verifique a string de conexão no arquivo .env');
          process.exit(1);
        }
      } else {
        console.error('\n💡 Soluções possíveis:');
        console.error('   1. Verifique se o MongoDB local está rodando: mongod');
        console.error('   2. Verifique a string de conexão no arquivo .env');
        console.error('   3. Para MongoDB Atlas, verifique:');
        console.error('      - Sua conexão com a internet');
        console.error('      - Se seu IP está na whitelist (0.0.0.0/0 para permitir todos)');
        console.error('      - Se as credenciais estão corretas');
        process.exit(1);
      }
    } else {
      process.exit(1);
    }
  }
};

export default connectDatabase;