type Listener = (convId: string) => void;
let listener: Listener | null = null;
let convPendiente: string | null = null;

export const chatStore = {
  onActivar(fn: Listener) { listener = fn; },
  offActivar() { listener = null; },
  activar(convId: string) {
    convPendiente = convId;
    listener?.(convId);
  },
  consumirPendiente(): string | null {
    const v = convPendiente;
    convPendiente = null;
    return v;
  },
};
