export interface RequestWorkflowData {
  editVersion?: number; assignedTo?: string | null; assignedName?: string;
  history?: Array<{ actorName?: string; at: string; status: string; previousStatus?: string; assignedName?: string; changes: string[] }>;
}
