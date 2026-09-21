import {autoMask,eraseRegion,alphaBounds,inferForm,brushMask} from './photo-math.js';
import {BraceletViewer} from './three-view.js';
import {registerMaterial,validateMaterial,catalog} from './model.js';
import {esc} from './visuals.js';
const byId=id=>document.getElementById(id);
const button=(action,text,cls='secondary')=>`<button type="button" class="${cls}" data-photo="${action}">${text}</button>`;
export function initPhotoEditor({onAdd,toast}){
  const dialog=byId('photo-dialog'),input=byId('photo-file');let editor=null,opening=false;
  function cleanup(){if(!editor)return;editor.viewer?.dispose();if(!editor.saved){const i=catalog.findIndex(c=>c.id===editor.id);if(i>=0)catalog.splice(i,1);}editor=null;}
  dialog.addEventListener('close',cleanup);
  input.addEventListener('change',async()=>{
    const file=input.files[0];input.value='';if(!file||opening)return;opening=true;
    try{
      if(!['image/jpeg','image/png','image/webp'].includes(file.type))throw Error('请选择 JPG、PNG 或 WebP 照片；HEIC 请先转为 JPG。');
      if(file.size>20*1024*1024)throw Error('照片不能超过 20 MB，请压缩后再选择。');
      cleanup();toast('正在读取照片并识别背景…');const url=URL.createObjectURL(file);let img;
      try{img=new Image();img.src=url;await img.decode();}finally{URL.revokeObjectURL(url);}
      if(!img.naturalWidth||!img.naturalHeight)throw Error('照片没有有效尺寸，请换一张图片。');
      const ratio=Math.min(1,768/Math.max(img.naturalWidth,img.naturalHeight));const w=Math.max(1,Math.round(img.naturalWidth*ratio)),h=Math.max(1,Math.round(img.naturalHeight*ratio));
      const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(img,0,0,w,h);const original=ctx.getImageData(0,0,w,h).data;
      editor={id:'photo-'+crypto.randomUUID(),name:file.name.replace(/\.[^.]+$/,'').slice(0,32)||'我的珠子',canvas,ctx,w,h,original,mask:autoMask(original,w,h,38),undo:[],mode:'wand',showOriginal:false,saved:false,formChosen:false};
      dialog.className='photo-dialog';dialog.innerHTML=`<div class="dialog-heading"><div><span class="eyebrow">MY MATERIALS</span><h2>把手里的珠子，放进手串</h2></div>${button('close','关闭','icon-text-btn')}</div><div class="dialog-body photo-body"><p class="photo-intro">一次选择一颗珠子或一件配饰，完整拍下边缘。照片仅在本机处理；清晰、素色背景更容易抠干净。</p><div class="photo-workspace"><section class="cutout-section"><div class="photo-section-title"><strong>01　抠出你的素材</strong>${button('original','查看原图','text-btn')}</div><div class="cutout-stage" id="cutout-stage"></div><div class="photo-status" id="photo-status" role="status" aria-live="polite">已尝试自动去除背景，透明格表示已去除区域。</div><div class="cutout-tools">${button('auto','一键抠图','primary')}${button('wand','点击背景去除','secondary active')}${button('erase','擦除','secondary')}${button('restore','恢复画笔','secondary')}${button('undo','撤销一步','secondary')}${button('reset','恢复原图','secondary')}</div><div class="photo-sliders"><label>背景容差 <output id="tolerance-value">38</output><input id="photo-tolerance" type="range" min="5" max="100" value="38"></label><label>画笔大小 <output id="brush-value">24</output><input id="photo-brush" type="range" min="3" max="100" value="24"></label></div><p class="photo-small">点选背景会去除相邻的相近颜色。漏抠处继续点；误抠可撤销或用恢复画笔补回。调容差后再点“一键抠图”会重新处理。</p></section><section class="photo-3d-section"><div class="photo-section-title"><strong>02　补成立体，转着看看</strong><span class="approx-badge">近似模型</span></div><div id="photo-3d" class="photo-3d-stage"></div><div class="photo-section-title"><span class="photo-small">拖动旋转 · 双指 / 滚轮缩放</span>${button('reset-view','复位视角','text-btn')}</div><div class="photo-fields"><label class="field"><span>素材名称</span><input id="photo-name" maxlength="32" value="${esc(editor.name)}"></label><label class="field"><span>立体形状</span><select id="photo-form"><option value="round">圆珠 · 照片包覆球体</option><option value="barrel">桶珠 · 照片包覆桶形</option><option value="relief">异形配饰 · 轮廓加厚</option></select></label><label class="field"><span>表面质感</span><select id="photo-finish"><option value="photo">保留照片质感</option><option value="gold">黄金 / 金属反光</option></select></label><div class="field-row"><label class="field"><span>外径 / 高度（mm）</span><input id="photo-size" type="number" min="2" max="24" step=".5" value="10"></label><label class="field"><span>穿线长度（mm）</span><input id="photo-length" type="number" min="1" max="30" step=".5" value="10"></label><label class="field"><span>厚度（mm）</span><input id="photo-depth" type="number" min=".5" max="24" step=".5" value="10"></label></div></div><p class="photo-model-note">单张照片没有背面和真实深度信息。这里按照片轮廓与所选形状补成立体，背面复用正面纹理；不代表实物的背面、孔道或精确雕刻。</p></section></div></div><div class="dialog-footer"><span class="photo-save-note">随方案保存在本机，可导出含照片的 JSON 备份。</span>${button('add','加入材料盒并穿入','primary')}</div>`;
      if(!dialog.open)dialog.showModal();byId('cutout-stage').appendChild(canvas);canvas.setAttribute('aria-label','抠图编辑区域，点击背景去除或拖动画笔修边');canvas.className='cutout-canvas';
      try{editor.viewer=new BraceletViewer();editor.viewer.mount(byId('photo-3d'));}catch{byId('photo-3d').innerHTML='<p class="webgl-fallback">当前浏览器未启用 3D 图形支持。仍可抠图并加入材料盒，在支持 WebGL 的浏览器查看立体效果。</p>';}
      setupCanvas();draw();rebuild(true);
    }catch(e){toast(e.message||'照片读取失败，请换一张照片。');cleanup();if(dialog.open)dialog.close();}finally{opening=false;}
  });
  function status(message){byId('photo-status').textContent=message;}
  function draw(){if(!editor)return;const e=editor,data=new Uint8ClampedArray(e.original);if(!e.showOriginal)for(let i=0;i<e.mask.length;i++)data[i*4+3]=Math.min(data[i*4+3],e.mask[i]);e.ctx.putImageData(new ImageData(data,e.w,e.h),0,0);}
  function snapshot(){editor.undo.push(editor.mask.slice());if(editor.undo.length>20)editor.undo.shift();}
  function result(){const e=editor,b=alphaBounds(e.mask,e.w,e.h),scale=Math.min(1,384/Math.max(b.width,b.height));const out=document.createElement('canvas');out.width=Math.max(1,Math.round(b.width*scale));out.height=Math.max(1,Math.round(b.height*scale));const ctx=out.getContext('2d');
    // Copy the edited pixels, independent of the original/edited display toggle.
    const temp=document.createElement('canvas');temp.width=e.w;temp.height=e.h;const tc=temp.getContext('2d');const data=new Uint8ClampedArray(e.original);for(let i=0;i<e.mask.length;i++)data[i*4+3]=Math.min(data[i*4+3],e.mask[i]);tc.putImageData(new ImageData(data,e.w,e.h),0,0);ctx.drawImage(temp,b.x,b.y,b.width,b.height,0,0,out.width,out.height);
    const small=document.createElement('canvas');const f=96/Math.max(out.width,out.height);small.width=Math.max(1,Math.round(out.width*f));small.height=Math.max(1,Math.round(out.height*f));const sc=small.getContext('2d');sc.drawImage(out,0,0,small.width,small.height);const pixels=sc.getImageData(0,0,small.width,small.height).data;const alpha=Array.from({length:small.width*small.height},(_,i)=>pixels[i*4+3]);const avg=[0,0,0];let n=0;for(let i=0;i<alpha.length;i++)if(alpha[i]>128){for(let c=0;c<3;c++)avg[c]+=pixels[i*4+c];n++;}const color='#'+avg.map(x=>Math.round(x/Math.max(1,n)).toString(16).padStart(2,'0')).join('');
    return {image:out.toDataURL('image/png'),imageWidth:small.width,imageHeight:small.height,alpha,color};
  }
  function rebuild(infer=false){if(!editor)return;try{
    if(infer&&!editor.formChosen){const form=inferForm(editor.mask,editor.w,editor.h);byId('photo-form').value=form;byId('photo-depth').value=form==='relief'?3:10;}
    const size=Number(byId('photo-size').value),length=Number(byId('photo-length').value),depth=Number(byId('photo-depth').value);
    if(![...dialog.querySelectorAll('input[type=number]')].every(x=>x.value!==''&&x.checkValidity())){status('请输入范围内的尺寸，再查看立体效果。');byId('photo-dialog').querySelector('[data-photo=add]').disabled=true;return;}
    const c=validateMaterial({id:editor.id,name:byId('photo-name').value.trim()||'我的珠子',form:byId('photo-form').value,texture:byId('photo-finish').value,size,length,depth,...result()});
    registerMaterial(c);editor.material=c;
    if(editor.viewer){const old=editor.viewer.textures.get(c.id);old?.dispose();editor.viewer.textures.delete(c.id);editor.viewer.key='';editor.viewer.update({beads:[{id:c.id,material:c.id,shape:c.shape,size,length,depth,form:c.form,color:c.color}],cordColor:'#c3ab83',cordDiameter:.8,knot:'隐藏结',knotAllowance:0,wrist:15,ease:.8},{single:true});}
    byId('photo-dialog').querySelector('[data-photo=add]').disabled=false;
  }catch(e){status(e.message);byId('photo-dialog').querySelector('[data-photo=add]').disabled=true;}}
  function setupCanvas(){let down=false,last=null;const pos=e=>{const r=editor.canvas.getBoundingClientRect();return {x:(e.clientX-r.left)/r.width*editor.w,y:(e.clientY-r.top)/r.height*editor.h};};
    function paint(p){const e=editor,r=Number(byId('photo-brush').value)/2;if(last){const distance=Math.hypot(p.x-last.x,p.y-last.y),steps=Math.max(1,Math.ceil(distance/Math.max(1,r/2)));for(let i=1;i<=steps;i++)brushMask(e.mask,e.original,e.w,e.h,last.x+(p.x-last.x)*i/steps,last.y+(p.y-last.y)*i/steps,r,e.mode==='restore');}else brushMask(e.mask,e.original,e.w,e.h,p.x,p.y,r,e.mode==='restore');last=p;draw();}
    editor.canvas.addEventListener('pointerdown',event=>{if(event.button>0)return;event.preventDefault();editor.canvas.setPointerCapture(event.pointerId);editor.showOriginal=false;snapshot();const p=pos(event);if(editor.mode==='wand'){const x=Math.min(editor.w-1,Math.max(0,Math.floor(p.x))),y=Math.min(editor.h-1,Math.max(0,Math.floor(p.y)));editor.mask=eraseRegion(editor.original,editor.w,editor.h,editor.mask,[y*editor.w+x],Number(byId('photo-tolerance').value));draw();rebuild();status('已去除点击处相邻的相近颜色。可继续点选，或撤销修正。');}else{down=true;last=null;paint(p);}});
    editor.canvas.addEventListener('pointermove',event=>{if(down)paint(pos(event));});
    const finish=()=>{if(down){down=false;last=null;rebuild();status('修边已更新，右侧立体效果同步变化。');}};editor.canvas.addEventListener('pointerup',finish);editor.canvas.addEventListener('pointercancel',finish);
  }
  dialog.addEventListener('click',async event=>{const action=event.target.closest('[data-photo]')?.dataset.photo;if(!action||!editor)return;
    if(action==='close'){dialog.close();return;}if(action==='reset-view'){editor.viewer?.reset();return;}
    if(['wand','erase','restore'].includes(action)){editor.mode=action;editor.showOriginal=false;draw();dialog.querySelectorAll('[data-photo=wand],[data-photo=erase],[data-photo=restore]').forEach(b=>b.classList.toggle('active',b.dataset.photo===action));status(action==='wand'?'点击不需要的背景区域。':'按住画面拖动，'+(action==='erase'?'擦掉多余背景。':'补回误删的细节。'));return;}
    if(action==='original'){editor.showOriginal=!editor.showOriginal;event.target.textContent=editor.showOriginal?'查看抠图结果':'查看原图';draw();return;}
    if(action==='undo'){if(!editor.undo.length){status('还没有可撤销的修边操作。');return;}editor.mask=editor.undo.pop();editor.showOriginal=false;draw();rebuild();status('已撤销上一步。');return;}
    if(action==='auto'||action==='reset'){snapshot();editor.showOriginal=false;editor.mask=action==='auto'?autoMask(editor.original,editor.w,editor.h,Number(byId('photo-tolerance').value)):Uint8Array.from({length:editor.w*editor.h},(_,i)=>editor.original[i*4+3]);draw();rebuild(action==='auto');status(action==='auto'?'已重新自动抠图。若背景仍有残留，可点击背景或用画笔修边。':'已恢复原始照片，可重新抠图。');return;}
    if(action==='add'){const button=event.target;button.disabled=true;try{rebuild();if(!editor.material||button.disabled)return;button.disabled=true;await onAdd(editor.material);editor.saved=true;dialog.close();}catch(e){status(e.message||'未能保存，请重试。');button.disabled=false;}}
  });
  dialog.addEventListener('input',e=>{if(!editor)return;if(e.target.id==='photo-tolerance'){byId('tolerance-value').value=e.target.value;return;}if(e.target.id==='photo-brush'){byId('brush-value').value=e.target.value;return;}if(e.target.id==='photo-form')editor.formChosen=true;clearTimeout(editor.timer);editor.timer=setTimeout(()=>rebuild(),120);});
  return {open:()=>input.click()};
}
