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
        <div className="overflow-y-auto flex-1 flex flex-col items-stretch">
          {children}
        </div>
      </StoreProvider>
    </>
  );
}
