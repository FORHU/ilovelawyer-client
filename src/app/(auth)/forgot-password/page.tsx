import { redirect } from "next/navigation";

// Recovery lives as a tab on the unified /login page; this route keeps /forgot-password links working.
export default function ForgotPasswordRedirect() {
  redirect("/login?tab=recover");
}
