import React from 'react';
import {graphicsUrl} from './graphics';
import {useDialogCatalog,looseImage} from './dialogs/LegacyDialog';

// Delphi Table.PictureRect and PickedRect, in the original 768x528 coordinates.
const portraits=[null,{left:309,top:-24},{left:200,top:188},{left:405,top:301},{left:518,top:76}];
const pileRect=(p,n)=>[
  null,{left:370+15*n,top:-11,width:30,height:46},
  {left:206,top:153-15*n,width:46,height:30},
  {left:370-15*n,top:301,width:30,height:46},
  {left:518,top:153+15*n,width:46,height:30},
][p];

export function TablePlayers({view,scale}){
  const {data}=useDialogCatalog();
  return <div className="table-players" style={{transform:`scale(${scale})`}} aria-label="Spieler und gesammelte Stiche" role="group">
    {Array.from({length:view.count},(_,i)=>i+1).map(p=>{
      const count=view.pickedTricks?.[p]||0,icon=p===view.human?(view.avatar||5208):7000+1000*(view.characters?.[p]||0)+(view.portraitLevels?.[p]??2);
      return <React.Fragment key={p}>
        <div className="collected-tricks" data-player={p} data-count={count} role="img" aria-label={`${view.names[p]}: ${count} gesammelte Stiche`}>
          {data&&Array.from({length:count},(_,n)=>{const r=pileRect(p,n),horizontal=p%2===0;return <span key={n} className="collected-trick" style={r}><img src={looseImage(data,`cardb10${horizontal?'h':'v'}.bmp`)} alt="" style={{width:r.width-2,height:r.height-2}}/></span>;})}
        </div>
        <img className="table-portrait" data-player={p} style={portraits[p]} src={graphicsUrl(`setup/${icon}.png`)} alt={view.names[p]} title={view.names[p]} width="56" height="72"/>
      </React.Fragment>;
    })}
  </div>;
}
