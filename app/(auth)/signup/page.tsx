import { SignupForm } from "@/components/auth/SignupForm";
import { AppLogo } from "@/components/common/AppLogo";

export default function SignupPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="absolute inset-0 grid-pattern opacity-30" />
      <div className="relative z-10 w-full max-w-md rounded-2xl border bg-card p-8 shadow-elegant">
        <div className="mb-6 flex justify-center">
          <AppLogo size="md" />
        </div>
        <SignupForm />
      </div>
    </div>
  );
}
