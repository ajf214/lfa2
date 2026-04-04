# Plan: Migrate PostgreSQL to Private Networking

## Background

The `AllowAzureServices` firewall rule in `deploy/postgres-resources.bicep` uses the special `0.0.0.0 → 0.0.0.0` range, which allows **any Azure service across any tenant/subscription** to reach the PostgreSQL server over its public endpoint. This is a known security concern — it's not scoped to our resources.

### Current Architecture

- **PostgreSQL Flexible Server** lives in the `lfa2-data` resource group
- **Container Apps** (frontend + backend) live in the `lfa-container-apps` resource group, inside a `Microsoft.App/managedEnvironments` managed environment
- The backend Container App connects to Postgres over the **public endpoint**, permitted by the `AllowAzureServices` firewall rule
- The two resource groups are deployed by separate Bicep files (`postgres.bicep` / `main.bicep`)

## Approach: VNet Integration with Private Endpoint

Container Apps Managed Environments support VNet integration. We'll place the environment in a VNet, create a private endpoint for Postgres in the same VNet, and remove the public firewall rule.

## Steps

### 1. Create a VNet and Subnets

Add a new VNet (e.g. `lfa-vnet`) with at least two subnets:

| Subnet | Purpose | Min Size | Notes |
|---|---|---|---|
| `container-apps-subnet` | Delegated to Container Apps environment | `/23` (required by ACA) | Delegation: `Microsoft.App/environments` |
| `postgres-subnet` | Private endpoint for PostgreSQL | `/28` | No delegation needed |

This could go in a shared `networking.bicep` module, or in `resources.bicep`.

### 2. Wire the Container Apps Environment into the VNet

Update the `Microsoft.App/managedEnvironments` resource in `resources.bicep` to add:

```bicep
properties: {
  vnetConfiguration: {
    infrastructureSubnetId: containerAppsSubnet.id
    internal: false  // keep external ingress working for the frontend
  }
  // ...existing appLogsConfiguration
}
```

Setting `internal: false` means the environment still gets a public IP for ingress (needed for the frontend custom domain), but outbound traffic from the containers will route through the VNet.

### 3. Create a Private Endpoint for PostgreSQL

Add a private endpoint resource in the data resource group (or a shared networking module):

```bicep
resource postgresPrivateEndpoint 'Microsoft.Network/privateEndpoints@2024-05-01' = {
  name: '${baseName}-postgres-pe'
  location: location
  properties: {
    subnet: {
      id: postgresSubnet.id
    }
    privateLinkServiceConnections: [
      {
        name: '${baseName}-postgres-plsc'
        properties: {
          privateLinkServiceId: postgresServer.id
          groupIds: ['postgresqlServer']
        }
      }
    ]
  }
}
```

### 4. Create a Private DNS Zone

For private endpoint resolution to work, we need a private DNS zone linked to the VNet:

```bicep
resource privateDnsZone 'Microsoft.Network/privateDnsZones@2024-06-01' = {
  name: 'privatelink.postgres.database.azure.com'
  location: 'global'
}

resource dnsZoneLink 'Microsoft.Network/privateDnsZones/virtualNetworkLinks@2024-06-01' = {
  parent: privateDnsZone
  name: '${baseName}-vnet-link'
  location: 'global'
  properties: {
    virtualNetwork: { id: vnet.id }
    registrationEnabled: false
  }
}

resource dnsZoneGroup 'Microsoft.Network/privateEndpoints/privateDnsZoneGroups@2024-05-01' = {
  parent: postgresPrivateEndpoint
  name: 'default'
  properties: {
    privateDnsZoneConfigs: [
      {
        name: 'postgres'
        properties: {
          privateDnsZoneId: privateDnsZone.id
        }
      }
    ]
  }
}
```

This ensures `lfa-postgres.postgres.database.azure.com` resolves to the private IP inside the VNet.

### 5. Remove the `AllowAzureServices` Firewall Rule

Delete the `allowAzureServices` resource from `postgres-resources.bicep`. Optionally also disable public network access entirely:

```bicep
properties: {
  network: {
    publicNetworkAccess: 'Disabled'
  }
}
```

### 6. Update Backend Connection String (if needed)

The backend Container App should continue to use the same `postgresServer.properties.fullyQualifiedDomainName` hostname — private DNS will resolve it to the private IP. No application code changes should be needed.

### 7. VNet Peering (if different VNets)

Since the Postgres and Container Apps live in **different resource groups**, we need to confirm they can share a VNet. Options:
- **Preferred:** Create the VNet in a shared resource group (or the `lfa-container-apps` RG) and reference the subnets cross-resource-group in the Postgres deployment.
- **Alternative:** Create separate VNets and peer them — adds complexity, not recommended for this scale.

## Cross-Cutting Concerns

- **Resource group boundary:** The VNet must be accessible from both the `lfa-container-apps` and `lfa2-data` resource group deployments. The cleanest approach is to place the VNet in one RG and pass subnet resource IDs as parameters to the other.
- **Custom domain / TLS:** Setting `internal: false` on the managed environment preserves the current public ingress + custom domain setup for the frontend. No changes needed there.
- **Cost:** Private endpoints have a small hourly cost (~$0.01/hr ≈ $7.30/mo). VNet integration for Container Apps managed environments is free.
- **Deployment ordering:** The VNet and subnets must exist before both the managed environment and the private endpoint. May need to restructure the deployment to run networking first.

## File Changes Summary

| File | Changes |
|---|---|
| New: `deploy/networking.bicep` | VNet, subnets, private endpoint, private DNS zone |
| `deploy/postgres-resources.bicep` | Remove `allowAzureServices` firewall rule; add `publicNetworkAccess: 'Disabled'`; accept subnet ID param for private endpoint (or move PE to networking module) |
| `deploy/resources.bicep` | Add `vnetConfiguration` to managed environment; accept subnet ID param |
| `deploy/main.bicep` | Orchestrate networking module deployment; pass subnet IDs to stack |
| `deploy/postgres.bicep` | Pass subnet ID param through to postgres-resources |

## Rollback Plan

If something goes wrong:
1. Re-add the `AllowAzureServices` firewall rule
2. Re-enable `publicNetworkAccess: 'Enabled'` on the Postgres server
3. Remove `vnetConfiguration` from the managed environment

The application code doesn't change, so rollback is purely infrastructure.
