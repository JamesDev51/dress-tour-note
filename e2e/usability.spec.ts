import { expect, test, type Page } from '@playwright/test';

const tinyPng=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAFElEQVR42mP8z8Dwn4GBgYGJAQoAHQkCAWJ6+ygAAAAASUVORK5CYII=','base64');

async function createBaseTour(page:Page,{dresses=1,favoriteFirst=false,face=false}:{dresses?:number;favoriteFirst?:boolean;face?:boolean}={}){
  await page.goto('/');
  await page.getByRole('link',{name:/새 투어 시작/}).click();
  await page.getByPlaceholder('비워두면 자동으로 만들어요').fill('사용성 테스트');
  await page.getByRole('button',{name:'투어 만들기',exact:true}).click();
  const tourId=page.url().match(/\/tour\/([^/?#]+)/)![1];
  await page.getByRole('button',{name:/샵 추가/}).click();
  const add=page.getByRole('button',{name:'추가하기',exact:true});
  await expect(add).toBeDisabled();
  await page.getByPlaceholder('드레스샵 이름').fill('테스트 브라이덜');
  await expect(add).toBeEnabled();
  await add.click();
  await page.getByRole('button',{name:/테스트 브라이덜/}).click();
  await page.getByRole('button',{name:'드레스 추가',exact:true}).click();
  if(favoriteFirst)await page.getByLabel('후보').click();
  if(face){
    await page.locator('input[type="file"][accept*="image/heic"]').setInputFiles({name:'face.png',mimeType:'image/png',buffer:tinyPng});
    await expect(page.getByRole('status')).toContainText('얼굴 사진을 저장했어요.');
  }
  for(let index=1;index<dresses;index+=1){
    await page.getByRole('button',{name:'다음 드레스 추가',exact:true}).click();
  }
  return tourId;
}

async function expectNoHorizontalOverflow(page:Page){
  await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
}

test('mobile layouts do not horizontally overflow from 320px to 430px',async({page})=>{
  for(const size of [{width:320,height:568},{width:360,height:800},{width:390,height:844},{width:430,height:932}]){
    await page.setViewportSize(size);
    await page.goto('/');
    await expect(page.getByText('그림 대신')).toBeVisible();
    await expectNoHorizontalOverflow(page);
    await page.getByRole('link',{name:/새 투어 시작/}).click();
    await expectNoHorizontalOverflow(page);
  }
});

test('candidate filter never blocks choosing two dresses for comparison',async({page})=>{
  const tourId=await createBaseTour(page,{dresses:2,favoriteFirst:true});
  await page.goto(`/tour/${tourId}/review`);
  await page.getByRole('button',{name:/^후보 1$/}).click();
  await expect(page.getByRole('button',{name:/Dress 01/})).toBeVisible();
  await expect(page.getByRole('button',{name:/Dress 02/})).toHaveCount(0);
  await page.getByRole('button',{name:'2벌 비교',exact:true}).click();
  await expect(page.getByRole('button',{name:/Dress 02/})).toBeVisible();
  await page.getByRole('button',{name:/Dress 01/}).click();
  await page.getByRole('button',{name:/Dress 02/}).click();
  await expect(page.getByRole('button',{name:/선택한 2벌 비교하기/})).toBeEnabled();
});

test('last face position survives immediate navigation away',async({page})=>{
  const tourId=await createBaseTour(page,{face:true});
  const slider=page.getByLabel('좌우');
  await slider.fill('0.73');
  await slider.dispatchEvent('pointerup');
  await page.getByLabel('뒤로').click();
  await page.getByRole('button',{name:/Dress 01 편집/}).first().click();
  await expect(page.getByLabel('좌우')).toHaveValue('0.73');
  await expectNoHorizontalOverflow(page);
  expect(page.url()).toContain(`/tour/${tourId}/dress/`);
});

test('detail selection stops at four items without corrupting existing picks',async({page})=>{
  await createBaseTour(page);
  for(const name of ['코르셋','드레이핑','허리 리본','등 리본'])await page.getByRole('button',{name:new RegExp(name)}).click();
  await expect(page.getByRole('button',{name:/진주/})).toBeDisabled();
  for(const name of ['코르셋','드레이핑','허리 리본','등 리본'])await expect(page.getByRole('button',{name:new RegExp(name)})).toHaveAttribute('aria-pressed','true');
});

test('invalid import error stays visible instead of disappearing as a toast',async({page})=>{
  await page.goto('/import');
  await page.locator('input[type="file"]').setInputFiles({name:'not-a-pdf.pdf',mimeType:'application/pdf',buffer:Buffer.from('hello')});
  const alert=page.getByRole('alert');
  await expect(alert).toContainText('PDF 파일이 아니에요.');
  await page.waitForTimeout(2500);
  await expect(alert).toContainText('PDF 파일이 아니에요.');
});

test('bad compare URL recovers safely and recent tour deletion works',async({page})=>{
  const tourId=await createBaseTour(page);
  await page.goto(`/tour/${tourId}/compare?a=missing&b=also-missing`);
  await expect(page.getByText('비교할 드레스 2벌을 다시 선택해 주세요.')).toBeVisible();
  await page.goto('/');
  page.once('dialog',dialog=>dialog.accept());
  await page.getByLabel('사용성 테스트 삭제').click();
  await expect(page.getByText('아직 저장된 드레스투어가 없어요.')).toBeVisible();
});
