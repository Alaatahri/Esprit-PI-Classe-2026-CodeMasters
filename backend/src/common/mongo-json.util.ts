/**
 * Convertit des documents Mongoose / BSON en données sérialisables JSON
 * (évite 500 si ObjectId, Buffer, types exotiques ou références circulaires).
 */
export function toPlainJson(value: unknown): unknown {
  const seen = new WeakSet<object>();

  function walk(v: unknown): unknown {
    if (v === null) return null;
    if (v === undefined) return undefined;
    const t = typeof v;
    if (t === 'string' || t === 'number' || t === 'boolean') return v;
    if (t === 'bigint') return v.toString();
    if (t === 'symbol' || t === 'function') return undefined;
    if (v instanceof Date) return v.toISOString();

    if (typeof Buffer !== 'undefined' && Buffer.isBuffer(v)) {
      return v.toString('base64');
    }

    // ObjectId BSON / Mongoose
    if (
      t === 'object' &&
      v !== null &&
      typeof (v as { toHexString?: () => string }).toHexString === 'function'
    ) {
      return String(v);
    }

    if (Array.isArray(v)) {
      return v.map((item) => walk(item));
    }

    if (t === 'object' && v !== null) {
      if (seen.has(v as object)) {
        return null;
      }
      seen.add(v as object);
      const o = v as Record<string, unknown>;
      const out: Record<string, unknown> = {};
      for (const k of Object.keys(o)) {
        const x = walk(o[k]);
        if (x !== undefined) {
          out[k] = x;
        }
      }
      return out;
    }

    return String(v);
  }

  return walk(value);
}
