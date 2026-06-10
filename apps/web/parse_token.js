const kit = require('@zegocloud/zego-uikit-prebuilt').ZegoUIKitPrebuilt;
const kitToken = kit.generateKitTokenForTest(2050004947, 'ef5accb73936a031ebb7cee9986b5685', 'room1', 'user1', 'name1');
const base64str = kitToken.split('#')[1];
const decoded = Buffer.from(base64str, 'base64').toString('utf8');
console.log(decoded);
