/**
 * Keep this file in sync with the database by running:
 *
 *   npx supabase gen types typescript --project-id <project-ref> > src/lib/supabase/database.types.ts
 *
 * The checked-in shape covers the canonical tables established through VS030.
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
      audit_events: {
        Row: {
          id: string;
          actor_type: "User" | "System";
          actor_user_id: string | null;
          action: string;
          entity_type:
            | "booking"
            | "requirements"
            | "payment"
            | "rental"
            | "maintenance";
          entity_id: string;
          booking_id: string | null;
          metadata: Record<string, unknown>;
          occurred_at: string;
        };
        Insert: {
          id?: string;
          actor_type: "User" | "System";
          actor_user_id?: string | null;
          action: string;
          entity_type:
            | "booking"
            | "requirements"
            | "payment"
            | "rental"
            | "maintenance";
          entity_id: string;
          booking_id?: string | null;
          metadata?: Record<string, unknown>;
          occurred_at?: string;
        };
        Update: never;
        Relationships: [
          {
            foreignKeyName: "audit_events_actor_user_id_fkey";
            columns: ["actor_user_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "audit_events_booking_id_fkey";
            columns: ["booking_id"];
            referencedRelation: "booking_requests";
            referencedColumns: ["id"];
          },
        ];
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
      backup_runs: {
        Row: {
          id: string;
          trigger: "Scheduled" | "Manual";
          status: "Running" | "Completed" | "Partial" | "Failed";
          started_at: string;
          completed_at: string | null;
          retention_until: string;
          error_code: string | null;
          remarks: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          trigger: "Scheduled" | "Manual";
          status?: "Running" | "Completed" | "Partial" | "Failed";
          started_at?: string;
          completed_at?: string | null;
          retention_until: string;
          error_code?: string | null;
          remarks?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["backup_runs"]["Insert"]>;
        Relationships: [];
      };
      backup_artifacts: {
        Row: {
          id: string;
          backup_run_id: string;
          artifact_type: "Database" | "Storage";
          artifact_key: string;
          status: "Completed" | "Failed";
          size_bytes: number | null;
          sha256: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          backup_run_id: string;
          artifact_type: "Database" | "Storage";
          artifact_key: string;
          status: "Completed" | "Failed";
          size_bytes?: number | null;
          sha256?: string | null;
          created_at?: string;
        };
        Update: never;
        Relationships: [];
      };
      recovery_drills: {
        Row: {
          id: string;
          backup_run_id: string;
          target_environment: "NonProduction";
          status: "Running" | "Passed" | "Failed";
          started_at: string;
          completed_at: string | null;
          database_validation: "Pending" | "Passed" | "Failed" | null;
          storage_validation: "Pending" | "Passed" | "Failed" | null;
          error_code: string | null;
          remarks: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          backup_run_id: string;
          target_environment?: "NonProduction";
          status?: "Running" | "Passed" | "Failed";
          started_at?: string;
          completed_at?: string | null;
          database_validation?: "Pending" | "Passed" | "Failed" | null;
          storage_validation?: "Pending" | "Passed" | "Failed" | null;
          error_code?: string | null;
          remarks?: string | null;
          created_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["recovery_drills"]["Insert"]
        >;
        Relationships: [];
      };
      notifications: {
        Row: {
          id: string;
          recipient_id: string;
          notification_type: string;
          title: string;
          message: string;
          related_entity_type: string;
          related_entity_id: string;
          event_key: string;
          created_at: string;
          read_at: string | null;
        };
        Insert: {
          id?: string;
          recipient_id: string;
          notification_type: string;
          title: string;
          message: string;
          related_entity_type: string;
          related_entity_id: string;
          event_key: string;
          created_at?: string;
          read_at?: string | null;
        };
        Update: { read_at?: string | null };
        Relationships: [];
      };
      notification_preferences: {
        Row: {
          recipient_id: string;
          maintenance_attention_enabled: boolean;
          low_availability_enabled: boolean;
          email_notifications_enabled: boolean;
          updated_at: string;
        };
        Insert: {
          recipient_id: string;
          maintenance_attention_enabled?: boolean;
          low_availability_enabled?: boolean;
          email_notifications_enabled?: boolean;
          updated_at?: string;
        };
        Update: {
          maintenance_attention_enabled?: boolean;
          low_availability_enabled?: boolean;
          email_notifications_enabled?: boolean;
        };
        Relationships: [];
      };
      email_deliveries: {
        Row: {
          id: string;
          recipient_user_id: string;
          notification_id: string;
          delivery_key: string;
          email_type: string;
          status: string;
          attempt_count: number;
          provider_message_id: string | null;
          last_error_code: string | null;
          next_attempt_at: string | null;
          created_at: string;
          last_attempt_at: string | null;
          sent_at: string | null;
        };
        Insert: {
          id?: string;
          recipient_user_id: string;
          notification_id: string;
          delivery_key: string;
          email_type: string;
          status?: string;
          attempt_count?: number;
          provider_message_id?: string | null;
          last_error_code?: string | null;
          next_attempt_at?: string | null;
          created_at?: string;
          last_attempt_at?: string | null;
          sent_at?: string | null;
        };
        Update: Partial<
          Database["public"]["Tables"]["email_deliveries"]["Insert"]
        >;
        Relationships: [];
      };
      operational_notification_conditions: {
        Row: {
          condition_type: string;
          related_entity_type: string;
          related_entity_id: string;
          is_active: boolean;
          occurrence_count: number;
          title: string;
          message: string;
          activated_at: string | null;
          resolved_at: string | null;
          last_evaluated_at: string;
        };
        Insert: Record<string, never>;
        Update: Record<string, never>;
        Relationships: [];
      };
      rental_transactions: {
        Row: {
          id: string;
          booking_id: string;
          customer_id: string;
          vehicle_id: string;
          scheduled_pickup_at: string;
          scheduled_return_at: string;
          started_at: string;
          ended_at: string | null;
          released_by: string;
          release_odometer: number | null;
          release_fuel_level: string;
          release_condition_summary: string;
          existing_damage_notes: string | null;
          agreement_acknowledged: boolean;
          condition_acknowledged: boolean;
          return_schedule_acknowledged: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          booking_id: string;
          customer_id: string;
          vehicle_id: string;
          scheduled_pickup_at: string;
          scheduled_return_at: string;
          started_at?: string;
          ended_at?: string | null;
          released_by: string;
          release_odometer?: number | null;
          release_fuel_level: string;
          release_condition_summary: string;
          existing_damage_notes?: string | null;
          agreement_acknowledged?: boolean;
          condition_acknowledged?: boolean;
          return_schedule_acknowledged?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["rental_transactions"]["Insert"]
        >;
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
      submit_payment_proof_atomic: {
        Args: {
          p_booking_id: string;
          p_customer_id: string;
          p_payment_method_id: string;
          p_submitted_amount: number;
          p_transaction_reference: string;
          p_storage_path: string;
          p_original_filename: string;
          p_mime_type: string;
          p_size_bytes: number;
        };
        Returns: Record<string, unknown>;
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
      create_maintenance_atomic: {
        Args: {
          p_vehicle_id: string;
          p_maintenance_type: string;
          p_description: string;
          p_blocks: boolean;
          p_started_at: string;
          p_odometer: number | null;
          p_next_odometer: number | null;
          p_next_date: string | null;
          p_cost: number | null;
          p_remarks: string | null;
          p_actor: string;
        };
        Returns: Database["public"]["Tables"]["maintenance_records"]["Row"];
      };
      update_maintenance_atomic: {
        Args: {
          p_record_id: string;
          p_status: string;
          p_odometer: number | null;
          p_next_odometer: number | null;
          p_next_date: string | null;
          p_cost: number | null;
          p_remarks: string | null;
          p_actor: string;
        };
        Returns: Database["public"]["Tables"]["maintenance_records"]["Row"];
      };
      reconcile_operational_notification_conditions: {
        Args: { p_conditions: unknown };
        Returns: Record<string, unknown>;
      };
      claim_email_deliveries: {
        Args: { p_limit: number; p_now: string };
        Returns: Array<{
          id: string;
          recipient_user_id: string;
          notification_id: string;
          email_type: string;
          attempt_count: number;
          recipient_email: string | null;
          recipient_name: string | null;
          email_notifications_enabled: boolean;
          related_entity_type: string;
          related_entity_id: string;
          scheduled_at: string | null;
        }>;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
