require("dotenv").config();
const express = require("express");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const session = require("express-session");
const bcrypt = require("bcryptjs");
const os = require("os");
const si = require("systeminformation");
const fs = require("fs");
const path = require("path");
const http = require("http");
const { WebSocketServer } = require("ws");

const app = express();
const server = http.createServer(app);
const HOST = process.env.HOST || "127.0.0.1";
const PORT = Number(process.env.PORT || 6943);
const secret = process.env.SESSION_SECRET;
if (!secret || secret.length < 32) {
  console.error("SESSION_SECRET must be set to a random value of at least 32 characters.");
  process.exit(1);
}
if (!process.env.ADMIN_PASSWORD_HASH) {
  console.error("ADMIN_PASSWORD_HASH is required. See README.md.");
  process.exit(1);
}
if (process.env.TRUST_PROXY === "1") app.set("trust proxy", 1);
app.disable("x-powered-by");
app.use(helmet({ contentSecurityPolicy: { directives: {
  defaultSrc: ["'self'"], scriptSrc: ["'self'"], styleSrc: ["'self'", "'unsafe-inline'"],
  imgSrc: ["'self'", "data:"], connectSrc: ["'self'", "ws:", "wss:"], objectSrc: ["'none'"],
  frameAncestors: ["'self'"], upgradeInsecureRequests: null
}}}));
app.use(express.json({ limit: "10kb" }));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 300, standardHeaders: true, legacyHeaders: false }));
app.use(session({
  name: "pilo.sid", secret, resave: false, saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: "strict", secure: process.env.NODE_ENV === "production", maxAge: 4 * 60 * 60 * 1000 }
}));
const requireAuth = (req,res,next) => req.session && req.session.authenticated ? next() : res.status(401).json({error:"Authentication required"});
app.post("/api/login", rateLimit({windowMs:15*60*1000, limit:8, standardHeaders:true, legacyHeaders:false}), async (req,res) => {
  const password = typeof req.body?.password === "string" ? req.body.password : "";
  try {
    if (!(await bcrypt.compare(password, process.env.ADMIN_PASSWORD_HASH))) return res.status(401).json({error:"Invalid credentials"});
    req.session.regenerate(err => {
      if (err) return res.status(500).json({error:"Could not create session"});
      req.session.authenticated = true;
      req.session.save(err2 => err2 ? res.status(500).json({error:"Could not save session"}) : res.json({ok:true}));
    });
  } catch { res.status(500).json({error:"Authentication configuration error"}); }
});
app.post("/api/logout", requireAuth, (req,res) => req.session.destroy(() => { res.clearCookie("pilo.sid"); res.json({ok:true}); }));
app.get("/api/me", (req,res) => res.json({authenticated:!!req.session?.authenticated}));
app.get("/api/config", requireAuth, (req,res) => res.json({hostname:os.hostname(), vmConsoleUrl:process.env.VM_CONSOLE_URL || ""}));
app.get("/api/stats", requireAuth, async (req,res) => {
  try {
    const [load, mem, disk, temp, time, osInfo] = await Promise.all([
      si.currentLoad(), si.mem(), si.fsSize(), si.cpuTemperature(), si.time(), si.osInfo()
    ]);
    res.json({
      hostname:os.hostname(), platform:osInfo.distro || osInfo.platform, kernel:osInfo.kernel,
      uptime:os.uptime(), cpu:{usage:Math.round(load.currentLoad||0),cores:os.cpus().length,model:os.cpus()[0]?.model||"Unknown"},
      memory:{total:mem.total,used:mem.active,free:mem.available,percent:Math.round(mem.active/mem.total*100)},
      disks:disk.filter(d=>d.mount==="/" || d.mount==="/home").slice(0,4).map(d=>({mount:d.mount,size:d.size,used:d.used,percent:d.use})),
      temperature:temp.main || null, load:os.loadavg(), time:time.current
    });
  } catch (e) { res.status(500).json({error:"Unable to collect system metrics"}); }
});
app.get("/api/processes", requireAuth, async (req,res) => {
  try {
    const p = await si.processes();
    res.json(p.list.sort((a,b)=>b.cpu-a.cpu).slice(0,12).map(x=>({pid:x.pid,name:x.name,cpu:x.cpu,mem:x.mem,user:x.user})));
  } catch { res.status(500).json({error:"Unable to list processes"}); }
});
app.get("/api/health", (req,res) => res.json({ok:true}));
app.use(express.static(path.join(__dirname,"public"), {index:"index.html", maxAge:process.env.NODE_ENV==="production"?"1h":0}));
app.get("*", (req,res) => res.sendFile(path.join(__dirname,"public","index.html")));

const wss = new WebSocketServer({ noServer:true, maxPayload:1024 });
server.on("upgrade",(req,socket,head)=>{
  if (req.url !== "/ws/stats") return socket.destroy();
  const sid = (req.headers.cookie||"").split(";").map(v=>v.trim()).find(v=>v.startsWith("pilo.sid="))?.slice(9);
  if (!sid) return socket.destroy();
  // Validate session through Express session store before accepting WebSocket.
  app.get("session middleware")(req, {}, ()=>{});
  sessionMiddleware(req, {}, ()=>{});
});
const sessionMiddleware = session({
  name:"pilo.sid", secret, resave:false, saveUninitialized:false
});
server.removeAllListeners("upgrade");
server.on("upgrade",(req,socket,head)=>{
  if (req.url !== "/ws/stats") return socket.destroy();
  sessionMiddleware(req, {}, ()=>{
    if (!req.session?.authenticated) return socket.destroy();
    wss.handleUpgrade(req,socket,head,ws=>wss.emit("connection",ws,req));
  });
});
wss.on("connection",ws=>{
  let busy=false;
  const send=async()=>{
    if(busy||ws.readyState!==1)return; busy=true;
    try {
      const [load,mem,temp]=await Promise.all([si.currentLoad(),si.mem(),si.cpuTemperature()]);
      ws.send(JSON.stringify({type:"stats",cpu:Math.round(load.currentLoad||0),memory:Math.round(mem.active/mem.total*100),temperature:temp.main||null,uptime:os.uptime()}));
    }catch{} finally{busy=false;}
  };
  send(); const timer=setInterval(send,3000); ws.on("close",()=>clearInterval(timer));
});
server.listen(PORT,HOST,()=>console.log(`Pi-Lo listening on http://${HOST}:${PORT}`));
