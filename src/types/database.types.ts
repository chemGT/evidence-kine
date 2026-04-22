// =============================================================================
// Evidence Kine - Types de la base Supabase
// -----------------------------------------------------------------------------
// Fichier genere manuellement a partir de supabase/migrations/001_shoulder_tests.sql
// A regenerer apres toute migration via :
//   npx supabase gen types typescript --local > src/types/database.types.ts
// =============================================================================

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      body_regions: {
        Row: {
          id: string;
          slug: string;
          label_fr: string;
          label_en: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          label_fr: string;
          label_en?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          label_fr?: string;
          label_en?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      pathologies: {
        Row: {
          id: string;
          body_region_id: string;
          slug: string;
          label_fr: string;
          label_en: string | null;
          icd10_code: string | null;
          description: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          body_region_id: string;
          slug: string;
          label_fr: string;
          label_en?: string | null;
          icd10_code?: string | null;
          description?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          body_region_id?: string;
          slug?: string;
          label_fr?: string;
          label_en?: string | null;
          icd10_code?: string | null;
          description?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "pathologies_body_region_id_fkey";
            columns: ["body_region_id"];
            referencedRelation: "body_regions";
            referencedColumns: ["id"];
          },
        ];
      };
      clinical_tests: {
        Row: {
          id: string;
          pathology_id: string;
          slug: string;
          name_fr: string;
          name_en: string | null;
          procedure_description: string;
          sensitivity: number;
          specificity: number;
          lr_positive: number | null;
          lr_negative: number | null;
          evidence_level: string | null;
          source_doi: string | null;
          source_reference: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          pathology_id: string;
          slug: string;
          name_fr: string;
          name_en?: string | null;
          procedure_description: string;
          sensitivity: number;
          specificity: number;
          lr_positive?: number | null;
          lr_negative?: number | null;
          evidence_level?: string | null;
          source_doi?: string | null;
          source_reference?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          pathology_id?: string;
          slug?: string;
          name_fr?: string;
          name_en?: string | null;
          procedure_description?: string;
          sensitivity?: number;
          specificity?: number;
          lr_positive?: number | null;
          lr_negative?: number | null;
          evidence_level?: string | null;
          source_doi?: string | null;
          source_reference?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "clinical_tests_pathology_id_fkey";
            columns: ["pathology_id"];
            referencedRelation: "pathologies";
            referencedColumns: ["id"];
          },
        ];
      };
      clinical_cases: {
        Row: {
          id: string;
          pathology_id: string;
          slug: string;
          title: string;
          vignette_data: Json;
          is_published: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          pathology_id: string;
          slug: string;
          title: string;
          vignette_data?: Json;
          is_published?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          pathology_id?: string;
          slug?: string;
          title?: string;
          vignette_data?: Json;
          is_published?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "clinical_cases_pathology_id_fkey";
            columns: ["pathology_id"];
            referencedRelation: "pathologies";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}

export type BodyRegion = Database["public"]["Tables"]["body_regions"]["Row"];
export type Pathology = Database["public"]["Tables"]["pathologies"]["Row"];
export type ClinicalTest =
  Database["public"]["Tables"]["clinical_tests"]["Row"];
export type ClinicalCase =
  Database["public"]["Tables"]["clinical_cases"]["Row"];
