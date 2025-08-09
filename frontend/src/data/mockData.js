// En production, utilisez une bibliothèque comme bcrypt pour hacher les mots de passe
// Pour la démo, nous utilisons un simple encodage base64 (à ne pas faire en production)
const hashPassword = (password) => {
  // Solution compatible navigateur pour l'encodage base64
  return btoa(unescape(encodeURIComponent(password)));
};

export const mockUsers = [
  {
    id: 1,
    name: "Admin Principal",
    email: "admin@clinique.com",
    password: hashPassword("admin123"),
    role: "admin",
    status: "active",
    specialite: "Administration",
    telephone: "+221 77 123 45 67"
  },
  {
    id: 2,
    name: "Dr. Marie Diop",
    email: "m.diop@clinique.com",
    password: hashPassword("medecin123"),
    role: "medecin",
    status: "active",
    specialite: "Cardiologie",
    telephone: "+221 77 234 56 78"
  },
  {
    id: 3,
    name: "Dr. Jean Ndiaye",
    email: "j.ndiaye@clinique.com",
    password: hashPassword("medecin456"),
    role: "medecin",
    status: "active",
    specialite: "Pédiatrie",
    telephone: "+221 77 345 67 89"
  },
  {
    id: 4,
    name: "Inf. Awa Fall",
    email: "a.fall@clinique.com",
    password: hashPassword("infirmier123"),
    role: "infirmier",
    status: "active",
    specialite: "Soins généraux",
    telephone: "+221 77 456 78 90"
  },
  {
    id: 5,
    name: "Inf. Ibrahima Diouf",
    email: "i.diouf@clinique.com",
    password: hashPassword("infirmier456"),
    role: "infirmier",
    status: "en_conges",
    specialite: "Urgences",
    telephone: "+221 77 567 89 01"
  }
];

export const mockPresences = [
  {
    id: 1,
    userId: 2, // Dr. Marie Diop
    date: "2025-08-01",
    heureDebut: "08:00",
    heureFin: "17:00",
    statut: "present",
    consultations: 12,
    notes: "Journée chargée, plusieurs cas urgents"
  },
  {
    id: 2,
    userId: 3, // Dr. Jean Ndiaye
    date: "2025-08-01",
    heureDebut: "09:30",
    heureFin: "18:00",
    statut: "en_retard",
    consultations: 8,
    notes: "Réunion le matin, arrivée en retard"
  },
  {
    id: 3,
    userId: 4, // Inf. Awa Fall
    date: "2025-08-01",
    heureDebut: "07:30",
    heureFin: "16:30",
    statut: "present",
    garde: "jour",
    notes: "Tournée des chambres effectuée"
  },
  {
    id: 4,
    userId: 2, // Dr. Marie Diop
    date: "2025-08-02",
    statut: "absent",
    motif: "Congé annuel",
    notes: "Congé approuvé"
  },
  {
    id: 5,
    userId: 4, // Inf. Awa Fall
    date: "2025-08-02",
    heureDebut: "19:00",
    heureFin: "07:00",
    statut: "present",
    garde: "nuit",
    notes: "Nuit calme, 2 admissions"
  }
];
