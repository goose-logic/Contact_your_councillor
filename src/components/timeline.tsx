type TimelineUpdate = {
  id: string;
  message: string;
  authorRole: string;
  visibleToCitizen: boolean;
  createdAt: Date;
  author: { name: string };
};

const ROLE_LABELS: Record<string, string> = {
  CITIZEN: "Resident",
  COUNCILLOR: "Councillor",
  TEAM_MEMBER: "Council team",
  ADMIN: "Admin",
};

export function Timeline({ updates, showVisibility = false }: { updates: TimelineUpdate[]; showVisibility?: boolean }) {
  if (updates.length === 0) {
    return <p className="text-sm text-slate-500">No updates yet.</p>;
  }

  return (
    <ol className="flex flex-col gap-3">
      {updates.map((u) => (
        <li key={u.id} className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
            <span className="font-medium text-slate-700">
              {u.author.name} &middot; {ROLE_LABELS[u.authorRole] ?? u.authorRole}
            </span>
            <span>
              {u.createdAt.toLocaleString("en-GB", {
                day: "numeric",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
          <p className="mt-2 text-sm text-slate-800 whitespace-pre-wrap">{u.message}</p>
          {showVisibility && !u.visibleToCitizen && (
            <p className="mt-2 text-xs font-medium text-amber-600">Internal only &mdash; not visible to resident</p>
          )}
        </li>
      ))}
    </ol>
  );
}
