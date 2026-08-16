import { useCallback, useEffect, useMemo, useState } from "react";
import { Badge, Button } from "@design-system";
import { useTheme } from "@app/providers/ThemeProvider";
import { useAuth } from "@features/auth/hooks/useAuth";
import { showToast } from "@shared/ui/ToastContainer";
import { findingAppService } from "@/features/inspection-management/application/FindingApplicationService";
import type {
  Finding,
  FindingStatus,
  FindingUpdate,
} from "@/features/inspection-management/domain/models/Finding";
import type { InspectionSession } from "@/features/inspection-management/domain/models/InspectionSession";
import type { TPIRequest } from "../../domain/types";
import type { TPIRequestDetailsDTO } from "../../application/TPIRequestApplicationService";
import { tpiFindingExportAppService } from "../../application/TpiFindingExportApplicationService";

interface Props {
  request: TPIRequest;
  details: TPIRequestDetailsDTO;
  sessions: InspectionSession[];
  activeSessionId?: string;
  equipmentNames: Record<string, string>;
  canExport: boolean;
}
const statusLabel: Record<FindingStatus, string> = {
  OPEN: "Open",
  CORRECTIVE_ACTION: "Corrective Action",
  VERIFICATION: "Verification",
  CLOSED: "Closed",
  REJECTED: "Rejected / New NCR",
};
const nextStatus: Partial<Record<FindingStatus, FindingStatus[]>> = {
  OPEN: ["CORRECTIVE_ACTION", "CLOSED"],
  CORRECTIVE_ACTION: ["VERIFICATION", "OPEN"],
  VERIFICATION: ["CLOSED", "REJECTED", "CORRECTIVE_ACTION"],
};
const fieldClass =
  "w-full rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs";

export function NCRTab({
  request,
  details,
  sessions,
  activeSessionId,
  equipmentNames,
  canExport,
}: Props) {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const [findings, setFindings] = useState<Finding[]>([]);
  const [kind, setKind] = useState("ALL");
  const [session, setSession] = useState("ALL");
  const [busy, setBusy] = useState<string>();
  const [editing, setEditing] = useState<Finding>();
  const [draft, setDraft] = useState<FindingUpdate>({});
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setFindings(await findingAppService.listByRequestId(request.id));
    } catch (error: any) {
      showToast("error", "Load Failed", error.message);
    } finally {
      setLoading(false);
    }
  }, [request.id]);
  useEffect(() => void load(), [load]);
  const visible = useMemo(
    () =>
      findings.filter(
        (f) =>
          (kind === "ALL" || f.kind === kind) &&
          (session === "ALL" || f.sessionId === session),
      ),
    [findings, kind, session],
  );
  const sessionName = (id?: string | null) =>
    id
      ? `Session ${sessions.find((s) => s.id === id)?.session_number || "?"}`
      : "Legacy / package";

  async function transition(finding: Finding, status: FindingStatus) {
    const snapshot = findings;
    setFindings((all) =>
      all.map((f) => (f.id === finding.id ? { ...f, status } : f)),
    );
    setBusy(finding.id);
    try {
      const saved = await findingAppService.transitionFinding(
        finding,
        status,
        user?.id || "unknown",
      );
      setFindings((all) => all.map((f) => (f.id === saved.id ? saved : f)));
    } catch (error: any) {
      setFindings(snapshot);
      showToast("error", "Update Failed", error.message);
    } finally {
      setBusy(undefined);
    }
  }
  async function save() {
    if (!editing) return;
    const snapshot = findings;
    setFindings((all) =>
      all.map((f) => (f.id === editing.id ? { ...f, ...draft } : f)),
    );
    setBusy(editing.id);
    try {
      const saved = await findingAppService.updateFinding(editing, draft);
      setFindings((all) => all.map((f) => (f.id === saved.id ? saved : f)));
      setEditing(undefined);
      showToast("success", "Finding Saved", "NCR/CAR details updated");
    } catch (error: any) {
      setFindings(snapshot);
      showToast("error", "Save Failed", error.message);
    } finally {
      setBusy(undefined);
    }
  }
  async function exportDocx(finding: Finding) {
    setBusy(finding.id);
    try {
      await tpiFindingExportAppService.exportFinding(finding, {
        request,
        details,
        sessions,
        equipmentNames,
        inspectorName: (user as any)?.full_name || (user as any)?.name || "",
      });
      showToast(
        "success",
        "DOCX Exported",
        "Independent Finding report created",
      );
    } catch (error: any) {
      showToast("error", "Export Failed", error.message);
    } finally {
      setBusy(undefined);
    }
  }
  function edit(f: Finding) {
    setEditing(f);
    setDraft({
      title: f.title,
      description: f.description,
      locationFound: f.locationFound,
      evidence: f.evidence,
      immediateContainment: f.immediateContainment,
      correctiveAction: f.correctiveAction,
      targetCompletionDate: f.targetCompletionDate,
      responsiblePerson: f.responsiblePerson,
      verification: f.verification,
      closeoutDecision: f.closeoutDecision,
      closeoutNote: f.closeoutNote,
      closeoutDate: f.closeoutDate,
    });
  }

  if (loading)
    return (
      <div className="py-16 text-center text-sm text-slate-500">
        Loading findings...
      </div>
    );
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          ["All Findings", findings.length],
          ["NCR", findings.filter((f) => f.kind === "NCR").length],
          [
            "Observation",
            findings.filter((f) => f.kind === "OBSERVATION").length,
          ],
          [
            "Open",
            findings.filter((f) => !["CLOSED", "REJECTED"].includes(f.status))
              .length,
          ],
        ].map(([label, value]) => (
          <div
            key={String(label)}
            className="rounded-lg bg-slate-100 dark:bg-slate-800 p-3 text-center"
          >
            <b className="block text-lg">{value}</b>
            <span className="text-[10px] text-slate-500">{label}</span>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        <select
          className={fieldClass}
          style={{ width: "auto" }}
          value={kind}
          onChange={(e) => setKind(e.target.value)}
        >
          <option value="ALL">All types</option>
          <option value="NCR">NCR</option>
          <option value="OBSERVATION">Observation</option>
        </select>
        <select
          className={fieldClass}
          style={{ width: "auto" }}
          value={session}
          onChange={(e) => setSession(e.target.value)}
        >
          <option value="ALL">All sessions (package-wide)</option>
          {sessions.map((s) => (
            <option key={s.id} value={s.id}>
              Session {s.session_number}
              {s.id === activeSessionId ? " - active" : ""}
            </option>
          ))}
        </select>
      </div>
      {visible.length === 0 ? (
        <div className="py-16 text-center text-sm text-slate-500">
          No NCR or Observation matches this filter.
        </div>
      ) : (
        visible.map((f) => (
          <article
            key={f.id}
            className={`rounded-lg border p-4 ${isDark ? "bg-slate-800/50 border-slate-700" : "bg-white border-slate-200"}`}
          >
            <div className="flex flex-wrap justify-between gap-2">
              <div className="flex flex-wrap gap-2 items-center">
                <b className="font-mono text-xs text-indigo-600">
                  {f.number || "Observation"}
                </b>
                <Badge tone={f.kind === "NCR" ? "danger" : "info"}>
                  {f.kind}
                </Badge>
                <Badge tone="slate">{f.classification.replace("_", " ")}</Badge>
                <Badge tone={f.status === "CLOSED" ? "emerald" : "warning"}>
                  {statusLabel[f.status]}
                </Badge>
                <Badge
                  tone={f.sessionId === activeSessionId ? "emerald" : "slate"}
                >
                  {sessionName(f.sessionId)}
                </Badge>
              </div>
            </div>
            <h3 className="mt-3 text-sm font-bold">{f.title}</h3>
            <p className="mt-1 text-xs text-slate-500 whitespace-pre-wrap">
              {f.description}
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 text-xs">
              {[
                [
                  "Equipment",
                  equipmentNames[f.equipmentId || ""] || f.equipmentId || "-",
                ],
                ["Method", f.inspectionMethod || "-"],
                ["Containment", f.immediateContainment || "-"],
                ["Corrective Action", f.correctiveAction || "-"],
              ].map(([l, v]) => (
                <div key={l}>
                  <small className="block uppercase text-slate-500">{l}</small>
                  {v}
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-2 mt-4">
              {!["CLOSED", "REJECTED"].includes(f.status) && (
                <Button size="sm" variant="secondary" onClick={() => edit(f)}>
                  Edit report
                </Button>
              )}
              {(nextStatus[f.status] || []).map((next) => (
                <Button
                  key={next}
                  size="sm"
                  variant="secondary"
                  disabled={busy === f.id}
                  onClick={() => transition(f, next)}
                >
                  {statusLabel[next]}
                </Button>
              ))}
              {canExport && (
                <Button
                  size="sm"
                  disabled={busy === f.id}
                  onClick={() => exportDocx(f)}
                >
                  Export DOCX
                </Button>
              )}
            </div>
          </article>
        ))
      )}
      {editing && (
        <section className="rounded-lg border border-slate-300 dark:border-slate-700 p-4 space-y-3">
          <div className="flex justify-between">
            <b>NCR / CAR / Close-out details</b>
            <button onClick={() => setEditing(undefined)}>Close</button>
          </div>
          <input
            className={fieldClass}
            value={draft.title || ""}
            onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            placeholder="Title"
          />
          <textarea
            className={fieldClass}
            value={draft.description || ""}
            onChange={(e) =>
              setDraft({ ...draft, description: e.target.value })
            }
            placeholder="Description"
          />
          <div className="grid md:grid-cols-2 gap-3">
            <textarea
              className={fieldClass}
              value={draft.evidence || ""}
              onChange={(e) => setDraft({ ...draft, evidence: e.target.value })}
              placeholder="Evidence"
            />
            <textarea
              className={fieldClass}
              value={draft.immediateContainment || ""}
              onChange={(e) =>
                setDraft({ ...draft, immediateContainment: e.target.value })
              }
              placeholder="Immediate containment"
            />
            <textarea
              className={fieldClass}
              value={draft.correctiveAction || ""}
              onChange={(e) =>
                setDraft({ ...draft, correctiveAction: e.target.value })
              }
              placeholder="Corrective action"
            />
            <textarea
              className={fieldClass}
              value={draft.verification || ""}
              onChange={(e) =>
                setDraft({ ...draft, verification: e.target.value })
              }
              placeholder="Verification"
            />
            <input
              className={fieldClass}
              value={draft.responsiblePerson || ""}
              onChange={(e) =>
                setDraft({ ...draft, responsiblePerson: e.target.value })
              }
              placeholder="Responsible person"
            />
            <input
              type="date"
              className={fieldClass}
              value={draft.targetCompletionDate || ""}
              onChange={(e) =>
                setDraft({ ...draft, targetCompletionDate: e.target.value })
              }
            />
            <select
              className={fieldClass}
              value={draft.closeoutDecision || ""}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  closeoutDecision: (e.target.value ||
                    undefined) as FindingUpdate["closeoutDecision"],
                })
              }
            >
              <option value="">Close-out decision</option>
              <option value="ACCEPTED_CLOSED">Accepted & Closed</option>
              <option value="REJECTED_NEW_NCR">Rejected - New NCR</option>
              <option value="CONDITIONALLY_ACCEPTED">
                Conditionally Accepted
              </option>
            </select>
            <input
              type="date"
              className={fieldClass}
              value={draft.closeoutDate || ""}
              onChange={(e) =>
                setDraft({ ...draft, closeoutDate: e.target.value })
              }
            />
          </div>
          <textarea
            className={fieldClass}
            value={draft.closeoutNote || ""}
            onChange={(e) =>
              setDraft({ ...draft, closeoutNote: e.target.value })
            }
            placeholder="Close-out note"
          />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setEditing(undefined)}>
              Cancel
            </Button>
            <Button disabled={busy === editing.id} onClick={save}>
              Save
            </Button>
          </div>
        </section>
      )}
    </div>
  );
}
