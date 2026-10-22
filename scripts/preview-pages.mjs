import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
const root=path.resolve(".pages-build/out");
const types={".html":"text/html; charset=utf-8",".js":"application/javascript; charset=utf-8",".css":"text/css; charset=utf-8",".json":"application/json; charset=utf-8",".txt":"text/plain; charset=utf-8",".png":"image/png",".jpg":"image/jpeg",".webp":"image/webp",".svg":"image/svg+xml",".woff2":"font/woff2"};
http.createServer(async(req,res)=>{
 try {
 const url=new URL(req.url,"http://localhost");
 if(!url.pathname.startsWith("/lume-candles/")){res.writeHead(302,{Location:"/lume-candles/"});res.end();return;}
 const requested=decodeURIComponent(url.pathname.slice("/lume-candles/".length));
 let file=path.resolve(root,requested);
 if(file!==root&&!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
 const stat=await fs.stat(file);if(stat.isDirectory())file=path.join(file,"index.html");
 const data=await fs.readFile(file);res.writeHead(200,{"Content-Type":types[path.extname(file)]||"application/octet-stream"});res.end(data);
 }catch{res.writeHead(404);res.end("Not found");}
}).listen(3015,"127.0.0.1",()=>console.log("Pages preview: http://localhost:3015/lume-candles/"));
