export enum Cell {
  Unknown = 0,
  Free = 1,
  Wall = 2,
}

/** The robot's own belief about the world — built up entirely from what its
 * sensor has swept, never from the ground-truth map. */
export class OccupancyGrid {
  readonly width: number;
  readonly height: number;
  private cells: Uint8Array;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.cells = new Uint8Array(width * height).fill(Cell.Unknown);
  }

  inBounds(x: number, y: number): boolean {
    return x >= 0 && y >= 0 && x < this.width && y < this.height;
  }

  get(x: number, y: number): Cell {
    if (!this.inBounds(x, y)) return Cell.Wall;
    return this.cells[y * this.width + x] as Cell;
  }

  set(x: number, y: number, value: Cell): void {
    if (!this.inBounds(x, y)) return;
    this.cells[y * this.width + x] = value;
  }

  countByState(state: Cell): number {
    let count = 0;
    for (let i = 0; i < this.cells.length; i++) {
      if (this.cells[i] === state) count++;
    }
    return count;
  }
}
