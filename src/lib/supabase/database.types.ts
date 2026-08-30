/**
 * Keep this file in sync with the database by running:
 *
 *   npx supabase gen types typescript --project-id <project-ref> > src/lib/supabase/database.types.ts
 *
 * The checked-in shape covers the canonical tables established through VS005.
 */
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string | null;
          full_name: string;
          phone_number: string | null;
          street_address: string | null;
          barangay: string | null;
          city_municipality: string | null;
          province: string | null;
          postal_code: string | null;
          user_type: string;
          account_status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          full_name?: string;
          phone_number?: string | null;
          street_address?: string | null;
          barangay?: string | null;
          city_municipality?: string | null;
          province?: string | null;
          postal_code?: string | null;
          user_type?: string;
          account_status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: [];
      };
      branches: {
        Row: {
          id: string;
          name: string;
          address: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          address?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["branches"]["Insert"]>;
        Relationships: [];
      };
      vehicle_categories: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["vehicle_categories"]["Insert"]
        >;
        Relationships: [];
      };
      vehicles: {
        Row: {
          id: string;
          name: string;
          category_id: string;
          branch_id: string;
          license_plate: string | null;
          transmission: string | null;
          fuel_type: string | null;
          seat_capacity: number | null;
          daily_rate: number | null;
          reference_fuel_efficiency_km_per_liter: number | null;
          image_url: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          category_id: string;
          branch_id: string;
          license_plate?: string | null;
          transmission?: string | null;
          fuel_type?: string | null;
          seat_capacity?: number | null;
          daily_rate?: number | null;
          reference_fuel_efficiency_km_per_liter?: number | null;
          image_url?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["vehicles"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "vehicles_category_id_fkey";
            columns: ["category_id"];
            referencedRelation: "vehicle_categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "vehicles_branch_id_fkey";
            columns: ["branch_id"];
            referencedRelation: "branches";
            referencedColumns: ["id"];
          },
        ];
      };
      booking_requests: {
        Row: {
          id: string; customer_id: string; requested_vehicle_id: string; assigned_vehicle_id: string | null;
          pickup_branch_id: string; return_branch_id: string; pickup_at: string; return_at: string;
          destination: string | null; purpose_of_use: string; pickup_delivery_option: string;
          pickup_location: string | null; dropoff_location: string | null; preferred_seat_count: number | null;
          customer_contact_number: string | null; booking_status: string; created_at: string; updated_at: string;
        };
        Insert: {
          id?: string; customer_id: string; requested_vehicle_id: string; assigned_vehicle_id?: string | null;
          pickup_branch_id: string; return_branch_id: string; pickup_at: string; return_at: string;
          destination?: string | null; purpose_of_use: string; pickup_delivery_option: string;
          pickup_location?: string | null; dropoff_location?: string | null; preferred_seat_count?: number | null;
          customer_contact_number?: string | null; booking_status?: string; created_at?: string; updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["booking_requests"]["Insert"]>;
        Relationships: [];
      };
      renter_requirement_sets: {
        Row: { id: string; booking_id: string; customer_id: string; status: string; submitted_at: string | null; created_at: string; updated_at: string };
        Insert: { id?: string; booking_id: string; customer_id: string; status?: string; submitted_at?: string | null; created_at?: string; updated_at?: string };
        Update: Partial<Database["public"]["Tables"]["renter_requirement_sets"]["Insert"]>;
        Relationships: [];
      };
      renter_requirement_documents: {
        Row: { id: string; requirement_set_id: string; booking_id: string; customer_id: string; requirement_type: string; storage_path: string; original_filename: string; mime_type: string; size_bytes: number; version: number; is_current: boolean; uploaded_at: string; superseded_at: string | null };
        Insert: { id?: string; requirement_set_id: string; booking_id: string; customer_id: string; requirement_type: string; storage_path: string; original_filename: string; mime_type: string; size_bytes: number; version: number; is_current?: boolean; uploaded_at?: string; superseded_at?: string | null };
        Update: Partial<Database["public"]["Tables"]["renter_requirement_documents"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
