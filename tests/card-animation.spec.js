import {test,expect} from '@playwright/test';

test('card animation setting is enabled, persists, and zero skips transitions',async({page})=>{
  await page.goto('/');
  await page.getByRole('button',{name:'Einstellungen',exact:true}).click();
  await page.getByRole('button',{name:'Darstellungen…',exact:true}).click();
  const slider=page.getByRole('slider',{name:'Kartenanimation',exact:true});
  await expect(slider).toBeEnabled();await expect(slider).toHaveValue('25');
  await slider.fill('0');
  await page.getByRole('dialog').getByRole('button',{name:'OK',exact:true}).click();
  await page.reload();
  await page.getByRole('button',{name:'Einstellungen',exact:true}).click();
  await page.getByRole('button',{name:'Darstellungen…',exact:true}).click();
  await expect(slider).toHaveValue('0');
  const checks=await page.evaluate(async()=>{
    const {cardTransition}=await import('/src/cardAnimation.js');
    const before={kind:'schieber',roundNumber:1,count:4,pickedTricks:[0,0,0,0,0],trick:{fLeading:3,fPlayed:[0,0,0,0,0]}};
    const played=structuredClone(before);played.trick.fPlayed[3]=12;
    const complete=structuredClone(before);complete.trick.fPlayed=[0,1,2,12,4];
    const collected=structuredClone(before);collected.pickedTricks[2]=1;
    return {
      play:cardTransition(before,played,15)?.type,
      collect:cardTransition(complete,collected,15)?.winner,
      off:cardTransition(before,played,0),
      undo:cardTransition(played,before,15),
      restore:cardTransition(null,played,15),
      newRound:cardTransition(played,{...before,roundNumber:2},15),
    };
  });
  expect(checks).toEqual({play:'play',collect:2,off:null,undo:null,restore:null,newRound:null});
});
