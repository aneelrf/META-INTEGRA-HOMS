import { FIRESTORE_COLLECTIONS } from '../../../lib/firestoreCollections.js';
import { getClinicSettings, updateClinicSettings } from '../../../services/clinicSettingsService.js';

function normalizeFirestoreUser(snapshot) {
  const data = snapshot.data();
  return {
    ...data,
    id: snapshot.id,
    username: data.email || data.username || snapshot.id,
    full_name: data.full_name || data.fullName || data.email || '',
    active: data.active !== false,
    created_at: data.created_at?.toDate?.().toISOString?.() || data.created_at || null,
    updated_at: data.updated_at?.toDate?.().toISOString?.() || data.updated_at || null,
  };
}

async function firestoreApi() {
  const [firestore, { requireFirestore }] = await Promise.all([
    import('firebase/firestore'),
    import('../../../lib/firebase.js'),
  ]);
  return { ...firestore, db: requireFirestore() };
}

export function getSettings() {
  return getClinicSettings();
}

export function updateSettings(settings) {
  return updateClinicSettings(settings);
}

export function getUsers() {
  return getFirestoreUsers();
}

export function createUser() {
  throw new Error('Crea el usuario en Firebase Auth y agrega su correo en FIREBASE_RULES.md.');
}

export function updateUserActive(userId, active) {
  return updateFirestoreUserActive(userId, active);
}

export function changePassword(payload) {
  return changeFirebasePassword(payload);
}

async function changeFirebasePassword({ old_password, new_password }) {
  const [
    { EmailAuthProvider, reauthenticateWithCredential, updatePassword },
    { requireFirebaseAuth },
  ] = await Promise.all([
    import('firebase/auth'),
    import('../../../lib/firebase.js'),
  ]);

  const auth = requireFirebaseAuth();
  const user = auth.currentUser;
  if (!user?.email) throw new Error('No hay usuario autenticado.');

  try {
    const credential = EmailAuthProvider.credential(user.email, old_password);
    await reauthenticateWithCredential(user, credential);
    await updatePassword(user, new_password);
  } catch (error) {
    if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password') {
      throw new Error('La contrasena actual no es correcta.');
    }
    if (error.code === 'auth/weak-password') {
      throw new Error('La nueva contrasena debe tener al menos 6 caracteres.');
    }
    if (error.code === 'auth/requires-recent-login') {
      throw new Error('Vuelve a iniciar sesion e intenta cambiar la contrasena otra vez.');
    }
    throw error;
  }

  return { ok: true };
}

async function getFirestoreUsers() {
  const { collection, getDocs, db } = await firestoreApi();
  const snapshot = await getDocs(collection(db, FIRESTORE_COLLECTIONS.users));
  return snapshot.docs
    .map(normalizeFirestoreUser)
    .sort((a, b) => String(a.email || '').localeCompare(String(b.email || '')));
}

async function updateFirestoreUserActive(userId, active) {
  const { doc, serverTimestamp, updateDoc, db } = await firestoreApi();
  await updateDoc(doc(db, FIRESTORE_COLLECTIONS.users, String(userId)), {
    active,
    updated_at: serverTimestamp(),
  });
  return { ok: true };
}
