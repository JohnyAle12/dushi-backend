export interface Store {
  id: string;
  name: string;
  address: string;
}

export const STORES: Store[] = [
  {
    id: 'store-001',
    name: 'Dushi Main',
    address: 'Calle Principal #123',
  },
  {
    id: 'store-002',
    name: 'Dushi Norte',
    address: 'Av. Norte #456',
  },
  {
    id: 'store-003',
    name: 'Dushi Sur',
    address: 'Av. Sur #789',
  },
];
