export const translations: Record<string, Record<string, string>> = {
  'English': {
    'Chats': 'Chats',
    'Contacts': 'Contacts',
    'Me': 'Me',
    'Favorites': 'Favorites',
    'Chat Theme': 'Chat Theme',
    'App Language': 'App Language',
    'Translation Language': 'Translation Language',
    'Settings': 'Settings',
  },
  'Bengali': {
    'Chats': 'চ্যাট',
    'Contacts': 'পরিচিতি',
    'Me': 'আমি',
    'Favorites': 'পছন্দসমূহ',
    'Chat Theme': 'চ্যাট থিম',
    'App Language': 'অ্যাপ ভাষা',
    'Translation Language': 'অনুবাদ ভাষা',
    'Settings': 'সেটিংস',
  },
  'Hindi': {
    'Chats': 'चैट',
    'Contacts': 'संपर्क',
    'Me': 'मैं',
    'Favorites': 'पसंदीदा',
    'Chat Theme': 'चैट थीम',
    'App Language': 'ऐप भाषा',
    'Translation Language': 'अनुवाद भाषा',
    'Settings': 'सेटिंग्स',
  },
  'Odia': {
    'Chats': 'ଚାଟ୍',
    'Contacts': 'ସମ୍ପର୍କ',
    'Me': 'ମୁଁ',
    'Favorites': 'ପସନ୍ଦ',
    'Chat Theme': 'ଚାଟ୍ ଥିମ୍',
    'App Language': 'ଆପ୍ ଭାଷା',
    'Translation Language': 'ଅନୁବାଦ ଭାଷା',
    'Settings': 'ସେଟିଂସମୂହ',
  },
  'Vietnamese': {
    'Chats': 'Trò chuyện',
    'Contacts': 'Danh bạ',
    'Me': 'Tôi',
    'Favorites': 'Yêu thích',
    'Chat Theme': 'Chủ đề',
    'App Language': 'Ngôn ngữ ứng dụng',
    'Translation Language': 'Ngôn ngữ dịch',
    'Settings': 'Cài đặt',
  },
  'Telugu': {
    'Chats': 'చాట్స్',
    'Contacts': 'పరిచయాలు',
    'Me': 'నేను',
    'Favorites': 'ఇష్టమైనవి',
    'Chat Theme': 'చాట్ థీమ్',
    'App Language': 'యాప్ భాష',
    'Translation Language': 'అనువాద భాష',
    'Settings': 'సెట్టింగ్స్',
  },
  'Nepali': {
    'Chats': 'च्याट',
    'Contacts': 'सम्पर्कहरू',
    'Me': 'म',
    'Favorites': 'मनपर्ने',
    'Chat Theme': 'च्याट विषयवस्तु',
    'App Language': 'एप भाषा',
    'Translation Language': 'अनुवाद भाषा',
    'Settings': 'सेटिङहरू',
  }
};

export function t(key: string, lang: string): string {
  if (!translations[lang]) return key;
  return translations[lang][key] || key;
}
