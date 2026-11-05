import React,{useEffect,useRef,useState} from 'react';

const horizontal='mobile-horizontal';
const canEnter=()=>Boolean(document.fullscreenEnabled&&document.documentElement.requestFullscreen);
async function exitFullscreen(){
  if(document.fullscreenElement&&document.exitFullscreen){
    try{await document.exitFullscreen();}catch{/* The browser may already be leaving fullscreen. */}
  }
}

export function MobileFullscreen({view}){
  const previousView=useRef(null),currentView=useRef(view),dialog=useRef(null);
  const [prompt,setPrompt]=useState(false),[error,setError]=useState('');
  currentView.current=view;

  useEffect(()=>{
    const previous=previousView.current;
    previousView.current=view;
    if(previous===view)return;
    setError('');
    if(view===horizontal){
      setPrompt(!document.fullscreenElement&&canEnter());
    }else{
      setPrompt(false);
      if(previous===horizontal)void exitFullscreen();
    }
  },[view]);

  useEffect(()=>{
    const changed=()=>{if(document.fullscreenElement)setPrompt(false);};
    document.addEventListener('fullscreenchange',changed);
    return()=>document.removeEventListener('fullscreenchange',changed);
  },[]);

  useEffect(()=>{
    const element=dialog.current;
    if(!element)return;
    element.showModal();
    return()=>element.close();
  },[prompt,view]);

  const enter=async()=>{
    // Request directly in the button gesture, after dismissing our modal.
    dialog.current?.close();
    setPrompt(false);
    if(currentView.current!==horizontal||document.fullscreenElement||!canEnter())return;
    try{
      await document.documentElement.requestFullscreen({navigationUI:'hide'});
      // Rotation or a manual view change may have happened while the request was pending.
      if(currentView.current!==horizontal)await exitFullscreen();
    }catch{
      if(currentView.current===horizontal){
        // A synchronous browser error can leave this same dialog mounted but closed.
        if(dialog.current&&!dialog.current.open)dialog.current.showModal();
        setError('Vollbild konnte nicht aktiviert werden. Du kannst es erneut versuchen oder ohne Vollbild weiterspielen.');
        setPrompt(true);
      }
    }
  };

  if(!prompt||view!==horizontal)return null;
  return <dialog ref={dialog} className="game-setup" aria-labelledby="fullscreen-title" aria-describedby="fullscreen-description" onCancel={event=>{event.preventDefault();setPrompt(false);}}>
    <h1 id="fullscreen-title">Vollbild einschalten?</h1>
    <p id="fullscreen-description">Im horizontalen Handy-Layout hast du im Vollbild mehr Platz für den Spieltisch.</p>
    {error&&<p role="alert">{error}</p>}
    <div className="dialog-actions">
      <button type="button" onClick={()=>setPrompt(false)}>Nicht jetzt</button>
      <button type="button" onClick={enter}>Vollbild einschalten</button>
    </div>
  </dialog>;
}
