/* Ooh La Mahj — multiplayer server (private friend tables MVP) */
'use strict';
const http = require('http');
const { WebSocketServer } = require('ws');

/* ================= ENGINE (ported from the client) ================= */
const SUITS = ['C', 'B', 'D'];
const DRAGON = { C: 'GR', B: 'GG', D: 'G0' };
const WINDS = ['WN', 'WE', 'WW', 'WS'];
const key = t => t.s + (t.n !== undefined ? t.n : '');
let _tid = 0;
const mk = (s, n) => ({ s, n, id: ++_tid });
function makeDeck() {
  const d = [];
  for (const s of SUITS) for (let n = 1; n <= 9; n++) for (let i = 0; i < 4; i++) d.push(mk(s, n));
  for (const w of ['N', 'E', 'W', 'S']) for (let i = 0; i < 4; i++) d.push(mk('W', w));
  for (const g of ['R', 'G', '0']) for (let i = 0; i < 4; i++) d.push(mk('G', g));
  for (let i = 0; i < 8; i++) d.push(mk('F', undefined));
  for (let i = 0; i < 8; i++) d.push(mk('J', undefined));
  return d;
}
function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

const PERMS = [['C','B','D'],['C','D','B'],['B','C','D'],['B','D','C'],['D','B','C'],['D','C','B']];
const CLUB_HANDS = [];
function addHand(h, gen) { h.variants = gen(); CLUB_HANDS.push(h); }
addHand({name:'Sunrise 2026',cat:'YEAR — 2026',pts:30,concealed:false,disp:[['222','cR'],['0000','cN'],['222','cG'],['6666','cB']],note:'2s in any two suits · 6s in the third · Soap = zero'},
  ()=>{const v=[];for(const c of SUITS){const o=SUITS.filter(s=>s!==c);v.push([[o[0]+'2',3],['G0',4],[o[1]+'2',3],[c+'6',4]])}return v});
addHand({name:'Palm Court Run',cat:'CONSECUTIVE RUNS',pts:25,concealed:false,disp:[['11 222 3333 444 55','cR']],note:'Any one suit · any five consecutive numbers'},
  ()=>{const v=[];for(const s of SUITS)for(let n=1;n<=5;n++)v.push([[s+n,2],[s+(n+1),3],[s+(n+2),4],[s+(n+3),3],[s+(n+4),2]]);return v});
addHand({name:'Ocean Run',cat:'CONSECUTIVE RUNS',pts:30,concealed:false,disp:[['11 22','cR'],['333 444','cG'],['5555','cB']],note:'Three suits · any five consecutive numbers'},
  ()=>{const v=[];for(const p of PERMS)for(let n=1;n<=5;n++)v.push([[p[0]+n,2],[p[0]+(n+1),2],[p[1]+(n+2),3],[p[1]+(n+3),3],[p[2]+(n+4),4]]);return v});
addHand({name:'Island Trio',cat:'LIKE NUMBERS',pts:25,concealed:false,disp:[['FF','cF'],['1111','cR'],['1111','cG'],['1111','cB']],note:'Any like number · kongs in all three suits'},
  ()=>{const v=[];for(let n=1;n<=9;n++)v.push([['F',2],['C'+n,4],['B'+n,4],['D'+n,4]]);return v});
addHand({name:'The Trellis',cat:'PUNGS & DRAGONS',pts:30,concealed:false,disp:[['111 222 333 444','cG'],['DD','cG']],note:'Any one suit, four consecutive pungs · pair of matching dragons'},
  ()=>{const v=[];for(const s of SUITS)for(let n=1;n<=6;n++)v.push([[s+n,3],[s+(n+1),3],[s+(n+2),3],[s+(n+3),3],[DRAGON[s],2]]);return v});
addHand({name:'Dragon Garden',cat:'PUNGS & DRAGONS',pts:35,concealed:false,disp:[['FFFF','cF'],['DDDD','cR'],['DDDD','cG'],['DD','cB']],note:'Kongs of two dragons · pair of the third'},
  ()=>{const D=['GR','GG','G0'],v=[];for(const pr of D){const o=D.filter(x=>x!==pr);v.push([['F',4],[o[0],4],[o[1],4],[pr,2]])}return v});
addHand({name:'Four Winds',cat:'WINDS',pts:30,concealed:false,disp:[['NNNN EEEE WWWW','cN'],['SS','cN']],note:'Kongs of any three winds · pair of the fourth'},
  ()=>{const v=[];for(const pr of WINDS){const o=WINDS.filter(x=>x!==pr);v.push([[o[0],4],[o[1],4],[o[2],4],[pr,2]])}return v});
addHand({name:'Quint Royale',cat:'QUINTS',pts:40,concealed:false,disp:[['FFFF','cF'],['11111','cR'],['22222','cG']],note:'Quints of any two consecutive numbers · any suits · needs jokers'},
  ()=>{const v=[];for(const a of SUITS)for(const b of SUITS)for(let n=1;n<=8;n++)v.push([['F',4],[a+n,5],[b+(n+1),5]]);return v});
addHand({name:'Flamingo Pairs',cat:'SINGLES & PAIRS',pts:50,concealed:true,disp:[['NN EE WW SS','cN'],['11 22 33','cR']],note:'Concealed · no jokers · any one suit, three consecutive pairs'},
  ()=>{const v=[];for(const s of SUITS)for(let n=1;n<=7;n++)v.push([['WN',2],['WE',2],['WW',2],['WS',2],[s+n,2],[s+(n+1),2],[s+(n+2),2]]);return v});

function validateCard(c) {
  if (!c || typeof c !== 'object') return 'Not a card';
  if (!Array.isArray(c.hands) || !c.hands.length) return 'No hands';
  const rx = /^([CBD][1-9]|W[NEWS]|G[RG0]|F)$/;
  for (const h of c.hands) {
    if (!Array.isArray(h.variants) || !h.variants.length) return 'Hand missing variants';
    if (typeof h.pts !== 'number') h.pts = 25;
    h.concealed = !!h.concealed;
    h.name = String(h.name || 'Hand'); h.cat = String(h.cat || 'CARD'); h.note = String(h.note || '');
    if (!Array.isArray(h.disp)) h.disp = [[h.name, 'cN']];
    for (const v of h.variants) {
      let sum = 0;
      for (const g of v) {
        if (!Array.isArray(g) || typeof g[0] !== 'string' || !rx.test(g[0]) || !(g[1] >= 1 && g[1] <= 6)) return 'Bad group';
        sum += g[1];
      }
      if (sum !== 14) return 'Variant not 14';
    }
  }
  if (c.hands.length > 120) return 'Too many hands';
  return null;
}

function countsOf(tiles) { const c = {}; let jk = 0; for (const t of tiles) { if (t.s === 'J') jk++; else c[key(t)] = (c[key(t)] || 0) + 1; } return { c, jk }; }
function tryVariant(counts, jokers, variant) {
  const c = Object.assign({}, counts); let jk = jokers;
  for (const [tk, k] of variant) {
    if (k <= 2) { if ((c[tk] || 0) < k) return false; c[tk] -= k; }
    else { const have = Math.min(c[tk] || 0, k); c[tk] -= have; const need = k - have; if (need > jk) return false; jk -= need; }
  }
  if (jk !== 0) return false;
  for (const tk in c) if (c[tk] > 0) return false;
  return true;
}
const expCount = p => p.exp.reduce((s, e) => s + e.tiles.length, 0);
function lockGroups(p, variant) {
  if (!p.exp.length) return variant;
  const rem = variant.slice();
  for (const e of p.exp) {
    const k = e.tiles.length, tk = e.rep;
    let f = -1;
    for (let i = 0; i < rem.length; i++) if (rem[i][0] === tk && rem[i][1] === k) { f = i; break; }
    if (f < 0) return null;
    rem.splice(f, 1);
  }
  return rem;
}
function checkWinRack(T, p, rack) {
  if (rack.length + expCount(p) !== 14) return null;
  const { c, jk } = countsOf(rack); const hasExp = p.exp.length > 0;
  for (const h of T.hands) {
    if (h.concealed && hasExp) continue;
    for (const v of h.variants) {
      const rem = lockGroups(p, v);
      if (!rem) continue;
      if (tryVariant(c, jk, rem)) return { hand: h, variant: v };
    }
  }
  return null;
}
const checkWin = (T, p) => checkWinRack(T, p, p.rack);
const checkWinWith = (T, p, extra) => checkWinRack(T, p, p.rack.concat([extra]));
function scoreVariant(counts, jk, variant) {
  const c = Object.assign({}, counts); let used = 0, slots = 0;
  for (const [tk, k] of variant) { const have = Math.min(c[tk] || 0, k); used += have; c[tk] -= have; if (k >= 3) slots += k - have; }
  return used + Math.min(jk, slots);
}
function bestFit(T, p) {
  const { c, jk } = countsOf(p.rack); const hasExp = p.exp.length > 0; const ec = expCount(p);
  let best = null;
  for (const h of T.hands) {
    if (h.concealed && (hasExp || jk > 0)) continue;
    for (const v of h.variants) {
      const rem = lockGroups(p, v);
      if (!rem) continue;
      const s = ec + scoreVariant(c, jk, rem);
      if (!best || s > best.score) best = { hand: h, variant: v, rem, score: s };
    }
  }
  return best;
}
function keepIdsFor(p, groups) {
  const keep = new Set(), taken = {};
  for (const [tk, k] of groups) taken[tk] = (taken[tk] || 0) + k;
  for (const t of p.rack) {
    if (t.s === 'J') { keep.add(t.id); continue; }
    const tk = key(t);
    if ((taken[tk] || 0) > 0) { taken[tk]--; keep.add(t.id); }
  }
  return keep;
}
function topFitsCount(T, p) {
  const { c, jk } = countsOf(p.rack); const hasExp = p.exp.length > 0;
  let n = 0;
  for (const h of T.hands) {
    if (h.concealed && (hasExp || jk > 0)) continue;
    for (const v of h.variants) { if (lockGroups(p, v)) { n++; break; } }
  }
  return n;
}
function botDiscardChoice(T, p) {
  const bf = bestFit(T, p); const keep = bf ? keepIdsFor(p, bf.rem) : new Set();
  let cand = p.rack.filter(t => t.s !== 'J' && !keep.has(t.id));
  if (!cand.length) cand = p.rack.filter(t => t.s !== 'J');
  if (!cand.length) cand = p.rack.slice();
  return cand[Math.floor(Math.random() * cand.length)];
}
function botPassTiles(T, p) {
  const bf = bestFit(T, p); const keep = bf ? keepIdsFor(p, bf.rem) : new Set();
  let cand = p.rack.filter(t => t.s !== 'J' && !keep.has(t.id));
  const extra = p.rack.filter(t => t.s !== 'J' && keep.has(t.id));
  shuffle(cand); shuffle(extra);
  return cand.concat(extra).slice(0, 3);
}
function botClaimCheck(T, p, t) {
  const win = checkWinWith(T, p, t);
  if (win) return { kind: 'mahjong', win };
  const bf = bestFit(T, p);
  if (!bf) return null;
  const grp = bf.rem.find(([tk, k]) => tk === key(t) && k >= 3);
  if (!grp) return null;
  const { c, jk } = countsOf(p.rack);
  const copies = c[key(t)] || 0;
  if (copies < 2) return null;
  const k = grp[1], need = k - 1, realUse = Math.min(copies, need), jNeed = need - realUse;
  if (jNeed > jk) return null;
  if (Math.random() >= 0.8) return null;
  return { kind: 'expose', k };
}

const BOT_MS = +process.env.BOT_MS || 1000;
const CALLB_MS = +process.env.CALLB_MS || 1200;
/* ================= TABLES ================= */
const BOTNAMES = ['Evelyn', 'Dinah', 'Bitsy', 'Norma'];
const tables = new Map();   // code -> table
const players = new Map();  // token -> {token, name, ws, tableCode, seat}

function code4() {
  const A = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  let c;
  do { c = Array.from({ length: 4 }, () => A[Math.floor(Math.random() * A.length)]).join(''); } while (tables.has(c));
  return c;
}
function newSeat(kind, name) {
  return { kind, name, token: null, connected: kind === 'bot', botSub: false,
           rack: [], exp: [], chPass: null, graceTimer: null };
}
function makeTable(hostP, cardJson, config) {
  const code = code4();
  let hands = CLUB_HANDS, cardMeta = { title: 'THE OOH LA MAHJ CARD', custom: false };
  if (cardJson) {
    const err = validateCard(cardJson);
    if (!err) { hands = cardJson.hands; cardMeta = { title: cardJson.title || 'MY CARD', custom: true, raw: cardJson }; }
  }
  const T = {
    code, hands, cardMeta,
    config: Object.assign({ pace: 'relaxed' }, config || {}),
    phase: 'lobby', chStep: 0, wall: [], discards: [],
    dealer: 0, turn: 0, step: 'discard',
    seats: [newSeat('human', hostP.name), null, null, null],
    callWin: null, seq: 0, timers: {}, created: Date.now(), lastActive: Date.now(),
  };
  T.seats[0].token = hostP.token;
  T.seats[0].connected = true;
  tables.set(code, T);
  return T;
}
function seatOf(T, token) { return T.seats.findIndex(s => s && s.token === token); }
function humanSeats(T) { return T.seats.map((s, i) => s && s.kind === 'human' ? i : -1).filter(i => i >= 0); }
function seatDriver(T, i) { const s = T.seats[i]; return s.kind === 'bot' || s.botSub ? 'bot' : 'human'; }
function clearTimers(T) { for (const k in T.timers) { clearTimeout(T.timers[k]); delete T.timers[k]; } }
function later(T, name, ms, fn) {
  clearTimeout(T.timers[name]);
  const seq = T.seq;
  T.timers[name] = setTimeout(() => { if (tables.get(T.code) === T && T.seq === seq) fn(); }, ms);
}

/* ---------- views ---------- */
function pubTile(t) { return { s: t.s, n: t.n, id: t.id }; }
function viewFor(T, seatIdx) {
  const me = T.seats[seatIdx];
  const winNow = (T.phase === 'play' && me && me.kind === 'human') ? checkWin(T, me) : null;
  const swaps = [];
  if (T.phase === 'play' && me && T.turn === seatIdx && T.step === 'discard') {
    T.seats.forEach((s, si) => { if (!s) return; s.exp.forEach((e, ei) => {
      if (e.tiles.some(t => t.s === 'J') && me.rack.some(t => key(t) === e.rep)) swaps.push({ seat: si, exp: ei, rep: e.rep });
    }); });
  }
  return {
    type: 'view', code: T.code, phase: T.phase, chStep: T.chStep,
    turn: T.turn, step: T.step, wall: T.wall.length, dealer: T.dealer,
    discards: T.discards.map(d => ({ t: pubTile(d.t), by: d.by })),
    config: T.config, cardTitle: T.cardMeta.title,
    seats: T.seats.map((s, i) => s ? {
      name: s.name, kind: s.kind, connected: s.connected, botSub: s.botSub,
      count: s.rack.length, exp: s.exp.map(e => ({ rep: e.rep, tiles: e.tiles.map(pubTile) })),
      chReady: T.phase === 'charleston' ? (s.kind === 'bot' || !!s.chPass) : undefined,
      isYou: i === seatIdx,
    } : null),
    you: me ? {
      seat: seatIdx, rack: me.rack.map(pubTile),
      canMahjong: !!winNow, swaps,
      chSubmitted: !!me.chPass, dead: T.phase === 'play' && me.exp.length > 0 && topFitsCount(T, me) === 0,
    } : null,
  };
}
function send(token, msg) {
  const p = players.get(token);
  if (p && p.ws && p.ws.readyState === 1) { try { p.ws.send(JSON.stringify(msg)); } catch (e) {} }
}
function broadcast(T, evt) {
  T.lastActive = Date.now();
  for (const i of humanSeats(T)) {
    const s = T.seats[i];
    if (evt) send(s.token, evt);
    send(s.token, viewFor(T, i));
  }
}
function eventMsg(kind, data) { return Object.assign({ type: 'event', kind }, data || {}); }

/* ---------- game flow ---------- */
function startGame(T) {
  _tid = 0;
  for (let i = 0; i < 4; i++) if (!T.seats[i]) T.seats[i] = newSeat('bot', BOTNAMES[i]);
  T.wall = shuffle(makeDeck());
  for (const s of T.seats) { s.rack = []; s.exp = []; s.chPass = null; }
  for (let i = 0; i < 13; i++) for (const s of T.seats) s.rack.push(T.wall.pop());
  T.dealer = Math.floor(Math.random() * 4);
  T.seats[T.dealer].rack.push(T.wall.pop());
  T.discards = [];
  T.phase = 'charleston'; T.chStep = 0; T.callWin = null; T.seq++;
  clearTimers(T);
  broadcast(T, eventMsg('start'));
  armCharleston(T);
}
function armCharleston(T) {
  // bots decide instantly; humans get 60s before auto-pass
  later(T, 'charleston', 60000, () => {
    for (const i of humanSeats(T)) {
      const s = T.seats[i];
      if (!s.chPass) s.chPass = botPassTiles(T, s).map(t => t.id);
    }
    tryResolveCharleston(T);
  });
  tryResolveCharleston(T);   // resolves immediately when no connected humans still owe a pass
}
function tryResolveCharleston(T) {
  if (T.phase !== 'charleston') return;
  for (const i of humanSeats(T)) if (!T.seats[i].chPass && !T.seats[i].botSub) return;
  for (let i = 0; i < 4; i++) {
    const s = T.seats[i];
    if (seatDriver(T, i) === 'bot' && !s.chPass) s.chPass = botPassTiles(T, s).map(t => t.id);
  }
  const passes = T.seats.map(s => {
    const out = s.rack.filter(t => s.chPass.includes(t.id)).slice(0, 3);
    s.rack = s.rack.filter(t => !out.includes(t));
    return out;
  });
  const off = [1, 2, 3][T.chStep];
  for (let i = 0; i < 4; i++) T.seats[(i + off) % 4].rack.push(...passes[i]);
  for (const s of T.seats) s.chPass = null;
  T.chStep++;
  if (T.chStep < 3) { broadcast(T, eventMsg('charleston', { step: T.chStep })); armCharleston(T); }
  else beginPlay(T);
}
function beginPlay(T) {
  T.phase = 'play'; T.turn = T.dealer; T.step = 'discard';
  broadcast(T, eventMsg('gameon', { dealer: T.dealer }));
  driveTurn(T);
}
function driveTurn(T) {
  if (T.phase !== 'play') return;
  const i = T.turn, s = T.seats[i];
  if (T.step === 'draw') {
    if (!T.wall.length) return endWallGame(T);
    s.rack.push(T.wall.pop());
    T.step = 'discard';
    broadcast(T, eventMsg('draw', { seat: i }));
  }
  if (seatDriver(T, i) === 'bot') {
    later(T, 'bot', BOT_MS, () => {
      const win = checkWin(T, s);
      if (win) return endWin(T, i, win);
      const t = botDiscardChoice(T, s);
      doDiscard(T, i, t);
    });
  } else {
    // human's discard; relaxed pace = no timer, timed pace = 30s auto
    if (T.config.pace === 'timed') later(T, 'turn', 30000, () => {
      const t = botDiscardChoice(T, s);
      doDiscard(T, i, t);
    });
  }
}
function doDiscard(T, i, t) {
  const s = T.seats[i];
  s.rack = s.rack.filter(x => x.id !== t.id);
  T.discards.push({ t, by: i });
  broadcast(T, eventMsg('discard', { seat: i, tile: pubTile(t) }));
  if (t.s === 'J') { advanceFrom(T, i); return; }
  openCallWindow(T, i, t);
}
function callOptionsFor(T, p, t) {
  const opts = [];
  if (checkWinWith(T, p, t)) opts.push('mahjong');
  const { c, jk } = countsOf(p.rack);
  const copies = c[key(t)] || 0;
  if (copies >= 2 || (copies >= 1 && jk >= 1) || jk >= 2) {
    for (const k of [3, 4, 5]) {
      const need = k - 1, realUse = Math.min(copies, need), jNeed = need - realUse;
      if (jNeed <= jk && copies + jk >= need) opts.push(k === 3 ? 'pung' : k === 4 ? 'kong' : 'quint');
    }
  }
  return opts;
}
function openCallWindow(T, by, t) {
  const eligible = {};
  for (const i of humanSeats(T)) {
    if (i === by || T.seats[i].botSub) continue;
    const opts = callOptionsFor(T, T.seats[i], t);
    if (opts.length) eligible[i] = opts;
  }
  const anyBotsCouldClaim = T.seats.some((s, i) => i !== by && seatDriver(T, i) === 'bot');
  if (!Object.keys(eligible).length && !anyBotsCouldClaim) return advanceFrom(T, by);
  T.callWin = { by, tile: t, deadline: Date.now() + (Object.keys(eligible).length ? 8000 : CALLB_MS), responses: {}, eligible };
  for (const iStr in eligible) send(T.seats[+iStr].token, { type: 'callwin', tile: pubTile(t), options: eligible[iStr], ms: 8000 });
  later(T, 'call', T.callWin.deadline - Date.now(), () => resolveCallWindow(T));
}
function respondCall(T, seat, choice) {
  const cw = T.callWin;
  if (!cw || !cw.eligible[seat] || cw.responses[seat] !== undefined) return;
  if (choice !== 'pass' && !cw.eligible[seat].includes(choice)) return;
  cw.responses[seat] = choice;
  if (Object.keys(cw.eligible).every(i => cw.responses[i] !== undefined)) resolveCallWindow(T);
}
function resolveCallWindow(T) {
  const cw = T.callWin;
  if (!cw || T.phase !== 'play') return;
  T.callWin = null;
  clearTimeout(T.timers.call);
  const t = cw.tile;
  const order = [];
  for (let d = 1; d < 4; d++) order.push((cw.by + d) % 4);
  // 1) human mahjong claims win over everything
  for (const i of order) if (cw.responses[i] === 'mahjong') { T.discards.pop(); T.seats[i].rack.push(t); const w = checkWin(T, T.seats[i]); if (w) return endWin(T, i, w); T.seats[i].rack.pop(); T.discards.push({ t, by: cw.by }); }
  // 2) bot mahjong
  for (const i of order) {
    if (seatDriver(T, i) !== 'bot' || i === cw.by) continue;
    const claim = botClaimCheck(T, T.seats[i], t);
    if (claim && claim.kind === 'mahjong') { T.discards.pop(); T.seats[i].rack.push(t); return endWin(T, i, checkWin(T, T.seats[i])); }
  }
  // 3) human exposures by seat order
  for (const i of order) {
    const r = cw.responses[i];
    if (r === 'pung' || r === 'kong' || r === 'quint') return doExpose(T, i, t, r === 'pung' ? 3 : r === 'kong' ? 4 : 5);
  }
  // 4) bot exposures
  for (const i of order) {
    if (seatDriver(T, i) !== 'bot' || i === cw.by) continue;
    const claim = botClaimCheck(T, T.seats[i], t);
    if (claim && claim.kind === 'expose') return doExpose(T, i, t, claim.k);
  }
  advanceFrom(T, cw.by);
}
function doExpose(T, i, t, k) {
  const s = T.seats[i];
  T.discards.pop();
  const { c } = countsOf(s.rack);
  const copies = c[key(t)] || 0, need = k - 1, realUse = Math.min(copies, need), jNeed = need - realUse;
  const used = [];
  for (const x of s.rack) { if (key(x) === key(t) && used.filter(u => u.s !== 'J').length < realUse) used.push(x); }
  let jc = 0;
  for (const x of s.rack) { if (x.s === 'J' && jc < jNeed) { used.push(x); jc++; } }
  if (used.length !== need) { T.discards.push({ t, by: T.turn }); return advanceFrom(T, T.turn); }
  s.rack = s.rack.filter(x => !used.includes(x));
  s.exp.push({ tiles: [t, ...used], rep: key(t) });
  T.turn = i; T.step = 'discard';
  broadcast(T, eventMsg('call', { seat: i, tile: pubTile(t), k }));
  driveTurn(T);
}
function advanceFrom(T, i) {
  if (T.phase !== 'play') return;
  T.turn = (i + 1) % 4; T.step = 'draw';
  broadcast(T);
  driveTurn(T);
}
function doJokerSwap(T, i, expSeat, expIdx) {
  const me = T.seats[i];
  const owner = T.seats[expSeat];
  if (!owner || !owner.exp[expIdx]) return;
  const e = owner.exp[expIdx];
  const j = e.tiles.find(t => t.s === 'J');
  const real = me.rack.find(t => key(t) === e.rep);
  if (!j || !real) return;
  me.rack = me.rack.filter(t => t !== real);
  e.tiles[e.tiles.indexOf(j)] = real;
  me.rack.push(j);
  broadcast(T, eventMsg('swap', { seat: i }));
}
function finalTiles(p) {
  const all = p.rack.concat(...p.exp.map(e => e.tiles));
  const ORD = { C: 0, B: 1, D: 2, W: 3, G: 4, F: 5, J: 6 }, SUB = { N: 1, E: 2, W: 3, S: 4, R: 1, G: 2, 0: 3 };
  return all.sort((a, b) => ORD[a.s] - ORD[b.s] || ((typeof a.n === 'number' ? a.n : SUB[a.n] || 0) - (typeof b.n === 'number' ? b.n : SUB[b.n] || 0))).map(pubTile);
}
const RESULTS = [];
function pushResult(r) { RESULTS.push(r); if (RESULTS.length > 50) RESULTS.shift(); }
function endWin(T, i, win) {
  pushResult({ r: 'win', hand: win.hand.name, seat: i, kind: T.seats[i].kind });
  T.phase = 'ended'; T.seq++; clearTimers(T);
  const tiles = finalTiles(T.seats[i]);
  const jokerless = !tiles.some(t => t.s === 'J');
  broadcast(T, { type: 'end', result: 'win', seat: i, name: T.seats[i].name,
    hand: win.hand.name, cat: win.hand.cat, pts: win.hand.pts * (jokerless ? 2 : 1), jokerless, tiles });
}
function endWallGame(T) {
  pushResult({ r: 'wall' });
  T.phase = 'ended'; T.seq++; clearTimers(T);
  broadcast(T, { type: 'end', result: 'wall' });
}

/* ---------- connection handling ---------- */
function handleMsg(p, m) {
  const T = p.tableCode ? tables.get(p.tableCode) : null;
  const seat = T ? seatOf(T, p.token) : -1;
  switch (m.type) {
    case 'hello': {
      p.name = String(m.name || 'Player').slice(0, 14) || 'Player';
      send(p.token, { type: 'hello_ok', token: p.token });
      // reconnect into an existing table
      if (T && seat >= 0) {
        const s = T.seats[seat];
        s.connected = true; s.botSub = false;
        clearTimeout(s.graceTimer);
        broadcast(T, eventMsg('rejoin', { seat }));
      }
      break;
    }
    case 'create': {
      if (T) leaveTable(p, T, seat);
      const nt = makeTable(p, m.card || null, m.config || {});
      p.tableCode = nt.code;
      broadcast(nt);
      break;
    }
    case 'join': {
      const code = String(m.code || '').toUpperCase().trim();
      const JT = tables.get(code);
      if (!JT) return send(p.token, { type: 'err', msg: 'No table with that code' });
      const existing = seatOf(JT, p.token);
      if (existing >= 0) {
        p.tableCode = code;
        JT.seats[existing].connected = true; JT.seats[existing].botSub = false;
        return broadcast(JT, eventMsg('rejoin', { seat: existing }));
      }
      if (JT.phase !== 'lobby') return send(p.token, { type: 'err', msg: 'That game already started' });
      let free = -1;
      for (let i = 0; i < 4; i++) if (!JT.seats[i]) { free = i; break; }
      if (free < 0) return send(p.token, { type: 'err', msg: 'Table is full' });
      if (T && seat >= 0) leaveTable(p, T, seat);
      JT.seats[free] = newSeat('human', p.name);
      JT.seats[free].token = p.token; JT.seats[free].connected = true;
      p.tableCode = code;
      broadcast(JT, eventMsg('joined', { seat: free, name: p.name }));
      break;
    }
    case 'start': {
      if (!T || seat !== 0 || T.phase !== 'lobby') return;
      startGame(T);
      break;
    }
    case 'rematch': {
      if (!T || seat !== 0 || T.phase !== 'ended') return;
      startGame(T);
      break;
    }
    case 'chpass': {
      if (!T || seat < 0 || T.phase !== 'charleston') return;
      const s = T.seats[seat];
      const ids = Array.isArray(m.tiles) ? m.tiles.slice(0, 3) : [];
      const tiles = s.rack.filter(t => ids.includes(t.id) && t.s !== 'J');
      if (tiles.length !== 3) return send(p.token, { type: 'err', msg: 'Pick exactly 3 tiles (no jokers)' });
      s.chPass = tiles.map(t => t.id);
      broadcast(T);
      tryResolveCharleston(T);
      break;
    }
    case 'discard': {
      if (!T || seat < 0 || T.phase !== 'play' || T.turn !== seat || T.step !== 'discard' || T.callWin) return;
      const s = T.seats[seat];
      const t = s.rack.find(x => x.id === m.id);
      if (!t) return;
      clearTimeout(T.timers.turn);
      doDiscard(T, seat, t);
      break;
    }
    case 'call': {
      if (!T || seat < 0) return;
      respondCall(T, seat, String(m.choice || 'pass'));
      break;
    }
    case 'mahjong': {
      if (!T || seat < 0 || T.phase !== 'play' || T.turn !== seat || T.step !== 'discard' || T.callWin) return;
      const w = checkWin(T, T.seats[seat]);
      if (w) endWin(T, seat, w);
      else send(p.token, { type: 'err', msg: 'Not a winning hand' });
      break;
    }
    case 'swap': {
      if (!T || seat < 0 || T.phase !== 'play' || T.turn !== seat || T.step !== 'discard' || T.callWin) return;
      doJokerSwap(T, seat, m.seat | 0, m.exp | 0);
      break;
    }
    case 'leave': {
      if (T && seat >= 0) leaveTable(p, T, seat);
      p.tableCode = null;
      send(p.token, { type: 'left' });
      break;
    }
    case 'ping': send(p.token, { type: 'pong' }); break;
  }
}
function leaveTable(p, T, seat) {
  if (seat < 0) return;
  if (T.phase === 'lobby') {
    T.seats[seat] = seat === 0 ? T.seats[seat] : null;   // host slot persists until table dies
    if (seat === 0) { tables.delete(T.code); clearTimers(T); for (const i of humanSeats(T)) if (i !== 0) send(T.seats[i].token, { type: 'err', msg: 'Host closed the table' }); return; }
  } else {
    const s = T.seats[seat];
    s.botSub = true; s.connected = false; s.token = null;   // deliberate exit: stop sending this player anything
    clearTimeout(s.graceTimer);
    if (T.phase === 'charleston') tryResolveCharleston(T);
    else if (T.phase === 'play' && T.turn === seat && T.step === 'discard' && !T.callWin) driveTurn(T);
    else if (T.callWin && T.callWin.eligible[seat] && T.callWin.responses[seat] === undefined) respondCall(T, seat, 'pass');
  }
  broadcast(T, eventMsg('leftseat', { seat }));
}
function onDisconnect(p) {
  const T = p.tableCode ? tables.get(p.tableCode) : null;
  if (!T) return;
  const seat = seatOf(T, p.token);
  if (seat < 0) return;
  const s = T.seats[seat];
  s.connected = false;
  broadcast(T, eventMsg('disconnected', { seat }));
  s.graceTimer = setTimeout(() => {
    if (!s.connected && tables.get(T.code) === T) {
      s.botSub = true;
      broadcast(T, eventMsg('botsub', { seat }));
      if (T.phase === 'charleston') tryResolveCharleston(T);
      else if (T.phase === 'play' && T.turn === seat && !T.callWin) driveTurn(T);
      else if (T.callWin && T.callWin.eligible[seat] && T.callWin.responses[seat] === undefined) respondCall(T, seat, 'pass');
    }
  }, 30000);
}

/* ---------- housekeeping ---------- */
setInterval(() => {
  const now = Date.now();
  for (const [code, T] of tables) {
    if (now - T.lastActive > 6 * 3600 * 1000) { clearTimers(T); tables.delete(code); }
  }
}, 600000);

/* ---------- server ---------- */
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'content-type': 'application/json', 'access-control-allow-origin': '*' });
  res.end(JSON.stringify({ ok: true, app: 'ooh-la-mahj', tables: tables.size, results: (typeof RESULTS !== 'undefined' ? RESULTS : []) }));
});
const wss = new WebSocketServer({ server });
wss.on('connection', (ws, req) => {
  const url = new URL(req.url, 'http://x');
  const token = String(url.searchParams.get('t') || '').slice(0, 64);
  if (!token) { ws.close(); return; }
  let p = players.get(token);
  if (!p) { p = { token, name: 'Player', ws: null, tableCode: null }; players.set(token, p); }
  if (p.ws && p.ws !== ws) { try { p.ws.close(); } catch (e) {} }
  p.ws = ws;
  ws.on('message', data => {
    let m;
    try { m = JSON.parse(String(data).slice(0, 200000)); } catch (e) { return; }
    try { handleMsg(p, m); } catch (e) { console.error('handleMsg', e); }
  });
  ws.on('close', () => { if (p.ws === ws) { p.ws = null; onDisconnect(p); } });
});
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => console.log('Ooh La Mahj server on :' + PORT));
