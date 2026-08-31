import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { MobileShell } from '../components/MobileShell';
import { HomePage } from '../features/home/HomePage';
import { NewTourPage } from '../features/tours/NewTourPage';
import { TourDashboardPage } from '../features/tours/TourDashboardPage';
import { ShopPage } from '../features/shops/ShopPage';
import { DressEditorPage } from '../features/dress-editor/DressEditorPage';
import { ReviewPage } from '../features/review/ReviewPage';
import { ComparePage } from '../features/compare/ComparePage';
import { PrivacyPage } from '../features/privacy/PrivacyPage';
const ExportPage=lazy(()=>import('../features/pdf-export/ExportPage').then(m=>({default:m.ExportPage})));
const ImportPage=lazy(()=>import('../features/pdf-import/ImportPage').then(m=>({default:m.ImportPage})));
const Loading=()=> <main className="grid min-h-dvh place-items-center text-sm text-stone-400">불러오는 중...</main>;
export const router=createBrowserRouter([{element:<MobileShell/>,children:[
  {path:'/',element:<HomePage/>},{path:'/tour/new',element:<NewTourPage/>},{path:'/tour/:tourId',element:<TourDashboardPage/>},{path:'/tour/:tourId/shop/:shopId',element:<ShopPage/>},{path:'/tour/:tourId/dress/:dressId',element:<DressEditorPage/>},{path:'/tour/:tourId/review',element:<ReviewPage/>},{path:'/tour/:tourId/compare',element:<ComparePage/>},{path:'/tour/:tourId/export',element:<Suspense fallback={<Loading/>}><ExportPage/></Suspense>},{path:'/import',element:<Suspense fallback={<Loading/>}><ImportPage/></Suspense>},{path:'/privacy',element:<PrivacyPage/>},{path:'*',element:<Navigate to="/" replace/>}
]}]);
