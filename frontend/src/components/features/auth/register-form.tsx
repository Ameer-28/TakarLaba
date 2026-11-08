import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { User, Store, Mail, Lock, Loader2, AlertCircle, EyeIcon, EyeOffIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { registerSchema, type RegisterFormValues } from "./register-schema";

interface RegisterFormProps {
  onSubmit: (values: RegisterFormValues) => Promise<void>;
  authError: string | null;
  isSubmitting: boolean;
}

export function RegisterForm({ onSubmit, authError, isSubmitting }: RegisterFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      businessName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  return (
    <>
      {authError && (
        <div
          role="alert"
          className="mb-6 flex items-center gap-2 p-3 text-xs rounded-xl bg-destructive/10 text-destructive border border-destructive/20 font-medium"
        >
          <AlertCircle className="size-4 shrink-0" />
          <span>{authError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
        {/* Name */}
        <div>
          <div className="relative">
            <Input
              id="name"
              type="text"
              autoComplete="name"
              disabled={isSubmitting}
              placeholder="Business Owner Name"
              className="bg-transparent ps-10 h-9 text-sm"
              aria-invalid={errors.name ? "true" : "false"}
              aria-describedby={errors.name ? "name-error" : undefined}
              {...register("name")}
            />
            <User className="text-muted-foreground absolute start-3 top-1/2 size-5 -translate-y-1/2 pointer-events-none" />
          </div>
          {errors.name && (
            <p id="name-error" className="mt-1 text-xs text-destructive font-medium">
              {errors.name.message}
            </p>
          )}
        </div>

        {/* Business Name */}
        <div>
          <div className="relative">
            <Input
              id="businessName"
              type="text"
              autoComplete="organization"
              disabled={isSubmitting}
              placeholder="Culinary Business Name (e.g. Daily Roast)"
              className="bg-transparent ps-10 h-9 text-sm"
              aria-invalid={errors.businessName ? "true" : "false"}
              aria-describedby={errors.businessName ? "businessName-error" : undefined}
              {...register("businessName")}
            />
            <Store className="text-muted-foreground absolute start-3 top-1/2 size-5 -translate-y-1/2 pointer-events-none" />
          </div>
          {errors.businessName && (
            <p id="businessName-error" className="mt-1 text-xs text-destructive font-medium">
              {errors.businessName.message}
            </p>
          )}
        </div>

        {/* Email */}
        <div>
          <div className="relative">
            <Input
              id="email"
              type="email"
              autoComplete="email"
              disabled={isSubmitting}
              placeholder="Email Address"
              className="bg-transparent ps-10 h-9 text-sm"
              aria-invalid={errors.email ? "true" : "false"}
              aria-describedby={errors.email ? "email-error" : undefined}
              {...register("email")}
            />
            <Mail className="text-muted-foreground absolute start-3 top-1/2 size-5 -translate-y-1/2 pointer-events-none" />
          </div>
          {errors.email && (
            <p id="email-error" className="mt-1 text-xs text-destructive font-medium">
              {errors.email.message}
            </p>
          )}
        </div>

        {/* Password */}
        <div>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              disabled={isSubmitting}
              placeholder="Password (Min. 8 Characters)"
              className="bg-transparent ps-10 h-9 text-sm pr-10"
              aria-invalid={errors.password ? "true" : "false"}
              aria-describedby={errors.password ? "password-error" : undefined}
              {...register("password")}
            />
            <Lock className="text-muted-foreground absolute start-3 top-1/2 size-5 -translate-y-1/2 pointer-events-none" />
            <Button
              type="button"
              variant="ghost"
              className="absolute end-0 top-0 h-full cursor-pointer px-3 py-2 hover:bg-transparent"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeIcon className="text-muted-foreground size-4" />
              ) : (
                <EyeOffIcon className="text-muted-foreground size-4" />
              )}
            </Button>
          </div>
          {errors.password && (
            <p id="password-error" className="mt-1 text-xs text-destructive font-medium">
              {errors.password.message}
            </p>
          )}
        </div>

        {/* Confirm Password */}
        <div>
          <div className="relative">
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              autoComplete="new-password"
              disabled={isSubmitting}
              placeholder="Confirm Password"
              className="bg-transparent ps-10 h-9 text-sm pr-10"
              aria-invalid={errors.confirmPassword ? "true" : "false"}
              aria-describedby={errors.confirmPassword ? "confirmPassword-error" : undefined}
              {...register("confirmPassword")}
            />
            <Lock className="text-muted-foreground absolute start-3 top-1/2 size-5 -translate-y-1/2 pointer-events-none" />
            <Button
              type="button"
              variant="ghost"
              className="absolute end-0 top-0 h-full cursor-pointer px-3 py-2 hover:bg-transparent"
              onClick={() => setShowConfirmPassword((prev) => !prev)}
              aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
            >
              {showConfirmPassword ? (
                <EyeIcon className="text-muted-foreground size-4" />
              ) : (
                <EyeOffIcon className="text-muted-foreground size-4" />
              )}
            </Button>
          </div>
          {errors.confirmPassword && (
            <p id="confirmPassword-error" className="mt-1 text-xs text-destructive font-medium">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        <div className="pt-2">
          <Button
            className="h-9 px-4 py-2 w-full cursor-pointer"
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <div className="flex items-center gap-2">
                <Loader2 className="size-4 animate-spin" />
                <span>Registering Business...</span>
              </div>
            ) : (
              "Register & Get Started"
            )}
          </Button>
        </div>
      </form>
    </>
  );
}

export default RegisterForm;
