'use client';

import { QrCode, ChevronRight, Star, Settings, ScanLine, X, BadgeCheck, Pencil, Smile, Loader2, Image as ImageIcon } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import QRCode from 'react-qr-code';
import { Html5Qrcode } from 'html5-qrcode';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabaseClient';

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
  const scannerRef = useRef<Html5Qrcode | null>(null);

  const startScanner = async () => {
    try {
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode("qr-reader");
      }
      await scannerRef.current.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          setScanResult(decodedText);
          scannerRef.current?.stop();
          try {
            new Audio('/wechat-scan.mp3').play().catch(() => {});
          } catch(e) {}
        },
        (errorMessage) => {}
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

  const handleUploadAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${profile.id}-${Math.random()}.${fileExt}`;
      const filePath = `${profile.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', profile.id);

      // Force reload to show new avatar immediately
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
          <div className="w-16 h-16 rounded-[10px] overflow-hidden bg-gray-200 shrink-0">
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
            className="absolute -bottom-2 -right-2 bg-white rounded-full p-1.5 shadow-sm border border-gray-200 text-gray-500 hover:text-black"
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
            WeChat ID: {profile?.id?.substring(0, 8) || 'wxid_1234'}
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

      {/* Menu Blocks - Simplified */}
      <div className="flex flex-col gap-2">
        <div className="bg-white">
          <MenuItem icon={Star} label="Favorites" color="#F2C94C" />
        </div>
        <div className="bg-white">
          <MenuItem icon={Settings} label="Settings" color="#2F80ED" />
        </div>
      </div>

      <AnimatePresence>
        {/* QR Code Modal */}
        {showQRModal && (
          <motion.div 
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
                <div className="w-12 h-12 rounded bg-gray-200 overflow-hidden">
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
              <p className="text-xs text-gray-400 mt-6 text-center">Scan this QR Code to add me on WeChat.</p>
            </div>
          </motion.div>
        )}

        {/* Scanner Modal */}
        {showScannerModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black flex flex-col"
          >
            <div className="flex justify-between items-center p-6 bg-black text-white z-10">
              <button onClick={stopScanner} className="p-2">
                <X size={28} />
              </button>
              <h2 className="text-lg font-medium">Scan QR Code</h2>
              <div className="w-8"></div>
            </div>
            
            <div className="flex-1 relative bg-black flex flex-col items-center justify-center">
              <div id="qr-reader" className="w-full max-w-sm overflow-hidden" style={{ borderRadius: '12px' }}></div>
              
              {!scanResult && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                  <div className="w-64 h-64 border-2 border-[#07C160] opacity-50 relative">
                    <motion.div 
                      className="absolute left-0 right-0 h-0.5 bg-[#07C160] shadow-[0_0_10px_#07C160]"
                      animate={{ top: ['0%', '100%', '0%'] }}
                      transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    />
                  </div>
                </div>
              )}
              {/* Scan Result Prompt - Centered Modal */}
              {scanResult && scannedProfile && (
                <motion.div 
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="absolute inset-0 z-20 flex items-center justify-center bg-black/50 backdrop-blur-sm p-6"
                >
                  <div className="bg-white rounded-2xl p-6 shadow-2xl flex flex-col items-center text-black w-full max-w-sm">
                    <div className="w-20 h-20 rounded-2xl bg-gray-200 overflow-hidden mb-4 shadow-sm">
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
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4"
          >
            <div className="bg-white rounded-2xl p-6 w-full max-w-sm flex flex-col items-center">
              <h3 className="text-lg font-bold mb-4 text-black">Edit Profile</h3>
              
              <div className="w-24 h-24 rounded-[16px] bg-gray-100 mb-6 overflow-hidden flex items-center justify-center border-2 border-dashed border-gray-300 relative group cursor-pointer">
                {profile?.avatar_url && !isUploading && (
                  <img src={profile.avatar_url} className="absolute inset-0 w-full h-full object-cover opacity-50" />
                )}
                {isUploading ? (
                  <Loader2 size={24} className="animate-spin text-black z-10" />
                ) : (
                  <label className="cursor-pointer w-full h-full flex flex-col items-center justify-center text-black z-10">
                    <ImageIcon size={24} className="mb-1" />
                    <span className="text-[10px] font-medium">Update Pic</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleUploadAvatar} />
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
      </AnimatePresence>
    </div>
  );
}
