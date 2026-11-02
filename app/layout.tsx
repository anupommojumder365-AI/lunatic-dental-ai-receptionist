import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'Lunatic Dental Clinic | Meet your AI receptionist', description: 'A voice-first AI receptionist portfolio demonstration for Lunatic Dental Clinic.' };
export default function Layout({children}:{children:React.ReactNode}) { return <html lang="en"><body>{children}</body></html> }
