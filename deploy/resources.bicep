param baseName string = 'lfa'
param location string = resourceGroup().location
param logAnalyticsWorkspaceName string = 'lfa-logs'

@description('Git commit hash which is also the tag of the image to use in ACR')
param gitHash string

@allowed([
  'prod'
  'dev'
])
param deploymentType string = 'dev'

@secure()
param dbPassword string

@secure()
param cloudinaryKey string


// todo - not being used...
resource acr 'Microsoft.ContainerRegistry/registries@2021-06-01-preview' existing = {
  scope: resourceGroup('bicep-modules')
  name: 'adotfrankpublic'
}

// TODO: Do I *need* a log analytics workspace?!?
resource logAnalyticsWorkspace 'Microsoft.OperationalInsights/workspaces@2020-03-01-preview' = {
  name: logAnalyticsWorkspaceName
  location: location
  properties: any({
    retentionInDays: 30
    features: {
      searchVersion: 1
    }
    sku: {
      name: 'PerGB2018'
    }
  })
}

// this will be the target of the individual container apps
// shared networking
resource environment 'Microsoft.Web/kubeEnvironments@2021-02-01' = {
  name: '${baseName}-environment-deploy'
  location: location
  properties: {
    #disable-next-line BCP037
    type: 'managed' // create an AKS cluster? -- todo: confirm this
    internalLoadBalancerEnabled: false
    appLogsConfiguration: {
      destination: 'log-analytics'
      logAnalyticsConfiguration: {
        customerId: logAnalyticsWorkspace.properties.customerId
        sharedKey: logAnalyticsWorkspace.listKeys().primarySharedKey
      }
    }
  }
}

module frontend 'http-container.bicep' = {
  name: '${baseName}-frontend-deploy'
  params: {
    containerAppName: '${baseName}-frontend'
    containerImage: '${acr.properties.loginServer}/lfa/lfa-front:${gitHash}' // needs to be full URI
    containerPort: 80
    containerRegistry: acr.properties.loginServer // full url, not just the resource name
    containerRegistryPassword: acr.listCredentials().username
    containerRegistryUsername: acr.listCredentials().passwords[0].value
    environmentId: environment.id
    isExternalIngress: true
    env: [
      {
        name: 'VUE_APP_BASE_URL'
        value: 'https://${backend.outputs.fqdn}'
      }
    ]
    location: location
    minReplicas: 1
  }
}

module backend 'http-container.bicep' = {
  name: '${baseName}-backend-deploy'
  params: {
    location: location
    containerAppName: '${baseName}-backend'
    containerImage: '${acr.properties.loginServer}/lfa/lfa-back:${gitHash}'
    containerPort: 3000
    containerRegistry: acr.properties.loginServer // NOTE: must be full URL, add @description
    containerRegistryPassword: acr.listCredentials().username
    containerRegistryUsername: acr.listCredentials().passwords[0].value
    environmentId: environment.id
    isExternalIngress: true
    minReplicas: 1
    env: [
      {
        name: 'DB_USERNAME'
        value: 'sonofdiesel'
      }
      {
        name: 'DB_PASSWORD'
        value: dbPassword
      }
      {
        name: 'CLOUDINARY_API_SECRET'
        value: cloudinaryKey
      }
      {
        name: 'DB'
        value: deploymentType == 'prod' ? 'LFA' : 'LFA-DEV'
      }
      {
        name: 'IMAGE_FOLDER'
        value: deploymentType == 'prod' ? 'lfa-items' : 'lfa-items-test'
      }
      {
        name: 'GSUITE_CLIENT_ID'
        value: '1092000076053-gskfckaqihntrefibkmlce55n7dvul2b'
      }
    ]
  }
}

output frontendUrl string = frontend.outputs.fqdn

