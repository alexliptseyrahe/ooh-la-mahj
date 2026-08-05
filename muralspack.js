/* =====================================================================
   OOH LA MAHJ · THE SANS SOUCIS COLLECTION
   Three hand-built SVG murals after de Gournay\u2019s Sans Soucis
   wallpapers, each a fixed colourway on a woven-silk ground.
   Self-contained \u2014 no dependencies, no external assets. Each mural
   renders as an SVG string sized 430\u00d7860 (preserveAspectRatio: slice)
   suitable for a phone-shaped background.

   Usage:
     [script src=murals.js] (inlined)
     const {MURALS, muralURI} = OLM_MURALS;
     el.style.backgroundImage = `url("${muralURI('or-craquele')}")`;

   See README.md for full integration notes.
   ===================================================================== */
(function(global){
'use strict';
const W=430,H=860;

function rng(seed){let a=seed>>>0;return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}

function bez(p0,p1,p2,p3,n){
  const pts=[];
  for(let i=0;i<=n;i++){const t=i/n,m=1-t;
    pts.push([m*m*m*p0[0]+3*m*m*t*p1[0]+3*m*t*t*p2[0]+t*t*t*p3[0],
              m*m*m*p0[1]+3*m*m*t*p1[1]+3*m*t*t*p2[1]+t*t*t*p3[1]]);
  }
  return pts;
}

function taperedPath(pts,w0,w1,color,darker,op,R){
  let under='',over='';
  const n=pts.length-1;
  for(let i=0;i<n;i++){
    const t=i/(n-1||1);
    const w=w0+(w1-w0)*Math.pow(t,0.85);
    const jx=(R()-.5)*w*0.16,jy=(R()-.5)*w*0.16;
    const seg=(x,y,c,ww,o)=>`<line x1="${(pts[i][0]+x).toFixed(1)}" y1="${(pts[i][1]+y).toFixed(1)}" x2="${(pts[i+1][0]+x).toFixed(1)}" y2="${(pts[i+1][1]+y).toFixed(1)}" stroke="${c}" stroke-width="${ww.toFixed(2)}" stroke-linecap="round" opacity="${o}"/>`;
    if(darker)under+=seg(0.9,1.1,darker,w*1.06,op*0.5);
    over+=seg(jx,jy,color,w,op);
  }
  return under+over;
}

function branch(p0,p1,p2,p3,w0,w1,th,op,R){
  return taperedPath(bez(p0,p1,p2,p3,26),w0,w1,th.branch,th.branchDk,op,R);
}

function blossom(cx,cy,r,th,op,R,rot0){
  rot0=rot0||R()*72;
  let s=`<g transform="translate(${cx.toFixed(1)} ${cy.toFixed(1)})">`;
  for(let layer=0;layer<2;layer++){
    const lr=layer?r*0.55:r, lo=layer?op*0.9:op;
    for(let i=0;i<5;i++){
      const rot=rot0+i*72+(R()-.5)*14;
      const len=lr*(1.5+R()*0.5), wid=lr*(0.72+R()*0.22);
      const fill=layer?th.blossomPale:(i%2?th.blossom:th.blossom2);
      s+=`<path d="M0 0 C ${wid.toFixed(1)} ${(-len*0.32).toFixed(1)}, ${(wid*0.86).toFixed(1)} ${(-len*0.78).toFixed(1)}, 0 ${(-len).toFixed(1)} C ${(-wid*0.86).toFixed(1)} ${(-len*0.78).toFixed(1)}, ${(-wid).toFixed(1)} ${(-len*0.32).toFixed(1)}, 0 0 Z" transform="rotate(${rot.toFixed(1)})" fill="${fill}" opacity="${(lo*(0.82+R()*0.18)).toFixed(2)}"/>`;
    }
  }
  for(let i=0;i<6;i++){
    const a=R()*Math.PI*2, l=r*(0.5+R()*0.45);
    s+=`<line x1="0" y1="0" x2="${(Math.cos(a)*l).toFixed(1)}" y2="${(Math.sin(a)*l).toFixed(1)}" stroke="${th.gold}" stroke-width="0.6" opacity="${(op*0.75).toFixed(2)}"/>`;
    s+=`<circle cx="${(Math.cos(a)*l).toFixed(1)}" cy="${(Math.sin(a)*l).toFixed(1)}" r="0.9" fill="${th.gold}" opacity="${(op*0.9).toFixed(2)}"/>`;
  }
  return s+'</g>';
}

function bud(cx,cy,r,rot,th,op,R){
  return `<g transform="translate(${cx} ${cy}) rotate(${rot})" opacity="${op}">
    <path d="M0 ${r*1.4} C ${r*0.9} ${r*0.5}, ${r*0.8} ${-r*0.6}, 0 ${-r*1.35} C ${-r*0.8} ${-r*0.6}, ${-r*0.9} ${r*0.5}, 0 ${r*1.4} Z" fill="${th.blossom2}"/>
    <path d="M0 ${r*1.3} C ${r*0.45} ${r*0.4}, ${r*0.4} ${-r*0.5}, 0 ${-r*1.1} C ${-r*0.4} ${-r*0.5}, ${-r*0.45} ${r*0.4}, 0 ${r*1.3} Z" fill="${th.blossomPale}" opacity=".8"/>
    <path d="M${-r*0.55} ${r*1.15} C ${-r*0.2} ${r*0.6}, ${r*0.2} ${r*0.6}, ${r*0.55} ${r*1.15}" fill="none" stroke="${th.leaf}" stroke-width="${r*0.34}" stroke-linecap="round"/>
  </g>`;
}

function leaf(cx,cy,len,rot,th,op,R){
  const bow=len*(0.14+R()*0.08);
  return `<g transform="translate(${cx.toFixed(1)} ${cy.toFixed(1)}) rotate(${rot})" opacity="${op.toFixed(2)}">
    <path d="M0 0 C ${(len*0.28).toFixed(1)} ${(-bow).toFixed(1)}, ${(len*0.72).toFixed(1)} ${(-bow*0.8).toFixed(1)}, ${len} 0 C ${(len*0.72).toFixed(1)} ${(bow*0.8).toFixed(1)}, ${(len*0.28).toFixed(1)} ${bow.toFixed(1)}, 0 0 Z" fill="${th.leaf}"/>
    <path d="M${(len*0.06).toFixed(1)} 0 Q ${(len*0.5).toFixed(1)} ${(-bow*0.25).toFixed(1)} ${(len*0.92).toFixed(1)} 0" fill="none" stroke="${th.leafDk||th.branchDk}" stroke-width="0.6"/>
  </g>`;
}

function sprayAlong(p0,p1,p2,p3,list,th,R,baseLen){
  const pts=bez(p0,p1,p2,p3,40);
  let s='';
  list.forEach(item=>{
    const t=item[0],side=item[1];
    const i=Math.min(pts.length-2,Math.max(0,Math.round(t*(pts.length-1))));
    const x=pts[i][0],y=pts[i][1],x2=pts[i+1][0],y2=pts[i+1][1];
    const ang=Math.atan2(y2-y,x2-x)*180/Math.PI;
    const rot=ang-side*(32+R()*26);
    s+=leaf(x,y,baseLen+R()*12,rot,th,.7+R()*0.25,R);
  });
  return s;
}

function silk(defs,id,seed,op,r,g,b){
  defs.push(`<filter id="${id}" x="0" y="0" width="100%" height="100%">
    <feTurbulence type="fractalNoise" baseFrequency="0.004 0.18" numOctaves="2" seed="${seed}" result="n"/>
    <feColorMatrix in="n" type="matrix" values="0 0 0 0 ${r}  0 0 0 0 ${g}  0 0 0 0 ${b}  0 0 0 ${op} 0"/>
    <feComposite operator="in" in2="SourceGraphic"/></filter>`);
  return `<rect width="${W}" height="${H}" fill="#FFF" filter="url(#${id})"/>`;
}

function grain(defs,id,freq,op,seed){
  defs.push(`<filter id="${id}"><feTurbulence type="fractalNoise" baseFrequency="${freq}" numOctaves="2" seed="${seed}" stitchTiles="stitch"/><feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 0.97  0 0 0 0 0.88  0 0 0 ${op} 0"/></filter>`);
  return `<rect width="${W}" height="${H}" filter="url(#${id})"/>`;
}

function svgOpen(extra){return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice"${extra||''}>`}

function bananaLeaf(x,y,len,wid,rot,c1,c2,op,R){
  const veins=[];
  for(let i=1;i<8;i++){
    const t=i/8, vy=-len*t, vw=wid*Math.sin(Math.PI*Math.min(1,t*1.15))*0.92;
    veins.push(`<path d="M 0 ${vy.toFixed(1)} Q ${(vw*0.5).toFixed(1)} ${(vy-len*0.03).toFixed(1)} ${vw.toFixed(1)} ${(vy-len*0.085).toFixed(1)}" />`);
    veins.push(`<path d="M 0 ${vy.toFixed(1)} Q ${(-vw*0.5).toFixed(1)} ${(vy-len*0.03).toFixed(1)} ${(-vw*0.95).toFixed(1)} ${(vy-len*0.08).toFixed(1)}" />`);
  }
  const slit1=0.35+R()*0.15, slit2=0.62+R()*0.15;
  return `<g transform="translate(${x} ${y}) rotate(${rot})" opacity="${op}">
    <path d="M 0 0 C ${-wid*0.9} ${-len*0.22}, ${-wid} ${-len*0.62}, ${-wid*0.30} ${-len*0.92} C ${-wid*0.12} ${-len*1.0}, ${wid*0.12} ${-len*1.0}, ${wid*0.26} ${-len*0.93} C ${wid*0.92} ${-len*0.64}, ${wid*0.82} ${-len*0.24}, 0 0 Z" fill="${c1}"/>
    <path d="M 0 0 C ${-wid*0.9} ${-len*0.22}, ${-wid} ${-len*0.62}, ${-wid*0.30} ${-len*0.92} C ${-wid*0.12} ${-len*1.0}, 0 ${-len*0.99}, 0 ${-len*0.96} Z" fill="${c2}" opacity=".45"/>
    <path d="M 0 2 C ${wid*0.04} ${-len*0.3}, ${-wid*0.04} ${-len*0.7}, 0 ${-len*0.97}" fill="none" stroke="${c2}" stroke-width="2.2" opacity=".8"/>
    <g fill="none" stroke="${c2}" stroke-width="0.55" opacity=".5">${veins.join('')}</g>
    <path d="M 0 ${(-len*slit1).toFixed(1)} L ${(wid*0.88).toFixed(1)} ${(-len*(slit1+0.10)).toFixed(1)}" stroke="${c2}" stroke-width="1.6" opacity=".35"/>
    <path d="M 0 ${(-len*slit2).toFixed(1)} L ${(-wid*0.8).toFixed(1)} ${(-len*(slit2+0.09)).toFixed(1)}" stroke="${c2}" stroke-width="1.4" opacity=".3"/>
  </g>`;
}

function stitchBloom(x,y,r,fillc,edgec,knotc,R,op){
  let s=`<g transform="translate(${x} ${y}) rotate(${(R()*72).toFixed(0)})" opacity="${op}">`;
  for(let i=0;i<5;i++){
    s+=`<g transform="rotate(${i*72})"><path d="M 0 ${-r*0.16} C ${-r*0.42} ${-r*0.5}, ${-r*0.3} ${-r*1.06}, 0 ${-r*1.12} C ${r*0.3} ${-r*1.06}, ${r*0.42} ${-r*0.5}, 0 ${-r*0.16} Z" fill="${fillc}" opacity=".5"/>
    <path d="M 0 ${-r*0.16} C ${-r*0.42} ${-r*0.5}, ${-r*0.3} ${-r*1.06}, 0 ${-r*1.12} C ${r*0.3} ${-r*1.06}, ${r*0.42} ${-r*0.5}, 0 ${-r*0.16} Z" fill="none" stroke="${edgec}" stroke-width="0.9" stroke-dasharray="2.4 1.7" opacity=".85"/></g>`;
  }
  for(let i=0;i<6;i++){const a=i/6*Math.PI*2;s+=`<circle cx="${(Math.cos(a)*r*0.16).toFixed(1)}" cy="${(Math.sin(a)*r*0.16).toFixed(1)}" r="1.1" fill="${knotc}"/>`;}
  return s+'</g>';
}

function muralOrCraquele(){
  const R=rng(31415),defs=[];
  defs.push(`<linearGradient id="auB" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#DCBC6E"/><stop offset=".38" stop-color="#CBA452"/>
    <stop offset=".75" stop-color="#B08A38"/><stop offset="1" stop-color="#8F6E28"/></linearGradient>`);
  defs.push(`<radialGradient id="auGlow" cx=".5" cy=".18" r=".8">
    <stop offset="0" stop-color="#F2DE9E" stop-opacity=".55"/><stop offset=".55" stop-color="#F2DE9E" stop-opacity=".12"/><stop offset="1" stop-color="#F2DE9E" stop-opacity="0"/></radialGradient>`);
  let s=`<rect width="${W}" height="${H}" fill="url(#auB)"/><rect width="${W}" height="${H}" fill="url(#auGlow)"/>`;
  s+=silk(defs,'auSlk',11,0.055,1,0.96,0.82);
  /* crackle web — dark fissures and bright flakes */
  let cr='',br='';
  for(let i=0;i<86;i++){
    let px=R()*W,py=R()*H,d=`M ${px.toFixed(1)} ${py.toFixed(1)}`;
    const segs=2+Math.floor(R()*3);let ang=R()*Math.PI*2;
    for(let k=0;k<segs;k++){ang+=(R()-0.5)*1.8;const ln=7+R()*16;px+=Math.cos(ang)*ln;py+=Math.sin(ang)*ln;d+=` L ${px.toFixed(1)} ${py.toFixed(1)}`;}
    if(i%3)cr+=`<path d="${d}"/>`;else br+=`<path d="${d}"/>`;
  }
  s+=`<g fill="none" stroke="#6E501A" stroke-width="0.5" opacity=".16">${cr}</g>`;
  s+=`<g fill="none" stroke="#F4E4AC" stroke-width="0.6" opacity=".2">${br}</g>`;
  /* silk sheen */
  defs.push(`<linearGradient id="auSheen" x1="0" y1="0" x2="1" y2="1">
    <stop offset=".32" stop-color="#FFF" stop-opacity="0"/><stop offset=".5" stop-color="#FFF" stop-opacity=".09"/><stop offset=".68" stop-color="#FFF" stop-opacity="0"/></linearGradient>`);
  s+=`<rect width="${W}" height="${H}" fill="url(#auSheen)"/>`;
  /* palette: deep viridian garden on gold */
  const VIR='#1E4A3A',VIR2='#153829',BRZ='#5E4718',IVO='#F6EBD6',BLUSH='#D99B80';
  const thf={blossomPale:IVO,blossom:BLUSH,blossom2:'#C07E62',gold:'#8F6E28'};
  /* canopy bough from top-right */
  s+=branch([446,36],[356,54],[290,40],[220,56],10,3,{branch:BRZ,branchDk:VIR2},.9,R);
  s+=branch([330,52],[322,92],[334,128],[328,158],4.5,1.8,{branch:BRZ,branchDk:VIR2},.85,R);
  s+=branch([368,56],[386,102],[372,150],[386,196],4,1.6,{branch:BRZ,branchDk:VIR2},.85,R);
  const thL={leaf:VIR,leafDk:VIR2};
  s+=sprayAlong([446,36],[356,54],[290,40],[220,56],[[.1,1],[.24,-1],[.38,1],[.52,-1],[.66,1],[.8,-1],[.93,1]],thL,R,26);
  s+=sprayAlong([330,52],[322,92],[334,128],[328,158],[[.32,1],[.58,-1],[.82,1]],thL,R,21);
  s+=sprayAlong([368,56],[386,102],[372,150],[386,196],[[.32,-1],[.58,1],[.82,-1]],thL,R,21);
  s+=blossom(332,154,11,thf,.9,R);
  s+=blossom(386,192,10,thf,.85,R);
  s+=blossom(330,62,9,thf,.8,R);
  /* banana grove from bottom-left */
  s+=bananaLeaf(36,884,300,74,12,VIR,VIR2,.9,R);
  s+=bananaLeaf(96,880,250,60,-16,VIR,VIR2,.85,R);
  s+=bananaLeaf(10,876,200,48,34,VIR,VIR2,.8,R);
  s+=bananaLeaf(150,890,160,40,-34,'#2A5A45',VIR2,.7,R);
  /* answering fronds bottom-right, small */
  s+=bananaLeaf(408,888,170,42,-14,VIR,VIR2,.75,R);
  s+=bananaLeaf(370,892,120,30,18,'#2A5A45',VIR2,.6,R);
  /* two swallows in ink, crossing the gold */
  s+=`<g fill="${VIR2}" opacity=".8">
    <path d="M 316 268 c 9 -8 22 -9 31 -3 c -8 1 -13 3 -18 8 c 10 0 17 4 20 11 c -9 -3 -17 -3 -24 0 c -7 3 -13 10 -15 18 c -2 -7 -1 -13 2 -19 c -8 1 -14 -1 -19 -7 c 8 1 16 -2 23 -8 z"/>
  </g><g fill="${VIR2}" opacity=".6">
    <path d="M 372 322 c 7 -6 16 -7 23 -2 c -6 1 -10 2 -13 6 c 7 0 12 3 15 8 c -7 -2 -12 -2 -18 0 c -5 2 -10 7 -11 13 c -2 -5 -1 -10 1 -14 c -6 1 -11 -1 -14 -5 c 6 1 12 -2 17 -6 z"/></g>`;
  s+=grain(defs,'augr','0.8',0.05,73);
  return svgOpen()+`<defs>${defs.join('')}</defs>${s}</svg>`;
}

function muralSoieGrise(){
  const R=rng(27182),defs=[];
  defs.push(`<linearGradient id="sgB" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#BDBBB2"/><stop offset=".5" stop-color="#AFADA3"/><stop offset="1" stop-color="#9C9A90"/></linearGradient>`);
  let s=`<rect width="${W}" height="${H}" fill="url(#sgB)"/>`;
  /* silk slub — long horizontal threads */
  defs.push(`<filter id="sgSlub" x="0" y="0" width="100%" height="100%">
    <feTurbulence type="fractalNoise" baseFrequency="0.004 0.18" numOctaves="2" seed="9" result="n"/>
    <feColorMatrix in="n" type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 0.97  0 0 0 0.05 0"/>
    <feComposite operator="in" in2="SourceGraphic"/></filter>`);
  s+=`<rect width="${W}" height="${H}" fill="#FFF" filter="url(#sgSlub)"/>`;
  const STEM='#5C6B5E',CEL='#8FA98D',CEL2='#6E8A70',BLUSH='#CE9D96',BLUSH2='#B77E78',IVO='#EFE9DC',KNOT='#A98548';
  const stitch=`stroke-dasharray="3.2 2.4"`;
  /* rising spray from bottom-left */
  s+=`<g fill="none" stroke="${STEM}" stroke-width="1.5" ${stitch} stroke-linecap="round" opacity=".9">
    <path d="M 30 866 C 52 760, 44 660, 88 566 C 118 502, 112 462, 104 430"/>
    <path d="M 58 700 C 88 664, 96 628, 90 592"/>
    <path d="M 44 780 C 74 758, 118 756, 142 730"/>
    <path d="M 92 560 C 66 532, 60 500, 68 470"/></g>`;
  /* rising spray from bottom-right */
  s+=`<g fill="none" stroke="${STEM}" stroke-width="1.5" ${stitch} stroke-linecap="round" opacity=".9">
    <path d="M 402 872 C 380 780, 392 690, 356 606 C 336 558, 340 520, 348 492"/>
    <path d="M 384 720 C 356 692, 348 660, 354 630"/>
    <path d="M 394 800 C 366 786, 330 788, 306 768"/></g>`;
  /* a drifting spray across the top-left corner */
  s+=`<g fill="none" stroke="${STEM}" stroke-width="1.4" ${stitch} stroke-linecap="round" opacity=".85">
    <path d="M -10 96 C 40 84, 78 88, 104 106 C 116 114, 122 126, 120 140"/>
    <path d="M 96 92 C 108 66, 130 52, 158 50"/></g>`;
  /* satin-stitch leaves along the stems */
  const leaves=[[60,742,-40],[92,636,-70],[112,548,-55],[140,726,-15],[66,486,-80],[86,592,-62],
                [386,752,-120],[360,668,-110],[344,566,-125],[312,772,-160],[352,506,-100],
                [66,86,8],[104,100,28],[92,64,-8],[142,58,42]];
  leaves.forEach(l=>{
    const [lx,ly,rot]=l,ln=22+R()*10;
    s+=`<g transform="translate(${lx} ${ly}) rotate(${rot})">
      <path d="M 0 0 C 6 ${-ln*0.4}, 6 ${-ln*0.72}, 0 ${-ln} C -6 ${-ln*0.72}, -6 ${-ln*0.4}, 0 0 Z" fill="${R()>0.5?CEL:CEL2}" opacity=".55"/>
      <path d="M 0 0 C 6 ${-ln*0.4}, 6 ${-ln*0.72}, 0 ${-ln} C -6 ${-ln*0.72}, -6 ${-ln*0.4}, 0 0 Z" fill="none" stroke="${CEL2}" stroke-width="0.8" stroke-dasharray="2.2 1.6" opacity=".8"/>
      <path d="M 0 -1.5 L 0 ${-ln+2}" stroke="${CEL2}" stroke-width="0.6" stroke-dasharray="1.8 1.6" opacity=".6"/></g>`;
  });
  /* stitched blooms */
  s+=stitchBloom(104,424,15,BLUSH,BLUSH2,KNOT,R,.95);
  s+=stitchBloom(68,462,10,IVO,'#B9B29F',KNOT,R,.85);
  s+=stitchBloom(146,726,11,IVO,'#B9B29F',KNOT,R,.8);
  s+=stitchBloom(350,486,14,BLUSH,BLUSH2,KNOT,R,.95);
  s+=stitchBloom(306,764,10,IVO,'#B9B29F',KNOT,R,.8);
  s+=stitchBloom(96,130,10,BLUSH,BLUSH2,KNOT,R,.9);
  /* one embroidered butterfly, high right */
  s+=`<g transform="translate(354 130) rotate(-14)" opacity=".9">
    <path d="M 0 0 C -14 -16, -30 -14, -32 -2 C -33 8, -22 12, -4 6 Z" fill="${BLUSH}" opacity=".5"/>
    <path d="M 0 0 C -14 -16, -30 -14, -32 -2 C -33 8, -22 12, -4 6 Z" fill="none" stroke="${BLUSH2}" stroke-width="0.8" stroke-dasharray="2.2 1.6"/>
    <path d="M 0 2 C -12 16, -26 18, -28 8 C -29 1, -18 -2, -3 4 Z" fill="${IVO}" opacity=".5"/>
    <path d="M 0 2 C -12 16, -26 18, -28 8 C -29 1, -18 -2, -3 4 Z" fill="none" stroke="#B9B29F" stroke-width="0.8" stroke-dasharray="2 1.5"/>
    <ellipse cx="2" cy="2" rx="2" ry="5" fill="${STEM}"/>
    <path d="M 3 -3 C 6 -8, 10 -10, 14 -10 M 3 -3 C 5 -9, 4 -13, 2 -16" fill="none" stroke="${STEM}" stroke-width="0.7"/></g>`;
  /* scattered french knots — thread dust */
  for(let i=0;i<14;i++){
    const kx=40+R()*350,ky=240+R()*560;
    if(kx>120&&kx<310&&ky>380&&ky<720)continue;
    s+=`<circle cx="${kx.toFixed(0)}" cy="${ky.toFixed(0)}" r="1.2" fill="${KNOT}" opacity="${(0.25+R()*0.3).toFixed(2)}"/>`;
  }
  s+=grain(defs,'sggr','0.8',0.05,79);
  return svgOpen()+`<defs>${defs.join('')}</defs>${s}</svg>`;
}

function muralBlancAntique(){
  const R=rng(16180),defs=[];
  defs.push(`<linearGradient id="baB" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#F5EFE1"/><stop offset=".6" stop-color="#F0E8D6"/><stop offset="1" stop-color="#E7DCC4"/></linearGradient>`);
  let s=`<rect width="${W}" height="${H}" fill="url(#baB)"/>`;
  defs.push(`<radialGradient id="baFox"><stop offset="0" stop-color="#C9B18A" stop-opacity=".12"/><stop offset="1" stop-color="#C9B18A" stop-opacity="0"/></radialGradient>`);
  s+=`<circle cx="80" cy="300" r="60" fill="url(#baFox)"/><circle cx="370" cy="640" r="80" fill="url(#baFox)"/><circle cx="220" cy="80" r="70" fill="url(#baFox)"/>`;
  s+=silk(defs,'baSlk',13,0.05,1,0.99,0.93);
  const SEP='#7A5F43',SEP2='#5E4730';
  /* painted-petal gradients: dark throat, pale tip */
  defs.push(`<linearGradient id="baPc" x1="0" y1="1" x2="0" y2="0">
    <stop offset="0" stop-color="#A6472F"/><stop offset=".45" stop-color="#C96F4F"/><stop offset="1" stop-color="#EBB49B"/></linearGradient>`);
  defs.push(`<linearGradient id="baPc2" x1="0" y1="1" x2="0" y2="0">
    <stop offset="0" stop-color="#8F3E2A"/><stop offset=".5" stop-color="#B25E42"/><stop offset="1" stop-color="#DE9A80"/></linearGradient>`);
  defs.push(`<linearGradient id="baPi" x1="0" y1="1" x2="0" y2="0">
    <stop offset="0" stop-color="#D8C2A2"/><stop offset="1" stop-color="#FBF6EA"/></linearGradient>`);
  defs.push(`<linearGradient id="baLf" x1="0" y1="1" x2="0" y2="0">
    <stop offset="0" stop-color="#3F5C43"/><stop offset="1" stop-color="#7C9873"/></linearGradient>`);
  defs.push(`<linearGradient id="baLf2" x1="0" y1="1" x2="0" y2="0">
    <stop offset="0" stop-color="#59714E"/><stop offset="1" stop-color="#93AC82"/></linearGradient>`);
  /* a painted blossom */
  const bloomP=(x,y,r,op)=>{
    let p=`<g transform="translate(${x} ${y}) rotate(${(R()*72).toFixed(0)})" opacity="${op}">`;
    for(let i=0;i<5;i++){
      const rot=i*72+(R()-.5)*12, len=r*(1.45+R()*0.35), wid=r*(0.78+R()*0.2), g=i%2?'baPc':'baPc2';
      p+=`<g transform="rotate(${rot.toFixed(1)})">
        <path d="M0 0 C ${wid.toFixed(1)} ${(-len*0.3).toFixed(1)}, ${(wid*0.92).toFixed(1)} ${(-len*0.72).toFixed(1)}, ${(wid*0.18).toFixed(1)} ${(-len*0.96).toFixed(1)} C ${(wid*0.06).toFixed(1)} ${(-len*1.02).toFixed(1)}, ${(-wid*0.06).toFixed(1)} ${(-len*1.02).toFixed(1)}, ${(-wid*0.18).toFixed(1)} ${(-len*0.96).toFixed(1)} C ${(-wid*0.92).toFixed(1)} ${(-len*0.72).toFixed(1)}, ${(-wid).toFixed(1)} ${(-len*0.3).toFixed(1)}, 0 0 Z" fill="url(#${g})" stroke="${SEP2}" stroke-width="0.5" stroke-opacity=".32"/>
        <path d="M0 ${(-len*0.12).toFixed(1)} C ${(wid*0.12).toFixed(1)} ${(-len*0.4).toFixed(1)}, ${(wid*0.08).toFixed(1)} ${(-len*0.62).toFixed(1)}, ${(wid*0.04).toFixed(1)} ${(-len*0.78).toFixed(1)} M0 ${(-len*0.12).toFixed(1)} C ${(-wid*0.1).toFixed(1)} ${(-len*0.38).toFixed(1)}, ${(-wid*0.08).toFixed(1)} ${(-len*0.6).toFixed(1)}, ${(-wid*0.03).toFixed(1)} ${(-len*0.75).toFixed(1)}" fill="none" stroke="#8F3E2A" stroke-width="0.4" opacity=".35"/>
      </g>`;
    }
    p+=`<circle r="${(r*0.34).toFixed(1)}" fill="#7A2F1F" opacity=".22"/>`;
    for(let i=0;i<7;i++){const a=R()*Math.PI*2,l=r*(0.5+R()*0.4);
      p+=`<line x1="0" y1="0" x2="${(Math.cos(a)*l).toFixed(1)}" y2="${(Math.sin(a)*l).toFixed(1)}" stroke="#A5822F" stroke-width="0.5" opacity=".8"/><circle cx="${(Math.cos(a)*l).toFixed(1)}" cy="${(Math.sin(a)*l).toFixed(1)}" r="0.9" fill="#C9A24B"/>`;}
    return p+'</g>';
  };
  /* a painted leaf with drawn veins */
  const leafP=(x,y,len,rot,g)=>{
    const bow=len*(0.16+R()*0.08);
    return `<g transform="translate(${x} ${y}) rotate(${rot})">
      <path d="M0 0 C ${(len*0.3).toFixed(1)} ${(-bow).toFixed(1)}, ${(len*0.72).toFixed(1)} ${(-bow*0.8).toFixed(1)}, ${len} ${(-len*0.04).toFixed(1)} C ${(len*0.7).toFixed(1)} ${(bow*0.9).toFixed(1)}, ${(len*0.28).toFixed(1)} ${bow.toFixed(1)}, 0 0 Z" fill="url(#${g})" stroke="${SEP2}" stroke-width="0.45" stroke-opacity=".28"/>
      <path d="M${(len*0.05).toFixed(1)} 0 Q ${(len*0.5).toFixed(1)} ${(-bow*0.2).toFixed(1)} ${(len*0.93).toFixed(1)} ${(-len*0.03).toFixed(1)}" stroke="#3F5C43" stroke-width="0.5" fill="none" opacity=".55"/>
      <path d="M${(len*0.3).toFixed(1)} ${(-bow*0.22).toFixed(1)} L ${(len*0.38).toFixed(1)} ${(-bow*0.72).toFixed(1)} M${(len*0.52).toFixed(1)} ${(-bow*0.14).toFixed(1)} L ${(len*0.6).toFixed(1)} ${(-bow*0.58).toFixed(1)} M${(len*0.4).toFixed(1)} ${(bow*0.3).toFixed(1)} L ${(len*0.48).toFixed(1)} ${(bow*0.7).toFixed(1)}" stroke="#3F5C43" stroke-width="0.35" fill="none" opacity=".38"/>
    </g>`;
  };
  /* a layered, ruffled peony */
  const peonyP=(x,y,r,op)=>{
    let p=`<g transform="translate(${x} ${y}) rotate(${(R()*40-20).toFixed(0)})" opacity="${op}">`;
    for(let i=0;i<7;i++){const rot=i*(360/7)+(R()-.5)*14,len=r*(1.0+R()*0.15),wid=r*(0.62+R()*0.12);
      p+=`<g transform="rotate(${rot.toFixed(0)})"><path d="M0 0 C ${wid.toFixed(1)} ${(-len*0.25).toFixed(1)}, ${(wid*1.05).toFixed(1)} ${(-len*0.6).toFixed(1)}, ${(wid*0.5).toFixed(1)} ${(-len*0.82).toFixed(1)} C ${(wid*0.25).toFixed(1)} ${(-len*0.95).toFixed(1)}, ${(wid*0.08).toFixed(1)} ${(-len*0.88).toFixed(1)}, 0 ${(-len).toFixed(1)} C ${(-wid*0.08).toFixed(1)} ${(-len*0.88).toFixed(1)}, ${(-wid*0.25).toFixed(1)} ${(-len*0.95).toFixed(1)}, ${(-wid*0.5).toFixed(1)} ${(-len*0.82).toFixed(1)} C ${(-wid*1.05).toFixed(1)} ${(-len*0.6).toFixed(1)}, ${(-wid).toFixed(1)} ${(-len*0.25).toFixed(1)}, 0 0 Z" fill="url(#baPc2)" stroke="${SEP2}" stroke-width="0.5" stroke-opacity=".32"/></g>`;}
    for(let i=0;i<5;i++){const rot=i*72+36+(R()-.5)*12,len=r*0.66,wid=r*0.44;
      p+=`<g transform="rotate(${rot.toFixed(0)})"><path d="M0 0 C ${wid.toFixed(1)} ${(-len*0.3).toFixed(1)}, ${(wid*0.9).toFixed(1)} ${(-len*0.75).toFixed(1)}, ${(wid*0.3).toFixed(1)} ${(-len*0.9).toFixed(1)} C ${(wid*0.1).toFixed(1)} ${(-len).toFixed(1)}, ${(-wid*0.1).toFixed(1)} ${(-len).toFixed(1)}, ${(-wid*0.3).toFixed(1)} ${(-len*0.9).toFixed(1)} C ${(-wid*0.9).toFixed(1)} ${(-len*0.75).toFixed(1)}, ${(-wid).toFixed(1)} ${(-len*0.3).toFixed(1)}, 0 0 Z" fill="url(#baPc)" stroke="${SEP2}" stroke-width="0.45" stroke-opacity=".28"/></g>`;}
    for(let i=0;i<5;i++){const rot=i*72+(R()-.5)*10,len=r*0.38,wid=r*0.26;
      p+=`<g transform="rotate(${rot.toFixed(0)})"><path d="M0 0 C ${wid.toFixed(1)} ${(-len*0.35).toFixed(1)}, ${(wid*0.7).toFixed(1)} ${(-len*0.85).toFixed(1)}, 0 ${(-len).toFixed(1)} C ${(-wid*0.7).toFixed(1)} ${(-len*0.85).toFixed(1)}, ${(-wid).toFixed(1)} ${(-len*0.35).toFixed(1)}, 0 0 Z" fill="url(#baPi)" opacity=".9"/></g>`;}
    p+=`<circle r="${(r*0.12).toFixed(1)}" fill="#7A2F1F" opacity=".3"/>`;
    for(let i=0;i<6;i++){const a=R()*Math.PI*2,l=r*0.16;p+=`<circle cx="${(Math.cos(a)*l).toFixed(1)}" cy="${(Math.sin(a)*l).toFixed(1)}" r="0.8" fill="#A5822F" opacity=".85"/>`;}
    return p+'</g>';
  };
  const thb={branch:SEP,branchDk:SEP2};
  /* flowering tree rising along the right edge — with bark overlay */
  s+=branch([392,880],[420,760],[396,640],[416,520],12,4,thb,.95,R);
  s+=branch([394,876],[420,758],[398,642],[415,524],3,1,{branch:SEP2,branchDk:SEP2},.35,R);
  s+=branch([412,540],[386,470],[398,400],[372,340],6,2.4,thb,.9,R);
  s+=branch([394,620],[360,586],[336,596],[310,572],4.5,1.8,thb,.85,R);
  s+=branch([378,352],[350,300],[356,240],[330,196],4.5,1.8,thb,.85,R);
  /* twig stubs on the trunk */
  s+=`<g stroke="${SEP2}" stroke-width="1.4" stroke-linecap="round" fill="none" opacity=".55">
    <path d="M 404 706 q -12 -4 -18 -14 M 407 590 q 10 -6 13 -16 M 399 812 q -10 -2 -15 -10"/></g>`;
  /* its canopy spreading across the top — kept above the crest */
  s+=branch([336,200],[310,118],[262,66],[200,56],5,2,thb,.85,R);
  s+=branch([208,58],[164,44],[120,56],[82,44],3.5,1.4,thb,.8,R);
  /* leaf sprays — pairs and triplets, two greens */
  const topl=[[350,296,-30],[358,306,-64],[368,420,-15],[376,432,-52],[344,540,-40],[352,552,-70],
              [300,576,-140],[290,566,-172],[322,146,-70],[334,160,-30],[262,68,-30],[252,60,-62],
              [212,60,-16],[204,52,-48],[162,46,-6],[154,40,-40],[118,58,6],[110,50,-28],
              [292,76,-40],[238,52,-20],[230,44,-52],[86,46,14],[78,40,-18],
              [398,700,-170],[408,712,-140],[426,610,-150],[418,600,-176]];
  topl.forEach((l,i)=>s+=leafP(l[0],l[1],24+R()*12,l[2],i%2?'baLf':'baLf2'));
  /* painted blossom clusters */
  s+=bloomP(372,332,13,.96);s+=bloomP(330,560,11,.92);s+=bloomP(398,470,10,.9);
  s+=bloomP(234,52,12,.94);s+=bloomP(146,44,10,.9);s+=bloomP(82,42,9,.86);
  s+=bloomP(324,126,8,.82);s+=bud(190,50,5,-24,{blossom2:'#B25E42',blossomPale:'#EBB49B',leaf:'#59714E'},.85,R);
  s+=bud(342,240,5,30,{blossom2:'#B25E42',blossomPale:'#EBB49B',leaf:'#59714E'},.8,R);
  /* foreground, bottom-left: a low flowering branch */
  s+=branch([-16,812],[40,800],[96,810],[150,790],5,2,thb,.9,R);
  s+=branch([64,804],[88,780],[114,776],[136,756],3,1.2,thb,.85,R);
  const bedl=[[56,802,-24],[64,812,-58],[104,804,16],[112,814,48],[86,782,-30],[124,764,-12],[30,806,-64]];
  bedl.forEach((l,i)=>s+=leafP(l[0],l[1],20+R()*9,l[2],i%2?'baLf':'baLf2'));
  s+=bloomP(150,788,11,.94);s+=bloomP(134,752,9,.9);
  s+=bud(112,772,4.5,-30,{blossom2:'#B25E42',blossomPale:'#EBB49B',leaf:'#59714E'},.85,R);
  /* grass at the trunk's foot */
  s+=`<g fill="none" stroke="#5E7350" stroke-width="1.1" stroke-linecap="round" opacity=".5">
    <path d="M 376 882 q 4 -18 14 -26 M 388 884 q 0 -16 6 -26 M 412 884 q 2 -18 -6 -28 M 424 882 q -2 -14 -12 -22"/></g>`;
  /* one swallow in the high clearing */
  s+=`<g fill="${SEP}" opacity=".55" transform="translate(64 250) scale(.72)">
    <path d="M 0 0 c 8 -7 20 -8 28 -3 c -7 1 -12 3 -16 7 c 9 0 15 4 18 10 c -8 -3 -15 -3 -22 0 c -6 3 -12 9 -14 16 c -2 -6 -1 -12 2 -17 c -7 1 -13 -1 -17 -6 c 7 1 14 -2 21 -7 z"/></g>`;
  s+=grain(defs,'bagr','0.8',0.05,83);
  return svgOpen()+`<defs>${defs.join('')}</defs>${s}</svg>`;
}

/* ---------------------------------------------------------------------
   THE COLLECTION — three approved murals, all fixed colourways.
   Each fn() takes no meaningful arguments and returns the SVG string.
   Set the app background vars to ground.bg1/2/3 and re-ink the UI
   (all three are light grounds — see integration.css).
   --------------------------------------------------------------------- */
const MURALS=[
  {id:'or-craquele',name:'L\u2019OR CRAQUEL\u00c9',collection:'Sans Soucis',
   ground:{bg1:'#CBA452',bg2:'#B08A38',bg3:'#8F6E28',light:true},fn:muralOrCraquele,
   note:'Viridian garden on crackled gold metallic silk; banana grove, blossom canopy, ink swallows.'},
  {id:'soie-grise',name:'SOIE GRISE',collection:'Sans Soucis',
   ground:{bg1:'#B5B3AC',bg2:'#AFADA3',bg3:'#9C9A90',light:true},fn:muralSoieGrise,
   note:'Dove-grey silk; the garden in silk-thread embroidery \u2014 satin stitch, running stitch, french knots.'},
  {id:'blanc-antique',name:'BLANC ANTIQUE',collection:'Sans Soucis',
   ground:{bg1:'#F3EDDF',bg2:'#F0E8D6',bg3:'#E7DCC4',light:true},fn:muralBlancAntique,
   note:'Full chinoiserie garden on antique white; flowering tree, low branch, one swallow.'}
];

function toDataURI(svg){return 'data:image/svg+xml;utf8,'+encodeURIComponent(svg)}
function muralURI(muralOrId){
  const m=typeof muralOrId==='string'?MURALS.find(x=>x.id===muralOrId):muralOrId;
  if(!m)throw new Error('unknown mural: '+muralOrId);
  return toDataURI(m.fn());
}

global.OLM_MURALS={W,H,MURALS,toDataURI,muralURI};
})(typeof window!=='undefined'?window:globalThis);


/* ---- damask ground for the classic mats (injected; kept off one giant line) ---- */
(function(){
  var u=[
'data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220',
'%200%20430%20860%22%20preserveAspectRatio%3D%22xMidYMid%20slice%22%3E%3Cg%20transform%3D%22translate',
'(-43.0%20-49.5)%20scale(0.82)%22%20fill%3D%22none%22%20stroke%3D%22%23FFF%22%20stroke-width%3D%221.1',
'%22%20opacity%3D%220.028%22%3E%3Cpath%20d%3D%22M%200%20-34%20C%2010%20-26%2C%2010%20-14%2C%200%20-6%',
'20C%20-10%20-14%2C%20-10%20-26%2C%200%20-34%20Z%22%2F%3E%3Cpath%20d%3D%22M%200%20-6%20C%2014%20-18%2',
'C%2026%20-16%2C%2030%20-4%20C%2022%202%2C%208%202%2C%200%20-6%20Z%22%2F%3E%3Cpath%20d%3D%22M%200%20-',
'6%20C%20-14%20-18%2C%20-26%20-16%2C%20-30%20-4%20C%20-22%202%2C%20-8%202%2C%200%20-6%20Z%22%2F%3E%3C',
'path%20d%3D%22M%200%20-6%20C%206%206%2C%206%2018%2C%200%2030%20C%20-6%2018%2C%20-6%206%2C%200%20-6%2',
'0Z%22%2F%3E%3Ccircle%20cy%3D%22-20%22%20r%3D%222.6%22%2F%3E%3C%2Fg%3E%3Cg%20transform%3D%22translate',
'(43.0%20-49.5)%20scale(0.82)%22%20fill%3D%22none%22%20stroke%3D%22%23FFF%22%20stroke-width%3D%221.1%',
'22%20opacity%3D%220.028%22%3E%3Cpath%20d%3D%22M%200%20-34%20C%2010%20-26%2C%2010%20-14%2C%200%20-6%2',
'0C%20-10%20-14%2C%20-10%20-26%2C%200%20-34%20Z%22%2F%3E%3Cpath%20d%3D%22M%200%20-6%20C%2014%20-18%2C',
'%2026%20-16%2C%2030%20-4%20C%2022%202%2C%208%202%2C%200%20-6%20Z%22%2F%3E%3Cpath%20d%3D%22M%200%20-6',
'%20C%20-14%20-18%2C%20-26%20-16%2C%20-30%20-4%20C%20-22%202%2C%20-8%202%2C%200%20-6%20Z%22%2F%3E%3Cp',
'ath%20d%3D%22M%200%20-6%20C%206%206%2C%206%2018%2C%200%2030%20C%20-6%2018%2C%20-6%206%2C%200%20-6%20',
'Z%22%2F%3E%3Ccircle%20cy%3D%22-20%22%20r%3D%222.6%22%2F%3E%3C%2Fg%3E%3Cg%20transform%3D%22translate(',
'129.0%20-49.5)%20scale(0.82)%22%20fill%3D%22none%22%20stroke%3D%22%23FFF%22%20stroke-width%3D%221.1%',
'22%20opacity%3D%220.028%22%3E%3Cpath%20d%3D%22M%200%20-34%20C%2010%20-26%2C%2010%20-14%2C%200%20-6%2',
'0C%20-10%20-14%2C%20-10%20-26%2C%200%20-34%20Z%22%2F%3E%3Cpath%20d%3D%22M%200%20-6%20C%2014%20-18%2C',
'%2026%20-16%2C%2030%20-4%20C%2022%202%2C%208%202%2C%200%20-6%20Z%22%2F%3E%3Cpath%20d%3D%22M%200%20-6',
'%20C%20-14%20-18%2C%20-26%20-16%2C%20-30%20-4%20C%20-22%202%2C%20-8%202%2C%200%20-6%20Z%22%2F%3E%3Cp',
'ath%20d%3D%22M%200%20-6%20C%206%206%2C%206%2018%2C%200%2030%20C%20-6%2018%2C%20-6%206%2C%200%20-6%20',
'Z%22%2F%3E%3Ccircle%20cy%3D%22-20%22%20r%3D%222.6%22%2F%3E%3C%2Fg%3E%3Cg%20transform%3D%22translate(',
'215.0%20-49.5)%20scale(0.82)%22%20fill%3D%22none%22%20stroke%3D%22%23FFF%22%20stroke-width%3D%221.1%',
'22%20opacity%3D%220.028%22%3E%3Cpath%20d%3D%22M%200%20-34%20C%2010%20-26%2C%2010%20-14%2C%200%20-6%2',
'0C%20-10%20-14%2C%20-10%20-26%2C%200%20-34%20Z%22%2F%3E%3Cpath%20d%3D%22M%200%20-6%20C%2014%20-18%2C',
'%2026%20-16%2C%2030%20-4%20C%2022%202%2C%208%202%2C%200%20-6%20Z%22%2F%3E%3Cpath%20d%3D%22M%200%20-6',
'%20C%20-14%20-18%2C%20-26%20-16%2C%20-30%20-4%20C%20-22%202%2C%20-8%202%2C%200%20-6%20Z%22%2F%3E%3Cp',
'ath%20d%3D%22M%200%20-6%20C%206%206%2C%206%2018%2C%200%2030%20C%20-6%2018%2C%20-6%206%2C%200%20-6%20',
'Z%22%2F%3E%3Ccircle%20cy%3D%22-20%22%20r%3D%222.6%22%2F%3E%3C%2Fg%3E%3Cg%20transform%3D%22translate(',
'301.0%20-49.5)%20scale(0.82)%22%20fill%3D%22none%22%20stroke%3D%22%23FFF%22%20stroke-width%3D%221.1%',
'22%20opacity%3D%220.028%22%3E%3Cpath%20d%3D%22M%200%20-34%20C%2010%20-26%2C%2010%20-14%2C%200%20-6%2',
'0C%20-10%20-14%2C%20-10%20-26%2C%200%20-34%20Z%22%2F%3E%3Cpath%20d%3D%22M%200%20-6%20C%2014%20-18%2C',
'%2026%20-16%2C%2030%20-4%20C%2022%202%2C%208%202%2C%200%20-6%20Z%22%2F%3E%3Cpath%20d%3D%22M%200%20-6',
'%20C%20-14%20-18%2C%20-26%20-16%2C%20-30%20-4%20C%20-22%202%2C%20-8%202%2C%200%20-6%20Z%22%2F%3E%3Cp',
'ath%20d%3D%22M%200%20-6%20C%206%206%2C%206%2018%2C%200%2030%20C%20-6%2018%2C%20-6%206%2C%200%20-6%20',
'Z%22%2F%3E%3Ccircle%20cy%3D%22-20%22%20r%3D%222.6%22%2F%3E%3C%2Fg%3E%3Cg%20transform%3D%22translate(',
'387.0%20-49.5)%20scale(0.82)%22%20fill%3D%22none%22%20stroke%3D%22%23FFF%22%20stroke-width%3D%221.1%',
'22%20opacity%3D%220.028%22%3E%3Cpath%20d%3D%22M%200%20-34%20C%2010%20-26%2C%2010%20-14%2C%200%20-6%2',
'0C%20-10%20-14%2C%20-10%20-26%2C%200%20-34%20Z%22%2F%3E%3Cpath%20d%3D%22M%200%20-6%20C%2014%20-18%2C',
'%2026%20-16%2C%2030%20-4%20C%2022%202%2C%208%202%2C%200%20-6%20Z%22%2F%3E%3Cpath%20d%3D%22M%200%20-6',
'%20C%20-14%20-18%2C%20-26%20-16%2C%20-30%20-4%20C%20-22%202%2C%20-8%202%2C%200%20-6%20Z%22%2F%3E%3Cp',
'ath%20d%3D%22M%200%20-6%20C%206%206%2C%206%2018%2C%200%2030%20C%20-6%2018%2C%20-6%206%2C%200%20-6%20',
'Z%22%2F%3E%3Ccircle%20cy%3D%22-20%22%20r%3D%222.6%22%2F%3E%3C%2Fg%3E%3Cg%20transform%3D%22translate(',
'473.0%20-49.5)%20scale(0.82)%22%20fill%3D%22none%22%20stroke%3D%22%23FFF%22%20stroke-width%3D%221.1%',
'22%20opacity%3D%220.028%22%3E%3Cpath%20d%3D%22M%200%20-34%20C%2010%20-26%2C%2010%20-14%2C%200%20-6%2',
'0C%20-10%20-14%2C%20-10%20-26%2C%200%20-34%20Z%22%2F%3E%3Cpath%20d%3D%22M%200%20-6%20C%2014%20-18%2C',
'%2026%20-16%2C%2030%20-4%20C%2022%202%2C%208%202%2C%200%20-6%20Z%22%2F%3E%3Cpath%20d%3D%22M%200%20-6',
'%20C%20-14%20-18%2C%20-26%20-16%2C%20-30%20-4%20C%20-22%202%2C%20-8%202%2C%200%20-6%20Z%22%2F%3E%3Cp',
'ath%20d%3D%22M%200%20-6%20C%206%206%2C%206%2018%2C%200%2030%20C%20-6%2018%2C%20-6%206%2C%200%20-6%20',
'Z%22%2F%3E%3Ccircle%20cy%3D%22-20%22%20r%3D%222.6%22%2F%3E%3C%2Fg%3E%3Cg%20transform%3D%22translate(',
'0.0%2049.5)%20scale(0.82)%22%20fill%3D%22none%22%20stroke%3D%22%23FFF%22%20stroke-width%3D%221.1%22%',
'20opacity%3D%220.028%22%3E%3Cpath%20d%3D%22M%200%20-34%20C%2010%20-26%2C%2010%20-14%2C%200%20-6%20C%',
'20-10%20-14%2C%20-10%20-26%2C%200%20-34%20Z%22%2F%3E%3Cpath%20d%3D%22M%200%20-6%20C%2014%20-18%2C%20',
'26%20-16%2C%2030%20-4%20C%2022%202%2C%208%202%2C%200%20-6%20Z%22%2F%3E%3Cpath%20d%3D%22M%200%20-6%20',
'C%20-14%20-18%2C%20-26%20-16%2C%20-30%20-4%20C%20-22%202%2C%20-8%202%2C%200%20-6%20Z%22%2F%3E%3Cpath',
'%20d%3D%22M%200%20-6%20C%206%206%2C%206%2018%2C%200%2030%20C%20-6%2018%2C%20-6%206%2C%200%20-6%20Z%2',
'2%2F%3E%3Ccircle%20cy%3D%22-20%22%20r%3D%222.6%22%2F%3E%3C%2Fg%3E%3Cg%20transform%3D%22translate(86.',
'0%2049.5)%20scale(0.82)%22%20fill%3D%22none%22%20stroke%3D%22%23FFF%22%20stroke-width%3D%221.1%22%20',
'opacity%3D%220.028%22%3E%3Cpath%20d%3D%22M%200%20-34%20C%2010%20-26%2C%2010%20-14%2C%200%20-6%20C%20',
'-10%20-14%2C%20-10%20-26%2C%200%20-34%20Z%22%2F%3E%3Cpath%20d%3D%22M%200%20-6%20C%2014%20-18%2C%2026',
'%20-16%2C%2030%20-4%20C%2022%202%2C%208%202%2C%200%20-6%20Z%22%2F%3E%3Cpath%20d%3D%22M%200%20-6%20C%',
'20-14%20-18%2C%20-26%20-16%2C%20-30%20-4%20C%20-22%202%2C%20-8%202%2C%200%20-6%20Z%22%2F%3E%3Cpath%2',
'0d%3D%22M%200%20-6%20C%206%206%2C%206%2018%2C%200%2030%20C%20-6%2018%2C%20-6%206%2C%200%20-6%20Z%22%',
'2F%3E%3Ccircle%20cy%3D%22-20%22%20r%3D%222.6%22%2F%3E%3C%2Fg%3E%3Cg%20transform%3D%22translate(172.0',
'%2049.5)%20scale(0.82)%22%20fill%3D%22none%22%20stroke%3D%22%23FFF%22%20stroke-width%3D%221.1%22%20o',
'pacity%3D%220.028%22%3E%3Cpath%20d%3D%22M%200%20-34%20C%2010%20-26%2C%2010%20-14%2C%200%20-6%20C%20-',
'10%20-14%2C%20-10%20-26%2C%200%20-34%20Z%22%2F%3E%3Cpath%20d%3D%22M%200%20-6%20C%2014%20-18%2C%2026%',
'20-16%2C%2030%20-4%20C%2022%202%2C%208%202%2C%200%20-6%20Z%22%2F%3E%3Cpath%20d%3D%22M%200%20-6%20C%2',
'0-14%20-18%2C%20-26%20-16%2C%20-30%20-4%20C%20-22%202%2C%20-8%202%2C%200%20-6%20Z%22%2F%3E%3Cpath%20',
'd%3D%22M%200%20-6%20C%206%206%2C%206%2018%2C%200%2030%20C%20-6%2018%2C%20-6%206%2C%200%20-6%20Z%22%2',
'F%3E%3Ccircle%20cy%3D%22-20%22%20r%3D%222.6%22%2F%3E%3C%2Fg%3E%3Cg%20transform%3D%22translate(258.0%',
'2049.5)%20scale(0.82)%22%20fill%3D%22none%22%20stroke%3D%22%23FFF%22%20stroke-width%3D%221.1%22%20op',
'acity%3D%220.028%22%3E%3Cpath%20d%3D%22M%200%20-34%20C%2010%20-26%2C%2010%20-14%2C%200%20-6%20C%20-1',
'0%20-14%2C%20-10%20-26%2C%200%20-34%20Z%22%2F%3E%3Cpath%20d%3D%22M%200%20-6%20C%2014%20-18%2C%2026%2',
'0-16%2C%2030%20-4%20C%2022%202%2C%208%202%2C%200%20-6%20Z%22%2F%3E%3Cpath%20d%3D%22M%200%20-6%20C%20',
'-14%20-18%2C%20-26%20-16%2C%20-30%20-4%20C%20-22%202%2C%20-8%202%2C%200%20-6%20Z%22%2F%3E%3Cpath%20d',
'%3D%22M%200%20-6%20C%206%206%2C%206%2018%2C%200%2030%20C%20-6%2018%2C%20-6%206%2C%200%20-6%20Z%22%2F',
'%3E%3Ccircle%20cy%3D%22-20%22%20r%3D%222.6%22%2F%3E%3C%2Fg%3E%3Cg%20transform%3D%22translate(344.0%2',
'049.5)%20scale(0.82)%22%20fill%3D%22none%22%20stroke%3D%22%23FFF%22%20stroke-width%3D%221.1%22%20opa',
'city%3D%220.028%22%3E%3Cpath%20d%3D%22M%200%20-34%20C%2010%20-26%2C%2010%20-14%2C%200%20-6%20C%20-10',
'%20-14%2C%20-10%20-26%2C%200%20-34%20Z%22%2F%3E%3Cpath%20d%3D%22M%200%20-6%20C%2014%20-18%2C%2026%20',
'-16%2C%2030%20-4%20C%2022%202%2C%208%202%2C%200%20-6%20Z%22%2F%3E%3Cpath%20d%3D%22M%200%20-6%20C%20-',
'14%20-18%2C%20-26%20-16%2C%20-30%20-4%20C%20-22%202%2C%20-8%202%2C%200%20-6%20Z%22%2F%3E%3Cpath%20d%',
'3D%22M%200%20-6%20C%206%206%2C%206%2018%2C%200%2030%20C%20-6%2018%2C%20-6%206%2C%200%20-6%20Z%22%2F%',
'3E%3Ccircle%20cy%3D%22-20%22%20r%3D%222.6%22%2F%3E%3C%2Fg%3E%3Cg%20transform%3D%22translate(430.0%20',
'49.5)%20scale(0.82)%22%20fill%3D%22none%22%20stroke%3D%22%23FFF%22%20stroke-width%3D%221.1%22%20opac',
'ity%3D%220.028%22%3E%3Cpath%20d%3D%22M%200%20-34%20C%2010%20-26%2C%2010%20-14%2C%200%20-6%20C%20-10%',
'20-14%2C%20-10%20-26%2C%200%20-34%20Z%22%2F%3E%3Cpath%20d%3D%22M%200%20-6%20C%2014%20-18%2C%2026%20-',
'16%2C%2030%20-4%20C%2022%202%2C%208%202%2C%200%20-6%20Z%22%2F%3E%3Cpath%20d%3D%22M%200%20-6%20C%20-1',
'4%20-18%2C%20-26%20-16%2C%20-30%20-4%20C%20-22%202%2C%20-8%202%2C%200%20-6%20Z%22%2F%3E%3Cpath%20d%3',
'D%22M%200%20-6%20C%206%206%2C%206%2018%2C%200%2030%20C%20-6%2018%2C%20-6%206%2C%200%20-6%20Z%22%2F%3',
'E%3Ccircle%20cy%3D%22-20%22%20r%3D%222.6%22%2F%3E%3C%2Fg%3E%3Cg%20transform%3D%22translate(516.0%204',
'9.5)%20scale(0.82)%22%20fill%3D%22none%22%20stroke%3D%22%23FFF%22%20stroke-width%3D%221.1%22%20opaci',
'ty%3D%220.028%22%3E%3Cpath%20d%3D%22M%200%20-34%20C%2010%20-26%2C%2010%20-14%2C%200%20-6%20C%20-10%2',
'0-14%2C%20-10%20-26%2C%200%20-34%20Z%22%2F%3E%3Cpath%20d%3D%22M%200%20-6%20C%2014%20-18%2C%2026%20-1',
'6%2C%2030%20-4%20C%2022%202%2C%208%202%2C%200%20-6%20Z%22%2F%3E%3Cpath%20d%3D%22M%200%20-6%20C%20-14',
'%20-18%2C%20-26%20-16%2C%20-30%20-4%20C%20-22%202%2C%20-8%202%2C%200%20-6%20Z%22%2F%3E%3Cpath%20d%3D',
'%22M%200%20-6%20C%206%206%2C%206%2018%2C%200%2030%20C%20-6%2018%2C%20-6%206%2C%200%20-6%20Z%22%2F%3E',
'%3Ccircle%20cy%3D%22-20%22%20r%3D%222.6%22%2F%3E%3C%2Fg%3E%3Cg%20transform%3D%22translate(-43.0%2014',
'8.5)%20scale(0.82)%22%20fill%3D%22none%22%20stroke%3D%22%23FFF%22%20stroke-width%3D%221.1%22%20opaci',
'ty%3D%220.028%22%3E%3Cpath%20d%3D%22M%200%20-34%20C%2010%20-26%2C%2010%20-14%2C%200%20-6%20C%20-10%2',
'0-14%2C%20-10%20-26%2C%200%20-34%20Z%22%2F%3E%3Cpath%20d%3D%22M%200%20-6%20C%2014%20-18%2C%2026%20-1',
'6%2C%2030%20-4%20C%2022%202%2C%208%202%2C%200%20-6%20Z%22%2F%3E%3Cpath%20d%3D%22M%200%20-6%20C%20-14',
'%20-18%2C%20-26%20-16%2C%20-30%20-4%20C%20-22%202%2C%20-8%202%2C%200%20-6%20Z%22%2F%3E%3Cpath%20d%3D',
'%22M%200%20-6%20C%206%206%2C%206%2018%2C%200%2030%20C%20-6%2018%2C%20-6%206%2C%200%20-6%20Z%22%2F%3E',
'%3Ccircle%20cy%3D%22-20%22%20r%3D%222.6%22%2F%3E%3C%2Fg%3E%3Cg%20transform%3D%22translate(43.0%20148',
'.5)%20scale(0.82)%22%20fill%3D%22none%22%20stroke%3D%22%23FFF%22%20stroke-width%3D%221.1%22%20opacit',
'y%3D%220.028%22%3E%3Cpath%20d%3D%22M%200%20-34%20C%2010%20-26%2C%2010%20-14%2C%200%20-6%20C%20-10%20',
'-14%2C%20-10%20-26%2C%200%20-34%20Z%22%2F%3E%3Cpath%20d%3D%22M%200%20-6%20C%2014%20-18%2C%2026%20-16',
'%2C%2030%20-4%20C%2022%202%2C%208%202%2C%200%20-6%20Z%22%2F%3E%3Cpath%20d%3D%22M%200%20-6%20C%20-14%',
'20-18%2C%20-26%20-16%2C%20-30%20-4%20C%20-22%202%2C%20-8%202%2C%200%20-6%20Z%22%2F%3E%3Cpath%20d%3D%',
'22M%200%20-6%20C%206%206%2C%206%2018%2C%200%2030%20C%20-6%2018%2C%20-6%206%2C%200%20-6%20Z%22%2F%3E%',
'3Ccircle%20cy%3D%22-20%22%20r%3D%222.6%22%2F%3E%3C%2Fg%3E%3Cg%20transform%3D%22translate(129.0%20148',
'.5)%20scale(0.82)%22%20fill%3D%22none%22%20stroke%3D%22%23FFF%22%20stroke-width%3D%221.1%22%20opacit',
'y%3D%220.028%22%3E%3Cpath%20d%3D%22M%200%20-34%20C%2010%20-26%2C%2010%20-14%2C%200%20-6%20C%20-10%20',
'-14%2C%20-10%20-26%2C%200%20-34%20Z%22%2F%3E%3Cpath%20d%3D%22M%200%20-6%20C%2014%20-18%2C%2026%20-16',
'%2C%2030%20-4%20C%2022%202%2C%208%202%2C%200%20-6%20Z%22%2F%3E%3Cpath%20d%3D%22M%200%20-6%20C%20-14%',
'20-18%2C%20-26%20-16%2C%20-30%20-4%20C%20-22%202%2C%20-8%202%2C%200%20-6%20Z%22%2F%3E%3Cpath%20d%3D%',
'22M%200%20-6%20C%206%206%2C%206%2018%2C%200%2030%20C%20-6%2018%2C%20-6%206%2C%200%20-6%20Z%22%2F%3E%',
'3Ccircle%20cy%3D%22-20%22%20r%3D%222.6%22%2F%3E%3C%2Fg%3E%3Cg%20transform%3D%22translate(215.0%20148',
'.5)%20scale(0.82)%22%20fill%3D%22none%22%20stroke%3D%22%23FFF%22%20stroke-width%3D%221.1%22%20opacit',
'y%3D%220.028%22%3E%3Cpath%20d%3D%22M%200%20-34%20C%2010%20-26%2C%2010%20-14%2C%200%20-6%20C%20-10%20',
'-14%2C%20-10%20-26%2C%200%20-34%20Z%22%2F%3E%3Cpath%20d%3D%22M%200%20-6%20C%2014%20-18%2C%2026%20-16',
'%2C%2030%20-4%20C%2022%202%2C%208%202%2C%200%20-6%20Z%22%2F%3E%3Cpath%20d%3D%22M%200%20-6%20C%20-14%',
'20-18%2C%20-26%20-16%2C%20-30%20-4%20C%20-22%202%2C%20-8%202%2C%200%20-6%20Z%22%2F%3E%3Cpath%20d%3D%',
'22M%200%20-6%20C%206%206%2C%206%2018%2C%200%2030%20C%20-6%2018%2C%20-6%206%2C%200%20-6%20Z%22%2F%3E%',
'3Ccircle%20cy%3D%22-20%22%20r%3D%222.6%22%2F%3E%3C%2Fg%3E%3Cg%20transform%3D%22translate(301.0%20148',
'.5)%20scale(0.82)%22%20fill%3D%22none%22%20stroke%3D%22%23FFF%22%20stroke-width%3D%221.1%22%20opacit',
'y%3D%220.028%22%3E%3Cpath%20d%3D%22M%200%20-34%20C%2010%20-26%2C%2010%20-14%2C%200%20-6%20C%20-10%20',
'-14%2C%20-10%20-26%2C%200%20-34%20Z%22%2F%3E%3Cpath%20d%3D%22M%200%20-6%20C%2014%20-18%2C%2026%20-16',
'%2C%2030%20-4%20C%2022%202%2C%208%202%2C%200%20-6%20Z%22%2F%3E%3Cpath%20d%3D%22M%200%20-6%20C%20-14%',
'20-18%2C%20-26%20-16%2C%20-30%20-4%20C%20-22%202%2C%20-8%202%2C%200%20-6%20Z%22%2F%3E%3Cpath%20d%3D%',
'22M%200%20-6%20C%206%206%2C%206%2018%2C%200%2030%20C%20-6%2018%2C%20-6%206%2C%200%20-6%20Z%22%2F%3E%',
'3Ccircle%20cy%3D%22-20%22%20r%3D%222.6%22%2F%3E%3C%2Fg%3E%3Cg%20transform%3D%22translate(387.0%20148',
'.5)%20scale(0.82)%22%20fill%3D%22none%22%20stroke%3D%22%23FFF%22%20stroke-width%3D%221.1%22%20opacit',
'y%3D%220.028%22%3E%3Cpath%20d%3D%22M%200%20-34%20C%2010%20-26%2C%2010%20-14%2C%200%20-6%20C%20-10%20',
'-14%2C%20-10%20-26%2C%200%20-34%20Z%22%2F%3E%3Cpath%20d%3D%22M%200%20-6%20C%2014%20-18%2C%2026%20-16',
'%2C%2030%20-4%20C%2022%202%2C%208%202%2C%200%20-6%20Z%22%2F%3E%3Cpath%20d%3D%22M%200%20-6%20C%20-14%',
'20-18%2C%20-26%20-16%2C%20-30%20-4%20C%20-22%202%2C%20-8%202%2C%200%20-6%20Z%22%2F%3E%3Cpath%20d%3D%',
'22M%200%20-6%20C%206%206%2C%206%2018%2C%200%2030%20C%20-6%2018%2C%20-6%206%2C%200%20-6%20Z%22%2F%3E%',
'3Ccircle%20cy%3D%22-20%22%20r%3D%222.6%22%2F%3E%3C%2Fg%3E%3Cg%20transform%3D%22translate(473.0%20148',
'.5)%20scale(0.82)%22%20fill%3D%22none%22%20stroke%3D%22%23FFF%22%20stroke-width%3D%221.1%22%20opacit',
'y%3D%220.028%22%3E%3Cpath%20d%3D%22M%200%20-34%20C%2010%20-26%2C%2010%20-14%2C%200%20-6%20C%20-10%20',
'-14%2C%20-10%20-26%2C%200%20-34%20Z%22%2F%3E%3Cpath%20d%3D%22M%200%20-6%20C%2014%20-18%2C%2026%20-16',
'%2C%2030%20-4%20C%2022%202%2C%208%202%2C%200%20-6%20Z%22%2F%3E%3Cpath%20d%3D%22M%200%20-6%20C%20-14%',
'20-18%2C%20-26%20-16%2C%20-30%20-4%20C%20-22%202%2C%20-8%202%2C%200%20-6%20Z%22%2F%3E%3Cpath%20d%3D%',
'22M%200%20-6%20C%206%206%2C%206%2018%2C%200%2030%20C%20-6%2018%2C%20-6%206%2C%200%20-6%20Z%22%2F%3E%',
'3Ccircle%20cy%3D%22-20%22%20r%3D%222.6%22%2F%3E%3C%2Fg%3E%3Cg%20transform%3D%22translate(0.0%20247.5',
')%20scale(0.82)%22%20fill%3D%22none%22%20stroke%3D%22%23FFF%22%20stroke-width%3D%221.1%22%20opacity%',
'3D%220.028%22%3E%3Cpath%20d%3D%22M%200%20-34%20C%2010%20-26%2C%2010%20-14%2C%200%20-6%20C%20-10%20-1',
'4%2C%20-10%20-26%2C%200%20-34%20Z%22%2F%3E%3Cpath%20d%3D%22M%200%20-6%20C%2014%20-18%2C%2026%20-16%2',
'C%2030%20-4%20C%2022%202%2C%208%202%2C%200%20-6%20Z%22%2F%3E%3Cpath%20d%3D%22M%200%20-6%20C%20-14%20',
'-18%2C%20-26%20-16%2C%20-30%20-4%20C%20-22%202%2C%20-8%202%2C%200%20-6%20Z%22%2F%3E%3Cpath%20d%3D%22',
'M%200%20-6%20C%206%206%2C%206%2018%2C%200%2030%20C%20-6%2018%2C%20-6%206%2C%200%20-6%20Z%22%2F%3E%3C',
'circle%20cy%3D%22-20%22%20r%3D%222.6%22%2F%3E%3C%2Fg%3E%3Cg%20transform%3D%22translate(86.0%20247.5)',
'%20scale(0.82)%22%20fill%3D%22none%22%20stroke%3D%22%23FFF%22%20stroke-width%3D%221.1%22%20opacity%3',
'D%220.028%22%3E%3Cpath%20d%3D%22M%200%20-34%20C%2010%20-26%2C%2010%20-14%2C%200%20-6%20C%20-10%20-14',
'%2C%20-10%20-26%2C%200%20-34%20Z%22%2F%3E%3Cpath%20d%3D%22M%200%20-6%20C%2014%20-18%2C%2026%20-16%2C',
'%2030%20-4%20C%2022%202%2C%208%202%2C%200%20-6%20Z%22%2F%3E%3Cpath%20d%3D%22M%200%20-6%20C%20-14%20-',
'18%2C%20-26%20-16%2C%20-30%20-4%20C%20-22%202%2C%20-8%202%2C%200%20-6%20Z%22%2F%3E%3Cpath%20d%3D%22M',
'%200%20-6%20C%206%206%2C%206%2018%2C%200%2030%20C%20-6%2018%2C%20-6%206%2C%200%20-6%20Z%22%2F%3E%3Cc',
'ircle%20cy%3D%22-20%22%20r%3D%222.6%22%2F%3E%3C%2Fg%3E%3Cg%20transform%3D%22translate(172.0%20247.5)',
'%20scale(0.82)%22%20fill%3D%22none%22%20stroke%3D%22%23FFF%22%20stroke-width%3D%221.1%22%20opacity%3',
'D%220.028%22%3E%3Cpath%20d%3D%22M%200%20-34%20C%2010%20-26%2C%2010%20-14%2C%200%20-6%20C%20-10%20-14',
'%2C%20-10%20-26%2C%200%20-34%20Z%22%2F%3E%3Cpath%20d%3D%22M%200%20-6%20C%2014%20-18%2C%2026%20-16%2C',
'%2030%20-4%20C%2022%202%2C%208%202%2C%200%20-6%20Z%22%2F%3E%3Cpath%20d%3D%22M%200%20-6%20C%20-14%20-',
'18%2C%20-26%20-16%2C%20-30%20-4%20C%20-22%202%2C%20-8%202%2C%200%20-6%20Z%22%2F%3E%3Cpath%20d%3D%22M',
'%200%20-6%20C%206%206%2C%206%2018%2C%200%2030%20C%20-6%2018%2C%20-6%206%2C%200%20-6%20Z%22%2F%3E%3Cc',
'ircle%20cy%3D%22-20%22%20r%3D%222.6%22%2F%3E%3C%2Fg%3E%3Cg%20transform%3D%22translate(258.0%20247.5)',
'%20scale(0.82)%22%20fill%3D%22none%22%20stroke%3D%22%23FFF%22%20stroke-width%3D%221.1%22%20opacity%3',
'D%220.028%22%3E%3Cpath%20d%3D%22M%200%20-34%20C%2010%20-26%2C%2010%20-14%2C%200%20-6%20C%20-10%20-14',
'%2C%20-10%20-26%2C%200%20-34%20Z%22%2F%3E%3Cpath%20d%3D%22M%200%20-6%20C%2014%20-18%2C%2026%20-16%2C',
'%2030%20-4%20C%2022%202%2C%208%202%2C%200%20-6%20Z%22%2F%3E%3Cpath%20d%3D%22M%200%20-6%20C%20-14%20-',
'18%2C%20-26%20-16%2C%20-30%20-4%20C%20-22%202%2C%20-8%202%2C%200%20-6%20Z%22%2F%3E%3Cpath%20d%3D%22M',
'%200%20-6%20C%206%206%2C%206%2018%2C%200%2030%20C%20-6%2018%2C%20-6%206%2C%200%20-6%20Z%22%2F%3E%3Cc',
'ircle%20cy%3D%22-20%22%20r%3D%222.6%22%2F%3E%3C%2Fg%3E%3Cg%20transform%3D%22translate(344.0%20247.5)',
'%20scale(0.82)%22%20fill%3D%22none%22%20stroke%3D%22%23FFF%22%20stroke-width%3D%221.1%22%20opacity%3',
'D%220.028%22%3E%3Cpath%20d%3D%22M%200%20-34%20C%2010%20-26%2C%2010%20-14%2C%200%20-6%20C%20-10%20-14',
'%2C%20-10%20-26%2C%200%20-34%20Z%22%2F%3E%3Cpath%20d%3D%22M%200%20-6%20C%2014%20-18%2C%2026%20-16%2C',
'%2030%20-4%20C%2022%202%2C%208%202%2C%200%20-6%20Z%22%2F%3E%3Cpath%20d%3D%22M%200%20-6%20C%20-14%20-',
'18%2C%20-26%20-16%2C%20-30%20-4%20C%20-22%202%2C%20-8%202%2C%200%20-6%20Z%22%2F%3E%3Cpath%20d%3D%22M',
'%200%20-6%20C%206%206%2C%206%2018%2C%200%2030%20C%20-6%2018%2C%20-6%206%2C%200%20-6%20Z%22%2F%3E%3Cc',
'ircle%20cy%3D%22-20%22%20r%3D%222.6%22%2F%3E%3C%2Fg%3E%3Cg%20transform%3D%22translate(430.0%20247.5)',
'%20scale(0.82)%22%20fill%3D%22none%22%20stroke%3D%22%23FFF%22%20stroke-width%3D%221.1%22%20opacity%3',
'D%220.028%22%3E%3Cpath%20d%3D%22M%200%20-34%20C%2010%20-26%2C%2010%20-14%2C%200%20-6%20C%20-10%20-14',
'%2C%20-10%20-26%2C%200%20-34%20Z%22%2F%3E%3Cpath%20d%3D%22M%200%20-6%20C%2014%20-18%2C%2026%20-16%2C',
'%2030%20-4%20C%2022%202%2C%208%202%2C%200%20-6%20Z%22%2F%3E%3Cpath%20d%3D%22M%200%20-6%20C%20-14%20-',
'18%2C%20-26%20-16%2C%20-30%20-4%20C%20-22%202%2C%20-8%202%2C%200%20-6%20Z%22%2F%3E%3Cpath%20d%3D%22M',
'%200%20-6%20C%206%206%2C%206%2018%2C%200%2030%20C%20-6%2018%2C%20-6%206%2C%200%20-6%20Z%22%2F%3E%3Cc',
'ircle%20cy%3D%22-20%22%20r%3D%222.6%22%2F%3E%3C%2Fg%3E%3Cg%20transform%3D%22translate(516.0%20247.5)',
'%20scale(0.82)%22%20fill%3D%22none%22%20stroke%3D%22%23FFF%22%20stroke-width%3D%221.1%22%20opacity%3',
'D%220.028%22%3E%3Cpath%20d%3D%22M%200%20-34%20C%2010%20-26%2C%2010%20-14%2C%200%20-6%20C%20-10%20-14',
'%2C%20-10%20-26%2C%200%20-34%20Z%22%2F%3E%3Cpath%20d%3D%22M%200%20-6%20C%2014%20-18%2C%2026%20-16%2C',
'%2030%20-4%20C%2022%202%2C%208%202%2C%200%20-6%20Z%22%2F%3E%3Cpath%20d%3D%22M%200%20-6%20C%20-14%20-',
'18%2C%20-26%20-16%2C%20-30%20-4%20C%20-22%202%2C%20-8%202%2C%200%20-6%20Z%22%2F%3E%3Cpath%20d%3D%22M',
'%200%20-6%20C%206%206%2C%206%2018%2C%200%2030%20C%20-6%2018%2C%20-6%206%2C%200%20-6%20Z%22%2F%3E%3Cc',
'ircle%20cy%3D%22-20%22%20r%3D%222.6%22%2F%3E%3C%2Fg%3E%3Cg%20transform%3D%22translate(-43.0%20346.5)',
'%20scale(0.82)%22%20fill%3D%22none%22%20stroke%3D%22%23FFF%22%20stroke-width%3D%221.1%22%20opacity%3',
'D%220.028%22%3E%3Cpath%20d%3D%22M%200%20-34%20C%2010%20-26%2C%2010%20-14%2C%200%20-6%20C%20-10%20-14',
'%2C%20-10%20-26%2C%200%20-34%20Z%22%2F%3E%3Cpath%20d%3D%22M%200%20-6%20C%2014%20-18%2C%2026%20-16%2C',
'%2030%20-4%20C%2022%202%2C%208%202%2C%200%20-6%20Z%22%2F%3E%3Cpath%20d%3D%22M%200%20-6%20C%20-14%20-',
'18%2C%20-26%20-16%2C%20-30%20-4%20C%20-22%202%2C%20-8%202%2C%200%20-6%20Z%22%2F%3E%3Cpath%20d%3D%22M',
'%200%20-6%20C%206%206%2C%206%2018%2C%200%2030%20C%20-6%2018%2C%20-6%206%2C%200%20-6%20Z%22%2F%3E%3Cc',
'ircle%20cy%3D%22-20%22%20r%3D%222.6%22%2F%3E%3C%2Fg%3E%3Cg%20transform%3D%22translate(43.0%20346.5)%',
'20scale(0.82)%22%20fill%3D%22none%22%20stroke%3D%22%23FFF%22%20stroke-width%3D%221.1%22%20opacity%3D',
'%220.028%22%3E%3Cpath%20d%3D%22M%200%20-34%20C%2010%20-26%2C%2010%20-14%2C%200%20-6%20C%20-10%20-14%',
'2C%20-10%20-26%2C%200%20-34%20Z%22%2F%3E%3Cpath%20d%3D%22M%200%20-6%20C%2014%20-18%2C%2026%20-16%2C%',
'2030%20-4%20C%2022%202%2C%208%202%2C%200%20-6%20Z%22%2F%3E%3Cpath%20d%3D%22M%200%20-6%20C%20-14%20-1',
'8%2C%20-26%20-16%2C%20-30%20-4%20C%20-22%202%2C%20-8%202%2C%200%20-6%20Z%22%2F%3E%3Cpath%20d%3D%22M%',
'200%20-6%20C%206%206%2C%206%2018%2C%200%2030%20C%20-6%2018%2C%20-6%206%2C%200%20-6%20Z%22%2F%3E%3Cci',
'rcle%20cy%3D%22-20%22%20r%3D%222.6%22%2F%3E%3C%2Fg%3E%3Cg%20transform%3D%22translate(129.0%20346.5)%',
'20scale(0.82)%22%20fill%3D%22none%22%20stroke%3D%22%23FFF%22%20stroke-width%3D%221.1%22%20opacity%3D',
'%220.028%22%3E%3Cpath%20d%3D%22M%200%20-34%20C%2010%20-26%2C%2010%20-14%2C%200%20-6%20C%20-10%20-14%',
'2C%20-10%20-26%2C%200%20-34%20Z%22%2F%3E%3Cpath%20d%3D%22M%200%20-6%20C%2014%20-18%2C%2026%20-16%2C%',
'2030%20-4%20C%2022%202%2C%208%202%2C%200%20-6%20Z%22%2F%3E%3Cpath%20d%3D%22M%200%20-6%20C%20-14%20-1',
'8%2C%20-26%20-16%2C%20-30%20-4%20C%20-22%202%2C%20-8%202%2C%200%20-6%20Z%22%2F%3E%3Cpath%20d%3D%22M%',
'200%20-6%20C%206%206%2C%206%2018%2C%200%2030%20C%20-6%2018%2C%20-6%206%2C%200%20-6%20Z%22%2F%3E%3Cci',
'rcle%20cy%3D%22-20%22%20r%3D%222.6%22%2F%3E%3C%2Fg%3E%3Cg%20transform%3D%22translate(215.0%20346.5)%',
'20scale(0.82)%22%20fill%3D%22none%22%20stroke%3D%22%23FFF%22%20stroke-width%3D%221.1%22%20opacity%3D',
'%220.028%22%3E%3Cpath%20d%3D%22M%200%20-34%20C%2010%20-26%2C%2010%20-14%2C%200%20-6%20C%20-10%20-14%',
'2C%20-10%20-26%2C%200%20-34%20Z%22%2F%3E%3Cpath%20d%3D%22M%200%20-6%20C%2014%20-18%2C%2026%20-16%2C%',
'2030%20-4%20C%2022%202%2C%208%202%2C%200%20-6%20Z%22%2F%3E%3Cpath%20d%3D%22M%200%20-6%20C%20-14%20-1',
'8%2C%20-26%20-16%2C%20-30%20-4%20C%20-22%202%2C%20-8%202%2C%200%20-6%20Z%22%2F%3E%3Cpath%20d%3D%22M%',
'200%20-6%20C%206%206%2C%206%2018%2C%200%2030%20C%20-6%2018%2C%20-6%206%2C%200%20-6%20Z%22%2F%3E%3Cci',
'rcle%20cy%3D%22-20%22%20r%3D%222.6%22%2F%3E%3C%2Fg%3E%3Cg%20transform%3D%22translate(301.0%20346.5)%',
'20scale(0.82)%22%20fill%3D%22none%22%20stroke%3D%22%23FFF%22%20stroke-width%3D%221.1%22%20opacity%3D',
'%220.028%22%3E%3Cpath%20d%3D%22M%200%20-34%20C%2010%20-26%2C%2010%20-14%2C%200%20-6%20C%20-10%20-14%',
'2C%20-10%20-26%2C%200%20-34%20Z%22%2F%3E%3Cpath%20d%3D%22M%200%20-6%20C%2014%20-18%2C%2026%20-16%2C%',
'2030%20-4%20C%2022%202%2C%208%202%2C%200%20-6%20Z%22%2F%3E%3Cpath%20d%3D%22M%200%20-6%20C%20-14%20-1',
'8%2C%20-26%20-16%2C%20-30%20-4%20C%20-22%202%2C%20-8%202%2C%200%20-6%20Z%22%2F%3E%3Cpath%20d%3D%22M%',
'200%20-6%20C%206%206%2C%206%2018%2C%200%2030%20C%20-6%2018%2C%20-6%206%2C%200%20-6%20Z%22%2F%3E%3Cci',
'rcle%20cy%3D%22-20%22%20r%3D%222.6%22%2F%3E%3C%2Fg%3E%3Cg%20transform%3D%22translate(387.0%20346.5)%',
'20scale(0.82)%22%20fill%3D%22none%22%20stroke%3D%22%23FFF%22%20stroke-width%3D%221.1%22%20opacity%3D',
'%220.028%22%3E%3Cpath%20d%3D%22M%200%20-34%20C%2010%20-26%2C%2010%20-14%2C%200%20-6%20C%20-10%20-14%',
'2C%20-10%20-26%2C%200%20-34%20Z%22%2F%3E%3Cpath%20d%3D%22M%200%20-6%20C%2014%20-18%2C%2026%20-16%2C%',
'2030%20-4%20C%2022%202%2C%208%202%2C%200%20-6%20Z%22%2F%3E%3Cpath%20d%3D%22M%200%20-6%20C%20-14%20-1',
'8%2C%20-26%20-16%2C%20-30%20-4%20C%20-22%202%2C%20-8%202%2C%200%20-6%20Z%22%2F%3E%3Cpath%20d%3D%22M%',
'200%20-6%20C%206%206%2C%206%2018%2C%200%2030%20C%20-6%2018%2C%20-6%206%2C%200%20-6%20Z%22%2F%3E%3Cci',
'rcle%20cy%3D%22-20%22%20r%3D%222.6%22%2F%3E%3C%2Fg%3E%3Cg%20transform%3D%22translate(473.0%20346.5)%',
'20scale(0.82)%22%20fill%3D%22none%22%20stroke%3D%22%23FFF%22%20stroke-width%3D%221.1%22%20opacity%3D',
'%220.028%22%3E%3Cpath%20d%3D%22M%200%20-34%20C%2010%20-26%2C%2010%20-14%2C%200%20-6%20C%20-10%20-14%',
'2C%20-10%20-26%2C%200%20-34%20Z%22%2F%3E%3Cpath%20d%3D%22M%200%20-6%20C%2014%20-18%2C%2026%20-16%2C%',
'2030%20-4%20C%2022%202%2C%208%202%2C%200%20-6%20Z%22%2F%3E%3Cpath%20d%3D%22M%200%20-6%20C%20-14%20-1',
'8%2C%20-26%20-16%2C%20-30%20-4%20C%20-22%202%2C%20-8%202%2C%200%20-6%20Z%22%2F%3E%3Cpath%20d%3D%22M%',
'200%20-6%20C%206%206%2C%206%2018%2C%200%2030%20C%20-6%2018%2C%20-6%206%2C%200%20-6%20Z%22%2F%3E%3Cci',
'rcle%20cy%3D%22-20%22%20r%3D%222.6%22%2F%3E%3C%2Fg%3E%3Cg%20transform%3D%22translate(0.0%20445.5)%20',
'scale(0.82)%22%20fill%3D%22none%22%20stroke%3D%22%23FFF%22%20stroke-width%3D%221.1%22%20opacity%3D%2',
'20.028%22%3E%3Cpath%20d%3D%22M%200%20-34%20C%2010%20-26%2C%2010%20-14%2C%200%20-6%20C%20-10%20-14%2C',
'%20-10%20-26%2C%200%20-34%20Z%22%2F%3E%3Cpath%20d%3D%22M%200%20-6%20C%2014%20-18%2C%2026%20-16%2C%20',
'30%20-4%20C%2022%202%2C%208%202%2C%200%20-6%20Z%22%2F%3E%3Cpath%20d%3D%22M%200%20-6%20C%20-14%20-18%',
'2C%20-26%20-16%2C%20-30%20-4%20C%20-22%202%2C%20-8%202%2C%200%20-6%20Z%22%2F%3E%3Cpath%20d%3D%22M%20',
'0%20-6%20C%206%206%2C%206%2018%2C%200%2030%20C%20-6%2018%2C%20-6%206%2C%200%20-6%20Z%22%2F%3E%3Ccirc',
'le%20cy%3D%22-20%22%20r%3D%222.6%22%2F%3E%3C%2Fg%3E%3Cg%20transform%3D%22translate(86.0%20445.5)%20s',
'cale(0.82)%22%20fill%3D%22none%22%20stroke%3D%22%23FFF%22%20stroke-width%3D%221.1%22%20opacity%3D%22',
'0.028%22%3E%3Cpath%20d%3D%22M%200%20-34%20C%2010%20-26%2C%2010%20-14%2C%200%20-6%20C%20-10%20-14%2C%',
'20-10%20-26%2C%200%20-34%20Z%22%2F%3E%3Cpath%20d%3D%22M%200%20-6%20C%2014%20-18%2C%2026%20-16%2C%203',
'0%20-4%20C%2022%202%2C%208%202%2C%200%20-6%20Z%22%2F%3E%3Cpath%20d%3D%22M%200%20-6%20C%20-14%20-18%2',
'C%20-26%20-16%2C%20-30%20-4%20C%20-22%202%2C%20-8%202%2C%200%20-6%20Z%22%2F%3E%3Cpath%20d%3D%22M%200',
'%20-6%20C%206%206%2C%206%2018%2C%200%2030%20C%20-6%2018%2C%20-6%206%2C%200%20-6%20Z%22%2F%3E%3Ccircl',
'e%20cy%3D%22-20%22%20r%3D%222.6%22%2F%3E%3C%2Fg%3E%3Cg%20transform%3D%22translate(172.0%20445.5)%20s',
'cale(0.82)%22%20fill%3D%22none%22%20stroke%3D%22%23FFF%22%20stroke-width%3D%221.1%22%20opacity%3D%22',
'0.028%22%3E%3Cpath%20d%3D%22M%200%20-34%20C%2010%20-26%2C%2010%20-14%2C%200%20-6%20C%20-10%20-14%2C%',
'20-10%20-26%2C%200%20-34%20Z%22%2F%3E%3Cpath%20d%3D%22M%200%20-6%20C%2014%20-18%2C%2026%20-16%2C%203',
'0%20-4%20C%2022%202%2C%208%202%2C%200%20-6%20Z%22%2F%3E%3Cpath%20d%3D%22M%200%20-6%20C%20-14%20-18%2',
'C%20-26%20-16%2C%20-30%20-4%20C%20-22%202%2C%20-8%202%2C%200%20-6%20Z%22%2F%3E%3Cpath%20d%3D%22M%200',
'%20-6%20C%206%206%2C%206%2018%2C%200%2030%20C%20-6%2018%2C%20-6%206%2C%200%20-6%20Z%22%2F%3E%3Ccircl',
'e%20cy%3D%22-20%22%20r%3D%222.6%22%2F%3E%3C%2Fg%3E%3Cg%20transform%3D%22translate(258.0%20445.5)%20s',
'cale(0.82)%22%20fill%3D%22none%22%20stroke%3D%22%23FFF%22%20stroke-width%3D%221.1%22%20opacity%3D%22',
'0.028%22%3E%3Cpath%20d%3D%22M%200%20-34%20C%2010%20-26%2C%2010%20-14%2C%200%20-6%20C%20-10%20-14%2C%',
'20-10%20-26%2C%200%20-34%20Z%22%2F%3E%3Cpath%20d%3D%22M%200%20-6%20C%2014%20-18%2C%2026%20-16%2C%203',
'0%20-4%20C%2022%202%2C%208%202%2C%200%20-6%20Z%22%2F%3E%3Cpath%20d%3D%22M%200%20-6%20C%20-14%20-18%2',
'C%20-26%20-16%2C%20-30%20-4%20C%20-22%202%2C%20-8%202%2C%200%20-6%20Z%22%2F%3E%3Cpath%20d%3D%22M%200',
'%20-6%20C%206%206%2C%206%2018%2C%200%2030%20C%20-6%2018%2C%20-6%206%2C%200%20-6%20Z%22%2F%3E%3Ccircl',
'e%20cy%3D%22-20%22%20r%3D%222.6%22%2F%3E%3C%2Fg%3E%3Cg%20transform%3D%22translate(344.0%20445.5)%20s',
'cale(0.82)%22%20fill%3D%22none%22%20stroke%3D%22%23FFF%22%20stroke-width%3D%221.1%22%20opacity%3D%22',
'0.028%22%3E%3Cpath%20d%3D%22M%200%20-34%20C%2010%20-26%2C%2010%20-14%2C%200%20-6%20C%20-10%20-14%2C%',
'20-10%20-26%2C%200%20-34%20Z%22%2F%3E%3Cpath%20d%3D%22M%200%20-6%20C%2014%20-18%2C%2026%20-16%2C%203',
'0%20-4%20C%2022%202%2C%208%202%2C%200%20-6%20Z%22%2F%3E%3Cpath%20d%3D%22M%200%20-6%20C%20-14%20-18%2',
'C%20-26%20-16%2C%20-30%20-4%20C%20-22%202%2C%20-8%202%2C%200%20-6%20Z%22%2F%3E%3Cpath%20d%3D%22M%200',
'%20-6%20C%206%206%2C%206%2018%2C%200%2030%20C%20-6%2018%2C%20-6%206%2C%200%20-6%20Z%22%2F%3E%3Ccircl',
'e%20cy%3D%22-20%22%20r%3D%222.6%22%2F%3E%3C%2Fg%3E%3Cg%20transform%3D%22translate(430.0%20445.5)%20s',
'cale(0.82)%22%20fill%3D%22none%22%20stroke%3D%22%23FFF%22%20stroke-width%3D%221.1%22%20opacity%3D%22',
'0.028%22%3E%3Cpath%20d%3D%22M%200%20-34%20C%2010%20-26%2C%2010%20-14%2C%200%20-6%20C%20-10%20-14%2C%',
'20-10%20-26%2C%200%20-34%20Z%22%2F%3E%3Cpath%20d%3D%22M%200%20-6%20C%2014%20-18%2C%2026%20-16%2C%203',
'0%20-4%20C%2022%202%2C%208%202%2C%200%20-6%20Z%22%2F%3E%3Cpath%20d%3D%22M%200%20-6%20C%20-14%20-18%2',
'C%20-26%20-16%2C%20-30%20-4%20C%20-22%202%2C%20-8%202%2C%200%20-6%20Z%22%2F%3E%3Cpath%20d%3D%22M%200',
'%20-6%20C%206%206%2C%206%2018%2C%200%2030%20C%20-6%2018%2C%20-6%206%2C%200%20-6%20Z%22%2F%3E%3Ccircl',
'e%20cy%3D%22-20%22%20r%3D%222.6%22%2F%3E%3C%2Fg%3E%3Cg%20transform%3D%22translate(516.0%20445.5)%20s',
'cale(0.82)%22%20fill%3D%22none%22%20stroke%3D%22%23FFF%22%20stroke-width%3D%221.1%22%20opacity%3D%22',
'0.028%22%3E%3Cpath%20d%3D%22M%200%20-34%20C%2010%20-26%2C%2010%20-14%2C%200%20-6%20C%20-10%20-14%2C%',
'20-10%20-26%2C%200%20-34%20Z%22%2F%3E%3Cpath%20d%3D%22M%200%20-6%20C%2014%20-18%2C%2026%20-16%2C%203',
'0%20-4%20C%2022%202%2C%208%202%2C%200%20-6%20Z%22%2F%3E%3Cpath%20d%3D%22M%200%20-6%20C%20-14%20-18%2',
'C%20-26%20-16%2C%20-30%20-4%20C%20-22%202%2C%20-8%202%2C%200%20-6%20Z%22%2F%3E%3Cpath%20d%3D%22M%200',
'%20-6%20C%206%206%2C%206%2018%2C%200%2030%20C%20-6%2018%2C%20-6%206%2C%200%20-6%20Z%22%2F%3E%3Ccircl',
'e%20cy%3D%22-20%22%20r%3D%222.6%22%2F%3E%3C%2Fg%3E%3Cg%20transform%3D%22translate(-43.0%20544.5)%20s',
'cale(0.82)%22%20fill%3D%22none%22%20stroke%3D%22%23FFF%22%20stroke-width%3D%221.1%22%20opacity%3D%22',
'0.028%22%3E%3Cpath%20d%3D%22M%200%20-34%20C%2010%20-26%2C%2010%20-14%2C%200%20-6%20C%20-10%20-14%2C%',
'20-10%20-26%2C%200%20-34%20Z%22%2F%3E%3Cpath%20d%3D%22M%200%20-6%20C%2014%20-18%2C%2026%20-16%2C%203',
'0%20-4%20C%2022%202%2C%208%202%2C%200%20-6%20Z%22%2F%3E%3Cpath%20d%3D%22M%200%20-6%20C%20-14%20-18%2',
'C%20-26%20-16%2C%20-30%20-4%20C%20-22%202%2C%20-8%202%2C%200%20-6%20Z%22%2F%3E%3Cpath%20d%3D%22M%200',
'%20-6%20C%206%206%2C%206%2018%2C%200%2030%20C%20-6%2018%2C%20-6%206%2C%200%20-6%20Z%22%2F%3E%3Ccircl',
'e%20cy%3D%22-20%22%20r%3D%222.6%22%2F%3E%3C%2Fg%3E%3Cg%20transform%3D%22translate(43.0%20544.5)%20sc',
'ale(0.82)%22%20fill%3D%22none%22%20stroke%3D%22%23FFF%22%20stroke-width%3D%221.1%22%20opacity%3D%220',
'.028%22%3E%3Cpath%20d%3D%22M%200%20-34%20C%2010%20-26%2C%2010%20-14%2C%200%20-6%20C%20-10%20-14%2C%2',
'0-10%20-26%2C%200%20-34%20Z%22%2F%3E%3Cpath%20d%3D%22M%200%20-6%20C%2014%20-18%2C%2026%20-16%2C%2030',
'%20-4%20C%2022%202%2C%208%202%2C%200%20-6%20Z%22%2F%3E%3Cpath%20d%3D%22M%200%20-6%20C%20-14%20-18%2C',
'%20-26%20-16%2C%20-30%20-4%20C%20-22%202%2C%20-8%202%2C%200%20-6%20Z%22%2F%3E%3Cpath%20d%3D%22M%200%',
'20-6%20C%206%206%2C%206%2018%2C%200%2030%20C%20-6%2018%2C%20-6%206%2C%200%20-6%20Z%22%2F%3E%3Ccircle',
'%20cy%3D%22-20%22%20r%3D%222.6%22%2F%3E%3C%2Fg%3E%3Cg%20transform%3D%22translate(129.0%20544.5)%20sc',
'ale(0.82)%22%20fill%3D%22none%22%20stroke%3D%22%23FFF%22%20stroke-width%3D%221.1%22%20opacity%3D%220',
'.028%22%3E%3Cpath%20d%3D%22M%200%20-34%20C%2010%20-26%2C%2010%20-14%2C%200%20-6%20C%20-10%20-14%2C%2',
'0-10%20-26%2C%200%20-34%20Z%22%2F%3E%3Cpath%20d%3D%22M%200%20-6%20C%2014%20-18%2C%2026%20-16%2C%2030',
'%20-4%20C%2022%202%2C%208%202%2C%200%20-6%20Z%22%2F%3E%3Cpath%20d%3D%22M%200%20-6%20C%20-14%20-18%2C',
'%20-26%20-16%2C%20-30%20-4%20C%20-22%202%2C%20-8%202%2C%200%20-6%20Z%22%2F%3E%3Cpath%20d%3D%22M%200%',
'20-6%20C%206%206%2C%206%2018%2C%200%2030%20C%20-6%2018%2C%20-6%206%2C%200%20-6%20Z%22%2F%3E%3Ccircle',
'%20cy%3D%22-20%22%20r%3D%222.6%22%2F%3E%3C%2Fg%3E%3Cg%20transform%3D%22translate(215.0%20544.5)%20sc',
'ale(0.82)%22%20fill%3D%22none%22%20stroke%3D%22%23FFF%22%20stroke-width%3D%221.1%22%20opacity%3D%220',
'.028%22%3E%3Cpath%20d%3D%22M%200%20-34%20C%2010%20-26%2C%2010%20-14%2C%200%20-6%20C%20-10%20-14%2C%2',
'0-10%20-26%2C%200%20-34%20Z%22%2F%3E%3Cpath%20d%3D%22M%200%20-6%20C%2014%20-18%2C%2026%20-16%2C%2030',
'%20-4%20C%2022%202%2C%208%202%2C%200%20-6%20Z%22%2F%3E%3Cpath%20d%3D%22M%200%20-6%20C%20-14%20-18%2C',
'%20-26%20-16%2C%20-30%20-4%20C%20-22%202%2C%20-8%202%2C%200%20-6%20Z%22%2F%3E%3Cpath%20d%3D%22M%200%',
'20-6%20C%206%206%2C%206%2018%2C%200%2030%20C%20-6%2018%2C%20-6%206%2C%200%20-6%20Z%22%2F%3E%3Ccircle',
'%20cy%3D%22-20%22%20r%3D%222.6%22%2F%3E%3C%2Fg%3E%3Cg%20transform%3D%22translate(301.0%20544.5)%20sc',
'ale(0.82)%22%20fill%3D%22none%22%20stroke%3D%22%23FFF%22%20stroke-width%3D%221.1%22%20opacity%3D%220',
'.028%22%3E%3Cpath%20d%3D%22M%200%20-34%20C%2010%20-26%2C%2010%20-14%2C%200%20-6%20C%20-10%20-14%2C%2',
'0-10%20-26%2C%200%20-34%20Z%22%2F%3E%3Cpath%20d%3D%22M%200%20-6%20C%2014%20-18%2C%2026%20-16%2C%2030',
'%20-4%20C%2022%202%2C%208%202%2C%200%20-6%20Z%22%2F%3E%3Cpath%20d%3D%22M%200%20-6%20C%20-14%20-18%2C',
'%20-26%20-16%2C%20-30%20-4%20C%20-22%202%2C%20-8%202%2C%200%20-6%20Z%22%2F%3E%3Cpath%20d%3D%22M%200%',
'20-6%20C%206%206%2C%206%2018%2C%200%2030%20C%20-6%2018%2C%20-6%206%2C%200%20-6%20Z%22%2F%3E%3Ccircle',
'%20cy%3D%22-20%22%20r%3D%222.6%22%2F%3E%3C%2Fg%3E%3Cg%20transform%3D%22translate(387.0%20544.5)%20sc',
'ale(0.82)%22%20fill%3D%22none%22%20stroke%3D%22%23FFF%22%20stroke-width%3D%221.1%22%20opacity%3D%220',
'.028%22%3E%3Cpath%20d%3D%22M%200%20-34%20C%2010%20-26%2C%2010%20-14%2C%200%20-6%20C%20-10%20-14%2C%2',
'0-10%20-26%2C%200%20-34%20Z%22%2F%3E%3Cpath%20d%3D%22M%200%20-6%20C%2014%20-18%2C%2026%20-16%2C%2030',
'%20-4%20C%2022%202%2C%208%202%2C%200%20-6%20Z%22%2F%3E%3Cpath%20d%3D%22M%200%20-6%20C%20-14%20-18%2C',
'%20-26%20-16%2C%20-30%20-4%20C%20-22%202%2C%20-8%202%2C%200%20-6%20Z%22%2F%3E%3Cpath%20d%3D%22M%200%',
'20-6%20C%206%206%2C%206%2018%2C%200%2030%20C%20-6%2018%2C%20-6%206%2C%200%20-6%20Z%22%2F%3E%3Ccircle',
'%20cy%3D%22-20%22%20r%3D%222.6%22%2F%3E%3C%2Fg%3E%3Cg%20transform%3D%22translate(473.0%20544.5)%20sc',
'ale(0.82)%22%20fill%3D%22none%22%20stroke%3D%22%23FFF%22%20stroke-width%3D%221.1%22%20opacity%3D%220',
'.028%22%3E%3Cpath%20d%3D%22M%200%20-34%20C%2010%20-26%2C%2010%20-14%2C%200%20-6%20C%20-10%20-14%2C%2',
'0-10%20-26%2C%200%20-34%20Z%22%2F%3E%3Cpath%20d%3D%22M%200%20-6%20C%2014%20-18%2C%2026%20-16%2C%2030',
'%20-4%20C%2022%202%2C%208%202%2C%200%20-6%20Z%22%2F%3E%3Cpath%20d%3D%22M%200%20-6%20C%20-14%20-18%2C',
'%20-26%20-16%2C%20-30%20-4%20C%20-22%202%2C%20-8%202%2C%200%20-6%20Z%22%2F%3E%3Cpath%20d%3D%22M%200%',
'20-6%20C%206%206%2C%206%2018%2C%200%2030%20C%20-6%2018%2C%20-6%206%2C%200%20-6%20Z%22%2F%3E%3Ccircle',
'%20cy%3D%22-20%22%20r%3D%222.6%22%2F%3E%3C%2Fg%3E%3Cg%20transform%3D%22translate(0.0%20643.5)%20scal',
'e(0.82)%22%20fill%3D%22none%22%20stroke%3D%22%23FFF%22%20stroke-width%3D%221.1%22%20opacity%3D%220.0',
'28%22%3E%3Cpath%20d%3D%22M%200%20-34%20C%2010%20-26%2C%2010%20-14%2C%200%20-6%20C%20-10%20-14%2C%20-',
'10%20-26%2C%200%20-34%20Z%22%2F%3E%3Cpath%20d%3D%22M%200%20-6%20C%2014%20-18%2C%2026%20-16%2C%2030%2',
'0-4%20C%2022%202%2C%208%202%2C%200%20-6%20Z%22%2F%3E%3Cpath%20d%3D%22M%200%20-6%20C%20-14%20-18%2C%2',
'0-26%20-16%2C%20-30%20-4%20C%20-22%202%2C%20-8%202%2C%200%20-6%20Z%22%2F%3E%3Cpath%20d%3D%22M%200%20',
'-6%20C%206%206%2C%206%2018%2C%200%2030%20C%20-6%2018%2C%20-6%206%2C%200%20-6%20Z%22%2F%3E%3Ccircle%2',
'0cy%3D%22-20%22%20r%3D%222.6%22%2F%3E%3C%2Fg%3E%3Cg%20transform%3D%22translate(86.0%20643.5)%20scale',
'(0.82)%22%20fill%3D%22none%22%20stroke%3D%22%23FFF%22%20stroke-width%3D%221.1%22%20opacity%3D%220.02',
'8%22%3E%3Cpath%20d%3D%22M%200%20-34%20C%2010%20-26%2C%2010%20-14%2C%200%20-6%20C%20-10%20-14%2C%20-1',
'0%20-26%2C%200%20-34%20Z%22%2F%3E%3Cpath%20d%3D%22M%200%20-6%20C%2014%20-18%2C%2026%20-16%2C%2030%20',
'-4%20C%2022%202%2C%208%202%2C%200%20-6%20Z%22%2F%3E%3Cpath%20d%3D%22M%200%20-6%20C%20-14%20-18%2C%20',
'-26%20-16%2C%20-30%20-4%20C%20-22%202%2C%20-8%202%2C%200%20-6%20Z%22%2F%3E%3Cpath%20d%3D%22M%200%20-',
'6%20C%206%206%2C%206%2018%2C%200%2030%20C%20-6%2018%2C%20-6%206%2C%200%20-6%20Z%22%2F%3E%3Ccircle%20',
'cy%3D%22-20%22%20r%3D%222.6%22%2F%3E%3C%2Fg%3E%3Cg%20transform%3D%22translate(172.0%20643.5)%20scale',
'(0.82)%22%20fill%3D%22none%22%20stroke%3D%22%23FFF%22%20stroke-width%3D%221.1%22%20opacity%3D%220.02',
'8%22%3E%3Cpath%20d%3D%22M%200%20-34%20C%2010%20-26%2C%2010%20-14%2C%200%20-6%20C%20-10%20-14%2C%20-1',
'0%20-26%2C%200%20-34%20Z%22%2F%3E%3Cpath%20d%3D%22M%200%20-6%20C%2014%20-18%2C%2026%20-16%2C%2030%20',
'-4%20C%2022%202%2C%208%202%2C%200%20-6%20Z%22%2F%3E%3Cpath%20d%3D%22M%200%20-6%20C%20-14%20-18%2C%20',
'-26%20-16%2C%20-30%20-4%20C%20-22%202%2C%20-8%202%2C%200%20-6%20Z%22%2F%3E%3Cpath%20d%3D%22M%200%20-',
'6%20C%206%206%2C%206%2018%2C%200%2030%20C%20-6%2018%2C%20-6%206%2C%200%20-6%20Z%22%2F%3E%3Ccircle%20',
'cy%3D%22-20%22%20r%3D%222.6%22%2F%3E%3C%2Fg%3E%3Cg%20transform%3D%22translate(258.0%20643.5)%20scale',
'(0.82)%22%20fill%3D%22none%22%20stroke%3D%22%23FFF%22%20stroke-width%3D%221.1%22%20opacity%3D%220.02',
'8%22%3E%3Cpath%20d%3D%22M%200%20-34%20C%2010%20-26%2C%2010%20-14%2C%200%20-6%20C%20-10%20-14%2C%20-1',
'0%20-26%2C%200%20-34%20Z%22%2F%3E%3Cpath%20d%3D%22M%200%20-6%20C%2014%20-18%2C%2026%20-16%2C%2030%20',
'-4%20C%2022%202%2C%208%202%2C%200%20-6%20Z%22%2F%3E%3Cpath%20d%3D%22M%200%20-6%20C%20-14%20-18%2C%20',
'-26%20-16%2C%20-30%20-4%20C%20-22%202%2C%20-8%202%2C%200%20-6%20Z%22%2F%3E%3Cpath%20d%3D%22M%200%20-',
'6%20C%206%206%2C%206%2018%2C%200%2030%20C%20-6%2018%2C%20-6%206%2C%200%20-6%20Z%22%2F%3E%3Ccircle%20',
'cy%3D%22-20%22%20r%3D%222.6%22%2F%3E%3C%2Fg%3E%3Cg%20transform%3D%22translate(344.0%20643.5)%20scale',
'(0.82)%22%20fill%3D%22none%22%20stroke%3D%22%23FFF%22%20stroke-width%3D%221.1%22%20opacity%3D%220.02',
'8%22%3E%3Cpath%20d%3D%22M%200%20-34%20C%2010%20-26%2C%2010%20-14%2C%200%20-6%20C%20-10%20-14%2C%20-1',
'0%20-26%2C%200%20-34%20Z%22%2F%3E%3Cpath%20d%3D%22M%200%20-6%20C%2014%20-18%2C%2026%20-16%2C%2030%20',
'-4%20C%2022%202%2C%208%202%2C%200%20-6%20Z%22%2F%3E%3Cpath%20d%3D%22M%200%20-6%20C%20-14%20-18%2C%20',
'-26%20-16%2C%20-30%20-4%20C%20-22%202%2C%20-8%202%2C%200%20-6%20Z%22%2F%3E%3Cpath%20d%3D%22M%200%20-',
'6%20C%206%206%2C%206%2018%2C%200%2030%20C%20-6%2018%2C%20-6%206%2C%200%20-6%20Z%22%2F%3E%3Ccircle%20',
'cy%3D%22-20%22%20r%3D%222.6%22%2F%3E%3C%2Fg%3E%3Cg%20transform%3D%22translate(430.0%20643.5)%20scale',
'(0.82)%22%20fill%3D%22none%22%20stroke%3D%22%23FFF%22%20stroke-width%3D%221.1%22%20opacity%3D%220.02',
'8%22%3E%3Cpath%20d%3D%22M%200%20-34%20C%2010%20-26%2C%2010%20-14%2C%200%20-6%20C%20-10%20-14%2C%20-1',
'0%20-26%2C%200%20-34%20Z%22%2F%3E%3Cpath%20d%3D%22M%200%20-6%20C%2014%20-18%2C%2026%20-16%2C%2030%20',
'-4%20C%2022%202%2C%208%202%2C%200%20-6%20Z%22%2F%3E%3Cpath%20d%3D%22M%200%20-6%20C%20-14%20-18%2C%20',
'-26%20-16%2C%20-30%20-4%20C%20-22%202%2C%20-8%202%2C%200%20-6%20Z%22%2F%3E%3Cpath%20d%3D%22M%200%20-',
'6%20C%206%206%2C%206%2018%2C%200%2030%20C%20-6%2018%2C%20-6%206%2C%200%20-6%20Z%22%2F%3E%3Ccircle%20',
'cy%3D%22-20%22%20r%3D%222.6%22%2F%3E%3C%2Fg%3E%3Cg%20transform%3D%22translate(516.0%20643.5)%20scale',
'(0.82)%22%20fill%3D%22none%22%20stroke%3D%22%23FFF%22%20stroke-width%3D%221.1%22%20opacity%3D%220.02',
'8%22%3E%3Cpath%20d%3D%22M%200%20-34%20C%2010%20-26%2C%2010%20-14%2C%200%20-6%20C%20-10%20-14%2C%20-1',
'0%20-26%2C%200%20-34%20Z%22%2F%3E%3Cpath%20d%3D%22M%200%20-6%20C%2014%20-18%2C%2026%20-16%2C%2030%20',
'-4%20C%2022%202%2C%208%202%2C%200%20-6%20Z%22%2F%3E%3Cpath%20d%3D%22M%200%20-6%20C%20-14%20-18%2C%20',
'-26%20-16%2C%20-30%20-4%20C%20-22%202%2C%20-8%202%2C%200%20-6%20Z%22%2F%3E%3Cpath%20d%3D%22M%200%20-',
'6%20C%206%206%2C%206%2018%2C%200%2030%20C%20-6%2018%2C%20-6%206%2C%200%20-6%20Z%22%2F%3E%3Ccircle%20',
'cy%3D%22-20%22%20r%3D%222.6%22%2F%3E%3C%2Fg%3E%3Cg%20transform%3D%22translate(-43.0%20742.5)%20scale',
'(0.82)%22%20fill%3D%22none%22%20stroke%3D%22%23FFF%22%20stroke-width%3D%221.1%22%20opacity%3D%220.02',
'8%22%3E%3Cpath%20d%3D%22M%200%20-34%20C%2010%20-26%2C%2010%20-14%2C%200%20-6%20C%20-10%20-14%2C%20-1',
'0%20-26%2C%200%20-34%20Z%22%2F%3E%3Cpath%20d%3D%22M%200%20-6%20C%2014%20-18%2C%2026%20-16%2C%2030%20',
'-4%20C%2022%202%2C%208%202%2C%200%20-6%20Z%22%2F%3E%3Cpath%20d%3D%22M%200%20-6%20C%20-14%20-18%2C%20',
'-26%20-16%2C%20-30%20-4%20C%20-22%202%2C%20-8%202%2C%200%20-6%20Z%22%2F%3E%3Cpath%20d%3D%22M%200%20-',
'6%20C%206%206%2C%206%2018%2C%200%2030%20C%20-6%2018%2C%20-6%206%2C%200%20-6%20Z%22%2F%3E%3Ccircle%20',
'cy%3D%22-20%22%20r%3D%222.6%22%2F%3E%3C%2Fg%3E%3Cg%20transform%3D%22translate(43.0%20742.5)%20scale(',
'0.82)%22%20fill%3D%22none%22%20stroke%3D%22%23FFF%22%20stroke-width%3D%221.1%22%20opacity%3D%220.028',
'%22%3E%3Cpath%20d%3D%22M%200%20-34%20C%2010%20-26%2C%2010%20-14%2C%200%20-6%20C%20-10%20-14%2C%20-10',
'%20-26%2C%200%20-34%20Z%22%2F%3E%3Cpath%20d%3D%22M%200%20-6%20C%2014%20-18%2C%2026%20-16%2C%2030%20-',
'4%20C%2022%202%2C%208%202%2C%200%20-6%20Z%22%2F%3E%3Cpath%20d%3D%22M%200%20-6%20C%20-14%20-18%2C%20-',
'26%20-16%2C%20-30%20-4%20C%20-22%202%2C%20-8%202%2C%200%20-6%20Z%22%2F%3E%3Cpath%20d%3D%22M%200%20-6',
'%20C%206%206%2C%206%2018%2C%200%2030%20C%20-6%2018%2C%20-6%206%2C%200%20-6%20Z%22%2F%3E%3Ccircle%20c',
'y%3D%22-20%22%20r%3D%222.6%22%2F%3E%3C%2Fg%3E%3Cg%20transform%3D%22translate(129.0%20742.5)%20scale(',
'0.82)%22%20fill%3D%22none%22%20stroke%3D%22%23FFF%22%20stroke-width%3D%221.1%22%20opacity%3D%220.028',
'%22%3E%3Cpath%20d%3D%22M%200%20-34%20C%2010%20-26%2C%2010%20-14%2C%200%20-6%20C%20-10%20-14%2C%20-10',
'%20-26%2C%200%20-34%20Z%22%2F%3E%3Cpath%20d%3D%22M%200%20-6%20C%2014%20-18%2C%2026%20-16%2C%2030%20-',
'4%20C%2022%202%2C%208%202%2C%200%20-6%20Z%22%2F%3E%3Cpath%20d%3D%22M%200%20-6%20C%20-14%20-18%2C%20-',
'26%20-16%2C%20-30%20-4%20C%20-22%202%2C%20-8%202%2C%200%20-6%20Z%22%2F%3E%3Cpath%20d%3D%22M%200%20-6',
'%20C%206%206%2C%206%2018%2C%200%2030%20C%20-6%2018%2C%20-6%206%2C%200%20-6%20Z%22%2F%3E%3Ccircle%20c',
'y%3D%22-20%22%20r%3D%222.6%22%2F%3E%3C%2Fg%3E%3Cg%20transform%3D%22translate(215.0%20742.5)%20scale(',
'0.82)%22%20fill%3D%22none%22%20stroke%3D%22%23FFF%22%20stroke-width%3D%221.1%22%20opacity%3D%220.028',
'%22%3E%3Cpath%20d%3D%22M%200%20-34%20C%2010%20-26%2C%2010%20-14%2C%200%20-6%20C%20-10%20-14%2C%20-10',
'%20-26%2C%200%20-34%20Z%22%2F%3E%3Cpath%20d%3D%22M%200%20-6%20C%2014%20-18%2C%2026%20-16%2C%2030%20-',
'4%20C%2022%202%2C%208%202%2C%200%20-6%20Z%22%2F%3E%3Cpath%20d%3D%22M%200%20-6%20C%20-14%20-18%2C%20-',
'26%20-16%2C%20-30%20-4%20C%20-22%202%2C%20-8%202%2C%200%20-6%20Z%22%2F%3E%3Cpath%20d%3D%22M%200%20-6',
'%20C%206%206%2C%206%2018%2C%200%2030%20C%20-6%2018%2C%20-6%206%2C%200%20-6%20Z%22%2F%3E%3Ccircle%20c',
'y%3D%22-20%22%20r%3D%222.6%22%2F%3E%3C%2Fg%3E%3Cg%20transform%3D%22translate(301.0%20742.5)%20scale(',
'0.82)%22%20fill%3D%22none%22%20stroke%3D%22%23FFF%22%20stroke-width%3D%221.1%22%20opacity%3D%220.028',
'%22%3E%3Cpath%20d%3D%22M%200%20-34%20C%2010%20-26%2C%2010%20-14%2C%200%20-6%20C%20-10%20-14%2C%20-10',
'%20-26%2C%200%20-34%20Z%22%2F%3E%3Cpath%20d%3D%22M%200%20-6%20C%2014%20-18%2C%2026%20-16%2C%2030%20-',
'4%20C%2022%202%2C%208%202%2C%200%20-6%20Z%22%2F%3E%3Cpath%20d%3D%22M%200%20-6%20C%20-14%20-18%2C%20-',
'26%20-16%2C%20-30%20-4%20C%20-22%202%2C%20-8%202%2C%200%20-6%20Z%22%2F%3E%3Cpath%20d%3D%22M%200%20-6',
'%20C%206%206%2C%206%2018%2C%200%2030%20C%20-6%2018%2C%20-6%206%2C%200%20-6%20Z%22%2F%3E%3Ccircle%20c',
'y%3D%22-20%22%20r%3D%222.6%22%2F%3E%3C%2Fg%3E%3Cg%20transform%3D%22translate(387.0%20742.5)%20scale(',
'0.82)%22%20fill%3D%22none%22%20stroke%3D%22%23FFF%22%20stroke-width%3D%221.1%22%20opacity%3D%220.028',
'%22%3E%3Cpath%20d%3D%22M%200%20-34%20C%2010%20-26%2C%2010%20-14%2C%200%20-6%20C%20-10%20-14%2C%20-10',
'%20-26%2C%200%20-34%20Z%22%2F%3E%3Cpath%20d%3D%22M%200%20-6%20C%2014%20-18%2C%2026%20-16%2C%2030%20-',
'4%20C%2022%202%2C%208%202%2C%200%20-6%20Z%22%2F%3E%3Cpath%20d%3D%22M%200%20-6%20C%20-14%20-18%2C%20-',
'26%20-16%2C%20-30%20-4%20C%20-22%202%2C%20-8%202%2C%200%20-6%20Z%22%2F%3E%3Cpath%20d%3D%22M%200%20-6',
'%20C%206%206%2C%206%2018%2C%200%2030%20C%20-6%2018%2C%20-6%206%2C%200%20-6%20Z%22%2F%3E%3Ccircle%20c',
'y%3D%22-20%22%20r%3D%222.6%22%2F%3E%3C%2Fg%3E%3Cg%20transform%3D%22translate(473.0%20742.5)%20scale(',
'0.82)%22%20fill%3D%22none%22%20stroke%3D%22%23FFF%22%20stroke-width%3D%221.1%22%20opacity%3D%220.028',
'%22%3E%3Cpath%20d%3D%22M%200%20-34%20C%2010%20-26%2C%2010%20-14%2C%200%20-6%20C%20-10%20-14%2C%20-10',
'%20-26%2C%200%20-34%20Z%22%2F%3E%3Cpath%20d%3D%22M%200%20-6%20C%2014%20-18%2C%2026%20-16%2C%2030%20-',
'4%20C%2022%202%2C%208%202%2C%200%20-6%20Z%22%2F%3E%3Cpath%20d%3D%22M%200%20-6%20C%20-14%20-18%2C%20-',
'26%20-16%2C%20-30%20-4%20C%20-22%202%2C%20-8%202%2C%200%20-6%20Z%22%2F%3E%3Cpath%20d%3D%22M%200%20-6',
'%20C%206%206%2C%206%2018%2C%200%2030%20C%20-6%2018%2C%20-6%206%2C%200%20-6%20Z%22%2F%3E%3Ccircle%20c',
'y%3D%22-20%22%20r%3D%222.6%22%2F%3E%3C%2Fg%3E%3Cg%20transform%3D%22translate(0.0%20841.5)%20scale(0.',
'82)%22%20fill%3D%22none%22%20stroke%3D%22%23FFF%22%20stroke-width%3D%221.1%22%20opacity%3D%220.028%2',
'2%3E%3Cpath%20d%3D%22M%200%20-34%20C%2010%20-26%2C%2010%20-14%2C%200%20-6%20C%20-10%20-14%2C%20-10%2',
'0-26%2C%200%20-34%20Z%22%2F%3E%3Cpath%20d%3D%22M%200%20-6%20C%2014%20-18%2C%2026%20-16%2C%2030%20-4%',
'20C%2022%202%2C%208%202%2C%200%20-6%20Z%22%2F%3E%3Cpath%20d%3D%22M%200%20-6%20C%20-14%20-18%2C%20-26',
'%20-16%2C%20-30%20-4%20C%20-22%202%2C%20-8%202%2C%200%20-6%20Z%22%2F%3E%3Cpath%20d%3D%22M%200%20-6%2',
'0C%206%206%2C%206%2018%2C%200%2030%20C%20-6%2018%2C%20-6%206%2C%200%20-6%20Z%22%2F%3E%3Ccircle%20cy%',
'3D%22-20%22%20r%3D%222.6%22%2F%3E%3C%2Fg%3E%3Cg%20transform%3D%22translate(86.0%20841.5)%20scale(0.8',
'2)%22%20fill%3D%22none%22%20stroke%3D%22%23FFF%22%20stroke-width%3D%221.1%22%20opacity%3D%220.028%22',
'%3E%3Cpath%20d%3D%22M%200%20-34%20C%2010%20-26%2C%2010%20-14%2C%200%20-6%20C%20-10%20-14%2C%20-10%20',
'-26%2C%200%20-34%20Z%22%2F%3E%3Cpath%20d%3D%22M%200%20-6%20C%2014%20-18%2C%2026%20-16%2C%2030%20-4%2',
'0C%2022%202%2C%208%202%2C%200%20-6%20Z%22%2F%3E%3Cpath%20d%3D%22M%200%20-6%20C%20-14%20-18%2C%20-26%',
'20-16%2C%20-30%20-4%20C%20-22%202%2C%20-8%202%2C%200%20-6%20Z%22%2F%3E%3Cpath%20d%3D%22M%200%20-6%20',
'C%206%206%2C%206%2018%2C%200%2030%20C%20-6%2018%2C%20-6%206%2C%200%20-6%20Z%22%2F%3E%3Ccircle%20cy%3',
'D%22-20%22%20r%3D%222.6%22%2F%3E%3C%2Fg%3E%3Cg%20transform%3D%22translate(172.0%20841.5)%20scale(0.8',
'2)%22%20fill%3D%22none%22%20stroke%3D%22%23FFF%22%20stroke-width%3D%221.1%22%20opacity%3D%220.028%22',
'%3E%3Cpath%20d%3D%22M%200%20-34%20C%2010%20-26%2C%2010%20-14%2C%200%20-6%20C%20-10%20-14%2C%20-10%20',
'-26%2C%200%20-34%20Z%22%2F%3E%3Cpath%20d%3D%22M%200%20-6%20C%2014%20-18%2C%2026%20-16%2C%2030%20-4%2',
'0C%2022%202%2C%208%202%2C%200%20-6%20Z%22%2F%3E%3Cpath%20d%3D%22M%200%20-6%20C%20-14%20-18%2C%20-26%',
'20-16%2C%20-30%20-4%20C%20-22%202%2C%20-8%202%2C%200%20-6%20Z%22%2F%3E%3Cpath%20d%3D%22M%200%20-6%20',
'C%206%206%2C%206%2018%2C%200%2030%20C%20-6%2018%2C%20-6%206%2C%200%20-6%20Z%22%2F%3E%3Ccircle%20cy%3',
'D%22-20%22%20r%3D%222.6%22%2F%3E%3C%2Fg%3E%3Cg%20transform%3D%22translate(258.0%20841.5)%20scale(0.8',
'2)%22%20fill%3D%22none%22%20stroke%3D%22%23FFF%22%20stroke-width%3D%221.1%22%20opacity%3D%220.028%22',
'%3E%3Cpath%20d%3D%22M%200%20-34%20C%2010%20-26%2C%2010%20-14%2C%200%20-6%20C%20-10%20-14%2C%20-10%20',
'-26%2C%200%20-34%20Z%22%2F%3E%3Cpath%20d%3D%22M%200%20-6%20C%2014%20-18%2C%2026%20-16%2C%2030%20-4%2',
'0C%2022%202%2C%208%202%2C%200%20-6%20Z%22%2F%3E%3Cpath%20d%3D%22M%200%20-6%20C%20-14%20-18%2C%20-26%',
'20-16%2C%20-30%20-4%20C%20-22%202%2C%20-8%202%2C%200%20-6%20Z%22%2F%3E%3Cpath%20d%3D%22M%200%20-6%20',
'C%206%206%2C%206%2018%2C%200%2030%20C%20-6%2018%2C%20-6%206%2C%200%20-6%20Z%22%2F%3E%3Ccircle%20cy%3',
'D%22-20%22%20r%3D%222.6%22%2F%3E%3C%2Fg%3E%3Cg%20transform%3D%22translate(344.0%20841.5)%20scale(0.8',
'2)%22%20fill%3D%22none%22%20stroke%3D%22%23FFF%22%20stroke-width%3D%221.1%22%20opacity%3D%220.028%22',
'%3E%3Cpath%20d%3D%22M%200%20-34%20C%2010%20-26%2C%2010%20-14%2C%200%20-6%20C%20-10%20-14%2C%20-10%20',
'-26%2C%200%20-34%20Z%22%2F%3E%3Cpath%20d%3D%22M%200%20-6%20C%2014%20-18%2C%2026%20-16%2C%2030%20-4%2',
'0C%2022%202%2C%208%202%2C%200%20-6%20Z%22%2F%3E%3Cpath%20d%3D%22M%200%20-6%20C%20-14%20-18%2C%20-26%',
'20-16%2C%20-30%20-4%20C%20-22%202%2C%20-8%202%2C%200%20-6%20Z%22%2F%3E%3Cpath%20d%3D%22M%200%20-6%20',
'C%206%206%2C%206%2018%2C%200%2030%20C%20-6%2018%2C%20-6%206%2C%200%20-6%20Z%22%2F%3E%3Ccircle%20cy%3',
'D%22-20%22%20r%3D%222.6%22%2F%3E%3C%2Fg%3E%3Cg%20transform%3D%22translate(430.0%20841.5)%20scale(0.8',
'2)%22%20fill%3D%22none%22%20stroke%3D%22%23FFF%22%20stroke-width%3D%221.1%22%20opacity%3D%220.028%22',
'%3E%3Cpath%20d%3D%22M%200%20-34%20C%2010%20-26%2C%2010%20-14%2C%200%20-6%20C%20-10%20-14%2C%20-10%20',
'-26%2C%200%20-34%20Z%22%2F%3E%3Cpath%20d%3D%22M%200%20-6%20C%2014%20-18%2C%2026%20-16%2C%2030%20-4%2',
'0C%2022%202%2C%208%202%2C%200%20-6%20Z%22%2F%3E%3Cpath%20d%3D%22M%200%20-6%20C%20-14%20-18%2C%20-26%',
'20-16%2C%20-30%20-4%20C%20-22%202%2C%20-8%202%2C%200%20-6%20Z%22%2F%3E%3Cpath%20d%3D%22M%200%20-6%20',
'C%206%206%2C%206%2018%2C%200%2030%20C%20-6%2018%2C%20-6%206%2C%200%20-6%20Z%22%2F%3E%3Ccircle%20cy%3',
'D%22-20%22%20r%3D%222.6%22%2F%3E%3C%2Fg%3E%3Cg%20transform%3D%22translate(516.0%20841.5)%20scale(0.8',
'2)%22%20fill%3D%22none%22%20stroke%3D%22%23FFF%22%20stroke-width%3D%221.1%22%20opacity%3D%220.028%22',
'%3E%3Cpath%20d%3D%22M%200%20-34%20C%2010%20-26%2C%2010%20-14%2C%200%20-6%20C%20-10%20-14%2C%20-10%20',
'-26%2C%200%20-34%20Z%22%2F%3E%3Cpath%20d%3D%22M%200%20-6%20C%2014%20-18%2C%2026%20-16%2C%2030%20-4%2',
'0C%2022%202%2C%208%202%2C%200%20-6%20Z%22%2F%3E%3Cpath%20d%3D%22M%200%20-6%20C%20-14%20-18%2C%20-26%',
'20-16%2C%20-30%20-4%20C%20-22%202%2C%20-8%202%2C%200%20-6%20Z%22%2F%3E%3Cpath%20d%3D%22M%200%20-6%20',
'C%206%206%2C%206%2018%2C%200%2030%20C%20-6%2018%2C%20-6%206%2C%200%20-6%20Z%22%2F%3E%3Ccircle%20cy%3',
'D%22-20%22%20r%3D%222.6%22%2F%3E%3C%2Fg%3E%3Cg%20transform%3D%22translate(-43.0%20940.5)%20scale(0.8',
'2)%22%20fill%3D%22none%22%20stroke%3D%22%23FFF%22%20stroke-width%3D%221.1%22%20opacity%3D%220.028%22',
'%3E%3Cpath%20d%3D%22M%200%20-34%20C%2010%20-26%2C%2010%20-14%2C%200%20-6%20C%20-10%20-14%2C%20-10%20',
'-26%2C%200%20-34%20Z%22%2F%3E%3Cpath%20d%3D%22M%200%20-6%20C%2014%20-18%2C%2026%20-16%2C%2030%20-4%2',
'0C%2022%202%2C%208%202%2C%200%20-6%20Z%22%2F%3E%3Cpath%20d%3D%22M%200%20-6%20C%20-14%20-18%2C%20-26%',
'20-16%2C%20-30%20-4%20C%20-22%202%2C%20-8%202%2C%200%20-6%20Z%22%2F%3E%3Cpath%20d%3D%22M%200%20-6%20',
'C%206%206%2C%206%2018%2C%200%2030%20C%20-6%2018%2C%20-6%206%2C%200%20-6%20Z%22%2F%3E%3Ccircle%20cy%3',
'D%22-20%22%20r%3D%222.6%22%2F%3E%3C%2Fg%3E%3Cg%20transform%3D%22translate(43.0%20940.5)%20scale(0.82',
')%22%20fill%3D%22none%22%20stroke%3D%22%23FFF%22%20stroke-width%3D%221.1%22%20opacity%3D%220.028%22%',
'3E%3Cpath%20d%3D%22M%200%20-34%20C%2010%20-26%2C%2010%20-14%2C%200%20-6%20C%20-10%20-14%2C%20-10%20-',
'26%2C%200%20-34%20Z%22%2F%3E%3Cpath%20d%3D%22M%200%20-6%20C%2014%20-18%2C%2026%20-16%2C%2030%20-4%20',
'C%2022%202%2C%208%202%2C%200%20-6%20Z%22%2F%3E%3Cpath%20d%3D%22M%200%20-6%20C%20-14%20-18%2C%20-26%2',
'0-16%2C%20-30%20-4%20C%20-22%202%2C%20-8%202%2C%200%20-6%20Z%22%2F%3E%3Cpath%20d%3D%22M%200%20-6%20C',
'%206%206%2C%206%2018%2C%200%2030%20C%20-6%2018%2C%20-6%206%2C%200%20-6%20Z%22%2F%3E%3Ccircle%20cy%3D',
'%22-20%22%20r%3D%222.6%22%2F%3E%3C%2Fg%3E%3Cg%20transform%3D%22translate(129.0%20940.5)%20scale(0.82',
')%22%20fill%3D%22none%22%20stroke%3D%22%23FFF%22%20stroke-width%3D%221.1%22%20opacity%3D%220.028%22%',
'3E%3Cpath%20d%3D%22M%200%20-34%20C%2010%20-26%2C%2010%20-14%2C%200%20-6%20C%20-10%20-14%2C%20-10%20-',
'26%2C%200%20-34%20Z%22%2F%3E%3Cpath%20d%3D%22M%200%20-6%20C%2014%20-18%2C%2026%20-16%2C%2030%20-4%20',
'C%2022%202%2C%208%202%2C%200%20-6%20Z%22%2F%3E%3Cpath%20d%3D%22M%200%20-6%20C%20-14%20-18%2C%20-26%2',
'0-16%2C%20-30%20-4%20C%20-22%202%2C%20-8%202%2C%200%20-6%20Z%22%2F%3E%3Cpath%20d%3D%22M%200%20-6%20C',
'%206%206%2C%206%2018%2C%200%2030%20C%20-6%2018%2C%20-6%206%2C%200%20-6%20Z%22%2F%3E%3Ccircle%20cy%3D',
'%22-20%22%20r%3D%222.6%22%2F%3E%3C%2Fg%3E%3Cg%20transform%3D%22translate(215.0%20940.5)%20scale(0.82',
')%22%20fill%3D%22none%22%20stroke%3D%22%23FFF%22%20stroke-width%3D%221.1%22%20opacity%3D%220.028%22%',
'3E%3Cpath%20d%3D%22M%200%20-34%20C%2010%20-26%2C%2010%20-14%2C%200%20-6%20C%20-10%20-14%2C%20-10%20-',
'26%2C%200%20-34%20Z%22%2F%3E%3Cpath%20d%3D%22M%200%20-6%20C%2014%20-18%2C%2026%20-16%2C%2030%20-4%20',
'C%2022%202%2C%208%202%2C%200%20-6%20Z%22%2F%3E%3Cpath%20d%3D%22M%200%20-6%20C%20-14%20-18%2C%20-26%2',
'0-16%2C%20-30%20-4%20C%20-22%202%2C%20-8%202%2C%200%20-6%20Z%22%2F%3E%3Cpath%20d%3D%22M%200%20-6%20C',
'%206%206%2C%206%2018%2C%200%2030%20C%20-6%2018%2C%20-6%206%2C%200%20-6%20Z%22%2F%3E%3Ccircle%20cy%3D',
'%22-20%22%20r%3D%222.6%22%2F%3E%3C%2Fg%3E%3Cg%20transform%3D%22translate(301.0%20940.5)%20scale(0.82',
')%22%20fill%3D%22none%22%20stroke%3D%22%23FFF%22%20stroke-width%3D%221.1%22%20opacity%3D%220.028%22%',
'3E%3Cpath%20d%3D%22M%200%20-34%20C%2010%20-26%2C%2010%20-14%2C%200%20-6%20C%20-10%20-14%2C%20-10%20-',
'26%2C%200%20-34%20Z%22%2F%3E%3Cpath%20d%3D%22M%200%20-6%20C%2014%20-18%2C%2026%20-16%2C%2030%20-4%20',
'C%2022%202%2C%208%202%2C%200%20-6%20Z%22%2F%3E%3Cpath%20d%3D%22M%200%20-6%20C%20-14%20-18%2C%20-26%2',
'0-16%2C%20-30%20-4%20C%20-22%202%2C%20-8%202%2C%200%20-6%20Z%22%2F%3E%3Cpath%20d%3D%22M%200%20-6%20C',
'%206%206%2C%206%2018%2C%200%2030%20C%20-6%2018%2C%20-6%206%2C%200%20-6%20Z%22%2F%3E%3Ccircle%20cy%3D',
'%22-20%22%20r%3D%222.6%22%2F%3E%3C%2Fg%3E%3Cg%20transform%3D%22translate(387.0%20940.5)%20scale(0.82',
')%22%20fill%3D%22none%22%20stroke%3D%22%23FFF%22%20stroke-width%3D%221.1%22%20opacity%3D%220.028%22%',
'3E%3Cpath%20d%3D%22M%200%20-34%20C%2010%20-26%2C%2010%20-14%2C%200%20-6%20C%20-10%20-14%2C%20-10%20-',
'26%2C%200%20-34%20Z%22%2F%3E%3Cpath%20d%3D%22M%200%20-6%20C%2014%20-18%2C%2026%20-16%2C%2030%20-4%20',
'C%2022%202%2C%208%202%2C%200%20-6%20Z%22%2F%3E%3Cpath%20d%3D%22M%200%20-6%20C%20-14%20-18%2C%20-26%2',
'0-16%2C%20-30%20-4%20C%20-22%202%2C%20-8%202%2C%200%20-6%20Z%22%2F%3E%3Cpath%20d%3D%22M%200%20-6%20C',
'%206%206%2C%206%2018%2C%200%2030%20C%20-6%2018%2C%20-6%206%2C%200%20-6%20Z%22%2F%3E%3Ccircle%20cy%3D',
'%22-20%22%20r%3D%222.6%22%2F%3E%3C%2Fg%3E%3Cg%20transform%3D%22translate(473.0%20940.5)%20scale(0.82',
')%22%20fill%3D%22none%22%20stroke%3D%22%23FFF%22%20stroke-width%3D%221.1%22%20opacity%3D%220.028%22%',
'3E%3Cpath%20d%3D%22M%200%20-34%20C%2010%20-26%2C%2010%20-14%2C%200%20-6%20C%20-10%20-14%2C%20-10%20-',
'26%2C%200%20-34%20Z%22%2F%3E%3Cpath%20d%3D%22M%200%20-6%20C%2014%20-18%2C%2026%20-16%2C%2030%20-4%20',
'C%2022%202%2C%208%202%2C%200%20-6%20Z%22%2F%3E%3Cpath%20d%3D%22M%200%20-6%20C%20-14%20-18%2C%20-26%2',
'0-16%2C%20-30%20-4%20C%20-22%202%2C%20-8%202%2C%200%20-6%20Z%22%2F%3E%3Cpath%20d%3D%22M%200%20-6%20C',
'%206%206%2C%206%2018%2C%200%2030%20C%20-6%2018%2C%20-6%206%2C%200%20-6%20Z%22%2F%3E%3Ccircle%20cy%3D',
'%22-20%22%20r%3D%222.6%22%2F%3E%3C%2Fg%3E%3C%2Fsvg%3E'
].join("");
  var css='body, #title { background-image: url("'+u+'"), radial-gradient(120% 90% at 50% 0%, var(--bg1) 0%, var(--bg2) 60%, var(--bg3) 100%); background-size: cover; background-position: center; }';
  var s=document.createElement('style');s.textContent=css;document.head.appendChild(s);
})();
