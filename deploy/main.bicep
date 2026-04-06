targetScope = 'subscription'

@allowed([
  'prod'
  'dev'
])
param deploymentType string = 'dev'
param location string = deployment().location

@description('Git commit hash which is also the tag of the image to use in ACR')
param gitHash string

@description('Fully qualified domain name of the PostgreSQL server')
param postgresHost string

@description('Resource ID of the user-assigned managed identity for the backend')
param backendIdentityId string

@description('Client ID of the user-assigned managed identity (used by @azure/identity)')
param backendIdentityClientId string

resource rg 'Microsoft.Resources/resourceGroups@2021-04-01' = {
  name: 'lfa-container-apps'
  location: location
  tags: {
    owner: 'alex'
  }
}

resource kv 'Microsoft.KeyVault/vaults@2021-06-01-preview' existing = {
  scope: rg
  name: 'lfa-secrets'
}

module stack 'resources.bicep' = {
  scope: rg
  name: 'stackDeploy'
  params: {
    cloudinaryKey: kv.getSecret('cloudinary-api-key')
    deploymentType: deploymentType
    location: location
    gitHash: gitHash
    postgresHost: postgresHost
    backendIdentityId: backendIdentityId
    backendIdentityClientId: backendIdentityClientId
  }
}

output frontendUrl string = stack.outputs.frontendUrl
