@description('The location used for all deployed resources')
param location string = resourceGroup().location

@description('Tags that will be applied to all resources')
param tags object = {}


param frontendExists bool

@description('Id of the user or app to assign application roles')
param principalId string

@description('Principal type of user or app')
param principalType string

param containerRegistryName string

var abbrs = loadJsonContent('./abbreviations.json')
var resourceToken = uniqueString(subscription().id, resourceGroup().id, location)

// Monitor application with Azure Monitor
module monitoring 'br/public:avm/ptn/azd/monitoring:0.1.0' = {
  name: 'monitoring'
  params: {
    logAnalyticsName: '${abbrs.operationalInsightsWorkspaces}${resourceToken}'
    applicationInsightsName: '${abbrs.insightsComponents}${resourceToken}'
    applicationInsightsDashboardName: '${abbrs.portalDashboards}${resourceToken}'
    location: location
    tags: tags
  }
}
// Container registry
resource containerRegistry 'Microsoft.ContainerRegistry/registries@2021-09-01' existing = {
  name: containerRegistryName
}

/*module containerRegistry 'br/public:avm/res/container-registry/registry:0.1.1' = {
  name: 'registry'
  params: {
    name: '${abbrs.containerRegistryRegistries}${resourceToken}'
    location: location
    tags: tags
    publicNetworkAccess: 'Enabled'
    roleAssignments:[
      {
        principalId: frontendIdentity.outputs.principalId
        principalType: 'ServicePrincipal'
        roleDefinitionIdOrName: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', '7f951dda-4ed3-4680-a7ca-43fe172d538d')
      }
    ]
  }
}*/

// Container apps environment
module containerAppsEnvironment 'br/public:avm/res/app/managed-environment:0.4.5' = {
  name: 'container-apps-environment'
  params: {
    logAnalyticsWorkspaceResourceId: monitoring.outputs.logAnalyticsWorkspaceResourceId
    name: '${abbrs.appManagedEnvironments}${resourceToken}'
    location: location
    zoneRedundant: false
  }
}

module frontendIdentity 'br/public:avm/res/managed-identity/user-assigned-identity:0.2.1' = {
  name: 'frontendidentity'
  params: {
    name: '${abbrs.managedIdentityUserAssignedIdentities}frontend-${resourceToken}'
    location: location
  }
}

// acrPullDefinitionId is AcrPull: https://learn.microsoft.com/en-us/azure/role-based-access-control/built-in-roles#acrpull
var acrPullDefinitionId = '7f951dda-4ed3-4680-a7ca-43fe172d538d'

module roleAssignment './modules/roleassignment.bicep' = {
  name: '${abbrs.roleAssignment}${resourceToken}' 
  params: {
    principalId: frontendIdentity.outputs.principalId
    containerRegistryName: containerRegistryName
    roleId: acrPullDefinitionId
  }
}

module frontendFetchLatestImage './modules/fetch-container-image.bicep' = {
  name: 'frontend-fetch-image'
  params: {
    exists: frontendExists
    name: 'frontend'
  }
}

module frontend 'br/public:avm/res/app/container-app:0.8.0' = {
  name: 'frontend'
  params: {
    name: 'frontend'
    ingressTargetPort: 80
    scaleMinReplicas: 1
    scaleMaxReplicas: 10
    secrets: {
      secureList:  [
      ]
    }
    containers: [
      {
        image: frontendFetchLatestImage.outputs.?containers[?0].?image ?? 'mcr.microsoft.com/azuredocs/containerapps-helloworld:latest'
        name: 'main'
        resources: {
          cpu: json('0.5')
          memory: '1.0Gi'
        }
        env: [
          {
            name: 'APPLICATIONINSIGHTS_CONNECTION_STRING'
            value: monitoring.outputs.applicationInsightsConnectionString
          }
          {
            name: 'AZURE_CLIENT_ID'
            value: frontendIdentity.outputs.clientId
          }
          {
            name: 'PORT'
            value: '80'
          }
        ]
      }
    ]
    managedIdentities:{
      systemAssigned: false
      userAssignedResourceIds: [frontendIdentity.outputs.resourceId]
    }
    registries:[
      {
        server: containerRegistry.properties.loginServer
        identity: frontendIdentity.outputs.resourceId
      }
    ]
    environmentResourceId: containerAppsEnvironment.outputs.resourceId
    location: location
    tags: union(tags, { 'azd-service-name': 'frontend' })
  }
}
output AZURE_CONTAINER_REGISTRY_ENDPOINT string = containerRegistry.properties.loginServer
output AZURE_RESOURCE_FRONTEND_ID string = frontend.outputs.resourceId
