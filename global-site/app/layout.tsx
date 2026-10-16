import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title:'GLOBAL — Образование без границ',description:'Твоя следующая точка — весь мир. Обучение за рубежом: 22 страны, 169+ университетов. Индивидуальная консультация GLOBAL.' };
export default function Layout({children}:{children:React.ReactNode}) {return <html lang="ru"><body>{children}</body></html>}
