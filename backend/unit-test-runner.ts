import { 
  getBillTotal, 
  WATER_RATE, 
  ELECTRIC_RATE, 
  getInitials, 
  getRoomDisplayStatus, 
  getTenantOutstandingAmount,
  sortBillsDescending
} from "../src/app/core.js";

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    process.exit(1);
  }
  console.log(`✅ PASSED: ${message}`);
}

async function runTests() {
  console.log("🚀 Starting Expanded Unit Test Suite...\n");

  // --- Group 1: Calculations ---
  console.log("--- Group 1: Calculations ---");
  const mockBill = {
    id: "1", roomId: "101", tenantId: "t1", month: "2024-04",
    baseRent: 3500, waterUnits: 10, electricityUnits: 100,
    status: "pending", createdAt: new Date().toISOString()
  };
  const expectedTotal = 3500 + (10 * WATER_RATE) + (100 * ELECTRIC_RATE);
  assert(getBillTotal(mockBill as any) === expectedTotal, `getBillTotal calculation: ${expectedTotal}`);
  assert(getBillTotal({ ...mockBill, total: 5000 } as any) === 5000, "getBillTotal override check");

  // --- Group 2: User Interface Utils ---
  console.log("\n--- Group 2: UI Utilities ---");
  assert(getInitials("Somsak Rakthai") === "SR", "getInitials: Somsak Rakthai -> SR");
  assert(getInitials("   admin   ") === "A", "getInitials: whitespace handling");
  assert(getInitials("") === "SD", "getInitials: empty fallback to SD");

  // --- Group 3: Business Logic ---
  console.log("\n--- Group 3: Business Logic ---");
  const roomEmpty = { id: "101", number: "101", status: "available", tenantId: null };
  const roomOccupied = { id: "102", number: "102", status: "available", tenantId: "user-1" };
  assert(getRoomDisplayStatus(roomEmpty as any) === "available", "Room display: Empty -> available");
  assert(getRoomDisplayStatus(roomOccupied as any) === "occupied", "Room display: Occupied overrides available status");

  const mockState = {
    bills: [
      { id: "b1", tenantId: "t1", status: "pending", baseRent: 3000, waterUnits: 0, electricityUnits: 0 },
      { id: "b2", tenantId: "t1", status: "submitted", baseRent: 3000, waterUnits: 0, electricityUnits: 0 },
      { id: "b3", tenantId: "t1", status: "paid", baseRent: 3000, waterUnits: 0, electricityUnits: 0 },
      { id: "b4", tenantId: "t2", status: "pending", baseRent: 3000, waterUnits: 0, electricityUnits: 0 },
    ]
  };
  const outstandingT1 = getTenantOutstandingAmount(mockState as any, "t1");
  assert(outstandingT1 === 6000, `Tenant Outstanding: Expected 6000 (pending + submitted), got ${outstandingT1}`);

  // --- Group 4: Sorting ---
  console.log("\n--- Group 4: Sorting ---");
  const billsToSort = [
    { id: "old", month: "2024-01", createdAt: "2024-01-01T00:00:00Z" },
    { id: "new", month: "2024-02", createdAt: "2024-02-01T00:00:00Z" }
  ];
  const sorted = [...billsToSort].sort(sortBillsDescending);
  assert(sorted[0].id === "new", "sortBillsDescending: February comes before January");

  console.log("\n✨ All 10 Test Cases Passed Successfully!");
}

runTests().catch(err => {
  console.error(err);
  process.exit(1);
});
