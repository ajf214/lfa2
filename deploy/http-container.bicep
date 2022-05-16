param containerAppName string
param location string = resourceGroup().location
param environmentId string
param containerImage string
param containerPort int
param isExternalIngress bool

@description('Note: must be full container registry url, not short url')
param containerRegistry string

param containerRegistryUsername string
param env array = []
param minReplicas int = 0

@secure()
param containerRegistryPassword string

param useCustomDomain bool = false
param certId string = ''
param customDomain string = ''

resource containerApp 'Microsoft.App/containerApps@2022-03-01' = {
  name: containerAppName
  location: location
  properties: {
    managedEnvironmentId: environmentId
    configuration: {
      ingress: union({ // using stupid union() workaround to set optional property "customDomains", see #387
        external: isExternalIngress
        targetPort: containerPort
        allowInsecure: true
      }, useCustomDomain ? {
        customDomains: [
          {
            certificateId: certId
            bindingType: 'SniEnabled' // todo - no clue what this means...
            name: customDomain
          }
        ]
      } : {})
      registries: [
        {
          server: containerRegistry
          username: containerRegistryUsername
          passwordSecretRef: 'acr-password'
        }
      ]
      secrets: [
        {
          name: 'acr-password'
          value: containerRegistryPassword
        }
      ]
    }
    template: {
      containers: [
        {
          name: containerAppName
          image: containerImage
          env: env
          // todo -- might want to tweak 'resources' property
        }
      ]
      scale: {
        minReplicas: minReplicas
        maxReplicas: 10
      }
    }
  }
}

output fqdn string = containerApp.properties.configuration.ingress.fqdn
