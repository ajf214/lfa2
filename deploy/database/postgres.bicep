targetScope = 'subscription'

param location string = deployment().location
param baseName string = 'lfa'

@secure()
param administratorLogin string

@secure()
param administratorPassword string

resource rg 'Microsoft.Resources/resourceGroups@2024-03-01' = {
  name: 'lfa2-data'
  location: location
}

module postgres 'postgres-resources.bicep' = {
  scope: rg
  params: {
    location: location
    baseName: baseName
    administratorLogin: administratorLogin
    administratorPassword: administratorPassword
  }
}

output postgresHost string = postgres.outputs.postgresHost
output backendIdentityId string = postgres.outputs.backendIdentityId
output backendIdentityClientId string = postgres.outputs.backendIdentityClientId
output backendIdentityName string = postgres.outputs.backendIdentityName
