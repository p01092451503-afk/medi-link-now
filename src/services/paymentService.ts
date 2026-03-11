import { loadTossPayments } from "@tosspayments/payment-sdk";

const TOSS_CLIENT_KEY = import.meta.env.VITE_TOSS_CLIENT_KEY ?? '';
if (!TOSS_CLIENT_KEY) {
  console.warn('⚠️ VITE_TOSS_CLIENT_KEY 환경변수가 설정되지 않았습니다. 결제 기능이 제한됩니다.');
}

let tossPaymentsInstance: any = null;

export const getTossPayments = async () => {
  if (!tossPaymentsInstance) {
    tossPaymentsInstance = await loadTossPayments(TOSS_CLIENT_KEY);
  }
  return tossPaymentsInstance;
};

export interface PaymentRequest {
  orderId: string;
  orderName: string;
  amount: number;
  customerName?: string;
  customerEmail?: string;
  successUrl: string;
  failUrl: string;
}

export const requestPayment = async (params: PaymentRequest) => {
  const tossPayments = await getTossPayments();

  return tossPayments.requestPayment("카드", {
    amount: params.amount,
    orderId: params.orderId,
    orderName: params.orderName,
    customerName: params.customerName,
    successUrl: params.successUrl,
    failUrl: params.failUrl,
  });
};

export const generateReceiptPdf = async (payment: {
  orderId: string;
  amount: number;
  origin: string;
  destination: string;
  distanceKm: number;
  vehicleType: string;
  paymentMethod: string;
  createdAt: string;
  platformFee: number;
}) => {
  const { default: jsPDF } = await import("jspdf");
  const doc = new jsPDF();

  doc.setFontSize(20);
  doc.text("구급차 이용 영수증", 105, 30, { align: "center" });

  doc.setFontSize(12);
  doc.setTextColor(100);
  doc.text(`주문번호: ${payment.orderId}`, 20, 50);
  doc.text(
    `발행일: ${new Date(payment.createdAt).toLocaleDateString("ko-KR")}`,
    20,
    58
  );

  doc.setDrawColor(200);
  doc.line(20, 65, 190, 65);

  doc.setTextColor(0);
  doc.setFontSize(11);
  const details = [
    ["출발지", payment.origin],
    ["목적지", payment.destination],
    ["거리", `${payment.distanceKm} km`],
    ["차량 유형", payment.vehicleType === "general" ? "일반 구급차" : "특수 구급차"],
    ["결제 수단", payment.paymentMethod || "-"],
  ];

  let y = 75;
  details.forEach(([label, value]) => {
    doc.setTextColor(100);
    doc.text(label, 20, y);
    doc.setTextColor(0);
    doc.text(value, 80, y);
    y += 8;
  });

  doc.line(20, y + 2, 190, y + 2);
  y += 12;

  doc.setFontSize(11);
  doc.setTextColor(100);
  doc.text("이용 요금", 20, y);
  doc.setTextColor(0);
  doc.text(`${payment.amount.toLocaleString()} 원`, 170, y, { align: "right" });
  y += 8;

  doc.setTextColor(100);
  doc.text("플랫폼 수수료 (10%)", 20, y);
  doc.setTextColor(0);
  doc.text(`${payment.platformFee.toLocaleString()} 원`, 170, y, { align: "right" });
  y += 12;

  doc.setFontSize(14);
  doc.setTextColor(0);
  doc.text("총 결제 금액", 20, y);
  doc.text(`${payment.amount.toLocaleString()} 원`, 170, y, { align: "right" });

  doc.setFontSize(9);
  doc.setTextColor(150);
  doc.text("본 영수증은 전자적으로 발행되었습니다.", 105, 280, { align: "center" });

  return doc;
};
