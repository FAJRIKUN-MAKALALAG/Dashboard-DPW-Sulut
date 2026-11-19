import { apiFetch } from './http';
import {
  FinanceDppRemittance,
  FinanceDuesPaymentRecord,
  FinanceLegislator,
  FinanceMatrixResponse,
  FinancePendingDppResponse,
  FinanceSummary,
  FinanceTariffRule,
  FinanceTransaction,
  FinanceTransactionsResponse,
} from '../types/finance';

export const FinanceService = {
  async getSummary(month?: string, year?: string): Promise<FinanceSummary> {
    const sp = new URLSearchParams();
    if (month) sp.set('month', month);
    if (year) sp.set('year', year);
    const qs = sp.toString();
    return apiFetch<FinanceSummary>(`/finance/summary${qs ? `?${qs}` : ''}`);
  },

  async listLegislators(params?: {
    month?: string;
    includeInactive?: boolean;
  }): Promise<{ items: FinanceLegislator[]; daerahList: string[] }> {
    const sp = new URLSearchParams();
    if (params?.month) sp.set('month', params.month);
    if (params?.includeInactive) sp.set('includeInactive', 'true');
    const qs = sp.toString();
    return apiFetch<{ items: FinanceLegislator[]; daerahList: string[] }>(
      `/finance/legislators${qs ? `?${qs}` : ''}`
    );
  },

  async createLegislator(payload: {
    namaLengkap: string;
    tingkat: 'PROVINSI' | 'KAB_KOTA';
    daerah: string;
    urutan?: number;
    isAutodebetActive?: boolean;
    autodebetStartMonth?: string;
    autodebetNotes?: string;
    catatan?: string;
    memberNik?: string;
  }): Promise<FinanceLegislator> {
    return apiFetch<FinanceLegislator>('/finance/legislators', {
      method: 'POST',
      body: payload,
    });
  },

  async updateLegislator(
    id: string,
    payload: {
      namaLengkap?: string;
      tingkat?: 'PROVINSI' | 'KAB_KOTA';
      daerah?: string;
      urutan?: number;
      isActive?: boolean;
      isAutodebetActive?: boolean;
      autodebetStartMonth?: string | null;
      autodebetEndMonth?: string | null;
      autodebetNotes?: string;
      catatan?: string;
      memberNik?: string;
    }
  ): Promise<FinanceLegislator> {
    return apiFetch<FinanceLegislator>(`/finance/legislators/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: payload,
    });
  },

  async deleteLegislator(id: string): Promise<{ ok: boolean; message: string }> {
    return apiFetch<{ ok: boolean; message: string }>(
      `/finance/legislators/${encodeURIComponent(id)}`,
      { method: 'DELETE' }
    );
  },

  async listTariffs(): Promise<FinanceTariffRule[]> {
    const res = await apiFetch<{ items: FinanceTariffRule[] }>('/finance/tariffs');
    return res.items || [];
  },

  async createTariff(payload: {
    tingkat: 'PROVINSI' | 'KAB_KOTA';
    daerah: string;
    effectiveFrom: string;
    effectiveTo?: string | null;
    amountDpw: number;
    amountDpp: number;
    notes?: string;
  }): Promise<FinanceTariffRule> {
    return apiFetch<FinanceTariffRule>('/finance/tariffs', {
      method: 'POST',
      body: payload,
    });
  },

  async updateTariff(
    id: string,
    payload: {
      effectiveFrom?: string;
      effectiveTo?: string | null;
      amountDpw?: number;
      amountDpp?: number;
      notes?: string;
    }
  ): Promise<FinanceTariffRule> {
    return apiFetch<FinanceTariffRule>(`/finance/tariffs/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: payload,
    });
  },

  async deleteTariff(id: string): Promise<void> {
    await apiFetch(`/finance/tariffs/${encodeURIComponent(id)}`, { method: 'DELETE' });
  },

  async getMatrix(params: {
    type: 'DPW' | 'DPP';
    from: string;
    to: string;
    daerah?: string;
    tingkat?: 'ALL' | 'PROVINSI' | 'KAB_KOTA';
  }): Promise<FinanceMatrixResponse> {
    const sp = new URLSearchParams({
      type: params.type,
      from: params.from,
      to: params.to,
      daerah: params.daerah || 'ALL',
      tingkat: params.tingkat || 'ALL',
    });
    return apiFetch<FinanceMatrixResponse>(`/finance/matrix?${sp.toString()}`);
  },

  async listPayments(params?: {
    legislatorId?: string;
    periodMonth?: string;
    daerah?: string;
    method?: 'MANUAL' | 'AUTODEBET';
    limit?: number;
  }): Promise<FinanceDuesPaymentRecord[]> {
    const sp = new URLSearchParams();
    if (params?.legislatorId) sp.set('legislatorId', params.legislatorId);
    if (params?.periodMonth) sp.set('periodMonth', params.periodMonth);
    if (params?.daerah) sp.set('daerah', params.daerah);
    if (params?.method) sp.set('method', params.method);
    if (params?.limit) sp.set('limit', String(params.limit));
    const qs = sp.toString();
    const res = await apiFetch<{ items: FinanceDuesPaymentRecord[] }>(
      `/finance/payments${qs ? `?${qs}` : ''}`
    );
    return res.items || [];
  },

  async recordManualPayment(payload: {
    legislatorId: string;
    periodMonths: string[];
    paymentDate: string;
    mode: 'BOTH' | 'DPW_ONLY' | 'DPP_ONLY' | 'CUSTOM';
    customAmountDpw?: number;
    customAmountDpp?: number;
    paymentMethod?: 'MANUAL' | 'AUTODEBET';
    proofUrl?: string;
    notes?: string;
  }): Promise<{
    ok: boolean;
    createdCount: number;
    totalDpw: number;
    totalDpp: number;
    grandTotal: number;
    transaction: FinanceTransaction;
  }> {
    return apiFetch('/finance/payments/manual', {
      method: 'POST',
      body: payload,
    });
  },

  async recordAutodebetBatch(payload: {
    daerah?: string;
    legislatorIds?: string[];
    periodMonth: string;
    paymentDate: string;
    includeDpw?: boolean;
    includeDpp?: boolean;
    proofUrl?: string;
    notes?: string;
  }): Promise<{
    ok: boolean;
    createdCount: number;
    skippedCount: number;
    skippedNames: string[];
    totalDpw: number;
    totalDpp: number;
    grandTotal: number;
    transaction: FinanceTransaction;
  }> {
    return apiFetch('/finance/payments/autodebet', {
      method: 'POST',
      body: payload,
    });
  },

  async cancelAutodebetBatch(payload: {
    periodMonth: string;
    daerah?: string;
    legislatorId?: string;
    onlyAutodebet?: boolean;
  }): Promise<{
    ok: boolean;
    deletedCount: number;
    skippedLockedCount: number;
    removedDpw: number;
    removedDpp: number;
    removedTotal: number;
  }> {
    return apiFetch('/finance/payments/autodebet/cancel', {
      method: 'POST',
      body: payload,
    });
  },

  async deletePayment(paymentId: string): Promise<void> {
    await apiFetch(`/finance/payments/${encodeURIComponent(paymentId)}`, { method: 'DELETE' });
  },

  async getPendingDppRemittances(): Promise<FinancePendingDppResponse> {
    return apiFetch<FinancePendingDppResponse>('/finance/dpp-remittances/pending');
  },

  async listDppRemittances(): Promise<FinanceDppRemittance[]> {
    const res = await apiFetch<{ items: FinanceDppRemittance[] }>('/finance/dpp-remittances');
    return res.items || [];
  },

  async createDppRemittance(payload: {
    paymentIds: string[];
    remittanceDate: string;
    bankFee?: number;
    periodLabel?: string;
    recipientAccount?: string;
    referenceNo?: string;
    proofUrl?: string;
    notes?: string;
  }): Promise<FinanceDppRemittance> {
    return apiFetch<FinanceDppRemittance>('/finance/dpp-remittances', {
      method: 'POST',
      body: payload,
    });
  },

  async deleteDppRemittance(remittanceId: string): Promise<{ ok: boolean; releasedCount: number }> {
    return apiFetch<{ ok: boolean; releasedCount: number }>(
      `/finance/dpp-remittances/${encodeURIComponent(remittanceId)}`,
      { method: 'DELETE' }
    );
  },

  async listTransactions(params?: {
    account?: 'ALL' | 'BANK_DPW' | 'PETTY_CASH';
    month?: string;
    year?: string;
    category?: string;
    direction?: 'ALL' | 'IN' | 'OUT';
    expenseOnly?: boolean;
    search?: string;
    sort?: 'asc' | 'desc';
    limit?: number;
  }): Promise<FinanceTransactionsResponse> {
    const sp = new URLSearchParams();
    if (params?.account) sp.set('account', params.account);
    if (params?.month) sp.set('month', params.month);
    if (params?.year) sp.set('year', params.year);
    if (params?.category) sp.set('category', params.category);
    if (params?.direction) sp.set('direction', params.direction);
    if (params?.expenseOnly) sp.set('expenseOnly', 'true');
    if (params?.search) sp.set('search', params.search);
    if (params?.sort) sp.set('sort', params.sort);
    if (params?.limit) sp.set('limit', String(params.limit));
    const qs = sp.toString();
    return apiFetch<FinanceTransactionsResponse>(`/finance/transactions${qs ? `?${qs}` : ''}`);
  },

  async createTransaction(payload: {
    accountType: 'BANK_DPW' | 'PETTY_CASH';
    direction: 'IN' | 'OUT';
    category: string;
    description: string;
    amount: number;
    txDate: string;
    proofUrl?: string;
  }): Promise<FinanceTransaction> {
    return apiFetch<FinanceTransaction>('/finance/transactions', {
      method: 'POST',
      body: payload,
    });
  },

  async transferBankToPetty(payload: {
    amount: number;
    txDate: string;
    description?: string;
    proofUrl?: string;
  }): Promise<{
    ok: boolean;
    outTransaction: FinanceTransaction;
    inTransaction: FinanceTransaction;
  }> {
    return apiFetch('/finance/transactions/transfer-to-petty', {
      method: 'POST',
      body: payload,
    });
  },

  async deleteTransaction(id: string): Promise<void> {
    await apiFetch(`/finance/transactions/${encodeURIComponent(id)}`, { method: 'DELETE' });
  },
};
