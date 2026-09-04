import { Deity, DeityBooking, PrayerHosting, User } from '../types';

export const INITIAL_DEITIES: Deity[] = [
  {
    id: 'ganesha',
    name: 'Ganesha',
    title: 'Remover of Obstacles & Lord of Wisdom',
    description: 'Vighnaharta Vigraha. Brings auspicious beginnings, peace, and prosperity to the family.',
    icon: '🛕',
    status: 'active',
    guidelines: 'Perform daily morning aarti with pure lamp (diya). Offer fresh flowers and modak or fruit.'
  },
  {
    id: 'krishna',
    name: 'Krishna',
    title: 'Lord of Divine Love, Joy & Compassion',
    description: 'Bala Krishna / Laddu Gopal Vigraha with peacock feather crown and sacred flute.',
    icon: '🪈',
    status: 'active',
    guidelines: 'Clean altar, offer fresh tulsi leaves and makhan/butter or milk sweets during evening prayer.'
  },
  {
    id: 'meru',
    name: 'Meru',
    title: 'Sri Chakra Maha Meru',
    description: 'Sacred 3D geometric manifestation of Cosmic Energy and Divine Mother Lalitha Tripurasundari.',
    icon: '🕉️',
    status: 'active',
    guidelines: 'Keep in pristine sanctity. Kumkum archana recommended during auspicious Fridays.'
  },
  {
    id: 'devi',
    name: 'Devi',
    title: 'Divine Mother Durga & Sri Lakshmi',
    description: 'Embodiment of universal maternal grace, abundance, inner strength, and protection.',
    icon: '🌺',
    status: 'active',
    guidelines: 'Light ghee lamp morning and evening. Offer red hibiscus or jasmine garlands.'
  },
  {
    id: 'shiva',
    name: 'Shiva',
    title: 'Mahadeva - Auspiciousness & Peace',
    description: 'Sacred Shiva Lingam with Nandi. Brings tranquil meditation, health, and spiritual upliftment.',
    icon: '🔱',
    status: 'active',
    guidelines: 'Jala / Ganga jal abhishekam with vilva (bael) leaves and vibhuti offerings.'
  },
  {
    id: 'muruga',
    name: 'Muruga',
    title: 'Lord of Courage, Wisdom & Righteousness',
    description: 'Sri Karthikeya with the sacred Vel spear. Bestows confidence, clarity, and protection.',
    icon: '✨',
    status: 'active',
    guidelines: 'Offer fresh panchamritham or honey with fragrant blossoms and recite Skanda Sashti.'
  }
];

export const INITIAL_USERS: User[] = [
  {
    id: 'usr_admin',
    mobilePhone: '9876543210',
    fullName: 'Temple Priest & Secretary',
    email: 'admin@templecommunity.org',
    role: 'admin',
    status: 'approved',
    address: 'Temple Community Office, Main Sanctum',
    createdAt: '2026-01-01'
  },
  {
    id: 'usr_ananth',
    mobilePhone: '9876543211',
    fullName: 'Ananth Sharma',
    email: 'ananth@example.com',
    role: 'user',
    status: 'approved',
    address: '42 Lotus Garden, North Gate',
    createdAt: '2026-02-10'
  },
  {
    id: 'usr_kumar',
    mobilePhone: '9876543212',
    fullName: 'Kumar Raman',
    email: 'kumar@example.com',
    role: 'user',
    status: 'approved',
    address: '18 Anand Vihar, East Block',
    createdAt: '2026-03-15'
  },
  {
    id: 'usr_raj',
    mobilePhone: '9876543214',
    fullName: 'Raj Sundaram',
    email: 'raj@example.com',
    role: 'user',
    status: 'approved',
    address: '77 Shanti Nagar, West Wing',
    createdAt: '2026-04-20'
  },
  {
    id: 'usr_priya',
    mobilePhone: '9876543213',
    fullName: 'Priya Patel',
    email: 'priya@example.com',
    role: 'user',
    status: 'pending', // Validated by admin against supabase
    address: '12 Divine Crest Apartments',
    createdAt: '2026-09-02'
  }
];

export const INITIAL_BOOKINGS: DeityBooking[] = [
  {
    id: 'bk_ganesha_sep6',
    deityId: 'ganesha',
    deityName: 'Ganesha',
    startDate: '2026-09-06',
    endDate: '2026-09-13',
    userId: 'usr_ananth',
    userName: 'Ananth Sharma',
    userPhone: '9876543211',
    collectionTime: 'Sunday after prayers (12:30 PM)',
    status: 'confirmed',
    notes: 'Family Ganesh Chaturthi special prayer week',
    createdAt: '2026-08-15'
  },
  {
    id: 'bk_shiva_sep13',
    deityId: 'shiva',
    deityName: 'Shiva',
    startDate: '2026-09-13',
    endDate: '2026-09-20',
    userId: 'usr_raj',
    userName: 'Raj Sundaram',
    userPhone: '9876543214',
    collectionTime: 'Sunday after prayers (12:30 PM)',
    status: 'confirmed',
    notes: 'Maha Rudra abhishekam pooja week at home',
    createdAt: '2026-08-20'
  },
  {
    id: 'bk_meru_sep13',
    deityId: 'meru',
    deityName: 'Meru',
    startDate: '2026-09-13',
    endDate: '2026-09-20',
    userId: 'usr_kumar',
    userName: 'Kumar Raman',
    userPhone: '9876543212',
    collectionTime: 'Sunday after prayers (12:30 PM)',
    status: 'confirmed',
    notes: 'Navaratri preparation archana',
    createdAt: '2026-08-22'
  },
  {
    id: 'bk_krishna_sep13',
    deityId: 'krishna',
    deityName: 'Krishna',
    startDate: '2026-09-13',
    endDate: '2026-09-20',
    userId: 'usr_ananth',
    userName: 'Ananth Sharma',
    userPhone: '9876543211',
    collectionTime: 'Sunday after prayers (12:30 PM)',
    status: 'confirmed',
    notes: 'Janmashtami celebration week with children',
    createdAt: '2026-08-25'
  }
];

export const INITIAL_PRAYER_HOSTINGS: PrayerHosting[] = [
  {
    id: 'ph_2026_09_06',
    date: '2026-09-06',
    userId: 'usr_ananth',
    userName: 'Ananth Sharma',
    userPhone: '9876543211',
    status: 'confirmed',
    notes: 'Sweet Pongal & Sundal prasadam will be arranged for 60 devotees.',
    createdAt: '2026-08-10'
  },
  {
    id: 'ph_2026_09_13',
    date: '2026-09-13',
    userId: null,
    userName: null,
    userPhone: null,
    status: 'available',
    notes: '',
    createdAt: ''
  },
  {
    id: 'ph_2026_09_20',
    date: '2026-09-20',
    userId: 'usr_kumar',
    userName: 'Kumar Raman',
    userPhone: '9876543212',
    status: 'confirmed',
    notes: 'Puliyodharai and Kesari prasadam seva.',
    createdAt: '2026-08-18'
  },
  {
    id: 'ph_2026_09_27',
    date: '2026-09-27',
    userId: null,
    userName: null,
    userPhone: null,
    status: 'available',
    notes: '',
    createdAt: ''
  },
  {
    id: 'ph_2026_10_04',
    date: '2026-10-04',
    userId: 'usr_raj',
    userName: 'Raj Sundaram',
    userPhone: '9876543214',
    status: 'confirmed',
    notes: 'Navaratri special prasad hosting.',
    createdAt: '2026-08-28'
  },
  {
    id: 'ph_2026_10_11',
    date: '2026-10-11',
    userId: null,
    userName: null,
    userPhone: null,
    status: 'available',
    notes: '',
    createdAt: ''
  }
];
