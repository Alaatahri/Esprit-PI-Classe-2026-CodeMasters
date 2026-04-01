/** Extrait un id Mongo depuis une ref string | { _id } | ObjectId sérialisé */
export function refId(ref: unknown): string {
  if (ref == null || ref === "") return "";
  if (typeof ref === "string") return ref;
  if (typeof ref === "object" && "_id" in (ref as object)) {
    const id = (ref as { _id: unknown })._id;
    return id != null ? String(id) : "";
  }
  return String(ref);
}
