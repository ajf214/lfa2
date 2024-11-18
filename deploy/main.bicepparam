using 'main.bicep'

// gitHash=${{ env.GITHUB_SHA_SHORT }} deploymentType=prod
param gitHash = readEnvironmentVariable('GITHUB_SHA_SHORT', 'failed-to-read')
param deploymentType = 'prod'
