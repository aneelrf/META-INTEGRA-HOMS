import {
    collection, doc, setDoc, updateDoc, deleteDoc,
    onSnapshot, query, orderBy, where, limit, getDoc, getDocs, addDoc,
} from 'firebase/firestore';
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { db, firebaseConfig } from '../firebase';

export type UserRole = 'medico' | 'administrativo';

export interface UserProfile {
    id: string;
    email: string;
    nombre: string;
    rol: UserRole;
    especialidad: string;
    photoUrl: string;
    activo: boolean;
    createdAt: string;
    createdBy: string;
    pendingLink?: boolean; // true = pre-registered, waiting for first login
}

export type UserProfileInput = Pick<UserProfile, 'nombre' | 'rol' | 'especialidad' | 'photoUrl' | 'activo'>;

// ─── Create: new Firebase Auth account + Firestore profile ────────────────────

export async function createAppUser(
    email: string,
    password: string,
    profile: UserProfileInput,
    createdBy: string,
): Promise<string> {
    const secondaryApp = initializeApp(firebaseConfig, `secondary_${Date.now()}`);
    const secondaryAuth = getAuth(secondaryApp);
    try {
        const cred = await createUserWithEmailAndPassword(secondaryAuth, email, password);
        await updateProfile(cred.user, { displayName: profile.nombre });
        const uid = cred.user.uid;
        await setDoc(doc(db, 'users', uid), {
            email,
            nombre: profile.nombre,
            rol: profile.rol,
            especialidad: profile.especialidad,
            photoUrl: profile.photoUrl,
            activo: true,
            createdAt: new Date().toISOString(),
            createdBy,
        });
        return uid;
    } finally {
        await secondaryAuth.signOut();
        await deleteApp(secondaryApp);
    }
}

// ─── Create: Firestore-only profile for an existing Firebase Auth user ────────
// The profile is linked to the UID automatically on the user's next login.

export async function createUserProfileOnly(
    email: string,
    profile: UserProfileInput,
    createdBy: string,
): Promise<void> {
    await addDoc(collection(db, 'users'), {
        email,
        nombre: profile.nombre,
        rol: profile.rol,
        especialidad: profile.especialidad,
        photoUrl: profile.photoUrl,
        activo: true,
        createdAt: new Date().toISOString(),
        createdBy,
        pendingLink: true,
    });
}

// ─── Auto-create or link profile on login ────────────────────────────────────

export async function ensureUserProfile(uid: string, email: string, displayName: string): Promise<void> {
    // Already has a UID-linked profile
    const uidSnap = await getDoc(doc(db, 'users', uid));
    if (uidSnap.exists()) return;

    // Check for a pre-registered profile by email
    const pendingSnap = await getDocs(
        query(collection(db, 'users'), where('email', '==', email), limit(3)),
    );
    const pendingDoc = pendingSnap.docs.find(d => d.data().pendingLink === true);
    if (pendingDoc) {
        const { pendingLink: _p, ...rest } = pendingDoc.data();
        await setDoc(doc(db, 'users', uid), rest);
        await deleteDoc(pendingDoc.ref);
        return;
    }

    // No profile found — auto-create a basic one
    const nombre = displayName || email.split('@')[0];
    await setDoc(doc(db, 'users', uid), {
        email,
        nombre,
        rol: 'medico' as UserRole,
        activo: true,
        createdAt: new Date().toISOString(),
        createdBy: 'auto',
        photoUrl: '',
        especialidad: '',
    });
}

// ─── Update ───────────────────────────────────────────────────────────────────

export async function updateUserProfile(
    docId: string,
    data: Partial<Omit<UserProfile, 'id' | 'email' | 'createdAt' | 'createdBy'>>,
): Promise<void> {
    await updateDoc(doc(db, 'users', docId), {
        ...data,
        updatedAt: new Date().toISOString(),
    });
}

// ─── Subscriptions ────────────────────────────────────────────────────────────

export function subscribeUsers(
    onData: (users: UserProfile[]) => void,
    onError?: (err: Error) => void,
): () => void {
    const q = query(collection(db, 'users'), orderBy('createdAt', 'asc'));
    return onSnapshot(
        q,
        snap => onData(snap.docs.map(d => ({ id: d.id, ...d.data() } as UserProfile))),
        err => { onError ? onError(err as Error) : onData([]); },
    );
}

export function subscribeUserProfile(uid: string, onData: (profile: UserProfile | null) => void): () => void {
    return onSnapshot(
        doc(db, 'users', uid),
        snap => onData(snap.exists() ? ({ id: snap.id, ...snap.data() } as UserProfile) : null),
        () => onData(null),
    );
}
