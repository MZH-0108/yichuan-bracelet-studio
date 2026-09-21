// Shared physical coordinates keep the flat editor, 3D view and exported plan in sync.
import {measure} from './model.js';
const TAU=Math.PI*2;
function sampledPath(fn,steps=720){const p=Array.from({length:steps+1},(_,i)=>({...fn(i/steps)}));let total=0;p[0].distance=0;for(let i=1;i<p.length;i++){total+=Math.hypot(p[i].x-p[i-1].x,p[i].y-p[i-1].y);p[i].distance=total;}return {p,total};}
function onPath(path,t){const d=Math.max(0,Math.min(1,t))*path.total;let lo=0,hi=path.p.length-1;while(hi-lo>1){const mid=(lo+hi)>>1;if(path.p[mid].distance<d)lo=mid;else hi=mid;}const a=path.p[lo],b=path.p[hi],f=(d-a.distance)/(b.distance-a.distance||1);return {x:a.x+(b.x-a.x)*f,y:a.y+(b.y-a.y)*f,z:0,angle:Math.atan2(b.y-a.y,b.x-a.x)};}
export function stringLayout(s){
 const m=measure(s),long=(s.mode||'bracelet')!=='bracelet',coiled=long&&s.layout==='coiled';
 const span=Math.max(35,m.span+s.knotAllowance),turns=s.coilTurns||3;
 let path;
 if(coiled){const pitch=Math.max(m.width,5)*1.65,inner=pitch*1.8;path=sampledPath(t=>{const a=Math.PI/2-TAU*(turns-.16)*t,r=inner+pitch*(turns-1)*t;return {x:Math.cos(a)*r,y:Math.sin(a)*r};});}
 else path=sampledPath(t=>{const a=Math.PI/2-TAU*t;return {x:Math.cos(a),y:Math.sin(a)*(long?(s.mode==='handheld'?1.4:2.15):1)};});
 const factor=span/path.total;path.p.forEach(p=>{p.x*=factor;p.y*=factor;p.distance*=factor;});path.total=span;
 let acc=s.knotAllowance/2;
 const nodes=s.beads.map((b,i)=>{const pos=onPath(path,(acc+b.length/2)/span);acc+=b.length;return {...pos,bead:b,index:i,strand:'main'};});
 const strands=[{id:'main',name:'主串',closed:true,nodes:[...nodes],cord:path.p.map(({x,y})=>({x,y,z:0}))}];
 const knot=onPath(path,0);
 for(const [bi,br] of (s.branches||[]).entries()){
   const anchor=nodes.find(p=>p.bead.id===br.anchor);if(!anchor)continue;
   const normal={x:-Math.sin(anchor.angle),y:Math.cos(anchor.angle)};
   // Fan adjacent branches apart; each remains attached to its named main bead.
   const angle=Math.atan2(normal.y,normal.x)+(br.side===-1?Math.PI:0)+((bi%3)-1)*.1;
   const dir={x:Math.cos(angle),y:Math.sin(angle)},gap=anchor.bead.size*.7+4;
   let distance=gap;
   const branchNodes=br.beads.map((b,i)=>{distance+=b.length/2;const p={x:anchor.x+dir.x*distance,y:anchor.y+dir.y*distance,z:0,angle,bead:b,index:i,strand:br.id};distance+=b.length/2;return p;});
   const end={x:anchor.x+dir.x*(distance+3),y:anchor.y+dir.y*(distance+3),z:0};
   const start={x:anchor.x+dir.x*gap,y:anchor.y+dir.y*gap,z:0};
   strands.push({id:br.id,name:br.name,closed:false,nodes:branchNodes,start,end,cord:[anchor,...branchNodes,end].map(p=>({x:p.x,y:p.y,z:0}))});nodes.push(...branchNodes);
 }
 const bounds={minX:Infinity,maxX:-Infinity,minY:Infinity,maxY:-Infinity};
 for(const p of [...path.p,...nodes]){const pad=p.bead?Math.max(p.bead.size*1.6,p.bead.length*.6):5;bounds.minX=Math.min(bounds.minX,p.x-pad);bounds.maxX=Math.max(bounds.maxX,p.x+pad);bounds.minY=Math.min(bounds.minY,p.y-pad);bounds.maxY=Math.max(bounds.maxY,p.y+pad);}
 const center={x:(bounds.minX+bounds.maxX)/2,y:(bounds.minY+bounds.maxY)/2};
 return {nodes,strands,knot,bounds,center,width:bounds.maxX-bounds.minX,height:bounds.maxY-bounds.minY,coiled};
}
const segmentDistance=(p,a,b)=>{const dx=b.x-a.x,dy=b.y-a.y,t=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/(dx*dx+dy*dy||1)));return Math.hypot(p.x-a.x-dx*t,p.y-a.y-dy*t);};
export function dropTarget(strand,point,draggedId,{deleteDistance=84}={}){
 const remaining=strand.nodes.filter(n=>n.id!==draggedId);
 const sourceIndex=strand.nodes.findIndex(n=>n.id===draggedId);
 if(!remaining.length){const origin=strand.nodes[0]||strand.start||point;return {index:0,remove:Math.hypot(point.x-origin.x,point.y-origin.y)>deleteDistance,x:origin.x,y:origin.y,a:origin,b:origin,label:'原位置'};}
 let distance=Infinity;
 const route=strand.closed?strand.nodes.concat(strand.nodes[0]):[strand.start||strand.nodes[0],...strand.nodes,strand.end||strand.nodes.at(-1)];
 for(let i=1;i<route.length;i++)distance=Math.min(distance,segmentDistance(point,route[i-1],route[i]));
 const slots=[];
 for(let i=1;i<remaining.length;i++){const a=remaining[i-1],b=remaining[i];slots.push({index:i,a,b,x:(a.x+b.x)/2,y:(a.y+b.y)/2});}
 const first=remaining[0],last=remaining.at(-1);
 if(strand.closed){const a=last,b=first;slots.push({index:sourceIndex===0?0:remaining.length,a,b,x:(a.x+b.x)/2,y:(a.y+b.y)/2});}
 else{
   const a=strand.start||{x:first.x,y:first.y-20};slots.push({index:0,a,b:first,x:(a.x+first.x)/2,y:(a.y+first.y)/2});
   const b=strand.end||{x:last.x,y:last.y+20};slots.push({index:remaining.length,a:last,b,x:(last.x+b.x)/2,y:(last.y+b.y)/2});
 }
 const slot=slots.reduce((best,v)=>{const dist=Math.hypot(point.x-v.x,point.y-v.y);return !best||dist<best.dist?{...v,dist}:best;},null);
 return {...slot,remove:distance>deleteDistance,distance,label:slot.index===0?'插到起点':slot.index===remaining.length?'插到末尾':`插在第 ${slot.a.index+1} / ${slot.b.index+1} 颗之间`};
}
