import axios from "axios";
import type { MethodologyRequest, MethodologyResponse } from "./types";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8006",
  headers: { "Content-Type": "application/json" },
});

export async function generateMethodology(
  payload: MethodologyRequest
): Promise<MethodologyResponse> {
  const { data } = await api.post<MethodologyResponse>(
    "/api/v1/methodology/generate",
    payload
  );
  return data;
}

export async function checkHealth(): Promise<boolean> {
  try {
    await api.get("/api/v1/health");
    return true;
  } catch {
    return false;
  }
}
