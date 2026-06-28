/**
 * Drift Check Extension
 */
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";
import { execSync } from "child_process";

const P="/Users/mohamedbardouni/projects/beldify";
const S=P+"/scripts/drift-check.py";

function run(fl){try{return execSync("cd "+P+" && python3 "+S+" "+fl+" 2>&1",{encoding:"utf-8",timeout:15_000}).trim();}catch(e){return"\u274c Drift: "+e.message;}}

export default function ext(pi){pi.registerCommand("drift",{description:"Check/fix local vs prod drift",getArgumentCompletions:(p)=>["fix","full"].filter(o=>o.startsWith(p)).map(v=>({value:v,label:v})),handler:async(a,ctx)=>{const arg=a.trim().toLowerCase();const f=arg==="fix"?"--fix":arg==="full"?"":"--quick";return{content:[{type:"text",text:run(f)}]};}});pi.registerTool({name:"check_drift",label:"Check Drift",description:"Check local vs production git SHA match",parameters:Type.Object({mode:Type.Optional(Type.Union([Type.Literal("quick"),Type.Literal("full"),Type.Literal("fix")]))}),async execute(id,p,s,u,c){const m=(p as any).mode||"quick";const f=m==="fix"?"--fix":m==="full"?"":"--quick";return{content:[{type:"text",text:run(f)}],details:{}};}});pi.on("session_start",async(e,ctx)=>{try{const l=execSync("git rev-parse --short HEAD",{cwd:P,encoding:"utf-8",timeout:5_000}).trim();const s=execSync('ssh MyContabo "cd /var/local/beldify-monorepo && git rev-parse --short HEAD"',{encoding:"utf-8",timeout:10_000}).trim();if(l!==s)ctx.ui.notify("\u26a0\u23ef Drift: local "+l+" "+"  "+ "+s+". /drift","warn");}catch{}});