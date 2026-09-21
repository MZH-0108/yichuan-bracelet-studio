let db;
const ready=new Promise((resolve,reject)=>{
  const request=indexedDB.open('yichuan-studio',1);
  request.onupgradeneeded=()=>request.result.createObjectStore('workspace');
  request.onsuccess=()=>{db=request.result;resolve(db);};request.onerror=()=>reject(request.error);
});
ready.catch(()=>{});
export async function read(key,fallback){try{await ready;return await new Promise((resolve,reject)=>{const r=db.transaction('workspace').objectStore('workspace').get(key);r.onsuccess=()=>resolve(r.result??fallback);r.onerror=()=>reject(r.error);});}catch{return fallback;}}
export async function write(key,value){await ready;return new Promise((resolve,reject)=>{const tx=db.transaction('workspace','readwrite');tx.objectStore('workspace').put(value,key);tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);});}
