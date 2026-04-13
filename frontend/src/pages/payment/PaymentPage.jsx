import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
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
import Navbar from "../../components/Navbar";
import heroImage from "../../assets/images/hero2.jpg";
import { appointmentAPI } from "../../services/api";

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
  }).format(Number(value || 0));

const formatDisplayTime = (value = "") => {
  if (!value) {
    return "Not scheduled";
  }

  const [hours, minutes] = `${value}`.split(":");
  if (hours === undefined || minutes === undefined) {
    return value;
  }

  const date = new Date();
  date.setHours(Number(hours), Number(minutes), 0, 0);

  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
};

const getStoredPatient = () => {
  const storedUser = localStorage.getItem("user");

  if (!storedUser) {
    return null;
  }

  try {
    const parsedUser = JSON.parse(storedUser);
    return parsedUser.patient || parsedUser;
  } catch {
    return null;
  }
};

const buildPaymentPayload = (appointment, patient) => {
  const appointmentId = appointment?._id || appointment?.id || "";
  const patientId = patient?._id || patient?.id || appointment?.patientId || "";
  const patientName =
    patient?.name || appointment?.patientName || "CareSync Patient";
  const patientEmail =
    patient?.email || appointment?.patientEmail || appointment?.email || "";
  const patientPhoneNumber =
    patient?.contactNumber ||
    patient?.phoneNumber ||
    appointment?.patientPhoneNumber ||
    appointment?.phoneNumber ||
    "";

  return {
    orderId: `PAY-${appointmentId}-${Date.now()}`,
    appointmentId,
    patientId,
    customerName: patientName,
    customerEmail: patientEmail,
    customerPhoneNumber: patientPhoneNumber,
    patientName,
    doctorName: appointment?.doctorName || "",
    department:
      appointment?.doctorSpecialty || appointment?.department || "Consultation",
    appointmentDate: appointment?.date
      ? new Date(appointment.date).toISOString().slice(0, 10)
      : "",
    appointmentTime: appointment?.startTime || "",
    amount: Number(appointment?.consultationFee || 0),
    currency: "lkr",
  };
};

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

const getUserFriendlyErrorMessage = (
  message,
  fallbackMessage = "Something went wrong. Please try again.",
) => {
  const normalizedMessage = `${message || ""}`.trim();
  const lowerMessage = normalizedMessage.toLowerCase();

  if (!normalizedMessage) {
    return fallbackMessage;
  }

  if (
    lowerMessage.includes("request failed with status code 404") ||
    lowerMessage.includes("request failed with status 404") ||
    lowerMessage.includes("route not found") ||
    lowerMessage.includes("not found")
  ) {
    return "Payment details are temporarily unavailable. Please refresh and try again.";
  }

  if (
    lowerMessage.includes("network error") ||
    lowerMessage.includes("failed to fetch") ||
    lowerMessage.includes("error occurred while trying to proxy")
  ) {
    return "Payment service is temporarily unavailable. Please try again shortly.";
  }

  return normalizedMessage;
};

function PaymentPage() {
  const { appointmentId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const apiBaseUrl = import.meta.env.VITE_PAYMENT_API_URL ?? "/api/payments";

  const [appointment, setAppointment] = useState(
    location.state?.appointment || null,
  );
  const [loadingAppointment, setLoadingAppointment] = useState(
    Boolean(appointmentId && !location.state?.appointment),
  );
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 4000);
  };

  useEffect(() => {
    if (location.state?.appointment) {
      setAppointment(location.state.appointment);
      setLoadingAppointment(false);
    }
  }, [location.state]);

  useEffect(() => {
    if (!appointmentId) {
      setLoadingAppointment(false);
      return undefined;
    }

    const appointmentFromState = location.state?.appointment;
    if (
      appointmentFromState &&
      `${appointmentFromState._id || appointmentFromState.id}` === appointmentId
    ) {
      setAppointment(appointmentFromState);
      setLoadingAppointment(false);
      return undefined;
    }

    let isCancelled = false;

    const loadAppointment = async () => {
      setLoadingAppointment(true);

      try {
        const data = await appointmentAPI.getAppointmentById(appointmentId);

        if (isCancelled) {
          return;
        }

        if (!data?.success || !data?.appointment) {
          throw new Error("Appointment not found.");
        }

        setAppointment(data.appointment);
      } catch (error) {
        if (!isCancelled) {
          setErrorMessage(
            getUserFriendlyErrorMessage(
              error?.response?.data?.message || error.message,
              "Unable to load appointment details.",
            ),
          );
        }
      } finally {
        if (!isCancelled) {
          setLoadingAppointment(false);
        }
      }
    };

    loadAppointment();

    return () => {
      isCancelled = true;
    };
  }, [appointmentId, location.state]);

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
        const cancelMessage = "Payment cancelled. Please try again or choose another payment method.";
        setErrorMessage(cancelMessage);
        showToast(cancelMessage, "error");
        return;
      }

      setSuccessMessage("Checking payment status...");

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
            const successText = "Payment completed successfully.";
            setSuccessMessage(successText);
            showToast(successText, "success");
            setTimeout(() => {
              navigate("/appointments/all", {
                state: { message: "Payment completed successfully." },
              });
            }, 1200);
            return;
          }

          if (
            data.payment?.status === "FAILED" ||
            data.payment?.status === "EXPIRED"
          ) {
            const failText = `Payment status: ${data.payment.status}`;
            setErrorMessage(failText);
            setSuccessMessage("");
            showToast(failText, "error");
            return;
          }
        } catch (error) {
          if (isCancelled) {
            return;
          }

          const errorText = getUserFriendlyErrorMessage(
            error.message,
            "Unable to load payment status.",
          );
          setErrorMessage(errorText);
          setSuccessMessage("");
          showToast(errorText, "error");
          return;
        }

        await new Promise((resolve) => {
          window.setTimeout(resolve, 2000);
        });
      }

      if (!isCancelled) {
        setSuccessMessage(
          "Payment is still pending. Please refresh shortly.",
        );
      }
    };

    syncPaymentStatus();

    return () => {
      isCancelled = true;
    };
  }, [apiBaseUrl, navigate]);

  const handleCheckout = async () => {
    if (!appointment) {
      setErrorMessage("Appointment details are not available yet.");
      return;
    }

    if (appointment.status !== "accepted") {
      setErrorMessage("Only accepted appointments can be paid.");
      return;
    }

    if (appointment.paymentStatus !== "pending") {
      setErrorMessage("This appointment no longer requires payment.");
      return;
    }

    const payload = buildPaymentPayload(appointment, getStoredPatient());

    if (!payload.customerEmail) {
      setErrorMessage("Patient email is required before starting payment.");
      return;
    }

    if (!payload.amount) {
      setErrorMessage("Consultation fee is missing for this appointment.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
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
      const errorText = getUserFriendlyErrorMessage(
        error.message,
        "Unable to create checkout session.",
      );
      setErrorMessage(errorText);
      showToast(errorText, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const patient = getStoredPatient();
  const patientName = patient?.name || appointment?.patientName || "Patient";
  const patientEmail =
    patient?.email ||
    appointment?.patientEmail ||
    appointment?.email ||
    "No email available";
  const doctorName = appointment?.doctorName || "Care team";
  const department =
    appointment?.doctorSpecialty || appointment?.department || "Consultation";
  const appointmentDate = appointment?.date || new Date().toISOString();
  const appointmentTime = formatDisplayTime(appointment?.startTime);
  const consultationFee = Number(appointment?.consultationFee || 0);
  const serviceFee = Number(appointment?.serviceFee || 0);
  const taxAmount = Number(appointment?.taxAmount || 0);
  const discountAmount = Number(
    appointment?.discountAmount || appointment?.discount || 0,
  );
  const payableAmount = Math.max(
    0,
    consultationFee + serviceFee + taxAmount - discountAmount,
  );
  const canCheckout =
    Boolean(appointment) &&
    appointment?.status === "accepted" &&
    appointment?.paymentStatus === "pending";

  return (

    <div className="relative min-h-screen overflow-hidden bg-background font-body text-on-surface">
      <Navbar />
      <style>{`
        @keyframes float {
          0% { transform: translate(0, 0) rotate(0deg); }
          50% { transform: translate(10px, -18px) rotate(2deg); }
          100% { transform: translate(0, 0) rotate(0deg); }
        }

        @keyframes heroZoom {
          0% { transform: scale(1) translateY(0); }
          100% { transform: scale(1.06) translateY(-10px); }
        }
      `}</style>
      <div className="absolute inset-0 mesh-bg opacity-80" />
      <div className="absolute left-[-10%] top-[-8%] h-72 w-72 rounded-full bg-primary/10 blur-3xl animate-[float_16s_ease-in-out_infinite]" />
      <div className="absolute bottom-[-10%] right-[-5%] h-80 w-80 rounded-full bg-secondary-fixed/30 blur-3xl animate-[float_14s_ease-in-out_infinite]" />
      <div className="absolute right-10 top-32 h-40 w-40 rounded-full bg-white/10 blur-3xl animate-[float_18s_ease-in-out_infinite]" />
      <div className="absolute left-10 bottom-32 h-32 w-32 rounded-full bg-sky-400/10 blur-3xl animate-[float_20s_ease-in-out_infinite]" />

      <main className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 pt-28 pb-6 sm:px-6 lg:px-8">
        {toast.show && (
          <div className="fixed left-1/2 top-28 z-50 w-[min(92vw,420px)] -translate-x-1/2 rounded-3xl border px-4 py-3 shadow-2xl shadow-black/10 backdrop-blur-xl transition-all duration-300"
            style={{
              backgroundColor: toast.type === "error" ? "rgba(254,242,242,0.95)" : "rgba(236,252,239,0.95)",
              borderColor: toast.type === "error" ? "rgba(248,113,113,0.24)" : "rgba(16,185,129,0.24)",
            }}
          >
            <div className="flex items-center gap-3">
              <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${toast.type === "error" ? "bg-error/10 text-error" : "bg-emerald-100 text-emerald-700"}`}>
                {toast.type === "error" ? (
                  <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-1-9V6a1 1 0 112 0v3a1 1 0 01-2 0zm0 4a1 1 0 112 0 1 1 0 01-2 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.707a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className={`font-semibold ${toast.type === "error" ? "text-error" : "text-emerald-800"}`}>
                  {toast.type === "error" ? "Payment error" : "Payment success"}
                </p>
                <p className="mt-1 text-sm text-slate-700 break-words">
                  {toast.message}
                </p>
              </div>
            </div>
          </div>
        )}
        <div className="mb-6 flex justify-end">
          <Link
            to="/appointments/all"
            className="inline-flex items-center gap-2 rounded-full border border-outline-variant/50 bg-white/80 px-4 py-2.5 text-sm font-bold text-on-surface shadow-sm backdrop-blur-md transition hover:-translate-y-0.5 hover:text-primary"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Appointments
          </Link>
        </div>

        <section className="grid flex-1 gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="relative overflow-hidden rounded-4xl border border-white/50 bg-primary shadow-elevated">
            <img
              src={heroImage}
              alt="Healthcare payment experience"
              className="absolute inset-0 h-full w-full object-cover opacity-70"
              style={{ animation: 'heroZoom 28s ease-in-out infinite alternate' }}
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
                  {loadingAppointment
                    ? "Loading your appointment summary before checkout."
                    : "Everything is ready. Check the appointment summary below and continue to the Stripe payment page."}
                </p>
              </div>

              <div className="rounded-2xl border border-primary/15 bg-primary/5 px-4 py-3 text-right">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                  Payable now
                </p>
                <p className="mt-1 font-headline text-2xl font-extrabold text-primary">
                  {formatCurrency(payableAmount)}
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
                <p className="font-headline text-lg font-bold">{patientName}</p>
                <p
                  className="mt-1 text-sm leading-5 text-on-surface-variant break-all"
                  title={patientEmail}
                >
                  {patientEmail}
                </p>
              </div>

              <div className="rounded-[1.5rem] border border-outline-variant/35 bg-white/80 p-4">
                <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-on-surface-variant">
                  <Stethoscope className="h-4 w-4 text-primary" />
                  Consultant
                </div>
                <p className="font-headline text-lg font-bold">
                  Dr. {doctorName}
                </p>
                <p className="mt-1 text-sm text-on-surface-variant">
                  {department}
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
                      {formatAppointmentDate(appointmentDate)}
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
                      {appointmentTime}
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-on-surface-variant">
                  Payment breakdown
                </p>

                <div className="mt-3 space-y-2">
                  <div className="flex items-center justify-between text-sm text-on-surface-variant">
                    <span>Consultation fee</span>
                    <span className="font-semibold text-on-surface">
                      {formatCurrency(consultationFee)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-on-surface-variant">
                    <span>Service fee</span>
                    <span className="font-semibold text-on-surface">
                      {formatCurrency(serviceFee)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-on-surface-variant">
                    <span>Tax</span>
                    <span className="font-semibold text-on-surface">
                      {formatCurrency(taxAmount)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-on-surface-variant">
                    <span>Discount</span>
                    <span className="font-semibold text-emerald-700">
                      - {formatCurrency(discountAmount)}
                    </span>
                  </div>
                </div>

                <div className="mt-4 flex items-end justify-between gap-4 border-t border-outline-variant/30 pt-4">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-on-surface-variant">
                      Total amount
                    </p>
                    <p className="mt-2 font-headline text-3xl font-extrabold text-on-surface">
                      {formatCurrency(payableAmount)}
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
            </div>

            {successMessage ? (
              <div className="mt-5 rounded-2xl border border-secondary/20 bg-secondary-container px-4 py-3 text-sm font-medium text-secondary">
                {successMessage}
              </div>
            ) : null}

            <button
              type="button"
              onClick={handleCheckout}
              disabled={isSubmitting || loadingAppointment || !canCheckout}
              className="mt-6 flex w-full items-center justify-center gap-3 rounded-[1.25rem] bg-linear-to-r from-primary via-primary-container to-primary px-6 py-4 font-headline text-lg font-bold text-white shadow-lg shadow-primary/25 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/30 disabled:cursor-not-allowed disabled:opacity-70"
            >
              <span>
                {loadingAppointment
                  ? "Loading appointment..."
                  : isSubmitting
                    ? "Opening Stripe Checkout..."
                    : canCheckout
                      ? "Continue to secure payment"
                      : "Payment unavailable"}
              </span>
              {!isSubmitting ? <ArrowRight className="h-5 w-5" /> : null}
            </button>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm text-on-surface-variant">
              <p>Need to update the booking before paying?</p>
              <Link
                to="/appointments/all"
                className="font-bold text-primary hover:underline"
              >
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
