const eventTarget = new EventTarget()
const EVENT_NAME = 'data-changed'

export function notifyDataChanged(): void {
  eventTarget.dispatchEvent(new Event(EVENT_NAME))
}

export function subscribeDataChanged(listener: () => void): () => void {
  eventTarget.addEventListener(EVENT_NAME, listener)
  return () => eventTarget.removeEventListener(EVENT_NAME, listener)
}
