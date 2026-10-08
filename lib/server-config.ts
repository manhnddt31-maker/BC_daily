type ServerConfig = {
  spreadsheetId: string;
  serviceAccountEmail: string;
  serviceAccountPrivateKey: string;
};

function requireEnvironmentValue(name: keyof NodeJS.ProcessEnv): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Missing required server configuration: ${name}`);
  }

  return value;
}

export function getServerConfig(): ServerConfig {
  return {
    spreadsheetId: requireEnvironmentValue("GOOGLE_SHEETS_ID"),
    serviceAccountEmail: requireEnvironmentValue("GOOGLE_SERVICE_ACCOUNT_EMAIL"),
    serviceAccountPrivateKey: requireEnvironmentValue(
      "GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY"
    ).replace(/\\n/g, "\n")
  };
}
