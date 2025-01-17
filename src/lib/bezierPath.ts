import { path as snapPath } from 'snapsvg-cjs';

const SAMPLE_SPACING = 2;

const _ = {
  times: (n: number) => Array.from(new Array(n)).map((_, index) => index),
};

type Point = {
  x: number;
  y: number;
};

class BezierSegment {
  A: Point;
  B: Point;
  C: Point;
  D: Point;
  _totalLength: number;

  constructor(A: Point, B: Point, C: Point, D: Point) {
    this.A = A;
    this.B = B;
    this.C = C;
    this.D = D;
    this._totalLength = -1;
  }

  tangentAtParameter(parameter: number) {
    const t = Math.max(0, Math.min(1, parameter)); // clamp to [0, 1]
    const adjustedT = 1 - t;
    const x =
      3 * this.D.x * t ** 2 -
      3 * this.C.x * t ** 2 +
      6 * this.C.x * adjustedT * t -
      6 * this.B.x * adjustedT * t +
      3 * this.B.x * adjustedT ** 2 -
      3 * this.A.x * adjustedT ** 2;

    const y =
      3 * this.D.y * t ** 2 -
      3 * this.C.y * t ** 2 +
      6 * this.C.y * adjustedT * t -
      6 * this.B.y * adjustedT * t +
      3 * this.B.y * adjustedT ** 2 -
      3 * this.A.y * adjustedT ** 2;

    return { x, y };
  }

  pointAtParameter(parameter: number) {
    const t = Math.max(0, Math.min(1, parameter)); // clamp to [0, 1]
    return {
      x:
        (1 - t) ** 3 * this.A.x +
        3 * (1 - t) ** 2 * t * this.B.x +
        3 * (1 - t) * t ** 2 * this.C.x +
        t ** 3 * this.D.x,
      y:
        (1 - t) ** 3 * this.A.y +
        3 * (1 - t) ** 2 * t * this.B.y +
        3 * (1 - t) * t ** 2 * this.C.y +
        t ** 3 * this.D.y,
    };
  }

  getTotalLength() {
    if (this._totalLength === -1) {
      const initialSamples = Math.max(
        10,
        Math.ceil(
          (Math.hypot(this.B.x - this.A.x, this.B.y - this.A.y) +
            Math.hypot(this.C.x - this.B.x, this.C.y - this.B.y) +
            Math.hypot(this.D.x - this.C.x, this.D.y - this.C.y)) /
            SAMPLE_SPACING,
        ),
      );
      const pts = _.times(initialSamples).map((i) => this.pointAtParameter(i / (initialSamples - 1)));
      let total = 0;
      for (let i = 1; i < pts.length; i++) {
        total += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
      }
      this._totalLength = total;
    }

    return this._totalLength;
  }
}

export class BezierPath {
  segments: BezierSegment[];
  samples: {
    dist: number;
    pt: Point;
    tan: Point;
    segIdx: number;
    t: number;
  }[];
  _totalLength: number;

  constructor(segments: BezierSegment[]) {
    this.segments = segments;
    this.samples = [];

    const segmentLengths = segments.map((s) => s.getTotalLength());
    const segmentOffsets = [0];
    for (let i = 1; i < segmentLengths.length; i++) {
      segmentOffsets.push(segmentOffsets[i - 1] + segmentLengths[i - 1]);
    }
    this._totalLength = segmentOffsets[segmentOffsets.length - 1] + segmentLengths[segmentLengths.length - 1];

    const numSamples = Math.max(10, Math.ceil(this._totalLength / SAMPLE_SPACING));
    const stepSize = 1 / numSamples / 10;

    const avgDist = this._totalLength / numSamples;
    this.samples.push({
      dist: 0,
      pt: this.segments[0].A,
      tan: this.segments[0].tangentAtParameter(0),
      segIdx: 0,
      t: 0,
    });
    segments.forEach((seg, segIdx) => {
      const numSegSamples = Math.max(1, Math.round(numSamples * (seg.getTotalLength() / this._totalLength)));

      // Include one extra point at the end at t = 1
      const ts = _.times(numSegSamples + 1).map((i) => i / numSegSamples);
      const pts = ts.map((t) => seg.pointAtParameter(t));
      let dists: number[];
      for (let it = 0; it < 4; it++) {
        dists = _.times(numSegSamples).map((i) =>
          Math.hypot(pts[i + 1].x - pts[i].x, pts[i + 1].y - pts[i].y),
        );
        const distErrors = dists.map((d) => d - avgDist);
        let offset = 0;
        for (let i = 1; i < ts.length - 1; i++) {
          // Shift this t value to get closer to the target length
          offset += distErrors[i - 1];
          ts[i] -= stepSize * offset;

          // Sample the point at the new t value
          pts[i] = seg.pointAtParameter(ts[i]);
        }
      }

      let lastOffset = 0;
      pts.slice(1).forEach((pt, i) => {
        lastOffset += dists[i];
        this.samples.push({
          dist: segmentOffsets[segIdx] + lastOffset,
          pt,
          tan: this.segments[segIdx].tangentAtParameter(ts[i + 1]),
          segIdx,
          t: ts[i + 1],
        });
      });
    });
  }

  getTotalLength() {
    return this._totalLength;
  }

  findClosestSampleIdx(dist: number) {
    // Binary search to find the sample with the closest dist
    let lo = 0;
    let hi = this.samples.length - 1;

    while (lo < hi) {
      const mid = Math.floor((lo + hi) / 2);

      if (this.samples[mid].dist > dist) {
        hi = mid - 1;
      } else if (this.samples[mid].dist < dist) {
        lo = mid + 1;
      } else {
        return mid;
      }
    }

    return Math.max(0, Math.min(this.samples.length - 1, Math.floor((lo + hi) / 2)));
  }

  getPointAtLength(length: number, approximate?: number) {
    if (length <= 0) return this.samples[0].pt;
    if (length >= this._totalLength) return this.samples[this.samples.length - 1].pt;

    const idxA = this.findClosestSampleIdx(length);
    const idxB =
      this.samples[idxA].dist < length ? Math.min(idxA + 1, this.samples.length - 1) : Math.max(0, idxA - 1);
    const sampleDelta = this.samples[idxB].dist - this.samples[idxA].dist;
    const mix = sampleDelta && (length - this.samples[idxA].dist) / sampleDelta;

    if (approximate || this.samples[idxA].segIdx !== this.samples[idxB].segIdx) {
      // We have a set of evenly spaced samples that are close enough together
      // that we can probably just linearly interpolate between them without
      // too much loss of quality
      const x = (1 - mix) * this.samples[idxA].pt.x + mix * this.samples[idxB].pt.x;
      const y = (1 - mix) * this.samples[idxA].pt.y + mix * this.samples[idxB].pt.y;
      return { x, y };
    }
    // Find the t value between the two samples. This is not EXACTLY the point
    // at the target distance along the path, but it's so close that it
    // is effectively the same
    const segment = this.segments[this.samples[idxA].segIdx];
    const t = (1 - mix) * this.samples[idxA].t + mix * this.samples[idxB].t;
    return segment.pointAtParameter(t);
  }
}

export const bezierFromPath = (path: string) => {
  const commands = snapPath.toCubic(path);
  let lastPoint = { x: commands[0][1], y: commands[0][2] };
  commands.shift();
  const segments = [];
  while (commands.length > 0) {
    const command = commands.shift();
    segments.push(
      new BezierSegment(
        lastPoint,
        { x: command[1], y: command[2] },
        { x: command[3], y: command[4] },
        { x: command[5], y: command[6] },
      ),
    );
    lastPoint = { x: command[5], y: command[6] };
  }
  return segments.length ? new BezierPath(segments) : null;
};
