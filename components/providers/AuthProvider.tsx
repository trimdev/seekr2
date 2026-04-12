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
    // Set persistence once at init so individual sign-in functions don't
    // need to await it — that await breaks the iOS Safari user-gesture
    // chain and causes signInWithPopup to be blocked.
    setPersistence(auth, browserLocalPersistence).catch(() => {});

    // Drain any stale redirect result (clears bad state from IndexedDB)
    getRedirectResult(auth)
      .then((result) => {
        if (result?.user) {
          // localStorage survives cross-origin redirects; sessionStorage does not
          const dest = localStorage.getItem("authRedirect") || "/";
          localStorage.removeItem("authRedirect");
          router.replace(dest.startsWith("/") && !dest.startsWith("//") ? dest : "/");
        }
      })
      .catch((err) => {
        console.warn("[Auth] getRedirectResult (stale):", err?.code);
      });

    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u || null);
      setLoading(false);
      // Second chance: if redirect result beat onAuthStateChanged, pick up dest here
      if (u) {
        const dest = localStorage.getItem("authRedirect");
        if (dest) {
          localStorage.removeItem("authRedirect");
          router.replace(dest.startsWith("/") && !dest.startsWith("//") ? dest : "/");
        }
      }
    });
    return () => unsub();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const signInWithGoogle = async (redirect?: string) => {
    const target = redirect && redirect.startsWith("/") && !redirect.startsWith("//")
      ? redirect
      : "/";
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });

    try {
      // Popup is faster and simpler — preferred method now that authDomain is clean
      const result = await signInWithPopup(auth, provider);
      if (result.user) router.replace(target);
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      if (code === "auth/popup-blocked" || code === "auth/popup-closed-by-user") {
        // Popup blocked (mobile/strict browsers) — fall back to redirect flow
        localStorage.setItem("authRedirect", target);
        await signInWithRedirect(auth, provider);
      } else {
        throw err; // Let the login page show the real error code
      }
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
