'use client';

import { QrCode, ChevronRight, Star, Settings, ScanLine, X, BadgeCheck, Pencil, Smile, Loader2, Image as ImageIcon, AlertTriangle, Palette, Languages, Globe, LogOut } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import QRCode from 'react-qr-code';
import { Html5Qrcode } from 'html5-qrcode';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabaseClient';
import Cropper from 'react-easy-crop';
import { t } from '../../lib/i18n';

async function getCroppedImg(imageSrc: string, pixelCrop: any): Promise<Blob> {
  const image = new window.Image();
  image.src = imageSrc;
  await new Promise(resolve => image.onload = resolve);
  const canvas = document.createElement('canvas');
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(image, pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height, 0, 0, pixelCrop.width, pixelCrop.height);
  return new Promise(resolve => canvas.toBlob(b => resolve(b!), 'image/jpeg', 0.9));
}

export function MeTab({ profile }: { profile: any }) {
  const router = useRouter();
  const [showQRModal, setShowQRModal] = useState(false);
  const [showScannerModal, setShowScannerModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [editName, setEditName] = useState(profile?.name || '');
  const [editBio, setEditBio] = useState(profile?.bio || '');
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [scannedProfile, setScannedProfile] = useState<any>(null);
  const [isAddingFriend, setIsAddingFriend] = useState(false);
  const [showAppealModal, setShowAppealModal] = useState(false);
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [showLangModal, setShowLangModal] = useState(false);
  const [translationLang, setTranslationLang] = useState(() => typeof window !== 'undefined' ? localStorage.getItem('quro_translation_lang') || profile?.quro_translation_lang || 'English' : 'English');
  const [appLang, setAppLang] = useState(() => typeof window !== 'undefined' ? localStorage.getItem('quro_app_lang') || profile?.quro_app_lang || 'English' : 'English');
  const [chatTheme, setChatTheme] = useState(() => typeof window !== 'undefined' ? localStorage.getItem('quro_chat_theme') || profile?.quro_chat_theme || 'Quro Classic (Green)' : 'Quro Classic (Green)');
  const [showAppLangModal, setShowAppLangModal] = useState(false);
  const [appealText, setAppealText] = useState('');
  const [isAppealApproved, setIsAppealApproved] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  const startScanner = async () => {
    try {
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode("qr-reader");
      }
      await scannerRef.current.start(
        { facingMode: "environment" },
        { fps: 10 },
        (decodedText) => {
          setScanResult(decodedText);
          scannerRef.current?.stop();
          try {
            new Audio('/wechat-scan.mp3').play().catch(() => { });
          } catch (e) { }
        },
        (errorMessage) => { }
      );
    } catch (err) {
      console.error("Error starting scanner", err);
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      await scannerRef.current.stop();
    }
    setShowScannerModal(false);
    setScanResult(null);
    setScannedProfile(null);
  };

  useEffect(() => {
    if (scanResult) {
      const fetchScannedUser = async () => {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', scanResult)
            .single();

          if (data) {
            setScannedProfile(data);
          } else {
            // If they scanned something that isn't a valid Quro UUID
            setScannedProfile({ id: scanResult, name: 'Unknown User' });
          }
        } catch (e) {
          console.error(e);
          setScannedProfile({ id: scanResult, name: 'Unknown User' });
        }
      };
      fetchScannedUser();
    }
  }, [scanResult]);

  const handleAddFriendAndChat = async () => {
    if (!scannedProfile) return;
    setIsAddingFriend(true);
    try {
      // Insert friendship record. If it already exists, Supabase will just fail silently or throw an error we can ignore
      await supabase.from('friends').insert({
        user_id: profile.id,
        friend_id: scannedProfile.id,
        connected_via: 'QR Code'
      });
      // Also insert the reverse direction so they both see each other
      await supabase.from('friends').insert({
        user_id: scannedProfile.id,
        friend_id: profile.id,
        connected_via: 'QR Code'
      });
    } catch (e) {
      // Ignore unique constraint errors
    } finally {
      setIsAddingFriend(false);
      stopScanner();
      router.push(`/chat/${scannedProfile.id}`);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setIsUploading(true);
      await supabase
        .from('profiles')
        .update({ name: editName, bio: editBio })
        .eq('id', profile.id);
      window.location.reload();
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile.');
    } finally {
      setIsUploading(false);
    }
  };

  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [showCropModal, setShowCropModal] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const reader = new FileReader();
      reader.onload = () => {
        setCropImageSrc(reader.result as string);
        setShowCropModal(true);
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleUploadAvatar = async () => {
    if (!cropImageSrc || !croppedAreaPixels) return;

    setIsUploading(true);
    setShowCropModal(false);
    try {
      const blob = await getCroppedImg(cropImageSrc, croppedAreaPixels);
      const fileName = `${profile.id}-${Math.random()}.jpg`;
      const filePath = `${profile.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, blob);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', profile.id);

      window.location.reload();
    } catch (error) {
      console.error('Error uploading avatar:', error);
      alert('Failed to upload avatar.');
      setIsUploading(false);
    }
  };

  const MenuItem = ({ icon: Icon, label, color }: { icon: any, label: string, color: string }) => (
    <button className="w-full bg-white flex items-center px-4 py-3 active:bg-gray-100 transition-colors">
      <div className="w-8 flex justify-center">
        <Icon size={24} color={color} />
      </div>
      <span className="flex-1 text-left text-[17px] ml-2 text-black">{label}</span>
      <ChevronRight size={20} className="text-gray-400" />
    </button>
  );

  return (
    <div className="flex flex-col h-full w-full bg-[#EDEDED] font-sans pb-10">

      {/* Profile Header Block */}
      <div className="bg-white px-4 pt-4 pb-8 flex items-center mb-2 cursor-pointer active:bg-gray-50 relative">
        <div className="relative">
          <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-200 shrink-0 border border-black/5">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gray-300 flex items-center justify-center text-2xl text-white font-bold">
                {profile?.name?.charAt(0) || 'U'}
              </div>
            )}
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); setShowEditModal(true); }}
            className="absolute -bottom-1 -right-1 bg-white rounded-full p-1.5 shadow-sm border border-gray-200 text-gray-500 hover:text-black"
          >
            <Pencil size={12} />
          </button>
        </div>

        <div className="ml-4 flex-1">
          <h2 className="text-[20px] font-semibold text-black mb-1 tracking-tight flex items-center gap-1">
            {profile?.name || 'User'}
            <BadgeCheck size={20} className="text-[#07C160] fill-[#07C160]/10" />
          </h2>
          <p className="text-[15px] text-gray-500 mb-1">
            QURO ID: {profile?.id?.substring(0, 8) || 'quro_1234'}
          </p>
          <p className="text-[13px] text-gray-400 line-clamp-1">
            {profile?.bio || "Tap pencil to add a bio..."}
          </p>
        </div>

        <div className="flex items-center gap-4 text-gray-400">
          <button onClick={(e) => { e.stopPropagation(); setShowQRModal(true); }} className="p-1 active:bg-gray-100 rounded">
            <QrCode size={20} />
          </button>
          <button onClick={(e) => {
            e.stopPropagation();
            setShowScannerModal(true);
            setTimeout(() => startScanner(), 300);
          }} className="p-1 active:bg-gray-100 rounded">
            <ScanLine size={20} />
          </button>
          <ChevronRight size={20} />
        </div>
      </div>

      {profile?.is_banned && (
        <div className="mx-4 mt-2 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3">
          <AlertTriangle size={24} className="text-red-500 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-red-800 font-bold text-sm mb-1">Account Restricted</h3>
            <p className="text-red-600 text-xs leading-snug mb-3">Your account has been restricted from chatting due to severe community guidelines violations.</p>
            <button onClick={() => setShowAppealModal(true)} className="bg-red-500 text-white text-xs font-bold px-4 py-2 rounded-lg active:bg-red-600 transition-colors shadow-sm">
              Appeal Now
            </button>
          </div>
        </div>
      )}

      {/* Menu Blocks */}
      <div className="flex flex-col gap-2 mt-4">
        <div className="bg-white">
          <MenuItem icon={Star} label={t('Favorites', appLang)} color="#F2C94C" />
          <div className="h-[1px] bg-gray-100 ml-14" />
          <div onClick={() => setShowThemeModal(true)}>
            <MenuItem icon={Palette} label={t('Chat Theme', appLang)} color="#07C160" />
          </div>
          <div className="h-[1px] bg-gray-100 ml-14" />
          <div onClick={() => setShowAppLangModal(true)}>
            <MenuItem icon={Globe} label={`${t('App Language', appLang)} (${appLang})`} color="#3498DB" />
          </div>
          <div className="h-[1px] bg-gray-100 ml-14" />
          <div onClick={() => setShowLangModal(true)}>
            <MenuItem icon={Languages} label={`${t('Translation Language', appLang)} (${translationLang})`} color="#8E44AD" />
          </div>
        </div>
        <div className="bg-white" onClick={() => router.push('/settings')}>
          <MenuItem icon={Settings} label={t('Settings', appLang)} color="#2F80ED" />
        </div>
      </div>

      <AnimatePresence>
        {/* QR Code Modal */}
        {showQRModal && (
          <motion.div
            key="qr-modal"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed inset-0 z-[100] bg-[#333] flex flex-col items-center justify-center"
          >
            <button onClick={() => setShowQRModal(false)} className="absolute top-6 left-6 p-2 text-white">
              <X size={28} />
            </button>
            <div className="bg-white shadow-2xl rounded-2xl p-8 flex flex-col items-center w-80">
              <div className="flex items-center gap-3 w-full mb-6">
                <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden border border-black/5">
                  {profile?.avatar_url && <img src={profile.avatar_url} className="w-full h-full object-cover" />}
                </div>
                <div>
                  <h3 className="font-bold text-black flex items-center gap-1">
                    {profile?.name || 'User'}
                    <BadgeCheck size={16} className="text-[#07C160] fill-[#07C160]/10" />
                  </h3>
                  <p className="text-xs text-gray-500">{profile?.country || 'Earth'}</p>
                </div>
              </div>
              <div className="w-full aspect-square bg-white">
                <QRCode
                  value={profile?.id || 'quro_qr_code'}
                  size={256}
                  level="H" // High detail level for a massive, complex QR
                  style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                />
              </div>
              <p className="text-xs text-gray-400 mt-6 text-center">Scan this QR Code to add me on Quro.</p>
            </div>
          </motion.div>
        )}

        {/* Scanner Modal */}
        {showScannerModal && (
          <motion.div
            key="scanner-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black flex flex-col"
          >
            <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-20 pointer-events-none">
              <button onClick={stopScanner} className="p-2 text-white bg-black/30 rounded-full backdrop-blur-md pointer-events-auto">
                <X size={28} />
              </button>
              <h2 className="text-lg font-medium text-white shadow-sm">Scan QR Code</h2>
              <div className="w-12"></div>
            </div>

            <div className="flex-1 relative bg-black flex flex-col items-center justify-center h-full w-full">
              {/* Full screen scanner container */}
              <div id="qr-reader" className="absolute inset-0 w-full h-full object-cover [&>video]:object-cover [&>video]:w-full [&>video]:h-full"></div>

              {!scanResult && (
                <>
                  {/* Scanner reticle / overlay */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                    <div className="w-72 h-72 border-2 border-[#07C160] opacity-80 relative shadow-[0_0_0_9999px_rgba(0,0,0,0.6)] rounded-lg overflow-hidden">
                      <motion.div
                        className="absolute left-0 right-0 h-0.5 bg-[#07C160] shadow-[0_0_15px_3px_#07C160]"
                        animate={{ top: ['0%', '100%', '0%'] }}
                        transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
                      />
                    </div>
                  </div>

                  {/* My QR Code Button */}
                  <div className="absolute bottom-16 left-0 right-0 flex justify-center z-20 pointer-events-auto">
                    <button
                      onClick={() => {
                        stopScanner();
                        setShowQRModal(true);
                      }}
                      className="px-6 py-3 bg-black/50 hover:bg-black/70 backdrop-blur-md border border-white/20 text-white rounded-full font-medium flex items-center gap-2 transition-all active:scale-95"
                    >
                      <QrCode size={20} />
                      My QR Code
                    </button>
                  </div>
                </>
              )}
              {/* Scan Result Prompt - Centered Modal */}
              {scanResult && scannedProfile && (
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="absolute inset-0 z-20 flex items-center justify-center bg-black/50 backdrop-blur-sm p-6"
                >
                  <div className="bg-white rounded-2xl p-6 shadow-2xl flex flex-col items-center text-black w-full max-w-sm">
                    <div className="w-20 h-20 rounded-full bg-gray-200 overflow-hidden mb-4 shadow-sm border border-black/5">
                      {scannedProfile.avatar_url ? (
                        <img src={scannedProfile.avatar_url} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-white bg-gray-300">
                          {scannedProfile.name?.charAt(0) || '?'}
                        </div>
                      )}
                    </div>

                    <h3 className="text-xl font-bold mb-1 flex items-center gap-1">
                      {scannedProfile.name}
                      <BadgeCheck size={20} className="text-[#07C160] fill-[#07C160]/10" />
                    </h3>
                    <p className="text-sm text-[#07C160] font-medium mb-1">Verified Quro User</p>
                    <p className="text-xs text-gray-500 mb-6 truncate w-full text-center">
                      ID: {scannedProfile.id.substring(0, 8)}
                    </p>

                    <button
                      onClick={handleAddFriendAndChat}
                      disabled={isAddingFriend}
                      className="w-full bg-[#07C160] text-white py-3.5 rounded-xl font-semibold active:bg-[#06ad56] flex items-center justify-center gap-2"
                    >
                      {isAddingFriend ? <Loader2 size={20} className="animate-spin" /> : <Smile size={20} />}
                      Become Friend & Chat
                    </button>

                    <button
                      onClick={() => { setScanResult(null); setScannedProfile(null); setTimeout(() => startScanner(), 300); }}
                      className="w-full mt-3 text-gray-500 py-2 rounded-lg font-medium active:bg-gray-100"
                    >
                      Scan Again
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}

        {/* Edit Profile Modal */}
        {showEditModal && (
          <motion.div
            key="edit-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4"
          >
            <div className="bg-white rounded-2xl p-6 w-full max-w-sm flex flex-col items-center">
              <h3 className="text-lg font-bold mb-4 text-black">Edit Profile</h3>

              <div className="w-24 h-24 rounded-full bg-gray-100 mb-6 overflow-hidden flex items-center justify-center border-2 border-dashed border-gray-300 relative group cursor-pointer shadow-sm">
                {profile?.avatar_url && !isUploading && (
                  <img src={profile.avatar_url} className="absolute inset-0 w-full h-full object-cover opacity-50" />
                )}
                {isUploading ? (
                  <Loader2 size={24} className="animate-spin text-black z-10" />
                ) : (
                  <label className="cursor-pointer w-full h-full flex flex-col items-center justify-center text-black z-10">
                    <ImageIcon size={24} className="mb-1" />
                    <span className="text-[10px] font-medium text-center leading-tight">Update<br />Pic</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
                  </label>
                )}
              </div>

              <div className="w-full mb-4">
                <label className="text-xs text-gray-500 font-semibold mb-1 block">Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-gray-100 border border-gray-200 rounded-lg p-3 text-black focus:outline-none focus:border-[#07C160]"
                  placeholder="Your Name"
                />
              </div>

              <div className="w-full mb-6">
                <label className="text-xs text-gray-500 font-semibold mb-1 block">Bio</label>
                <textarea
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  className="w-full bg-gray-100 border border-gray-200 rounded-lg p-3 text-black focus:outline-none focus:border-[#07C160] resize-none h-20"
                  placeholder="What's on your mind?"
                />
              </div>

              <div className="flex gap-3 w-full">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 py-3 bg-gray-100 text-black rounded-xl font-semibold hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveProfile}
                  disabled={isUploading}
                  className="flex-1 py-3 bg-[#07C160] text-white rounded-xl font-semibold hover:bg-[#06ad56] transition-colors disabled:opacity-50"
                >
                  Save
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Crop Modal */}
        {showCropModal && cropImageSrc && (
          <motion.div
            key="crop-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black flex flex-col"
          >
            <div className="flex justify-between items-center p-4 bg-black text-white z-10 shrink-0">
              <button onClick={() => { setShowCropModal(false); setCropImageSrc(null); }} className="text-white px-2">Cancel</button>
              <h2 className="text-lg font-medium">Crop Photo</h2>
              <button onClick={handleUploadAvatar} className="text-[#07C160] px-2 font-semibold">Done</button>
            </div>

            <div className="flex-1 relative">
              <Cropper
                image={cropImageSrc}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onCropComplete={(_, croppedPixels) => setCroppedAreaPixels(croppedPixels)}
                onZoomChange={setZoom}
              />
            </div>

            <div className="p-8 shrink-0 bg-black flex flex-col items-center">
              <input
                type="range"
                value={zoom}
                min={1}
                max={3}
                step={0.1}
                aria-labelledby="Zoom"
                onChange={(e) => setZoom(Number(e.target.value))}
                className="w-full max-w-xs accent-[#07C160]"
              />
              <p className="text-gray-400 text-xs mt-4">Pinch or use slider to zoom</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {/* Appeal Modal */}
        {showAppealModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl w-full max-w-sm p-6 flex flex-col items-center relative">
              <button onClick={() => setShowAppealModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors">
                <X size={24} />
              </button>
              
              {isAppealApproved ? (
                <div className="flex flex-col items-center justify-center text-center py-4">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-5">
                    <BadgeCheck size={48} className="text-[#07C160]" />
                  </div>
                  <h3 className="text-2xl font-extrabold mb-2 text-gray-900 tracking-tight">Appeal Approved</h3>
                  <p className="text-[#6A7282] text-sm leading-relaxed mb-8">
                    Thank you for your apology. We have lifted the restriction. Please follow our community guidelines moving forward.
                  </p>
                  <button 
                    onClick={() => {
                       setShowAppealModal(false);
                       window.location.reload();
                    }}
                    className="w-full py-3.5 bg-black text-white rounded-2xl font-bold text-sm tracking-wide transition-all active:scale-95 shadow-lg shadow-black/20"
                  >
                    Continue to Quro
                  </button>
                </div>
              ) : (
                <>
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                    <AlertTriangle size={32} className="text-red-500" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Submit Apology</h3>
                  <p className="text-sm text-gray-500 text-center mb-6">
                    Please acknowledge your violation and write a sincere apology. Our moderation team will review your case.
                  </p>
                  <textarea 
                    value={appealText}
                    onChange={(e) => setAppealText(e.target.value)}
                    placeholder="I apologize for my behavior..." 
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm h-32 resize-none mb-4 focus:outline-none focus:border-[#07C160]"
                  ></textarea>
                  <button 
                    disabled={appealText.trim().length < 5}
                    onClick={async () => { 
                      if (profile) {
                        await supabase.from('profiles').update({ is_banned: false, strikes: 0 }).eq('id', profile.id);
                        setIsAppealApproved(true);
                      }
                    }} 
                    className="w-full py-3.5 bg-[#07C160] text-white rounded-xl font-bold transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100 shadow-md shadow-[#07C160]/20"
                  >
                    Submit Apology
                  </button>
                </>
              )}
            </div>
          </motion.div>
        )}

        {/* App Language Modal */}
        {showAppLangModal && (
          <motion.div
            key="app-lang-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/60 flex flex-col items-center justify-end"
          >
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} className="bg-white w-full rounded-t-3xl p-6 pb-12 flex flex-col items-center">
              <div className="w-12 h-1 bg-gray-300 rounded-full mb-6"></div>
              <h3 className="text-xl font-bold mb-6 w-full text-left flex justify-between items-center">
                App Language
                <button onClick={() => setShowAppLangModal(false)}><X size={24} className="text-gray-400" /></button>
              </h3>
              <div className="w-full flex flex-col gap-3 max-h-64 overflow-y-auto">
                {['English', 'Hindi', 'Bengali', 'Telugu', 'Marathi', 'Tamil', 'Urdu', 'Gujarati', 'Kannada', 'Odia', 'Malayalam', 'Punjabi', 'Assamese', 'Nepali', 'Vietnamese', 'Spanish', 'French', 'Chinese', 'Japanese'].map(lang => (
                  <button key={lang} onClick={() => {
                    setAppLang(lang);
                    setTranslationLang(lang);
                    if (profile) {
                      profile.quro_app_lang = lang;
                      profile.quro_translation_lang = lang;
                    }
                    if (typeof window !== 'undefined') {
                      localStorage.setItem('quro_app_lang', lang);
                      localStorage.setItem('quro_translation_lang', lang);
                      window.dispatchEvent(new Event('language_changed'));
                    }
                    setShowAppLangModal(false);
                    supabase.from('profiles').update({ quro_app_lang: lang, quro_translation_lang: lang }).eq('id', profile?.id).then();
                  }} className={`w-full text-left py-4 px-4 rounded-xl font-medium flex justify-between items-center transition-colors ${appLang === lang ? 'bg-[#07C160]/10 text-[#07C160]' : 'bg-gray-50 text-gray-700 hover:bg-gray-100'}`}>
                    {lang}
                    {appLang === lang && <BadgeCheck size={20} className="text-[#07C160]" />}
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Translation Language Modal */}
        {showLangModal && (
          <motion.div
            key="lang-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/60 flex flex-col items-center justify-end"
          >
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} className="bg-white w-full rounded-t-3xl p-6 pb-12 flex flex-col items-center">
              <div className="w-12 h-1 bg-gray-300 rounded-full mb-6"></div>
              <h3 className="text-xl font-bold mb-6 w-full text-left flex justify-between items-center">
                Translation Language
                <button onClick={() => setShowLangModal(false)}><X size={24} className="text-gray-400" /></button>
              </h3>
              <div className="w-full flex flex-col gap-3 max-h-64 overflow-y-auto">
                {['English', 'Hindi', 'Bengali', 'Telugu', 'Marathi', 'Tamil', 'Urdu', 'Gujarati', 'Kannada', 'Odia', 'Malayalam', 'Punjabi', 'Assamese', 'Nepali', 'Vietnamese', 'Spanish', 'French', 'Chinese', 'Japanese'].map(lang => (
                  <button key={lang} onClick={() => {
                    setTranslationLang(lang);
                    if (profile) profile.quro_translation_lang = lang;
                    if (typeof window !== 'undefined') {
                      localStorage.setItem('quro_translation_lang', lang);
                    }
                    setShowLangModal(false);
                    supabase.from('profiles').update({ quro_translation_lang: lang }).eq('id', profile?.id).then();
                  }} className={`w-full text-left py-4 px-4 rounded-xl font-medium flex justify-between items-center transition-colors ${translationLang === lang ? 'bg-[#07C160]/10 text-[#07C160]' : 'bg-gray-50 text-gray-700 hover:bg-gray-100'}`}>
                    {lang}
                    {translationLang === lang && <BadgeCheck size={20} className="text-[#07C160]" />}
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Chat Theme Modal */}
        {showThemeModal && (
          <motion.div
            key="theme-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/60 flex flex-col items-center justify-end"
          >
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} className="bg-white w-full rounded-t-3xl p-6 pb-12 flex flex-col items-center">
              <div className="w-12 h-1 bg-gray-300 rounded-full mb-6"></div>
              <h3 className="text-xl font-bold mb-6 w-full text-left flex justify-between items-center">
                Chat Theme
                <button onClick={() => setShowThemeModal(false)}><X size={24} className="text-gray-400" /></button>
              </h3>
              <div className="w-full flex flex-col gap-3">
                {['Quro Classic (Green)', 'Ocean (Blue)', 'Sunset (Orange)', 'Midnight (Dark)', 'Anime Night (AI)', 'Serene Forest (AI)'].map(theme => (
                  <button key={theme} onClick={() => {
                    setChatTheme(theme);
                    if (profile) profile.quro_chat_theme = theme;
                    if (typeof window !== 'undefined') {
                      localStorage.setItem('quro_chat_theme', theme);
                    }
                    setShowThemeModal(false);
                    supabase.from('profiles').update({ quro_chat_theme: theme }).eq('id', profile?.id).then();
                  }} className={`w-full text-left py-4 px-4 rounded-xl font-medium flex justify-between items-center transition-colors ${chatTheme === theme ? 'bg-[#07C160]/10 text-[#07C160]' : 'bg-gray-50 text-gray-700 hover:bg-gray-100'}`}>
                    {theme}
                    {chatTheme === theme && <BadgeCheck size={20} className="text-[#07C160]" />}
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
