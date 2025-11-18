// src/utils/firebase.ts
import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';

// Cache para evitar múltiplas inicializações
let firebaseAppInstance: admin.app.App | null = null;
let initializationAttempted = false;

/**
 * Inicializa o Firebase Admin SDK de forma resiliente
 * Suporta duas formas de configuração:
 * 1. GOOGLE_APPLICATION_CREDENTIALS apontando para um arquivo JSON (Service Account)
 * 2. Variáveis de ambiente (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY)
 */
const initFirebaseAdmin = (): admin.app.App | null => {
  // Se já foi inicializado, retornar a instância existente
  if (firebaseAppInstance) {
    return firebaseAppInstance;
  }

  if (admin.apps.length > 0) {
    firebaseAppInstance = admin.app();
    return firebaseAppInstance;
  }

  // Se já tentamos inicializar e falhou, não tentar novamente
  if (initializationAttempted) {
    return null;
  }

  initializationAttempted = true;

  try {
    // Método 1: Usar arquivo de credenciais via GOOGLE_APPLICATION_CREDENTIALS
    const keyPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    
    if (keyPath && fs.existsSync(keyPath)) {
      try {
        const serviceAccount = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
        
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });
        
        firebaseAppInstance = admin.app();
        console.info('✅ Firebase Admin inicializado usando arquivo de service account:', keyPath);
        return firebaseAppInstance;
      } catch (error: any) {
        console.warn('⚠️  Erro ao ler arquivo de service account:', error.message);
      }
    }

    // Método 2: Usar variáveis de ambiente
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    let privateKey = process.env.FIREBASE_PRIVATE_KEY;

    if (privateKey) {
      // Substituir \n literais por quebras de linha reais
      privateKey = privateKey.replace(/\\n/g, '\n');
    }

    if (projectId && clientEmail && privateKey) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
      
      firebaseAppInstance = admin.app();
      console.info('✅ Firebase Admin inicializado usando variáveis de ambiente');
      return firebaseAppInstance;
    }

    // Nenhuma configuração encontrada - mostrar aviso apenas na primeira tentativa
    console.warn('⚠️  Firebase Admin não configurado - variáveis de ambiente ausentes');
    console.warn('   Configure uma das opções:');
    console.warn('   1. GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json');
    console.warn('   2. FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY');
    
    return null;
  } catch (error: any) {
    console.error('❌ Erro ao inicializar Firebase Admin SDK:', error.message);
    return null;
  }
};

export default initFirebaseAdmin;

