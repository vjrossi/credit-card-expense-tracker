export interface Expense {
    Date: string;
    Narrative: string;
    DebitAmount: number;
    CreditAmount: number;
    Category: string;
    IsRecurring: boolean;
}