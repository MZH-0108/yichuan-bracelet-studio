import * as THREE from './vendor/three.module.js';
import {catalog,measure} from './model.js';
import {stringLayout} from './layout.js';

export function reliefGeometry(alpha,width,height,depth=3){
  const rows=48,cols=Math.max(16,Math.round(rows*width/height)),positions=[[],[]],uv=[[],[]];let face=0;
  const visible=(x,y)=>x>=0&&y>=0&&x<cols&&y<rows&&alpha[Math.min(height-1,Math.floor((y+.5)/rows*height))*width+Math.min(width-1,Math.floor((x+.5)/cols*width))]>80;
  const vert=(x,y,z)=>[(x/cols-.5)*width/height,.5-y/rows,z];
  const triangle=(a,b,c)=>{for(const p of [a,b,c]){positions[face].push(...p);uv[face].push(p[0]*height/width+.5,p[1]+.5);}};
  const quad=(a,b,c,d)=>{triangle(a,b,d);triangle(b,c,d);};
  const half=depth/2;
  for(let y=0;y<rows;y++)for(let x=0;x<cols;x++)if(visible(x,y)){
    const a=vert(x,y,half),b=vert(x+1,y,half),c=vert(x+1,y+1,half),d=vert(x,y+1,half);
    const aa=vert(x,y,-half),bb=vert(x+1,y,-half),cc=vert(x+1,y+1,-half),dd=vert(x,y+1,-half);
    face=0;quad(d,c,b,a);quad(aa,bb,cc,dd);face=1;
    if(!visible(x,y-1))quad(a,b,bb,aa);
    if(!visible(x+1,y))quad(b,c,cc,bb);
    if(!visible(x,y+1))quad(c,d,dd,cc);
    if(!visible(x-1,y))quad(d,a,aa,dd);
  }
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute([...positions[0],...positions[1]],3));g.setAttribute('uv',new THREE.Float32BufferAttribute([...uv[0],...uv[1]],2));g.addGroup(0,positions[0].length/3,0);g.addGroup(positions[0].length/3,positions[1].length/3,1);g.computeVertexNormals();return g;
}
export function standardGeometry(shape){
  if(['光柱','隔片'].includes(shape)){const g=new THREE.CylinderGeometry(.5,.5,1,32);g.rotateZ(Math.PI/2);return g;}
  if(shape==='八楞'){const g=new THREE.CylinderGeometry(.5,.5,1,8);g.rotateZ(Math.PI/2);return g;}
  const g=new THREE.SphereGeometry(.5,40,28);
  const p=g.attributes.position;
  for(let i=0;i<p.count;i++){
    let x=p.getX(i),y=p.getY(i),z=p.getZ(i);
    if(shape==='老型桶珠'){const t=Math.abs(x)*2;x=Math.sign(x)*Math.pow(t,.52)*.5;}
    if(shape==='无相'){const f=1+.065*Math.sin(x*19+y*11+z*23);x*=f;y*=f;z*=f;}
    if(shape==='大肠'){const f=.88+.12*Math.cos(x*40);y*=f;z*=f;}
    p.setXYZ(i,x,y,z);
  }
  g.computeVertexNormals();return g;
}
function textureFor(c,cache,onLoad){
  if(cache.has(c.id))return cache.get(c.id);
  if(c.image){const t=new THREE.TextureLoader().load(c.image,()=>onLoad());t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;cache.set(c.id,t);return t;}
  const canvas=document.createElement('canvas');canvas.width=512;canvas.height=256;
  const ctx=canvas.getContext('2d');ctx.fillStyle='#ffffff';ctx.fillRect(0,0,512,256);
  let seed=519;const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
  if(c.texture==='speckle')for(let i=0;i<520;i++){ctx.fillStyle=`rgba(57,40,22,${.18+rand()*.45})`;ctx.beginPath();ctx.ellipse(rand()*512,rand()*256,.4+rand()*1.9,.6+rand()*2.5,rand()*6,0,7);ctx.fill();}
  if(c.texture==='wood')for(let i=0;i<70;i++){ctx.strokeStyle=`rgba(60,15,5,${rand()*.14})`;ctx.lineWidth=1+rand()*2;ctx.beginPath();let y=rand()*256;ctx.moveTo(0,y);ctx.bezierCurveTo(160,y+rand()*35,300,y-rand()*30,512,y+rand()*12);ctx.stroke();}
  if(c.texture==='stone')for(let i=0;i<8;i++){ctx.strokeStyle='rgba(35,56,40,.12)';ctx.beginPath();ctx.moveTo(rand()*512,0);ctx.bezierCurveTo(rand()*512,80,rand()*512,180,rand()*512,256);ctx.stroke();}
  const t=new THREE.CanvasTexture(canvas);t.colorSpace=THREE.SRGBColorSpace;cache.set(c.id,t);return t;
}
export class BraceletViewer {
  constructor(onSelect=()=>{},onZoom=()=>{},editing=null){
    this.editing=editing;
    this.onSelect=onSelect;this.onZoom=onZoom;this.zoom=1;this.auto=false;this.textures=new Map;this.resources=[];this.key='';this.single=false;this.numbered=false;
    this.renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,preserveDrawingBuffer:true});
    this.renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));this.renderer.setClearColor(0,0);this.renderer.outputColorSpace=THREE.SRGBColorSpace;this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.25;
    this.canvas=this.renderer.domElement;this.canvas.className='three-canvas';this.canvas.tabIndex=0;this.canvas.setAttribute('role','application');this.canvas.setAttribute('aria-label','360 度立体手串预览。拖动珠子排列，拖空白旋转，滚轮或双指缩放；方向键旋转，加减键缩放，Home 复位。');
    this.scene=new THREE.Scene();this.scene.add(new THREE.HemisphereLight('#fff6e3','#747c70',3));
    for(const [pos,intensity] of [[[45,65,110],4],[[-65,5,60],2.6],[[0,-75,-90],2.4]]){const l=new THREE.DirectionalLight('#ffffff',intensity);l.position.set(...pos);this.scene.add(l);}
    this.group=new THREE.Group();this.scene.add(this.group);this.camera=new THREE.PerspectiveCamera(35,1,.1,2000);this.camera.position.set(0,0,145);this.ray=new THREE.Raycaster();this.pointer=new THREE.Vector2();
    this.reset();this.setupControls();
    this.resizeObserver=new ResizeObserver(()=>this.resize());
    this.animate=this.animate.bind(this);this.frame=requestAnimationFrame(this.animate);
  }
  mount(el){this.host=el;el.appendChild(this.canvas);this.resizeObserver.disconnect();this.resizeObserver.observe(el);this.resize();}
  resize(){if(!this.host)return;const w=this.host.clientWidth,h=this.host.clientHeight;if(!w||!h)return;this.renderer.setSize(w,h,false);this.camera.aspect=w/h;this.camera.updateProjectionMatrix();this.fitCamera();this.draw();}
  reset(){this.camera.position.x=0;this.camera.position.y=0;this.group.quaternion.setFromEuler(new THREE.Euler(-.55,.12,-.1));this.setZoom(1);this.draw();}
  setZoom(value){this.zoom=Math.max(.55,Math.min(this.editing?8:2.5,value));this.camera.zoom=this.zoom;this.camera.updateProjectionMatrix();this.onZoom(this.zoom);this.draw();}
  rotate(dx,dy){const q=new THREE.Quaternion().setFromEuler(new THREE.Euler(dy*.008,dx*.008,0));this.group.quaternion.premultiply(q);this.draw();}
  pan(dx,dy){const r=this.canvas.getBoundingClientRect(),scale=2*this.camera.position.z*Math.tan(35*Math.PI/360)/(r.height*this.zoom);this.camera.position.x-=dx*scale;this.camera.position.y+=dy*scale;this.draw();}
  setTop(){this.group.quaternion.identity();this.draw();}
  setupControls(){
    const points=new Map;let start=null,moved=false,pinch=false,drag=null;
    const cancel=()=>{if(drag)this.editing?.end({cancel:true});drag=null;};
    this.canvas.addEventListener('pointerdown',e=>{if(e.button>0)return;this.canvas.focus({preventScroll:true});points.set(e.pointerId,{x:e.clientX,y:e.clientY});this.canvas.setPointerCapture(e.pointerId);if(points.size===1){start={x:e.clientX,y:e.clientY,id:this.editing?this.pickId(e.clientX,e.clientY):null};moved=false;pinch=false;}else{pinch=true;moved=true;cancel();}});
    this.canvas.addEventListener('pointermove',e=>{if(!points.has(e.pointerId))return;const old=points.get(e.pointerId),values=[...points.values()];if(points.size>=2){const before=Math.hypot(values[0].x-values[1].x,values[0].y-values[1].y);points.set(e.pointerId,{x:e.clientX,y:e.clientY});const v=[...points.values()],after=Math.hypot(v[0].x-v[1].x,v[0].y-v[1].y);if(before>0)this.setZoom(this.zoom*after/before);this.pan((e.clientX-old.x)/2,(e.clientY-old.y)/2);moved=true;}else if(!pinch){const dx=e.clientX-old.x,dy=e.clientY-old.y;if(start&&Math.hypot(e.clientX-start.x,e.clientY-start.y)>7)moved=true;if(moved&&start?.id){if(!drag){this.auto=false;drag=start.id;this.editing.start(drag,start);}this.editing.move({x:e.clientX,y:e.clientY});}else if(moved)this.rotate(dx,dy);points.set(e.pointerId,{x:e.clientX,y:e.clientY});}});
    this.canvas.addEventListener('pointerup',e=>{points.delete(e.pointerId);if(drag){this.editing.move({x:e.clientX,y:e.clientY});this.editing.end({cancel:false});drag=null;}else if(!moved&&!pinch&&!points.size)this.pick(e.clientX,e.clientY);if(!points.size)start=null;});
    this.canvas.addEventListener('pointercancel',e=>{points.delete(e.pointerId);moved=true;pinch=true;cancel();});
    this.canvas.addEventListener('lostpointercapture',e=>{if(points.has(e.pointerId)){points.delete(e.pointerId);moved=true;pinch=true;cancel();}});
    this.canvas.addEventListener('wheel',e=>{if(drag)return;e.preventDefault();this.setZoom(this.zoom*Math.exp(-e.deltaY*.001));},{passive:false});
    this.canvas.addEventListener('keydown',e=>{if(e.key==='Escape'){cancel();points.clear();return;}const d={ArrowLeft:[-13,0],ArrowRight:[13,0],ArrowUp:[0,-13],ArrowDown:[0,13]}[e.key];if(d){e.preventDefault();this.rotate(...d);}else if(['+','=','-','Home'].includes(e.key)){e.preventDefault();e.key==='Home'?this.reset():this.setZoom(this.zoom+(e.key==='-'?-.1:.1));}});
  }
  pickId(x,y){if(!this.ray)return null;const r=this.canvas.getBoundingClientRect();this.pointer.set((x-r.left)/r.width*2-1,-(y-r.top)/r.height*2+1);this.ray.setFromCamera(this.pointer,this.camera);for(const hit of this.ray.intersectObjects(this.group.children,true))if(hit.object.userData.beadId)return hit.object.userData.beadId;return null;}
  pick(x,y){const id=this.pickId(x,y);if(id)this.onSelect(id);}
  setDragged(id){for(const child of this.group.children)if(child.userData.beadId)child.visible=child.userData.beadId!==id;this.draw();}
  projectedStrands(){if(!this.layout)return [];this.group.updateMatrixWorld(true);this.camera.updateMatrixWorld(true);const r=this.canvas.getBoundingClientRect(),center=this.layout.center;const project=p=>{const v=new THREE.Vector3(p.x-center.x,p.y-center.y,p.z||0).applyMatrix4(this.group.matrixWorld).project(this.camera);return {x:r.left+(v.x+1)*r.width/2,y:r.top+(1-v.y)*r.height/2};};return this.layout.strands.map(st=>({...st,nodes:st.nodes.map(n=>({...project(n),id:n.bead.id,index:n.index})),start:st.start&&project(st.start),end:st.end&&project(st.end)}));}
  fitCamera(){if(!this.extent)return;this.camera.position.z=this.extent*3.65/Math.min(1,this.camera.aspect);this.camera.updateProjectionMatrix();}
  clear(){for(const r of this.resources)r.dispose?.();this.resources=[];this.group.clear();}
  resource(r){this.resources.push(r);return r;}
  material(b,c){const gold=['gold','metal'].includes(c.texture);return this.resource(new THREE.MeshStandardMaterial({color:c.image?'#ffffff':b.color,map:textureFor(c,this.textures,()=>this.draw()),metalness:gold?.62:.04,roughness:gold?.29:.5,side:THREE.DoubleSide,alphaTest:c.image?.25:0}));}
  createBead(b,c){
    let g;
    const form=b.form||c.form;
    if(c.image&&form==='relief')g=this.resource(reliefGeometry(c.alpha,c.imageWidth,c.imageHeight,(b.depth||c.depth||3)/b.size));
    else {g=this.resource(standardGeometry(c.image?(form==='barrel'?'老型桶珠':'圆珠'):b.shape));if(c.image){const pos=g.attributes.position,uv=g.attributes.uv;for(let i=0;i<pos.count;i++)uv.setXY(i,pos.getX(i)+.5,pos.getY(i)+.5);}}
    const front=this.material(b,c);const material=c.image&&form==='relief'?[front,this.resource(new THREE.MeshStandardMaterial({color:c.color,metalness:c.texture==='gold'?.6:.03,roughness:.4,side:THREE.DoubleSide}))]:front;
    const mesh=new THREE.Mesh(g,material);
    if(c.image&&form==='relief')mesh.scale.set(b.size,b.size,b.size);else mesh.scale.set(b.length,b.size,c.image?(b.depth||c.depth||b.size):b.size);
    mesh.userData.beadId=b.id;return mesh;
  }
  update(s,{selected=null,numbers=false,single=false}={}){
    this.numbered=numbers;this.single=single;
    const key=JSON.stringify([s.beads,s.branches,s.mode,s.layout,s.coilTurns,s.cordColor,s.cordDiameter,s.knot,s.knotAllowance,single,numbers]);
    if(this.key!==key){this.key=key;this.clear();this.layout=stringLayout(s);const layout=this.layout,center=single?{x:0,y:0}:layout.center;
      if(!single){for(const strand of layout.strands){const points=strand.cord.map(p=>new THREE.Vector3(p.x-center.x,p.y-center.y,0));if(strand.closed)points.push(points[0].clone());const curve=new THREE.CatmullRomCurve3(points);const cord=this.resource(new THREE.TubeGeometry(curve,Math.min(720,Math.max(16,points.length)),s.cordDiameter/2,6,false));this.group.add(new THREE.Mesh(cord,this.resource(new THREE.MeshStandardMaterial({color:s.cordColor,roughness:.75}))));}}
      const nodes=single?s.beads.map((b,i)=>({bead:b,index:i,strand:'main',x:0,y:0,angle:0})):layout.nodes;
      nodes.forEach(n=>{const b=n.bead,i=n.index,c=catalog.find(x=>x.id===b.material)||catalog[0],node=new THREE.Group();node.position.set(n.x-center.x,n.y-center.y,0);node.rotation.z=single?0:n.angle;
        if(['吊饰','流苏'].includes(b.shape)&&!c.image){const ring=new THREE.Mesh(this.resource(new THREE.TorusGeometry(1.7,.45,8,24)),this.resource(new THREE.MeshStandardMaterial({color:b.color,metalness:.65,roughness:.3})));ring.userData.beadId=b.id;node.add(ring);const body=this.createBead({...b,shape:b.shape==='流苏'?'光柱':'圆珠',length:b.size*.68},c);body.position.y=-b.size*.72;body.scale.set(b.size*.65,b.size,b.size*.3);if(b.shape==='流苏')body.rotation.z=Math.PI/2;node.add(body);}else node.add(this.createBead(b,c));
        if(b.shape==='三通'){const tube=new THREE.Mesh(this.resource(new THREE.CylinderGeometry(b.size*.15,b.size*.15,b.size*.35,16)),this.resource(new THREE.MeshStandardMaterial({color:b.color,roughness:.4})));tube.position.y=-b.size*.45;tube.userData.beadId=b.id;node.add(tube);}
        if(!c.image&&!['流苏','吊饰'].includes(b.shape)){for(const sign of [-1,1]){const hole=new THREE.Mesh(this.resource(new THREE.CircleGeometry(.58,16)),this.resource(new THREE.MeshBasicMaterial({color:'#30281d',side:THREE.DoubleSide})));hole.rotation.y=Math.PI/2;hole.position.x=sign*b.length*.501;hole.userData.beadId=b.id;node.add(hole);}}
        node.userData.beadId=b.id;this.group.add(node);
        if(numbers&&!single){const cv=document.createElement('canvas');cv.width=96;cv.height=64;const ctx=cv.getContext('2d');ctx.fillStyle='#284d3e';ctx.fillRect(0,6,96,50);ctx.fillStyle='white';ctx.font='30px sans-serif';ctx.textAlign='center';ctx.fillText(`${n.strand==='main'?'':layout.strands.findIndex(st=>st.id===n.strand)+'·'}${i+1}`,48,42);const tex=this.resource(new THREE.CanvasTexture(cv));const sprite=new THREE.Sprite(this.resource(new THREE.SpriteMaterial({map:tex,depthTest:false})));sprite.position.set(n.x-center.x,n.y-center.y+b.size/2+2,1);sprite.scale.set(6,4,1);this.group.add(sprite);}
      });
      if(!single&&s.knot!=='隐藏结'&&s.beads.length){const mat=this.resource(new THREE.MeshStandardMaterial({color:s.cordColor,roughness:.8}));for(const x of [-.6,.6]){const knot=new THREE.Mesh(this.resource(new THREE.TorusGeometry(1.3,.42,8,20)),mat);knot.position.set(layout.knot.x-center.x+x,layout.knot.y-center.y+.5,.3);this.group.add(knot);}}
      this.extent=single?Math.max(...s.beads.map(b=>Math.max(b.size,b.depth||b.size,b.length)),10):Math.hypot(layout.width,layout.height)/2;
      this.camera.near=.1;this.camera.far=10000;this.fitCamera();
    }
    this.group.traverse(o=>{for(const material of Array.isArray(o.material)?o.material:[o.material])if(material?.emissive){material.emissive.set(o.userData.beadId===selected?'#487149':'#000000');material.emissiveIntensity=.16;}});this.draw();
  }
  animate(){if(this.auto&&this.canvas.isConnected&&!document.hidden){this.group.rotation.y+=.006;this.draw();}this.frame=requestAnimationFrame(this.animate);}
  draw(){if(this.renderer&&this.host?.clientWidth)this.renderer.render(this.scene,this.camera);}
  exportImage(){this.draw();return new Promise(resolve=>this.canvas.toBlob(resolve,'image/png'));}
  dispose(){cancelAnimationFrame(this.frame);this.resizeObserver.disconnect();this.clear();for(const t of this.textures.values())t.dispose();this.renderer.dispose();this.canvas.remove();}
}
