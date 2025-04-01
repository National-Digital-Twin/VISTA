Feature: Turn on assets from Transport Infrastructure (Roads and Bridges)

 Scenario: Verify user is able to turn on assets from transport infrastructure
     Given I login to the ndtp app with the user credentials
     And   I click the Paralog menu
     When  I click on transport infrastructure for road and Bridges
     Then  I can turn on asset accordion
