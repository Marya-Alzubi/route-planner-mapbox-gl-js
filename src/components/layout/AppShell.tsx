import type { ReactNode } from "react";

export default function AppShell({
  sidebar,
  main,
}: {
  sidebar: ReactNode;
  main: ReactNode;
}) {
  return (
    <div className="h-screen w-screen overflow-hidden bg-white">
      <div className="flex h-full w-full">
        <aside className="w-[360px] shrink-0 border-r bg-white">
          {sidebar}
        </aside>

        <main className="relative flex-1">{main}</main>
      </div>
    </div>
  );
}
