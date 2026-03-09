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
        const meta = session.user.user_metadata ?? {};
        try {
          await upsertProfile(session.user.id, {
            username:
              meta.full_name ?? meta.name ?? session.user.email?.split("@")[0],
            // Google exposes the photo as 'picture', Supabase re-maps it to 'avatar_url'
            avatar_url: meta.avatar_url ?? meta.picture ?? null,
          });
        } catch {
          /* profile row may already exist — upsert handles it */
        }
        navigate("/");
      } else {
        navigate("/login");
      }
    });
  }, [navigate]);
  return <PageSpinner />;
}
