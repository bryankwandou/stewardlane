"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AuditEvent, CommentaryDraft, Household, HouseholdTask, Role } from "@/lib/types";
type State = { role: Role; actor: string; walletAddress?: string; walletVerifiedAt?: string; households: Household[]; drafts: CommentaryDraft[]; audit: AuditEvent[]; tasks: HouseholdTask[]; setIdentity: (role: Role, actor: string) => void; setWallet: (address?: string) => void; addHousehold: (household: Household) => void; addDraft: (draft: CommentaryDraft, event: AuditEvent) => void; reviewDraft: (draftId: string, status: "approved" | "discarded", reviewed: string, event: AuditEvent) => void; addAudit: (event: AuditEvent) => void; addTask: (task: HouseholdTask) => void; toggleTask: (taskId: string) => void };
export const useStewardlane = create<State>()(persist((set) => ({
  role: "advisor", actor: "Advisor", households: [], drafts: [], audit: [], tasks: [],
  setIdentity: (role, actor) => set({ role, actor: actor.trim() || "Team member" }),
  setWallet: (walletAddress) => set({ walletAddress, walletVerifiedAt: walletAddress ? new Date().toISOString() : undefined }),
  addHousehold: (household) => set((state) => ({ households: [...state.households, household] })),
  addDraft: (draft, event) => set((state) => ({ drafts: [draft, ...state.drafts], audit: [event, ...state.audit] })),
  reviewDraft: (draftId, status, reviewed, event) => set((state) => ({ drafts: state.drafts.map((draft) => draft.id === draftId ? { ...draft, status, reviewed, reviewedAt: event.timestamp, reviewer: event.actor } : draft), audit: [event, ...state.audit] })),
  addAudit: (event) => set((state) => ({ audit: [event, ...state.audit] })),
  addTask: (task) => set((state) => ({ tasks: [task, ...state.tasks] })),
  toggleTask: (taskId) => set((state) => ({ tasks: state.tasks.map((task) => task.id === taskId ? { ...task, status: task.status === "open" ? "complete" : "open", completedAt: task.status === "open" ? new Date().toISOString() : undefined } : task) })),
}), { name: "stewardlane-mvp" }));
