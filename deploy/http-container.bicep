param containerAppName string
param location string = resourceGroup().location
param environmentId string
param containerImage string
param containerPort int
param isExternalIngress bool
param containerRegistry string
param containerRegistryUsername string
param env array = []
param minReplicas int = 0

@secure()
param containerRegistryPassword string

// TODO -- remove once the other is working
// resource containerApp 'Microsoft.Web/containerApps@2021-03-01' = {
//   name: containerAppName
//   kind: 'containerapp'
//   location: location
//   properties: {
//     kubeEnvironmentId: environmentId
//     configuration: {
//       secrets: [
//         {
//           name: registrySecretRefName
//           value: containerRegistryPassword
//         }
//       ]
//       registries: [
//         {
//           server: containerRegistry
//           username: containerRegistryUsername
//           passwordSecretRef: registrySecretRefName
//         }
//       ]
//       ingress: {
//         external: isExternalIngress
//         targetPort: containerPort
//         transport: 'auto'
//       }
//     }
//     template: {
//       containers: [
//         {
//           image: containerImage
//           name: containerAppName
//           env: env
//         }
//       ]
//       scale: {
//         minReplicas: minReplicas
//       }
//     }
//   }
// }

resource containerApp2 'Microsoft.App/containerApps@2022-03-01' = {
  name: containerAppName
  location: location
  properties: {
    managedEnvironmentId: environmentId
    configuration: {
      ingress: {
        external: isExternalIngress
        targetPort: containerPort
        allowInsecure: false
      }
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
          // resources: {
          //   cpu: '0.5'
          //   memory: '1Gi'
          // }
        }
      ]
      scale: {
        minReplicas: minReplicas
        maxReplicas: 10
      }
    }
  }
}

output fqdn string = containerApp2.properties.configuration.ingress.fqdn
