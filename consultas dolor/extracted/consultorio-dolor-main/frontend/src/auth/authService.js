import { FIRESTORE_COLLECTIONS } from '../lib/firestoreCollections.js';

function toLoginError(error) {
  if (error?.message && !error.code) return error;

  const messages = {
    'auth/invalid-credential': 'Correo o contrasena incorrectos.',
    'auth/user-not-found': 'Correo o contrasena incorrectos.',
    'auth/wrong-password': 'Correo o contrasena incorrectos.',
    'auth/invalid-email': 'Ingresa un correo valido.',
    'auth/missing-password': 'Ingresa la contrasena.',
    'auth/too-many-requests': 'Demasiados intentos. Espera unos minutos e intenta otra vez.',
    'auth/network-request-failed': 'No se pudo conectar con Firebase. Revisa tu conexion.',
    'auth/unauthorized-domain': 'Este dominio no esta autorizado en Firebase Auth. Agrega oteroz.github.io en Authentication > Settings > Authorized domains.',
    'auth/api-key-not-valid.-please-pass-a-valid-api-key.': 'La API key de Firebase no es valida. Revisa las variables VITE_FIREBASE_* en GitHub.',
    'auth/invalid-api-key': 'La API key de Firebase no es valida. Revisa las variables VITE_FIREBASE_* en GitHub.',
    'permission-denied': 'Firebase rechazo el acceso. Publica las reglas de Firestore y agrega este correo como autorizado.',
    'unavailable': 'Firebase no esta disponible ahora. Intenta otra vez en unos minutos.',
  };

  const message = messages[error?.code] || `No se pudo iniciar sesion${error?.code ? ` (${error.code})` : ''}.`;
  return new Error(message);
}

function profileFromFirebaseUser(firebaseUser, profile) {
  return {
    id: firebaseUser.uid,
    uid: firebaseUser.uid,
    username: profile.email || firebaseUser.email,
    email: profile.email || firebaseUser.email,
    fullName: profile.full_name || firebaseUser.displayName || firebaseUser.email,
    role: profile.role,
    active: profile.active,
  };
}

async function getUserProfile(uid) {
  const [{ doc, getDoc }, { requireFirestore }] = await Promise.all([
    import('firebase/firestore'),
    import('../lib/firebase.js'),
  ]);
  const snapshot = await getDoc(doc(requireFirestore(), FIRESTORE_COLLECTIONS.users, uid));
  return snapshot.exists() ? snapshot.data() : null;
}

async function createProfileFromRules(firebaseUser) {
  const [{ doc, serverTimestamp, setDoc }, { requireFirestore }] = await Promise.all([
    import('firebase/firestore'),
    import('../lib/firebase.js'),
  ]);
  const db = requireFirestore();
  const ref = doc(db, FIRESTORE_COLLECTIONS.users, firebaseUser.uid);
  const email = firebaseUser.email;
  const roles = ['admin', 'medico', 'secretaria'];

  for (const role of roles) {
    const profile = {
      email,
      full_name: firebaseUser.displayName || email,
      role,
      active: true,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    };

    try {
      await setDoc(ref, profile);
      return profileFromFirebaseUser(firebaseUser, profile);
    } catch (error) {
      if (error.code !== 'permission-denied') throw error;
    }
  }

  throw new Error('Correo no autorizado.');
}

export function subscribeToAuthState(onUser, onError) {
  let unsubscribe = null;
  let cancelled = false;

  Promise.all([
    import('firebase/auth'),
    import('../lib/firebase.js'),
  ]).then(([{ onAuthStateChanged }, { requireFirebaseAuth }]) => {
    if (cancelled) return;

    unsubscribe = onAuthStateChanged(
      requireFirebaseAuth(),
      async (firebaseUser) => {
        if (!firebaseUser) {
          onUser(null);
          return;
        }

        const profile = await getUserProfile(firebaseUser.uid);
        if (!profile || profile.active === false) {
          onUser(null);
          return;
        }

        onUser(profileFromFirebaseUser(firebaseUser, profile));
      },
      onError,
    );
  }).catch(onError);

  return () => {
    cancelled = true;
    if (unsubscribe) unsubscribe();
  };
}

export async function loginUser(username, password) {
  try {
    const [
      { browserLocalPersistence, setPersistence, signInWithEmailAndPassword, signOut },
      { requireFirebaseAuth },
    ] = await Promise.all([
      import('firebase/auth'),
      import('../lib/firebase.js'),
    ]);
    const auth = requireFirebaseAuth();
    await setPersistence(auth, browserLocalPersistence);
    const credential = await signInWithEmailAndPassword(auth, username, password);
    const profile = await getUserProfile(credential.user.uid);

    if (!profile) {
      try {
        return await createProfileFromRules(credential.user);
      } catch (error) {
        await signOut(auth);
        throw error;
      }
    }

    if (profile.active === false) {
      await signOut(auth);
      throw new Error('Usuario inactivo.');
    }

    return profileFromFirebaseUser(credential.user, profile);
  } catch (error) {
    throw toLoginError(error);
  }
}

export async function logoutUser() {
  const [{ signOut }, { requireFirebaseAuth }] = await Promise.all([
    import('firebase/auth'),
    import('../lib/firebase.js'),
  ]);
  await signOut(requireFirebaseAuth());
}
