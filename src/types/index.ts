export type Plan = 'basic' | 'premium'

export interface User {
  id: string
  email: string
  name: string
  plan: Plan
  created_at: string
}

export interface Product {
  id: string
  user_id: string
  name: string
  cost: number
  unit: string
  category: string
  brand: string | null
  store: string | null
  created_at: string
}

export interface BasketItem {
  id: string
  basket_id: string
  product_id: string
  quantity: number
  product?: Product
}

export interface Basket {
  id: string
  user_id: string
  name: string
  category: BasketCategory
  sale_price: number
  created_at: string
  items?: BasketItem[]
}

export type BasketCategory = 'romantica' | 'premium' | 'fitness' | 'corporativa' | 'economica'

export interface Transaction {
  id: string
  user_id: string
  type: 'in' | 'out'
  amount: number
  description: string
  date: string
  created_at: string
}

export interface Customer {
  id: string
  user_id: string
  name: string
  phone: string
  email: string
  birth_date: string | null
  created_at: string
}

export interface Order {
  id: string
  user_id: string
  customer_id: string | null
  recipient_name: string
  basket_name: string | null
  purchase_date: string
  delivery_date: string
  delivery_time: string | null
  delivery_address: string
  card_message: string | null
  total_amount: number
  cost: number
  delivered: boolean
  delivered_at: string | null
  notes: string | null
  created_at: string
  customer?: { name: string; phone: string } | null
}

export interface CatalogItem {
  id: string
  user_id: string
  basket_id: string
  image_url: string | null
  description: string
  visible: boolean
  basket?: Basket
}
