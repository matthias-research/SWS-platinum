// Translate legacy interface captions explicitly, without rewriting user text.
const captions=new Map([
 ['Wollen Sie das Spiel wirklich abbrechen?','Möchtest du das Spiel wirklich abbrechen?'],
 ['Wollen Sie eine Revanche?','Möchtest du eine Revanche?'],
 ['Ihre Daten bitte ...','Deine Daten bitte ...'],
 ['Ihr Name bitte...','Dein Name bitte...'],
 ['Geben Sie das Laufwerk der Stöck Wyys Stich Gold CD an:','Gib das Laufwerk der Stöck Wyys Stich Gold CD an:'],
 ['Geben Sie das Laufwerk der Samschtig Jass CD an:','Gib das Laufwerk der Samschtig Jass CD an:'],
]);
export const informalCaption=text=>captions.get(text)??text;
export const playerLabel=name=>name==='Sie'?'Du':name;
// Retain personal names and game journals; migrate only the old default label.
export function migratePlayerLabel(){
 try{
  if(localStorage.getItem('sws-player')==='Sie')localStorage.setItem('sws-player','Du');
  for(const key of ['sws-game','sws-history']){
   const raw=localStorage.getItem(key);if(!raw)continue;
   const value=JSON.parse(raw,(name,value)=>name==='names'&&Array.isArray(value)?value.map(playerLabel):value);
   const updated=JSON.stringify(value);if(updated!==raw)localStorage.setItem(key,updated);
  }
 }catch{}
}
