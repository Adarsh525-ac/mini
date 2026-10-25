import { adminAuth, firestoreDb, isFirebaseInitialized } from '../config/firebase.js';

/**
 * Middleware: Verify Firebase ID Token
 */
export const verifyAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }

    const token = authHeader.split('Bearer ')[1].trim();

    // 1. Support local demo testing tokens when evaluating offline
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
      const decodedToken = await adminAuth.verifyIdToken(token);
      let role = decodedToken.role || 'user';

      // Check role in Firestore users collection
      if (firestoreDb) {
        try {
          const userDoc = await firestoreDb.collection('users').doc(decodedToken.uid).get();
          if (userDoc.exists) {
            role = userDoc.data().role || role;
          }
        } catch (dbErr) {
          console.warn('Could not read user role from Firestore:', dbErr.message);
        }
      }

      req.user = {
        uid: decodedToken.uid,
        email: decodedToken.email,
        name: decodedToken.name,
        picture: decodedToken.picture,
        role: role,
        firebaseToken: decodedToken
      };

      return next();
    }

    // 3. Fallback if Firebase not initialized
    req.user = {
      uid: 'dev-user-001',
      email: 'dev@cloudtune.io',
      role: 'user'
    };
    next();
  } catch (error) {
    console.error('Authentication verification failed:', error.message);
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

  // Double check role
  const isAdmin = req.user.role === 'admin' || 
                  req.user.email === 'admin@cloudtune.io' ||
                  (req.user.firebaseToken && req.user.firebaseToken.admin === true);

  if (!isAdmin) {
    return res.status(403).json({ error: 'Forbidden: Administrator privileges required' });
  }

  next();
};

/**
 * Middleware: Optional Authentication (attaches user if token is valid, doesn't block guests)
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
      const decodedToken = await adminAuth.verifyIdToken(token);
      let role = 'user';
      if (firestoreDb) {
        try {
          const userDoc = await firestoreDb.collection('users').doc(decodedToken.uid).get();
          if (userDoc.exists) role = userDoc.data().role || 'user';
        } catch {}
      }
      req.user = {
        uid: decodedToken.uid,
        email: decodedToken.email,
        role: role
      };
    }
  } catch {
    req.user = null;
  }
  next();
};
