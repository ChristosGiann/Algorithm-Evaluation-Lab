/** Binary min-heap with caller-defined ordering. */
export class MinHeap<T> {
  private readonly precedes: (a: T, b: T) => boolean;
  constructor(precedes: (a: T, b: T) => boolean) { this.precedes = precedes; }
  private entries: T[] = [];
  push(entry: T) {
    const items = this.entries;
    let index = items.length;
    items.push(entry);
    while (index > 0) {
      const parent = Math.floor((index - 1) / 2);
      if (!this.precedes(entry, items[parent])) break;
      items[index] = items[parent];
      index = parent;
    }
    items[index] = entry;
  }
  pop(): T | undefined {
    const items = this.entries;
    const first = items[0];
    const last = items.pop();
    if (items.length && last !== undefined) {
      let index = 0;
      while (index * 2 + 1 < items.length) {
        let child = index * 2 + 1;
        if (child + 1 < items.length && this.precedes(items[child + 1], items[child])) child++;
        if (!this.precedes(items[child], last)) break;
        items[index] = items[child];
        index = child;
      }
      items[index] = last;
    }
    return first;
  }
}
