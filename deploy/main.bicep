targetScope = 'subscription'

@allowed([
  'prod'
  'dev'
])
param deploymentType string = 'dev'
param location string = deployment().location

@description('Git commit hash which is also the tag of the image to use in ACR')
param gitHash string

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
    dbPassword: kv.getSecret('db-password')
    deploymentType: deploymentType
    location: location
    gitHash: gitHash
  }
}

output frontendUrl string = stack.outputs.frontendUrl
