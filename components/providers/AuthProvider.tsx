"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  onAuthStateChanged,
  User,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInAnonymously,
  setPersistence,
  browserLocalPersistence,
  sendPasswordResetEmail,
  signOut,
  updateProfile,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter, usePathname } from "next/navigation";

type AuthCtx = {
  user: User | null;
  loading: boolean;
  signInWithGoogle: (redirect?: string) => Promise<void>;
  signInEmail: (email: string, password: string, redirect?: string) => Promise<void>;
  registerEmail: (email: string, password: string, name: string, redirect?: string) => Promise<void>;
  signInAnon: () => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
};

const AuthContext = createContext<AuthCtx>({
  user: null,
  loading: true,
  signInWithGoogle: async () => {},
  signInEmail: async () => {},
  registerEmail: async () => {},
  signInAnon: async () => {},
  logout: async () => {},
  resetPassword: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    (async () => {
      try {
        await setPersistence(auth, browserLocalPersistence);
      } catch {}
    })();
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u && !u.isAnonymous ? u : null);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const signInWithGoogle = async (redirect?: string) => {
    const provider = new GoogleAuthProvider();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (provider as any).setCustomParameters({ prompt: "select_account consent" });
    const target =
      redirect && redirect.startsWith("/") && !redirect.startsWith("//")
        ? redirect
        : pathname?.startsWith("/") && !pathname.startsWith("//")
        ? pathname
        : "/";
    localStorage.setItem("lastPath", target);
    await setPersistence(auth, browserLocalPersistence);
    const res = await signInWithPopup(auth, provider);
    if (res.user) {
      const stored = localStorage.getItem("lastPath") || "/";
      localStorage.removeItem("lastPath");
      const dest = stored.startsWith("/") && !stored.startsWith("//") ? stored : "/";
      router.replace(dest);
    }
  };

  const signInEmail = async (email: string, password: string, redirect?: string) => {
    await signInWithEmailAndPassword(auth, email, password);
    const target = redirect && redirect.startsWith("/") && !redirect.startsWith("//") ? redirect : "/";
    router.replace(target);
  };

  const registerEmail = async (email: string, password: string, name: string, redirect?: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName: name });
    const target = redirect && redirect.startsWith("/") && !redirect.startsWith("//") ? redirect : "/";
    router.replace(target);
  };

  const signInAnon = async () => {
    await signInAnonymously(auth);
  };

  const logout = async () => {
    await signOut(auth);
    router.replace("/");
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signInWithGoogle,
        signInEmail,
        registerEmail,
        signInAnon,
        logout,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
