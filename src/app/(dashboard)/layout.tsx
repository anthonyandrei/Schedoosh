import React from "react";
import NavigationBar from "@/components/navbar/NavigationBar";
import StoreProvider from "@/providers/StoreProvider";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <StoreProvider>
      <NavigationBar />
      <div className="flex flex-1 flex-col items-stretch overflow-y-auto">
        {children}
      </div>
    </StoreProvider>
  );
}
