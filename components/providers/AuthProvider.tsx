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
  signInWithRedirect,
  getRedirectResult,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  setPersistence,
  browserLocalPersistence,
  sendPasswordResetEmail,
  signOut,
  updateProfile,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";

type AuthCtx = {
  user: User | null;
  loading: boolean;
  signInWithGoogle: (redirect?: string) => Promise<void>;
  signInEmail: (email: string, password: string, redirect?: string) => Promise<void>;
  registerEmail: (email: string, password: string, name: string, redirect?: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
};

const AuthContext = createContext<AuthCtx>({
  user: null,
  loading: true,
  signInWithGoogle: async () => {},
  signInEmail: async () => {},
  registerEmail: async () => {},
  logout: async () => {},
  resetPassword: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Handle the return from Google redirect sign-in
    setPersistence(auth, browserLocalPersistence).catch(() => {}).finally(() => {
      getRedirectResult(auth)
        .then((result) => {
          if (result?.user) {
            const dest = sessionStorage.getItem("authRedirect") || "/";
            sessionStorage.removeItem("authRedirect");
            router.replace(dest.startsWith("/") && !dest.startsWith("//") ? dest : "/");
          }
        })
        .catch((err) => {
          // Log actual Firebase error code for debugging
          console.error("[Auth] getRedirectResult error:", err?.code, err?.message);
        });
    });

    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u || null);
      setLoading(false);
    });
    return () => unsub();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const signInWithGoogle = async (redirect?: string) => {
    const target = redirect && redirect.startsWith("/") && !redirect.startsWith("//")
      ? redirect
      : "/";
    sessionStorage.setItem("authRedirect", target);
    await setPersistence(auth, browserLocalPersistence);
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });
    // signInWithRedirect navigates away — no popup, works on all browsers/mobile
    await signInWithRedirect(auth, provider);
  };

  const signInEmail = async (email: string, password: string, redirect?: string) => {
    await setPersistence(auth, browserLocalPersistence);
    await signInWithEmailAndPassword(auth, email, password);
    const target = redirect && redirect.startsWith("/") && !redirect.startsWith("//") ? redirect : "/";
    router.replace(target);
  };

  const registerEmail = async (email: string, password: string, name: string, redirect?: string) => {
    await setPersistence(auth, browserLocalPersistence);
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName: name });
    const target = redirect && redirect.startsWith("/") && !redirect.startsWith("//") ? redirect : "/";
    router.replace(target);
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
        logout,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
