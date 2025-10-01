export type AccountType = 'wallet' | 'checking' | 'credit_card';
export type AccountIcon = 'wallet' | 'landmark' | 'credit_card';

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  balance: number;
  color: string;
  icon: AccountIcon;
  limit?: number;
}