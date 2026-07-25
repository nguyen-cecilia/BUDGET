export default function computeNextDate(frequency: string): string {
    const now = new Date();
    let next: Date;

    switch (frequency) {
        case 'daily':
            next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
            break;
        case 'weekly':
            next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7);
            break;
        case 'monthly': {
            const nextMonth = new Date(now.getFullYear(), now.getMonth() + 2, 0);
            const day = Math.min(now.getDate(), nextMonth.getDate());
            next = new Date(now.getFullYear(), now.getMonth() + 1, day);
            break;
        }
        case 'yearly':
            next = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
            break;
        default:
            next = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
    }

    const y = next.getFullYear();
    const m = String(next.getMonth() + 1).padStart(2, '0');
    const d = String(next.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}
