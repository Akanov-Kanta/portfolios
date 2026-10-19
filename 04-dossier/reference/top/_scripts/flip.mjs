// usage: node flip.mjs slug url selector settleMs  -> shots/<slug>/seq_flip + sheet
import { chromium } from '/Users/nazarakanov/development/dossier/hybrid/node_modules/playwright/index.mjs';
import fs from 'fs';
const [slug,url,sel,settle]=process.argv.slice(2);
const OUT=`/Users/nazarakanov/development/dossier/reference/top/shots/${slug}/seq_flip`; fs.rmSync(OUT,{recursive:true,force:true}); fs.mkdirSync(OUT,{recursive:true});
const b=await chromium.launch({args:['--use-gl=angle','--enable-webgl','--ignore-gpu-blocklist']});
const p=await b.newPage({viewport:{width:1440,height:900}});
await p.goto(url,{waitUntil:'load'}); await p.waitForTimeout(+settle);
const h=p.locator(sel).first();
for(let k=0;k<80;k++){const bb=await h.boundingBox(); if(bb&&bb.y>120&&bb.y+bb.height/2<820) break; await p.mouse.move(720,450); await p.mouse.wheel(0,bb&&bb.y<120?-120:120); await p.waitForTimeout(120);} await p.waitForTimeout(1500);
const box=await h.boundingBox(); await p.mouse.move(box.x+box.width/2,box.y+box.height/2,{steps:5}); await p.waitForTimeout(700);
await p.screenshot({path:`${OUT}/../d_flip_hover.jpg`,type:'jpeg',quality:78});
const cdp=await p.context().newCDPSession(p); const fr=[];
cdp.on('Page.screencastFrame',async f=>{fr.push({t:f.metadata.timestamp,d:f.data});try{await cdp.send('Page.screencastFrameAck',{sessionId:f.sessionId})}catch{}});
await cdp.send('Page.startScreencast',{format:'jpeg',quality:60,maxWidth:720,maxHeight:450});
const t0=Date.now()/1000; await p.mouse.click(box.x+box.width/2,box.y+box.height/2); await p.waitForTimeout(3000);
await cdp.send('Page.stopScreencast').catch(()=>{});
let next=t0,n=0; for(let i=0;i<fr.length;i++){const nt=i+1<fr.length?fr[i+1].t:1e12; while(next<nt&&next<=t0+3){ if(fr[i].t<=next+0.001){fs.writeFileSync(`${OUT}/${String(n).padStart(2,'0')}_${Math.round((next-t0)*1000)}ms.jpg`,Buffer.from(fr[i].d,'base64'));n++;} next+=0.12;}}
await p.waitForTimeout(1500); await p.screenshot({path:`${OUT}/../d_flip_after.jpg`,type:'jpeg',quality:78});
console.log(slug,'frames',fr.length,'kept',n); await b.close();
