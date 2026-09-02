// ==============================================================================
// SuiPact — Firebase Client & Storage Integration (Free Spark Tier)
// ==============================================================================

export interface FirebaseUploadResult {
  downloadUrl: string;
  fileName: string;
  storageProvider: 'firebase' | 'local_datastore';
}

/**
 * Checks whether user has populated Firebase API credentials in .env
 */
export function isFirebaseConfigured(): boolean {
  const key = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  return !!key && !key.includes('your_firebase_api_key') && key.trim().length > 10;
}

/**
 * Uploads a document (PDF / SRS / SDD) to Firebase Storage if configured,
 * or safely converts to local Base64 blob URL so users can test immediately without setup errors.
 */
export async function uploadDocument(
  file: File,
  folder = 'escrow_documents'
): Promise<FirebaseUploadResult> {
  // If Firebase is configured with real credentials
  if (isFirebaseConfigured()) {
    try {
      // Dynamic import to prevent bundler errors if firebase is not installed
      // @ts-ignore
      const { initializeApp, getApps } = await import('firebase/app');
      // @ts-ignore
      const { getStorage, ref, uploadBytes, getDownloadURL } = await import('firebase/storage');

      const firebaseConfig = {
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
      };

      const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
      const storage = getStorage(app);
      const cleanName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const storageRef = ref(storage, `${folder}/${cleanName}`);

      const snapshot = await uploadBytes(storageRef, file);
      const downloadUrl = await getDownloadURL(snapshot.ref);

      return {
        downloadUrl,
        fileName: file.name,
        storageProvider: 'firebase',
      };
    } catch (err: any) {
      console.warn('[Firebase Storage] Upload failed or package pending, using local datastore fallback:', err.message);
    }
  }

  // Graceful Zero-Setup Fallback: Read as Data URL (works 100% offline & locally)
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve({
        downloadUrl: reader.result as string,
        fileName: file.name,
        storageProvider: 'local_datastore',
      });
    };
    reader.onerror = () => reject(new Error('Failed to read document file.'));
    reader.readAsDataURL(file);
  });
}
