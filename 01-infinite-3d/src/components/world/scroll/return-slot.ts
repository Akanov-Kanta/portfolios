/**
 * Phone Back restore hand-off. restore.ts (loaded by the phone-only PhoneHud chunk, so no first-load
 * JS carries it) fills the slot when it loads; HomeLoop's layout effect runs it on every home mount,
 * synchronously in the commit that shows the home page again.
 */
export const returnSlot: { run: (() => void) | null } = { run: null };
