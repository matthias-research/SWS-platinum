import React,{useState} from 'react';
import {LegacyDialog,useDialogCatalog,formImage} from './LegacyDialog';
// DlgPuzzle.DoShift moves the entire row/column between the clicked tile and gap.
export function shiftTiles(tiles,columns,index) {
  const gap=tiles.indexOf(tiles.length-1),sameRow=Math.floor(index/columns)===Math.floor(gap/columns);
  if(index===gap||!sameRow&&index%columns!==gap%columns)return tiles;
  const next=[...tiles],step=sameRow?(index>gap?1:-1):(index>gap?columns:-columns);
  for(let i=gap;i!==index;i+=step)next[i]=next[i+step];next[index]=tiles.length-1;return next;
}
function shuffled(columns,rows){let tiles=Array.from({length:columns*rows},(_,i)=>i);for(let n=0;n<200;n++)tiles=shiftTiles(tiles,columns,Math.floor(Math.random()*tiles.length));return tiles;}
export function PuzzleDialog({onClose,scale}) {
  const {data}=useDialogCatalog(),[size,setSize]=useState('3 x 3'),[tiles,setTiles]=useState(()=>shuffled(3,3));
  const [columns,rows]=size==='3 x 3'?[3,3]:size==='3 x 4'?[4,3]:[4,4];
  if(!data)return null;const src=formImage(data,'differ','TINTRODLG','Image'),solved=tiles.every((v,i)=>v===i),w=347/columns,h=260/rows;
  return <LegacyDialog kind="differ" form="TPUZZLEDLG" onClose={onClose} scale={scale} values={{ComboBox:size}} overrides={{ComboBox:{'aria-label':'Puzzleteile','Items.Strings':['3 x 3','3 x 4','4 x 4']}}} onChange={(n,v)=>{setSize(v);setTiles(shuffled(v==='3 x 3'?3:4,v==='4 x 4'?4:3));}} onAction={n=>n==='BtnSolve'?setTiles(tiles.map((_,i)=>i)):n==='BtnShuffle'?setTiles(shuffled(columns,rows)):onClose()}>
    <div style={{position:'absolute',left:13,top:13,width:347,height:260,background:'black'}} role="group" aria-label={solved?'Puzzle gelöst':'Schiebepuzzle'}>{tiles.map((tile,i)=><button key={i} type="button" aria-label={`Puzzleteil ${tile+1}`} onClick={()=>solved?setTiles(shuffled(columns,rows)):setTiles(t=>shiftTiles(t,columns,i))} style={{position:'absolute',left:(i%columns)*w,top:Math.floor(i/columns)*h,width:w,height:h,padding:0,border:0,backgroundColor:'black',backgroundImage:tile===tiles.length-1&&!solved?'none':`url(${src})`,backgroundSize:'347px 260px',backgroundPosition:`${-(tile%columns)*w}px ${-Math.floor(tile/columns)*h}px`}}/>)}</div>
  </LegacyDialog>;
}
