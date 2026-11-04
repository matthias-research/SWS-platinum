// Browser-local settings work on static hosting without an application server.
// Schieber and Differenzler retain independent rule sets for this site.
export function loadRules(kind,defaults){
  try{return {...defaults,...JSON.parse(localStorage.getItem('sws-rules-'+kind)||'{}')};}
  catch{return defaults;}
}
export function saveRules(kind,rules){
  try{localStorage.setItem('sws-rules-'+kind,JSON.stringify(rules));}catch{}
}
