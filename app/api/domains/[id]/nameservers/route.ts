import { assertSameOrigin } from "@/lib/security/csrf";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const hostname = z.string().trim().min(1).max(253).regex(/^(?=.{1,253}\.?$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}\.?$/i, "Enter a valid nameserver hostname.");
const schema = z.object({ nameservers: z.array(hostname).min(2).max(4) });

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const originError = assertSameOrigin(request);
  if (originError) return originError;
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid request body." }, { status: 400 }); }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Provide 2 to 4 valid nameservers." }, { status: 400 });
  const unique = Array.from(new Set(parsed.data.nameservers.map((x) => x.toLowerCase().replace(/\.$/, ""))));
  if (unique.length < 2) return NextResponse.json({ error: "Provide at least two different nameservers." }, { status: 400 });
  const [nameserver1, nameserver2, nameserver3 = null, nameserver4 = null] = unique;
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("domains")
    .update({ nameserver1, nameserver2, nameserver3, nameserver4 })
    .eq("id", id)
    .eq("owner_id", user.id)
    .select("id,domain_name,nameserver1,nameserver2,nameserver3,nameserver4")
    .maybeSingle();
  if (error) return NextResponse.json({ error: "We could not save the nameservers. Please check that the DNS schema migration is installed." }, { status: 500 });
  if (!data) return NextResponse.json({ error: "This domain could not be found in your account." }, { status: 404 });
  return NextResponse.json({ domain: data });
}
