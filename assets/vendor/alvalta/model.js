// Adapted from HaardhikK/Alvalta, master. See SOURCE.md.
import { BodyField, DEFORM_BANDS, smoothstep, SPINE_SLICES } from "./body-field.js";
import envelopes from './envelopes.js';
export const PLATE_MIN = 0.16;
export const PLATE_MAX = 0.84;
export const PRESENCE_SCALE = 1.27 * 1.5;
const TAU = Math.PI * 2;
const SOURCE_FPS = 60;
const FIXED_STEP = 1 / 120;
export const MAX_SPEED = 0.03;
export const MAX_HEAD_TURN = 0.26;
const TARGET_TURN = 0.2;
const TARGET_REACHED = 0.055;
const SPEED_EASE_SECONDS = 1.4;
const ENCOUNTER_DISTANCE = 0.38;
const ENVELOPE_PADDING = 1.08;
const ENVELOPE_SAMPLE_TARGET = 2_500;
const REACH_PADDING = 1.03;
const HISTORY_PADDING = 0.08;
const HISTORY_KEEP = 1.2;
const EXTERIOR_LOW = 0.15;
const EXTERIOR_HIGH = 0.85;
const EDGE_MARGIN = 0.08;
const EDGE_RECOVERY = 0.06;
const EDGE_TURN_GAIN = 0.8;
const TURN_REFERENCE_LENGTH = 0.22;
const MIN_TURN_SHARE = 0.45;
const AIM_EASE_SECONDS = 1.1;
const TARGET_PATIENCE_SECONDS = 13;
const POSE_LAG_SECONDS = 1.6;
const TURN_EASE_SECONDS = 0.7;
const INTERIOR_MIN = 0.31;
const INTERIOR_MAX = 0.69;
const BASE_VISUAL_RADIUS = {
    ribbed: 0.13,
    filament: 0.13,
    skull: 0.145,
    arc: 0.125,
    veil: 0.125
};
export const SPECIMEN_SCALE = {
    ribbed: 1,
    filament: 1,
    skull: 1,
    arc: 1,
    veil: 1.2
};
const envelopeCache = new Map(Object.entries(envelopes));
function clamp(value, low, high) {
    return value < low ? low : value > high ? high : value;
}
function clamp01(value) {
    return clamp(value, 0, 1);
}
function wrapAngle(angle) {
    return Math.atan2(Math.sin(angle), Math.cos(angle));
}
export function depthScale(depth) {
    return 0.86 + clamp01(depth) * 0.22;
}
export function depthAlpha(depth) {
    return 0.68 + clamp01(depth) * 0.32;
}
export function scaledRadius(state) {
    return state.visualRadius * depthScale(state.depth);
}
export function bodyPoint(field, _envelope, state, index) {
    return field.projectPoint(index, scaledRadius(state));
}
export function bodyPointInto(field, _envelope, state, index, out) {
    field.projectInto(index, scaledRadius(state), out);
}
function pushPoint(target, count, x, y) {
    if (!Number.isFinite(x) || !Number.isFinite(y)) return count;
    target[count * 2] = x;
    target[count * 2 + 1] = y;
    return count + 1;
}
function generateRibbed(time, target) {
    let count = 0;
    for(let i = 19_999; i >= 0; i -= 1){
        const y = i / 500;
        const k = Math.cos(y * 1.3) * (y < 21.39 ? 37.05 : 38.67);
        const e = y / 8 - 3.39;
        const o = Math.hypot(k, e) / 9.09;
        const q = k * 2 + 107.85 + Math.cos(51.67 / k) + k * Math.cos(y / 4.43) * (1 + Math.sin(o * 1.53 - e * 2 - time));
        const c = o / 1.39 - e / 20 - time / 3.86 + i % 1 * 11.66;
        count = pushPoint(target, count, q * Math.sin(c) + 200, 200 + q * Math.cos(c) - 128.62 * Math.sin(c / 0.91));
    }
    return count;
}
function generateFilament(time, target, sampleStep = 3) {
    let count = 0;
    for(let i = 19_999; i >= 0; i -= sampleStep){
        const y = i / 500;
        const k = Math.cos(y * 3.79) * (y < 12.16 ? 18.88 : 10.75);
        const e = y / 8 - 11.93;
        const o = Math.hypot(k, e) / 5.95;
        const q = k * 2 + 65.9 + Math.cos(22.22 / k) + k * Math.cos(y / 1.6) * (1 + Math.sin(o * 3.54 - e * 2 - time));
        const c = o / 1.26 - e / 4.75 - time / 5.57 + i % 1 * 7.5;
        count = pushPoint(target, count, q * Math.sin(c) + 200, 200 + q * Math.cos(c) - 45.08 * Math.sin(c / 1.46));
    }
    return count;
}
function generateSkull(time, target) {
    let count = 0;
    for(let y = 100; y < 300; y += 1){
        for(let x = 100; x < 300; x += 1){
            const k = x / 8 - 25;
            const e = y / 8 - 25;
            const d = 5 * Math.cos(Math.hypot(k, e) / 3);
            count = pushPoint(target, count, (x + (d * k + k * 2 * Math.atan(9 * Math.cos(e * 2 - time / 2))) * Math.sin(d * 2.5 - time)) / 2 + 100, d * 13 + d * 3 * (3 + Math.cos(d * 3 - time)) + d * e + 200);
        }
    }
    return count;
}
function generateArc(time, target, sampleStep = 3) {
    let count = 0;
    for(let i = 19_999; i >= 0; i -= sampleStep){
        const y = i / 500;
        const k = Math.cos(y * 6.44) * (y < 3.96 ? 23.37 : 11.21);
        const e = y / 8 - 5.46;
        const o = Math.hypot(k, e) / 11.25;
        const q = k * 2 + 114.49 + Math.cos(2.08 / k) + k * Math.cos(y / 6.17) * (1 + Math.sin(o * 1.63 - e * 2 - time));
        const c = o / 6.98 - e / 8.14 - time / 14.24 + i % 1 * 23.13;
        count = pushPoint(target, count, q * Math.sin(c) + 200, 200 + q * Math.cos(c) + 129.53 * Math.sin(c / 8.73));
    }
    return count;
}
function generateVeil(time, target) {
    let count = 0;
    for(let i = 19_999; i >= 0; i -= 1){
        const y = i / 500;
        const k = Math.cos(y * 8.4) * (y < 36.79 ? 3.94 : 2.49);
        const e = y / 8 - 8.52;
        const o = Math.hypot(k, e) / 7.7;
        const q = k * 2 + 87.46 + Math.cos(16 / k) + k * Math.cos(y / 0.4) * (1 + Math.sin(o * 2.83 - e * 2 - time));
        const c = o / 1.08 - e / 1.75 - time / 10.49 + i % 1 * 12.84;
        count = pushPoint(target, count, q * Math.sin(c) + 200, 200 + q * Math.cos(c) - 84.06 * Math.sin(c / 4.51));
    }
    return count;
}
export const REFERENCE_CREATURES = [
    {
        id: "ribbed",
        commonName: "Ribbed mantle",
        sourceDate: "27 July 2026",
        sourceUrl: "https://house-de-lochan.com/murmurs",
        formula: "a=(y,o=mag(k=cos(y*1.3)*(y<21.39?37.05:38.67),e=y/8-3.39)/9.09)=>point((q=k*2+107.85+cos(51.67/k)+k*cos(y/4.43)*(1+sin(o*1.53-e*2-t)))*sin(c=o/1.39-e/20-t/3.86+i%1*11.66)+200,200+q*cos(c)-128.62*sin(c/0.91))\nt=0,draw=$=>{t||createCanvas(w=400,w);background(6).stroke(w,96);for(t+=PI/45,i=2e4;i--;)a(i/500)}",
        color: "#E4DBC9",
        outsideColor: "#16150F",
        alpha: 0.64,
        timeStep: Math.PI / 45,
        phaseRateScale: 0.12,
        envelopeWindow: TAU * 3.86,
        attemptedSamples: 20_000,
        visualRadius: BASE_VISUAL_RADIUS.ribbed * PRESENCE_SCALE * SPECIMEN_SCALE.ribbed,
        generate: generateRibbed
    },
    {
        id: "filament",
        commonName: "Pika",
        sourceDate: "27 July 2026",
        sourceUrl: "https://house-de-lochan.com/murmurs",
        formula: "a=(y,o=mag(k=cos(y*3.79)*(y<12.16?18.88:10.75),e=y/8-11.93)/5.95)=>point((q=k*2+65.9+cos(22.22/k)+k*cos(y/1.6)*(1+sin(o*3.54-e*2-t)))*sin(c=o/1.26-e/4.75-t/5.57+i%1*7.5)+200,200+q*cos(c)-45.08*sin(c/1.46))\nt=0,draw=$=>{t||createCanvas(w=400,w);background(6).stroke(w,96);for(t+=PI/45,i=2e4;i--;)a(i/500)}",
        color: "#FF5C8A",
        gradient: [
            "#FF4D86",
            "#FF7A4D",
            "#FFC132"
        ],
        outsideColor: "#16150F",
        alpha: 0.94,
        timeStep: Math.PI / 45,
        phaseRateScale: 0.4,
        envelopeWindow: TAU * 5.57 * 1.46,
        attemptedSamples: 20_000,
        visualRadius: BASE_VISUAL_RADIUS.filament * PRESENCE_SCALE * SPECIMEN_SCALE.filament,
        generate: generateFilament
    },
    {
        id: "skull",
        commonName: "Folded mask",
        sourceDate: "23 September 2024",
        sourceUrl: "https://x.com/yuruyurau/status/1838053151980900823",
        formula: "a=(x,y,d=5*cos(mag(k=x/8-25,e=y/8-25)/3))=>[(x+(d*k+k*2*atan(9*cos(e*2-t/2)))*sin(d*2.5-t))/2+100,d*13+d*3*(3+cos(d*3-t))+d*e+200]",
        color: "#E4DBC9",
        outsideColor: "#16150F",
        alpha: 0.48,
        timeStep: Math.PI / 120,
        phaseRateScale: 1,
        envelopeWindow: Math.PI * 4,
        attemptedSamples: 40_000,
        visualRadius: BASE_VISUAL_RADIUS.skull * PRESENCE_SCALE * SPECIMEN_SCALE.skull,
        generate: generateSkull
    },
    {
        id: "arc",
        commonName: "Inbyo",
        sourceDate: "27 July 2026",
        sourceUrl: "https://house-de-lochan.com/murmurs",
        formula: "a=(y,o=mag(k=cos(y*6.44)*(y<3.96?23.37:11.21),e=y/8-5.46)/11.25)=>point((q=k*2+114.49+cos(2.08/k)+k*cos(y/6.17)*(1+sin(o*1.63-e*2-t)))*sin(c=o/6.98-e/8.14-t/14.24+i%1*23.13)+200,200+q*cos(c)--129.53*sin(c/8.73))\nt=0,draw=$=>{t||createCanvas(w=400,w);background(6).stroke(w,96);for(t+=PI/45,i=2e4;i--;)a(i/500)}",
        color: "#7BEFC0",
        outsideColor: "#16150F",
        alpha: 0.86,
        timeStep: Math.PI / 45,
        phaseRateScale: 1,
        envelopeWindow: TAU * 14.24 * 8.73,
        attemptedSamples: 20_000,
        visualRadius: BASE_VISUAL_RADIUS.arc * PRESENCE_SCALE * SPECIMEN_SCALE.arc,
        generate: generateArc
    },
    {
        id: "veil",
        commonName: "Kazura",
        sourceDate: "27 July 2026",
        sourceUrl: "https://house-de-lochan.com/murmurs",
        formula: "a=(y,o=mag(k=cos(y*8.4)*(y<36.79?3.94:2.49),e=y/8-8.52)/7.7)=>point((q=k*2+87.46+cos(16/k)+k*cos(y/0.4)*(1+sin(o*2.83-e*2-t)))*sin(c=o/1.08-e/1.75-t/10.49+i%1*12.84)+200,200+q*cos(c)-84.06*sin(c/4.51))\nt=0,draw=$=>{t||createCanvas(w=400,w);background(6).stroke(w,96);for(t+=PI/45,i=2e4;i--;)a(i/500)}",
        color: "#AAB4FF",
        outsideColor: "#16150F",
        alpha: 0.86,
        timeStep: Math.PI / 45,
        phaseRateScale: 0.45,
        envelopeWindow: TAU * 10.49 * 4.51,
        attemptedSamples: 20_000,
        visualRadius: BASE_VISUAL_RADIUS.veil * PRESENCE_SCALE * SPECIMEN_SCALE.veil,
        generate: generateVeil
    }
];
export function definitionFor(id) {
    const definition = REFERENCE_CREATURES.find((item)=>item.id === id);
    if (!definition) throw new Error(`Unknown reference creature: ${id}`);
    return definition;
}
export function createPointBuffer(definition) {
    return new Float32Array(definition.attemptedSamples * 2);
}
export function measureReferenceEnvelope(definition, phaseSamples = 96) {
    const target = createPointBuffer(definition);
    const sampledX = [];
    const sampledY = [];
    const samples = Math.max(1, phaseSamples);
    let furthest = 0;
    for(let phaseIndex = 0; phaseIndex < samples; phaseIndex += 1){
        const time = phaseIndex / samples * definition.envelopeWindow;
        const count = definition.generate(time, target);
        let phaseCentreX = 0;
        let phaseCentreY = 0;
        for(let point = 0; point < count; point += 1){
            phaseCentreX += target[point * 2];
            phaseCentreY += target[point * 2 + 1];
        }
        phaseCentreX /= Math.max(1, count);
        phaseCentreY /= Math.max(1, count);
        for(let point = 0; point < count; point += 1){
            const radial = Math.hypot(target[point * 2] - phaseCentreX, target[point * 2 + 1] - phaseCentreY);
            if (radial > furthest) furthest = radial;
        }
        const stride = Math.max(1, Math.ceil(count / ENVELOPE_SAMPLE_TARGET));
        for(let point = 0; point < count; point += stride){
            sampledX.push(target[point * 2] - phaseCentreX);
            sampledY.push(target[point * 2 + 1] - phaseCentreY);
        }
    }
    sampledX.sort((first, second)=>first - second);
    sampledY.sort((first, second)=>first - second);
    const lowerIndex = Math.floor((sampledX.length - 1) * 0.002);
    const upperIndex = Math.ceil((sampledX.length - 1) * 0.998);
    const rawMinX = sampledX[lowerIndex] ?? Infinity;
    const rawMinY = sampledY[lowerIndex] ?? Infinity;
    const rawMaxX = sampledX[upperIndex] ?? -Infinity;
    const rawMaxY = sampledY[upperIndex] ?? -Infinity;
    if (!Number.isFinite(rawMinX + rawMinY + rawMaxX + rawMaxY)) {
        throw new Error(`Could not measure ${definition.id}`);
    }
    const centerX = (rawMinX + rawMaxX) / 2;
    const centerY = (rawMinY + rawMaxY) / 2;
    const halfWidth = (rawMaxX - rawMinX) / 2 * ENVELOPE_PADDING;
    const halfHeight = (rawMaxY - rawMinY) / 2 * ENVELOPE_PADDING;
    const radius = Math.max(halfWidth, halfHeight) || 1;
    return {
        centerX,
        centerY,
        radius,
        minX: centerX - halfWidth,
        minY: centerY - halfHeight,
        maxX: centerX + halfWidth,
        maxY: centerY + halfHeight,
        reach: furthest / radius * REACH_PADDING
    };
}
function cachedEnvelope(definition) {
    const cached = envelopeCache.get(definition.id);
    if (cached) return cached;
    const measured = measureReferenceEnvelope(definition);
    envelopeCache.set(definition.id, measured);
    return measured;
}
const placements = [
    {
        instanceId: "filament",
        id: "filament",
        initialPhase: 1.17,
        x: 0.68,
        y: 0.27,
        headBearing: 3.05
    },
    {
        instanceId: "arc",
        id: "arc",
        initialPhase: 3.51,
        x: 0.72,
        y: 0.73,
        headBearing: -1.57
    }
];
export const MOTION_PROFILES = {
    filament: {
        minSpeed: 0.020,
        maxSpeed: 0.030,
        gaitPeriod: 4.8,
        gaitOffset: 1.7,
        routeSwing: 0.34,
        routePeriod: 13,
        depthPeriod: 24,
        depthOffset: 2.7,
        preludeTarget: [
            0.30,
            0.30
        ],
        firstExteriorTarget: [
            0.85,
            0.34
        ],
        firstExitAt: 8,
        returnTarget: [
            0.28,
            0.68
        ],
        edgeOffset: 1
    },
    arc: {
        minSpeed: 0.015,
        maxSpeed: 0.023,
        gaitPeriod: 6.4,
        gaitOffset: 3.05,
        routeSwing: 0.20,
        routePeriod: 21,
        depthPeriod: 27,
        depthOffset: 4.2,
        preludeTarget: [
            0.72,
            0.42
        ],
        firstExteriorTarget: [
            0.66,
            0.85
        ],
        firstExitAt: 22,
        returnTarget: [
            0.35,
            0.28
        ],
        edgeOffset: 2
    },
    veil: {
        minSpeed: 0.019,
        maxSpeed: 0.028,
        gaitPeriod: 4.6,
        gaitOffset: 4.6,
        routeSwing: 0.40,
        routePeriod: 11,
        depthPeriod: 22,
        depthOffset: 5.65,
        preludeTarget: [
            0.32,
            0.78
        ],
        firstExteriorTarget: [
            0.15,
            0.58
        ],
        firstExitAt: 36,
        returnTarget: [
            0.68,
            0.3
        ],
        edgeOffset: 3
    }
};
export const FIELD_CREATURE_IDS = [
    "filament",
    "arc",
    "veil"
];
export const FIELD_CREATURES = FIELD_CREATURE_IDS.map((id)=>definitionFor(id));
function fraction(value) {
    return value - Math.floor(value);
}
function softCap(value, ceiling) {
    if (ceiling <= 1e-9) return value;
    const knee = ceiling * 0.6;
    if (value <= knee) return value;
    const span = ceiling - knee;
    return knee + span * (1 - Math.exp(-(value - knee) / span));
}
function deterministicUnit(seed, index, cursor) {
    return fraction(Math.sin(seed * 0.0001 + index * 31.17 + cursor * 17.73) * 43_758.5453);
}
export class ReferenceCreatureWorld {
    seed;
    states = [];
    elapsed = 0;
    fields = [];
    envelopes = [];
    histories = [];
    travelled = [];
    targetIsExterior = [];
    initialExcursionPending = [];
    waypointCursor = [];
    firstReturn = [];
    interiorLegs = [];
    targetAge = [];
    aimX = [];
    aimY = [];
    poseAngle = [];
    turnRate = [];
    deformX = [];
    wakeX = [];
    wakeY = [];
    wakeAngle = [];
    waveX = [];
    waveY = [];
    deformY = [];
    timeSteps = [];
    constructor(seed = 0xa17a17){
        this.seed = seed;
        for (const placement of placements){
            const definition = definitionFor(placement.id);
            this.timeSteps.push(definition.timeStep * SOURCE_FPS * definition.phaseRateScale);
        }
        this.reset();
    }
    reset() {
        this.elapsed = 0;
        this.states.length = 0;
        this.fields.length = 0;
        this.envelopes.length = 0;
        this.histories.length = 0;
        this.travelled.length = 0;
        this.targetIsExterior.length = 0;
        this.initialExcursionPending.length = 0;
        this.waypointCursor.length = 0;
        this.firstReturn.length = 0;
        this.interiorLegs.length = 0;
        this.targetAge.length = 0;
        this.aimX.length = 0;
        this.aimY.length = 0;
        this.poseAngle.length = 0;
        this.turnRate.length = 0;
        this.deformX.length = 0;
        this.wakeX.length = 0;
        this.wakeY.length = 0;
        this.wakeAngle.length = 0;
        this.waveX.length = 0;
        this.waveY.length = 0;
        this.deformY.length = 0;
        placements.forEach((placement, index)=>{
            const definition = definitionFor(placement.id);
            const profile = MOTION_PROFILES[placement.instanceId];
            const envelope = cachedEnvelope(definition);
            const field = new BodyField(definition, envelope, placement.initialPhase);
            const phase = placement.initialPhase;
            const depth = 0.5 + 0.5 * Math.sin(profile.depthOffset);
            const scale = definition.visualRadius * depthScale(depth);
            const bodyLength = field.longitudinalSpan * scale;
            const headX = placement.x + Math.cos(placement.headBearing) * bodyLength * 0.5;
            const headY = placement.y + Math.sin(placement.headBearing) * bodyLength * 0.5;
            const speed = (profile.minSpeed + profile.maxSpeed) * 0.5;
            const state = {
                instanceId: placement.instanceId,
                id: placement.id,
                x: placement.x,
                y: placement.y,
                vx: Math.cos(placement.headBearing) * speed,
                vy: Math.sin(placement.headBearing) * speed,
                headX,
                headY,
                headBearing: placement.headBearing,
                bodyBearing: placement.headBearing,
                gaitPhase: profile.gaitOffset,
                targetX: profile.preludeTarget[0],
                targetY: profile.preludeTarget[1],
                excursionState: "inside",
                phase,
                depth,
                visualRadius: definition.visualRadius,
                collisionRadius: scale,
                envelopeReach: envelope.reach,
                interaction: {
                    nearestId: null,
                    nearestDistance: Infinity,
                    state: "free"
                }
            };
            this.states.push(state);
            this.fields.push(field);
            this.envelopes.push(envelope);
            this.travelled.push(0);
            this.targetIsExterior.push(false);
            this.initialExcursionPending.push(true);
            this.waypointCursor.push(0);
            this.firstReturn.push(true);
            this.interiorLegs.push(0);
            this.targetAge.push(0);
            this.aimX.push(headX + Math.cos(placement.headBearing));
            this.aimY.push(headY + Math.sin(placement.headBearing));
            this.poseAngle.push(placement.headBearing);
            this.turnRate.push(0);
            this.deformX.push(new Float32Array(DEFORM_BANDS));
            this.wakeX.push(new Float32Array(DEFORM_BANDS));
            this.wakeY.push(new Float32Array(DEFORM_BANDS));
            this.wakeAngle.push(new Float32Array(DEFORM_BANDS));
            this.waveX.push(new Float32Array(DEFORM_BANDS));
            this.waveY.push(new Float32Array(DEFORM_BANDS));
            this.deformY.push(new Float32Array(DEFORM_BANDS));
            const history = [];
            const seededLength = bodyLength + HISTORY_PADDING;
            for(let sample = 160; sample >= 0; sample -= 1){
                const behind = seededLength * sample / 160;
                history.push({
                    x: headX - Math.cos(placement.headBearing) * behind,
                    y: headY - Math.sin(placement.headBearing) * behind,
                    distance: -behind,
                    bearing: placement.headBearing
                });
            }
            this.histories.push(history);
            this.applyMotion(index);
        });
    }
    fieldAt(index) {
        const field = this.fields[index];
        if (!field) throw new Error(`Missing body field: ${index}`);
        const phase = this.stateAt(index).phase;
        if (field.advanceIfNeeded(phase)) {
            this.applyMotion(index);
        }
        return field;
    }
    envelopeAt(index) {
        const envelope = this.envelopes[index];
        if (!envelope) throw new Error(`Missing envelope: ${index}`);
        return envelope;
    }
    stateAt(index) {
        const state = this.states[index];
        if (!state) throw new Error(`Missing reference creature: ${index}`);
        return state;
    }
    motionOf(index) {
        const state = this.stateAt(index);
        return {
            speed: Math.hypot(state.vx, state.vy),
            headBearing: state.headBearing,
            gaitPhase: state.gaitPhase,
            excursionState: state.excursionState
        };
    }
    spineOf(index) {
        const field = this.fieldAt(index);
        const x = Array.from(field.worldX);
        const y = Array.from(field.worldY);
        const bearing = x.map((_, slice)=>{
            const before = Math.max(0, slice - 1);
            const after = Math.min(x.length - 1, slice + 1);
            return Math.atan2(y[after] - y[before], x[after] - x[before]);
        });
        return {
            x,
            y,
            bearing
        };
    }
    hitDistance(index, x, y) {
        const state = this.stateAt(index);
        return this.fieldAt(index).distanceToSpine(x, y, scaledRadius(state));
    }
    step(deltaSeconds) {
        const delta = Math.min(0.1, Math.max(0, deltaSeconds));
        if (delta <= 0) return;
        let remaining = delta;
        while(remaining > 1e-9){
            const dt = Math.min(FIXED_STEP, remaining);
            this.fixedStep(dt);
            remaining -= dt;
        }
    }
    fixedStep(dt) {
        this.elapsed += dt;
        for(let index = 0; index < this.states.length; index += 1){
            const state = this.states[index];
            state.phase += this.timeSteps[index] * dt;
            state.interaction.nearestId = null;
            state.interaction.nearestDistance = Infinity;
        }
        for(let firstIndex = 0; firstIndex < this.states.length; firstIndex += 1){
            for(let secondIndex = firstIndex + 1; secondIndex < this.states.length; secondIndex += 1){
                const first = this.states[firstIndex];
                const second = this.states[secondIndex];
                const nearest = this.fields[firstIndex].closestSpinePoint(this.fields[secondIndex]);
                if (nearest.distance < first.interaction.nearestDistance) {
                    first.interaction.nearestDistance = nearest.distance;
                    first.interaction.nearestId = second.instanceId;
                }
                if (nearest.distance < second.interaction.nearestDistance) {
                    second.interaction.nearestDistance = nearest.distance;
                    second.interaction.nearestId = first.instanceId;
                }
            }
        }
        for(let index = 0; index < this.states.length; index += 1){
            const state = this.states[index];
            const profile = MOTION_PROFILES[state.instanceId];
            const targetDistance = Math.hypot(state.targetX - state.headX, state.targetY - state.headY);
            this.targetAge[index] += dt;
            if (this.initialExcursionPending[index] && this.elapsed >= profile.firstExitAt) {
                this.targetAge[index] = 0;
                this.initialExcursionPending[index] = false;
                this.targetIsExterior[index] = true;
                state.targetX = profile.firstExteriorTarget[0];
                state.targetY = profile.firstExteriorTarget[1];
                state.excursionState = "exiting";
            } else if (targetDistance < TARGET_REACHED || this.targetIsExterior[index] && this.edgeStray(index) > 0 || this.targetAge[index] > TARGET_PATIENCE_SECONDS) {
                this.targetAge[index] = 0;
                if (this.initialExcursionPending[index]) this.wanderInside(index);
                else this.advanceTarget(index);
            }
            state.gaitPhase = (state.gaitPhase + TAU * dt / profile.gaitPeriod) % TAU;
            const speedPulse = 0.5 + 0.5 * Math.sin(state.gaitPhase * 2 + profile.gaitOffset);
            const desiredSpeed = profile.minSpeed + (profile.maxSpeed - profile.minSpeed) * speedPulse;
            const currentSpeed = Math.hypot(state.vx, state.vy);
            const speedEase = 1 - Math.exp(-dt / SPEED_EASE_SECONDS);
            const speed = currentSpeed + (desiredSpeed - currentSpeed) * speedEase;
            const routePhase = TAU * this.elapsed / profile.routePeriod + profile.gaitOffset;
            const swing = profile.routeSwing * (0.68 * Math.sin(routePhase) + 0.32 * Math.sin(routePhase * 2.37 + profile.gaitOffset));
            const toTargetX = state.targetX - state.headX;
            const toTargetY = state.targetY - state.headY;
            const reach = Math.max(1e-6, Math.hypot(toTargetX, toTargetY));
            const approach = Math.min(1, reach / 0.3);
            let aimX = state.targetX - toTargetY / reach * swing * approach;
            let aimY = state.targetY + toTargetX / reach * swing * approach;
            const stray = this.edgeStray(index);
            aimX += (0.5 - aimX) * stray;
            aimY += (0.5 - aimY) * stray;
            const ease = 1 - Math.exp(-dt / AIM_EASE_SECONDS);
            this.aimX[index] += (aimX - this.aimX[index]) * ease;
            this.aimY[index] += (aimY - this.aimY[index]) * ease;
            const desiredBearing = Math.atan2(this.aimY[index] - state.headY, this.aimX[index] - state.headX);
            const bodyLength = this.fields[index].longitudinalSpan * scaledRadius(state);
            const lengthShare = clamp(TURN_REFERENCE_LENGTH / Math.max(1e-6, bodyLength), MIN_TURN_SHARE, 1);
            const authority = lengthShare * (1 + stray * EDGE_TURN_GAIN);
            const turnCeiling = MAX_HEAD_TURN * authority;
            const wantedTurn = clamp(wrapAngle(desiredBearing - state.headBearing) * 0.72, -Math.min(TARGET_TURN * authority, turnCeiling), Math.min(TARGET_TURN * authority, turnCeiling));
            const turnEase = 1 - Math.exp(-dt / TURN_EASE_SECONDS);
            this.turnRate[index] += (wantedTurn - this.turnRate[index]) * turnEase;
            state.headBearing = wrapAngle(state.headBearing + this.turnRate[index] * dt);
            const poseEase = 1 - Math.exp(-dt / POSE_LAG_SECONDS);
            this.poseAngle[index] = wrapAngle(this.poseAngle[index] + wrapAngle(state.headBearing - this.poseAngle[index]) * poseEase);
            state.bodyBearing = this.poseAngle[index];
            state.vx = Math.cos(state.headBearing) * speed;
            state.vy = Math.sin(state.headBearing) * speed;
            state.headX += state.vx * dt;
            state.headY += state.vy * dt;
            this.travelled[index] += speed * dt;
            this.histories[index].push({
                x: state.headX,
                y: state.headY,
                distance: this.travelled[index],
                bearing: state.headBearing
            });
            this.trimHistory(index);
            state.depth = 0.5 + 0.5 * Math.sin(TAU * this.elapsed / profile.depthPeriod + profile.depthOffset);
            state.collisionRadius = scaledRadius(state);
            this.applyMotion(index);
            const headInside = state.headX >= PLATE_MIN && state.headX <= PLATE_MAX && state.headY >= PLATE_MIN && state.headY <= PLATE_MAX;
            state.excursionState = this.initialExcursionPending[index] ? "inside" : this.targetIsExterior[index] ? "exiting" : headInside ? "inside" : "returning";
            state.interaction.state = state.interaction.nearestDistance < ENCOUNTER_DISTANCE ? "approaching" : "free";
        }
    }
    turnRadius(index) {
        const state = this.stateAt(index);
        const bodyLength = this.fields[index].longitudinalSpan * scaledRadius(state);
        const lengthShare = clamp(TURN_REFERENCE_LENGTH / Math.max(1e-6, bodyLength), MIN_TURN_SHARE, 1);
        return Math.hypot(state.vx, state.vy) / Math.max(1e-6, TARGET_TURN * lengthShare);
    }
    edgeStray(index) {
        const state = this.stateAt(index);
        const margin = EDGE_MARGIN + this.fields[index].longitudinalSpan * scaledRadius(state) * 0.3;
        return smoothstep(0, 1, clamp01(Math.max(0, margin - state.headX, state.headX - (1 - margin), margin - state.headY, state.headY - (1 - margin)) / EDGE_RECOVERY));
    }
    wanderInside(index) {
        const state = this.stateAt(index);
        this.waypointCursor[index] += 1;
        const cursor = this.waypointCursor[index];
        const bearing = TAU * deterministicUnit(this.seed, index, cursor * 5 + 3);
        const floor = this.turnRadius(index) * 1.7;
        const reach = Math.max(floor, 0.20) + 0.16 * deterministicUnit(this.seed, index, cursor * 5 + 4);
        let bestX = state.headX;
        let bestY = state.headY;
        let bestReach = -1;
        for(let attempt = 0; attempt < 6; attempt += 1){
            const swing = bearing + attempt * TAU / 6;
            const x = clamp(state.headX + Math.cos(swing) * reach, INTERIOR_MIN, INTERIOR_MAX);
            const y = clamp(state.headY + Math.sin(swing) * reach, INTERIOR_MIN, INTERIOR_MAX);
            const actual = Math.hypot(x - state.headX, y - state.headY);
            if (actual > bestReach) {
                bestReach = actual;
                bestX = x;
                bestY = y;
            }
            if (actual >= floor) break;
        }
        state.targetX = bestX;
        state.targetY = bestY;
        state.excursionState = "inside";
    }
    advanceTarget(index) {
        const state = this.stateAt(index);
        const profile = MOTION_PROFILES[state.instanceId];
        if (this.targetIsExterior[index]) {
            this.targetIsExterior[index] = false;
            this.interiorLegs[index] = 2;
            if (this.firstReturn[index]) {
                state.targetX = profile.returnTarget[0];
                state.targetY = profile.returnTarget[1];
                this.firstReturn[index] = false;
            } else {
                const cursor = this.waypointCursor[index];
                state.targetX = 0.24 + 0.52 * deterministicUnit(this.seed, index, cursor * 2 + 1);
                state.targetY = 0.24 + 0.52 * deterministicUnit(this.seed, index, cursor * 2 + 2);
            }
            state.excursionState = "returning";
            return;
        }
        if (this.interiorLegs[index] > 0) {
            this.interiorLegs[index] -= 1;
            this.wanderInside(index);
            return;
        }
        this.targetIsExterior[index] = true;
        this.waypointCursor[index] += 1;
        const cursor = this.waypointCursor[index];
        const drift = (deterministicUnit(this.seed, index, cursor * 3 + 7) - 0.5) * 0.3;
        const distances = [
            state.headY,
            1 - state.headX,
            1 - state.headY,
            state.headX
        ];
        let edge = 0;
        for(let side = 1; side < 4; side += 1){
            if (distances[side] < distances[edge]) edge = side;
        }
        if (Math.abs(distances[edge] - distances[profile.edgeOffset % 4]) < 0.04) {
            edge = profile.edgeOffset % 4;
        }
        const along = clamp((edge === 1 || edge === 3 ? state.headY : state.headX) + drift, PLATE_MIN, PLATE_MAX);
        if (edge === 0) {
            state.targetX = along;
            state.targetY = EXTERIOR_LOW;
        } else if (edge === 1) {
            state.targetX = EXTERIOR_HIGH;
            state.targetY = along;
        } else if (edge === 2) {
            state.targetX = along;
            state.targetY = EXTERIOR_HIGH;
        } else {
            state.targetX = EXTERIOR_LOW;
            state.targetY = along;
        }
        state.excursionState = "exiting";
    }
    trimHistory(index) {
        const history = this.histories[index];
        const minimum = this.travelled[index] - HISTORY_KEEP;
        let remove = 0;
        while(remove < history.length - 2 && history[remove + 1].distance < minimum){
            remove += 1;
        }
        if (remove > 0) history.splice(0, remove);
    }
    applyMotion(index) {
        const state = this.stateAt(index);
        const field = this.fields[index];
        const anatomy = field.anatomy;
        const history = this.histories[index];
        const deformX = this.deformX[index];
        const deformY = this.deformY[index];
        const wakeX = this.wakeX[index];
        const wakeY = this.wakeY[index];
        const wakeAngle = this.wakeAngle[index];
        const waveX = this.waveX[index];
        const waveY = this.waveY[index];
        const scale = scaledRadius(state);
        const bodyLength = field.longitudinalSpan * scale;
        const travelled = this.travelled[index];
        const forwardX = Math.cos(state.headBearing);
        const forwardY = Math.sin(state.headBearing);
        const pose = this.poseAngle[index];
        const alongX = Math.cos(pose);
        const alongY = Math.sin(pose);
        const wavePhase = TAU * anatomy.waveRate * this.elapsed;
        let cursor = history.length - 1;
        const memory = Math.hypot(state.vx, state.vy) * anatomy.followLagSeconds;
        for(let band = 0; band < DEFORM_BANDS; band += 1){
            const u = band / (DEFORM_BANDS - 1);
            const trailing = field.bandBehind[band] * scale;
            const behind = softCap(trailing, memory);
            if (band === DEFORM_BANDS - 1) field.routeReach = behind;
            const wanted = travelled - behind;
            while(cursor > 0 && history[cursor - 1].distance > wanted){
                cursor -= 1;
            }
            const before = history[Math.max(0, cursor - 1)];
            const after = history[Math.min(history.length - 1, cursor)];
            const span = Math.max(1e-9, after.distance - before.distance);
            const mix = clamp01((wanted - before.distance) / span);
            const pathX = before.x + (after.x - before.x) * mix;
            const pathY = before.y + (after.y - before.y) * mix;
            const straightX = state.headX - forwardX * behind;
            const straightY = state.headY - forwardY * behind;
            const ramp = smoothstep(anatomy.rampStart, 1, u);
            const follow = anatomy.follow * ramp;
            const swing = anatomy.wave * scale * ramp * (1 - anatomy.tipRelease * smoothstep(0.78, 1, u)) * Math.sin(TAU * u / anatomy.wavelength - wavePhase);
            deformX[band] = (pathX - straightX) * follow - alongY * swing;
            deformY[band] = (pathY - straightY) * follow + alongX * swing;
            wakeX[band] = pathX;
            wakeY[band] = pathY;
            wakeAngle[band] = wrapAngle(before.bearing + wrapAngle(after.bearing - before.bearing) * mix);
            waveX[band] = -alongY * swing;
            waveY[band] = alongX * swing;
        }
        field.setPose(state.headX, state.headY, pose, scale);
        field.setPath(wakeX, wakeY, wakeAngle, waveX, waveY);
        field.setDeformation(deformX, deformY);
        state.x = field.worldX[SPINE_SLICES >> 1];
        state.y = field.worldY[SPINE_SLICES >> 1];
    }
}
export { TAU };
