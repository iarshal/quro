'use client';

import React, { useState, useEffect } from 'react';
import Script from 'next/script';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, ArrowRight, Camera, QrCode, User,
  Calendar, MessageCircle, Maximize, X, Shield, BadgeCheck, Check, 
  CheckCircle2, Laptop2, ChevronRight, Wallet, Settings, AlertTriangle
} from 'lucide-react';
import QRCode from 'react-qr-code';
import { Scanner } from '@yudiel/react-qr-scanner';

type FlowState = 'landing' | 'desktopQr' | 'profile' | 'dashboard' | 'me' | 'scanner';

export default function QuroResponsiveDemo() {
  const [appState, setAppState] = useState<FlowState>('landing');
  const [previousState, setPreviousState] = useState<FlowState>('landing');
  const [isDesktop, setIsDesktop] = useState(true);
  
  const [fullName, setFullName] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | null>(null);

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [scanError, setScanError] = useState(false);

  useEffect(() => {
    const checkDevice = () => {
      setIsDesktop(window.innerWidth > 768);
    };
    checkDevice();
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  useEffect(() => {
    const bc = new BroadcastChannel('quro_handshake_channel');
    bc.onmessage = (event) => {
      if (event.data.type === 'LOGIN_SUCCESS') {
        setIsLoggedIn(true);
      }
    };
    return () => bc.close();
  }, []);

  const handleGetStarted = () => {
    setAppState(isDesktop ? 'desktopQr' : 'profile');
  };

  const navigateToScanner = (fromTarget: FlowState) => {
    setPreviousState(fromTarget);
    setScanError(false); // Reset any existing scanner error
    setAppState('scanner');
  };

  const processScan = (result: any) => {
    if (!result || result.length === 0) return;
    
    if (result[0].rawValue === 'quro-session-handshake-998877') {
      setShowToast(true);
      setTimeout(() => {
        setIsLoggedIn(true);
        const bc = new BroadcastChannel('quro_handshake_channel');
        bc.postMessage({ type: 'LOGIN_SUCCESS' });
        bc.close();
      }, 1500);
    }
  };

  const pageVariants = {
    initial: { opacity: 0, scale: 0.98 },
    in: { opacity: 1, scale: 1, transition: { type: 'spring', damping: 25, stiffness: 200 } },
    out: { opacity: 0, scale: 0.98, transition: { duration: 0.2 } },
  };

  const mobileSlideVariants = {
    initial: { opacity: 0, x: 20 },
    in: { opacity: 1, x: 0, transition: { type: 'spring', damping: 25, stiffness: 200 } },
    out: { opacity: 0, x: -20, transition: { duration: 0.2 } },
  };

  // Reusable Bottom Navigation Block for Mobile States
  const BottomNavigation = ({ activeTab }: { activeTab: 'dashboard' | 'me' }) => (
    <div className="bg-[#F7F7F7] border-t border-gray-200 px-8 py-3 flex justify-between items-center pb-8 sticky bottom-0 z-20">
      <div 
        onClick={() => setAppState('dashboard')}
        className="flex flex-col items-center gap-1 cursor-pointer w-16 active:scale-95 transition-transform"
      >
        <MessageCircle 
          size={26} 
          className={activeTab === 'dashboard' ? 'text-[#07C160]' : 'text-[#999999]'} 
          fill={activeTab === 'dashboard' ? 'currentColor' : 'none'} 
          strokeWidth={1.5} 
        />
        <span className={`text-[10px] ${activeTab === 'dashboard' ? 'font-bold text-[#07C160]' : 'font-medium text-[#999999]'}`}>
          Chats
        </span>
      </div>
      
      <button 
        onClick={() => navigateToScanner(appState)}
        className="w-16 h-16 rounded-full bg-[#07C160] text-white flex items-center justify-center shadow-xl shadow-[#07C160]/30 -mt-10 active:scale-95 transition-transform border-[4px] border-[#F7F7F7]"
      >
        <QrCode size={26} strokeWidth={2.5} />
      </button>
      
      <div 
        onClick={() => setAppState('me')}
        className="flex flex-col items-center gap-1 cursor-pointer w-16 active:scale-95 transition-transform"
      >
        <User 
          size={26} 
          className={activeTab === 'me' ? 'text-[#07C160]' : 'text-[#999999]'} 
          fill={activeTab === 'me' ? 'currentColor' : 'none'} 
          strokeWidth={1.5} 
        />
        <span className={`text-[10px] ${activeTab === 'me' ? 'font-bold text-[#07C160]' : 'font-medium text-[#999999]'}`}>
          Me
        </span>
      </div>
    </div>
  );

  if (isLoggedIn) {
    return (
      <div className="relative min-h-[100dvh] w-full bg-[#F7F7F7] flex flex-col items-center justify-center overflow-hidden font-sans">
        <Script src="https://cdn.tailwindcss.com" strategy="beforeInteractive" />
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, type: 'spring' }}
          className="bg-white p-12 rounded-[2rem] shadow-sm border border-gray-100 flex flex-col items-center max-w-md w-full mx-4"
        >
          <div className="w-24 h-24 rounded-full bg-[#07C160]/10 flex items-center justify-center mb-6">
            <CheckCircle2 size={48} className="text-[#07C160]" />
          </div>
          <h1 className="text-3xl font-extrabold text-[#111111] tracking-tight mb-2">Authenticated</h1>
          <p className="text-[#999999] text-center mb-8">
            Your cryptographic keys have been securely synced. Welcome to Quro.
          </p>
          
          <div className="w-full bg-[#F7F7F7] p-5 rounded-2xl flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center">
              <Laptop2 className="text-[#999999]" size={24} />
            </div>
            <div>
              <p className="font-bold text-[#111111]">{isDesktop ? 'MacBook Pro' : 'iPhone 15 Pro'}</p>
              <p className="text-xs font-semibold text-[#07C160]">Active Session</p>
            </div>
          </div>

          <button
            onClick={() => { setIsLoggedIn(false); setAppState('landing'); }}
            className="text-[#999999] font-bold text-sm tracking-widest uppercase hover:text-[#111111] transition-colors"
          >
            End Session
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <>
      <Script src="https://cdn.tailwindcss.com" strategy="beforeInteractive" />

      <div className="relative min-h-[100dvh] w-full max-w-[1440px] mx-auto bg-[#F7F7F7] overflow-hidden font-sans">
        
        <AnimatePresence>
          {showToast && (
            <motion.div 
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 50 }}
              className="absolute bottom-12 left-0 right-0 z-[100] flex justify-center pointer-events-none"
            >
              <div className="bg-[#111111] text-white px-6 py-4 rounded-full shadow-2xl flex items-center gap-3">
                <CheckCircle2 className="text-[#07C160]" size={22} strokeWidth={3} />
                <span className="font-bold tracking-wide">Session Authorized!</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          
          {appState === 'landing' && (
            <motion.div
              key="landing"
              variants={pageVariants}
              initial="initial"
              animate="in"
              exit="out"
              className="absolute inset-0 flex flex-col bg-white"
            >
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-15%] left-[-10%] w-[500px] h-[500px] rounded-full bg-gradient-to-br from-[#07C160]/10 to-transparent blur-3xl animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-5%] w-[400px] h-[400px] rounded-full bg-gradient-to-tl from-gray-200 to-transparent blur-[80px]" />
              </div>

              <header className="w-full flex justify-between items-center p-6 md:p-10 z-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#111111] flex items-center justify-center shadow-sm">
                    <span className="text-white text-xl font-bold">Q</span>
                  </div>
                  <span className="text-xl font-bold text-[#111111] tracking-tight">Quro</span>
                </div>
                <nav className="text-sm font-semibold text-[#999999] hover:text-[#111111] cursor-pointer transition-colors hidden md:block">
                  Secure Enterprise Matrix
                </nav>
              </header>

              <main className="flex-1 flex flex-col items-center justify-center p-6 z-10">
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.1, duration: 0.6 }}
                  className="text-center max-w-2xl"
                >
                  <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter text-[#111111] leading-tight mb-6">
                    Communication,<br />
                    <span className="text-[#07C160]">Redefined.</span>
                  </h1>
                  <p className="text-[#999999] text-lg md:text-xl font-medium tracking-wide mb-12">
                    The zero-trust messaging architecture built for the modern era.
                  </p>
                  <div className="flex justify-center flex-col items-center gap-4">
                    <button
                      onClick={handleGetStarted}
                      className="flex items-center justify-center gap-3 bg-[#07C160] hover:bg-[#06ad56] text-white py-4 md:py-5 px-8 md:px-10 rounded-full font-bold text-lg transition-transform active:scale-95 shadow-lg shadow-[#07C160]/20"
                    >
                      <span>Get Started</span>
                      <ArrowRight size={24} className="stroke-[2.5px]" />
                    </button>
                    <span className="text-xs font-semibold text-[#999999] uppercase tracking-widest mt-4">
                      {isDesktop ? 'Navigating to Desktop Portal' : 'Mobile Onboarding Activated'}
                    </span>
                  </div>
                </motion.div>
              </main>
            </motion.div>
          )}

          {appState === 'desktopQr' && (
            <motion.div
              key="desktopQr"
              variants={pageVariants}
              initial="initial"
              animate="in"
              exit="out"
              className="absolute inset-0 flex flex-col items-center justify-center bg-[#F7F7F7]"
            >
              <div className="max-w-md w-full bg-white p-10 md:p-12 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 flex flex-col items-center text-center relative overflow-hidden">
                <motion.div 
                  className="absolute inset-0 border-[3px] border-[#07C160] rounded-[2rem] opacity-0"
                  animate={{ opacity: [0, 0.4, 0], scale: [0.98, 1, 1.02] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
                />

                <div className="w-16 h-16 rounded-2xl bg-[#07C160]/10 flex items-center justify-center mb-6">
                  <QrCode size={32} className="text-[#07C160]" />
                </div>
                
                <h2 className="text-3xl font-bold text-[#111111] tracking-tight mb-3">
                  Log in to Web
                </h2>
                <p className="text-[#999999] text-sm mb-10 max-w-[280px]">
                  Scan with your phone to securely sync your cryptographic keys.
                </p>

                <div className="relative p-3 bg-white rounded-[1.5rem] border border-gray-100 mb-8 w-64 h-64 flex flex-col items-center justify-center shadow-sm">
                  <div className="absolute inset-0 border-2 border-[#07C160]/20 rounded-[1.5rem]" />
                  
                  <div className="w-full h-full rounded-xl overflow-hidden opacity-90 p-2">
                    <QRCode 
                      value="quro-session-handshake-998877" 
                      size={200} 
                      style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                      bgColor="#FFFFFF"
                      fgColor="#111111"
                    />
                  </div>
                  
                  <div className="absolute bg-white rounded-lg p-1.5 shadow-sm border border-gray-100 flex items-center justify-center">
                    <div className="w-8 h-8 rounded-md bg-[#111111] flex items-center justify-center">
                      <span className="text-white text-xs font-bold">Q</span>
                    </div>
                  </div>

                  <motion.div 
                    className="absolute top-0 left-0 w-full h-[2px] bg-[#07C160] shadow-[0_0_8px_2px_#07C160]"
                    animate={{ y: [0, 250, 0] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  />
                </div>

                <p className="text-[10px] font-mono text-gray-400 mb-6 tracking-widest uppercase">
                  quro-session-handshake-998877
                </p>

                <button
                  onClick={() => setAppState('landing')}
                  className="text-[#999999] hover:text-[#111111] font-bold text-sm uppercase tracking-wider transition-colors active:scale-95"
                >
                  Cancel & Return
                </button>
              </div>
            </motion.div>
          )}

          {appState === 'profile' && (
            <motion.div
              key="profile"
              variants={mobileSlideVariants}
              initial="initial"
              animate="in"
              exit="out"
              className="absolute inset-0 flex flex-col bg-white sm:max-w-md sm:mx-auto sm:border-x sm:border-gray-200 shadow-[0_8px_30px_rgb(0,0,0,0.08)]"
            >
              <header className="px-4 py-4 flex items-center justify-between bg-white border-b border-gray-50 sticky top-0 z-10">
                <button 
                  onClick={() => setAppState('landing')}
                  className="p-2 -ml-2 rounded-full text-[#111111] active:bg-gray-100 transition-colors"
                >
                  <ChevronLeft size={28} className="stroke-[2px]" />
                </button>
                <h1 className="font-bold text-lg text-[#111111]">Profile Setup</h1>
                <div className="w-10"></div>
              </header>

              <main className="flex-1 px-6 pt-8 pb-32 flex flex-col bg-white overflow-y-auto relative">
                <div className="flex justify-center mb-12">
                  <div className="relative cursor-pointer active:scale-95 transition-transform">
                    <div className="w-[120px] h-[120px] rounded-full bg-[#F7F7F7] border border-gray-100 flex items-center justify-center overflow-hidden shadow-sm">
                      <Camera size={32} className="text-[#999999]" strokeWidth={1.5} />
                    </div>
                    <div className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-[#07C160] border-[3px] border-white flex items-center justify-center">
                      <span className="text-white font-bold text-lg mt-[-2px]">+</span>
                    </div>
                  </div>
                </div>

                <div className="relative mb-8 group">
                  <div className="flex items-center gap-4 border-b border-gray-200 pb-3 transition-colors focus-within:border-transparent">
                    <User size={24} className="text-[#999999] group-focus-within:text-[#07C160] transition-colors" />
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Full Name"
                      className="w-full bg-transparent text-xl font-medium text-[#111111] placeholder:text-[#DBDBDB] outline-none"
                      autoComplete="off"
                    />
                  </div>
                  <div className={`absolute bottom-0 left-0 h-[2px] bg-[#07C160] transition-all duration-300 ease-out ${fullName.length > 0 ? 'w-full' : 'w-0'}`} />
                </div>

                <div className="mb-8">
                  <label className="block text-xs font-semibold text-[#999999] uppercase tracking-wider mb-3">Gender</label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => setGender('male')}
                      className={`py-3 px-4 rounded-xl flex items-center justify-center gap-2 border-[1.5px] transition-all active:scale-95 ${
                        gender === 'male' 
                          ? 'border-[#07C160] bg-[#07C160]/5 text-[#07C160]' 
                          : 'border-gray-100 bg-white text-[#999999] hover:bg-gray-50'
                      }`}
                    >
                      {gender === 'male' && <Check size={18} strokeWidth={3} />}
                      <span className="font-semibold text-lg">Male</span>
                    </button>
                    <button
                      onClick={() => setGender('female')}
                      className={`py-3 px-4 rounded-xl flex items-center justify-center gap-2 border-[1.5px] transition-all active:scale-95 ${
                        gender === 'female' 
                          ? 'border-[#07C160] bg-[#07C160]/5 text-[#07C160]' 
                          : 'border-gray-100 bg-white text-[#999999] hover:bg-gray-50'
                      }`}
                    >
                      {gender === 'female' && <Check size={18} strokeWidth={3} />}
                      <span className="font-semibold text-lg">Female</span>
                    </button>
                  </div>
                </div>

                <div className="relative mb-12 group">
                  <div className="flex items-center gap-4 border-b border-gray-200 pb-3 transition-colors focus-within:border-transparent">
                    <Calendar size={24} className="text-[#999999] group-focus-within:text-[#07C160] transition-colors" />
                    <input
                      type="date"
                      value={dob}
                      onChange={(e) => setDob(e.target.value)}
                      className="w-full bg-transparent text-xl font-medium text-[#111111] outline-none [color-scheme:light]"
                    />
                  </div>
                  <div className={`absolute bottom-0 left-0 h-[2px] bg-[#07C160] transition-all duration-300 ease-out ${dob.length > 0 ? 'w-full' : 'w-0'}`} />
                </div>

                <div className="mt-auto">
                  <button
                    onClick={() => setAppState('dashboard')}
                    disabled={fullName.trim().length === 0 || dob.length === 0 || gender === null}
                    className={`w-full py-4 rounded-full font-bold text-lg transition-all duration-300 ${
                      fullName.trim().length > 0 && dob.length > 0 && gender !== null
                        ? 'bg-[#07C160] text-white shadow-lg active:scale-95'
                        : 'bg-[#F7F7F7] text-[#999999] cursor-not-allowed border border-gray-100'
                    }`}
                  >
                    Continue
                  </button>
                </div>
              </main>

              <div className="absolute bottom-6 right-6 z-20">
                <button 
                  onClick={() => navigateToScanner('profile')}
                  className="flex items-center gap-3 bg-[#111111] text-white px-5 py-4 rounded-full shadow-2xl active:scale-95 transition-transform border border-black/10"
                >
                  <Maximize size={22} className="text-[#07C160]" />
                  <span className="font-bold text-sm">Scan Desktop QR</span>
                </button>
              </div>
            </motion.div>
          )}

          {appState === 'dashboard' && (
            <motion.div
              key="dashboard"
              variants={mobileSlideVariants}
              initial="initial"
              animate="in"
              exit="out"
              className="absolute inset-0 flex flex-col bg-[#F7F7F7] sm:max-w-md sm:mx-auto sm:border-x sm:border-gray-200"
            >
              <header className="px-6 py-4 bg-[#F7F7F7] flex justify-between items-center sticky top-0 z-10 pb-2">
                <h1 className="text-[28px] font-bold text-[#111111] tracking-tight">Chats</h1>
              </header>

              <main className="flex-1 overflow-y-auto px-4 pb-4 flex flex-col gap-2 pt-2">
                <div className="bg-white p-4 rounded-2xl flex items-center gap-4 shadow-[0_2px_10px_rgb(0,0,0,0.02)] cursor-pointer active:bg-gray-100 transition-colors">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#07C160] to-[#06ad56] flex items-center justify-center flex-shrink-0 shadow-sm">
                    <Shield size={26} className="text-white" strokeWidth={2} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-1">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <h3 className="font-bold text-[#111111] text-[17px] truncate">Quro Security Center</h3>
                        <BadgeCheck size={18} className="text-[#1D9BF0] flex-shrink-0" fill="white" />
                      </div>
                      <span className="text-xs font-medium text-[#999999] flex-shrink-0 ml-2">Just now</span>
                    </div>
                    <p className="text-[#999999] text-[14px] truncate">Login alert: New web session active.</p>
                  </div>
                </div>
              </main>

              <BottomNavigation activeTab="dashboard" />
            </motion.div>
          )}

          {/* ========================================================= */}
          {/* STATE: "ME" TAB (Profile cloned from WeChat)                */}
          {/* ========================================================= */}
          {appState === 'me' && (
            <motion.div
              key="me"
              variants={mobileSlideVariants}
              initial="initial"
              animate="in"
              exit="out"
              className="absolute inset-0 flex flex-col bg-[#F7F7F7] sm:max-w-md sm:mx-auto sm:border-x sm:border-gray-200"
            >
              <main className="flex-1 overflow-y-auto flex flex-col">
                {/* Top WeChat Style Identity Card */}
                <div className="bg-white px-6 pt-[12vh] pb-8 flex items-center shadow-sm cursor-pointer active:bg-gray-50 transition-colors">
                  <div className="w-20 h-20 rounded-2xl bg-[#07C160] flex flex-shrink-0 items-center justify-center shadow-sm relative mr-5 overflow-hidden">
                    <User size={40} color="white" strokeWidth={1.5} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-2xl font-bold text-[#111111] tracking-tight mb-1 truncate">
                      {fullName || 'Guest User'}
                    </h2>
                    <p className="text-[15px] font-medium text-[#999999] truncate">
                      Quro ID: quro_{Math.floor(Math.random() * 90000) + 10000}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 opacity-60">
                    <QrCode size={18} className="text-[#111111]" />
                    <ChevronRight size={20} className="text-[#999999]" />
                  </div>
                </div>

                {/* Grouped Settings Block */}
                <div className="mt-3 bg-white flex flex-col shadow-[0_2px_10px_rgb(0,0,0,0.01)] border-y border-gray-100">
                  <div className="flex items-center pl-4 cursor-pointer active:bg-gray-100 transition-colors">
                    <div className="mr-3">
                      <Wallet size={24} className="text-[#07C160]" />
                    </div>
                    <div className="flex-1 py-4 pr-4 flex justify-between items-center border-b border-gray-100">
                      <span className="text-[17px] font-medium text-[#111111]">Services</span>
                      <ChevronRight size={20} className="text-[#CCC]" />
                    </div>
                  </div>
                  
                  <div className="flex items-center pl-4 cursor-pointer active:bg-gray-100 transition-colors">
                    <div className="mr-3">
                      <Settings size={24} className="text-[#3B82F6]" />
                    </div>
                    <div className="flex-1 py-4 pr-4 flex justify-between items-center">
                      <span className="text-[17px] font-medium text-[#111111]">Settings</span>
                      <ChevronRight size={20} className="text-[#CCC]" />
                    </div>
                  </div>
                </div>
              </main>

              <BottomNavigation activeTab="me" />
            </motion.div>
          )}

          {appState === 'scanner' && (
            <motion.div
              key="scanner"
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute inset-0 bg-[#000000] flex flex-col items-center sm:max-w-md sm:mx-auto overflow-hidden z-50 text-white"
            >
              
              <div className="absolute inset-0 z-0 bg-[#1A1A1A] w-full h-full opacity-50" />
              
              <div className="absolute inset-0 z-0">
                {!scanError ? (
                  <Scanner
                    onScan={processScan}
                    onError={(err) => {
                      console.error('Camera Error:', err);
                      setScanError(true);
                    }}
                    components={{ audio: false, finder: false, torch: false }}
                    styles={{ container: { width: "100%", height: "100%", objectFit: "cover" } }}
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-[#111111] px-8 text-center">
                    <AlertTriangle size={48} className="text-[#FA5151] mb-4" />
                    <h2 className="text-xl font-bold mb-2">Camera Access Denied</h2>
                    <p className="text-[#999999] text-sm leading-relaxed">
                      Please ensure you are on an <span className="text-white font-medium">HTTPS</span> connection or <span className="text-white font-medium">localhost</span> to test the scanner, and have granted browser camera permissions.
                    </p>
                  </div>
                )}
              </div>

              {/* Viewfinder Overlay Mask (only show if no error) */}
              {!scanError && (
                <div className="absolute inset-0 pointer-events-none flex flex-col items-center pt-[25vh] z-10 shadow-[0_0_0_4000px_rgba(0,0,0,0.7)]">
                  <div className="w-[260px] h-[260px] relative rounded-lg">
                    <div className="absolute top-0 left-0 w-6 h-6 border-t-[3px] border-l-[3px] border-[#07C160]" />
                    <div className="absolute top-0 right-0 w-6 h-6 border-t-[3px] border-r-[3px] border-[#07C160]" />
                    <div className="absolute bottom-0 left-0 w-6 h-6 border-b-[3px] border-l-[3px] border-[#07C160]" />
                    <div className="absolute bottom-0 right-0 w-6 h-6 border-b-[3px] border-r-[3px] border-[#07C160]" />

                    <motion.div
                      className="absolute left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#07C160] to-transparent shadow-[0_0_12px_2px_#07C160]"
                      animate={{ top: ['0%', '100%', '0%'] }}
                      transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
                    />
                  </div>
                  
                  <p className="mt-8 text-[13px] font-medium text-gray-300 tracking-widest text-center px-8 leading-relaxed">
                    Align QR Code within frame to scan.<br/>
                    Recognition is automatic.
                  </p>
                </div>
              )}

              <header className="w-full px-6 py-6 flex justify-between items-center z-20">
                <button 
                  onClick={() => setAppState(previousState)}
                  className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center active:scale-95 transition-transform"
                >
                  <X size={24} />
                </button>
                <h1 className="font-bold text-[17px] tracking-tight text-white shadow-sm">Scan QR</h1>
                <div className="w-10"></div>
              </header>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </>
  );
}
