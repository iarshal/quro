const { ZegoUIKitPrebuilt } = require('@zegocloud/zego-uikit-prebuilt');
try {
  const token = ZegoUIKitPrebuilt.generateKitTokenForTest(2050004947, 'ef5accb73936a031ebb7cee9986b5685', 'room1', 'user1', 'User 👑');
  console.log("Token generated successfully!");
} catch (e) {
  console.log("CRASHED:", e.name, e.message);
}
