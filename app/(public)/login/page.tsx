import { LoginForm } from "@/components/public/login-form";

const emailEnabled = Boolean(process.env.AUTH_RESEND_KEY || process.env.RESEND_API_KEY);
const previewEnabled = !emailEnabled || process.env.NEXT_PUBLIC_AUTH_PREVIEW_LOGIN === "true";

export default function LoginPage() {
  return <LoginForm previewEnabled={previewEnabled} emailEnabled={emailEnabled} />;
}
