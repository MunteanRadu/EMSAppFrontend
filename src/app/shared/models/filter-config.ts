export interface FilterOption {
  value: any;
  label: string;
}

export interface FilterConfig {
  name: string;
  label: string;
  type: 'text' | 'date' | 'select' | 'month';
  options?: FilterOption[];
}