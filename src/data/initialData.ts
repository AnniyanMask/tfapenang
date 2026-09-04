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

export const INITIAL_USERS: User[] = [];

export const INITIAL_BOOKINGS: DeityBooking[] = [];

export const INITIAL_PRAYER_HOSTINGS: PrayerHosting[] = [];

