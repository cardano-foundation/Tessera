/** The sticky bar: nav, network chip, settings and wallet menus. */

const header = {
  // Primary navigation.
  navExplore: "Explore",
  navCreate: "Create",

  // Network chip and its menu (one network per deployment; links open the
  // other deployments).
  /** {network} is the active network's name, shown on the chip. */
  networkChip: "Network: {network}",
  network: "Network",
  networkNote: "Each network is its own app.",

  // Settings menu.
  settings: "Settings",
  theme: "Theme",
  themeSystem: "System",
  themeLight: "Light",
  themeDark: "Dark",
  language: "Language",
  allSettings: "All settings",

  // Connect / identity button.
  connecting: "Connecting…",
  connectWallet: "Connect wallet",
  connect: "Connect",
  noRole: "No role",

  // Wallet picker.
  connectCip30: "Connect a CIP-30 wallet",
  noWalletDetected: "No CIP-30 wallet detected in this browser.",

  // Role menu.
  respondAs: "Respond as",
  noClaimableRole:
    "This wallet holds no claimable role: responding in the browser needs a key-based credential, and this wallet's are script-based.",
  /** {network} is the app's expected network identifier. */
  networkMismatch:
    "Wallet is on a different network than the app ({network}). Switch networks in your wallet.",
  disconnect: "Disconnect",
};

export type Messages = typeof header;
export default header;
