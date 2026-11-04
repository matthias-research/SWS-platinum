export async function enableLowlevel(page){
  await page.getByRole('button',{name:'Browser',exact:true}).click();
  await page.getByRole('button',{name:'Lowlevel menu',exact:true}).click();
}
