export type CategoryType = 'need' | 'want' | null;

export interface Category {
    id: string;
    label: string;
    color: string;
    type: CategoryType;
    user_id: string;
    created_at: string;
}
