export type OrderStatus = "unshipped" | "shipped_no_tracking" | "in_transit" | "delivered";

export interface Order {
  id: string;
  customer: string;
  product: string;
  amount: string;
  date: string;
  status: OrderStatus;
  tracking?: string;
}

export const orders: Order[] = [
  { id: "#3421", customer: "Sarah Chen", product: "Wireless Headphones", amount: "$129.99", date: "May 8", status: "unshipped" },
  { id: "#3420", customer: "James Wilson", product: "Laptop Stand Pro", amount: "$79.50", date: "May 8", status: "unshipped" },
  { id: "#3419", customer: "Emily Park", product: "USB-C Hub", amount: "$45.00", date: "May 7", status: "shipped_no_tracking" },
  { id: "#3418", customer: "Michael Brown", product: "Mechanical Keyboard", amount: "$159.00", date: "May 7", status: "in_transit", tracking: "1Z999AA10123456784" },
  { id: "#3417", customer: "Lisa Rodriguez", product: "Monitor Light Bar", amount: "$54.99", date: "May 6", status: "shipped_no_tracking" },
  { id: "#3416", customer: "David Kim", product: "Wireless Mouse", amount: "$39.00", date: "May 6", status: "delivered", tracking: "1Z999AA10123456785" },
  { id: "#3415", customer: "Anna Müller", product: "Desk Mat XL", amount: "$28.50", date: "May 5", status: "unshipped" },
  { id: "#3414", customer: "Tom Hayes", product: "Webcam HD", amount: "$89.00", date: "May 5", status: "in_transit", tracking: "1Z999AA10123456786" },
  { id: "#3413", customer: "Priya Patel", product: "Wireless Headphones", amount: "$129.99", date: "May 4", status: "delivered", tracking: "1Z999AA10123456787" },
  { id: "#3412", customer: "Marco Rossi", product: "USB-C Hub", amount: "$45.00", date: "May 4", status: "delivered", tracking: "1Z999AA10123456788" },
  { id: "#3411", customer: "Yuki Tanaka", product: "Laptop Stand Pro", amount: "$79.50", date: "May 3", status: "delivered", tracking: "1Z999AA10123456789" },
  { id: "#3410", customer: "Olivia Reed", product: "Mechanical Keyboard", amount: "$159.00", date: "May 3", status: "shipped_no_tracking" },
];

export const statusMeta: Record<OrderStatus, { label: string; dot: string }> = {
  unshipped: { label: "Unshipped", dot: "bg-warning" },
  shipped_no_tracking: { label: "No tracking", dot: "bg-info" },
  in_transit: { label: "In transit", dot: "bg-foreground" },
  delivered: { label: "Delivered", dot: "bg-success" },
};
