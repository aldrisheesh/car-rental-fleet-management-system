import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { SignInDialog } from "@/components/site/SignInDialog";

export const Route = createFileRoute("/sign-in")({
  head: () => ({
    meta: [
      { title: "Sign In - Briah's Car Rental" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: SignInModalRoute,
});

function SignInModalRoute() {
  const navigate = useNavigate();

  return (
    <SignInDialog
      open
      closeOnSuccess={false}
      onOpenChange={(open) => {
        if (!open) {
          void navigate({ to: "/", replace: true });
        }
      }}
    />
  );
}
