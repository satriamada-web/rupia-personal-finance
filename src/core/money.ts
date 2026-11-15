export function formatRupiah(amount: number): string {
  if (!Number.isSafeInteger(amount)) {
    throw new Error('Amount must be a safe integer in Rupiah')
  }

  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount)
}

export function assertValidAmount(amount: number): void {
  if (!Number.isSafeInteger(amount) || amount < 0) {
    throw new Error('Amount must be a non-negative safe integer')
  }
}
