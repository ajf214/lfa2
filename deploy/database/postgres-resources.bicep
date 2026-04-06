param location string
param baseName string

@secure()
param administratorLogin string

@secure()
param administratorPassword string

// User-assigned managed identity — created here so it exists before the app deploy.
// The Container App will be assigned this identity, and we grant it DB access separately.
resource backendIdentity 'Microsoft.ManagedIdentity/userAssignedIdentities@2024-11-30' = {
  name: '${baseName}-backend-identity'
  location: location
}

resource postgresServer 'Microsoft.DBforPostgreSQL/flexibleServers@2025-08-01' = {
  name: '${baseName}-postgres'
  location: location
  sku: {
    name: 'Standard_B1ms'
    tier: 'Burstable'
  }
  properties: {
    version: '16'
    administratorLogin: administratorLogin
    administratorLoginPassword: administratorPassword
    storage: {
      storageSizeGB: 32
    }
    authConfig: {
      activeDirectoryAuth: 'Enabled'
      passwordAuth: 'Enabled'
    }
    highAvailability: {
      mode: 'Disabled'
    }
  }
}

resource lfaDb 'Microsoft.DBforPostgreSQL/flexibleServers/databases@2025-08-01' = {
  parent: postgresServer
  name: 'lfa'
}

resource lfaDevDb 'Microsoft.DBforPostgreSQL/flexibleServers/databases@2025-08-01' = {
  parent: postgresServer
  name: 'lfa_dev'
}

resource allowAzureServices 'Microsoft.DBforPostgreSQL/flexibleServers/firewallRules@2025-08-01' = {
  parent: postgresServer
  name: 'AllowAzureServices'
  properties: {
    startIpAddress: '0.0.0.0'
    endIpAddress: '0.0.0.0'
  }
}

output postgresHost string = postgresServer.properties.fullyQualifiedDomainName
output backendIdentityId string = backendIdentity.id
output backendIdentityClientId string = backendIdentity.properties.clientId
output backendIdentityName string = backendIdentity.name
