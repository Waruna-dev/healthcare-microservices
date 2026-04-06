import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Clock3,
  CreditCard,
  HeartPulse,
  LockKeyhole,
  ShieldCheck,
  Stethoscope,
  UserRound,
} from "lucide-react";
import heroImage from "../../assets/hero.png";

const createPaymentPayload = () => ({
  orderId: `PAY-${Date.now()}-${Math.floor(Math.random() * 900 + 100)}`,
  appointmentId: `APT-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}`,
  patientName: "Nimal Perera",
  doctorName: "A. Fernando",
  department: "Cardiology",
  appointmentDate: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
  appointmentTime: "10:30",
  amount: 1000,
  email: "nimal@example.com",
});

const appointmentPreview = {
  patientName: "Nimal Perera",
  doctorName: "A. Fernando",
  department: "Cardiology",
  appointmentDate: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
  appointmentTime: "10:30 AM",
  amount: 1000,
  email: "ru@gmail.com",
};

const trustPoints = [
  "End-to-end secure Stripe checkout",
  "Instant confirmation after successful payment",
  "Appointment details synced with your booking flow",
];

const formatAppointmentDate = (value) =>
  new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-LK", {
    style: "currency",
    currency: "LKR",
    minimumFractionDigits: 2,
  }).format(value);

const parseResponseBody = async (response) => {
  const rawBody = await response.text();

  if (!rawBody) {
    return {};
  }

  try {
    return JSON.parse(rawBody);
  } catch {
    return {
      success: false,
      message: rawBody,
    };
  }
};

const getResponseErrorMessage = (response, data, fallbackMessage) => {
  const message =
    data?.message ||
    data?.error ||
    fallbackMessage ||
    `Request failed with status ${response.status}`;

  if (
    typeof message === "string" &&
    message.toLowerCase().includes("error occurred while trying to proxy")
  ) {
    return "Payment service is unavailable right now. Please make sure the API gateway and payment service are running, then try again.";
  }

  return message;
};

function PaymentPage() {
  const apiBaseUrl =
    import.meta.env.VITE_PAYMENT_API_URL ?? "/api/payments";

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const paymentResult = searchParams.get("payment");
    const orderId = searchParams.get("orderId");

    if (!paymentResult || !orderId) {
      return undefined;
    }

    let isCancelled = false;

    const syncPaymentStatus = async () => {
      if (paymentResult === "cancel") {
        setErrorMessage(`Payment cancelled for order ${orderId}.`);
        return;
      }

      setSuccessMessage(`Checking payment status for ${orderId}...`);

      for (let attempt = 0; attempt < 5; attempt += 1) {
        try {
          const response = await fetch(`${apiBaseUrl}/${orderId}`);
          const data = await parseResponseBody(response);

          if (!response.ok || !data.success) {
            throw new Error(
              getResponseErrorMessage(
                response,
                data,
                "Unable to load payment status",
              ),
            );
          }

          if (isCancelled) {
            return;
          }

          if (data.isPaid) {
            setSuccessMessage(`Payment successful for order ${orderId}.`);
            return;
          }

          if (
            data.payment?.status === "FAILED" ||
            data.payment?.status === "EXPIRED"
          ) {
            setErrorMessage(`Payment status: ${data.payment.status}`);
            setSuccessMessage("");
            return;
          }
        } catch (error) {
          if (isCancelled) {
            return;
          }

          setErrorMessage(error.message);
          setSuccessMessage("");
          return;
        }

        await new Promise((resolve) => {
          window.setTimeout(resolve, 2000);
        });
      }

      if (!isCancelled) {
        setSuccessMessage(
          `Payment is still pending for order ${orderId}. Please refresh shortly.`,
        );
      }
    };

    syncPaymentStatus();

    return () => {
      isCancelled = true;
    };
  }, [apiBaseUrl]);

  const handleCheckout = async () => {
    setIsSubmitting(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const payload = createPaymentPayload();
      const response = await fetch(`${apiBaseUrl}/create-checkout-session`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await parseResponseBody(response);

      if (!response.ok || !data.success) {
        throw new Error(
          getResponseErrorMessage(
            response,
            data,
            "Unable to create appointment checkout session",
          ),
        );
      }

      setSuccessMessage("Redirecting to Stripe Checkout...");
      window.location.href = data.url;
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-background font-body text-on-surface">
      <div className="absolute inset-0 mesh-bg opacity-80" />
      <div className="absolute left-[-10%] top-[-8%] h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
      <div className="absolute bottom-[-10%] right-[-5%] h-80 w-80 rounded-full bg-secondary-fixed/30 blur-3xl" />

      <main className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6 flex justify-end">
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-full border border-outline-variant/50 bg-white/80 px-4 py-2.5 text-sm font-bold text-on-surface shadow-sm backdrop-blur-md transition hover:-translate-y-0.5 hover:text-primary"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
        </div>

        <section className="grid flex-1 gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="relative overflow-hidden rounded-4xl border border-white/50 bg-primary shadow-elevated">
            <img
              src={heroImage}
              alt="Healthcare payment experience"
              className="absolute inset-0 h-full w-full object-cover opacity-70"
            />
            <div className="absolute inset-0 bg-[linear-gradient(140deg,rgba(28,17,111,0.92),rgba(53,37,205,0.72),rgba(53,37,205,0.32))]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(111,251,190,0.22),transparent_28%)]" />

            <div className="relative z-10 flex h-full min-h-80 flex-col justify-between p-6 text-white sm:p-8 lg:min-h-160 lg:p-10">
              <div className="flex flex-wrap items-center gap-3">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 backdrop-blur-md">
                  <ShieldCheck className="h-4 w-4" />
                  <span className="text-xs font-bold uppercase tracking-[0.18em]">
                    Secure medical checkout
                  </span>
                </div>
                <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 backdrop-blur-md">
                  <HeartPulse className="h-4 w-4" />
                  <span className="text-xs font-bold uppercase tracking-[0.18em]">
                    CareSync pay
                  </span>
                </div>
              </div>

              <div className="max-w-xl">
                <p className="mb-4 text-sm font-semibold uppercase tracking-[0.24em] text-white/70">
                  Appointment payment
                </p>
                <h1 className="font-headline text-4xl font-extrabold leading-tight sm:text-5xl lg:text-6xl">
                  A calmer way to
                  <br />
                  <span className="text-secondary-fixed">complete care.</span>
                </h1>
                <p className="mt-5 max-w-lg text-base leading-8 text-white/80 sm:text-lg">
                  Review your visit details, confirm the amount, and continue to
                  Stripe with a checkout flow that feels simple and trustworthy.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {trustPoints.map((item) => (
                  <div
                    key={item}
                    className="rounded-2xl border border-white/10 bg-white/10 p-4 text-sm leading-6 text-white/85 backdrop-blur-md"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="glass-card flex flex-col rounded-4xl p-5 sm:p-7 lg:p-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
                  Step 3 of 3
                </p>
                <h2 className="mt-2 font-headline text-3xl font-extrabold text-on-surface">
                  Confirm and pay
                </h2>
                <p className="mt-2 max-w-md text-sm leading-7 text-on-surface-variant sm:text-base">
                  Everything is ready. Check the appointment summary below and
                  continue to the Stripe payment page.
                </p>
              </div>

              <div className="rounded-2xl border border-primary/15 bg-primary/5 px-4 py-3 text-right">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                  Payable now
                </p>
                <p className="mt-1 font-headline text-2xl font-extrabold text-primary">
                  {formatCurrency(appointmentPreview.amount)}
                </p>
              </div>
            </div>

            <div className="mt-6 rounded-[1.5rem] border border-outline-variant/35 bg-surface-container-lowest p-4 sm:p-5">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                  <LockKeyhole className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-headline text-lg font-bold">
                    Secure payment protected by Stripe
                  </p>
                  <p className="text-sm leading-6 text-on-surface-variant">
                    You will be redirected to complete the transaction with
                    encrypted card handling.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-[1.5rem] border border-outline-variant/35 bg-white/80 p-4">
                <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-on-surface-variant">
                  <UserRound className="h-4 w-4 text-primary" />
                  Patient
                </div>
                <p className="font-headline text-lg font-bold">
                  {appointmentPreview.patientName}
                </p>
                <p className="mt-1 text-sm text-on-surface-variant">
                  {appointmentPreview.email}
                </p>
              </div>

              <div className="rounded-[1.5rem] border border-outline-variant/35 bg-white/80 p-4">
                <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-on-surface-variant">
                  <Stethoscope className="h-4 w-4 text-primary" />
                  Consultant
                </div>
                <p className="font-headline text-lg font-bold">
                  Dr. {appointmentPreview.doctorName}
                </p>
                <p className="mt-1 text-sm text-on-surface-variant">
                  {appointmentPreview.department}
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-[1.5rem] border border-outline-variant/35 bg-surface-container-lowest p-5">
              <div className="flex items-center justify-between gap-4 border-b border-outline-variant/30 pb-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                    <CalendarDays className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-on-surface-variant">
                      Appointment date
                    </p>
                    <p className="font-headline text-lg font-bold">
                      {formatAppointmentDate(appointmentPreview.appointmentDate)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                    <Clock3 className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-on-surface-variant">
                      Time
                    </p>
                    <p className="font-headline text-lg font-bold">
                      {appointmentPreview.appointmentTime}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-end justify-between gap-4 pt-4">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-on-surface-variant">
                    Total amount
                  </p>
                  <p className="mt-2 font-headline text-3xl font-extrabold text-on-surface">
                    {formatCurrency(appointmentPreview.amount)}
                  </p>
                </div>

                <div className="rounded-2xl bg-primary text-white shadow-lg shadow-primary/20">
                  <div className="flex items-center gap-3 px-4 py-3">
                    <CreditCard className="h-5 w-5" />
                    <span className="text-sm font-bold">Stripe Checkout</span>
                  </div>
                </div>
              </div>
            </div>

            {errorMessage ? (
              <div className="mt-5 rounded-2xl border border-error/20 bg-error-container px-4 py-3 text-sm font-medium text-error">
                {errorMessage}
              </div>
            ) : null}

            {successMessage ? (
              <div className="mt-5 rounded-2xl border border-secondary/20 bg-secondary-container px-4 py-3 text-sm font-medium text-secondary">
                {successMessage}
              </div>
            ) : null}

            <button
              type="button"
              onClick={handleCheckout}
              disabled={isSubmitting}
              className="mt-6 flex w-full items-center justify-center gap-3 rounded-[1.25rem] bg-linear-to-r from-primary via-primary-container to-primary px-6 py-4 font-headline text-lg font-bold text-white shadow-lg shadow-primary/25 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/30 disabled:cursor-not-allowed disabled:opacity-70"
            >
              <span>
                {isSubmitting
                  ? "Opening Stripe Checkout..."
                  : "Continue to secure payment"}
              </span>
              {!isSubmitting ? <ArrowRight className="h-5 w-5" /> : null}
            </button>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm text-on-surface-variant">
              <p>Need to update the booking before paying?</p>
              <Link to="/" className="font-bold text-primary hover:underline">
                Return to appointments
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default PaymentPage;
