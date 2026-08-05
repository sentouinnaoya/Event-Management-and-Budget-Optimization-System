"use client";

import { useEffect, useRef } from "react";
import { Provider } from "react-redux";
import { makeStore, type AppStore } from "../lib/store";
import { setCredentials, setInitialized } from "../features/auth/authSlice";

export default function Providers({ children }: { children: React.ReactNode }) {
  const storeRef = useRef<AppStore | null>(null);
  if (!storeRef.current) storeRef.current = makeStore();
  const store = storeRef.current;

  useEffect(() => {
    const token = localStorage.getItem("embos_token");
    const rawUser = localStorage.getItem("embos_user");
    if (token && rawUser) {
      try {
        store.dispatch(setCredentials({ token, user: JSON.parse(rawUser) }));
      } catch {
        localStorage.removeItem("embos_token");
        localStorage.removeItem("embos_user");
      }
    }
    store.dispatch(setInitialized());
  }, [store]);

  return <Provider store={store}>{children}</Provider>;
}
