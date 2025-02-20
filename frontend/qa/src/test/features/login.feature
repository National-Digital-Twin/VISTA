Feature: Paralog login functionality

 Scenario: Verify all incident type are in the dropdown list
    Given I login to the ndtp app with the user credentials
    When  I click the Paralog menu
    And   I enter the auth key and click login button
    Then  I should see the asset detail tab

