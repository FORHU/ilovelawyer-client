import { DeviceProvider } from "@/components/device/device-provider";
import { AppShell } from "@/components/shell/app-shell";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <DeviceProvider>
      <AppShell>{children}</AppShell>
    </DeviceProvider>
  );
}
