import { useCallback, useEffect, useState } from "react";

const STAGES = ["new","qualified","contacted","replied","discovery","proposal","negotiation","won","lost"];
const LABELS = {new:"New lead",qualified:"Qualified",contacted:"Contacted",replied:"Replied",
 discovery:"Discovery call",proposal:"Proposal sent",negotiation:"Negotiation",won:"Won",lost:"Lost"};
const blankLead = {name:"",email:"",phone:"",company:"",service:"",source:"manual",stage:"new"};
async function api(route,options={}) {
 const sending=Boolean(options.method && options.method!=="GET");
 const response=await fetch("/api"+route,{credentials:"same-origin",cache:"no-store",
  ...options,headers:{"Accept":"application/json",...(sending?{"Content-Type":"application/json","X-CRM-Action":"1"}:{}),...options.headers}});
 const body=await response.json().catch(()=>null);
 if(!response.ok||body?.success!==true)throw Error(body?.message||"The CRM could not complete the request.");
 return body;
}
function money(minor,currency) {
 try{
  const nf=new Intl.NumberFormat("en-IN",{style:"currency",currency,maximumFractionDigits:2});
  const digits=new Intl.NumberFormat("en-IN",{style:"currency",currency}).resolvedOptions().maximumFractionDigits;
  return nf.format(minor/Math.pow(10,digits));
 }catch{return currency+" "+minor+" minor units";}
}
function niceDate(value) {return value ? new Date(value).toLocaleString(undefined,{dateStyle:"medium",timeStyle:"short"}) : "Not scheduled";}
function Login({onLogin}) {
 const [email,setEmail]=useState(""),[password,setPassword]=useState("");
 const [pending,setPending]=useState(false),[error,setError]=useState("");
 async function submit(e){
  e.preventDefault();setPending(true);setError("");
  try{const result=await api("/auth/login",{method:"POST",body:JSON.stringify({email,password})});onLogin(result.owner);}
  catch(err){setError(err.message);}finally{setPending(false);}
 }
 return <main className="login-wrap"><div className="login-shell">
  <div className="brand-row"><span className="brand-mark">F<span>+</span>G</span><span>UNIFIED CRM</span></div>
  <p className="eyebrow">PRIVATE OPERATIONS</p><h1>One clear view.<br/><em>Two businesses.</em></h1>
  <p className="login-description">A private workspace for Fazhere opportunities and GymDrobe operations. Access requires an owner account.</p>
  <form className="login-form" onSubmit={submit}>
   <label htmlFor="email">Owner email</label><input id="email" type="email" autoComplete="username" value={email} onChange={e=>setEmail(e.target.value)} required/>
   <label htmlFor="password">Password</label><input id="password" type="password" autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} required/>
   {error&&<p className="error" role="alert">{error}</p>}
   <button type="submit" className="primary" disabled={pending}>{pending?"Verifying…":"Sign in securely"} <span aria-hidden="true">↗</span></button>
  </form><p className="fine-print">No client details are available before authentication.</p>
 </div></main>;
}
function SectionHeader({kicker,title,description}) {
 return <div className="section-header"><div><p className="eyebrow">{kicker}</p><h1>{title}</h1><p>{description}</p></div></div>;
}
function Metric({label,value,description}) {
 return <div className="metric"><p className="metric-label">{label}</p><strong>{value}</strong><small>{description}</small></div>;
}
function Overview({data,onGo}) {
 if(!data)return <p className="subtle">Loading business metrics…</p>;
 const f=data.workspaces.fazhere,g=data.workspaces.gymdrobe;
 const values=Object.entries(f.pipelineValueByCurrency||{});
 return <>
  <SectionHeader kicker="OWNER WORKSPACE" title="Business overview" description="Operational information from verified CRM records. Unconnected sources are never estimated."/>
  <div className="metric-grid">
   <Metric label="Fazhere leads" value={f.leadCount} description="Stored in the CRM database"/>
   <Metric label="Follow-ups overdue" value={f.overdueFollowups} description="Open leads requiring attention"/>
   <Metric label="Open pipeline value" value={values.length ? values.map(([c,n])=>money(n,c)).join(" · ") : "—"} description="Estimated only; not received revenue"/>
   <Metric label="GymDrobe paid sales" value="Not connected" description="Awaiting secure backend integration"/>
  </div>
  <div className="two-column">
   <section className="panel"><div className="panel-title"><div><p className="eyebrow">FAZHERE</p><h2>Sales pipeline</h2></div><button className="text-button" onClick={()=>onGo("leads")}>Open leads →</button></div>
    <div className="stage-bars">{STAGES.map(s=><div className="stage-row" key={s}><span>{LABELS[s]}</span>
     <div className="track"><div className="fill" style={{width:f.leadCount?Math.max(0,f.pipeline[s]/f.leadCount*100)+"%":"0%"}}/></div>
     <b>{f.pipeline[s]}</b></div>)}</div>
    <p className="subtle caption">Pipeline estimates and actual paid revenue are kept separate.</p>
   </section>
   <section className="panel"><div className="panel-title"><div><p className="eyebrow">INTEGRATIONS</p><h2>Connection status</h2></div></div>
    <div className="connection"><span className="connection-dot active"/><span><strong>Fazhere lead database</strong><small>Connected to this CRM workspace</small></span><span className="chip success">Active</span></div>
    <div className="connection"><span className="connection-dot"/><span><strong>GymDrobe backend</strong><small>Order and customer data not synchronized</small></span><span className="chip">Pending</span></div>
    <div className="connection"><span className="connection-dot"/><span><strong>AI automation</strong><small>Disabled until permissions and integrations are configured</small></span><span className="chip">Off</span></div>
   </section>
  </div>
 </>;
}
function Leads({refresh}) {
 const [items,setItems]=useState([]),[total,setTotal]=useState(0);
 const [search,setSearch]=useState(""),[stage,setStage]=useState(""),[page,setPage]=useState(1);
 const [busy,setBusy]=useState(false),[error,setError]=useState(""),[showForm,setShowForm]=useState(false);
 const [draft,setDraft]=useState(blankLead),[saving,setSaving]=useState(false),[selected,setSelected]=useState(null);
 const load=useCallback(async()=>{
  setBusy(true);setError("");
  try{const qs=new URLSearchParams({search,stage,page:String(page),limit:"20"});
   const d=await api("/leads?"+qs.toString());setItems(d.leads);setTotal(d.total);
  }catch(e){setError(e.message);}finally{setBusy(false);}
 },[search,stage,page]);
 useEffect(()=>{load();},[load]);
 async function create(e){
  e.preventDefault();setSaving(true);setError("");
  try{
   await api("/leads",{method:"POST",body:JSON.stringify(draft)});
   setShowForm(false);setDraft(blankLead);setPage(1);await load();await refresh();
  }catch(err){setError(err.message);}finally{setSaving(false);}
 }
 async function patch(lead,values){
  setError("");setSaving(true);
  try{
   const d=await api("/leads/"+lead.id,{method:"PATCH",body:JSON.stringify({...values,expectedRevision:lead.revision})});
   setItems(previous=>previous.map(x=>x.id===lead.id?d.lead:x));
   if(selected?.id===lead.id)setSelected(d.lead);
   await refresh();
  }catch(err){setError(err.message);await load();}finally{setSaving(false);}
 }
 return <>
  <div className="header-actions"><SectionHeader kicker="FAZHERE / SALES" title="Leads & opportunities" description="Keep every enquiry, deal stage and follow-up in one place."/>
   <button className="primary" onClick={()=>setShowForm(true)}>+ New lead</button></div>
  <section className="panel">
   <div className="toolbar"><label className="search-box"><span className="sr-only">Search leads</span>
    <input value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}} placeholder="Search name, company or email"/></label>
    <label className="filter-box"><span className="sr-only">Stage filter</span><select value={stage} onChange={e=>{setStage(e.target.value);setPage(1);}}>
     <option value="">All stages</option>{STAGES.map(s=><option key={s} value={s}>{LABELS[s]}</option>)}</select></label>
    <span className="results-count">{total} actual records</span>
   </div>
   {error&&<p className="error" role="alert">{error}</p>}
   <div className="table-scroll"><table><thead><tr><th>Contact</th><th>Service</th><th>Stage</th><th>Source</th><th>Follow-up</th><th>Details</th></tr></thead>
    <tbody>{items.map(lead=><tr key={lead.id}><td><strong>{lead.name}</strong><small>{lead.company||lead.email||lead.phone}</small></td>
     <td>{lead.service||"—"}</td><td><select aria-label={"Stage for "+lead.name} value={lead.stage} disabled={saving} onChange={e=>patch(lead,{stage:e.target.value})}>{STAGES.map(s=><option value={s} key={s}>{LABELS[s]}</option>)}</select></td>
     <td><span className="chip">{lead.source}</span></td><td>{niceDate(lead.nextFollowupAt)}</td>
     <td><button className="text-button" onClick={()=>setSelected(lead)}>View / edit</button></td></tr>)}</tbody></table></div>
   {!busy && !items.length&&<div className="empty"><strong>No leads match these filters.</strong><p>Add a real contact or adjust the search. No sample leads are inserted.</p></div>}
   <div className="pager"><span>{busy?"Loading…":"Page "+page+" of "+Math.max(1,Math.ceil(total/20))}</span>
    <div><button disabled={page===1||busy} onClick={()=>setPage(p=>p-1)}>Previous</button><button disabled={page*20>=total||busy} onClick={()=>setPage(p=>p+1)}>Next</button></div></div>
  </section>
  {showForm&&<div className="modal-backdrop" role="presentation"><section className="modal" role="dialog" aria-modal="true" aria-labelledby="add-title">
   <div className="modal-top"><h2 id="add-title">Create a lead</h2><button aria-label="Close" onClick={()=>setShowForm(false)}>✕</button></div>
   <form onSubmit={create} className="lead-form">
    {[
     ["name","Name *","text"],["email","Email","email"],["phone","Phone","tel"],["company","Company","text"],["service","Required service","text"]
    ].map(([key,label,type])=><label key={key}>{label}<input type={type} value={draft[key]} maxLength={key==="email"?254:150} onChange={e=>setDraft(v=>({...v,[key]:e.target.value}))} required={key==="name"}/></label>)}
    <div className="form-two"><label>Source<select value={draft.source} onChange={e=>setDraft(v=>({...v,source:e.target.value}))}>
     {["manual","website","referral","linkedin","email","other"].map(s=><option key={s}>{s}</option>)}</select></label>
     <label>Stage<select value={draft.stage} onChange={e=>setDraft(v=>({...v,stage:e.target.value}))}>{STAGES.map(s=><option key={s} value={s}>{LABELS[s]}</option>)}</select></label></div>
    <p className="subtle caption">Use a genuine contact with permission to retain their details. Email or phone is required.</p>
    <div className="form-actions"><button type="button" onClick={()=>setShowForm(false)}>Cancel</button><button disabled={saving} className="primary">{saving?"Saving…":"Create lead"}</button></div>
   </form></section></div>}
  {selected&&<div className="modal-backdrop" role="presentation"><section className="modal" role="dialog" aria-modal="true" aria-labelledby="detail-title">
   <div className="modal-top"><h2 id="detail-title">{selected.name}</h2><button aria-label="Close" onClick={()=>setSelected(null)}>✕</button></div>
   <p className="subtle">Contact: {selected.email||selected.phone||"—"}</p>
   <p className="subtle">Last updated: {niceDate(selected.updatedAt)}</p>
   <label className="field">Notes<textarea rows={5} maxLength={4000} value={selected.notes} onChange={e=>setSelected(v=>({...v,notes:e.target.value}))}/></label>
   <label className="field">Next follow-up<input type="datetime-local" value={selected.nextFollowupAt?new Date(new Date(selected.nextFollowupAt).getTime()-new Date().getTimezoneOffset()*60000).toISOString().slice(0,16):""}
    onChange={e=>setSelected(v=>({...v,nextFollowupAt:e.target.value?new Date(e.target.value).toISOString():null}))}/></label>
   <div className="form-actions"><button onClick={()=>setSelected(null)}>Close</button><button className="primary" disabled={saving} onClick={()=>patch(selected,{notes:selected.notes,nextFollowupAt:selected.nextFollowupAt})}>Save changes</button></div>
  </section></div>}
 </>;
}
function ComingSoon({type}) {
 const gym=type==="gymdrobe";
 return <><SectionHeader kicker={gym?"GYMDROBE / OPERATIONS":"AI / AUTOMATION"} title={gym?"Commerce workspace":"Automation command center"}
  description={gym?"A secure read-only integration with the existing GymDrobe backend is required.":"Human-supervised workflows will be enabled only after approved integrations and controls are configured."}/>
  <div className="panel unavailable"><span className="chip">Not connected</span><h2>{gym?"No orders or customer data imported":"All AI agents are currently disabled"}</h2>
   <p>{gym?"Orders, payments, suppliers and customer data remain in GymDrobe's original backend. This CRM does not manufacture numbers or access its private APIs without authorization.":
   "No automated messages, refunds or financial actions can run. The next phase will add permission-scoped agents, audit logs, approvals and an emergency stop."}</p></div></>;
}
export default function App(){
 const [user,setUser]=useState(null),[ready,setReady]=useState(false),[section,setSection]=useState("overview");
 const [overview,setOverview]=useState(null),[error,setError]=useState("");
 const refresh=useCallback(async()=>{
  try{const result=await api("/overview");setOverview(result);setError("");}
  catch(e){setError(e.message);}
 },[]);
 useEffect(()=>{let active=true;api("/auth/me").then(d=>{if(active)setUser(d.owner);}).catch(()=>{}).finally(()=>{if(active)setReady(true);});return()=>{active=false;};},[]);
 useEffect(()=>{if(user)refresh();},[user,refresh]);
 async function logout(){try{await api("/auth/logout",{method:"POST"});}finally{setUser(null);setOverview(null);}}
 if(!ready)return <div className="loading">Checking private workspace…</div>;
 if(!user)return <Login onLogin={setUser}/>;
 const navigation=[["overview","Overview","◫"],["leads","Fazhere leads","↗"],["gymdrobe","GymDrobe","▤"],["automation","AI automation","✳"]];
 return <div className="app-shell"><aside className="sidebar">
  <div className="sidebar-brand"><span className="brand-mark">F<span>+</span>G</span><div><strong>Unified CRM</strong><small>Owner workspace</small></div></div>
  <p className="nav-label">WORKSPACE</p><nav aria-label="CRM main navigation">{navigation.map(([id,name,icon])=>
   <button key={id} className={"nav-item "+(section===id?"selected":"")} onClick={()=>setSection(id)} aria-current={section===id?"page":undefined}><span aria-hidden="true">{icon}</span>{name}</button>)}</nav>
  <div className="sidebar-footer"><span className="online-dot"/>Private workspace <small>{user.email}</small></div>
 </aside>
 <div className="app-main"><header className="topbar"><div className="breadcrumb">FAZHERE <span>/</span> GYMDROBE <span>/</span> CRM</div><div className="top-right"><span className="environment">PRIVATE</span><button onClick={logout}>Sign out</button></div></header>
  <main className="main-content">{error&&<p className="error" role="alert">{error}</p>}
   {section==="overview"&&<Overview data={overview} onGo={setSection}/>}
   {section==="leads"&&<Leads refresh={refresh}/>}
   {section==="gymdrobe"&&<ComingSoon type="gymdrobe"/>}
   {section==="automation"&&<ComingSoon type="automation"/>}
  </main>
  <footer className="site-footer">Fazhere × GymDrobe · Private CRM · Figures reflect connected sources only.</footer>
 </div></div>;
}
