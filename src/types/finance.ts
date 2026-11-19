export interface FinanceAutodebetHistory {
  id: string;
  legislatorId: string;
  startMonth: string; // YYYY-MM
  endMonth?: string | null; // YYYY-MM | null
  isActive: boolean;
  notes?: string;
  updatedBy?: string;
  createdAt?: string | null;
}

export interface FinanceLegislator {
  id: string;
  namaLengkap: string;
  tingkat: 'PROVINSI' | 'KAB_KOTA';
  daerah: string;
  urutan: number;
  isActive: boolean;
  isAutodebetActive: boolean;
  autodebetStartMonth?: string | null;
  autodebetEndMonth?: string | null;
  autodebetHistories: FinanceAutodebetHistory[];
  catatan?: string;
  memberNik?: string;
  currentTariffDpw: number;
  currentTariffDpp: number;
  currentTariffTotal: number;
}

export interface FinanceTariffRule {
  id: string;
  tingkat: 'PROVINSI' | 'KAB_KOTA';
  daerah: string;
  effectiveFrom: string; // YYYY-MM
  effectiveTo?: string | null;
  amountDpw: number;
  amountDpp: number;
  totalObligation: number;
  notes?: string;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface FinanceTransaction {
  id: string;
  txDate: string; // YYYY-MM-DD
  accountType: 'BANK_DPW' | 'PETTY_CASH';
  direction: 'IN' | 'OUT';
  category: string;
  description: string;
  amount: number;
  proofUrl?: string;
  relatedRemittanceId?: string | null;
  relatedBatchId?: string | null;
  isHistorical: boolean;
  canDelete?: boolean;
  lockReason?: 'HISTORICAL' | 'DPP_REMITTANCE' | 'DUES_PAYMENT' | null;
  createdBy?: string;
  createdAt?: string | null;
}

export interface FinanceDuesPaymentRecord {
  id: string;
  legislatorId: string;
  namaLengkap: string;
  tingkat: string;
  daerah: string;
  periodMonth: string;
  periodLabel: string;
  paymentDate?: string | null;
  amountDpw: number;
  amountDpp: number;
  totalAmount: number;
  paymentMethod: 'MANUAL' | 'AUTODEBET' | string;
  dppRemittanceId?: string | null;
  transactionId?: string | null;
  proofUrl?: string;
  notes?: string;
  isHistorical: boolean;
  canDelete: boolean;
  createdBy?: string;
  createdAt?: string | null;
}

export interface FinanceExpenseCategoryBreakdown {
  category: string;
  total: number;
  bankTotal: number;
  pettyTotal: number;
  count: number;
}

export interface FinanceExpenseMonthBreakdown {
  ym: string;
  total: number;
  bankTotal: number;
  pettyTotal: number;
  count: number;
}

export interface FinanceTransactionsResponse {
  items: FinanceTransaction[];
  openingBalance: number | null;
  closingBalance: number | null;
  summary: { totalIn: number; totalOut: number; netDelta: number };
  byCategory?: FinanceExpenseCategoryBreakdown[];
  byMonth?: FinanceExpenseMonthBreakdown[];
  expenseTotals?: {
    totalExpense: number;
    bankExpense: number;
    pettyExpense: number;
    count: number;
  };
}

export interface FinanceDppRemittanceItem {
  id: string;
  legislatorId: string;
  namaLengkap: string;
  tingkat: string;
  daerah: string;
  periodMonth: string;
  paymentDate?: string | null;
  amountDpp: number;
  paymentMethod: 'MANUAL' | 'AUTODEBET' | string;
}

export interface FinanceDppRemittance {
  id: string;
  remittanceDate: string;
  periodLabel: string;
  totalDppAmount: number;
  bankFee: number;
  totalTransferred: number;
  recipientAccount: string;
  referenceNo: string;
  proofUrl: string;
  notes: string;
  isHistorical: boolean;
  itemCount: number;
  createdBy?: string;
  createdAt?: string | null;
  items?: FinanceDppRemittanceItem[];
}

export interface FinancePendingDppItem {
  id: string;
  legislatorId: string;
  namaLengkap: string;
  tingkat: string;
  daerah: string;
  periodMonth: string;
  periodLabel: string;
  paymentDate?: string | null;
  amountDpp: number;
  amountDpw: number;
  paymentMethod: string;
}

export interface FinancePendingDppResponse {
  items: FinancePendingDppItem[];
  totalPendingDpp: number;
  count: number;
  byDaerah: Array<{ daerah: string; totalAmount: number }>;
}

export interface FinanceMatrixCell {
  amount: number;
  target: number;
  amountDpw: number;
  amountDpp: number;
  targetDpw: number;
  targetDpp: number;
  method: 'AUTODEBET' | 'MANUAL' | null;
  status: 'PAID' | 'PARTIAL' | 'UNPAID';
  remitted: boolean;
  hasRemittedDpp: boolean;
  isHistorical: boolean;
  paymentIds: string[];
  allPaymentIds: string[];
}

export interface FinanceMatrixLegislatorRow {
  id: string;
  namaLengkap: string;
  tingkat: 'PROVINSI' | 'KAB_KOTA';
  daerah: string;
  isAutodebetActive: boolean;
  autodebetStartMonth?: string | null;
  autodebetEndMonth?: string | null;
  autodebetHistories: FinanceAutodebetHistory[];
  totalBilled: number;
  totalPaid: number;
  paidManual?: number;
  paidAutodebet?: number;
  debt: number;
  overpaid: number;
  balanceDelta: number;
  cells: Record<string, FinanceMatrixCell>;
}

export interface FinanceMatrixGroup {
  tingkat: 'PROVINSI' | 'KAB_KOTA';
  daerah: string;
  monthlyTariffs: Record<string, number>;
  legislators: FinanceMatrixLegislatorRow[];
  totals: {
    totalBilled: number;
    totalPaid: number;
    paidManual?: number;
    paidAutodebet?: number;
    debt: number;
    balanceDelta: number;
    monthlyPaid?: Record<string, number>;
  };
}

export interface FinanceMatrixResponse {
  kind: 'DPW' | 'DPP';
  startMonth: string;
  endMonth: string;
  months: Array<{ ym: string; label: string }>;
  monthlyTotals?: Record<
    string,
    { billed: number; paid: number; paidManual: number; paidAutodebet: number }
  >;
  groups: FinanceMatrixGroup[];
  grandTotals: {
    legislatorCount: number;
    totalBilled: number;
    totalPaid: number;
    paidManual?: number;
    paidAutodebet?: number;
    paidCount?: number;
    debtCount?: number;
    debt: number;
    balanceDelta: number;
  };
}

export interface FinanceAutodebetGroup {
  tingkat: 'PROVINSI' | 'KAB_KOTA';
  daerah: string;
  periodMonth: string;
  memberCount: number;
  alreadyRecordedCount: number;
  isFullyRecorded: boolean;
  cancellableCount: number;
  cancellableAnyCount: number;
  remittedLockedCount: number;
  tariffDpwPerMember: number;
  tariffDppPerMember: number;
  totalDpw: number;
  totalDpp: number;
  grandTotal: number;
  members: Array<{
    id: string;
    namaLengkap: string;
    amountDpw: number;
    amountDpp: number;
    alreadyPaid: boolean;
    paidDpw: number;
    paidDpp: number;
    paymentIds: string[];
    cancellablePaymentIds: string[];
    cancellableAutodebetIds: string[];
    hasRemittedDpp: boolean;
  }>;
}

export interface FinancePeriodMetrics {
  year: string;
  from: string;
  to: string;
  dpwBilled: number;
  dpwPaid: number;
  dpwPaidManual: number;
  dpwPaidAutodebet: number;
  dpwDebt: number;
  dppBilled: number;
  dppPaid: number;
  dppPaidManual: number;
  dppPaidAutodebet: number;
  dppDebt: number;
  totalPaid: number;
  totalDebt: number;
  bankIn: number;
  bankOut: number;
  pettyIn: number;
  pettyOut: number;
  dpwExpense?: number;
  dpwExpenseBank?: number;
  dpwExpensePetty?: number;
  dppRemittedOut?: number;
  netDpwSurplus?: number;
}

export interface FinanceMonthlyBreakdownRow {
  ym: string;
  label: string;
  dpwBilled: number;
  dpwPaid: number;
  dpwPaidManual: number;
  dpwPaidAutodebet: number;
  dpwDebt: number;
  dppBilled: number;
  dppPaid: number;
  dppPaidManual: number;
  dppPaidAutodebet: number;
  dppDebt: number;
  totalPaid: number;
  bankIn: number;
  bankOut: number;
  pettyIn: number;
  pettyOut: number;
  dpwExpense?: number;
  dpwExpenseBank?: number;
  dpwExpensePetty?: number;
  dppRemittedOut?: number;
  netDpwSurplus?: number;
}

export interface FinanceSummary {
  refMonth: string;
  yearFilter?: string;
  availableYears?: string[];
  debtPeriod: { from: string; to: string };
  periodMetrics?: FinancePeriodMetrics;
  yearlyComparison?: FinancePeriodMetrics[];
  monthlyBreakdown?: FinanceMonthlyBreakdownRow[];
  balances: {
    bankBalance: number;
    pendingDppTotal: number;
    pendingDppCount: number;
    netDpwBankBalance: number;
    pettyCashBalance: number;
    totalCollectedDpw: number;
    totalCollectedDpp: number;
    totalRemittedDpp: number;
    totalDpwDebt: number;
    totalDppDebt: number;
    legislatorCount: number;
  };
  regionBreakdown: Array<{
    tingkat: 'PROVINSI' | 'KAB_KOTA';
    daerah: string;
    legislatorCount: number;
    autodebetActiveCount: number;
    dpwBilled: number;
    dpwPaid: number;
    dpwPaidManual?: number;
    dpwPaidAutodebet?: number;
    dpwDebt: number;
    dppBilled: number;
    dppPaid: number;
    dppPaidManual?: number;
    dppPaidAutodebet?: number;
    dppDebt: number;
    compliancePct?: number;
  }>;
  autodebetRegionGroups: FinanceAutodebetGroup[];
  autodebetInactiveRegions: Array<{
    daerah: string;
    members: Array<{
      id: string;
      namaLengkap: string;
      startMonth?: string | null;
      endMonth?: string | null;
    }>;
  }>;
  recentTransactions: FinanceTransaction[];
}
