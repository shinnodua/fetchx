// Keep a drag's release click from activating the row underneath it.
export const createPointerClickGuard = () => {
  let origin = { x: 0, y: 0 };
  let dragged = false;
  return {
    start(x: number, y: number) {
      origin = { x, y };
      dragged = false;
    },
    move(x: number, y: number) {
      dragged ||= Math.hypot(x - origin.x, y - origin.y) >= 5;
      return dragged;
    },
    cancel() {
      dragged = true;
    },
    consumeClick() {
      const suppressed = dragged;
      dragged = false;
      return suppressed;
    },
  };
};
