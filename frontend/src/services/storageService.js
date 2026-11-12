/**
 * Local Transaction Store
 * Provides persistent browser-side storage for REAL ZevRA intents, orders,
 * verification results, and capture receipts initiated through the application.
 *
 * NOTE: Fabricated seed transactions have been removed.
 * Demo/simulated scenarios are strictly excluded from this persistent ledger.
 */

const STORAGE_KEY = 'zevra_transactions_ledger_v2';

export function getStoredTransactions() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      // Clean up any legacy storage that contained seed records
      localStorage.removeItem('zevra_transactions_v1');
      return [];
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    // Strict filter: exclude any demo/simulated or legacy seed items
    return parsed.filter(
      (tx) => !tx.isDemo && !tx.isSimulated && !tx.id?.startsWith('tx_seed_') && !tx.orderId?.startsWith('SIM_') && !tx.orderId?.startsWith('SIMULATED_')
    );
  } catch (err) {
    console.warn('Failed reading transactions from localStorage:', err);
    return [];
  }
}

export function saveTransaction(tx) {
  // Guard: Never save simulated or demo transactions to the real ledger
  if (tx.isDemo || tx.isSimulated || tx.id?.startsWith('tx_seed_') || tx.orderId?.startsWith('SIM_') || tx.orderId?.startsWith('SIMULATED_')) {
    return getStoredTransactions();
  }

  try {
    const current = getStoredTransactions();
    const existingIndex = current.findIndex(
      (item) => (tx.orderId && item.orderId === tx.orderId) || (tx.intentId && item.intentId === tx.intentId)
    );

    let updated;
    if (existingIndex >= 0) {
      updated = [...current];
      updated[existingIndex] = { ...updated[existingIndex], ...tx };
    } else {
      const newEntry = {
        id: tx.id || `tx_${Date.now()}`,
        createdAt: new Date().toISOString(),
        ...tx
      };
      updated = [newEntry, ...current];
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.error('Failed saving transaction:', err);
    return [];
  }
}

export function updateTransaction(orderIdOrIntentId, patch) {
  // Guard: Never update ledger with demo/simulated orders
  if (!orderIdOrIntentId || orderIdOrIntentId.startsWith('SIM_') || orderIdOrIntentId.startsWith('SIMULATED_')) {
    return getStoredTransactions();
  }

  try {
    const current = getStoredTransactions();
    const index = current.findIndex(
      (item) => item.orderId === orderIdOrIntentId || item.intentId === orderIdOrIntentId
    );
    if (index >= 0) {
      current[index] = { ...current[index], ...patch };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
    }
    return current;
  } catch (err) {
    console.error('Failed updating transaction:', err);
    return [];
  }
}

export function findTransaction(orderIdOrIntentId) {
  const current = getStoredTransactions();
  return current.find(
    (item) => item.orderId === orderIdOrIntentId || item.intentId === orderIdOrIntentId
  ) || null;
}

export function clearTransactionHistory() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
  localStorage.removeItem('zevra_transactions_v1');
  return [];
}
