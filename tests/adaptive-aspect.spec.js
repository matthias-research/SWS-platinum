import {test,expect} from '@playwright/test';

for(const [viewMode,ratio] of [['desktop',768/528],['mobile-horizontal',768/528],['mobile-vertical',580/620]]){
  test(`${viewMode}: adaptive canvas retains its aspect ratio when resized tall`,async({page})=>{
    await page.addInitScript(viewMode=>{
      localStorage.setItem('sws-display',JSON.stringify({viewMode,resolution:'adaptive'}));
      Object.defineProperty(document,'fullscreenEnabled',{get:()=>false});
    },viewMode);
    await page.goto('/');
    await page.getByRole('button',{name:'Neuer Schieber…',exact:true}).click();
    const canvas=page.locator('.scene-frame > canvas');
    for(const viewport of [{width:1200,height:700},{width:600,height:1000},{width:390,height:844},{width:1000,height:600}]){
      await page.setViewportSize(viewport);
      await expect.poll(async()=>{
        const rect=await canvas.boundingBox();
        return Math.abs(rect.width/rect.height-ratio);
      }).toBeLessThan(0.001);
      await expect.poll(async()=>{
        const rect=await canvas.boundingBox();
        return rect.x+rect.width<=viewport.width+1&&rect.y+rect.height<=viewport.height+1;
      }).toBe(true);
    }
  });
}
