// Adapted from HaardhikK/Alvalta, master. See SOURCE.md.
export const SPINE_SLICES = 64;
export const DEFORM_BANDS = 96;
const RIBBED_FAN_AXIS = -73.2 * Math.PI / 180;
const MAX_BODY_TWIST = 1.9;
function wrapAngle(angle) {
    return Math.atan2(Math.sin(angle), Math.cos(angle));
}
export const ANATOMY = {
    ribbed: {
        coordinate: "axis",
        headBand: 0.12,
        follow: 0.16,
        followLagSeconds: 6,
        wave: 0.234,
        wavelength: 1.15,
        waveRate: 0.13,
        rampStart: 0.10,
        tipRelease: 0,
        swayLimit: 0.28,
        pathFollow: 0
    },
    filament: {
        coordinate: "index",
        headBand: 0.03,
        follow: 0.34,
        followLagSeconds: 9,
        wave: 0.326,
        wavelength: 1.0,
        waveRate: 0.20,
        rampStart: 0.08,
        tipRelease: 0,
        swayLimit: 0.30,
        pathFollow: 0
    },
    arc: {
        coordinate: "index",
        headBand: 0.03,
        follow: 0.42,
        followLagSeconds: 30,
        wave: 0.11,
        wavelength: 1.1,
        waveRate: 0.18,
        rampStart: 0.44,
        tipRelease: 0,
        swayLimit: 0.18,
        pathFollow: 0
    },
    veil: {
        coordinate: "index",
        headBand: 0.03,
        follow: 0.30,
        followLagSeconds: 8,
        wave: 0.22,
        wavelength: 0.95,
        waveRate: 0.24,
        rampStart: 0.06,
        tipRelease: 0.55,
        swayLimit: 0.26,
        pathFollow: 0.34
    },
    skull: {
        coordinate: "axis",
        headBand: 0.10,
        follow: 0,
        followLagSeconds: 1,
        wave: 0,
        wavelength: 1,
        waveRate: 0,
        rampStart: 1,
        tipRelease: 0,
        swayLimit: 0,
        pathFollow: 0
    }
};
function clamp01(value) {
    return Math.max(0, Math.min(1, value));
}
function smoothstep(edge0, edge1, value) {
    const t = clamp01((value - edge0) / Math.max(1e-6, edge1 - edge0));
    return t * t * (3 - 2 * t);
}
export class BodyField {
    definition;
    envelope;
    points;
    canonicalX;
    canonicalY;
    longitudinal;
    deformX = new Float32Array(DEFORM_BANDS);
    deformY = new Float32Array(DEFORM_BANDS);
    halfWidth = new Float32Array(DEFORM_BANDS);
    bandBehind = new Float32Array(DEFORM_BANDS);
    bandCentreX = new Float32Array(DEFORM_BANDS);
    bandCentreY = new Float32Array(DEFORM_BANDS);
    bandAngle = new Float32Array(DEFORM_BANDS);
    pathX = new Float32Array(DEFORM_BANDS);
    pathY = new Float32Array(DEFORM_BANDS);
    pathAngle = new Float32Array(DEFORM_BANDS);
    waveX = new Float32Array(DEFORM_BANDS);
    waveY = new Float32Array(DEFORM_BANDS);
    routeReach = 0;
    worldX = new Float32Array(SPINE_SLICES);
    worldY = new Float32Array(SPINE_SLICES);
    anatomy;
    count = 0;
    centre = {
        x: 0,
        y: 0
    };
    forwardAxisAngle = 0;
    longitudinalSpan = 1;
    headAnchorRawX = 0;
    headAnchorRawY = 0;
    generatedPhase = Number.NaN;
    headBandCount = 0;
    profileReady = false;
    poseX = 0;
    poseY = 0;
    poseCos = 1;
    poseSin = 0;
    poseScale = 1;
    constructor(definition, envelope, referencePhase = 0){
        this.definition = definition;
        this.envelope = envelope;
        this.points = new Float32Array(definition.attemptedSamples * 2);
        this.canonicalX = new Float32Array(definition.attemptedSamples);
        this.canonicalY = new Float32Array(definition.attemptedSamples);
        this.longitudinal = new Float32Array(definition.attemptedSamples);
        this.anatomy = ANATOMY[definition.id];
        this.advance(referencePhase);
        this.profileReady = true;
        this.rebuildProfile();
        this.setPose(0, 0, 0, 1);
    }
    advance(phase) {
        this.advanceIfNeeded(phase);
    }
    advanceIfNeeded(phase) {
        if (phase === this.generatedPhase) return false;
        this.generatedPhase = phase;
        this.count = this.definition.generate(phase, this.points);
        if (this.count === 0) {
            this.centre.x = 0;
            this.centre.y = 0;
            return true;
        }
        this.headBandCount = Math.max(1, Math.floor(this.count * this.anatomy.headBand));
        this.measureAnchors();
        this.rebuildCanonical();
        if (this.profileReady) this.rebuildProfile();
        return true;
    }
    measureAnchors() {
        let centreX = 0;
        let centreY = 0;
        for(let point = 0; point < this.count; point += 1){
            centreX += this.points[point * 2];
            centreY += this.points[point * 2 + 1];
        }
        centreX /= this.count;
        centreY /= this.count;
        let headX = 0;
        let headY = 0;
        if (this.anatomy.coordinate === "index") {
            for(let point = 0; point < this.headBandCount; point += 1){
                headX += this.points[point * 2];
                headY += this.points[point * 2 + 1];
            }
            headX /= this.headBandCount;
            headY /= this.headBandCount;
        } else {
            const cosine = Math.cos(RIBBED_FAN_AXIS);
            const sine = Math.sin(RIBBED_FAN_AXIS);
            let mean = 0;
            for(let point = 0; point < this.count; point += 1){
                mean += (this.points[point * 2] - centreX) * cosine + (this.points[point * 2 + 1] - centreY) * sine;
            }
            mean /= this.count;
            let variance = 0;
            for(let point = 0; point < this.count; point += 1){
                const offset = (this.points[point * 2] - centreX) * cosine + (this.points[point * 2 + 1] - centreY) * sine - mean;
                variance += offset * offset;
            }
            const deviation = Math.sqrt(variance / this.count) || 1;
            let weightSum = 0;
            for(let point = 0; point < this.count; point += 1){
                const z = ((this.points[point * 2] - centreX) * cosine + (this.points[point * 2 + 1] - centreY) * sine - mean) / deviation;
                const weight = smoothstep(0.6, 2, z);
                if (weight <= 0) continue;
                headX += this.points[point * 2] * weight;
                headY += this.points[point * 2 + 1] * weight;
                weightSum += weight;
            }
            if (weightSum < 1e-6) {
                headX = centreX;
                headY = centreY;
            } else {
                headX /= weightSum;
                headY /= weightSum;
            }
        }
        this.headAnchorRawX = headX;
        this.headAnchorRawY = headY;
        this.centre.x = (centreX - headX) / this.envelope.radius;
        this.centre.y = (centreY - headY) / this.envelope.radius;
        const span = Math.hypot(this.centre.x, this.centre.y);
        if (span > 1e-3) {
            this.forwardAxisAngle = Math.atan2(-this.centre.y, -this.centre.x);
        }
    }
    rebuildCanonical() {
        const radius = this.envelope.radius;
        for(let point = 0; point < this.count; point += 1){
            this.canonicalX[point] = (this.points[point * 2] - this.headAnchorRawX) / radius;
            this.canonicalY[point] = (this.points[point * 2 + 1] - this.headAnchorRawY) / radius;
        }
    }
    rebuildProfile() {
        const last = Math.max(1, this.count - 1);
        if (this.anatomy.coordinate === "index") {
            for(let point = 0; point < this.count; point += 1){
                this.longitudinal[point] = point / last;
            }
        } else {
            const cosine = Math.cos(this.forwardAxisAngle);
            const sine = Math.sin(this.forwardAxisAngle);
            let highest = -Infinity;
            let lowest = Infinity;
            for(let point = 0; point < this.count; point += 1){
                const projection = this.canonicalX[point] * cosine + this.canonicalY[point] * sine;
                this.longitudinal[point] = projection;
                if (projection > highest) highest = projection;
                if (projection < lowest) lowest = projection;
            }
            const span = Math.max(1e-6, highest - lowest);
            for(let point = 0; point < this.count; point += 1){
                this.longitudinal[point] = clamp01((highest - this.longitudinal[point]) / span);
            }
        }
        const bandX = new Float64Array(DEFORM_BANDS);
        const bandY = new Float64Array(DEFORM_BANDS);
        const tally = new Uint32Array(DEFORM_BANDS);
        for(let point = 0; point < this.count; point += 1){
            const band = Math.min(DEFORM_BANDS - 1, Math.max(0, Math.round(this.longitudinal[point] * (DEFORM_BANDS - 1))));
            bandX[band] += this.canonicalX[point];
            bandY[band] += this.canonicalY[point];
            tally[band] += 1;
        }
        for(let band = 0; band < DEFORM_BANDS; band += 1){
            const divisor = Math.max(1, tally[band]);
            bandX[band] /= divisor;
            bandY[band] /= divisor;
        }
        for(let band = 1; band < DEFORM_BANDS; band += 1){
            if (tally[band] === 0) {
                bandX[band] = bandX[band - 1];
                bandY[band] = bandY[band - 1];
            }
        }
        smoothBand(bandX, 4);
        smoothBand(bandY, 4);
        for(let band = 0; band < DEFORM_BANDS; band += 1){
            this.bandCentreX[band] = bandX[band];
            this.bandCentreY[band] = bandY[band];
        }
        for(let band = 0; band < DEFORM_BANDS; band += 1){
            const before = Math.max(0, band - 1);
            const after = Math.min(DEFORM_BANDS - 1, band + 1);
            this.bandAngle[band] = Math.atan2(bandY[before] - bandY[after], bandX[before] - bandX[after]);
        }
        const cosine = Math.cos(this.forwardAxisAngle);
        const sine = Math.sin(this.forwardAxisAngle);
        let behind = 0;
        for(let band = 0; band < DEFORM_BANDS; band += 1){
            const depth = -(bandX[band] * cosine + bandY[band] * sine);
            behind = Math.max(behind, depth);
            this.bandBehind[band] = behind;
        }
        smoothBand(this.bandBehind, 3);
        this.longitudinalSpan = Math.max(0.2, this.bandBehind[DEFORM_BANDS - 1]);
        const squares = new Float64Array(DEFORM_BANDS);
        for(let point = 0; point < this.count; point += 1){
            const band = Math.min(DEFORM_BANDS - 1, Math.max(0, Math.round(this.longitudinal[point] * (DEFORM_BANDS - 1))));
            const before = Math.max(0, band - 1);
            const after = Math.min(DEFORM_BANDS - 1, band + 1);
            const angle = Math.atan2(bandY[after] - bandY[before], bandX[after] - bandX[before]);
            const across = -(this.canonicalX[point] - bandX[band]) * Math.sin(angle) + (this.canonicalY[point] - bandY[band]) * Math.cos(angle);
            squares[band] += across * across;
        }
        for(let band = 0; band < DEFORM_BANDS; band += 1){
            this.halfWidth[band] = Math.max(0.04, Math.sqrt(squares[band] / Math.max(1, tally[band])));
        }
        smoothBand(this.halfWidth, 3);
    }
    setPose(headX, headY, heading, scale) {
        const rotation = heading - this.forwardAxisAngle;
        this.poseX = headX;
        this.poseY = headY;
        this.poseCos = Math.cos(rotation);
        this.poseSin = Math.sin(rotation);
        this.poseScale = scale;
    }
    setDeformation(sourceX, sourceY) {
        this.deformX.set(sourceX);
        this.deformY.set(sourceY);
        smoothBand(this.deformX, 2);
        smoothBand(this.deformY, 2);
        const limit = this.anatomy.swayLimit * this.longitudinalSpan * this.poseScale;
        for(let band = 0; band < DEFORM_BANDS; band += 1){
            const length = Math.hypot(this.deformX[band], this.deformY[band]);
            if (length > limit && length > 1e-9) {
                const shrink = limit / length;
                this.deformX[band] *= shrink;
                this.deformY[band] *= shrink;
            }
        }
        const step = this.longitudinalSpan * this.poseScale / (DEFORM_BANDS - 1);
        const maximumSlope = 1.6;
        for(let band = 1; band < DEFORM_BANDS; band += 1){
            const dx = this.deformX[band] - this.deformX[band - 1];
            const dy = this.deformY[band] - this.deformY[band - 1];
            const length = Math.hypot(dx, dy);
            const limit = maximumSlope * step;
            if (length > limit && length > 1e-9) {
                const shrink = limit / length;
                this.deformX[band] = this.deformX[band - 1] + dx * shrink;
                this.deformY[band] = this.deformY[band - 1] + dy * shrink;
            }
        }
        this.rebuildHitPath();
    }
    setPath(x, y, angle, waveX, waveY) {
        this.pathX.set(x);
        this.pathY.set(y);
        this.waveX.set(waveX);
        this.waveY.set(waveY);
        const head = angle[0];
        let running = head;
        for(let band = 0; band < DEFORM_BANDS; band += 1){
            running += wrapAngle(angle[band] - running);
            this.pathAngle[band] = head + Math.max(-MAX_BODY_TWIST, Math.min(MAX_BODY_TWIST, running - head));
        }
        smoothBand(this.pathAngle, 2);
        smoothBand(this.pathX, 1);
        smoothBand(this.pathY, 1);
    }
    displacement(u, out) {
        const position = clamp01(u) * (DEFORM_BANDS - 1);
        const band = Math.min(DEFORM_BANDS - 2, Math.floor(position));
        const mix = position - band;
        out[0] = this.deformX[band] + (this.deformX[band + 1] - this.deformX[band]) * mix;
        out[1] = this.deformY[band] + (this.deformY[band + 1] - this.deformY[band]) * mix;
    }
    projectPoint(index, scale) {
        this.projectInto(index, scale, projected);
        return [
            projected[0],
            projected[1]
        ];
    }
    projectInto(index, _scale, out) {
        const u = clamp01(this.longitudinal[index] ?? 0);
        const x = this.canonicalX[index];
        const y = this.canonicalY[index];
        this.displacement(u, scratch);
        const rigidX = this.poseX + this.poseScale * (x * this.poseCos - y * this.poseSin) + scratch[0];
        const rigidY = this.poseY + this.poseScale * (x * this.poseSin + y * this.poseCos) + scratch[1];
        const blend = this.anatomy.pathFollow * smoothstep(0, 0.5, u);
        if (blend <= 1e-4) {
            out[0] = rigidX;
            out[1] = rigidY;
            return;
        }
        const position = u * (DEFORM_BANDS - 1);
        const band = Math.min(DEFORM_BANDS - 2, Math.floor(position));
        const mix = position - band;
        const turn = this.pathAngle[band] + (this.pathAngle[band + 1] - this.pathAngle[band]) * mix - (this.bandAngle[band] + (this.bandAngle[band + 1] - this.bandAngle[band]) * mix);
        const cosine = Math.cos(turn);
        const sine = Math.sin(turn);
        const centreX = this.bandCentreX[band] + (this.bandCentreX[band + 1] - this.bandCentreX[band]) * mix;
        const centreY = this.bandCentreY[band] + (this.bandCentreY[band + 1] - this.bandCentreY[band]) * mix;
        const offsetX = x - centreX;
        const offsetY = y - centreY;
        const followX = this.pathX[band] + (this.pathX[band + 1] - this.pathX[band]) * mix + this.poseScale * (offsetX * cosine - offsetY * sine) + (this.waveX[band] + (this.waveX[band + 1] - this.waveX[band]) * mix);
        const followY = this.pathY[band] + (this.pathY[band + 1] - this.pathY[band]) * mix + this.poseScale * (offsetX * sine + offsetY * cosine) + (this.waveY[band] + (this.waveY[band + 1] - this.waveY[band]) * mix);
        out[0] = rigidX + (followX - rigidX) * blend;
        out[1] = rigidY + (followY - rigidY) * blend;
    }
    rebuildHitPath() {
        for(let slice = 0; slice < SPINE_SLICES; slice += 1){
            const u = slice / (SPINE_SLICES - 1);
            const band = Math.min(DEFORM_BANDS - 1, Math.round(u * (DEFORM_BANDS - 1)));
            const x = this.bandCentreX[band];
            const y = this.bandCentreY[band];
            this.displacement(u, scratch);
            const rigidX = this.poseX + this.poseScale * (x * this.poseCos - y * this.poseSin) + scratch[0];
            const rigidY = this.poseY + this.poseScale * (x * this.poseSin + y * this.poseCos) + scratch[1];
            const blend = this.anatomy.pathFollow * smoothstep(0, 0.5, u);
            this.worldX[slice] = rigidX + (this.pathX[band] + this.waveX[band] - rigidX) * blend;
            this.worldY[slice] = rigidY + (this.pathY[band] + this.waveY[band] - rigidY) * blend;
        }
    }
    distanceToSpine(x, y, scale) {
        let best = Infinity;
        for(let slice = 0; slice < SPINE_SLICES; slice += 1){
            const band = Math.min(DEFORM_BANDS - 1, Math.round(slice / (SPINE_SLICES - 1) * (DEFORM_BANDS - 1)));
            const distance = Math.hypot(x - this.worldX[slice], y - this.worldY[slice]) - this.halfWidth[band] * scale;
            best = Math.min(best, distance);
        }
        return best;
    }
    closestSpinePoint(other) {
        let distance = Infinity;
        let firstX = this.worldX[0];
        let firstY = this.worldY[0];
        let secondX = other.worldX[0];
        let secondY = other.worldY[0];
        for(let first = 0; first < SPINE_SLICES; first += 4){
            for(let second = 0; second < SPINE_SLICES; second += 4){
                const nextDistance = Math.hypot(this.worldX[first] - other.worldX[second], this.worldY[first] - other.worldY[second]);
                if (nextDistance < distance) {
                    distance = nextDistance;
                    firstX = this.worldX[first];
                    firstY = this.worldY[first];
                    secondX = other.worldX[second];
                    secondY = other.worldY[second];
                }
            }
        }
        return {
            distance,
            firstX,
            firstY,
            secondX,
            secondY
        };
    }
}
const scratch = [
    0,
    0
];
const projected = new Float64Array(2);
function smoothBand(values, passes) {
    const next = new Float64Array(values.length);
    for(let pass = 0; pass < passes; pass += 1){
        next.set(values);
        for(let at = 1; at < values.length - 1; at += 1){
            next[at] = (values[at - 1] + values[at] * 2 + values[at + 1]) / 4;
        }
        values.set(next);
    }
}
export { smoothstep };
