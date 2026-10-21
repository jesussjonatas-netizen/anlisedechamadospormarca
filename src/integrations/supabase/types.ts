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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      chamados_por_marca: {
        Row: {
          causa_raiz: string | null
          cd: string | null
          cd_full: string | null
          cliente: string | null
          cna: string | null
          codigo: string | null
          conf_checkout: string | null
          conf_expedicao: string | null
          conf_separacao: string | null
          created_at: string
          data_entrada: string | null
          data_validacao: string | null
          documento: string | null
          entrada_devolucao: string | null
          id: string
          id_portal: string
          marca: string | null
          modalidade: string | null
          nf: string | null
          nf_devolucao: string | null
          nfd: string | null
          nfe_fabricante: string | null
          nfe_transportadora: string | null
          no_status_atual: string | null
          nome: string | null
          numero_benner: string | null
          obs_reprovacao_aprovacao: string | null
          procedencia: string | null
          quantidade: number | null
          quantidade_a_retornar: number | null
          quantidade_desejada: number | null
          regiao: string | null
          situacao: string | null
          status: string | null
          status_auditoria: string | null
          tempo_aberto: string | null
          tipo: string | null
          updated_at: string
          validador: string | null
          valor: number | null
        }
        Insert: {
          causa_raiz?: string | null
          cd?: string | null
          cd_full?: string | null
          cliente?: string | null
          cna?: string | null
          codigo?: string | null
          conf_checkout?: string | null
          conf_expedicao?: string | null
          conf_separacao?: string | null
          created_at?: string
          data_entrada?: string | null
          data_validacao?: string | null
          documento?: string | null
          entrada_devolucao?: string | null
          id?: string
          id_portal: string
          marca?: string | null
          modalidade?: string | null
          nf?: string | null
          nf_devolucao?: string | null
          nfd?: string | null
          nfe_fabricante?: string | null
          nfe_transportadora?: string | null
          no_status_atual?: string | null
          nome?: string | null
          numero_benner?: string | null
          obs_reprovacao_aprovacao?: string | null
          procedencia?: string | null
          quantidade?: number | null
          quantidade_a_retornar?: number | null
          quantidade_desejada?: number | null
          regiao?: string | null
          situacao?: string | null
          status?: string | null
          status_auditoria?: string | null
          tempo_aberto?: string | null
          tipo?: string | null
          updated_at?: string
          validador?: string | null
          valor?: number | null
        }
        Update: {
          causa_raiz?: string | null
          cd?: string | null
          cd_full?: string | null
          cliente?: string | null
          cna?: string | null
          codigo?: string | null
          conf_checkout?: string | null
          conf_expedicao?: string | null
          conf_separacao?: string | null
          created_at?: string
          data_entrada?: string | null
          data_validacao?: string | null
          documento?: string | null
          entrada_devolucao?: string | null
          id?: string
          id_portal?: string
          marca?: string | null
          modalidade?: string | null
          nf?: string | null
          nf_devolucao?: string | null
          nfd?: string | null
          nfe_fabricante?: string | null
          nfe_transportadora?: string | null
          no_status_atual?: string | null
          nome?: string | null
          numero_benner?: string | null
          obs_reprovacao_aprovacao?: string | null
          procedencia?: string | null
          quantidade?: number | null
          quantidade_a_retornar?: number | null
          quantidade_desejada?: number | null
          regiao?: string | null
          situacao?: string | null
          status?: string | null
          status_auditoria?: string | null
          tempo_aberto?: string | null
          tipo?: string | null
          updated_at?: string
          validador?: string | null
          valor?: number | null
        }
        Relationships: []
      }
      chamados_por_marca_meta: {
        Row: {
          atualizado_em: string
          id: number
        }
        Insert: {
          atualizado_em?: string
          id?: number
        }
        Update: {
          atualizado_em?: string
          id?: number
        }
        Relationships: []
      }
      solicitacoes: {
        Row: {
          ano: number | null
          causa_raiz: string | null
          cd: string | null
          cd_full: string | null
          cliente: string | null
          cna: string | null
          codigo: string | null
          conferente: string | null
          created_at: string
          data: string | null
          data_validacao: string | null
          entrada_devolucao: string | null
          id: string
          id_portal: string | null
          marca: string | null
          modalidade: string | null
          nf: string | null
          nfd: string | null
          nome: string | null
          numero_benner: string | null
          obs_reprovacao_aprovacao: string | null
          procedencia: string | null
          regiao: string | null
          situacao: string | null
          status: string | null
          status_auditoria: string | null
          tipo: string | null
          validador: string | null
          valor: number | null
        }
        Insert: {
          ano?: number | null
          causa_raiz?: string | null
          cd?: string | null
          cd_full?: string | null
          cliente?: string | null
          cna?: string | null
          codigo?: string | null
          conferente?: string | null
          created_at?: string
          data?: string | null
          data_validacao?: string | null
          entrada_devolucao?: string | null
          id?: string
          id_portal?: string | null
          marca?: string | null
          modalidade?: string | null
          nf?: string | null
          nfd?: string | null
          nome?: string | null
          numero_benner?: string | null
          obs_reprovacao_aprovacao?: string | null
          procedencia?: string | null
          regiao?: string | null
          situacao?: string | null
          status?: string | null
          status_auditoria?: string | null
          tipo?: string | null
          validador?: string | null
          valor?: number | null
        }
        Update: {
          ano?: number | null
          causa_raiz?: string | null
          cd?: string | null
          cd_full?: string | null
          cliente?: string | null
          cna?: string | null
          codigo?: string | null
          conferente?: string | null
          created_at?: string
          data?: string | null
          data_validacao?: string | null
          entrada_devolucao?: string | null
          id?: string
          id_portal?: string | null
          marca?: string | null
          modalidade?: string | null
          nf?: string | null
          nfd?: string | null
          nome?: string | null
          numero_benner?: string | null
          obs_reprovacao_aprovacao?: string | null
          procedencia?: string | null
          regiao?: string | null
          situacao?: string | null
          status?: string | null
          status_auditoria?: string | null
          tipo?: string | null
          validador?: string | null
          valor?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      importar_chamados_por_marca: { Args: { _rows: Json }; Returns: Json }
    }
    Enums: {
      [_ in never]: never
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
