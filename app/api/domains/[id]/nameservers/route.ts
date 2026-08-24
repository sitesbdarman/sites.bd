import { assertSameOrigin } from "@/lib/security/csrf";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({
  nameservers: z.array(z.string().trim().min(1).max(253)).min(2).max(4),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const originError = assertSameOrigin(request);
  if (originError) return originError;
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Provide 2 to 4 nameservers." }, { status: 400 });
  const [nameserver1, nameserver2, nameserver3, nameserver4] = parsed.data.nameservers;
  const { data, error } = await supabase.from("domains").update({ nameserver1, nameserver2, nameserver3: nameserver3 ?? null, nameserver4: nameserver4 ?? null }).eq("id", id).eq("owner_id", user.id).select("id,domain_name,nameserver1,nameserver2,nameserver3,nameserver4").maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Domain not found" }, { status: 404 });
  return NextResponse.json({ domain: data });
}
