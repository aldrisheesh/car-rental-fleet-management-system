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
          current_odometer_km: number | null;
          condition_blocks_rental_use: boolean;
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
          current_odometer_km?: number | null;
          condition_blocks_rental_use?: boolean;
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
      maintenance_records: {
        Row: {
          id: string;
          vehicle_id: string;
          maintenance_type: string;
          description: string;
          status: "Open" | "Completed" | "Cancelled";
          blocks_rental_use: boolean;
          service_started_at: string;
          completed_at: string | null;
          odometer_at_service: number | null;
          next_service_odometer: number | null;
          next_service_date: string | null;
          cost_php: number | null;
          remarks: string | null;
          created_by: string;
          updated_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          vehicle_id: string;
          maintenance_type: string;
          description: string;
          status?: "Open" | "Completed" | "Cancelled";
          blocks_rental_use?: boolean;
          service_started_at?: string;
          completed_at?: string | null;
          odometer_at_service?: number | null;
          next_service_odometer?: number | null;
          next_service_date?: string | null;
          cost_php?: number | null;
          remarks?: string | null;
          created_by: string;
          updated_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["maintenance_records"]["Insert"]
        >;
        Relationships: [];
      };
      booking_requests: {
        Row: {
          id: string;
          customer_id: string;
          requested_vehicle_id: string;
          assigned_vehicle_id: string | null;
          pickup_branch_id: string;
          return_branch_id: string;
          pickup_at: string;
          return_at: string;
          destination: string | null;
          purpose_of_use: string;
          pickup_delivery_option: string;
          pickup_location: string | null;
          dropoff_location: string | null;
          preferred_seat_count: number | null;
          customer_contact_number: string | null;
          booking_status: string;
          assigned_by: string | null;
          assigned_at: string | null;
          assignment_note: string | null;
          substitution_acknowledged: boolean;
          cross_branch_acknowledged: boolean;
          confirmed_by: string | null;
          confirmed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          customer_id: string;
          requested_vehicle_id: string;
          assigned_vehicle_id?: string | null;
          pickup_branch_id: string;
          return_branch_id: string;
          pickup_at: string;
          return_at: string;
          destination?: string | null;
          purpose_of_use: string;
          pickup_delivery_option: string;
          pickup_location?: string | null;
          dropoff_location?: string | null;
          preferred_seat_count?: number | null;
          customer_contact_number?: string | null;
          booking_status?: string;
          assigned_by?: string | null;
          assigned_at?: string | null;
          assignment_note?: string | null;
          substitution_acknowledged?: boolean;
          cross_branch_acknowledged?: boolean;
          confirmed_by?: string | null;
          confirmed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["booking_requests"]["Insert"]
        >;
        Relationships: [];
      };
      renter_requirement_sets: {
        Row: {
          id: string;
          booking_id: string;
          customer_id: string;
          status: string;
          submitted_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          booking_id: string;
          customer_id: string;
          status?: string;
          submitted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["renter_requirement_sets"]["Insert"]
        >;
        Relationships: [];
      };
      renter_requirement_documents: {
        Row: {
          id: string;
          requirement_set_id: string;
          booking_id: string;
          customer_id: string;
          requirement_type: string;
          storage_path: string;
          original_filename: string;
          mime_type: string;
          size_bytes: number;
          version: number;
          is_current: boolean;
          uploaded_at: string;
          superseded_at: string | null;
        };
        Insert: {
          id?: string;
          requirement_set_id: string;
          booking_id: string;
          customer_id: string;
          requirement_type: string;
          storage_path: string;
          original_filename: string;
          mime_type: string;
          size_bytes: number;
          version: number;
          is_current?: boolean;
          uploaded_at?: string;
          superseded_at?: string | null;
        };
        Update: Partial<
          Database["public"]["Tables"]["renter_requirement_documents"]["Insert"]
        >;
        Relationships: [];
      };
      renter_requirement_reviews: {
        Row: {
          id: string;
          requirement_set_id: string;
          reviewer_id: string;
          government_id_document_id: string;
          government_id_version: number;
          government_id_outcome: string;
          government_id_reason: string | null;
          drivers_license_document_id: string;
          drivers_license_version: number;
          drivers_license_outcome: string;
          drivers_license_reason: string | null;
          identity_consistency: string;
          lto_outcome: string;
          lto_checked_at: string | null;
          resulting_status: string;
          reviewed_at: string;
        };
        Insert: Record<string, any>;
        Update: Record<string, any>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      replace_renter_requirement_document: {
        Args: {
          p_requirement_set_id: string;
          p_booking_id: string;
          p_customer_id: string;
          p_requirement_type: string;
          p_storage_path: string;
          p_original_filename: string;
          p_mime_type: string;
          p_size_bytes: number;
          p_version: number;
        };
        Returns: string;
      };
      record_renter_requirement_review: {
        Args: Record<string, any>;
        Returns: string;
      };
      resubmit_renter_requirements: {
        Args: { p_requirement_set_id: string; p_customer_id: string };
        Returns: boolean;
      };
      assign_booking_vehicle: {
        Args: Record<string, any>;
        Returns: Database["public"]["Tables"]["booking_requests"]["Row"];
      };
      confirm_booking_atomic: {
        Args: Record<string, any>;
        Returns: Database["public"]["Tables"]["booking_requests"]["Row"];
      };
      advance_vehicle_odometer: {
        Args: { p_vehicle_id: string; p_odometer: number };
        Returns: number;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
