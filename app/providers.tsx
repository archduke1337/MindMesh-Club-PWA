"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider, type Attribute } from "next-themes";
import { AuthProvider } from "@/context/AuthContext";
import { PermissionProvider } from "@/context/PermissionContext";

export interface ProvidersProps {
  children: React.ReactNode;
  themeProps?: {
    attribute?: Attribute | Attribute[];
    defaultTheme?: string;
    storageKey?: string;
  };
}

export function Providers({ children, themeProps }: ProvidersProps) {
  return (
    <NextThemesProvider {...themeProps}>
      <AuthProvider>
        <PermissionProvider>{children}</PermissionProvider>
      </AuthProvider>
    </NextThemesProvider>
  );
}
