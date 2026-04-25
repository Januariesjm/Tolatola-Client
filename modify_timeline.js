const fs = require('fs');
const file = '/home/januaries/Desktop/Tolatola/multivendor-marketplace-build/Tolatola-Client/app/track/status/page.tsx';
let content = fs.readFileSync(file, 'utf8');

const oldSteps = `const TIMELINE_STEPS: { id: OrderStatus; label: string }[] = [
  { id: "ORDER_RECEIVED", label: "Order Received" },
  { id: "PAYMENT_SECURED", label: "Payment Secured" },
  { id: "VENDOR_PREPARING", label: "Vendor Preparing" },
  { id: "PICKED_UP", label: "Picked Up" },
  { id: "IN_TRANSIT", label: "In Transit" },
  { id: "DELIVERED", label: "Delivered" },
]

const STATUS_INDEX_MAP: Record<string, number> = {
  ORDER_RECEIVED: 0,
  pending: 0,
  confirmed: 0,
  PAYMENT_SECURED: 1,
  paid: 1,
  payment_received: 1,
  VENDOR_PREPARING: 2,
  processing: 2,
  preparing: 2,
  PICKED_UP: 3,
  picked_up: 3,
  IN_TRANSIT: 4,
  in_transit: 4,
  shipped: 4,
  DELIVERED: 5,
  delivered: 5,
}`;

const newSteps = `const TIMELINE_STEPS: { id: string; label: string }[] = [
  { id: "ORDER_RECEIVED", label: "Order Received" },
  { id: "PAYMENT_CONFIRMED", label: "Payment Confirmed" },
  { id: "PROCESSING", label: "Processing" },
  { id: "DISPATCHED", label: "Dispatched" },
  { id: "IN_TRANSIT", label: "In Transit" },
  { id: "DELIVERED", label: "Delivered" },
]

const STATUS_INDEX_MAP: Record<string, number> = {
  ORDER_RECEIVED: 0,
  pending: 0,
  pending_payment: 0,
  PAYMENT_CONFIRMED: 1,
  confirmed: 1,
  paid: 1,
  PROCESSING: 2,
  processing: 2,
  preparing: 2,
  DISPATCHED: 3,
  dispatched: 3,
  ready_for_pickup: 3,
  picked_up: 3,
  IN_TRANSIT: 4,
  in_transit: 4,
  shipped: 4,
  DELIVERED: 5,
  delivered: 5,
  completed: 5,
}`;

content = content.replace(oldSteps, newSteps);

// Also need to fix the import of OrderStatus since we removed it from id signature or changed it to string to avoid typescript errors if enum isn't completely matched.
content = content.replace('import type { OrderTrackingInfo, OrderStatus } from "../../../lib/types"', 'import type { OrderTrackingInfo } from "../../../lib/types"');

fs.writeFileSync(file, content);
console.log("Success modifying timeline in page.tsx");
