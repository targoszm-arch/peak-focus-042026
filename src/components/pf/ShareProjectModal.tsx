import { ModalShell } from "./modals";
import CollaboratorManager from "./CollaboratorManager";
import type { ProjectFull } from "@/hooks/use-projects";

export default function ShareProjectModal({ project, onClose }: { project: ProjectFull; onClose: () => void }) {
  return (
    <ModalShell title={`Share "${project.name}"`} icon="Profile2userProperty1Linear" width={560} onClose={onClose} footer={
      <>
        <span style={{ flex: 1 }} />
        <button onClick={onClose} style={{ height: 40, padding: "0 16px", borderRadius: "var(--radius-md)", border: "none", background: "var(--primary-500)", color: "#fff", cursor: "pointer", fontFamily: "var(--font-sans)", fontSize: 13.5, fontWeight: 700 }}>
          Done
        </button>
      </>
    }>
      <CollaboratorManager projectId={project.id} />
    </ModalShell>
  );
}
