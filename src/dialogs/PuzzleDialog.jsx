import React,{useEffect,useRef,useState} from 'react';
import {LegacyDialog,useDialogCatalog,formImage} from './LegacyDialog';
// DlgPuzzle.DoShift moves the entire row/column between the clicked tile and gap.
export function shiftTiles(tiles,columns,index) {
  const gap=tiles.indexOf(tiles.length-1),sameRow=Math.floor(index/columns)===Math.floor(gap/columns);
  if(index===gap||!sameRow&&index%columns!==gap%columns)return tiles;
  const next=[...tiles],step=sameRow?(index>gap?1:-1):(index>gap?columns:-columns);
  for(let i=gap;i!==index;i+=step)next[i]=next[i+step];next[index]=tiles.length-1;return next;
}
function shuffled(columns,rows){
  let tiles=Array.from({length:columns*rows},(_,i)=>i);
  // As in Delphi, alternate legal horizontal/vertical moves so every deal is solvable.
  for(let n=0;n<3*tiles.length;n++){
    const gap=tiles.indexOf(tiles.length-1),x=gap%columns,y=Math.floor(gap/columns);
    const choices=tiles.map((_,i)=>i).filter(i=>i!==gap&&(n%2?i%columns===x:Math.floor(i/columns)===y));
    tiles=shiftTiles(tiles,columns,choices[Math.floor(Math.random()*choices.length)]);
  }
  if(tiles.every((v,i)=>v===i))tiles=shiftTiles(tiles,columns,tiles.length-2);
  return tiles;
}
export function PuzzleDialog({onClose,scale}) {
  const {data}=useDialogCatalog(),[size,setSize]=useState('3 x 3'),[tiles,setTiles]=useState(()=>shuffled(3,3));
  const [moving,setMoving]=useState(false),timer=useRef(null);
  useEffect(()=>()=>clearTimeout(timer.current),[]);
  const [columns,rows]=size==='3 x 3'?[3,3]:size==='3 x 4'?[4,3]:[4,4];
  const reset=next=>{clearTimeout(timer.current);setMoving(false);setTiles(next);};
  const move=i=>{
    if(moving)return;
    const next=shiftTiles(tiles,columns,i);if(next===tiles)return;
    setMoving(true);setTiles(next);timer.current=setTimeout(()=>setMoving(false),160);
  };
  if(!data)return null;const src=formImage(data,'differ','TINTRODLG','Image'),solved=tiles.every((v,i)=>v===i),w=Math.floor(347/columns),h=Math.floor(260/rows),gap=tiles.indexOf(tiles.length-1);
  return <LegacyDialog kind="differ" form="TPUZZLEDLG" onClose={onClose} scale={scale} values={{ComboBox:size}} overrides={{ComboBox:{'aria-label':'Puzzleteile','Items.Strings':['3 x 3','3 x 4','4 x 4']}}} onChange={(n,v)=>{setSize(v);reset(shuffled(v==='3 x 3'?3:4,v==='4 x 4'?4:3));}} onAction={n=>n==='BtnSolve'?reset(tiles.map((_,i)=>i)):n==='BtnShuffle'?reset(shuffled(columns,rows)):onClose()}>
    <div className="sliding-puzzle" style={{width:w*columns,height:h*rows}} role="group" aria-label={solved&&!moving?'Puzzle gelöst':'Schiebepuzzle'}>{Array.from({length:tiles.length},(_,tile)=>{
      const i=tiles.indexOf(tile),empty=tile===tiles.length-1&&(!solved||moving),canMove=i!==gap&&(Math.floor(i/columns)===Math.floor(gap/columns)||i%columns===gap%columns);
      return <button key={`${size}-${tile}`} type="button" aria-label={`Puzzleteil ${tile+1}`} data-position={i} data-empty={empty} aria-disabled={moving||(!solved&&!canMove)} title={empty?'Freies Feld':canMove?'Verschieben':solved?'Neu mischen':'Ein Teil in der Reihe oder Spalte des freien Feldes wählen'} onClick={()=>solved&&!moving?reset(shuffled(columns,rows)):move(i)} style={{position:'absolute',left:0,top:0,transform:`translate(${i%columns*w}px,${Math.floor(i/columns)*h}px)`,transition:moving&&!empty?'transform 160ms ease-out':'none',width:w,height:h,padding:0,border:0,visibility:empty?'hidden':'visible',cursor:canMove||solved?'pointer':'default',backgroundImage:`url(${src})`,backgroundSize:'347px 260px',backgroundPosition:`${-(tile%columns)*w}px ${-Math.floor(tile/columns)*h}px`}}/>;
    })}</div>
  </LegacyDialog>;
}
