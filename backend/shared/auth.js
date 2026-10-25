import dotenv from 'dotenv';
dotenv.config();

let adminAuth = null;
let isFirebaseInitialized = false;

// Attempt to load Firebase Admin if credentials exist
try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY || process.env.GOOGLE_APPLICATION_CREDENTIALS || (process.env.K_SERVICE && process.env.GCP_PROJECT_ID)) {
    const { adminAuth: authInstance, isFirebaseInitialized: initStatus } = await import('../src/config/firebase.js');
    adminAuth = authInstance;
    isFirebaseInitialized = initStatus;
  }
} catch (e) {
  isFirebaseInitialized = false;
}

/**
 * Middleware: Verify Bearer JWT or Demo Auth Token
 */
export const verifyAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }

    const token = authHeader.split('Bearer ')[1].trim();

    // 1. Support local demo testing tokens
    if (token.startsWith('demo-token-')) {
      let demoUser = {
        uid: token.replace('demo-token-', ''),
        email: 'listener@cloudtune.io',
        role: 'user'
      };

      if (req.headers['x-demo-user']) {
        try {
          const parsed = JSON.parse(req.headers['x-demo-user']);
          demoUser = { ...demoUser, ...parsed };
        } catch {}
      }

      req.user = demoUser;
      return next();
    }

    // 2. Production Firebase ID token verification
    if (isFirebaseInitialized && adminAuth) {
      try {
        const decodedToken = await adminAuth.verifyIdToken(token);
        const role = decodedToken.role || (decodedToken.email === 'admin@cloudtune.io' ? 'admin' : 'user');
        req.user = {
          uid: decodedToken.uid,
          email: decodedToken.email,
          name: decodedToken.name,
          picture: decodedToken.picture,
          role,
          firebaseToken: decodedToken
        };
        return next();
      } catch (tokenErr) {
        return res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
      }
    }

    // 3. Fallback dev user
    req.user = {
      uid: 'dev-user-001',
      email: 'dev@cloudtune.io',
      role: 'user'
    };
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
  }
};

/**
 * Middleware: Enforce Administrator Permissions
 */
export const verifyAdmin = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized: Authentication required' });
  }

  const isAdmin = req.user.role === 'admin' || 
                  req.user.email === 'admin@cloudtune.io' ||
                  (req.user.firebaseToken && req.user.firebaseToken.admin === true);

  if (!isAdmin) {
    return res.status(403).json({ error: 'Forbidden: Administrator privileges required' });
  }

  next();
};

/**
 * Middleware: Optional Authentication (guest allowed)
 */
export const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    req.user = null;
    return next();
  }

  try {
    const token = authHeader.split('Bearer ')[1].trim();

    if (token.startsWith('demo-token-')) {
      let demoUser = {
        uid: token.replace('demo-token-', ''),
        email: 'listener@cloudtune.io',
        role: 'user'
      };
      if (req.headers['x-demo-user']) {
        try {
          demoUser = { ...demoUser, ...JSON.parse(req.headers['x-demo-user']) };
        } catch {}
      }
      req.user = demoUser;
      return next();
    }

    if (isFirebaseInitialized && adminAuth) {
      try {
        const decodedToken = await adminAuth.verifyIdToken(token);
        const role = decodedToken.role || (decodedToken.email === 'admin@cloudtune.io' ? 'admin' : 'user');
        req.user = {
          uid: decodedToken.uid,
          email: decodedToken.email,
          role
        };
      } catch {
        req.user = null;
      }
    }
  } catch {
    req.user = null;
  }
  next();
};
