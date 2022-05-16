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

param customDomain bool = false

resource containerApp 'Microsoft.App/containerApps@2022-03-01' = {
  name: containerAppName
  location: location
  properties: {
    managedEnvironmentId: environmentId
    configuration: {
      ingress: union({
        external: isExternalIngress
        targetPort: containerPort
        allowInsecure: true
      }, customDomain ? {
        customDomains: [
          {
            // todo - replace certId w/ real reference
            certificateId: '/subscriptions/d56e652e-758d-480a-8f0d-47f230264b4c/resourceGroups/lfa-container-apps/providers/Microsoft.App/managedEnvironments/lfa-environment-deploy-03/certificates/paoiwefjpaowehopahweoigjawoegjaowe'
            bindingType: 'SniEnabled'
            name: 'lawrencefarmsantiques.com'
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
