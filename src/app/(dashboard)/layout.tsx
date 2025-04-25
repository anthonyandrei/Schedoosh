import NavigationBar from "@/components/navbar/NavigationBar";
import StoreProvider from "@/providers/StoreProvider";
import React from "react";

type Props = {};

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <StoreProvider>
        <NavigationBar />
        {children}
      </StoreProvider>
    </>
  );
}
