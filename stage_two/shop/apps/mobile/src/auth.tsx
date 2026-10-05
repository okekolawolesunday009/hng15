import * as Google from "expo-auth-session/providers/google";
import * as AuthSession from "expo-auth-session";
import * as SecureStore from "expo-secure-store";
import * as WebBrowser from "expo-web-browser";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Platform } from "react-native";
import type { UserSummary } from "@northstar/shared";
import {
  ApiRequestError,
  exchangeGoogleIdToken,
  getCurrentUser,
  revokeMobileSession,
  setMobileAccessToken,
} from "./api";

WebBrowser.maybeCompleteAuthSession();

const ACCESS_TOKEN_KEY = "northstar-mobile-access-token";
const GOOGLE_ANDROID_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;
const GOOGLE_IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
const UNCONFIGURED_CLIENT_ID = "not-configured.apps.googleusercontent.com";

type AuthContextValue = {
  user: UserSummary | null;
  accessToken: string | null;
  isLoading: boolean;
  isSigningIn: boolean;
  isConfigured: boolean;
  isReady: boolean;
  error: string | null;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const isConfigured = Platform.OS === "ios"
    ? Boolean(GOOGLE_IOS_CLIENT_ID)
    : Platform.OS === "android"
      ? Boolean(GOOGLE_ANDROID_CLIENT_ID)
      : Boolean(GOOGLE_WEB_CLIENT_ID);
  const [request, response, promptAsync] = Google.useAuthRequest(
    {
      androidClientId: GOOGLE_ANDROID_CLIENT_ID ?? UNCONFIGURED_CLIENT_ID,
      iosClientId: GOOGLE_IOS_CLIENT_ID ?? UNCONFIGURED_CLIENT_ID,
      webClientId: GOOGLE_WEB_CLIENT_ID ?? UNCONFIGURED_CLIENT_ID,
      selectAccount: true,
      scopes: ["openid", "profile", "email"],
    },
    { scheme: "northstar" },
  );
  const [user, setUser] = useState<UserSummary | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const responseHandled = useRef<string | null>(null);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const token = await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
        if (token) {
          setMobileAccessToken(token);
          if (active) setAccessToken(token);
          try {
            const restoredUser = await getCurrentUser();
            if (active) setUser(restoredUser);
          } catch (restoreError) {
            if (restoreError instanceof ApiRequestError && restoreError.status === 401) {
              setMobileAccessToken(null);
              if (active) setAccessToken(null);
              await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
            } else if (active) {
              setError(
                restoreError instanceof Error
                  ? `Couldn't verify your saved account: ${restoreError.message}`
                  : "Couldn't verify your saved account. Check your connection and try again.",
              );
            }
          }
        }
      } catch {
        if (active) setError("Couldn't read the secure sign-in on this device.");
      } finally {
        if (active) setIsLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!response) return;
    if (response.type !== "success" && response.type !== "error") {
      if (response?.type === "cancel" || response?.type === "dismiss") {
        setIsSigningIn(false);
      }
      return;
    }
    const responseId = response.url;
    if (responseHandled.current === responseId) return;
    responseHandled.current = responseId;
    if (response.type === "error") {
      setError(response.error?.message ?? "Google sign-in was not completed.");
      setIsSigningIn(false);
      return;
    }

    const exchangeCode = async () => {
      if (!request || !response.params.code) return null;
      const tokenResponse = await AuthSession.exchangeCodeAsync({
        clientId: request.clientId,
        code: response.params.code,
        redirectUri: request.redirectUri,
        scopes: request.scopes,
        ...(request.codeVerifier
          ? { extraParams: { code_verifier: request.codeVerifier } }
          : {}),
      }, Google.discovery);
      return tokenResponse.idToken ?? null;
    };

    const idToken = response.authentication?.idToken ?? response.params.id_token;
    if (!idToken && (!request || !response.params.code)) {
      setError("Google didn't return an ID token. Check the mobile OAuth configuration.");
      setIsSigningIn(false);
      return;
    }

    let active = true;
    void (async () => {
      try {
        const verifiedIdToken = idToken ?? await exchangeCode();
        if (!verifiedIdToken) {
          throw new Error("Google didn't return an ID token. Check the mobile OAuth configuration.");
        }
        const session = await exchangeGoogleIdToken(verifiedIdToken);
        setMobileAccessToken(session.accessToken);
        try {
          await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, session.accessToken);
        } catch {
          await revokeMobileSession().catch(() => undefined);
          setMobileAccessToken(null);
          throw new Error("Couldn't securely save your sign-in on this device.");
        }
        if (active) {
          setUser(session.user);
          setAccessToken(session.accessToken);
          setError(null);
        }
      } catch (signInError) {
        if (active) {
          setError(
            signInError instanceof Error
              ? signInError.message
              : "Couldn't sign in. Please try again.",
          );
        }
      } finally {
        if (active) setIsSigningIn(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [request, response]);

  const signIn = useCallback(async () => {
    if (!isConfigured) {
      setError("Google sign-in isn't configured for this device yet.");
      return;
    }
    if (!request || isSigningIn) return;
    responseHandled.current = null;
    setError(null);
    setIsSigningIn(true);
    try {
      const result = await promptAsync();
      if (result.type === "cancel" || result.type === "dismiss") setIsSigningIn(false);
      if (result.type === "error") {
        setError(result.error?.message ?? "Google sign-in couldn't be started.");
        setIsSigningIn(false);
      }
    } catch (signInError) {
      setError(
        signInError instanceof Error
          ? signInError.message
          : "Google sign-in couldn't be started.",
      );
      setIsSigningIn(false);
    }
  }, [isConfigured, isSigningIn, promptAsync, request]);

  const signOut = useCallback(async () => {
    setError(null);
    try {
      await revokeMobileSession();
      await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
      setMobileAccessToken(null);
      setAccessToken(null);
      setUser(null);
    } catch (signOutError) {
      setError(
        signOutError instanceof Error
          ? `Couldn't safely sign out: ${signOutError.message}`
          : "Couldn't safely sign out. Please try again.",
      );
    }
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    accessToken,
    isLoading,
    isSigningIn,
    isConfigured,
    isReady: Boolean(request),
    error,
    signIn,
    signOut,
    clearError: () => setError(null),
  }), [accessToken, error, isConfigured, isLoading, isSigningIn, request, signIn, signOut, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider.");
  return context;
}
