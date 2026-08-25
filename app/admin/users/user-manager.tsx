"use client";
import { useState } from "react";
import Link from "next/link";

type UserRow = {
  id: string;
  customer_id: string;
  full_name: string | null;
  email: string;
  mobile_number: string | null;
  role: string;
  profile_status: string;
  account_status: string;
  created_at: string;
};

export function UserManager({ initialUsers }: { initialUsers: UserRow[] }) {
  const [users, setUsers] = useState(initialUsers);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function toggleBan(u: UserRow) {
    const nextStatus = u.account_status === "suspended" ? "active" : "suspended";
    if (nextStatus === "suspended" && !confirm(`Ban ${u.email}? They will lose access to the dashboard and cannot place new orders.`)) return;
    setBusyId(u.id);
    setError("");
    try {
      const r = await fetch(`/api/admin/users/${u.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountStatus: nextStatus }),
      });
      const d = await r.json();
      if (r.ok && d.success) setUsers(users.map((x) => (x.id === u.id ? d.user : x)));
      else setError(d.error || "Could not update this customer.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section>
      <h1 className="text-2xl font-bold">Users</h1>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      <div className="mt-6 overflow-x-auto rounded-xl border bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              {["Customer ID", "Name", "Email", "Mobile", "Role", "Profile", "Account", "Joined", "Actions"].map((x) => (
                <th key={x} className="px-5 py-3">
                  {x}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {users.map((u) => (
              <tr key={u.id}>
                <td className="px-5 py-4 font-medium">{u.customer_id}</td>
                <td className="px-5 py-4">{u.full_name || "—"}</td>
                <td className="px-5 py-4">{u.email}</td>
                <td className="px-5 py-4">{u.mobile_number || "—"}</td>
                <td className="px-5 py-4">{u.role}</td>
                <td className="px-5 py-4">{u.profile_status}</td>
                <td className="px-5 py-4">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${u.account_status === "suspended" ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}>
                    {u.account_status === "suspended" ? "Banned" : "Active"}
                  </span>
                </td>
                <td className="px-5 py-4">{new Date(u.created_at).toLocaleDateString()}</td>
                <td className="px-5 py-4">
                  <div className="flex flex-wrap gap-2">
                    {u.role !== "admin" && (
                      <button disabled={busyId === u.id} onClick={() => toggleBan(u)} className={`rounded border px-3 py-1 disabled:opacity-50 ${u.account_status === "suspended" ? "border-emerald-200 text-emerald-700" : "border-red-200 text-red-600"}`}>
                        {u.account_status === "suspended" ? "Unban" : "Ban"}
                      </button>
                    )}
                    <Link href={`/admin/customers/${u.id}`} className="rounded border border-sky-200 bg-sky-50 px-3 py-1 text-sky-700">
                      Details
                    </Link>
                    <Link href={`/admin/domains?owner=${u.id}`} className="rounded border px-3 py-1">
                      Add Domain
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
