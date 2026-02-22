import PredictionsNav from "@/components/PredictionsNav";

export default function PredictionsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      {/* ── Desktop sidebar ── */}
      <aside
        className="hidden md:flex w-56 shrink-0 flex-col border-r"
        style={{
          borderColor: "var(--border)",
          backgroundColor: "var(--surface)",
          position: "sticky",
          top: 0,
          height: "100vh",
          overflowY: "auto",
        }}
      >
        <PredictionsNav />
      </aside>

      {/* ── Content + mobile tab bar ── */}
      <div className="flex-1 min-w-0 flex flex-col pb-24">
        {/* Mobile sticky tab bar */}
        <div
          className="md:hidden sticky top-0 z-40 border-b"
          style={{
            backgroundColor: "var(--surface)",
            borderColor: "var(--border)",
          }}
        >
          <PredictionsNav mobile />
        </div>

        {/* Page content */}
        {children}
      </div>
    </div>
  );
}
