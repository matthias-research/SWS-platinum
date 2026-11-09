import {informalCaption} from '../germanText';
import {graphicsUrl,useGraphics} from '../graphics';
import {useCanvasDialogPosition} from './useCanvasDialogPosition';
import React,{useEffect,useLayoutEffect,useRef,useState} from 'react';
export const dialogBase=`${import.meta.env.BASE_URL}assets/dialogs/`;
let catalogPromise;
export function loadDialogCatalog(){return catalogPromise??=fetch(`${dialogBase}manifest.json`).then(r=>{if(!r.ok)throw new Error('Dialoggrafiken fehlen');return r.json();});}
export function useDialogCatalog(){useGraphics();const [data,setData]=useState(null);const[error,setError]=useState('');useEffect(()=>{let active=true;loadDialogCatalog().then(d=>{if(active)setData(d);}).catch(e=>{if(active)setError(e.message);});return()=>{active=false;};},[]);return{data,error};}
export function imageUrl(data,id){return id&&data.images[id]?graphicsUrl(`dialogs/${data.images[id].file}`):undefined;}
export function formImage(data,kind,form,name){const c=data?.forms[kind]?.[form]?.components.find(c=>c.name===name);return c&&imageUrl(data,Object.values(c.images)[0]);}
export function looseImage(data,name){return imageUrl(data,data?.loose[name.toLowerCase()]);}
const captions={bkOK:'OK',bkCancel:'Abbrechen',bkYes:'Ja',bkNo:'Nein',bkClose:'Schliessen'};
const clean=t=>informalCaption(String(t??'').replace(/&/g,''));
export function DialogFrame({title,width,height,onClose,children,className='',keepHandVisible=false,allowBelowHand=true,scale:tableScale=1,controlScale,hideClose=false}) {
  // All dialogs follow the selected resolution mode, capped to the viewport.
  const scale=Number.isFinite(tableScale)&&tableScale>0?tableScale:1;
  const ref=useRef(null),[viewport,setViewport]=useState({w:innerWidth,h:innerHeight});
  const [placement,setPlacement]=useState(null);
  useLayoutEffect(()=>{
    if(!keepHandVisible)return;
    const table=document.querySelector('.scene-frame > canvas');if(!table)return;
    const measure=()=>{
      const scene=table.getBoundingClientRect(),cards=[...document.querySelectorAll('.card-targets .card-target')].map(el=>el.getBoundingClientRect());
      const handTop=cards.length?Math.min(...cards.map(r=>r.top)):scene.bottom-118*scene.width/768;
      const handBottom=cards.length?Math.max(...cards.map(r=>r.bottom)):scene.bottom;
      const preferred=scale;
      const above={top:Math.max(8,scene.top+6),bottom:Math.min(innerHeight-8,handTop-10)};
      const below={top:Math.max(8,handBottom+10),bottom:innerHeight-8};
      const fit=area=>Math.max(0,Math.min(preferred,(innerWidth-20)/width,(area.bottom-area.top)/(height+22)));
      // On a narrow phone the space below the hand allows legible controls.
      const mobile=table.closest('.application')?.dataset.view?.startsWith('mobile-');
      const area=allowBelowHand&&mobile&&fit(above)<preferred&&fit(below)>fit(above)?below:above,zoom=fit(area);
      const next={zoom,left:Math.max(8,Math.min(innerWidth-width*zoom-8,scene.left+scene.width/2-width*zoom/2)),top:area.top+Math.max(0,(area.bottom-area.top-(height+22)*zoom)/2)};
      setPlacement(old=>JSON.stringify(old)===JSON.stringify(next)?old:next);
    };
    measure();const observer=new ResizeObserver(measure);observer.observe(table);
    window.addEventListener('resize',measure);window.addEventListener('scroll',measure,true);
    return()=>{observer.disconnect();window.removeEventListener('resize',measure);window.removeEventListener('scroll',measure,true);};
  },[keepHandVisible,allowBelowHand,width,height,scale]);
  useEffect(()=>{ref.current.showModal();const resize=()=>setViewport({w:innerWidth,h:innerHeight});window.addEventListener('resize',resize);return()=>window.removeEventListener('resize',resize);},[]);
  const zoom=keepHandVisible&&placement?placement.zoom:Math.min(scale,(viewport.w-20)/width,(viewport.h-20)/(height+22));
  const centered=useCanvasDialogPosition(width*zoom,(height+22)*zoom,!keepHandVisible);
  const uiRatio=controlScale?Math.min(1,controlScale/zoom):1;
  return <dialog ref={ref} aria-label={title} className={`original-dialog ${keepHandVisible?'decision-dialog':''} ${controlScale?'preserve-decision-ui':''} ${className}`} onCancel={e=>{e.preventDefault();onClose();}} style={{width:width*zoom,height:(height+22)*zoom,'--dialog-ui-ratio':uiRatio,...centered,...(keepHandVisible&&placement?{position:'fixed',inset:'auto',left:placement.left,top:placement.top,margin:0}:{})}}>
    <div className="original-dialog-content" style={{width,height:height+22,transform:`scale(${zoom})`}}>
      <header className="original-caption" style={controlScale?{width:width/uiRatio,transform:`scale(${uiRatio})`,transformOrigin:'top left',marginBottom:22*(uiRatio-1)}:undefined}>{title}{!hideClose&&<button type="button" aria-label="Schliessen" onClick={onClose}>×</button>}</header>
      <div className="original-client" style={{height}}>{children}</div>
    </div>
  </dialog>;
}

export function LegacyDialog({kind='schieber',form,title,onClose,onAction,values={},onChange=()=>{},overrides={},render,children,initialTab=0,hideTabs=false,scale,controlScale,hide=[],readOnly=false,width,height,keepHandVisible=false,allowBelowHand=true}) {
  const {data,error}=useDialogCatalog(); const [tab,setTab]=useState(initialTab);
  if(error)return <DialogFrame title="Fehler" scale={scale} width={350} height={100} onClose={onClose}><p role="alert">{error}</p></DialogFrame>;
  if(!data)return null;
  const definition=data.forms[kind][form];
  if(!definition)throw new Error(`Unknown original dialog ${kind}/${form}`);
  const root=definition.components[0],rp=root.properties;
  const controls=definition.components.slice(1),byPath=new Map(definition.components.map(c=>[c.path,c]));
  const tabs=controls.filter(c=>c.className==='TTabPage');
  const rect=c=>{let x=c.properties.Left||0,y=c.properties.Top||0,path=c.path;while((path=path.slice(0,path.lastIndexOf('.')))&&path!==root.path){const parent=byPath.get(path),p={...parent?.properties,...overrides[parent?.name]};x+=p.Left||0;y+=p.Top||0;}return{left:x,top:y,width:c.properties.Width,height:c.properties.Height};};
  const action=c=>{if(onAction)onAction(c.name,values,c);else onClose();};
  const notebook=controls.find(c=>c.className==='TTabbedNotebook');
  return <DialogFrame title={title||clean(rp.Caption)||'Stöck Wyys Stich'} width={width||rp.ClientWidth||rp.Width||640} height={height||rp.ClientHeight||rp.Height||480} onClose={onClose} scale={scale} controlScale={controlScale} keepHandVisible={keepHandVisible} allowBelowHand={allowBelowHand}>
    {!hideTabs&&tabs.length>0&&<div className="original-tabs" style={notebook?{left:rect(notebook).left+4,top:rect(notebook).top+2}:undefined} role="tablist">{tabs.map((t,i)=><button key={t.path} type="button" role="tab" aria-selected={i===tab} onClick={()=>setTab(i)}>{clean(t.properties.Caption)}</button>)}</div>}
    {controls.map(c=>{
      const p={...c.properties,...overrides[c.name]},r=rect({...c,properties:p}),cls=c.className;
      if(hide.includes(c.name)||p.Visible===false||tabs.some((t,i)=>i!==tab&&c.path.startsWith(t.path+'.'))||['TTabPage','TTabbedNotebook','TMediaPlayer','TTimer','TPopupMenu','TMainMenu','TMenuItem','TOpenDialog','TSaveDialog','TFontDialog'].includes(cls))return null;
      if(r.top>=(height||rp.ClientHeight||480)||r.left>=(width||rp.ClientWidth||640))return null;
      const style={...r,fontSize:Math.abs(p['Font.Height']||rp['Font.Height']||13),fontWeight:(p['Font.Style']||[]).includes('fsBold')?'bold':undefined};
      const id=`${kind}-${form}-${c.path}`,caption=clean(p.Caption||captions[p.Kind]),label=p['aria-label']||caption||c.name;
      const custom=render?.(c,p,data);
      if(custom!==undefined)return <div key={c.path} className="original-control" style={style}>{custom}</div>;
      const common={id,'aria-label':label,disabled:p.Enabled===false||readOnly};
      let node;
      if(cls==='TImage'){const src=imageUrl(data,Object.values(c.images)[0]);node=src?<img src={src} alt="" draggable="false" style={{width:'100%',height:'100%',objectFit:'fill',objectPosition:'left top',...(!p.Stretch?{width:data.images[Object.values(c.images)[0]].width,height:data.images[Object.values(c.images)[0]].height}:{} )}}/>:null;}
      else if(cls==='TLabel')node=<span>{values[c.name]??caption}</span>;
      else if(['TBevel','TGroupBox','TPanel'].includes(cls))node=<div className={`original-box ${cls}`}><span>{cls==='TGroupBox'?caption:''}</span></div>;
      else if(['TButton','TBitBtn','TSpeedButton'].includes(cls)){
        const glyph=c.images['Glyph.Data']||data.glyphs?.[{bkOK:'BBOK',bkCancel:'BBCANCEL',bkYes:'BBYES',bkNo:'BBNO',bkClose:'BBCLOSE'}[p.Kind]],img=data.glyphFiles?.[glyph]?graphicsUrl(`dialogs/${data.glyphFiles[glyph]}`):imageUrl(data,glyph);
        node=<button {...common} type="button" onClick={()=>action(c)}>{img&&<span className="original-glyph" style={{backgroundImage:`url(${img})`,backgroundSize:`${data.images[glyph].width}px ${data.images[glyph].height}px`,width:data.images[glyph].width/(p.NumGlyphs||(!c.images['Glyph.Data']?2:1)),height:data.images[glyph].height}}/>}{caption}</button>;
      }
      else if(['TCheckBox','TRadioButton'].includes(cls))node=<label><input {...common} type={cls==='TCheckBox'?'checkbox':'radio'} checked={Boolean(values[c.name]??p.Checked)} onChange={e=>onChange(c.name,e.target.checked,c)}/>{caption}</label>;
      else if(['TEdit','TSpinEdit','TMaskEdit'].includes(cls))node=<input {...common} type={cls==='TSpinEdit'?'number':'text'} min={p.MinValue} max={p.MaxValue||undefined} maxLength={p.MaxLength||80} value={values[c.name]??p.Text??p.Value??''} onChange={e=>onChange(c.name,cls==='TSpinEdit'?Number(e.target.value):e.target.value,c)}/>;
      else if(cls==='TComboBox'){
        const items=p['Items.Strings']||[];
        node=p.Style==='csDropDownList'?<select {...common} value={values[c.name]??items[p.ItemIndex||0]??''} onChange={e=>onChange(c.name,e.target.value,c)}>{items.map((v,i)=><option key={i}>{v}</option>)}</select>:<><input {...common} list={`${id}-items`} value={values[c.name]??p.Text??''} onChange={e=>onChange(c.name,e.target.value,c)}/><datalist id={`${id}-items`}>{items.map((v,i)=><option key={i} value={v}/>)}</datalist></>;
      }
      else if(cls==='TScrollBar')node=<input {...common} type="range" min={p.Min||0} max={p.Max??100} value={values[c.name]??p.Position??0} onChange={e=>onChange(c.name,Number(e.target.value),c)}/>;
      else if(['TMemo','TRichEdit'].includes(cls))node=<textarea {...common} value={values[c.name]??(p['Lines.Strings']||[]).join('\n')} onChange={e=>onChange(c.name,e.target.value,c)}/>;
      else if(cls==='TListBox')node=<select {...common} size={5} value={values[c.name]??''} onChange={e=>onChange(c.name,e.target.value,c)}>{(p['Items.Strings']||[]).map((v,i)=><option key={i}>{v}</option>)}</select>;
      else node=null;
      return node&&<div key={c.path} className={`original-control ${cls}`} style={style}>{node}</div>;
    })}
    {children}
  </DialogFrame>;
}
