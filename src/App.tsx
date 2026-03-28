import { useState, useEffect } from "react";
import {
  ThemeProvider, createTheme, CssBaseline, Box, Container,
  Typography, TextField, MenuItem, Button, Chip, Card, CardContent,
  LinearProgress, Alert, IconButton, Tooltip, Divider, Stack, Fade, Badge,
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
import { generateMethodology, checkHealth } from "./api";
import type { Incoherence, MethodologyResponse, CaseType, IncoherenceType, Severity } from "./types";

const theme = createTheme({
  palette: {
    mode: "dark",
    primary: { main: "#00E5CC" },
    secondary: { main: "#FF6B35" },
    background: { default: "#0A0E1A", paper: "#111827" },
    text: { primary: "#E8EAF0", secondary: "#8892A4" },
  },
  typography: { fontFamily: "'DM Mono', 'Fira Code', 'Courier New', monospace" },
  shape: { borderRadius: 8 },
  components: {
    MuiCard: { styleOverrides: { root: { backgroundImage: "none", border: "1px solid rgba(255,255,255,0.06)" } } },
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            "& fieldset": { borderColor: "rgba(255,255,255,0.12)" },
            "&:hover fieldset": { borderColor: "rgba(0,229,204,0.4)" },
            "&.Mui-focused fieldset": { borderColor: "#00E5CC" },
          },
        },
      },
    },
    MuiButton: { styleOverrides: { root: { textTransform: "none", fontWeight: 600, letterSpacing: "0.05em" } } },
  },
});

const CASE_TYPES: { value: CaseType; label: string }[] = [
  { value: "fraude_bancaire", label: "Fraude bancaire" },
  { value: "intrusion_reseau", label: "Intrusion réseau" },
  { value: "malware", label: "Malware / Ransomware" },
  { value: "phishing", label: "Phishing" },
  { value: "incident_interne", label: "Incident interne" },
  { value: "generic", label: "Générique" },
];

const INC_TYPES: { value: IncoherenceType; label: string }[] = [
  { value: "temporelle", label: "Temporelle" },
  { value: "geographique", label: "Géographique" },
  { value: "factuelle", label: "Factuelle" },
];

const SEVERITIES: { value: Severity; label: string; color: string }[] = [
  { value: "haute", label: "Haute", color: "#FF4444" },
  { value: "moyenne", label: "Moyenne", color: "#FF9800" },
  { value: "faible", label: "Faible", color: "#4CAF50" },
];

const INC_COLOR: Record<IncoherenceType, string> = {
  temporelle: "#7C4DFF", geographique: "#00BCD4", factuelle: "#FF6B35",
};

function confidenceColor(c: number) {
  return c >= 0.7 ? "#FF4444" : c >= 0.4 ? "#FF9800" : "#4CAF50";
}

export default function App() {
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

  const addInc = () => setIncoherences(p => [...p, { type: "factuelle", description: "", severity: "moyenne" }]);
  const removeInc = (i: number) => setIncoherences(p => p.filter((_, idx) => idx !== i));
  const updateInc = (i: number, field: keyof Incoherence, val: string) =>
    setIncoherences(p => p.map((inc, idx) => idx === i ? { ...inc, [field]: val } : inc));

  const handleSubmit = async () => {
    setLoading(true); setError(null); setResult(null);
    try {
      const res = await generateMethodology({ case_id: caseId, case_type: caseType, description, incoherences });
      setResult(res);
    } catch (e: unknown) {
      setError("Impossible de joindre l'API : " + (e instanceof Error ? e.message : "Erreur inconnue"));
    } finally { setLoading(false); }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ minHeight: "100vh", bgcolor: "background.default",
        backgroundImage: "radial-gradient(ellipse at 20% 20%, rgba(0,229,204,0.04) 0%, transparent 60%), radial-gradient(ellipse at 80% 80%, rgba(255,107,53,0.04) 0%, transparent 60%)" }}>

        {/* ── Header ── */}
        <Box sx={{ borderBottom: "1px solid rgba(255,255,255,0.06)", px: 3, py: 2,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          position: "sticky", top: 0, zIndex: 10, bgcolor: "rgba(10,14,26,0.92)", backdropFilter: "blur(8px)" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <BiotechIcon sx={{ color: "#00E5CC", fontSize: 26 }} />
            <Box>
              <Typography sx={{ fontSize: "0.9rem", fontWeight: 700, color: "#00E5CC", lineHeight: 1.2, fontFamily: "inherit" }}>
                MODULE G
              </Typography>
              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                Hypothèses & Méthodologies Techniques
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
            <Box sx={{ width: 8, height: 8, borderRadius: "50%",
              bgcolor: online === null ? "#888" : online ? "#00E5CC" : "#FF4444",
              boxShadow: online ? "0 0 8px #00E5CC" : "none",
              animation: online ? "pulse 2s infinite" : "none",
              "@keyframes pulse": { "0%,100%": { opacity: 1 }, "50%": { opacity: 0.4 } } }} />
            <Typography variant="caption" sx={{ color: "text.secondary", fontFamily: "inherit" }}>
              API {online === null ? "…" : online ? "connectée" : "hors ligne"}
            </Typography>
          </Box>
        </Box>

        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 3 }}>

            {/* ── Colonne gauche : Formulaire ── */}
            <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>

              {/* Infos cas */}
              <Card>
                <CardContent>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2.5 }}>
                    <SchemaIcon sx={{ color: "#00E5CC", fontSize: 16 }} />
                    <Typography sx={{ fontWeight: 600, color: "#00E5CC", letterSpacing: "0.08em",
                      textTransform: "uppercase", fontSize: "0.7rem", fontFamily: "inherit" }}>
                      Informations du cas
                    </Typography>
                  </Box>
                  <Stack spacing={2}>
                    <TextField fullWidth size="small" label="Identifiant du cas"
                      value={caseId} onChange={e => setCaseId(e.target.value)}
                      inputProps={{ style: { fontFamily: "inherit" } }} />
                    <TextField fullWidth select size="small" label="Type de cas"
                      value={caseType} onChange={e => setCaseType(e.target.value as CaseType)}>
                      {CASE_TYPES.map(t => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
                    </TextField>
                    <TextField fullWidth size="small" label="Description (optionnel)" multiline rows={2}
                      value={description} onChange={e => setDescription(e.target.value)} />
                  </Stack>
                </CardContent>
              </Card>

              {/* Incohérences */}
              <Card>
                <CardContent>
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                      <Badge badgeContent={incoherences.length} color="primary"
                        sx={{ "& .MuiBadge-badge": { bgcolor: "#00E5CC", color: "#0A0E1A", fontWeight: 700, fontSize: "0.6rem" } }}>
                        <ErrorOutlineIcon sx={{ color: "#FF6B35", fontSize: 16 }} />
                      </Badge>
                      <Typography sx={{ fontWeight: 600, color: "#FF6B35", letterSpacing: "0.08em",
                        textTransform: "uppercase", fontSize: "0.7rem", fontFamily: "inherit" }}>
                        Incohérences détectées
                      </Typography>
                    </Box>
                    <Tooltip title="Ajouter une incohérence">
                      <IconButton size="small" onClick={addInc}
                        sx={{ color: "#00E5CC", border: "1px solid rgba(0,229,204,0.3)", borderRadius: 1.5,
                          "&:hover": { bgcolor: "rgba(0,229,204,0.1)" } }}>
                        <AddCircleOutlineIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Tooltip>
                  </Box>
                  <Stack spacing={1.5}>
                    {incoherences.map((inc, i) => (
                      <Box key={i} sx={{ p: 2, borderRadius: 2,
                        border: `1px solid ${INC_COLOR[inc.type]}33`,
                        bgcolor: `${INC_COLOR[inc.type]}08` }}>
                        <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap", alignItems: "flex-start" }}>
                          <TextField select size="small" label="Type" value={inc.type}
                            onChange={e => updateInc(i, "type", e.target.value)} sx={{ minWidth: 145 }}>
                            {INC_TYPES.map(t => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
                          </TextField>
                          <TextField select size="small" label="Sévérité" value={inc.severity}
                            onChange={e => updateInc(i, "severity", e.target.value)} sx={{ minWidth: 115 }}>
                            {SEVERITIES.map(s => (
                              <MenuItem key={s.value} value={s.value}>
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                  <Box sx={{ width: 7, height: 7, borderRadius: "50%", bgcolor: s.color }} />
                                  {s.label}
                                </Box>
                              </MenuItem>
                            ))}
                          </TextField>
                          <TextField size="small" label="Description" multiline value={inc.description}
                            onChange={e => updateInc(i, "description", e.target.value)}
                            sx={{ flex: 1, minWidth: 180 }} />
                          <Tooltip title="Supprimer">
                            <IconButton size="small" onClick={() => removeInc(i)}
                              sx={{ color: "text.secondary", "&:hover": { color: "#FF4444" }, mt: 0.3 }}>
                              <DeleteOutlineIcon sx={{ fontSize: 16 }} />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </Box>
                    ))}
                    {incoherences.length === 0 && (
                      <Typography variant="caption" sx={{ color: "text.secondary", textAlign: "center", py: 2, display: "block" }}>
                        Aucune incohérence — le système utilisera le type de cas.
                      </Typography>
                    )}
                  </Stack>
                </CardContent>
              </Card>

              {/* Submit */}
              <Button variant="contained" size="large" endIcon={<SendIcon />}
                onClick={handleSubmit} disabled={loading || !caseId}
                sx={{ bgcolor: "#00E5CC", color: "#0A0E1A", fontWeight: 700, py: 1.5,
                  fontSize: "0.85rem", letterSpacing: "0.06em", fontFamily: "inherit",
                  "&:hover": { bgcolor: "#00CCB4", boxShadow: "0 0 24px rgba(0,229,204,0.35)" },
                  "&:disabled": { bgcolor: "rgba(0,229,204,0.15)", color: "rgba(255,255,255,0.25)" } }}>
                {loading ? "Génération en cours…" : "Générer le plan forensique"}
              </Button>

              {loading && <LinearProgress sx={{ borderRadius: 1, bgcolor: "rgba(0,229,204,0.08)",
                "& .MuiLinearProgress-bar": { bgcolor: "#00E5CC" } }} />}

              {error && (
                <Alert severity="error" sx={{ bgcolor: "rgba(255,68,68,0.08)",
                  border: "1px solid rgba(255,68,68,0.25)", color: "#FF8A80",
                  "& .MuiAlert-icon": { color: "#FF4444" }, fontFamily: "inherit" }}>
                  {error}
                </Alert>
              )}
            </Box>

            {/* ── Colonne droite : Résultats ── */}
            <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
              {!result && !loading && (
                <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center",
                  justifyContent: "center", height: "100%", minHeight: 320,
                  border: "1px dashed rgba(255,255,255,0.07)", borderRadius: 2, gap: 2 }}>
                  <BiotechIcon sx={{ fontSize: 52, color: "rgba(255,255,255,0.1)" }} />
                  <Typography variant="caption" sx={{ color: "text.secondary", textAlign: "center", lineHeight: 1.8 }}>
                    Remplis le formulaire et lance la génération<br />pour voir le plan forensique ici
                  </Typography>
                </Box>
              )}

              {result && (
                <Fade in timeout={300}>
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>

                    {/* Résumé */}
                    <Card sx={{ border: "1px solid rgba(0,229,204,0.25) !important", bgcolor: "rgba(0,229,204,0.03) !important" }}>
                      <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 1 }}>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <CheckCircleIcon sx={{ color: "#00E5CC", fontSize: 16 }} />
                            <Typography sx={{ fontWeight: 600, color: "#00E5CC", fontSize: "0.8rem", fontFamily: "inherit" }}>
                              {result.case_id}
                            </Typography>
                          </Box>
                          <Chip label={`⏱ ${result.duree_totale_estimee}`} size="small"
                            sx={{ bgcolor: "rgba(0,229,204,0.1)", color: "#00E5CC",
                              border: "1px solid rgba(0,229,204,0.25)", fontSize: "0.68rem", fontFamily: "inherit" }} />
                        </Box>
                        <Typography variant="caption" sx={{ color: "text.secondary", mt: 0.5, display: "block" }}>
                          {new Date(result.generated_at).toLocaleString("fr-FR")} &bull;{" "}
                          {result.hypotheses.length} hypothèse(s) &bull; {result.plan.length} action(s)
                        </Typography>
                      </CardContent>
                    </Card>

                    {/* Hypothèses */}
                    <Box>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
                        <PsychologyIcon sx={{ color: "#FF6B35", fontSize: 15 }} />
                        <Typography sx={{ fontWeight: 600, color: "#FF6B35", textTransform: "uppercase",
                          letterSpacing: "0.1em", fontSize: "0.68rem", fontFamily: "inherit" }}>
                          Hypothèses ({result.hypotheses.length})
                        </Typography>
                      </Box>
                      <Stack spacing={1.5}>
                        {result.hypotheses.map((h, i) => {
                          const col = confidenceColor(h.confidence);
                          return (
                            <Fade in timeout={300 + i * 80} key={h.id}>
                              <Card>
                                <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                      <PsychologyIcon sx={{ color: col, fontSize: 15 }} />
                                      <Typography sx={{ fontWeight: 600, color: "#E8EAF0", fontSize: "0.8rem", fontFamily: "inherit" }}>
                                        {h.id.replace(/_/g, " ")}
                                      </Typography>
                                    </Box>
                                    <Chip label={`${Math.round(h.confidence * 100)}%`} size="small"
                                      sx={{ bgcolor: `${col}1A`, color: col, border: `1px solid ${col}44`,
                                        fontSize: "0.65rem", fontWeight: 700, fontFamily: "inherit" }} />
                                  </Box>
                                  <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mb: 1.5 }}>
                                    {h.description}
                                  </Typography>
                                  <LinearProgress variant="determinate" value={h.confidence * 100}
                                    sx={{ height: 3, borderRadius: 2, bgcolor: "rgba(255,255,255,0.05)",
                                      "& .MuiLinearProgress-bar": { bgcolor: col, borderRadius: 2 } }} />
                                  <Box sx={{ mt: 1.5, display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                                    {h.indicateurs.map(ind => (
                                      <Chip key={ind} label={ind} size="small"
                                        sx={{ fontSize: "0.6rem", bgcolor: "rgba(255,255,255,0.04)",
                                          color: "text.secondary", border: "none", fontFamily: "inherit" }} />
                                    ))}
                                  </Box>
                                </CardContent>
                              </Card>
                            </Fade>
                          );
                        })}
                      </Stack>
                    </Box>

                    <Divider sx={{ borderColor: "rgba(255,255,255,0.05)" }} />

                    {/* Plan */}
                    <Box>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
                        <BuildIcon sx={{ color: "#7C4DFF", fontSize: 15 }} />
                        <Typography sx={{ fontWeight: 600, color: "#7C4DFF", textTransform: "uppercase",
                          letterSpacing: "0.1em", fontSize: "0.68rem", fontFamily: "inherit" }}>
                          Plan d'actions ({result.plan.length})
                        </Typography>
                      </Box>
                      <Stack spacing={1.5}>
                        {result.plan.map((action, i) => (
                          <Fade in timeout={400 + i * 60} key={action.action}>
                            <Card>
                              <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                    <Box sx={{ width: 20, height: 20, borderRadius: "50%",
                                      bgcolor: "rgba(0,229,204,0.12)", display: "flex",
                                      alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                      <Typography sx={{ fontSize: "0.6rem", fontWeight: 700, color: "#00E5CC", fontFamily: "inherit" }}>
                                        {action.priorite}
                                      </Typography>
                                    </Box>
                                    <Typography sx={{ fontWeight: 600, color: "#E8EAF0", fontSize: "0.8rem", fontFamily: "inherit" }}>
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
                                <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mb: 1.5 }}>
                                  {action.description}
                                </Typography>
                                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mb: 1 }}>
                                  {action.outils.map(tool => (
                                    <Chip key={tool} icon={<BuildIcon style={{ fontSize: 10 }} />} label={tool} size="small"
                                      sx={{ fontSize: "0.62rem", bgcolor: "rgba(0,229,204,0.07)", color: "#00E5CC",
                                        border: "1px solid rgba(0,229,204,0.18)",
                                        "& .MuiChip-icon": { color: "#00E5CC" }, fontFamily: "inherit" }} />
                                  ))}
                                </Box>
                                <Typography variant="caption" sx={{ color: "rgba(255,107,53,0.6)", fontFamily: "inherit" }}>
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
