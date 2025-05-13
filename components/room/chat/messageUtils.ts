/**
 * Utilitaires pour la gestion des messages dans le chat
 */

/**
 * Formatte une date en heure:minutes (HH:MM)
 * @param date - Date à formater
 * @returns Chaîne formatée (ex: "14:30")
 */
export const formatDateTime = (date: Date): string => {
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};

/**
 * Formatte une date en français (ex: "Lundi 12 mars 2023")
 * @param date - Date à formater
 * @returns Chaîne formatée
 */
export const formatDate = (date: Date): string => {
  return date.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
};

/**
 * Fait défiler la vue jusqu'à un message spécifique avec un effet de surbrillance
 * @param messageId - ID du message à cibler
 * @param highlightClass - Classes CSS optionnelles pour la surbrillance
 * @param highlightDuration - Durée de la surbrillance en ms (défaut: 2000ms)
 */
export const scrollToMessage = (
  messageId: string,
  highlightClass: string = 'bg-blue-100 dark:bg-blue-900',
  highlightDuration: number = 2000
): void => {
  const element = document.getElementById(`message-${messageId}`);
  if (!element) return;

  element.scrollIntoView({ 
    behavior: 'smooth', 
    block: 'center' 
  });

  // Gestion de la surbrillance
  const classes = highlightClass.split(' ');
  element.classList.add(...classes);
  
  setTimeout(() => {
    element.classList.remove(...classes);
  }, highlightDuration);
};

/**
 * Tronque un texte si nécessaire et ajoute des points de suspension
 * @param text - Texte à tronquer
 * @param maxLength - Longueur maximale avant troncation
 * @returns Texte tronqué si nécessaire
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
};

/**
 * Vérifie si deux dates sont le même jour
 * @param date1 - Première date
 * @param date2 - Deuxième date
 * @returns true si les dates sont le même jour
 */
export const isSameDay = (date1: Date, date2: Date): boolean => {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
};

/**
 * Génère un identifiant unique simple
 * @returns ID aléatoire
 */
export const generateSimpleId = (): string => {
  return Math.random().toString(36).substring(2, 9);
};

/**
 * Formate la durée depuis l'envoi du message (ex: "à l'instant", "il y a 5 min")
 * @param timestamp - Date du message
 * @returns Chaîne formatée
 */
export const formatMessageTimeAgo = (timestamp: Date): string => {
  const now = new Date();
  const seconds = Math.floor((now.getTime() - timestamp.getTime()) / 1000);
  
  if (seconds < 60) return "à l'instant";
  if (seconds < 3600) return `il y a ${Math.floor(seconds / 60)} min`;
  if (seconds < 86400) return `il y a ${Math.floor(seconds / 3600)} h`;
  
  return formatDate(timestamp);
};

/**
 * Vérifie si un message doit être affiché avec un séparateur de date
 * @param currentMessage - Message actuel
 * @param previousMessage - Message précédent
 * @returns true si un séparateur de date est nécessaire
 */
export const shouldShowDateSeparator = (
  currentMessage: { timestamp: Date },
  previousMessage?: { timestamp: Date }
): boolean => {
  if (!previousMessage) return true;
  return !isSameDay(currentMessage.timestamp, previousMessage.timestamp);
};