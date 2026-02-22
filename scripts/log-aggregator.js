#!/usr/bin/env node
// Simple aggregator: periodically collect key logs into artifacts/combined.log
const fs = require('fs')
const path = require('path')
const logs = [
  path.resolve(process.cwd(),'artifacts','dev-server.log'),
  path.resolve(process.cwd(),'artifacts','olivia','worker.log'),
  path.resolve(process.cwd(),'artifacts','olivia','worker.out'),
  path.resolve(process.cwd(),'artifacts','olivia','sidebar-scripts-preflight.log'),
]
const out = path.resolve(process.cwd(),'artifacts','combined.log')
function appendHeader(name){
  const header = `\n--- ${new Date().toISOString()} : ${name} ---\n`;
  fs.appendFileSync(out, header)
}
function collect(){
  try{
    logs.forEach(p=>{
      if(fs.existsSync(p)){
        appendHeader(path.basename(p))
        const txt = fs.readFileSync(p,'utf8')
        fs.appendFileSync(out, txt + '\n')
      }
    })
  }catch(e){
    fs.appendFileSync(out, `\nERROR collecting logs: ${String(e)}\n`)
  }
}
// ensure dir
try{ fs.mkdirSync(path.dirname(out), {recursive:true}) }catch(e){}
collect()
// run every 60s
setInterval(collect, 60*1000)
console.log('log-aggregator started; writing to', out)
