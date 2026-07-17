import ResultsNav from "@/components/ResultsNav";

export default function ResultsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="md:flex md:min-h-[calc(100vh-4rem)]">
      <aside
        className="hidden md:block w-56 shrink-0 border-r sticky top-16 self-start h-[calc(100vh-4rem)]"
        style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}
      >
        <ResultsNav />
      </aside>
      <div className="flex-1 min-w-0">
        <div
          className="md:hidden sticky top-0 z-30 border-b"
          style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}
        >
          <ResultsNav mobile />
        </div>
        <div className="pb-24 md:pb-8">{children}</div>
      </div>
    </div>
  );
}
