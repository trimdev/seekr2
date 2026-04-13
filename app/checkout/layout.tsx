import Script from "next/script";

// Preload Stripe.js for every checkout page so the script is already
// parsed by the time the PaymentElement mounts.
export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Script
        src="https://js.stripe.com/v3/"
        strategy="beforeInteractive"
      />
      {children}
    </>
  );
}
