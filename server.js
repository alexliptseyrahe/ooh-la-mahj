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
function topFits3(T, p) {
  const { c, jk } = countsOf(p.rack); const hasExp = p.exp.length > 0; const ec = expCount(p);
  const list = [];
  for (const h of T.hands) {
    if (h.concealed && (hasExp || jk > 0)) continue;
    let best = null;
    for (const v of h.variants) {
      const rem = lockGroups(p, v);
      if (!rem) continue;
      const s = ec + scoreVariant(c, jk, rem);
      if (!best || s > best.score) best = { hand: h, rem, score: s };
    }
    if (best) list.push(best);
  }
  list.sort((a, b) => b.score - a.score);
  return list.slice(0, 3);
}
const BOT_D = +process.env.BOT_D || 1;
/* scored discard: danger×D − optionValue, lowest wins. Table-visible info only. */
function botDiscardChoice(T, p) {
  const bf = bestFit(T, p); const keep = bf ? keepIdsFor(p, bf.rem) : new Set();
  let cand = p.rack.filter(t => t.s !== 'J' && !keep.has(t.id));
  if (!cand.length) cand = p.rack.filter(t => t.s !== 'J');
  if (!cand.length) cand = p.rack.slice();
  const vis = {};
  for (const d of T.discards) { const k2 = key(d.t); vis[k2] = (vis[k2] || 0) + 1; }
  for (const s of T.seats) { if (!s) continue; for (const e of s.exp) for (const t of e.tiles) { if (t.s !== 'J') { const k2 = key(t); vis[k2] = (vis[k2] || 0) + 1; } } }
  const fits = topFits3(T, p);
  const alt1 = fits[1] ? keepIdsFor(p, fits[1].rem) : new Set();
  const alt2 = fits[2] ? keepIdsFor(p, fits[2].rem) : new Set();
  const late = T.wall.length < 15 ? 2 : T.wall.length < 30 ? 1.5 : 1;
  const myIdx = T.seats.indexOf(p);
  let best = null, bestScore = Infinity;
  for (const t of cand) {
    const tk = key(t);
    const mine = p.rack.filter(x => key(x) === tk).length;
    const outstanding = Math.max(0, (t.s === 'F' ? 8 : 4) - (vis[tk] || 0) - mine);
    const liveMult = outstanding <= 0 ? 0.05 : outstanding === 1 ? 0.45 : 1;
    let danger = 0.4;
    T.seats.forEach((s, q) => {
      if (!s || q === myIdx) return;
      for (const e of s.exp) {
        const rs = e.rep[0], rn = parseInt(e.rep.slice(1));
        if (t.s === 'F') { if (rs === 'F') danger += 0.8; continue; }
        if (t.s === 'W' || t.s === 'G') { if (rs === 'W' || rs === 'G') danger += 0.5; continue; }
        if (rs === t.s && !isNaN(rn) && Math.abs(rn - t.n) <= 2) danger += 1.2;
        else if (!isNaN(rn) && rn === t.n && 'CBD'.includes(rs)) danger += 0.8;
      }
    });
    danger *= liveMult * late;
    let opt = 0;
    if (alt1.has(t.id)) opt += 0.8;
    if (alt2.has(t.id)) opt += 0.4;
    const sc = BOT_D * danger - opt + Math.random() * 0.15;
    if (sc < bestScore) { bestScore = sc; best = t; }
  }
  return best || cand[0];
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
  if (bf.hand.concealed) return null; /* never expose into a concealed-only hand */
  const grp = bf.rem.find(([tk, k]) => tk === key(t) && k >= 3);
  if (!grp) return null;
  const { c, jk } = countsOf(p.rack);
  const copies = c[key(t)] || 0;
  if (copies < 2) return null;
  const k = grp[1], need = k - 1, realUse = Math.min(copies, need), jNeed = need - realUse;
  if (jNeed > jk) return null;
  if (Math.random() >= 0.95) return null;
  return { kind: 'expose', k };
}

const BOT_MS = +process.env.BOT_MS || 1000;
const CALLB_MS = +process.env.CALLB_MS || 1200;
/* ================= STATS ================= */
const STATS = { boot: Date.now(), loads: 0, uniq: new Set(), tables: 0, games: 0,
  ends: { win: 0, wall: 0 }, clientErrors: [], serverErrors: [] };
function statErr(list, msg) { list.push({ t: new Date().toISOString(), m: String(msg).slice(0, 200) }); if (list.length > 30) list.shift(); }
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
  STATS.tables++;
  console.log(JSON.stringify({ ev: 'table_created', code, at: new Date().toISOString() }));
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
  STATS.games++;
  console.log(JSON.stringify({ ev: 'game_started', code: T.code, humans: humanSeats(T).length, at: new Date().toISOString() }));
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
  STATS.ends.win++;
  pushResult({ r: 'win', hand: win.hand.name, seat: i, kind: T.seats[i].kind });
  T.phase = 'ended'; T.seq++; clearTimers(T);
  const tiles = finalTiles(T.seats[i]);
  const jokerless = !tiles.some(t => t.s === 'J');
  broadcast(T, { type: 'end', result: 'win', seat: i, name: T.seats[i].name,
    hand: win.hand.name, cat: win.hand.cat, pts: win.hand.pts * (jokerless ? 2 : 1), jokerless, tiles });
}
function endWallGame(T) {
  STATS.ends.wall++;
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
      if (T && seat >= 0) leaveTable(p, T, seat);
      if (JT.phase === 'lobby') {
        let free = -1;
        for (let i = 0; i < 4; i++) if (!JT.seats[i]) { free = i; break; }
        if (free < 0) return send(p.token, { type: 'err', msg: 'Table is full' });
        JT.seats[free] = newSeat('human', p.name);
        JT.seats[free].token = p.token; JT.seats[free].connected = true;
        p.tableCode = code;
        broadcast(JT, eventMsg('joined', { seat: free, name: p.name }));
      } else {
        // game in progress: take over a bot-driven seat, inheriting its tiles
        let claim = -1;
        for (let i = 0; i < 4; i++) {
          const s = JT.seats[i];
          if (s && (s.kind === 'bot' || (s.botSub && !s.token))) { claim = i; break; }
        }
        if (claim < 0) return send(p.token, { type: 'err', msg: 'Table is full — no bot seats to take over' });
        const s = JT.seats[claim];
        s.kind = 'human'; s.token = p.token; s.name = p.name;
        s.connected = true; s.botSub = false;
        clearTimeout(s.graceTimer);
        p.tableCode = code;
        if (JT.phase === 'play' && JT.turn === claim) clearTimeout(JT.timers.bot);
        broadcast(JT, eventMsg('takeover', { seat: claim, name: p.name }));
        if (JT.phase === 'charleston') tryResolveCharleston(JT);
      }
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


/* ================= CARD READER LAB ================= */
const { webcrypto: wcrypto } = require('crypto');
const LAB_VERSION = 'r17';
const ADMIN_KEY = process.env.ADMIN_KEY || 'FLAMINGO';
const OLM_API_KEY = process.env.OLM_API_KEY || '';
const SITE_BASE = process.env.SITE_BASE || 'https://kliptseyrahe.github.io/ooh-la-mahj';
const MOCK_AI = !!process.env.MOCK_AI;

async function decryptBundle(txt, code) {
  const o = JSON.parse(txt);
  const b = s => Uint8Array.from(Buffer.from(s, 'base64'));
  const km = await wcrypto.subtle.importKey('raw', new TextEncoder().encode(code.trim().toUpperCase()), 'PBKDF2', false, ['deriveKey']);
  const key = await wcrypto.subtle.deriveKey({ name: 'PBKDF2', salt: b(o.s), iterations: 200000, hash: 'SHA-256' }, km, { name: 'AES-GCM', length: 256 }, false, ['decrypt']);
  const pt = await wcrypto.subtle.decrypt({ name: 'AES-GCM', iv: b(o.i) }, key, b(o.c));
  return JSON.parse(new TextDecoder().decode(pt));
}
let FIXCACHE = {};
async function loadFixture(set, code, base, file) {
  const fname = file || ('set-' + set + '.enc');
  const urls = [];
  for (const b of [base, SITE_BASE, 'https://raw.githubusercontent.com/alexliptseyrahe/ooh-la-mahj/main/ooh-la-mahj'.replace('/ooh-la-mahj$',''), 'https://alexliptseyrahe.github.io/ooh-la-mahj', 'https://raw.githubusercontent.com/alexliptseyrahe/ooh-la-mahj/main']) {
    if (b && !urls.includes(b + '/fixtures/' + fname)) urls.push(b + '/fixtures/' + fname);
  }
  const names = [fname, fname.replace('set-', 'set'), fname.replace(/^set(\d)/, 'set-$1')];
  const tries = [];
  for (const u of urls) for (const n of names) {
    const t = u.replace(fname, n);
    if (!tries.includes(t)) tries.push(t);
  }
  const ck = tries[0];
  if (FIXCACHE[ck]) return FIXCACHE[ck];
  let lastErr = 'no url worked';
  for (const t of tries) {
    try {
      const r = await fetch(t);
      if (!r.ok) { lastErr = 'fetch ' + r.status + ' at ' + t; continue; }
      const fx = await decryptBundle(await r.text(), code);
      FIXCACHE[ck] = fx;
      return fx;
    } catch (e) { lastErr = e.message + ' at ' + t; }
  }
  throw new Error('fixture: ' + lastErr);
}

/* ---- AI calls ---- */
let LAB_MODEL = null;
async function labPickModel(prefer) {
  if (prefer) return prefer;
  if (LAB_MODEL) return LAB_MODEL;
  try {
    const r = await fetch('https://api.anthropic.com/v1/models?limit=100', {
      headers: { 'x-api-key': OLM_API_KEY, 'anthropic-version': '2023-06-01' } });
    if (r.ok) {
      const ids = ((await r.json()).data || []).map(m => m.id);
      const pick = f => ids.filter(i => i.includes(f) && !i.includes('haiku')).sort().reverse()[0];
      LAB_MODEL = pick('opus') || pick('sonnet') || ids[0];
    }
  } catch (e) {}
  if (!LAB_MODEL) LAB_MODEL = 'claude-sonnet-4-5';
  return LAB_MODEL;
}
let THINK_MODE = 'adaptive';   // adaptive -> enabled -> none, auto-negotiated
let NO_TEMP = false;           // some newer models reject the temperature parameter
async function labCallAI(content, opts) {
  opts = opts || {};
  if (MOCK_AI) return mockAI(content);
  const model = await labPickModel(opts.model);
  const modes = [THINK_MODE].concat(['adaptive','enabled','none'].filter(m => m !== THINK_MODE));
  let lastErr = null;
  for (const mode of (opts.think === false ? ['none'] : modes)) {
    const body = { model, max_tokens: 24000, messages: [{ role: 'user', content }] };
    if (mode === 'adaptive') { body.thinking = { type: 'adaptive' }; body.output_config = { effort: opts.effort || 'high' }; }
    else if (mode === 'enabled') { body.thinking = { type: 'enabled', budget_tokens: 8000 }; }
    else { if (!NO_TEMP) body.temperature = 0; body.max_tokens = 16000; }
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': OLM_API_KEY, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify(body) });
    const j = await r.json();
    if (r.ok) {
      THINK_MODE = mode;
      const text = (j.content || []).filter(c => c.type === 'text').map(c => c.text || '').join('').trim();
      return { text, usage: j.usage || {}, model };
    }
    const msg = ((j.error && j.error.message) || '').slice(0, 250);
    lastErr = 'AI ' + r.status + ': ' + msg;
    if (r.status === 400 && /temperature/i.test(msg) && !NO_TEMP) { NO_TEMP = true; return labCallAI(content, opts); }
    if (!(r.status === 400 && /thinking|output_config|effort|budget/i.test(msg))) break;
  }
  throw new Error(lastErr || 'AI call failed');
}
function mockAI(content) {
  const t = content[0].text;
  const mockLines = [
    { text: '222 000 2222 6666', colors: '222 green, 000 black, 2222 red, 6666 red', ann: '(Any 2 Suits)', val: 'X25', cat: '2026' },
    { text: 'FFF 2026 222 6666', colors: 'FFF black, 2026 green, 222 red, 6666 black', ann: '(Any 3 Suits)', val: 'X25', cat: '2026' },
  ];
  if (t.startsWith('This photo shows') || t.includes('DRAFT:'))
    return { text: JSON.stringify(mockLines), usage: { input_tokens: 100, output_tokens: 50 }, model: 'mock' };
  return { text: JSON.stringify({ title: 'MY 2026 CARD', hands: [
    { name: '222 000 2222 6666', cat: '2026', pts: 25, c: false, alts: [{ g: ['3:2a','3:0','4:2b','4:6b'] }] },
    { name: 'FFF 2026 222 6666', cat: '2026', pts: 25, c: false, alts: [{ g: ['3:F','2:2a','1:0','1:6a','3:2b','4:6c'] }] },
  ]}), usage: { input_tokens: 200, output_tokens: 80 }, model: 'mock' };
}

/* ---- prompts ---- */
const LAB_STAGE_A = `This photo shows ONE panel of an American mah jongg scoring card. It is the owner's own purchased physical card, photographed by them so their game app can use it privately for their personal play - a personal-use transcription, not reproduction for distribution. Transcribe every printed hand line.

Output ONLY a JSON array. One element per printed hand row:
{"text":"<the TILE GROUPS ONLY exactly as printed, e.g. FFF 2026 222 6666 - include a - or - alternate if the row has one, NEVER include the annotation or value here>","colors":"<color of each tile segment in printed order, e.g. FFF black, 2026 green, 222 red, 6666 red>","ann":"<the parenthetical annotation exactly as printed>","val":"<the value code at the right edge, e.g. X25 or C30>","cat":"<the section header this row sits under, e.g. 2468>"}

Rules:
- One element per printed row. Never combine two rows. Never split one row into two.
- Copy digits and letters EXACTLY. Count repeated characters with extreme care: 2222 is four 2s, 222 is three, FFFFFF is six Fs. Re-check every group's count against the photo before output.
- Section headers are not hands - they go only in "cat".
- Do not skip any row. No markdown fences, no commentary - the JSON array only.`;
const LAB_VERIFY = `Here is the same card panel photo and a draft transcription of its hand rows. Verify the draft against the photo, row by row: check every group's exact repeated-character count (222 vs 2222 vs 22), missing or merged rows, wrong colors, wrong annotations, wrong values. Return the fully corrected JSON array in the same format - every printed row, one element each, tile groups only in "text". Output the corrected JSON array only, no commentary.

DRAFT:
`;
const LAB_STAGE_B_HEAD = `You are given transcribed lines from one panel of an American mah jongg scoring card. Convert EVERY line into a compact JSON notation. Each input line gives: text (tile groups as printed), colors (segments printed in the SAME color share a suit; DIFFERENT colors are different suits; flowers, winds, soap/zero and standalone dragons are neutral), ann (the annotation - TRUST THIS over colors if they conflict), val (X=exposed so "c":false, C=concealed so "c":true; the number is "pts"), cat (section).

TILES: three suits exist (we call them a, b, c - distinct suits).
GROUP SYNTAX: each group is "<count>:<tiles>" where count 1-6 is how many tiles.
- Number tile in a suit: "2a" (a 2 in suit a), "7b", etc.
- "0" = white dragon used as zero (soap). "F" = flower. "N","E","W","S" = winds.
- "DR","DG","DW" = specific red/green/white dragon.
- "da" = the dragon MATCHING suit a (likewise "db","dc").
- "xa" = a dragon NOT matching suit a (opposite dragon).
- "dd" = any one dragon (same dragon throughout the alternative).
- "d1","d2","d3" = DISTINCT dragons, filled in every possible assignment. A single "4:d1" kong = a kong of any one dragon. Two dragon groups "d1","d2" = any two DIFFERENT dragons. Three D groups (e.g. DDD DDD DDDD) = "3:d1","3:d2","4:d3" so every arrangement of the three dragons is allowed.
- "w1","w2","w3","w4" = DISTINCT winds, every possible assignment (a kong of any one wind = "4:w1").
- Variable number: "na" = number n in suit a; "n1a" = n+1 in suit a, up to "n6a". Set n's range with "n" field: "1-5", "odd", "even", "1,5", "1-9".
- "ma" = a second independent number m (never equal to n), range via "m".
- "pa" = a chosen number p, range via "p" (e.g. "2,4,6,8" for "kong 2, 4, 6 or 8").

HAND ENTRY: {"name":"<the line text>","cat":"<section>","pts":<number>,"c":<true if C else false>,"note":"<annotation>","alts":[{...}]}
Each alt: {"g":["3:2a","3:0","4:2b","4:6b"],"n":"1-5"} (n/m/p only when used). Group counts in an alt MUST total 14.
- "- or -" versions and "Any 1 or 2 Suits" style annotations need one alt per arrangement.
- "name" must be the printed tile groups of the FIRST arrangement ONLY. If the line contains "- or -", NEVER include "- or -" or the repeated groups in "name" - the alternate arrangements go in "alts" instead.
- When structure depends on a chosen number in a way p cannot express (e.g. "pair any odd, singles of the remaining odds"), write one alt per choice with literal numbers.
- "These Nos. Only" means literal numbers; "Any ... Consec." means n variables.
- Within ONE printed group, repeated identical tiles are ONE entry: "2026" in suit a = "2:2a","1:0","1:6a" - NEVER "1:2a","1:0","1:2a","1:6a".
- DRAGON RULES: use "da" (matching dragon) ONLY when the annotation literally says Matching. "Any Dragon" = "d1". Standalone printed D groups with no annotation tying them to a suit = "d1"/"d2"/"d3" (distinct, free assignment) - never hardcode DR/DG/DW for them, and never restrict a dragon kong to fewer choices than the card allows.
- A printed group of a specific wind (NNNN) is that wind - but "Any Wind" in the annotation = "w1".
- NEVER invent suit arrangements the annotation does not state (e.g. do not split numbers across 2 suits unless the card says 2 or 3 suits).

EXAMPLES:
"222 000 2222 6666 (Any 2 Suits) X25" in 2026 -> {"name":"222 000 2222 6666","cat":"2026","pts":25,"c":false,"note":"Any 2 suits","alts":[{"g":["3:2a","3:0","4:2b","4:6b"]}]}
"FFF 1111 234 5555 (Any 1 or 2 Suits, Any 5 Consec. Nos.) X25" where the 2-suit version prints 1111 and 5555 in one color and 234 in another -> {"name":"FFF 1111 234 5555","cat":"CONSECUTIVE RUN","pts":25,"c":false,"note":"Any 1 or 2 suits, any 5 consecutive","alts":[{"n":"1-5","g":["3:F","4:na","1:n1a","1:n2a","1:n3a","4:n4a"]},{"n":"1-5","g":["3:F","4:na","1:n1b","1:n2b","1:n3b","4:n4a"]}]}
FOLLOW THE PRINTED COLORS EXACTLY for which groups share a suit - never assume, the colors are the ground truth.
"11111 44444 DDDD (Any 2 Nos. in Any 1 Suit w Opp. Dragon) X40" -> {"name":"11111 44444 DDDD","cat":"QUINTS","pts":40,"c":false,"note":"Any 2 numbers, 1 suit, opposite dragon","alts":[{"n":"1-9","m":"1-9","g":["5:na","5:ma","4:xa"]}]}
"NN EE WW SS 1D 1D 1D (Any 3 Suits, Any Like No. w Matching Dragon) C50" -> {"name":"NN EE WW SS 1D 1D 1D","cat":"SINGLES AND PAIRS","pts":50,"c":true,"note":"Any like number with matching dragons","alts":[{"n":"1-9","g":["2:N","2:E","2:W","2:S","1:na","1:da","1:nb","1:db","1:nc","1:dc"]}]}

OUTPUT: only raw JSON, no fences: {"title":"MY <year> CARD","hands":[ one entry per input line, in order ]}
The number of hand entries MUST equal the number of input lines. Never merge or skip lines.`;

/* ---- expander (ported from client) ---- */
function labParseNums(spec, maxOff) {
  let vals = [];
  if (spec === 'odd') vals = [1,3,5,7,9];
  else if (spec === 'even') vals = [2,4,6,8];
  else if (/^\d+-\d+$/.test(spec)) { const [a,b] = spec.split('-').map(Number); for (let i=a;i<=b;i++) vals.push(i); }
  else vals = spec.split(',').map(Number).filter(x=>x>=1&&x<=9);
  return vals.filter(v => v + maxOff <= 9);
}
function labSuitAssigns(k) {
  if (k === 0) return [[]];
  const out = [];
  for (const a of SUITS) { if (k===1){out.push([a]);continue}
    for (const b of SUITS) { if (b===a) continue; if (k===2){out.push([a,b]);continue}
      for (const c of SUITS) { if (c===a||c===b) continue; out.push([a,b,c]); } } }
  return out;
}
function labExpand(cc) {
  if (!cc || !Array.isArray(cc.hands) || !cc.hands.length) throw new Error('no hands in reading');
  const DRAGS = ['GR','GG','G0'];
  const hands = [], fails = [];
  for (const h of cc.hands) {
    const seen = new Set(), variants = [];
    let failReason = '';
    for (const alt of (h.alts || [])) {
      const toks = []; const suitVars = new Set();
      let useN=false, useM=false, useP=false, useDD=false, useDP=false, useWP=false, xRef=null, maxOff=0, bad=false;
      for (const t of (alt.g || [])) {
        const mm = /^([1-6]):(.+)$/.exec(String(t).replace(/\s+/g,''));
        if (!mm) { bad=true; failReason='could not parse group "'+t+'"'; break; }
        const k = +mm[1], sp = mm[2]; let r;
        if (/^(F|N|E|W|S|0|DR|DG|DW)$/.test(sp)) {}
        else if (sp === 'dd') useDD = true;
        else if (/^d[123]$/.test(sp)) useDP = true;
        else if (/^w[1-4]$/.test(sp)) useWP = true;
        else if (r = /^d([abc])$/.exec(sp)) suitVars.add(r[1]);
        else if (r = /^x([abc])$/.exec(sp)) { suitVars.add(r[1]); xRef = r[1]; }
        else if (r = /^([1-9])([abc])$/.exec(sp)) suitVars.add(r[2]);
        else if (r = /^n([0-6]?)([abc])$/.exec(sp)) { useN=true; suitVars.add(r[2]); maxOff=Math.max(maxOff, +(r[1]||0)); }
        else if (r = /^m([abc])$/.exec(sp)) { useM=true; suitVars.add(r[1]); }
        else if (r = /^p([abc])$/.exec(sp)) { useP=true; suitVars.add(r[1]); }
        else { bad=true; failReason='unknown tile token "'+sp+'"'; break; }
        toks.push({ k, sp });
      }
      if (bad || !toks.length) continue;
      const tot = toks.reduce((s,t)=>s+t.k,0);
      if (tot !== 14) { failReason='groups total '+tot+' tiles, must be 14'; continue; }
      const nV = useN ? labParseNums(String(alt.n||h.n||'1-9'), maxOff) : [0];
      const mV = useM ? labParseNums(String(alt.m||h.m||'1-9'), 0) : [0];
      const pV = useP ? labParseNums(String(alt.p||h.p||'1-9'), 0) : [0];
      const dV = useDD ? DRAGS : [null];
      const permsOf = a => a.length<=1 ? [a] : a.flatMap((x,i)=>permsOf(a.slice(0,i).concat(a.slice(i+1))).map(rest=>[x].concat(rest)));
      const dPerms = useDP ? permsOf(DRAGS) : [null];
      const wPerms = useWP ? permsOf(['WN','WE','WW','WS']) : [null];
      const sv = [...suitVars];
      for (const asg of labSuitAssigns(sv.length)) {
        const smap = {}; sv.forEach((v,i)=>smap[v]=asg[i]);
        const xV = xRef ? DRAGS.filter(d=>d!==DRAGON[smap[xRef]]) : [null];
        for (const n of nV) for (const m of mV) {
          if (useN && useM && m === n) continue;
          for (const p of pV) for (const dd of dV) for (const xx of xV) for (const dpm of dPerms) for (const wpm of wPerms) {
            const v = []; let good = true;
            for (const { k, sp } of toks) {
              let tk = null, r;
              if (sp==='F') tk='F';
              else if (/^[NEWS]$/.test(sp)) tk='W'+sp;
              else if (sp==='0') tk='G0';
              else if (sp==='DR') tk='GR';
              else if (sp==='DG') tk='GG';
              else if (sp==='DW') tk='G0';
              else if (sp==='dd') tk=dd;
              else if (r=/^d([123])$/.exec(sp)) tk=dpm[+r[1]-1];
              else if (r=/^w([1-4])$/.exec(sp)) tk=wpm[+r[1]-1];
              else if (r=/^d([abc])$/.exec(sp)) tk=DRAGON[smap[r[1]]];
              else if (r=/^x([abc])$/.exec(sp)) tk=xx;
              else if (r=/^([1-9])([abc])$/.exec(sp)) tk=smap[r[2]]+r[1];
              else if (r=/^n([0-6]?)([abc])$/.exec(sp)) { const num=n+ +(r[1]||0); if(num<1||num>9){good=false;break} tk=smap[r[2]]+num; }
              else if (r=/^m([abc])$/.exec(sp)) tk=smap[r[1]]+m;
              else if (r=/^p([abc])$/.exec(sp)) tk=smap[r[1]]+p;
              if (!tk) { good=false; break; }
              v.push([tk,k]);
            }
            if (!good) continue;
            const kv = v.map(x=>x[0]+x[1]).sort().join('|');
            if (seen.has(kv) || variants.length > 4000) continue;
            seen.add(kv); variants.push(v);
          }
        }
      }
    }
    if (!variants.length) { fails.push({ name: String(h.name||'Hand'), reason: failReason || 'no valid arrangements' }); continue; }
    hands.push({ name: String(h.name||'Hand'), cat: String(h.cat||'CARD'), pts: +h.pts||25,
      concealed: !!h.c, note: String(h.note||''), disp: [[String(h.name||'Hand'),'cN']], variants,
      src: { alts: h.alts, n: h.n, m: h.m, p: h.p } });
  }
  return { title: String(cc.title||'MY CARD'), hands, fails };
}
function labParseLoose(txt, arr) {
  txt = txt.replace(/```(json)?/g, '').trim();
  const o = arr ? '[' : '{', c = arr ? ']' : '}';
  const a = txt.indexOf(o), b = txt.lastIndexOf(c);
  if (a < 0 || b < 0) throw new Error('unparseable output' + (txt ? ' — model said: "' + txt.slice(0, 140) + '"' : ' (empty response)'));
  return JSON.parse(txt.slice(a, b + 1));
}
const IMG = b64 => ({ type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: b64 } });

/* ---- strategies ---- */
const STRATS = {
  A: { desc: 'top model, two-stage, verify pass, thinking', verify: true, think: true, model: null },
  B: { desc: 'top model, two-stage, NO verify, thinking', verify: false, think: true, model: null },
  C: { desc: 'sonnet, two-stage, verify pass, thinking', verify: true, think: true, model: 'claude-sonnet-4-5' },
};
async function runPanel(b64, S, usage) {
  const track = r => { usage.in += (r.usage.input_tokens||0); usage.out += (r.usage.output_tokens||0); usage.model = r.model; return r.text; };
  let lines = null;
  for (let a = 0; a < 2; a++) {
    try {
      const txt = track(await labCallAI([{ type:'text', text: LAB_STAGE_A }, IMG(b64)], { think: S.think, model: S.model }));
      lines = labParseLoose(txt, true).filter(x => x && x.text);
      if (lines.length) break;
    } catch (e) { if (a === 1) throw e; }
  }
  if (!lines || !lines.length) throw new Error('no lines read');
  if (S.verify) {
    try {
      const vtxt = track(await labCallAI([{ type:'text', text: LAB_VERIFY + JSON.stringify(lines) }, IMG(b64)], { think: S.think, model: S.model }));
      const vlines = labParseLoose(vtxt, true).filter(x => x && x.text);
      if (vlines.length >= lines.length * .7) lines = vlines;
    } catch (e) {}
  }
  let best = null, extra = null;
  for (let a = 0; a < 3; a++) {
    const prompt = LAB_STAGE_B_HEAD + '\n\nINPUT LINES (' + lines.length + ' hands - output exactly ' + lines.length + ' entries):\n'
      + JSON.stringify(lines) + (extra ? '\n\nYOUR PREVIOUS ATTEMPT HAD PROBLEMS: ' + extra + ' - output the complete corrected JSON.' : '');
    try {
      const cc = labParseLoose(track(await labCallAI([{ type:'text', text: prompt }], { think: S.think, model: S.model })), false);
      const r = labExpand(cc);
      if (!best || r.hands.length > best.hands.length) best = r;
      const missing = lines.length - ((cc.hands||[]).length);
      if (!r.fails.length && missing <= 0) { best = r; break; }
      extra = (r.fails.length ? 'invalid: ' + r.fails.map(f=>'"'+f.name+'" ('+f.reason+')').join('; ') : '')
        + (missing > 0 ? '; output ' + (lines.length-missing) + ' of ' + lines.length + ' hands' : '');
    } catch (e) { if (a === 2 && !best) throw e; extra = 'previous output was not valid JSON'; }
  }
  /* consensus pass: convert a second time, independently; any hand whose
     patterns differ between the two readings gets flagged uncertain */
  if (best && best.hands.length) {
    try {
      const p2 = LAB_STAGE_B_HEAD + '\n\nINPUT LINES (' + lines.length + ' hands - output exactly ' + lines.length + ' entries):\n' + JSON.stringify(lines);
      const cc2 = labParseLoose(track(await labCallAI([{ type:'text', text: p2 }], { think: S.think, model: S.model })), false);
      const r2 = labExpand(cc2);
      const sig2 = new Map(r2.hands.map(h => [normName(h.name), handSig(h)]));
      for (const h of best.hands) {
        const s2 = sig2.get(normName(h.name));
        if (!s2 || s2 !== handSig(h)) h.uncertain = true;
      }
    } catch (e) { /* consensus unavailable; no flags added */ }
  }
  return { lines, result: best };
}
const normName = s => String(s||'').replace(/[^0-9A-Z]/gi,'').toUpperCase();
/* gameplay-equivalent canonical form: groups of 3+ (joker-eligible) kept as-is,
   smaller groups pooled into a tile multiset — so "2:2a" vs "1:2a","1:2a" score equal */
const canonV = v => {
  const big = [], small = {};
  for (const [tk, k] of v) { if (k >= 3) big.push(tk + ':' + k); else small[tk] = (small[tk] || 0) + k; }
  return big.sort().join('|') + '#' + Object.keys(small).sort().map(t => t + ':' + small[t]).join('|');
};
const handSig = h => h.variants.map(canonV).sort().join('~');
function scoreCard(got, golden) {
  const gBySig = new Map(), gByName = new Map();
  for (const h of golden.hands) { gBySig.set(handSig(h), h); gByName.set(normName(h.name), h); }
  const matchedGolden = new Set();
  let exact = 0, nameOnly = 0, extra = 0;
  const nameOnlyList = [], extraList = [];
  for (const h of got) {
    const sig = handSig(h);
    if (gBySig.has(sig) && !matchedGolden.has(gBySig.get(sig))) { exact++; matchedGolden.add(gBySig.get(sig)); continue; }
    const gn = gByName.get(normName(h.name));
    if (gn && !matchedGolden.has(gn)) { nameOnly++; matchedGolden.add(gn);
      const gotSet = new Set(h.variants.map(canonV)), wantSet = new Set(gn.variants.map(canonV));
      nameOnlyList.push({ got: h.name, gotV: h.variants.length, wantV: gn.variants.length,
        flagged: !!h.uncertain, dsl: h.src || null,
        onlyGot: [...gotSet].filter(x => !wantSet.has(x)).slice(0, 3),
        onlyWant: [...wantSet].filter(x => !gotSet.has(x)).slice(0, 3) });
      continue; }
    extra++; extraList.push({ name: h.name, dsl: h.src || null });
  }
  const missing = golden.hands.filter(h => !matchedGolden.has(h)).map(h => h.name);
  const uncertain = got.filter(h => h.uncertain).length;
  const silentWrong = nameOnlyList.filter(e => !e.flagged).length;
  return { goldenHands: golden.hands.length, exact, nameOnly, missing, extra, uncertain, silentWrong,
    nameOnlyList: nameOnlyList.slice(0,8), extraList: extraList.slice(0,8) };
}

/* ---- eval jobs ---- */
const JOBS = new Map();
let JOBSEQ = 0;
async function runEval(job, stratKey, set, code, base, file) {
  const S = STRATS[stratKey];
  const usage = { in: 0, out: 0, model: '?' };
  const t0 = Date.now();
  try {
    const fx = await loadFixture(set, code, base, file);
    let panels = await Promise.all(fx.photos.map(p => runPanel(p, S, usage).catch(e => ({ error: e.message }))));
    panels = await retryFailedPanels(panels, fx.photos, usage);
    const hands = [], fails = [], panelInfo = [];
    for (const p of panels) {
      if (p.error) { panelInfo.push({ error: p.error }); continue; }
      panelInfo.push({ linesRead: p.lines.length, handsOut: p.result.hands.length, fails: p.result.fails.map(f => f.name + ' (' + f.reason + ')').slice(0,6) });
      hands.push(...p.result.hands); fails.push(...p.result.fails);
    }
    const score = scoreCard(hands, fx.golden);
    job.status = 'done';
    job.result = { strat: stratKey + ' — ' + S.desc, model: usage.model, ms: Date.now() - t0,
      tokens: usage, panels: panelInfo, score, pipelineFails: fails.length };
  } catch (e) {
    job.status = 'error';
    job.result = { error: e.message, ms: Date.now() - t0 };
  }
}

/* ---------- known-card matching: read once, match forever ---------- */
let FAST_MODEL = null;
async function labPickFast() {
  if (FAST_MODEL) return FAST_MODEL;
  try {
    const r = await fetch('https://api.anthropic.com/v1/models?limit=100', {
      headers: { 'x-api-key': OLM_API_KEY, 'anthropic-version': '2023-06-01' } });
    if (r.ok) {
      const ids = ((await r.json()).data || []).map(m => m.id);
      const pick = f => ids.filter(i => i.includes(f)).sort().reverse()[0];
      FAST_MODEL = pick('sonnet') || pick('haiku') || null;
    }
  } catch (e) {}
  if (!FAST_MODEL) FAST_MODEL = 'claude-sonnet-4-5';
  return FAST_MODEL;
}
const KNOWN_CARDS = [];
async function loadKnownCards() {
  if (KNOWN_CARDS.length) return KNOWN_CARDS;
  try {
    const fx = await loadFixture('2026', ADMIN_KEY, null, 'set2026.enc');
    const card = fx.golden;
    const cats = [...new Set(card.hands.map(h => h.cat))];
    const anchors = [];
    for (const c of cats) { const h = card.hands.find(x => x.cat === c); if (h) anchors.push({ cat: c, name: h.name }); }
    KNOWN_CARDS.push({ key: 'nmjl-2026', year: '2026', card, cats, anchors: anchors.slice(0, 6) });
  } catch (e) { console.log(JSON.stringify({ ev: 'known_cards_fail', m: e.message })); }
  return KNOWN_CARDS;
}
/* Genuine ownership check: a fast model inspects the actual photos; the server
   verifies year + section headers + anchor hand lines against the stored card.
   Pass -> the verified card is served in seconds. Fail -> full read pipeline. */
async function matchKnownCard(photos, usage) {
  const known = await loadKnownCards();
  if (!known.length) return null;
  const K = known[0];
  const prompt = `These photos show panel(s) of a printed scoring card for American mah jongg, photographed by its owner. Report ONLY JSON, no commentary:
{"year":"<the 4-digit year printed on the card, or null if not visible>","org":"<the issuing organization name printed on the card, or null>","sections":["<every section header text you can see across the photos>"],"lines":{"<section header>":"<the tile groups of the FIRST printed hand row under that section, exactly as printed, first version only if the row has an -or->"}}
Fill "lines" for whichever of these sections are visible: ${JSON.stringify(K.anchors.map(a => a.cat))}.`;
  const r = await labCallAI([{ type: 'text', text: prompt }].concat(photos.map(IMG)), { think: false, model: await labPickFast() });
  usage.in += (r.usage.input_tokens || 0); usage.out += (r.usage.output_tokens || 0); usage.model = r.model;
  const j = labParseLoose(r.text, false);
  const yearOk = String(j.year || '').includes(K.year);
  const secs = (j.sections || []).map(s => normName(s));
  const catHits = K.cats.filter(c => secs.some(s => s === normName(c) || s.includes(normName(c)) || normName(c).includes(s))).length;
  let anchorHits = 0;
  for (const a of K.anchors) {
    const lk = Object.keys(j.lines || {}).find(k => normName(k) === normName(a.cat));
    const got = lk ? j.lines[lk] : null;
    if (got && normName(String(got).split(/-?or-?/i)[0]) === normName(a.name)) anchorHits++;
  }
  const ok = yearOk && catHits >= 3 && anchorHits >= 1;
  console.log(JSON.stringify({ ev: 'card_match', ok, yearOk, catHits, anchorHits, model: r.model }));
  return ok ? K : null;
}

/* ---------- public card reader ---------- */
const READS = { day: '', perTok: new Map(), total: 0 };
const READ_PER_TOKEN = 5, READ_PER_DAY = 20;
function readAllowed(tok) {
  const day = new Date().toISOString().slice(0, 10);
  if (READS.day !== day) { READS.day = day; READS.perTok = new Map(); READS.total = 0; }
  if (READS.total >= READ_PER_DAY) return 'The reader has reached its daily limit — try again tomorrow';
  const n = READS.perTok.get(tok) || 0;
  if (n >= READ_PER_TOKEN) return 'You have used your ' + READ_PER_TOKEN + ' card reads for today — try again tomorrow';
  READS.perTok.set(tok, n + 1); READS.total++;
  return null;
}
async function retryFailedPanels(panels, photos, usage) {
  for (let i = 0; i < panels.length; i++) {
    if (!panels[i] || !panels[i].error) continue;
    try { panels[i] = await runPanel(photos[i], STRATS.A, usage); }
    catch (e) { panels[i] = { error: e.message }; }
  }
  return panels;
}
async function runReadJob(job, photos) {
  const usage = { in: 0, out: 0, model: '?' };
  const t0 = Date.now();
  try {
    /* stage 0: is this a card we already have a verified reading of? */
    let matched = null;
    if (!MOCK_AI) { try { matched = await matchKnownCard(photos, usage); } catch (e) { console.log(JSON.stringify({ ev: 'match_err', m: e.message })); } }
    if (matched) {
      job.status = 'done';
      job.result = { card: matched.card, flags: [], panels: [{ matched: matched.key, note: 'photos verified against the known ' + matched.year + ' card' }],
        model: usage.model, ms: Date.now() - t0, matched: matched.key };
      console.log(JSON.stringify({ ev: 'card_read', matched: matched.key, ms: Date.now() - t0, tin: usage.in, tout: usage.out }));
      return;
    }
    let panels = await Promise.all(photos.map(p => runPanel(p, STRATS.A, usage).catch(e => ({ error: e.message }))));
    panels = await retryFailedPanels(panels, photos, usage);
    const hands = [], fails = [], panelInfo = [];
    let title = 'MY CARD';
    for (const p of panels) {
      if (p.error) { panelInfo.push({ error: p.error }); fails.push({ name: 'one whole panel', reason: p.error }); continue; }
      panelInfo.push({ linesRead: p.lines.length, handsOut: p.result.hands.length });
      if (p.result.title && p.result.title !== 'MY CARD') title = p.result.title;
      for (const h of p.result.hands) {
        hands.push({ name: h.name, cat: h.cat, pts: h.pts, concealed: h.concealed, note: h.note, disp: h.disp, variants: h.variants });
        if (h.uncertain) fails.push({ name: h.name, reason: 'the reader double-checked this line and got two different answers — compare it against your card before trusting it' });
      }
      fails.push(...p.result.fails.map(f => ({ name: f.name, reason: f.reason })));
    }
    if (!hands.length) throw new Error(fails.length ? 'No hands could be read: ' + (fails[0].reason || '') : 'No hands could be read from the photos');
    job.status = 'done';
    job.result = { card: { title, hands }, flags: fails, panels: panelInfo, model: usage.model, ms: Date.now() - t0 };
    console.log(JSON.stringify({ ev: 'card_read', hands: hands.length, flags: fails.length, ms: Date.now() - t0, tin: usage.in, tout: usage.out }));
  } catch (e) {
    job.status = 'error';
    job.result = { error: e.message, ms: Date.now() - t0 };
    statErr(STATS.serverErrors, 'card_read: ' + e.message);
  }
}
function readBody(req, cap) {
  return new Promise((res, rej) => {
    let size = 0; const chunks = [];
    req.on('data', c => { size += c.length; if (size > cap) { rej(new Error('too large')); req.destroy(); return; } chunks.push(c); });
    req.on('end', () => res(Buffer.concat(chunks).toString('utf8')));
    req.on('error', rej);
  });
}

/* ---------- server ---------- */

const server = http.createServer(async (req, res) => {
  const u = new URL(req.url, 'http://x');
  const send200 = o => { res.writeHead(200, { 'content-type': 'application/json', 'access-control-allow-origin': '*' }); res.end(JSON.stringify(o)); };
  if (u.pathname === '/robots.txt') {
    res.writeHead(200, { 'content-type': 'text/plain' });
    return res.end('User-agent: *\nAllow: /\n');
  }
  if (req.method === 'OPTIONS') {
    res.writeHead(204, { 'access-control-allow-origin': '*', 'access-control-allow-methods': 'GET,POST,OPTIONS',
      'access-control-allow-headers': 'content-type', 'access-control-max-age': '86400' });
    return res.end();
  }
  if (u.pathname === '/api/read' && req.method === 'POST') {
    if (!OLM_API_KEY && !MOCK_AI) return send200({ err: 'The card reader is not configured on the server' });
    let body;
    try { body = JSON.parse(await readBody(req, 20 * 1024 * 1024)); }
    catch (e) { return send200({ err: e.message === 'too large' ? 'Photos too large — retake at normal quality' : 'Bad request' }); }
    const photos = Array.isArray(body.photos) ? body.photos.filter(p => typeof p === 'string' && p.length > 2000 && p.length < 8 * 1024 * 1024) : [];
    if (!photos.length || photos.length > 3) return send200({ err: 'Send 1 to 3 panel photos' });
    const tok = String(body.token || 'anon').slice(0, 64);
    const lim = readAllowed(tok);
    if (lim) return send200({ err: lim });
    const id = 'r' + (++JOBSEQ);
    const job = { status: 'running', started: Date.now() };
    JOBS.set(id, job);
    runReadJob(job, photos);
    return send200({ job: id });
  }
  if (u.pathname === '/api/readjob') {
    const id = String(u.searchParams.get('id') || '');
    if (!/^r\d+$/.test(id)) return send200({ err: 'bad id' });
    const job = JOBS.get(id);
    if (!job) return send200({ err: 'no such job' });
    return send200({ status: job.status, secs: Math.round((Date.now() - job.started) / 1000), result: job.result || null });
  }
  if (u.pathname === '/admin/eval') {
    if (u.searchParams.get('k') !== ADMIN_KEY) return send200({ err: 'bad key' });
    if (!OLM_API_KEY && !MOCK_AI) return send200({ err: 'OLM_API_KEY env var is not set on the server' });
    const strat = u.searchParams.get('strat') || 'A';
    if (!STRATS[strat]) return send200({ err: 'unknown strategy', options: Object.keys(STRATS) });
    const id = 'j' + (++JOBSEQ);
    const job = { status: 'running', started: Date.now() };
    JOBS.set(id, job);
    runEval(job, strat, u.searchParams.get('set') || '2026', ADMIN_KEY,
      u.searchParams.get('base') || null, u.searchParams.get('file') || null);
    return send200({ job: id, strat, v: LAB_VERSION, note: 'poll /admin/job?k=...&id=' + id });
  }
  if (u.pathname === '/admin/job') {
    if (u.searchParams.get('k') !== ADMIN_KEY) return send200({ err: 'bad key' });
    const job = JOBS.get(u.searchParams.get('id'));
    if (!job) return send200({ err: 'no such job' });
    return send200({ status: job.status, secs: Math.round((Date.now() - job.started) / 1000), result: job.result || null });
  }
  if (u.pathname === '/b') {
    STATS.loads++;
    const t = String(u.searchParams.get('t') || '').slice(0, 64);
    if (t && STATS.uniq.size < 50000) STATS.uniq.add(t);
    return send200({ ok: 1 });
  }
  if (u.pathname === '/e') {
    statErr(STATS.clientErrors, u.searchParams.get('m') || 'unknown');
    console.log(JSON.stringify({ ev: 'client_error', m: String(u.searchParams.get('m') || '').slice(0, 200), at: new Date().toISOString() }));
    return send200({ ok: 1 });
  }
  if (u.pathname === '/admin/stats') {
    if (u.searchParams.get('k') !== ADMIN_KEY) return send200({ err: 'bad key' });
    const up = Math.round((Date.now() - STATS.boot) / 60000);
    return send200({ v: LAB_VERSION, upMinutes: up,
      note: 'counters reset when the server restarts/redeploys; full history is in the Render Logs tab',
      appLoads: STATS.loads, uniquePlayers: STATS.uniq.size,
      tablesCreated: STATS.tables, gamesStarted: STATS.games, gamesEnded: STATS.ends,
      liveTables: tables.size,
      clientErrors: STATS.clientErrors, serverErrors: STATS.serverErrors });
  }
  if (u.pathname === '/admin/matchtest') {
    if (u.searchParams.get('k') !== ADMIN_KEY) return send200({ err: 'bad key' });
    try {
      const fx = await loadFixture('2026', ADMIN_KEY, u.searchParams.get('base') || null, u.searchParams.get('file') || 'set2026.enc');
      const usage = { in: 0, out: 0, model: '?' };
      const t0 = Date.now();
      const m = await matchKnownCard(fx.photos, usage);
      return send200({ matched: m ? m.key : null, hands: m ? m.card.hands.length : 0, ms: Date.now() - t0, tokens: usage });
    } catch (e) { return send200({ err: e.message }); }
  }
  if (u.pathname === '/admin/strats') {
    return send200({ strats: Object.fromEntries(Object.entries(STRATS).map(([k,s]) => [k, s.desc])) });
  }
  send200({ ok: true, app: 'ooh-la-mahj', v: LAB_VERSION, tables: tables.size, results: (typeof RESULTS !== 'undefined' ? RESULTS : []) });
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
    try { handleMsg(p, m); } catch (e) { console.error('handleMsg', e); statErr(STATS.serverErrors, (m && m.type) + ': ' + e.message); }
  });
  ws.on('close', () => { if (p.ws === ws) { p.ws = null; onDisconnect(p); } });
});
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => console.log('Ooh La Mahj server on :' + PORT));
