import {test,expect} from '@playwright/test';

// Headless Chromium hides native scrollbars by default; exercise the real thumb.
test.use({launchOptions:{ignoreDefaultArgs:['--hide-scrollbars']}});

for(const scale of [1,0.75])test(`feed scrollbar drags and preserves reading position at scale ${scale}`,async({page})=>{
  await page.goto('/');
  await page.evaluate(async scale=>{
    const {default:React}=await import('/node_modules/.vite/deps/react.js');
    const {default:{createRoot}}=await import('/node_modules/.vite/deps/react-dom_client.js');
    const {GameFeed}=await import('/src/GameFeed.jsx');
    document.querySelector('.application').style.display='none';
    const host=document.createElement('div');document.body.appendChild(host);
    const root=createRoot(host);
    const feed=Array.from({length:80},(_,i)=>({id:i+1,kind:'round',round:i+1}));
    window.renderFeed=()=>root.render(React.createElement(GameFeed,{view:{feed:[...feed],names:[]},scale,setId:1,duration:0}));
    window.appendFeed=()=>{feed.push({id:feed.length+1,kind:'round',round:feed.length+1});window.renderFeed();};
    window.renderFeed();
  },scale);
  const feed=page.getByRole('log',{name:'Spielverlauf'});
  await expect(feed).toBeVisible();
  const bottom=()=>feed.evaluate(el=>el.scrollHeight-el.clientHeight-el.scrollTop);
  await expect.poll(bottom).toBeLessThan(2);
  const bounds=await feed.boundingBox();
  // Grab the thumb at the bottom of the actual native scrollbar and drag up.
  await page.mouse.move(bounds.x+bounds.width-9*scale,bounds.y+bounds.height-12*scale);
  await page.mouse.down();
  await page.mouse.move(bounds.x+bounds.width-9*scale,bounds.y+12*scale,{steps:12});
  await page.mouse.up();
  await expect.poll(()=>feed.evaluate(el=>el.scrollTop)).toBeLessThan(30);
  const position=await feed.evaluate(el=>el.scrollTop);
  await page.evaluate(()=>window.appendFeed());
  await expect(feed).toContainText('Spiel 81');
  expect(await feed.evaluate(el=>el.scrollTop)).toBe(position);
  await feed.focus();await page.keyboard.press('Control+End');
  await expect.poll(bottom).toBeLessThan(2);
  await page.evaluate(()=>window.appendFeed());
  await expect(feed).toContainText('Spiel 82');
  await expect.poll(bottom).toBeLessThan(2);
});
