/**
 * Session storage implementation using Supabase
 * Stores Shopify OAuth session data
 */
import { Session } from "@shopify/shopify-api";
import { SessionStorage } from "@shopify/shopify-api/lib/session/types";
import { createClient } from "@supabase/supabase-js";

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required");
}

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export class SupabaseSessionStorage implements SessionStorage {
  async storeSession(session: Session): Promise<boolean> {
    try {
      const { error } = await supabase.from("shopify_sessions").upsert({
        id: session.id,
        shop: session.shop,
        state: session.state,
        is_online: session.isOnline,
        scope: session.scope,
        expires: session.expires?.toISOString(),
        access_token: session.accessToken,
        user_id: session.onlineAccessInfo?.associated_user?.id,
        user_first_name: session.onlineAccessInfo?.associated_user?.first_name,
        user_last_name: session.onlineAccessInfo?.associated_user?.last_name,
        user_email: session.onlineAccessInfo?.associated_user?.email,
        account_owner: session.onlineAccessInfo?.associated_user?.account_owner,
        locale: session.onlineAccessInfo?.associated_user?.locale,
        collaborator: session.onlineAccessInfo?.associated_user?.collaborator,
        updated_at: new Date().toISOString(),
      });

      if (error) {
        console.error("Error storing session:", error);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Failed to store session:", error);
      return false;
    }
  }

  async loadSession(id: string): Promise<Session | undefined> {
    try {
      const { data, error } = await supabase
        .from("shopify_sessions")
        .select("*")
        .eq("id", id)
        .single();

      if (error || !data) {
        return undefined;
      }

      const session = new Session({
        id: data.id,
        shop: data.shop,
        state: data.state,
        isOnline: data.is_online,
        scope: data.scope,
        expires: data.expires ? new Date(data.expires) : undefined,
        accessToken: data.access_token,
      });

      if (data.user_id) {
        session.onlineAccessInfo = {
          expires_in: 0,
          associated_user_scope: data.scope || "",
          associated_user: {
            id: data.user_id,
            first_name: data.user_first_name,
            last_name: data.user_last_name,
            email: data.user_email,
            account_owner: data.account_owner,
            locale: data.locale,
            collaborator: data.collaborator,
          },
        };
      }

      return session;
    } catch (error) {
      console.error("Failed to load session:", error);
      return undefined;
    }
  }

  async deleteSession(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("shopify_sessions")
        .delete()
        .eq("id", id);

      if (error) {
        console.error("Error deleting session:", error);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Failed to delete session:", error);
      return false;
    }
  }

  async deleteSessions(ids: string[]): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("shopify_sessions")
        .delete()
        .in("id", ids);

      if (error) {
        console.error("Error deleting sessions:", error);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Failed to delete sessions:", error);
      return false;
    }
  }

  async findSessionsByShop(shop: string): Promise<Session[]> {
    try {
      const { data, error } = await supabase
        .from("shopify_sessions")
        .select("*")
        .eq("shop", shop);

      if (error || !data) {
        return [];
      }

      return data.map((record) => {
        const session = new Session({
          id: record.id,
          shop: record.shop,
          state: record.state,
          isOnline: record.is_online,
          scope: record.scope,
          expires: record.expires ? new Date(record.expires) : undefined,
          accessToken: record.access_token,
        });

        if (record.user_id) {
          session.onlineAccessInfo = {
            expires_in: 0,
            associated_user_scope: record.scope || "",
            associated_user: {
              id: record.user_id,
              first_name: record.user_first_name,
              last_name: record.user_last_name,
              email: record.user_email,
              account_owner: record.account_owner,
              locale: record.locale,
              collaborator: record.collaborator,
            },
          };
        }

        return session;
      });
    } catch (error) {
      console.error("Failed to find sessions by shop:", error);
      return [];
    }
  }
}

export const sessionStorage = new SupabaseSessionStorage();
