import http from 'node:http';
import {readFile} from 'node:fs/promises';
const files={'/':'index.html','/app.js':'app.js','/style.css':'style.css'};
const types={html:'text/html; charset=utf-8',js:'text/javascript; charset=utf-8',css:'text/css; charset=utf-8'};
http.createServer(async(req,res)=>{const file=files[req.url?.split('?')[0]];if(!file){res.writeHead(404);res.end('Not found');return;}try{const data=await readFile(new URL(`./public/${file}`,import.meta.url));res.writeHead(200,{'Content-Type':types[file.split('.').pop()],'X-Content-Type-Options':'nosniff'});res.end(data);}catch{res.writeHead(500);res.end('Server error');}}).listen(Number(process.env.PORT)||3000,'0.0.0.0');
