import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";

const apiBaseUrl = import.meta.env.VITE_PAYMENT_API_URL ?? "/api/payments";
const fallbackPaymentApiBases = [
  apiBaseUrl,
  "/api/payments",
  "/api/payments",
  "/api/payments",
];

const statusToneMap = {
  SUCCESS: "success",
  PENDING: "pending",
  FAILED: "failed",
  EXPIRED: "failed",
};

const metricToneMap = {
  blue: {
    icon: "bg-[#ecebff] text-[#4338ca] ring-1 ring-inset ring-[#d9d5ff]",
    badge: "bg-[#4338ca]/10 text-[#4338ca] ring-1 ring-inset ring-[#d9d5ff]",
  },
  indigo: {
    icon: "bg-[#e9f0ff] text-[#4f46e5] ring-1 ring-inset ring-[#d7e3ff]",
    badge: "bg-[#4f46e5]/10 text-[#4f46e5] ring-1 ring-inset ring-[#d7e3ff]",
  },
  amber: {
    icon: "bg-[#e6fff4] text-[#0f8a60] ring-1 ring-inset ring-[#bdf6df]",
    badge: "bg-[#62eab6]/16 text-[#0f8a60] ring-1 ring-inset ring-[#bdf6df]",
  },
  green: {
    icon: "bg-[#f1efff] text-[#5b50f6] ring-1 ring-inset ring-[#ddd8ff]",
    badge: "bg-[#d9d5ff] text-[#4a3ff0] ring-1 ring-inset ring-[#ddd8ff]",
  },
};

const paymentStatusPillMap = {
  success: "bg-[#e6fff4] text-[#0f8a60] ring-1 ring-inset ring-[#bdf6df]",
  pending: "bg-[#ecebff] text-[#4338ca] ring-1 ring-inset ring-[#d9d5ff]",
  failed: "bg-[#f3f4fb] text-slate-600 ring-1 ring-inset ring-[#e5e7f2]",
};

const sidebarItems = [
  { id: "payments", label: "Payments", icon: "payments" },
  { id: "customers", label: "Customers", icon: "customers" },
  { id: "subscriptions", label: "Subscriptions", icon: "subscriptions" },
  { id: "reports", label: "Reports", icon: "reports" },
  { id: "settings", label: "Settings", icon: "settings" },
];

const statusFilters = [
  { value: "ALL", label: "All" },
  { value: "SUCCESS", label: "Success" },
  { value: "PENDING", label: "Pending" },
  { value: "FAILED", label: "Failed" },
  { value: "EXPIRED", label: "Expired" },
];

const viewTabs = [
  { id: "transactions", label: "Transactions" },
  { id: "refunds", label: "Refunds" },
];

const formatAmount = (amount, currency = "LKR") =>
  new Intl.NumberFormat("en-LK", {
    style: "currency",
    currency: currency || "LKR",
    maximumFractionDigits: 2,
  }).format(Number(amount || 0));

const formatDateTime = (value) => {
  if (!value) {
    return "Not available";
  }

  return new Intl.DateTimeFormat("en-LK", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
};

const formatCompactDate = (value) => {
  if (!value) {
    return "Not available";
  }

  return new Intl.DateTimeFormat("en-LK", {
    month: "short",
    day: "numeric",
  }).format(new Date(value));
};

const getInitials = (value) => {
  const parts = `${value || ""}`
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  if (!parts.length) {
    return "NA";
  }

  return parts.map((part) => part[0]?.toUpperCase() || "").join("");
};

const getDisplayValue = (value, fallback = "Not available") =>
  `${value || ""}`.trim() || fallback;

const getPaymentStatusLabel = (payment) => {
  if (payment.refundStatus === "FULL") {
    return "Refunded";
  }

  if (payment.refundStatus === "PARTIAL") {
    return "Partially refunded";
  }

  if (payment.status === "SUCCESS") {
    return "Success";
  }

  return getDisplayValue(payment.lastWebhookEvent, "Awaiting webhook");
};

const getPaymentStatusBadge = (payment) => {
  if (payment.refundStatus === "FULL") {
    return { label: "Refunded", tone: "pending" };
  }

  if (payment.refundStatus === "PARTIAL") {
    return { label: "Partially refunded", tone: "pending" };
  }

  return {
    label: payment.status || "PENDING",
    tone: statusToneMap[payment.status] || "pending",
  };
};

const buildSearchablePaymentText = (payment) =>
  [
    payment.orderId,
    payment.appointmentId,
    payment.customerName,
    payment.customerEmail,
    payment.itemName,
    payment.department,
    payment.doctorName,
    payment.appointmentDate,
    payment.appointmentTime,
    payment.paymentGateway,
    payment.gatewaySessionId,
    payment.gatewayPaymentIntentId,
    payment.lastWebhookEvent,
    payment.failureReason,
    payment.status,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

const buildScheduleLabel = (payment) => {
  const schedule = [payment.appointmentDate, payment.appointmentTime]
    .filter(Boolean)
    .join(" ");

  return schedule || "Schedule pending";
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
    return "Payment dashboard service is unavailable right now. Make sure the API gateway and payment service are running.";
  }

  return message;
};

const getUniqueApiBases = (primaryBase) =>
  [primaryBase, ...fallbackPaymentApiBases].filter(
    (value, index, collection) => value && collection.indexOf(value) === index,
  );

const shouldTryNextApiBase = ({ response, data, error }) => {
  if (error) {
    return true;
  }

  if (!response) {
    return false;
  }

  if (response.status === 404 || response.status === 503) {
    return true;
  }

  const message = `${data?.message || data?.error || ""}`.toLowerCase();
  return (
    message.includes("route not found") ||
    message.includes("error occurred while trying to proxy")
  );
};

function DashboardIcon({ name }) {
  const commonProps = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.8",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": "true",
  };

  switch (name) {
    case "brand":
      return (
        <svg {...commonProps}>
          <path d="M4 10.5L12 4l8 6.5" />
          <path d="M6 10v8h12v-8" />
          <path d="M9 18v-5" />
          <path d="M12 18v-5" />
          <path d="M15 18v-5" />
        </svg>
      );
    case "search":
      return (
        <svg {...commonProps}>
          <circle cx="11" cy="11" r="6.5" />
          <path d="M16 16l4 4" />
        </svg>
      );
    case "refresh":
      return (
        <svg {...commonProps}>
          <path d="M19 7v5h-5" />
          <path d="M5 17v-5h5" />
          <path d="M7 9a7 7 0 0 1 11-2" />
          <path d="M17 15a7 7 0 0 1-11 2" />
        </svg>
      );
    case "home":
      return (
        <svg {...commonProps}>
          <path d="M4 11l8-6 8 6" />
          <path d="M6 10.5V19h12v-8.5" />
        </svg>
      );
    case "payments":
      return (
        <svg {...commonProps}>
          <rect x="3" y="6" width="18" height="12" rx="2.5" />
          <path d="M3 10h18" />
          <path d="M7 14h4" />
        </svg>
      );
    case "customers":
      return (
        <svg {...commonProps}>
          <circle cx="9" cy="9" r="3" />
          <circle cx="17" cy="10" r="2.5" />
          <path d="M4 19c.8-2.6 3-4 5-4s4.2 1.4 5 4" />
          <path d="M14 18c.5-1.7 1.8-2.8 3.5-3.2" />
        </svg>
      );
    case "subscriptions":
      return (
        <svg {...commonProps}>
          <path d="M5 6h14" />
          <path d="M5 12h14" />
          <path d="M5 18h14" />
          <path d="M8 6l-2 2 2 2" />
        </svg>
      );
    case "reports":
      return (
        <svg {...commonProps}>
          <path d="M5 19V8" />
          <path d="M12 19V5" />
          <path d="M19 19v-9" />
        </svg>
      );
    case "settings":
      return (
        <svg {...commonProps}>
          <circle cx="12" cy="12" r="3" />
          <path d="M19 12a7 7 0 0 0-.1-1l2-1.6-2-3.4-2.4 1a8 8 0 0 0-1.8-1L14.3 3h-4.6l-.4 2.9a8 8 0 0 0-1.8 1l-2.4-1-2 3.4L5 11a7 7 0 0 0 0 2l-2 1.6 2 3.4 2.4-1a8 8 0 0 0 1.8 1l.5 2.9h4.6l.4-2.9a8 8 0 0 0 1.8-1l2.4 1 2-3.4-2-1.6c.1-.3.1-.7.1-1Z" />
        </svg>
      );
    case "revenue":
      return (
        <svg {...commonProps}>
          <rect x="3" y="6" width="18" height="12" rx="2.5" />
          <circle cx="12" cy="12" r="2.5" />
          <path d="M7 9.5h.01" />
          <path d="M17 14.5h.01" />
        </svg>
      );
    case "volume":
      return (
        <svg {...commonProps}>
          <rect x="5" y="4" width="14" height="16" rx="2.5" />
          <path d="M8 8h8" />
          <path d="M8 12h5" />
        </svg>
      );
    case "pending":
      return (
        <svg {...commonProps}>
          <circle cx="12" cy="12" r="7" strokeDasharray="2.5 2.5" />
          <path d="M12 8v4l2.5 2.5" />
        </svg>
      );
    case "success":
      return (
        <svg {...commonProps}>
          <circle cx="12" cy="12" r="7" />
          <path d="m9 12 2 2 4-5" />
        </svg>
      );
    case "bell":
      return (
        <svg {...commonProps}>
          <path d="M6 16h12" />
          <path d="M8 16V11a4 4 0 1 1 8 0v5" />
          <path d="M10 19a2 2 0 0 0 4 0" />
        </svg>
      );
    default:
      return (
        <svg {...commonProps}>
          <circle cx="12" cy="12" r="7" />
        </svg>
      );
  }
}

function PaymentDashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [resolvedApiBase, setResolvedApiBase] = useState(apiBaseUrl);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [activeSidebarItem, setActiveSidebarItem] = useState("payments");

  const callPaymentApi = useCallback(async (path, fetchOptions = {}) => {
    const candidateBases = getUniqueApiBases(resolvedApiBase);
    let lastFailure = null;

    for (const base of candidateBases) {
      try {
        const response = await fetch(`${base}${path}`, fetchOptions);
        const data = await parseResponseBody(response);

        if (response.ok && data?.success !== false) {
          if (base !== resolvedApiBase) {
            setResolvedApiBase(base);
          }

          return { response, data };
        }

        lastFailure = { response, data };

        if (!shouldTryNextApiBase({ response, data })) {
          break;
        }
      } catch (error) {
        lastFailure = { error };

        if (!shouldTryNextApiBase({ error })) {
          break;
        }
      }
    }

    if (lastFailure?.error) {
      throw lastFailure.error;
    }

    throw new Error(
      getResponseErrorMessage(
        lastFailure?.response,
        lastFailure?.data,
        "Unable to connect to the payment service.",
      ),
    );
  }, [resolvedApiBase]);

  const fetchDashboard = useCallback(
    async ({ showLoader } = { showLoader: false }) => {
      if (showLoader) {
        setIsLoading(true);
      } else {
        setIsRefreshing(true);
      }

      setErrorMessage("");

      try {
        const { data } = await callPaymentApi("/admin/dashboard?limit=50");

        setDashboard(data);
      } catch (error) {
        setErrorMessage(error.message);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [callPaymentApi],
  );

  useEffect(() => {
    fetchDashboard({ showLoader: true });
  }, [fetchDashboard]);

  const summary = dashboard?.summary;
  const recentPayments = dashboard?.recentPayments || [];
  const normalizedSearchTerm = searchTerm.trim().toLowerCase();
  const filteredPayments = recentPayments.filter((payment) => {
    const matchesStatus =
      statusFilter === "ALL" || payment.status === statusFilter;
    const matchesSearch =
      !normalizedSearchTerm ||
      buildSearchablePaymentText(payment).includes(normalizedSearchTerm);

    return matchesStatus && matchesSearch;
  });

  const [activeView, setActiveView] = useState("transactions");
  const [isProcessingRefund, setIsProcessingRefund] = useState(false);
  const [refundModalData, setRefundModalData] = useState({
    open: false,
    payment: null,
    amount: "",
    isFullRefund: false,
  });

  const refundPayments = recentPayments.filter(
    (payment) => Number(payment.refundedAmount || 0) > 0,
  );
  const filteredRefundPayments = refundPayments.filter((payment) => {
    if (!normalizedSearchTerm) {
      return true;
    }

    return buildSearchablePaymentText(payment).includes(normalizedSearchTerm);
  });

  const isRefundEligible = (payment) => {
    const refundableAmount =
      Number(payment.amount || 0) - Number(payment.refundedAmount || 0);

    return (
      payment.status === "SUCCESS" &&
      refundableAmount > 0 &&
      Boolean(payment.gatewayPaymentIntentId)
    );
  };

  const openRefundDialog = (payment) => {
    if (!payment?.orderId || !isRefundEligible(payment)) {
      setErrorMessage("This payment cannot be refunded right now.");
      return;
    }

    const availableAmount =
      Number(payment.amount || 0) - Number(payment.refundedAmount || 0);

    setRefundModalData({
      open: true,
      payment,
      amount: String(availableAmount),
      isFullRefund: false,
    });
  };

  const closeRefundDialog = () => {
    setRefundModalData({
      open: false,
      payment: null,
      amount: "",
      isFullRefund: false,
    });
  };

  const submitRefund = async () => {
    const { payment, amount, isFullRefund } = refundModalData;
    if (!payment || !payment.orderId) {
      setErrorMessage("Refund request failed. Please try again.");
      return;
    }

    const refundAmount = isFullRefund
      ? Number(payment.amount || 0) - Number(payment.refundedAmount || 0)
      : Number(amount);
    const availableAmount = Number(payment.amount || 0) - Number(payment.refundedAmount || 0);

    if (!Number.isFinite(refundAmount) || refundAmount <= 0) {
      setErrorMessage("Please enter a valid refund amount.");
      return;
    }

    if (refundAmount > availableAmount) {
      setErrorMessage("Refund amount cannot exceed the available refundable amount.");
      return;
    }

    setIsProcessingRefund(true);
    setErrorMessage("");

    try {
      const { data } = await callPaymentApi("/admin/refund", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderId: payment.orderId,
          amount: refundAmount,
          isFullRefund: isFullRefund,
        }),
      });

      closeRefundDialog();
      fetchDashboard({ showLoader: false });
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsProcessingRefund(false);
    }
  };

  const pendingAmount = recentPayments
    .filter((payment) => payment.status === "PENDING")
    .reduce((total, payment) => total + Number(payment.amount || 0), 0);

  const successfulPercentage = summary?.totalPayments
    ? (summary.successfulPayments / summary.totalPayments) * 100
    : 0;
  const pendingPercentage = summary?.totalPayments
    ? (summary.pendingPayments / summary.totalPayments) * 100
    : 0;
  const otherPercentage = Math.max(
    0,
    100 - successfulPercentage - pendingPercentage,
  );

  const statusRingStyle = {
    background: `conic-gradient(
      #4f46e5 0 ${successfulPercentage}%,
      #62eab6 ${successfulPercentage}% ${successfulPercentage + pendingPercentage}%,
      #d9d5ff ${successfulPercentage + pendingPercentage}% 100%
    )`,
  };

  const metricCards = summary
    ? [
        {
          label: "Collected Revenue",
          value: formatAmount(summary.totalRevenue, "LKR"),
          note: `${summary.successfulPayments} completed payments`,
          badge: "+ live",
          icon: "revenue",
          tone: "blue",
        },
        {
          label: "Gross Volume",
          value: formatAmount(summary.revenueToday, "LKR"),
          note: `${summary.paymentsToday} payments settled today`,
          badge: "Today",
          icon: "volume",
          tone: "indigo",
        },
        {
          label: "Pending Review",
          value: formatAmount(pendingAmount, "LKR"),
          note: `${summary.pendingPayments} transactions waiting for confirmation`,
          badge: `${summary.pendingPayments} pending`,
          icon: "pending",
          tone: "amber",
        },
        {
          label: "Success Rate",
          value: `${summary.successRate}%`,
          note: `${summary.totalPayments} total transactions tracked`,
          badge: "Optimal",
          icon: "success",
          tone: "green",
        },
      ]
    : [];

  const isReportsView = activeSidebarItem === "reports";
  const totalRefundedAmount = recentPayments.reduce(
    (total, payment) => total + Number(payment.refundedAmount || 0),
    0,
  );
  const failedAmount = recentPayments
    .filter((payment) => ["FAILED", "EXPIRED"].includes(payment.status))
    .reduce((total, payment) => total + Number(payment.amount || 0), 0);
  const netRevenue = Math.max(
    0,
    Number(summary?.totalRevenue || 0) - totalRefundedAmount,
  );

  const reportMetricCards = summary
    ? [
        {
          label: "Net Revenue",
          value: formatAmount(netRevenue, "LKR"),
          note: `${summary.successfulPayments} successful collections after refunds`,
          badge: "Net",
          icon: "revenue",
          tone: "blue",
        },
        {
          label: "Refund Exposure",
          value: formatAmount(totalRefundedAmount, "LKR"),
          note: `${refundPayments.length} transactions already refunded`,
          badge: "Refunds",
          icon: "pending",
          tone: "amber",
        },
        {
          label: "Failed Volume",
          value: formatAmount(failedAmount, "LKR"),
          note: `${recentPayments.filter((payment) =>
            ["FAILED", "EXPIRED"].includes(payment.status),
          ).length} payments failed or expired`,
          badge: "Risk",
          icon: "volume",
          tone: "indigo",
        },
        {
          label: "Active Gateways",
          value: `${new Set(
            recentPayments
              .map((payment) =>
                getDisplayValue(payment.paymentGateway, "Manual entry"),
              )
              .filter(Boolean),
          ).size}`,
          note: "Payment channels tracked in this reporting window",
          badge: "Mix",
          icon: "success",
          tone: "green",
        },
      ]
    : [];

  const reportRows = Object.values(
    recentPayments.reduce((groups, payment) => {
      const department = getDisplayValue(payment.department, "General");
      const gateway = getDisplayValue(payment.paymentGateway, "Manual entry");
      const createdAt = payment.updatedAt || payment.createdAt || null;
      const amount = Number(payment.amount || 0);
      const refundedAmount = Number(payment.refundedAmount || 0);

      const currentGroup = groups[department] || {
        label: department,
        transactions: 0,
        successfulTransactions: 0,
        collectedAmount: 0,
        pendingAmount: 0,
        refundedAmount: 0,
        gatewaySet: new Set(),
        doctorSet: new Set(),
        latestActivity: null,
      };

      currentGroup.transactions += 1;
      currentGroup.refundedAmount += refundedAmount;
      currentGroup.gatewaySet.add(gateway);

      if (payment.doctorName) {
        currentGroup.doctorSet.add(payment.doctorName);
      }

      if (payment.status === "SUCCESS") {
        currentGroup.successfulTransactions += 1;
        currentGroup.collectedAmount += amount;
      }

      if (payment.status === "PENDING") {
        currentGroup.pendingAmount += amount;
      }

      if (
        createdAt &&
        (!currentGroup.latestActivity ||
          new Date(createdAt) > new Date(currentGroup.latestActivity))
      ) {
        currentGroup.latestActivity = createdAt;
      }

      groups[department] = currentGroup;

      return groups;
    }, {}),
  )
    .map((group) => ({
      ...group,
      gatewayCount: group.gatewaySet.size,
      leadDoctor:
        Array.from(group.doctorSet)[0] || "No doctor assigned yet",
      successRate: group.transactions
        ? (group.successfulTransactions / group.transactions) * 100
        : 0,
    }))
    .sort(
      (firstGroup, secondGroup) =>
        secondGroup.collectedAmount - firstGroup.collectedAmount ||
        secondGroup.transactions - firstGroup.transactions,
    );

  const filteredReportRows = reportRows.filter((group) => {
    if (!normalizedSearchTerm) {
      return true;
    }

    return [
      group.label,
      group.leadDoctor,
      group.latestActivity ? formatCompactDate(group.latestActivity) : "",
      `${group.gatewayCount} gateways`,
    ]
      .join(" ")
      .toLowerCase()
      .includes(normalizedSearchTerm);
  });

  const gatewayReportRows = Object.values(
    recentPayments.reduce((groups, payment) => {
      const gateway = getDisplayValue(payment.paymentGateway, "Manual entry");
      const amount = Number(payment.amount || 0);

      const currentGroup = groups[gateway] || {
        label: gateway,
        transactions: 0,
        successfulTransactions: 0,
        collectedAmount: 0,
      };

      currentGroup.transactions += 1;

      if (payment.status === "SUCCESS") {
        currentGroup.successfulTransactions += 1;
        currentGroup.collectedAmount += amount;
      }

      groups[gateway] = currentGroup;

      return groups;
    }, {}),
  )
    .map((group) => ({
      ...group,
      successRate: group.transactions
        ? (group.successfulTransactions / group.transactions) * 100
        : 0,
    }))
    .sort(
      (firstGroup, secondGroup) =>
        secondGroup.collectedAmount - firstGroup.collectedAmount ||
        secondGroup.transactions - firstGroup.transactions,
    )
    .slice(0, 4);

  const reportTimeline = (() => {
    const formatter = new Intl.DateTimeFormat("en-LK", {
      month: "short",
      day: "numeric",
    });
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const timelineDays = Array.from({ length: 7 }, (_, index) => {
      const day = new Date(today);
      day.setDate(today.getDate() - (6 - index));

      return {
        key: day.toISOString().slice(0, 10),
        label: formatter.format(day),
        transactions: 0,
        revenue: 0,
      };
    });

    const dayLookup = Object.fromEntries(
      timelineDays.map((day) => [day.key, day]),
    );

    recentPayments.forEach((payment) => {
      const sourceDate = payment.createdAt || payment.updatedAt;

      if (!sourceDate) {
        return;
      }

      const parsedDate = new Date(sourceDate);

      if (Number.isNaN(parsedDate.getTime())) {
        return;
      }

      const key = parsedDate.toISOString().slice(0, 10);
      const timelineEntry = dayLookup[key];

      if (!timelineEntry) {
        return;
      }

      timelineEntry.transactions += 1;

      if (payment.status === "SUCCESS") {
        timelineEntry.revenue += Number(payment.amount || 0);
      }
    });

    return timelineDays;
  })();

  const reportTimelineMaxRevenue = reportTimeline.reduce(
    (maxRevenue, day) => Math.max(maxRevenue, day.revenue),
    0,
  );
  const reportTimelinePeakDay = reportTimeline.reduce(
    (peakDay, day) => (day.revenue > peakDay.revenue ? day : peakDay),
    reportTimeline[0] || { label: "No data", revenue: 0, transactions: 0 },
  );
  const reportTimelineTotalRevenue = reportTimeline.reduce(
    (totalRevenue, day) => totalRevenue + day.revenue,
    0,
  );
  const reportTimelineTotalTransactions = reportTimeline.reduce(
    (totalTransactions, day) => totalTransactions + day.transactions,
    0,
  );

  const chartWidth = 640;
  const chartHeight = 260;
  const chartPadding = {
    top: 20,
    right: 20,
    bottom: 46,
    left: 20,
  };
  const innerChartWidth =
    chartWidth - chartPadding.left - chartPadding.right;
  const innerChartHeight =
    chartHeight - chartPadding.top - chartPadding.bottom;
  const chartMaxRevenue = reportTimelineMaxRevenue || 1;
  const reportTrendPoints = reportTimeline.map((day, index) => {
    const x =
      chartPadding.left +
      (reportTimeline.length > 1
        ? (index / (reportTimeline.length - 1)) * innerChartWidth
        : innerChartWidth / 2);
    const y =
      chartPadding.top +
      innerChartHeight -
      (day.revenue / chartMaxRevenue) * innerChartHeight;

    return {
      ...day,
      x,
      y,
    };
  });
  const reportTrendLinePath = reportTrendPoints
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");
  const reportTrendAreaPath = reportTrendPoints.length
    ? `${reportTrendLinePath} L ${reportTrendPoints[reportTrendPoints.length - 1].x} ${
        chartHeight - chartPadding.bottom
      } L ${reportTrendPoints[0].x} ${chartHeight - chartPadding.bottom} Z`
    : "";
  const reportTrendGridValues = [1, 0.5, 0].map((ratio) => ({
    value: chartMaxRevenue * ratio,
    y: chartPadding.top + innerChartHeight - innerChartHeight * ratio,
  }));

  return (
    <main className="relative isolate min-h-screen overflow-hidden bg-[#f6f7ff] px-3 py-3 text-slate-900 sm:px-4 lg:px-5">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,rgba(70,59,220,0.12)_0%,rgba(255,255,255,0)_38%,rgba(104,240,191,0.12)_100%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-60 [background:repeating-linear-gradient(90deg,rgba(255,255,255,0)_0px,rgba(255,255,255,0)_78px,rgba(196,211,255,0.28)_118px,rgba(255,255,255,0)_160px)]" />
      <div className="pointer-events-none absolute -left-24 -top-32 h-80 w-80 rounded-full bg-[#6b5cff]/18 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-16 h-96 w-96 rounded-full bg-[#6cf8bb]/16 blur-3xl" />

      <div className="relative z-10 mx-auto flex max-w-425 flex-col gap-4 xl:flex-row">
        <aside className="flex w-full flex-col xl:sticky xl:top-3 xl:min-h-[calc(100vh+7rem)] xl:max-w-76.25">
          <section className="flex h-full min-h-[calc(100vh+7rem)] flex-col rounded-[1.7rem] border border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.78),rgba(240,244,255,0.78))] p-4 text-slate-800 shadow-[0_20px_60px_rgba(148,163,184,0.14)] backdrop-blur-xl">
            <div className="rounded-[1.45rem] border border-white/80 bg-white/70 p-4 shadow-[0_12px_32px_rgba(103,94,182,0.08)]">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-linear-to-br from-[#4338ca] via-[#4f46e5] to-[#6b5cff] text-white shadow-[0_14px_28px_rgba(67,56,202,0.26)]">
                  <div className="h-5 w-5">
                    <DashboardIcon name="brand" />
                  </div>
                </div>
                <div className="min-w-0">
                  <p className="font-headline text-base font-semibold text-slate-900">
                    Payment Dashboard
                  </p>
                  <p className="text-xs text-slate-500">
                    CareSync finance overview
                  </p>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between rounded-[1.1rem] border border-[#e4e8ff] bg-[#f7f8ff]/95 px-3.5 py-2.5">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Workspace
                  </p>
                  <p className="mt-1 text-sm font-medium text-slate-700">
                    Payment operations
                  </p>
                </div>
                <span className="rounded-full bg-[#62eab6]/20 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#0f8a60]">
                  Active
                </span>
              </div>
            </div>

            <nav
              className="mt-4 space-y-1.5 rounded-[1.45rem] border border-white/80 bg-white/64 p-3 shadow-[0_10px_28px_rgba(103,94,182,0.06)]"
              aria-label="Payment dashboard navigation"
            >
              {sidebarItems.map((item) => {
                const isActive = item.id === activeSidebarItem;

                return (
                  <button
                    key={item.id}
                    className={`flex w-full items-center gap-3 rounded-[1rem] px-3 py-2.5 text-left text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? "bg-linear-to-r from-[#4338ca] to-[#5b50f6] text-white shadow-[0_14px_28px_rgba(67,56,202,0.25)]"
                        : "bg-white/60 text-slate-700 hover:bg-white hover:text-slate-950"
                    }`}
                    type="button"
                    onClick={() => setActiveSidebarItem(item.id)}
                  >
                    <span
                      className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                        isActive
                          ? "bg-white/20 text-white"
                          : "bg-[#eef0ff] text-[#4338ca]"
                      }`}
                    >
                      <span className="h-4.5 w-4.5">
                        <DashboardIcon name={item.icon} />
                      </span>
                    </span>
                    <span className="flex-1">{item.label}</span>
                  </button>
                );
              })}
            </nav>

            {!isLoading && summary ? (
              <section className="mt-4 flex-1 rounded-[1.45rem] border border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.8),rgba(240,244,255,0.78))] p-3.5 shadow-[0_12px_30px_rgba(103,94,182,0.07)]">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                      Payment Summary
                    </p>
                    <h2 className="mt-1 font-headline text-base font-semibold text-slate-900">
                      Status Overview
                    </h2>
                  </div>
                  <span className="rounded-full bg-[#eef0ff] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#4338ca] ring-1 ring-inset ring-[#ddd8ff]">
                    {summary.totalPayments}
                  </span>
                </div>

                <div className="mt-4 flex min-h-110 flex-col rounded-[1.25rem] bg-white/80 px-3.5 py-4 shadow-[inset_0_0_0_1px_rgba(226,232,240,0.75)]">
                  <div className="flex justify-center">
                    <div
                      className="flex h-28 w-28 items-center justify-center rounded-full p-2"
                      style={statusRingStyle}
                    >
                      <div className="flex h-full w-full flex-col items-center justify-center rounded-full bg-white text-center shadow-inner">
                        <strong className="font-headline text-2xl font-bold text-[#4338ca]">
                          {Math.round(successfulPercentage)}%
                        </strong>
                        <span className="text-[10px] uppercase tracking-[0.22em] text-slate-500">
                          Success
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 rounded-[1.1rem] border border-[#e6e9f8] bg-[linear-gradient(135deg,rgba(248,249,255,0.96),rgba(255,255,255,0.9))] px-3 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                          Dashboard Pulse
                        </p>
                        <p className="mt-1 text-sm font-semibold text-slate-900">
                          {summary.successRate}% success rate
                        </p>
                      </div>
                      <span className="rounded-full bg-[#eef0ff] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#4338ca]">
                        live
                      </span>
                    </div>
                    <p className="mt-2 text-xs leading-5 text-slate-500">
                      This panel mirrors the latest payment mix, review load,
                      and settlement pace from the dashboard.
                    </p>
                  </div>

                  <div className="mt-4 space-y-2.5">
                    <div className="flex items-center justify-between rounded-xl bg-[#f8f8ff] px-3 py-2 text-xs">
                      <div className="flex min-w-0 items-center gap-2 text-slate-700">
                        <span className="h-2.5 w-2.5 rounded-full bg-[#4f46e5]" />
                        <span className="truncate">Successful</span>
                      </div>
                      <strong className="ml-3 text-slate-900">
                        {successfulPercentage.toFixed(1)}%
                      </strong>
                    </div>
                    <div className="flex items-center justify-between rounded-xl bg-[#f4fffb] px-3 py-2 text-xs">
                      <div className="flex min-w-0 items-center gap-2 text-slate-700">
                        <span className="h-2.5 w-2.5 rounded-full bg-[#62eab6]" />
                        <span className="truncate">Pending</span>
                      </div>
                      <strong className="ml-3 text-slate-900">
                        {pendingPercentage.toFixed(1)}%
                      </strong>
                    </div>
                    <div className="flex items-center justify-between rounded-xl bg-[#f7f7ff] px-3 py-2 text-xs">
                      <div className="flex min-w-0 items-center gap-2 text-slate-700">
                        <span className="h-2.5 w-2.5 rounded-full bg-[#d9d5ff]" />
                        <span className="truncate">Failed or expired</span>
                      </div>
                      <strong className="ml-3 text-slate-900">
                        {otherPercentage.toFixed(1)}%
                      </strong>
                    </div>
                  </div>

                </div>
              </section>
            ) : null}

          </section>
        </aside>

        <section className="flex-1 rounded-[1.75rem] border border-white/80 bg-white/62 p-3.5 shadow-[0_20px_60px_rgba(148,163,184,0.16)] backdrop-blur-xl sm:p-5">
          <header className="flex flex-col gap-3 rounded-[1.5rem] border border-white/80 bg-white/72 px-4 py-3.5 text-slate-900 shadow-[0_16px_42px_rgba(103,94,182,0.08)] lg:flex-row lg:items-center lg:justify-between">
            <label
              className="flex w-full items-center gap-3 rounded-2xl border border-[#dfe4ff] bg-white/85 px-4 py-2.5 lg:max-w-xl"
              htmlFor="admin-global-search"
            >
              <span className="h-5 w-5 text-[#4338ca]">
                <DashboardIcon name="search" />
              </span>
              <input
                id="admin-global-search"
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder={
                  isReportsView
                    ? "Search reports, departments, doctors..."
                    : "Search transactions, customers..."
                }
                className="w-full border-none bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
              />
            </label>

            <div className="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
              <button
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#dfe4ff] bg-white px-4 py-2.5 text-sm font-semibold text-[#4338ca] transition hover:bg-[#f3f4ff] disabled:cursor-not-allowed disabled:opacity-60"
                type="button"
                onClick={() => fetchDashboard()}
                disabled={isRefreshing}
              >
                <span className="h-4 w-4">
                  <DashboardIcon name="refresh" />
                </span>
                <span>{isRefreshing ? "Refreshing..." : "Refresh Data"}</span>
              </button>

              <Link
                className="inline-flex items-center justify-center rounded-2xl bg-linear-to-r from-[#4338ca] to-[#5b50f6] px-4 py-2.5 text-sm font-bold text-white shadow-[0_16px_30px_rgba(67,56,202,0.24)] transition hover:brightness-105"
                to="/payment"
              >
                Open Payment Page
              </Link>

              <button
                className="relative inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-[#dfe4ff] bg-white text-[#4338ca] transition hover:bg-[#f3f4ff]"
                type="button"
                aria-label="Notifications"
              >
                <span className="h-5 w-5">
                  <DashboardIcon name="bell" />
                </span>
                <span className="absolute right-3 top-3 h-2.5 w-2.5 rounded-full bg-rose-400 ring-2 ring-slate-950" />
              </button>

              <div
                className="flex h-11 w-11 items-center justify-center rounded-2xl bg-linear-to-br from-[#ecebff] to-white text-sm font-bold text-[#4338ca] shadow-lg"
                aria-label="Payment dashboard user"
              >
                PD
              </div>
            </div>
          </header>

          {errorMessage ? (
            <section className="mt-6 rounded-[1.5rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
              {errorMessage}
            </section>
          ) : null}

          {refundModalData.open && (
            <div className="fixed inset-0 z-50 flex items-start justify-center overflow-auto bg-slate-950/50 px-4 py-6 pt-20">
              <div className="w-full max-w-lg rounded-[1.75rem] bg-white p-6 shadow-[0_30px_80px_rgba(15,23,42,0.18)] ring-1 ring-slate-200">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-rose-100 text-rose-600">
                    <span className="text-lg font-bold">!</span>
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-xl font-semibold text-slate-900">
                      Confirm refund request
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                      {refundModalData.isFullRefund ? "Full refund" : "Partial refund"} for order{' '}
                      <strong>{refundModalData.payment?.orderId}</strong>.
                    </p>
                  </div>
                </div>

                <div className="mt-5 grid gap-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Refund amount
                    </label>
                    <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
                      <span className="text-sm text-slate-500">{refundModalData.payment?.currency?.toUpperCase() || 'LKR'}</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={refundModalData.amount}
                        onChange={(event) =>
                          setRefundModalData((prev) => ({
                            ...prev,
                            amount: event.target.value,
                            isFullRefund: false,
                          }))
                        }
                        disabled={refundModalData.isFullRefund}
                        className="w-full border-none bg-transparent text-lg font-semibold text-slate-900 outline-none disabled:opacity-60"
                      />
                    </div>
                    <div className="mt-3 flex items-center">
                      <input
                        type="checkbox"
                        id="fullRefundCheckbox"
                        checked={refundModalData.isFullRefund}
                        onChange={(e) => {
                          const isFullRefund = e.target.checked;
                          const availableAmount = 
                            Number(refundModalData.payment?.amount || 0) - 
                            Number(refundModalData.payment?.refundedAmount || 0);
                          
                          setRefundModalData((prev) => ({
                            ...prev,
                            isFullRefund,
                            amount: isFullRefund ? String(availableAmount) : prev.amount
                          }));
                        }}
                        className="h-4 w-4 rounded border-slate-300 text-[#4338ca] focus:ring-[#4338ca]"
                      />
                      <label htmlFor="fullRefundCheckbox" className="ml-2 text-sm text-slate-700">
                        Process full refund
                      </label>
                    </div>
                    <p className="mt-2 text-sm text-slate-500">
                      Available refundable amount:{' '}
                      <strong>
                        {formatAmount(
                          Number(refundModalData.payment?.amount || 0) -
                            Number(refundModalData.payment?.refundedAmount || 0),
                          refundModalData.payment?.currency,
                        )}
                      </strong>
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={closeRefundDialog}
                    className="rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={submitRefund}
                    disabled={isProcessingRefund}
                    className="rounded-2xl bg-[#4338ca] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#2f46e8] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isProcessingRefund ? 'Processing...' : 'Confirm refund'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {isLoading ? (
            <section className="mt-6 flex min-h-80 items-center justify-center rounded-[1.75rem] border border-dashed border-slate-300 bg-slate-50 text-center">
              <div>
                <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-sky-500" />
                <p className="mt-4 text-sm font-medium text-slate-600">
                  Loading payment dashboard...
                </p>
              </div>
            </section>
          ) : null}

          {!isLoading && summary && isReportsView ? (
            <>
              <section className="mt-5 rounded-[1.55rem] border border-white/90 bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(245,247,255,0.88))] p-4 shadow-[0_14px_34px_rgba(103,94,182,0.08)] sm:p-5">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div>
                    <span className="inline-flex rounded-full bg-[#eef0ff] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#4338ca] ring-1 ring-inset ring-[#ddd8ff]">
                      Reporting centre
                    </span>
                    <h2 className="mt-4 font-headline text-2xl font-bold text-slate-950">
                      Payment performance reports
                    </h2>
                    <p className="mt-2 max-w-2xl text-sm text-slate-500">
                      Review revenue quality, refund exposure, and service-line
                      performance from the latest payment activity tracked by
                      the dashboard.
                    </p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-[1.3rem] border border-[#e4e8ff] bg-white px-4 py-3 shadow-sm">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                        Reporting window
                      </p>
                      <p className="mt-2 text-base font-semibold text-slate-900">
                        Last 7 captured days
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        Based on recent dashboard transactions and settlement
                        updates.
                      </p>
                    </div>
                    <div className="rounded-[1.3rem] border border-[#e4e8ff] bg-[#f7f8ff] px-4 py-3 shadow-sm">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                        Search scope
                      </p>
                      <p className="mt-2 text-base font-semibold text-slate-900">
                        {filteredReportRows.length} service lines
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        {normalizedSearchTerm
                          ? `Filtered by "${searchTerm.trim()}".`
                          : "Use the top search bar to filter departments or doctors."}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  {reportMetricCards.map((card) => {
                    const toneClasses =
                      metricToneMap[card.tone] || metricToneMap.blue;

                    return (
                      <article
                        className="rounded-[1.45rem] border border-white/90 bg-white/92 p-4 shadow-[0_12px_28px_rgba(103,94,182,0.08)]"
                        key={card.label}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <span
                            className={`flex h-11 w-11 items-center justify-center rounded-2xl ${toneClasses.icon}`}
                          >
                            <span className="h-5 w-5">
                              <DashboardIcon name={card.icon} />
                            </span>
                          </span>
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${toneClasses.badge}`}
                          >
                            {card.badge}
                          </span>
                        </div>

                        <div className="mt-4">
                          <p className="text-sm font-medium text-slate-500">
                            {card.label}
                          </p>
                          <strong className="mt-2 block font-headline text-[1.5rem] font-bold text-slate-950">
                            {card.value}
                          </strong>
                          <span className="mt-2 block text-sm text-slate-500">
                            {card.note}
                          </span>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>

              <section className="mt-5 grid gap-5 xl:grid-cols-[1.25fr,0.95fr]">
                <article className="rounded-[1.55rem] border border-white/90 bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(245,247,255,0.84))] p-4 shadow-[0_14px_34px_rgba(103,94,182,0.08)] sm:p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-headline text-xl font-bold text-slate-950">
                        Seven-day settlement trend
                      </h3>
                      <p className="mt-2 text-sm text-slate-500">
                        Successful payment totals compared across the latest
                        seven captured dates.
                      </p>
                    </div>
                    <div className="rounded-2xl bg-[#eef0ff] px-4 py-3 text-right">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#4338ca]">
                        Peak day
                      </p>
                      <strong className="mt-1 block text-lg font-bold text-slate-950">
                        {formatAmount(reportTimelinePeakDay.revenue, "LKR")}
                      </strong>
                      <p className="mt-1 text-xs text-slate-500">
                        {reportTimelinePeakDay.label}
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 rounded-[1.4rem] border border-[#e6e9f8] bg-white p-4 shadow-sm">
                    <div className="grid gap-3 sm:grid-cols-3">
                      <div className="rounded-[1.1rem] bg-[#f7f8ff] px-4 py-3">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                          Seven-day revenue
                        </p>
                        <strong className="mt-2 block text-lg font-bold text-slate-950">
                          {formatAmount(reportTimelineTotalRevenue, "LKR")}
                        </strong>
                      </div>
                      <div className="rounded-[1.1rem] bg-[#f7f8ff] px-4 py-3">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                          Transactions
                        </p>
                        <strong className="mt-2 block text-lg font-bold text-slate-950">
                          {reportTimelineTotalTransactions}
                        </strong>
                      </div>
                      <div className="rounded-[1.1rem] bg-[#f7f8ff] px-4 py-3">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                          Daily average
                        </p>
                        <strong className="mt-2 block text-lg font-bold text-slate-950">
                          {formatAmount(
                            reportTimelineTotalRevenue / reportTimeline.length,
                            "LKR",
                          )}
                        </strong>
                      </div>
                    </div>

                    <div className="mt-5 overflow-hidden rounded-[1.25rem] bg-[linear-gradient(180deg,#f8f9ff_0%,#eef1ff_100%)] px-3 py-4 sm:px-4">
                      <svg
                        viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                        className="h-[18rem] w-full"
                        aria-label="Seven-day settlement trend chart"
                        role="img"
                      >
                        <defs>
                          <linearGradient
                            id="reportTrendFill"
                            x1="0"
                            x2="0"
                            y1="0"
                            y2="1"
                          >
                            <stop offset="0%" stopColor="#5b50f6" stopOpacity="0.28" />
                            <stop offset="100%" stopColor="#5b50f6" stopOpacity="0.02" />
                          </linearGradient>
                          <linearGradient
                            id="reportTrendStroke"
                            x1="0"
                            x2="1"
                            y1="0"
                            y2="0"
                          >
                            <stop offset="0%" stopColor="#7c73ff" />
                            <stop offset="100%" stopColor="#4338ca" />
                          </linearGradient>
                        </defs>

                        {reportTrendGridValues.map((gridLine) => (
                          <g key={gridLine.y}>
                            <line
                              x1={chartPadding.left}
                              x2={chartWidth - chartPadding.right}
                              y1={gridLine.y}
                              y2={gridLine.y}
                              stroke="#dfe4ff"
                              strokeDasharray="4 8"
                            />
                            <text
                              x={chartPadding.left}
                              y={gridLine.y - 8}
                              fill="#94a3b8"
                              fontSize="11"
                            >
                              {formatAmount(gridLine.value, "LKR")}
                            </text>
                          </g>
                        ))}

                        {reportTrendAreaPath ? (
                          <path d={reportTrendAreaPath} fill="url(#reportTrendFill)" />
                        ) : null}

                        {reportTrendLinePath ? (
                          <path
                            d={reportTrendLinePath}
                            fill="none"
                            stroke="url(#reportTrendStroke)"
                            strokeWidth="4"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        ) : null}

                        {reportTrendPoints.map((point) => (
                          <g key={point.key}>
                            <circle
                              cx={point.x}
                              cy={point.y}
                              fill="#ffffff"
                              r="9"
                              stroke="#c7d2fe"
                              strokeWidth="2"
                            />
                            <circle
                              cx={point.x}
                              cy={point.y}
                              fill="#4f46e5"
                              r="4.5"
                            />
                            <text
                              x={point.x}
                              y={chartHeight - 12}
                              textAnchor="middle"
                              fill="#475569"
                              fontSize="12"
                              fontWeight="600"
                            >
                              {point.label}
                            </text>
                          </g>
                        ))}
                      </svg>
                    </div>

                    <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                      {reportTimeline.map((day) => (
                        <div
                          key={day.key}
                          className="rounded-[1.15rem] border border-[#e6e9f8] bg-[#fafbff] px-4 py-3"
                        >
                          <p className="text-sm font-semibold text-slate-900">
                            {day.label}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {day.transactions} transactions
                          </p>
                          <p className="mt-2 text-sm font-semibold text-[#4338ca]">
                            {formatAmount(day.revenue, "LKR")}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </article>

                <article className="rounded-[1.55rem] border border-white/90 bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(245,247,255,0.84))] p-4 shadow-[0_14px_34px_rgba(103,94,182,0.08)] sm:p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-headline text-xl font-bold text-slate-950">
                        Gateway mix
                      </h3>
                      <p className="mt-2 text-sm text-slate-500">
                        Top payment channels ranked by successful collections.
                      </p>
                    </div>
                    <div className="rounded-2xl bg-[#f4fffb] px-4 py-3 text-right">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#0f8a60]">
                        Channels
                      </p>
                      <strong className="mt-1 block text-lg font-bold text-slate-950">
                        {gatewayReportRows.length}
                      </strong>
                    </div>
                  </div>

                  <div className="mt-6 space-y-3">
                    {gatewayReportRows.map((gateway) => (
                      <div
                        className="rounded-[1.25rem] border border-[#e6e9f8] bg-white px-4 py-4 shadow-sm"
                        key={gateway.label}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-base font-semibold text-slate-900">
                              {gateway.label}
                            </p>
                            <p className="mt-1 text-sm text-slate-500">
                              {gateway.transactions} transactions processed
                            </p>
                          </div>
                          <span className="rounded-full bg-[#eef0ff] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#4338ca]">
                            {gateway.successRate.toFixed(1)}% success
                          </span>
                        </div>

                        <div className="mt-4 flex items-center justify-between gap-3">
                          <p className="text-sm text-slate-500">
                            Successful collections
                          </p>
                          <strong className="text-sm font-semibold text-slate-900">
                            {formatAmount(gateway.collectedAmount, "LKR")}
                          </strong>
                        </div>
                      </div>
                    ))}
                  </div>
                </article>
              </section>

              <section className="mt-5 rounded-[1.55rem] border border-white/90 bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(245,247,255,0.84))] p-4 shadow-[0_14px_34px_rgba(103,94,182,0.08)] sm:p-5">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div>
                    <h3 className="font-headline text-2xl font-bold text-slate-950">
                      Service-line performance
                    </h3>
                    <p className="mt-2 max-w-2xl text-sm text-slate-500">
                      Department-level report summary for collections, refunds,
                      and open payment exposure.
                    </p>
                  </div>

                  <div className="inline-flex items-center gap-3 rounded-2xl bg-slate-100 px-4 py-3 text-sm text-slate-500">
                    <strong className="font-headline text-xl font-bold text-slate-950">
                      {filteredReportRows.length}
                    </strong>
                    <span>report rows</span>
                  </div>
                </div>

                {filteredReportRows.length ? (
                  <div className="mt-6 overflow-hidden rounded-[1.5rem] border border-[#e5e8fb] bg-white">
                    <div className="max-h-190 overflow-auto">
                      <table className="min-w-full divide-y divide-slate-200 text-sm">
                        <thead className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur">
                          <tr>
                            <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                              Service line
                            </th>
                            <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                              Transactions
                            </th>
                            <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                              Collected
                            </th>
                            <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                              Refunded
                            </th>
                            <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                              Pending
                            </th>
                            <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                              Success
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                          {filteredReportRows.map((group) => (
                            <tr
                              key={group.label}
                              className="transition hover:bg-[#f4f2ff]/80"
                            >
                              <td className="px-5 py-4 align-top">
                                <strong className="block font-semibold text-slate-900">
                                  {group.label}
                                </strong>
                                <span className="mt-1 block text-slate-500">
                                  {group.leadDoctor}
                                </span>
                              </td>
                              <td className="px-5 py-4 align-top">
                                <strong className="block font-semibold text-slate-900">
                                  {group.transactions}
                                </strong>
                                <span className="mt-1 block text-slate-500">
                                  {group.gatewayCount} gateways
                                </span>
                              </td>
                              <td className="px-5 py-4 align-top">
                                <strong className="block font-semibold text-slate-900">
                                  {formatAmount(group.collectedAmount, "LKR")}
                                </strong>
                                <span className="mt-1 block text-slate-500">
                                  Net after refunds:{" "}
                                  {formatAmount(
                                    Math.max(
                                      0,
                                      group.collectedAmount -
                                        group.refundedAmount,
                                    ),
                                    "LKR",
                                  )}
                                </span>
                              </td>
                              <td className="px-5 py-4 align-top">
                                <strong className="block font-semibold text-slate-900">
                                  {formatAmount(group.refundedAmount, "LKR")}
                                </strong>
                                <span className="mt-1 block text-slate-500">
                                  Reversed value
                                </span>
                              </td>
                              <td className="px-5 py-4 align-top">
                                <strong className="block font-semibold text-slate-900">
                                  {formatAmount(group.pendingAmount, "LKR")}
                                </strong>
                                <span className="mt-1 block text-slate-500">
                                  Awaiting settlement
                                </span>
                              </td>
                              <td className="px-5 py-4 align-top">
                                <span className="inline-flex rounded-full bg-[#eef2ff] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#4338ca] ring-1 ring-inset ring-[#d9d5ff]">
                                  {group.successRate.toFixed(1)}%
                                </span>
                                <span className="mt-2 block text-slate-500">
                                  Updated {formatCompactDate(group.latestActivity)}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="mt-6 rounded-[1.5rem] border border-dashed border-[#dcdffc] bg-[linear-gradient(180deg,rgba(255,255,255,0.88),rgba(241,244,255,0.9))] px-6 py-12 text-center">
                    <h3 className="font-headline text-xl font-semibold text-slate-900">
                      No report rows match your search
                    </h3>
                    <p className="mt-2 text-sm text-slate-500">
                      Try another department, gateway, or doctor name in the
                      search bar.
                    </p>
                  </div>
                )}
              </section>
            </>
          ) : null}

          {!isLoading && summary && !isReportsView ? (
            <>
              <section className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                {metricCards.map((card) => {
                  const toneClasses =
                    metricToneMap[card.tone] || metricToneMap.blue;

                  return (
                    <article
                      className="rounded-[1.55rem] border border-white/90 bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(245,247,255,0.86))] p-4 shadow-[0_14px_34px_rgba(103,94,182,0.08)] transition hover:-translate-y-1 hover:shadow-[0_20px_42px_rgba(103,94,182,0.14)]"
                      key={card.label}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <span
                          className={`flex h-12 w-12 items-center justify-center rounded-2xl ${toneClasses.icon}`}
                        >
                          <span className="h-5 w-5">
                            <DashboardIcon name={card.icon} />
                          </span>
                        </span>
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${toneClasses.badge}`}
                        >
                          {card.badge}
                        </span>
                      </div>

                      <div className="mt-4">
                        <p className="text-sm font-medium text-slate-500">
                          {card.label}
                        </p>
                        <strong className="mt-2 block font-headline text-[1.6rem] font-bold leading-tight text-slate-950 sm:text-[1.75rem] xl:text-[1.85rem]">
                          {card.value}
                        </strong>
                        <span className="mt-2 block text-sm text-slate-500">
                          {card.note}
                        </span>
                      </div>
                    </article>
                  );
                })}
              </section>

              <section className="mt-5 rounded-[1.55rem] border border-white/90 bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(245,247,255,0.84))] p-4 shadow-[0_14px_34px_rgba(103,94,182,0.08)] sm:p-5">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div>
                    <h2 className="font-headline text-2xl font-bold text-slate-950">
                      {activeView === "refunds" ? "Refund Requests" : "Recent Transactions"}
                    </h2>
                    <p className="mt-2 max-w-2xl text-sm text-slate-500">
                      {activeView === "refunds"
                        ? "Track requested refunds and their status after payments are approved."
                        : "Real-time payment history with key customer and appointment details."}
                    </p>
                  </div>

                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between xl:justify-end">
                    <label className="flex min-w-60 items-center gap-3 rounded-2xl border border-[#dfe4ff] bg-white px-4 py-2.5 shadow-sm lg:min-w-72.5">
                      <span className="h-4.5 w-4.5 text-[#4338ca]">
                        <DashboardIcon name="search" />
                      </span>
                      <input
                        type="search"
                        value={searchTerm}
                        onChange={(event) => setSearchTerm(event.target.value)}
                        placeholder={
                          activeView === "refunds"
                            ? "Search refunds..."
                            : "Search transactions..."
                        }
                        className="w-full border-none bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
                      />
                    </label>

                    <div className="flex flex-wrap gap-2" aria-label="Choose table view">
                      {viewTabs.map((tab) => {
                        const isActive = tab.id === activeView;

                        return (
                          <button
                            key={tab.id}
                            type="button"
                            onClick={() => setActiveView(tab.id)}
                            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                              isActive
                                ? "bg-slate-950 text-white shadow-md"
                                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                            }`}
                          >
                            {tab.label}
                          </button>
                        );
                      })}
                    </div>

                    <div className="inline-flex items-center gap-3 rounded-2xl bg-slate-100 px-4 py-3 text-sm text-slate-500">
                      <strong className="font-headline text-xl font-bold text-slate-950">
                        {activeView === "refunds"
                          ? filteredRefundPayments.length
                          : filteredPayments.length}
                      </strong>
                      <span>{activeView === "refunds" ? "refund entries" : "records"}</span>
                    </div>
                  </div>
                </div>

                {(activeView === "transactions"
                  ? filteredPayments.length
                  : filteredRefundPayments.length) ? (
                  <div className="mt-6 overflow-hidden rounded-[1.5rem] border border-[#e5e8fb] bg-white">
                    <div className="max-h-190 overflow-auto">
                      <table className="min-w-full divide-y divide-slate-200 text-sm">
                        <thead className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur">
                          <tr>
                            <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                              Customer
                            </th>
                            <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                              Amount
                            </th>
                            <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                              Status
                            </th>
                            <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                              Schedule
                            </th>
                            <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                              Details
                            </th>
                            <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                              Action
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                          {(activeView === "transactions"
                            ? filteredPayments
                            : filteredRefundPayments).map((payment) => (
                            <tr
                              key={payment.id}
                              className="transition hover:bg-[#f4f2ff]/80"
                            >
                              <td className="px-5 py-4 align-top">
                                <div className="flex min-w-55 items-center gap-3">
                                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-linear-to-br from-[#4338ca] to-[#5b50f6] text-sm font-bold text-white shadow-sm">
                                    {getInitials(payment.customerName)}
                                  </span>
                                  <div className="min-w-0">
                                    <strong className="block truncate font-semibold text-slate-900">
                                      {getDisplayValue(payment.customerName)}
                                    </strong>
                                    <span className="block truncate text-slate-500">
                                      {getDisplayValue(payment.customerEmail)}
                                    </span>
                                  </div>
                                </div>
                              </td>
                              <td className="px-5 py-4 align-top">
                                <strong className="block font-semibold text-slate-900">
                                  {formatAmount(
                                    payment.amount,
                                    payment.currency,
                                  )}
                                </strong>
                                <span className="block text-slate-500">
                                  {getDisplayValue(payment.paymentGateway)}
                                </span>
                              </td>
                              <td className="px-5 py-4 align-top">
                                {(() => {
                                  const statusBadge = getPaymentStatusBadge(payment);

                                  return (
                                    <span
                                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] ${
                                        paymentStatusPillMap[statusBadge.tone]
                                      }`}
                                    >
                                      {statusBadge.label}
                                    </span>
                                  );
                                })()}
                                <span className="mt-2 block text-slate-500">
                                  {getPaymentStatusLabel(payment)}
                                </span>
                              </td>
                              <td className="px-5 py-4 align-top">
                                <strong className="block font-semibold text-slate-900">
                                  {buildScheduleLabel(payment)}
                                </strong>
                                <span className="block text-slate-500">
                                  {getDisplayValue(
                                    payment.doctorName,
                                    "Doctor pending",
                                  )}
                                </span>
                              </td>
                              <td className="px-5 py-4 align-top">
                                <strong className="block font-semibold text-slate-900">
                                  {payment.orderId}
                                </strong>
                                <span className="block text-slate-500">
                                  {formatDateTime(payment.createdAt)}
                                  {" | "}
                                  {getDisplayValue(
                                    payment.department,
                                    "General",
                                  )}
                                </span>
                              </td>
                              <td className="px-5 py-4 align-top">
                                {activeView === "transactions" ? (
                                  <div className="space-y-2">
                                    {isRefundEligible(payment) ? (
                                      <>
                                        <button
                                          type="button"
                                          onClick={() => openRefundDialog(payment)}
                                          disabled={isProcessingRefund}
                                          className="inline-flex w-full items-center justify-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] transition bg-[#4338ca] text-white hover:bg-[#2f46e8] disabled:bg-slate-200 disabled:text-slate-500"
                                        >
                                          {isProcessingRefund ? "Processing..." : "Partial refund"}
                                        </button>
                                      </>
                                    ) : payment.refundStatus !== "NONE" ? (
                                      <span className="inline-flex rounded-full bg-[#eef2ff] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#4338ca] ring-1 ring-inset ring-[#d9d5ff]">
                                        {payment.refundStatus === "FULL"
                                          ? "Fully refunded"
                                          : "Partially refunded"}
                                      </span>
                                    ) : (
                                      <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                                        Not eligible
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  <span className="inline-flex rounded-full bg-[#eef2ff] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#4338ca] ring-1 ring-inset ring-[#d9d5ff]">
                                    {payment.refundStatus === "FULL"
                                      ? "Fully refunded"
                                      : payment.refundStatus === "PARTIAL"
                                      ? "Partially refunded"
                                      : "Refunded"}
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="mt-6 rounded-[1.5rem] border border-dashed border-[#dcdffc] bg-[linear-gradient(180deg,rgba(255,255,255,0.88),rgba(241,244,255,0.9))] px-6 py-12 text-center">
                    <h3 className="font-headline text-xl font-semibold text-slate-900">
                      {activeView === "refunds"
                        ? "No refunds have been requested yet"
                        : "No transactions match your search"}
                    </h3>
                    <p className="mt-2 text-sm text-slate-500">
                      {activeView === "refunds"
                        ? "Go to Transactions and request a refund for a completed payment."
                        : "Try another patient name, order number, email, or switch the status filter."}
                    </p>
                  </div>
                )}
              </section>
            </>
          ) : null}
        </section>
      </div>
    </main>
  );
}

export default PaymentDashboard;
