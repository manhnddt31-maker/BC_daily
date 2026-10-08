import type { BulletinNarrative } from "../lib/types";
import { DEFAULT_BULLETIN_NARRATIVE } from "../lib/narrative-editor-state";

export function NarrativePanel({ narrative }: { narrative: BulletinNarrative | null }) {
  const conclusion = narrative?.conclusion ?? DEFAULT_BULLETIN_NARRATIVE.conclusion;
  const action = narrative?.action ?? DEFAULT_BULLETIN_NARRATIVE.action;
  return <section className="panel conclusion-panel"><h2><span aria-hidden="true">▤</span>KẾT LUẬN</h2><div className="narrative"><p>{conclusion}</p><p><strong>HÀNH ĐỘNG: </strong>{action}</p></div></section>;
}
