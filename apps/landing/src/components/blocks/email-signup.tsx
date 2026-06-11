import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface EmailSignupProps {
  heading?: string;
  description?: string;
  product?: string;
  list?: string;
  className?: string;
}

export const EmailSignup = ({
  heading = "Stay in the loop",
  description = "Get notified about new plugins, updates, and freebies.",
  product,
  list,
  className,
}: EmailSignupProps) => {
  const [status, setStatus] = useState<
    "idle" | "submitting" | "success" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMessage("");

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;

    if (!email || !email.includes("@")) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }

    setStatus("submitting");

    try {
      const response = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, product, list }),
      });

      if (response.ok) {
        setStatus("success");
      } else {
        const errorData = await response.json().catch(() => ({}));
        setErrorMessage(
          (errorData as { error?: string }).error ||
            "Something went wrong. Please try again.",
        );
        setStatus("error");
      }
    } catch {
      setErrorMessage("Network error. Please try again.");
      setStatus("error");
    }
  }

  return (
    <section className={cn("py-28 lg:py-32", className)}>
      <div className="container">
        <div className="mx-auto max-w-xl text-center">
          <h2 className="text-2xl tracking-tight md:text-3xl">{heading}</h2>
          <p className="text-muted-foreground mt-3 leading-relaxed">
            {description}
          </p>

          {status === "success" ? (
            <div className="mt-8 rounded-xl border p-6">
              <p className="text-foreground font-medium">Check your inbox!</p>
              <p className="text-muted-foreground mt-1 text-sm">
                We've sent you a confirmation email. Click the link to complete
                your subscription.
              </p>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="mt-8 flex flex-col gap-3 sm:flex-row"
            >
              <Input
                name="email"
                type="email"
                placeholder="you@example.com"
                required
                className="flex-1"
              />
              <Button type="submit" disabled={status === "submitting"}>
                {status === "submitting" ? "Subscribing..." : "Subscribe"}
              </Button>
            </form>
          )}

          {status === "error" && errorMessage && (
            <p className="text-destructive mt-3 text-sm">{errorMessage}</p>
          )}

          <p className="text-muted-foreground mt-3 text-xs">
            No spam, ever. Unsubscribe anytime.
          </p>
        </div>
      </div>
    </section>
  );
};
