'use client';

import { useEffect, useRef } from 'react';

interface ZegoCloudWrapperProps {
  roomID: string;
  userID: string;
  userName: string;
  callType: 'video' | 'audio';
}

export function ZegoCloudWrapper({ roomID, userID, userName, callType }: ZegoCloudWrapperProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Note: ZegoCloud integration requires the '@zegocloud/zego-uikit-prebuilt' package.
    // Ensure you install it: `npm install @zegocloud/zego-uikit-prebuilt`
    // 
    // The AppID and ServerSecret must be provided via environment variables.
    // NEXT_PUBLIC_ZEGOCLOUD_APP_ID and NEXT_PUBLIC_ZEGOCLOUD_SERVER_SECRET

    const initZego = async () => {
      const appID = Number(process.env.NEXT_PUBLIC_ZEGOCLOUD_APP_ID);
      const serverSecret = process.env.NEXT_PUBLIC_ZEGOCLOUD_SERVER_SECRET;

      if (!appID || !serverSecret) {
        console.error('ZegoCloud AppID or ServerSecret is missing.');
        if (containerRef.current) {
          containerRef.current.innerHTML = `
            <div class="flex flex-col items-center justify-center h-full text-white text-center p-6">
              <div class="w-16 h-16 bg-red-500/20 text-red-400 rounded-2xl flex items-center justify-center mb-4">
                 <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              </div>
              <h3 class="text-xl font-bold mb-2">Configuration Required</h3>
              <p class="text-gray-400 max-w-md">
                ZegoCloud AppID and ServerSecret are missing. Please add NEXT_PUBLIC_ZEGOCLOUD_APP_ID and NEXT_PUBLIC_ZEGOCLOUD_SERVER_SECRET to your .env.local file.
              </p>
            </div>
          `;
        }
        return;
      }

      try {
        // Dynamically import to avoid SSR issues with ZegoCloud
        const { ZegoUIKitPrebuilt } = await import('@zegocloud/zego-uikit-prebuilt');
        
        // Generate Kit Token
        const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
          appID,
          serverSecret,
          roomID,
          userID,
          userName
        );

        // Create instance object from kit token
        const zp = ZegoUIKitPrebuilt.create(kitToken);
        
        // Start the call
        zp.joinRoom({
          container: containerRef.current,
          sharedLinks: [
            {
              name: 'Personal link',
              url: window.location.origin + window.location.pathname + '?roomID=' + roomID,
            },
          ],
          scenario: {
            mode: ZegoUIKitPrebuilt.OneONoneCall, // 1-on-1 call
          },
          turnOnMicrophoneWhenJoining: true,
          turnOnCameraWhenJoining: callType === 'video',
          showMyCameraToggleButton: true,
          showMyMicrophoneToggleButton: true,
          showAudioVideoSettingsButton: true,
          showScreenSharingButton: false,
          showTextChat: false, // We have our own chat
          showUserList: false,
        });

      } catch (error) {
        console.error('Error initializing ZegoCloud:', error);
      }
    };

    if (containerRef.current) {
      initZego();
    }

    return () => {
      // Cleanup ZegoCloud instance if necessary
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [roomID, userID, userName, callType]);

  return (
    <div 
      className="w-full h-full zego-container"
      ref={containerRef} 
    />
  );
}
