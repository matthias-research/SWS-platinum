import {test,expect} from '@playwright/test';

test('display defaults use zero delay and 30 animation steps; zero applies and persists',async({page})=>{
  await page.goto('/?review=cards');
  const open=async()=>{
    await page.getByRole('button',{name:'Einstellungen',exact:true}).click();
    await page.getByRole('button',{name:'Darstellungen…',exact:true}).click();
  };
  const save=()=>page.getByRole('dialog').getByRole('button',{name:'OK',exact:true}).click();
  await open();
  await expect(page.getByRole('slider',{name:'Spielverzögerung',exact:true})).toHaveValue('0');
  await expect(page.getByRole('slider',{name:'Kartenanimation',exact:true})).toHaveValue('30');
  await page.getByRole('slider',{name:'Spielverzögerung',exact:true}).fill('900');await save();
  await open();
  await expect(page.getByRole('slider',{name:'Spielverzögerung',exact:true})).toHaveValue('900');
  await page.getByRole('slider',{name:'Spielverzögerung',exact:true}).fill('0');await save();
  await open();
  await expect(page.getByRole('slider',{name:'Spielverzögerung',exact:true})).toHaveValue('0');
  await save();await page.reload();await open();
  await expect(page.getByRole('slider',{name:'Spielverzögerung',exact:true})).toHaveValue('0');
  await expect(page.getByRole('slider',{name:'Kartenanimation',exact:true})).toHaveValue('30');
});

for(const kind of ['Schieber','Differenzler'])test(kind+': confirmed rules survive reopening without starting a game',async({page,context})=>{
  await page.goto('/');
  await page.getByRole('button',{name:'Neuer '+kind+'…',exact:true}).click();
  await page.getByRole('button',{name:'Regeln…',exact:true}).click();
  const rules=page.getByRole('dialog',{name:'Spielregeln',exact:true});
  if(kind==='Schieber')await rules.getByRole('spinbutton',{name:'Zielpunkte',exact:true}).fill('1500');
  else await rules.getByRole('combobox',{name:'Runden',exact:true}).selectOption('7');
  await rules.getByRole('button',{name:'OK',exact:true}).click();
  // Close the tab before starting a game: the rules have already been accepted.
  const url=page.url();await page.close();const next=await context.newPage();await next.goto(url);
  await next.getByRole('button',{name:'Neuer '+kind+'…',exact:true}).click();
  await next.getByRole('button',{name:'Regeln…',exact:true}).click();
  const restored=next.getByRole('dialog',{name:'Spielregeln',exact:true});
  if(kind==='Schieber')await expect(restored.getByRole('spinbutton',{name:'Zielpunkte',exact:true})).toHaveValue('1500');
  else await expect(restored.getByRole('combobox',{name:'Runden',exact:true})).toHaveValue('7');
  // Cancelled edits must leave the confirmed rules intact.
  if(kind==='Schieber')await restored.getByRole('spinbutton',{name:'Zielpunkte',exact:true}).fill('2000');
  else await restored.getByRole('combobox',{name:'Runden',exact:true}).selectOption('9');
  await restored.getByRole('button',{name:'Abbrechen',exact:true}).click();await next.reload();
  const saved=await next.evaluate(k=>JSON.parse(localStorage.getItem('sws-rules-'+k)),kind.toLowerCase()==='schieber'?'schieber':'differ');
  expect(kind==='Schieber'?saved.fLimit:saved.fRoundLimit).toBe(kind==='Schieber'?1500:7);
});

test('settings restore saved delay and do not replace rules from other settings dialogs',async({page})=>{
  await page.goto('/?review=cards');
  await page.getByRole('button',{name:'Einstellungen',exact:true}).click();
  await expect(page.getByRole('button',{name:'Einstellungen speichern',exact:true})).toHaveCount(0);
  await page.getByRole('button',{name:'Regeln…',exact:true}).click();
  await page.getByRole('spinbutton',{name:'Zielpunkte',exact:true}).fill('1500');
  await page.getByRole('dialog').getByRole('button',{name:'OK',exact:true}).click();
  await page.reload();
  await page.getByRole('button',{name:'Einstellungen',exact:true}).click();
  await page.getByRole('button',{name:'Darstellungen…',exact:true}).click();
  await page.getByRole('slider',{name:'Spielverzögerung',exact:true}).fill('900');
  await page.getByRole('dialog').getByRole('button',{name:'OK',exact:true}).click();
  await page.reload();
  await page.getByRole('button',{name:'Einstellungen',exact:true}).click();
  await page.getByRole('button',{name:'Darstellungen…',exact:true}).click();
  await expect(page.getByRole('slider',{name:'Spielverzögerung',exact:true})).toHaveValue('900');
  await page.getByRole('dialog').getByRole('button',{name:'OK',exact:true}).click();
  await page.getByRole('button',{name:'Einstellungen',exact:true}).click();
  await page.getByRole('button',{name:'Regeln…',exact:true}).click();
  await expect(page.getByRole('spinbutton',{name:'Zielpunkte',exact:true})).toHaveValue('1500');
});
