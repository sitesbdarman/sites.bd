import { assertSameOrigin } from "@/lib/security/csrf";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { removeCartItem } from "@/lib/cart/queries";

interface RouteContext {
  params: Promise<{ itemId: string }>;
}

/**
 * DELETE /api/cart/[itemId]
 *
 * Signed-in users only. Ownership is enforced in removeCartItem (both an
 * explicit `.eq("owner_id", userId)` filter and RLS underneath), so a
 * missing item and someone else's item are both reported as "not found"
 * rather than leaking which is which.
 */
export async function DELETE(_request: Request, { params }: RouteContext) {
  const originError = assertSameOrigin(_request);
  if (originError) return originError;
  const { itemId } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ success: false, error: "Not authenticated." }, { status: 401 });
  }

  if (!itemId) {
    return NextResponse.json({ success: false, error: "Invalid cart item." }, { status: 400 });
  }

  const status = await removeCartItem(supabase, user.id, itemId);

  switch (status) {
    case "removed":
      return NextResponse.json({ success: true });
    case "not_found":
      return NextResponse.json({ success: false, error: "Cart item not found." }, { status: 404 });
    default:
      return NextResponse.json(
        { success: false, error: "Couldn't remove that item. Please try again." },
        { status: 500 },
      );
  }
}
