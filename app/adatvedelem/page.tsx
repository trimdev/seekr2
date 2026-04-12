import { Container } from "@/components/ui/Container";

export const metadata = {
  title: "Adatkezelési Tájékoztató — Seekr",
  description: "Adatkezelési Tájékoztató",
};

export default function AdatvedelemPage() {
  return (
    <main className="pb-20">
      <Container className="py-12">
        <h1
          className="text-3xl font-black mb-6"
          style={{ fontFamily: "var(--font-cinzel), serif" }}
        >
          Adatkezelési Tájékoztató
        </h1>
        <p style={{ color: "var(--text-muted)" }}>
          Az Adatkezelési Tájékoztató hamarosan elérhetők lesz ezen az oldalon.
          Kérdés esetén keresd csapatunkat a{" "}
          <a
            href="mailto:hello@seekr.city"
            style={{ color: "var(--cyan)" }}
          >
            hello@seekr.city
          </a>{" "}
          e-mail címen.
        </p>
      </Container>
    </main>
  );
}
