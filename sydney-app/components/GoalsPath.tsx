"use client";

import React, { useState, useEffect } from "react";

type GoalStepStatus = "todo" | "in-progress" | "done";

type GoalStep = {
  id: string;
  title: string;
  detail?: string;
  status: GoalStepStatus;
  order: number;
};

type GoalsPathData = {
  id: string;
  name: string;
  description?: string;
  steps: GoalStep[];
};

export function GoalsPath() {
  const [path, setPath] = useState<GoalsPathData | null>(null);
  const [editing, setEditing] = useState(false);
  const [draftSteps, setDraftSteps] = useState<GoalStep[]>([]);
  const [saving, setSaving] = useState(false);


  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/goals-path");
        if (!res.ok) return;
        const data = await res.json();
        const first =
          Array.isArray(data.paths) && data.paths.length > 0
            ? (data.paths[0] as GoalsPathData)
            : null;
        if (first) setPath(first);
      } catch (e) {
        console.error("Failed to load goals path", e);
      }
    }
    load();
  }, []);

  useEffect(() => {
    if (path) {
      const sorted = [...path.steps].sort((a, b) => a.order - b.order);
      setDraftSteps(sorted);
    }
  }, [path]);


  if (!path) {
    return (
      <div className="text-xs text-slate-700">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-9000">
          Goals path
        </p>
        <p className="mt-2 text-xs text-slate-700">No path defined yet.</p>
      </div>
    );
  }

  const steps = editing ? draftSteps : [...path.steps].sort((a, b) => a.order - b.order);

  const moveStep = (index: number, delta: number) => {
    setDraftSteps((prev) => {
      const next = [...prev];
      const newIndex = index + delta;
      if (newIndex < 0 || newIndex >= next.length) return prev;
      const [item] = next.splice(index, 1);
      next.splice(newIndex, 0, item);
      return next.map((s, idx) => ({ ...s, order: idx + 1 }));
    });
  };

  const updateStep = (index: number, patch: Partial<GoalStep>) => {
    setDraftSteps((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], ...patch } as GoalStep;
      return next;
    });
  };

  const savePath = async () => {
    if (!path) return;
    setSaving(true);
    try {
      const res = await fetch("/api/goals-path", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pathId: path.id,
          name: path.name,
          description: path.description,
          steps: draftSteps.map((s, idx) => ({
            ...s,
            order: idx + 1,
          })),
        }),
      });
      if (!res.ok) {
        console.error("Failed to save goals path");
      } else {
        const data = await res.json();
        const updated =
          Array.isArray(data.paths) && data.paths.length > 0
            ? (data.paths[0] as GoalsPathData)
            : null;
        if (updated) {
          setPath(updated);
          setEditing(false);
        }
      }
    } catch (e) {
      console.error("Error saving goals path", e);
    } finally {
      setSaving(false);
    }
  };

  const addStep = () => {
    setDraftSteps((prev) => {
      const nextOrder = prev.length + 1;
      const id = `step-${Date.now()}-${nextOrder}`;
      return [
        ...prev,
        {
          id,
          title: "New step",
          detail: "",
          status: "todo" as GoalStepStatus,
          order: nextOrder,
        },
      ];
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-9000">
            Goals path
          </p>
          <h2 className="mt-1 text-sm font-semibold text-slate-900">{path.name}</h2>
          {path.description && (
            <p className="mt-1 text-xs text-slate-700">{path.description}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={editing ? savePath : () => setEditing(true)}
            className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-[11px] font-medium text-white hover:bg-slate-800 disabled:opacity-60"
            disabled={saving}
          >
            {editing ? (saving ? "Saving..." : "Save") : "Edit"}
          </button>
          {editing && (
            <button
              type="button"
              onClick={() => {
                setEditing(false);
                const sorted = [...path.steps].sort((a, b) => a.order - b.order);
                setDraftSteps(sorted);
              }}
              className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-100"
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      <div className="mt-4 space-y-2">
        {steps.map((step, idx) => {
          const isLast = idx === steps.length - 1;
          return (
            <div key={step.id} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div
                  className={
                    "flex h-7 w-7 items-center justify-center rounded-full border text-xs font-semibold " +
                    (step.status === "done"
                      ? "border-emerald-400 bg-emerald-50 text-emerald-700"
                      : step.status === "in-progress"
                      ? "border-sky-400 bg-sky-50 text-sky-700"
                      : "border-slate-200 bg-white text-slate-500")
                  }
                >
                  {idx + 1}
                </div>
                {!isLast && <div className="mt-1 h-full w-px flex-1 bg-slate-200" />}
              </div>
              <div className="flex-1 pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    {editing ? (
                      <input
                        type="text"
                        className="w-full rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-900"
                        value={step.title}
                        onChange={(e) =>
                          updateStep(idx, { title: e.target.value })
                        }
                      />
                    ) : (
                      <p className="text-sm font-medium text-slate-900">{step.title}</p>
                    )}
                    {editing ? (
                      <textarea
                        className="mt-1 w-full rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-900"
                        rows={2}
                        value={step.detail || ""}
                        onChange={(e) =>
                          updateStep(idx, { detail: e.target.value })
                        }
                      />
                    ) : (
                      step.detail && (
                        <p className="mt-1 text-xs text-slate-700">{step.detail}</p>
                      )
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1 text-[11px]">
                    <span className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
                      Status
                    </span>
                    {editing ? (
                      <select
                        className="rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] text-slate-900"
                        value={step.status}
                        onChange={(e) =>
                          updateStep(idx, {
                            status: e.target.value as GoalStepStatus,
                          })
                        }
                      >
                        <option value="todo">Todo</option>
                        <option value="in-progress">In progress</option>
                        <option value="done">Done</option>
                      </select>
                    ) : (
                      <span className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
                        {step.status === "done"
                          ? "Done"
                          : step.status === "in-progress"
                          ? "In progress"
                          : "Next"}
                      </span>
                    )}
                    {editing && (
                      <div className="mt-1 flex gap-1">
                        <button
                          type="button"
                          onClick={() => moveStep(idx, -1)}
                          className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-white text-[11px] text-slate-600 hover:bg-slate-100"
                          aria-label="Move up"
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          onClick={() => moveStep(idx, 1)}
                          className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-white text-[11px] text-slate-600 hover:bg-slate-100"
                          aria-label="Move down"
                        >
                          ↓
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        {editing && (
          <button
            type="button"
            onClick={addStep}
            className="mt-3 inline-flex items-center rounded-full border border-dashed border-slate-300 bg-white px-3 py-1 text-[11px] font-medium text-slate-600 hover:bg-slate-50"
          >
            + Add step
          </button>
        )}
      </div>
    </div>
  );
}
