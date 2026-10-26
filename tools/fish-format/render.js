// node render.js out_dir file1.svg file2.svg ... : each SVG drawn inline at 2000x1000 on black, Hobo loaded
const {chromium}=require('playwright'),fs=require('fs'),path=require('path');
(async()=>{const out=process.argv[2],files=process.argv.slice(3);fs.mkdirSync(out,{recursive:true});
const b=await chromium.launch();const p=await b.newPage({viewport:{width:2000,height:1000}});
const font=fs.readFileSync('/home/user/mannafish/fish-lang/hobo.woff2').toString('base64');
for(const f of files){let s=fs.readFileSync(f,'utf8').replace(/style="width:100%;height:100%;position:absolute;top:0;left:0;/,'style="');
await p.setContent(`<style>@font-face{font-family:MFHobo;src:url(data:font/woff2;base64,${font})}html,body{margin:0;background:#000}svg{width:2000px;height:1000px;display:block}</style>${s}`);
await p.evaluate(()=>document.fonts.ready);await p.waitForTimeout(50);
await p.screenshot({path:path.join(out,path.basename(f).replace('.svg','.png'))});}
await b.close();})();
