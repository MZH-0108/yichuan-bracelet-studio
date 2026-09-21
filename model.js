export const catalog=[
 {id:'xingyue',name:'星月菩提',category:'文玩珠',color:'#e4d7b6',texture:'speckle',shape:'圆珠',size:8,caption:'温润米白 · 点点星月'},
 {id:'bodhi',name:'菩提根',category:'文玩珠',color:'#eee6cc',texture:'ivory',shape:'圆珠',size:10,caption:'素净奶白 · 细腻质感'},
 {id:'sandal',name:'小叶紫檀',category:'文玩珠',color:'#642e24',texture:'wood',shape:'圆珠',size:8,caption:'沉静紫红 · 木纹肌理'},
 {id:'coconut',name:'椰蒂',category:'文玩珠',color:'#49352a',texture:'wood',shape:'老型桶珠',size:8,caption:'古朴深棕 · 复古搭配'},
 {id:'turquoise',name:'绿松石',category:'文玩珠',color:'#6d9b8e',texture:'stone',shape:'圆珠',size:8,caption:'山野青绿 · 清润点睛'},
 {id:'agate',name:'南红玛瑙',category:'文玩珠',color:'#ba553f',texture:'stone',shape:'圆珠',size:8,caption:'温暖朱红 · 一抹明亮'},
 {id:'gold',name:'足金圆珠',category:'黄金元素',color:'#d6a74e',texture:'gold',shape:'圆珠',size:8,caption:'温润金色 · 经典圆珠'},
 {id:'goldbarrel',name:'古法金桶珠',category:'黄金元素',color:'#cda659',texture:'gold',shape:'老型桶珠',size:8,caption:'古法哑光 · 温柔金调'},
 {id:'goldfacet',name:'八楞金珠',category:'黄金元素',color:'#e1b959',texture:'gold',shape:'八楞',size:8,caption:'利落切面 · 光影层次'},
 {id:'goldwavy',name:'大肠金珠',category:'黄金元素',color:'#d4a552',texture:'gold',shape:'大肠',size:10,caption:'灵动褶皱 · 轻盈趣味'},
 {id:'spacer',name:'古法金隔片',category:'隔片配饰',color:'#caa052',texture:'gold',shape:'隔片',size:7,length:2,caption:'分隔色彩 · 丰富节奏'},
 {id:'silver',name:'素银隔片',category:'隔片配饰',color:'#c4c8c4',texture:'metal',shape:'隔片',size:7,length:2,caption:'清冷银色 · 素雅留白'},
 {id:'tee',name:'菩提三通',category:'隔片配饰',color:'#e5d7b5',texture:'speckle',shape:'三通',size:10,caption:'三向孔位 · 衔接收尾'},
 {id:'goldtee',name:'黄金三通',category:'隔片配饰',color:'#d4ac59',texture:'gold',shape:'三通',size:10,caption:'金色主珠 · 汇合线头'},
 {id:'lotus',name:'莲蓬吊饰',category:'隔片配饰',color:'#c8a453',texture:'gold',shape:'吊饰',size:10,length:3,caption:'环扣悬挂 · 一点禅意'},
 {id:'tassel',name:'流苏配饰',category:'隔片配饰',color:'#8a453d',texture:'thread',shape:'流苏',size:10,length:3,caption:'轻盈垂坠 · 中式细节'}
];
export const shapes=['圆珠','老型桶珠','八楞','无相','光柱','大肠'];
export const cords={'弹力线':{color:'#ded3ba',diameter:0.8},'玉线':{color:'#805239',diameter:1},'金刚线':{color:'#732f2e',diameter:0.8},'编织蜡线':{color:'#414f43',diameter:1}};
export const knots=['隐藏结','金刚结','平结','凤尾结'];
const uid=()=>globalThis.crypto.randomUUID();
export const modes={bracelet:'手串',tibetan:'藏式长串',mala108:'108',handheld:'手持'};
export const allBeads=s=>[...s.beads,...(s.branches||[]).flatMap(b=>b.beads)];
export const strandOf=(s,id)=>s.beads.some(b=>b.id===id)?{id:'main',name:'主串',beads:s.beads}:(s.branches||[]).find(b=>b.beads.some(x=>x.id===id));
export const isMainBead=b=>b.countAsMain??!['隔片','三通','吊饰','流苏','照片轮廓'].includes(b.shape);
export const clone=x=>({...x,beads:x.beads.map(b=>({...b})),branches:(x.branches||[]).map(b=>({...b,beads:b.beads.map(x=>({...x}))})),customMaterials:[...(x.customMaterials||[])]});
export function removeBead(s,id){const strand=strandOf(s,id);if(!strand)return;const i=strand.beads.findIndex(b=>b.id===id);strand.beads.splice(i,1);if(strand.id==='main'){for(const branch of s.branches||[])if(branch.anchor===id)branch.anchor=s.beads[Math.max(0,i-1)]?.id;if(!s.beads.length)s.branches=[];}}
export function insertBeadAt(s,id,index){const strand=strandOf(s,id);if(!strand)return;const from=strand.beads.findIndex(b=>b.id===id),b=strand.beads.splice(from,1)[0];strand.beads.splice(Math.max(0,Math.min(index,strand.beads.length)),0,b);}
export function makeBranch(anchor,kind='counter',index=1){const names={counter:'计数支串',backcloud:'背云支串',tassel:'流苏支串'};const beads=kind==='counter'?Array.from({length:10},()=>makeBead('silver',{shape:'圆珠',size:4,length:4})):kind==='backcloud'?[makeBead('turquoise',{size:10,length:10}),makeBead('goldbarrel',{size:6,length:6})]:[];beads.push(makeBead('tassel',{size:8,length:5}));return {id:uid(),name:`${names[kind]} ${index}`,anchor,side:1,beads};}
export function setMode(s,mode){s.mode=mode;s.layout=mode==='bracelet'?'expanded':s.layout||'expanded';s.targetCount=mode==='mala108'||mode==='tibetan'?108:mode==='handheld'?21:0;s.coilTurns=s.coilTurns||3;}
export function modeStarter(mode){if(mode==='bracelet')return starter();const s=starter();setMode(s,mode);s.name=mode==='tibetan'?'藏式 · 随喜':mode==='mala108'?'108 · 静心':'手持 · 随行';s.beads=Array.from({length:s.targetCount},()=>makeBead(mode==='tibetan'?'coconut':'xingyue'));if(mode!=='handheld')for(const i of [81,54,27])s.beads.splice(i,0,makeBead('turquoise',{size:10,length:10,countAsMain:false}));s.beads.push(makeBead('tee'));s.cord='玉线';s.cordColor='#805239';s.knot='金刚结';s.branches=[makeBranch(s.beads.at(-1).id,'backcloud',1)];if(mode==='tibetan'){s.layout='coiled';s.branches.push(makeBranch(s.beads[28].id,'counter',2),makeBranch(s.beads[83].id,'tassel',3));}return s;}

export const customMaterial=id=>catalog.find(c=>c.id===id);
export function registerMaterial(c){const i=catalog.findIndex(x=>x.id===c.id);if(i<0)catalog.push(c);else if(catalog[i].image)catalog[i]=c;}
export function makeBead(id,overrides={}){const c=catalog.find(x=>x.id===id)||catalog[0];return {id:uid(),material:c.id,color:c.color,shape:c.shape,size:c.size,length:c.length||c.size,...(c.image?{form:c.form,depth:c.depth}:{}),...overrides};}
export function starter(kind='natural'){
 let beads=[];
 if(kind==='gold'){for(let i=0;i<23;i++)beads.push(makeBead(i%5===0?'goldfacet':'gold',{size:8,length:8}));}
 else if(kind==='forest'){for(let i=0;i<22;i++)beads.push(makeBead(i%6===0?'turquoise':'sandal'));beads.splice(5,0,makeBead('spacer'));beads.splice(18,0,makeBead('spacer'));}
 else{for(let i=0;i<22;i++)beads.push(makeBead('xingyue'));beads[5]=makeBead('goldbarrel');beads[16]=makeBead('goldbarrel');[5,7,18,20].forEach(i=>beads.splice(i,0,makeBead('spacer')));}
 return {version:3,mode:'bracelet',layout:'expanded',coilTurns:3,targetCount:0,branches:[],customMaterials:[],name:kind==='gold'?'流金 · 日常':kind==='forest'?'山野 · 青绿':'星月 · 拾光',beads,wrist:15,ease:0.8,cord:'弹力线',cordColor:'#c3ab83',cordDiameter:0.8,knot:'隐藏结',knotAllowance:0};
}
export function measure(s){
 const span=s.beads.reduce((n,b)=>n+b.length,0),all=allBeads(s);
 const width=span?s.beads.reduce((n,b)=>n+b.size*b.length,0)/span:0;
 const inner=s.beads.length>2?Math.max(0,span+s.knotAllowance-Math.PI*width):0;
 const target=(s.wrist+s.ease)*10,diff=inner-target;
 const branchSpan=(s.branches||[]).reduce((n,b)=>n+b.beads.reduce((n,x)=>n+x.length,0)+100,0);
 return {span,width,inner,target,diff,fit:Math.abs(diff)<=5&&s.beads.length>2?'合适':diff<0?'偏紧':'偏松',cordCm:Math.ceil((span+branchSpan+200)/10),count:all.length,mainCount:s.beads.filter(isMainBead).length,accessoryCount:all.length-s.beads.filter(isMainBead).length};
}
export function moveItem(s,from,to){if(from<0||to<0||from>=s.beads.length||to>=s.beads.length)return s;const a=s.beads.splice(from,1)[0];s.beads.splice(to,0,a);return s;}
export function validateMaterial(c){
 const num=(v,a,b)=>typeof v==='number'&&Number.isFinite(v)&&v>=a&&v<=b;
 if(!c||!/^photo-[a-z0-9-]{8,60}$/.test(c.id)||typeof c.name!=='string'||!c.name.trim()||c.name.length>32||!['round','barrel','relief'].includes(c.form)||!['photo','gold'].includes(c.texture)||!num(c.size,2,24)||!num(c.length,1,30)||!num(c.depth,.5,24)||!/^#[0-9a-f]{6}$/i.test(c.color)||typeof c.image!=='string'||c.image.length>1000000||!/^data:image\/png;base64,[A-Za-z0-9+/]+=*$/.test(c.image)||!num(c.imageWidth,1,96)||!Number.isInteger(c.imageWidth)||!num(c.imageHeight,1,96)||!Number.isInteger(c.imageHeight)||!Array.isArray(c.alpha)||c.alpha.length!==c.imageWidth*c.imageHeight||c.alpha.some(v=>!Number.isInteger(v)||v<0||v>255)||!c.alpha.some(v=>v>80))throw Error('照片素材无效，请重新添加 PNG / JPG 照片。');
 const header=atob(c.image.slice(c.image.indexOf(',')+1,c.image.indexOf(',')+49));
 const dim=offset=>((header.charCodeAt(offset)*16777216)+(header.charCodeAt(offset+1)<<16)+(header.charCodeAt(offset+2)<<8)+header.charCodeAt(offset+3));
 if(!c.image.startsWith('data:image/png;base64,iVBORw0KGgo')||header.slice(12,16)!=='IHDR'||!num(dim(16),1,512)||!num(dim(20),1,512))throw Error('照片尺寸无效，请通过添加照片重新处理。');
 return {id:c.id,name:c.name,category:'我的素材',caption:'照片素材 · 近似立体',color:c.color,texture:c.texture,shape:c.form==='relief'?'照片轮廓':c.form==='barrel'?'老型桶珠':'圆珠',size:c.size,length:c.length,depth:c.depth,form:c.form,image:c.image,imageWidth:c.imageWidth,imageHeight:c.imageHeight,alpha:[...c.alpha]};
}
export function validate(raw){
 if(!raw||![1,2,3].includes(raw.version)||typeof raw.name!=='string'||raw.name.length>60||!Array.isArray(raw.beads)||raw.beads.length>300)throw Error('不是受支持的一串方案文件（主串最多 300 个元素）。');
 const number=(v,min,max)=>typeof v==='number'&&Number.isFinite(v)&&v>=min&&v<=max;
 const color=v=>typeof v==='string'&&/^#[0-9a-f]{6}$/i.test(v);
 if(!number(raw.wrist,10,25)||!number(raw.ease,0,3)||!number(raw.cordDiameter,.3,3)||!number(raw.knotAllowance,0,30)||!cords[raw.cord]||!knots.includes(raw.knot)||!color(raw.cordColor))throw Error('方案的手围或线材参数无效。');
 if(raw.customMaterials!==undefined&&(!Array.isArray(raw.customMaterials)||raw.customMaterials.length>12))throw Error('每份方案最多包含 12 种照片素材。');
 const assets=(raw.customMaterials||[]).map(validateMaterial);
 if(new Set(assets.map(c=>c.id)).size!==assets.length)throw Error('方案包含重复的照片素材。');
 const allShapes=[...shapes,'隔片','三通','吊饰','流苏','照片轮廓'];
 const readBead=b=>{const c=assets.find(c=>c.id===b.material)||catalog.find(c=>c.id===b.material&&!c.image);if(!c||!allShapes.includes(b.shape)||!number(b.size,2,24)||!number(b.length,1,30)||!color(b.color)||(b.countAsMain!==undefined&&typeof b.countAsMain!=='boolean'))throw Error('方案包含无效的珠子尺寸或材质。');
 const extra=c.image?{form:b.form||c.form,depth:b.depth??c.depth}:{};
 if(c.image&&(!['round','barrel','relief'].includes(extra.form)||!number(extra.depth,.5,24)))throw Error('照片的立体参数无效。');
 return {id:uid(),material:b.material,color:b.color,shape:b.shape,size:b.size,length:b.length,...(typeof b.countAsMain==='boolean'?{countAsMain:b.countAsMain}:{}),...extra};};
 const beads=raw.beads.map(readBead),mode=raw.mode||'bracelet',layout=raw.layout||'expanded',coilTurns=raw.coilTurns??3,targetCount=raw.targetCount??(mode==='mala108'||mode==='tibetan'?108:mode==='handheld'?21:0);
 if(!modes[mode]||!['expanded','coiled'].includes(layout)||!Number.isInteger(coilTurns)||!number(coilTurns,2,5)||!Number.isInteger(targetCount)||!number(targetCount,0,216))throw Error('长串模式或主珠目标无效。');
 if(raw.branches!==undefined&&(!Array.isArray(raw.branches)||raw.branches.length>12))throw Error('最多可添加 12 条支串。');
 const branches=(raw.branches||[]).map(br=>{if(!br||typeof br.name!=='string'||br.name.length>32||!Array.isArray(br.beads)||br.beads.length>40||![1,-1].includes(br.side))throw Error('支串数据无效（每条最多 40 个元素）。');const idx=raw.beads.findIndex(b=>b.id===br.anchor);if(idx<0||raw.beads.filter(b=>b.id===br.anchor).length!==1)throw Error('找不到支串挂点。');return {id:uid(),name:br.name,anchor:beads[idx].id,side:br.side,beads:br.beads.map(readBead)};});
 if(beads.length+branches.reduce((n,b)=>n+b.beads.length,0)>600)throw Error('方案最多包含 600 个元素。');
 // Validation stays atomic: photo materials are registered after all strands pass.
 assets.forEach(registerMaterial);
 return {version:3,mode,layout,coilTurns,targetCount,branches,customMaterials:assets,name:raw.name,beads,wrist:raw.wrist,ease:raw.ease,cord:raw.cord,cordColor:raw.cordColor,cordDiameter:raw.cordDiameter,knot:raw.knot,knotAllowance:raw.knotAllowance};
}
export function materials(s){const map=new Map;for(const b of allBeads(s)){const name=catalog.find(c=>c.id===b.material).name;const key=[name,b.shape,b.size,b.length,b.color,b.form,b.depth].join('|');if(!map.has(key))map.set(key,{name,...b,count:0});map.get(key).count++;}return [...map.values()];}
