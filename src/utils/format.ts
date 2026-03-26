export function formatDate(value: string): string {
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
  }).format(new Date(value))
}

export function joinList(values: string[]): string {
  return values.filter(Boolean).join(', ')
}
