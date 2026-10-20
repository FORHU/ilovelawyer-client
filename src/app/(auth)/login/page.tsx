import { Suspense } from "react";
import { UnifiedAuth } from "@/components/auth/unified-auth";

export default function LoginPage() {
  return (
    <Suspense>
      <UnifiedAuth />
    </Suspense>
  );
}
