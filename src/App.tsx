import { useState, useEffect, useMemo } from "react";
import {
  ThemeProvider, createTheme, CssBaseline, Box, Container,
  Typography, TextField, MenuItem, Button, Chip, Card, CardContent,
  LinearProgress, Alert, IconButton, Tooltip, Divider, Stack,
  Fade, Badge, Switch,
} from "@mui/material";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import BiotechIcon from "@mui/icons-material/Biotech";
import SchemaIcon from "@mui/icons-material/Schema";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import BuildIcon from "@mui/icons-material/Build";
import PsychologyIcon from "@mui/icons-material/Psychology";
import SendIcon from "@mui/icons-material/Send";
import LightModeIcon from "@mui/icons-material/LightMode";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import { generateMethodology, checkHealth } from "./api";
import type { Incoherence, MethodologyResponse, CaseType, IncoherenceType, Severity } from "./types";

/* ── Google Font import ──────────────────────────────────────────────────── */
const fontLink = document.createElement("link");
fontLink.rel = "stylesheet";
fontLink.href = "https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=JetBrains+Mono:wght@300;400;500&display=swap";
document.head.appendChild(fontLink);

/* ── Theme factory ───────────────────────────────────────────────────────── */
function buildTheme(mode: "light" | "dark") {
  const isDark = mode === "dark";
  return createTheme({
    palette: {
      mode,
      primary: { main: isDark ? "#00E5CC" : "#0D6EFD" },
      secondary: { main: isDark ? "#FF6B35" : "#E63946" },
      background: {
        default: isDark ? "#090D18" : "#F4F6FB",
        paper: isDark ? "#101624" : "#FFFFFF",
      },
      text: {
        primary: isDark ? "#E8EDF5" : "#0F1923",
        secondary: isDark ? "#7A8599" : "#5A6478",
      },
      divider: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.08)",
    },
    typography: {
      fontFamily: "'Syne', sans-serif",
      h4: { fontWeight: 800 },
      h6: { fontWeight: 700 },
      body1: { fontFamily: "'JetBrains Mono', monospace", fontSize: "0.85rem" },
      body2: { fontFamily: "'Syne', sans-serif", fontWeight: 600 },
      caption: { fontFamily: "'JetBrains Mono', monospace", fontSize: "0.75rem" },
    },
    shape: { borderRadius: 10 },
    components: {
      MuiCard: {
        styleOverrides: {
          root: {
            backgroundImage: "none",
            border: isDark
              ? "1px solid rgba(255,255,255,0.07)"
              : "1px solid rgba(0,0,0,0.07)",
            boxShadow: isDark
              ? "none"
              : "0 2px 12px rgba(0,0,0,0.06)",
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            "& .MuiOutlinedInput-root": {
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "0.82rem",
              "& fieldset": {
                borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.15)",
              },
              "&:hover fieldset": {
                borderColor: isDark ? "rgba(0,229,204,0.5)" : "rgba(13,110,253,0.5)",
              },
              "&.Mui-focused fieldset": {
                borderColor: isDark ? "#00E5CC" : "#0D6EFD",
              },
            },
            "& .MuiInputLabel-root": {
              fontFamily: "'Syne', sans-serif",
              fontSize: "0.82rem",
            },
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: "none",
            fontWeight: 700,
            fontFamily: "'Syne', sans-serif",
            letterSpacing: "0.04em",
            borderRadius: 10,
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: { fontFamily: "'JetBrains Mono', monospace", fontSize: "0.68rem" },
        },
      },
      MuiMenuItem: {
        styleOverrides: {
          root: { fontFamily: "'Syne', sans-serif", fontSize: "0.84rem" },
        },
      },
    },
  });
}

/* ── Constants ───────────────────────────────────────────────────────────── */
const CASE_TYPES: { value: CaseType; label: string }[] = [
  { value: "fraude_bancaire", label: "Fraude bancaire" },
  { value: "intrusion_reseau", label: "Intrusion réseau" },
  { value: "malware", label: "Malware / Ransomware" },
  { value: "phishing", label: "Phishing" },
  { value: "incident_interne", label: "Incident interne" },
  { value: "cryptojacking", label: "Cryptojacking" },
  { value: "apt", label: "APT (menace persistante)" },
  { value: "insider", label: "Insider threat" },
  { value: "supply_chain", label: "Supply chain" },
  { value: "generic", label: "Générique" },
];

const INC_TYPES: { value: IncoherenceType; label: string }[] = [
  { value: "temporelle", label: "Temporelle" },
  { value: "geographique", label: "Géographique" },
  { value: "factuelle", label: "Factuelle" },
];

const SEVERITIES: { value: Severity; label: string; color: string }[] = [
  { value: "haute", label: "Haute", color: "#E63946" },
  { value: "moyenne", label: "Moyenne", color: "#F4A261" },
  { value: "faible", label: "Faible", color: "#2A9D8F" },
];

const INC_COLOR: Record<IncoherenceType, string> = {
  temporelle: "#7C4DFF",
  geographique: "#00BCD4",
  factuelle: "#FF6B35",
};

function confidenceColor(c: number) {
  return c >= 0.7 ? "#E63946" : c >= 0.4 ? "#F4A261" : "#2A9D8F";
}

/* ── App ─────────────────────────────────────────────────────────────────── */
export default function App() {
  const [mode, setMode] = useState<"light" | "dark">("dark");
  const theme = useMemo(() => buildTheme(mode), [mode]);
  const isDark = mode === "dark";

  const accent = isDark ? "#00E5CC" : "#0D6EFD";
  const accentSub = isDark ? "#FF6B35" : "#E63946";

  const [online, setOnline] = useState<boolean | null>(null);
  const [caseId, setCaseId] = useState("CASE-" + Date.now().toString().slice(-6));
  const [caseType, setCaseType] = useState<CaseType>("fraude_bancaire");
  const [description, setDescription] = useState("");
  const [incoherences, setIncoherences] = useState<Incoherence[]>([
    { type: "temporelle", description: "", severity: "haute" },
  ]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<MethodologyResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkHealth().then(setOnline);
    const id = setInterval(() => checkHealth().then(setOnline), 15000);
    return () => clearInterval(id);
  }, []);

  const addInc = () =>
    setIncoherences((p) => [...p, { type: "factuelle", description: "", severity: "moyenne" }]);
  const removeInc = (i: number) =>
    setIncoherences((p) => p.filter((_, idx) => idx !== i));
  const updateInc = (i: number, field: keyof Incoherence, val: string) =>
    setIncoherences((p) =>
      p.map((inc, idx) => (idx === i ? { ...inc, [field]: val } : inc))
    );

  const handleSubmit = async () => {
    setLoading(true); setError(null); setResult(null);
    try {
      const res = await generateMethodology({
        case_id: caseId, case_type: caseType, description, incoherences,
      });
      setResult(res);
    } catch (e: unknown) {
      setError("Impossible de joindre l'API : " + (e instanceof Error ? e.message : "Erreur inconnue"));
    } finally { setLoading(false); }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{
        minHeight: "100vh",
        bgcolor: "background.default",
        backgroundImage: isDark
          ? "radial-gradient(ellipse at 15% 15%, rgba(0,229,204,0.05) 0%, transparent 55%), radial-gradient(ellipse at 85% 85%, rgba(255,107,53,0.05) 0%, transparent 55%)"
          : "radial-gradient(ellipse at 15% 15%, rgba(13,110,253,0.04) 0%, transparent 55%), radial-gradient(ellipse at 85% 85%, rgba(230,57,70,0.04) 0%, transparent 55%)",
        transition: "background 0.4s ease",
      }}>

        {/* ── Header ── */}
        <Box sx={{
          borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.08)"}`,
          px: { xs: 2, md: 4 }, py: 1.8,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          position: "sticky", top: 0, zIndex: 100,
          bgcolor: isDark ? "rgba(9,13,24,0.9)" : "rgba(244,246,251,0.92)",
          backdropFilter: "blur(12px)",
          transition: "background 0.4s ease",
        }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <BiotechIcon sx={{ color: accent, fontSize: 24 }} />
            <Box>
              <Typography sx={{
                fontFamily: "'Syne', sans-serif", fontWeight: 800,
                fontSize: "0.95rem", color: accent, lineHeight: 1.1, letterSpacing: "-0.01em",
              }}>
                MODULE G
              </Typography>
              <Typography variant="caption" sx={{ color: "text.secondary", letterSpacing: "0.02em" }}>
                Hypothèses & Méthodologies Techniques
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            {/* Statut API */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
              <Box sx={{
                width: 7, height: 7, borderRadius: "50%",
                bgcolor: online === null ? "#888" : online ? "#2A9D8F" : "#E63946",
                boxShadow: online ? `0 0 6px ${isDark ? "#2A9D8F" : "#2A9D8F"}` : "none",
                animation: online ? "pulse 2.5s infinite" : "none",
                "@keyframes pulse": { "0%,100%": { opacity: 1 }, "50%": { opacity: 0.3 } },
              }} />
              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                {online === null ? "…" : online ? "API en ligne" : "API hors ligne"}
              </Typography>
            </Box>

            {/* Toggle thème */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <LightModeIcon sx={{ fontSize: 16, color: isDark ? "text.secondary" : accent }} />
              <Switch
                checked={isDark}
                onChange={() => setMode(isDark ? "light" : "dark")}
                size="small"
                sx={{
                  "& .MuiSwitch-switchBase.Mui-checked": { color: accent },
                  "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": { bgcolor: accent },
                }}
              />
              <DarkModeIcon sx={{ fontSize: 16, color: isDark ? accent : "text.secondary" }} />
            </Box>
          </Box>
        </Box>

        {/* ── Body ── */}
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 3 }}>

            {/* ═══ COLONNE GAUCHE ═══ */}
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>

              {/* Carte infos cas */}
              <Card>
                <CardContent sx={{ p: 2.5 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2.5 }}>
                    <SchemaIcon sx={{ color: accent, fontSize: 16 }} />
                    <Typography sx={{
                      fontFamily: "'Syne', sans-serif", fontWeight: 700,
                      color: accent, fontSize: "0.7rem", letterSpacing: "0.12em", textTransform: "uppercase",
                    }}>
                      Informations du cas
                    </Typography>
                  </Box>
                  <Stack spacing={2}>
                    <TextField fullWidth size="small" label="Identifiant du cas"
                      value={caseId} onChange={(e) => setCaseId(e.target.value)} />
                    <TextField fullWidth select size="small" label="Type de cas"
                      value={caseType} onChange={(e) => setCaseType(e.target.value as CaseType)}>
                      {CASE_TYPES.map((t) => (
                        <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>
                      ))}
                    </TextField>
                    <TextField fullWidth size="small" label="Description (optionnel)" multiline rows={2}
                      value={description} onChange={(e) => setDescription(e.target.value)} />
                  </Stack>
                </CardContent>
              </Card>

              {/* Carte incohérences */}
              <Card>
                <CardContent sx={{ p: 2.5 }}>
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                      <Badge badgeContent={incoherences.length} color="primary"
                        sx={{ "& .MuiBadge-badge": { bgcolor: accent, color: isDark ? "#090D18" : "#fff", fontWeight: 700, fontSize: "0.6rem" } }}>
                        <ErrorOutlineIcon sx={{ color: accentSub, fontSize: 16 }} />
                      </Badge>
                      <Typography sx={{
                        fontFamily: "'Syne', sans-serif", fontWeight: 700,
                        color: accentSub, fontSize: "0.7rem", letterSpacing: "0.12em", textTransform: "uppercase", ml: 1,
                      }}>
                        Incohérences détectées
                      </Typography>
                    </Box>
                    <Tooltip title="Ajouter une incohérence">
                      <IconButton size="small" onClick={addInc} sx={{
                        color: accent,
                        border: `1px solid ${accent}44`,
                        borderRadius: 2,
                        "&:hover": { bgcolor: `${accent}14` },
                      }}>
                        <AddCircleOutlineIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Tooltip>
                  </Box>

                  <Stack spacing={1.5}>
                    {incoherences.map((inc, i) => (
                      <Box key={i} sx={{
                        p: 2, borderRadius: 2,
                        border: `1px solid ${INC_COLOR[inc.type]}30`,
                        bgcolor: isDark ? `${INC_COLOR[inc.type]}0A` : `${INC_COLOR[inc.type]}06`,
                        transition: "all 0.2s ease",
                      }}>
                        <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap", alignItems: "flex-start" }}>
                          <TextField select size="small" label="Type" value={inc.type}
                            onChange={(e) => updateInc(i, "type", e.target.value)} sx={{ minWidth: 140 }}>
                            {INC_TYPES.map((t) => (
                              <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>
                            ))}
                          </TextField>
                          <TextField select size="small" label="Sévérité" value={inc.severity}
                            onChange={(e) => updateInc(i, "severity", e.target.value)} sx={{ minWidth: 115 }}>
                            {SEVERITIES.map((s) => (
                              <MenuItem key={s.value} value={s.value}>
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                  <Box sx={{ width: 7, height: 7, borderRadius: "50%", bgcolor: s.color }} />
                                  {s.label}
                                </Box>
                              </MenuItem>
                            ))}
                          </TextField>
                          <TextField size="small" label="Description" multiline value={inc.description}
                            onChange={(e) => updateInc(i, "description", e.target.value)}
                            sx={{ flex: 1, minWidth: 180 }} />
                          <Tooltip title="Supprimer">
                            <IconButton size="small" onClick={() => removeInc(i)}
                              sx={{ color: "text.secondary", "&:hover": { color: "#E63946" }, mt: 0.3 }}>
                              <DeleteOutlineIcon sx={{ fontSize: 16 }} />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </Box>
                    ))}
                    {incoherences.length === 0 && (
                      <Typography variant="caption" sx={{
                        color: "text.secondary", textAlign: "center", py: 2, display: "block", letterSpacing: "0.03em",
                      }}>
                        Aucune incohérence — le système utilisera le type de cas.
                      </Typography>
                    )}
                  </Stack>
                </CardContent>
              </Card>

              {/* Bouton submit */}
              <Button variant="contained" size="large" endIcon={<SendIcon />}
                onClick={handleSubmit} disabled={loading || !caseId}
                sx={{
                  bgcolor: accent, color: isDark ? "#090D18" : "#fff",
                  fontWeight: 800, py: 1.6, fontSize: "0.88rem", letterSpacing: "0.06em",
                  "&:hover": { bgcolor: isDark ? "#00CCB4" : "#0B5ED7", boxShadow: `0 0 20px ${accent}44` },
                  "&:disabled": { bgcolor: `${accent}22`, color: "text.secondary" },
                  transition: "all 0.25s ease",
                }}>
                {loading ? "Génération en cours…" : "Générer le plan forensique"}
              </Button>

              {loading && (
                <LinearProgress sx={{
                  borderRadius: 2, height: 3,
                  bgcolor: `${accent}14`,
                  "& .MuiLinearProgress-bar": { bgcolor: accent, borderRadius: 2 },
                }} />
              )}

              {error && (
                <Alert severity="error" sx={{
                  bgcolor: "rgba(230,57,70,0.08)",
                  border: "1px solid rgba(230,57,70,0.2)",
                  color: "#E63946",
                  "& .MuiAlert-icon": { color: "#E63946" },
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "0.78rem",
                }}>
                  {error}
                </Alert>
              )}
            </Box>

            {/* ═══ COLONNE DROITE ═══ */}
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
              {!result && !loading && (
                <Box sx={{
                  display: "flex", flexDirection: "column", alignItems: "center",
                  justifyContent: "center", height: "100%", minHeight: 340,
                  border: `1px dashed ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.1)"}`,
                  borderRadius: 3, gap: 2,
                }}>
                  <BiotechIcon sx={{ fontSize: 54, color: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)" }} />
                  <Typography variant="caption" sx={{
                    color: "text.secondary", textAlign: "center", lineHeight: 2,
                    letterSpacing: "0.04em",
                  }}>
                    Remplis le formulaire et lance la génération<br />pour voir le plan forensique ici
                  </Typography>
                </Box>
              )}

              {result && (
                <Fade in timeout={300}>
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>

                    {/* Résumé */}
                    <Card sx={{
                      border: `1px solid ${accent}33 !important`,
                      bgcolor: `${accent}06 !important`,
                    }}>
                      <CardContent sx={{ p: 2.5, "&:last-child": { pb: 2.5 } }}>
                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 1 }}>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <CheckCircleIcon sx={{ color: accent, fontSize: 16 }} />
                            <Typography sx={{
                              fontFamily: "'JetBrains Mono', monospace", fontWeight: 500,
                              color: accent, fontSize: "0.8rem",
                            }}>
                              {result.case_id}
                            </Typography>
                          </Box>
                          <Chip label={`⏱ ${result.duree_totale_estimee}`} size="small"
                            sx={{ bgcolor: `${accent}14`, color: accent, border: `1px solid ${accent}33` }} />
                        </Box>
                        <Typography variant="caption" sx={{ color: "text.secondary", mt: 0.8, display: "block", letterSpacing: "0.02em" }}>
                          {new Date(result.generated_at).toLocaleString("fr-FR")} &bull;{" "}
                          {result.hypotheses.length} hypothèse(s) &bull; {result.plan.length} action(s)
                        </Typography>
                      </CardContent>
                    </Card>

                    {/* Hypothèses */}
                    <Box>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
                        <PsychologyIcon sx={{ color: accentSub, fontSize: 15 }} />
                        <Typography sx={{
                          fontFamily: "'Syne', sans-serif", fontWeight: 700,
                          color: accentSub, textTransform: "uppercase",
                          letterSpacing: "0.12em", fontSize: "0.68rem",
                        }}>
                          Hypothèses ({result.hypotheses.length})
                        </Typography>
                      </Box>
                      <Stack spacing={1.5}>
                        {result.hypotheses.map((h, i) => {
                          const col = confidenceColor(h.confidence);
                          return (
                            <Fade in timeout={250 + i * 80} key={h.id}>
                              <Card>
                                <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                      <PsychologyIcon sx={{ color: col, fontSize: 14 }} />
                                      <Typography sx={{
                                        fontFamily: "'Syne', sans-serif", fontWeight: 700,
                                        color: "text.primary", fontSize: "0.82rem",
                                      }}>
                                        {h.id.replace(/_/g, " ")}
                                      </Typography>
                                    </Box>
                                    <Chip label={`${Math.round(h.confidence * 100)}%`} size="small"
                                      sx={{ bgcolor: `${col}18`, color: col, border: `1px solid ${col}40`, fontWeight: 700 }} />
                                  </Box>
                                  <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mb: 1.5, lineHeight: 1.7 }}>
                                    {h.description}
                                  </Typography>
                                  <LinearProgress variant="determinate" value={h.confidence * 100}
                                    sx={{
                                      height: 3, borderRadius: 2,
                                      bgcolor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)",
                                      "& .MuiLinearProgress-bar": { bgcolor: col, borderRadius: 2 },
                                    }} />
                                  <Box sx={{ mt: 1.5, display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                                    {h.indicateurs.map((ind) => (
                                      <Chip key={ind} label={ind} size="small"
                                        sx={{
                                          bgcolor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)",
                                          color: "text.secondary", border: "none",
                                        }} />
                                    ))}
                                  </Box>
                                </CardContent>
                              </Card>
                            </Fade>
                          );
                        })}
                      </Stack>
                    </Box>

                    <Divider />

                    {/* Plan */}
                    <Box>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
                        <BuildIcon sx={{ color: "#7C4DFF", fontSize: 15 }} />
                        <Typography sx={{
                          fontFamily: "'Syne', sans-serif", fontWeight: 700,
                          color: "#7C4DFF", textTransform: "uppercase",
                          letterSpacing: "0.12em", fontSize: "0.68rem",
                        }}>
                          Plan d'actions ({result.plan.length})
                        </Typography>
                      </Box>
                      <Stack spacing={1.5}>
                        {result.plan.map((action, i) => (
                          <Fade in timeout={350 + i * 60} key={action.action}>
                            <Card>
                              <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                    <Box sx={{
                                      width: 22, height: 22, borderRadius: "50%",
                                      bgcolor: `${accent}18`,
                                      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                                    }}>
                                      <Typography sx={{
                                        fontFamily: "'JetBrains Mono', monospace",
                                        fontSize: "0.62rem", fontWeight: 500, color: accent,
                                      }}>
                                        {action.priorite}
                                      </Typography>
                                    </Box>
                                    <Typography sx={{
                                      fontFamily: "'Syne', sans-serif", fontWeight: 700,
                                      color: "text.primary", fontSize: "0.82rem",
                                    }}>
                                      {action.action.replace(/_/g, " ")}
                                    </Typography>
                                  </Box>
                                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                                    <AccessTimeIcon sx={{ fontSize: 12, color: "text.secondary" }} />
                                    <Typography variant="caption" sx={{ color: "text.secondary" }}>
                                      {action.duree_estimee}
                                    </Typography>
                                  </Box>
                                </Box>
                                <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mb: 1.5, lineHeight: 1.7 }}>
                                  {action.description}
                                </Typography>
                                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mb: 1 }}>
                                  {action.outils.map((tool) => (
                                    <Chip key={tool}
                                      icon={<BuildIcon style={{ fontSize: 10 }} />}
                                      label={tool} size="small"
                                      sx={{
                                        bgcolor: `${accent}0E`, color: accent,
                                        border: `1px solid ${accent}28`,
                                        "& .MuiChip-icon": { color: accent },
                                      }} />
                                  ))}
                                </Box>
                                <Typography variant="caption" sx={{ color: `${accentSub}88` }}>
                                  ↳ {action.hypothese_source.replace(/_/g, " ")}
                                </Typography>
                              </CardContent>
                            </Card>
                          </Fade>
                        ))}
                      </Stack>
                    </Box>

                  </Box>
                </Fade>
              )}
            </Box>
          </Box>
        </Container>
      </Box>
    </ThemeProvider>
  );
}
