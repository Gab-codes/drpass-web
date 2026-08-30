import { Link } from "react-router";

interface AuthLayoutProps {
  children: React.ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="flex min-h-svh w-full flex-col md:flex-row bg-background">
      {/* Brand Panel - Hidden on mobile, visible on medium screens and up */}
      <div className="hidden md:flex flex-col justify-between w-[40%] max-w-125 p-8 lg:p-12 bg-primary text-primary-foreground">
        <div>
          <Link
            to="/"
            className="text-2xl font-bold tracking-tight inline-flex items-center gap-2"
          >
            {/* Simple logo placeholder to keep it professional and not a loud marketing graphic */}
            <div className="size-6 bg-primary-foreground rounded-sm" />
            DrPass
          </Link>
          <p className="mt-4 text-primary-foreground/80 leading-relaxed max-w-sm">
            Your dedicated companion for university admission preparation.
            Professional, calm, and focused on your success.
          </p>
        </div>
        <div className="text-sm text-primary-foreground/60">
          © {new Date().getFullYear()} DrPass. All rights reserved.
        </div>
      </div>

      {/* Form Panel */}
      <div className="flex flex-1 flex-col justify-center p-6 sm:p-12 lg:p-24 bg-muted/20">
        <div className="w-full max-w-sm mx-auto">
          {/* Mobile Logo */}
          <div className="md:hidden flex justify-center mb-8">
            <Link
              to="/"
              className="text-2xl font-bold tracking-tight inline-flex items-center gap-2 text-foreground"
            >
              <div className="size-6 bg-primary rounded-sm" />
              DrPass
            </Link>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
