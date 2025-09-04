export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      company_settings: {
        Row: {
          auth_logo_url: string | null
          company_address: string | null
          company_city: string | null
          company_email: string | null
          company_gstin: string | null
          company_name: string
          company_phone: string | null
          company_pincode: string | null
          company_state: string | null
          created_at: string | null
          favicon_url: string | null
          header_logo_url: string | null
          id: string
          logo_size_auth: number | null
          logo_size_favicon: number | null
          logo_size_header: number | null
          logo_size_sidebar: number | null
          sidebar_logo_url: string | null
          updated_at: string | null
          bank_name: string | null
          account_number: string | null
          ifsc_code: string | null
          branch: string | null
          company_logo_url: string | null
        }
        Insert: {
          auth_logo_url?: string | null
          company_address?: string | null
          company_city?: string | null
          company_email?: string | null
          company_gstin?: string | null
          company_name?: string
          company_phone?: string | null
          company_pincode?: string | null
          company_state?: string | null
          created_at?: string | null
          favicon_url?: string | null
          header_logo_url?: string | null
          id?: string
          logo_size_auth?: number | null
          logo_size_favicon?: number | null
          logo_size_header?: number | null
          logo_size_sidebar?: number | null
          sidebar_logo_url?: string | null
          updated_at?: string | null
          bank_name?: string | null
          account_number?: string | null
          ifsc_code?: string | null
          branch?: string | null
          company_logo_url?: string | null
        }
        Update: {
          auth_logo_url?: string | null
          company_address?: string | null
          company_city?: string | null
          company_email?: string | null
          company_gstin?: string | null
          company_name?: string
          company_phone?: string | null
          company_pincode?: string | null
          company_state?: string | null
          created_at?: string | null
          favicon_url?: string | null
          header_logo_url?: string | null
          id?: string
          logo_size_auth?: number | null
          logo_size_favicon?: number | null
          logo_size_header?: number | null
          logo_size_sidebar?: number | null
          sidebar_logo_url?: string | null
          updated_at?: string | null
          bank_name?: string | null
          account_number?: string | null
          ifsc_code?: string | null
          branch?: string | null
          company_logo_url?: string | null
        }
        Relationships: []
      }
      product_categories: {
        Row: {
          id: string
          name: string
          description: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      product_subcategories: {
        Row: {
          id: string
          name: string
          image_url: string | null
          category_id: string
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          image_url?: string | null
          category_id: string
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          image_url?: string | null
          category_id?: string
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_subcategories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "product_categories"
            referencedColumns: ["id"]
          }
        ]
      }
      fabrics: {
        Row: {
          id: string
          fabric_code: string
          fabric_name: string
          fabric_type: string | null
          image_url: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          fabric_code: string
          fabric_name: string
          fabric_type?: string | null
          image_url?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          fabric_code?: string
          fabric_name?: string
          fabric_type?: string | null
          image_url?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      fabric_variants: {
        Row: {
          id: string
          fabric_id: string
          variant_code: string
          color: string
          gsm: number
          uom: string | null
          price: number | null
          supplier: string | null
          description: string | null
          hex_code: string | null
          image_url: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          fabric_id: string
          variant_code: string
          color: string
          gsm: number
          uom?: string | null
          price?: number | null
          supplier?: string | null
          description?: string | null
          hex_code?: string | null
          image_url?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          fabric_id?: string
          variant_code?: string
          color?: string
          gsm?: number
          uom?: string | null
          price?: number | null
          supplier?: string | null
          description?: string | null
          hex_code?: string | null
          image_url?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fabric_variants_fabric_id_fkey"
            columns: ["fabric_id"]
            isOneToOne: false
            referencedRelation: "fabrics"
            referencedColumns: ["id"]
          }
        ]
      }
      customers: {
        Row: {
          address: string | null
          city: string | null
          company_name: string | null
          contact_person: string | null
          country: string | null
          created_at: string | null
          credit_days: number | null
          credit_limit: number | null
          customer_code: string | null
          customer_type: string | null
          email: string | null
          gst_number: string | null
          id: string
          is_active: boolean | null
          phone: string | null
          pincode: string | null
          state: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          company_name?: string | null
          contact_person?: string | null
          country?: string | null
          created_at?: string | null
          credit_days?: number | null
          credit_limit?: number | null
          customer_code?: string | null
          customer_type?: string | null
          email?: string | null
          gst_number?: string | null
          id?: string
          is_active?: boolean | null
          phone?: string | null
          pincode?: string | null
          state?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          company_name?: string | null
          contact_person?: string | null
          country?: string | null
          created_at?: string | null
          credit_days?: number | null
          credit_limit?: number | null
          customer_code?: string | null
          customer_type?: string | null
          email?: string | null
          gst_number?: string | null
          id?: string
          is_active?: boolean | null
          phone?: string | null
          pincode?: string | null
          state?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      departments: {
        Row: {
          created_at: string | null
          description: string | null
          head_user_id: string | null
          id: string
          is_active: boolean | null
          name: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          head_user_id?: string | null
          id?: string
          is_active?: boolean | null
          name: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          head_user_id?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "departments_head_user_id_fkey"
            columns: ["head_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      designations: {
        Row: {
          created_at: string | null
          department_id: string | null
          id: string
          is_active: boolean | null
          level: number | null
          title: string
        }
        Insert: {
          created_at?: string | null
          department_id?: string | null
          id?: string
          is_active?: boolean | null
          level?: number | null
          title: string
        }
        Update: {
          created_at?: string | null
          department_id?: string | null
          id?: string
          is_active?: boolean | null
          level?: number | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "designations_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      fabrics: {
        Row: {
          care_instructions: string | null
          composition: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          type: string | null
        }
        Insert: {
          care_instructions?: string | null
          composition?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          type?: string | null
        }
        Update: {
          care_instructions?: string | null
          composition?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          type?: string | null
        }
        Relationships: []
      }
      franchise_partners: {
        Row: {
          address: string | null
          agreement_date: string | null
          business_name: string
          city: string | null
          commission_rate: number | null
          created_at: string | null
          email: string
          franchise_code: string | null
          id: string
          investment_amount: number | null
          owner_name: string
          phone: string
          state: string | null
          status: string | null
          territory: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          address?: string | null
          agreement_date?: string | null
          business_name: string
          city?: string | null
          commission_rate?: number | null
          created_at?: string | null
          email: string
          franchise_code?: string | null
          id?: string
          investment_amount?: number | null
          owner_name: string
          phone: string
          state?: string | null
          status?: string | null
          territory?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          address?: string | null
          agreement_date?: string | null
          business_name?: string
          city?: string | null
          commission_rate?: number | null
          created_at?: string | null
          email?: string
          franchise_code?: string | null
          id?: string
          investment_amount?: number | null
          owner_name?: string
          phone?: string
          state?: string | null
          status?: string | null
          territory?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "franchise_partners_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          assigned_to: string | null
          company_name: string | null
          created_at: string | null
          created_by: string | null
          customer_name: string
          email: string | null
          estimated_value: number | null
          expected_close_date: string | null
          id: string
          lead_number: string | null
          notes: string | null
          phone: string
          priority: string | null
          source: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          company_name?: string | null
          created_at?: string | null
          created_by?: string | null
          customer_name: string
          email?: string | null
          estimated_value?: number | null
          expected_close_date?: string | null
          id?: string
          lead_number?: string | null
          notes?: string | null
          phone: string
          priority?: string | null
          source?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          company_name?: string | null
          created_at?: string | null
          created_by?: string | null
          customer_name?: string
          email?: string | null
          estimated_value?: number | null
          expected_close_date?: string | null
          id?: string
          lead_number?: string | null
          notes?: string | null
          phone?: string
          priority?: string | null
          source?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          billing_address: string | null
          created_at: string | null
          created_by: string | null
          customer_id: string | null
          delivery_date: string | null
          discount_amount: number | null
          id: string
          notes: string | null
          order_date: string | null
          order_number: string | null
          payment_status: string | null
          priority: string | null
          quote_id: string | null
          shipping_address: string | null
          shipping_amount: number | null
          status: string | null
          subtotal: number | null
          tax_amount: number | null
          total_amount: number | null
          updated_at: string | null
        }
        Insert: {
          billing_address?: string | null
          created_at?: string | null
          created_by?: string | null
          customer_id?: string | null
          delivery_date?: string | null
          discount_amount?: number | null
          id?: string
          notes?: string | null
          order_date?: string | null
          order_number?: string | null
          payment_status?: string | null
          priority?: string | null
          quote_id?: string | null
          shipping_address?: string | null
          shipping_amount?: number | null
          status?: string | null
          subtotal?: number | null
          tax_amount?: number | null
          total_amount?: number | null
          updated_at?: string | null
        }
        Update: {
          billing_address?: string | null
          created_at?: string | null
          created_by?: string | null
          customer_id?: string | null
          delivery_date?: string | null
          discount_amount?: number | null
          id?: string
          notes?: string | null
          order_date?: string | null
          order_number?: string | null
          payment_status?: string | null
          priority?: string | null
          quote_id?: string | null
          shipping_address?: string | null
          shipping_amount?: number | null
          status?: string | null
          subtotal?: number | null
          tax_amount?: number | null
          total_amount?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      product_categories: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          parent_category_id: string | null
          sort_order: number | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          parent_category_id?: string | null
          sort_order?: number | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          parent_category_id?: string | null
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "product_categories_parent_category_id_fkey"
            columns: ["parent_category_id"]
            isOneToOne: false
            referencedRelation: "product_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          base_price: number
          category_id: string | null
          color_options: string[] | null
          cost_price: number | null
          created_at: string | null
          created_by: string | null
          description: string | null
          dimensions: string | null
          fabric_id: string | null
          id: string
          image_urls: string[] | null
          is_active: boolean | null
          name: string
          product_code: string
          updated_at: string | null
          weight: number | null
        }
        Insert: {
          base_price?: number
          category_id?: string | null
          color_options?: string[] | null
          cost_price?: number | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          dimensions?: string | null
          fabric_id?: string | null
          id?: string
          image_urls?: string[] | null
          is_active?: boolean | null
          name: string
          product_code: string
          updated_at?: string | null
          weight?: number | null
        }
        Update: {
          base_price?: number
          category_id?: string | null
          color_options?: string[] | null
          cost_price?: number | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          dimensions?: string | null
          fabric_id?: string | null
          id?: string
          image_urls?: string[] | null
          is_active?: boolean | null
          name?: string
          product_code?: string
          updated_at?: string | null
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "product_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_fabric_id_fkey"
            columns: ["fabric_id"]
            isOneToOne: false
            referencedRelation: "fabrics"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          department: string | null
          designation: string | null
          email: string
          full_name: string | null
          id: string
          is_active: boolean | null
          phone: string | null
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          department?: string | null
          designation?: string | null
          email: string
          full_name?: string | null
          id: string
          is_active?: boolean | null
          phone?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          department?: string | null
          designation?: string | null
          email?: string
          full_name?: string | null
          id?: string
          is_active?: boolean | null
          phone?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string | null
        }
        Relationships: []
      }
      quotes: {
        Row: {
          approved_by: string | null
          created_at: string | null
          created_by: string | null
          customer_id: string | null
          discount_amount: number | null
          id: string
          lead_id: string | null
          notes: string | null
          quote_date: string | null
          quote_number: string | null
          status: string | null
          subtotal: number | null
          tax_amount: number | null
          terms_conditions: string | null
          total_amount: number | null
          updated_at: string | null
          valid_until: string | null
        }
        Insert: {
          approved_by?: string | null
          created_at?: string | null
          created_by?: string | null
          customer_id?: string | null
          discount_amount?: number | null
          id?: string
          lead_id?: string | null
          notes?: string | null
          quote_date?: string | null
          quote_number?: string | null
          status?: string | null
          subtotal?: number | null
          tax_amount?: number | null
          terms_conditions?: string | null
          total_amount?: number | null
          updated_at?: string | null
          valid_until?: string | null
        }
        Update: {
          approved_by?: string | null
          created_at?: string | null
          created_by?: string | null
          customer_id?: string | null
          discount_amount?: number | null
          id?: string
          lead_id?: string | null
          notes?: string | null
          quote_date?: string | null
          quote_number?: string | null
          status?: string | null
          subtotal?: number | null
          tax_amount?: number | null
          terms_conditions?: string | null
          total_amount?: number | null
          updated_at?: string | null
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quotes_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      sizes: {
        Row: {
          code: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          sort_order: number | null
        }
        Insert: {
          code?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          sort_order?: number | null
        }
        Update: {
          code?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          sort_order?: number | null
        }
        Relationships: []
      }
      warehouses: {
        Row: {
          address: string | null
          city: string | null
          code: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          manager_id: string | null
          name: string
          state: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          code?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          manager_id?: string | null
          name: string
          state?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          code?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          manager_id?: string | null
          name?: string
          state?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "warehouses_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      pet_breeds: {
        Row: {
          id: string
          breed_name: string
          description: string | null
          image_url: string | null
          pet_type: 'dog' | 'cat'
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          breed_name: string
          description?: string | null
          image_url?: string | null
          pet_type: 'dog' | 'cat'
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          breed_name?: string
          description?: string | null
          image_url?: string | null
          pet_type?: 'dog' | 'cat'
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      size_types: {
        Row: {
          id: string
          size_type_name: string
          pet_type: 'dog' | 'cat'
          description: string | null
          ideal_for_breed_ids: string[] | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          size_type_name: string
          pet_type: 'dog' | 'cat'
          description?: string | null
          ideal_for_breed_ids?: string[] | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          size_type_name?: string
          pet_type?: 'dog' | 'cat'
          description?: string | null
          ideal_for_breed_ids?: string[] | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      size_charts: {
        Row: {
          id: string
          size_type_id: string
          size: string
          neck: number | null
          chest: number | null
          length: number | null
          front_leg_length: number | null
          back_leg_length: number | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          size_type_id: string
          size: string
          neck?: number | null
          chest?: number | null
          length?: number | null
          front_leg_length?: number | null
          back_leg_length?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          size_type_id?: string
          size?: string
          neck?: number | null
          chest?: number | null
          length?: number | null
          front_leg_length?: number | null
          back_leg_length?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "size_charts_size_type_id_fkey"
            columns: ["size_type_id"]
            isOneToOne: false
            referencedRelation: "size_types"
            referencedColumns: ["id"]
          },
        ]
      }
      franchise_requests: {
        Row: {
          id: string
          google_form_id: string | null
          google_sheet_row_id: string | null
          business_name: string | null
          owner_name: string
          email: string
          phone: string
          address: string | null
          city: string | null
          state: string | null
          pincode: string | null
          investment_amount: number | null
          investment_amount_text: string | null
          preferred_territory: string | null
          business_experience: string | null
          current_business: string | null
          why_franchise: string | null
          expected_timeline: string | null
          additional_notes: string | null
          status: 'new' | 'reviewing' | 'approved' | 'rejected' | 'contacted'
          assigned_to: string | null
          priority: 'low' | 'medium' | 'high' | 'urgent'
          source: string
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          google_form_id?: string | null
          google_sheet_row_id?: string | null
          business_name?: string | null
          owner_name: string
          email: string
          phone: string
          address?: string | null
          city?: string | null
          state?: string | null
          pincode?: string | null
          investment_amount?: number | null
          investment_amount_text?: string | null
          preferred_territory?: string | null
          business_experience?: string | null
          current_business?: string | null
          why_franchise?: string | null
          expected_timeline?: string | null
          additional_notes?: string | null
          status?: 'new' | 'reviewing' | 'approved' | 'rejected' | 'contacted'
          assigned_to?: string | null
          priority?: 'low' | 'medium' | 'high' | 'urgent'
          source?: string
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          google_form_id?: string | null
          google_sheet_row_id?: string | null
          business_name?: string | null
          owner_name?: string
          email?: string
          phone?: string
          address?: string | null
          city?: string | null
          state?: string | null
          pincode?: string | null
          investment_amount?: number | null
          investment_amount_text?: string | null
          preferred_territory?: string | null
          business_experience?: string | null
          current_business?: string | null
          why_franchise?: string | null
          expected_timeline?: string | null
          additional_notes?: string | null
          status?: 'new' | 'reviewing' | 'approved' | 'rejected' | 'contacted'
          assigned_to?: string | null
          priority?: 'low' | 'medium' | 'high' | 'urgent'
          source?: string
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "franchise_requests_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_user_role: {
        Args: { required_role: Database["public"]["Enums"]["app_role"] }
        Returns: boolean
      }
    }
    Enums: {
      app_role:
        | "admin"
        | "sales"
        | "merchandiser"
        | "marketing"
        | "creatives"
        | "franchise"
        | "customer"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: [
        "admin",
        "sales",
        "merchandiser",
        "marketing",
        "creatives",
        "franchise",
        "customer",
      ],
    },
  },
} as const

// Custom types for Size Master
export interface PetBreed {
  id: string;
  breed_name: string;
  description: string | null;
  image_url: string | null;
  pet_type: 'dog' | 'cat';
  created_at: string | null;
  updated_at: string | null;
}

export interface SizeType {
  id: string;
  size_type_name: string;
  pet_type: 'dog' | 'cat';
  description: string | null;
  ideal_for_breed_ids: string[] | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface SizeChart {
  id: string;
  size_type_id: string;
  size: string;
  neck: number | null;
  chest: number | null;
  length: number | null;
  front_leg_length: number | null;
  back_leg_length: number | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface SizeTypeWithCharts extends SizeType {
  size_charts: SizeChart[];
}

// Custom types for Franchise Requests
export interface FranchiseRequest {
  id: string;
  google_form_id: string | null;
  google_sheet_row_id: string | null;
  business_name: string | null;
  owner_name: string;
  email: string;
  phone: string;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  investment_amount: number | null;
  investment_amount_text: string | null;
  preferred_territory: string | null;
  business_experience: string | null;
  current_business: string | null;
  why_franchise: string | null;
  expected_timeline: string | null;
  additional_notes: string | null;
  status: 'new' | 'reviewing' | 'approved' | 'rejected' | 'contacted';
  assigned_to: string | null;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  source: string;
  created_at: string | null;
  updated_at: string | null;
}
