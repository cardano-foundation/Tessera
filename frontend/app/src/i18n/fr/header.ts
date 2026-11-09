import type { Messages } from "../en/header";

const header: Messages = {
  // Primary navigation.
  navExplore: "Explorer",
  navCreate: "Créer",

  // Network chip and its menu.
  networkChip: "Réseau : {network}",
  network: "Réseau",
  networkNote: "Chaque réseau est une application distincte.",

  // Settings menu.
  settings: "Paramètres",
  theme: "Thème",
  themeSystem: "Système",
  themeLight: "Clair",
  themeDark: "Sombre",
  language: "Langue",
  allSettings: "Tous les paramètres",

  // Connect / identity button.
  connecting: "Connexion…",
  connectWallet: "Connecter un portefeuille",
  connect: "Connecter",
  noRole: "Aucun rôle",

  // Wallet picker.
  connectCip30: "Connecter un portefeuille CIP-30",
  noWalletDetected: "Aucun portefeuille CIP-30 détecté dans ce navigateur.",

  // Role menu.
  respondAs: "Répondre en tant que",
  noClaimableRole:
    "Ce portefeuille ne détient aucun rôle revendicable : répondre depuis le navigateur exige un identifiant à clé, et ceux de ce portefeuille sont à script.",
  networkMismatch:
    "Le portefeuille est sur un réseau différent de celui de l'application ({network}). Changez de réseau dans votre portefeuille.",
  disconnect: "Déconnecter",
};

export default header;
