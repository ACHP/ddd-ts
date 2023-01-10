export class Collection {
  constructor(
    private data: Map<string, { savedAt: number; data: any }> = new Map()
  ) {}

  clear() {
    this.data.clear();
  }

  getLatestSnapshot(id: string) {
    const data = [...this.data.values()];
    const sameId = data.filter((d) => d.data.id === id);
    const sorted = sameId.sort((a, b) => b.savedAt - a.savedAt);
    return sorted[0].data;
  }

  clone() {
    const clone = new Map();
    for (const [key, value] of this.data) {
      clone.set(key, value);
    }
    return new Collection(clone);
  }

  merge(other: Collection) {
    const merge = new Map();
    for (const [key, value] of this.data) {
      merge.set(key, value);
    }
    for (const [key, value] of other.data) {
      merge.set(key, value);
    }
    return new Collection(merge);
  }

  delete(id: string): void {
    this.data.delete(id);
  }

  get(id: string): any {
    return this.data.get(id)?.data;
  }

  getAll(): any[] {
    return [...this.data.entries()].map(([id, data]) => data.data);
  }

  save(id: string, data: any): void {
    const now = process.hrtime();
    const total = now[0] * 1e9 + now[1];
    this.data.set(id, { savedAt: total, data });
  }

  toPretty() {
    return [...this.data.entries()]
      .map(([id, data]) => {
        return `\t\t"${id}": ${JSON.stringify(data.data)}`;
      })
      .join(",\n");
  }
}
