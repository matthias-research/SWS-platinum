import React from 'react';
import {BASE_TABLE,portraitRect,pileRect} from './tableGeometry';
import {graphicsUrl} from './graphics';
import {useDialogCatalog,looseImage} from './dialogs/LegacyDialog';

export function TablePlayers({view,scale,size=BASE_TABLE}){
  const {data}=useDialogCatalog();
  return <div className="table-players" style={{width:size.width,height:size.height,transform:`scale(${scale})`}} aria-label="Spieler und gesammelte Stiche" role="group">
    {Array.from({length:view.count},(_,i)=>i+1).map(p=>{
      const count=view.pickedTricks?.[p]||0,icon=p===view.human?(view.avatar||5208):7000+1000*(view.characters?.[p]||0)+(view.portraitLevels?.[p]??2);
      return <React.Fragment key={p}>
        <div className="collected-tricks" data-player={p} data-count={count} role="img" aria-label={`${view.names[p]}: ${count} gesammelte Stiche`}>
          {data&&Array.from({length:count},(_,n)=>{const r=pileRect(p,n,size),horizontal=p%2===0;return <span key={n} className="collected-trick" style={r}><img src={looseImage(data,`cardb10${horizontal?'h':'v'}.bmp`)} alt="" style={{width:r.width-2,height:r.height-2}}/></span>;})}
        </div>
        <img className="table-portrait" data-player={p} style={portraitRect(p,size)} src={graphicsUrl(`setup/${icon}.png`)} alt={view.names[p]} title={view.names[p]} width="56" height="72"/>
      </React.Fragment>;
    })}
  </div>;
}
