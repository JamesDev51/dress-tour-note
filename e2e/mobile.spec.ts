import { expect, test, type Page } from '@playwright/test';

const tinyPng=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAFElEQVR42mP8z8Dwn4GBgYGJAQoAHQkCAWJ6+ygAAAAASUVORK5CYII=','base64');

async function createTour(page:Page,{twoDresses=false,face=false}:{twoDresses?:boolean;face?:boolean}={}){
  await page.goto('/');
  await page.getByRole('link',{name:/새 투어 시작/}).click();
  await page.getByPlaceholder('예: 히똥').fill('E2E 신부');
  await page.getByPlaceholder('비워두면 자동으로 만들어요').fill('E2E 드레스투어');
  await page.getByRole('button',{name:'투어 만들기'}).click();
  await expect(page).toHaveURL(/\/tour\/[^/]+$/);
  const tourId=page.url().match(/\/tour\/([^/?#]+)/)![1];
  await page.getByRole('button',{name:/샵 추가/}).click();
  await page.getByPlaceholder('드레스샵 이름').fill('E2E 브라이덜');
  await page.getByRole('button',{name:'추가하기'}).click();
  await page.getByRole('button',{name:/E2E 브라이덜/}).click();
  await page.getByRole('button',{name:'드레스 추가'}).click();
  await page.getByRole('button',{name:/오프숄더/}).click();
  await page.getByRole('button',{name:/하트형/}).click();
  await page.getByRole('button',{name:/A라인/}).click();
  await page.getByRole('button',{name:/레이스/}).click();
  await page.getByRole('button',{name:/아이보리/}).click();
  await page.getByRole('button',{name:/보통 길이/}).click();
  await page.getByRole('button',{name:'더 자세히 기록'}).click();
  await page.getByRole('button',{name:/등 중앙 버튼/}).click();
  await page.getByPlaceholder(/허리가 제일 얇아/).fill('E2E 메모: 허리 라인이 가장 좋았음');
  await page.getByLabel('후보').click();
  if(face){
    await page.locator('input[type="file"][accept*="image/heic"]').setInputFiles({name:'face.png',mimeType:'image/png',buffer:tinyPng});
    await expect(page.getByRole('status')).toContainText('얼굴 사진을 저장했어요.');
  }
  await page.waitForTimeout(650);
  if(twoDresses){
    await page.getByRole('button',{name:'다음 드레스 추가'}).click();
    await page.getByRole('button',{name:/끈 없음/}).click();
    await page.getByRole('button',{name:/일자형/}).click();
    await page.getByRole('button',{name:/무릎부터 크게 퍼짐/}).click();
    await page.getByRole('button',{name:/매끈한 실크/}).click();
    await page.getByRole('button',{name:/새하얀 화이트/}).click();
    await page.getByPlaceholder(/허리가 제일 얇아/).fill('E2E 두 번째 드레스');
    await page.waitForTimeout(650);
  }
  return tourId;
}

test('mobile core flow autosaves, reloads and compares two dresses',async({page})=>{
  const tourId=await createTour(page,{twoDresses:true});
  await page.reload();
  await expect(page.getByPlaceholder(/허리가 제일 얇아/)).toHaveValue('E2E 두 번째 드레스');
  await page.goto(`/tour/${tourId}/review`);
  await expect(page.getByText('E2E 드레스투어')).toBeVisible();
  await page.getByRole('button',{name:/2벌 비교/}).click();
  await page.getByRole('button',{name:/Dress 01/}).click();
  await page.getByRole('button',{name:/Dress 02/}).click();
  await page.getByRole('button',{name:/선택한 2벌 비교하기/}).click();
  await expect(page.getByText('두 벌을')).toBeVisible();
  await expect(page.getByText('오프숄더')).toBeVisible();
  await expect(page.getByText('끈 없음')).toBeVisible();
  await expect(page.getByText('등 중앙 버튼')).toBeVisible();
});

test('portable PDF downloads, imports as a copy, and restores face data',async({page})=>{
  const tourId=await createTour(page,{face:true});
  await page.goto(`/tour/${tourId}/export`);
  await page.getByRole('button',{name:'복원 가능한 PDF 만들기'}).click();
  await expect(page.getByText('PDF가 준비됐어요.')).toBeVisible({timeout:40_000});
  const downloadPromise=page.waitForEvent('download');
  await page.getByRole('button',{name:'저장'}).click();
  const download=await downloadPromise;
  const path=await download.path();
  expect(path).toBeTruthy();
  await page.goto('/import');
  await page.locator('input[type="file"]').setInputFiles(path!);
  await expect(page.getByText('E2E 드레스투어')).toBeVisible({timeout:20_000});
  await expect(page.getByText('이 기기에 같은 투어가 있어요')).toBeVisible();
  await page.getByRole('button',{name:'이 기록 불러오기'}).click();
  await expect(page).toHaveURL(/\/tour\/[^/]+$/);
  expect(page.url()).not.toContain(tourId);
  await page.getByRole('button',{name:/E2E 브라이덜/}).click();
  await page.getByRole('button',{name:/Dress 01/}).click();
  await expect(page.locator('.dress-preview image')).toHaveCount(1);
  await expect(page.getByPlaceholder(/허리가 제일 얇아/)).toHaveValue('E2E 메모: 허리 라인이 가장 좋았음');
});

test('view-only PDF cannot be restored',async({page})=>{
  const tourId=await createTour(page);
  await page.goto(`/tour/${tourId}/export`);
  await page.getByRole('button',{name:/보기 전용 PDF/}).click();
  await page.getByRole('button',{name:'보기 전용 PDF 만들기'}).click();
  await expect(page.getByText('PDF가 준비됐어요.')).toBeVisible({timeout:40_000});
  const downloadPromise=page.waitForEvent('download');
  await page.getByRole('button',{name:'저장'}).click();
  const download=await downloadPromise;
  const path=await download.path();
  await page.goto('/import');
  await page.locator('input[type="file"]').setInputFiles(path!);
  await expect(page.getByRole('status')).toContainText('복원 가능한 그드레스 PDF가 아니에요.');
});

test('first loaded app works offline and makes no external network requests',async({page,context})=>{
  const external:string[]=[];
  page.on('request',request=>{const u=new URL(request.url());if((u.protocol==='http:'||u.protocol==='https:')&&u.origin!=='http://127.0.0.1:4173')external.push(request.url())});
  await page.goto('/');
  await expect(page.getByText('그림 대신')).toBeVisible();
  await page.evaluate(async()=>{await navigator.serviceWorker.ready});
  if(!(await page.evaluate(()=>Boolean(navigator.serviceWorker.controller))))await page.reload();
  await expect.poll(()=>page.evaluate(()=>Boolean(navigator.serviceWorker.controller))).toBe(true);
  await context.setOffline(true);
  await page.reload({waitUntil:'domcontentloaded'});
  await expect(page.getByText('그림 대신')).toBeVisible();
  expect(external).toEqual([]);
});
