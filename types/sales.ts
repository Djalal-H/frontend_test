export interface Customer {
  uuid: string;
  name: string;
  balance: string;
}

export interface Warehouse {
  uuid: string;
  name: string;
  location: string;
}

export interface Product {
  uuid: string;
  name: string;
  stock_quantity: number;
  price: string;
}

export interface SaleLine {
  product: string; // product uuid
  quantity: number;
  unit_price: number;
  discount_price?: number;
}

export interface CustomerPayment {
  amount: number;
  method: string;
  note?: string;
}

export interface CreateSaleRequest {
  customer: string; // customer uuid
  warehouse: string; // warehouse uuid
  date: string;
  sale_lines: SaleLine[];
  customer_payment?: CustomerPayment;
}
