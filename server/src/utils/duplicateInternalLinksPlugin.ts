import type { Schema } from 'mongoose';
import { assertNoDuplicateInternalLinks } from './duplicateInternalLinks';

/** Apply the update shapes used by the content APIs to a complete snapshot.
 * Whole-object $set replaces that object; dotted $set changes just that leaf.
 * Reject unsupported shapes rather than silently validate the wrong document.
 */
export function applyContentUpdate(existing: Record<string, any>, update: Record<string, any>, inserting = false): Record<string, any> {
  if (Array.isArray(update)) throw new Error('Content updates must use fields or $set, not an update pipeline.');
  const result = JSON.parse(JSON.stringify(existing));
  function set(path: string, value: unknown, unset = false) {
    const parts = path.split('.');
    if (parts.some((part) => part.startsWith('$') || ['__proto__', 'constructor', 'prototype'].includes(part))) {
      throw new Error('Content updates must use explicit field and array index paths.');
    }
    let current = result;
    for (let index = 0; index < parts.length - 1; index++) {
      const part = parts[index];
      if (!current[part] || typeof current[part] !== 'object') {
        current[part] = /^\d+$/.test(parts[index + 1]) ? [] : {};
      }
      current = current[part];
    }
    if (unset) delete current[parts[parts.length - 1]];
    else current[parts[parts.length - 1]] = value;
  }
  for (const [operator, fields] of Object.entries(update)) {
    if (!operator.startsWith('$')) { set(operator, fields); continue; }
    if (operator === '$setOnInsert' && !inserting) continue;
    if (!['$set', '$unset', '$setOnInsert', '$inc', '$currentDate'].includes(operator)) {
      throw new Error(`Unsupported content update ${operator}; submit the resulting field using $set.`);
    }
    for (const [path, value] of Object.entries(fields as Record<string, unknown>)) {
      // These operators cannot introduce anchors into text. Still validate the
      // unchanged HTML along with the rest of the document below.
      if (operator === '$inc' || operator === '$currentDate') continue;
      set(path, value, operator === '$unset');
    }
  }
  return result;
}

/** Register AFTER the HTML sanitizer hooks, before compiling the model. */
export function duplicateInternalLinksPlugin(schema: Schema): void {
  schema.pre('validate', function () {
    assertNoDuplicateInternalLinks(this.toObject({ depopulate: true }));
  });

  schema.pre(['findOneAndUpdate', 'updateOne', 'updateMany', 'replaceOne', 'findOneAndReplace'], async function (this: any) {
    const update = this.getUpdate();
    if (!update) return;
    const options = this.getOptions();
    const replacement = this.op === 'replaceOne' || this.op === 'findOneAndReplace';
    const query = this.model.find(this.getFilter()).session(options.session || null);
    if (this.op !== 'updateMany') query.limit(1);
    if (options.sort) query.sort(options.sort);
    const documents = await query.lean();
    if (!documents.length && options.upsert) {
      // MongoDB also seeds an upsert from equality fields in its filter.
      const equalityFields = Object.fromEntries(Object.entries(this.getFilter()).filter(([key, value]) =>
        !key.startsWith('$') && !(value && typeof value === 'object' && Object.keys(value).some((part) => part.startsWith('$')))
      ));
      const inserted = replacement ? update : applyContentUpdate(applyContentUpdate({}, equalityFields), update, true);
      assertNoDuplicateInternalLinks(new this.model(inserted).toObject({ depopulate: true }));
      return;
    }
    for (const existing of documents) {
      const candidate = replacement ? update : applyContentUpdate(existing, update, !existing._id);
      // Cast to the schema so the check sees the shape that is actually saved.
      const document = new this.model(candidate);
      assertNoDuplicateInternalLinks(document.toObject({ depopulate: true }));
    }
  });

  // insertMany runs validation by default, but lean insertMany skips it.
  schema.pre('insertMany', function (next: (err?: Error) => void, documents: any[]) {
    try {
      documents.forEach((document) => assertNoDuplicateInternalLinks(
        typeof document.toObject === 'function' ? document.toObject({ depopulate: true }) : document
      ));
      next();
    } catch (error) { next(error as Error); }
  });
}
