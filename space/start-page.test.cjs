// start: "chat" sends the hub index to GobboNet chat.html; default stays on the hub; no loop on chat.html.
const fs=require('fs'),vm=require('vm');
const src=fs.readFileSync(require('path').join(__dirname,'space.js'),'utf8');
function run(path,cfg){
  let replaced=null;
  const doc={documentElement:{style:{setProperty(){}},setAttribute(){}},querySelector(){return {setAttribute(){}}},querySelectorAll(){return []},createElement(){return {setAttribute(){}}},head:{appendChild(){}},readyState:'complete',baseURI:'https://x.github.io/spaces-x/',addEventListener(){},title:''};
  const win={dispatchEvent(){},location:{pathname:path,replace(u){replaced=u},href:'https://x.github.io'+path,hostname:'x.github.io'},document:doc};
  const ctx={window:win,document:doc,fetch:()=>Promise.resolve({ok:true,json:()=>Promise.resolve(cfg)}),console,URL,setTimeout,CustomEvent:function(){}};
  win.fetch=ctx.fetch; vm.createContext(ctx); vm.runInContext(src,ctx);
  return new Promise(r=>setTimeout(()=>r(replaced),50));
}
(async()=>{
  const a=await run('/spaces-x/',{start:'chat'}), b=await run('/spaces-x/index.html',{start:'chat'}), c=await run('/spaces-x/',{}), d=await run('/spaces-x/chat.html',{start:'chat'});
  console.log(JSON.stringify({dir:a,index:b,hubDefault:c,onChat:d}));
  process.exit(a==='/spaces-x/chat.html'&&b==='/spaces-x/chat.html'&&c===null&&d===null?0:1);
})();
