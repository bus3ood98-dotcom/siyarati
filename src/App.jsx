import { useState } from "react";

const INITIAL_VEHICLES = [
  {
    id:1, name:"لاندكروزر الأبيض", make:"Toyota", model:"Land Cruiser", year:2020,
    plate:"١٢٣٤ بح", color:"أبيض", purchaseDate:"2020-03-15", purchasePrice:14500,
    odometer:87430, odometerUpdated:"2026-06-01", dailyKmRate:28,
    maintenance:[
      {id:1,name:"زيت المحرك",category:"oil",lastDate:"2026-03-12",lastOdo:82000,dueDate:"2026-09-12",dueOdo:92000,type:"both",cost:20},
      {id:2,name:"فلتر الهواء",category:"filter",lastDate:"2025-01-10",lastOdo:65000,dueDate:"2026-01-10",dueOdo:85000,type:"both",cost:8},
      {id:3,name:"التأمين",category:"insurance",lastDate:"2025-06-10",lastOdo:null,dueDate:"2026-06-10",dueOdo:null,type:"date",cost:120},
      {id:4,name:"الفحص الفني",category:"inspection",lastDate:"2025-05-20",lastOdo:null,dueDate:"2026-05-20",dueOdo:null,type:"date",cost:15},
      {id:5,name:"التواير",category:"tires",lastDate:"2024-08-01",lastOdo:60000,dueDate:"2027-08-01",dueOdo:100000,type:"both",cost:180},
    ],
    logs:[
      {id:1,service:"تغيير زيت",date:"2026-03-12",odo:82000,cost:20,workshop:"نجم الخليج",notes:""},
      {id:2,service:"تبديل بطارية",date:"2025-11-05",odo:76000,cost:45,workshop:"بطاريات الخبر",notes:"Bosch 70A"},
      {id:3,service:"تغيير تواير",date:"2024-08-01",odo:60000,cost:180,workshop:"العجلة الذهبية",notes:"Michelin"},
    ],
  },
  {
    id:2, name:"كامري الفضي", make:"Toyota", model:"Camry", year:2022,
    plate:"٥٦٧٨ بح", color:"فضي", purchaseDate:"2022-07-01", purchasePrice:8900,
    odometer:41200, odometerUpdated:"2026-05-20", dailyKmRate:18,
    maintenance:[
      {id:1,name:"زيت المحرك",category:"oil",lastDate:"2026-01-15",lastOdo:38000,dueDate:"2026-07-15",dueOdo:48000,type:"both",cost:18},
      {id:2,name:"التأمين",category:"insurance",lastDate:"2025-06-23",lastOdo:null,dueDate:"2026-06-23",dueOdo:null,type:"date",cost:95},
      {id:3,name:"الفحص الفني",category:"inspection",lastDate:"2026-04-10",lastOdo:null,dueDate:"2027-04-10",dueOdo:null,type:"date",cost:15},
    ],
    logs:[
      {id:1,service:"تغيير زيت",date:"2026-01-15",odo:38000,cost:18,workshop:"تويوتا البحرين",notes:""},
      {id:2,service:"تجديد تأمين",date:"2025-06-23",odo:29000,cost:95,workshop:"",notes:"بوليصة شاملة"},
    ],
  },
];

const SC = {
  ok:      {bg:"#D1FAE5",text:"#065F46",dot:"#10B981",label:"ممتاز"},
  upcoming:{bg:"#FEF3C7",text:"#92400E",dot:"#F59E0B",label:"قريب"},
  overdue: {bg:"#FEE2E2",text:"#991B1B",dot:"#EF4444",label:"متأخر"},
};
const MI = {oil:"🛢️",filter:"🌀",tires:"🔄",battery:"🔋",insurance:"📋",inspection:"🔍",custom:"🔧",brake:"⛔",gearbox:"⚙️"};
const HC = h => h>=85?"#10B981":h>=65?"#F59E0B":"#EF4444";
const EMOJIS = ["🚗","🚙","🚘","🏎️","🛻","🚐"];

function iStatus(m,odo,rate){
  const today=new Date(); let od=false,up=false;
  if(m.dueDate){const d=new Date(m.dueDate),diff=Math.ceil((d-today)/86400000); if(diff<0)od=true; else if(diff<=30)up=true;}
  if(m.dueOdo&&odo){const rem=m.dueOdo-odo,days=rate>0?rem/rate:999; if(rem<0)od=true; else if(days<=30||rem<=1000)up=true;}
  return od?"overdue":up?"upcoming":"ok";
}
function iDays(m,odo,rate){
  let min=Infinity;
  if(m.dueDate){const diff=Math.ceil((new Date(m.dueDate)-new Date())/86400000); min=Math.min(min,diff);}
  if(m.dueOdo&&odo&&rate>0){min=Math.min(min,Math.ceil((m.dueOdo-odo)/rate));}
  return min===Infinity?999:min;
}
function health(v){
  if(!v.maintenance.length)return 100;
  const e=eOdo(v);
  const avg=v.maintenance.map(m=>{const s=iStatus(m,e,v.dailyKmRate); return s==="overdue"?0:s==="upcoming"?60:100;}).reduce((a,b)=>a+b,0)/v.maintenance.length;
  const days=Math.ceil((new Date()-new Date(v.odometerUpdated))/86400000);
  return Math.round(avg*0.85+(days<=30?100:days<=60?70:40)*0.15);
}
function eOdo(v){
  const days=Math.floor((new Date()-new Date(v.odometerUpdated))/86400000);
  return v.odometer+Math.round(days*v.dailyKmRate);
}
function tCost(logs){return logs.reduce((s,l)=>s+(l.cost||0),0);}
function yCost(logs){const y=new Date().getFullYear(); return logs.filter(l=>new Date(l.date).getFullYear()===y).reduce((s,l)=>s+(l.cost||0),0);}
function mCost(logs){const n=new Date(); return logs.filter(l=>{const d=new Date(l.date); return d.getFullYear()===n.getFullYear()&&d.getMonth()===n.getMonth();}).reduce((s,l)=>s+(l.cost||0),0);}
function fDate(d){if(!d)return"—"; return new Date(d).toLocaleDateString("ar-BH",{year:"numeric",month:"short",day:"numeric"});}
function dText(d){return d<0?`متأخر ${Math.abs(d)} يوم`:d===0?"اليوم!":d>365?`بعد ${Math.round(d/30)} شهر`:`بعد ${d} يوم`;}

const css = `
@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@300;400;500;600;700&display=swap');
*{box-sizing:border-box;margin:0;padding:0;}
body{font-family:'IBM Plex Sans Arabic',sans-serif;direction:rtl;background:#0F172A;color:#F1F5F9;}
:root{--bg:#0F172A;--surface:#1E293B;--surface2:#263347;--border:#334155;--accent:#3B82F6;--accent2:#6366F1;--green:#10B981;--yellow:#F59E0B;--red:#EF4444;--text:#F1F5F9;--muted:#94A3B8;}
.app{min-height:100vh;background:var(--bg);}
.nav{position:sticky;top:0;z-index:100;background:rgba(15,23,42,0.92);backdrop-filter:blur(16px);border-bottom:1px solid var(--border);padding:0 20px;height:60px;display:flex;align-items:center;justify-content:space-between;}
.nav-logo{font-size:20px;font-weight:700;color:var(--accent);}
.nav-tabs{display:flex;gap:4px;}
.nav-tab{padding:6px 14px;border-radius:8px;border:none;cursor:pointer;font-size:13px;font-family:inherit;font-weight:500;transition:all 0.2s;background:transparent;color:var(--muted);}
.nav-tab.active{background:var(--accent);color:white;}
.nav-tab:hover:not(.active){background:var(--surface2);color:var(--text);}
.page{max-width:900px;margin:0 auto;padding:24px 16px;}
.stats-row{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:24px;}
.stat-card{background:var(--surface);border:1px solid var(--border);border-radius:16px;padding:20px;text-align:center;}
.stat-card .num{font-size:32px;font-weight:700;line-height:1;margin-bottom:6px;}
.stat-card .lbl{font-size:12px;color:var(--muted);}
.sec-title{font-size:13px;font-weight:600;color:var(--muted);letter-spacing:0.05em;margin-bottom:12px;}
.alert-cards{display:flex;flex-direction:column;gap:10px;margin-bottom:28px;}
.alert-card{background:var(--surface);border:1px solid var(--border);border-radius:14px;padding:14px 16px;display:flex;align-items:center;gap:14px;cursor:pointer;transition:all 0.2s;}
.alert-card:hover{border-color:var(--accent);}
.alert-dot{width:10px;height:10px;border-radius:50%;flex-shrink:0;}
.alert-info{flex:1;}
.alert-car{font-size:14px;font-weight:600;}
.alert-detail{font-size:12px;color:var(--muted);margin-top:2px;}
.alert-badge{font-size:11px;font-weight:600;padding:3px 10px;border-radius:20px;}
.vgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:16px;}
.vcard{background:var(--surface);border:1px solid var(--border);border-radius:18px;overflow:hidden;cursor:pointer;transition:all 0.25s;}
.vcard:hover{border-color:var(--accent);transform:translateY(-3px);box-shadow:0 8px 32px rgba(59,130,246,0.15);}
.vc-hdr{padding:20px 20px 16px;position:relative;}
.vc-emoji{font-size:40px;margin-bottom:12px;display:block;}
.vc-name{font-size:17px;font-weight:700;margin-bottom:4px;}
.vc-sub{font-size:12px;color:var(--muted);}
.vc-ring{position:absolute;top:20px;left:20px;width:52px;height:52px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;border:3px solid;}
.vc-body{padding:0 20px 20px;display:flex;flex-direction:column;gap:8px;}
.vc-row{display:flex;justify-content:space-between;font-size:13px;}
.vc-row .k{color:var(--muted);}
.vc-row .v{font-weight:600;}
.vc-foot{border-top:1px solid var(--border);padding:12px 20px;display:flex;gap:8px;flex-wrap:wrap;}
.tag{font-size:11px;padding:3px 10px;border-radius:20px;font-weight:500;}
.back-btn{background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:8px 16px;cursor:pointer;font-family:inherit;font-size:13px;color:var(--text);margin-bottom:20px;display:inline-flex;align-items:center;gap:6px;transition:all 0.2s;}
.back-btn:hover{border-color:var(--accent);}
.dhero{background:linear-gradient(135deg,var(--surface),var(--surface2));border:1px solid var(--border);border-radius:20px;padding:24px;margin-bottom:20px;}
.dhero-top{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:20px;}
.dtitle{font-size:24px;font-weight:700;}
.dsub{font-size:14px;color:var(--muted);margin-top:4px;}
.hcircle{width:80px;height:80px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-direction:column;border:4px solid;margin:0 auto 6px;}
.hcircle .pct{font-size:20px;font-weight:800;}
.htext{font-size:11px;color:var(--muted);text-align:center;}
.dstats{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;}
.ds{background:rgba(255,255,255,0.04);border-radius:12px;padding:14px;text-align:center;}
.ds .dv{font-size:18px;font-weight:700;margin-bottom:4px;}
.ds .dk{font-size:11px;color:var(--muted);}
.tab-bar{display:flex;gap:4px;margin-bottom:20px;background:var(--surface);border-radius:12px;padding:4px;border:1px solid var(--border);}
.tab-btn{flex:1;padding:8px;border-radius:8px;border:none;cursor:pointer;font-family:inherit;font-size:13px;font-weight:500;transition:all 0.2s;background:transparent;color:var(--muted);}
.tab-btn.active{background:var(--accent);color:white;}
.mlist{display:flex;flex-direction:column;gap:10px;}
.mitem{background:var(--surface);border:1px solid var(--border);border-radius:14px;padding:14px 16px;display:flex;align-items:center;gap:14px;}
.micon{font-size:24px;width:44px;height:44px;background:var(--surface2);border-radius:10px;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
.minfo{flex:1;}
.mname{font-size:14px;font-weight:600;margin-bottom:4px;}
.mdetail{font-size:12px;color:var(--muted);}
.sbadge{font-size:11px;font-weight:600;padding:4px 12px;border-radius:20px;}
.llist{display:flex;flex-direction:column;gap:10px;}
.litem{background:var(--surface);border:1px solid var(--border);border-radius:14px;padding:14px 16px;display:flex;justify-content:space-between;align-items:center;}
.lname{font-size:14px;font-weight:600;margin-bottom:4px;}
.lmeta{font-size:12px;color:var(--muted);}
.lcost{font-size:16px;font-weight:700;color:var(--green);}
.lodo{font-size:11px;color:var(--muted);margin-top:2px;}
.scards{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:24px;}
.sc{background:var(--surface);border:1px solid var(--border);border-radius:14px;padding:16px;text-align:center;}
.sc .sv{font-size:20px;font-weight:700;color:var(--green);margin-bottom:4px;}
.sc .sk{font-size:12px;color:var(--muted);}
.barchart{background:var(--surface);border:1px solid var(--border);border-radius:16px;padding:20px;margin-bottom:16px;}
.barchart h3{font-size:14px;font-weight:600;margin-bottom:16px;color:var(--muted);}
.bar-row{display:flex;align-items:center;gap:12px;margin-bottom:12px;font-size:13px;}
.bar-lbl{width:100px;text-align:right;color:var(--muted);flex-shrink:0;}
.bar-track{flex:1;background:var(--surface2);border-radius:4px;height:8px;overflow:hidden;}
.bar-fill{height:100%;border-radius:4px;background:linear-gradient(90deg,#3B82F6,#6366F1);}
.bar-val{width:60px;text-align:left;font-weight:600;font-size:12px;color:var(--accent);}
.ftable{background:var(--surface);border:1px solid var(--border);border-radius:16px;overflow:hidden;margin-top:8px;}
.ft-row{display:flex;padding:12px 16px;border-bottom:1px solid var(--border);font-size:13px;align-items:center;}
.ft-row:last-child{border-bottom:none;}
.ft-hdr{background:var(--surface2);font-size:12px;color:var(--muted);font-weight:600;}
.ft-row>*{flex:1;}
.ft-cost{color:var(--yellow);font-weight:600;text-align:left;}
.cgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:12px;}
.ccard{background:var(--surface);border:1px solid var(--border);border-radius:14px;padding:16px;}
.ccard h4{font-size:14px;font-weight:700;margin-bottom:12px;}
.crow{display:flex;justify-content:space-between;font-size:12px;margin-bottom:8px;}
.crow .ck{color:var(--muted);}
.crow .cv{font-weight:600;}
.overlay{position:fixed;inset:0;background:rgba(0,0,0,0.75);backdrop-filter:blur(8px);z-index:200;display:flex;align-items:center;justify-content:center;padding:20px;}
.modal{background:var(--surface);border:1px solid var(--border);border-radius:20px;padding:24px;width:100%;max-width:480px;max-height:90vh;overflow-y:auto;}
.modal h2{font-size:18px;font-weight:700;margin-bottom:20px;}
.fg{margin-bottom:16px;}
.fl{font-size:12px;color:var(--muted);font-weight:500;margin-bottom:6px;display:block;}
.fi{width:100%;background:var(--surface2);border:1px solid var(--border);border-radius:10px;padding:10px 14px;color:var(--text);font-family:inherit;font-size:14px;direction:rtl;transition:border-color 0.2s;}
.fi:focus{outline:none;border-color:var(--accent);}
.frow{display:grid;grid-template-columns:1fr 1fr;gap:12px;}
.btn{padding:10px 20px;border-radius:10px;border:none;cursor:pointer;font-family:inherit;font-size:14px;font-weight:600;transition:all 0.2s;}
.btn-p{background:var(--accent);color:white;}
.btn-p:hover{background:#2563EB;}
.btn-s{background:var(--surface2);color:var(--text);border:1px solid var(--border);}
.btn-s:hover{border-color:var(--accent);}
.btn-d{background:#7F1D1D;color:#FCA5A5;border:1px solid #EF4444;}
.btn-d:hover{background:#EF4444;color:white;}
.mfoot{display:flex;gap:10px;margin-top:20px;}
.fab{position:fixed;bottom:28px;left:28px;z-index:50;width:56px;height:56px;border-radius:50%;background:linear-gradient(135deg,var(--accent),var(--accent2));border:none;cursor:pointer;font-size:24px;color:white;box-shadow:0 4px 24px rgba(99,102,241,0.4);transition:all 0.2s;display:flex;align-items:center;justify-content:center;}
.fab:hover{transform:scale(1.1);}
.empty{text-align:center;padding:60px 20px;}
.empty .ei{font-size:64px;margin-bottom:16px;}
.empty .et{font-size:20px;font-weight:700;margin-bottom:8px;}
.empty .es{font-size:14px;color:var(--muted);margin-bottom:24px;}
@media(max-width:600px){
  .stats-row,.dstats,.scards{grid-template-columns:repeat(2,1fr);}
  .frow{grid-template-columns:1fr;}
  .vgrid{grid-template-columns:1fr;}
  .nav-tab{padding:5px 10px;font-size:12px;}
}
`;

function ModalAddVehicle({ nv, setNv, onSave, onClose }) {
  return (
    <div className="overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal">
        <h2>🚗 إضافة سيارة جديدة</h2>
        <div className="fg"><label className="fl">الاسم المخصص *</label><input className="fi" placeholder="مثال: لاندكروزر الأبيض" value={nv.name} onChange={e=>setNv(p=>({...p,name:e.target.value}))}/></div>
        <div className="frow">
          <div className="fg"><label className="fl">الشركة المصنعة</label><input className="fi" placeholder="Toyota" value={nv.make} onChange={e=>setNv(p=>({...p,make:e.target.value}))}/></div>
          <div className="fg"><label className="fl">الموديل</label><input className="fi" placeholder="Land Cruiser" value={nv.model} onChange={e=>setNv(p=>({...p,model:e.target.value}))}/></div>
        </div>
        <div className="frow">
          <div className="fg"><label className="fl">سنة الصنع</label><input className="fi" type="number" placeholder="2022" value={nv.year} onChange={e=>setNv(p=>({...p,year:e.target.value}))}/></div>
          <div className="fg"><label className="fl">رقم اللوحة</label><input className="fi" placeholder="١٢٣٤ بح" value={nv.plate} onChange={e=>setNv(p=>({...p,plate:e.target.value}))}/></div>
        </div>
        <div className="frow">
          <div className="fg"><label className="fl">اللون</label><input className="fi" placeholder="أبيض" value={nv.color} onChange={e=>setNv(p=>({...p,color:e.target.value}))}/></div>
          <div className="fg"><label className="fl">سعر الشراء (د.ب)</label><input className="fi" type="number" placeholder="12000" value={nv.purchasePrice} onChange={e=>setNv(p=>({...p,purchasePrice:e.target.value}))}/></div>
        </div>
        <div className="frow">
          <div className="fg"><label className="fl">تاريخ الشراء</label><input className="fi" type="date" value={nv.purchaseDate} onChange={e=>setNv(p=>({...p,purchaseDate:e.target.value}))}/></div>
          <div className="fg"><label className="fl">قراءة العداد (كم) *</label><input className="fi" type="number" placeholder="45000" value={nv.odometer} onChange={e=>setNv(p=>({...p,odometer:e.target.value}))}/></div>
        </div>
        <div className="mfoot">
          <button className="btn btn-p" onClick={onSave}>إضافة السيارة</button>
          <button className="btn btn-s" onClick={onClose}>إلغاء</button>
        </div>
      </div>
    </div>
  );
}

function ModalAddLog({ nl, setNl, onSave, onClose }) {
  return (
    <div className="overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal">
        <h2>🔧 تسجيل صيانة</h2>
        <div className="fg"><label className="fl">نوع العمل *</label><input className="fi" placeholder="مثال: تغيير زيت" value={nl.service} onChange={e=>setNl(p=>({...p,service:e.target.value}))}/></div>
        <div className="frow">
          <div className="fg"><label className="fl">التاريخ *</label><input className="fi" type="date" value={nl.date} onChange={e=>setNl(p=>({...p,date:e.target.value}))}/></div>
          <div className="fg"><label className="fl">قراءة العداد (كم)</label><input className="fi" type="number" placeholder="87500" value={nl.odo} onChange={e=>setNl(p=>({...p,odo:e.target.value}))}/></div>
        </div>
        <div className="frow">
          <div className="fg"><label className="fl">التكلفة (د.ب)</label><input className="fi" type="number" placeholder="25" value={nl.cost} onChange={e=>setNl(p=>({...p,cost:e.target.value}))}/></div>
          <div className="fg"><label className="fl">الورشة</label><input className="fi" placeholder="اسم الورشة" value={nl.workshop} onChange={e=>setNl(p=>({...p,workshop:e.target.value}))}/></div>
        </div>
        <div className="fg"><label className="fl">ملاحظات</label><input className="fi" placeholder="أي تفاصيل..." value={nl.notes} onChange={e=>setNl(p=>({...p,notes:e.target.value}))}/></div>
        <div className="mfoot">
          <button className="btn btn-p" onClick={onSave}>حفظ</button>
          <button className="btn btn-s" onClick={onClose}>إلغاء</button>
        </div>
      </div>
    </div>
  );
}

function ModalOdo({ sv, nOdo, setNOdo, onSave, onClose }) {
  return (
    <div className="overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal">
        <h2>📍 تحديث العداد</h2>
        <div style={{background:"#263347",borderRadius:12,padding:14,marginBottom:16,fontSize:13,color:"#94A3B8"}}>
          المسجّل: <strong style={{color:"#F1F5F9"}}>{sv?.odometer.toLocaleString("ar")} كم</strong><br/>
          التقدير اليوم: <strong style={{color:"#3B82F6"}}>{sv?eOdo(sv).toLocaleString("ar"):""} كم</strong>
        </div>
        <div className="fg"><label className="fl">القراءة الجديدة (كم)</label><input className="fi" type="number" placeholder="أدخل القراءة الحالية" value={nOdo} onChange={e=>setNOdo(e.target.value)} autoFocus/></div>
        <div className="mfoot">
          <button className="btn btn-p" onClick={onSave}>تحديث</button>
          <button className="btn btn-s" onClick={onClose}>إلغاء</button>
        </div>
      </div>
    </div>
  );
}

function ModalConfirm({ vehicle, onConfirm, onClose }) {
  return (
    <div className="overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal" style={{maxWidth:360,textAlign:"center",borderColor:"#EF4444"}}>
        <div style={{fontSize:48,marginBottom:12}}>🗑️</div>
        <div style={{fontSize:18,fontWeight:700,marginBottom:8}}>حذف السيارة؟</div>
        <div style={{fontSize:13,color:"#94A3B8",marginBottom:24,lineHeight:1.6}}>
          بتحذف <strong style={{color:"#F1F5F9"}}>{vehicle?.name}</strong> مع كل سجل الصيانة.<br/>لا يمكن التراجع عن هذا الإجراء.
        </div>
        <div style={{display:"flex",gap:10,justifyContent:"center"}}>
          <button className="btn btn-d" onClick={onConfirm}>نعم، احذف</button>
          <button className="btn btn-s" onClick={onClose}>إلغاء</button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [vehicles, setVehicles] = useState(INITIAL_VEHICLES);
  const [page, setPage] = useState("dashboard");
  const [selId, setSelId] = useState(null);
  const [dtab, setDtab] = useState("maintenance");
  const [showAV, setShowAV] = useState(false);
  const [showAL, setShowAL] = useState(false);
  const [showOdo, setShowOdo] = useState(false);
  const [confirmDel, setConfirmDel] = useState(null);
  const [nv, setNv] = useState({name:"",make:"",model:"",year:"",plate:"",color:"",purchaseDate:"",purchasePrice:"",odometer:""});
  const [nl, setNl] = useState({service:"",date:"",odo:"",cost:"",workshop:"",notes:""});
  const [nOdo, setNOdo] = useState("");

  const sv = selId ? vehicles.find(v=>v.id===selId) : null;

  const alerts = [];
  vehicles.forEach(v=>{
    const e=eOdo(v);
    v.maintenance.forEach(m=>{
      const s=iStatus(m,e,v.dailyKmRate);
      if(s!=="ok") alerts.push({vid:v.id,vname:v.name,iname:m.name,status:s,days:iDays(m,e,v.dailyKmRate)});
    });
  });
  alerts.sort((a,b)=>a.days-b.days);

  function saveVehicle(){
    if(!nv.name||!nv.odometer)return;
    setVehicles(p=>[...p,{id:Date.now(),...nv,odometer:parseInt(nv.odometer)||0,purchasePrice:parseFloat(nv.purchasePrice)||0,odometerUpdated:new Date().toISOString().split("T")[0],dailyKmRate:20,maintenance:[],logs:[]}]);
    setShowAV(false);
    setNv({name:"",make:"",model:"",year:"",plate:"",color:"",purchaseDate:"",purchasePrice:"",odometer:""});
  }
  function saveLog(){
    if(!nl.service||!nl.date||!sv)return;
    setVehicles(p=>p.map(v=>v.id===sv.id?{...v,logs:[{id:Date.now(),...nl,odo:parseInt(nl.odo)||0,cost:parseFloat(nl.cost)||0},...v.logs]}:v));
    setShowAL(false);
    setNl({service:"",date:"",odo:"",cost:"",workshop:"",notes:""});
  }
  function saveOdo(){
    const val=parseInt(nOdo); if(!val||!sv||val<=sv.odometer)return;
    const days=Math.max(1,Math.ceil((new Date()-new Date(sv.odometerUpdated))/86400000));
    setVehicles(p=>p.map(v=>v.id===sv.id?{...v,odometer:val,odometerUpdated:new Date().toISOString().split("T")[0],dailyKmRate:Math.round((val-sv.odometer)/days)}:v));
    setShowOdo(false); setNOdo("");
  }
  function deleteVehicle(){
    setVehicles(p=>p.filter(v=>v.id!==confirmDel.id));
    setConfirmDel(null); setSelId(null); setPage("dashboard");
  }
  function goVehicle(id){setSelId(id);setPage("detail");setDtab("maintenance");}

  const overdueCount=vehicles.filter(v=>{const e=eOdo(v); return v.maintenance.some(m=>iStatus(m,e,v.dailyKmRate)==="overdue");}).length;
  const upcomingCount=vehicles.filter(v=>{const e=eOdo(v); return v.maintenance.some(m=>iStatus(m,e,v.dailyKmRate)==="upcoming")&&!v.maintenance.some(m=>iStatus(m,e,v.dailyKmRate)==="overdue");}).length;

  function Dashboard(){
    return (
      <div className="page">
        <div className="stats-row">
          <div className="stat-card"><div className="num" style={{color:"#3B82F6"}}>{vehicles.length}</div><div className="lbl">سياراتك</div></div>
          <div className="stat-card"><div className="num" style={{color:"#EF4444"}}>{overdueCount}</div><div className="lbl">تحتاج عناية فورية</div></div>
          <div className="stat-card"><div className="num" style={{color:"#F59E0B"}}>{upcomingCount}</div><div className="lbl">قادمة قريباً</div></div>
        </div>
        {alerts.length>0&&<>
          <div className="sec-title">⚠️ تنبيهات</div>
          <div className="alert-cards">
            {alerts.slice(0,5).map((a,i)=>{
              const cfg=SC[a.status];
              return <div key={i} className="alert-card" onClick={()=>goVehicle(a.vid)}>
                <div className="alert-dot" style={{background:cfg.dot}}/>
                <div className="alert-info"><div className="alert-car">{a.vname}</div><div className="alert-detail">{a.iname} — {dText(a.days)}</div></div>
                <div className="alert-badge" style={{background:cfg.bg,color:cfg.text}}>{cfg.label}</div>
              </div>;
            })}
          </div>
        </>}
        <div className="sec-title">🚗 سياراتك</div>
        <div className="vgrid">
          {vehicles.map(v=>{
            const h=health(v),hc=HC(h),e=eOdo(v);
            const od=v.maintenance.filter(m=>iStatus(m,e,v.dailyKmRate)==="overdue").length;
            const up=v.maintenance.filter(m=>iStatus(m,e,v.dailyKmRate)==="upcoming").length;
            return <div key={v.id} className="vcard" onClick={()=>goVehicle(v.id)}>
              <div className="vc-hdr">
                <span className="vc-emoji">{EMOJIS[v.id%EMOJIS.length]}</span>
                <div className="vc-name">{v.name}</div>
                <div className="vc-sub">{v.make} {v.model} — {v.year}</div>
                <div className="vc-ring" style={{borderColor:hc,color:hc}}>{h}%</div>
              </div>
              <div className="vc-body">
                <div className="vc-row"><span className="k">العداد (تقدير)</span><span className="v">{e.toLocaleString("ar")} كم</span></div>
                <div className="vc-row"><span className="k">اللوحة</span><span className="v">{v.plate}</span></div>
                <div className="vc-row"><span className="k">مصروف هذه السنة</span><span className="v" style={{color:"#10B981"}}>{yCost(v.logs)} د.ب</span></div>
              </div>
              <div className="vc-foot">
                {od>0&&<span className="tag" style={{background:"#FEE2E2",color:"#991B1B"}}>⛔ {od} متأخرة</span>}
                {up>0&&<span className="tag" style={{background:"#FEF3C7",color:"#92400E"}}>⚠️ {up} قادمة</span>}
                {od===0&&up===0&&<span className="tag" style={{background:"#D1FAE5",color:"#065F46"}}>✅ ممتاز</span>}
              </div>
            </div>;
          })}
        </div>
        <button className="fab" onClick={()=>setShowAV(true)}>+</button>
      </div>
    );
  }

  function Detail(){
    if(!sv)return null;
    const h=health(sv),hc=HC(h),e=eOdo(sv);
    const hlbl=h>=85?"ممتاز":h>=65?"يحتاج اهتمام":"تحذير";
    const forecast=sv.maintenance.filter(m=>iDays(m,e,sv.dailyKmRate)<=90).map(m=>({name:m.name,days:iDays(m,e,sv.dailyKmRate),cost:m.cost||0}));
    const fTotal=forecast.reduce((s,f)=>s+f.cost,0);
    const bycat={};
    sv.logs.forEach(l=>{bycat[l.service]=(bycat[l.service]||0)+(l.cost||0);});
    const cats=Object.entries(bycat).sort((a,b)=>b[1]-a[1]).slice(0,4);
    const maxcat=cats[0]?.[1]||1;
    return (
      <div className="page">
        <button className="back-btn" onClick={()=>{setSelId(null);setPage("dashboard");}}>← رجوع</button>
        <div className="dhero">
          <div className="dhero-top">
            <div><div className="dtitle">{sv.name}</div><div className="dsub">{sv.make} {sv.model} {sv.year} • {sv.plate}</div></div>
            <div>
              <div className="hcircle" style={{borderColor:hc,color:hc}}><span className="pct">{h}%</span></div>
              <div className="htext">صحة السيارة</div>
              <div style={{fontSize:11,fontWeight:600,color:hc,marginTop:2,textAlign:"center"}}>{hlbl}</div>
            </div>
          </div>
          <div className="dstats">
            <div className="ds"><div className="dv" style={{color:"#3B82F6"}}>{e.toLocaleString("ar")}</div><div className="dk">كم (تقدير)</div></div>
            <div className="ds"><div className="dv" style={{color:"#10B981"}}>{yCost(sv.logs)}</div><div className="dk">د.ب هذه السنة</div></div>
            <div className="ds"><div className="dv" style={{color:"#F59E0B"}}>{sv.logs.length}</div><div className="dk">عملية صيانة</div></div>
          </div>
          <div style={{marginTop:16,display:"flex",gap:10,flexWrap:"wrap"}}>
            <button className="btn btn-p" onClick={()=>setShowAL(true)}>+ تسجيل صيانة</button>
            <button className="btn btn-s" onClick={()=>setShowOdo(true)}>📍 تحديث العداد</button>
            <button className="btn btn-d" onClick={()=>setConfirmDel(sv)}>🗑️ حذف السيارة</button>
          </div>
        </div>
        <div className="tab-bar">
          {[["maintenance","🔧 الصيانة"],["logs","📋 السجل"],["stats","📊 الإحصائيات"]].map(([t,l])=>(
            <button key={t} className={`tab-btn ${dtab===t?"active":""}`} onClick={()=>setDtab(t)}>{l}</button>
          ))}
        </div>
        {dtab==="maintenance"&&<div className="mlist">
          {sv.maintenance.length===0&&<div className="empty"><div className="ei">🔧</div><div className="et">لا توجد عناصر صيانة</div></div>}
          {sv.maintenance.map(m=>{
            const s=iStatus(m,e,sv.dailyKmRate),d=iDays(m,e,sv.dailyKmRate),cfg=SC[s];
            return <div key={m.id} className="mitem">
              <div className="micon">{MI[m.category]||"🔧"}</div>
              <div className="minfo"><div className="mname">{m.name}</div><div className="mdetail">{m.lastDate?`آخر: ${fDate(m.lastDate)}`:"لم يُجرَ بعد"}{m.dueDate&&` • القادم: ${fDate(m.dueDate)}`}</div></div>
              <div style={{textAlign:"left"}}><div className="sbadge" style={{background:cfg.bg,color:cfg.text}}>{cfg.label}</div><div style={{fontSize:11,color:cfg.text,marginTop:4}}>{dText(d)}</div></div>
            </div>;
          })}
        </div>}
        {dtab==="logs"&&<div className="llist">
          {sv.logs.length===0&&<div className="empty"><div className="ei">📋</div><div className="et">لا يوجد سجل بعد</div><button className="btn btn-p" onClick={()=>setShowAL(true)}>+ تسجيل صيانة</button></div>}
          {sv.logs.map(l=>(
            <div key={l.id} className="litem">
              <div><div className="lname">{l.service}</div><div className="lmeta">{fDate(l.date)}{l.workshop?` • ${l.workshop}`:""}</div>{l.notes&&<div style={{fontSize:11,color:"#94A3B8",marginTop:4}}>{l.notes}</div>}</div>
              <div style={{textAlign:"left"}}><div className="lcost">{l.cost>0?`${l.cost} د.ب`:"—"}</div><div className="lodo">{l.odo?`${l.odo.toLocaleString("ar")} كم`:""}</div></div>
            </div>
          ))}
        </div>}
        {dtab==="stats"&&<div>
          <div className="scards">
            <div className="sc"><div className="sv">{mCost(sv.logs)}</div><div className="sk">د.ب هذا الشهر</div></div>
            <div className="sc"><div className="sv">{yCost(sv.logs)}</div><div className="sk">د.ب هذه السنة</div></div>
            <div className="sc"><div className="sv">{tCost(sv.logs)}</div><div className="sk">د.ب إجمالي</div></div>
          </div>
          {cats.length>0&&<div className="barchart"><h3>توزيع المصروفات</h3>
            {cats.map(([n,val])=>(
              <div key={n} className="bar-row"><div className="bar-lbl">{n}</div><div className="bar-track"><div className="bar-fill" style={{width:`${(val/maxcat)*100}%`}}/></div><div className="bar-val">{val} د.ب</div></div>
            ))}
          </div>}
          {forecast.length>0&&<>
            <div className="sec-title" style={{marginBottom:8}}>💡 التكاليف المتوقعة خلال ٣ أشهر</div>
            <div className="ftable">
              <div className="ft-row ft-hdr"><span>البند</span><span>الموعد</span><span className="ft-cost">المتوقع</span></div>
              {forecast.map((f,i)=>(
                <div key={i} className="ft-row"><span>{f.name}</span><span style={{color:"#94A3B8",fontSize:12}}>{dText(f.days)}</span><span className="ft-cost">{f.cost>0?`${f.cost} د.ب`:"—"}</span></div>
              ))}
              {fTotal>0&&<div className="ft-row" style={{background:"rgba(59,130,246,0.1)",fontWeight:700}}><span>الإجمالي المتوقع</span><span></span><span className="ft-cost" style={{color:"#3B82F6"}}>{fTotal} د.ب</span></div>}
            </div>
          </>}
        </div>}
      </div>
    );
  }

  function Compare(){
    if(vehicles.length<2)return(
      <div className="page"><div className="empty"><div className="ei">📊</div><div className="et">أضف سيارتين على الأقل</div><div className="es">المقارنة تحتاج سيارتين أو أكثر</div><button className="btn btn-p" onClick={()=>setShowAV(true)}>+ إضافة سيارة</button></div></div>
    );
    return(
      <div className="page">
        <div className="sec-title">📊 مقارنة السيارات</div>
        <div className="cgrid">
          {[...vehicles].sort((a,b)=>tCost(b.logs)-tCost(a.logs)).map((v,i)=>{
            const h=health(v),hc=HC(h),e=eOdo(v);
            const od=v.maintenance.filter(m=>iStatus(m,e,v.dailyKmRate)==="overdue").length;
            return <div key={v.id} className="ccard" style={i===0?{borderColor:"#F59E0B"}:{}}>
              {i===0&&<div style={{fontSize:11,color:"#F59E0B",fontWeight:600,marginBottom:8}}>🏆 الأعلى إنفاقاً</div>}
              <h4>{v.name}</h4>
              <div className="crow"><span className="ck">صحة السيارة</span><span className="cv" style={{color:hc}}>{h}%</span></div>
              <div className="crow"><span className="ck">العداد (تقدير)</span><span className="cv">{e.toLocaleString("ar")} كم</span></div>
              <div className="crow"><span className="ck">إجمالي المصروف</span><span className="cv" style={{color:"#10B981"}}>{tCost(v.logs)} د.ب</span></div>
              <div className="crow"><span className="ck">عمليات الصيانة</span><span className="cv">{v.logs.length}</span></div>
              <div className="crow"><span className="ck">أعمال متأخرة</span><span className="cv" style={{color:od>0?"#EF4444":"#10B981"}}>{od>0?`${od} ⛔`:"لا يوجد ✅"}</span></div>
              <div className="crow"><span className="ck">مصروف السنة</span><span className="cv">{yCost(v.logs)} د.ب</span></div>
            </div>;
          })}
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{css}</style>
      <div className="app">
        <nav className="nav">
          <div className="nav-logo">🚗 سيارتي</div>
          <div className="nav-tabs">
            <button className={`nav-tab ${page==="dashboard"||page==="detail"?"active":""}`} onClick={()=>{setPage("dashboard");setSelId(null);}}>الرئيسية</button>
            <button className={`nav-tab ${page==="compare"?"active":""}`} onClick={()=>setPage("compare")}>المقارنة</button>
          </div>
        </nav>
        {page==="dashboard"&&<Dashboard/>}
        {page==="detail"&&<Detail/>}
        {page==="compare"&&<Compare/>}
        {showAV&&<ModalAddVehicle nv={nv} setNv={setNv} onSave={saveVehicle} onClose={()=>setShowAV(false)}/>}
        {showAL&&sv&&<ModalAddLog nl={nl} setNl={setNl} onSave={saveLog} onClose={()=>setShowAL(false)}/>}
        {showOdo&&sv&&<ModalOdo sv={sv} nOdo={nOdo} setNOdo={setNOdo} onSave={saveOdo} onClose={()=>setShowOdo(false)}/>}
        {confirmDel&&<ModalConfirm vehicle={confirmDel} onConfirm={deleteVehicle} onClose={()=>setConfirmDel(null)}/>}
      </div>
    </>
  );
              }
