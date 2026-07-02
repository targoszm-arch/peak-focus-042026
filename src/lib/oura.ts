import { supabase } from "@/lib/supabase";

const OURA_CLIENT_ID = "7e27aab7-c93f-4acd-bb9b-cf083c82b33a";
const OURA_REDIRECT = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/oura-callback`;
const OURA_SCOPE =
  "email personal daily heartrate tag workout session spo2 ring_configuration stress heart_health";

export function connectOura(userId: string) {
  const url = new URL("https://cloud.ouraring.com/oauth/authorize");
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", OURA_CLIENT_ID);
  url.searchParams.set("redirect_uri", OURA_REDIRECT);
  url.searchParams.set("scope", OURA_SCOPE);
  url.searchParams.set("state", userId);
  window.location.href = url.toString();
}

export async function syncOura(): Promise<number> {
  const { data, error } = await supabase.functions.invoke("oura-sync", { method: "POST" });
  if (error) throw error;
  return (data as { rows?: number })?.rows ?? 0;
}

export async function disconnectOura(userId: string) {
  await supabase.from("oura_connections").delete().eq("user_id", userId);
}
