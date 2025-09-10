param containerRegistryName string
param principalId string
param roleId string

resource containerRegistry 'Microsoft.ContainerRegistry/registries@2021-09-01' existing = {
  name: containerRegistryName
}

resource roleAssignment 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(containerRegistry.id, principalId, 'AcrPullUserAssigned')
  scope: containerRegistry
  properties: {
    principalId: principalId
    principalType: 'ServicePrincipal'
    roleDefinitionId: resourceId('Microsoft.Authorization/roleDefinitions', roleId)
  }
}

/*resource roleAssignment 'Microsoft.Authorization/roleAssignments@2020-04-01-preview' = {
  scope: resourceGroup()
  name: guid(resourceGroup().id, principalId, 'acdd72a7-3385-48ef-bd42-f606fba81ae7') // Contributor role
  properties: {    
    principalId: principalId
    principalType: 'ServicePrincipal'
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', 'acdd72a7-3385-48ef-bd42-f606fba81ae7')
  }
}*/

