export type Severity = "haute" | "moyenne" | "faible";
export type IncoherenceType = "temporelle" | "geographique" | "factuelle";
export type CaseType =
  | "fraude_bancaire"
  | "intrusion_reseau"
  | "malware"
  | "phishing"
  | "incident_interne"
  | "cryptojacking"
  | "apt"
  | "insider"
  | "supply_chain"
  | "generic";

export interface Incoherence {
  type: IncoherenceType;
  description: string;
  severity: Severity;
  pv_references?: string[];
}

export interface MethodologyRequest {
  case_id: string;
  case_type: CaseType;
  incoherences: Incoherence[];
  description?: string;
}

export interface Hypothesis {
  id: string;
  description: string;
  indicateurs: string[];
  confidence: number;
}

export interface ForensicAction {
  action: string;
  outils: string[];
  description: string;
  duree_estimee: string;
  priorite: number;
  hypothese_source: string;
}

export interface MethodologyResponse {
  case_id: string;
  hypotheses: Hypothesis[];
  plan: ForensicAction[];
  duree_totale_estimee: string;
  generated_at: string;
}
