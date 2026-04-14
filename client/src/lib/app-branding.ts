import pkg from "../../../package.json";

/**
 * Produktname in der UI. Für Forks/Distributionen hier anpassen.
 * Die Versionsnummer kommt weiterhin aus package.json (Build/Release).
 */
export const APP_DISPLAY_NAME = "Questarr More";

export const APP_VERSION = pkg.version;

/** Link für Sidebar-GitHub-Icon (bei eigenem Fork URL hier oder in package.json repository setzen). */
export const APP_GITHUB_URL = "https://github.com/Doezer/Questarr";
