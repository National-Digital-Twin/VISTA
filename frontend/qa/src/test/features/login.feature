Feature: Paralog login functionality

 Scenario: Verify all incident type are in the dropdown list
    Given I login to the ndtp app with the user credentials
    When  I click the Paralog menu
    Then  I should see the asset details tab


