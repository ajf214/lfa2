using 'main.bicep'

// gitHash=${{ env.GITHUB_SHA_SHORT }} deploymentType=prod
param gitHash = readEnvironmentVariable('GITHUB_SHA_SHORT', 'failed-to-read')
param deploymentType = 'prod'
param postgresHost = 'lfa-postgres.postgres.database.azure.com'
param backendIdentityId = readEnvironmentVariable('BACKEND_IDENTITY_ID', '')
param backendIdentityClientId = readEnvironmentVariable('BACKEND_IDENTITY_CLIENT_ID', '')
