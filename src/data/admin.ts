export const peso = (n: number) =>
  new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 0,
  }).format(n);

export type BookingStatus = "Pending" | "Confirmed" | "Ongoing" | "Completed" | "Cancelled";
export type PaymentStatus = "Pending" | "Paid" | "Invalid";
export type VehicleStatus = "Available" | "Reserved" | "Rented" | "Maintenance" | "Inactive";
export type MaintenanceStatus = "Scheduled" | "In Progress" | "Completed" | "Overdue";
export type VerificationStatus = "Pending Verification" | "Verified" | "Rejected";

export const branches = ["Taft, Manila", "Antipolo, Rizal"] as const;

export const kpis = {
  totalBookings: 1284,
  activeRentals: 47,
  availableVehicles: 38,
  monthlyRevenue: 2_146_500,
  pendingPayments: 184_200,
  maintenance: 6,
};

export const revenueTrend = [
  { m: "Jan", v: 1320 },
  { m: "Feb", v: 1480 },
  { m: "Mar", v: 1620 },
  { m: "Apr", v: 1410 },
  { m: "May", v: 1780 },
  { m: "Jun", v: 1890 },
  { m: "Jul", v: 1950 },
  { m: "Aug", v: 2040 },
  { m: "Sep", v: 1980 },
  { m: "Oct", v: 2120 },
  { m: "Nov", v: 2080 },
  { m: "Dec", v: 2146 },
];

export const bookingVolume = [
  { d: "Mon", taft: 18, antipolo: 12 },
  { d: "Tue", taft: 22, antipolo: 14 },
  { d: "Wed", taft: 19, antipolo: 17 },
  { d: "Thu", taft: 24, antipolo: 16 },
  { d: "Fri", taft: 32, antipolo: 22 },
  { d: "Sat", taft: 38, antipolo: 28 },
  { d: "Sun", taft: 30, antipolo: 24 },
];

export const fleetUtilization = [
  { cat: "Sedan", util: 82 },
  { cat: "SUV", util: 74 },
  { cat: "MPV", util: 68 },
  { cat: "Van", util: 91 },
  { cat: "Pickup", util: 55 },
  { cat: "Economy", util: 78 },
];

export const branchDemand = [
  { name: "Taft, Manila", value: 62 },
  { name: "Antipolo, Rizal", value: 38 },
];

export type Booking = {
  id: string;
  customer: string;
  vehicle: string;
  plate: string;
  branch: string;
  from: string;
  to: string;
  amount: number;
  status: BookingStatus;
  payment: PaymentStatus;
};

export const bookings: Booking[] = [
  {
    id: "BR-10287",
    customer: "Customer Demo",
    vehicle: "Toyota Vios",
    plate: "NEA 1284",
    branch: "Taft, Manila",
    from: "2026-05-10",
    to: "2026-05-12",
    amount: 3600,
    status: "Completed",
    payment: "Paid",
  },
  {
    id: "BR-10286",
    customer: "Customer Demo",
    vehicle: "Toyota Wigo",
    plate: "AAJ 2231",
    branch: "Antipolo, Rizal",
    from: "2026-04-26",
    to: "2026-04-27",
    amount: 1000,
    status: "Cancelled",
    payment: "Invalid",
  },
  {
    id: "BR-10284",
    customer: "Marco Dela Cruz",
    vehicle: "Toyota Vios",
    plate: "NEA 1284",
    branch: "Taft, Manila",
    from: "2026-05-22",
    to: "2026-05-25",
    amount: 5400,
    status: "Ongoing",
    payment: "Paid",
  },
  {
    id: "BR-10283",
    customer: "Rhea Santos",
    vehicle: "Toyota Innova",
    plate: "ABM 9921",
    branch: "Antipolo, Rizal",
    from: "2026-05-24",
    to: "2026-05-28",
    amount: 11200,
    status: "Confirmed",
    payment: "Pending",
  },
  {
    id: "BR-10282",
    customer: "Jen Pamintuan",
    vehicle: "Nissan Urvan",
    plate: "NDB 4410",
    branch: "Antipolo, Rizal",
    from: "2026-05-25",
    to: "2026-05-26",
    amount: 7000,
    status: "Pending",
    payment: "Pending",
  },
  {
    id: "BR-10281",
    customer: "Carlo Mendoza",
    vehicle: "Ford Everest",
    plate: "NCA 7710",
    branch: "Taft, Manila",
    from: "2026-05-20",
    to: "2026-05-23",
    amount: 9600,
    status: "Completed",
    payment: "Paid",
  },
  {
    id: "BR-10280",
    customer: "Bianca Ramos",
    vehicle: "Toyota Wigo",
    plate: "AAJ 2231",
    branch: "Taft, Manila",
    from: "2026-05-23",
    to: "2026-05-24",
    amount: 1000,
    status: "Ongoing",
    payment: "Paid",
  },
  {
    id: "BR-10279",
    customer: "Paolo Reyes",
    vehicle: "Honda City",
    plate: "NEB 5582",
    branch: "Taft, Manila",
    from: "2026-05-19",
    to: "2026-05-22",
    amount: 6000,
    status: "Completed",
    payment: "Paid",
  },
  {
    id: "BR-10278",
    customer: "Mikaela Ong",
    vehicle: "Toyota Rush",
    plate: "CAA 1109",
    branch: "Antipolo, Rizal",
    from: "2026-05-26",
    to: "2026-05-30",
    amount: 10000,
    status: "Confirmed",
    payment: "Paid",
  },
  {
    id: "BR-10277",
    customer: "Jomar Lim",
    vehicle: "Toyota Hiace",
    plate: "NDF 8821",
    branch: "Taft, Manila",
    from: "2026-05-27",
    to: "2026-05-29",
    amount: 8400,
    status: "Pending",
    payment: "Pending",
  },
  {
    id: "BR-10276",
    customer: "Andrea Villanueva",
    vehicle: "Mitsubishi Mirage",
    plate: "NEH 3380",
    branch: "Taft, Manila",
    from: "2026-05-18",
    to: "2026-05-19",
    amount: 1200,
    status: "Cancelled",
    payment: "Invalid",
  },
  {
    id: "BR-10275",
    customer: "Kenji Tan",
    vehicle: "Ford Ranger",
    plate: "CAB 7720",
    branch: "Antipolo, Rizal",
    from: "2026-05-21",
    to: "2026-05-24",
    amount: 9000,
    status: "Completed",
    payment: "Paid",
  },
];

export type Customer = {
  id: string;
  name: string;
  email: string;
  phone: string;
  joined: string;
  trips: number;
  spent: number;
  verification: VerificationStatus;
};

export const customers: Customer[] = [
  {
    id: "C-2841",
    name: "Marco Dela Cruz",
    email: "marco.dc@gmail.com",
    phone: "+63 917 142 0091",
    joined: "2024-08-12",
    trips: 12,
    spent: 64200,
    verification: "Verified",
  },
  {
    id: "C-2840",
    name: "Rhea Santos",
    email: "rhea.santos@yahoo.com",
    phone: "+63 918 230 1110",
    joined: "2024-10-04",
    trips: 7,
    spent: 41800,
    verification: "Verified",
  },
  {
    id: "C-2839",
    name: "Jen Pamintuan",
    email: "jen.p@outlook.com",
    phone: "+63 917 552 0042",
    joined: "2025-01-22",
    trips: 3,
    spent: 18200,
    verification: "Pending Verification",
  },
  {
    id: "C-2838",
    name: "Carlo Mendoza",
    email: "carlom@gmail.com",
    phone: "+63 916 778 1199",
    joined: "2024-03-09",
    trips: 22,
    spent: 132400,
    verification: "Verified",
  },
  {
    id: "C-2837",
    name: "Bianca Ramos",
    email: "bianca.r@gmail.com",
    phone: "+63 919 002 5577",
    joined: "2025-04-01",
    trips: 1,
    spent: 1000,
    verification: "Pending Verification",
  },
  {
    id: "C-2836",
    name: "Paolo Reyes",
    email: "paolo.r@gmail.com",
    phone: "+63 917 882 1100",
    joined: "2024-06-18",
    trips: 9,
    spent: 58400,
    verification: "Verified",
  },
  {
    id: "C-2835",
    name: "Mikaela Ong",
    email: "mikaela@gmail.com",
    phone: "+63 918 441 2299",
    joined: "2025-02-14",
    trips: 4,
    spent: 22600,
    verification: "Verified",
  },
  {
    id: "C-2834",
    name: "Andrea Villanueva",
    email: "andreav@gmail.com",
    phone: "+63 919 220 3344",
    joined: "2025-03-30",
    trips: 1,
    spent: 1200,
    verification: "Rejected",
  },
];

export type FleetVehicle = {
  id: string;
  name: string;
  plate: string;
  make: string;
  model: string;
  color: string;
  category: string;
  transmission: "Automatic" | "Manual";
  seats: number;
  branch: string;
  pricePerDay: number;
  condition: "Excellent" | "Good" | "Needs service";
  status: VehicleStatus;
  chassisNumber?: string;
};

export const fleet: FleetVehicle[] = [
  {
    id: "F-001",
    name: "Toyota Wigo",
    plate: "AAJ 2231",
    make: "Toyota",
    model: "Wigo",
    color: "Silver",
    category: "Economy",
    transmission: "Manual",
    seats: 5,
    branch: "Taft, Manila",
    pricePerDay: 1000,
    condition: "Good",
    status: "Rented",
    chassisNumber: "CHS-TOY-WIGO-001",
  },
  {
    id: "F-002",
    name: "Mitsubishi Mirage",
    plate: "NEH 3380",
    make: "Mitsubishi",
    model: "Mirage",
    color: "White",
    category: "Economy",
    transmission: "Automatic",
    seats: 5,
    branch: "Taft, Manila",
    pricePerDay: 1200,
    condition: "Excellent",
    status: "Available",
    chassisNumber: "CHS-MIT-MIR-002",
  },
  {
    id: "F-003",
    name: "Toyota Vios",
    plate: "NEA 1284",
    make: "Toyota",
    model: "Vios",
    color: "Black",
    category: "Sedan",
    transmission: "Automatic",
    seats: 5,
    branch: "Antipolo, Rizal",
    pricePerDay: 1800,
    condition: "Excellent",
    status: "Rented",
    chassisNumber: "CHS-TOY-VIO-003",
  },
  {
    id: "F-004",
    name: "Honda City",
    plate: "NEB 5582",
    make: "Honda",
    model: "City",
    color: "Gray",
    category: "Sedan",
    transmission: "Automatic",
    seats: 5,
    branch: "Taft, Manila",
    pricePerDay: 2000,
    condition: "Good",
    status: "Maintenance",
    chassisNumber: "CHS-HON-CITY-004",
  },
  {
    id: "F-005",
    name: "Toyota Rush",
    plate: "CAA 1109",
    make: "Toyota",
    model: "Rush",
    color: "Red",
    category: "SUV",
    transmission: "Automatic",
    seats: 7,
    branch: "Antipolo, Rizal",
    pricePerDay: 2500,
    condition: "Excellent",
    status: "Reserved",
    chassisNumber: "CHS-TOY-RUS-005",
  },
  {
    id: "F-006",
    name: "Ford Everest",
    plate: "NCA 7710",
    make: "Ford",
    model: "Everest",
    color: "Blue",
    category: "SUV",
    transmission: "Automatic",
    seats: 7,
    branch: "Taft, Manila",
    pricePerDay: 3200,
    condition: "Good",
    status: "Available",
    chassisNumber: "CHS-FOR-EVE-006",
  },
  {
    id: "F-007",
    name: "Toyota Avanza",
    plate: "NCB 1182",
    make: "Toyota",
    model: "Avanza",
    color: "White",
    category: "MPV",
    transmission: "Automatic",
    seats: 7,
    branch: "Antipolo, Rizal",
    pricePerDay: 2200,
    condition: "Good",
    status: "Available",
    chassisNumber: "CHS-TOY-AVA-007",
  },
  {
    id: "F-008",
    name: "Toyota Innova",
    plate: "ABM 9921",
    make: "Toyota",
    model: "Innova",
    color: "Brown",
    category: "MPV",
    transmission: "Automatic",
    seats: 8,
    branch: "Taft, Manila",
    pricePerDay: 2800,
    condition: "Excellent",
    status: "Reserved",
    chassisNumber: "CHS-TOY-INN-008",
  },
  {
    id: "F-009",
    name: "Nissan Urvan",
    plate: "NDB 4410",
    make: "Nissan",
    model: "Urvan",
    color: "White",
    category: "Van",
    transmission: "Manual",
    seats: 15,
    branch: "Antipolo, Rizal",
    pricePerDay: 3500,
    condition: "Good",
    status: "Reserved",
    chassisNumber: "CHS-NIS-URV-009",
  },
  {
    id: "F-010",
    name: "Toyota Hiace",
    plate: "NDF 8821",
    make: "Toyota",
    model: "Hiace",
    color: "White",
    category: "Van",
    transmission: "Manual",
    seats: 15,
    branch: "Taft, Manila",
    pricePerDay: 4200,
    condition: "Needs service",
    status: "Maintenance",
    chassisNumber: "CHS-TOY-HIA-010",
  },
  {
    id: "F-011",
    name: "Ford Ranger",
    plate: "CAB 7720",
    make: "Ford",
    model: "Ranger",
    color: "Gray",
    category: "Pickup",
    transmission: "Automatic",
    seats: 5,
    branch: "Antipolo, Rizal",
    pricePerDay: 3000,
    condition: "Excellent",
    status: "Available",
    chassisNumber: "CHS-FOR-RAN-011",
  },
  {
    id: "F-012",
    name: "Toyota Hilux",
    plate: "NDA 6610",
    make: "Toyota",
    model: "Hilux",
    color: "Black",
    category: "Pickup",
    transmission: "Automatic",
    seats: 5,
    branch: "Taft, Manila",
    pricePerDay: 3300,
    condition: "Good",
    status: "Inactive",
    chassisNumber: "CHS-TOY-HIL-012",
  },
];

export type Payment = {
  id: string;
  booking: string;
  customer: string;
  amount: number;
  method: "GCash" | "Bank Transfer" | "Cash" | "Card";
  date: string;
  status: PaymentStatus;
};

export const payments: Payment[] = [
  {
    id: "PY-50412",
    booking: "BR-10284",
    customer: "Marco Dela Cruz",
    amount: 5400,
    method: "GCash",
    date: "2026-05-21",
    status: "Paid",
  },
  {
    id: "PY-50411",
    booking: "BR-10283",
    customer: "Rhea Santos",
    amount: 5600,
    method: "Bank Transfer",
    date: "2026-05-22",
    status: "Pending",
  },
  {
    id: "PY-50410",
    booking: "BR-10282",
    customer: "Jen Pamintuan",
    amount: 7000,
    method: "GCash",
    date: "2026-05-24",
    status: "Pending",
  },
  {
    id: "PY-50409",
    booking: "BR-10281",
    customer: "Carlo Mendoza",
    amount: 9600,
    method: "Card",
    date: "2026-05-19",
    status: "Paid",
  },
  {
    id: "PY-50408",
    booking: "BR-10277",
    customer: "Jomar Lim",
    amount: 8400,
    method: "Bank Transfer",
    date: "2026-05-25",
    status: "Pending",
  },
  {
    id: "PY-50407",
    booking: "BR-10276",
    customer: "Andrea Villanueva",
    amount: 1200,
    method: "GCash",
    date: "2026-05-18",
    status: "Invalid",
  },
  {
    id: "PY-50406",
    booking: "BR-10275",
    customer: "Kenji Tan",
    amount: 9000,
    method: "Cash",
    date: "2026-05-20",
    status: "Paid",
  },
  {
    id: "PY-50405",
    booking: "BR-10271",
    customer: "Liza Cruz",
    amount: 4200,
    method: "Card",
    date: "2026-05-15",
    status: "Invalid",
  },
];

export type Maintenance = {
  id: string;
  vehicle: string;
  plate: string;
  type: string;
  branch: string;
  due: string;
  status: MaintenanceStatus;
  cost: number;
};

export const maintenance: Maintenance[] = [
  {
    id: "M-1041",
    vehicle: "Honda City",
    plate: "NEB 5582",
    type: "Brake pad replacement",
    branch: "Taft, Manila",
    due: "2026-05-24",
    status: "In Progress",
    cost: 4500,
  },
  {
    id: "M-1040",
    vehicle: "Toyota Hiace",
    plate: "NDF 8821",
    type: "Engine oil & filter",
    branch: "Taft, Manila",
    due: "2026-05-22",
    status: "Overdue",
    cost: 3200,
  },
  {
    id: "M-1039",
    vehicle: "Toyota Rush",
    plate: "CAA 1109",
    type: "Tire rotation",
    branch: "Antipolo, Rizal",
    due: "2026-05-28",
    status: "Scheduled",
    cost: 1200,
  },
  {
    id: "M-1038",
    vehicle: "Toyota Vios",
    plate: "NEA 1284",
    type: "Aircon recharge",
    branch: "Antipolo, Rizal",
    due: "2026-06-02",
    status: "Scheduled",
    cost: 2400,
  },
  {
    id: "M-1037",
    vehicle: "Ford Everest",
    plate: "NCA 7710",
    type: "PMS 30k",
    branch: "Taft, Manila",
    due: "2026-05-15",
    status: "Completed",
    cost: 8400,
  },
  {
    id: "M-1036",
    vehicle: "Toyota Hilux",
    plate: "NDA 6610",
    type: "Suspension check",
    branch: "Taft, Manila",
    due: "2026-05-30",
    status: "Scheduled",
    cost: 5500,
  },
];

export type Alert = {
  id: string;
  kind: "warning" | "info" | "danger" | "success";
  title: string;
  meta: string;
};
export const alerts: Alert[] = [
  {
    id: "a1",
    kind: "warning",
    title: "3 booking approvals pending",
    meta: "Oldest: 4h ago • Antipolo",
  },
  {
    id: "a2",
    kind: "danger",
    title: "Overdue return — BR-10260",
    meta: "Toyota Vios • 12h overdue",
  },
  { id: "a3", kind: "warning", title: "Maintenance overdue", meta: "Toyota Hiace NDF 8821" },
  { id: "a4", kind: "info", title: "Low availability — Vans", meta: "Taft branch • 1 left" },
  { id: "a5", kind: "danger", title: "Invalid payment", meta: "PY-50405 • Liza Cruz" },
];

export type Activity = { id: string; who: string; what: string; when: string };
export const activity: Activity[] = [
  { id: "act1", who: "Marco Dela Cruz", what: "completed booking BR-10281", when: "12 min ago" },
  {
    id: "act2",
    who: "Business Owner (Karla)",
    what: "approved BR-10283 for Rhea Santos",
    when: "38 min ago",
  },
  { id: "act3", who: "Jen Pamintuan", what: "uploaded proof of payment", when: "1 h ago" },
  { id: "act4", who: "Maintenance team", what: "logged service for NCA 7710", when: "2 h ago" },
  { id: "act5", who: "Carlo Mendoza", what: "returned Ford Everest", when: "3 h ago" },
  { id: "act6", who: "System", what: "auto-reminder sent to 4 renters", when: "5 h ago" },
];

export const branchPerformance = [
  { name: "Taft, Manila", active: 28, fleet: 22, revenue: 1320500, demand: 78 },
  { name: "Antipolo, Rizal", active: 19, fleet: 16, revenue: 826000, demand: 62 },
];

export const users = [
  {
    id: "U-01",
    name: "Karla Ignacio",
    email: "karla@briahsrental.ph",
    role: "Business Owner",
    status: "Active",
  },
  {
    id: "U-02",
    name: "Mike Rivera",
    email: "mike@briahsrental.ph",
    role: "Staff",
    status: "Active",
  },
  {
    id: "U-03",
    name: "Aileen Bautista",
    email: "aileen@briahsrental.ph",
    role: "Staff",
    status: "Active",
  },
  {
    id: "U-04",
    name: "Marco Dela Cruz",
    email: "marco.dc@gmail.com",
    role: "Customers / Renters",
    status: "Active",
  },
  {
    id: "U-05",
    name: "Rhea Santos",
    email: "rhea.santos@yahoo.com",
    role: "Customers / Renters",
    status: "Active",
  },
  {
    id: "U-06",
    name: "Jen Pamintuan",
    email: "jen.p@outlook.com",
    role: "Customers / Renters",
    status: "Invited",
  },
];

export const notifications = [
  {
    id: "n1",
    category: "Booking",
    title: "BR-10282 awaiting approval",
    when: "4 min ago",
    unread: true,
  },
  {
    id: "n2",
    category: "Payment",
    title: "GCash payment received — PY-50412",
    when: "22 min ago",
    unread: true,
  },
  {
    id: "n3",
    category: "Maintenance",
    title: "Service scheduled for Toyota Rush",
    when: "1 h ago",
    unread: false,
  },
  { id: "n4", category: "Return", title: "BR-10260 marked overdue", when: "2 h ago", unread: true },
  {
    id: "n5",
    category: "Availability",
    title: "Van inventory low at Taft",
    when: "3 h ago",
    unread: false,
  },
  {
    id: "n6",
    category: "Verification",
    title: "Bianca Ramos uploaded ID",
    when: "5 h ago",
    unread: false,
  },
];
