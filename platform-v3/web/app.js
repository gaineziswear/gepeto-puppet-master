const SUPABASE_URL="https://whoayukxupovtkxqxplg.supabase.co";
const SUPABASE_PUBLISHABLE_KEY="sb_publishable_OhAjV0mn-d6aWcB77Vblxw_49tXcsrn";
const supabase=window.supabase.createClient(SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY);
const cast=[["Maya Chen","The Strategist","Measured, analytical and competitive."],["Darius Okafor","The Challenger","Direct, principled and provocative."],["Sofia Alvarez","The Connector","Empathetic, perceptive and persuasive."],["Theo Bennett","The Skeptic","Sceptical, witty and independent."],["Amara Diallo","The Idealist","Idealistic, courageous and reflective."]];
const $=s=>document.querySelector(s),grid=$("#residents");
grid.innerHTML=cast.map((p,i)=>`<article class="resident"><span class="number">0${i+1}</span><h3>${p[0]}</h3><p>${p[2]}</p><small>${p[1].toUpperCase()}</small></article>`).join("");
function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
async function refreshSession(){
 const {data:{session}}=await supabase.auth.getSession();
 $("#authState").textContent=session?"SIGNED IN":"NOT SIGNED IN";
 $("#authPanel").hidden=!!session;$("#signout").hidden=!session;
 $("#start").disabled=!session;$("#start").textContent=session?"Start a debate":"Sign in to start";
}
async function authAction(kind){
 const email=$("#email").value.trim(),password=$("#password").value;
 if(!email||password.length<8){$("#authMessage").textContent="Enter a valid email and a password of at least 8 characters.";return}
 $("#authMessage").textContent="Contacting Supabase Auth…";
 const result=kind==="signup"?await supabase.auth.signUp({email,password}):await supabase.auth.signInWithPassword({email,password});
 if(result.error){$("#authMessage").textContent=result.error.message;return}
 $("#authMessage").textContent=kind==="signup"&&!result.data.session?"Account created. Check your email to confirm, then sign in.":"Signed in.";
 await refreshSession();
}
$("#signup").addEventListener("click",()=>authAction("signup"));
$("#signin").addEventListener("click",()=>authAction("signin"));
$("#signout").addEventListener("click",async()=>{await supabase.auth.signOut();await refreshSession()});
supabase.auth.onAuthStateChange(()=>refreshSession());
async function health(){
 try{const r=await fetch(SUPABASE_URL+"/functions/v1/gepeto-debate",{method:"GET"});$("#health").textContent=r.status===405?"FUNCTION ONLINE":"CHECK CONFIG"}
 catch{$("#health").textContent="UNREACHABLE"}
}
health();refreshSession();
$("#start").addEventListener("click",async()=>{
 const button=$("#start"),feed=$("#feed"),theme=$("#topic").value.trim();
 if(theme.length<3)return;
 const {data:{session}}=await supabase.auth.getSession();
 if(!session){await refreshSession();return}
 button.disabled=true;button.textContent="Residents are responding…";$("#debateState").textContent="GENERATING";
 feed.innerHTML='<div class="empty">The residents are considering the topic…</div>';
 try{
  const {data,error}=await supabase.functions.invoke("gepeto-debate",{body:{theme}});
  if(error)throw error;
  if(!data||!Array.isArray(data.turns))throw new Error(data?.error||"Unexpected debate response");
  feed.innerHTML=data.turns.map(t=>{const resident=cast.find(c=>c[0]===t.resident_id);return `<article class="speech"><header><strong>${escapeHtml(t.resident_id)}</strong><span>${escapeHtml(t.provider||"OpenRouter")} · ${escapeHtml(t.model||"model")}</span></header><p>${escapeHtml(t.content)}</p></article>`}).join("");
  $("#debateState").textContent="EPISODE "+data.episode.id.slice(0,8).toUpperCase();
 }catch(e){feed.innerHTML='<div class="empty">'+escapeHtml(e.message||"Debate request failed")+'</div>';$("#debateState").textContent="ENGINE ERROR"}
 finally{button.disabled=false;button.textContent="Start a debate"}
});
