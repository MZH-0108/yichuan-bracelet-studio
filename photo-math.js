// Pure pixel operations shared by the editor and its regression checks.
export function eraseRegion(rgba, width, height, mask, seeds, tolerance=38) {
  const result=mask.slice(), visited=new Uint8Array(width*height), queue=new Int32Array(width*height);
  for(const seed of seeds){
    if(seed<0||seed>=width*height||visited[seed])continue;
    const p=seed*4, base=[rgba[p],rgba[p+1],rgba[p+2]];let head=0,tail=0;queue[tail++]=seed;visited[seed]=1;
    while(head<tail){const n=queue[head++],k=n*4;
      const distance=Math.sqrt(((rgba[k]-base[0])**2+(rgba[k+1]-base[1])**2+(rgba[k+2]-base[2])**2)/3);
      if(rgba[k+3]>5&&distance>tolerance)continue;
      result[n]=0;
      const x=n%width,y=Math.floor(n/width);
      for(const next of [x>0?n-1:-1,x<width-1?n+1:-1,y>0?n-width:-1,y<height-1?n+width:-1]){
        if(next>=0&&!visited[next]){visited[next]=1;queue[tail++]=next;}
      }
    }
  }
  return result;
}
export function autoMask(rgba,width,height,tolerance=38){
  const mask=Uint8Array.from({length:width*height},(_,i)=>rgba[i*4+3]);
  // Preserve existing alpha; transparent PNGs are already cut out.
  if(mask.filter(x=>x<20).length>mask.length*.02)return mask;
  const corners=[0,width-1,(height-1)*width,width*height-1];
  // Only use a border sample when at least two corners agree in colour.
  const seeds=corners.filter(a=>corners.some(b=>a!==b&&Math.hypot(...[0,1,2].map(c=>rgba[a*4+c]-rgba[b*4+c]))<tolerance*1.8));
  if(!seeds.length)return mask;
  const result=eraseRegion(rgba,width,height,mask,seeds,tolerance);
  const kept=result.reduce((n,v)=>n+(v>20),0);
  return kept<mask.length*.012?mask:result;
}
export function alphaBounds(mask,w,h){let x0=w,y0=h,x1=-1,y1=-1,count=0;
  for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(mask[y*w+x]>32){x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);count++;}
  if(!count)throw Error('画面已经全透明，请撤销一步或恢复原图。');
  return {x:x0,y:y0,width:x1-x0+1,height:y1-y0+1,count};
}
export function inferForm(mask,w,h){const b=alphaBounds(mask,w,h),ratio=b.width/b.height,fill=b.count/(b.width*b.height);
 return ratio>.82&&ratio<1.22&&fill>.66&&fill<.9?'round':ratio>.65&&ratio<1.5&&fill>=.9?'barrel':'relief';
}
export function brushMask(mask,original,w,h,x,y,r,restore=false){
  for(let py=Math.max(0,Math.floor(y-r));py<Math.min(h,Math.ceil(y+r));py++)for(let px=Math.max(0,Math.floor(x-r));px<Math.min(w,Math.ceil(x+r));px++){
    const d=Math.hypot(px-x,py-y);if(d<=r){const i=py*w+px;mask[i]=restore?original[i*4+3]:0;}
  }
}
