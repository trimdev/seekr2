import { Container } from "@/components/ui/Container";

export default function ProfileLoading() {
  return (
    <div
      className="min-h-screen py-8"
      style={{ background: "var(--bg-base)" }}
    >
      <Container>
        {/* Header skeleton */}
        <div className="glass rounded-2xl p-6 mb-8 flex items-center gap-5 animate-pulse">
          <div
            className="w-16 h-16 rounded-full flex-shrink-0"
            style={{ background: "var(--bg-surface)" }}
          />
          <div className="flex-1 flex flex-col gap-2">
            <div
              className="h-5 w-40 rounded-lg"
              style={{ background: "var(--bg-surface)" }}
            />
            <div
              className="h-4 w-56 rounded-lg"
              style={{ background: "var(--bg-surface)" }}
            />
          </div>
          <div
            className="hidden sm:block h-10 w-28 rounded-xl flex-shrink-0"
            style={{ background: "var(--bg-surface)" }}
          />
        </div>

        {/* Section heading skeleton */}
        <div
          className="h-6 w-44 rounded-lg mb-5 animate-pulse"
          style={{ background: "var(--bg-surface)" }}
        />

        {/* Game cards skeleton */}
        <div className="grid gap-5 sm:grid-cols-2 mb-10">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="glass rounded-2xl overflow-hidden animate-pulse"
              style={{ border: "1px solid var(--border-dim)" }}
            >
              <div
                className="w-full h-36"
                style={{ background: "var(--bg-surface)" }}
              />
              <div className="p-4 flex flex-col gap-3">
                <div
                  className="h-5 w-3/4 rounded-lg"
                  style={{ background: "var(--bg-surface)" }}
                />
                <div
                  className="h-3 w-1/2 rounded-lg"
                  style={{ background: "var(--bg-surface)" }}
                />
                <div
                  className="h-2 w-full rounded-full"
                  style={{ background: "var(--bg-surface)" }}
                />
                <div
                  className="h-10 w-full rounded-xl"
                  style={{ background: "var(--bg-surface)" }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Voucher section skeleton */}
        <div
          className="h-6 w-52 rounded-lg mb-5 animate-pulse"
          style={{ background: "var(--bg-surface)" }}
        />
        <div
          className="glass rounded-2xl p-6 animate-pulse"
          style={{ border: "1px solid var(--border-dim)" }}
        >
          <div
            className="h-4 w-64 rounded-lg mb-4"
            style={{ background: "var(--bg-surface)" }}
          />
          <div className="flex gap-3">
            <div
              className="flex-1 h-12 rounded-xl"
              style={{ background: "var(--bg-surface)" }}
            />
            <div
              className="h-12 w-24 rounded-xl flex-shrink-0"
              style={{ background: "var(--bg-surface)" }}
            />
          </div>
        </div>
      </Container>
    </div>
  );
}
