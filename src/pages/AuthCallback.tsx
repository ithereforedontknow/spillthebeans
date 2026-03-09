import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase/client";
import { upsertProfile } from "@/lib/supabase/queries";
import { PageSpinner } from "@/components/ui/Spinner";

export function AuthCallback() {
  const navigate = useNavigate();
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        try {
          await upsertProfile(session.user.id, {
            username:
              session.user.user_metadata?.name ??
              session.user.email?.split("@")[0],
          });
        } catch {
          /* profile may exist already */
        }
        navigate("/");
      } else {
        navigate("/login");
      }
    });
  }, [navigate]);
  return <PageSpinner />;
}
