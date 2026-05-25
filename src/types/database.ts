export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string
          plan: 'basic' | 'premium'
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          whatsapp: string | null
          created_at: string
        }
        Insert: {
          id: string
          email: string
          name: string
          plan?: 'basic' | 'premium'
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          whatsapp?: string | null
          created_at?: string
        }
        Update: {
          name?: string
          plan?: 'basic' | 'premium'
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          whatsapp?: string | null
        }
        Relationships: []
      }
      products: {
        Row: {
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
        Insert: {
          id?: string
          user_id: string
          name: string
          cost: number
          unit?: string
          category?: string
          brand?: string | null
          store?: string | null
          created_at?: string
        }
        Update: {
          name?: string
          cost?: number
          unit?: string
          category?: string
          brand?: string | null
          store?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'products_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          }
        ]
      }
      baskets: {
        Row: {
          id: string
          user_id: string
          name: string
          category: 'romantica' | 'premium' | 'fitness' | 'corporativa' | 'economica'
          sale_price: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          category: 'romantica' | 'premium' | 'fitness' | 'corporativa' | 'economica'
          sale_price?: number
          created_at?: string
        }
        Update: {
          name?: string
          category?: 'romantica' | 'premium' | 'fitness' | 'corporativa' | 'economica'
          sale_price?: number
        }
        Relationships: [
          {
            foreignKeyName: 'baskets_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          }
        ]
      }
      basket_items: {
        Row: {
          id: string
          basket_id: string
          product_id: string
          quantity: number
        }
        Insert: {
          id?: string
          basket_id: string
          product_id: string
          quantity?: number
        }
        Update: {
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: 'basket_items_basket_id_fkey'
            columns: ['basket_id']
            isOneToOne: false
            referencedRelation: 'baskets'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'basket_items_product_id_fkey'
            columns: ['product_id']
            isOneToOne: false
            referencedRelation: 'products'
            referencedColumns: ['id']
          }
        ]
      }
      transactions: {
        Row: {
          id: string
          user_id: string
          type: 'in' | 'out'
          amount: number
          description: string
          date: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: 'in' | 'out'
          amount: number
          description: string
          date: string
          created_at?: string
        }
        Update: {
          type?: 'in' | 'out'
          amount?: number
          description?: string
          date?: string
        }
        Relationships: [
          {
            foreignKeyName: 'transactions_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          }
        ]
      }
      customers: {
        Row: {
          id: string
          user_id: string
          name: string
          phone: string
          email: string
          birth_date: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          phone: string
          email?: string
          birth_date?: string | null
          created_at?: string
        }
        Update: {
          name?: string
          phone?: string
          email?: string
          birth_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'customers_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          }
        ]
      }
      orders: {
        Row: {
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
        }
        Insert: {
          id?: string
          user_id: string
          customer_id?: string | null
          recipient_name: string
          basket_name?: string | null
          purchase_date?: string
          delivery_date: string
          delivery_time?: string | null
          delivery_address: string
          card_message?: string | null
          total_amount?: number
          cost?: number
          delivered?: boolean
          delivered_at?: string | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          customer_id?: string | null
          recipient_name?: string
          basket_name?: string | null
          purchase_date?: string
          delivery_date?: string
          delivery_time?: string | null
          delivery_address?: string
          card_message?: string | null
          total_amount?: number
          cost?: number
          delivered?: boolean
          delivered_at?: string | null
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'orders_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'orders_customer_id_fkey'
            columns: ['customer_id']
            isOneToOne: false
            referencedRelation: 'customers'
            referencedColumns: ['id']
          }
        ]
      }
      catalog_items: {
        Row: {
          id: string
          user_id: string
          basket_id: string
          image_url: string | null
          description: string
          visible: boolean
          images: string[]
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          basket_id: string
          image_url?: string | null
          description?: string
          visible?: boolean
          images?: string[]
          created_at?: string
        }
        Update: {
          image_url?: string | null
          description?: string
          visible?: boolean
          images?: string[]
        }
        Relationships: [
          {
            foreignKeyName: 'catalog_items_basket_id_fkey'
            columns: ['basket_id']
            isOneToOne: false
            referencedRelation: 'baskets'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'catalog_items_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          }
        ]
      }
      ai_usage: {
        Row: {
          id: string
          user_id: string
          year_month: string
          basket_count: number
          script_count: number
        }
        Insert: {
          id?: string
          user_id: string
          year_month: string
          basket_count?: number
          script_count?: number
        }
        Update: {
          basket_count?: number
          script_count?: number
        }
        Relationships: [
          {
            foreignKeyName: 'ai_usage_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          }
        ]
      }
      training_lessons: {
        Row: {
          id: string
          position: number
          title: string
          description: string | null
          youtube_url: string | null
          is_free: boolean
          created_at: string
        }
        Insert: {
          id?: string
          position?: number
          title: string
          description?: string | null
          youtube_url?: string | null
          is_free?: boolean
          created_at?: string
        }
        Update: {
          position?: number
          title?: string
          description?: string | null
          youtube_url?: string | null
          is_free?: boolean
        }
        Relationships: []
      }
      training_materials: {
        Row: {
          id: string
          lesson_id: string
          type: 'image' | 'pdf'
          storage_path: string
          name: string
          position: number
          created_at: string
        }
        Insert: {
          id?: string
          lesson_id: string
          type: 'image' | 'pdf'
          storage_path: string
          name: string
          position?: number
          created_at?: string
        }
        Update: {
          position?: number
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: 'training_materials_lesson_id_fkey'
            columns: ['lesson_id']
            isOneToOne: false
            referencedRelation: 'training_lessons'
            referencedColumns: ['id']
          }
        ]
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
  }
}
