import { Container } from "@/components/ui/Container";

export const metadata = {
  title: "ÁSZF — Seekr",
  description: "Általános Szerződési Feltételek",
};

export default function AszfPage() {
  return (
    <main className="pb-20">
      <Container className="py-12">
        <h1
          className="text-3xl font-black mb-6"
          style={{ fontFamily: "var(--font-cinzel), serif" }}
        >
          Általános Szerződési Feltételek
        </h1>
        <p style={{ color: "var(--text-muted)" }}>
          Az Általános Szerződési Feltételek hamarosan elérhetők lesznek ezen az oldalon.
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
